import React, { useState, useEffect } from 'react';
import { Dish, DishInput, validateDishInput } from '../domain/dish';
import { X, UtensilsCrossed } from 'lucide-react';

interface DishModalProps {
  isOpen: boolean;
  initialDish?: Dish | null;
  onSave: (input: DishInput) => Promise<void> | void;
  onClose: () => void;
}

export const DishModal: React.FC<DishModalProps> = ({
  isOpen,
  initialDish,
  onSave,
  onClose,
}) => {
  const [name, setName] = useState('');
  const [tag, setTag] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (initialDish) {
      setName(initialDish.name);
      setTag(initialDish.tag || '');
    } else {
      setName('');
      setTag('');
    }
    setError(null);
  }, [initialDish, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const input: DishInput = {
      name,
      tag: tag.trim() || undefined,
    };

    const validation = validateDishInput(input);
    if (!validation.valid) {
      setError(validation.error || 'Dữ liệu không hợp lệ');
      return;
    }

    try {
      setIsSubmitting(true);
      await onSave(input);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Có lỗi xảy ra khi lưu Món ăn');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="dish-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm bg-white rounded-3xl p-5 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-[#FEF7DC] border border-[#EFE4B5] flex items-center justify-center">
              <UtensilsCrossed className="w-4 h-4 text-[#5B7C99]" />
            </div>
            <h3 id="dish-modal-title" className="text-base font-bold text-[#334E68]">
              {initialDish ? 'Chỉnh sửa Món ăn' : 'Thêm Món ăn mới'}
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

        <form onSubmit={handleSubmit} className="pt-4 space-y-4">
          <div>
            <label htmlFor="dish-name-input" className="block text-xs font-semibold text-slate-700 mb-1.5">
              Tên Món ăn: <span className="text-rose-500">*</span>
            </label>
            <input
              id="dish-name-input"
              data-testid="dish-name-input"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ví dụ: Thịt ba chỉ kho trứng..."
              autoFocus
              className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#5B7C99] focus:bg-white transition"
            />
          </div>

          <div>
            <label htmlFor="dish-tag-input" className="block text-xs font-semibold text-slate-700 mb-1.5">
              Phân loại / Tag (tùy chọn):
            </label>
            <input
              id="dish-tag-input"
              data-testid="dish-tag-input"
              type="text"
              value={tag}
              onChange={(e) => setTag(e.target.value)}
              placeholder="Ví dụ: Món mặn, Canh, Xào, Ăn sáng..."
              className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#5B7C99] focus:bg-white transition"
            />
            <span className="text-[11px] text-slate-400 mt-1 block">
              Gõ tự do để dễ tìm kiếm và lọc khi chọn Món ăn.
            </span>
          </div>

          {error && (
            <div data-testid="dish-form-error" className="text-xs text-rose-600 bg-rose-50 p-2.5 rounded-xl border border-rose-100 font-medium">
              {error}
            </div>
          )}

          <div className="pt-2 flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              data-testid="save-dish-btn"
              className="flex-1 py-2.5 rounded-full bg-[#5B7C99] hover:bg-[#46637D] text-white text-xs font-bold shadow-md shadow-[#5B7C99]/30 transition active:scale-98 disabled:opacity-50"
            >
              {isSubmitting ? 'Đang lưu...' : 'Lưu Món ăn'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
