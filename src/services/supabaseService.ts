import { supabase, isSupabaseConfigured } from '../lib/supabase';
import {
  AppNotification,
  Complaint,
  ComplaintNote,
  ComplaintFeedback,
  ComplaintStatus,
  GoaTaluka,
  RoadType,
  User,
  UserRole,
} from '../types';

/**
 * Maps a database complaint row + notes + feedbacks to the application Complaint interface
 */
export function mapDbComplaintToModel(
  row: any,
  notes: ComplaintNote[] = [],
  feedbacks: ComplaintFeedback[] = []
): Complaint {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    category: row.category,
    predictedCategory: row.predicted_category || undefined,
    imageUrl: row.image_url,
    location: {
      taluka: row.taluka as GoaTaluka,
      landmark: row.landmark,
      roadName: row.road_name,
      roadType: row.road_type as RoadType,
      latitude: Number(row.latitude),
      longitude: Number(row.longitude),
    },
    status: row.status as ComplaintStatus,
    priority: row.priority,
    priorityReason: row.priority_reason || undefined,
    citizenId: row.citizen_id,
    citizenName: row.citizen_name,
    citizenPhone: row.citizen_phone || '',
    citizenEmail: row.citizen_email || '',
    assignedTo: row.assigned_division
      ? {
          division: row.assigned_division,
          officerName: row.assigned_officer_name || 'PWD Inspection Team',
          assignedDate: row.assigned_date || row.created_at,
          contractorTeam: row.contractor_team || undefined,
        }
      : undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at || row.created_at,
    resolvedAt: row.resolved_at || undefined,
    resolutionPhotoUrl: row.resolution_photo_url || undefined,
    resolutionNotes: row.resolution_notes || undefined,
    estimatedDays: row.estimated_days || 3,
    notes: notes.sort(
      (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    ),
    feedbacks: feedbacks.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    ),
  };
}

/**
 * Maps a Complaint application model to a database complaint row
 */
export function mapModelToDbComplaint(complaint: Complaint) {
  return {
    id: complaint.id,
    title: complaint.title,
    description: complaint.description,
    category: complaint.category,
    predicted_category: complaint.predictedCategory || null,
    image_url: complaint.imageUrl,
    road_type: complaint.location.roadType,
    taluka: complaint.location.taluka,
    road_name: complaint.location.roadName,
    landmark: complaint.location.landmark,
    latitude: complaint.location.latitude,
    longitude: complaint.location.longitude,
    status: complaint.status,
    priority: complaint.priority,
    priority_reason: complaint.priorityReason || null,
    citizen_id: complaint.citizenId,
    citizen_name: complaint.citizenName,
    citizen_phone: complaint.citizenPhone || null,
    citizen_email: complaint.citizenEmail || null,
    assigned_division: complaint.assignedTo?.division || null,
    assigned_officer_name: complaint.assignedTo?.officerName || null,
    assigned_date: complaint.assignedTo?.assignedDate || null,
    contractor_team: complaint.assignedTo?.contractorTeam || null,
    estimated_days: complaint.estimatedDays || 3,
    resolution_photo_url: complaint.resolutionPhotoUrl || null,
    resolution_notes: complaint.resolutionNotes || null,
    resolved_at: complaint.resolvedAt || null,
    created_at: complaint.createdAt,
    updated_at: complaint.updatedAt || new Date().toISOString(),
  };
}

/* ---------------------------------------------------------
 * COMPLAINTS CRUD OPERATIONS
 * --------------------------------------------------------- */

export async function fetchAllComplaintsFromSupabase(): Promise<Complaint[] | null> {
  if (!isSupabaseConfigured()) return null;

  try {
    // 1. Fetch complaints
    const { data: complaintsData, error: complaintsError } = await supabase
      .from('complaints')
      .select('*')
      .order('created_at', { ascending: false });

    if (complaintsError) {
      console.warn('Supabase fetch complaints error:', complaintsError.message);
      return null;
    }

    if (!complaintsData || complaintsData.length === 0) {
      return [];
    }

    // 2. Fetch all status updates / notes
    const { data: notesData } = await supabase
      .from('status_updates')
      .select('*')
      .order('created_at', { ascending: true });

    // 3. Fetch all feedback
    const { data: feedbackData } = await supabase
      .from('feedback')
      .select('*')
      .order('created_at', { ascending: false });

    // Group notes by complaint_id
    const notesByComplaint: Record<string, ComplaintNote[]> = {};
    if (notesData) {
      for (const n of notesData) {
        if (!notesByComplaint[n.complaint_id]) {
          notesByComplaint[n.complaint_id] = [];
        }
        notesByComplaint[n.complaint_id].push({
          id: n.id,
          author: n.author_name,
          authorRole: n.author_role as UserRole,
          timestamp: n.created_at,
          text: n.note_text,
          photoUrl: n.photo_url || undefined,
        });
      }
    }

    // Group feedback by complaint_id
    const feedbackByComplaint: Record<string, ComplaintFeedback[]> = {};
    if (feedbackData) {
      for (const f of feedbackData) {
        if (!feedbackByComplaint[f.complaint_id]) {
          feedbackByComplaint[f.complaint_id] = [];
        }
        feedbackByComplaint[f.complaint_id].push({
          id: f.id,
          complaintId: f.complaint_id,
          citizenId: f.citizen_id,
          citizenName: f.citizen_name,
          rating: f.rating,
          comment: f.comment || undefined,
          createdAt: f.created_at,
        });
      }
    }

    // Assemble final complaints array
    return complaintsData.map((row) =>
      mapDbComplaintToModel(
        row,
        notesByComplaint[row.id] || [],
        feedbackByComplaint[row.id] || []
      )
    );
  } catch (err) {
    console.error('Failed to fetch from Supabase:', err);
    return null;
  }
}

export async function insertComplaintToSupabase(complaint: Complaint): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;

  try {
    const dbRow = mapModelToDbComplaint(complaint);
    const { error: complaintError } = await supabase.from('complaints').insert([dbRow]);

    if (complaintError) {
      console.error('Error inserting complaint to Supabase:', complaintError);
      return false;
    }

    // Also insert initial notes
    if (complaint.notes && complaint.notes.length > 0) {
      const dbNotes = complaint.notes.map((note) => ({
        id: note.id,
        complaint_id: complaint.id,
        author_name: note.author,
        author_role: note.authorRole,
        note_text: note.text,
        photo_url: note.photoUrl || null,
        created_at: note.timestamp,
      }));

      await supabase.from('status_updates').insert(dbNotes);
    }

    return true;
  } catch (err) {
    console.error('Exception inserting complaint to Supabase:', err);
    return false;
  }
}

export async function updateComplaintInSupabase(complaint: Complaint): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;

  try {
    const dbRow = mapModelToDbComplaint(complaint);
    const { error } = await supabase
      .from('complaints')
      .update(dbRow)
      .eq('id', complaint.id);

    if (error) {
      console.error('Error updating complaint in Supabase:', error);
      return false;
    }
    return true;
  } catch (err) {
    console.error('Exception updating complaint in Supabase:', err);
    return false;
  }
}

export async function insertStatusUpdateToSupabase(
  complaintId: string,
  note: ComplaintNote,
  newStatus?: ComplaintStatus
): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;

  try {
    const { error: noteError } = await supabase.from('status_updates').insert([
      {
        id: note.id,
        complaint_id: complaintId,
        author_name: note.author,
        author_role: note.authorRole,
        status: newStatus || null,
        note_text: note.text,
        photo_url: note.photoUrl || null,
        created_at: note.timestamp,
      },
    ]);

    if (noteError) {
      console.error('Error inserting status update to Supabase:', noteError);
      return false;
    }
    return true;
  } catch (err) {
    console.error('Exception inserting status update to Supabase:', err);
    return false;
  }
}

/* ---------------------------------------------------------
 * FEEDBACK OPERATIONS
 * --------------------------------------------------------- */

export async function insertFeedbackToSupabase(
  feedback: ComplaintFeedback
): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;

  try {
    const { error } = await supabase.from('feedback').insert([
      {
        id: feedback.id,
        complaint_id: feedback.complaintId,
        citizen_id: feedback.citizenId,
        citizen_name: feedback.citizenName,
        rating: feedback.rating,
        comment: feedback.comment || null,
        created_at: feedback.createdAt,
      },
    ]);

    if (error) {
      console.error('Error inserting feedback to Supabase:', error);
      return false;
    }
    return true;
  } catch (err) {
    console.error('Exception inserting feedback to Supabase:', err);
    return false;
  }
}

/* ---------------------------------------------------------
 * AUTHENTICATION & USERS CRUD OPERATIONS
 * --------------------------------------------------------- */

export async function upsertUserProfileInSupabase(user: User): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;

  try {
    const { error } = await supabase.from('users').upsert([
      {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        phone: user.phone || null,
        taluka: user.taluka || null,
        department: user.department || null,
        designation: user.designation || null,
        updated_at: new Date().toISOString(),
      },
    ]);

    if (error) {
      console.error('Error upserting user profile:', error);
      return false;
    }
    return true;
  } catch (err) {
    console.error('Exception upserting user profile:', err);
    return false;
  }
}

export async function fetchUserProfileFromSupabase(
  userIdOrEmail: string
): Promise<User | null> {
  if (!isSupabaseConfigured()) return null;

  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .or(`id.eq.${userIdOrEmail},email.eq.${userIdOrEmail}`)
      .maybeSingle();

    if (error || !data) {
      return null;
    }

    return {
      id: data.id,
      email: data.email,
      name: data.name,
      role: data.role as UserRole,
      phone: data.phone || undefined,
      taluka: data.taluka || undefined,
      department: data.department || undefined,
      designation: data.designation || undefined,
    };
  } catch (err) {
    console.error('Exception fetching user profile:', err);
    return null;
  }
}

export async function signUpWithSupabase(
  email: string,
  password: string,
  profile: Omit<User, 'id'>
): Promise<{ user: User | null; error: string | null }> {
  if (!isSupabaseConfigured()) {
    // Return mock created user for local demo mode
    const mockUser: User = {
      id: `usr-${Date.now()}`,
      email,
      name: profile.name,
      role: profile.role,
      phone: profile.phone,
      taluka: profile.taluka,
      department: profile.department,
      designation: profile.designation,
    };
    return { user: mockUser, error: null };
  }

  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name: profile.name,
          role: profile.role,
          taluka: profile.taluka,
        },
      },
    });

    if (error) {
      return { user: null, error: error.message };
    }

    const userId = data.user?.id || `usr-${Date.now()}`;
    const userModel: User = {
      id: userId,
      email,
      name: profile.name,
      role: profile.role,
      phone: profile.phone,
      taluka: profile.taluka,
      department: profile.department,
      designation: profile.designation,
    };

    // Save profile in users table
    await upsertUserProfileInSupabase(userModel);

    return { user: userModel, error: null };
  } catch (err: any) {
    return { user: null, error: err?.message || 'Failed to sign up with Supabase' };
  }
}

export async function signInWithSupabase(
  email: string,
  password: string
): Promise<{ user: User | null; error: string | null }> {
  if (!isSupabaseConfigured()) {
    return { user: null, error: 'Supabase credentials not configured' };
  }

  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return { user: null, error: error.message };
    }

    if (!data.user) {
      return { user: null, error: 'User not found in Supabase Auth' };
    }

    // Fetch user profile from `users` table
    const profile = await fetchUserProfileFromSupabase(data.user.id);
    if (profile) {
      return { user: profile, error: null };
    }

    // If profile not in table yet, assemble from user_metadata
    const meta = data.user.user_metadata || {};
    const fallbackUser: User = {
      id: data.user.id,
      email: data.user.email || email,
      name: meta.name || email.split('@')[0],
      role: (meta.role as UserRole) || 'citizen',
      taluka: meta.taluka || 'Panaji (Tiswadi)',
      phone: meta.phone,
    };

    await upsertUserProfileInSupabase(fallbackUser);
    return { user: fallbackUser, error: null };
  } catch (err: any) {
    return { user: null, error: err?.message || 'Failed to sign in with Supabase' };
  }
}

export async function signOutSupabase(): Promise<void> {
  if (isSupabaseConfigured()) {
    try {
      await supabase.auth.signOut();
    } catch (e) {
      console.warn('Supabase signOut warning:', e);
    }
  }
}

/**
 * Seeds initial demo complaints into Supabase if the complaints table is empty
 */
export async function seedComplaintsToSupabaseIfEmpty(
  sampleComplaints: Complaint[]
): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;

  try {
    const { count, error } = await supabase
      .from('complaints')
      .select('*', { count: 'exact', head: true });

    if (error || (count !== null && count > 0)) {
      return false; // Already has data or table doesn't exist
    }

    console.log('Seeding initial sample complaints into Supabase...');
    for (const c of sampleComplaints) {
      await insertComplaintToSupabase(c);
    }
    return true;
  } catch (err) {
    console.warn('Could not auto-seed Supabase table:', err);
    return false;
  }
}

/* ---------------------------------------------------------
 * NOTIFICATIONS OPERATIONS
 * --------------------------------------------------------- */

export async function fetchNotificationsFromSupabase(
  userId?: string,
  role?: UserRole
): Promise<AppNotification[] | null> {
  if (!isSupabaseConfigured()) return null;

  try {
    let query = supabase
      .from('notifications')
      .select('*')
      .order('created_at', { ascending: false });

    if (userId) {
      const targetUserIds = [userId, 'all'];
      if (role === 'citizen') targetUserIds.push('citizens');
      if (role === 'officer') targetUserIds.push('officers');
      query = query.in('user_id', targetUserIds);
    }

    const { data, error } = await query;

    if (error) {
      console.warn('Supabase fetch notifications warning:', error.message);
      return null;
    }

    if (!data) return [];

    return data.map((n) => ({
      id: n.id,
      userId: n.user_id,
      title: n.title,
      message: n.message,
      type: n.type,
      complaintId: n.complaint_id || undefined,
      isRead: Boolean(n.is_read),
      priority: n.priority || 'normal',
      actionPage: n.action_page || undefined,
      createdAt: n.created_at,
    }));
  } catch (err) {
    console.error('Exception fetching notifications from Supabase:', err);
    return null;
  }
}

export async function insertNotificationToSupabase(
  notification: AppNotification
): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;

  try {
    const { error } = await supabase.from('notifications').insert([
      {
        id: notification.id,
        user_id: notification.userId,
        title: notification.title,
        message: notification.message,
        type: notification.type,
        complaint_id: notification.complaintId || null,
        is_read: notification.isRead,
        priority: notification.priority || 'normal',
        action_page: notification.actionPage || null,
        created_at: notification.createdAt,
      },
    ]);

    if (error) {
      console.warn('Error inserting notification to Supabase:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.error('Exception inserting notification to Supabase:', err);
    return false;
  }
}

export async function markNotificationAsReadInSupabase(
  notificationId: string
): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;

  try {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', notificationId);

    if (error) {
      console.warn('Error marking notification as read in Supabase:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.error('Exception marking notification as read in Supabase:', err);
    return false;
  }
}

export async function markAllNotificationsAsReadInSupabase(
  userId: string
): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;

  try {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .or(`user_id.eq.${userId},user_id.eq.all,user_id.eq.citizens,user_id.eq.officers`);

    if (error) {
      console.warn('Error marking all notifications as read in Supabase:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.error('Exception marking all notifications as read in Supabase:', err);
    return false;
  }
}

export async function seedNotificationsToSupabaseIfEmpty(
  sampleNotifications: AppNotification[]
): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;

  try {
    const { count, error } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true });

    if (error || (count !== null && count > 0)) {
      return false;
    }

    console.log('Seeding initial notifications into Supabase...');
    for (const notif of sampleNotifications) {
      await insertNotificationToSupabase(notif);
    }
    return true;
  } catch (err) {
    console.warn('Could not auto-seed notifications to Supabase:', err);
    return false;
  }
}

