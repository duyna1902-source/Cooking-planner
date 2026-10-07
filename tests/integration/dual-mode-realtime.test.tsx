import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { App } from '../../src/App';
import { AppHeader } from '../../src/components/AppHeader';
import { formatDateToISO } from '../../src/domain/plan';
import { InMemoryHouseholdStorage } from '../../src/services/storage';
import { InMemoryDishRepository } from '../../src/services/dishRepository';
import { InMemoryPlanRepository } from '../../src/services/planRepository';
import { InMemoryMemberRepository } from '../../src/services/memberRepository';
import { Member } from '../../src/domain/member';
import {
  setSupabaseClientForTesting,
} from '../../src/services/supabaseClient';

describe('Dual Mode and Realtime Sync Integration (Ticket 06)', () => {
  const originalEnv = { ...import.meta.env };
  const sampleMember: Member = {
    id: 'mem_1',
    householdCode: 'NHA123',
    name: 'Mẹ',
    avatarIcon: '🍳',
    avatarColor: 'bg-[#FEF7DC]',
    createdAt: new Date().toISOString(),
  };

  beforeEach(() => {
    setSupabaseClientForTesting(null);
  });

  afterEach(() => {
    Object.assign(import.meta.env, originalEnv);
    setSupabaseClientForTesting(null);
  });

  describe('AppHeader Connection Status Indicator', () => {
    it('displays 🟡 Chế độ máy when isOnline is false', () => {
      render(
        <AppHeader
          householdCode="NHA123"
          nickname="Mẹ"
          activeTab="plan"
          isOnline={false}
        />
      );

      const badge = screen.getByTestId('sync-status-badge');
      expect(badge).toBeInTheDocument();
      expect(badge).toHaveTextContent('🟡 Chế độ máy');
      expect(badge).toHaveAttribute('title', 'Chế độ máy Local');
    });

    it('displays 🟢 Online when isOnline is true', () => {
      render(
        <AppHeader
          householdCode="NHA123"
          nickname="Mẹ"
          activeTab="plan"
          isOnline={true}
        />
      );

      const badge = screen.getByTestId('sync-status-badge');
      expect(badge).toBeInTheDocument();
      expect(badge).toHaveTextContent('🟢 Online');
      expect(badge).toHaveAttribute('title', 'Đang đồng bộ Online');
    });
  });

  describe('App Dual Mode Resolution', () => {
    it('defaults to Local Mode when Supabase is not configured', async () => {
      // @ts-expect-error test override
      import.meta.env.VITE_SUPABASE_URL = '';
      // @ts-expect-error test override
      import.meta.env.VITE_SUPABASE_ANON_KEY = '';

      const storage = new InMemoryHouseholdStorage('NHA123', 'Mẹ');
      render(<App storage={storage} initialActiveMember={sampleMember} />);

      await waitFor(() => {
        const badge = screen.getByTestId('sync-status-badge');
        expect(badge).toHaveTextContent('🟡 Chế độ máy');
      });
    });

    it('activates Online Mode when Supabase client is configured', async () => {
      const mockClient = { from: vi.fn(), channel: vi.fn() } as any;
      setSupabaseClientForTesting(mockClient);

      const storage = new InMemoryHouseholdStorage('NHA123', 'Mẹ');
      render(<App storage={storage} isOnline={true} initialActiveMember={sampleMember} />);

      await waitFor(() => {
        const badge = screen.getByTestId('sync-status-badge');
        expect(badge).toHaveTextContent('🟢 Online');
      });
    });
  });

  describe('Realtime Reactive Synchronization in Views', () => {
    it('PlanView reloads data automatically when planRepository.subscribe triggers', async () => {
      let triggerSubscriber: (() => void) | null = null;
      const initialDish = {
        id: 'dish_1',
        householdCode: 'NHA123',
        name: 'Sườn xào chua ngọt',
        createdAt: new Date().toISOString(),
      };

      const dishRepo = new InMemoryDishRepository([initialDish]);
      const planRepo = new InMemoryPlanRepository();

      // Add subscription support to in-memory plan repo for test
      planRepo.subscribe = vi.fn().mockImplementation((_code, cb) => {
        triggerSubscriber = cb;
        return () => {
          triggerSubscriber = null;
        };
      });

      const storage = new InMemoryHouseholdStorage('NHA123', 'Mẹ');
      render(
        <App
          storage={storage}
          dishRepository={dishRepo}
          planRepository={planRepo}
          isOnline={true}
          initialActiveMember={sampleMember}
        />
      );

      // Verify initial empty state
      await waitFor(() => {
        expect(screen.getByText(/Chưa có Món ăn nào cho Bữa Tối/i)).toBeInTheDocument();
      });

      // Another phone adds a dish to dinner on cloud
      const todayIso = formatDateToISO(new Date());
      await planRepo.addDishesToMeal('NHA123', todayIso, 'dinner', ['dish_1']);

      // Simulate Realtime websocket event firing
      act(() => {
        if (triggerSubscriber) {
          triggerSubscriber();
        }
      });

      // PlanView should reactively display the newly added dish without refresh
      await waitFor(() => {
        expect(screen.getByText('Sườn xào chua ngọt')).toBeInTheDocument();
      });
    });

    it('MenuView reloads dishes automatically when dishRepository.subscribe triggers', async () => {
      let triggerSubscriber: (() => void) | null = null;
      const dishRepo = new InMemoryDishRepository([]);
      const planRepo = new InMemoryPlanRepository();

      dishRepo.subscribe = vi.fn().mockImplementation((_code, cb) => {
        triggerSubscriber = cb;
        return () => {
          triggerSubscriber = null;
        };
      });

      const user = userEvent.setup();
      const storage = new InMemoryHouseholdStorage('NHA123', 'Mẹ');
      render(
        <App
          storage={storage}
          dishRepository={dishRepo}
          planRepository={planRepo}
          isOnline={true}
          initialActiveMember={sampleMember}
        />
      );

      // Switch to Menu tab
      const menuTabButton = screen.getByRole('button', { name: /Menu/i });
      await user.click(menuTabButton);

      await waitFor(() => {
        expect(screen.getByText(/Menu gia đình đang trống/i)).toBeInTheDocument();
      });

      // Another phone adds a dish to Menu on cloud
      await dishRepo.addDish('NHA123', { name: 'Cá kho tộ', tag: 'Món mặn' });

      // Trigger realtime websocket event
      act(() => {
        if (triggerSubscriber) {
          triggerSubscriber();
        }
      });

      // MenuView should automatically display Cá kho tộ
      await waitFor(() => {
        expect(screen.getByText('Cá kho tộ')).toBeInTheDocument();
      });
    });

    it('DishDetailDrawer reloads comments automatically when planRepository.subscribe triggers', async () => {
      let triggerSubscriber: (() => void) | null = null;
      const todayIso = formatDateToISO(new Date());

      const dish = {
        id: 'dish_1',
        householdCode: 'NHA123',
        name: 'Canh chua cá lóc',
        createdAt: new Date().toISOString(),
      };
      const dishRepo = new InMemoryDishRepository([dish]);
      const planRepo = new InMemoryPlanRepository();
      const addedItems = await planRepo.addDishesToMeal('NHA123', todayIso, 'dinner', ['dish_1']);
      const planItemId = addedItems[0].id;

      planRepo.subscribe = vi.fn().mockImplementation((_code, cb) => {
        triggerSubscriber = cb;
        return () => {
          triggerSubscriber = null;
        };
      });

      const user = userEvent.setup();
      const storage = new InMemoryHouseholdStorage('NHA123', 'Mẹ');
      render(
        <App
          storage={storage}
          dishRepository={dishRepo}
          planRepository={planRepo}
          isOnline={true}
          initialActiveMember={sampleMember}
        />
      );

      // Open DishDetailDrawer by clicking the dish card
      await waitFor(() => {
        expect(screen.getByText('Canh chua cá lóc')).toBeInTheDocument();
      });
      const dishCard = screen.getByTestId('plan-dish-card-trigger-Canh chua cá lóc');
      await user.click(dishCard);

      // Drawer is open with empty comments
      await waitFor(() => {
        expect(screen.getByTestId('dish-detail-drawer')).toBeInTheDocument();
        expect(screen.getByText(/Chưa có dặn dò nào/i)).toBeInTheDocument();
      });

      // Another phone submits a comment on cloud
      await planRepo.addComment('NHA123', planItemId, 'Bố', 'Cho nhiều bạc hà nhé');

      // Trigger realtime event
      act(() => {
        if (triggerSubscriber) {
          triggerSubscriber();
        }
      });

      // DishDetailDrawer should immediately show the new comment
      await waitFor(() => {
        expect(screen.getByText('Cho nhiều bạc hà nhé')).toBeInTheDocument();
        expect(screen.getByText('Bố')).toBeInTheDocument();
      });
    });

    it('MemberSelectModal reloads member list automatically when memberRepository triggers realtime event from another device', async () => {
      let triggerSubscriber: (() => void) | null = null;
      const initialMember = {
        id: 'mem_1',
        householdCode: 'NHA123',
        name: 'Mẹ Bắp',
        avatarIcon: '🍳',
        avatarColor: 'bg-[#FEF7DC]',
        createdAt: new Date().toISOString(),
      };

      const memberRepo = new InMemoryMemberRepository([initialMember]);
      memberRepo.subscribe = vi.fn().mockImplementation((_code, cb) => {
        triggerSubscriber = cb;
        return () => {
          triggerSubscriber = null;
        };
      });

      const storage = new InMemoryHouseholdStorage('NHA123');
      render(
        <App
          storage={storage}
          memberRepository={memberRepo}
          isOnline={true}
        />
      );

      // Verify MemberSelectModal is displayed with "Mẹ Bắp"
      await waitFor(() => {
        expect(screen.getByTestId('member-select-modal')).toBeInTheDocument();
      });
      expect(screen.getByText('Mẹ Bắp')).toBeInTheDocument();
      expect(screen.queryByText('Bố Tuấn')).not.toBeInTheDocument();

      // Another phone adds "Bố Tuấn" to the household in database
      await memberRepo.addMember({
        householdCode: 'NHA123',
        name: 'Bố Tuấn',
        avatarIcon: '🍜',
        avatarColor: 'bg-[#E0F2FE]',
      });

      // Simulate Realtime websocket postgres_changes trigger
      act(() => {
        if (triggerSubscriber) {
          triggerSubscriber();
        }
      });

      // MemberSelectModal automatically displays "Bố Tuấn" without page reload
      await waitFor(() => {
        expect(screen.getByText('Bố Tuấn')).toBeInTheDocument();
      });
      expect(screen.getByText('🍜')).toBeInTheDocument();
    });
  });
});
