// THROWAWAY UI PROTOTYPE: Layout A was chosen; preview the corner action for deletion.
// /?prototype=members&variant=A. All sample data stays in memory.
import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { ArrowRight, Check, Home, Plus, Trash2, Users, UtensilsCrossed, X } from 'lucide-react';
import { BottomNav, type NavigationTab } from './BottomNav';
import './MemberSelection.prototype.css';

type Member = { id: number; name: string };
type ChoiceProps = { members: Member[]; onChoose: (member: Member) => void; isManaging: boolean; onDelete: (member: Member) => void };
const samples: Member[] = [{ id: 1, name: 'Mẹ' }, { id: 2, name: 'Bố' }, { id: 3, name: 'An' }, { id: 4, name: 'Linh' }];
const tones = [
  { background: '#dce7ef', color: '#46637d', accent: '#bfd1df' },
  { background: '#f9efcc', color: '#897443', accent: '#efdfa7' },
  { background: '#e2ebe2', color: '#597460', accent: '#c9dccb' },
  { background: '#ebe4f1', color: '#806c91', accent: '#d6c9e4' },
];

function Avatar({ member, index = 0 }: { member: Member; index?: number }) {
  const tone = tones[index % tones.length];
  return <span className="mp-avatar" style={{ '--avatar-bg': tone.background, '--avatar-ink': tone.color, '--avatar-accent': tone.accent } as CSSProperties} aria-hidden="true">
    <span className="mp-avatar-letter">{Array.from(member.name)[0]?.toLocaleUpperCase('vi')}</span>
    <span className="mp-avatar-dot" />
  </span>;
}

export function VariantA({ members, onChoose, isManaging, onDelete }: ChoiceProps) {
  return <div className={`mp-grid ${isManaging ? 'mp-grid-managing' : ''}`}>
    {members.map((member, index) => <button className="mp-grid-member" key={member.id} onClick={() => isManaging ? onDelete(member) : onChoose(member)} aria-label={`${isManaging ? 'Xóa' : 'Chọn'} ${member.name}`}>
      <span className="mp-avatar-wrapper"><Avatar member={member} index={index} />{isManaging && <span className="mp-delete-mark" aria-hidden="true"><Trash2 size={13} strokeWidth={1.8} /></span>}</span>
      <span className="mp-member-name">{member.name}</span>
    </button>)}
  </div>;
}

export default function MemberSelectionPrototype() {
  const [members, setMembers] = useState<Member[]>(samples);
  const [selected, setSelected] = useState<Member | null>(null);
  const [tab, setTab] = useState<NavigationTab>('plan');
  const [isAdding, setIsAdding] = useState(false);
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [isChangingHousehold, setIsChangingHousehold] = useState(false);
  const [household, setHousehold] = useState('BEP-892');
  const [newCode, setNewCode] = useState('');
  const [isManaging, setIsManaging] = useState(false);
  const [memberToDelete, setMemberToDelete] = useState<Member | null>(null);
  const nextId = useRef(5);

  useEffect(() => {
    document.title = 'Chọn Thành viên · Bản xem trước';
    const handleKey = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      if (memberToDelete) setMemberToDelete(null);
      else if (isAdding) setIsAdding(false);
      else if (isChangingHousehold) setIsChangingHousehold(false);
      else setIsManaging(false);
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [memberToDelete, isAdding, isChangingHousehold]);

  const choose = (member: Member) => { setSelected(member); setTab('plan'); setNotice(''); };
  const openAdd = () => { setName(''); setError(''); setIsAdding(true); setIsManaging(false); setNotice(''); };
  const reset = (empty: boolean) => {
    setMembers(empty ? [] : samples);
    setHousehold('BEP-892');
    setSelected(null);
    setIsAdding(false);
    setIsChangingHousehold(false);
    setIsManaging(false);
    setMemberToDelete(null);
    setNotice('');
    nextId.current = 5;
  };

  return <div className="member-prototype">
    <header className="mp-lab-header">
      <div><p className="mp-lab-eyebrow">BẢN XEM TRƯỚC · CHỌN THÀNH VIÊN</p><p className="mp-lab-description">Bố cục A đã chọn · thử nút xóa ở góc màn hình.</p></div>
      <div className="mp-scenarios"><button onClick={() => reset(false)} aria-pressed={members.length > 0}>Có Thành viên</button><button onClick={() => reset(true)} aria-pressed={members.length === 0}>Gia đình trống</button></div>
    </header>

    <div className="mp-stage"><section className="mp-phone mp-variant-A" aria-label="Bản xem trước ứng dụng">
      {!selected ? <div className="mp-selection">
        <header className="mp-brand-header"><span className="mp-brand"><UtensilsCrossed size={17} strokeWidth={1.8} /><span>Bếp Gia Đình</span></span><button className={`mp-manage-button ${isManaging ? 'active' : ''}`} disabled={members.length === 0} onClick={() => { setIsManaging(!isManaging); setNotice(''); }} aria-label={isManaging ? 'Hoàn tất xóa Thành viên' : 'Xóa thành viên'} aria-pressed={isManaging}>{isManaging ? <Check size={14} /> : <Trash2 size={14} />}<span>{isManaging ? 'Xong' : 'Xóa'}</span></button></header>
        <div className="mp-selection-scroll">
          <div className="mp-greeting">
            <div className="mp-greeting-art" aria-hidden="true"><span className="mp-art-sun" /><UtensilsCrossed size={29} strokeWidth={1.5} /><span className="mp-art-dot" /></div>
            <p className="mp-eyebrow">BỮA CƠM NHÀ, CẢ NHÀ CÙNG LO</p>
            <h1>Bạn là ai?</h1>
            <p>{isManaging ? 'Chọn Thành viên bạn muốn xóa.' : 'Chọn Thành viên để vào Kế hoạch.'}</p><span className="mp-greeting-household"><Home size={11} />{household}</span>
          </div>
          {members.length === 0 ? <div className="mp-empty"><div className="mp-empty-art"><Users size={33} strokeWidth={1.4} /></div><h2>Cả nhà bắt đầu từ bạn</h2><p>Thêm Thành viên đầu tiên<br />để cùng lên Kế hoạch bữa ăn.</p></div> : <VariantA members={members} onChoose={choose} isManaging={isManaging} onDelete={setMemberToDelete} />}
          <div className="mp-add-area"><button className="mp-add-button" onClick={openAdd}><Plus size={18} strokeWidth={1.8} />Thêm thành viên</button><p>Mỗi người một tên. Cùng một căn bếp.</p></div>
          {notice && <div className="mp-notice" role="status"><Check size={15} /><span>{notice}</span></div>}
        </div>
        <footer className="mp-selection-footer"><span className="mp-footer-line" /><span>Cùng nhau, bữa cơm ngon hơn.</span><span className="mp-footer-line" /></footer>
      </div> : <div className="mp-plan">
        <header className="mp-plan-header"><div><span className="mp-household"><Home size={12} />{household}</span><span className="mp-current-person">{selected.name}</span></div>{tab === 'plan' && <div className="mp-plan-actions"><button onClick={() => { setNewCode(''); setError(''); setIsChangingHousehold(true); }}>Đổi gia đình</button></div>}</header>
        <div className="mp-plan-content">
          <div className="mp-plan-title"><p className="mp-eyebrow">{tab === 'plan' ? 'KẾ HOẠCH GIA ĐÌNH' : 'MENU GIA ĐÌNH'}</p><h1>Xin chào, {selected.name}<span className="mp-hello-dot">.</span></h1><p>Cùng chuẩn bị một bữa cơm thật ngon nhé.</p></div>
          {tab === 'plan' && <><div className="mp-week">{['T2|5', 'T3|6', 'T4|7', 'T5|8', 'T6|9', 'T7|10', 'CN|11'].map((day, index) => <div className={index === 3 ? 'active' : ''} key={day}><span>{day.split('|')[0]}</span><strong>{day.split('|')[1]}</strong></div>)}</div><div className="mp-meal-title"><span><UtensilsCrossed size={17} /> Bữa Tối</span><small>Thứ Năm, 08/10</small></div></>}
          <div className="mp-dish"><span className="mp-dish-icon">01</span><div><strong>Thịt kho trứng</strong><span>Món mặn</span></div></div>
          <div className="mp-dish"><span className="mp-dish-icon cream">02</span><div><strong>Canh chua cá lóc</strong><span>Canh</span></div></div>
          <div className="mp-plan-note"><Check size={16} /><p>Đã chọn <strong>{selected.name}</strong>.<br />Bình luận mới sẽ hiển thị tên này.</p></div>
        </div>
        <BottomNav activeTab={tab} onTabChange={setTab} />
      </div>}
      <div className="mp-home-indicator"><span /></div>

      {memberToDelete && <div className="mp-modal-backdrop" onClick={() => setMemberToDelete(null)}><section className="mp-modal mp-delete-modal" role="dialog" aria-modal="true" aria-labelledby="mp-delete-title" aria-describedby="mp-delete-description" onClick={(event) => event.stopPropagation()}>
        <div className="mp-sheet-handle" /><button className="mp-modal-close" onClick={() => setMemberToDelete(null)} aria-label="Đóng xác nhận xóa"><X size={18} /></button>
        <div className="mp-modal-art mp-danger-art"><Trash2 size={25} strokeWidth={1.6} /></div><h2 id="mp-delete-title">Xóa {memberToDelete.name}?</h2><p id="mp-delete-description"><strong>{memberToDelete.name}</strong> sẽ được gỡ khỏi danh sách Thành viên.<br />Menu, Kế hoạch và bình luận cũ vẫn được giữ.</p>
        <div className="mp-delete-actions"><button className="mp-cancel-delete" autoFocus onClick={() => setMemberToDelete(null)}>Giữ lại</button><button className="mp-confirm-delete" onClick={() => {
          const remaining = members.filter((member) => member.id !== memberToDelete.id);
          setMembers(remaining);
          setNotice(`Đã xóa ${memberToDelete.name} khỏi danh sách Thành viên.`);
          setMemberToDelete(null);
          if (remaining.length === 0) setIsManaging(false);
        }}><Trash2 size={15} />Xóa thành viên</button></div>
      </section></div>}

      {isAdding && <div className="mp-modal-backdrop" onClick={() => setIsAdding(false)}><section className="mp-modal" role="dialog" aria-modal="true" aria-labelledby="mp-add-title" onClick={(event) => event.stopPropagation()}>
        <div className="mp-sheet-handle" /><button className="mp-modal-close" onClick={() => setIsAdding(false)} aria-label="Đóng thêm Thành viên"><X size={18} /></button>
        <div className="mp-modal-art"><Users size={25} strokeWidth={1.6} /></div><h2 id="mp-add-title">Thêm thành viên</h2><p>Tên giúp cả nhà nhận ra người viết bình luận.</p>
        <form onSubmit={(event) => {
          event.preventDefault();
          const clean = name.trim();
          if (!clean || clean.length > 30) { setError('Nhập tên từ 1 đến 30 ký tự nhé.'); return; }
          if (members.some((member) => member.name.trim().toLocaleLowerCase('vi') === clean.toLocaleLowerCase('vi'))) { setError('Tên này đã có trong Gia đình. Hãy chọn Thành viên đó.'); return; }
          setMembers([...members, { id: nextId.current++, name: clean }]);
          setIsAdding(false);
          setNotice(`Đã thêm ${clean}. Chọn một Thành viên để vào Kế hoạch.`);
        }}><label htmlFor="mp-member-name">Tên Thành viên</label><input id="mp-member-name" value={name} onChange={(event) => { setName(event.target.value); setError(''); }} placeholder="Ví dụ: Mẹ, Bố, An…" maxLength={30} autoFocus autoComplete="off" /><div className="mp-input-meta"><span>Không trùng tên trong Gia đình</span><span>{name.length}/30</span></div>{error && <p className="mp-form-error" role="alert">{error}</p>}<button className="mp-primary" type="submit"><Plus size={17} />Thêm thành viên</button></form>
      </section></div>}

      {isChangingHousehold && <div className="mp-modal-backdrop"><section className="mp-modal" role="dialog" aria-modal="true" aria-labelledby="mp-change-title"><div className="mp-sheet-handle" /><button className="mp-modal-close" onClick={() => setIsChangingHousehold(false)} aria-label="Đóng đổi Gia đình"><X size={18} /></button><div className="mp-modal-art"><Home size={25} /></div><h2 id="mp-change-title">Đổi Gia đình</h2><p>Nhập Mã nhà của Gia đình bạn muốn tham gia.</p><form onSubmit={(event) => { event.preventDefault(); const code = newCode.trim().toUpperCase(); if (code.length < 3 || !/^[A-Z0-9-]+$/.test(code)) { setError('Vui lòng nhập Mã nhà hợp lệ.'); return; } setHousehold(code); setMembers([]); setSelected(null); setIsChangingHousehold(false); setNotice(''); }}><label htmlFor="mp-new-code">Mã nhà</label><input id="mp-new-code" value={newCode} onChange={(event) => { setNewCode(event.target.value); setError(''); }} placeholder="Ví dụ: BEP-123" autoFocus autoComplete="off" />{error && <p className="mp-form-error" role="alert">{error}</p>}<button className="mp-primary" type="submit">Tham gia Gia đình <ArrowRight size={17} /></button></form></section></div>}
    </section></div>

    <div className="mp-inspector" aria-live="polite"><span className="mp-inspector-dot" /><span><strong>{household}</strong> · {members.length} Thành viên · {selected ? `Đã chọn ${selected.name} · ${tab === 'plan' ? 'Kế hoạch' : 'Menu'}` : `Chưa chọn · ${memberToDelete ? `Xác nhận xóa ${memberToDelete.name}` : isManaging ? 'Chế độ xóa' : isAdding ? 'Thêm Thành viên' : 'Màn hình chọn'}`}</span><small>Dữ liệu minh họa · tải lại để bắt đầu lại</small></div>
    <div className="mp-chosen-layout"><Check size={13} />A · Lưới như Netflix · Đã chọn</div>
  </div>;
}
