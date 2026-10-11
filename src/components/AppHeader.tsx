import React, { useState, useRef, useEffect } from 'react';
import { Home } from 'lucide-react';

export interface AppHeaderProps {
  householdCode: string;
  memberName: string;
  activeTab: 'plan' | 'menu';
  onOpenShare?: () => void;
  onChangeHousehold?: () => void;
  onChangeMember?: () => void;
}

export const AppHeader: React.FC<AppHeaderProps> = ({
  householdCode,
  memberName,
  activeTab,
  onOpenShare,
  onChangeHousehold,
  onChangeMember,
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!isMenuOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        setIsMenuOpen(false);
        buttonRef.current?.focus();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isMenuOpen]);

  return (
    <header className="px-4 py-2.5 bg-white border-b border-slate-100 flex items-center justify-between gap-2 flex-shrink-0 z-20">
      <h1 className="sr-only">
        {activeTab === 'plan' ? 'Kế hoạch tuần này' : 'Menu gia đình'}
      </h1>

      <div className="min-w-0 flex-shrink">
        <button
          type="button"
          onClick={onOpenShare}
          data-testid="household-code-badge"
          title={`Mã nhà: ${householdCode}`}
          aria-label={`Mã nhà: ${householdCode}`}
          className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-[#FEF7DC] text-[#334E68] border border-[#EFE4B5] hover:bg-[#faefc6] transition active:scale-95 min-w-0 max-w-[170px]"
        >
          <Home className="w-3.5 h-3.5 text-[#5B7C99] flex-shrink-0" />
          <span className="truncate">Mã: {householdCode}</span>
        </button>
      </div>

      <div className="flex-shrink min-w-0">
        {activeTab === 'plan' ? (
          <div className="relative" ref={menuRef}>
            <button
              ref={buttonRef}
              type="button"
              data-testid="member-name-button"
              aria-haspopup="menu"
              aria-expanded={isMenuOpen}
              onClick={() => setIsMenuOpen((prev) => !prev)}
              title={memberName}
              className="inline-flex items-center text-xs font-medium text-slate-700 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-full transition active:scale-95 max-w-[160px] min-w-0"
            >
              <span data-testid="member-name-badge" className="truncate">{memberName}</span>
            </button>

            {isMenuOpen && (
              <div
                role="menu"
                aria-label="Menu thành viên"
                className="absolute right-0 mt-1.5 w-40 bg-white rounded-xl shadow-lg border border-slate-100 py-1 z-30 flex flex-col"
              >
                <button
                  type="button"
                  role="menuitem"
                  data-testid="menu-item-switch-household"
                  onClick={() => {
                    setIsMenuOpen(false);
                    onChangeHousehold?.();
                  }}
                  className="w-full text-left px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition flex items-center gap-2"
                >
                  Đổi gia đình
                </button>
                <button
                  type="button"
                  role="menuitem"
                  data-testid="menu-item-switch-member"
                  onClick={() => {
                    setIsMenuOpen(false);
                    onChangeMember?.();
                  }}
                  className="w-full text-left px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition flex items-center gap-2"
                >
                  Đổi thành viên
                </button>
              </div>
            )}
          </div>
        ) : (
          <span
            data-testid="member-name-badge"
            title={memberName}
            className="text-xs text-slate-500 font-medium inline-block max-w-[160px] truncate"
          >
            {memberName}
          </span>
        )}
      </div>
    </header>
  );
};
