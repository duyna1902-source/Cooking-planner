import React, { useState, useEffect, useMemo } from 'react';
import { HouseholdStorage, defaultHouseholdStorage } from './services/storage';
import { DishRepository } from './services/dishRepository';
import { PlanRepository } from './services/planRepository';
import { MemberRepository } from './services/memberRepository';
import { Member } from './domain/member';
import { resolveRepositories } from './services/repositoryFactory';
import { extractJoinCodeFromSearch, isValidHouseholdCode, normalizeHouseholdCode } from './domain/household';
import { AppHeader } from './components/AppHeader';
import { BottomNav, NavigationTab } from './components/BottomNav';
import { OnboardingModal } from './components/OnboardingModal';
import { MemberSelection } from './components/MemberSelection';
import { ShareHouseholdModal } from './components/ShareHouseholdModal';
import { PlanView } from './components/PlanView';
import { MenuView } from './components/MenuView';

export interface AppProps {
  storage?: HouseholdStorage;
  dishRepository?: DishRepository;
  planRepository?: PlanRepository;
  memberRepository?: MemberRepository;
  initialUrl?: string;
  isOnline?: boolean;
}

export const App: React.FC<AppProps> = ({ storage = defaultHouseholdStorage, dishRepository, planRepository, memberRepository, initialUrl, isOnline }) => {
  const resolved = useMemo(() => resolveRepositories(), []);
  const activeDishRepo = dishRepository || resolved.dishRepository;
  const activePlanRepo = planRepository || resolved.planRepository;
  const activeMemberRepo = memberRepository || resolved.memberRepository;
  const activeIsOnline = isOnline ?? activeDishRepo.isOnline ?? activePlanRepo.isOnline ?? resolved.isOnline;
  const [householdCode, setHouseholdCode] = useState<string | null>(null);
  const [member, setMember] = useState<Member | null>(null);
  const [activeTab, setActiveTab] = useState<NavigationTab>('plan');
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isSwitchingHousehold, setIsSwitchingHousehold] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const detectedJoin = extractJoinCodeFromSearch(initialUrl ?? window.location.search);
    const storedCode = storage.getHouseholdCode();
    const code = detectedJoin || (storedCode && isValidHouseholdCode(storedCode) ? normalizeHouseholdCode(storedCode) : null);
    if (code) storage.setHouseholdCode(code);
    setHouseholdCode(code);
    setMember(null);
    setActiveTab('plan');
    setIsInitialized(true);
  }, [storage, initialUrl]);

  useEffect(() => { activeDishRepo.setPlanRepository?.(activePlanRepo); }, [activeDishRepo, activePlanRepo]);

  const handleOnboardingComplete = (code: string) => {
    storage.setHouseholdCode(code);
    setHouseholdCode(code);
    setMember(null);
    setActiveTab('plan');
    setIsSwitchingHousehold(false);
    setIsShareModalOpen(false);
    const url = new URL(window.location.href);
    if (url.searchParams.has('join')) {
      url.searchParams.delete('join');
      window.history.replaceState({}, '', url.pathname + url.search + url.hash);
    }
  };

  if (!isInitialized) return null;
  return <div className="h-[100dvh] overflow-hidden bg-slate-100 flex justify-center sm:items-center select-none">
    <div data-testid="app-shell" className="w-full max-w-[420px] h-full sm:h-[min(900px,calc(100dvh_-_2rem))] bg-[#FAFBFD] shadow-2xl sm:rounded-[36px] overflow-hidden flex flex-col border-0 sm:border-[6px] sm:border-slate-800 relative">
      {!householdCode || isSwitchingHousehold ? <OnboardingModal onComplete={handleOnboardingComplete} /> : !member ?
        <MemberSelection key={householdCode} householdCode={householdCode} repository={activeMemberRepo} onChoose={(chosen) => { setMember(chosen); setActiveTab('plan'); }} /> : <>
          <AppHeader householdCode={householdCode} memberName={member.name} activeTab={activeTab} isOnline={activeIsOnline}
            onOpenShare={() => setIsShareModalOpen(true)} onChangeHousehold={activeTab === 'plan' ? () => setIsSwitchingHousehold(true) : undefined} />
          <main className="flex-1 min-h-0 flex flex-col">
            {activeTab === 'plan' ? <PlanView householdCode={householdCode} memberName={member.name} dishRepository={activeDishRepo} planRepository={activePlanRepo} /> :
              <MenuView householdCode={householdCode} dishRepository={activeDishRepo} planRepository={activePlanRepo} />}
          </main>
          <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
          <ShareHouseholdModal householdCode={householdCode} isOpen={isShareModalOpen} onClose={() => setIsShareModalOpen(false)} />
        </>}
    </div>
  </div>;
};
export default App;
