import React, { useState } from 'react';
import { 
  generateHouseholdCode, 
  normalizeHouseholdCode, 
  isValidHouseholdCode, 
  isValidNickname, 
  createShareUrl 
} from '../domain/household';
import { Home, Users, ArrowRight, Copy, Check, Sparkles } from 'lucide-react';
import { useClipboardCopy } from '../hooks/useClipboardCopy';

interface OnboardingModalProps {
  initialCode?: string | null;
  onComplete: (householdCode: string, nickname: string) => void;
}

type OnboardingStep = 'choose' | 'create' | 'join' | 'created_success';

export const OnboardingModal: React.FC<OnboardingModalProps> = ({
  initialCode,
  onComplete
}) => {
  const [step, setStep] = useState<OnboardingStep>(() => {
    return initialCode ? 'join' : 'choose';
  });

  const [generatedCode, setGeneratedCode] = useState<string>(() => generateHouseholdCode());
  const [inputCode, setInputCode] = useState<string>(initialCode || '');
  const [nickname, setNickname] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const { copied, copy } = useClipboardCopy(2500);

  const handleStartCreate = () => {
    setGeneratedCode(generateHouseholdCode());
    setError(null);
    setStep('create');
  };

  const handleStartJoin = () => {
    setError(null);
    setStep('join');
  };

  const handleConfirmCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValidNickname(nickname)) {
      setError('Vui lòng nhập biệt danh của bạn (tối đa 30 ký tự)');
      return;
    }
    setError(null);
    setStep('created_success');
  };

  const handleFinishCreate = () => {
    onComplete(generatedCode, nickname.trim());
  };

  const handleConfirmJoin = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = normalizeHouseholdCode(inputCode);
    if (!isValidHouseholdCode(cleanCode)) {
      setError('Mã nhà không hợp lệ (ít nhất 3 ký tự)');
      return;
    }
    if (!isValidNickname(nickname)) {
      setError('Vui lòng nhập biệt danh của bạn (tối đa 30 ký tự)');
      return;
    }
    setError(null);
    onComplete(cleanCode, nickname.trim());
  };

  const handleCopyLink = () => {
    const url = createShareUrl(generatedCode);
    copy(url);
  };

  return (
    <div 
      role="dialog" 
      aria-modal="true" 
      aria-labelledby="onboarding-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
    >
      <div className="w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Step 1: Choose between Create and Join */}
        {step === 'choose' && (
          <div className="flex flex-col items-center text-center">
            <div className="w-16 h-16 rounded-full bg-[#FEF7DC] border-2 border-[#EFE4B5] flex items-center justify-center mb-4 shadow-sm">
              <Home className="w-8 h-8 text-[#5B7C99]" />
            </div>

            <h2 id="onboarding-title" className="text-xl font-bold text-[#334E68] mb-1">
              Bếp Gia Đình
            </h2>
            <p className="text-xs text-slate-500 mb-6 leading-relaxed max-w-[260px]">
              Lập Kế hoạch ăn uống và quản lý Menu món ăn mỗi ngày cùng gia đình bạn
            </p>

            <div className="w-full space-y-3">
              <button
                onClick={handleStartCreate}
                data-testid="create-household-button"
                className="w-full py-3.5 px-4 rounded-2xl bg-[#5B7C99] hover:bg-[#4a6b88] text-white font-bold text-sm shadow-md shadow-[#5B7C99]/30 transition active:scale-98 flex items-center justify-center gap-2"
              >
                <Sparkles className="w-4 h-4 text-[#FEF7DC]" />
                <span>Tạo Nhà Mới</span>
              </button>

              <button
                onClick={handleStartJoin}
                data-testid="join-household-button"
                className="w-full py-3.5 px-4 rounded-2xl bg-slate-50 hover:bg-slate-100 text-[#334E68] border border-slate-200 font-bold text-sm transition active:scale-98 flex items-center justify-center gap-2"
              >
                <Users className="w-4 h-4 text-slate-500" />
                <span>Tham Gia Bằng Mã</span>
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Create Household - enter nickname */}
        {step === 'create' && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 id="onboarding-title" className="text-base font-bold text-[#334E68]">
                Tạo Nhà Của Bạn
              </h2>
              <button
                onClick={() => setStep('choose')}
                className="text-xs text-slate-400 hover:text-slate-600 font-medium"
              >
                Quay lại
              </button>
            </div>

            <div className="p-3.5 rounded-2xl bg-[#FEF7DC]/80 border border-[#EFE4B5] mb-4 text-center">
              <span className="text-[11px] font-medium text-slate-600 block mb-1">
                Mã nhà mới của bạn:
              </span>
              <span 
                data-testid="generated-code-display"
                className="text-xl font-extrabold tracking-wider text-[#334E68]"
              >
                {generatedCode}
              </span>
            </div>

            <form onSubmit={handleConfirmCreate} className="space-y-4">
              <div>
                <label htmlFor="create-nickname-input" className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Biệt danh của bạn trong nhà:
                </label>
                <input
                  id="create-nickname-input"
                  data-testid="nickname-input"
                  type="text"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  placeholder="Ví dụ: Mẹ, Bố, An..."
                  autoFocus
                  className="w-full px-4 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#5B7C99] focus:bg-white transition"
                />
                <span className="text-[11px] text-slate-400 mt-1 block">
                  Biệt danh giúp cả nhà nhận biết ai đã lên kế hoạch hoặc dặn dò.
                </span>
              </div>

              {error && (
                <div data-testid="error-message" className="text-xs text-rose-600 font-medium bg-rose-50 p-2.5 rounded-xl border border-rose-100">
                  {error}
                </div>
              )}

              <button
                type="submit"
                data-testid="confirm-create-button"
                className="w-full py-3 rounded-full bg-[#5B7C99] hover:bg-[#4a6b88] text-white font-bold text-sm shadow-md shadow-[#5B7C99]/30 transition active:scale-98 flex items-center justify-center gap-1.5"
              >
                <span>Tiếp tục</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          </div>
        )}

        {/* Step 3: Success after Create - Show Share link and button to enter */}
        {step === 'created_success' && (
          <div className="flex flex-col items-center text-center">
            <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mb-3">
              <Check className="w-6 h-6 stroke-[3]" />
            </div>

            <h2 id="onboarding-title" className="text-base font-bold text-[#334E68] mb-1">
              Đã tạo Nhà thành công!
            </h2>
            <p className="text-xs text-slate-500 mb-4">
              Chia sẻ mã hoặc link này cho người thân cùng vào lên Kế hoạch nhé.
            </p>

            <div className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl mb-4 text-left">
              <div className="text-[11px] font-semibold text-slate-500 mb-1">Mã nhà:</div>
              <div className="text-base font-bold text-[#334E68] tracking-wide mb-2">
                {generatedCode}
              </div>

              <div className="text-[11px] font-semibold text-slate-500 mb-1">Link tham gia nhanh:</div>
              <div className="flex items-center gap-1.5">
                <input
                  readOnly
                  data-testid="share-url-input"
                  value={createShareUrl(generatedCode)}
                  className="flex-1 text-xs bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-slate-600 select-all"
                />
                <button
                  type="button"
                  onClick={handleCopyLink}
                  data-testid="copy-link-button"
                  className="px-3 py-1.5 rounded-xl bg-[#FEF7DC] border border-[#EFE4B5] text-[#334E68] text-xs font-semibold hover:bg-[#FDF2C7] transition flex items-center gap-1 flex-shrink-0"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Đã chép</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-[#5B7C99]" />
                      <span>Sao chép</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            <button
              onClick={handleFinishCreate}
              data-testid="enter-app-button"
              className="w-full py-3 rounded-full bg-[#5B7C99] hover:bg-[#4a6b88] text-white font-bold text-sm shadow-md shadow-[#5B7C99]/30 transition active:scale-98"
            >
              Vào Bếp ngay
            </button>
          </div>
        )}

        {/* Step 4: Join existing household */}
        {step === 'join' && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 id="onboarding-title" className="text-base font-bold text-[#334E68]">
                {initialCode ? 'Tham Gia Nhà' : 'Nhập Mã Nhà'}
              </h2>
              {!initialCode && (
                <button
                  onClick={() => setStep('choose')}
                  className="text-xs text-slate-400 hover:text-slate-600 font-medium"
                >
                  Quay lại
                </button>
              )}
            </div>

            {initialCode && (
              <div className="p-3 rounded-2xl bg-[#FEF7DC] border border-[#EFE4B5] mb-4 flex items-center gap-2">
                <Home className="w-4 h-4 text-[#5B7C99] flex-shrink-0" />
                <div className="text-xs text-[#334E68]">
                  Bạn đang tham gia Nhà: <strong data-testid="initial-code-display">{initialCode}</strong>
                </div>
              </div>
            )}

            <form onSubmit={handleConfirmJoin} className="space-y-3.5">
              {!initialCode && (
                <div>
                  <label htmlFor="join-code-input" className="block text-xs font-semibold text-slate-700 mb-1">
                    Mã nhà (Household Code):
                  </label>
                  <input
                    id="join-code-input"
                    data-testid="household-code-input"
                    type="text"
                    value={inputCode}
                    onChange={(e) => setInputCode(e.target.value.toUpperCase())}
                    placeholder="Ví dụ: BEP-892"
                    autoFocus
                    className="w-full px-4 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-sm font-semibold tracking-wider text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#5B7C99] focus:bg-white transition uppercase"
                  />
                </div>
              )}

              <div>
                <label htmlFor="join-nickname-input" className="block text-xs font-semibold text-slate-700 mb-1">
                  Biệt danh của bạn:
                </label>
                <input
                  id="join-nickname-input"
                  data-testid="nickname-input"
                  type="text"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  placeholder="Ví dụ: Mẹ, Bố, An..."
                  autoFocus={Boolean(initialCode)}
                  className="w-full px-4 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#5B7C99] focus:bg-white transition"
                />
              </div>

              {error && (
                <div data-testid="error-message" className="text-xs text-rose-600 font-medium bg-rose-50 p-2.5 rounded-xl border border-rose-100">
                  {error}
                </div>
              )}

              <button
                type="submit"
                data-testid="confirm-join-button"
                className="w-full py-3 rounded-full bg-[#5B7C99] hover:bg-[#4a6b88] text-white font-bold text-sm shadow-md shadow-[#5B7C99]/30 transition active:scale-98 flex items-center justify-center gap-1.5 mt-2"
              >
                <span>Tham Gia Nhà</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          </div>
        )}

      </div>
    </div>
  );
};
