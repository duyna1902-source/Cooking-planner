import React, { useState, useEffect } from 'react';
import { Home } from 'lucide-react';
import { Member, MemberInput } from '../domain/member';
import { MemberRepository } from '../services/memberRepository';
import { MemberDrawer } from './MemberDrawer';

export interface MemberSelectModalProps {
  householdCode: string;
  members: Member[];
  onSelectMember: (member: Member) => void;
  isLoading?: boolean;
  memberRepository?: MemberRepository;
  onMemberAdded?: (member: Member) => void;
  onMemberUpdated?: (member: Member) => void;
  onMemberDeleted?: (memberId: string) => void;
}

export const MemberSelectModal: React.FC<MemberSelectModalProps> = ({
  householdCode,
  members,
  onSelectMember,
  isLoading = false,
  memberRepository,
  onMemberAdded,
  onMemberUpdated,
  onMemberDeleted,
}) => {
  const [localMembers, setLocalMembers] = useState<Member[]>(members);
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);
  const [isManageMode, setIsManageMode] = useState<boolean>(false);
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [memberToDelete, setMemberToDelete] = useState<Member | null>(null);
  const [deleteBlockedMessage, setDeleteBlockedMessage] = useState<string | null>(null);

  useEffect(() => {
    setLocalMembers(members);
  }, [members]);

  useEffect(() => {
    if (!memberRepository?.subscribe || !householdCode) return;

    const reloadMembers = async () => {
      try {
        const updated = await memberRepository.getMembers(householdCode);
        setLocalMembers(updated);
      } catch {
        // Ignored
      }
    };

    const unsubscribe = memberRepository.subscribe(householdCode, reloadMembers);
    return () => {
      unsubscribe?.();
    };
  }, [householdCode, memberRepository]);

  const handleOpenAddDrawer = () => {
    setEditingMember(null);
    setIsDrawerOpen(true);
  };

  const handleCardClick = (member: Member) => {
    if (isManageMode) {
      setEditingMember(member);
      setIsDrawerOpen(true);
    } else {
      onSelectMember(member);
    }
  };

  const handleDeleteClick = (member: Member) => {
    if (localMembers.length <= 1) {
      setDeleteBlockedMessage(
        'Gia đình phải có ít nhất 1 thành viên, không thể xóa thành viên cuối cùng!'
      );
      return;
    }
    setMemberToDelete(member);
  };

  const handleConfirmDelete = async () => {
    if (!memberToDelete) return;
    const target = memberToDelete;
    setMemberToDelete(null);

    if (memberRepository) {
      await memberRepository.deleteMember(target.id, householdCode);
      const updated = await memberRepository.getMembers(householdCode);
      setLocalMembers(updated);
    } else {
      setLocalMembers((prev) => prev.filter((m) => m.id !== target.id));
    }
    onMemberDeleted?.(target.id);
  };

  const handleSaveMember = async (data: MemberInput) => {
    if (editingMember) {
      let updatedMember: Member;
      if (memberRepository) {
        updatedMember = await memberRepository.updateMember(editingMember.id, householdCode, {
          name: data.name,
          avatarIcon: data.avatarIcon,
          avatarColor: data.avatarColor,
        });
        const updated = await memberRepository.getMembers(householdCode);
        setLocalMembers(updated);
      } else {
        updatedMember = {
          ...editingMember,
          name: data.name,
          avatarIcon: data.avatarIcon,
          avatarColor: data.avatarColor,
        };
        setLocalMembers((prev) =>
          prev.map((m) => (m.id === editingMember.id ? updatedMember : m))
        );
      }
      setIsDrawerOpen(false);
      setEditingMember(null);
      onMemberUpdated?.(updatedMember);
    } else {
      let createdMember: Member;
      if (memberRepository) {
        createdMember = await memberRepository.addMember({
          householdCode,
          name: data.name,
          avatarIcon: data.avatarIcon,
          avatarColor: data.avatarColor,
        });
        const updated = await memberRepository.getMembers(householdCode);
        setLocalMembers(updated);
      } else {
        createdMember = {
          id: `mem_${Date.now()}`,
          householdCode,
          name: data.name,
          avatarIcon: data.avatarIcon,
          avatarColor: data.avatarColor,
          createdAt: new Date().toISOString(),
        };
        setLocalMembers((prev) => [...prev, createdMember]);
      }
      setIsDrawerOpen(false);
      onMemberAdded?.(createdMember);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="member-select-title"
      data-testid="member-select-modal"
      className="absolute inset-0 z-50 bg-[#FAFBFD] flex flex-col justify-between p-5 overflow-y-auto"
    >
      {/* Top Area: Household Badge & Header */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div
            data-testid="household-code-badge"
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FEF7DC] text-[#334E68] border border-[#EFE4B5] text-xs font-bold"
          >
            <Home className="w-3.5 h-3.5 text-[#5B7C99]" />
            <span>Mã: {householdCode}</span>
          </div>

          <button
            type="button"
            data-testid="toggle-manage-mode"
            onClick={() => setIsManageMode((prev) => !prev)}
            className={`text-xs font-semibold px-2.5 py-1 rounded-full transition ${
              isManageMode
                ? 'bg-rose-50 text-rose-600 border border-rose-200'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {isManageMode ? 'Xong' : 'Chỉnh sửa'}
          </button>
        </div>

        {/* Title & Subtitle */}
        <div className="text-center mb-6">
          <h2
            id="member-select-title"
            className="text-2xl font-black text-[#334E68] tracking-tight"
          >
            Ai đang vào bếp?
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            {isManageMode
              ? 'Chạm vào thẻ để sửa, bấm ✕ để xóa thành viên'
              : 'Chọn thành viên của bạn để vào xem Kế hoạch'}
          </p>
        </div>

        {/* Loading state */}
        {isLoading && (
          <div className="text-center py-8 text-sm text-slate-400">
            Đang tải danh sách thành viên...
          </div>
        )}

        {/* 2-Column Grid Cards */}
        {!isLoading && (
          <div
            data-testid="member-grid"
            className="grid grid-cols-2 gap-3.5 max-h-[420px] overflow-y-auto p-1"
          >
            {localMembers.map((member) => (
              <div key={member.id} className="relative group">
                <button
                  type="button"
                  data-testid={`member-card-${member.id}`}
                  onClick={() => handleCardClick(member)}
                  className={`w-full aspect-[4/4.4] rounded-3xl ${
                    member.avatarColor
                  } border-2 border-slate-200/60 p-3 flex flex-col items-center justify-center gap-2 shadow-xs hover:shadow-md transition active:scale-95 ${
                    isManageMode ? 'animate-wiggle' : ''
                  }`}
                >
                  {/* Avatar Circle */}
                  <div className="w-16 h-16 rounded-2xl bg-white/80 backdrop-blur-xs shadow-xs flex items-center justify-center text-3xl">
                    {member.avatarIcon}
                  </div>

                  {/* Member Name */}
                  <div className="text-center w-full px-1">
                    <span className="block text-sm font-extrabold text-[#334E68] truncate">
                      {member.name}
                    </span>
                  </div>

                  {/* Edit indicator badge in manage mode */}
                  {isManageMode && (
                    <span className="text-[10px] font-bold text-[#5B7C99] bg-white/90 px-2 py-0.5 rounded-full shadow-xs flex items-center gap-1">
                      ✏️ Chỉnh sửa
                    </span>
                  )}
                </button>

                {/* Delete button in manage mode */}
                {isManageMode && (
                  <button
                    type="button"
                    data-testid={`delete-member-${member.id}`}
                    aria-label={`Xóa thành viên ${member.name}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteClick(member);
                    }}
                    className="absolute -top-1.5 -right-1.5 w-7 h-7 rounded-full bg-rose-500 hover:bg-rose-600 text-white flex items-center justify-center text-xs font-bold shadow-md active:scale-90 z-10 transition"
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Sticky Bottom Area: Add Member Button & Note */}
      <div className="pt-3 border-t border-slate-100 flex flex-col gap-2 mt-auto">
        <button
          type="button"
          data-testid="open-add-member-drawer"
          onClick={handleOpenAddDrawer}
          className="w-full py-3.5 rounded-full bg-[#5B7C99] hover:bg-[#4a6b88] text-white font-bold text-sm shadow-md shadow-[#5B7C99]/30 transition active:scale-98 flex items-center justify-center gap-2"
        >
          <span>➕</span>
          <span>Thêm thành viên mới</span>
        </button>
        <span className="text-[11px] text-center text-slate-400">
          Mỗi lần mở web lên sẽ luôn xuất hiện bảng này để chọn thành viên vào bếp
        </span>
      </div>

      {/* Bottom Drawer for Adding or Editing Member */}
      <MemberDrawer
        isOpen={isDrawerOpen}
        onClose={() => {
          setIsDrawerOpen(false);
          setEditingMember(null);
        }}
        onSave={handleSaveMember}
        existingMembers={localMembers}
        editingMemberId={editingMember?.id}
        initialName={editingMember ? editingMember.name : ''}
        initialAvatarIcon={editingMember?.avatarIcon}
        initialAvatarColor={editingMember?.avatarColor}
      />

      {/* Confirmation Dialog for Member Deletion */}
      {memberToDelete && (
        <div
          role="dialog"
          aria-modal="true"
          data-testid="confirm-delete-modal"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-150"
        >
          <div className="bg-white rounded-3xl p-5 shadow-2xl max-w-xs w-full text-center border border-slate-100">
            <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-500 mx-auto flex items-center justify-center text-2xl mb-3">
              🗑️
            </div>
            <h3 className="text-sm font-extrabold text-[#334E68] mb-1">
              Xác nhận xóa thành viên
            </h3>
            <p className="text-xs text-slate-600 mb-4 font-medium leading-relaxed">
              Bạn có chắc muốn xóa thành viên{' '}
              <span className="font-bold text-rose-600">"{memberToDelete.name}"</span>?
              Lịch sử dặn dò của thành viên này trong Kế hoạch vẫn sẽ được giữ nguyên.
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                data-testid="cancel-delete-member-btn"
                onClick={() => setMemberToDelete(null)}
                className="flex-1 py-2.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition"
              >
                Hủy
              </button>
              <button
                type="button"
                data-testid="confirm-delete-member-btn"
                onClick={handleConfirmDelete}
                className="flex-1 py-2.5 rounded-full bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold transition shadow-xs"
              >
                Xác nhận xóa
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Warning Dialog when Single Member deletion is blocked */}
      {deleteBlockedMessage && (
        <div
          role="dialog"
          aria-modal="true"
          data-testid="delete-blocked-modal"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-150"
        >
          <div className="bg-white rounded-3xl p-5 shadow-2xl max-w-xs w-full text-center border border-slate-100">
            <div className="w-12 h-12 rounded-full bg-amber-50 text-amber-500 mx-auto flex items-center justify-center text-2xl mb-3">
              ⚠️
            </div>
            <h3 className="text-sm font-extrabold text-[#334E68] mb-2">
              Không thể xóa thành viên
            </h3>
            <p
              data-testid="delete-blocked-message"
              className="text-xs text-slate-600 mb-4 font-medium leading-relaxed"
            >
              {deleteBlockedMessage}
            </p>
            <button
              type="button"
              data-testid="close-delete-blocked-btn"
              onClick={() => setDeleteBlockedMessage(null)}
              className="w-full py-2.5 rounded-full bg-[#5B7C99] hover:bg-[#4a6b88] text-white text-xs font-bold transition"
            >
              Đã hiểu
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

