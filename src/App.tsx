import React, { useState, useEffect, useMemo } from 'react';
import { HouseholdStorage, defaultHouseholdStorage } from './services/storage';
import { DishRepository } from './services/dishRepository';
import { PlanRepository } from './services/planRepository';
import { MemberRepository } from './services/memberRepository';
import { resolveRepositories } from './services/repositoryFactory';
import { extractJoinCodeFromSearch } from './domain/household';
import { Member } from './domain/member';
import { AppHeader } from './components/AppHeader';
import { BottomNav, NavigationTab } from './components/BottomNav';
import { OnboardingModal } from './components/OnboardingModal';
import { ShareHouseholdModal } from './components/ShareHouseholdModal';
import { MemberSelectModal } from './components/MemberSelectModal';
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

export const App: React.FC<AppProps> = ({
  storage = defaultHouseholdStorage,
  dishRepository,
  planRepository,
  memberRepository,
  initialUrl,
  isOnline,
}) => {
  const resolved = useMemo(() => resolveRepositories(), []);
  const activeDishRepo = dishRepository || resolved.dishRepository;
  const activePlanRepo = planRepository || resolved.planRepository;
  const activeMemberRepo = memberRepository || resolved.memberRepository;

  const activeIsOnline = useMemo(() => {
    if (isOnline !== undefined) return isOnline;
    if (activeDishRepo.isOnline !== undefined) return activeDishRepo.isOnline;
    if (activePlanRepo.isOnline !== undefined) return activePlanRepo.isOnline;
    if (activeMemberRepo.isOnline !== undefined) return activeMemberRepo.isOnline;
    return resolved.isOnline;
  }, [isOnline, activeDishRepo.isOnline, activePlanRepo.isOnline, activeMemberRepo.isOnline, resolved.isOnline]);

  const [householdCode, setHouseholdCode] = useState<string | null>(null);
  const [nickname, setNickname] = useState<string | null>(null);
  const [activeMember, setActiveMember] = useState<Member | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [isLoadingMembers, setIsLoadingMembers] = useState<boolean>(false);
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
      } else if (storedCode) {
        setHouseholdCode(storedCode);
      }
    }

    setIsInitialized(true);
  }, [storage, initialUrl]);

  useEffect(() => {
    activeDishRepo.setPlanRepository?.(activePlanRepo);
  }, [activeDishRepo, activePlanRepo]);

  // Fetch members and listen for realtime updates
  useEffect(() => {
    if (!householdCode) {
      setMembers([]);
      return;
    }

    let isMounted = true;
    setIsLoadingMembers(true);

    activeMemberRepo
      .getMembers(householdCode)
      .then((list) => {
        if (isMounted) {
          setMembers(list);
          setIsLoadingMembers(false);
        }
      })
      .catch(() => {
        if (isMounted) {
          setIsLoadingMembers(false);
        }
      });

    const unsubscribe = activeMemberRepo.subscribe?.(householdCode, () => {
      activeMemberRepo
        .getMembers(householdCode)
        .then((updatedList) => {
          if (isMounted) {
            setMembers(updatedList);
          }
        })
        .catch(() => {});
    });

    return () => {
      isMounted = false;
      unsubscribe?.();
    };
  }, [householdCode, activeMemberRepo]);

  const handleOnboardingComplete = (code: string, nick: string) => {
    storage.setHouseholdCode(code);
    storage.setNickname(nick);
    setHouseholdCode(code);
    setNickname(nick);
    setJoinCodeFromUrl(null);
    setIsSwitchingHousehold(false);

    // Seed active member in memory and persist in member repository
    const fallbackMember: Member = {
      id: `mem_${Date.now()}`,
      householdCode: code,
      name: nick,
      avatarIcon: '🍳',
      avatarColor: 'bg-[#FEF7DC]',
      createdAt: new Date().toISOString(),
    };
    setActiveMember(fallbackMember);

    activeMemberRepo
      .addMember({
        householdCode: code,
        name: nick,
        avatarIcon: '🍳',
        avatarColor: 'bg-[#FEF7DC]',
      })
      .then((created) => {
        setActiveMember(created);
        setMembers((prev) => [...prev.filter((m) => m.id !== created.id), created]);
      })
      .catch(() => {
        // Ignored if member already exists
      });

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

  const handleSelectMember = (member: Member) => {
    setActiveMember(member);
    setNickname(member.name);
  };

  const handleSwitchHousehold = () => {
    setIsSwitchingHousehold(true);
  };

  if (!isInitialized) {
    return null;
  }

  const needsOnboarding =
    !householdCode ||
    (!nickname && members.length === 0 && !activeMember) ||
    isSwitchingHousehold;

  const showMemberSelect =
    !needsOnboarding &&
    Boolean(householdCode) &&
    members.length > 0 &&
    activeMember === null;

  const currentNickname = activeMember ? activeMember.name : (nickname || '');

  return (
    <div className="h-[100dvh] overflow-hidden bg-slate-100 flex justify-center sm:items-center select-none">
      {/* Mobile container mockup */}
      <div 
        data-testid="app-shell"
        className="w-full max-w-[420px] h-full sm:h-[min(900px,calc(100dvh_-_2rem))] bg-[#FAFBFD] shadow-2xl sm:rounded-[36px] overflow-hidden flex flex-col border-0 sm:border-[6px] sm:border-slate-800 relative"
      >
        {/* Mobile Header */}
        {householdCode && (activeMember || nickname) && !showMemberSelect ? (
          <AppHeader
            householdCode={householdCode}
            nickname={currentNickname}
            activeMember={activeMember}
            onSwitchMember={() => setActiveMember(null)}
            activeTab={activeTab}
            isOnline={activeIsOnline}
            onOpenShare={() => setIsShareModalOpen(true)}
            onChangeHousehold={handleSwitchHousehold}
          />
        ) : (
          <div className="h-4 bg-white flex-shrink-0" />
        )}

        {/* Main Content Area */}
        <main className="flex-1 min-h-0 flex flex-col relative">
          {showMemberSelect ? (
            <MemberSelectModal
              householdCode={householdCode || ''}
              members={members}
              onSelectMember={handleSelectMember}
              isLoading={isLoadingMembers}
            />
          ) : activeTab === 'plan' ? (
            <PlanView
              householdCode={householdCode || ''}
              nickname={currentNickname}
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
        {!showMemberSelect && !needsOnboarding && (
          <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
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
