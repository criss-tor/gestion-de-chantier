-- Add role and pin fields to employees table
ALTER TABLE public.employees
  ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'employe',
  ADD COLUMN IF NOT EXISTS pin TEXT NOT NULL DEFAULT '0000';

-- Add check constraint for role values
ALTER TABLE public.employees
  ADD CONSTRAINT employees_role_check CHECK (role IN ('admin', 'employe'));

-- Add check constraint for pin format (4 digits)
ALTER TABLE public.employees
  ADD CONSTRAINT employees_pin_check CHECK (pin ~ '^\d{4}$');