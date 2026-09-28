import React, { useState } from 'react';
import { Plus, Utensils } from 'lucide-react';

export type MealType = 'breakfast' | 'lunch' | 'dinner';

interface DayItem {
  label: string;
  dayNumber: number;
  dateStr: string;
  isToday: boolean;
}

export const PlanView: React.FC = () => {
  const [activeMeal, setActiveMeal] = useState<MealType>('dinner'); // Dinner-first default!
  const [selectedDayIndex, setSelectedDayIndex] = useState<number>(0);

  // Generate 7 days for current week (Monday to Sunday)
  const days: DayItem[] = [
    { label: 'T2', dayNumber: 28, dateStr: '2026-09-28', isToday: false },
    { label: 'T3', dayNumber: 29, dateStr: '2026-09-29', isToday: true },
    { label: 'T4', dayNumber: 30, dateStr: '2026-09-30', isToday: false },
    { label: 'T5', dayNumber: 1, dateStr: '2026-10-01', isToday: false },
    { label: 'T6', dayNumber: 2, dateStr: '2026-10-02', isToday: false },
    { label: 'T7', dayNumber: 3, dateStr: '2026-10-03', isToday: false },
    { label: 'CN', dayNumber: 4, dateStr: '2026-10-04', isToday: false },
  ];

  const getMealTitle = (meal: MealType) => {
    switch (meal) {
      case 'breakfast': return 'Bữa Sáng';
      case 'lunch': return 'Bữa Trưa';
      case 'dinner': return 'Bữa Tối';
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-[#FAFBFD]" data-testid="plan-view">
      {/* Date Ribbon (Horizontal scrollable strip) */}
      <div 
        className="bg-white px-4 py-3 flex gap-2 overflow-x-auto shadow-xs border-b border-slate-100"
        data-testid="date-ribbon"
      >
        {days.map((d, idx) => {
          const isSelected = idx === selectedDayIndex;
          return (
            <button
              key={d.dateStr}
              onClick={() => {
                setSelectedDayIndex(idx);
                setActiveMeal('dinner'); // Dinner-first rule
              }}
              data-testid={`day-btn-${idx}`}
              className={`flex-shrink-0 flex flex-col items-center justify-center w-12 py-2 rounded-2xl transition-all ${
                isSelected
                  ? 'bg-gradient-to-b from-[#5B7C99] to-[#46637D] text-white shadow-md shadow-[#5B7C99]/30 scale-105'
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
              }`}
            >
              <span className="text-[10px] font-medium opacity-80 uppercase">{d.label}</span>
              <span className="text-xs font-bold mt-0.5">{d.dayNumber}</span>
              {d.isToday && (
                <span className={`w-1.5 h-1.5 rounded-full mt-1 ${isSelected ? 'bg-[#FEF7DC]' : 'bg-[#5B7C99]'}`} />
              )}
            </button>
          );
        })}
      </div>

      {/* Content Area */}
      <div className="p-4 flex-1 flex flex-col">
        {/* Meal Header & Dinner-First Selector */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              {days[selectedDayIndex]?.label} - Ngày {days[selectedDayIndex]?.dayNumber}
            </span>
            {activeMeal === 'dinner' && (
              <span className="text-[11px] font-semibold text-[#334E68] bg-[#FEF7DC] px-2.5 py-0.5 rounded-full border border-[#EFE4B5]">
                ✨ Bữa chính
              </span>
            )}
          </div>

          {/* Segmented Control for Meals */}
          <div className="p-1 rounded-2xl bg-slate-200/60 flex gap-1">
            <button
              onClick={() => setActiveMeal('breakfast')}
              data-testid="meal-tab-breakfast"
              className={`flex-1 py-1.5 rounded-xl text-xs font-medium transition ${
                activeMeal === 'breakfast'
                  ? 'bg-white text-[#334E68] shadow-sm font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Sáng
            </button>
            <button
              onClick={() => setActiveMeal('lunch')}
              data-testid="meal-tab-lunch"
              className={`flex-1 py-1.5 rounded-xl text-xs font-medium transition ${
                activeMeal === 'lunch'
                  ? 'bg-white text-[#334E68] shadow-sm font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Trưa
            </button>
            <button
              onClick={() => setActiveMeal('dinner')}
              data-testid="meal-tab-dinner"
              className={`flex-1 py-1.5 rounded-xl text-xs font-medium transition relative ${
                activeMeal === 'dinner'
                  ? 'bg-[#FEF7DC] text-[#334E68] border border-[#EFE4B5] shadow-sm font-bold'
                  : 'text-slate-600 hover:text-[#334E68]'
              }`}
            >
              Tối
              {activeMeal === 'dinner' && (
                <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-[#5B7C99]"></span>
              )}
            </button>
          </div>
        </div>

        {/* Meal Dishes Section */}
        <div className="flex-1 flex flex-col">
          <div className="flex items-center justify-between mb-2.5">
            <h2 className="text-sm font-bold text-[#334E68] flex items-center gap-1.5">
              <span>{getMealTitle(activeMeal)}</span>
              <span className="text-xs px-2 py-0.2 rounded-full bg-slate-200/80 text-slate-600">0 món</span>
            </h2>

            <button
              data-testid="add-dish-to-plan-btn"
              className="inline-flex items-center gap-1 px-3.5 py-1.5 rounded-full bg-[#FEF7DC] hover:bg-[#FDF2C7] text-[#334E68] text-xs font-bold transition active:scale-95 border border-[#EFE4B5] shadow-xs"
            >
              <Plus className="w-3.5 h-3.5 text-[#5B7C99]" />
              Thêm món
            </button>
          </div>

          {/* Empty Meal State */}
          <div className="flex-1 flex flex-col items-center justify-center p-6 text-center border-2 border-dashed border-slate-200 rounded-3xl bg-white/60 my-2">
            <div className="w-12 h-12 rounded-full bg-[#FEF7DC] text-[#334E68] border border-[#EFE4B5] flex items-center justify-center mb-2">
              <Utensils className="w-5 h-5 text-[#5B7C99]" />
            </div>
            <p className="text-xs font-bold text-slate-700">Chưa có món nào cho {getMealTitle(activeMeal)}</p>
            <p className="text-[11px] text-slate-400 mt-1 max-w-[200px]">
              Bấm nút thêm món từ Menu của nhà để lên kế hoạch bữa ăn
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
