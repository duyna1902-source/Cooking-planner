import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  MealType,
  PlanItem,
  getWeekDays,
  formatDateToISO,
  parseISODate,
  getShiftedWeekDate,
  groupPlanItemsByMeal,
  canNavigatePrevWeek,
} from '../domain/plan';
import { Dish } from '../domain/dish';
import { DishRepository, defaultDishRepository } from '../services/dishRepository';
import { PlanRepository, defaultPlanRepository } from '../services/planRepository';
import { DishPickerDrawer } from './DishPickerDrawer';
import { DishDetailDrawer } from './DishDetailDrawer';
import { Plus, Trash2, Utensils, ChevronLeft, ChevronRight, MessageSquare } from 'lucide-react';

export interface PlanViewProps {
  householdCode?: string;
  nickname?: string;
  dishRepository?: DishRepository;
  planRepository?: PlanRepository;
  initialDate?: string;
}

export const PlanView: React.FC<PlanViewProps> = ({
  householdCode = '',
  nickname = '',
  dishRepository = defaultDishRepository,
  planRepository = defaultPlanRepository,
  initialDate,
}) => {
  const today = useMemo(() => new Date(), []);
  const initialIso = initialDate || formatDateToISO(today);

  const [activeDate, setActiveDate] = useState<string>(initialIso);
  const [activeMeal, setActiveMeal] = useState<MealType>('dinner'); // Dinner-first rule!

  const [dishes, setDishes] = useState<Dish[]>([]);
  const [planItems, setPlanItems] = useState<PlanItem[]>([]);
  const [isPickerOpen, setIsPickerOpen] = useState<boolean>(false);
  const [activeDishDetail, setActiveDishDetail] = useState<{
    planItemId: string;
    dishId: string;
    dishName: string;
    dishTag?: string;
  } | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Generate 7 days for the active week
  const weekDays = useMemo(() => {
    return getWeekDays(activeDate, today);
  }, [activeDate, today]);

  const loadData = useCallback(async () => {
    if (!householdCode) {
      setDishes([]);
      setPlanItems([]);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      await planRepository.pruneOldHistory(householdCode, initialIso);
      const [fetchedDishes, fetchedPlans] = await Promise.all([
        dishRepository.getDishes(householdCode),
        planRepository.getPlanItems(householdCode),
      ]);
      setDishes(fetchedDishes);
      setPlanItems(fetchedPlans);
    } catch {
      // Ignored
    } finally {
      setIsLoading(false);
    }
  }, [householdCode, initialIso, dishRepository, planRepository]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (!householdCode) return;
    const unsubPlan = planRepository.subscribe?.(householdCode, () => {
      loadData();
    });
    const unsubDish = dishRepository.subscribe?.(householdCode, () => {
      loadData();
    });
    return () => {
      unsubPlan?.();
      unsubDish?.();
    };
  }, [householdCode, planRepository, dishRepository, loadData]);

  // Check 2-week history boundary
  const canGoPrev = useMemo(() => {
    return canNavigatePrevWeek(activeDate, initialIso);
  }, [activeDate, initialIso]);

  // Group plan items by meal for the active date
  const groupedPlan = useMemo(() => {
    return groupPlanItemsByMeal(planItems, activeDate);
  }, [planItems, activeDate]);

  const currentMealItems = groupedPlan[activeMeal];

  const currentMealDishIds = useMemo(() => {
    return currentMealItems.map((item) => item.dishId);
  }, [currentMealItems]);

  const getMealTitle = (meal: MealType) => {
    switch (meal) {
      case 'breakfast':
        return 'Bữa Sáng';
      case 'lunch':
        return 'Bữa Trưa';
      case 'dinner':
        return 'Bữa Tối';
    }
  };

  const handleDaySelect = (dateStr: string) => {
    setActiveDate(dateStr);
    setActiveMeal('dinner'); // Strict Dinner-First UX rule
  };

  const handlePrevWeek = () => {
    if (!canGoPrev) return;
    setActiveDate(getShiftedWeekDate(activeDate, -1));
    setActiveMeal('dinner');
  };

  const handleNextWeek = () => {
    setActiveDate(getShiftedWeekDate(activeDate, 1));
    setActiveMeal('dinner');
  };

  const handleConfirmAddDishes = async (selectedDishIds: string[]) => {
    if (!householdCode) return;
    await planRepository.addDishesToMeal(householdCode, activeDate, activeMeal, selectedDishIds);
    await loadData();
  };

  const handleRemoveDish = async (dishId: string) => {
    if (!householdCode) return;
    if (activeDishDetail && activeDishDetail.dishId === dishId) {
      setActiveDishDetail(null);
    }
    await planRepository.removeDishFromMeal(householdCode, activeDate, activeMeal, dishId);
    await loadData();
  };

  const activeDayInfo = weekDays.find((d) => d.dateStr === activeDate) || {
    label: '',
    dayNumber: parseISODate(activeDate).getDate(),
    dateStr: activeDate,
    isToday: false,
    fullLabel: activeDate,
  };

  return (
    <div className="flex-1 flex flex-col bg-[#FAFBFD]" data-testid="plan-view">
      {/* Top Header with Week navigation */}
      <div className="px-5 pt-3 pb-2 bg-white border-b border-slate-100 flex items-center justify-between">
        <div>
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            Kế hoạch
          </span>
          <h2 className="text-base font-bold text-[#334E68] -mt-0.5">
            {activeDayInfo.fullLabel || 'Tuần này'}
          </h2>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={handlePrevWeek}
            data-testid="prev-week-btn"
            title="Tuần trước"
            aria-label="Tuần trước"
            disabled={!canGoPrev}
            className={`w-8 h-8 rounded-full flex items-center justify-center transition ${canGoPrev
              ? 'bg-slate-100 hover:bg-slate-200 text-slate-600'
              : 'bg-slate-50 text-slate-300 cursor-not-allowed opacity-50'
              }`}
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={handleNextWeek}
            data-testid="next-week-btn"
            title="Tuần sau"
            aria-label="Tuần sau"
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 transition"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Date Ribbon (Horizontal scrollable strip Monday to Sunday) */}
      <div
        className="bg-white px-4 py-2.5 flex gap-2 overflow-x-auto shadow-xs border-b border-slate-100"
        data-testid="date-ribbon"
      >
        {weekDays.map((d, idx) => {
          const isSelected = d.dateStr === activeDate;
          return (
            <button
              key={d.dateStr}
              onClick={() => handleDaySelect(d.dateStr)}
              data-testid={`day-btn-${idx}`}
              className={`flex-shrink-0 flex flex-col items-center justify-center w-12 py-2 rounded-2xl transition-all ${isSelected
                ? 'bg-gradient-to-b from-[#5B7C99] to-[#46637D] text-white shadow-md shadow-[#5B7C99]/30 scale-105'
                : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                }`}
            >
              <span className="text-[10px] font-medium opacity-80 uppercase">{d.label}</span>
              <span className="text-xs font-bold mt-0.5">{d.dayNumber}</span>
              {d.isToday && (
                <span
                  className={`w-1.5 h-1.5 rounded-full mt-1 ${isSelected ? 'bg-[#FEF7DC]' : 'bg-[#5B7C99]'
                    }`}
                />
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
              {activeDayInfo.fullLabel}
            </span>
          </div>

          {/* Segmented Control for Meals */}
          <div className="p-1 rounded-2xl bg-slate-200/60 flex gap-1">
            <button
              onClick={() => setActiveMeal('breakfast')}
              data-testid="meal-tab-breakfast"
              className={`flex-1 py-1.5 rounded-xl text-xs font-medium transition ${activeMeal === 'breakfast'
                ? 'bg-white text-[#334E68] shadow-sm font-bold'
                : 'text-slate-600 hover:text-slate-900'
                }`}
            >
              Sáng
            </button>
            <button
              onClick={() => setActiveMeal('lunch')}
              data-testid="meal-tab-lunch"
              className={`flex-1 py-1.5 rounded-xl text-xs font-medium transition ${activeMeal === 'lunch'
                ? 'bg-white text-[#334E68] shadow-sm font-bold'
                : 'text-slate-600 hover:text-slate-900'
                }`}
            >
              Trưa
            </button>
            <button
              onClick={() => setActiveMeal('dinner')}
              data-testid="meal-tab-dinner"
              className={`flex-1 py-1.5 rounded-xl text-xs font-medium transition relative ${activeMeal === 'dinner'
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
              <span className="text-xs px-2 py-0.2 rounded-full bg-slate-200/80 text-slate-600">
                {currentMealItems.length} Món ăn
              </span>
            </h2>

            <button
              onClick={() => setIsPickerOpen(true)}
              data-testid="add-dish-to-plan-btn"
              className="inline-flex items-center gap-1 px-3.5 py-1.5 rounded-full bg-[#FEF7DC] hover:bg-[#FDF2C7] text-[#334E68] text-xs font-bold transition active:scale-95 border border-[#EFE4B5] shadow-xs"
            >
              <Plus className="w-3.5 h-3.5 text-[#5B7C99]" />
              Thêm món
            </button>
          </div>

          {/* Dishes List, Loading or Empty State */}
          {isLoading ? (
            <div className="flex-1 flex items-center justify-center p-8">
              <div className="w-8 h-8 rounded-full border-2 border-[#5B7C99] border-t-transparent animate-spin" />
            </div>
          ) : currentMealItems.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center p-6 text-center border-2 border-dashed border-slate-200 rounded-3xl bg-white/60 my-2">
              <div className="w-12 h-12 rounded-full bg-[#FEF7DC] text-[#334E68] border border-[#EFE4B5] flex items-center justify-center mb-2">
                <Utensils className="w-5 h-5 text-[#5B7C99]" />
              </div>
              <p className="text-xs font-bold text-slate-700">
                Chưa có Món ăn nào cho {getMealTitle(activeMeal)}
              </p>
              <p className="text-[11px] text-slate-400 mt-1 max-w-[200px]">
                Bấm nút thêm Món ăn từ Menu của nhà để lên Kế hoạch bữa ăn
              </p>
              <button
                onClick={() => setIsPickerOpen(true)}
                className="mt-3 px-4 py-1.5 rounded-full bg-[#5B7C99] text-white text-xs font-bold hover:bg-[#4a6b88] transition shadow-sm"
              >
                + Thêm món
              </button>
            </div>
          ) : (
            <div className="space-y-2.5 overflow-y-auto pr-0.5">
              {currentMealItems.map((item) => {
                const dish = dishes.find((d) => d.id === item.dishId) || {
                  id: item.dishId,
                  householdCode,
                  name: 'Món ăn đã gỡ',
                  createdAt: item.createdAt,
                };

                return (
                  <div
                    key={item.id}
                    data-testid={`plan-dish-card-${dish.id}`}
                    className="group bg-white hover:bg-slate-50 border border-slate-100 p-3.5 rounded-2xl shadow-sm hover:shadow transition flex items-center justify-between"
                  >
                    <div
                      data-testid={`plan-dish-card-trigger-${dish.name}`}
                      onClick={() =>
                        setActiveDishDetail({
                          planItemId: item.id,
                          dishId: dish.id,
                          dishName: dish.name,
                          dishTag: dish.tag,
                        })
                      }
                      className="flex items-center gap-3 flex-1 cursor-pointer"
                    >
                      <div className="w-10 h-10 rounded-xl bg-[#EBF1F6] text-[#5B7C99] flex items-center justify-center font-bold text-sm">
                        🍲
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <h4 className="text-xs font-bold text-[#334E68]">{dish.name}</h4>
                          {dish.tag && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-[#FEF7DC] text-[#334E68] border border-[#EFE4B5]">
                              {dish.tag}
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-[#5B7C99] font-medium mt-0.5 flex items-center gap-1">
                          <MessageSquare className="w-3 h-3" />
                          <span>Dặn dò Món ăn</span>
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveDish(dish.id);
                      }}
                      data-testid={`remove-dish-from-meal-${dish.id}`}
                      className="w-7 h-7 rounded-full text-slate-300 hover:text-red-500 hover:bg-red-50 flex items-center justify-center transition ml-2 flex-shrink-0"
                      title="Gỡ Món ăn khỏi bữa"
                      aria-label="Gỡ Món ăn khỏi bữa"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Dish Picker Bottom Sheet Drawer */}
      <DishPickerDrawer
        isOpen={isPickerOpen}
        onClose={() => setIsPickerOpen(false)}
        mealTitle={getMealTitle(activeMeal)}
        dishes={dishes}
        alreadyAddedDishIds={currentMealDishIds}
        onConfirm={handleConfirmAddDishes}
      />

      {/* Dish Detail & Comments Bottom Sheet Drawer */}
      {activeDishDetail && (
        <DishDetailDrawer
          isOpen={!!activeDishDetail}
          onClose={() => setActiveDishDetail(null)}
          dishName={activeDishDetail.dishName}
          dishTag={activeDishDetail.dishTag}
          planItemId={activeDishDetail.planItemId}
          householdCode={householdCode}
          nickname={nickname}
          planRepository={planRepository}
        />
      )}
    </div>
  );
};
