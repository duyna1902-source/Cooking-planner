import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Dish, DishInput, filterDishes, hasExactDishMatch } from '../domain/dish';
import { DishRepository, defaultDishRepository } from '../services/dishRepository';
import { PlanRepository, defaultPlanRepository } from '../services/planRepository';
import { DishModal } from './DishModal';
import { BookOpen, Plus, Search, Trash2, Edit3, X, Utensils, AlertCircle } from 'lucide-react';

interface MenuViewProps {
  householdCode?: string;
  dishRepository?: DishRepository;
  planRepository?: PlanRepository;
}

export const MenuView: React.FC<MenuViewProps> = ({
  householdCode = '',
  dishRepository = defaultDishRepository,
  planRepository = defaultPlanRepository,
}) => {
  const [dishes, setDishes] = useState<Dish[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDish, setEditingDish] = useState<Dish | null>(null);
  const [modalInitialName, setModalInitialName] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);

  const latestHouseholdRef = useRef(householdCode);
  const hasLoadedRef = useRef(false);
  const reqIdRef = useRef(0);

  useEffect(() => {
    latestHouseholdRef.current = householdCode;
    hasLoadedRef.current = false;
    setHasLoadedOnce(false);
    setLoadError(null);
    setDishes([]);
  }, [householdCode]);

  const loadDishes = useCallback(async () => {
    const currentHousehold = householdCode;
    const currentReqId = ++reqIdRef.current;

    if (!currentHousehold) {
      if (latestHouseholdRef.current === currentHousehold && reqIdRef.current === currentReqId) {
        setDishes([]);
        setIsLoading(false);
        setLoadError(null);
        hasLoadedRef.current = true;
        setHasLoadedOnce(true);
      }
      return;
    }

    try {
      setIsLoading(true);
      const data = await dishRepository.getDishes(currentHousehold);
      if (latestHouseholdRef.current === currentHousehold && reqIdRef.current === currentReqId) {
        setDishes(data);
        setLoadError(null);
        hasLoadedRef.current = true;
        setHasLoadedOnce(true);
      }
    } catch {
      if (latestHouseholdRef.current === currentHousehold && reqIdRef.current === currentReqId) {
        if (hasLoadedRef.current) {
          setLoadError('Không thể cập nhật danh sách Món ăn');
        } else {
          setLoadError('Không thể tải danh sách Món ăn');
        }
      }
    } finally {
      if (latestHouseholdRef.current === currentHousehold && reqIdRef.current === currentReqId) {
        setIsLoading(false);
      }
    }
  }, [householdCode, dishRepository]);

  useEffect(() => {
    loadDishes();
  }, [loadDishes]);

  useEffect(() => {
    if (!householdCode) return;
    const unsubDish = dishRepository.subscribe?.(householdCode, () => {
      loadDishes();
    });
    return () => {
      unsubDish?.();
    };
  }, [householdCode, dishRepository, loadDishes]);

  const handleOpenAdd = () => {
    setEditingDish(null);
    setModalInitialName('');
    setIsModalOpen(true);
  };

  const handleOpenAddWithInitialName = (name: string) => {
    setEditingDish(null);
    setModalInitialName(name);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (dish: Dish) => {
    setEditingDish(dish);
    setModalInitialName('');
    setIsModalOpen(true);
  };

  const [dishToDelete, setDishToDelete] = useState<Dish | null>(null);

  const handleSaveDish = async (input: DishInput) => {
    if (!householdCode) return;
    if (editingDish) {
      await dishRepository.updateDish(householdCode, editingDish.id, input);
    } else {
      await dishRepository.addDish(householdCode, input);
    }
    await loadDishes();
  };

  const handleConfirmDelete = async () => {
    if (!householdCode || !dishToDelete) return;
    await Promise.all([
      dishRepository.deleteDish(householdCode, dishToDelete.id),
      planRepository.deletePlanItemsByDishId(householdCode, dishToDelete.id),
    ]);
    setDishToDelete(null);
    await loadDishes();
  };

  const filteredDishes = filterDishes(dishes, searchQuery);
  const trimmedQuery = searchQuery.trim();
  const isExactMatch = hasExactDishMatch(dishes, trimmedQuery);
  const showQuickAdd = trimmedQuery.length > 0 && !isExactMatch;

  return (
    <div className="flex-1 min-h-0 flex flex-col bg-[#FAFBFD] p-4" data-testid="menu-view">
      {/* Real-time Search Input Bar */}
      <div className="relative mb-3.5 flex-shrink-0">
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
      <div className="flex items-center justify-between mb-3 flex-shrink-0">
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

      {/* Refresh Error Banner */}
      {loadError && hasLoadedOnce && (
        <div
          data-testid="menu-refresh-error"
          className="mb-3 p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 flex items-center justify-between text-xs gap-2 flex-shrink-0 animate-in fade-in"
        >
          <div className="flex items-center gap-2 min-w-0">
            <AlertCircle className="w-4 h-4 text-rose-500 flex-shrink-0" />
            <span className="truncate">{loadError}</span>
          </div>
          <button
            onClick={() => loadDishes()}
            data-testid="menu-refresh-retry-btn"
            className="px-3 py-1 rounded-full bg-white hover:bg-rose-100 text-rose-700 font-bold border border-rose-200 transition shadow-xs flex-shrink-0"
          >
            Thử lại
          </button>
        </div>
      )}

      {/* Content: Loading, Error, Empty, or List States */}
      {isLoading && !hasLoadedOnce ? (
        <div className="flex-1 flex items-center justify-center text-xs text-slate-400">
          Đang tải Menu...
        </div>
      ) : loadError && !hasLoadedOnce ? (
        /* Initial Load Error State */
        <div
          data-testid="menu-load-error"
          className="flex-1 flex flex-col items-center justify-center p-6 text-center border-2 border-dashed border-rose-200 rounded-3xl bg-rose-50/50 my-4"
        >
          <div className="w-14 h-14 rounded-full bg-rose-100 border border-rose-200 flex items-center justify-center mb-3 text-rose-600">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-rose-800">Không thể tải danh sách Món ăn</h3>
          <p className="text-xs text-rose-600/80 mt-1 max-w-[260px]">
            Đã xảy ra lỗi khi tải danh sách Món ăn của gia đình. Vui lòng bấm Thử lại.
          </p>
          <button
            onClick={() => loadDishes()}
            data-testid="menu-retry-btn"
            className="mt-4 px-4 py-2 rounded-full bg-[#5B7C99] hover:bg-[#46637D] text-white text-xs font-bold transition shadow-xs flex items-center gap-1.5"
          >
            <span>Thử lại</span>
          </button>
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
          {showQuickAdd && (
            <button
              onClick={() => handleOpenAddWithInitialName(trimmedQuery)}
              data-testid="quick-add-dish-btn"
              className="mt-3 px-4 py-2 rounded-full bg-[#FEF7DC] text-[#334E68] border border-[#EFE4B5] font-bold text-xs hover:bg-[#FDF2C7] transition shadow-xs"
            >
              + Thêm Món ăn mới: "{trimmedQuery}" vào Menu
            </button>
          )}
          <button
            onClick={() => setSearchQuery('')}
            className="mt-2 text-xs text-[#5B7C99] font-bold hover:underline"
          >
            Xóa bộ lọc tìm kiếm
          </button>
        </div>
      ) : (
        /* Dishes List */
        <div className="space-y-2.5 overflow-y-auto overscroll-contain flex-1 min-h-0 pr-0.5" data-testid="dishes-list">
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
                  onClick={() => setDishToDelete(dish)}
                  data-testid={`delete-dish-${dish.id}`}
                  title="Xóa Món ăn"
                  className="w-7 h-7 rounded-full text-slate-300 hover:text-rose-600 hover:bg-rose-50 flex items-center justify-center transition"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}

          {showQuickAdd && (
            <div className="pt-2 text-center">
              <button
                onClick={() => handleOpenAddWithInitialName(trimmedQuery)}
                data-testid="quick-add-dish-banner"
                className="w-full py-2.5 px-3 rounded-2xl bg-[#FEF7DC]/80 border border-dashed border-[#EFE4B5] text-[#334E68] font-bold text-xs hover:bg-[#FEF7DC] transition shadow-xs"
              >
                + Thêm Món ăn mới: "{trimmedQuery}" vào Menu
              </button>
            </div>
          )}
        </div>
      )}

      {/* Dish Add/Edit Modal */}
      <DishModal
        isOpen={isModalOpen}
        initialDish={editingDish}
        initialName={modalInitialName}
        onSave={handleSaveDish}
        onClose={() => setIsModalOpen(false)}
      />

      {/* Delete Confirmation Dialog */}
      {dishToDelete && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-dialog-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs"
          onClick={() => setDishToDelete(null)}
        >
          <div
            className="w-full max-w-xs bg-white rounded-3xl p-5 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mb-3">
                <Trash2 className="w-5 h-5" />
              </div>
              <h3 id="delete-dialog-title" className="text-sm font-bold text-slate-800">
                Xóa Món ăn
              </h3>
              <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                Bạn có chắc chắn muốn xóa "<strong>{dishToDelete.name}</strong>"? Món ăn này cũng sẽ bị xóa khỏi toàn bộ Kế hoạch tuần đã lên.
              </p>

              <div className="flex items-center gap-2.5 w-full mt-4">
                <button
                  type="button"
                  onClick={() => setDishToDelete(null)}
                  className="flex-1 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition"
                >
                  Hủy
                </button>
                <button
                  type="button"
                  data-testid="confirm-delete-dish-btn"
                  onClick={handleConfirmDelete}
                  className="flex-1 py-2 rounded-xl bg-rose-600 text-xs font-bold text-white hover:bg-rose-700 transition shadow-sm shadow-rose-200"
                >
                  Xóa
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
