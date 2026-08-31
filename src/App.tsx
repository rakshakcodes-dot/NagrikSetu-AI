/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  Complaint,
  ComplaintStatus,
  Language,
  PageView,
  User,
} from './types';
import { DEMO_USERS, SAMPLE_COMPLAINTS, SAMPLE_NOTIFICATIONS } from './data/sampleData';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { DemoBanner } from './components/DemoBanner';
import { LoginRegister } from './components/LoginRegister';
import { CitizenDashboard } from './components/CitizenDashboard';
import { SubmitComplaint } from './components/SubmitComplaint';
import { ComplaintDetails } from './components/ComplaintDetails';
import { OfficerDashboard } from './components/OfficerDashboard';
import { ComplaintMap } from './components/ComplaintMap';
import { AnalyticsView } from './components/AnalyticsView';
import { NotificationToast } from './components/NotificationToast';
import { OfficerPinModal } from './components/OfficerPinModal';
import {
  fetchAllComplaintsFromSupabase,
  insertComplaintToSupabase,
  insertStatusUpdateToSupabase,
  seedComplaintsToSupabaseIfEmpty,
  seedNotificationsToSupabaseIfEmpty,
  signOutSupabase,
  updateComplaintInSupabase,
} from './services/supabaseService';
import {
  notifyComplaintSubmitted,
  notifyStatusChanged,
} from './services/notificationService';
import { isSupabaseConfigured } from './lib/supabase';

const STORAGE_KEY_COMPLAINTS = 'goa_roadfix_complaints_v1';
const STORAGE_KEY_USER = 'goa_roadfix_user_v1';
const STORAGE_KEY_LANG = 'goa_roadfix_lang_v1';

export default function App() {
  // Initialize Complaints with cached or sample data
  const [complaints, setComplaints] = useState<Complaint[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_COMPLAINTS);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error('Failed to parse saved complaints', e);
    }
    return SAMPLE_COMPLAINTS;
  });

  // Initialize User (defaults to Demo Citizen for instant preview)
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_USER);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error('Failed to parse saved user', e);
    }
    return DEMO_USERS.citizen;
  });

  // Initialize Language
  const [language, setLanguage] = useState<Language>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_LANG);
      if (saved === 'hi' || saved === 'en') {
        return saved;
      }
    } catch (e) {
      console.error('Failed to parse language', e);
    }
    return 'en';
  });

  // Active Navigation Page
  const [currentPage, setCurrentPage] = useState<PageView>('citizen_dashboard');
  const [selectedComplaintId, setSelectedComplaintId] = useState<string | null>(null);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState<boolean>(false);
  const [isOfficerPinModalOpen, setIsOfficerPinModalOpen] = useState<boolean>(false);

  // Sync and fetch from Supabase on mount
  useEffect(() => {
    let isMounted = true;

    async function initSupabaseData() {
      if (isSupabaseConfigured()) {
        try {
          // Attempt seeding sample data if complaints and notifications tables are empty
          await seedComplaintsToSupabaseIfEmpty(SAMPLE_COMPLAINTS);
          await seedNotificationsToSupabaseIfEmpty(SAMPLE_NOTIFICATIONS);

          // Fetch fresh complaints from Supabase
          const remoteComplaints = await fetchAllComplaintsFromSupabase();
          if (isMounted && remoteComplaints && remoteComplaints.length > 0) {
            setComplaints(remoteComplaints);
          }
        } catch (err) {
          console.warn('Supabase initialization sync notice:', err);
        }
      }
    }

    initSupabaseData();

    return () => {
      isMounted = false;
    };
  }, []);

  // Sync to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_COMPLAINTS, JSON.stringify(complaints));
    } catch (e) {
      console.error('Failed to save complaints', e);
    }
  }, [complaints]);

  useEffect(() => {
    try {
      if (currentUser) {
        localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(currentUser));
      } else {
        localStorage.removeItem(STORAGE_KEY_USER);
      }
    } catch (e) {
      console.error('Failed to save user', e);
    }
  }, [currentUser]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_LANG, language);
    } catch (e) {
      console.error('Failed to save language', e);
    }
  }, [language]);

  // Handle Login
  const handleLogin = (user: User) => {
    setCurrentUser(user);
    if (user.role === 'officer') {
      setCurrentPage('officer_dashboard');
    } else {
      setCurrentPage('citizen_dashboard');
    }
  };

  // Handle Logout
  const handleLogout = async () => {
    await signOutSupabase();
    setCurrentUser(null);
    setCurrentPage('login');
  };

  // Quick Switch to Citizen (Safe, public access)
  const handleSwitchToCitizen = () => {
    setCurrentUser(DEMO_USERS.citizen);
    setCurrentPage('citizen_dashboard');
  };

  // Request Switch to Officer (Protected by Security PIN)
  const handleSwitchToOfficer = () => {
    if (currentUser?.role === 'officer') {
      setCurrentPage('officer_dashboard');
      return;
    }
    // Intercept with Security PIN clearance modal
    setIsOfficerPinModalOpen(true);
  };

  // Called when Officer PIN is successfully verified
  const handleOfficerPinSuccess = () => {
    setCurrentUser(DEMO_USERS.officer);
    setCurrentPage('officer_dashboard');
    setIsOfficerPinModalOpen(false);
  };

  // Quick toggle role
  const handleQuickSwitchRole = () => {
    if (currentUser?.role === 'officer') {
      handleSwitchToCitizen();
    } else {
      handleSwitchToOfficer();
    }
  };

  // View Complaint Details
  const handleSelectComplaint = (complaint: Complaint) => {
    setSelectedComplaintId(complaint.id);
    setCurrentPage('complaint_details');
  };

  // Add newly submitted complaint and save to database
  const handleSubmitSuccess = async (newComplaint: Complaint) => {
    setComplaints((prev) => [newComplaint, ...prev]);
    setSelectedComplaintId(newComplaint.id);
    setCurrentPage('complaint_details');

    // Persist to Supabase complaints & status_updates tables
    await insertComplaintToSupabase(newComplaint);

    // Push notification to officers and citizen confirmation
    await notifyComplaintSubmitted(newComplaint);
  };

  // Update existing complaint (e.g. status change, notes, officer assignment)
  const handleUpdateComplaint = async (updated: Complaint) => {
    const prev = complaints.find((c) => c.id === updated.id);
    setComplaints((items) =>
      items.map((item) => (item.id === updated.id ? updated : item))
    );

    // Sync to Supabase
    await updateComplaintInSupabase(updated);

    // Dispatch status change notification if status transitioned
    if (prev && prev.status !== updated.status) {
      await notifyStatusChanged(
        updated,
        updated.status,
        currentUser?.name || 'Municipal Officer',
        updated.assignedTo?.division
      );
    }
  };

  // Quick inline status change by Officer
  const handleQuickStatusChange = async (complaintId: string, newStatus: ComplaintStatus) => {
    const now = new Date().toISOString();
    const isResolved = newStatus === 'resolved';

    const systemNote = {
      id: `note-${Date.now()}`,
      author: currentUser?.name || 'Municipal Officer',
      authorRole: 'officer' as const,
      timestamp: now,
      text: `Status updated to ${newStatus.toUpperCase()} via Quick Action.`,
    };

    let targetComplaint: Complaint | null = null;

    setComplaints((prev) =>
      prev.map((c) => {
        if (c.id === complaintId) {
          const updated: Complaint = {
            ...c,
            status: newStatus,
            updatedAt: now,
            resolvedAt: isResolved ? now : c.resolvedAt,
            notes: [...c.notes, systemNote],
          };
          targetComplaint = updated;
          return updated;
        }
        return c;
      })
    );

    if (targetComplaint) {
      await updateComplaintInSupabase(targetComplaint);
      await insertStatusUpdateToSupabase(complaintId, systemNote, newStatus);
      await notifyStatusChanged(
        targetComplaint,
        newStatus,
        currentUser?.name || 'Municipal Officer'
      );
    }
  };

  // Active Complaint Object
  const currentComplaint =
    complaints.find((c) => c.id === selectedComplaintId) || complaints[0];

  return (
    <div className="flex h-screen w-full bg-slate-100 font-sans overflow-hidden antialiased text-slate-900">
      {/* Sidebar Navigation */}
      <Sidebar
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
        currentUser={currentUser}
        language={language}
        onLogout={handleLogout}
        onQuickSwitchRole={handleQuickSwitchRole}
        mobileOpen={mobileSidebarOpen}
        setMobileOpen={setMobileSidebarOpen}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full min-w-0 overflow-hidden">
        {/* Top Demo Banner for Rapid Testing */}
        <DemoBanner
          currentUser={currentUser}
          onSwitchToCitizen={handleSwitchToCitizen}
          onSwitchToOfficer={handleSwitchToOfficer}
          language={language}
        />

        {/* Header Bar */}
        <Header
          currentPage={currentPage}
          setCurrentPage={setCurrentPage}
          currentUser={currentUser}
          language={language}
          setLanguage={setLanguage}
          onLogout={handleLogout}
          onQuickSwitchRole={handleQuickSwitchRole}
          onToggleSidebar={() => setMobileSidebarOpen((prev) => !prev)}
          onNavigateToComplaint={(id) => {
            setSelectedComplaintId(id);
            setCurrentPage('complaint_details');
          }}
        />

        {/* Scrollable View Container */}
        <main className="flex-1 overflow-y-auto bg-slate-100">
          {currentPage === 'login' && (
            <LoginRegister onLogin={handleLogin} language={language} />
          )}

          {currentPage === 'citizen_dashboard' && currentUser && (
            <CitizenDashboard
              currentUser={currentUser}
              complaints={complaints}
              onSelectComplaint={handleSelectComplaint}
              onNavigateSubmit={() => setCurrentPage('submit_complaint')}
              language={language}
            />
          )}

          {currentPage === 'submit_complaint' && currentUser && (
            <SubmitComplaint
              currentUser={currentUser}
              existingComplaints={complaints}
              onSubmitSuccess={handleSubmitSuccess}
              onCancel={() =>
                setCurrentPage(
                  currentUser.role === 'officer' ? 'officer_dashboard' : 'citizen_dashboard'
                )
              }
              language={language}
            />
          )}

          {currentPage === 'complaint_details' && currentUser && currentComplaint && (
            <ComplaintDetails
              complaint={currentComplaint}
              currentUser={currentUser}
              onBack={() =>
                setCurrentPage(
                  currentUser.role === 'officer' ? 'officer_dashboard' : 'citizen_dashboard'
                )
              }
              onUpdateComplaint={handleUpdateComplaint}
              language={language}
            />
          )}

          {currentPage === 'officer_dashboard' && currentUser && (
            <OfficerDashboard
              currentUser={currentUser}
              complaints={complaints}
              onSelectComplaint={handleSelectComplaint}
              onQuickStatusChange={handleQuickStatusChange}
              language={language}
            />
          )}

          {currentPage === 'complaint_map' && (
            <ComplaintMap
              complaints={complaints}
              onSelectComplaint={handleSelectComplaint}
              language={language}
            />
          )}

          {currentPage === 'analytics' && (
            <AnalyticsView complaints={complaints} language={language} />
          )}
        </main>

        {/* Real-Time Civic Alert Toast Notification Overlay */}
        <NotificationToast
          onNavigateToComplaint={(id) => {
            setSelectedComplaintId(id);
            setCurrentPage('complaint_details');
          }}
          onNavigateToPage={setCurrentPage}
        />
      </div>

      {/* Officer Security Clearance PIN Modal */}
      <OfficerPinModal
        isOpen={isOfficerPinModalOpen}
        onClose={() => setIsOfficerPinModalOpen(false)}
        onSuccess={handleOfficerPinSuccess}
        language={language}
      />
    </div>
  );
}
