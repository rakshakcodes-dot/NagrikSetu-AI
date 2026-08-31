import React from 'react';
import { UserCheck, ShieldAlert, ArrowRight, Sparkles, User, HardHat, Lock } from 'lucide-react';
import { Language, User as UserType } from '../types';
import { translations } from '../utils/translations';

interface DemoBannerProps {
  currentUser: UserType | null;
  onSwitchToCitizen: () => void;
  onSwitchToOfficer: () => void;
  language: Language;
}

export const DemoBanner: React.FC<DemoBannerProps> = ({
  currentUser,
  onSwitchToCitizen,
  onSwitchToOfficer,
  language,
}) => {
  const t = translations[language];

  return (
    <div className="bg-gradient-to-r from-blue-950 via-slate-900 to-blue-900 text-white border-b border-blue-800/60 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5">
        <div className="flex flex-col md:flex-row items-center justify-between gap-2.5 text-xs">
          {/* Left: Demo Flow Guide */}
          <div className="flex items-center gap-2 text-slate-200">
            <span className="flex items-center justify-center w-5 h-5 rounded-full bg-orange-500 text-white font-bold text-[10px] shrink-0">
              ✓
            </span>
            <span className="font-semibold text-orange-400">{t.demoBannerTitle}:</span>
            <span className="hidden lg:inline text-slate-300">
              {t.demoFlowText}
            </span>
            <span className="lg:hidden text-slate-300 truncate">
              {t.demoBannerTitle}
            </span>
          </div>

          {/* Right: Quick 1-Click Role Switcher */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-slate-400 text-[11px] hidden sm:inline">{t.activeRole}</span>
            
            <button
              id="quick-demo-citizen"
              onClick={onSwitchToCitizen}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-semibold transition-all ${
                currentUser?.role === 'citizen'
                  ? 'bg-blue-600 text-white ring-2 ring-orange-400 shadow-xs'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white border border-slate-700'
              }`}
            >
              <User className="w-3.5 h-3.5 text-orange-400" />
              <span>{t.quickCitizenLogin}</span>
              {currentUser?.role === 'citizen' && <span className="text-[10px] bg-blue-700 px-1 rounded">{t.systemLive}</span>}
            </button>

            <button
              id="quick-demo-officer"
              onClick={onSwitchToOfficer}
              title="Protected by Municipal Security PIN (1234)"
              className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-semibold transition-all ${
                currentUser?.role === 'officer'
                  ? 'bg-orange-600 text-white ring-2 ring-white shadow-xs'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white border border-slate-700'
              }`}
            >
              <HardHat className="w-3.5 h-3.5 text-yellow-300" />
              <span>{t.quickOfficerLogin}</span>
              {currentUser?.role !== 'officer' && (
                <Lock className="w-3 h-3 text-amber-400" />
              )}
              {currentUser?.role === 'officer' && <span className="text-[10px] bg-orange-700 px-1 rounded">{t.systemLive}</span>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
