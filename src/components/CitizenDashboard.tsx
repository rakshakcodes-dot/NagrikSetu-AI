import React, { useState } from 'react';
import {
  FilePlus,
  Search,
  MapPin,
  Clock,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  TrendingUp,
  Filter,
  Calendar,
  Layers,
  Sparkles,
  Eye,
  Activity,
  AlertTriangle,
  ChevronRight,
  User as UserIcon,
  FileText,
  Inbox,
} from 'lucide-react';
import { Complaint, ComplaintStatus, Language, User } from '../types';
import { translations } from '../utils/translations';

interface CitizenDashboardProps {
  currentUser: User;
  complaints: Complaint[];
  onSelectComplaint: (complaint: Complaint) => void;
  onNavigateSubmit: () => void;
  language: Language;
}

export const CitizenDashboard: React.FC<CitizenDashboardProps> = ({
  currentUser,
  complaints,
  onSelectComplaint,
  onNavigateSubmit,
  language,
}) => {
  const t = translations[language];
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [idLookup, setIdLookup] = useState('');
  const [lookupError, setLookupError] = useState('');

  // 1. Strictly filter citizen's own reported complaints
  const myComplaints = complaints.filter(
    (c) =>
      (currentUser.id && c.citizenId === currentUser.id) ||
      (currentUser.email && c.citizenEmail?.toLowerCase() === currentUser.email.toLowerCase())
  );

  // Default to 'my' if citizen has reported complaints, or 'recent' if newly registered
  const [activeTab, setActiveTab] = useState<'my' | 'recent'>(() =>
    myComplaints.length > 0 ? 'my' : 'recent'
  );

  const currentList = activeTab === 'my' ? myComplaints : complaints;

  const filteredComplaints = currentList.filter((c) => {
    const matchesSearch =
      c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.location.landmark.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.location.taluka.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === 'all' || c.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const countTotal = complaints.length;
  const countPending = complaints.filter((c) => c.status === 'pending').length;
  const countInProgress = complaints.filter(
    (c) => c.status === 'in_progress' || c.status === 'assigned'
  ).length;
  const countResolved = complaints.filter((c) => c.status === 'resolved').length;

  const handleIdLookup = (e: React.FormEvent) => {
    e.preventDefault();
    setLookupError('');
    if (!idLookup.trim()) return;

    const found = complaints.find(
      (c) => c.id.toLowerCase() === idLookup.trim().toLowerCase()
    );
    if (found) {
      onSelectComplaint(found);
    } else {
      setLookupError(`No complaint found with ID "${idLookup}".`);
    }
  };

  const getPriorityBadgeClass = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'text-[10px] font-bold text-orange-700 bg-orange-100 px-2 py-0.5 rounded uppercase';
      case 'medium':
        return 'text-[10px] font-bold text-blue-700 bg-blue-100 px-2 py-0.5 rounded uppercase';
      default:
        return 'text-[10px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded uppercase';
    }
  };

  const getStatusBadge = (status: ComplaintStatus) => {
    switch (status) {
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
            {t.pending}
          </span>
        );
      case 'assigned':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-blue-50 text-blue-800 border border-blue-200">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
            {t.assigned}
          </span>
        );
      case 'in_progress':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-indigo-50 text-indigo-800 border border-indigo-200">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse"></span>
            {t.in_progress}
          </span>
        );
      case 'resolved':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            {t.resolved}
          </span>
        );
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-[1600px] mx-auto">
      {/* Top Section: Bento KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Reports */}
        <div className="bg-white p-4 sm:p-5 rounded-xl shadow-xs border border-slate-200 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              {t.totalReports}
            </p>
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-100">
              {myComplaints.length} {language === 'hi' ? 'आपकी रिपोर्ट' : 'by you'}
            </span>
          </div>
          <div className="my-1">
            <h3 className="text-2xl sm:text-3xl font-black text-slate-900">{countTotal}</h3>
          </div>
          <p className="text-xs font-semibold text-green-600 flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>↑ 12% Goa Wide</span>
          </p>
        </div>

        {/* Pending */}
        <div className="bg-white p-4 sm:p-5 rounded-xl shadow-xs border border-slate-200 flex flex-col justify-between">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            {t.pendingComplaints}
          </p>
          <div className="my-1">
            <h3 className="text-2xl sm:text-3xl font-black text-orange-600">{countPending}</h3>
          </div>
          <p className="text-xs text-slate-400 font-medium">{t.actionRequired}</p>
        </div>

        {/* In Progress */}
        <div className="bg-white p-4 sm:p-5 rounded-xl shadow-xs border border-slate-200 flex flex-col justify-between">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            {t.inProgressComplaints}
          </p>
          <div className="my-1">
            <h3 className="text-2xl sm:text-3xl font-black text-blue-600">{countInProgress}</h3>
          </div>
          <p className="text-xs text-slate-400 font-medium">{t.workOrdersActive}</p>
        </div>

        {/* Resolved */}
        <div className="bg-white p-4 sm:p-5 rounded-xl shadow-xs border border-slate-200 flex flex-col justify-between">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            {t.resolvedComplaints}
          </p>
          <div className="my-1">
            <h3 className="text-2xl sm:text-3xl font-black text-green-600">{countResolved}</h3>
          </div>
          <p className="text-xs text-slate-400 font-medium">{t.avgDaysSLA}</p>
        </div>
      </div>

      {/* Main Bento Grid Container */}
      <div className="grid grid-cols-12 gap-6">
        {/* Left Column (8 cols): Interactive Visual Map + My Complaints List */}
        <div className="col-span-12 lg:col-span-8 flex flex-col gap-6">
          {/* Bento Box 1: Goa Live Impact Map Banner */}
          <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-5 relative overflow-hidden flex flex-col justify-between min-h-[260px] sm:min-h-[300px]">
            {/* Map Header Floating Overlay */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 z-10 mb-3">
              <div className="bg-white/90 backdrop-blur-xs px-3 py-1.5 rounded-lg border border-slate-200 shadow-2xs inline-block">
                <p className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  {t.goaLiveImpactMap}
                </p>
                <p className="text-[10px] text-slate-500">
                  {complaints.length} {t.hazardsTracked}
                </p>
              </div>

              <button
                id="btn-quick-report-bento"
                onClick={onNavigateSubmit}
                className="self-start sm:self-auto px-4 py-2 bg-orange-500 hover:bg-orange-600 active:scale-98 text-white text-xs font-bold rounded-lg shadow-sm flex items-center gap-1.5 transition-all"
              >
                <FilePlus className="w-4 h-4" />
                <span>{t.reportNewPothole}</span>
              </button>
            </div>

            {/* Map Visual Stage */}
            <div className="w-full h-56 sm:h-64 bg-slate-900 rounded-lg overflow-hidden relative border border-slate-800 shadow-inner flex items-center justify-center select-none">
              {/* Radial Grid Pattern */}
              <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:16px_16px]"></div>

              {/* Geographic Labels */}
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-cyan-400/40 text-[10px] font-black uppercase tracking-widest pointer-events-none transform -rotate-90">
                Arabian Sea Coast
              </div>
              <div className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-400/30 text-[10px] font-black uppercase tracking-widest pointer-events-none transform rotate-90">
                Western Ghats
              </div>

              {/* District Labels */}
              <div className="absolute top-2 left-1/2 -translate-x-1/2 px-2.5 py-0.5 bg-slate-800/80 rounded-full text-[9px] font-bold text-slate-300 border border-slate-700">
                North Goa • South Goa
              </div>

              {/* Live Pulsating Markers */}
              <div
                onClick={() => onSelectComplaint(complaints[0])}
                className="absolute top-1/4 left-1/3 w-4 h-4 bg-red-500 rounded-full border-2 border-white shadow-lg animate-pulse cursor-pointer hover:scale-125 transition-transform"
                title="Panaji - High Priority"
              ></div>
              <div
                onClick={() => onSelectComplaint(complaints[1] || complaints[0])}
                className="absolute bottom-1/3 right-1/4 w-4 h-4 bg-orange-500 rounded-full border-2 border-white shadow-lg cursor-pointer hover:scale-125 transition-transform"
                title="Margao - Medium Priority"
              ></div>
              <div
                onClick={() => onSelectComplaint(complaints[2] || complaints[0])}
                className="absolute top-1/2 right-1/2 w-4 h-4 bg-blue-500 rounded-full border-2 border-white shadow-lg cursor-pointer hover:scale-125 transition-transform"
                title="Ponda - Assigned"
              ></div>
              <div
                onClick={() => onSelectComplaint(complaints[3] || complaints[0])}
                className="absolute top-1/3 right-1/3 w-4 h-4 bg-emerald-500 rounded-full border-2 border-white shadow-lg cursor-pointer hover:scale-125 transition-transform"
                title="Mapusa - Resolved"
              ></div>

              {/* Interactive Prompt Overlay */}
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-slate-900/90 text-slate-300 text-[10px] px-3 py-1 rounded-full border border-slate-700 font-medium">
                {t.mapPinsHelper}
              </div>
            </div>
          </div>

          {/* Bento Box 2: Complaints List (My Reported vs Recent Portal Complaints) */}
          <div className="bg-white rounded-xl shadow-xs border border-slate-200 flex flex-col overflow-hidden">
            {/* Header & Mode Switcher */}
            <div className="p-4 sm:p-5 border-b border-slate-100 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                {/* View Scope Tabs */}
                <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl border border-slate-200/80 w-fit">
                  <button
                    type="button"
                    id="tab-my-reported-complaints"
                    onClick={() => {
                      setActiveTab('my');
                      setStatusFilter('all');
                    }}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      activeTab === 'my'
                        ? 'bg-white text-blue-900 shadow-xs ring-1 ring-slate-200/80'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <UserIcon className="w-3.5 h-3.5" />
                    <span>{t.myReportedComplaints}</span>
                    <span
                      className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                        activeTab === 'my'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-slate-200 text-slate-700'
                      }`}
                    >
                      {myComplaints.length}
                    </span>
                  </button>

                  <button
                    type="button"
                    id="tab-recent-portal-complaints"
                    onClick={() => {
                      setActiveTab('recent');
                      setStatusFilter('all');
                    }}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      activeTab === 'recent'
                        ? 'bg-white text-blue-900 shadow-xs ring-1 ring-slate-200/80'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Layers className="w-3.5 h-3.5" />
                    <span>{t.recentPortalComplaints}</span>
                    <span
                      className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                        activeTab === 'recent'
                          ? 'bg-orange-100 text-orange-800'
                          : 'bg-slate-200 text-slate-700'
                      }`}
                    >
                      {complaints.length}
                    </span>
                  </button>
                </div>

                {/* Quick Action Button */}
                <button
                  type="button"
                  id="btn-report-pothole-inline"
                  onClick={onNavigateSubmit}
                  className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 bg-orange-500 hover:bg-orange-600 active:scale-98 text-white text-xs font-bold rounded-lg shadow-xs transition-all"
                >
                  <FilePlus className="w-3.5 h-3.5" />
                  <span>{t.reportNewPothole}</span>
                </button>
              </div>

              {/* Filters & Search Row */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pt-1">
                {/* Search Bar */}
                <div className="relative flex-1 max-w-md">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={t.searchComplaints}
                    className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 rounded-lg border border-slate-200 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-600 text-slate-900"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 hover:text-slate-700"
                    >
                      ✕
                    </button>
                  )}
                </div>

                {/* Status Filter Pills */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
                  {['all', 'pending', 'assigned', 'in_progress', 'resolved'].map((st) => (
                    <button
                      key={st}
                      id={`filter-pill-${st}`}
                      onClick={() => setStatusFilter(st)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold capitalize whitespace-nowrap transition-all ${
                        statusFilter === st
                          ? 'bg-blue-600 text-white shadow-2xs font-bold'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {st === 'all' ? t.all : t[st as keyof typeof t] || st}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Context Sub-Banner */}
            {activeTab === 'recent' && (
              <div className="px-4 py-2 bg-blue-50/70 border-b border-blue-100 flex items-center justify-between text-[11px] text-blue-900">
                <span className="flex items-center gap-1.5 font-medium">
                  <Sparkles className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                  <span>
                    {language === 'hi'
                      ? 'गोवा नगरपालिका लाइव सार्वजनिक फ़ीड • सभी वार्डों की सक्रिय शिकायतें'
                      : 'Goa Public Works & Municipal Feed • All active grievances across Goa'}
                  </span>
                </span>
                <span className="text-[10px] text-blue-700 font-semibold bg-white/80 px-2 py-0.5 rounded-md border border-blue-200">
                  {filteredComplaints.length} {language === 'hi' ? 'रिपोर्ट्स' : 'complaints'}
                </span>
              </div>
            )}

            {/* Empty State for User with 0 Reported Complaints */}
            {activeTab === 'my' && myComplaints.length === 0 ? (
              <div className="p-8 sm:p-12 text-center flex flex-col items-center justify-center space-y-4">
                <div className="w-16 h-16 rounded-2xl bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center shadow-xs">
                  <FileText className="w-8 h-8" />
                </div>
                <div className="space-y-1.5 max-w-sm">
                  <h4 className="font-bold text-slate-900 text-base">
                    {t.noReportedComplaintsYet}
                  </h4>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    {t.noReportedComplaintsDesc}
                  </p>
                </div>

                <div className="flex flex-wrap items-center justify-center gap-2.5 pt-2">
                  <button
                    type="button"
                    id="btn-empty-state-report-pothole"
                    onClick={onNavigateSubmit}
                    className="px-4 py-2 bg-orange-500 hover:bg-orange-600 active:scale-98 text-white text-xs font-bold rounded-lg shadow-xs flex items-center gap-1.5 transition-all"
                  >
                    <FilePlus className="w-4 h-4" />
                    <span>{t.reportNewPothole}</span>
                  </button>

                  <button
                    type="button"
                    id="btn-empty-state-view-portal"
                    onClick={() => {
                      setActiveTab('recent');
                      setStatusFilter('all');
                      setSearchQuery('');
                    }}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5"
                  >
                    <Layers className="w-4 h-4 text-blue-600" />
                    <span>{t.browsePortalComplaints}</span>
                  </button>
                </div>
              </div>
            ) : filteredComplaints.length === 0 ? (
              /* No matching search results */
              <div className="p-8 text-center text-slate-400 text-xs space-y-2">
                <AlertCircle className="w-8 h-8 mx-auto text-slate-300" />
                <p className="font-medium text-slate-600">{t.noComplaintsFound}</p>
                {(searchQuery || statusFilter !== 'all') && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery('');
                      setStatusFilter('all');
                    }}
                    className="text-xs text-blue-600 hover:underline font-semibold"
                  >
                    {language === 'hi' ? 'फ़िल्टर साफ़ करें' : 'Clear search & filters'}
                  </button>
                )}
              </div>
            ) : (
              /* Complaint Cards List */
              <div className="divide-y divide-slate-100 max-h-[500px] overflow-y-auto">
                {filteredComplaints.map((c) => (
                  <div
                    key={c.id}
                    id={`bento-complaint-item-${c.id}`}
                    onClick={() => onSelectComplaint(c)}
                    className="p-4 hover:bg-slate-50/80 transition-colors cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <img
                        src={c.imageUrl}
                        alt={c.title}
                        className="w-14 h-14 rounded-lg object-cover bg-slate-100 shrink-0 border border-slate-200"
                      />
                      <div className="space-y-1 min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-mono text-[11px] font-bold text-blue-900 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200">
                            #{c.id}
                          </span>
                          <span className={getPriorityBadgeClass(c.priority)}>
                            {t[c.priority] || c.priority} {t.priority}
                          </span>
                          {getStatusBadge(c.status)}
                          {activeTab === 'recent' && (c.citizenId === currentUser.id || c.citizenEmail === currentUser.email) && (
                            <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded">
                              {language === 'hi' ? 'आपकी रिपोर्ट' : 'Your Report'}
                            </span>
                          )}
                        </div>
                        <h4 className="font-semibold text-slate-900 text-sm truncate">{c.title}</h4>
                        <div className="flex items-center gap-2 text-xs text-slate-400">
                          <span className="flex items-center gap-1 text-slate-500 font-medium truncate">
                            <MapPin className="w-3 h-3 text-orange-500" />
                            {c.location.taluka}
                          </span>
                          <span>•</span>
                          <span className="truncate">{c.location.landmark}</span>
                        </div>
                      </div>
                    </div>

                    {/* Progress Bar & Action */}
                    <div className="flex sm:flex-col items-center sm:items-end justify-between gap-2 shrink-0">
                      <div className="w-28 space-y-1">
                        <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full ${
                              c.status === 'resolved'
                                ? 'bg-emerald-500 w-full'
                                : c.status === 'in_progress'
                                ? 'bg-indigo-500 w-3/4'
                                : c.status === 'assigned'
                                ? 'bg-blue-500 w-1/2'
                                : 'bg-amber-500 w-1/4'
                            }`}
                          />
                        </div>
                      </div>
                      <button
                        type="button"
                        className="text-xs px-2.5 py-1 bg-white border border-slate-200 rounded-md text-slate-700 font-semibold hover:border-blue-300 hover:text-blue-700 transition-colors flex items-center gap-1"
                      >
                        <span>{t.review}</span>
                        <ChevronRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column (4 cols): Recent Highlights & Prediction Bento */}
        <div className="col-span-12 lg:col-span-4 flex flex-col gap-6">
          {/* Bento Box 3: Quick ID Lookup */}
          <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-4">
            <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Search className="w-3.5 h-3.5 text-blue-600" />
              <span>{t.trackTicket}</span>
            </h3>
            <form onSubmit={handleIdLookup} className="flex gap-2">
              <input
                type="text"
                id="input-quick-track-id"
                value={idLookup}
                onChange={(e) => {
                  setIdLookup(e.target.value);
                  setLookupError('');
                }}
                placeholder={t.trackPlaceholder}
                className="flex-1 px-3 py-1.5 text-xs font-mono rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-600"
              />
              <button
                type="submit"
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-2xs transition-colors"
              >
                {t.track}
              </button>
            </form>
            {lookupError && (
              <p className="text-[11px] text-red-600 font-semibold mt-1.5">{t.noComplaintFoundWithId}</p>
            )}
          </div>

          {/* Bento Box 4: Recent High-Priority Complaints */}
          <div className="bg-white rounded-xl shadow-xs border border-slate-200 flex flex-col overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex justify-between items-center">
              <h3 className="font-bold text-slate-800 text-sm">{t.recentComplaints}</h3>
              <button
                onClick={() => setStatusFilter('all')}
                className="text-xs text-blue-600 font-semibold hover:underline"
              >
                {t.viewAll}
              </button>
            </div>

            <div className="divide-y divide-slate-50">
              {complaints.slice(0, 3).map((item) => (
                <div
                  key={item.id}
                  onClick={() => onSelectComplaint(item)}
                  className="p-4 hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  <div className="flex justify-between items-start mb-1">
                    <span className={getPriorityBadgeClass(item.priority)}>
                      {t[item.priority] || item.priority} {t.priority}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">#{item.id}</span>
                  </div>
                  <h4 className="font-semibold text-slate-900 text-sm truncate">{item.title}</h4>
                  <p className="text-xs text-slate-500 line-clamp-1">{item.description}</p>
                  <div className="mt-2 flex items-center justify-between">
                    <span className="text-[10px] text-slate-400">
                      📍 {item.location.taluka.split(' ')[0]}
                    </span>
                    <button className="text-xs px-2 py-1 bg-white border border-slate-200 rounded text-slate-700 font-medium hover:border-blue-300">
                      {t.review}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Bento Box 5: Smart Prediction Insights Highlight Card (Matching Design HTML) */}
          <div className="h-52 bg-blue-700 rounded-xl p-5 text-white flex flex-col justify-between relative overflow-hidden shadow-sm">
            <div className="relative z-10">
              <div className="flex items-center gap-1.5 text-xs font-bold text-blue-200 uppercase tracking-wider mb-1">
                <Sparkles className="w-3.5 h-3.5 text-orange-400" />
                <span>{t.smartCategoryPrediction}</span>
              </div>
              <h3 className="text-base sm:text-lg font-bold leading-tight mt-1">
                {t.monsoonPreparedness}
              </h3>
              <p className="text-blue-100 text-xs mt-2 leading-relaxed">
                {t.monsoonText}
              </p>
            </div>

            <div className="relative z-10 flex gap-2 mt-3">
              <button
                onClick={onNavigateSubmit}
                className="flex-1 bg-white text-blue-700 py-2 rounded-lg text-xs font-bold shadow-xs hover:bg-blue-50 transition-colors"
              >
                {t.reportNewPothole}
              </button>
              <button
                onClick={() => {
                  setStatusFilter('all');
                }}
                className="flex-1 bg-blue-600 text-white py-2 rounded-lg text-xs font-bold border border-blue-500 hover:bg-blue-500 transition-colors"
              >
                {t.viewHotspots}
              </button>
            </div>

            {/* Glowing Accent Spheres from Design HTML */}
            <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-blue-600/40 rounded-full pointer-events-none"></div>
            <div className="absolute -right-8 -bottom-8 w-32 h-32 bg-blue-500/20 rounded-full pointer-events-none"></div>
          </div>
        </div>
      </div>
    </div>
  );
};
