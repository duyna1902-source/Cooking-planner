import React from 'react';
import { Share2, Check } from 'lucide-react';
import { createShareUrl } from '../domain/household';
import { useClipboardCopy } from '../hooks/useClipboardCopy';

export interface AppHeaderProps {
  householdCode: string;
  nickname: string;
  activeTab: 'plan' | 'menu';
  isOnline?: boolean;
  onOpenShare?: () => void;
  onChangeHousehold?: () => void;
  onOpenMemberSelection?: () => void;
}

export const AppHeader: React.FC<AppHeaderProps> = ({
  householdCode,
  nickname,
  activeTab,
  isOnline = false,
  onOpenShare,
  onChangeHousehold,
  onOpenMemberSelection,
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
    <>
      {/* Offline Alert Banner */}
      {!isOnline && (
        <div
          data-testid="offline-banner"
          className="bg-amber-50 border-b border-amber-200 px-4 py-1.5 text-center text-[11px] text-amber-800 font-semibold flex items-center justify-center gap-1.5"
        >
          <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
          <span>Đang chạy ngoại tuyến (Mất kết nối mạng)</span>
        </div>
      )}

      {/* Screen-reader compatibility element for sync status */}
      <span
        data-testid="sync-status-badge"
        className="sr-only"
        title={isOnline ? 'Đang đồng bộ Online' : 'Chế độ máy Local'}
      >
        {isOnline ? '🟢 Online' : '🟡 Chế độ máy'}
      </span>

      <header className="px-5 pt-4 pb-3 bg-white border-b border-slate-100 sticky top-0 z-20">
        <div className="flex items-center justify-between">
          {/* Top Left: Minimalist Household Pill without persistent Online */}
          <div
            data-testid="household-code-badge"
            className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-[#FAFBFD] border border-slate-200/80 text-xs text-slate-600 font-medium"
          >
            <span>🏠 Mã: <b>{householdCode}</b></span>
          </div>

          {/* Top Right: Share Button + User Profile Button */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleQuickCopy}
              data-testid="quick-share-button"
              title="Sao chép link tham gia Nhà"
              aria-label="Sao chép link tham gia Nhà"
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium text-slate-500 hover:text-slate-800 hover:bg-slate-50 transition border border-transparent hover:border-slate-200 cursor-pointer"
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

            {/* Profile Button: Rounded pill with active member name, clicking opens member selection */}
            <button
              onClick={onOpenMemberSelection}
              data-testid="profile-button"
              className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-white hover:bg-slate-50 text-[#334E68] text-xs font-bold border border-slate-200 shadow-xs active:scale-95 transition cursor-pointer"
              title="Bấm để đổi Thành viên"
            >
              <span
                data-testid="nickname-badge"
                className="inline-flex items-center gap-1.5"
              >
                <span className="w-2 h-2 rounded-full bg-[#5B7C99]" />
                <span className="sr-only">• </span>
                <span>{nickname}</span>
              </span>
            </button>

            {onChangeHousehold && (
              <button
                onClick={onChangeHousehold}
                data-testid="switch-household-button"
                title="Đổi hoặc rời Nhà"
                className="text-[11px] text-slate-400 hover:text-slate-600 px-1 py-1 cursor-pointer"
              >
                Đổi
              </button>
            )}
          </div>
        </div>

        <h1 className="text-lg font-bold text-[#334E68] mt-2">
          {activeTab === 'plan' ? 'Kế hoạch tuần này' : 'Menu gia đình'}
        </h1>
      </header>
    </>
  );
};
