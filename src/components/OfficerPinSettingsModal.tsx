import React, { useState, useEffect } from 'react';
import {
  Shield,
  ShieldCheck,
  KeyRound,
  RotateCcw,
  Lock,
  Eye,
  EyeOff,
  Check,
  AlertCircle,
  X,
  HardHat,
  Sparkles,
} from 'lucide-react';
import { Language } from '../types';
import { translations } from '../utils/translations';
import {
  getStoredOfficerPin,
  setStoredOfficerPin,
  resetStoredOfficerPin,
  DEFAULT_OFFICER_PIN,
} from '../utils/officerPin';

interface OfficerPinSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: Language;
}

export const OfficerPinSettingsModal: React.FC<OfficerPinSettingsModalProps> = ({
  isOpen,
  onClose,
  language,
}) => {
  const t = translations[language];
  const [activePin, setActivePin] = useState<string>(DEFAULT_OFFICER_PIN);
  const [showCurrentPin, setShowCurrentPin] = useState<boolean>(false);

  // Form states
  const [currentPinInput, setCurrentPinInput] = useState<string>('');
  const [newPin, setNewPin] = useState<string>('');
  const [confirmPin, setConfirmPin] = useState<string>('');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(
    null
  );
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen) {
      setActivePin(getStoredOfficerPin());
      setCurrentPinInput('');
      setNewPin('');
      setConfirmPin('');
      setMessage(null);
      setIsResetConfirmOpen(false);
      setShowCurrentPin(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleUpdatePin = (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    const stored = getStoredOfficerPin();
    if (currentPinInput !== stored) {
      setMessage({
        type: 'error',
        text:
          language === 'hi'
            ? 'वर्तमान सुरक्षा पिन गलत है।'
            : 'The current security PIN entered is incorrect.',
      });
      return;
    }

    if (!/^\d{4}$/.test(newPin)) {
      setMessage({
        type: 'error',
        text:
          language === 'hi'
            ? 'नया पिन ठीक 4 अंकों की संख्या होनी चाहिए।'
            : 'New PIN must be exactly 4 numeric digits.',
      });
      return;
    }

    if (newPin !== confirmPin) {
      setMessage({
        type: 'error',
        text:
          language === 'hi'
            ? 'नया पिन और पुष्टि पिन मेल नहीं खा रहे हैं।'
            : 'New PIN and Confirmation PIN do not match.',
      });
      return;
    }

    const success = setStoredOfficerPin(newPin);
    if (success) {
      setActivePin(newPin);
      setCurrentPinInput('');
      setNewPin('');
      setConfirmPin('');
      setMessage({
        type: 'success',
        text:
          language === 'hi'
            ? 'अधिकारी सुरक्षा पिन सफलतापूर्वक अपडेट किया गया!'
            : 'Officer Security PIN updated successfully!',
      });
    } else {
      setMessage({
        type: 'error',
        text: 'Failed to update PIN. Please try again.',
      });
    }
  };

  const handleResetToDefault = () => {
    resetStoredOfficerPin();
    setActivePin(DEFAULT_OFFICER_PIN);
    setCurrentPinInput('');
    setNewPin('');
    setConfirmPin('');
    setIsResetConfirmOpen(false);
    setMessage({
      type: 'success',
      text:
        language === 'hi'
          ? `सुरक्षा पिन को डिफ़ॉल्ट (${DEFAULT_OFFICER_PIN}) पर रीसेट कर दिया गया है!`
          : `Security PIN has been reset to default (${DEFAULT_OFFICER_PIN})!`,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 animate-in fade-in duration-150">
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4.5 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-500/20 border border-orange-500/40 text-orange-400 flex items-center justify-center shrink-0">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white tracking-wide">
                  {language === 'hi'
                    ? 'अधिकारी सुरक्षा पिन प्रबंधन'
                    : 'Officer Security PIN Settings'}
                </h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase bg-orange-500 text-white shadow-xs">
                  PWD Clearance
                </span>
              </div>
              <p className="text-xs text-slate-300">
                {language === 'hi'
                  ? 'अधिकारी पोर्टल का सुरक्षा पिन बदलें या रीसेट करें'
                  : 'Manage, change, or reset your 4-digit access clearance PIN'}
              </p>
            </div>
          </div>

          <button
            type="button"
            id="btn-close-pin-settings"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Active PIN Status Card */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                {language === 'hi' ? 'सक्रिय सुरक्षा पिन' : 'Active Security PIN'}
              </span>
              <div className="flex items-center gap-2">
                <span className="text-xl font-mono font-bold text-slate-800 tracking-widest">
                  {showCurrentPin ? activePin : '••••'}
                </span>
                <button
                  type="button"
                  onClick={() => setShowCurrentPin(!showCurrentPin)}
                  className="p-1 text-slate-400 hover:text-slate-600 transition-colors"
                  title={showCurrentPin ? 'Hide PIN' : 'Reveal PIN'}
                >
                  {showCurrentPin ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
                {activePin === DEFAULT_OFFICER_PIN && (
                  <span className="text-[10px] bg-amber-100 text-amber-800 font-semibold px-2 py-0.5 rounded-full border border-amber-200">
                    Default (1234)
                  </span>
                )}
              </div>
            </div>

            {/* Direct Quick Reset Button */}
            {!isResetConfirmOpen ? (
              <button
                type="button"
                id="btn-quick-reset-pin"
                onClick={() => setIsResetConfirmOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 shadow-2xs transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5 text-amber-600" />
                <span>{language === 'hi' ? 'डिफ़ॉल्ट पर रीसेट करें' : 'Reset to Default'}</span>
              </button>
            ) : (
              <div className="flex items-center gap-1.5 animate-in fade-in">
                <button
                  type="button"
                  onClick={handleResetToDefault}
                  className="px-2.5 py-1 text-xs font-bold bg-red-600 text-white hover:bg-red-700 rounded-lg shadow-xs"
                >
                  {language === 'hi' ? 'पुष्टि करें (1234)' : 'Confirm Reset (1234)'}
                </button>
                <button
                  type="button"
                  onClick={() => setIsResetConfirmOpen(false)}
                  className="px-2 py-1 text-xs font-semibold bg-slate-200 text-slate-700 hover:bg-slate-300 rounded-lg"
                >
                  ✕
                </button>
              </div>
            )}
          </div>

          {/* Feedback message banner */}
          {message && (
            <div
              className={`p-3 rounded-xl text-xs flex items-center gap-2 animate-in fade-in ${
                message.type === 'success'
                  ? 'bg-emerald-50 border border-emerald-300 text-emerald-900 font-medium'
                  : 'bg-red-50 border border-red-300 text-red-900 font-medium'
              }`}
            >
              {message.type === 'success' ? (
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
              )}
              <span>{message.text}</span>
            </div>
          )}

          {/* Change PIN Form */}
          <form onSubmit={handleUpdatePin} className="space-y-4">
            <div className="border-t border-slate-100 pt-4">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-orange-600" />
                <span>
                  {language === 'hi'
                    ? 'नया कस्टम सुरक्षा पिन सेट करें'
                    : 'Set Custom Security PIN'}
                </span>
              </h4>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {language === 'hi' ? 'वर्तमान पिन दर्ज करें' : 'Current Security PIN'}
                  </label>
                  <input
                    type="password"
                    inputMode="numeric"
                    maxLength={4}
                    required
                    value={currentPinInput}
                    onChange={(e) =>
                      setCurrentPinInput(e.target.value.replace(/\D/g, '').slice(0, 4))
                    }
                    placeholder="••••"
                    className="w-full px-3 py-2 text-sm font-mono tracking-widest rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-orange-500 bg-white"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      {language === 'hi' ? 'नया 4-अंकीय पिन' : 'New 4-Digit PIN'}
                    </label>
                    <input
                      type="password"
                      inputMode="numeric"
                      maxLength={4}
                      required
                      value={newPin}
                      onChange={(e) =>
                        setNewPin(e.target.value.replace(/\D/g, '').slice(0, 4))
                      }
                      placeholder="e.g. 5678"
                      className="w-full px-3 py-2 text-sm font-mono tracking-widest rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-orange-500 bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      {language === 'hi' ? 'पिन की पुष्टि करें' : 'Confirm New PIN'}
                    </label>
                    <input
                      type="password"
                      inputMode="numeric"
                      maxLength={4}
                      required
                      value={confirmPin}
                      onChange={(e) =>
                        setConfirmPin(e.target.value.replace(/\D/g, '').slice(0, 4))
                      }
                      placeholder="e.g. 5678"
                      className="w-full px-3 py-2 text-sm font-mono tracking-widest rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-orange-500 bg-white"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
              >
                {language === 'hi' ? 'बंद करें' : 'Close'}
              </button>

              <button
                type="submit"
                id="btn-submit-change-pin"
                className="px-4 py-2 text-xs font-bold text-white bg-orange-600 hover:bg-orange-700 active:scale-98 rounded-lg shadow-xs transition-all flex items-center gap-1.5"
              >
                <Check className="w-3.5 h-3.5" />
                <span>{language === 'hi' ? 'पिन अपडेट करें' : 'Update Security PIN'}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
