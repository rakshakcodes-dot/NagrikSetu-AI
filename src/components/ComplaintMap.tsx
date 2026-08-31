import React, { useState } from 'react';
import {
  MapPin,
  Layers,
  Filter,
  Eye,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Maximize2,
  Navigation,
  Sparkles,
  LocateFixed,
  RefreshCw,
  Compass,
} from 'lucide-react';
import { Complaint, ComplaintPriority, ComplaintStatus, GoaTaluka, Language } from '../types';
import { translations } from '../utils/translations';
import { GOA_TALUKA_COORDINATES, findNearestGoaTaluka, formatCoordinates, getDistanceFromLatLonInKm } from '../utils/smartLogic';

interface ComplaintMapProps {
  complaints: Complaint[];
  onSelectComplaint: (complaint: Complaint) => void;
  language: Language;
}

export const ComplaintMap: React.FC<ComplaintMapProps> = ({
  complaints,
  onSelectComplaint,
  language,
}) => {
  const t = translations[language];

  const [selectedTaluka, setSelectedTaluka] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedPriority, setSelectedPriority] = useState<string>('all');
  const [activeComplaint, setActiveComplaint] = useState<Complaint | null>(complaints[0] || null);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number; taluka: string } | null>(null);
  const [locatingUser, setLocatingUser] = useState(false);
  const [locateStatusMessage, setLocateStatusMessage] = useState<string | null>(null);

  // Locate User on GIS Map
  const handleLocateMe = () => {
    setLocatingUser(true);
    setLocateStatusMessage('Finding your location...');

    const applyFallback = () => {
      const fallbackLat = 15.4989;
      const fallbackLng = 73.8278;
      setUserLocation({ lat: fallbackLat, lng: fallbackLng, taluka: 'Panaji (Tiswadi)' });
      setLocatingUser(false);
      setLocateStatusMessage('Location set to Panaji Central Corridor (15.4989° N, 73.8278° E)');
    };

    if (!navigator.geolocation) {
      applyFallback();
      return;
    }

    try {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const rawLat = pos.coords.latitude;
          const rawLng = pos.coords.longitude;
          const nearest = findNearestGoaTaluka(rawLat, rawLng);

          setUserLocation({
            lat: rawLat,
            lng: rawLng,
            taluka: nearest.taluka,
          });
          setLocatingUser(false);
          setLocateStatusMessage(`Position pinned in ${nearest.taluka} (${formatCoordinates(rawLat, rawLng)})`);
        },
        () => {
          applyFallback();
        },
        { enableHighAccuracy: true, timeout: 6000 }
      );
    } catch {
      applyFallback();
    }
  };

  // Filter complaints
  const filteredComplaints = complaints.filter((c) => {
    const matchesTaluka = selectedTaluka === 'all' || c.location.taluka === selectedTaluka;
    const matchesStatus = selectedStatus === 'all' || c.status === selectedStatus;
    const matchesPriority = selectedPriority === 'all' || c.priority === selectedPriority;
    return matchesTaluka && matchesStatus && matchesPriority;
  });

  // Calculate percentage positions on Goa SVG Map Box
  // Goa approx Lat bounds: 14.85 to 15.80 (North-South, ~0.95 deg)
  // Goa approx Lng bounds: 73.65 to 74.30 (West-East, ~0.65 deg)
  const getMapCoordinates = (lat: number, lng: number) => {
    const minLat = 14.95;
    const maxLat = 15.75;
    const minLng = 73.65;
    const maxLng = 74.25;

    // Y is inverted because higher latitude is North (top)
    const y = 100 - ((lat - minLat) / (maxLat - minLat)) * 100;
    const x = ((lng - minLng) / (maxLng - minLng)) * 100;

    // Clamp between 5% and 95%
    return {
      x: Math.max(8, Math.min(92, x)),
      y: Math.max(8, Math.min(92, y)),
    };
  };

  const getPinColor = (c: Complaint) => {
    if (c.status === 'resolved') return 'bg-emerald-500 ring-emerald-300';
    if (c.priority === 'high') return 'bg-red-500 ring-red-300 animate-pulse';
    if (c.status === 'in_progress') return 'bg-indigo-500 ring-indigo-300';
    if (c.status === 'assigned') return 'bg-blue-500 ring-blue-300';
    return 'bg-amber-500 ring-amber-300';
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Map Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-blue-100 text-blue-900">
              GIS Spatial Registry
            </span>
            <span className="text-xs text-slate-500">Goa PWD & Municipalities</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900">{t.mapTitle}</h1>
          <p className="text-xs text-slate-500 mt-1">{t.mapSubtitle}</p>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-3 text-xs bg-slate-50 p-2.5 rounded-xl border border-slate-200">
          <div className="flex items-center gap-1.5 font-medium text-slate-700">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500"></span>
            <span>{t.highPriority}</span>
          </div>
          <div className="flex items-center gap-1.5 font-medium text-slate-700">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
            <span>{t.pending}</span>
          </div>
          <div className="flex items-center gap-1.5 font-medium text-slate-700">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
            <span>{t.assigned}</span>
          </div>
          <div className="flex items-center gap-1.5 font-medium text-slate-700">
            <span className="w-2.5 h-2.5 rounded-full bg-indigo-500"></span>
            <span>{t.in_progress}</span>
          </div>
          <div className="flex items-center gap-1.5 font-medium text-slate-700">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
            <span>{t.resolved}</span>
          </div>
        </div>
      </div>

      {/* Interactive Map & Side Inspector Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: The Interactive Vector Map */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-xs p-4 sm:p-6 flex flex-col space-y-4">
          {/* Map Controls Toolbar */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 text-xs">
            <select
              value={selectedTaluka}
              onChange={(e) => setSelectedTaluka(e.target.value)}
              className="px-3 py-2 rounded-lg border border-slate-300 font-semibold bg-white"
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

            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-3 py-2 rounded-lg border border-slate-300 font-semibold bg-white"
            >
              <option value="all">{t.allStatuses}</option>
              <option value="pending">{t.pending}</option>
              <option value="assigned">{t.assigned}</option>
              <option value="in_progress">{t.in_progress}</option>
              <option value="resolved">{t.resolved}</option>
            </select>

            <select
              value={selectedPriority}
              onChange={(e) => setSelectedPriority(e.target.value)}
              className="px-3 py-2 rounded-lg border border-slate-300 font-semibold bg-white"
            >
              <option value="all">{t.allPriorities}</option>
              <option value="high">{t.highPriority}</option>
              <option value="medium">{t.mediumPriority}</option>
              <option value="low">{t.lowPriority}</option>
            </select>

            {/* Locate Me Toolbar Button */}
            <button
              type="button"
              id="btn-map-locate-me"
              onClick={handleLocateMe}
              disabled={locatingUser}
              className={`px-3 py-2 rounded-lg font-bold flex items-center justify-center gap-1.5 transition-all ${
                userLocation
                  ? 'bg-blue-900 text-white shadow-2xs'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300'
              }`}
            >
              {locatingUser ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-orange-400" />
              ) : (
                <LocateFixed className="w-3.5 h-3.5 text-orange-500" />
              )}
              <span>{locatingUser ? 'Locating...' : userLocation ? 'My Location ✓' : 'Locate Me'}</span>
            </button>
          </div>

          {/* Locate Me Status banner */}
          {locateStatusMessage && (
            <div className="px-3 py-2 rounded-lg bg-blue-50 border border-blue-200 text-xs text-blue-900 flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Navigation className="w-3.5 h-3.5 text-blue-600" />
                <span>{locateStatusMessage}</span>
              </div>
              <button
                type="button"
                onClick={() => setLocateStatusMessage(null)}
                className="text-[10px] text-blue-600 hover:underline"
              >
                Dismiss
              </button>
            </div>
          )}

          {/* Map Canvas Box with stylized Goa Outline & Regional Zones */}
          <div className="relative w-full aspect-4/3 sm:aspect-16/10 bg-slate-900 rounded-2xl overflow-hidden border border-slate-800 shadow-inner flex items-center justify-center select-none">
            {/* Background Grid & Coastal Pattern */}
            <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:16px_16px]"></div>

            {/* Arabian Sea Tag */}
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-cyan-500/40 text-xs font-black uppercase tracking-widest pointer-events-none transform -rotate-90">
              Arabian Sea (West Coast)
            </div>

            {/* Western Ghats Tag */}
            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-emerald-500/30 text-xs font-black uppercase tracking-widest pointer-events-none transform rotate-90">
              Western Ghats (East)
            </div>

            {/* Goa Districts Division Labels */}
            <div className="absolute top-4 left-1/2 -translate-x-1/2 px-3 py-1 bg-slate-800/80 rounded-full text-[10px] font-bold text-slate-300 border border-slate-700">
              North Goa District • South Goa District
            </div>

            {/* Regional Town Reference Markers */}
            {[
              { name: 'Pernem', x: 28, y: 15 },
              { name: 'Mapusa (Bardez)', x: 38, y: 28 },
              { name: 'Panaji (Tiswadi)', x: 42, y: 40 },
              { name: 'Vasco da Gama', x: 35, y: 52 },
              { name: 'Ponda', x: 65, y: 50 },
              { name: 'Margao (Salcete)', x: 55, y: 68 },
              { name: 'Curchorem (Quepem)', x: 74, y: 78 },
              { name: 'Canacona', x: 68, y: 90 },
            ].map((town, idx) => (
              <div
                key={idx}
                style={{ left: `${town.x}%`, top: `${town.y}%` }}
                className="absolute transform -translate-x-1/2 -translate-y-1/2 pointer-events-none text-center"
              >
                <div className="w-1.5 h-1.5 rounded-full bg-slate-600 mx-auto"></div>
                <span className="text-[10px] font-bold text-slate-400/80 tracking-tight whitespace-nowrap block mt-0.5">
                  {town.name}
                </span>
              </div>
            ))}

            {/* User's Current GPS Location Beacon */}
            {userLocation && (() => {
              const userPos = getMapCoordinates(userLocation.lat, userLocation.lng);
              return (
                <div
                  id="user-gps-location-marker"
                  style={{ left: `${userPos.x}%`, top: `${userPos.y}%` }}
                  className="absolute transform -translate-x-1/2 -translate-y-1/2 z-40 pointer-events-none"
                >
                  <span className="absolute -inset-3 bg-cyan-400/40 rounded-full animate-ping" />
                  <div className="w-6 h-6 rounded-full bg-cyan-500 border-2 border-white shadow-xl flex items-center justify-center text-white">
                    <Navigation className="w-3.5 h-3.5 fill-current" />
                  </div>
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-0.5 bg-cyan-900/95 text-cyan-100 text-[10px] font-bold rounded shadow border border-cyan-400 whitespace-nowrap">
                    You Are Here ({userLocation.taluka.split(' ')[0]})
                  </div>
                </div>
              );
            })()}

            {/* Active Complaint Pins */}
            {filteredComplaints.map((c) => {
              const pos = getMapCoordinates(c.location.latitude, c.location.longitude);
              const isSelected = activeComplaint?.id === c.id;

              return (
                <button
                  key={c.id}
                  id={`map-pin-${c.id}`}
                  onClick={() => setActiveComplaint(c)}
                  style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
                  className={`absolute transform -translate-x-1/2 -translate-y-1/2 group transition-transform ${
                    isSelected ? 'scale-125 z-30' : 'hover:scale-110 z-20'
                  }`}
                >
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-white shadow-lg ring-4 transition-all ${getPinColor(
                      c
                    )}`}
                  >
                    <MapPin className="w-3.5 h-3.5" />
                  </div>

                  {/* Pin Hover Label */}
                  <div
                    className={`absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 px-2 py-1 bg-slate-900/95 text-white text-[10px] font-mono font-bold rounded shadow-md whitespace-nowrap border border-slate-700 pointer-events-none ${
                      isSelected ? 'block' : 'hidden group-hover:block'
                    }`}
                  >
                    {c.id} • {c.location.taluka.split(' ')[0]}
                  </div>
                </button>
              );
            })}
          </div>

          <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
            <span>
              {t.totalComplaints}: <strong>{filteredComplaints.length}</strong>
            </span>
            <span className="text-[11px] text-slate-400">{t.mapPinsHelper}</span>
          </div>
        </div>

        {/* Right 1 Col: Selected Pin Inspector Card */}
        <div className="space-y-4">
          {activeComplaint ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-blue-900 bg-blue-50 px-2.5 py-1 rounded border border-blue-200">
                  {activeComplaint.id}
                </span>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                    activeComplaint.priority === 'high'
                      ? 'bg-red-100 text-red-700'
                      : activeComplaint.priority === 'medium'
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-emerald-100 text-emerald-800'
                  }`}
                >
                  {t[activeComplaint.priority] || activeComplaint.priority} {t.priority}
                </span>
              </div>

              {/* Photo Preview */}
              <div className="rounded-xl overflow-hidden bg-slate-100 border border-slate-200 aspect-video relative">
                <img
                  src={activeComplaint.imageUrl}
                  alt={activeComplaint.title}
                  className="w-full h-full object-cover"
                />
                <span className="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-black/70 text-white text-[10px]">
                  {activeComplaint.category}
                </span>
              </div>

              <div>
                <h3 className="text-sm font-bold text-slate-900">{activeComplaint.title}</h3>
                <p className="text-xs text-slate-600 mt-1 line-clamp-2">
                  {activeComplaint.description}
                </p>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">{t.location}:</span>
                  <span className="font-bold text-slate-900">{activeComplaint.location.taluka}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">{t.landmark}:</span>
                  <span className="font-semibold text-slate-800 truncate max-w-36">
                    {activeComplaint.location.landmark}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">{t.currentStatus}:</span>
                  <span className="font-bold capitalize text-blue-900">
                    {t[activeComplaint.status] || activeComplaint.status}
                  </span>
                </div>

                {/* Distance to user if user location available */}
                {userLocation && (
                  <div className="flex items-center justify-between pt-1 border-t border-slate-200 text-[11px]">
                    <span className="text-slate-500">Distance from You:</span>
                    <span className="font-bold text-blue-900">
                      {getDistanceFromLatLonInKm(
                        userLocation.lat,
                        userLocation.lng,
                        activeComplaint.location.latitude,
                        activeComplaint.location.longitude
                      ).toFixed(1)}{' '}
                      km
                    </span>
                  </div>
                )}
              </div>

              <button
                id="btn-map-view-details"
                onClick={() => onSelectComplaint(activeComplaint)}
                className="w-full py-2.5 bg-blue-900 hover:bg-blue-800 text-white font-bold text-xs rounded-xl shadow-xs flex items-center justify-center gap-2 transition-colors"
              >
                <span>{t.inspect}</span>
                <ArrowRight className="w-4 h-4 text-orange-400" />
              </button>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-slate-400 text-xs">
              {t.noComplaintsFound}
            </div>
          )}

          {/* Quick Municipal Division Contacts in Goa */}
          <div className="bg-blue-950 text-white p-5 rounded-2xl shadow-xs space-y-3">
            <h4 className="text-xs font-bold text-orange-400 uppercase tracking-wider">
              Emergency Road Helpline (Goa)
            </h4>
            <div className="text-xs space-y-1.5 text-blue-100">
              <div className="flex justify-between">
                <span>PWD Control Room (Panaji):</span>
                <strong className="text-white font-mono">0832-2421055</strong>
              </div>
              <div className="flex justify-between">
                <span>South Goa Circle (Margao):</span>
                <strong className="text-white font-mono">0832-2730114</strong>
              </div>
              <div className="flex justify-between">
                <span>Traffic Police Control:</span>
                <strong className="text-white font-mono">1095 / 112</strong>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
