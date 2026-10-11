import React, { useState, useEffect, useMemo, useRef } from 'react';
import { HouseholdStorage, defaultHouseholdStorage } from './services/storage';
import { DishRepository } from './services/dishRepository';
import { PlanRepository } from './services/planRepository';
import { MemberRepository } from './services/memberRepository';
import { Member } from './domain/member';
import { resolveRepositories } from './services/repositoryFactory';
import { extractJoinCodeFromSearch } from './domain/household';
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

export const App: React.FC<AppProps> = ({
  storage = defaultHouseholdStorage,
  dishRepository,
  planRepository,
  memberRepository,
  initialUrl,
}) => {
  const resolved = useMemo(() => resolveRepositories(), []);
  const activeDishRepo = dishRepository || resolved.dishRepository;
  const activePlanRepo = planRepository || resolved.planRepository;
  const activeMemberRepo = memberRepository || resolved.memberRepository;

  const verificationVersionRef = useRef(0);
  const [householdCode, setHouseholdCode] = useState<string | null>(null);
  const [savedHouseholds, setSavedHouseholds] = useState<string[]>(() => storage.getSavedHouseholds());
  const [member, setMember] = useState<Member | null>(null);
  const [activeTab, setActiveTab] = useState<NavigationTab>('plan');
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  const [restorationStatus, setRestorationStatus] = useState<'idle' | 'verifying' | 'error'>('idle');
  const [restorationError, setRestorationError] = useState<string | null>(null);
  const [deletedNotice, setDeletedNotice] = useState<string | null>(null);
  const [pendingVerification, setPendingVerification] = useState<{
    householdCode: string;
    memberId: string;
  } | null>(null);

  const removeJoinFromWindowUrl = () => {
    if (typeof window !== 'undefined' && window.location) {
      try {
        const href = initialUrl
          ? initialUrl.startsWith('http')
            ? initialUrl
            : `http://localhost${initialUrl.startsWith('/') ? '' : '/'}${initialUrl}`
          : window.location.href;
        const url = new URL(href);
        if (url.searchParams.has('join')) {
          url.searchParams.delete('join');
          const search = url.searchParams.toString();
          const target = url.pathname + (search ? `?${search}` : '') + url.hash;
          window.history.replaceState({}, '', target);
        }
      } catch {
        // Ignored in test environments
      }
    }
  };

  const verifyMember = (targetHouseholdCode: string, targetMemberId: string) => {
    const version = ++verificationVersionRef.current;
    setRestorationStatus('verifying');
    setRestorationError(null);
    setDeletedNotice(null);
    setPendingVerification({ householdCode: targetHouseholdCode, memberId: targetMemberId });

    activeMemberRepo
      .getMembers(targetHouseholdCode)
      .then((members) => {
        if (version !== verificationVersionRef.current) return;
        const found = members.find(
          (m) => m.id === targetMemberId && m.householdCode === targetHouseholdCode
        );
        if (found) {
          setMember(found);
          setHouseholdCode(targetHouseholdCode);
          setRestorationStatus('idle');
          setPendingVerification(null);
        } else {
          // Member was deleted from database
          storage.setNavigationState({
            status: 'choosing_member',
            householdCode: targetHouseholdCode,
          });
          setHouseholdCode(targetHouseholdCode);
          setMember(null);
          setDeletedNotice(
            'Thành viên trước đây đã bị xóa hoặc không còn tồn tại trong Gia đình. Vui lòng chọn Thành viên.'
          );
          setRestorationStatus('idle');
          setPendingVerification(null);
        }
      })
      .catch((err) => {
        if (version !== verificationVersionRef.current) return;
        // Retain remembered selection in storage on failure
        setRestorationError(
          err instanceof Error
            ? err.message
            : 'Không thể kết nối cơ sở dữ liệu. Vui lòng thử lại.'
        );
        setRestorationStatus('error');
      });
  };

  useEffect(() => {
    const rawSearch = initialUrl ?? (typeof window !== 'undefined' ? window.location.search : '');
    const detectedJoin = extractJoinCodeFromSearch(rawSearch);
    const navState = storage.getNavigationState();

    let targetCode: string | null = null;
    if (
      (navState.status === 'choosing_member' || navState.status === 'selected') &&
      navState.householdCode
    ) {
      targetCode = navState.householdCode;
    }

    if (detectedJoin) {
      removeJoinFromWindowUrl();
      storage.saveHousehold(detectedJoin);
      setSavedHouseholds(storage.getSavedHouseholds());
      if (!targetCode || detectedJoin !== targetCode) {
        storage.setNavigationState({ status: 'choosing_member', householdCode: detectedJoin });
        setHouseholdCode(detectedJoin);
        setMember(null);
        setRestorationStatus('idle');
        setRestorationError(null);
        setDeletedNotice(null);
        setPendingVerification(null);
        setActiveTab('plan');
        setIsInitialized(true);
        return;
      }
      // If detectedJoin === targetCode, fall through to restore navState
    }

    if (navState.status === 'choosing_household') {
      setHouseholdCode(null);
      setMember(null);
      setRestorationStatus('idle');
      setRestorationError(null);
      setDeletedNotice(null);
      setPendingVerification(null);
    } else if (navState.status === 'choosing_member' && navState.householdCode) {
      setHouseholdCode(navState.householdCode);
      setMember(null);
      setRestorationStatus('idle');
      setRestorationError(null);
      setDeletedNotice(null);
      setPendingVerification(null);
    } else if (navState.status === 'selected' && navState.householdCode && navState.memberId) {
      setHouseholdCode(navState.householdCode);
      verifyMember(navState.householdCode, navState.memberId);
    } else {
      setHouseholdCode(null);
      setMember(null);
    }

    setActiveTab('plan');
    setIsInitialized(true);
  }, [storage, initialUrl]);

  useEffect(() => {
    activeDishRepo.setPlanRepository?.(activePlanRepo);
  }, [activeDishRepo, activePlanRepo]);

  const handleRetryVerification = () => {
    if (pendingVerification) {
      verifyMember(pendingVerification.householdCode, pendingVerification.memberId);
    }
  };

  const handleSwitchHousehold = () => {
    verificationVersionRef.current++;
    storage.setNavigationState({ status: 'choosing_household' });
    setSavedHouseholds(storage.getSavedHouseholds());
    setHouseholdCode(null);
    setMember(null);
    setRestorationStatus('idle');
    setRestorationError(null);
    setDeletedNotice(null);
    setPendingVerification(null);
  };

  const handleSwitchMember = () => {
    verificationVersionRef.current++;
    if (householdCode) {
      storage.setNavigationState({ status: 'choosing_member', householdCode });
    }
    setMember(null);
    setRestorationStatus('idle');
    setRestorationError(null);
    setDeletedNotice(null);
    setPendingVerification(null);
  };

  const handleChooseMember = (chosen: Member) => {
    if (!householdCode) return;
    storage.setNavigationState({
      status: 'selected',
      householdCode,
      memberId: chosen.id,
    });
    setMember(chosen);
    setActiveTab('plan');
    setDeletedNotice(null);
    setRestorationStatus('idle');
    setRestorationError(null);
    setPendingVerification(null);
  };

  const handleForgetHousehold = (code: string) => {
    storage.removeSavedHousehold(code);
    setSavedHouseholds(storage.getSavedHouseholds());
  };

  const handleOnboardingComplete = (code: string) => {
    verificationVersionRef.current++;
    storage.saveHousehold(code);
    setSavedHouseholds(storage.getSavedHouseholds());
    storage.setNavigationState({ status: 'choosing_member', householdCode: code });
    setHouseholdCode(code);
    setMember(null);
    setActiveTab('plan');
    setIsShareModalOpen(false);
    setDeletedNotice(null);
    setRestorationStatus('idle');
    setRestorationError(null);
    setPendingVerification(null);
    removeJoinFromWindowUrl();
  };

  if (!isInitialized) return null;

  return (
    <div className="h-[100dvh] overflow-hidden bg-slate-100 flex justify-center sm:items-center select-none">
      <div
        data-testid="app-shell"
        className="w-full max-w-[420px] h-full sm:h-[min(900px,calc(100dvh_-_2rem))] bg-[#FAFBFD] shadow-2xl sm:rounded-[36px] overflow-hidden flex flex-col border-0 sm:border-[6px] sm:border-slate-800 relative"
      >
        {restorationStatus === 'verifying' ? (
          <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
            <div role="status" className="flex flex-col items-center gap-3 text-slate-600">
              <div className="w-8 h-8 border-3 border-slate-300 border-t-emerald-600 rounded-full animate-spin" />
              <span className="text-sm font-medium">Đang tải Thành viên…</span>
            </div>
          </div>
        ) : restorationStatus === 'error' ? (
          <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
            <div className="max-w-xs w-full bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col items-center">
              <div role="alert" className="text-sm text-red-600 font-medium mb-4">
                {restorationError || 'Không thể kết nối cơ sở dữ liệu. Vui lòng thử lại.'}
              </div>
              <div className="flex flex-col gap-2 w-full">
                <button
                  type="button"
                  onClick={handleRetryVerification}
                  className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-semibold transition"
                >
                  Thử lại
                </button>
                <button
                  type="button"
                  onClick={handleSwitchHousehold}
                  className="w-full py-2 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-medium transition"
                >
                  Đổi gia đình
                </button>
              </div>
            </div>
          </div>
        ) : !householdCode ? (
          <OnboardingModal
            savedHouseholds={savedHouseholds}
            onHouseholdCreated={(code) => {
              storage.saveHousehold(code);
              setSavedHouseholds(storage.getSavedHouseholds());
            }}
            onSelectSaved={handleOnboardingComplete}
            onForgetHousehold={handleForgetHousehold}
            onComplete={handleOnboardingComplete}
          />
        ) : !member ? (
          <div className="flex-1 flex flex-col min-h-0 relative">
            {deletedNotice && (
              <div
                role="alert"
                className="mx-4 mt-3 p-3 bg-amber-50 border border-amber-200 text-amber-900 rounded-xl text-xs flex items-center justify-between shadow-sm z-10"
              >
                <span>{deletedNotice}</span>
                <button
                  type="button"
                  onClick={() => setDeletedNotice(null)}
                  className="ml-2 text-slate-400 hover:text-slate-600 font-bold text-sm leading-none"
                  aria-label="Đóng thông báo"
                >
                  ×
                </button>
              </div>
            )}
            <div className="flex-1 min-h-0">
              <MemberSelection
                key={householdCode}
                householdCode={householdCode}
                repository={activeMemberRepo}
                onChoose={handleChooseMember}
                onBackToHousehold={handleSwitchHousehold}
              />
            </div>
          </div>
        ) : (
          <>
            <AppHeader
              householdCode={householdCode}
              memberName={member.name}
              activeTab={activeTab}
              onOpenShare={() => setIsShareModalOpen(true)}
              onChangeHousehold={activeTab === 'plan' ? handleSwitchHousehold : undefined}
              onChangeMember={activeTab === 'plan' ? handleSwitchMember : undefined}
            />
            <main className="flex-1 min-h-0 flex flex-col">
              {activeTab === 'plan' ? (
                <PlanView
                  householdCode={householdCode}
                  memberName={member.name}
                  dishRepository={activeDishRepo}
                  planRepository={activePlanRepo}
                />
              ) : (
                <MenuView
                  householdCode={householdCode}
                  dishRepository={activeDishRepo}
                  planRepository={activePlanRepo}
                />
              )}
            </main>
            <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
            <ShareHouseholdModal
              householdCode={householdCode}
              isOpen={isShareModalOpen}
              onClose={() => setIsShareModalOpen(false)}
            />
          </>
        )}
      </div>
    </div>
  );
};

export default App;
