import React, { useState, useEffect, useRef } from 'react';
import {
  FilePlus,
  Camera,
  MapPin,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  Upload,
  ArrowRight,
  RefreshCw,
  Info,
  Shield,
  Layers,
  Clock,
  Navigation,
  Compass,
  LocateFixed,
  Crosshair,
  Check,
  Map,
} from 'lucide-react';
import {
  Complaint,
  ComplaintCategory,
  GoaTaluka,
  Language,
  RoadType,
  User,
} from '../types';
import { translations } from '../utils/translations';
import {
  predictCategory,
  calculatePriority,
  findNearbyDuplicate,
  generateComplaintId,
  GOA_TALUKA_COORDINATES,
  findNearestGoaTaluka,
  formatCoordinates,
} from '../utils/smartLogic';
import { SAMPLE_POTHOLE_IMAGES } from '../data/sampleData';
import { CameraCaptureModal } from './CameraCaptureModal';

interface SubmitComplaintProps {
  currentUser: User;
  existingComplaints: Complaint[];
  onSubmitSuccess: (newComplaint: Complaint) => void;
  onCancel: () => void;
  language: Language;
}

const CATEGORIES: ComplaintCategory[] = [
  'Deep Pothole',
  'Waterlogged Crater',
  'Road Edge Erosion',
  'Trench / Utility Cut',
  'Asphalt Surface Crack',
  'Culvert / Bridge Depression',
  'Manhole / Drain Hazard',
  'Other',
];

const TALUKAS: GoaTaluka[] = [
  'Panaji (Tiswadi)',
  'Margao (Salcete)',
  'Mapusa (Bardez)',
  'Vasco da Gama (Mormugao)',
  'Ponda (Ponda)',
  'Bicholim',
  'Curchorem (Quepem)',
  'Pernem',
];

const ROAD_TYPES: RoadType[] = [
  'Major District Road',
  'Municipal / City Road',
  'State Highway',
  'National Highway',
  'Village / Panchayat Road',
];

export const SubmitComplaint: React.FC<SubmitComplaintProps> = ({
  currentUser,
  existingComplaints,
  onSubmitSuccess,
  onCancel,
  language,
}) => {
  const t = translations[language];

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<ComplaintCategory>('Deep Pothole');
  const [userOverrodeCategory, setUserOverrodeCategory] = useState(false);
  const [taluka, setTaluka] = useState<GoaTaluka>('Panaji (Tiswadi)');
  const [roadName, setRoadName] = useState('');
  const [landmark, setLandmark] = useState('');
  const [roadType, setRoadType] = useState<RoadType>('Municipal / City Road');
  const [imageUrl, setImageUrl] = useState<string>(SAMPLE_POTHOLE_IMAGES[0].url);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [isPhotoFromCamera, setIsPhotoFromCamera] = useState(false);
  const [latitude, setLatitude] = useState<number>(GOA_TALUKA_COORDINATES['Panaji (Tiswadi)'].lat);
  const [longitude, setLongitude] = useState<number>(GOA_TALUKA_COORDINATES['Panaji (Tiswadi)'].lng);
  const [gpsFetching, setGpsFetching] = useState(false);
  const [gpsState, setGpsState] = useState<'idle' | 'locating' | 'success' | 'fallback'>('idle');
  const [gpsAccuracy, setGpsAccuracy] = useState<number | null>(null);
  const [gpsMessage, setGpsMessage] = useState<string>('');
  const [showManualCoords, setShowManualCoords] = useState(false);
  const [submittedComplaint, setSubmittedComplaint] = useState<Complaint | null>(null);

  // Prediction State
  const [prediction, setPrediction] = useState<{
    category: ComplaintCategory;
    confidence: number;
    matchedKeywords: string[];
  }>({
    category: 'Deep Pothole',
    confidence: 50,
    matchedKeywords: [],
  });

  // Nearby Duplicate Warning State
  const [nearbyWarning, setNearbyWarning] = useState<{
    duplicate: Complaint;
    distanceKm: number;
    matchReason: string;
  } | null>(null);
  const [showDuplicateModal, setShowDuplicateModal] = useState<boolean>(false);
  const [acknowledgedDuplicateId, setAcknowledgedDuplicateId] = useState<string | null>(null);

  // Auto category prediction when title or description changes
  useEffect(() => {
    if (title.trim() || description.trim()) {
      const result = predictCategory(title, description);
      setPrediction(result);
      if (!userOverrodeCategory && result.matchedKeywords.length > 0) {
        setCategory(result.category);
      }
    }
  }, [title, description, userOverrodeCategory]);

  // Update coordinates when taluka changes
  const handleTalukaSelect = (newTaluka: GoaTaluka) => {
    setTaluka(newTaluka);
    const coords = GOA_TALUKA_COORDINATES[newTaluka];
    if (coords) {
      const lat = Number((coords.lat + (Math.random() - 0.5) * 0.004).toFixed(5));
      const lng = Number((coords.lng + (Math.random() - 0.5) * 0.004).toFixed(5));
      setLatitude(lat);
      setLongitude(lng);
      setGpsAccuracy(10);
      setGpsState('success');
      setGpsMessage(`Location set to ${newTaluka} Municipal Area (${formatCoordinates(lat, lng)})`);
    }
  };

  // Check for nearby duplicates comparing Category and Location with unresolved complaints
  useEffect(() => {
    const duplicateMatch = findNearbyDuplicate(
      {
        category,
        location: {
          taluka,
          latitude,
          longitude,
          landmark,
          roadName,
        },
      },
      existingComplaints
    );
    setNearbyWarning(duplicateMatch);
  }, [category, taluka, latitude, longitude, landmark, roadName, existingComplaints]);

  // Priority Preview Calculation
  const priorityInfo = calculatePriority(category, roadType, undefined);

  // Robust Geolocation Handler with Real GPS & Graceful Goa Fallback
  const handleFetchGPS = () => {
    setGpsFetching(true);
    setGpsState('locating');
    setGpsMessage(t.fetchingGps || 'Acquiring satellite GPS coordinates...');

    const applyGoaFallback = (reason: string) => {
      const coords = GOA_TALUKA_COORDINATES[taluka];
      const offsetLat = (Math.random() - 0.5) * 0.005;
      const offsetLng = (Math.random() - 0.5) * 0.005;
      const fallbackLat = Number((coords.lat + offsetLat).toFixed(5));
      const fallbackLng = Number((coords.lng + offsetLng).toFixed(5));

      setLatitude(fallbackLat);
      setLongitude(fallbackLng);
      setGpsAccuracy(15);
      setGpsFetching(false);
      setGpsState('fallback');
      setGpsMessage(`Location calibrated to ${taluka} (${formatCoordinates(fallbackLat, fallbackLng)}). ${reason}`);

      // Auto-suggest default road and landmark if empty
      if (!roadName.trim() && coords.defaultRoads && coords.defaultRoads[0]) {
        setRoadName(coords.defaultRoads[0]);
      }
      if (!landmark.trim() && coords.defaultRoads && coords.defaultRoads[0]) {
        setLandmark(`Near ${coords.defaultRoads[0]} Circle`);
      }
    };

    // Check if browser supports Geolocation
    if (!navigator.geolocation) {
      applyGoaFallback('Browser Geolocation API not available in current environment');
      return;
    }

    try {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const rawLat = position.coords.latitude;
          const rawLng = position.coords.longitude;
          const accuracy = Math.round(position.coords.accuracy || 8);

          const nearest = findNearestGoaTaluka(rawLat, rawLng);

          if (nearest.isWithinGoa) {
            // Inside Goa: exact real-time GPS coordinates
            const finalLat = Number(rawLat.toFixed(5));
            const finalLng = Number(rawLng.toFixed(5));
            setLatitude(finalLat);
            setLongitude(finalLng);
            setTaluka(nearest.taluka);
            setGpsAccuracy(accuracy);
            setGpsFetching(false);
            setGpsState('success');
            setGpsMessage(`Real GPS locked: ${nearest.taluka} (${formatCoordinates(finalLat, finalLng)}) • ±${accuracy}m accuracy`);

            const talukaData = GOA_TALUKA_COORDINATES[nearest.taluka];
            if (!roadName.trim() && talukaData?.defaultRoads?.[0]) {
              setRoadName(talukaData.defaultRoads[0]);
            }
          } else {
            // Outside Goa or running in container/test harness:
            // Use real GPS coordinates, calibrate to closest Goa zone
            const finalLat = Number(rawLat.toFixed(5));
            const finalLng = Number(rawLng.toFixed(5));
            setLatitude(finalLat);
            setLongitude(finalLng);
            setTaluka(nearest.taluka);
            setGpsAccuracy(accuracy);
            setGpsFetching(false);
            setGpsState('success');
            setGpsMessage(`Live GPS locked: ${formatCoordinates(finalLat, finalLng)} (±${accuracy}m). Linked to ${nearest.taluka} Civic Zone.`);
          }
        },
        (error) => {
          console.warn('Geolocation notice:', error.message);
          let reasonMsg = 'Calibrated to Goa Taluka registry.';
          if (error.code === 1) {
            reasonMsg = 'Browser location permission was not granted; using Goa Taluka coordinates.';
          } else if (error.code === 3) {
            reasonMsg = 'GPS signal acquisition timed out; calibrated to central Goa registry.';
          }
          applyGoaFallback(reasonMsg);
        },
        {
          enableHighAccuracy: true,
          timeout: 6000,
          maximumAge: 30000,
        }
      );
    } catch (err) {
      applyGoaFallback('Calibrated to Goa Taluka registry.');
    }
  };

  // Mini-map click-to-pin coordinate dropper
  const handleMiniMapClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    const xPercent = clickX / rect.width;
    const yPercent = clickY / rect.height;

    // Goa Lat bounds: 14.95 to 15.75
    // Goa Lng bounds: 73.65 to 74.25
    const minLat = 14.95;
    const maxLat = 15.75;
    const minLng = 73.65;
    const maxLng = 74.25;

    const newLng = Number((minLng + xPercent * (maxLng - minLng)).toFixed(5));
    const newLat = Number((maxLat - yPercent * (maxLat - minLat)).toFixed(5));

    setLatitude(newLat);
    setLongitude(newLng);
    setGpsAccuracy(5);
    setGpsState('success');

    const nearest = findNearestGoaTaluka(newLat, newLng);
    setTaluka(nearest.taluka);
    setGpsMessage(`Pin placed manually in ${nearest.taluka} (${formatCoordinates(newLat, newLng)})`);
  };


  // Image Upload handler
  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          setImageUrl(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Actual Complaint Submission execution
  const processComplaintSubmission = () => {
    const newId = generateComplaintId();
    const now = new Date().toISOString();

    const newComplaint: Complaint = {
      id: newId,
      title: title.trim(),
      description: description.trim(),
      category,
      predictedCategory: prediction.category,
      imageUrl,
      location: {
        taluka,
        landmark: landmark.trim() || `Near ${taluka} Municipal Link`,
        roadName: roadName.trim() || `${taluka} Main Road`,
        roadType,
        latitude,
        longitude,
      },
      status: 'pending',
      priority: priorityInfo.priority,
      priorityReason: priorityInfo.reason,
      citizenId: currentUser.id,
      citizenName: currentUser.name,
      citizenPhone: currentUser.phone || '+91 98000 00000',
      citizenEmail: currentUser.email,
      createdAt: now,
      updatedAt: now,
      notes: [
        {
          id: `note-${Date.now()}`,
          author: currentUser.name,
          authorRole: 'citizen',
          timestamp: now,
          text: `Grievance submitted by citizen with priority rating: ${priorityInfo.priority.toUpperCase()}. Pothole categorized as ${category}.${
            nearbyWarning ? ` [Citizen acknowledged nearby active complaint #${nearbyWarning.duplicate.id}]` : ''
          }`,
        },
      ],
      estimatedDays: priorityInfo.priority === 'high' ? 2 : priorityInfo.priority === 'medium' ? 4 : 7,
    };

    setShowDuplicateModal(false);
    setSubmittedComplaint(newComplaint);
  };

  // Submit Handler with Duplicate Interception
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) return;

    // If duplicate detected and not yet acknowledged, show duplicate warning dialog
    if (nearbyWarning && acknowledgedDuplicateId !== nearbyWarning.duplicate.id) {
      setShowDuplicateModal(true);
      return;
    }

    processComplaintSubmission();
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 sm:px-6">
      {/* Duplicate Warning Modal Interception */}
      {showDuplicateModal && nearbyWarning && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-amber-200 animate-in fade-in zoom-in-95 duration-200 text-left">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0 ring-4 ring-amber-50">
                <AlertTriangle className="w-6 h-6 text-amber-600" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 leading-tight">
                  Similar Complaint Already Exists Nearby
                </h3>
                <p className="text-xs text-slate-500">
                  Duplicate check detected an active grievance matching this category and location.
                </p>
              </div>
            </div>

            {/* Existing Complaint Summary Card */}
            <div className="p-4 bg-amber-50/90 rounded-xl border border-amber-300/80 mb-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-amber-900 uppercase tracking-wider">
                  Existing Complaint ID
                </span>
                <span className="font-mono text-xs font-black text-amber-950 bg-amber-200/80 px-2 py-0.5 rounded">
                  #{nearbyWarning.duplicate.id}
                </span>
              </div>

              <div className="text-xs font-semibold text-slate-800">
                {nearbyWarning.duplicate.title}
              </div>

              <div className="grid grid-cols-2 gap-2 text-[11px] pt-1 text-slate-700">
                <div>
                  <span className="text-slate-500 block">Category:</span>
                  <span className="font-bold text-slate-800">{nearbyWarning.duplicate.category}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Current Status:</span>
                  <span className="font-bold text-amber-800 uppercase">
                    {nearbyWarning.duplicate.status.replace('_', ' ')}
                  </span>
                </div>
                <div className="col-span-2">
                  <span className="text-slate-500 block">Reported Location:</span>
                  <span className="font-medium text-slate-800 truncate block">
                    📍 {nearbyWarning.duplicate.location.taluka} • {nearbyWarning.duplicate.location.landmark} ({nearbyWarning.distanceKm} km away)
                  </span>
                </div>
              </div>
            </div>

            <p className="text-xs text-slate-600 mb-5 leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-200">
              <Info className="w-3.5 h-3.5 inline text-blue-600 mr-1" />
              If this is the same road defect, municipal squads may already have it scheduled. If this is a separate pothole or new damage, you can continue to register your report.
            </p>

            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowDuplicateModal(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-xl border border-slate-300 transition-colors"
              >
                Review Form
              </button>
              <button
                type="button"
                id="btn-continue-duplicate-submit"
                onClick={() => {
                  setAcknowledgedDuplicateId(nearbyWarning.duplicate.id);
                  processComplaintSubmission();
                }}
                className="px-5 py-2 bg-blue-900 hover:bg-blue-800 text-white text-xs font-bold rounded-xl shadow-sm flex items-center gap-1.5 transition-all"
              >
                <span>Continue & Submit Anyway</span>
                <ArrowRight className="w-3.5 h-3.5 text-orange-400" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Modal Confirmation */}
      {submittedComplaint && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-200 text-center animate-in fade-in zoom-in-95 duration-200">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4 ring-8 ring-emerald-50">
              <CheckCircle2 className="w-9 h-9" />
            </div>

            <span className="inline-block px-3 py-1 bg-emerald-50 text-emerald-800 text-xs font-bold rounded-full mb-2 border border-emerald-200">
              Complaint Registered Successfully
            </span>

            <h3 className="text-xl font-bold text-slate-900 mb-1">
              Grievance Acknowledged by Govt. of Goa
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Your pothole grievance has been logged into the municipal workflow queue.
            </p>

            {/* Generated Unique ID Badge */}
            <div className="p-4 bg-blue-50/80 rounded-xl border border-blue-200 mb-5">
              <div className="text-[11px] font-bold text-blue-900 uppercase tracking-wider mb-1">
                {t.trackIdLabel}
              </div>
              <div className="text-2xl font-black text-blue-950 tracking-wider font-mono select-all">
                {submittedComplaint.id}
              </div>
              <div className="text-[11px] text-slate-600 mt-1">
                {t.currentStatus}: <span className="font-bold text-amber-700">{t.pending}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 text-left text-xs bg-slate-50 p-3 rounded-lg border border-slate-200 mb-5">
              <div>
                <span className="text-slate-500 block">{t.location}:</span>
                <span className="font-semibold text-slate-800 truncate block">
                  {submittedComplaint.location.taluka}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block">{t.priority}:</span>
                <span className="font-bold text-orange-600 uppercase">
                  {t[submittedComplaint.priority] || submittedComplaint.priority}
                </span>
              </div>
            </div>

            <button
              id="btn-track-submitted-complaint"
              onClick={() => onSubmitSuccess(submittedComplaint)}
              className="w-full py-3 bg-blue-900 hover:bg-blue-800 text-white font-bold rounded-xl shadow-sm flex items-center justify-center gap-2 text-sm transition-all"
            >
              <span>{t.inspect}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Page Header */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-blue-950 tracking-tight">
              {t.submitComplaint}
            </h1>
            <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-blue-100 text-blue-800">
              Form GRF-01
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {t.potholeGrievanceAppTitle} • PWD Goa
          </p>
        </div>

        <button
          type="button"
          onClick={onCancel}
          className="text-xs font-semibold text-slate-600 hover:text-slate-900 px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 self-start"
        >
          {t.cancel}
        </button>
      </div>

      {/* Main Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-5">
          {/* Section 1: Complaint Description */}
          <div>
            <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1.5">
              1. {t.title} <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="input-complaint-title"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={t.titlePlaceholder}
              className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-900 placeholder:text-slate-400"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1.5">
              2. {t.description} <span className="text-red-500">*</span>
            </label>
            <textarea
              id="input-complaint-desc"
              required
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t.descriptionPlaceholder}
              className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-900 placeholder:text-slate-400"
            />
          </div>

          {/* Smart Feature 1: Keyword Category Predictor */}
          <div className="p-3.5 rounded-xl bg-blue-50/70 border border-blue-200/80">
            <div className="flex items-center justify-between gap-2 mb-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-blue-950">
                <Sparkles className="w-4 h-4 text-orange-500" />
                <span>Smart Category Prediction</span>
              </div>
              <span className="text-[11px] font-semibold text-blue-700 bg-blue-100/70 px-2 py-0.5 rounded-full">
                Confidence: {prediction.confidence}%
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-700">
              <span>{t.predictedCategoryNotice}</span>
              <span className="font-bold px-2.5 py-1 bg-white text-blue-900 border border-blue-300 rounded-md shadow-2xs">
                {prediction.category}
              </span>
              {prediction.matchedKeywords.length > 0 && (
                <span className="text-[11px] text-slate-500">
                  (Matched words: {prediction.matchedKeywords.join(', ')})
                </span>
              )}
            </div>
          </div>

          {/* Category Selector (Citizen can confirm or change) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1.5">
                3. {t.category}
              </label>
              <select
                id="select-category"
                value={category}
                onChange={(e) => {
                  setCategory(e.target.value as ComplaintCategory);
                  setUserOverrodeCategory(true);
                }}
                className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-900 bg-white font-medium text-slate-800"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1.5">
                4. {t.roadType}
              </label>
              <select
                id="select-road-type"
                value={roadType}
                onChange={(e) => setRoadType(e.target.value as RoadType)}
                className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-900 bg-white font-medium text-slate-800"
              >
                {ROAD_TYPES.map((rt) => (
                  <option key={rt} value={rt}>
                    {rt}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Smart Feature 2: Priority Engine Preview */}
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-slate-600" />
              <div>
                <span className="text-slate-500">{t.priority}: </span>
                <span
                  className={`font-black uppercase px-2 py-0.5 rounded text-[11px] ${
                    priorityInfo.priority === 'high'
                      ? 'bg-red-100 text-red-700 border border-red-200'
                      : priorityInfo.priority === 'medium'
                      ? 'bg-amber-100 text-amber-800 border border-amber-200'
                      : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                  }`}
                >
                  {t[priorityInfo.priority] || priorityInfo.priority}
                </span>
              </div>
            </div>
            <div className="text-[11px] text-slate-500 hidden md:block italic">
              {priorityInfo.reason}
            </div>
          </div>

          {/* Section 2: Location Details */}
          <div className="pt-3 border-t border-slate-200 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
                  5. {t.location} & {t.taluka} <span className="text-red-500">*</span>
                </label>
                <span className="text-[11px] text-slate-500">
                  Select your Goa Taluka or use device GPS to pin the defect accurately.
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  id="btn-fetch-gps"
                  onClick={handleFetchGPS}
                  disabled={gpsFetching}
                  className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg border shadow-2xs transition-all ${
                    gpsFetching
                      ? 'bg-blue-100 text-blue-900 border-blue-300 animate-pulse cursor-wait'
                      : 'bg-blue-900 text-white hover:bg-blue-800 border-blue-950 active:scale-95'
                  }`}
                >
                  {gpsFetching ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin text-orange-400" />
                  ) : (
                    <LocateFixed className="w-3.5 h-3.5 text-orange-400" />
                  )}
                  <span>{gpsFetching ? (t.fetchingGps || 'Locating GPS...') : (t.useCurrentLocation || 'Detect GPS Location')}</span>
                </button>

                <button
                  type="button"
                  id="btn-toggle-manual-coords"
                  onClick={() => setShowManualCoords((prev) => !prev)}
                  className="text-[11px] font-semibold text-slate-600 hover:text-slate-900 px-2.5 py-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100"
                >
                  {showManualCoords ? 'Hide Lat/Lng' : 'Manual Lat/Lng'}
                </button>
              </div>
            </div>

            {/* GPS Feedback & Confirmation Banner */}
            {gpsState !== 'idle' && (
              <div
                className={`p-3 rounded-xl border text-xs flex items-start gap-2.5 transition-all ${
                  gpsState === 'locating'
                    ? 'bg-blue-50/90 border-blue-200 text-blue-900'
                    : gpsState === 'success'
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
                    : 'bg-amber-50 border-amber-300 text-amber-950'
                }`}
              >
                {gpsState === 'locating' ? (
                  <RefreshCw className="w-4 h-4 text-blue-600 animate-spin shrink-0 mt-0.5" />
                ) : gpsState === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                ) : (
                  <MapPin className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                )}
                <div className="flex-1 space-y-0.5">
                  <div className="font-bold flex items-center justify-between">
                    <span>
                      {gpsState === 'locating'
                        ? 'Acquiring GPS Fix...'
                        : gpsState === 'success'
                        ? 'Location Locked & Verified'
                        : 'Location Set (Civic Default)'}
                    </span>
                    <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-white/80 border border-slate-200">
                      {formatCoordinates(latitude, longitude)}
                    </span>
                  </div>
                  <p className="text-[11px] opacity-90 leading-tight">
                    {gpsMessage || (t.gpsSuccess || 'GPS coordinates locked successfully.')}
                  </p>
                </div>
              </div>
            )}

            {/* Quick Taluka Selector Chips */}
            <div className="space-y-1.5">
              <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block">
                Quick Select Goa Taluka:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {TALUKAS.map((tk) => {
                  const isSelected = taluka === tk;
                  const shortName = tk.split(' ')[0];
                  return (
                    <button
                      key={tk}
                      type="button"
                      id={`chip-taluka-${shortName.toLowerCase()}`}
                      onClick={() => handleTalukaSelect(tk)}
                      className={`px-2.5 py-1 rounded-md text-xs font-semibold border transition-all ${
                        isSelected
                          ? 'bg-blue-900 text-white border-blue-950 shadow-2xs'
                          : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                      }`}
                    >
                      📍 {shortName}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Interactive Goa Mini-Map Pin Dropper */}
            <div className="rounded-xl border border-slate-200 overflow-hidden bg-slate-950 p-3 space-y-2 text-white">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5 text-orange-400 font-bold">
                  <Crosshair className="w-3.5 h-3.5" />
                  <span>Interactive Goa Pin Dropper</span>
                </div>
                <span className="text-[10px] text-slate-400">
                  Tap or click map to drop pin
                </span>
              </div>

              {/* Clickable Vector Map Area */}
              <div
                id="interactive-mini-map-container"
                onClick={handleMiniMapClick}
                className="relative w-full h-36 bg-slate-900 rounded-lg border border-slate-800 cursor-crosshair overflow-hidden select-none hover:border-slate-700 transition-colors"
                title="Click anywhere to place pothole pin"
              >
                {/* Background Grid */}
                <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:12px_12px]" />

                {/* Coastal & Ghats hints */}
                <span className="absolute left-2 top-2 text-[9px] font-bold text-cyan-400/40 uppercase">
                  Arabian Sea (West)
                </span>
                <span className="absolute right-2 bottom-2 text-[9px] font-bold text-emerald-400/40 uppercase">
                  Ghats (East)
                </span>

                {/* Taluka Anchor dots */}
                {[
                  { name: 'Pernem', lat: 15.7171, lng: 73.7947 },
                  { name: 'Mapusa', lat: 15.5937, lng: 73.8142 },
                  { name: 'Panaji', lat: 15.4989, lng: 73.8278 },
                  { name: 'Vasco', lat: 15.3982, lng: 73.8113 },
                  { name: 'Ponda', lat: 15.4026, lng: 74.0086 },
                  { name: 'Margao', lat: 15.2736, lng: 73.958 },
                  { name: 'Curchorem', lat: 15.2603, lng: 74.1084 },
                ].map((pt) => {
                  const minLat = 14.95;
                  const maxLat = 15.75;
                  const minLng = 73.65;
                  const maxLng = 74.25;
                  const x = ((pt.lng - minLng) / (maxLng - minLng)) * 100;
                  const y = 100 - ((pt.lat - minLat) / (maxLat - minLat)) * 100;

                  return (
                    <div
                      key={pt.name}
                      style={{ left: `${Math.max(5, Math.min(95, x))}%`, top: `${Math.max(5, Math.min(95, y))}%` }}
                      className="absolute -translate-x-1/2 -translate-y-1/2 flex items-center gap-1 pointer-events-none opacity-50"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                      <span className="text-[9px] text-slate-400 font-medium">{pt.name}</span>
                    </div>
                  );
                })}

                {/* Active Pothole Pin Marker */}
                {(() => {
                  const minLat = 14.95;
                  const maxLat = 15.75;
                  const minLng = 73.65;
                  const maxLng = 74.25;
                  const pinX = Math.max(5, Math.min(95, ((longitude - minLng) / (maxLng - minLng)) * 100));
                  const pinY = Math.max(5, Math.min(95, 100 - ((latitude - minLat) / (maxLat - minLat)) * 100));

                  return (
                    <div
                      id="active-dropped-pin"
                      style={{ left: `${pinX}%`, top: `${pinY}%` }}
                      className="absolute -translate-x-1/2 -translate-y-1/2 pointer-events-none z-10"
                    >
                      <span className="absolute -inset-2 bg-orange-500/30 rounded-full animate-ping" />
                      <div className="w-6 h-6 rounded-full bg-orange-600 text-white flex items-center justify-center shadow-lg border-2 border-white">
                        <MapPin className="w-3.5 h-3.5 fill-current" />
                      </div>
                      <span className="absolute left-1/2 -translate-x-1/2 top-7 whitespace-nowrap px-1.5 py-0.5 bg-slate-900/90 text-white font-mono text-[9px] rounded border border-slate-700 shadow-md">
                        {latitude.toFixed(4)}°, {longitude.toFixed(4)}°
                      </span>
                    </div>
                  );
                })()}
              </div>

              {/* Coordinates status footer */}
              <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-300 pt-1">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Pinned in <strong>{taluka}</strong></span>
                </div>
                <span className="font-mono text-slate-400">
                  {formatCoordinates(latitude, longitude)}
                </span>
              </div>
            </div>

            {/* Manual Lat/Long Input Expansion */}
            {showManualCoords && (
              <div className="p-3 bg-slate-100 rounded-xl border border-slate-300 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Latitude (° N)
                  </label>
                  <input
                    type="number"
                    step="0.0001"
                    value={latitude}
                    onChange={(e) => setLatitude(parseFloat(e.target.value) || 15.4989)}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300 bg-white font-mono text-xs font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Longitude (° E)
                  </label>
                  <input
                    type="number"
                    step="0.0001"
                    value={longitude}
                    onChange={(e) => setLongitude(parseFloat(e.target.value) || 73.8278)}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300 bg-white font-mono text-xs font-semibold"
                  />
                </div>
              </div>
            )}

            {/* Taluka Dropdown & Road Name Inputs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  {t.taluka} <span className="text-red-500">*</span>
                </label>
                <select
                  id="select-taluka"
                  value={taluka}
                  onChange={(e) => handleTalukaSelect(e.target.value as GoaTaluka)}
                  className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-900 bg-white font-medium text-slate-800"
                >
                  {TALUKAS.map((tk) => (
                    <option key={tk} value={tk}>
                      {tk}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  {t.roadName}
                </label>
                <input
                  type="text"
                  id="input-road-name"
                  value={roadName}
                  onChange={(e) => setRoadName(e.target.value)}
                  placeholder="e.g., 18th June Road / Miramar Beach Link"
                  className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-900"
                />
              </div>
            </div>

            {/* Landmark Input & Preset Road Suggestions */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-[11px] font-semibold text-slate-600">
                  {t.landmark} <span className="text-red-500">*</span>
                </label>
                {GOA_TALUKA_COORDINATES[taluka]?.defaultRoads && (
                  <span className="text-[10px] text-slate-400">
                    Suggestions for {taluka.split(' ')[0]}:
                  </span>
                )}
              </div>

              <input
                type="text"
                id="input-landmark"
                required
                value={landmark}
                onChange={(e) => setLandmark(e.target.value)}
                placeholder={t.landmarkPlaceholder}
                className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-900"
              />

              {/* Road / Landmark Quick Suggestions */}
              {GOA_TALUKA_COORDINATES[taluka]?.defaultRoads && (
                <div className="flex flex-wrap items-center gap-1.5 mt-2">
                  <span className="text-[10px] text-slate-500 font-medium">Quick Fill:</span>
                  {GOA_TALUKA_COORDINATES[taluka].defaultRoads.map((rd) => (
                    <button
                      key={rd}
                      type="button"
                      onClick={() => {
                        setRoadName(rd);
                        if (!landmark.trim()) setLandmark(`Near ${rd} Circle`);
                      }}
                      className="text-[10px] bg-blue-50 hover:bg-blue-100 text-blue-900 font-medium px-2 py-0.5 rounded border border-blue-200 transition-colors"
                    >
                      + {rd}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Smart Feature 3: Nearby Duplicate Warning */}
          {nearbyWarning && (
            <div
              id="nearby-duplicate-warning-banner"
              className="p-4 rounded-xl bg-amber-50 border-2 border-amber-300 text-amber-900 animate-in fade-in"
            >
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-amber-900">
                      {t.nearbyWarningTitle}
                    </h4>
                    <span className="font-mono text-[11px] font-black bg-amber-200 text-amber-950 px-1.5 py-0.5 rounded">
                      ID: #{nearbyWarning.duplicate.id}
                    </span>
                  </div>
                  <p className="text-xs text-amber-800">
                    {nearbyWarning.matchReason} (Approx. {nearbyWarning.distanceKm} km away).
                  </p>
                  <div className="flex flex-wrap items-center gap-2 text-[11px] text-amber-700 pt-0.5">
                    <span>{t.category}: <strong className="text-amber-900">{nearbyWarning.duplicate.category}</strong></span>
                    <span>•</span>
                    <span>{t.currentStatus}: <strong className="text-amber-900 uppercase">{t[nearbyWarning.duplicate.status] || nearbyWarning.duplicate.status}</strong></span>
                  </div>
                  <p className="text-[11px] text-amber-700/90 italic pt-1">
                    {t.duplicateNotice}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Section 3: Photo Upload & Live Camera Capture */}
          <div className="pt-3 border-t border-slate-200 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
                  6. {t.uploadPhoto} <span className="text-red-500">*</span>
                </label>
                <span className="text-[11px] text-slate-500">
                  Take a photo directly with your camera or upload from your device gallery.
                </span>
              </div>

              {/* Primary Camera Action Button */}
              <button
                type="button"
                id="btn-open-live-camera"
                onClick={() => setIsCameraOpen(true)}
                className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs rounded-xl shadow-md shadow-orange-600/20 active:scale-95 transition-all"
              >
                <Camera className="w-4 h-4" />
                <span>{t.takePhotoWithCamera || 'Take Photo with Camera'}</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-start">
              {/* Preview image */}
              <div className="relative rounded-2xl overflow-hidden border-2 border-slate-200 bg-slate-900 aspect-video max-h-52 flex items-center justify-center shadow-xs group">
                <img
                  src={imageUrl}
                  alt="Pothole preview"
                  className="w-full h-full object-cover"
                />
                
                {/* Badges on image */}
                <div className="absolute top-2 left-2 flex flex-col gap-1">
                  <span className="px-2 py-0.5 bg-black/75 text-white text-[10px] rounded-md font-semibold backdrop-blur-xs flex items-center gap-1">
                    {isPhotoFromCamera ? (
                      <>
                        <Camera className="w-3 h-3 text-orange-400" />
                        <span>Live Camera Snapshot</span>
                      </>
                    ) : (
                      <>
                        <Upload className="w-3 h-3 text-cyan-400" />
                        <span>Attached Photo</span>
                      </>
                    )}
                  </span>
                </div>

                <div className="absolute bottom-2 right-2 flex items-center gap-1.5 opacity-90 group-hover:opacity-100 transition-opacity">
                  <button
                    type="button"
                    onClick={() => setIsCameraOpen(true)}
                    className="px-2.5 py-1 bg-black/80 hover:bg-orange-600 text-white text-[11px] font-bold rounded-lg backdrop-blur-xs border border-white/20 flex items-center gap-1 shadow transition-colors"
                  >
                    <Camera className="w-3 h-3" />
                    <span>Retake</span>
                  </button>
                </div>
              </div>

              {/* Upload controls & Sample selector */}
              <div className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {/* Camera Launcher Card */}
                  <button
                    type="button"
                    id="card-launch-camera"
                    onClick={() => setIsCameraOpen(true)}
                    className="flex flex-col items-center justify-center p-3.5 rounded-xl border-2 border-dashed border-orange-300 hover:border-orange-500 bg-orange-50/60 hover:bg-orange-50 text-orange-950 transition-all text-center group cursor-pointer"
                  >
                    <div className="w-8 h-8 rounded-full bg-orange-600 text-white flex items-center justify-center mb-1 shadow-sm group-hover:scale-110 transition-transform">
                      <Camera className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-bold text-orange-950">
                      {t.takePhotoWithCamera || 'Use Live Camera'}
                    </span>
                    <span className="text-[10px] text-orange-800/80 mt-0.5">
                      Geo-tag & timestamp stamp
                    </span>
                  </button>

                  {/* File Upload Card */}
                  <label className="flex flex-col items-center justify-center p-3.5 rounded-xl border-2 border-dashed border-slate-300 hover:border-blue-700 bg-slate-50 hover:bg-blue-50/40 text-slate-800 transition-all text-center cursor-pointer group">
                    <div className="w-8 h-8 rounded-full bg-slate-200 group-hover:bg-blue-100 text-slate-700 group-hover:text-blue-900 flex items-center justify-center mb-1 transition-colors">
                      <Upload className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-bold text-slate-700 group-hover:text-blue-900">
                      {t.uploadPhoto}
                    </span>
                    <span className="text-[10px] text-slate-400 mt-0.5">
                      Gallery / Files (JPG, PNG)
                    </span>
                    <input
                      type="file"
                      id="input-file-photo"
                      accept="image/*"
                      onChange={(e) => {
                        handleImageFileChange(e);
                        setIsPhotoFromCamera(false);
                      }}
                      className="hidden"
                    />
                  </label>
                </div>

                {/* Quick Presets for Demo */}
                <div className="pt-1">
                  <span className="text-[11px] font-bold text-slate-600 block mb-1.5">
                    Or select sample test pothole:
                  </span>
                  <div className="grid grid-cols-2 gap-1.5">
                    {SAMPLE_POTHOLE_IMAGES.map((img, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          setImageUrl(img.url);
                          setIsPhotoFromCamera(false);
                        }}
                        className={`px-2 py-1.5 rounded-lg text-[10px] font-medium border text-left truncate transition-all ${
                          imageUrl === img.url
                            ? 'bg-blue-900 text-white border-blue-900'
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {img.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Submit Actions */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onCancel}
            className="px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 rounded-xl transition-colors border border-slate-300"
          >
            {t.cancel}
          </button>

          <button
            type="submit"
            id="btn-submit-complaint"
            className="px-6 py-2.5 bg-blue-900 hover:bg-blue-800 text-white text-sm font-bold rounded-xl shadow-md flex items-center gap-2 transition-all hover:gap-3"
          >
            <span>{t.submitButton}</span>
            <ArrowRight className="w-4 h-4 text-orange-400" />
          </button>
        </div>
      </form>

      {/* Live Camera Viewfinder & Geo-Tagging Modal */}
      <CameraCaptureModal
        isOpen={isCameraOpen}
        onClose={() => setIsCameraOpen(false)}
        onCapture={(dataUrl) => {
          setImageUrl(dataUrl);
          setIsPhotoFromCamera(true);
        }}
        taluka={taluka}
        landmark={landmark || roadName}
        latitude={latitude}
        longitude={longitude}
        language={language}
      />
    </div>
  );
};
