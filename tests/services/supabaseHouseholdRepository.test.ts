import { describe, it, expect, vi } from 'vitest';
import {
  SupabaseHouseholdRepository,
  mapHouseholdRowToEntity,
} from '../../src/services/supabaseHouseholdRepository';

describe('SupabaseHouseholdRepository', () => {
  it('maps database row correctly to domain entity', () => {
    const row = {
      code: 'BEP-892',
      members: ['Mẹ', 'Bố', 'Tôm'],
      created_at: '2026-10-02T10:00:00Z',
    };
    const entity = mapHouseholdRowToEntity(row);
    expect(entity.code).toBe('BEP-892');
    expect(entity.members).toEqual(['Mẹ', 'Bố', 'Tôm']);
    expect(entity.createdAt).toBe('2026-10-02T10:00:00Z');
  });

  it('queries household by code and returns entity or null', async () => {
    const maybeSingleMock = vi.fn().mockResolvedValue({
      data: { code: 'BEP-892', members: ['Mẹ'], created_at: '2026-10-02T10:00:00Z' },
      error: null,
    });
    const eqMock = vi.fn().mockReturnValue({ maybeSingle: maybeSingleMock });
    const selectMock = vi.fn().mockReturnValue({ eq: eqMock });
    const mockClient = {
      from: vi.fn().mockReturnValue({ select: selectMock }),
    } as any;

    const repo = new SupabaseHouseholdRepository(mockClient);
    const result = await repo.getHousehold('BEP-892');

    expect(mockClient.from).toHaveBeenCalledWith('households');
    expect(eqMock).toHaveBeenCalledWith('code', 'BEP-892');
    expect(result?.members).toEqual(['Mẹ']);
  });

  it('saves household with upsert', async () => {
    const singleMock = vi.fn().mockResolvedValue({
      data: { code: 'BEP-892', members: ['Mẹ', 'Bố'], created_at: '2026-10-02T10:00:00Z' },
      error: null,
    });
    const selectMock = vi.fn().mockReturnValue({ single: singleMock });
    const upsertMock = vi.fn().mockReturnValue({ select: selectMock });
    const mockClient = {
      from: vi.fn().mockReturnValue({ upsert: upsertMock }),
    } as any;

    const repo = new SupabaseHouseholdRepository(mockClient);
    const saved = await repo.saveHousehold({
      code: 'BEP-892',
      members: ['Mẹ', 'Bố'],
    });

    expect(mockClient.from).toHaveBeenCalledWith('households');
    expect(upsertMock).toHaveBeenCalledWith(
      expect.objectContaining({
        code: 'BEP-892',
        members: ['Mẹ', 'Bố'],
      })
    );
    expect(saved.members).toEqual(['Mẹ', 'Bố']);
  });

  it('subscribes to realtime changes for household code', () => {
    const subscribeMock = vi.fn();
    const onMock = vi.fn().mockReturnValue({ subscribe: subscribeMock });
    const removeChannelMock = vi.fn();
    const mockChannel = { on: onMock };
    const mockClient = {
      channel: vi.fn().mockReturnValue(mockChannel),
      removeChannel: removeChannelMock,
    } as any;

    const repo = new SupabaseHouseholdRepository(mockClient);
    const unsubscribe = repo.subscribe('BEP-892', () => {});

    expect(mockClient.channel).toHaveBeenCalled();
    expect(onMock).toHaveBeenCalledWith(
      'postgres_changes',
      expect.objectContaining({
        table: 'households',
        filter: 'code=eq.BEP-892',
      }),
      expect.any(Function)
    );

    unsubscribe();
    expect(removeChannelMock).toHaveBeenCalledWith(mockChannel);
  });
});
