import React, { useState, useEffect, useCallback } from 'react';
import { Dish, DishInput, filterDishes } from '../domain/dish';
import { DishRepository, defaultDishRepository } from '../services/dishRepository';
import { DishModal } from './DishModal';
import { BookOpen, Plus, Search, Trash2, Edit3, X, Utensils } from 'lucide-react';

interface MenuViewProps {
  householdCode?: string;
  dishRepository?: DishRepository;
}

export const MenuView: React.FC<MenuViewProps> = ({
  householdCode = '',
  dishRepository = defaultDishRepository,
}) => {
  const [dishes, setDishes] = useState<Dish[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDish, setEditingDish] = useState<Dish | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadDishes = useCallback(async () => {
    if (!householdCode) {
      setDishes([]);
      setIsLoading(false);
      return;
    }
    try {
      setIsLoading(true);
      const data = await dishRepository.getDishes(householdCode);
      setDishes(data);
    } catch {
      // Ignored
    } finally {
      setIsLoading(false);
    }
  }, [householdCode, dishRepository]);

  useEffect(() => {
    loadDishes();
  }, [loadDishes]);

  const handleOpenAdd = () => {
    setEditingDish(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (dish: Dish) => {
    setEditingDish(dish);
    setIsModalOpen(true);
  };

  const handleSaveDish = async (input: DishInput) => {
    if (!householdCode) return;
    if (editingDish) {
      await dishRepository.updateDish(householdCode, editingDish.id, input);
    } else {
      await dishRepository.addDish(householdCode, input);
    }
    await loadDishes();
  };

  const handleDeleteDish = async (dishId: string) => {
    if (!householdCode) return;
    await dishRepository.deleteDish(householdCode, dishId);
    await loadDishes();
  };

  const filteredDishes = filterDishes(dishes, searchQuery);

  return (
    <div className="flex-1 flex flex-col bg-[#FAFBFD] p-4" data-testid="menu-view">
      {/* Real-time Search Input Bar */}
      <div className="relative mb-3.5">
        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
          <Search className="w-4 h-4" />
        </div>
        <input
          type="text"
          data-testid="dish-search-input"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Tìm Món ăn hoặc phân loại/tag..."
          className="w-full pl-9 pr-9 py-2.5 rounded-2xl bg-white border border-slate-200 text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#5B7C99] focus:bg-white transition shadow-xs"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            aria-label="Xóa tìm kiếm"
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Header bar of Menu section */}
      <div className="flex items-center justify-between mb-3">
        <div>
          <h2 className="text-sm font-bold text-[#334E68] flex items-center gap-1.5">
            <span>Danh sách Món ăn</span>
            <span className="text-[11px] px-2 py-0.2 rounded-full bg-slate-200/80 text-slate-600 font-semibold">
              {dishes.length}
            </span>
          </h2>
          <p className="text-[11px] text-slate-400">Menu của gia đình bạn</p>
        </div>
        <button
          onClick={handleOpenAdd}
          data-testid="add-dish-menu-btn"
          className="inline-flex items-center gap-1 px-3.5 py-1.5 rounded-full bg-[#5B7C99] hover:bg-[#46637D] text-white text-xs font-bold transition shadow-sm active:scale-95"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Thêm Món ăn</span>
        </button>
      </div>

      {/* Content: List or Empty States */}
      {isLoading ? (
        <div className="flex-1 flex items-center justify-center text-xs text-slate-400">
          Đang tải Menu...
        </div>
      ) : dishes.length === 0 ? (
        /* Empty State */
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center border-2 border-dashed border-slate-200 rounded-3xl bg-white/60 my-4">
          <div className="w-14 h-14 rounded-full bg-[#FEF7DC] border border-[#EFE4B5] flex items-center justify-center mb-3">
            <BookOpen className="w-6 h-6 text-[#5B7C99]" />
          </div>
          <h3 className="text-sm font-bold text-slate-700">Menu gia đình đang trống</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-[240px]">
            Hãy thêm các Món ăn yêu thích của gia đình để bắt đầu lên Kế hoạch cho từng ngày.
          </p>
          <button
            onClick={handleOpenAdd}
            data-testid="add-first-dish-btn"
            className="mt-4 px-4 py-2 rounded-full bg-[#FEF7DC] hover:bg-[#FDF2C7] border border-[#EFE4B5] text-[#334E68] text-xs font-bold transition shadow-xs flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4 text-[#5B7C99]" />
            <span>Thêm Món ăn đầu tiên</span>
          </button>
        </div>
      ) : filteredDishes.length === 0 ? (
        /* Search Not Found State */
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-400">
          <p className="text-xs font-medium">
            Không tìm thấy Món ăn nào phù hợp với "<strong>{searchQuery}</strong>"
          </p>
          <button
            onClick={() => setSearchQuery('')}
            className="mt-2 text-xs text-[#5B7C99] font-bold hover:underline"
          >
            Xóa bộ lọc tìm kiếm
          </button>
        </div>
      ) : (
        /* Dishes List */
        <div className="space-y-2.5 overflow-y-auto flex-1 pr-0.5" data-testid="dishes-list">
          {filteredDishes.map((dish) => (
            <div
              key={dish.id}
              data-testid={`dish-card-${dish.id}`}
              className="bg-white hover:bg-slate-50/80 border border-slate-100 p-3 rounded-2xl shadow-xs transition flex items-center justify-between group"
            >
              <div 
                className="flex items-center gap-3 flex-1 cursor-pointer mr-2"
                onClick={() => handleOpenEdit(dish)}
              >
                <div className="w-10 h-10 rounded-xl bg-[#EBF1F6] text-[#5B7C99] flex items-center justify-center font-bold text-sm flex-shrink-0">
                  <Utensils className="w-5 h-5 text-[#5B7C99]" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <h4 
                      data-testid="dish-item-name" 
                      className="text-xs sm:text-sm font-bold text-[#334E68] truncate"
                    >
                      {dish.name}
                    </h4>
                    {dish.tag && (
                      <span
                        data-testid="dish-item-tag"
                        className="text-[10px] px-2 py-0.5 rounded-md bg-[#FEF7DC] text-[#334E68] border border-[#EFE4B5] font-medium"
                      >
                        {dish.tag}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1 flex-shrink-0">
                <button
                  onClick={() => handleOpenEdit(dish)}
                  data-testid={`edit-dish-${dish.id}`}
                  title="Chỉnh sửa Món ăn"
                  className="w-7 h-7 rounded-full text-slate-400 hover:text-[#5B7C99] hover:bg-slate-100 flex items-center justify-center transition"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => handleDeleteDish(dish.id)}
                  data-testid={`delete-dish-${dish.id}`}
                  title="Xóa Món ăn"
                  className="w-7 h-7 rounded-full text-slate-300 hover:text-rose-600 hover:bg-rose-50 flex items-center justify-center transition"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Dish Add/Edit Modal */}
      <DishModal
        isOpen={isModalOpen}
        initialDish={editingDish}
        onSave={handleSaveDish}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
};
