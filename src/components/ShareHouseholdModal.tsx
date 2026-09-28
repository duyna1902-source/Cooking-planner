import React, { useState } from 'react';
import { createShareUrl } from '../domain/household';
import { Copy, Check, X, Share2 } from 'lucide-react';

interface ShareHouseholdModalProps {
  householdCode: string;
  isOpen: boolean;
  onClose: () => void;
}

export const ShareHouseholdModal: React.FC<ShareHouseholdModalProps> = ({
  householdCode,
  isOpen,
  onClose
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const shareUrl = createShareUrl(householdCode);

  const handleCopy = async () => {
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(shareUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch {
      // Ignored
    }
  };

  return (
    <div 
      role="dialog"
      aria-modal="true"
      aria-labelledby="share-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-sm bg-white rounded-3xl p-5 shadow-xl border border-slate-100"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-[#FEF7DC] border border-[#EFE4B5] flex items-center justify-center">
              <Share2 className="w-4 h-4 text-[#5B7C99]" />
            </div>
            <h3 id="share-modal-title" className="text-sm font-bold text-[#334E68]">
              Chia sẻ Nhà cho gia đình
            </h3>
          </div>
          <button 
            onClick={onClose}
            aria-label="Đóng"
            className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center text-xs font-bold"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="py-4 space-y-3">
          <div className="p-3 bg-[#FAFBFD] rounded-2xl border border-slate-100 text-center">
            <span className="text-[11px] text-slate-400 block mb-0.5">Mã nhà của bạn</span>
            <span className="text-xl font-black text-[#334E68] tracking-wider">{householdCode}</span>
          </div>

          <div>
            <label className="text-[11px] font-semibold text-slate-500 block mb-1">
              Link tham gia trực tiếp:
            </label>
            <div className="flex items-center gap-1.5">
              <input
                readOnly
                data-testid="share-modal-url-input"
                value={shareUrl}
                className="flex-1 text-xs bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2 text-slate-600 select-all"
              />
              <button
                type="button"
                onClick={handleCopy}
                data-testid="share-modal-copy-btn"
                className="px-3 py-2 rounded-xl bg-[#5B7C99] hover:bg-[#4a6b88] text-white text-xs font-semibold transition flex items-center gap-1 flex-shrink-0"
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Đã chép' : 'Sao chép'}</span>
              </button>
            </div>
          </div>
          <p className="text-[11px] text-slate-400">
            Người thân chỉ cần mở link này trên điện thoại và nhập biệt danh để vào cùng Nhà.
          </p>
        </div>

        <div className="pt-2">
          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
