import React from 'react';
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { App } from '../../src/App';
import { PlanView } from '../../src/components/PlanView';
import { MenuView } from '../../src/components/MenuView';
import { InMemoryDishRepository } from '../../src/services/dishRepository';
import { InMemoryPlanRepository } from '../../src/services/planRepository';
import { InMemoryHouseholdStorage } from '../../src/services/storage';
import { TestMemberRepository, sampleMember } from '../support/memberRepository';

describe('Cascade Delete and Two-Week History Retention Integration (Ticket 05)', () => {
  let dishRepo: InMemoryDishRepository;
  let planRepo: InMemoryPlanRepository;
  let storage: InMemoryHouseholdStorage;
  const householdCode = 'BEP-892';
  const nickname = 'Mẹ Bắp';
  const fixedBaseDate = '2026-09-29'; // Tuesday

  beforeEach(() => {
    dishRepo = new InMemoryDishRepository();
    planRepo = new InMemoryPlanRepository();
    storage = new InMemoryHouseholdStorage();
    storage.setHouseholdCode(householdCode);
    storage.setNickname(nickname);
  });

  describe('Cascade Delete when removing Món ăn from Menu (ADR 0003)', () => {
    it('automatically removes Món ăn and all its comments from all Kế hoạch weeks when deleted in MenuView', async () => {
      const user = userEvent.setup();

      // 1. Setup dish in Menu
      const dish = await dishRepo.addDish(householdCode, { name: 'Thịt kho tàu', tag: 'Món mặn' });

      // 2. Schedule dish across multiple weeks in Kế hoạch (past, present, future)
      const pastItems = await planRepo.addDishesToMeal(householdCode, '2026-09-22', 'dinner', [dish.id]);
      const presentItems = await planRepo.addDishesToMeal(householdCode, '2026-09-29', 'dinner', [dish.id]);
      const futureItems = await planRepo.addDishesToMeal(householdCode, '2026-10-06', 'dinner', [dish.id]);

      // 3. Add comments to all instances
      await planRepo.addComment(householdCode, pastItems[0].id, nickname, 'Ghi chú tuần trước');
      await planRepo.addComment(householdCode, presentItems[0].id, nickname, 'Ghi chú tuần này');
      await planRepo.addComment(householdCode, futureItems[0].id, nickname, 'Ghi chú tuần sau');

      // 4. Render App with active household
      render(
        <App
          storage={storage}
          memberRepository={new TestMemberRepository([sampleMember(nickname, householdCode)])}
          dishRepository={dishRepo}
          planRepository={planRepo}
        />
      );

      // Select Tuesday 29/09 where dish is scheduled
      await user.click(await screen.findByRole('button', { name: `Chọn ${nickname}` }));
      await user.click(await screen.findByTestId('day-btn-1'));

      // Verify dish is visible in current week's plan
      await waitFor(() => {
        expect(screen.getByText('Thịt kho tàu')).toBeInTheDocument();
      });

      // 5. Navigate to Menu tab
      const menuTab = screen.getByTestId('nav-menu-button');
      await user.click(menuTab);

      // Verify dish is in Menu
      await waitFor(() => {
        expect(screen.getByTestId(`dish-card-${dish.id}`)).toBeInTheDocument();
      });

      // 6. Delete dish from Menu
      const deleteBtn = screen.getByTestId(`delete-dish-${dish.id}`);
      await user.click(deleteBtn);

      // Confirm deletion modal
      const confirmBtn = await screen.findByTestId('confirm-delete-dish-btn');
      await user.click(confirmBtn);

      // Verify dish is gone from Menu
      await waitFor(() => {
        expect(screen.queryByTestId(`dish-card-${dish.id}`)).not.toBeInTheDocument();
      });

      // 7. Verify cascade delete in planRepository: All plan items and comments for this dish are purged
      const remainingPlanItems = await planRepo.getPlanItems(householdCode);
      expect(remainingPlanItems.filter((i) => i.dishId === dish.id)).toHaveLength(0);

      const pastComments = await planRepo.getComments(householdCode, pastItems[0].id);
      const presentComments = await planRepo.getComments(householdCode, presentItems[0].id);
      const futureComments = await planRepo.getComments(householdCode, futureItems[0].id);
      expect(pastComments).toHaveLength(0);
      expect(presentComments).toHaveLength(0);
      expect(futureComments).toHaveLength(0);

      // 8. Switch back to Plan tab and confirm UI shows 0 Món ăn
      const planTab = screen.getByTestId('nav-plan-button');
      await user.click(planTab);
      await user.click(await screen.findByTestId('day-btn-1'));

      await waitFor(() => {
        expect(screen.queryByText('Thịt kho tàu')).not.toBeInTheDocument();
        expect(screen.getByText('0 Món ăn')).toBeInTheDocument();
      });
    });

    it('cascades deletion directly when MenuView has planRepository passed as prop', async () => {
      const user = userEvent.setup();
      const dish = await dishRepo.addDish(householdCode, { name: 'Canh bí đao', tag: 'Canh' });
      const scheduled = await planRepo.addDishesToMeal(householdCode, fixedBaseDate, 'dinner', [dish.id]);
      await planRepo.addComment(householdCode, scheduled[0].id, nickname, 'Nấu ít thịt bằm');

      render(
        <MenuView
          householdCode={householdCode}
          dishRepository={dishRepo}
          planRepository={planRepo}
        />
      );

      await waitFor(() => {
        expect(screen.getByTestId(`dish-card-${dish.id}`)).toBeInTheDocument();
      });

      // Delete in MenuView
      await user.click(screen.getByTestId(`delete-dish-${dish.id}`));
      await user.click(await screen.findByTestId('confirm-delete-dish-btn'));

      await waitFor(() => {
        expect(screen.queryByTestId(`dish-card-${dish.id}`)).not.toBeInTheDocument();
      });

      // Plan item and comment must be wiped
      const items = await planRepo.getPlanItems(householdCode);
      expect(items).toHaveLength(0);
      const comments = await planRepo.getComments(householdCode, scheduled[0].id);
      expect(comments).toHaveLength(0);
    });
  });

  describe('Two-Week History Restriction and Auto-Cleanup (ADR 0002)', () => {
    it('disables previous week button when reaching the 2-week history boundary', async () => {
      const user = userEvent.setup();
      render(
        <PlanView
          householdCode={householdCode}
          nickname={nickname}
          dishRepository={dishRepo}
          planRepository={planRepo}
          initialDate={fixedBaseDate}
        />
      );

      const prevWeekBtn = screen.getByTestId('prev-week-btn');
      const nextWeekBtn = screen.getByTestId('next-week-btn');

      // Base week (2026-09-28 to 2026-10-04): prev button is enabled
      expect(prevWeekBtn).toBeEnabled();

      // Click 1: navigate to 1 week ago (Monday 2026-09-21)
      await user.click(prevWeekBtn);
      await waitFor(() => {
        expect(screen.getByText('21')).toBeInTheDocument();
      });
      // 1 week ago: still within limit, can go back 1 more week
      expect(prevWeekBtn).toBeEnabled();

      // Click 2: navigate to 2 weeks ago (Monday 2026-09-14)
      await user.click(prevWeekBtn);
      await waitFor(() => {
        expect(screen.getByText('14')).toBeInTheDocument();
      });

      // Now at the 2-week boundary! Prev button MUST be disabled!
      expect(prevWeekBtn).toBeDisabled();

      // Clicking disabled prev button must NOT shift date further into the past
      await user.click(prevWeekBtn);
      expect(screen.getByText('14')).toBeInTheDocument();
      expect(screen.queryByText('7')).not.toBeInTheDocument();

      // Next week button remains enabled and allows navigating forward back to current week
      expect(nextWeekBtn).toBeEnabled();
      await user.click(nextWeekBtn);
      await waitFor(() => {
        expect(screen.getByText('21')).toBeInTheDocument();
      });
      expect(prevWeekBtn).toBeEnabled();
    });

    it('automatically prunes meal plans and comments older than 14 days upon loading PlanView', async () => {
      // Add dish to menu
      const dish = await dishRepo.addDish(householdCode, { name: 'Cá kho tộ', tag: 'Kho' });

      // Add plan items:
      // 1. Expired plan item (older than 14 days, e.g. 2026-09-10)
      const oldItems = await planRepo.addDishesToMeal(householdCode, '2026-09-10', 'dinner', [dish.id]);
      await planRepo.addComment(householdCode, oldItems[0].id, nickname, 'Comment cũ hơn 14 ngày');

      // 2. Boundary plan item (Monday of week 2 weeks ago: 2026-09-14)
      await planRepo.addDishesToMeal(householdCode, '2026-09-14', 'dinner', [dish.id]);

      // 3. Active plan item (2026-09-29)
      const activeItems = await planRepo.addDishesToMeal(householdCode, fixedBaseDate, 'dinner', [dish.id]);
      await planRepo.addComment(householdCode, activeItems[0].id, nickname, 'Comment còn hiệu lực');

      // Render PlanView
      render(
        <PlanView
          householdCode={householdCode}
          nickname={nickname}
          dishRepository={dishRepo}
          planRepository={planRepo}
          initialDate={fixedBaseDate}
        />
      );

      // Active dish is visible
      await waitFor(() => {
        expect(screen.getByText('Cá kho tộ')).toBeInTheDocument();
      });

      // Verify that expired item and its comments have been pruned from repository
      const allItems = await planRepo.getPlanItems(householdCode);
      expect(allItems.some((i) => i.date === '2026-09-10')).toBe(false);
      expect(allItems.some((i) => i.date === '2026-09-14')).toBe(true);
      expect(allItems.some((i) => i.date === fixedBaseDate)).toBe(true);

      const oldComments = await planRepo.getComments(householdCode, oldItems[0].id);
      expect(oldComments).toHaveLength(0);

      const activeComments = await planRepo.getComments(householdCode, activeItems[0].id);
      expect(activeComments).toHaveLength(1);
    });
  });
});
