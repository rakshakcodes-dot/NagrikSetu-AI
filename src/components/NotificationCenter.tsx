import React, { useState, useEffect, useRef } from 'react';
import {
  Bell,
  CheckCircle2,
  AlertTriangle,
  CloudRain,
  HardHat,
  Info,
  Check,
  Trash2,
  ExternalLink,
  Sparkles,
  RefreshCw,
  Send,
  X,
  Radio,
} from 'lucide-react';
import { AppNotification, Language, PageView, User } from '../types';
import {
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  subscribeToNotifications,
  notifyTestBroadcast,
  notifyMonsoonAlert,
  filterNotificationsForUser,
} from '../services/notificationService';

interface NotificationCenterProps {
  currentUser: User | null;
  language: Language;
  onNavigateToComplaint?: (complaintId: string) => void;
  onNavigateToPage?: (page: PageView) => void;
}

export const NotificationCenter: React.FC<NotificationCenterProps> = ({
  currentUser,
  language,
  onNavigateToComplaint,
  onNavigateToPage,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [activeFilter, setActiveFilter] = useState<'all' | 'unread' | 'weather' | 'complaints'>('all');
  const [isSendingTest, setIsSendingTest] = useState(false);
  const [backendSyncMessage, setBackendSyncMessage] = useState<string>('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Load and subscribe to notifications
  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      const data = await getNotifications(currentUser);
      if (isMounted) {
        setNotifications(data);
      }
    }

    loadData();

    // Subscribe to real-time notification changes
    const unsubscribe = subscribeToNotifications((updatedList) => {
      if (isMounted) {
        const filtered = filterNotificationsForUser(updatedList, currentUser);
        setNotifications(filtered);
      }
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, [currentUser]);

  // Close when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const filteredNotifications = notifications.filter((n) => {
    if (activeFilter === 'unread') return !n.isRead;
    if (activeFilter === 'weather') return n.type === 'monsoon_advisory' || n.type === 'weather_alert';
    if (activeFilter === 'complaints') {
      return (
        n.type === 'complaint_status' ||
        n.type === 'complaint_assigned' ||
        n.type === 'complaint_resolved' ||
        n.type === 'high_priority_alert'
      );
    }
    return true;
  });

  const handleMarkAsRead = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await markAsRead(id);
  };

  const handleMarkAllRead = async () => {
    if (currentUser) {
      await markAllAsRead(currentUser.id);
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await deleteNotification(id);
  };

  const handleSendTestAlert = async () => {
    setIsSendingTest(true);
    try {
      // 1. Trigger Express backend endpoint
      const response = await fetch('/api/notifications/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUser?.id || 'all' }),
      });

      if (response.ok) {
        setBackendSyncMessage('Express Backend & Database synced!');
      } else {
        // Fallback local dispatch
        await notifyTestBroadcast();
        setBackendSyncMessage('Dispatched via Local/Supabase sync!');
      }
    } catch {
      await notifyTestBroadcast();
      setBackendSyncMessage('Dispatched via Local/Supabase sync!');
    } finally {
      setIsSendingTest(false);
      setTimeout(() => setBackendSyncMessage(''), 4000);
    }
  };

  const handleTriggerMonsoonAlert = async () => {
    setIsSendingTest(true);
    try {
      const response = await fetch('/api/notifications/trigger-monsoon-alert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taluka: currentUser?.taluka || 'North & South Goa Coast' }),
      });

      if (response.ok) {
        setBackendSyncMessage('IMD Monsoon Red Alert broadcasted!');
      } else {
        await notifyMonsoonAlert(currentUser?.taluka || 'North & South Goa Coast');
        setBackendSyncMessage('IMD Monsoon Red Alert broadcasted!');
      }
    } catch {
      await notifyMonsoonAlert(currentUser?.taluka || 'North & South Goa Coast');
      setBackendSyncMessage('IMD Monsoon Red Alert broadcasted!');
    } finally {
      setIsSendingTest(false);
      setTimeout(() => setBackendSyncMessage(''), 4000);
    }
  };

  const handleNotificationClick = (notif: AppNotification) => {
    markAsRead(notif.id);
    setIsOpen(false);
    if (notif.complaintId && onNavigateToComplaint) {
      onNavigateToComplaint(notif.complaintId);
    } else if (notif.actionPage && onNavigateToPage) {
      onNavigateToPage(notif.actionPage);
    }
  };

  const formatRelativeTime = (timestamp: string) => {
    try {
      const diffMs = Date.now() - new Date(timestamp).getTime();
      const diffMins = Math.floor(diffMs / (1000 * 60));
      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      const diffHours = Math.floor(diffMins / 60);
      if (diffHours < 24) return `${diffHours}h ago`;
      const diffDays = Math.floor(diffHours / 24);
      return `${diffDays}d ago`;
    } catch {
      return '';
    }
  };

  const getNotificationIcon = (type: string, priority?: string) => {
    if (type === 'monsoon_advisory' || type === 'weather_alert') {
      return (
        <div className="w-8 h-8 rounded-lg bg-sky-100 text-sky-700 flex items-center justify-center shrink-0">
          <CloudRain className="w-4 h-4" />
        </div>
      );
    }
    if (type === 'high_priority_alert' || priority === 'urgent') {
      return (
        <div className="w-8 h-8 rounded-lg bg-red-100 text-red-700 flex items-center justify-center shrink-0">
          <AlertTriangle className="w-4 h-4" />
        </div>
      );
    }
    if (type === 'complaint_resolved') {
      return (
        <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
          <CheckCircle2 className="w-4 h-4" />
        </div>
      );
    }
    if (type === 'complaint_assigned' || type === 'complaint_status') {
      return (
        <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
          <HardHat className="w-4 h-4" />
        </div>
      );
    }
    return (
      <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0">
        <Bell className="w-4 h-4" />
      </div>
    );
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button Trigger */}
      <button
        id="btn-notification-bell"
        onClick={() => setIsOpen((prev) => !prev)}
        className={`p-2 rounded-lg transition-colors relative ${
          isOpen
            ? 'bg-blue-100 text-blue-900'
            : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
        }`}
        title="Civic & Pothole Notifications"
        aria-label="Notifications"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1 bg-orange-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center ring-2 ring-white animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Notifications Popover Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 md:w-[420px] bg-white rounded-2xl shadow-2xl border border-slate-200 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150 text-left">
          {/* Header */}
          <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Radio className="w-4 h-4 text-emerald-400 animate-pulse" />
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
                  Civic Alert & Notification Desk
                </h3>
                <span className="text-[11px] text-slate-400">
                  {unreadCount} unread alert{unreadCount !== 1 ? 's' : ''} • Real-time backend live
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1">
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllRead}
                  className="px-2 py-1 text-[11px] font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-md transition-colors"
                  title="Mark all as read"
                >
                  Mark all read
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded-md"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Sync / Success Notice */}
          {backendSyncMessage && (
            <div className="px-4 py-2 bg-emerald-50 border-b border-emerald-200 text-emerald-800 text-[11px] font-bold flex items-center gap-1.5 animate-in fade-in">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>{backendSyncMessage}</span>
            </div>
          )}

          {/* Test & Trigger Controls Banner */}
          <div className="px-3 py-2 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2 text-xs">
            <span className="text-[11px] font-bold text-slate-600">Quick Test Backend:</span>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                id="btn-trigger-test-notif"
                disabled={isSendingTest}
                onClick={handleSendTestAlert}
                className="px-2 py-1 bg-white hover:bg-blue-50 text-blue-900 border border-slate-300 rounded text-[11px] font-bold flex items-center gap-1 shadow-2xs hover:border-blue-300 transition-colors disabled:opacity-50"
                title="Send a real test notification via backend"
              >
                <Send className="w-3 h-3 text-blue-600" />
                <span>Test Alert</span>
              </button>
              <button
                type="button"
                id="btn-trigger-monsoon-notif"
                disabled={isSendingTest}
                onClick={handleTriggerMonsoonAlert}
                className="px-2 py-1 bg-white hover:bg-sky-50 text-sky-900 border border-slate-300 rounded text-[11px] font-bold flex items-center gap-1 shadow-2xs hover:border-sky-300 transition-colors disabled:opacity-50"
                title="Broadcast IMD Monsoon Red Alert"
              >
                <CloudRain className="w-3 h-3 text-sky-600" />
                <span>Monsoon Alert</span>
              </button>
            </div>
          </div>

          {/* Category Tabs */}
          <div className="flex border-b border-slate-100 bg-white px-2 pt-2 gap-1 text-xs">
            {[
              { key: 'all', label: `All (${notifications.length})` },
              { key: 'unread', label: `Unread (${unreadCount})` },
              {
                key: 'weather',
                label: `Weather (${
                  notifications.filter(
                    (n) => n.type === 'monsoon_advisory' || n.type === 'weather_alert'
                  ).length
                })`,
              },
              {
                key: 'complaints',
                label: `Grievances (${
                  notifications.filter(
                    (n) =>
                      n.type === 'complaint_status' ||
                      n.type === 'complaint_assigned' ||
                      n.type === 'complaint_resolved' ||
                      n.type === 'high_priority_alert'
                  ).length
                })`,
              },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveFilter(tab.key as any)}
                className={`px-2.5 py-1.5 text-[11px] font-bold rounded-lg transition-colors whitespace-nowrap ${
                  activeFilter === tab.key
                    ? 'bg-blue-900 text-white'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Notification List Body */}
          <div className="max-h-[380px] overflow-y-auto divide-y divide-slate-100">
            {filteredNotifications.length === 0 ? (
              <div className="py-12 px-4 text-center space-y-2">
                <Bell className="w-8 h-8 text-slate-300 mx-auto" />
                <div className="text-xs font-bold text-slate-700">No notifications in this view</div>
                <p className="text-[11px] text-slate-500 max-w-xs mx-auto">
                  Civic road defect alerts, squad assignments, and IMD monsoon weather warnings will appear here.
                </p>
              </div>
            ) : (
              filteredNotifications.map((notif) => (
                <div
                  key={notif.id}
                  onClick={() => handleNotificationClick(notif)}
                  className={`p-3.5 flex gap-3 hover:bg-slate-50 transition-colors cursor-pointer relative group ${
                    !notif.isRead ? 'bg-blue-50/40' : 'bg-white'
                  }`}
                >
                  {/* Status indicator dot */}
                  {!notif.isRead && (
                    <span className="absolute top-4 left-1.5 w-1.5 h-1.5 rounded-full bg-blue-600" />
                  )}

                  {/* Icon */}
                  {getNotificationIcon(notif.type, notif.priority)}

                  {/* Text Content */}
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-start justify-between gap-2">
                      <h4
                        className={`text-xs font-bold leading-tight ${
                          !notif.isRead ? 'text-slate-900' : 'text-slate-700'
                        }`}
                      >
                        {notif.title}
                      </h4>
                      <span className="text-[10px] text-slate-400 shrink-0 font-mono">
                        {formatRelativeTime(notif.createdAt)}
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-600 leading-snug line-clamp-2">
                      {notif.message}
                    </p>

                    {/* Bottom Metadata & Badges */}
                    <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                      <div className="flex items-center gap-1.5">
                        {notif.complaintId && (
                          <span className="px-1.5 py-0.5 bg-slate-100 text-blue-900 font-mono font-bold text-[10px] rounded border border-slate-200">
                            {notif.complaintId}
                          </span>
                        )}
                        {notif.priority === 'urgent' && (
                          <span className="px-1.5 py-0.5 bg-red-100 text-red-800 font-bold text-[9px] rounded">
                            URGENT
                          </span>
                        )}
                      </div>

                      {/* Action buttons on hover */}
                      <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100">
                        {!notif.isRead && (
                          <button
                            type="button"
                            onClick={(e) => handleMarkAsRead(notif.id, e)}
                            className="p-1 text-slate-400 hover:text-blue-700 hover:bg-blue-100 rounded"
                            title="Mark as read"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={(e) => handleDelete(notif.id, e)}
                          className="p-1 text-slate-400 hover:text-red-700 hover:bg-red-100 rounded"
                          title="Delete notification"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="p-2.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-500 px-3">
            <span className="font-mono text-[10px]">Backend: Express API + Supabase PostgreSQL</span>
            <button
              onClick={() => {
                getNotifications(currentUser).then(setNotifications);
              }}
              className="flex items-center gap-1 text-blue-900 font-bold hover:underline"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Refresh</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
