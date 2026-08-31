import { AppNotification, Complaint, Language, User, UserRole } from '../types';
import { SAMPLE_NOTIFICATIONS } from '../data/sampleData';
import {
  fetchNotificationsFromSupabase,
  insertNotificationToSupabase,
  markAllNotificationsAsReadInSupabase,
  markNotificationAsReadInSupabase,
} from './supabaseService';
import { isSupabaseConfigured } from '../lib/supabase';

const STORAGE_KEY_NOTIFICATIONS = 'goa_roadfix_notifications_v1';

type NotificationListener = (notifications: AppNotification[]) => void;
type ToastListener = (notification: AppNotification) => void;

const notificationListeners: Set<NotificationListener> = new Set();
const toastListeners: Set<ToastListener> = new Set();

/**
 * Loads cached notifications from localStorage or returns default samples
 */
export function getLocalNotifications(): AppNotification[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEY_NOTIFICATIONS);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Failed to read local notifications:', e);
  }
  return SAMPLE_NOTIFICATIONS;
}

/**
 * Saves notifications list to localStorage
 */
export function saveLocalNotifications(notifications: AppNotification[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_NOTIFICATIONS, JSON.stringify(notifications));
  } catch (e) {
    console.error('Failed to save local notifications:', e);
  }
}

/**
 * Notifies all subscribers of updated notification list
 */
function notifySubscribers(notifications: AppNotification[]): void {
  notificationListeners.forEach((listener) => {
    try {
      listener(notifications);
    } catch (e) {
      console.error('Error in notification listener:', e);
    }
  });
}

/**
 * Broadcasts toast popup for a newly arrived notification
 */
export function broadcastToast(notification: AppNotification): void {
  toastListeners.forEach((listener) => {
    try {
      listener(notification);
    } catch (e) {
      console.error('Error in toast listener:', e);
    }
  });
}

/**
 * Subscribe to notification list updates
 */
export function subscribeToNotifications(listener: NotificationListener): () => void {
  notificationListeners.add(listener);
  return () => {
    notificationListeners.delete(listener);
  };
}

/**
 * Subscribe to real-time toast popups
 */
export function subscribeToToastAlerts(listener: ToastListener): () => void {
  toastListeners.add(listener);
  return () => {
    toastListeners.delete(listener);
  };
}

/**
 * Fetch all notifications for a given user & role (merging Supabase & local cache)
 */
export async function getNotifications(
  user?: User | null
): Promise<AppNotification[]> {
  const localList = getLocalNotifications();

  // If Supabase is connected, attempt remote fetch and merge
  if (isSupabaseConfigured() && user) {
    try {
      const remoteList = await fetchNotificationsFromSupabase(user.id, user.role);
      if (remoteList && remoteList.length > 0) {
        // Merge without duplicates based on ID
        const idMap = new Map<string, AppNotification>();
        localList.forEach((n) => idMap.set(n.id, n));
        remoteList.forEach((n) => idMap.set(n.id, n));

        const merged = Array.from(idMap.values()).sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        saveLocalNotifications(merged);
        notifySubscribers(merged);
        return filterNotificationsForUser(merged, user);
      }
    } catch (err) {
      console.warn('Could not fetch remote notifications, using local cache:', err);
    }
  }

  // Attempt backend API fetch if available
  try {
    const apiRes = await fetch('/api/notifications');
    if (apiRes.ok) {
      const apiData = await apiRes.json();
      if (Array.isArray(apiData.notifications) && apiData.notifications.length > 0) {
        const idMap = new Map<string, AppNotification>();
        localList.forEach((n) => idMap.set(n.id, n));
        apiData.notifications.forEach((n: AppNotification) => idMap.set(n.id, n));

        const merged = Array.from(idMap.values()).sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        saveLocalNotifications(merged);
        notifySubscribers(merged);
        return filterNotificationsForUser(merged, user);
      }
    }
  } catch {
    // API endpoint might be local dev or offline, fallback safely
  }

  return filterNotificationsForUser(localList, user);
}

/**
 * Filter notifications relevant to current user
 */
export function filterNotificationsForUser(
  list: AppNotification[],
  user?: User | null
): AppNotification[] {
  if (!user) return list;

  return list.filter((n) => {
    if (n.userId === 'all') return true;
    if (n.userId === user.id) return true;
    if (user.role === 'citizen' && (n.userId === 'citizens' || n.userId === 'citizen')) return true;
    if (user.role === 'officer' && (n.userId === 'officers' || n.userId === 'officer')) return true;
    return false;
  });
}

/**
 * Add a new notification and propagate to backend, Supabase, and UI
 */
export async function pushNotification(
  notification: Omit<AppNotification, 'id' | 'createdAt' | 'isRead'> & {
    id?: string;
    createdAt?: string;
    isRead?: boolean;
  }
): Promise<AppNotification> {
  const fullNotification: AppNotification = {
    id: notification.id || `notif-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    userId: notification.userId,
    title: notification.title,
    message: notification.message,
    type: notification.type,
    complaintId: notification.complaintId,
    isRead: notification.isRead || false,
    priority: notification.priority || 'normal',
    actionPage: notification.actionPage || 'complaint_details',
    metadata: notification.metadata,
    createdAt: notification.createdAt || new Date().toISOString(),
  };

  // 1. Update local cache
  const current = getLocalNotifications();
  const updated = [fullNotification, ...current.filter((n) => n.id !== fullNotification.id)];
  saveLocalNotifications(updated);
  notifySubscribers(updated);

  // 2. Trigger real-time toast alert
  broadcastToast(fullNotification);

  // 3. Sync to Supabase
  if (isSupabaseConfigured()) {
    insertNotificationToSupabase(fullNotification).catch((err) =>
      console.warn('Error syncing notification to Supabase:', err)
    );
  }

  // 4. Sync to Express Backend REST API
  try {
    fetch('/api/notifications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(fullNotification),
    }).catch(() => {});
  } catch {
    // Ignore offline network errors
  }

  return fullNotification;
}

/**
 * Mark single notification as read
 */
export async function markAsRead(notificationId: string): Promise<void> {
  const current = getLocalNotifications();
  const updated = current.map((n) =>
    n.id === notificationId ? { ...n, isRead: true } : n
  );
  saveLocalNotifications(updated);
  notifySubscribers(updated);

  if (isSupabaseConfigured()) {
    markNotificationAsReadInSupabase(notificationId).catch((e) =>
      console.warn('Error updating read status in Supabase:', e)
    );
  }

  try {
    fetch(`/api/notifications/${notificationId}/read`, {
      method: 'PATCH',
    }).catch(() => {});
  } catch {}
}

/**
 * Mark all notifications as read for a user
 */
export async function markAllAsRead(userId: string): Promise<void> {
  const current = getLocalNotifications();
  const updated = current.map((n) => ({ ...n, isRead: true }));
  saveLocalNotifications(updated);
  notifySubscribers(updated);

  if (isSupabaseConfigured()) {
    markAllNotificationsAsReadInSupabase(userId).catch((e) =>
      console.warn('Error marking all as read in Supabase:', e)
    );
  }

  try {
    fetch('/api/notifications/read-all', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId }),
    }).catch(() => {});
  } catch {}
}

/**
 * Delete a notification
 */
export async function deleteNotification(notificationId: string): Promise<void> {
  const current = getLocalNotifications();
  const updated = current.filter((n) => n.id !== notificationId);
  saveLocalNotifications(updated);
  notifySubscribers(updated);
}

/* ---------------------------------------------------------
 * CONVENIENCE NOTIFICATION DISPATCHERS
 * --------------------------------------------------------- */

/**
 * Triggered when a citizen submits a new complaint
 */
export async function notifyComplaintSubmitted(complaint: Complaint): Promise<void> {
  // 1. Notify Municipal Officers
  await pushNotification({
    userId: 'officers',
    title: `🚨 New Grievance: ${complaint.id} (${complaint.location.taluka})`,
    message: `A ${complaint.priority.toUpperCase()} priority "${complaint.category}" reported at ${complaint.location.landmark}, ${complaint.location.roadName}.`,
    type: complaint.priority === 'high' ? 'high_priority_alert' : 'complaint_status',
    complaintId: complaint.id,
    priority: complaint.priority === 'high' ? 'urgent' : 'normal',
    actionPage: 'complaint_details',
  });

  // 2. Confirmation to the Citizen
  await pushNotification({
    userId: complaint.citizenId,
    title: `✅ Grievance Registered: ${complaint.id}`,
    message: `Your report for "${complaint.title}" has been registered and dispatched to the Goa PWD Road Division. Tracking ID: ${complaint.id}.`,
    type: 'complaint_status',
    complaintId: complaint.id,
    priority: 'normal',
    actionPage: 'complaint_details',
  });
}

/**
 * Triggered when an officer updates status or notes
 */
export async function notifyStatusChanged(
  complaint: Complaint,
  newStatus: string,
  actorName: string,
  division?: string
): Promise<void> {
  const statusLabels: Record<string, string> = {
    pending: 'Pending Initial Verification',
    assigned: `Assigned to ${division || 'PWD Squad'}`,
    in_progress: 'Active Repair Work In Progress',
    resolved: 'Resolved & Road Restored',
  };

  const isResolved = newStatus === 'resolved';

  // Notify the citizen who filed the report
  await pushNotification({
    userId: complaint.citizenId,
    title: isResolved
      ? `🎉 Grievance ${complaint.id} RESOLVED!`
      : `Status Update: ${complaint.id} is now ${statusLabels[newStatus] || newStatus}`,
    message: isResolved
      ? `Road repair completed by ${division || complaint.assignedTo?.division || 'PWD Squad'}. Please inspect and rate the repair quality.`
      : `Official update by ${actorName}: Status transitioned to ${newStatus.toUpperCase()}. Inspection team assigned.`,
    type: isResolved ? 'complaint_resolved' : 'complaint_status',
    complaintId: complaint.id,
    priority: isResolved ? 'normal' : 'normal',
    actionPage: 'complaint_details',
  });
}

/**
 * Broadcast IMD Monsoon Weather / Flood Warning
 */
export async function notifyMonsoonAlert(
  taluka: string = 'Goa Coastal Belt',
  advisoryText?: string
): Promise<void> {
  await pushNotification({
    userId: 'all',
    title: `🌧️ Monsoon Advisory: Heavy Rain in ${taluka}`,
    message:
      advisoryText ||
      `IMD Doppler radar indicates continuous downpours over ${taluka}. Emergency water-pumping squads on standby along NH-66 and coastal arteries. Drive cautiously.`,
    type: 'monsoon_advisory',
    priority: 'urgent',
    actionPage: 'complaint_map',
  });
}

/**
 * Dispatch test notification for verification
 */
export async function notifyTestBroadcast(customMessage?: string): Promise<AppNotification> {
  return await pushNotification({
    userId: 'all',
    title: '🔔 NagrikSetu Notification Backend Online',
    message:
      customMessage ||
      'Real-time civic alert dispatch engine connected successfully with Supabase PostgreSQL and Express API.',
    type: 'system',
    priority: 'normal',
    actionPage: 'citizen_dashboard',
  });
}
