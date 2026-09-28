import React from 'react';
import { BookOpen, Plus, Search } from 'lucide-react';

export const MenuView: React.FC = () => {
  return (
    <div className="flex-1 flex flex-col bg-[#FAFBFD] p-4" data-testid="menu-view">
      {/* Search Input Bar (disabled/preview in Ticket 01 shell) */}
      <div className="relative mb-4">
        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
          <Search className="w-4 h-4" />
        </div>
        <input
          type="text"
          placeholder="Tìm món ăn trong Menu..."
          disabled
          className="w-full pl-9 pr-4 py-2.5 rounded-2xl bg-white border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:outline-none"
        />
      </div>

      <div className="flex items-center justify-between mb-3">
        <div>
          <h2 className="text-sm font-bold text-[#334E68]">Danh sách Món ăn</h2>
          <p className="text-[11px] text-slate-400">Menu của gia đình bạn</p>
        </div>
        <button
          disabled
          data-testid="add-dish-menu-btn"
          className="inline-flex items-center gap-1 px-3.5 py-1.5 rounded-full bg-[#5B7C99] text-white text-xs font-bold transition opacity-90 shadow-sm"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Thêm Món ăn</span>
        </button>
      </div>

      {/* Empty State */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center border-2 border-dashed border-slate-200 rounded-3xl bg-white/60 my-4">
        <div className="w-14 h-14 rounded-full bg-[#FEF7DC] border border-[#EFE4B5] flex items-center justify-center mb-3">
          <BookOpen className="w-6 h-6 text-[#5B7C99]" />
        </div>
        <h3 className="text-sm font-bold text-slate-700">Menu gia đình đang trống</h3>
        <p className="text-xs text-slate-400 mt-1 max-w-[240px]">
          Hãy thêm các Món ăn yêu thích của gia đình để bắt đầu lên Kế hoạch cho từng ngày.
        </p>
      </div>
    </div>
  );
};
