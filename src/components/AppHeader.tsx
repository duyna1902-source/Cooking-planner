import React from 'react';
import { Share2, Check, Home, Users } from 'lucide-react';
import { createShareUrl } from '../domain/household';
import { Member } from '../domain/member';
import { useClipboardCopy } from '../hooks/useClipboardCopy';

export interface AppHeaderProps {
  householdCode: string;
  nickname: string;
  activeMember?: Member | null;
  onSwitchMember?: () => void;
  activeTab: 'plan' | 'menu';
  isOnline?: boolean;
  onOpenShare?: () => void;
  onChangeHousehold?: () => void;
}

export const AppHeader: React.FC<AppHeaderProps> = ({
  householdCode,
  nickname,
  activeMember,
  onSwitchMember,
  activeTab,
  isOnline = false,
  onOpenShare,
  onChangeHousehold
}) => {
  const { copied, copy } = useClipboardCopy();

  const handleQuickCopy = async () => {
    const url = createShareUrl(householdCode);
    const success = await copy(url);
    if (!success && onOpenShare) {
      onOpenShare();
    }
  };

  return (
    <header className="px-5 py-2.5 bg-white border-b border-slate-100 flex items-center justify-between gap-2 flex-shrink-0 z-20">
      <h1 className="sr-only">
        {activeTab === 'plan' ? 'Kế hoạch tuần này' : 'Menu gia đình'}
      </h1>
      <div className="min-w-0">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span 
            data-testid="household-code-badge"
            className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-[#FEF7DC] text-[#334E68] border border-[#EFE4B5]"
          >
            <Home className="w-3 h-3 text-[#5B7C99]" />
            Mã: {householdCode}
          </span>
          <span 
            data-testid="nickname-badge"
            className="inline-flex items-center gap-1 text-xs text-slate-700 font-medium"
          >
            {activeMember?.avatarIcon && (
              <span
                data-testid="active-member-avatar"
                className={`w-5 h-5 rounded-full ${activeMember.avatarColor || 'bg-[#FEF7DC]'} border border-[#EFE4B5] flex items-center justify-center text-[10px]`}
              >
                {activeMember.avatarIcon}
              </span>
            )}
            <span>• {activeMember?.name || nickname}</span>
          </span>
          <span
            data-testid="sync-status-badge"
            title={isOnline ? 'Đang đồng bộ Online' : 'Chế độ máy Local'}
            className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full ${
              isOnline
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                : 'bg-amber-50 text-amber-700 border border-amber-200'
            }`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-emerald-500' : 'bg-amber-400'}`} />
            {isOnline ? '🟢 Online' : '🟡 Chế độ máy'}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-1.5 flex-shrink-0">
        {onSwitchMember && (
          <button
            onClick={onSwitchMember}
            data-testid="switch-member-btn"
            title="Đổi thành viên"
            className="h-8 px-2 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center gap-1 text-[11px] font-medium transition active:scale-95"
          >
            <Users className="w-3 h-3 text-[#5B7C99]" />
            <span>Đổi thành viên</span>
          </button>
        )}
        <button
          onClick={handleQuickCopy}
          data-testid="quick-share-button"
          title="Sao chép link tham gia Nhà"
          aria-label="Sao chép link tham gia Nhà"
          className="h-8 px-2.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center gap-1 text-xs font-medium transition active:scale-95"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-600" />
              <span className="text-emerald-700 text-[11px] font-semibold">Đã chép</span>
            </>
          ) : (
            <>
              <Share2 className="w-3.5 h-3.5 text-[#5B7C99]" />
              <span className="text-[11px]">Chia sẻ</span>
            </>
          )}
        </button>

        {onChangeHousehold && (
          <button
            onClick={onChangeHousehold}
            data-testid="switch-household-button"
            title="Đổi hoặc rời Nhà"
            className="text-[11px] text-slate-400 hover:text-slate-600 px-1 py-1"
          >
            Đổi
          </button>
        )}
      </div>
    </header>
  );
};
