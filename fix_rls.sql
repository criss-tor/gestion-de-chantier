-- Script pour corriger les erreurs RLS
-- À exécuter dans le dashboard Supabase > SQL Editor

-- Désactiver RLS sur toutes les tables
ALTER TABLE public.employees DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.hour_categories DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.chantiers DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.time_entries DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.material_costs DISABLE ROW LEVEL SECURITY;

-- Supprimer toutes les politiques existantes
DROP POLICY IF EXISTS "Users can view their own employees" ON public.employees;
DROP POLICY IF EXISTS "Users can insert their own employees" ON public.employees;
DROP POLICY IF EXISTS "Users can update their own employees" ON public.employees;
DROP POLICY IF EXISTS "Users can delete their own employees" ON public.employees;

DROP POLICY IF EXISTS "Users can view their own hour_categories" ON public.hour_categories;
DROP POLICY IF EXISTS "Users can insert their own hour_categories" ON public.hour_categories;
DROP POLICY IF EXISTS "Users can update their own hour_categories" ON public.hour_categories;
DROP POLICY IF EXISTS "Users can delete their own hour_categories" ON public.hour_categories;

DROP POLICY IF EXISTS "Users can view their own chantiers" ON public.chantiers;
DROP POLICY IF EXISTS "Users can insert their own chantiers" ON public.chantiers;
DROP POLICY IF EXISTS "Users can update their own chantiers" ON public.chantiers;
DROP POLICY IF EXISTS "Users can delete their own chantiers" ON public.chantiers;

DROP POLICY IF EXISTS "Users can view their own time_entries" ON public.time_entries;
DROP POLICY IF EXISTS "Users can insert their own time_entries" ON public.time_entries;
DROP POLICY IF EXISTS "Users can update their own time_entries" ON public.time_entries;
DROP POLICY IF EXISTS "Users can delete their own time_entries" ON public.time_entries;

DROP POLICY IF EXISTS "Users can view their own material_costs" ON public.material_costs;
DROP POLICY IF EXISTS "Users can insert their own material_costs" ON public.material_costs;
DROP POLICY IF EXISTS "Users can update their own material_costs" ON public.material_costs;
DROP POLICY IF EXISTS "Users can delete their own material_costs" ON public.material_costs;

-- Donner les permissions de base sur les tables
GRANT ALL ON public.employees TO authenticated;
GRANT ALL ON public.employees TO anon;
GRANT ALL ON public.hour_categories TO authenticated;
GRANT ALL ON public.hour_categories TO anon;
GRANT ALL ON public.chantiers TO authenticated;
GRANT ALL ON public.chantiers TO anon;
GRANT ALL ON public.time_entries TO authenticated;
GRANT ALL ON public.time_entries TO anon;
GRANT ALL ON public.material_costs TO authenticated;
GRANT ALL ON public.material_costs TO anon;
