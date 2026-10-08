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
});
