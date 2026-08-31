import React, { useState } from 'react';
import {
  Filter,
  Search,
  CheckCircle2,
  AlertTriangle,
  Clock,
  MapPin,
  HardHat,
  Eye,
  TrendingUp,
  Download,
  AlertCircle,
  Building,
  User,
  ArrowUpDown,
  Sparkles,
  ChevronRight,
  Layers,
  Maximize2,
  Info,
  KeyRound,
  ShieldCheck,
  RotateCcw,
  Lock,
} from 'lucide-react';
import {
  Complaint,
  ComplaintPriority,
  ComplaintStatus,
  GoaTaluka,
  Language,
  User as UserType,
} from '../types';
import { translations } from '../utils/translations';
import { PWD_DIVISIONS } from '../data/sampleData';
import { OfficerPinSettingsModal } from './OfficerPinSettingsModal';

interface OfficerDashboardProps {
  currentUser: UserType;
  complaints: Complaint[];
  onSelectComplaint: (complaint: Complaint) => void;
  onQuickStatusChange: (id: string, newStatus: ComplaintStatus) => void;
  language: Language;
}

export const OfficerDashboard: React.FC<OfficerDashboardProps> = ({
  currentUser,
  complaints,
  onSelectComplaint,
  onQuickStatusChange,
  language,
}) => {
  const t = translations[language];

  // Filters state
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [talukaFilter, setTalukaFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');
  const [hoveredComplaint, setHoveredComplaint] = useState<Complaint | null>(null);
  const [isPinSettingsOpen, setIsPinSettingsOpen] = useState<boolean>(false);

  // Stats calculations
  const total = complaints.length;
  const pendingCount = complaints.filter((c) => c.status === 'pending').length;
  const assignedCount = complaints.filter((c) => c.status === 'assigned').length;
  const inProgressCount = complaints.filter((c) => c.status === 'in_progress').length;
  const resolvedCount = complaints.filter((c) => c.status === 'resolved').length;
  const highPriorityCount = complaints.filter(
    (c) => c.priority === 'high' && c.status !== 'resolved'
  ).length;

  // Filter complaints
  const filtered = complaints.filter((c) => {
    const matchesSearch =
      c.title.toLowerCase().includes(search.toLowerCase()) ||
      c.id.toLowerCase().includes(search.toLowerCase()) ||
      c.location.landmark.toLowerCase().includes(search.toLowerCase()) ||
      c.citizenName.toLowerCase().includes(search.toLowerCase());

    const matchesStatus = statusFilter === 'all' || c.status === statusFilter;
    const matchesTaluka = talukaFilter === 'all' || c.location.taluka === talukaFilter;
    const matchesPriority = priorityFilter === 'all' || c.priority === priorityFilter;

    return matchesSearch && matchesStatus && matchesTaluka && matchesPriority;
  });

  // Calculate percentage positions on Goa Map Box
  const getMapCoordinates = (lat: number, lng: number) => {
    const minLat = 14.95;
    const maxLat = 15.75;
    const minLng = 73.65;
    const maxLng = 74.25;

    // Y is inverted because higher latitude is North (top)
    const y = 100 - ((lat - minLat) / (maxLat - minLat)) * 100;
    const x = ((lng - minLng) / (maxLng - minLng)) * 100;

    return {
      x: Math.max(6, Math.min(94, x)),
      y: Math.max(6, Math.min(94, y)),
    };
  };

  // Marker coloring rules requested:
  // - Red markers for High priority
  // - Orange markers for Medium priority
  // - Green markers for Low priority
  // - Grey markers for Resolved complaints
  const getOfficerMarkerStyle = (item: Complaint) => {
    if (item.status === 'resolved') {
      return {
        bg: 'bg-slate-400',
        ring: 'ring-slate-300',
        border: 'border-white',
        pulse: false,
        label: t.resolved,
      };
    }
    if (item.priority === 'high') {
      return {
        bg: 'bg-red-500',
        ring: 'ring-red-300',
        border: 'border-white',
        pulse: true,
        label: t.highPriority,
      };
    }
    if (item.priority === 'medium') {
      return {
        bg: 'bg-orange-500',
        ring: 'ring-orange-300',
        border: 'border-white',
        pulse: false,
        label: t.mediumPriority,
      };
    }
    return {
      bg: 'bg-emerald-500',
      ring: 'ring-emerald-300',
      border: 'border-white',
      pulse: false,
      label: t.lowPriority,
    };
  };

  const getStatusBadge = (status: ComplaintStatus) => {
    switch (status) {
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-bold bg-amber-50 text-amber-900 border border-amber-300">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
            {t.pending}
          </span>
        );
      case 'assigned':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-bold bg-blue-50 text-blue-900 border border-blue-300">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
            {t.assigned}
          </span>
        );
      case 'in_progress':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-bold bg-indigo-50 text-indigo-900 border border-indigo-300">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse"></span>
            {t.in_progress}
          </span>
        );
      case 'resolved':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-bold bg-emerald-50 text-emerald-900 border border-emerald-300">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            {t.resolved}
          </span>
        );
    }
  };

  const getPriorityBadge = (priority: ComplaintPriority) => {
    switch (priority) {
      case 'high':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-orange-100 text-orange-700 uppercase">
            {t.highPriority}
          </span>
        );
      case 'medium':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-700 uppercase">
            {t.mediumPriority}
          </span>
        );
      case 'low':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-600 uppercase">
            {t.lowPriority}
          </span>
        );
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-[1600px] mx-auto">
      {/* Officer Security Clearance & PIN Management Header Bar */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 rounded-2xl p-4 sm:p-5 text-white shadow-md border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-orange-500/20 border border-orange-500/40 text-orange-400 flex items-center justify-center shrink-0">
            <HardHat className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base sm:text-lg font-bold text-white tracking-wide">
                {language === 'hi' ? 'गोवा लोक निर्माण विभाग (PWD) अधिकारी नियंत्रण पटल' : 'Goa Public Works (PWD) Officer Control Desk'}
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" />
                {t.officerSecurityLevel}
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-0.5 flex items-center gap-2 flex-wrap">
              <span>{currentUser.name} ({currentUser.email})</span>
              <span className="text-slate-500">•</span>
              <span className="text-amber-300 flex items-center gap-1">
                <Lock className="w-3 h-3" />
                {language === 'hi' ? 'सुरक्षा पिन संरक्षित (डिफ़ॉल्ट: 1234)' : 'PIN Clearance Protected (Default: 1234)'}
              </span>
            </p>
          </div>
        </div>

        {/* Security PIN Reset / Manage Action */}
        <div className="flex items-center gap-2.5 shrink-0 w-full md:w-auto justify-end">
          <button
            type="button"
            id="btn-officer-pin-settings-desk"
            onClick={() => setIsPinSettingsOpen(true)}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold bg-orange-500 hover:bg-orange-600 active:scale-98 text-white shadow-md transition-all cursor-pointer"
          >
            <KeyRound className="w-4 h-4" />
            <span>{language === 'hi' ? 'सुरक्षा पिन रीसेट / बदलें' : 'Reset / Change Officer PIN'}</span>
          </button>
        </div>
      </div>

      {/* Top Bento KPI Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Total Registered */}
        <div className="bg-white p-4 rounded-xl shadow-xs border border-slate-200 flex flex-col justify-between">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            {t.totalComplaints}
          </p>
          <div className="my-1">
            <h3 className="text-2xl sm:text-3xl font-black text-slate-900">{total}</h3>
          </div>
          <p className="text-[11px] text-slate-400 font-medium">{t.allTalukas}</p>
        </div>

        {/* Pending Review */}
        <div className="bg-white p-4 rounded-xl shadow-xs border border-slate-200 flex flex-col justify-between">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            {t.pending}
          </p>
          <div className="my-1">
            <h3 className="text-2xl sm:text-3xl font-black text-amber-600">{pendingCount}</h3>
          </div>
          <p className="text-[11px] text-amber-700 font-medium">{t.actionRequired}</p>
        </div>

        {/* Assigned */}
        <div className="bg-white p-4 rounded-xl shadow-xs border border-slate-200 flex flex-col justify-between">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            {t.assigned}
          </p>
          <div className="my-1">
            <h3 className="text-2xl sm:text-3xl font-black text-blue-600">{assignedCount}</h3>
          </div>
          <p className="text-[11px] text-blue-700 font-medium">{t.workOrdersActive}</p>
        </div>

        {/* In Progress */}
        <div className="bg-white p-4 rounded-xl shadow-xs border border-slate-200 flex flex-col justify-between">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            {t.in_progress}
          </p>
          <div className="my-1">
            <h3 className="text-2xl sm:text-3xl font-black text-indigo-600">{inProgressCount}</h3>
          </div>
          <p className="text-[11px] text-indigo-700 font-medium">{t.workOrdersActive}</p>
        </div>

        {/* Resolved */}
        <div className="bg-white p-4 rounded-xl shadow-xs border border-slate-200 flex flex-col justify-between col-span-2 sm:col-span-1">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            {t.resolved}
          </p>
          <div className="my-1">
            <h3 className="text-2xl sm:text-3xl font-black text-emerald-600">{resolvedCount}</h3>
          </div>
          <p className="text-[11px] text-emerald-700 font-medium">{t.avgDaysSLA}</p>
        </div>
      </div>

      {/* High Priority Emergency Banner if any */}
      {highPriorityCount > 0 && (
        <div className="p-4 bg-orange-50 border-l-4 border-orange-500 rounded-xl shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-orange-500 text-white flex items-center justify-center font-bold shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-orange-950">
                {t.prioritySeverity} ({highPriorityCount} {t.pending})
              </h4>
              <p className="text-xs text-orange-800">
                {t.mandateText}
              </p>
            </div>
          </div>
          <button
            onClick={() => setPriorityFilter('high')}
            className="px-3 py-1.5 bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold rounded-lg shadow-2xs transition-colors shrink-0"
          >
            {t.filterByPriority} ({t.high})
          </button>
        </div>
      )}

      {/* Bento Filter Toolbar */}
      <div className="bg-white rounded-xl p-4 shadow-xs border border-slate-200 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Search Box */}
          <div className="lg:col-span-2 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              id="input-officer-search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t.searchComplaints}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-600"
            />
          </div>

          {/* Status Filter */}
          <div>
            <select
              id="officer-select-status"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 text-xs font-medium rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-600 bg-white"
            >
              <option value="all">{t.allStatuses}</option>
              <option value="pending">{t.pending}</option>
              <option value="assigned">{t.assigned}</option>
              <option value="in_progress">{t.in_progress}</option>
              <option value="resolved">{t.resolved}</option>
            </select>
          </div>

          {/* Taluka Filter */}
          <div>
            <select
              id="officer-select-taluka"
              value={talukaFilter}
              onChange={(e) => setTalukaFilter(e.target.value)}
              className="w-full px-3 py-2 text-xs font-medium rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-600 bg-white"
            >
              <option value="all">{t.allTalukas}</option>
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

          {/* Priority Filter */}
          <div>
            <select
              id="officer-select-priority"
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="w-full px-3 py-2 text-xs font-medium rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-600 bg-white"
            >
              <option value="all">{t.allPriorities}</option>
              <option value="high">{t.highPriority}</option>
              <option value="medium">{t.mediumPriority}</option>
              <option value="low">{t.lowPriority}</option>
            </select>
          </div>
        </div>

        {/* Active Filter Pills Bar */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
          <div className="text-slate-500 font-medium">
            {t.totalComplaints}: <span className="font-bold text-slate-800">{filtered.length}</span> / {total}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setViewMode('cards')}
              className={`px-2.5 py-1 rounded-md text-xs font-semibold ${
                viewMode === 'cards'
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Cards
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`px-2.5 py-1 rounded-md text-xs font-semibold ${
                viewMode === 'table'
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Table
            </button>
          </div>
        </div>
      </div>

      {/* Simple Spatial Map for Complaint Locations */}
      <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-4 sm:p-5 flex flex-col space-y-4">
        {/* Map Header & Color Legend */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center font-bold">
              <MapPin className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 leading-tight">
                {t.viewMapHeader}
              </h3>
              <p className="text-xs text-slate-500">
                {t.viewMapSub} ({filtered.length} {t.hazardsTracked})
              </p>
            </div>
          </div>

          {/* Explicit Priority & Status Color Legend */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200 text-xs">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider hidden sm:inline mr-1">
              {t.legend}:
            </span>
            <div className="flex items-center gap-1.5 text-slate-700 font-medium">
              <span className="w-3 h-3 rounded-full bg-red-500 ring-2 ring-red-200 shrink-0"></span>
              <span className="text-xs font-semibold text-slate-800">{t.highPriority} (Red)</span>
            </div>
            <div className="flex items-center gap-1.5 text-slate-700 font-medium">
              <span className="w-3 h-3 rounded-full bg-orange-500 ring-2 ring-orange-200 shrink-0"></span>
              <span className="text-xs font-semibold text-slate-800">{t.mediumPriority} (Orange)</span>
            </div>
            <div className="flex items-center gap-1.5 text-slate-700 font-medium">
              <span className="w-3 h-3 rounded-full bg-emerald-500 ring-2 ring-emerald-200 shrink-0"></span>
              <span className="text-xs font-semibold text-slate-800">{t.lowPriority} (Green)</span>
            </div>
            <div className="flex items-center gap-1.5 text-slate-700 font-medium">
              <span className="w-3 h-3 rounded-full bg-slate-400 ring-2 ring-slate-200 shrink-0"></span>
              <span className="text-xs font-semibold text-slate-800">{t.resolved} (Grey)</span>
            </div>
          </div>
        </div>

        {/* Interactive Map Visual Stage */}
        <div className="w-full h-72 sm:h-80 bg-slate-900 rounded-xl relative overflow-hidden border border-slate-800 shadow-inner flex items-center justify-center select-none">
          {/* Radial Grid Backdrop */}
          <div className="absolute inset-0 opacity-25 bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:18px_18px]"></div>

          {/* Region Boundaries & Axis Watermarks */}
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-cyan-400/30 text-[10px] font-black uppercase tracking-widest pointer-events-none transform -rotate-90">
            Arabian Sea (West)
          </div>
          <div className="absolute right-4 top-1/2 -translate-y-1/2 text-emerald-400/20 text-[10px] font-black uppercase tracking-widest pointer-events-none transform rotate-90">
            Western Ghats (East)
          </div>

          {/* Taluka Circle Watermarks */}
          <div className="absolute top-4 left-1/3 text-[10px] font-bold text-slate-600/70 pointer-events-none">
            North Goa District
          </div>
          <div className="absolute bottom-6 right-1/3 text-[10px] font-bold text-slate-600/70 pointer-events-none">
            South Goa District
          </div>

          {/* Plotted Complaint Markers */}
          {filtered.map((item) => {
            const lat = item.location?.latitude ?? 15.35;
            const lng = item.location?.longitude ?? 73.95;
            const coords = getMapCoordinates(lat, lng);
            const style = getOfficerMarkerStyle(item);
            const isHovered = hoveredComplaint?.id === item.id;

            return (
              <div
                key={item.id}
                style={{ left: `${coords.x}%`, top: `${coords.y}%` }}
                className="absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-transform duration-200 group z-20"
                onClick={() => onSelectComplaint(item)}
                onMouseEnter={() => setHoveredComplaint(item)}
                onMouseLeave={() => setHoveredComplaint(null)}
              >
                {/* Marker Dot */}
                <div
                  className={`w-4 h-4 rounded-full ${style.bg} ${style.border} border-2 shadow-lg ring-2 ${style.ring} ${
                    style.pulse ? 'animate-pulse' : ''
                  } ${isHovered ? 'scale-150 z-30' : 'group-hover:scale-130'}`}
                  title={`${item.id} - ${item.title} (${style.label})`}
                />

                {/* Mini Pin Label */}
                <div className="absolute top-5 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900/95 text-white text-[10px] font-mono px-1.5 py-0.5 rounded shadow-md border border-slate-700 whitespace-nowrap pointer-events-none z-30">
                  #{item.id}
                </div>
              </div>
            );
          })}

          {/* Active Hover Inspection Floating Tooltip */}
          {hoveredComplaint && (
            <div className="absolute bottom-3 left-3 right-3 sm:right-auto sm:max-w-md bg-slate-900/95 text-white p-3 rounded-xl border border-slate-700 shadow-xl backdrop-blur-xs flex items-center justify-between gap-3 z-30 animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center gap-2.5 min-w-0">
                <img
                  src={hoveredComplaint.imageUrl}
                  alt={hoveredComplaint.title}
                  className="w-10 h-10 rounded-lg object-cover bg-slate-800 shrink-0 border border-slate-700"
                />
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono text-[10px] text-blue-400 font-bold">
                      #{hoveredComplaint.id}
                    </span>
                    <span
                      className={`text-[9px] font-bold px-1.5 py-0.2 rounded uppercase ${
                        hoveredComplaint.status === 'resolved'
                          ? 'bg-slate-700 text-slate-300'
                          : hoveredComplaint.priority === 'high'
                          ? 'bg-red-900/80 text-red-300'
                          : hoveredComplaint.priority === 'medium'
                          ? 'bg-orange-900/80 text-orange-300'
                          : 'bg-emerald-900/80 text-emerald-300'
                      }`}
                    >
                      {hoveredComplaint.status === 'resolved'
                        ? t.resolved
                        : `${t[hoveredComplaint.priority] || hoveredComplaint.priority} ${t.priority}`}
                    </span>
                  </div>
                  <p className="text-xs font-semibold text-slate-100 truncate mt-0.5">
                    {hoveredComplaint.title}
                  </p>
                  <p className="text-[10px] text-slate-400 truncate">
                    📍 {hoveredComplaint.location.taluka} • {hoveredComplaint.location.landmark}
                  </p>
                </div>
              </div>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectComplaint(hoveredComplaint);
                }}
                className="px-2.5 py-1 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg shrink-0 transition-colors"
              >
                {t.inspect}
              </button>
            </div>
          )}

          {/* Quick Helper Badge */}
          <div className="absolute top-2 right-3 bg-slate-800/80 text-slate-300 text-[10px] px-2.5 py-0.5 rounded-full border border-slate-700 font-medium">
            {t.mapPinsHelper}
          </div>
        </div>
      </div>

      {/* Grievances List (Cards or Table) */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-xl p-12 text-center text-slate-400 border border-slate-200">
          <AlertCircle className="w-10 h-10 mx-auto mb-2 text-slate-300" />
          <p className="text-sm font-semibold text-slate-600">{t.noComplaintsFound}</p>
        </div>
      ) : viewMode === 'cards' ? (
        /* Bento Cards View */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((item) => (
            <div
              key={item.id}
              id={`officer-card-${item.id}`}
              className="bg-white rounded-xl border border-slate-200 shadow-xs hover:border-blue-300 transition-all flex flex-col justify-between overflow-hidden group"
            >
              <div className="p-5 space-y-3">
                {/* Header Row */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-blue-900 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                      {item.id}
                    </span>
                    {getPriorityBadge(item.priority)}
                  </div>
                  {getStatusBadge(item.status)}
                </div>

                {/* Photo & Title */}
                <div className="flex gap-3">
                  <img
                    src={item.imageUrl}
                    alt={item.title}
                    className="w-20 h-20 rounded-lg object-cover bg-slate-100 border border-slate-200 shrink-0"
                  />
                  <div className="space-y-1 min-w-0 flex-1">
                    <h4 className="font-bold text-slate-900 text-sm leading-snug line-clamp-2">
                      {item.title}
                    </h4>
                    <p className="text-xs text-slate-500 flex items-center gap-1 truncate">
                      <MapPin className="w-3 h-3 text-orange-500 shrink-0" />
                      <span>{item.location.taluka}</span>
                    </p>
                    <p className="text-[11px] text-slate-400 truncate">
                      {item.location.landmark}
                    </p>
                  </div>
                </div>

                {/* Assigned Squad Info */}
                <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100 text-[11px] text-slate-600 flex items-center justify-between">
                  <span className="truncate">
                    {t.assignDivision}: <strong className="text-slate-800">{item.assignedTo?.division || 'Unassigned'}</strong>
                  </span>
                  <span className="text-slate-400 shrink-0">
                    {new Date(item.createdAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}
                  </span>
                </div>
              </div>

              {/* Action Bar */}
              <div className="p-3 bg-slate-50/80 border-t border-slate-100 flex items-center justify-between gap-2">
                {/* Quick Status Dropdown */}
                <select
                  value={item.status}
                  onChange={(e) => onQuickStatusChange(item.id, e.target.value as ComplaintStatus)}
                  onClick={(e) => e.stopPropagation()}
                  className="text-xs px-2 py-1 bg-white border border-slate-300 rounded font-semibold text-slate-700 focus:ring-2 focus:ring-blue-600"
                >
                  <option value="pending">{t.pending}</option>
                  <option value="assigned">{t.assigned}</option>
                  <option value="in_progress">{t.in_progress}</option>
                  <option value="resolved">{t.resolved}</option>
                </select>

                <button
                  type="button"
                  id={`btn-open-dossier-${item.id}`}
                  onClick={() => onSelectComplaint(item)}
                  className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded shadow-2xs flex items-center gap-1 transition-colors"
                >
                  <span>{t.inspect}</span>
                  <ChevronRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Tabular Grid View */
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                <tr>
                  <th className="p-3.5">ID</th>
                  <th className="p-3.5">{t.title}</th>
                  <th className="p-3.5">{t.location}</th>
                  <th className="p-3.5">{t.priority}</th>
                  <th className="p-3.5">{t.currentStatus}</th>
                  <th className="p-3.5">{t.citizen}</th>
                  <th className="p-3.5">{t.assignDivision}</th>
                  <th className="p-3.5 text-right">{t.officerActions}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((item) => (
                  <tr
                    key={item.id}
                    className="hover:bg-slate-50 transition-colors cursor-pointer"
                    onClick={() => onSelectComplaint(item)}
                  >
                    <td className="p-3.5 font-mono font-bold text-blue-900">{item.id}</td>
                    <td className="p-3.5 font-semibold text-slate-900 max-w-xs truncate">
                      {item.title}
                    </td>
                    <td className="p-3.5">
                      <div className="font-medium text-slate-800">{item.location.taluka}</div>
                      <div className="text-[11px] text-slate-400 truncate">{item.location.roadName}</div>
                    </td>
                    <td className="p-3.5">{getPriorityBadge(item.priority)}</td>
                    <td className="p-3.5">{getStatusBadge(item.status)}</td>
                    <td className="p-3.5">
                      <div className="font-medium text-slate-800">{item.citizenName}</div>
                      <div className="text-[10px] text-slate-400">{item.citizenPhone}</div>
                    </td>
                    <td className="p-3.5 text-slate-700">
                      {item.assignedTo?.division || 'Unassigned'}
                    </td>
                    <td className="p-3.5 text-right" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => onSelectComplaint(item)}
                        className="px-2.5 py-1 bg-white border border-slate-200 rounded font-semibold text-slate-700 hover:border-blue-300 hover:text-blue-700"
                      >
                        {t.inspect}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Officer Security Clearance & PIN Settings Modal */}
      <OfficerPinSettingsModal
        isOpen={isPinSettingsOpen}
        onClose={() => setIsPinSettingsOpen(false)}
        language={language}
      />
    </div>
  );
};
