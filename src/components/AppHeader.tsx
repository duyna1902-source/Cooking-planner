import React from 'react';
import { Share2, Check, Home } from 'lucide-react';
import { createShareUrl } from '../domain/household';
import { useClipboardCopy } from '../hooks/useClipboardCopy';

interface AppHeaderProps {
  householdCode: string;
  nickname: string;
  activeTab: 'plan' | 'menu';
  onOpenShare?: () => void;
  onChangeHousehold?: () => void;
}

export const AppHeader: React.FC<AppHeaderProps> = ({
  householdCode,
  nickname,
  activeTab,
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
    <header className="px-5 pt-4 pb-3 bg-white border-b border-slate-100 flex items-center justify-between sticky top-0 z-20">
      <div>
        <div className="flex items-center gap-2">
          <span 
            data-testid="household-code-badge"
            className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-[#FEF7DC] text-[#334E68] border border-[#EFE4B5]"
          >
            <Home className="w-3 h-3 text-[#5B7C99]" />
            Mã: {householdCode}
          </span>
          <span 
            data-testid="nickname-badge"
            className="text-xs text-slate-500 font-medium"
          >
            • {nickname}
          </span>
        </div>
        <h1 className="text-lg font-bold text-[#334E68] mt-1">
          {activeTab === 'plan' ? 'Kế hoạch tuần này' : 'Menu gia đình'}
        </h1>
      </div>

      <div className="flex items-center gap-1.5">
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
