import React, { useState } from 'react';
import {
  LayoutDashboard,
  FilePlus,
  Map as MapIcon,
  BarChart3,
  LogOut,
  User as UserIcon,
  HardHat,
  Shield,
  Layers,
  Sparkles,
  ArrowRightLeft,
  Lock,
  KeyRound,
} from 'lucide-react';
import { Language, PageView, User } from '../types';
import { translations } from '../utils/translations';
import { OfficerPinSettingsModal } from './OfficerPinSettingsModal';

interface SidebarProps {
  currentPage: PageView;
  setCurrentPage: (page: PageView) => void;
  currentUser: User | null;
  language: Language;
  onLogout: () => void;
  onQuickSwitchRole: () => void;
  mobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentPage,
  setCurrentPage,
  currentUser,
  language,
  onLogout,
  onQuickSwitchRole,
  mobileOpen,
  setMobileOpen,
}) => {
  const t = translations[language];
  const [showPinSettings, setShowPinSettings] = useState<boolean>(false);

  const navItems = [
    ...(currentUser?.role === 'officer'
      ? [
          {
            id: 'officer_dashboard' as PageView,
            label: t.officerDashboard,
            icon: LayoutDashboard,
          },
        ]
      : [
          {
            id: 'citizen_dashboard' as PageView,
            label: t.citizenDashboard,
            icon: LayoutDashboard,
          },
          {
            id: 'submit_complaint' as PageView,
            label: t.submitComplaint,
            icon: FilePlus,
          },
        ]),
    {
      id: 'complaint_map' as PageView,
      label: t.complaintMap,
      icon: MapIcon,
    },
    {
      id: 'analytics' as PageView,
      label: t.analytics,
      icon: BarChart3,
    },
  ];

  const handleNav = (page: PageView) => {
    setCurrentPage(page);
    setMobileOpen(false);
  };

  const initials = currentUser?.name
    ? currentUser.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .substring(0, 2)
        .toUpperCase()
    : 'GR';

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-xs lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 bg-slate-900 text-white flex flex-col transition-transform duration-300 ease-in-out border-r border-slate-800 lg:static lg:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="p-5 flex items-center justify-between border-b border-slate-800">
          <div
            onClick={() =>
              handleNav(
                currentUser?.role === 'officer' ? 'officer_dashboard' : 'citizen_dashboard'
              )
            }
            className="flex items-center gap-3 cursor-pointer select-none group"
          >
            <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center font-bold text-white shadow-xs group-hover:scale-105 transition-transform">
              N
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight text-white leading-none">
                NagrikSetu
              </h1>
              <span className="text-[10px] text-orange-400 font-medium tracking-wide">
                Govt. PWD & Municipal
              </span>
            </div>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto">
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2 px-3">
            {currentUser?.role === 'officer' ? t.officerDesk : t.citizenServices}
          </div>

          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPage === item.id;

            return (
              <button
                key={item.id}
                id={`sidebar-nav-${item.id}`}
                onClick={() => handleNav(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all text-left ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}

          {/* Quick Submit Shortcut for Citizen */}
          {currentUser?.role === 'citizen' && currentPage !== 'submit_complaint' && (
            <div className="pt-4 px-1">
              <button
                onClick={() => handleNav('submit_complaint')}
                className="w-full py-2.5 px-3 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white rounded-lg text-xs font-bold shadow-xs flex items-center justify-center gap-2 transition-all"
              >
                <FilePlus className="w-4 h-4" />
                <span>{t.reportNewPothole}</span>
              </button>
            </div>
          )}

          {/* District Zones Indicator */}
          <div className="pt-6 px-3">
            <div className="p-3 bg-slate-800/60 rounded-xl border border-slate-700/60 text-xs space-y-1">
              <div className="text-[10px] uppercase font-bold text-slate-400">{t.jurisdiction}</div>
              <div className="text-slate-200 font-semibold">{t.jurisdictionArea}</div>
              <div className="text-[11px] text-slate-400 flex items-center gap-1.5 pt-0.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>{t.talukasActive}</span>
              </div>
            </div>
          </div>
        </nav>

        {/* User Footer Profile */}
        <div className="p-4 border-t border-slate-800 text-sm bg-slate-900/90">
          {currentUser ? (
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center font-semibold text-xs text-white shrink-0">
                    {initials}
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] text-slate-400 leading-none">{t.welcome}</p>
                    <p className="font-semibold text-xs text-slate-100 truncate mt-0.5">
                      {currentUser.name}
                    </p>
                  </div>
                </div>

                <button
                  id="sidebar-btn-logout"
                  onClick={onLogout}
                  title={t.logout}
                  className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-md transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>

              {/* Role Indicator & Quick Switch */}
              <div className="flex items-center justify-between bg-slate-800/80 px-2.5 py-1.5 rounded-lg border border-slate-700/60 text-xs">
                <div className="flex items-center gap-1.5">
                  {currentUser.role === 'officer' ? (
                    <HardHat className="w-3.5 h-3.5 text-orange-400" />
                  ) : (
                    <UserIcon className="w-3.5 h-3.5 text-blue-400" />
                  )}
                  <span className="text-[11px] font-medium text-slate-300">
                    {currentUser.role === 'officer' ? t.officer : t.citizen} {t.roleMode}
                  </span>
                </div>
                <button
                  id="sidebar-btn-switch-role"
                  onClick={onQuickSwitchRole}
                  title={currentUser.role === 'citizen' ? 'Switch to Officer (PIN 1234 required)' : 'Switch to Citizen'}
                  className="text-[10px] text-orange-400 hover:text-orange-300 font-semibold flex items-center gap-1 transition-colors"
                >
                  {currentUser.role === 'citizen' ? (
                    <Lock className="w-3 h-3 text-amber-400" />
                  ) : (
                    <ArrowRightLeft className="w-3 h-3" />
                  )}
                  <span>{t.switchRole}</span>
                </button>
              </div>

              {/* Officer Security Clearance & PIN Settings Button */}
              {currentUser.role === 'officer' && (
                <button
                  type="button"
                  id="sidebar-btn-officer-pin-settings"
                  onClick={() => setShowPinSettings(true)}
                  className="w-full flex items-center justify-center gap-1.5 py-1.5 px-2.5 bg-slate-800/90 hover:bg-slate-750 text-amber-300 hover:text-amber-200 border border-slate-700/80 rounded-lg text-[11px] font-semibold transition-all shadow-2xs"
                >
                  <KeyRound className="w-3.5 h-3.5" />
                  <span>{language === 'hi' ? 'सुरक्षा पिन रीसेट / बदलें' : 'Reset / Change PIN'}</span>
                </button>
              )}
            </div>
          ) : (
            <button
              onClick={() => handleNav('login')}
              className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-colors"
            >
              {t.signInPortal}
            </button>
          )}
        </div>
      </aside>

      {/* Officer PIN Settings & Reset Modal */}
      <OfficerPinSettingsModal
        isOpen={showPinSettings}
        onClose={() => setShowPinSettings(false)}
        language={language}
      />
    </>
  );
};
