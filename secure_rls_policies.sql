-- Politiques RLS sécurisées pour l'application
-- Remplace le système public par un contrôle d'accès basé sur l'authentification

-- Activer RLS sur toutes les tables
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hour_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chantiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.time_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.material_costs ENABLE ROW LEVEL SECURITY;

-- Politiques pour les employés (uniquement pour les admins)
CREATE POLICY "Seuls les admins peuvent voir les employés" ON public.employees
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.employees 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Seuls les admins peuvent insérer des employés" ON public.employees
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.employees 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Politiques pour les catégories d'heures (lecture seule pour tous)
CREATE POLICY "Tout le monde peut voir les catégories" ON public.hour_categories
  FOR SELECT USING (true);

CREATE POLICY "Seuls les admins peuvent gérer les catégories" ON public.hour_categories
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.employees 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Politiques pour les chantiers (lecture seule pour tous)
CREATE POLICY "Tout le monde peut voir les chantiers" ON public.chantiers
  FOR SELECT USING (true);

CREATE POLICY "Seuls les admins peuvent gérer les chantiers" ON public.chantiers
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.employees 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Politiques pour les entrées de temps (uniquement ses propres entrées)
CREATE POLICY "Les employés ne voient que leurs propres entrées" ON public.time_entries
  FOR SELECT USING (employee_id = auth.uid());

CREATE POLICY "Les employés ne peuvent insérer que leurs propres entrées" ON public.time_entries
  FOR INSERT WITH CHECK (employee_id = auth.uid());

CREATE POLICY "Les employés ne peuvent modifier que leurs propres entrées" ON public.time_entries
  FOR UPDATE USING (employee_id = auth.uid());

CREATE POLICY "Les employés ne peuvent supprimer que leurs propres entrées" ON public.time_entries
  FOR DELETE USING (employee_id = auth.uid());

-- Les admins peuvent voir et gérer toutes les entrées
CREATE POLICY "Les admins peuvent gérer toutes les entrées" ON public.time_entries
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.employees 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Politiques pour les coûts matériels (uniquement les admins)
CREATE POLICY "Seuls les admins peuvent voir les coûts matériels" ON public.material_costs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.employees 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Seuls les admins peuvent gérer les coûts matériels" ON public.material_costs
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.employees 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );
