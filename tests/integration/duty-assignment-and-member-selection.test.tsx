import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { App } from '../../src/App';
import { InMemoryHouseholdStorage } from '../../src/services/storage';
import { InMemoryHouseholdRepository } from '../../src/services/householdRepository';
import { InMemoryDishRepository } from '../../src/services/dishRepository';
import { InMemoryPlanRepository } from '../../src/services/planRepository';

describe('Ticket 07 Integration: Duty Assignment and Netflix Member Selection', () => {
  let storage: InMemoryHouseholdStorage;
  let householdRepo: InMemoryHouseholdRepository;
  let dishRepo: InMemoryDishRepository;
  let planRepo: InMemoryPlanRepository;
  const householdCode = 'BEP-892';
  const fixedDate = '2026-09-29'; // Tuesday

  beforeEach(() => {
    storage = new InMemoryHouseholdStorage();
    householdRepo = new InMemoryHouseholdRepository();
    dishRepo = new InMemoryDishRepository();
    planRepo = new InMemoryPlanRepository();
  });

  it('renders Netflix-style "Ai đang sử dụng?" screen when opened with household code and allows selecting profile', async () => {
    // Household has existing members
    await householdRepo.saveHousehold({
      code: householdCode,
      members: ['Mẹ', 'Bố', 'Tôm'],
    });
    storage.setHouseholdCode(householdCode);
    // nickname is not set yet in session

    const user = userEvent.setup();
    render(
      <App
        storage={storage}
        householdRepository={householdRepo}
        dishRepository={dishRepo}
        planRepository={planRepo}
        initialDate={fixedDate}
        isOnline={true}
      />
    );

    // 1. Shows "Ai đang sử dụng?" member selection screen
    expect(screen.getByTestId('member-selection-view')).toBeInTheDocument();
    expect(screen.getByTestId('member-selection-title')).toHaveTextContent('Ai đang sử dụng?');
    expect(screen.getByTestId('member-view-code-badge')).toHaveTextContent(`NHÀ: ${householdCode}`);
    expect(await screen.findByTestId('member-card-Mẹ')).toBeInTheDocument();
    expect(screen.getByTestId('member-card-Bố')).toBeInTheDocument();
    expect(screen.getByTestId('member-card-Tôm')).toBeInTheDocument();

    // 2. Select profile 'Tôm'
    await user.click(screen.getByTestId('member-card-Tôm'));

    // 3. Transitions to Plan view
    await waitFor(() => {
      expect(screen.getByTestId('plan-view')).toBeInTheDocument();
    });

    // 4. Header shows clean household badge and profile button with 'Tôm'
    expect(screen.getByTestId('household-code-badge')).toHaveTextContent(`Mã: ${householdCode}`);
    expect(screen.getByTestId('nickname-badge')).toHaveTextContent('Tôm');
    expect(storage.getNickname()).toBe('Tôm');

    // 5. AppHeader does not have visible 'Online' text, but minimalist pill
    expect(screen.queryByTestId('offline-banner')).not.toBeInTheDocument();
  });

  it('allows adding a new member profile directly on the member selection screen', async () => {
    await householdRepo.saveHousehold({
      code: householdCode,
      members: ['Mẹ'],
    });
    storage.setHouseholdCode(householdCode);

    const user = userEvent.setup();
    render(
      <App
        storage={storage}
        householdRepository={householdRepo}
        dishRepository={dishRepo}
        planRepository={planRepo}
        initialDate={fixedDate}
      />
    );

    // Click "+ Thêm người"
    const addBtn = screen.getByTestId('add-member-button');
    await user.click(addBtn);

    // Form appears
    const input = screen.getByTestId('new-member-name-input');
    await user.type(input, 'Bé Na');

    const confirmBtn = screen.getByTestId('confirm-add-member-btn');
    await user.click(confirmBtn);

    // Enters Plan view as 'Bé Na'
    await waitFor(() => {
      expect(screen.getByTestId('plan-view')).toBeInTheDocument();
    });
    expect(screen.getByTestId('nickname-badge')).toHaveTextContent('Bé Na');

    // Member persisted to household repository
    const storedMembers = await householdRepo.getMembers(householdCode);
    expect(storedMembers).toContain('Bé Na');
  });

  it('allows clicking the profile button in AppHeader to return to member selection and switch profile', async () => {
    await householdRepo.saveHousehold({
      code: householdCode,
      members: ['Mẹ', 'Bố'],
    });
    storage.setHouseholdCode(householdCode);
    storage.setNickname('Mẹ');

    const user = userEvent.setup();
    render(
      <App
        storage={storage}
        householdRepository={householdRepo}
        dishRepository={dishRepo}
        planRepository={planRepo}
        initialDate={fixedDate}
      />
    );

    // Initial state: in Plan view as 'Mẹ'
    expect(screen.getByTestId('plan-view')).toBeInTheDocument();
    expect(screen.getByTestId('nickname-badge')).toHaveTextContent('Mẹ');

    // Click profile button in header
    const profileBtn = screen.getByTestId('profile-button');
    await user.click(profileBtn);

    // Returns to "Ai đang sử dụng?" screen
    await waitFor(() => {
      expect(screen.getByTestId('member-selection-view')).toBeInTheDocument();
    });
    expect(screen.getByText('Ai đang sử dụng?')).toBeInTheDocument();

    // Switch to 'Bố'
    await user.click(screen.getByTestId('member-card-Bố'));

    // Returns to Plan view with 'Bố' active
    await waitFor(() => {
      expect(screen.getByTestId('plan-view')).toBeInTheDocument();
    });
    expect(screen.getByTestId('nickname-badge')).toHaveTextContent('Bố');
    expect(storage.getNickname()).toBe('Bố');
  });

  it('displays offline banner in AppHeader when offline', async () => {
    storage.setHouseholdCode(householdCode);
    storage.setNickname('Mẹ');

    render(
      <App
        storage={storage}
        householdRepository={householdRepo}
        dishRepository={dishRepo}
        planRepository={planRepo}
        initialDate={fixedDate}
        isOnline={false}
      />
    );

    expect(screen.getByTestId('offline-banner')).toBeInTheDocument();
    expect(screen.getByTestId('offline-banner')).toHaveTextContent('Đang chạy ngoại tuyến');
  });

  it('prompts "Ai sẽ nấu ngày này?" when selecting an unassigned future day with "Để sau" option', async () => {
    await householdRepo.saveHousehold({
      code: householdCode,
      members: ['Mẹ', 'Bố', 'Tôm'],
    });
    storage.setHouseholdCode(householdCode);
    storage.setNickname('Tôm');

    const user = userEvent.setup();
    render(
      <App
        storage={storage}
        householdRepository={householdRepo}
        dishRepository={dishRepo}
        planRepository={planRepo}
        initialDate={fixedDate} // 2026-09-29 is Tuesday
      />
    );

    await waitFor(() => {
      expect(screen.getByTestId('plan-view')).toBeInTheDocument();
    });

    // Day 5 is Saturday (future day relative to fixed date 2026-09-29)
    const futureDayBtn = screen.getByTestId('day-btn-5');
    await user.click(futureDayBtn);

    // Cook prompt popup appears
    await waitFor(() => {
      expect(screen.getByTestId('cook-prompt-modal')).toBeInTheDocument();
      expect(screen.getByTestId('cook-prompt-title')).toHaveTextContent('Ai sẽ nấu ngày này?');
    });

    // Test "Để sau" button closes popup without assigning
    const laterBtn = screen.getByTestId('cook-prompt-later-btn');
    await user.click(laterBtn);

    expect(screen.queryByTestId('cook-prompt-modal')).not.toBeInTheDocument();
    expect(screen.getByTestId('assign-cook-btn')).toHaveTextContent('+ Phân công nấu');

    // Click again and this time assign 'Bố'
    await user.click(futureDayBtn);
    await waitFor(() => {
      expect(screen.getByTestId('cook-prompt-modal')).toBeInTheDocument();
    });

    const assignBoBtn = screen.getByTestId('prompt-assign-Bố');
    await user.click(assignBoBtn);

    // Popup closes, assigned cook badge displays 'Bố'
    await waitFor(() => {
      expect(screen.queryByTestId('cook-prompt-modal')).not.toBeInTheDocument();
    });
    expect(screen.getByTestId('change-cook-btn')).toHaveTextContent('👨‍🍳 Bố');

    // Floating Pill Badge appears on ribbon above Saturday (2026-10-03)
    expect(screen.getByTestId('cook-badge-2026-10-03')).toHaveTextContent('Bố');

    // Persisted in planRepository
    const cooks = await planRepo.getDayCooks(householdCode);
    expect(cooks['2026-10-03']).toBe('Bố');
  });

  it('supports assigning, changing, and unassigning cook from the day detail area', async () => {
    await householdRepo.saveHousehold({
      code: householdCode,
      members: ['Mẹ', 'Bố', 'Tôm'],
    });
    storage.setHouseholdCode(householdCode);
    storage.setNickname('Mẹ');

    const user = userEvent.setup();
    render(
      <App
        storage={storage}
        householdRepository={householdRepo}
        dishRepository={dishRepo}
        planRepository={planRepo}
        initialDate={fixedDate} // Tuesday 2026-09-29
      />
    );

    await waitFor(() => {
      expect(screen.getByTestId('plan-view')).toBeInTheDocument();
    });

    // 1. Initial state has no cook assigned: shows "+ Phân công nấu"
    const assignBtn = screen.getByTestId('assign-cook-btn');
    expect(assignBtn).toBeInTheDocument();
    expect(screen.getByText('✨ Bữa chính')).toBeInTheDocument();

    // 2. Open assign drawer
    await user.click(assignBtn);
    expect(screen.getByTestId('assign-cook-drawer')).toBeInTheDocument();
    expect(screen.getByText('Phân công người nấu')).toBeInTheDocument();

    // 3. Assign 'Mẹ'
    await user.click(screen.getByTestId('select-cook-Mẹ'));

    // Drawer closes, button changes to '👨‍🍳 Mẹ Đổi'
    await waitFor(() => {
      expect(screen.queryByTestId('assign-cook-drawer')).not.toBeInTheDocument();
    });
    expect(screen.getByTestId('change-cook-btn')).toHaveTextContent('👨‍🍳 Mẹ');
    expect(screen.getByTestId('cook-badge-2026-09-29')).toHaveTextContent('Mẹ');

    // 4. Change cook to 'Tôm'
    await user.click(screen.getByTestId('change-cook-btn'));
    await waitFor(() => {
      expect(screen.getByTestId('assign-cook-drawer')).toBeInTheDocument();
    });
    // 'Mẹ' is marked as currently cooking
    expect(screen.getByText('✓ Đang nấu')).toBeInTheDocument();

    await user.click(screen.getByTestId('select-cook-Tôm'));
    await waitFor(() => {
      expect(screen.queryByTestId('assign-cook-drawer')).not.toBeInTheDocument();
    });
    expect(screen.getByTestId('change-cook-btn')).toHaveTextContent('👨‍🍳 Tôm');
    expect(screen.getByTestId('cook-badge-2026-09-29')).toHaveTextContent('Tôm');

    // 5. Unassign cook
    await user.click(screen.getByTestId('change-cook-btn'));
    await waitFor(() => {
      expect(screen.getByTestId('unassign-cook-btn')).toBeInTheDocument();
    });
    await user.click(screen.getByTestId('unassign-cook-btn'));

    // Reverts to unassigned state
    await waitFor(() => {
      expect(screen.queryByTestId('assign-cook-drawer')).not.toBeInTheDocument();
    });
    expect(screen.getByTestId('assign-cook-btn')).toHaveTextContent('+ Phân công nấu');
    expect(screen.queryByTestId('cook-badge-2026-09-29')).not.toBeInTheDocument();
  });
});
