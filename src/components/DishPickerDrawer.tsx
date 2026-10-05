import React, { useState, useRef } from 'react';
import { Dish, DishInput, filterDishes, hasExactDishMatch } from '../domain/dish';
import { Search, X, Check } from 'lucide-react';
import { DishModal } from './DishModal';

export interface DishPickerDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  mealTitle: string;
  dishes: Dish[];
  alreadyAddedDishIds: string[];
  onConfirm: (selectedDishIds: string[]) => Promise<void> | void;
  onAddNewDish?: (input: DishInput) => Promise<string>;
}

interface QuickAddBannerProps {
  query: string;
  onClick: () => void;
  variant?: 'empty' | 'list-end';
}

const QuickAddBanner: React.FC<QuickAddBannerProps> = ({
  query,
  onClick,
  variant = 'list-end',
}) => (
  <div
    data-testid="picker-quick-add-banner"
    className={variant === 'list-end' ? 'pt-2 text-center' : 'mt-3'}
  >
    <button
      type="button"
      onClick={onClick}
      data-testid="picker-quick-add-btn"
      className={
        variant === 'list-end'
          ? 'w-full py-2.5 px-3 rounded-2xl bg-[#FEF7DC]/80 border border-dashed border-[#EFE4B5] text-[#334E68] font-bold text-xs hover:bg-[#FEF7DC] transition shadow-xs'
          : 'px-4 py-2 rounded-full bg-[#FEF7DC] text-[#334E68] border border-[#EFE4B5] font-bold text-xs hover:bg-[#FDF2C7] transition shadow-xs'
      }
    >
      + Thêm Món ăn mới: &quot;{query}&quot;
    </button>
  </div>
);

export const DishPickerDrawer: React.FC<DishPickerDrawerProps> = ({
  isOpen,
  onClose,
  mealTitle,
  dishes,
  alreadyAddedDishIds,
  onConfirm,
  onAddNewDish,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDishIds, setSelectedDishIds] = useState<string[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const resetStateAndClose = () => {
    setSelectedDishIds([]);
    setSearchQuery('');
    setIsSearchFocused(false);
    onClose();
  };

  const handleDismissKeyboard = () => {
    if (document.activeElement === searchInputRef.current) {
      searchInputRef.current?.blur();
    }
  };

  if (!isOpen) return null;

  const filteredDishes = filterDishes(dishes, searchQuery);
  const trimmedQuery = searchQuery.trim();
  const isExactMatch = hasExactDishMatch(dishes, trimmedQuery);
  const showQuickAdd = trimmedQuery.length > 0 && !isExactMatch;
  const isSearchActive = trimmedQuery.length > 0 || isSearchFocused;

  const toggleDishSelection = (dishId: string) => {
    if (alreadyAddedDishIds.includes(dishId)) return;
    setSelectedDishIds((prev) =>
      prev.includes(dishId) ? prev.filter((id) => id !== dishId) : [...prev, dishId]
    );
  };

  const handleConfirm = () => {
    if (selectedDishIds.length === 0) return;
    onConfirm(selectedDishIds);
    resetStateAndClose();
  };

  const handleClose = () => {
    resetStateAndClose();
  };

  return (
    <div
      data-testid="dish-picker-drawer"
      className="fixed inset-0 z-50 flex flex-col justify-end sm:justify-center sm:items-center sm:p-4 bg-slate-900/40 backdrop-blur-xs transition-opacity"
      onClick={handleClose}
      role="dialog"
      aria-modal="true"
      aria-label={`Chọn Món ăn cho ${mealTitle}`}
    >
      <div
        data-testid="picker-drawer-container"
        className="w-full max-w-[420px] mx-auto bg-white rounded-t-[32px] sm:rounded-[32px] p-5 pt-3 shadow-2xl max-h-[92dvh] sm:max-h-[85%] flex flex-col border-t sm:border border-slate-100 animate-in slide-in-from-bottom duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drawer Grab Bar */}
        <div className="w-12 h-1.5 bg-slate-300 rounded-full mx-auto mb-3" />

        {/* Drawer Header */}
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-base font-bold text-[#334E68]">Chọn Món ăn cho {mealTitle}</h3>
            {!isSearchActive && (
              <p data-testid="picker-drawer-subtitle" className="text-[11px] text-slate-400">
                Tick chọn Món ăn từ Menu của gia đình
              </p>
            )}
          </div>
          <button
            onClick={handleClose}
            data-testid="close-dish-picker-btn"
            className="w-7 h-7 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 flex items-center justify-center font-bold text-xs transition"
            aria-label="Đóng"
          >
            ✕
          </button>
        </div>

        {/* Real-time Search Input */}
        <div className="relative mb-3">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            ref={searchInputRef}
            type="text"
            autoFocus
            data-testid="picker-search-input"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => setIsSearchFocused(true)}
            onBlur={() => setIsSearchFocused(false)}
            placeholder="Tìm Món ăn hoặc phân loại/tag..."
            className="w-full pl-9 pr-8 py-2 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#5B7C99] focus:bg-white transition"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
              aria-label="Xóa từ khóa tìm kiếm"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Dish List */}
        <div
          data-testid="picker-dish-list"
          onScroll={handleDismissKeyboard}
          onTouchMove={handleDismissKeyboard}
          className="flex-1 min-h-0 overflow-y-auto overscroll-contain py-1 space-y-2"
        >
          {dishes.length === 0 && trimmedQuery.length === 0 ? (
            <div className="py-8 text-center text-slate-400 text-xs">
              <p>Menu gia đình chưa có Món ăn nào.</p>
              <p className="text-[11px] mt-1 text-slate-400">
                Vui lòng vào tab Menu để thêm Món ăn trước.
              </p>
            </div>
          ) : filteredDishes.length === 0 ? (
            <div className="py-8 text-center text-slate-400 text-xs flex flex-col items-center justify-center">
              <p className="text-xs font-medium">
                Không tìm thấy Món ăn nào phù hợp với &quot;<strong>{searchQuery}</strong>&quot;
              </p>
              {showQuickAdd && (
                <QuickAddBanner
                  query={trimmedQuery}
                  onClick={() => setIsModalOpen(true)}
                  variant="empty"
                />
              )}
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                data-testid="clear-search-btn"
                className="mt-2 text-xs text-[#5B7C99] font-bold hover:underline"
              >
                Xóa tìm kiếm
              </button>
            </div>
          ) : (
            <>
              {filteredDishes.map((dish) => {
                const isChecked = selectedDishIds.includes(dish.id);
                const isAlreadyInMeal = alreadyAddedDishIds.includes(dish.id);

                return (
                  <div
                    key={dish.id}
                    data-testid={`picker-dish-item-${dish.id}`}
                    onClick={() => toggleDishSelection(dish.id)}
                    aria-disabled={isAlreadyInMeal}
                    className={`p-3 rounded-2xl border transition flex items-center justify-between ${
                      isAlreadyInMeal
                        ? 'bg-slate-100/70 border-slate-200 opacity-60 cursor-not-allowed'
                        : isChecked
                        ? 'bg-[#FEF7DC] border-[#EFE4B5] shadow-xs cursor-pointer'
                        : 'bg-slate-50 border-slate-100 hover:bg-slate-100/70 cursor-pointer'
                    }`}
                  >
                    <div className="pr-2">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <p className="text-xs font-bold text-[#334E68]">{dish.name}</p>
                        {dish.tag && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-[#FEF7DC] text-[#334E68] border border-[#EFE4B5]">
                            {dish.tag}
                          </span>
                        )}
                        {isAlreadyInMeal && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-slate-200 text-slate-500 font-medium">
                            Đã lên lịch
                          </span>
                        )}
                      </div>
                    </div>

                    <div
                      data-testid={`picker-checkbox-${dish.id}`}
                      className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition flex-shrink-0 ${
                        isAlreadyInMeal
                          ? 'border-slate-300 bg-slate-200 text-slate-400'
                          : isChecked
                          ? 'bg-[#5B7C99] border-[#5B7C99] text-white'
                          : 'border-slate-300 bg-white'
                      }`}
                    >
                      {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                    </div>
                  </div>
                );
              })}

              {showQuickAdd && (
                <QuickAddBanner
                  query={trimmedQuery}
                  onClick={() => setIsModalOpen(true)}
                  variant="list-end"
                />
              )}
            </>
          )}
        </div>

        {/* Footer Confirm Button */}
        <div className="pt-2.5 border-t border-slate-100 mt-1.5">
          <button
            onClick={handleConfirm}
            disabled={selectedDishIds.length === 0}
            data-testid="confirm-add-dishes-btn"
            className={`w-full py-2.5 rounded-full font-bold text-xs shadow-md transition active:scale-98 ${
              selectedDishIds.length > 0
                ? 'bg-[#5B7C99] hover:bg-[#4a6b88] text-white shadow-[#5B7C99]/30'
                : 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
            }`}
          >
            Xác nhận thêm ({selectedDishIds.length} Món ăn)
          </button>
        </div>
      </div>

      {/* Layered DishModal */}
      {onAddNewDish && (
        <DishModal
          isOpen={isModalOpen}
          initialName={trimmedQuery}
          onSave={async (input) => {
            const newDishId = await onAddNewDish(input);
            const combined = [...selectedDishIds, newDishId];
            await onConfirm(combined);
            resetStateAndClose();
          }}
          onClose={() => setIsModalOpen(false)}
        />
      )}
    </div>
  );
};
