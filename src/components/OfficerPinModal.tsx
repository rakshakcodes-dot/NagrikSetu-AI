import React, { useState, useEffect, useRef } from 'react';
import {
  Shield,
  ShieldCheck,
  ShieldAlert,
  Lock,
  KeyRound,
  HardHat,
  X,
  Check,
  RotateCcw,
  AlertTriangle,
  HelpCircle,
  Sparkles,
  Delete,
} from 'lucide-react';
import { Language } from '../types';
import { translations } from '../utils/translations';
import {
  getStoredOfficerPin,
  setStoredOfficerPin,
  resetStoredOfficerPin,
  DEFAULT_OFFICER_PIN,
} from '../utils/officerPin';

interface OfficerPinModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  language: Language;
}

export const OfficerPinModal: React.FC<OfficerPinModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  language,
}) => {
  const t = translations[language];
  const [pin, setPin] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [isShaking, setIsShaking] = useState<boolean>(false);
  const [attempts, setAttempts] = useState<number>(0);
  const [showHint, setShowHint] = useState<boolean>(true);
  const [isCustomizingPin, setIsCustomizingPin] = useState<boolean>(false);
  const [newPin, setNewPin] = useState<string>('');
  const [confirmPin, setConfirmPin] = useState<string>('');
  const [customPinSuccess, setCustomPinSuccess] = useState<string>('');

  const inputRef = useRef<HTMLInputElement>(null);

  // Get active stored PIN
  const getActivePin = (): string => {
    return getStoredOfficerPin();
  };

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setPin('');
      setError('');
      setIsShaking(false);
      setIsCustomizingPin(false);
      setCustomPinSuccess('');
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const currentExpectedPin = getActivePin();

  const handleKeypadPress = (digit: string) => {
    if (pin.length < 4) {
      const updated = pin + digit;
      setPin(updated);
      setError('');
      if (updated.length === 4) {
        verifyPin(updated);
      }
    }
  };

  const handleBackspace = () => {
    setPin((prev) => prev.slice(0, -1));
    setError('');
  };

  const handleClear = () => {
    setPin('');
    setError('');
  };

  const verifyPin = (inputPin: string) => {
    if (inputPin === currentExpectedPin) {
      setError('');
      setAttempts(0);
      onSuccess();
    } else {
      setIsShaking(true);
      setError(
        language === 'hi'
          ? 'पहुंच अस्वीकृत: अमान्य सुरक्षा पिन। केवल अधिकृत नगर निगम अधिकारी ही प्रवेश कर सकते हैं।'
          : 'Access Denied: Invalid Security PIN. Only authorized Goa PWD / Municipal officers may access this portal.'
      );
      setAttempts((prev) => prev + 1);
      setTimeout(() => {
        setIsShaking(false);
        setPin('');
      }, 600);
    }
  };

  const handleSaveCustomPin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^\d{4}$/.test(newPin)) {
      setError(
        language === 'hi'
          ? 'पिन 4 अंकों की संख्या होनी चाहिए।'
          : 'New PIN must be exactly 4 digits.'
      );
      return;
    }
    if (newPin !== confirmPin) {
      setError(
        language === 'hi'
          ? 'पुष्टि पिन मेल नहीं खाती।'
          : 'Confirmation PIN does not match.'
      );
      return;
    }

    try {
      setStoredOfficerPin(newPin);
      setCustomPinSuccess(
        language === 'hi'
          ? 'अधिकारी सुरक्षा पिन सफलतापूर्वक अपडेट किया गया!'
          : 'Officer Security PIN updated successfully!'
      );
      setPin('');
      setNewPin('');
      setConfirmPin('');
      setError('');
      setTimeout(() => {
        setIsCustomizingPin(false);
        setCustomPinSuccess('');
      }, 1500);
    } catch (err) {
      setError('Failed to save custom PIN');
    }
  };

  const handleResetDefaultPin = () => {
    try {
      resetStoredOfficerPin();
      setCustomPinSuccess(
        language === 'hi'
          ? 'डिफ़ॉल्ट पिन (1234) पर रीसेट हो गया।'
          : 'Reset to default PIN (1234).'
      );
      setError('');
      setTimeout(() => setCustomPinSuccess(''), 2000);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div
        className={`relative w-full max-w-md bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl overflow-hidden transition-transform ${
          isShaking ? 'animate-bounce' : ''
        }`}
      >
        {/* Top Header Badge */}
        <div className="px-6 py-4 bg-gradient-to-r from-orange-600 via-amber-600 to-orange-700 text-white flex items-center justify-between shadow-md">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-white/15 border border-white/30 flex items-center justify-center">
              <HardHat className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-white tracking-wide uppercase">
                  {language === 'hi'
                    ? 'अधिकारी सुरक्षा सत्यापन'
                    : 'Officer Security Clearance'}
                </h3>
                <span className="px-1.5 py-0.5 rounded text-[9px] bg-black/30 font-extrabold uppercase text-amber-200">
                  PWD Level 1
                </span>
              </div>
              <p className="text-[11px] text-orange-100">
                {language === 'hi'
                  ? 'गोवा नगर पालिका एवं लोक निर्माण विभाग'
                  : 'Goa Municipal & Public Works Dept.'}
              </p>
            </div>
          </div>

          <button
            type="button"
            id="btn-close-officer-pin"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-black/20 hover:bg-black/40 text-white flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5">
          {!isCustomizingPin ? (
            <>
              {/* Shield Icon & Description */}
              <div className="text-center space-y-1.5">
                <div className="w-14 h-14 rounded-2xl bg-orange-500/10 border border-orange-500/30 text-orange-400 mx-auto flex items-center justify-center shadow-inner">
                  <ShieldCheck className="w-7 h-7" />
                </div>
                <h4 className="text-base font-bold text-white">
                  {language === 'hi'
                    ? 'अधिकारी पोर्टल सुरक्षा पिन दर्ज करें'
                    : 'Enter Officer Security PIN'}
                </h4>
                <p className="text-xs text-slate-400 max-w-xs mx-auto">
                  {language === 'hi'
                    ? 'अधिकारी डेस्क, शिकायत आवंटन और मरम्मत समाधान तक पहुंचने के लिए 4 अंकों का सुरक्षा पिन आवश्यक है।'
                    : 'Authorized Goa PWD and Municipal officers only. Enter your 4-digit security PIN to proceed.'}
                </p>
              </div>

              {/* Hidden input for physical keyboard entry */}
              <input
                ref={inputRef}
                type="password"
                inputMode="numeric"
                maxLength={4}
                value={pin}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, '').slice(0, 4);
                  setPin(val);
                  setError('');
                  if (val.length === 4) {
                    verifyPin(val);
                  }
                }}
                className="opacity-0 absolute -z-10 w-0 h-0"
                autoFocus
              />

              {/* Visual 4-Digit Masked Indicators */}
              <div
                onClick={() => inputRef.current?.focus()}
                className="flex items-center justify-center gap-3.5 py-2 cursor-pointer"
              >
                {[0, 1, 2, 3].map((idx) => {
                  const filled = pin.length > idx;
                  return (
                    <div
                      key={idx}
                      className={`w-12 h-14 rounded-2xl border-2 flex items-center justify-center text-xl font-bold transition-all duration-150 ${
                        filled
                          ? 'border-orange-500 bg-orange-500/10 text-orange-400 shadow-lg shadow-orange-500/20 scale-105'
                          : idx === pin.length
                          ? 'border-slate-500 bg-slate-800/80 text-white animate-pulse'
                          : 'border-slate-700 bg-slate-800/40 text-slate-500'
                      }`}
                    >
                      {filled ? '●' : ''}
                    </div>
                  );
                })}
              </div>

              {/* Error Message */}
              {error && (
                <div className="p-2.5 rounded-xl bg-red-950/80 border border-red-500/40 text-red-200 text-xs flex items-start gap-2 animate-in fade-in">
                  <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              {/* Interactive Keypad */}
              <div className="grid grid-cols-3 gap-2 pt-1 max-w-[280px] mx-auto">
                {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => handleKeypadPress(num)}
                    className="h-12 rounded-xl bg-slate-800 hover:bg-slate-700 active:bg-orange-600 active:text-white text-white font-bold text-lg border border-slate-700/80 shadow-xs transition-all flex items-center justify-center"
                  >
                    {num}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={handleClear}
                  className="h-12 rounded-xl bg-slate-800/60 hover:bg-slate-800 text-slate-400 hover:text-white font-semibold text-xs border border-slate-700/60 transition-colors flex items-center justify-center"
                >
                  Clear
                </button>
                <button
                  type="button"
                  onClick={() => handleKeypadPress('0')}
                  className="h-12 rounded-xl bg-slate-800 hover:bg-slate-700 active:bg-orange-600 active:text-white text-white font-bold text-lg border border-slate-700/80 shadow-xs transition-all flex items-center justify-center"
                >
                  0
                </button>
                <button
                  type="button"
                  onClick={handleBackspace}
                  className="h-12 rounded-xl bg-slate-800/60 hover:bg-slate-800 text-slate-300 hover:text-orange-400 font-semibold text-sm border border-slate-700/60 transition-colors flex items-center justify-center"
                >
                  <Delete className="w-5 h-5" />
                </button>
              </div>

              {/* Passcode Hint for Demo & Evaluation */}
              <div className="pt-2 border-t border-slate-800 flex flex-col items-center gap-1.5 text-center">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-800/90 border border-slate-700 text-slate-300 text-xs font-mono">
                  <KeyRound className="w-3.5 h-3.5 text-amber-400" />
                  <span>
                    {language === 'hi' ? 'डिफ़ॉल्ट अधिकारी पिन: ' : 'Default Officer PIN: '}
                    <strong className="text-amber-400 font-bold">{currentExpectedPin}</strong>
                  </span>
                </div>

                <div className="flex items-center gap-3 text-[11px] text-slate-400 pt-1">
                  <button
                    type="button"
                    onClick={() => setIsCustomizingPin(true)}
                    className="hover:text-orange-400 underline underline-offset-2 transition-colors"
                  >
                    {language === 'hi' ? 'पिन बदलें' : 'Change Officer PIN'}
                  </button>
                  <span>•</span>
                  <button
                    type="button"
                    onClick={onClose}
                    className="hover:text-slate-200 transition-colors"
                  >
                    {language === 'hi' ? 'नागरिक पोर्टल पर रहें' : 'Stay in Citizen Portal'}
                  </button>
                </div>
              </div>
            </>
          ) : (
            /* Change PIN Subview */
            <form onSubmit={handleSaveCustomPin} className="space-y-4">
              <div className="text-center space-y-1">
                <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 mx-auto flex items-center justify-center">
                  <KeyRound className="w-6 h-6" />
                </div>
                <h4 className="text-sm font-bold text-white">
                  {language === 'hi'
                    ? 'नया अधिकारी सुरक्षा पिन सेट करें'
                    : 'Set New Officer PIN'}
                </h4>
                <p className="text-[11px] text-slate-400">
                  {language === 'hi'
                    ? 'अधिकारी पोर्टल को सुरक्षित करने के लिए 4 अंकों का नया पिन चुनें।'
                    : 'Set a custom 4-digit numeric code to protect municipal officer access.'}
                </p>
              </div>

              {customPinSuccess && (
                <div className="p-2 rounded-lg bg-emerald-950 border border-emerald-500/40 text-emerald-200 text-xs flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>{customPinSuccess}</span>
                </div>
              )}

              {error && (
                <div className="p-2 rounded-lg bg-red-950 border border-red-500/40 text-red-200 text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    {language === 'hi' ? 'नया 4 अंकों का पिन' : 'New 4-Digit PIN'}
                  </label>
                  <input
                    type="password"
                    maxLength={4}
                    value={newPin}
                    onChange={(e) =>
                      setNewPin(e.target.value.replace(/\D/g, '').slice(0, 4))
                    }
                    placeholder="e.g., 5678"
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white font-mono text-center tracking-widest text-lg focus:outline-hidden focus:ring-2 focus:ring-orange-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    {language === 'hi' ? 'पिन की पुष्टि करें' : 'Confirm New PIN'}
                  </label>
                  <input
                    type="password"
                    maxLength={4}
                    value={confirmPin}
                    onChange={(e) =>
                      setConfirmPin(e.target.value.replace(/\D/g, '').slice(0, 4))
                    }
                    placeholder="e.g., 5678"
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white font-mono text-center tracking-widest text-lg focus:outline-hidden focus:ring-2 focus:ring-orange-500"
                    required
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsCustomizingPin(false);
                    setError('');
                  }}
                  className="flex-1 py-2 px-3 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl border border-slate-700 transition-colors"
                >
                  {language === 'hi' ? 'रद्द करें' : 'Cancel'}
                </button>

                <button
                  type="submit"
                  className="flex-1 py-2 px-3 bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold rounded-xl shadow-md transition-colors"
                >
                  {language === 'hi' ? 'पिन सहेजें' : 'Save PIN'}
                </button>
              </div>

              <div className="text-center pt-1">
                <button
                  type="button"
                  onClick={handleResetDefaultPin}
                  className="text-[11px] text-slate-400 hover:text-orange-400 underline transition-colors"
                >
                  {language === 'hi'
                    ? 'डिफ़ॉल्ट पिन (1234) पर रीसेट करें'
                    : 'Reset back to default (1234)'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
