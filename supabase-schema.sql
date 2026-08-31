-- =========================================================
-- NagrikSetu - Goa Civic & Pothole Grievance Portal
-- Supabase PostgreSQL Database Schema
-- =========================================================

-- Enable UUID extension if needed
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ---------------------------------------------------------
-- 1. USERS / PROFILES TABLE
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.users (
  id TEXT PRIMARY KEY, -- Can be Supabase Auth UUID or custom ID
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('citizen', 'officer')),
  phone TEXT,
  taluka TEXT,
  department TEXT,
  designation TEXT,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ---------------------------------------------------------
-- 2. COMPLAINTS TABLE
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.complaints (
  id TEXT PRIMARY KEY, -- Formatted as GOA-YYYY-XXXX (e.g. GOA-2026-8492)
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  predicted_category TEXT,
  image_url TEXT NOT NULL,
  road_type TEXT NOT NULL,
  taluka TEXT NOT NULL,
  road_name TEXT NOT NULL,
  landmark TEXT NOT NULL,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'assigned', 'in_progress', 'resolved')),
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  priority_reason TEXT,
  citizen_id TEXT NOT NULL,
  citizen_name TEXT NOT NULL,
  citizen_phone TEXT,
  citizen_email TEXT,
  assigned_division TEXT,
  assigned_officer_name TEXT,
  assigned_date TIMESTAMPTZ,
  contractor_team TEXT,
  estimated_days INTEGER DEFAULT 3,
  resolution_photo_url TEXT,
  resolution_notes TEXT,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ---------------------------------------------------------
-- 3. STATUS UPDATES / TIMELINE AUDIT LOG TABLE
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.status_updates (
  id TEXT PRIMARY KEY,
  complaint_id TEXT NOT NULL REFERENCES public.complaints(id) ON DELETE CASCADE,
  author_id TEXT,
  author_name TEXT NOT NULL,
  author_role TEXT NOT NULL CHECK (author_role IN ('citizen', 'officer', 'system')),
  status TEXT,
  note_text TEXT NOT NULL,
  photo_url TEXT,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ---------------------------------------------------------
-- 4. FEEDBACK TABLE (Citizen Reviews on Resolved Issues)
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.feedback (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  complaint_id TEXT NOT NULL REFERENCES public.complaints(id) ON DELETE CASCADE,
  citizen_id TEXT NOT NULL,
  citizen_name TEXT NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ---------------------------------------------------------
-- 5. NOTIFICATIONS TABLE (Civic & Officer Alerts)
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.notifications (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id TEXT NOT NULL, -- Specific user id or 'all' / 'citizens' / 'officers'
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'system' CHECK (type IN ('complaint_status', 'complaint_assigned', 'complaint_resolved', 'weather_alert', 'monsoon_advisory', 'high_priority_alert', 'system')),
  complaint_id TEXT REFERENCES public.complaints(id) ON DELETE CASCADE,
  is_read BOOLEAN NOT NULL DEFAULT false,
  priority TEXT NOT NULL DEFAULT 'normal' CHECK (priority IN ('normal', 'warning', 'urgent')),
  action_page TEXT,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ---------------------------------------------------------
-- INDEXES FOR HIGH-PERFORMANCE QUERIES
-- ---------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_complaints_status ON public.complaints(status);
CREATE INDEX IF NOT EXISTS idx_complaints_taluka ON public.complaints(taluka);
CREATE INDEX IF NOT EXISTS idx_complaints_priority ON public.complaints(priority);
CREATE INDEX IF NOT EXISTS idx_complaints_citizen_id ON public.complaints(citizen_id);
CREATE INDEX IF NOT EXISTS idx_complaints_created_at ON public.complaints(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_status_updates_complaint_id ON public.status_updates(complaint_id);
CREATE INDEX IF NOT EXISTS idx_feedback_complaint_id ON public.feedback(complaint_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON public.notifications(is_read);

-- ---------------------------------------------------------
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ---------------------------------------------------------
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.complaints ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.status_updates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Allow public read access to complaints for public civic transparency
CREATE POLICY "Allow public read access to complaints" 
  ON public.complaints FOR SELECT USING (true);

-- Allow authenticated and anonymous users to insert complaints
CREATE POLICY "Allow insert complaints" 
  ON public.complaints FOR INSERT WITH CHECK (true);

-- Allow update complaints (officers or assigned actors)
CREATE POLICY "Allow update complaints" 
  ON public.complaints FOR UPDATE USING (true);

-- Allow status updates read
CREATE POLICY "Allow read status updates" 
  ON public.status_updates FOR SELECT USING (true);

-- Allow status updates insert
CREATE POLICY "Allow insert status updates" 
  ON public.status_updates FOR INSERT WITH CHECK (true);

-- Allow feedback read
CREATE POLICY "Allow read feedback" 
  ON public.feedback FOR SELECT USING (true);

-- Allow feedback insert
CREATE POLICY "Allow insert feedback" 
  ON public.feedback FOR INSERT WITH CHECK (true);

-- Allow notifications read
CREATE POLICY "Allow read notifications" 
  ON public.notifications FOR SELECT USING (true);

-- Allow notifications insert
CREATE POLICY "Allow insert notifications" 
  ON public.notifications FOR INSERT WITH CHECK (true);

-- Allow notifications update
CREATE POLICY "Allow update notifications" 
  ON public.notifications FOR UPDATE USING (true);

-- Allow notifications delete
CREATE POLICY "Allow delete notifications" 
  ON public.notifications FOR DELETE USING (true);

-- Allow read and write on users
CREATE POLICY "Allow read users" 
  ON public.users FOR SELECT USING (true);

CREATE POLICY "Allow upsert users" 
  ON public.users FOR ALL USING (true);

-- ---------------------------------------------------------
-- SEED DATA (Demo Users)
-- ---------------------------------------------------------
INSERT INTO public.users (id, email, name, role, phone, taluka, department, designation)
VALUES 
  ('usr-citizen-01', 'citizen@test.com', 'Devendra Kerkar', 'citizen', '+91 98221 44550', 'Panaji (Tiswadi)', NULL, NULL),
  ('usr-officer-01', 'officer@test.com', 'Eng. Rohan Naik', 'officer', '+91 83224 19200', 'Panaji (Tiswadi)', 'PWD Division III (Roads & Bridges)', 'Assistant Executive Engineer')
ON CONFLICT (email) DO NOTHING;

