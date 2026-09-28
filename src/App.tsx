import React, { useState, useEffect, useMemo } from 'react';
import { HouseholdStorage, defaultHouseholdStorage } from './services/storage';
import { DishRepository } from './services/dishRepository';
import { PlanRepository } from './services/planRepository';
import { resolveRepositories } from './services/repositoryFactory';
import { SupabaseDishRepository } from './services/supabaseDishRepository';
import { SupabasePlanRepository } from './services/supabasePlanRepository';
import { extractJoinCodeFromSearch } from './domain/household';
import { AppHeader } from './components/AppHeader';
import { BottomNav, NavigationTab } from './components/BottomNav';
import { OnboardingModal } from './components/OnboardingModal';
import { ShareHouseholdModal } from './components/ShareHouseholdModal';
import { PlanView } from './components/PlanView';
import { MenuView } from './components/MenuView';

export interface AppProps {
  storage?: HouseholdStorage;
  dishRepository?: DishRepository;
  planRepository?: PlanRepository;
  initialUrl?: string;
  isOnline?: boolean;
}

export const App: React.FC<AppProps> = ({
  storage = defaultHouseholdStorage,
  dishRepository,
  planRepository,
  initialUrl,
  isOnline,
}) => {
  const resolved = useMemo(() => resolveRepositories(), []);
  const activeDishRepo = dishRepository || resolved.dishRepository;
  const activePlanRepo = planRepository || resolved.planRepository;

  const activeIsOnline = useMemo(() => {
    if (isOnline !== undefined) return isOnline;
    if (activeDishRepo instanceof SupabaseDishRepository || activePlanRepo instanceof SupabasePlanRepository) {
      return true;
    }
    if (!dishRepository && !planRepository) {
      return resolved.isOnline;
    }
    return false;
  }, [isOnline, activeDishRepo, activePlanRepo, dishRepository, planRepository, resolved.isOnline]);
  const [householdCode, setHouseholdCode] = useState<string | null>(null);
  const [nickname, setNickname] = useState<string | null>(null);
  const [joinCodeFromUrl, setJoinCodeFromUrl] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<NavigationTab>('plan');
  const [isShareModalOpen, setIsShareModalOpen] = useState<boolean>(false);
  const [isSwitchingHousehold, setIsSwitchingHousehold] = useState<boolean>(false);
  const [isInitialized, setIsInitialized] = useState<boolean>(false);

  useEffect(() => {
    // 1. Detect join code from URL
    const searchString = initialUrl !== undefined 
      ? initialUrl 
      : (typeof window !== 'undefined' ? window.location.search : '');
    
    const detectedJoin = extractJoinCodeFromSearch(searchString);

    // 2. Read stored credentials
    const storedCode = storage.getHouseholdCode();
    const storedNick = storage.getNickname();

    if (detectedJoin) {
      // Per spec: URLs containing ?join=<household_code> automatically set the active household in storage
      storage.setHouseholdCode(detectedJoin);
      setHouseholdCode(detectedJoin);

      if (storedNick) {
        // Nickname already set locally: immediately ready
        setNickname(storedNick);
      } else {
        // Prompt for nickname once
        setJoinCodeFromUrl(detectedJoin);
        setNickname(null);
      }
    } else {
      if (storedCode && storedNick) {
        setHouseholdCode(storedCode);
        setNickname(storedNick);
      }
    }

    setIsInitialized(true);
  }, [storage, initialUrl]);

  useEffect(() => {
    activeDishRepo.setPlanRepository?.(activePlanRepo);
  }, [activeDishRepo, activePlanRepo]);

  const handleOnboardingComplete = (code: string, nick: string) => {
    storage.setHouseholdCode(code);
    storage.setNickname(nick);
    setHouseholdCode(code);
    setNickname(nick);
    setJoinCodeFromUrl(null);
    setIsSwitchingHousehold(false);

    // Clean up join query param in browser URL without full reload
    if (typeof window !== 'undefined' && window.history && window.location) {
      try {
        const url = new URL(window.location.href);
        if (url.searchParams.has('join')) {
          url.searchParams.delete('join');
          window.history.replaceState({}, '', url.pathname + (url.search ? url.search : ''));
        }
      } catch {
        // Ignored
      }
    }
  };

  const handleSwitchHousehold = () => {
    setIsSwitchingHousehold(true);
  };

  if (!isInitialized) {
    return null;
  }

  const needsOnboarding = !householdCode || !nickname || isSwitchingHousehold;

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col items-center justify-start sm:p-4 select-none">
      {/* Mobile container mockup */}
      <div 
        data-testid="app-shell"
        className="w-full max-w-[420px] bg-[#FAFBFD] shadow-2xl sm:rounded-[36px] overflow-hidden flex flex-col min-h-screen sm:min-h-[760px] sm:max-h-[900px] border-0 sm:border-[6px] sm:border-slate-800 relative"
      >
        {/* Mobile Header */}
        {householdCode && nickname ? (
          <AppHeader
            householdCode={householdCode}
            nickname={nickname}
            activeTab={activeTab}
            isOnline={activeIsOnline}
            onOpenShare={() => setIsShareModalOpen(true)}
            onChangeHousehold={handleSwitchHousehold}
          />
        ) : (
          <div className="h-4 bg-white" />
        )}

        {/* Main Content Area */}
        <main className="flex-1 flex flex-col overflow-y-auto">
          {activeTab === 'plan' ? (
            <PlanView
              householdCode={householdCode || ''}
              nickname={nickname || ''}
              dishRepository={activeDishRepo}
              planRepository={activePlanRepo}
            />
          ) : (
            <MenuView
              householdCode={householdCode || ''}
              dishRepository={activeDishRepo}
              planRepository={activePlanRepo}
            />
          )}
        </main>

        {/* Bottom Navigation */}
        <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />

        {/* Onboarding Dialog */}
        {needsOnboarding && (
          <OnboardingModal
            initialCode={joinCodeFromUrl || undefined}
            onComplete={handleOnboardingComplete}
          />
        )}

        {/* Share Link Dialog */}
        {householdCode && (
          <ShareHouseholdModal
            householdCode={householdCode}
            isOpen={isShareModalOpen}
            onClose={() => setIsShareModalOpen(false)}
          />
        )}
      </div>
    </div>
  );
};
export default App;
