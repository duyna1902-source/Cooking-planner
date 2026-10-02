import React, { useState } from 'react';
import { isValidNickname } from '../domain/household';

export interface MemberSelectionViewProps {
  householdCode: string;
  members: string[];
  activeMember: string | null;
  onSelectMember: (name: string) => void;
  onAddMember: (name: string) => Promise<void> | void;
  onBackToPlan?: () => void;
}

const AVATAR_COLORS = [
  { bg: 'bg-[#5B7C99]', text: 'text-white' },
  { bg: 'bg-[#FEF7DC]', text: 'text-[#334E68]' },
  { bg: 'bg-[#F28E79]', text: 'text-white' },
  { bg: 'bg-[#7E9BB6]', text: 'text-white' },
];

export const MemberSelectionView: React.FC<MemberSelectionViewProps> = ({
  householdCode,
  members,
  activeMember,
  onSelectMember,
  onAddMember,
  onBackToPlan,
}) => {
  const [isAddingMember, setIsAddingMember] = useState(false);
  const [newMemberName, setNewMemberName] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleConfirmAdd = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = newMemberName.trim();
    if (!trimmed || !isValidNickname(trimmed)) {
      setError('Tên thành viên không hợp lệ (tối đa 30 ký tự)');
      return;
    }

    try {
      await onAddMember(trimmed);
      setNewMemberName('');
      setIsAddingMember(false);
      setError(null);
    } catch (err: any) {
      setError(err?.message || 'Không thể thêm thành viên');
    }
  };

  return (
    <div
      data-testid="member-selection-view"
      className="flex-1 flex flex-col justify-center items-center px-6 py-10 bg-gradient-to-b from-[#FAFBFD] to-white relative min-h-full"
    >
      {activeMember && onBackToPlan && (
        <button
          onClick={onBackToPlan}
          data-testid="back-to-plan-btn"
          className="absolute top-5 left-5 text-xs text-slate-400 hover:text-slate-700 flex items-center gap-1 font-medium transition cursor-pointer"
        >
          ← Quay lại Kế hoạch
        </button>
      )}

      <div
        data-testid="member-view-code-badge"
        className="px-3 py-1 rounded-full bg-[#FEF7DC] border border-[#EFE4B5] text-[11px] font-bold text-[#334E68] mb-4"
      >
        NHÀ: {householdCode}
      </div>

      <h2
        data-testid="member-selection-title"
        className="text-2xl font-extrabold text-[#334E68] text-center mb-1"
      >
        Ai đang sử dụng?
      </h2>
      <p className="text-xs text-slate-400 text-center mb-8">
        Chọn hồ sơ thành viên của bạn để tiếp tục
      </p>

      <div className="grid grid-cols-2 gap-4 w-full max-w-[280px]">
        {members.map((m, idx) => {
          const isSelected = m === activeMember;
          const color = AVATAR_COLORS[idx % AVATAR_COLORS.length];

          return (
            <button
              key={m}
              onClick={() => onSelectMember(m)}
              data-testid={`member-card-${m}`}
              className={`group flex flex-col items-center p-3.5 rounded-3xl transition-all active:scale-95 cursor-pointer ${
                isSelected
                  ? 'bg-white shadow-md border-2 border-[#5B7C99]'
                  : 'bg-slate-50/80 hover:bg-white hover:shadow-xs border border-slate-100'
              }`}
            >
              <div
                className={`w-16 h-16 rounded-2xl ${color.bg} ${color.text} flex items-center justify-center text-xl font-extrabold shadow-xs transition group-hover:scale-105 mb-2`}
              >
                {m.charAt(0).toUpperCase()}
              </div>
              <span className="text-xs font-bold text-[#334E68] truncate max-w-[90px]">
                {m}
              </span>
              {isSelected && (
                <span className="text-[9px] text-[#5B7C99] font-bold mt-0.5">
                  Đang chọn
                </span>
              )}
            </button>
          );
        })}

        <button
          onClick={() => {
            setIsAddingMember(true);
            setError(null);
          }}
          data-testid="add-member-button"
          className="flex flex-col items-center justify-center p-3.5 rounded-3xl border-2 border-dashed border-slate-200 hover:border-[#5B7C99] transition-all bg-white hover:bg-slate-50 active:scale-95 min-h-[110px] cursor-pointer"
        >
          <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 text-xl font-bold mb-1">
            +
          </div>
          <span className="text-[11px] font-semibold text-slate-500">
            Thêm người
          </span>
        </button>
      </div>

      {isAddingMember && (
        <form
          onSubmit={handleConfirmAdd}
          data-testid="add-member-form"
          className="mt-6 w-full max-w-[280px] p-4 bg-white rounded-3xl shadow-lg border border-slate-200 animate-in fade-in duration-150"
        >
          <label className="text-[11px] font-bold text-[#334E68] block mb-1.5">
            Nhập tên thành viên mới:
          </label>
          <input
            type="text"
            value={newMemberName}
            onChange={(e) => setNewMemberName(e.target.value)}
            data-testid="new-member-name-input"
            placeholder="Ví dụ: Em Bin, Chị Mai..."
            className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-[#5B7C99] mb-2.5"
            autoFocus
          />
          {error && (
            <p
              data-testid="new-member-error"
              className="text-[11px] text-red-500 mb-2 font-medium"
            >
              {error}
            </p>
          )}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => {
                setIsAddingMember(false);
                setError(null);
                setNewMemberName('');
              }}
              data-testid="cancel-add-member-btn"
              className="flex-1 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-medium cursor-pointer transition"
            >
              Hủy
            </button>
            <button
              type="submit"
              data-testid="confirm-add-member-btn"
              className="flex-1 py-1.5 rounded-xl bg-[#5B7C99] hover:bg-[#4a6b88] text-white text-xs font-bold cursor-pointer transition"
            >
              Xác nhận
            </button>
          </div>
        </form>
      )}
    </div>
  );
};
