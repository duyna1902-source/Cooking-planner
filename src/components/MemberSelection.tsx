import { useEffect, useId, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { Check, Home, Plus, Trash2, Users, UtensilsCrossed, X } from 'lucide-react';
import { Member, normalizeMemberName, memberNameKey, sortMembers } from '../domain/member';
import { MemberRepository } from '../services/memberRepository';
import './MemberSelection.css';

const tones = [
  { background: '#dce7ef', color: '#46637d', accent: '#bfd1df' },
  { background: '#f9efcc', color: '#897443', accent: '#efdfa7' },
  { background: '#e2ebe2', color: '#597460', accent: '#c9dccb' },
  { background: '#ebe4f1', color: '#806c91', accent: '#d6c9e4' },
];

function MemberDialog({ title, danger, busy, onClose, children }: {
  title: string; danger?: boolean; busy: boolean; onClose: () => void; children: ReactNode;
}) {
  const titleId = useId();
  const element = useRef<HTMLElement>(null);
  const current = useRef({ busy, onClose });
  current.current = { busy, onClose };
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const dialog = element.current!;
    (dialog.querySelector('input, .ms-cancel') as HTMLElement | null)?.focus();
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !current.current.busy) { event.preventDefault(); current.current.onClose(); }
      if (event.key !== 'Tab') return;
      const focusable = Array.from(dialog.querySelectorAll<HTMLElement>('button:not(:disabled), input:not(:disabled)'));
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (!first) { event.preventDefault(); dialog.focus(); }
      else if (event.shiftKey && (document.activeElement === first || !dialog.contains(document.activeElement))) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && (document.activeElement === last || !dialog.contains(document.activeElement))) { event.preventDefault(); first.focus(); }
    };
    document.addEventListener('keydown', handleKey);
    return () => { document.removeEventListener('keydown', handleKey); previous?.focus(); };
  }, []);
  return <div className="ms-backdrop" onClick={() => { if (!busy) onClose(); }}>
    <section ref={element} className="ms-dialog" role="dialog" aria-modal="true" aria-labelledby={titleId} aria-busy={busy} tabIndex={-1} onClick={event => event.stopPropagation()}>
      <div className="ms-handle" />
      <button className="ms-close" disabled={busy} onClick={onClose} aria-label="Đóng"><X size={18} /></button>
      <div className={`ms-dialog-art ${danger ? 'ms-danger-art' : ''}`} aria-hidden="true">{danger ? <Trash2 size={25} /> : <Users size={25} />}</div>
      <h2 id={titleId}>{title}</h2>{children}
    </section>
  </div>;
}

export function MemberSelection({ householdCode, repository, onChoose }: {
  householdCode: string;
  repository: MemberRepository;
  onChoose: (member: Member) => void;
}) {
  const [members, setMembers] = useState<Member[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState('');
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);
  const [managing, setManaging] = useState(false);
  const [toDelete, setToDelete] = useState<Member | null>(null);
  const [notice, setNotice] = useState('');
  const busy = useRef(false);
  const session = useRef(0);
  const request = useRef(0);
  const hasLoaded = useRef(false);
  const reload = useRef<() => void>(() => {});
  const inputId = useId();
  const nameHelpId = useId();
  const formErrorId = useId();

  useEffect(() => {
    let alive = true;
    session.current++;
    const load = () => {
      const version = ++request.current;
      setLoading(true);
      setError('');
      repository.getMembers(householdCode).then(list => {
        if (!alive || version !== request.current) return;
        const current = sortMembers(list.filter(member => member.householdCode === householdCode));
        setMembers(current);
        hasLoaded.current = true;
        setLoading(false);
        if (!current.length) setManaging(false);
      }).catch(cause => {
        if (alive && version === request.current) {
          setError(cause instanceof Error ? cause.message : 'Không thể tải Thành viên. Hãy thử lại.');
          setLoading(false);
        }
      });
    };
    reload.current = load;
    const unsubscribe = repository.subscribe(householdCode, () => { if (alive) load(); });
    load();
    return () => { alive = false; session.current++; request.current++; unsubscribe(); };
  }, [householdCode, repository]);

  const addMember = async (event: React.FormEvent) => {
    event.preventDefault();
    if (busy.current) return;
    const operationSession = session.current;
    try {
      const clean = normalizeMemberName(name);
      if (members.some(member => memberNameKey(member.name) === memberNameKey(clean))) {
        setFormError('Tên này đã có trong Gia đình. Hãy chọn Thành viên đó.');
        return;
      }
      busy.current = true;
      setSaving(true);
      setFormError('');
      const added = await repository.addMember(householdCode, clean);
      if (session.current !== operationSession) return;
      request.current++;
      setMembers(current => sortMembers([...current.filter(member => member.id !== added.id), added]));
      hasLoaded.current = true;
      setLoading(false);
      setError('');
      setAdding(false);
      setNotice(`Đã thêm ${added.name}. Chọn một Thành viên để vào Kế hoạch.`);
      reload.current();
    } catch (cause) {
      if (session.current === operationSession) setFormError(cause instanceof Error ? cause.message : 'Không thể lưu. Hãy thử lại.');
    } finally {
      if (session.current === operationSession) { busy.current = false; setSaving(false); }
    }
  };

  const deleteMember = async () => {
    if (busy.current || !toDelete) return;
    busy.current = true;
    setSaving(true);
    setFormError('');
    const operationSession = session.current;
    try {
      await repository.deleteMember(householdCode, toDelete.id);
      if (session.current !== operationSession) return;
      request.current++;
      setMembers(current => current.filter(member => member.id !== toDelete.id));
      setLoading(false);
      setError('');
      if (members.length === 1) setManaging(false);
      setToDelete(null);
      setNotice(`Đã xóa ${toDelete.name} khỏi danh sách Thành viên.`);
      reload.current();
    } catch (cause) {
      if (session.current === operationSession) setFormError(cause instanceof Error ? cause.message : 'Không thể xóa. Hãy thử lại.');
    } finally {
      if (session.current === operationSession) { busy.current = false; setSaving(false); }
    }
  };

  const modalOpen = adding || !!toDelete;
  const listReady = !loading && !error;
  const isCompact = members.length >= 5;
  const gridColumns = members.length >= 5 ? 3 : 2;

  return <main className={`member-selection ${isCompact ? 'ms-compact' : ''}`} data-testid="member-selection-root" data-compact={isCompact ? 'true' : undefined}>
    <div className="ms-surface" data-testid="member-selection-surface" aria-hidden={modalOpen || undefined}>
      <header className="ms-brand-header">
        <span className="ms-brand"><UtensilsCrossed size={17} /><span>Bếp Gia Đình</span></span>
        <button className={`ms-manage ${managing ? 'active' : ''}`} disabled={!listReady || !members.length || modalOpen} aria-pressed={managing}
          onClick={() => { setManaging(!managing); setNotice(''); }}>{managing ? <Check size={14} /> : <Trash2 size={14} />}<span>{managing ? 'Xong' : 'Xóa'}</span></button>
      </header>
      <div className="ms-greeting">
        {!isCompact && (
          <div className="ms-greeting-art" data-testid="ms-greeting-art" aria-hidden="true">
            <span className="ms-art-sun" /><UtensilsCrossed size={29} strokeWidth={1.5} /><span className="ms-art-dot" />
          </div>
        )}
        {!isCompact && <p className="ms-eyebrow" data-testid="ms-eyebrow">BỮA CƠM NHÀ, CẢ NHÀ CÙNG LO</p>}
        <h1>Bạn là ai?</h1><p>{managing ? 'Chọn Thành viên bạn muốn xóa.' : 'Chọn Thành viên để vào Kế hoạch.'}</p>
        <span className="ms-household"><Home size={11} />{householdCode}</span>
      </div>
      <div className="ms-member-container" data-testid="ms-member-container">
        {loading && !hasLoaded.current ? <p className="ms-feedback" role="status">Đang tải Thành viên…</p> : error ? <div className="ms-feedback">
          <p className="ms-error" role="alert">{error}</p><button className="ms-retry" onClick={() => reload.current()}>Thử lại</button>
        </div> : members.length === 0 ? <div className="ms-empty">
          <div className="ms-empty-art" aria-hidden="true"><Users size={33} strokeWidth={1.4} /></div><h2>Cả nhà bắt đầu từ bạn</h2><p>Thêm Thành viên đầu tiên<br />để cùng lên Kế hoạch bữa ăn.</p>
        </div> : <div
          className={`ms-grid ms-grid-cols-${gridColumns} ${managing ? 'ms-managing' : ''}`}
          data-testid="member-grid"
          data-columns={gridColumns}
          data-mode={`${gridColumns}-col`}
        >
          {members.map((member, index) => {
            const tone = tones[index % tones.length];
            return <button className="ms-member" key={member.id} disabled={!listReady || modalOpen} aria-label={`${managing ? 'Xóa' : 'Chọn'} ${member.name}`}
              onClick={() => { if (managing) { setToDelete(member); setFormError(''); } else onChoose(member); }}>
              <span className="ms-avatar-wrapper" aria-hidden="true"><span className="ms-avatar" style={{ '--avatar-bg': tone.background, '--avatar-ink': tone.color, '--avatar-accent': tone.accent } as CSSProperties}>
                <span className="ms-avatar-letter">{Array.from(member.name)[0]?.toLocaleUpperCase('vi')}</span><span className="ms-avatar-dot" />
              </span>{managing && <span className="ms-delete-mark"><Trash2 size={13} /></span>}</span><span className="ms-member-name">{member.name}</span>
            </button>;
          })}
        </div>}
      </div>
      <div className="ms-add-area">
        <button className="ms-add" aria-label="+ Thêm thành viên" disabled={!listReady || modalOpen} onClick={() => {
          setName(''); setFormError(''); setAdding(true); setManaging(false); setNotice('');
        }}><Plus size={18} />Thêm thành viên</button>
      </div>
      {notice && <p className="ms-notice" role="status"><Check size={15} /><span>{notice}</span></p>}
      {!isCompact && <footer className="ms-footer" data-testid="ms-footer"><span />Cùng nhau, bữa cơm ngon hơn.<span /></footer>}
    </div>
    {adding && <MemberDialog title="Thêm thành viên" busy={saving} onClose={() => setAdding(false)}>
      <p>Tên giúp cả nhà nhận ra người viết bình luận.</p>
      <form onSubmit={addMember}>
        <label htmlFor={inputId}>Tên Thành viên</label>
        <input id={inputId} value={name} disabled={saving} onChange={event => { setName(event.target.value); setFormError(''); }}
          placeholder="Ví dụ: Mẹ, Bố, An…" autoComplete="off" aria-describedby={`${nameHelpId}${formError ? ` ${formErrorId}` : ''}`} aria-invalid={!!formError} />
        <div className="ms-input-meta" id={nameHelpId}><span>Từ 1–30 ký tự, không trùng tên trong Gia đình</span><span>{Array.from(name.trim()).length}/30</span></div>
        {formError && <p className="ms-error" id={formErrorId} role="alert">{formError}</p>}
        <button className="ms-primary" type="submit" disabled={saving} aria-label="Lưu Thành viên">{saving ? 'Đang lưu…' : 'Thêm thành viên'}</button>
        <button className="ms-cancel ms-add-cancel" type="button" disabled={saving} onClick={() => setAdding(false)}>Hủy</button>
      </form>
    </MemberDialog>}
    {toDelete && <MemberDialog title={`Xóa ${toDelete.name}?`} danger busy={saving} onClose={() => setToDelete(null)}>
      <p><strong>{toDelete.name}</strong> sẽ được gỡ khỏi danh sách Thành viên.<br />Menu, Kế hoạch và bình luận cũ vẫn được giữ.</p>
      {formError && <p className="ms-error" role="alert">{formError}</p>}
      <div className="ms-delete-actions"><button className="ms-cancel" disabled={saving} onClick={() => setToDelete(null)}>Giữ lại</button>
        <button className="ms-confirm-delete" disabled={saving} aria-label="Xóa thành viên" onClick={deleteMember}>{saving ? 'Đang xóa…' : 'Xóa thành viên'}</button></div>
    </MemberDialog>}
  </main>;
}
