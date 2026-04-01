-- Add devis field to chantiers table
ALTER TABLE public.chantiers
  ADD COLUMN IF NOT EXISTS devis NUMERIC NOT NULL DEFAULT 0;

-- Add heures prevues field to chantiers table
ALTER TABLE public.chantiers
  ADD COLUMN IF NOT EXISTS heures_prevues NUMERIC NOT NULL DEFAULT 0;
