import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { App } from '../../src/App';
import { InMemoryHouseholdStorage } from '../../src/services/storage';
import { InMemoryDishRepository } from '../../src/services/dishRepository';
import { InMemoryPlanRepository } from '../../src/services/planRepository';
import { InMemoryMemberRepository } from '../../src/services/memberRepository';
import { formatDateToISO } from '../../src/domain/plan';

describe('Member Selection Modal & Session Gate Integration (Ticket 01)', () => {
  let storage: InMemoryHouseholdStorage;
  let dishRepo: InMemoryDishRepository;
  let planRepo: InMemoryPlanRepository;
  let memberRepo: InMemoryMemberRepository;
  const householdCode = 'BEP-892';
  const today = formatDateToISO(new Date());

  beforeEach(async () => {
    storage = new InMemoryHouseholdStorage();
    dishRepo = new InMemoryDishRepository();
    planRepo = new InMemoryPlanRepository();
    memberRepo = new InMemoryMemberRepository();

    // Setup household in storage
    storage.setHouseholdCode(householdCode);

    // Pre-populate members
    await memberRepo.addMember({
      householdCode,
      name: 'Mẹ Bắp',
      avatarIcon: '🍳',
      avatarColor: 'bg-[#FEF7DC]',
    });
    await memberRepo.addMember({
      householdCode,
      name: 'Bố Tuấn',
      avatarIcon: '🍜',
      avatarColor: 'bg-[#E0F2FE]',
    });

    // Pre-populate a dish and schedule it for dinner
    const dish = await dishRepo.addDish(householdCode, {
      name: 'Thịt kho tàu',
      tag: 'Món mặn',
    });
    await planRepo.addDishesToMeal(householdCode, today, 'dinner', [dish.id]);
  });

  it('displays member selection modal when household has members and activeMember is null', async () => {
    render(
      <App
        storage={storage}
        dishRepository={dishRepo}
        planRepository={planRepo}
        memberRepository={memberRepo}
      />
    );

    // Member selection modal is shown
    await waitFor(() => {
      expect(screen.getByTestId('member-select-modal')).toBeInTheDocument();
      expect(screen.getByText('Ai đang vào bếp?')).toBeInTheDocument();
      expect(screen.getByText('Mã: BEP-892')).toBeInTheDocument();
      expect(screen.getByText('Mẹ Bắp')).toBeInTheDocument();
      expect(screen.getByText('Bố Tuấn')).toBeInTheDocument();
    });

    // PlanView is blocked
    expect(screen.queryByTestId('plan-view')).not.toBeInTheDocument();
  });

  it('tapping member card unlocks PlanView and displays active member in AppHeader', async () => {
    const user = userEvent.setup();
    render(
      <App
        storage={storage}
        dishRepository={dishRepo}
        planRepository={planRepo}
        memberRepository={memberRepo}
      />
    );

    await waitFor(() => {
      expect(screen.getByTestId('member-select-modal')).toBeInTheDocument();
      expect(screen.getByText('Mẹ Bắp')).toBeInTheDocument();
    });

    // Tap member card for "Mẹ Bắp"
    const memberCard = screen.getByText('Mẹ Bắp');
    await user.click(memberCard);

    // Modal is dismissed, PlanView is unlocked
    await waitFor(() => {
      expect(screen.queryByTestId('member-select-modal')).not.toBeInTheDocument();
    });
    expect(screen.getByTestId('plan-view')).toBeInTheDocument();

    // AppHeader displays active member name and avatar icon
    expect(screen.getByTestId('nickname-badge')).toHaveTextContent('• Mẹ Bắp');
    expect(screen.getByTestId('active-member-avatar')).toHaveTextContent('🍳');
  });

  it('adding a comment attributes author_nickname to active member', async () => {
    const user = userEvent.setup();
    render(
      <App
        storage={storage}
        dishRepository={dishRepo}
        planRepository={planRepo}
        memberRepository={memberRepo}
      />
    );

    // Select "Bố Tuấn"
    await waitFor(() => {
      expect(screen.getByText('Bố Tuấn')).toBeInTheDocument();
    });
    await user.click(screen.getByText('Bố Tuấn'));

    await waitFor(() => {
      expect(screen.getByTestId('plan-view')).toBeInTheDocument();
    });

    // Open dish detail
    const dishCard = screen.getByTestId('plan-dish-card-trigger-Thịt kho tàu');
    await user.click(dishCard);

    // Wait for dish drawer and comment input
    await waitFor(() => {
      expect(screen.getByTestId('comment-input')).toBeInTheDocument();
    });

    // Enter comment and submit
    const commentInput = screen.getByTestId('comment-input');
    await user.type(commentInput, 'Bố nhớ mua thêm trứng nhé');

    const sendCommentBtn = screen.getByTestId('send-comment-btn');
    await user.click(sendCommentBtn);

    // Comment appears with author "Bố Tuấn"
    await waitFor(() => {
      expect(screen.getByText('Bố nhớ mua thêm trứng nhé')).toBeInTheDocument();
    });
    expect(screen.getByText('Bố Tuấn')).toBeInTheDocument();
  });

  it('reloading or remounting App resets activeMember to null and re-prompts member selection modal', async () => {
    const user = userEvent.setup();
    const { unmount } = render(
      <App
        storage={storage}
        dishRepository={dishRepo}
        planRepository={planRepo}
        memberRepository={memberRepo}
      />
    );

    // Select "Mẹ Bắp"
    await waitFor(() => {
      expect(screen.getByText('Mẹ Bắp')).toBeInTheDocument();
    });
    await user.click(screen.getByText('Mẹ Bắp'));
    expect(screen.getByTestId('plan-view')).toBeInTheDocument();

    // Simulate page reload / new session by unmounting and re-rendering
    unmount();

    render(
      <App
        storage={storage}
        dishRepository={dishRepo}
        planRepository={planRepo}
        memberRepository={memberRepo}
      />
    );

    // Member selection modal is displayed again!
    await waitFor(() => {
      expect(screen.getByTestId('member-select-modal')).toBeInTheDocument();
    });
    expect(screen.getByText('Ai đang vào bếp?')).toBeInTheDocument();
    expect(screen.queryByTestId('plan-view')).not.toBeInTheDocument();
  });

  describe('Add New Member via Bottom Drawer Integration (Ticket 02)', () => {
    it('tapping "➕ Thêm thành viên mới" opens drawer, submitting persists member, displays on grid, and allows entering Weekly Plan', async () => {
      const user = userEvent.setup();
      render(
        <App
          storage={storage}
          dishRepository={dishRepo}
          planRepository={planRepo}
          memberRepository={memberRepo}
        />
      );

      await waitFor(() => {
        expect(screen.getByTestId('member-select-modal')).toBeInTheDocument();
      });

      // Tapping "➕ Thêm thành viên mới" opens MemberDrawer
      const addBtn = screen.getByTestId('open-add-member-drawer');
      expect(addBtn).toBeInTheDocument();
      await user.click(addBtn);

      expect(screen.getByTestId('member-drawer')).toBeInTheDocument();
      expect(screen.getByText('Thêm Thành Viên Mới')).toBeInTheDocument();

      // Enter name "Bé An" and choose preset 🥑
      const nameInput = screen.getByTestId('member-name-input');
      await user.type(nameInput, 'Bé An');
      await user.click(screen.getByTestId('avatar-preset-🥑'));

      // Submit new member
      await user.click(screen.getByTestId('save-member-btn'));

      // Drawer closes, new member is on grid
      await waitFor(() => {
        expect(screen.queryByTestId('member-drawer')).not.toBeInTheDocument();
      });
      expect(screen.getByText('Bé An')).toBeInTheDocument();
      expect(screen.getByText('🥑')).toBeInTheDocument();

      // Persisted to repository
      const membersInDb = await memberRepo.getMembers(householdCode);
      const created = membersInDb.find((m) => m.name === 'Bé An');
      expect(created).toBeDefined();
      expect(created?.avatarIcon).toBe('🥑');

      // Tapping newly added member enters Weekly Plan as that member
      await user.click(screen.getByText('Bé An'));

      await waitFor(() => {
        expect(screen.queryByTestId('member-select-modal')).not.toBeInTheDocument();
      });
      expect(screen.getByTestId('plan-view')).toBeInTheDocument();
      expect(screen.getByTestId('nickname-badge')).toHaveTextContent('• Bé An');
      expect(screen.getByTestId('active-member-avatar')).toHaveTextContent('🥑');
    });

    it('shows error when submitting duplicate or empty name in drawer', async () => {
      const user = userEvent.setup();
      render(
        <App
          storage={storage}
          dishRepository={dishRepo}
          planRepository={planRepo}
          memberRepository={memberRepo}
        />
      );

      await waitFor(() => {
        expect(screen.getByTestId('member-select-modal')).toBeInTheDocument();
      });

      await user.click(screen.getByTestId('open-add-member-drawer'));
      expect(screen.getByTestId('member-drawer')).toBeInTheDocument();

      // Empty name submit
      const saveBtn = screen.getByTestId('save-member-btn');
      await user.click(saveBtn);

      expect(screen.getByTestId('member-name-error')).toBeInTheDocument();
      expect(screen.getByTestId('member-name-error')).toHaveTextContent(/Vui lòng nhập tên thành viên/i);

      // Duplicate name submit (case-insensitive)
      const nameInput = screen.getByTestId('member-name-input');
      await user.type(nameInput, '   mẹ bắp   ');
      await user.click(saveBtn);

      expect(screen.getByTestId('member-name-error')).toBeInTheDocument();
      expect(screen.getByTestId('member-name-error')).toHaveTextContent(/đã tồn tại|đã có trong gia đình/i);

      // Ensure drawer is still open and duplicate was not added
      expect(screen.getByTestId('member-drawer')).toBeInTheDocument();
      const currentList = await memberRepo.getMembers(householdCode);
      expect(currentList.filter((m) => m.name.toLowerCase() === 'mẹ bắp')).toHaveLength(1);
    });
  });

  describe('Member Management Mode Integration (Ticket 03)', () => {
    it('toggles manage mode, edits member name and avatar, and verifies update in weekly plan', async () => {
      const user = userEvent.setup();
      render(
        <App
          storage={storage}
          dishRepository={dishRepo}
          planRepository={planRepo}
          memberRepository={memberRepo}
        />
      );

      await waitFor(() => {
        expect(screen.getByTestId('member-select-modal')).toBeInTheDocument();
      });

      // Toggle manage mode
      const toggleBtn = screen.getByTestId('toggle-manage-mode');
      await user.click(toggleBtn);
      expect(toggleBtn).toHaveTextContent('Xong');

      // Member cards should have wiggle effect
      const members = await memberRepo.getMembers(householdCode);
      const meBap = members.find((m) => m.name === 'Mẹ Bắp')!;
      const card = screen.getByTestId(`member-card-${meBap.id}`);
      expect(card.className).toContain('animate-wiggle');

      // Click card to open edit drawer
      await user.click(card);
      expect(screen.getByTestId('member-drawer')).toBeInTheDocument();
      expect(screen.getByText('Chỉnh Sửa Thành Viên')).toBeInTheDocument();

      const nameInput = screen.getByTestId('member-name-input');
      expect(nameInput).toHaveValue('Mẹ Bắp');

      // Update name to "Mẹ Yêu" and select pizza preset 🍕
      await user.clear(nameInput);
      await user.type(nameInput, 'Mẹ Yêu');
      await user.click(screen.getByTestId('avatar-preset-🍕'));

      // Save
      await user.click(screen.getByTestId('save-member-btn'));

      // Drawer closes, grid updates
      await waitFor(() => {
        expect(screen.queryByTestId('member-drawer')).not.toBeInTheDocument();
      });
      expect(screen.getByText('Mẹ Yêu')).toBeInTheDocument();
      expect(screen.getByText('🍕')).toBeInTheDocument();

      // Verified in repository
      const updatedRepoMembers = await memberRepo.getMembers(householdCode);
      const updatedMember = updatedRepoMembers.find((m) => m.id === meBap.id);
      expect(updatedMember?.name).toBe('Mẹ Yêu');
      expect(updatedMember?.avatarIcon).toBe('🍕');

      // Turn off manage mode
      await user.click(screen.getByTestId('toggle-manage-mode'));

      // Select "Mẹ Yêu" to enter Weekly Plan
      await user.click(screen.getByText('Mẹ Yêu'));
      await waitFor(() => {
        expect(screen.queryByTestId('member-select-modal')).not.toBeInTheDocument();
      });
      expect(screen.getByTestId('plan-view')).toBeInTheDocument();
      expect(screen.getByTestId('nickname-badge')).toHaveTextContent('• Mẹ Yêu');
      expect(screen.getByTestId('active-member-avatar')).toHaveTextContent('🍕');
    });

    it('deletes a member when multiple exist and verifies removal from list', async () => {
      const user = userEvent.setup();
      render(
        <App
          storage={storage}
          dishRepository={dishRepo}
          planRepository={planRepo}
          memberRepository={memberRepo}
        />
      );

      await waitFor(() => {
        expect(screen.getByTestId('member-select-modal')).toBeInTheDocument();
      });

      // Toggle manage mode
      await user.click(screen.getByTestId('toggle-manage-mode'));

      const members = await memberRepo.getMembers(householdCode);
      const boTuan = members.find((m) => m.name === 'Bố Tuấn')!;
      const deleteBtn = screen.getByTestId(`delete-member-${boTuan.id}`);

      // Click delete button
      await user.click(deleteBtn);

      // Confirm modal appears
      expect(screen.getByTestId('confirm-delete-modal')).toBeInTheDocument();
      expect(screen.getByText(/"Bố Tuấn"/i)).toBeInTheDocument();

      // Confirm delete
      await user.click(screen.getByTestId('confirm-delete-member-btn'));

      // Modal closes, "Bố Tuấn" removed from UI
      await waitFor(() => {
        expect(screen.queryByTestId('confirm-delete-modal')).not.toBeInTheDocument();
      });
      expect(screen.queryByText('Bố Tuấn')).not.toBeInTheDocument();

      // Removed from repository
      const remaining = await memberRepo.getMembers(householdCode);
      expect(remaining.some((m) => m.id === boTuan.id)).toBe(false);
      expect(remaining).toHaveLength(1);
    });

    it('blocks deletion when only 1 member remains', async () => {
      const user = userEvent.setup();

      // Leave only 1 member in repo
      const members = await memberRepo.getMembers(householdCode);
      const boTuan = members.find((m) => m.name === 'Bố Tuấn')!;
      await memberRepo.deleteMember(boTuan.id, householdCode);

      render(
        <App
          storage={storage}
          dishRepository={dishRepo}
          planRepository={planRepo}
          memberRepository={memberRepo}
        />
      );

      await waitFor(() => {
        expect(screen.getByTestId('member-select-modal')).toBeInTheDocument();
      });

      // Toggle manage mode
      await user.click(screen.getByTestId('toggle-manage-mode'));

      const meBap = members.find((m) => m.name === 'Mẹ Bắp')!;
      const deleteBtn = screen.getByTestId(`delete-member-${meBap.id}`);

      // Attempt to delete last remaining member
      await user.click(deleteBtn);

      // Safety warning dialog appears
      expect(screen.getByTestId('delete-blocked-modal')).toBeInTheDocument();
      expect(screen.getByText(/Gia đình phải có ít nhất 1 thành viên/i)).toBeInTheDocument();
      expect(screen.queryByTestId('confirm-delete-modal')).not.toBeInTheDocument();

      // Dismiss dialog
      await user.click(screen.getByTestId('close-delete-blocked-btn'));
      expect(screen.queryByTestId('delete-blocked-modal')).not.toBeInTheDocument();

      // Member still exists
      expect(screen.getByText('Mẹ Bắp')).toBeInTheDocument();
      const currentMembers = await memberRepo.getMembers(householdCode);
      expect(currentMembers).toHaveLength(1);
    });

    it('preserves past plan comments authored by a deleted member', async () => {
      const user = userEvent.setup();

      // Pre-seed a comment authored by "Bố Tuấn" on the dinner dish
      const items = await planRepo.getPlanItems(householdCode, today, today);
      await planRepo.addComment(
        householdCode,
        items[0].id,
        'Bố Tuấn',
        'Bố đã mua đủ gia vị cho món này rồi nhé!'
      );

      render(
        <App
          storage={storage}
          dishRepository={dishRepo}
          planRepository={planRepo}
          memberRepository={memberRepo}
        />
      );

      await waitFor(() => {
        expect(screen.getByTestId('member-select-modal')).toBeInTheDocument();
      });

      // Switch to manage mode and delete "Bố Tuấn"
      await user.click(screen.getByTestId('toggle-manage-mode'));
      const members = await memberRepo.getMembers(householdCode);
      const boTuan = members.find((m) => m.name === 'Bố Tuấn')!;
      await user.click(screen.getByTestId(`delete-member-${boTuan.id}`));
      await user.click(screen.getByTestId('confirm-delete-member-btn'));

      await waitFor(() => {
        expect(screen.queryByText('Bố Tuấn')).not.toBeInTheDocument();
      });

      // Switch off manage mode
      await user.click(screen.getByTestId('toggle-manage-mode'));

      // Enter weekly plan as "Mẹ Bắp"
      await user.click(screen.getByText('Mẹ Bắp'));
      await waitFor(() => {
        expect(screen.getByTestId('plan-view')).toBeInTheDocument();
      });

      // Open the dish detail drawer for "Thịt kho tàu"
      const dishCard = screen.getByTestId('plan-dish-card-trigger-Thịt kho tàu');
      await user.click(dishCard);

      // Verify Dish Detail Drawer is open
      await waitFor(() => {
        expect(screen.getByTestId('dish-detail-drawer')).toBeInTheDocument();
      });

      // Verify the past comment authored by deleted member "Bố Tuấn" is still present
      expect(screen.getByText('Bố đã mua đủ gia vị cho món này rồi nhé!')).toBeInTheDocument();
      expect(screen.getByText('Bố Tuấn')).toBeInTheDocument();
    });
  });

  describe('Onboarding Integration and Realtime Multi-Device Sync (Ticket 04)', () => {
    it('creates first member and enters Weekly Plan view immediately upon completing new household onboarding', async () => {
      const user = userEvent.setup();
      const freshStorage = new InMemoryHouseholdStorage();
      const freshMemberRepo = new InMemoryMemberRepository();

      const { unmount } = render(
        <App
          storage={freshStorage}
          memberRepository={freshMemberRepo}
        />
      );

      // Onboarding modal is open
      expect(screen.getByText('Bếp Gia Đình')).toBeInTheDocument();
      await user.click(screen.getByTestId('create-household-button'));

      // Enter founding member name
      const codeDisplay = screen.getByTestId('generated-code-display');
      const generatedCode = codeDisplay.textContent?.trim() || '';
      expect(generatedCode).toMatch(/^BEP-\d{3}$/);

      const nameInput = screen.getByTestId('nickname-input');
      await user.type(nameInput, 'Bà Cố');
      await user.click(screen.getByTestId('confirm-create-button'));

      // Complete and enter
      await user.click(screen.getByTestId('enter-app-button'));

      // App is unlocked in Weekly Plan view as "Bà Cố"
      await waitFor(() => {
        expect(screen.getByTestId('plan-view')).toBeInTheDocument();
      });
      expect(screen.getByTestId('household-code-badge')).toHaveTextContent(`Mã: ${generatedCode}`);
      expect(screen.getByTestId('nickname-badge')).toHaveTextContent('• Bà Cố');
      expect(screen.getByTestId('active-member-avatar')).toHaveTextContent('🍳');

      // Member is persisted in repository with default preset 🍳
      const members = await freshMemberRepo.getMembers(generatedCode);
      expect(members).toHaveLength(1);
      expect(members[0].name).toBe('Bà Cố');
      expect(members[0].avatarIcon).toBe('🍳');
      expect(members[0].avatarColor).toBe('bg-[#FEF7DC]');

      // Opening in new session (simulating page reload) shows "Bà Cố" in MemberSelectModal
      unmount();
      render(
        <App
          storage={freshStorage}
          memberRepository={freshMemberRepo}
        />
      );

      await waitFor(() => {
        expect(screen.getByTestId('member-select-modal')).toBeInTheDocument();
      });
      expect(screen.getByText('Bà Cố')).toBeInTheDocument();
      expect(screen.getByText('🍳')).toBeInTheDocument();
    });

    it('joining via share link ?join=CODE transitions directly to MemberSelectModal with household members', async () => {
      const user = userEvent.setup();
      const freshStorage = new InMemoryHouseholdStorage();
      const freshMemberRepo = new InMemoryMemberRepository([
        {
          id: 'mem_1',
          householdCode: 'BEP-555',
          name: 'Bố Hoàng',
          avatarIcon: '🍜',
          avatarColor: 'bg-[#E0F2FE]',
          createdAt: new Date().toISOString(),
        },
        {
          id: 'mem_2',
          householdCode: 'BEP-555',
          name: 'Mẹ Hằng',
          avatarIcon: '🥑',
          avatarColor: 'bg-[#ECFCCB]',
          createdAt: new Date().toISOString(),
        },
      ]);

      render(
        <App
          storage={freshStorage}
          memberRepository={freshMemberRepo}
          initialUrl="?join=BEP-555"
        />
      );

      // Directly shows MemberSelectModal without forcing nickname input
      await waitFor(() => {
        expect(screen.getByTestId('member-select-modal')).toBeInTheDocument();
      });
      expect(screen.getByText('Ai đang vào bếp?')).toBeInTheDocument();
      expect(screen.getByText('Mã: BEP-555')).toBeInTheDocument();
      expect(screen.getByText('Bố Hoàng')).toBeInTheDocument();
      expect(screen.getByText('Mẹ Hằng')).toBeInTheDocument();

      // Tap card to enter Weekly Plan
      await user.click(screen.getByText('Mẹ Hằng'));
      await waitFor(() => {
        expect(screen.getByTestId('plan-view')).toBeInTheDocument();
      });
      expect(screen.getByTestId('nickname-badge')).toHaveTextContent('• Mẹ Hằng');
      expect(screen.getByTestId('active-member-avatar')).toHaveTextContent('🥑');
    });

    it('updates member list on MemberSelectModal in realtime without page reload when another device modifies members', async () => {
      let triggerSubscriber: (() => void) | null = null;
      const initialMember = {
        id: 'mem_1',
        householdCode: 'BEP-892',
        name: 'Mẹ Bắp',
        avatarIcon: '🍳',
        avatarColor: 'bg-[#FEF7DC]',
        createdAt: new Date().toISOString(),
      };

      const freshMemberRepo = new InMemoryMemberRepository([initialMember]);
      freshMemberRepo.subscribe = vi.fn().mockImplementation((_code, cb) => {
        triggerSubscriber = cb;
        return () => {
          triggerSubscriber = null;
        };
      });

      render(
        <App
          storage={storage}
          dishRepository={dishRepo}
          planRepository={planRepo}
          memberRepository={freshMemberRepo}
        />
      );

      await waitFor(() => {
        expect(screen.getByTestId('member-select-modal')).toBeInTheDocument();
      });
      expect(screen.getByText('Mẹ Bắp')).toBeInTheDocument();
      expect(screen.queryByText('Em Tí')).not.toBeInTheDocument();

      // Another device adds "Em Tí" (🍰)
      await freshMemberRepo.addMember({
        householdCode: 'BEP-892',
        name: 'Em Tí',
        avatarIcon: '🍰',
        avatarColor: 'bg-[#FCE7F3]',
      });

      // Fire realtime websocket event
      act(() => {
        if (triggerSubscriber) {
          triggerSubscriber();
        }
      });

      // MemberSelectModal automatically displays "Em Tí"
      await waitFor(() => {
        expect(screen.getByText('Em Tí')).toBeInTheDocument();
      });
      expect(screen.getByText('🍰')).toBeInTheDocument();
    });
  });
});
