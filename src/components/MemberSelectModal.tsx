import React, { useState, useEffect } from 'react';
import { Home } from 'lucide-react';
import { Member } from '../domain/member';
import { MemberRepository } from '../services/memberRepository';
import { MemberDrawer } from './MemberDrawer';

export interface MemberSelectModalProps {
  householdCode: string;
  members: Member[];
  onSelectMember: (member: Member) => void;
  isLoading?: boolean;
  memberRepository?: MemberRepository;
  onMemberAdded?: (member: Member) => void;
}

export const MemberSelectModal: React.FC<MemberSelectModalProps> = ({
  householdCode,
  members,
  onSelectMember,
  isLoading = false,
  memberRepository,
  onMemberAdded,
}) => {
  const [localMembers, setLocalMembers] = useState<Member[]>(members);
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);

  useEffect(() => {
    setLocalMembers(members);
  }, [members]);

  const handleSaveMember = async (data: {
    name: string;
    avatarIcon: string;
    avatarColor: string;
  }) => {
    let createdMember: Member;

    if (memberRepository) {
      createdMember = await memberRepository.addMember({
        householdCode,
        name: data.name,
        avatarIcon: data.avatarIcon,
        avatarColor: data.avatarColor,
      });

      // Reload members from repository to guarantee state accuracy
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
        </div>

        {/* Title & Subtitle */}
        <div className="text-center mb-6">
          <h2
            id="member-select-title"
            className="text-2xl font-black text-[#334E68] tracking-tight"
          >
            Hôm nay ai vào bếp?
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Chọn thành viên của bạn để vào xem Kế hoạch
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
              <button
                key={member.id}
                type="button"
                data-testid={`member-card-${member.id}`}
                onClick={() => onSelectMember(member)}
                className={`w-full aspect-[4/4.4] rounded-3xl ${member.avatarColor} border-2 border-slate-200/60 p-3 flex flex-col items-center justify-center gap-2 shadow-xs hover:shadow-md transition active:scale-95`}
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
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Sticky Bottom Area: Add Member Button & Note */}
      <div className="pt-3 border-t border-slate-100 flex flex-col gap-2 mt-auto">
        <button
          type="button"
          data-testid="open-add-member-drawer"
          onClick={() => setIsDrawerOpen(true)}
          className="w-full py-3.5 rounded-full bg-[#5B7C99] hover:bg-[#4a6b88] text-white font-bold text-sm shadow-md shadow-[#5B7C99]/30 transition active:scale-98 flex items-center justify-center gap-2"
        >
          <span>➕</span>
          <span>Thêm thành viên mới</span>
        </button>
        <span className="text-[11px] text-center text-slate-400">
          Mỗi lần mở web lên sẽ luôn xuất hiện bảng này để chọn người vào bếp
        </span>
      </div>

      {/* Bottom Drawer for Adding New Member */}
      <MemberDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        onSave={handleSaveMember}
        existingMembers={localMembers}
      />
    </div>
  );
};
