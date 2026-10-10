import { describe, it, expect, vi } from 'vitest';
import { createClient } from '@supabase/supabase-js';
import { SupabaseMemberRepository } from '../../src/services/supabaseMemberRepository';

describe('SupabaseMemberRepository public database contract', () => {
  it('preserves creation order for Thành viên created within the same millisecond', async () => {
    const rows = [
      { id: 'z', household_code: 'BEP-123', name: 'Mẹ', created_at: '2026-10-08T00:00:00.123100+00:00' },
      { id: 'a', household_code: 'BEP-123', name: 'Bố', created_at: '2026-10-08T00:00:00.123900+00:00' },
    ];
    const client = createClient('https://database.example', 'test-key', {
      auth: { persistSession: false, storageKey: 'member-order-precision' },
      global: { fetch: async () => new Response(JSON.stringify(rows), { status: 200 }) },
    });
    const repository = new SupabaseMemberRepository(client);
    expect((await repository.getMembers('BEP-123')).map(member => member.id)).toEqual(['z', 'a']);
  });
  it('saves confirmed rows, loads in creation order, and confines deletion to Gia đình and ID', async () => {
    let rows = [
      { id: 'b', household_code: 'BEP-123', name: 'Bố', created_at: '2026-10-08T00:00:00Z' },
      { id: 'a', household_code: 'BEP-123', name: 'Mẹ', created_at: '2026-10-08T00:00:00Z' },
      { id: 'other', household_code: 'BEP-999', name: 'Mẹ', created_at: '2026-10-08T00:00:00Z' },
    ];
    const client = createClient('https://database.example', 'test-key', {
      auth: { persistSession: false },
      global: { fetch: async (input, init) => {
        const url = new URL(String(input));
        if (url.pathname !== '/rest/v1/member') return new Response('{}', { status: 404 });
        const code = url.searchParams.get('household_code')?.replace(/^eq\./, '');
        const id = url.searchParams.get('id')?.replace(/^eq\./, '');
        const matching = rows.filter(row => row.household_code === code && (!id || row.id === id));
        if (init?.method === 'POST') {
          const values = JSON.parse(String(init.body));
          const row = { ...values, id: 'server-id', created_at: '2026-10-08T01:00:00Z' };
          rows.push(row);
          return new Response(JSON.stringify(row), { status: 201 });
        }
        if (init?.method === 'DELETE') rows = rows.filter(row => !matching.includes(row));
        return new Response(JSON.stringify(matching), { status: 200 });
      } },
    });
    const repo = new SupabaseMemberRepository(client);
    expect((await repo.getMembers('  bep-123 ')).map(member => member.name)).toEqual(['Mẹ', 'Bố']);
    const added = await repo.addMember('bep-123', '  An  ');
    expect(added).toEqual({ id: 'server-id', householdCode: 'BEP-123', name: 'An', createdAt: '2026-10-08T01:00:00Z' });
    expect((await repo.getMembers('BEP-123')).map(member => member.name)).toEqual(['Mẹ', 'Bố', 'An']);
    await expect(repo.deleteMember('BEP-123', 'other')).rejects.toThrow();
    expect((await repo.getMembers('BEP-999')).map(member => member.name)).toEqual(['Mẹ']);
    await repo.deleteMember('BEP-123', 'server-id');
    expect((await repo.getMembers('BEP-123')).map(member => member.name)).toEqual(['Mẹ', 'Bố']);
  });
  it.each([
    ['23505', 'duplicate-name'], ['42501', 'unavailable'], ['23514', 'invalid-name'],
  ])('reports database error %s as %s without inventing a successful save', async (code, classification) => {
    const client = createClient('https://database.example', 'test-key', {
      auth: { persistSession: false },
      global: { fetch: async () => new Response(JSON.stringify({ code, message: 'Database refused request' }), { status: 400 }) },
    });
    const repo = new SupabaseMemberRepository(client);
    await expect(repo.addMember('BEP-123', 'Bố')).rejects.toMatchObject({ code: classification });
    await expect(repo.getMembers('BEP-123')).rejects.toMatchObject({ code: classification });
    await expect(repo.deleteMember('BEP-123', 'id')).rejects.toMatchObject({ code: classification });
    await expect(repo.addMember('BEP-123', '   ')).rejects.toMatchObject({ code: 'invalid-name' });
    await expect(repo.addMember('BEP-123', 'a'.repeat(31))).rejects.toMatchObject({ code: 'invalid-name' });
    await expect(repo.getMembers('!bad')).rejects.toMatchObject({ code: 'invalid-household' });
  });
  it('notifies on scoped inserts and primary-key-only deletions, recovers missed events, and stops after cleanup', () => {
    vi.useFakeTimers();
    try {
      type Listener = { filter: { event: string; filter?: string }; callback: () => void };
      const listeners: Listener[] = [];
      let status!: (status: string) => void;
      const channel = {
        on: (_type: string, filter: Listener['filter'], callback: () => void) => { listeners.push({ filter, callback }); return channel; },
        subscribe: (callback: (status: string) => void) => { status = callback; return channel; },
      };
      const client = { channel: () => channel, removeChannel: async () => {} };
      const changes = vi.fn();
      const repo = new SupabaseMemberRepository(client as any);
      const unsubscribe = repo.subscribe('BEP-123', changes);
      const emit = (event: string, household?: string) => listeners.forEach(listener => {
        if (listener.filter.event !== event) return;
        if (listener.filter.filter && listener.filter.filter !== `household_code=eq.${household}`) return;
        listener.callback();
      });
      status('SUBSCRIBED');
      expect(changes).toHaveBeenCalledTimes(1);
      emit('INSERT', 'BEP-999');
      expect(changes).toHaveBeenCalledTimes(1);
      emit('INSERT', 'BEP-123');
      emit('DELETE'); // Under RLS there is no household_code in the old row.
      expect(changes).toHaveBeenCalledTimes(3);
      vi.advanceTimersByTime(15000);
      expect(changes).toHaveBeenCalledTimes(4);
      unsubscribe();
      emit('DELETE'); status('SUBSCRIBED');
      window.dispatchEvent(new Event('online'));
      document.dispatchEvent(new Event('visibilitychange'));
      vi.advanceTimersByTime(30000);
      expect(changes).toHaveBeenCalledTimes(4);
    } finally { vi.useRealTimers(); }
  });

  it('maps database error P0001 or household_member_limit_reached to capacity-exceeded', async () => {
    const client = createClient('https://database.example', 'test-key', {
      auth: { persistSession: false },
      global: {
        fetch: async () => new Response(JSON.stringify({
          code: 'P0001',
          message: 'household_member_limit_reached'
        }), { status: 400 }),
      },
    });
    const repo = new SupabaseMemberRepository(client);
    await expect(repo.addMember('BEP-123', 'Thành viên 7')).rejects.toMatchObject({
      code: 'capacity-exceeded',
      message: 'Gia đình đã có tối đa 6 Thành viên.',
    });
  });

  it('simulates concurrent additions where second caller receives capacity-exceeded error when limit is 6', async () => {
    let rows = [
      { id: '1', household_code: 'BEP-123', name: 'Mẹ', created_at: '2026-10-08T00:00:00Z' },
      { id: '2', household_code: 'BEP-123', name: 'Bố', created_at: '2026-10-08T00:00:01Z' },
      { id: '3', household_code: 'BEP-123', name: 'An', created_at: '2026-10-08T00:00:02Z' },
      { id: '4', household_code: 'BEP-123', name: 'Bình', created_at: '2026-10-08T00:00:03Z' },
      { id: '5', household_code: 'BEP-123', name: 'Cúc', created_at: '2026-10-08T00:00:04Z' },
    ];
    // Simulate database advisory lock: concurrent requests are serialized
    let locked = false;
    const lockQueue: (() => void)[] = [];
    const acquireLock = async () => {
      if (locked) {
        await new Promise<void>(resolve => lockQueue.push(resolve));
      }
      locked = true;
    };
    const releaseLock = () => {
      locked = false;
      const next = lockQueue.shift();
      if (next) next();
    };

    const client = createClient('https://database.example', 'test-key', {
      auth: { persistSession: false },
      global: {
        fetch: async (input, init) => {
          const url = new URL(String(input));
          if (url.pathname !== '/rest/v1/member') return new Response('{}', { status: 404 });
          if (init?.method === 'POST') {
            await acquireLock();
            try {
              const count = rows.filter(r => r.household_code === 'BEP-123').length;
              if (count >= 6) {
                return new Response(JSON.stringify({
                  code: 'P0001',
                  message: 'household_member_limit_reached',
                }), { status: 400 });
              }
              const values = JSON.parse(String(init.body));
              const newRow = { ...values, id: `server-${Date.now()}-${Math.random()}`, created_at: new Date().toISOString() };
              rows.push(newRow);
              return new Response(JSON.stringify(newRow), { status: 201 });
            } finally {
              releaseLock();
            }
          }
          return new Response(JSON.stringify(rows), { status: 200 });
        },
      },
    });

    const repo1 = new SupabaseMemberRepository(client);
    const repo2 = new SupabaseMemberRepository(client);

    // Two simultaneous addMember calls when household has 5 members
    const [result1, result2] = await Promise.allSettled([
      repo1.addMember('BEP-123', 'Dương'),
      repo2.addMember('BEP-123', 'Em bé'),
    ]);

    const successful = [result1, result2].filter(r => r.status === 'fulfilled');
    const rejected = [result1, result2].filter(r => r.status === 'rejected');

    expect(successful).toHaveLength(1);
    expect(rejected).toHaveLength(1);
    expect((rejected[0] as PromiseRejectedResult).reason).toMatchObject({
      code: 'capacity-exceeded',
      message: 'Gia đình đã có tối đa 6 Thành viên.',
    });

    // Database has exactly 6 members
    const finalMembers = await repo1.getMembers('BEP-123');
    expect(finalMembers).toHaveLength(6);
  });

  it('allows households with > 6 members to getMembers and deleteMember without trigger interference', async () => {
    let rows = [
      { id: '1', household_code: 'BEP-123', name: 'Mẹ', created_at: '2026-10-08T00:00:00Z' },
      { id: '2', household_code: 'BEP-123', name: 'Bố', created_at: '2026-10-08T00:00:01Z' },
      { id: '3', household_code: 'BEP-123', name: 'An', created_at: '2026-10-08T00:00:02Z' },
      { id: '4', household_code: 'BEP-123', name: 'Bình', created_at: '2026-10-08T00:00:03Z' },
      { id: '5', household_code: 'BEP-123', name: 'Cúc', created_at: '2026-10-08T00:00:04Z' },
      { id: '6', household_code: 'BEP-123', name: 'Dương', created_at: '2026-10-08T00:00:05Z' },
      { id: '7', household_code: 'BEP-123', name: 'Em bé', created_at: '2026-10-08T00:00:06Z' },
    ];
    const client = createClient('https://database.example', 'test-key', {
      auth: { persistSession: false },
      global: {
        fetch: async (input, init) => {
          const url = new URL(String(input));
          const code = url.searchParams.get('household_code')?.replace(/^eq\./, '');
          const id = url.searchParams.get('id')?.replace(/^eq\./, '');
          const matching = rows.filter(row => row.household_code === code && (!id || row.id === id));
          if (init?.method === 'DELETE') {
            rows = rows.filter(row => !matching.includes(row));
            return new Response(JSON.stringify(matching), { status: 200 });
          }
          return new Response(JSON.stringify(matching), { status: 200 });
        },
      },
    });
    const repo = new SupabaseMemberRepository(client);

    // Can read all 7 legacy members
    const members = await repo.getMembers('BEP-123');
    expect(members).toHaveLength(7);

    // Can delete a member from a legacy household
    await repo.deleteMember('BEP-123', '7');
    const remaining = await repo.getMembers('BEP-123');
    expect(remaining).toHaveLength(6);
  });
});
