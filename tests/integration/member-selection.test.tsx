import { describe, it, expect, vi } from 'vitest';
import { render, screen, act, within, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { App } from '../../src/App';
import { InMemoryHouseholdStorage } from '../../src/services/storage';
import { InMemoryDishRepository } from '../../src/services/dishRepository';
import { InMemoryPlanRepository } from '../../src/services/planRepository';
import { TestMemberRepository, sampleMember, deferred } from '../support/memberRepository';
import { Member } from '../../src/domain/member';
import { createMemberRepository } from '../../src/services/repositoryFactory';
import { formatDateToISO } from '../../src/domain/plan';

describe('Explicit Thành viên selection through App', () => {
  it('remembers Gia đình but blocks cooking content until a Thành viên is chosen', async () => {
    const storage = new InMemoryHouseholdStorage('BEP-123', 'Old nickname');
    const memberRepository = {
      getMembers: async () => [{ id: 'me', householdCode: 'BEP-123', name: 'Mẹ', createdAt: '2026-10-08T00:00:00Z' }],
      addMember: async () => { throw new Error('unused'); },
      deleteMember: async () => {},
      subscribe: () => () => {},
    };
    render(<App storage={storage} memberRepository={memberRepository} dishRepository={new InMemoryDishRepository()} planRepository={new InMemoryPlanRepository()} />);
    expect(screen.queryByTestId('plan-view')).not.toBeInTheDocument();
    expect(screen.queryByTestId('nav-menu-button')).not.toBeInTheDocument();
    expect(await screen.findByRole('heading', { name: 'Bạn là ai?' })).toBeInTheDocument();
    expect(screen.getByText('BEP-123')).toBeInTheDocument();
    await userEvent.click(await screen.findByRole('button', { name: 'Chọn Mẹ' }));
    expect(screen.getByTestId('plan-view')).toBeInTheDocument();
    expect(screen.getByTestId('member-name-badge')).toHaveTextContent('Mẹ');
  });
  it('reloads the confirmed database after saving so a superseded refresh cannot hide a concurrent addition', async () => {
    const repository = new TestMemberRepository([sampleMember()]);
    const get = repository.getMembers.bind(repository);
    const insert = repository.addMember.bind(repository);
    const stale = deferred<Member[]>();
    const saving = deferred<Member>();
    repository.getMembers = vi.fn().mockImplementationOnce(get).mockReturnValue(stale.promise);
    repository.addMember = () => saving.promise;
    render(<App storage={new InMemoryHouseholdStorage('BEP-123')} memberRepository={repository} />);
    await userEvent.click(await screen.findByRole('button', { name: '+ Thêm thành viên' }));
    await userEvent.type(screen.getByRole('textbox', { name: 'Tên Thành viên' }), 'An');
    await userEvent.click(screen.getByRole('button', { name: 'Lưu Thành viên' }));
    let confirmed!: Member;
    await act(async () => { await insert('BEP-123', 'Bố'); confirmed = await insert('BEP-123', 'An'); });
    repository.getMembers = get;
    await act(async () => saving.resolve(confirmed));
    expect(await screen.findByRole('button', { name: 'Chọn Bố' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Chọn An' })).toBeInTheDocument();
    await act(async () => stale.resolve([sampleMember()]));
    expect(screen.getByRole('button', { name: 'Chọn Bố' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Chọn An' })).toBeInTheDocument();
  });
  it('preserves shared cooking data and old author names after deletion, while new comments use the selected Thành viên', async () => {
    const members = new TestMemberRepository([sampleMember('Mẹ'), sampleMember('Bố')]);
    const dishes = new InMemoryDishRepository();
    const plans = new InMemoryPlanRepository();
    const dish = await dishes.addDish('BEP-123', { name: 'Canh chua', tag: 'Canh' });
    const [item] = await plans.addDishesToMeal('BEP-123', formatDateToISO(new Date()), 'dinner', [dish.id]);
    await plans.addComment('BEP-123', item.id, 'Mẹ', 'Bình luận cũ');
    render(<App storage={new InMemoryHouseholdStorage('BEP-123', 'Legacy')} memberRepository={members} dishRepository={dishes} planRepository={plans} />);
    await userEvent.click(await screen.findByRole('button', { name: 'Xóa' }));
    await userEvent.click(screen.getByRole('button', { name: 'Xóa Mẹ' }));
    await userEvent.click(screen.getByRole('button', { name: 'Xóa thành viên', exact: true }));
    await userEvent.click(await screen.findByRole('button', { name: 'Xong' }));
    await userEvent.click(screen.getByRole('button', { name: 'Chọn Bố' }));
    await userEvent.click(await screen.findByTestId('plan-dish-card-trigger-Canh chua'));
    expect(await screen.findByText('Bình luận cũ')).toBeInTheDocument();
    await userEvent.type(screen.getByTestId('comment-input'), 'Cho ít muối');
    await userEvent.click(screen.getByTestId('send-comment-btn'));
    expect(await screen.findByText('Cho ít muối')).toBeInTheDocument();
    expect(screen.getAllByTestId('comment-author').map(element => element.textContent)).toEqual(['Mẹ', 'Bố']);
    expect((await dishes.getDishes('BEP-123')).map(value => value.name)).toEqual(['Canh chua']);
    expect(await plans.getPlanItems('BEP-123', formatDateToISO(new Date()), formatDateToISO(new Date()))).toHaveLength(1);
    expect(await plans.getComments('BEP-123', item.id)).toHaveLength(2);
  });
  it('ignores a delayed save after entering a different Gia đình', async () => {
    const saving = deferred<Member>();
    const repository = new TestMemberRepository([sampleMember('An', 'BEP-999')]);
    repository.addMember = () => saving.promise;
    const storage = new InMemoryHouseholdStorage('BEP-123');
    const app = render(<App storage={storage} memberRepository={repository} />);
    await userEvent.click(await screen.findByRole('button', { name: '+ Thêm thành viên' }));
    await userEvent.type(screen.getByRole('textbox', { name: 'Tên Thành viên' }), 'Mẹ');
    await userEvent.click(screen.getByRole('button', { name: 'Lưu Thành viên' }));
    app.rerender(<App storage={storage} memberRepository={repository} initialUrl="?join=BEP-999" />);
    expect(await screen.findByRole('button', { name: 'Chọn An' })).toBeInTheDocument();
    await act(async () => saving.resolve(sampleMember()));
    expect(screen.queryByRole('button', { name: 'Chọn Mẹ' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Chọn An' })).toBeInTheDocument();
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });
  it('requires selection after reopening, preserves a running session, and keeps two tabs independent', async () => {
    const storage = new InMemoryHouseholdStorage('BEP-123', 'Legacy');
    const repository = new TestMemberRepository([sampleMember('Mẹ'), sampleMember('Bố')]);
    const first = render(<App storage={storage} memberRepository={repository} dishRepository={new InMemoryDishRepository()} planRepository={new InMemoryPlanRepository()} />);
    await userEvent.click(await within(first.container).findByRole('button', { name: 'Chọn Mẹ' }));
    const second = render(<App storage={storage} memberRepository={repository} dishRepository={new InMemoryDishRepository()} planRepository={new InMemoryPlanRepository()} />);
    expect(within(first.container).getByTestId('member-name-badge')).toHaveTextContent('Mẹ');
    expect(await within(second.container).findByRole('button', { name: 'Chọn Bố' })).toBeInTheDocument();
    await userEvent.click(within(second.container).getByRole('button', { name: 'Chọn Bố' }));
    await userEvent.click(within(first.container).getByTestId('nav-menu-button'));
    await act(async () => { window.dispatchEvent(new Event('focus')); document.dispatchEvent(new Event('visibilitychange')); });
    expect(within(first.container).getByTestId('member-name-badge')).toHaveTextContent('Mẹ');
    expect(within(second.container).getByTestId('member-name-badge')).toHaveTextContent('Bố');
    first.unmount(); second.unmount();
    render(<App storage={storage} memberRepository={repository} />);
    expect(await screen.findByRole('button', { name: 'Chọn Mẹ' })).toBeInTheDocument();
    expect(screen.queryByTestId('plan-view')).not.toBeInTheDocument();
    expect(storage.getNickname()).toBe('Legacy');
  });
  it('keeps the database step blocked when Supabase is unavailable instead of restoring local identity', async () => {
    render(<App storage={new InMemoryHouseholdStorage('BEP-123', 'Legacy')} memberRepository={createMemberRepository(null)} />);
    expect(await screen.findByRole('alert')).toHaveTextContent('Chưa kết nối database');
    expect(screen.getByRole('button', { name: 'Thử lại' })).toBeInTheDocument();
    expect(screen.queryByTestId('plan-view')).not.toBeInTheDocument();
    expect(screen.queryByTestId('nav-menu-button')).not.toBeInTheDocument();
  });
  it('retains a failed deletion for retry and deleting the last Thành viên keeps Gia đình usable', async () => {
    const storage = new InMemoryHouseholdStorage('BEP-123');
    const repository = new TestMemberRepository([sampleMember()]);
    const remove = repository.deleteMember.bind(repository);
    repository.deleteMember = vi.fn().mockRejectedValueOnce(new Error('Thiếu quyền, hãy thử lại')).mockImplementation(remove);
    render(<App storage={storage} memberRepository={repository} />);
    await userEvent.click(await screen.findByRole('button', { name: 'Xóa' }));
    await userEvent.click(screen.getByRole('button', { name: 'Xóa Mẹ' }));
    await userEvent.click(screen.getByRole('button', { name: 'Xóa thành viên', exact: true }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Thiếu quyền');
    expect((await repository.getMembers('BEP-123')).map(member => member.name)).toEqual(['Mẹ']);
    await userEvent.click(screen.getByRole('button', { name: 'Xóa thành viên', exact: true }));
    expect(await screen.findByText('Cả nhà bắt đầu từ bạn')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Xóa', exact: true })).toBeDisabled();
    expect(screen.getByRole('button', { name: '+ Thêm thành viên' })).toBeEnabled();
    expect(screen.getByText('BEP-123')).toBeInTheDocument();
    expect(storage.getHouseholdCode()).toBe('BEP-123');
  });
  it('ignores superseded loads and events from a previous Gia đình', async () => {
    const old = deferred<Member[]>();
    const stale = deferred<Member[]>();
    let oldEvent = () => {};
    let currentEvent = () => {};
    const repository = new TestMemberRepository();
    repository.getMembers = vi.fn().mockImplementation((code: string) => code === 'BEP-123' ? old.promise : Promise.resolve([sampleMember('An', 'BEP-999')]));
    repository.subscribe = (code, callback) => { if (code === 'BEP-123') oldEvent = callback; else currentEvent = callback; return () => {}; };
    const storage = new InMemoryHouseholdStorage('BEP-123');
    const app = render(<App storage={storage} memberRepository={repository} />);
    app.rerender(<App storage={storage} memberRepository={repository} initialUrl="?join=BEP-999" />);
    expect(await screen.findByRole('button', { name: 'Chọn An' })).toBeInTheDocument();
    await act(async () => { old.resolve([sampleMember('Mẹ')]); oldEvent(); });
    expect(screen.queryByRole('button', { name: 'Chọn Mẹ' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Chọn An' })).toBeInTheDocument();
    repository.getMembers = vi.fn().mockReturnValueOnce(stale.promise).mockResolvedValue([sampleMember('Bố', 'BEP-999')]);
    await act(async () => { currentEvent(); currentEvent(); });
    expect(await screen.findByRole('button', { name: 'Chọn Bố' })).toBeInTheDocument();
    await act(async () => { stale.resolve([sampleMember('An', 'BEP-999')]); });
    expect(screen.queryByRole('button', { name: 'Chọn An' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Chọn Bố' })).toBeInTheDocument();
  });
  it('reloads additions and deletions from another device without duplicates or other Gia đình', async () => {
    const repository = new TestMemberRepository([sampleMember()]);
    render(<App storage={new InMemoryHouseholdStorage('BEP-123')} memberRepository={repository} />);
    expect(await screen.findByRole('button', { name: 'Chọn Mẹ' })).toBeInTheDocument();
    let added!: Member;
    await act(async () => { added = await repository.addMember('BEP-123', 'Bố'); });
    expect(await screen.findByRole('button', { name: 'Chọn Bố' })).toBeInTheDocument();
    await act(async () => { repository.emit('BEP-123'); repository.emit('BEP-123'); await repository.addMember('BEP-999', 'Người khác'); });
    expect(screen.getAllByRole('button', { name: 'Chọn Bố' })).toHaveLength(1);
    expect(screen.queryByRole('button', { name: 'Chọn Người khác' })).not.toBeInTheDocument();
    await act(async () => { await repository.deleteMember('BEP-123', added.id); });
    expect(screen.queryByRole('button', { name: 'Chọn Bố' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Chọn Mẹ' })).toBeInTheDocument();
  });
  it('confirms the named Thành viên, preserves cancellation, and removes only after database confirmation', async () => {
    const repository = new TestMemberRepository([sampleMember('Mẹ'), sampleMember('Bố')]);
    const confirmation = deferred<void>();
    const remove = repository.deleteMember.bind(repository);
    repository.deleteMember = vi.fn(async (code, id) => { await confirmation.promise; await remove(code, id); });
    render(<App storage={new InMemoryHouseholdStorage('BEP-123')} memberRepository={repository} />);
    await userEvent.click(await screen.findByRole('button', { name: 'Xóa' }));
    await userEvent.click(screen.getByRole('button', { name: 'Xóa Mẹ' }));
    expect(screen.getByRole('dialog')).toHaveAccessibleName('Xóa Mẹ?');
    expect(screen.queryByTestId('plan-view')).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Giữ lại' }));
    expect((await repository.getMembers('BEP-123')).map(member => member.name)).toEqual(['Bố', 'Mẹ']);
    await userEvent.click(screen.getByRole('button', { name: 'Xóa Mẹ' }));
    await userEvent.dblClick(screen.getByRole('button', { name: 'Xóa thành viên', exact: true }));
    expect(repository.deleteMember).toHaveBeenCalledTimes(1);
    expect((await repository.getMembers('BEP-123')).map(member => member.name)).toEqual(['Bố', 'Mẹ']);
    await act(async () => confirmation.resolve());
    expect(await screen.findByRole('button', { name: 'Xóa Bố' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Xóa Mẹ' })).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Xong' }));
    expect(screen.getByRole('button', { name: 'Chọn Bố' })).toBeInTheDocument();
  });
  it('validates names before sending and retains input after a failed confirmed save', async () => {
    const repository = new TestMemberRepository([sampleMember()]);
    const save = deferred<Member>();
    repository.addMember = vi.fn().mockReturnValue(save.promise);
    render(<App storage={new InMemoryHouseholdStorage('BEP-123')} memberRepository={repository} />);
    await userEvent.click(await screen.findByRole('button', { name: '+ Thêm thành viên' }));
    const input = screen.getByRole('textbox', { name: 'Tên Thành viên' });
    const submit = screen.getByRole('button', { name: 'Lưu Thành viên' });
    await userEvent.click(submit);
    expect(screen.getByRole('alert')).toHaveTextContent('1 đến 30');
    await userEvent.type(input, '  mẹ ');
    await userEvent.click(submit);
    expect(screen.getByRole('alert')).toHaveTextContent('đã có trong Gia đình');
    await userEvent.clear(input);
    await userEvent.type(input, 'a'.repeat(31));
    await userEvent.click(submit);
    expect(screen.getByRole('alert')).toHaveTextContent('1 đến 30');
    await userEvent.clear(input);
    await userEvent.type(input, 'Bố');
    await userEvent.dblClick(submit);
    expect(repository.addMember).toHaveBeenCalledTimes(1);
    expect(submit).toBeDisabled();
    expect(screen.queryByRole('button', { name: 'Chọn Bố' })).not.toBeInTheDocument();
    await act(async () => save.reject(new Error('Mất kết nối, hãy thử lại.')));
    expect(input).toHaveValue('Bố');
    expect(screen.getByRole('alert')).toHaveTextContent('Mất kết nối');
    expect(screen.getByRole('button', { name: 'Lưu Thành viên' })).toBeEnabled();
    expect(screen.queryByTestId('plan-view')).not.toBeInTheDocument();
  });
  it('adds a trimmed name at the end, keeps selection explicit, and never prefills the old nickname', async () => {
    const repository = new TestMemberRepository([sampleMember()]);
    render(<App storage={new InMemoryHouseholdStorage('BEP-123', 'Legacy')} memberRepository={repository} />);
    await userEvent.click(await screen.findByRole('button', { name: '+ Thêm thành viên' }));
    const input = screen.getByRole('textbox', { name: 'Tên Thành viên' });
    expect(input).toHaveValue('');
    await userEvent.type(input, '  Bố  ');
    await userEvent.click(screen.getByRole('button', { name: 'Lưu Thành viên' }));
    expect(await screen.findByRole('button', { name: 'Chọn Bố' })).toBeInTheDocument();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: /^Chọn / }).map(button => button.getAttribute('aria-label'))).toEqual(['Chọn Mẹ', 'Chọn Bố']);
    expect(screen.queryByTestId('plan-view')).not.toBeInTheDocument();
    expect((await repository.getMembers('BEP-123')).map(member => member.name)).toEqual(['Mẹ', 'Bố']);
  });
  it('keeps loading and failure distinct from an empty Gia đình and lets the user retry', async () => {
    const memberRepository = {
      getMembers: vi.fn().mockRejectedValueOnce(new Error('Mất kết nối')).mockResolvedValue([]),
      addMember: async () => { throw new Error('unused'); },
      deleteMember: async () => {},
      subscribe: () => () => {},
    };
    render(<App storage={new InMemoryHouseholdStorage('BEP-123')} memberRepository={memberRepository} />);
    expect(screen.getByRole('status')).toHaveTextContent('Đang tải');
    expect(await screen.findByRole('alert')).toHaveTextContent('Mất kết nối');
    expect(screen.queryByText('Cả nhà bắt đầu từ bạn')).not.toBeInTheDocument();
    expect(screen.queryByTestId('plan-view')).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Thử lại' }));
    expect(await screen.findByText('Cả nhà bắt đầu từ bạn')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '+ Thêm thành viên' })).toBeInTheDocument();
  });

  describe('Zero-Scroll and Adaptive Grid Layout (Ticket 01)', () => {
    it('enforces a zero-scroll flex structure and eliminates the scroll container', async () => {
      const repository = new TestMemberRepository([sampleMember('Mẹ'), sampleMember('Bố')]);
      render(<App storage={new InMemoryHouseholdStorage('BEP-123')} memberRepository={repository} />);

      expect(await screen.findByRole('heading', { name: 'Bạn là ai?' })).toBeInTheDocument();

      const root = screen.getByTestId('member-selection-root');
      expect(root).toHaveClass('member-selection');
      // Ensure no scroll container is present
      expect(document.querySelector('.ms-scroll')).not.toBeInTheDocument();
    });

    it('renders a 2-column grid and shows greeting art and footer quote for 1 to 4 members', async () => {
      const repository = new TestMemberRepository([
        sampleMember('Mẹ'),
        sampleMember('Bố'),
        sampleMember('An'),
        sampleMember('Linh'),
      ]);
      render(<App storage={new InMemoryHouseholdStorage('BEP-123')} memberRepository={repository} />);

      expect(await screen.findByRole('button', { name: 'Chọn Mẹ' })).toBeInTheDocument();

      const root = screen.getByTestId('member-selection-root');
      expect(root).not.toHaveAttribute('data-compact', 'true');

      const grid = screen.getByTestId('member-grid');
      expect(grid).toHaveAttribute('data-columns', '2');
      expect(grid).toHaveClass('ms-grid-cols-2');

      // Artwork, slogan, and footer quote are visible in 1-4 members mode
      expect(screen.getByTestId('ms-greeting-art')).toBeInTheDocument();
      expect(screen.getByText('BỮA CƠM NHÀ, CẢ NHÀ CÙNG LO')).toBeInTheDocument();
      expect(screen.getByText(/Cùng nhau, bữa cơm ngon hơn\./)).toBeInTheDocument();
    });

    it('switches to a 3-column grid and enables progressive compaction (hiding artwork and footer quote) for 5 to 6 members', async () => {
      const repository = new TestMemberRepository([
        sampleMember('Mẹ'),
        sampleMember('Bố'),
        sampleMember('An'),
        sampleMember('Linh'),
        sampleMember('Bà'),
      ]);
      render(<App storage={new InMemoryHouseholdStorage('BEP-123')} memberRepository={repository} />);

      expect(await screen.findByRole('button', { name: 'Chọn Bà' })).toBeInTheDocument();

      const root = screen.getByTestId('member-selection-root');
      expect(root).toHaveAttribute('data-compact', 'true');

      const grid = screen.getByTestId('member-grid');
      expect(grid).toHaveAttribute('data-columns', '3');
      expect(grid).toHaveClass('ms-grid-cols-3');

      // Artwork, slogan, and footer quote are hidden in compact mode
      expect(screen.queryByTestId('ms-greeting-art')).not.toBeInTheDocument();
      expect(screen.queryByText('BỮA CƠM NHÀ, CẢ NHÀ CÙNG LO')).not.toBeInTheDocument();
      expect(screen.queryByText(/Cùng nhau, bữa cơm ngon hơn\./)).not.toBeInTheDocument();
    });

    it('streamlines the "+ Thêm thành viên" button into a flat pill and removes the secondary caption', async () => {
      const repository = new TestMemberRepository([sampleMember('Mẹ')]);
      render(<App storage={new InMemoryHouseholdStorage('BEP-123')} memberRepository={repository} />);

      const addBtn = await screen.findByRole('button', { name: '+ Thêm thành viên' });
      expect(addBtn).toBeInTheDocument();
      expect(addBtn).toHaveClass('ms-add');

      // Secondary caption is removed
      expect(screen.queryByText('Mỗi người một tên. Cùng một căn bếp.')).not.toBeInTheDocument();

      // Clicking add button still opens the add modal
      await userEvent.click(addBtn);
      expect(screen.getByRole('dialog')).toHaveAccessibleName('Thêm thành viên');
      expect(screen.getByRole('textbox', { name: 'Tên Thành viên' })).toBeInTheDocument();
    });

    it('supports full interactive selection to enter PlanView from both 2-column and 3-column layouts', async () => {
      const repository = new TestMemberRepository([
        sampleMember('Mẹ'),
        sampleMember('Bố'),
        sampleMember('An'),
        sampleMember('Linh'),
        sampleMember('Bà'),
      ]);
      render(<App storage={new InMemoryHouseholdStorage('BEP-123')} memberRepository={repository} dishRepository={new InMemoryDishRepository()} planRepository={new InMemoryPlanRepository()} />);

      const memberBtn = await screen.findByRole('button', { name: 'Chọn Bà' });
      await userEvent.click(memberBtn);

      expect(screen.getByTestId('plan-view')).toBeInTheDocument();
      expect(screen.getByTestId('member-name-badge')).toHaveTextContent('Bà');
    });
  });

  describe('Six-Member Capacity Limit Enforcement (Ticket 02)', () => {
    it('enforces 6-member limit by replacing add button with capacity notice and restoring it after deletion', async () => {
      const repository = new TestMemberRepository([
        sampleMember('Mẹ'),
        sampleMember('Bố'),
        sampleMember('An'),
        sampleMember('Linh'),
        sampleMember('Bà'),
        sampleMember('Ông'),
      ]);
      render(<App storage={new InMemoryHouseholdStorage('BEP-123')} memberRepository={repository} />);

      expect(await screen.findByRole('button', { name: 'Chọn Ông' })).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: '+ Thêm thành viên' })).not.toBeInTheDocument();
      expect(screen.getByText('Đã đạt tối đa 6 Thành viên trong Gia đình')).toBeInTheDocument();

      // Delete one member to bring count to 5
      await userEvent.click(screen.getByRole('button', { name: 'Xóa' }));
      await userEvent.click(screen.getByRole('button', { name: 'Xóa Ông' }));
      await userEvent.click(screen.getByRole('button', { name: 'Xóa thành viên', exact: true }));
      await userEvent.click(await screen.findByRole('button', { name: 'Xong' }));

      // Button reappears automatically
      expect(screen.queryByText('Đã đạt tối đa 6 Thành viên trong Gia đình')).not.toBeInTheDocument();
      expect(await screen.findByRole('button', { name: '+ Thêm thành viên' })).toBeInTheDocument();
    });

    it('guards against concurrent submission exceeding 6 members through App', async () => {
      const repository = new TestMemberRepository([
        sampleMember('Mẹ'),
        sampleMember('Bố'),
        sampleMember('An'),
        sampleMember('Linh'),
        sampleMember('Bà'),
      ]);
      const addMemberSpy = vi.spyOn(repository, 'addMember');
      render(<App storage={new InMemoryHouseholdStorage('BEP-123')} memberRepository={repository} />);

      const addBtn = await screen.findByRole('button', { name: '+ Thêm thành viên' });
      await userEvent.click(addBtn);

      await userEvent.type(screen.getByRole('textbox', { name: 'Tên Thành viên' }), 'Cháu');

      // Concurrent race condition: 6th member added in background
      await act(async () => {
        await repository.addMember('BEP-123', 'Ông');
      });
      addMemberSpy.mockClear();

      await userEvent.click(screen.getByRole('button', { name: 'Lưu Thành viên' }));

      expect(await screen.findByRole('alert')).toHaveTextContent('Gia đình đã có tối đa 6 Thành viên.');
      expect(addMemberSpy).not.toHaveBeenCalled();
    });
  });

  describe('Floating Toast and Delete Management Mode Integration (Ticket 03)', () => {
    it('displays floating toast upon adding member and auto-dismisses after 3 seconds without pushing layout', async () => {
      vi.useFakeTimers();
      try {
        const repository = new TestMemberRepository([sampleMember('Mẹ')]);
        render(<App storage={new InMemoryHouseholdStorage('BEP-123')} memberRepository={repository} />);

        await act(async () => {
          await vi.advanceTimersByTimeAsync(50);
        });

        fireEvent.click(screen.getByRole('button', { name: '+ Thêm thành viên' }));
        fireEvent.change(screen.getByRole('textbox', { name: 'Tên Thành viên' }), { target: { value: 'Bố' } });
        fireEvent.click(screen.getByRole('button', { name: 'Lưu Thành viên' }));

        await act(async () => {
          await vi.advanceTimersByTimeAsync(50);
        });

        const toast = screen.getByRole('status');
        expect(toast).toHaveTextContent('Đã thêm Bố');
        expect(toast).toHaveClass('ms-toast');
        expect(toast).toHaveClass('ms-notice');

        // Advance 3000ms
        act(() => {
          vi.advanceTimersByTime(3100);
        });

        expect(screen.queryByRole('status')).not.toBeInTheDocument();
      } finally {
        vi.useRealTimers();
      }
    });

    it('hides add action area when delete mode is active and restores it when exiting in App', async () => {
      const repository = new TestMemberRepository([sampleMember('Mẹ'), sampleMember('Bố')]);
      render(<App storage={new InMemoryHouseholdStorage('BEP-123')} memberRepository={repository} />);

      expect(await screen.findByRole('button', { name: '+ Thêm thành viên' })).toBeInTheDocument();

      // Enter delete mode
      await userEvent.click(screen.getByRole('button', { name: 'Xóa' }));
      expect(screen.queryByRole('button', { name: '+ Thêm thành viên' })).not.toBeInTheDocument();
      expect(document.querySelector('.ms-add-area')).not.toBeInTheDocument();

      // Exit delete mode
      await userEvent.click(screen.getByRole('button', { name: 'Xong' }));
      expect(await screen.findByRole('button', { name: '+ Thêm thành viên' })).toBeInTheDocument();
      expect(document.querySelector('.ms-add-area')).toBeInTheDocument();
    });
  });
});



