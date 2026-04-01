-- Create employees table
CREATE TABLE public.employees (
  id TEXT PRIMARY KEY,
  nom TEXT NOT NULL,
  prenom TEXT NOT NULL,
  cout_horaire NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read/write employees" ON public.employees FOR ALL USING (true) WITH CHECK (true);

-- Create hour_categories table
CREATE TABLE public.hour_categories (
  id TEXT PRIMARY KEY,
  nom TEXT NOT NULL,
  pourcentage NUMERIC NOT NULL DEFAULT 0,
  is_bureau BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.hour_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read/write hour_categories" ON public.hour_categories FOR ALL USING (true) WITH CHECK (true);

-- Create chantiers table
CREATE TABLE public.chantiers (
  id TEXT PRIMARY KEY,
  nom TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.chantiers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read/write chantiers" ON public.chantiers FOR ALL USING (true) WITH CHECK (true);

-- Create time_entries table
CREATE TABLE public.time_entries (
  id TEXT PRIMARY KEY,
  employee_id TEXT NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  chantier_id TEXT REFERENCES public.chantiers(id) ON DELETE CASCADE,
  date TEXT NOT NULL,
  heures NUMERIC NOT NULL DEFAULT 0,
  description TEXT,
  hour_category_id TEXT REFERENCES public.hour_categories(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.time_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read/write time_entries" ON public.time_entries FOR ALL USING (true) WITH CHECK (true);

-- Create material_costs table
CREATE TABLE public.material_costs (
  id TEXT PRIMARY KEY,
  chantier_id TEXT NOT NULL REFERENCES public.chantiers(id) ON DELETE CASCADE,
  date TEXT NOT NULL,
  montant NUMERIC NOT NULL DEFAULT 0,
  description TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.material_costs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read/write material_costs" ON public.material_costs FOR ALL USING (true) WITH CHECK (true);