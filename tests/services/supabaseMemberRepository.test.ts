import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  SupabaseMemberRepository,
  mapMemberRowToEntity,
  MemberRow,
} from '../../src/services/supabaseMemberRepository';

describe('SupabaseMemberRepository', () => {
  let mockClient: any;

  beforeEach(() => {
    mockClient = {};
  });

  describe('mapMemberRowToEntity', () => {
    it('correctly maps Supabase snake_case columns to camelCase domain entity', () => {
      const row: MemberRow = {
        id: 'mem_1',
        household_code: 'BEP-892',
        name: 'Mẹ',
        avatar_icon: '🍳',
        avatar_color: 'bg-[#FEF7DC]',
        created_at: '2026-10-07T12:00:00.000Z',
      };

      const entity = mapMemberRowToEntity(row);
      expect(entity).toEqual({
        id: 'mem_1',
        householdCode: 'BEP-892',
        name: 'Mẹ',
        avatarIcon: '🍳',
        avatarColor: 'bg-[#FEF7DC]',
        createdAt: '2026-10-07T12:00:00.000Z',
      });
    });
  });

  describe('getMembers', () => {
    it('queries members table, filters by household_code, orders by created_at, and returns entities', async () => {
      const mockRows: MemberRow[] = [
        {
          id: 'mem_1',
          household_code: 'BEP-892',
          name: 'Mẹ',
          avatar_icon: '🍳',
          avatar_color: 'bg-[#FEF7DC]',
          created_at: '2026-10-07T10:00:00.000Z',
        },
        {
          id: 'mem_2',
          household_code: 'BEP-892',
          name: 'Bố',
          avatar_icon: '🍜',
          avatar_color: 'bg-[#E0F2FE]',
          created_at: '2026-10-07T11:00:00.000Z',
        },
      ];

      const orderMock = vi.fn().mockResolvedValue({ data: mockRows, error: null });
      const eqMock = vi.fn().mockReturnValue({ order: orderMock });
      const selectMock = vi.fn().mockReturnValue({ eq: eqMock });

      mockClient = {
        from: vi.fn().mockReturnValue({
          select: selectMock,
        }),
      };

      const repo = new SupabaseMemberRepository(mockClient);
      const members = await repo.getMembers('BEP-892');

      expect(mockClient.from).toHaveBeenCalledWith('members');
      expect(selectMock).toHaveBeenCalledWith('*');
      expect(eqMock).toHaveBeenCalledWith('household_code', 'BEP-892');
      expect(orderMock).toHaveBeenCalledWith('created_at', { ascending: true });
      expect(members).toHaveLength(2);
      expect(members[0].name).toBe('Mẹ');
      expect(members[1].name).toBe('Bố');
    });

    it('throws error when supabase query fails', async () => {
      const orderMock = vi.fn().mockResolvedValue({
        data: null,
        error: { message: 'Database connection failed' },
      });
      const eqMock = vi.fn().mockReturnValue({ order: orderMock });
      const selectMock = vi.fn().mockReturnValue({ eq: eqMock });

      mockClient = {
        from: vi.fn().mockReturnValue({
          select: selectMock,
        }),
      };

      const repo = new SupabaseMemberRepository(mockClient);
      await expect(repo.getMembers('BEP-892')).rejects.toThrow('Database connection failed');
    });
  });

  describe('addMember', () => {
    it('validates name, inserts into members table, and returns created entity', async () => {
      const insertMock = vi.fn().mockResolvedValue({ error: null });
      mockClient = {
        from: vi.fn().mockReturnValue({
          insert: insertMock,
        }),
      };

      const repo = new SupabaseMemberRepository(mockClient);
      const newMember = await repo.addMember({
        householdCode: 'BEP-892',
        name: 'Bé An',
        avatarIcon: '🥑',
        avatarColor: 'bg-[#ECFCCB]',
      });

      expect(mockClient.from).toHaveBeenCalledWith('members');
      expect(insertMock).toHaveBeenCalledWith(
        expect.objectContaining({
          household_code: 'BEP-892',
          name: 'Bé An',
          avatar_icon: '🥑',
          avatar_color: 'bg-[#ECFCCB]',
        })
      );
      expect(newMember.name).toBe('Bé An');
      expect(newMember.householdCode).toBe('BEP-892');
    });

    it('throws validation error if member name is empty', async () => {
      mockClient = { from: vi.fn() };
      const repo = new SupabaseMemberRepository(mockClient);

      await expect(
        repo.addMember({
          householdCode: 'BEP-892',
          name: '   ',
          avatarIcon: '🍳',
          avatarColor: 'bg-[#FEF7DC]',
        })
      ).rejects.toThrow('Tên thành viên không hợp lệ');
    });

    it('throws duplicate name error when supabase returns unique violation (code 23505)', async () => {
      const insertMock = vi.fn().mockResolvedValue({
        error: { code: '23505', message: 'duplicate key value violates unique constraint' },
      });
      mockClient = {
        from: vi.fn().mockReturnValue({
          insert: insertMock,
        }),
      };

      const repo = new SupabaseMemberRepository(mockClient);
      await expect(
        repo.addMember({
          householdCode: 'BEP-892',
          name: 'Mẹ',
          avatarIcon: '🍳',
          avatarColor: 'bg-[#FEF7DC]',
        })
      ).rejects.toThrow('Tên thành viên đã tồn tại');
    });
  });

  describe('updateMember', () => {
    it('updates member name and avatar and returns updated domain entity', async () => {
      const updatedRow: MemberRow = {
        id: 'mem_1',
        household_code: 'BEP-892',
        name: 'Mẹ Yêu',
        avatar_icon: '🥗',
        avatar_color: 'bg-[#DCFCE7]',
        created_at: '2026-10-07T10:00:00.000Z',
      };

      const singleMock = vi.fn().mockResolvedValue({ data: updatedRow, error: null });
      const selectMock = vi.fn().mockReturnValue({ single: singleMock });
      const eqHouseholdMock = vi.fn().mockReturnValue({ select: selectMock });
      const eqIdMock = vi.fn().mockReturnValue({ eq: eqHouseholdMock });
      const updateMock = vi.fn().mockReturnValue({ eq: eqIdMock });

      mockClient = {
        from: vi.fn().mockReturnValue({
          update: updateMock,
        }),
      };

      const repo = new SupabaseMemberRepository(mockClient);
      const result = await repo.updateMember('mem_1', 'BEP-892', {
        name: 'Mẹ Yêu',
        avatarIcon: '🥗',
        avatarColor: 'bg-[#DCFCE7]',
      });

      expect(mockClient.from).toHaveBeenCalledWith('members');
      expect(updateMock).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Mẹ Yêu',
          avatar_icon: '🥗',
          avatar_color: 'bg-[#DCFCE7]',
        })
      );
      expect(eqIdMock).toHaveBeenCalledWith('id', 'mem_1');
      expect(eqHouseholdMock).toHaveBeenCalledWith('household_code', 'BEP-892');
      expect(result.name).toBe('Mẹ Yêu');
    });
  });

  describe('deleteMember', () => {
    it('deletes member row from table matching id and household_code', async () => {
      const eqIdMock = vi.fn().mockResolvedValue({ error: null });
      const eqHouseholdMock = vi.fn().mockReturnValue({ eq: eqIdMock });
      const deleteMock = vi.fn().mockReturnValue({ eq: eqHouseholdMock });

      mockClient = {
        from: vi.fn().mockReturnValue({
          delete: deleteMock,
        }),
      };

      const repo = new SupabaseMemberRepository(mockClient);
      await repo.deleteMember('mem_1', 'BEP-892');

      expect(mockClient.from).toHaveBeenCalledWith('members');
      expect(eqHouseholdMock).toHaveBeenCalledWith('household_code', 'BEP-892');
      expect(eqIdMock).toHaveBeenCalledWith('id', 'mem_1');
    });
  });

  describe('subscribe', () => {
    it('subscribes to realtime channel and unsubscribes on cleanup', () => {
      const callback = vi.fn();
      const removeChannelMock = vi.fn();
      const subscribeMock = vi.fn();
      const onMock = vi.fn().mockReturnThis();

      mockClient = {
        channel: vi.fn().mockReturnValue({
          on: onMock,
          subscribe: subscribeMock,
        }),
        removeChannel: removeChannelMock,
      };

      const repo = new SupabaseMemberRepository(mockClient);
      const unsubscribe = repo.subscribe('BEP-892', callback);

      expect(mockClient.channel).toHaveBeenCalled();
      expect(onMock).toHaveBeenCalledWith(
        'postgres_changes',
        expect.objectContaining({
          event: '*',
          schema: 'public',
          table: 'members',
          filter: 'household_code=eq.BEP-892',
        }),
        expect.any(Function)
      );
      expect(subscribeMock).toHaveBeenCalled();

      // Trigger the handler callback
      const handler = onMock.mock.calls[0][2];
      handler({});
      expect(callback).toHaveBeenCalledTimes(1);

      unsubscribe();
      expect(removeChannelMock).toHaveBeenCalled();
    });
  });
});
