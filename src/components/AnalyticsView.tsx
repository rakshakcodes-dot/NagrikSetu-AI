import React, { useState } from 'react';
import {
  BarChart3,
  CheckCircle2,
  Clock,
  AlertTriangle,
  MapPin,
  TrendingUp,
  Activity,
  Layers,
  PieChart as PieChartIcon,
  ShieldCheck,
  Zap,
  ArrowUpRight,
  Filter,
} from 'lucide-react';
import { Complaint, ComplaintCategory, ComplaintStatus, Language } from '../types';
import { translations } from '../utils/translations';

interface AnalyticsViewProps {
  complaints: Complaint[];
  language: Language;
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({ complaints, language }) => {
  const t = translations[language];
  const [selectedTalukaFilter, setSelectedTalukaFilter] = useState<string>('all');

  const filteredComplaints =
    selectedTalukaFilter === 'all'
      ? complaints
      : complaints.filter((c) => c.location.taluka === selectedTalukaFilter);

  const total = filteredComplaints.length;
  const pending = filteredComplaints.filter((c) => c.status === 'pending').length;
  const inProgress = filteredComplaints.filter(
    (c) => c.status === 'in_progress' || c.status === 'assigned'
  ).length;
  const resolved = filteredComplaints.filter((c) => c.status === 'resolved').length;

  const resolutionRate = total > 0 ? Math.round((resolved / total) * 100) : 0;

  // Calculate Average Resolution Time dynamically from resolved complaints
  const resolvedItems = filteredComplaints.filter((c) => c.status === 'resolved' && c.resolvedAt);
  let avgDays = 2.4; // standard benchmark
  if (resolvedItems.length > 0) {
    const totalDays = resolvedItems.reduce((acc, curr) => {
      const created = new Date(curr.createdAt).getTime();
      const resolvedTime = new Date(curr.resolvedAt!).getTime();
      const diffDays = Math.max(0.5, (resolvedTime - created) / (1000 * 60 * 60 * 24));
      return acc + diffDays;
    }, 0);
    avgDays = Math.round((totalDays / resolvedItems.length) * 10) / 10;
  }

  // Category Breakdown with colors and descriptions
  const categoriesList: { category: ComplaintCategory; color: string; bg: string }[] = [
    { category: 'Deep Pothole', color: '#ef4444', bg: 'bg-red-500' },
    { category: 'Waterlogged Crater', color: '#f97316', bg: 'bg-orange-500' },
    { category: 'Asphalt Surface Crack', color: '#eab308', bg: 'bg-amber-500' },
    { category: 'Road Edge Erosion', color: '#6366f1', bg: 'bg-indigo-500' },
    { category: 'Manhole / Drain Hazard', color: '#06b6d4', bg: 'bg-cyan-500' },
    { category: 'Trench / Utility Cut', color: '#8b5cf6', bg: 'bg-purple-500' },
  ];

  const categoryData = categoriesList.map((item) => {
    const count = filteredComplaints.filter((c) => c.category === item.category).length;
    const resolvedCount = filteredComplaints.filter(
      (c) => c.category === item.category && c.status === 'resolved'
    ).length;
    const percentage = total > 0 ? Math.round((count / total) * 100) : 0;
    return {
      ...item,
      count,
      resolvedCount,
      percentage,
    };
  });

  // Status Breakdown Data
  const statusData = [
    {
      status: 'pending' as ComplaintStatus,
      label: t.pending,
      count: pending,
      percentage: total > 0 ? Math.round((pending / total) * 100) : 0,
      color: '#f59e0b',
      bg: 'bg-amber-500',
      ring: 'ring-amber-200',
      text: 'text-amber-700',
    },
    {
      status: 'in_progress' as ComplaintStatus,
      label: t.in_progress,
      count: inProgress,
      percentage: total > 0 ? Math.round((inProgress / total) * 100) : 0,
      color: '#3b82f6',
      bg: 'bg-blue-600',
      ring: 'ring-blue-200',
      text: 'text-blue-700',
    },
    {
      status: 'resolved' as ComplaintStatus,
      label: t.resolved,
      count: resolved,
      percentage: total > 0 ? Math.round((resolved / total) * 100) : 0,
      color: '#10b981',
      bg: 'bg-emerald-500',
      ring: 'ring-emerald-200',
      text: 'text-emerald-700',
    },
  ];

  // Priority Breakdown
  const priorityCounts = {
    high: filteredComplaints.filter((c) => c.priority === 'high').length,
    medium: filteredComplaints.filter((c) => c.priority === 'medium').length,
    low: filteredComplaints.filter((c) => c.priority === 'low').length,
  };

  // Taluka Breakdown
  const talukaCounts: Record<string, { total: number; resolved: number }> = {};
  complaints.forEach((c) => {
    const tal = c.location.taluka;
    if (!talukaCounts[tal]) {
      talukaCounts[tal] = { total: 0, resolved: 0 };
    }
    talukaCounts[tal].total += 1;
    if (c.status === 'resolved') {
      talukaCounts[tal].resolved += 1;
    }
  });

  // Calculate SVG Donut Coordinates
  let cumulativePercent = 0;
  const donutSegments = statusData.map((item) => {
    const startAngle = (cumulativePercent / 100) * 360;
    cumulativePercent += item.percentage;
    const endAngle = (cumulativePercent / 100) * 360;
    return {
      ...item,
      startAngle,
      endAngle,
    };
  });

  // SVG Helper for donut path
  const polarToCartesian = (centerX: number, centerY: number, radius: number, angleInDegrees: number) => {
    const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180.0;
    return {
      x: centerX + radius * Math.cos(angleInRadians),
      y: centerY + radius * Math.sin(angleInRadians),
    };
  };

  const describeArc = (x: number, y: number, radius: number, startAngle: number, endAngle: number) => {
    const start = polarToCartesian(x, y, radius, endAngle);
    const end = polarToCartesian(x, y, radius, startAngle);
    const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1';
    return ['M', start.x, start.y, 'A', radius, radius, 0, largeArcFlag, 0, end.x, end.y].join(' ');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Top Header & Overview Bar */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-[11px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md bg-blue-100 text-blue-900">
              {t.publicWorksDepartment}
            </span>
            <span className="text-xs text-slate-500 font-medium">Public Works Telemetry</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            {t.analytics} & {t.potholeGrievanceAppTitle}
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Real-time analytics for defect intake, road squad dispatch speed, and resolution rates.
          </p>
        </div>

        {/* Filter Dropdown */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs">
            <Filter className="w-4 h-4 text-slate-400" />
            <span className="text-slate-500 font-medium">{t.taluka}:</span>
            <select
              value={selectedTalukaFilter}
              onChange={(e) => setSelectedTalukaFilter(e.target.value)}
              className="bg-transparent font-bold text-slate-800 focus:outline-none cursor-pointer"
            >
              <option value="all">{t.allTalukas}</option>
              {Object.keys(talukaCounts).map((tal) => (
                <option key={tal} value={tal}>
                  {tal}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* 5-Card Analytics KPI Summary Row (Total, Pending, In-Progress, Resolved, Avg Resolution Time) */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Total Complaints Card */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between hover:border-slate-300 transition-colors">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase tracking-wider">
            <span>{t.totalComplaints}</span>
            <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-700">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="my-2">
            <div className="text-3xl font-black text-slate-900 tracking-tight">{total}</div>
          </div>
          <div className="text-[11px] text-slate-400 font-medium flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-slate-400 inline-block"></span>
            {t.total}
          </div>
        </div>

        {/* Pending Complaints Card */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-amber-200 shadow-xs flex flex-col justify-between hover:border-amber-300 transition-colors">
          <div className="flex items-center justify-between text-amber-700 text-xs font-bold uppercase tracking-wider">
            <span>{t.pendingComplaints}</span>
            <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center text-amber-700">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="my-2">
            <div className="text-3xl font-black text-amber-600 tracking-tight">{pending}</div>
          </div>
          <div className="text-[11px] text-amber-700 font-medium">
            {total > 0 ? Math.round((pending / total) * 100) : 0}% ({t.pending})
          </div>
        </div>

        {/* In-Progress Complaints Card */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-blue-200 shadow-xs flex flex-col justify-between hover:border-blue-300 transition-colors">
          <div className="flex items-center justify-between text-blue-700 text-xs font-bold uppercase tracking-wider">
            <span>{t.inProgressComplaints}</span>
            <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center text-blue-700">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <div className="my-2">
            <div className="text-3xl font-black text-blue-600 tracking-tight">{inProgress}</div>
          </div>
          <div className="text-[11px] text-blue-700 font-medium">
            {t.workOrdersActive}
          </div>
        </div>

        {/* Resolved Complaints Card */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-emerald-200 shadow-xs flex flex-col justify-between hover:border-emerald-300 transition-colors">
          <div className="flex items-center justify-between text-emerald-700 text-xs font-bold uppercase tracking-wider">
            <span>{t.resolvedComplaints}</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-700">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="my-2">
            <div className="text-3xl font-black text-emerald-600 tracking-tight">{resolved}</div>
          </div>
          <div className="text-[11px] text-emerald-700 font-bold">
            {resolutionRate}% {t.resolved}
          </div>
        </div>

        {/* Average Resolution Time Card */}
        <div className="bg-gradient-to-br from-blue-900 to-slate-900 text-white p-4 sm:p-5 rounded-2xl shadow-xs flex flex-col justify-between col-span-2 sm:col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between text-blue-200 text-xs font-bold uppercase tracking-wider">
            <span>{t.avgResolutionTime}</span>
            <div className="w-8 h-8 rounded-lg bg-blue-800/80 flex items-center justify-center text-orange-400">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="my-2">
            <div className="text-3xl font-black text-white tracking-tight">{avgDays} {t.days}</div>
          </div>
          <div className="text-[11px] text-blue-200 font-medium flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            SLA: &lt; 3.0 {t.days}
          </div>
        </div>
      </div>

      {/* Main Charts Bento Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* CHART 1: Complaints by Category */}
        <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-orange-100 text-orange-700 flex items-center justify-center font-bold">
                <BarChart3 className="w-4 h-4 text-orange-600" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 leading-tight">
                  {t.complaintsByCategory}
                </h3>
                <p className="text-xs text-slate-500">
                  Distribution of reported defects across road infrastructure types
                </p>
              </div>
            </div>
            <span className="text-xs font-bold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-lg">
              {categoryData.length} {t.categories}
            </span>
          </div>

          {/* Category Bar Chart */}
          <div className="space-y-4 pt-1">
            {categoryData.map((item) => {
              const maxCount = Math.max(...categoryData.map((d) => d.count), 1);
              const barWidth = Math.max(8, (item.count / maxCount) * 100);

              return (
                <div key={item.category} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className={`w-2.5 h-2.5 rounded-full ${item.bg}`}></span>
                      <span className="font-bold text-slate-800">{item.category}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-slate-400 text-[11px]">
                        {item.resolvedCount}/{item.count} {t.resolved}
                      </span>
                      <span className="font-mono font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded text-xs">
                        {item.count} ({item.percentage}%)
                      </span>
                    </div>
                  </div>

                  {/* Horizontal Bar */}
                  <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden flex">
                    <div
                      style={{
                        width: `${barWidth}%`,
                        backgroundColor: item.color,
                      }}
                      className="h-full rounded-full transition-all duration-500 relative flex items-center justify-end pr-1"
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
            <span>{t.deepPothole}: {categoryData[0]?.count || 0}</span>
            <span className="font-semibold text-blue-900">PWD Goa</span>
          </div>
        </div>

        {/* CHART 2: Complaints by Status (Donut & Status Queue) */}
        <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                <PieChartIcon className="w-4 h-4 text-blue-600" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 leading-tight">
                  {t.complaintsByStatus}
                </h3>
                <p className="text-xs text-slate-500">
                  Current operational workflow pipeline and resolution status
                </p>
              </div>
            </div>
            <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-2.5 py-1 rounded-lg">
              {resolutionRate}% {t.resolved}
            </span>
          </div>

          {/* Status Breakdown & Visual Gauge */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center pt-2">
            {/* SVG Donut Visual */}
            <div className="flex flex-col items-center justify-center relative">
              <svg viewBox="0 0 160 160" className="w-40 h-40 transform -rotate-90">
                {/* Background Ring */}
                <circle
                  cx="80"
                  cy="80"
                  r="60"
                  fill="transparent"
                  stroke="#f1f5f9"
                  strokeWidth="20"
                />

                {/* Donut Segment Rings */}
                {total > 0 &&
                  donutSegments.map((segment) => {
                    if (segment.percentage === 0) return null;
                    const strokeDasharray = `${(segment.percentage / 100) * (2 * Math.PI * 60)} ${
                      2 * Math.PI * 60
                    }`;
                    const strokeDashoffset = `-${
                      (segment.startAngle / 360) * (2 * Math.PI * 60)
                    }`;

                    return (
                      <circle
                        key={segment.status}
                        cx="80"
                        cy="80"
                        r="60"
                        fill="transparent"
                        stroke={segment.color}
                        strokeWidth="20"
                        strokeDasharray={strokeDasharray}
                        strokeDashoffset={strokeDashoffset}
                        className="transition-all duration-500 hover:opacity-80 cursor-pointer"
                      />
                    );
                  })}
              </svg>

              {/* Center Metrics in Donut */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-2xl font-black text-slate-900 leading-none">{total}</span>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-1">
                  {t.total}
                </span>
              </div>
            </div>

            {/* Status Legend & Counts */}
            <div className="space-y-3">
              {statusData.map((item) => (
                <div
                  key={item.status}
                  className="p-2.5 rounded-xl border border-slate-100 bg-slate-50 flex items-center justify-between"
                >
                  <div className="flex items-center gap-2.5">
                    <span className={`w-3 h-3 rounded-full ${item.bg} ring-2 ${item.ring}`}></span>
                    <div>
                      <div className="text-xs font-bold text-slate-800">{item.label}</div>
                      <div className="text-[10px] text-slate-400">
                        {item.status === 'resolved'
                          ? t.resolved
                          : item.status === 'in_progress'
                          ? t.in_progress
                          : t.pending}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-black text-slate-900 font-mono block">
                      {item.count}
                    </span>
                    <span className="text-[10px] font-bold text-slate-500">
                      {item.percentage}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
            <span>SLA Target: 72h Hot-Mix Patching</span>
            <span className="font-semibold text-emerald-600">Active Monitoring</span>
          </div>
        </div>
      </div>

      {/* Secondary Row: Regional Taluka Distribution & Severity Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Taluka Municipal Breakdown */}
        <div className="lg:col-span-2 bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <MapPin className="w-4 h-4 text-orange-500" />
              <span>{t.taluka}</span>
            </h3>
            <span className="text-xs text-slate-400 font-semibold">{t.total} vs {t.resolved}</span>
          </div>

          <div className="space-y-3 pt-2">
            {Object.entries(talukaCounts).map(([taluka, stats]) => {
              const pct = Math.round((stats.total / Math.max(1, complaints.length)) * 100);
              const resolvedPct = Math.round((stats.resolved / Math.max(1, stats.total)) * 100);
              return (
                <div key={taluka} className="space-y-1">
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span className="text-slate-800 font-bold">{taluka}</span>
                    <span className="text-slate-500">
                      {stats.total} ({stats.resolved} {t.resolved} • {resolvedPct}%)
                    </span>
                  </div>
                  <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden flex">
                    <div
                      style={{ width: `${pct}%` }}
                      className="h-full bg-blue-900 rounded-full flex overflow-hidden"
                    >
                      <div
                        style={{ width: `${resolvedPct}%` }}
                        className="h-full bg-emerald-500"
                        title="Resolved Portion"
                      ></div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Priority Severity Breakdown */}
        <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-3">
              {t.priority}
            </h3>

            <div className="space-y-3">
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-red-800 uppercase block">{t.high} {t.priority}</span>
                  <span className="text-[10px] text-red-600">Immediate traffic risk</span>
                </div>
                <span className="text-2xl font-black text-red-950 font-mono">{priorityCounts.high}</span>
              </div>

              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-amber-800 uppercase block">{t.medium} {t.priority}</span>
                  <span className="text-[10px] text-amber-700">Scheduled for patching</span>
                </div>
                <span className="text-2xl font-black text-amber-950 font-mono">{priorityCounts.medium}</span>
              </div>

              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-emerald-800 uppercase block">{t.low} {t.priority}</span>
                  <span className="text-[10px] text-emerald-700">Minor surface cracks</span>
                </div>
                <span className="text-2xl font-black text-emerald-950 font-mono">{priorityCounts.low}</span>
              </div>
            </div>
          </div>

          <div className="p-3 bg-slate-900 text-white rounded-xl text-xs space-y-1">
            <div className="flex items-center gap-1.5 text-orange-400 font-bold">
              <Zap className="w-3.5 h-3.5" />
              <span>{t.publicWorksDepartment}</span>
            </div>
            <p className="text-[11px] text-slate-300 leading-snug">
              High-priority arterial potholes are assigned high-speed asphalt hot-mix repairs within 48 hours.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
