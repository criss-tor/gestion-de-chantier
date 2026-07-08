-- Accélère les requêtes filtrées par date (réduit scans complets = moins de mémoire)
CREATE INDEX IF NOT EXISTS idx_time_entries_date ON public.time_entries (date DESC);
CREATE INDEX IF NOT EXISTS idx_material_costs_date ON public.material_costs (date DESC);
CREATE INDEX IF NOT EXISTS idx_time_entries_chantier_id ON public.time_entries (chantier_id) WHERE chantier_id IS NOT NULL;
