import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { HouseholdStorage, defaultHouseholdStorage } from './services/storage';
import { DishRepository } from './services/dishRepository';
import { PlanRepository } from './services/planRepository';
import { HouseholdRepository } from './services/householdRepository';
import { resolveRepositories } from './services/repositoryFactory';
import { extractJoinCodeFromSearch } from './domain/household';
import { AppHeader } from './components/AppHeader';
import { BottomNav, NavigationTab } from './components/BottomNav';
import { OnboardingModal } from './components/OnboardingModal';
import { ShareHouseholdModal } from './components/ShareHouseholdModal';
import { MemberSelectionView } from './components/MemberSelectionView';
import { PlanView } from './components/PlanView';
import { MenuView } from './components/MenuView';

export type AppScreen = 'plan' | 'menu' | 'members';

export interface AppProps {
  storage?: HouseholdStorage;
  dishRepository?: DishRepository;
  planRepository?: PlanRepository;
  householdRepository?: HouseholdRepository;
  initialUrl?: string;
  isOnline?: boolean;
  initialScreen?: AppScreen;
  initialDate?: string;
}

export const App: React.FC<AppProps> = ({
  storage = defaultHouseholdStorage,
  dishRepository,
  planRepository,
  householdRepository,
  initialUrl,
  isOnline,
  initialScreen,
  initialDate,
}) => {
  const resolved = useMemo(() => resolveRepositories(), []);
  const activeDishRepo = dishRepository || resolved.dishRepository;
  const activePlanRepo = planRepository || resolved.planRepository;
  const activeHouseholdRepo = householdRepository || resolved.householdRepository;

  const activeIsOnline = useMemo(() => {
    if (isOnline !== undefined) return isOnline;
    if (activeDishRepo.isOnline !== undefined) return activeDishRepo.isOnline;
    if (activePlanRepo.isOnline !== undefined) return activePlanRepo.isOnline;
    if (activeHouseholdRepo.isOnline !== undefined) return activeHouseholdRepo.isOnline;
    return resolved.isOnline;
  }, [isOnline, activeDishRepo.isOnline, activePlanRepo.isOnline, activeHouseholdRepo.isOnline, resolved.isOnline]);
  const [householdCode, setHouseholdCode] = useState<string | null>(null);
  const [nickname, setNickname] = useState<string | null>(null);
  const [members, setMembers] = useState<string[]>([]);
  const [joinCodeFromUrl, setJoinCodeFromUrl] = useState<string | null>(null);
  const [currentScreen, setCurrentScreen] = useState<AppScreen>(initialScreen || 'plan');
  const [activeTab, setActiveTab] = useState<NavigationTab>('plan');
  const [isShareModalOpen, setIsShareModalOpen] = useState<boolean>(false);
  const [isSwitchingHousehold, setIsSwitchingHousehold] = useState<boolean>(false);
  const [isInitialized, setIsInitialized] = useState<boolean>(false);

  const loadMembers = useCallback(async (code: string) => {
    try {
      const fetched = await activeHouseholdRepo.getMembers(code);
      setMembers(fetched);
    } catch {
      // Ignored
    }
  }, [activeHouseholdRepo]);

  useEffect(() => {
    if (householdCode) {
      loadMembers(householdCode);
      const unsub = activeHouseholdRepo.subscribe?.(householdCode, () => {
        loadMembers(householdCode);
      });
      return () => {
        unsub?.();
      };
    }
  }, [householdCode, activeHouseholdRepo, loadMembers]);

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
        if (!initialScreen) setCurrentScreen('plan');
      } else {
        // Prompt for nickname once
        setJoinCodeFromUrl(detectedJoin);
        setNickname(null);
      }
    } else {
      if (storedCode && storedNick) {
        setHouseholdCode(storedCode);
        setNickname(storedNick);
        if (!initialScreen) setCurrentScreen('plan');
      } else if (storedCode && !storedNick) {
        setHouseholdCode(storedCode);
        setNickname(null);
        if (!initialScreen) setCurrentScreen('members');
      }
    }

    if (initialScreen) {
      setCurrentScreen(initialScreen);
    }

    setIsInitialized(true);
  }, [storage, initialUrl, initialScreen]);

  useEffect(() => {
    activeDishRepo.setPlanRepository?.(activePlanRepo);
  }, [activeDishRepo, activePlanRepo]);

  const handleOnboardingComplete = async (code: string, nick: string) => {
    storage.setHouseholdCode(code);
    storage.setNickname(nick);
    setHouseholdCode(code);
    setNickname(nick);
    setJoinCodeFromUrl(null);
    setIsSwitchingHousehold(false);
    setCurrentScreen('plan');

    try {
      await activeHouseholdRepo.addMember(code, nick);
      await loadMembers(code);
    } catch {
      // Ignored
    }

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

  const handleSelectMember = (name: string) => {
    storage.setNickname(name);
    setNickname(name);
    setCurrentScreen('plan');
  };

  const handleAddMember = async (name: string) => {
    if (!householdCode) return;
    await activeHouseholdRepo.addMember(householdCode, name);
    storage.setNickname(name);
    setNickname(name);
    await loadMembers(householdCode);
    setCurrentScreen('plan');
  };

  if (!isInitialized) {
    return null;
  }

  const needsOnboarding = !householdCode || isSwitchingHousehold || Boolean(joinCodeFromUrl);

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col items-center justify-start sm:p-4 select-none">
      {/* Mobile container mockup */}
      <div 
        data-testid="app-shell"
        className="w-full max-w-[420px] bg-[#FAFBFD] shadow-2xl sm:rounded-[36px] overflow-hidden flex flex-col min-h-screen sm:min-h-[760px] sm:max-h-[900px] border-0 sm:border-[6px] sm:border-slate-800 relative"
      >
        {/* Mobile Header: Hidden on Netflix member selection screen */}
        {householdCode && nickname && currentScreen !== 'members' ? (
          <AppHeader
            householdCode={householdCode}
            nickname={nickname}
            activeTab={activeTab}
            isOnline={activeIsOnline}
            onOpenShare={() => setIsShareModalOpen(true)}
            onChangeHousehold={handleSwitchHousehold}
            onOpenMemberSelection={() => setCurrentScreen('members')}
          />
        ) : (
          <div className="h-4 bg-white" />
        )}

        {/* Main Content Area */}
        <main className="flex-1 flex flex-col overflow-y-auto">
          {currentScreen === 'members' ? (
            <MemberSelectionView
              householdCode={householdCode || ''}
              members={members.length > 0 ? members : (nickname ? [nickname] : [])}
              activeMember={nickname}
              onSelectMember={handleSelectMember}
              onAddMember={handleAddMember}
              onBackToPlan={nickname ? () => setCurrentScreen('plan') : undefined}
            />
          ) : activeTab === 'plan' ? (
            <PlanView
              householdCode={householdCode || ''}
              nickname={nickname || ''}
              dishRepository={activeDishRepo}
              planRepository={activePlanRepo}
              householdRepository={activeHouseholdRepo}
              initialDate={initialDate}
            />
          ) : (
            <MenuView
              householdCode={householdCode || ''}
              dishRepository={activeDishRepo}
              planRepository={activePlanRepo}
            />
          )}
        </main>

        {/* Bottom Navigation: Hidden on Netflix member selection screen */}
        {currentScreen !== 'members' && (
          <BottomNav
            activeTab={activeTab}
            onTabChange={(tab) => {
              setActiveTab(tab);
              setCurrentScreen(tab);
            }}
          />
        )}

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
