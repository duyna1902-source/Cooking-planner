import { describe, it, expect, vi } from 'vitest';
import { render, screen, act, within } from '@testing-library/react';
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
    expect(screen.getByTestId('nickname-badge')).toHaveTextContent('Mẹ');
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
    expect(within(first.container).getByTestId('nickname-badge')).toHaveTextContent('Mẹ');
    expect(await within(second.container).findByRole('button', { name: 'Chọn Bố' })).toBeInTheDocument();
    await userEvent.click(within(second.container).getByRole('button', { name: 'Chọn Bố' }));
    await userEvent.click(within(first.container).getByTestId('nav-menu-button'));
    await act(async () => { window.dispatchEvent(new Event('focus')); document.dispatchEvent(new Event('visibilitychange')); });
    expect(within(first.container).getByTestId('nickname-badge')).toHaveTextContent('Mẹ');
    expect(within(second.container).getByTestId('nickname-badge')).toHaveTextContent('Bố');
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
});
