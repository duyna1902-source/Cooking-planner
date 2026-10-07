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
  initialActiveMember?: Member | null;
}

export const App: React.FC<AppProps> = ({
  storage = defaultHouseholdStorage,
  dishRepository,
  planRepository,
  memberRepository,
  initialUrl,
  isOnline,
  initialActiveMember,
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
  const [activeMember, setActiveMember] = useState<Member | null>(() => {
    return initialActiveMember !== undefined ? initialActiveMember : null;
  });
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

    if (detectedJoin) {
      // Per spec & ADR 0006: URLs containing ?join=<household_code> set household in storage
      // and require member selection without prompting for nickname in onboarding
      storage.setHouseholdCode(detectedJoin);
      setHouseholdCode(detectedJoin);
      setActiveMember(null);

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
    } else if (storedCode) {
      setHouseholdCode(storedCode);
      if (initialActiveMember === undefined) {
        setActiveMember(null);
      }
    }

    setIsInitialized(true);
  }, [storage, initialUrl, activeMemberRepo]);

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

  const handleOnboardingComplete = async (code: string, nick?: string) => {
    storage.setHouseholdCode(code);
    setHouseholdCode(code);
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

    if (nick && nick.trim()) {
      const trimmedNick = nick.trim();

      // Seed active member in memory and persist in member repository
      const fallbackMember: Member = {
        id: `mem_${Date.now()}`,
        householdCode: code,
        name: trimmedNick,
        avatarIcon: '🍳',
        avatarColor: 'bg-[#FEF7DC]',
        createdAt: new Date().toISOString(),
      };
      setActiveMember(fallbackMember);

      try {
        const created = await activeMemberRepo.addMember({
          householdCode: code,
          name: trimmedNick,
          avatarIcon: '🍳',
          avatarColor: 'bg-[#FEF7DC]',
        });
        setActiveMember(created);
        setMembers((prev) => [...prev.filter((m) => m.id !== created.id), created]);
      } catch {
        // If member already exists, load members and set activeMember
        try {
          const existingList = await activeMemberRepo.getMembers(code);
          setMembers(existingList);
          const match = existingList.find(
            (m) => m.name.toLowerCase() === trimmedNick.toLowerCase()
          );
          if (match) {
            setActiveMember(match);
          }
        } catch {
          // Ignored
        }
      }
    } else {
      // Joined household without nickname
      setActiveMember(null);
      activeMemberRepo
        .getMembers(code)
        .then((list) => {
          setMembers(list);
        })
        .catch(() => {});
    }
  };

  const handleSelectMember = (member: Member) => {
    setActiveMember(member);
  };

  const handleSwitchHousehold = () => {
    setIsSwitchingHousehold(true);
  };

  if (!isInitialized) {
    return null;
  }

  const needsOnboarding = !householdCode || isSwitchingHousehold;

  const showMemberSelect =
    !needsOnboarding &&
    Boolean(householdCode) &&
    activeMember === null;

  const currentNickname = activeMember ? activeMember.name : '';

  return (
    <div className="h-[100dvh] overflow-hidden bg-slate-100 flex justify-center sm:items-center select-none">
      {/* Mobile container mockup */}
      <div 
        data-testid="app-shell"
        className="w-full max-w-[420px] h-full sm:h-[min(900px,calc(100dvh_-_2rem))] bg-[#FAFBFD] shadow-2xl sm:rounded-[36px] overflow-hidden flex flex-col border-0 sm:border-[6px] sm:border-slate-800 relative"
      >
        {/* Mobile Header */}
        {householdCode && activeMember && !showMemberSelect ? (
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
              memberRepository={activeMemberRepo}
              onMemberAdded={(newMember) => {
                setMembers((prev) => {
                  if (prev.some((m) => m.id === newMember.id)) return prev;
                  return [...prev, newMember];
                });
              }}
              onMemberUpdated={(updated) => {
                setMembers((prev) => prev.map((m) => (m.id === updated.id ? updated : m)));
                if (activeMember?.id === updated.id) {
                  setActiveMember(updated);
                }
              }}
              onMemberDeleted={(deletedId) => {
                setMembers((prev) => prev.filter((m) => m.id !== deletedId));
                if (activeMember?.id === deletedId) {
                  setActiveMember(null);
                }
              }}
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
