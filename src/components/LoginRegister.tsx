import React, { useState, useEffect } from 'react';
import { Shield, User, HardHat, Mail, Lock, KeyRound, CheckCircle2, ArrowRight, Database, AlertCircle, Loader2 } from 'lucide-react';
import { Language, User as UserType, UserRole } from '../types';
import { translations } from '../utils/translations';
import { DEMO_USERS } from '../data/sampleData';
import { isSupabaseConfigured, testSupabaseConnection } from '../lib/supabase';
import { signInWithSupabase, signUpWithSupabase } from '../services/supabaseService';
import { getStoredOfficerPin } from '../utils/officerPin';

interface LoginRegisterProps {
  onLogin: (user: UserType) => void;
  language: Language;
}

export const LoginRegister: React.FC<LoginRegisterProps> = ({ onLogin, language }) => {
  const [tab, setTab] = useState<'login' | 'register'>('login');
  const [role, setRole] = useState<UserRole>('citizen');
  const [email, setEmail] = useState('citizen@test.com');
  const [password, setPassword] = useState('password123');
  const [officerPin, setOfficerPin] = useState('1234');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [taluka, setTaluka] = useState('Panaji (Tiswadi)');
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isDbConnected, setIsDbConnected] = useState<boolean>(false);

  const t = translations[language];

  useEffect(() => {
    testSupabaseConnection().then((res) => {
      setIsDbConnected(res.connected);
    });
  }, []);

  const getExpectedPin = (): string => {
    return getStoredOfficerPin();
  };

  const handleDemoFill = (selectedRole: UserRole) => {
    setRole(selectedRole);
    if (selectedRole === 'citizen') {
      setEmail('citizen@test.com');
      setPassword('password123');
    } else {
      setEmail('officer@test.com');
      setPassword('password123');
      setOfficerPin(getExpectedPin());
    }
    setErrorMessage('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!email || !password) {
      setErrorMessage('Please fill in both email and password.');
      return;
    }

    // If logging in or registering as officer, verify the security PIN
    if (role === 'officer') {
      const expectedPin = getExpectedPin();
      if (officerPin !== expectedPin) {
        setErrorMessage(
          language === 'hi'
            ? 'अमान्य अधिकारी सुरक्षा पिन। केवल अधिकृत नगर निगम अधिकारी ही प्रवेश कर सकते हैं।'
            : 'Access Denied: Invalid Officer Security PIN. Only authorized Goa PWD officers may enter.'
        );
        return;
      }
    }

    setIsLoading(true);

    try {
      // 1. If 1-click demo user clicked, allow instant login
      if (email === 'citizen@test.com' && password === 'password123') {
        onLogin(DEMO_USERS.citizen);
        setIsLoading(false);
        return;
      } else if (email === 'officer@test.com' && password === 'password123') {
        onLogin(DEMO_USERS.officer);
        setIsLoading(false);
        return;
      }

      // 2. If Supabase is configured, use real Supabase Auth
      if (isSupabaseConfigured()) {
        if (tab === 'login') {
          const { user, error } = await signInWithSupabase(email, password);
          if (error) {
            setErrorMessage(error);
            setIsLoading(false);
            return;
          }
          if (user) {
            onLogin(user);
            setIsLoading(false);
            return;
          }
        } else {
          // Register
          if (!name) {
            setErrorMessage('Please enter your full name.');
            setIsLoading(false);
            return;
          }
          const { user, error } = await signUpWithSupabase(email, password, {
            name,
            email,
            role,
            phone: phone || '+91 98000 00000',
            taluka,
            department: role === 'officer' ? 'Goa Public Works Dept (Roads)' : undefined,
            designation: role === 'officer' ? 'Field Inspection Officer' : undefined,
          });

          if (error) {
            setErrorMessage(error);
            setIsLoading(false);
            return;
          }
          if (user) {
            onLogin(user);
            setIsLoading(false);
            return;
          }
        }
      } else {
        // Local mode fallback
        if (tab === 'login') {
          onLogin({
            id: `usr-${Date.now()}`,
            name: email.split('@')[0],
            email,
            role,
            taluka,
          });
        } else {
          if (!name) {
            setErrorMessage('Please enter your full name.');
            setIsLoading(false);
            return;
          }
          const newUser: UserType = {
            id: `usr-${Date.now()}`,
            name,
            email,
            role,
            phone: phone || '+91 98000 00000',
            taluka,
            department: role === 'officer' ? 'Goa Public Works Dept (Roads)' : undefined,
            designation: role === 'officer' ? 'Field Inspection Officer' : undefined,
          };
          onLogin(newUser);
        }
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Authentication error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] bg-slate-50 flex items-center justify-center px-4 py-8 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-6">
        {/* Emblem & Portal Branding */}
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-blue-900 text-white shadow-md ring-4 ring-orange-500/20 mb-3">
            <Shield className="w-8 h-8 text-orange-400" />
          </div>
          <h2 className="text-2xl font-extrabold text-blue-950 tracking-tight">{t.appName}</h2>
          <p className="text-xs font-semibold text-orange-600 uppercase tracking-wider mt-0.5">
            Government of Goa • Directorate of Municipal Administration
          </p>
          <p className="text-xs text-slate-500 mt-1.5">{t.portalTitle}</p>
        </div>

        {/* Supabase Status Banner */}
        <div className={`p-2.5 rounded-xl border text-xs flex items-center justify-between ${
          isDbConnected
            ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
            : 'bg-blue-50 border-blue-200 text-blue-900'
        }`}>
          <div className="flex items-center gap-2">
            <Database className={`w-4 h-4 ${isDbConnected ? 'text-emerald-600' : 'text-blue-600'}`} />
            <span className="font-semibold">
              {isDbConnected ? 'Supabase DB Connected' : 'Supabase Ready & Demo Mode'}
            </span>
          </div>
          <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full uppercase tracking-wider ${
            isDbConnected ? 'bg-emerald-200 text-emerald-900' : 'bg-blue-200 text-blue-900'
          }`}>
            {isDbConnected ? 'Live' : 'Active'}
          </span>
        </div>

        {/* Demo Quick Login Panel */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            1-Click Demo Logins (Instant Access)
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              id="btn-fill-citizen-demo"
              onClick={() => handleDemoFill('citizen')}
              className={`p-2.5 rounded-lg border text-left transition-all ${
                role === 'citizen' && email === 'citizen@test.com'
                  ? 'border-blue-600 bg-blue-50/60 ring-1 ring-blue-600'
                  : 'border-slate-200 bg-slate-50 hover:bg-slate-100'
              }`}
            >
              <div className="flex items-center gap-1.5 font-bold text-xs text-blue-950">
                <User className="w-3.5 h-3.5 text-blue-600" />
                Citizen Demo
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5 truncate">citizen@test.com</div>
              <div className="text-[10px] text-slate-400">pass: password123</div>
            </button>

            <button
              type="button"
              id="btn-fill-officer-demo"
              onClick={() => handleDemoFill('officer')}
              className={`p-2.5 rounded-lg border text-left transition-all ${
                role === 'officer' && email === 'officer@test.com'
                  ? 'border-orange-600 bg-orange-50/60 ring-1 ring-orange-600'
                  : 'border-slate-200 bg-slate-50 hover:bg-slate-100'
              }`}
            >
              <div className="flex items-center gap-1.5 font-bold text-xs text-orange-950">
                <HardHat className="w-3.5 h-3.5 text-orange-600" />
                Officer Demo
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5 truncate">officer@test.com</div>
              <div className="text-[10px] text-slate-400">pass: password123</div>
            </button>
          </div>
        </div>

        {/* Auth Card */}
        <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm">
          {/* Tab Switcher */}
          <div className="flex border-b border-slate-200 mb-5">
            <button
              type="button"
              id="tab-login"
              onClick={() => setTab('login')}
              className={`flex-1 pb-3 text-sm font-bold text-center border-b-2 transition-colors ${
                tab === 'login'
                  ? 'border-blue-900 text-blue-900'
                  : 'border-transparent text-slate-400 hover:text-slate-700'
              }`}
            >
              {t.login}
            </button>
            <button
              type="button"
              id="tab-register"
              onClick={() => setTab('register')}
              className={`flex-1 pb-3 text-sm font-bold text-center border-b-2 transition-colors ${
                tab === 'register'
                  ? 'border-blue-900 text-blue-900'
                  : 'border-transparent text-slate-400 hover:text-slate-700'
              }`}
            >
              {t.register}
            </button>
          </div>

          {/* Role Selection */}
          <div className="mb-4">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Select Role / पहचान
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                id="role-citizen-toggle"
                onClick={() => setRole('citizen')}
                className={`flex items-center justify-center gap-2 p-2.5 rounded-lg border text-xs font-bold transition-all ${
                  role === 'citizen'
                    ? 'bg-blue-900 text-white border-blue-900 shadow-xs'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                <User className="w-4 h-4" />
                {t.citizen}
              </button>
              <button
                type="button"
                id="role-officer-toggle"
                onClick={() => setRole('officer')}
                className={`flex items-center justify-center gap-2 p-2.5 rounded-lg border text-xs font-bold transition-all ${
                  role === 'officer'
                    ? 'bg-orange-600 text-white border-orange-600 shadow-xs'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                <HardHat className="w-4 h-4" />
                {t.officer}
              </button>
            </div>
          </div>

          {errorMessage && (
            <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {tab === 'register' && (
              <>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Full Name / पूरा नाम
                  </label>
                  <input
                    type="text"
                    id="input-name"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g., Rajesh Naik"
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-800"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Contact Phone (Goa)
                  </label>
                  <input
                    type="tel"
                    id="input-phone"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 98220 XXXXX"
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-800"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Taluka / Municipality
                  </label>
                  <select
                    id="select-taluka"
                    value={taluka}
                    onChange={(e) => setTaluka(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-800 bg-white"
                  >
                    <option value="Panaji (Tiswadi)">Panaji (Tiswadi)</option>
                    <option value="Margao (Salcete)">Margao (Salcete)</option>
                    <option value="Mapusa (Bardez)">Mapusa (Bardez)</option>
                    <option value="Vasco da Gama (Mormugao)">Vasco da Gama (Mormugao)</option>
                    <option value="Ponda (Ponda)">Ponda (Ponda)</option>
                    <option value="Bicholim">Bicholim</option>
                    <option value="Curchorem (Quepem)">Curchorem (Quepem)</option>
                    <option value="Pernem">Pernem</option>
                  </select>
                </div>
              </>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="email"
                  id="input-email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={role === 'officer' ? 'officer@test.com' : 'citizen@test.com'}
                  className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-800"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="password"
                  id="input-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-800"
                />
              </div>
            </div>

            {/* Officer Security PIN Field */}
            {role === 'officer' && (
              <div className="p-3 bg-orange-50/80 border border-orange-200 rounded-xl space-y-1.5 animate-in fade-in">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-orange-950 flex items-center gap-1.5">
                    <KeyRound className="w-3.5 h-3.5 text-orange-600" />
                    <span>Officer Authorization PIN</span>
                  </label>
                  <span className="text-[10px] bg-orange-200 text-orange-900 font-bold px-1.5 py-0.5 rounded">
                    Level 1 Clearance
                  </span>
                </div>
                <div className="relative">
                  <input
                    type="password"
                    id="input-officer-pin"
                    inputMode="numeric"
                    maxLength={4}
                    required
                    value={officerPin}
                    onChange={(e) => setOfficerPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                    placeholder="1234"
                    className="w-full px-3 py-2 text-sm font-mono tracking-widest text-center rounded-lg border border-orange-300 focus:outline-hidden focus:ring-2 focus:ring-orange-500 bg-white"
                  />
                </div>
                <p className="text-[10px] text-orange-800/80 text-center font-medium">
                  Authorized Goa PWD Security PIN (Default: <strong>1234</strong>)
                </p>
              </div>
            )}

            <button
              type="submit"
              id="btn-auth-submit"
              disabled={isLoading}
              className={`w-full py-2.5 px-4 rounded-lg font-bold text-sm text-white shadow-sm flex items-center justify-center gap-2 transition-all ${
                role === 'officer'
                  ? 'bg-orange-600 hover:bg-orange-700 focus:ring-2 focus:ring-orange-500'
                  : 'bg-blue-900 hover:bg-blue-800 focus:ring-2 focus:ring-blue-800'
              } ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Authenticating...</span>
                </>
              ) : (
                <>
                  <span>{tab === 'login' ? `Enter as ${role === 'officer' ? 'Officer' : 'Citizen'}` : 'Create Account'}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick instructions */}
          <div className="mt-4 pt-4 border-t border-slate-100 text-center">
            <p className="text-[11px] text-slate-500">
              Direct access for citizen pothole reporting & Goa PWD / Municipal engineers.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
