import React, { useState, useEffect, useRef } from 'react';
import {
  Member,
  MemberInput,
  AVATAR_PRESETS,
  AvatarPreset,
  isDuplicateMemberName,
} from '../domain/member';

const defaultPreset = AVATAR_PRESETS[0];

export interface MemberDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: MemberInput) => void | Promise<void>;
  existingMembers?: Member[];
  title?: string;
  submitButtonText?: string;
  initialName?: string;
  initialAvatarIcon?: string;
  initialAvatarColor?: string;
  editingMemberId?: string;
}

export const MemberDrawer: React.FC<MemberDrawerProps> = ({
  isOpen,
  onClose,
  onSave,
  existingMembers = [],
  title,
  submitButtonText,
  initialName = '',
  initialAvatarIcon,
  initialAvatarColor,
  editingMemberId,
}) => {
  const isEditing = Boolean(editingMemberId);
  const resolvedTitle = title ?? (isEditing ? 'Chỉnh Sửa Thành Viên' : 'Thêm Thành Viên Mới');
  const resolvedSubmitButtonText =
    submitButtonText ?? (isEditing ? 'Lưu thay đổi' : 'Xác nhận tạo thành viên');

  const [name, setName] = useState<string>(initialName);
  const [selectedPreset, setSelectedPreset] = useState<AvatarPreset>(() => {
    return (
      AVATAR_PRESETS.find(
        (p) =>
          p.icon === initialAvatarIcon ||
          (initialAvatarColor && p.bg === initialAvatarColor)
      ) || defaultPreset
    );
  });
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setName(initialName);
      setSelectedPreset(
        AVATAR_PRESETS.find(
          (p) =>
            p.icon === initialAvatarIcon ||
            (initialAvatarColor && p.bg === initialAvatarColor)
        ) || defaultPreset
      );
      setError(null);
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    }
  }, [isOpen, initialName, initialAvatarIcon, initialAvatarColor]);

  if (!isOpen) return null;

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = name.trim();

    if (!trimmed) {
      setError('Vui lòng nhập tên thành viên!');
      return;
    }

    if (trimmed.length > 30) {
      setError('Tên thành viên không được vượt quá 30 ký tự!');
      return;
    }

    const isDuplicate = isDuplicateMemberName(existingMembers, trimmed, editingMemberId);
    if (isDuplicate) {
      setError('Tên thành viên này đã có trong gia đình. Vui lòng chọn tên khác!');
      return;
    }

    onSave({
      name: trimmed,
      avatarIcon: selectedPreset.icon,
      avatarColor: selectedPreset.bg,
    });
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="member-drawer-title"
      data-testid="member-drawer"
      className="fixed inset-0 z-50 flex flex-col justify-end backdrop-blur-sm bg-black/40 transition-opacity"
      onClick={onClose}
    >
      <div
        className="w-full max-w-[420px] mx-auto bg-white rounded-t-[32px] p-5 pt-3 shadow-2xl max-h-[90%] overflow-y-auto flex flex-col border-t border-slate-100 animate-in slide-in-from-bottom duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drawer Handle Pill */}
        <div className="w-12 h-1.5 bg-slate-300 rounded-full mx-auto mb-3" />

        {/* Header: Title and Close button */}
        <div className="flex items-center justify-between mb-4">
          <h3
            id="member-drawer-title"
            className="text-base font-extrabold text-[#334E68]"
          >
            {resolvedTitle}
          </h3>
          <button
            type="button"
            onClick={onClose}
            data-testid="close-drawer-btn"
            aria-label="Đóng"
            className="w-7 h-7 rounded-full bg-slate-100 text-slate-500 hover:text-slate-700 flex items-center justify-center text-xs font-bold transition"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Member Name Input */}
          <div>
            <label
              htmlFor="member-name-input"
              className="block text-xs font-bold text-[#334E68] mb-1.5"
            >
              Tên hoặc biệt danh trong gia đình:
            </label>
            <input
              ref={inputRef}
              id="member-name-input"
              data-testid="member-name-input"
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (error) setError(null);
              }}
              maxLength={30}
              placeholder="Ví dụ: Mẹ, Bố, Bé An, Chị Hai..."
              autoFocus
              className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-sm font-bold text-[#334E68] placeholder-slate-400 focus:outline-none focus:border-[#5B7C99] focus:bg-white transition"
            />
            {error && (
              <p
                data-testid="member-name-error"
                role="alert"
                className="text-xs text-rose-500 font-semibold mt-1.5 flex items-center gap-1"
              >
                <span>⚠️</span>
                <span>{error}</span>
              </p>
            )}
          </div>

          {/* Avatar Presets Selection */}
          <div>
            <label className="block text-xs font-bold text-[#334E68] mb-1.5">
              Chọn biểu tượng đại diện:
            </label>
            <div className="grid grid-cols-4 gap-2.5" id="preset-selector">
              {AVATAR_PRESETS.map((preset) => {
                const isSelected = selectedPreset.icon === preset.icon;
                return (
                  <button
                    key={preset.icon}
                    type="button"
                    data-testid={`avatar-preset-${preset.icon}`}
                    aria-label={preset.label}
                    onClick={() => setSelectedPreset(preset)}
                    className={`aspect-square rounded-2xl ${preset.bg} border-2 ${
                      preset.border
                    } flex flex-col items-center justify-center text-2xl transition active:scale-95 ${
                      isSelected
                        ? 'ring-2 ring-[#5B7C99] scale-105 shadow-xs'
                        : 'opacity-80 hover:opacity-100'
                    }`}
                  >
                    <span>{preset.icon}</span>
                    <span className="text-[9px] font-semibold text-slate-600 mt-0.5 truncate w-full text-center px-0.5">
                      {preset.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Actions: Cancel & Submit */}
          <div className="flex items-center gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              data-testid="cancel-drawer-btn"
              className="flex-1 py-3 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition"
            >
              Hủy
            </button>
            <button
              type="submit"
              data-testid="save-member-btn"
              className="flex-2 py-3 rounded-full bg-[#5B7C99] hover:bg-[#4a6b88] text-white font-bold text-xs shadow-md shadow-[#5B7C99]/30 transition active:scale-98"
            >
              {resolvedSubmitButtonText}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
