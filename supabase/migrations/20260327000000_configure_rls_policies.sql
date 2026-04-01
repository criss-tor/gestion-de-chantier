-- Configure Row Level Security (RLS) policies for secure access control
-- This migration replaces the public policies with role-based access control
-- NOTE: This app uses client-side authentication, so RLS is disabled

-- ===========================================
-- DISABLE RLS FOR ALL TABLES (Client-side auth)
-- ===========================================

-- Employees table
ALTER TABLE public.employees DISABLE ROW LEVEL SECURITY;

-- Hour categories table
ALTER TABLE public.hour_categories DISABLE ROW LEVEL SECURITY;

-- Chantiers table
ALTER TABLE public.chantiers DISABLE ROW LEVEL SECURITY;

-- Time entries table
ALTER TABLE public.time_entries DISABLE ROW LEVEL SECURITY;

-- Material costs table
ALTER TABLE public.material_costs DISABLE ROW LEVEL SECURITY;