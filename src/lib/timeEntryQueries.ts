import { supabase } from '@/integrations/supabase/client';
import { MaterialCost, TimeEntry } from '@/types/employee';

const TIME_ENTRY_COLUMNS = 'id, employee_id, chantier_id, date, heures, description, hour_category_id';
const MATERIAL_COST_COLUMNS = 'id, chantier_id, date, montant, description';

export function mapTimeEntry(row: {
  id: string;
  employee_id: string;
  chantier_id: string | null;
  date: string;
  heures: number;
  description: string | null;
  hour_category_id: string | null;
}): TimeEntry {
  return {
    id: row.id,
    employeeId: row.employee_id,
    chantierId: row.chantier_id || undefined,
    date: row.date,
    heures: Number(row.heures),
    description: row.description || undefined,
    hourCategoryId: row.hour_category_id || undefined,
  };
}

export function mapMaterialCost(row: {
  id: string;
  chantier_id: string;
  date: string;
  montant: number;
  description: string;
}): MaterialCost {
  return {
    id: row.id,
    chantierId: row.chantier_id,
    date: row.date,
    montant: Number(row.montant),
    description: row.description,
  };
}

export function mergeTimeEntriesById(existing: TimeEntry[], incoming: TimeEntry[]): TimeEntry[] {
  const byId = new Map(existing.map((entry) => [entry.id, entry]));
  incoming.forEach((entry) => byId.set(entry.id, entry));
  return Array.from(byId.values());
}

const PAGE_SIZE = 1000;

async function fetchAllRows<T>(
  table: 'time_entries' | 'material_costs',
  columns: string,
  applyFilter?: (query: ReturnType<typeof supabase.from>) => ReturnType<typeof supabase.from>
): Promise<T[]> {
  const all: T[] = [];
  let from = 0;

  while (true) {
    let query = supabase.from(table).select(columns).order('date', { ascending: false }).range(from, from + PAGE_SIZE - 1);
    if (applyFilter) {
      query = applyFilter(query) as typeof query;
    }
    const { data, error } = await query;
    if (error) throw error;
    if (!data?.length) break;
    all.push(...(data as T[]));
    if (data.length < PAGE_SIZE) break;
    from += PAGE_SIZE;
  }

  return all;
}

export async function fetchTimeEntries(options: {
  employeeId?: string;
  fromDate?: string;
} = {}): Promise<TimeEntry[]> {
  const rows = await fetchAllRows<Parameters<typeof mapTimeEntry>[0]>('time_entries', TIME_ENTRY_COLUMNS, (query) => {
    let q = query;
    if (options.employeeId) {
      q = q.eq('employee_id', options.employeeId);
    }
    if (options.fromDate) {
      q = q.gte('date', options.fromDate);
    }
    return q;
  });
  return rows.map(mapTimeEntry);
}

export async function fetchAllTimeEntries(): Promise<TimeEntry[]> {
  return fetchTimeEntries();
}

export async function fetchMaterialCosts(options: { fromDate?: string } = {}): Promise<MaterialCost[]> {
  const rows = await fetchAllRows<Parameters<typeof mapMaterialCost>[0]>('material_costs', MATERIAL_COST_COLUMNS, (query) => {
    if (options.fromDate) {
      return query.gte('date', options.fromDate);
    }
    return query;
  });
  return rows.map(mapMaterialCost);
}

export async function fetchAllMaterialCosts(): Promise<MaterialCost[]> {
  return fetchMaterialCosts();
}
