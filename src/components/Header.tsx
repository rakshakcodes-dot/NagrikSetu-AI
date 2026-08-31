import React, { useState, useEffect } from 'react';
import {
  Bell,
  Menu,
  Shield,
  User as UserIcon,
  HardHat,
  LogOut,
  ArrowRightLeft,
  Database,
  CheckCircle2,
  Copy,
  ExternalLink,
  X,
  Lock,
} from 'lucide-react';
import { Language, PageView, User } from '../types';
import { translations } from '../utils/translations';
import { isSupabaseConfigured, testSupabaseConnection, SupabaseHealth } from '../lib/supabase';
import { NotificationCenter } from './NotificationCenter';

interface HeaderProps {
  currentPage: PageView;
  setCurrentPage: (page: PageView) => void;
  currentUser: User | null;
  language: Language;
  setLanguage: (lang: Language) => void;
  onLogout: () => void;
  onQuickSwitchRole: () => void;
  onToggleSidebar: () => void;
  onNavigateToComplaint?: (complaintId: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentPage,
  setCurrentPage,
  currentUser,
  language,
  setLanguage,
  onLogout,
  onQuickSwitchRole,
  onToggleSidebar,
  onNavigateToComplaint,
}) => {
  const t = translations[language];
  const [dbHealth, setDbHealth] = useState<SupabaseHealth>({
    configured: false,
    connected: false,
    message: 'Checking database status...',
  });
  const [showDbModal, setShowDbModal] = useState<boolean>(false);
  const [copiedSql, setCopiedSql] = useState<boolean>(false);

  useEffect(() => {
    testSupabaseConnection().then(setDbHealth);
  }, []);

  const copySchemaSql = () => {
    const sqlNotice = `-- Run this in your Supabase SQL Editor:
-- Find the complete file at /supabase-schema.sql in the codebase.
-- It provisions tables for users, complaints, status_updates, and feedback.`;
    navigator.clipboard.writeText(sqlNotice);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 3000);
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 sm:px-6 lg:px-8 shrink-0 z-30 sticky top-0">
      {/* Left Area: Mobile Toggle & Header Title */}
      <div className="flex items-center gap-3 sm:gap-4">
        <button
          id="btn-toggle-sidebar"
          onClick={onToggleSidebar}
          className="lg:hidden p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg"
          aria-label="Toggle Navigation"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2.5">
          <h2 className="text-base sm:text-lg font-bold text-slate-800 tracking-tight">
            {currentUser?.role === 'officer'
              ? t.officerDeskHeader
              : t.citizenPortalHeader}
          </h2>

          {/* Supabase Status Pill */}
          <button
            onClick={() => setShowDbModal(true)}
            title="Click to view Supabase Database Connection Details"
            className={`hidden sm:inline-flex items-center gap-1.5 px-2.5 py-0.5 text-[11px] font-bold rounded-full border transition-all ${
              dbHealth.connected
                ? 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100'
                : 'bg-blue-50 text-blue-800 border-blue-200 hover:bg-blue-100'
            }`}
          >
            <Database className="w-3 h-3 text-emerald-600" />
            <span>{dbHealth.connected ? 'Supabase Live' : 'Supabase Ready'}</span>
          </button>
        </div>
      </div>

      {/* Right Area: Language Switcher, Alerts & Role Profile */}
      <div className="flex items-center gap-3 sm:gap-5">
        {/* Language Switcher */}
        <div className="flex bg-slate-100 p-1 rounded-lg text-xs font-medium border border-slate-200/80">
          <button
            id="lang-btn-en"
            onClick={() => setLanguage('en')}
            className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
              language === 'en'
                ? 'bg-white shadow-2xs text-blue-700 font-bold'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            English
          </button>
          <button
            id="lang-btn-hi"
            onClick={() => setLanguage('hi')}
            className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
              language === 'hi'
                ? 'bg-white shadow-2xs text-blue-700 font-bold'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            हिंदी
          </button>
        </div>

        {/* Quick Role Switcher Pill */}
        {currentUser && (
          <button
            id="btn-quick-switch-role-header"
            onClick={onQuickSwitchRole}
            title={currentUser.role === 'citizen' ? 'Switch to Officer Portal (PIN 1234 required)' : 'Switch to Citizen Portal'}
            className={`hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
              currentUser.role === 'officer'
                ? 'bg-orange-50 text-orange-900 border-orange-200 hover:bg-orange-100'
                : 'bg-blue-50 text-blue-900 border-blue-200 hover:bg-blue-100'
            }`}
          >
            {currentUser.role === 'officer' ? (
              <HardHat className="w-3.5 h-3.5 text-orange-600" />
            ) : (
              <UserIcon className="w-3.5 h-3.5 text-blue-600" />
            )}
            <span>{t.roleMode}: {currentUser.role === 'officer' ? t.officer : t.citizen}</span>
            {currentUser.role === 'citizen' ? (
              <Lock className="w-3 h-3 text-amber-500 ml-0.5" />
            ) : (
              <ArrowRightLeft className="w-3 h-3 text-slate-400 ml-0.5" />
            )}
          </button>
        )}

        {/* Interactive Civic & Grievance Notification Center */}
        <NotificationCenter
          currentUser={currentUser}
          language={language}
          onNavigateToPage={setCurrentPage}
          onNavigateToComplaint={onNavigateToComplaint}
        />
      </div>

      {/* Supabase Connection Modal */}
      {showDbModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 text-left space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <Database className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">Supabase Database Integration</h3>
                  <p className="text-[11px] text-slate-500">PostgreSQL tables for complaints, users, updates & feedback</p>
                </div>
              </div>
              <button
                onClick={() => setShowDbModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className={`p-3.5 rounded-xl border text-xs space-y-1.5 ${
              dbHealth.connected
                ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                : 'bg-slate-50 border-slate-200 text-slate-700'
            }`}>
              <div className="flex items-center justify-between font-bold">
                <span>Database Status:</span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] ${
                  dbHealth.connected ? 'bg-emerald-200 text-emerald-900' : 'bg-blue-100 text-blue-800'
                }`}>
                  {dbHealth.connected ? 'Connected' : 'Local / Ready'}
                </span>
              </div>
              <p className="text-[11px] leading-relaxed">{dbHealth.message}</p>
            </div>

            <div className="space-y-2 text-xs">
              <div className="font-bold text-slate-800">Database Tables Managed:</div>
              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div className="p-2 bg-slate-50 rounded-lg border border-slate-200">
                  <span className="font-bold text-blue-900">1. complaints</span>
                  <p className="text-slate-500 text-[10px]">Grievance records, geo-coords, priority, photos & status</p>
                </div>
                <div className="p-2 bg-slate-50 rounded-lg border border-slate-200">
                  <span className="font-bold text-blue-900">2. users</span>
                  <p className="text-slate-500 text-[10px]">Citizen and municipal officer profiles & auth</p>
                </div>
                <div className="p-2 bg-slate-50 rounded-lg border border-slate-200">
                  <span className="font-bold text-blue-900">3. status_updates</span>
                  <p className="text-slate-500 text-[10px]">Timeline notes, officer dispatch & audit trail</p>
                </div>
                <div className="p-2 bg-slate-50 rounded-lg border border-slate-200">
                  <span className="font-bold text-blue-900">4. feedback</span>
                  <p className="text-slate-500 text-[10px]">Citizen 5-star ratings & resolution quality comments</p>
                </div>
              </div>
            </div>

            <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-100 text-xs space-y-1">
              <span className="font-bold text-blue-950 block">SQL Schema File Included:</span>
              <p className="text-slate-600 text-[11px]">
                File <code className="bg-blue-100 px-1 py-0.5 rounded text-blue-900 font-mono text-[10px]">supabase-schema.sql</code> at the project root contains full table definitions, foreign keys, and RLS policies ready to execute in Supabase SQL editor.
              </p>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowDbModal(false)}
                className="px-4 py-2 bg-blue-900 text-white rounded-lg text-xs font-bold hover:bg-blue-800"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
