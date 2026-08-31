import React, { useState } from 'react';
import {
  ArrowLeft,
  MapPin,
  Calendar,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Send,
  HardHat,
  User,
  Shield,
  FileCheck2,
  Building,
  Upload,
  Camera,
  Layers,
  Sparkles,
  Star,
  MessageSquare,
} from 'lucide-react';
import {
  Complaint,
  ComplaintFeedback,
  ComplaintPriority,
  ComplaintStatus,
  Language,
  User as UserType,
} from '../types';
import { translations } from '../utils/translations';
import { PWD_DIVISIONS, SAMPLE_POTHOLE_IMAGES } from '../data/sampleData';
import { CameraCaptureModal } from './CameraCaptureModal';
import {
  insertFeedbackToSupabase,
  insertStatusUpdateToSupabase,
  updateComplaintInSupabase,
} from '../services/supabaseService';

interface ComplaintDetailsProps {
  complaint: Complaint;
  currentUser: UserType;
  onBack: () => void;
  onUpdateComplaint: (updated: Complaint) => void;
  language: Language;
}

export const ComplaintDetails: React.FC<ComplaintDetailsProps> = ({
  complaint,
  currentUser,
  onBack,
  onUpdateComplaint,
  language,
}) => {
  const t = translations[language];

  // Officer Action Form States
  const [selectedStatus, setSelectedStatus] = useState<ComplaintStatus>(complaint.status);
  const [selectedDivision, setSelectedDivision] = useState<string>(
    complaint.assignedTo?.division || PWD_DIVISIONS[0]
  );
  const [officerName, setOfficerName] = useState<string>(
    complaint.assignedTo?.officerName || 'Assistant Engineer (PWD)'
  );
  const [contractorTeam, setContractorTeam] = useState<string>(
    complaint.assignedTo?.contractorTeam || 'Rapid Patch Squad 1'
  );
  const [newNoteText, setNewNoteText] = useState('');
  const [resolutionNotes, setResolutionNotes] = useState(complaint.resolutionNotes || '');
  const [resolutionPhotoUrl, setResolutionPhotoUrl] = useState(
    complaint.resolutionPhotoUrl ||
      'https://images.unsplash.com/photo-1590496793929-36417d3117de?auto=format&fit=crop&w=800&q=80'
  );
  const [isResolutionCameraOpen, setIsResolutionCameraOpen] = useState(false);
  const [statusSuccessMessage, setStatusSuccessMessage] = useState('');

  // Citizen Feedback Form States
  const [rating, setRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [feedbackComment, setFeedbackComment] = useState('');
  const [feedbackSuccessMessage, setFeedbackSuccessMessage] = useState('');

  const isOfficer = currentUser.role === 'officer';

  // Handle Note Submission
  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoteText.trim()) return;

    const newNote = {
      id: `note-${Date.now()}`,
      author: currentUser.name,
      authorRole: currentUser.role,
      timestamp: new Date().toISOString(),
      text: newNoteText.trim(),
    };

    const updated: Complaint = {
      ...complaint,
      notes: [...complaint.notes, newNote],
      updatedAt: new Date().toISOString(),
    };

    onUpdateComplaint(updated);
    setNewNoteText('');

    // Sync to Supabase
    await insertStatusUpdateToSupabase(complaint.id, newNote);
  };

  // Handle Citizen Feedback Submission
  const handleFeedbackSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newFeedback: ComplaintFeedback = {
      id: `fb-${Date.now()}`,
      complaintId: complaint.id,
      citizenId: currentUser.id,
      citizenName: currentUser.name,
      rating,
      comment: feedbackComment.trim() || undefined,
      createdAt: new Date().toISOString(),
    };

    const updatedFeedbacks = [newFeedback, ...(complaint.feedbacks || [])];
    const updated: Complaint = {
      ...complaint,
      feedbacks: updatedFeedbacks,
    };

    onUpdateComplaint(updated);
    setFeedbackComment('');
    setFeedbackSuccessMessage('Thank you! Feedback recorded in database.');
    setTimeout(() => setFeedbackSuccessMessage(''), 4000);

    // Sync to Supabase table
    await insertFeedbackToSupabase(newFeedback);
  };

  // Handle Officer Status & Assignment Save
  const handleOfficerSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const now = new Date().toISOString();

    const isNowResolved = selectedStatus === 'resolved';

    const systemNote = {
      id: `note-${Date.now()}`,
      author: currentUser.name,
      authorRole: 'officer' as const,
      timestamp: now,
      text: isNowResolved
        ? `Marked as RESOLVED by ${currentUser.name}. Repair Notes: ${resolutionNotes || 'Road surface restored to standard specifications.'}`
        : `Status updated to ${selectedStatus.toUpperCase()} by ${currentUser.name}. Assigned to: ${selectedDivision}.`,
    };

    const updated: Complaint = {
      ...complaint,
      status: selectedStatus,
      assignedTo: {
        division: selectedDivision,
        officerName: officerName || currentUser.name,
        assignedDate: complaint.assignedTo?.assignedDate || now.split('T')[0],
        contractorTeam,
      },
      updatedAt: now,
      resolvedAt: isNowResolved ? now : complaint.resolvedAt,
      resolutionNotes: isNowResolved ? resolutionNotes : complaint.resolutionNotes,
      resolutionPhotoUrl: isNowResolved ? resolutionPhotoUrl : complaint.resolutionPhotoUrl,
      notes: [...complaint.notes, systemNote],
    };

    onUpdateComplaint(updated);
    setStatusSuccessMessage('Status & Assignment updated in database successfully.');
    setTimeout(() => setStatusSuccessMessage(''), 4000);

    // Sync to Supabase
    await updateComplaintInSupabase(updated);
    await insertStatusUpdateToSupabase(complaint.id, systemNote, selectedStatus);
  };

  const getStatusBadge = (status: ComplaintStatus) => {
    switch (status) {
      case 'pending':
        return (
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300">
            {t.pending}
          </span>
        );
      case 'assigned':
        return (
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-900 border border-blue-300">
            {t.assigned}
          </span>
        );
      case 'in_progress':
        return (
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-indigo-100 text-indigo-900 border border-indigo-300 animate-pulse">
            {t.in_progress}
          </span>
        );
      case 'resolved':
        return (
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-900 border border-emerald-300 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
            {t.resolved}
          </span>
        );
    }
  };

  // Stepper state
  const currentStep =
    complaint.status === 'resolved'
      ? 4
      : complaint.status === 'in_progress'
      ? 3
      : complaint.status === 'assigned'
      ? 2
      : 1;

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto space-y-6">
      {/* Top Header / Back Nav */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <button
          type="button"
          id="btn-back-to-dashboard"
          onClick={onBack}
          className="flex items-center gap-2 text-xs font-bold text-slate-700 hover:text-blue-900 bg-white px-3 py-2 rounded-lg border border-slate-200 shadow-2xs hover:bg-slate-50 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{t.backToDashboard}</span>
        </button>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 font-mono">{t.complaintId}:</span>
          <span className="px-2.5 py-1 bg-blue-900 text-white font-mono font-bold text-xs rounded-lg shadow-2xs">
            {complaint.id}
          </span>
        </div>
      </div>

      {/* Main Status & Hero Card */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-200">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              {getStatusBadge(complaint.status)}
              <span
                className={`px-2.5 py-0.5 rounded text-[11px] font-bold uppercase ${
                  complaint.priority === 'high'
                    ? 'bg-red-100 text-red-800'
                    : complaint.priority === 'medium'
                    ? 'bg-amber-100 text-amber-800'
                    : 'bg-emerald-100 text-emerald-800'
                }`}
              >
                {t[complaint.priority] || complaint.priority} {t.priority}
              </span>
              <span className="px-2.5 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-700">
                {complaint.category}
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              {complaint.title}
            </h1>
            <p className="text-xs text-slate-500 mt-1 flex items-center gap-2">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <span>
                {new Date(complaint.createdAt).toLocaleDateString('en-IN', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </span>
            </p>
          </div>

          {/* Citizen Reporter Info Pill */}
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs shrink-0">
            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              {t.citizen}
            </div>
            <div className="font-bold text-slate-900">{complaint.citizenName}</div>
            <div className="text-slate-500 text-[11px]">{complaint.citizenPhone}</div>
          </div>
        </div>

        {/* 4-Step Visual Progress Stepper */}
        <div>
          <div className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">
            {t.lifecycleTitle}
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4 relative">
            {[
              { step: 1, title: `1. ${t.submitted}`, sub: t.pending },
              { step: 2, title: `2. ${t.assigned}`, sub: t.assignDivision },
              { step: 3, title: `3. ${t.in_progress}`, sub: t.workOrdersActive },
              { step: 4, title: `4. ${t.resolved}`, sub: t.resolvedNotice },
            ].map((st) => {
              const isDone = currentStep >= st.step;
              const isCurrent = currentStep === st.step;

              return (
                <div
                  key={st.step}
                  className={`p-3 rounded-xl border transition-all ${
                    isCurrent
                      ? 'bg-blue-50/80 border-blue-600 ring-2 ring-blue-600/20'
                      : isDone
                      ? 'bg-emerald-50/60 border-emerald-300'
                      : 'bg-slate-50 border-slate-200 opacity-60'
                  }`}
                >
                  <div className="flex items-center gap-1.5 mb-1">
                    <div
                      className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold ${
                        isDone ? 'bg-emerald-600 text-white' : 'bg-slate-300 text-slate-700'
                      }`}
                    >
                      {isDone ? '✓' : st.step}
                    </div>
                    <span className="text-xs font-bold text-slate-800">{st.title}</span>
                  </div>
                  <div className="text-[10px] text-slate-500 truncate">{st.sub}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Grid: Left Details & Right Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Photos & Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Photo & Resolution Comparison */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              {t.photoEvidence}
            </h3>

            <div
              className={`grid gap-4 ${
                complaint.status === 'resolved' && complaint.resolutionPhotoUrl
                  ? 'grid-cols-1 sm:grid-cols-2'
                  : 'grid-cols-1'
              }`}
            >
              {/* Original Citizen Photo */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                  <span>{t.reportedDefectBefore}</span>
                  <span className="text-[10px] text-red-600 bg-red-50 px-2 py-0.5 rounded border border-red-200">
                    {t.defectIdentified}
                  </span>
                </div>
                <div className="rounded-xl overflow-hidden bg-slate-100 border border-slate-300 aspect-video relative group">
                  <img
                    src={complaint.imageUrl}
                    alt="Reported pothole defect"
                    className="w-full h-full object-cover"
                  />
                  <span className="absolute bottom-2 left-2 px-2 py-0.5 bg-black/70 text-white text-[10px] rounded backdrop-blur-xs font-mono">
                    {complaint.location.taluka}
                  </span>
                </div>
              </div>

              {/* Resolution After Photo */}
              {complaint.status === 'resolved' && complaint.resolutionPhotoUrl && (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                    <span>{t.municipalRepairAfter}</span>
                    <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-300">
                      {t.workCompleted}
                    </span>
                  </div>
                  <div className="rounded-xl overflow-hidden bg-slate-100 border border-emerald-300 aspect-video relative group">
                    <img
                      src={complaint.resolutionPhotoUrl}
                      alt="Resolved pothole"
                      className="w-full h-full object-cover"
                    />
                    <span className="absolute bottom-2 left-2 px-2 py-0.5 bg-emerald-950/80 text-emerald-300 text-[10px] rounded backdrop-blur-xs font-mono">
                      {complaint.assignedTo?.division || 'PWD Squad'}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Description Text */}
            <div className="pt-3 border-t border-slate-100">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                {t.citizenStatement}
              </h4>
              <p className="text-sm text-slate-700 leading-relaxed bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                "{complaint.description}"
              </p>
            </div>

            {/* Resolution Notes (if resolved) */}
            {complaint.status === 'resolved' && complaint.resolutionNotes && (
              <div className="p-3.5 bg-emerald-50 rounded-xl border border-emerald-200">
                <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-900 mb-1">
                  <FileCheck2 className="w-4 h-4 text-emerald-700" />
                  <span>{t.officialResolution}</span>
                </div>
                <p className="text-xs text-emerald-800">{complaint.resolutionNotes}</p>
                {complaint.resolvedAt && (
                  <div className="text-[11px] text-emerald-700 font-semibold mt-1">
                    {t.resolved}: {new Date(complaint.resolvedAt).toLocaleDateString('en-IN')}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Location & GPS Info */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <MapPin className="w-4 h-4 text-orange-500" />
              <span>{t.locationDetails}</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-slate-500 block">{t.taluka}</span>
                <span className="font-bold text-slate-900 text-sm">{complaint.location.taluka}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-slate-500 block">{t.roadType}</span>
                <span className="font-bold text-slate-900 text-sm">{complaint.location.roadType}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-slate-500 block">{t.roadName}</span>
                <span className="font-bold text-slate-900">{complaint.location.roadName}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-slate-500 block">{t.landmark}</span>
                <span className="font-bold text-slate-900">{complaint.location.landmark}</span>
              </div>
            </div>

            <div className="p-3 bg-slate-100 rounded-xl flex items-center justify-between text-xs font-mono">
              <span className="text-slate-600">Geo-Coordinates (WGS84):</span>
              <span className="font-bold text-slate-900">
                {complaint.location.latitude.toFixed(5)}° N, {complaint.location.longitude.toFixed(5)}° E
              </span>
            </div>
          </div>

          {/* Citizen Feedback & Reviews Section (Table: feedback) */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                <span>Citizen Feedback & Quality Rating</span>
              </h3>
              <span className="text-xs font-bold text-slate-500">
                {(complaint.feedbacks || []).length} Reviews
              </span>
            </div>

            {feedbackSuccessMessage && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 font-semibold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>{feedbackSuccessMessage}</span>
              </div>
            )}

            {/* Leave a review if citizen */}
            {!isOfficer && (
              <form onSubmit={handleFeedbackSubmit} className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                <div className="text-xs font-bold text-slate-800">
                  Rate the repair resolution & response quality:
                </div>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      className="p-1 text-amber-400 hover:scale-110 transition-transform"
                    >
                      <Star
                        className={`w-6 h-6 ${
                          (hoverRating || rating) >= star
                            ? 'fill-amber-400 text-amber-500'
                            : 'text-slate-300'
                        }`}
                      />
                    </button>
                  ))}
                  <span className="text-xs font-bold text-slate-600 ml-2">
                    {rating} / 5 Stars
                  </span>
                </div>

                <div>
                  <textarea
                    rows={2}
                    value={feedbackComment}
                    onChange={(e) => setFeedbackComment(e.target.value)}
                    placeholder="Share feedback on road surface smoothness, repair speed, or squad responsiveness..."
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-900 bg-white"
                  />
                </div>

                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-900 hover:bg-blue-800 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-2xs"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Submit Citizen Feedback</span>
                </button>
              </form>
            )}

            {/* Feedback List */}
            <div className="space-y-2.5">
              {(complaint.feedbacks || []).length === 0 ? (
                <div className="text-xs text-slate-400 italic py-2">
                  No citizen reviews submitted yet for this grievance.
                </div>
              ) : (
                complaint.feedbacks?.map((fb) => (
                  <div key={fb.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 font-bold text-slate-800">
                        <span>{fb.citizenName}</span>
                        <div className="flex items-center">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <Star
                              key={s}
                              className={`w-3 h-3 ${
                                fb.rating >= s
                                  ? 'fill-amber-400 text-amber-500'
                                  : 'text-slate-200'
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                      <span className="text-[10px] text-slate-400">
                        {new Date(fb.createdAt).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                        })}
                      </span>
                    </div>
                    {fb.comment && <p className="text-slate-600">{fb.comment}</p>}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Actions & Communication Log */}
        <div className="space-y-6">
          {/* Officer Action Card (Only visible to Officers) */}
          {isOfficer ? (
            <div className="bg-white p-6 rounded-2xl border-2 border-orange-400/80 shadow-md space-y-4">
              <div className="flex items-center gap-2 text-orange-950 font-bold text-sm uppercase tracking-wider pb-2 border-b border-orange-100">
                <HardHat className="w-5 h-5 text-orange-600" />
                <span>{t.officerDeskTitle}</span>
              </div>

              {statusSuccessMessage && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800 font-semibold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>{statusSuccessMessage}</span>
                </div>
              )}

              <form onSubmit={handleOfficerSave} className="space-y-3 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">{t.updateStatus}</label>
                  <select
                    id="select-officer-status"
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value as ComplaintStatus)}
                    className="w-full px-3 py-2 text-xs font-bold rounded-lg border border-slate-300 focus:ring-2 focus:ring-orange-500 bg-white"
                  >
                    <option value="pending">{t.pending}</option>
                    <option value="assigned">{t.assigned}</option>
                    <option value="in_progress">{t.in_progress}</option>
                    <option value="resolved">{t.resolved}</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">{t.assignDivision}</label>
                  <select
                    id="select-assigned-division"
                    value={selectedDivision}
                    onChange={(e) => setSelectedDivision(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-orange-500 bg-white"
                  >
                    {PWD_DIVISIONS.map((div) => (
                      <option key={div} value={div}>
                        {div}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Nodal Officer Name</label>
                  <input
                    type="text"
                    id="input-officer-name"
                    value={officerName}
                    onChange={(e) => setOfficerName(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-orange-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Contractor / Repair Team</label>
                  <input
                    type="text"
                    id="input-contractor-team"
                    value={contractorTeam}
                    onChange={(e) => setContractorTeam(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-orange-500"
                  />
                </div>

                {/* If marking resolved, prompt for resolution notes & photo */}
                {selectedStatus === 'resolved' && (
                  <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 space-y-2 mt-2">
                    <div className="font-bold text-emerald-950 flex items-center gap-1.5">
                      <FileCheck2 className="w-4 h-4 text-emerald-700" />
                      <span>{t.workCompleted}</span>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-emerald-900 mb-1">
                        Resolution Notes / Work Specification
                      </label>
                      <textarea
                        rows={2}
                        id="input-resolution-notes"
                        value={resolutionNotes}
                        onChange={(e) => setResolutionNotes(e.target.value)}
                        placeholder="e.g., Filled with Bituminous Hot-Mix and compacted with 8-ton roller."
                        className="w-full px-2.5 py-1.5 text-xs rounded border border-emerald-300 bg-white"
                      />
                    </div>

                    {/* Resolution Photo Attachment & Live Camera */}
                    <div className="space-y-2 pt-1 border-t border-emerald-200/80">
                      <div className="flex items-center justify-between">
                        <label className="block text-[11px] font-bold text-emerald-950">
                          Post-Repair Photo Evidence
                        </label>
                        <button
                          type="button"
                          id="btn-officer-resolution-camera"
                          onClick={() => setIsResolutionCameraOpen(true)}
                          className="px-2.5 py-1 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-[10px] rounded-md flex items-center gap-1 shadow-xs transition-colors"
                        >
                          <Camera className="w-3 h-3" />
                          <span>Snap with Camera</span>
                        </button>
                      </div>

                      {resolutionPhotoUrl && (
                        <div className="relative rounded-lg overflow-hidden border border-emerald-300 aspect-video max-h-32 bg-slate-900">
                          <img
                            src={resolutionPhotoUrl}
                            alt="Resolution Evidence"
                            className="w-full h-full object-cover"
                          />
                          <span className="absolute bottom-1 left-1 px-1.5 py-0.5 bg-black/70 text-white text-[9px] rounded font-medium">
                            Verified Resolution Proof
                          </span>
                        </div>
                      )}

                      <div className="flex flex-wrap gap-1.5 pt-1">
                        <span className="text-[10px] text-emerald-900 font-semibold block w-full">
                          Or select sample patch:
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            setResolutionPhotoUrl(
                              'https://images.unsplash.com/photo-1590496793929-36417d3117de?auto=format&fit=crop&w=800&q=80'
                            )
                          }
                          className="px-2 py-1 rounded bg-white hover:bg-emerald-100 text-[10px] font-bold text-emerald-900 border border-emerald-300 transition-colors"
                        >
                          Smooth Tar Patch
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setResolutionPhotoUrl(
                              'https://images.unsplash.com/photo-1541888946425-d0fbb18086f6?auto=format&fit=crop&w=800&q=80'
                            )
                          }
                          className="px-2 py-1 rounded bg-white hover:bg-emerald-100 text-[10px] font-bold text-emerald-900 border border-emerald-300 transition-colors"
                        >
                          Compacted Concrete
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  id="btn-officer-save-status"
                  className="w-full py-2.5 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-lg text-xs shadow-xs transition-colors"
                >
                  {selectedStatus === 'resolved' ? t.markAsResolved : t.saveUpdate}
                </button>
              </form>
            </div>
          ) : (
            // Citizen view of assigned division
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
              <div className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                {t.assignDivision}
              </div>
              {complaint.assignedTo ? (
                <div className="space-y-2 text-xs">
                  <div className="p-3 bg-blue-50/70 rounded-xl border border-blue-200">
                    <span className="text-slate-500 block text-[11px]">Responsible Unit</span>
                    <span className="font-bold text-blue-950 block">
                      {complaint.assignedTo.division}
                    </span>
                  </div>
                  <div className="text-slate-600 text-[11px]">
                    Nodal In-charge: <span className="font-semibold">{complaint.assignedTo.officerName}</span>
                  </div>
                  {complaint.assignedTo.contractorTeam && (
                    <div className="text-slate-600 text-[11px]">
                      Repair Squad:{' '}
                      <span className="font-semibold">{complaint.assignedTo.contractorTeam}</span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-800">
                  {t.pending}
                </div>
              )}
            </div>
          )}

          {/* Activity Log & Timeline */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              {t.notesTimeline} ({complaint.notes.length})
            </h3>

            <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
              {complaint.notes.map((note) => (
                <div
                  key={note.id}
                  className={`p-3 rounded-xl text-xs space-y-1 ${
                    note.authorRole === 'officer'
                      ? 'bg-amber-50/80 border border-amber-200'
                      : 'bg-slate-50 border border-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="font-bold text-slate-800 flex items-center gap-1">
                      {note.authorRole === 'officer' ? (
                        <HardHat className="w-3 h-3 text-orange-600" />
                      ) : (
                        <User className="w-3 h-3 text-blue-600" />
                      )}
                      {note.author} ({note.authorRole === 'officer' ? 'Official' : 'Citizen'})
                    </span>
                    <span className="text-slate-400 font-mono">
                      {new Date(note.timestamp).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                  <p className="text-slate-700 leading-snug">{note.text}</p>
                </div>
              ))}
            </div>

            {/* Add note form */}
            <form onSubmit={handleAddNote} className="pt-2 border-t border-slate-100 flex gap-2">
              <input
                type="text"
                id="input-new-note"
                value={newNoteText}
                onChange={(e) => setNewNoteText(e.target.value)}
                placeholder={t.addNotePlaceholder}
                className="flex-1 px-3 py-2 text-xs rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-900"
              />
              <button
                type="submit"
                id="btn-add-note"
                className="px-3 py-2 bg-blue-900 hover:bg-blue-800 text-white rounded-lg text-xs font-bold flex items-center gap-1"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Live Camera Viewfinder for Municipal Officer Resolution Evidence */}
      <CameraCaptureModal
        isOpen={isResolutionCameraOpen}
        onClose={() => setIsResolutionCameraOpen(false)}
        onCapture={(dataUrl) => {
          setResolutionPhotoUrl(dataUrl);
        }}
        taluka={complaint.location.taluka}
        landmark={`Resolved: ${complaint.location.landmark}`}
        latitude={complaint.location.latitude}
        longitude={complaint.location.longitude}
        language={language}
      />
    </div>
  );
};
