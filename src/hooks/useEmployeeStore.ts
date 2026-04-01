import { useState, useCallback, useMemo, useEffect } from 'react';
import { Employee, TimeEntry, Chantier, MaterialCost, ChantierStats, HourCategory } from '@/types/employee';
import { supabase } from '@/integrations/supabase/client';

export function useEmployeeStore() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [currentEmployeeId, setCurrentEmployeeId] = useState<string | null>(() => {
    const stored = window.localStorage.getItem('gc_currentEmployeeId');
    return stored || null;
  });
  const [hasConnected, setHasConnected] = useState<boolean>(() => {
    const stored = window.localStorage.getItem('gc_hasConnected');
    return stored === 'true';
  });
  const [loginHistory, setLoginHistory] = useState<Array<{timestamp: string, employeeId: string, employeeName: string, role: string}>>(() => {
    const stored = window.localStorage.getItem('gc_loginHistory');
    return stored ? JSON.parse(stored) : [];
  });
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([]);
  const [chantiers, setChantiers] = useState<Chantier[]>([]);
  const [materialCosts, setMaterialCosts] = useState<MaterialCost[]>([]);
  const [hourCategories, setHourCategories] = useState<HourCategory[]>([]);
  const [loading, setLoading] = useState(true);

  // Load all data from Supabase on mount
  useEffect(() => {
    async function loadAll() {
      setLoading(true);
      const [empRes, catRes, chRes, teRes, mcRes] = await Promise.all([
        supabase.from('employees').select('*'),
        supabase.from('hour_categories').select('*'),
        supabase.from('chantiers').select('*'),
        supabase.from('time_entries').select('*'),
        supabase.from('material_costs').select('*'),
      ]);
      setEmployees((empRes.data || []).map(e => ({ id: e.id, nom: e.nom, prenom: e.prenom, coutHoraire: Number(e.cout_horaire), role: e.role || 'employe', pin: e.pin || '0000' })));
      const fetchedCategories = (catRes.data || []).map(c => ({ id: c.id, nom: c.nom, pourcentage: Number(c.pourcentage), isBureau: c.is_bureau }));
      setHourCategories(fetchedCategories);

      // Ensure standard categories exist (absent/congé) for employees
      const ensureDefault = async () => {
        const defaults = [
          { nom: 'Absent', pourcentage: 0, isBureau: false },
          { nom: 'Congé', pourcentage: 0, isBureau: false },
        ];
        for (const def of defaults) {
          if (!fetchedCategories.some((c) => c.nom === def.nom)) {
            await addHourCategory(def);
          }
        }
      };
      ensureDefault();
      setChantiers((chRes.data || []).map(c => ({
        id: c.id,
        nom: c.nom,
        description: c.description || undefined,
        devis: c.devis !== undefined && c.devis !== null ? Number(c.devis) : 0,
        heuresPrevues: c.heures_prevues !== undefined && c.heures_prevues !== null ? Number(c.heures_prevues) : 0,
      })));
      setTimeEntries((teRes.data || []).map(e => ({ id: e.id, employeeId: e.employee_id, chantierId: e.chantier_id || undefined, date: e.date, heures: Number(e.heures), description: e.description || undefined, hourCategoryId: e.hour_category_id || undefined })));
      setMaterialCosts((mcRes.data || []).map(c => ({ id: c.id, chantierId: c.chantier_id, date: c.date, montant: Number(c.montant), description: c.description })));
      setLoading(false);
    }
    loadAll();
  }, []);

  const addEmployee = useCallback(async (employee: Omit<Employee, 'id'>) => {
    const id = Date.now().toString();
    const newEmp: Employee = { ...employee, id };
    setEmployees(prev => [...prev, newEmp]);
    await supabase.from('employees').insert({ id, nom: employee.nom, prenom: employee.prenom, cout_horaire: employee.coutHoraire, role: employee.role, pin: employee.pin });
  }, []);

  const setCurrentEmployee = useCallback((id: string | null) => {
    setCurrentEmployeeId(id);
    setHasConnected(true);
    window.localStorage.setItem('gc_hasConnected', 'true');
    if (id) {
      window.localStorage.setItem('gc_currentEmployeeId', id);
      // Enregistrer dans l'historique
      const employee = employees.find(e => e.id === id);
      if (employee) {
        const newEntry = {
          timestamp: new Date().toISOString(),
          employeeId: id,
          employeeName: `${employee.prenom} ${employee.nom}`,
          role: employee.role
        };
        setLoginHistory(prev => {
          const updated = [newEntry, ...prev.slice(0, 9)]; // Garder les 10 dernières connexions
          window.localStorage.setItem('gc_loginHistory', JSON.stringify(updated));
          return updated;
        });
      }
    } else {
      window.localStorage.removeItem('gc_currentEmployeeId');
    }
  }, [employees]);

  const logout = useCallback(() => {
    setCurrentEmployeeId(null);
    setHasConnected(false);
    window.localStorage.removeItem('gc_currentEmployeeId');
    window.localStorage.removeItem('gc_hasConnected');
  }, []);

  const updateEmployee = useCallback(async (id: string, updates: Partial<Employee>) => {
    setEmployees(prev => prev.map(emp => emp.id === id ? { ...emp, ...updates } : emp));
    const dbUpdates: Record<string, unknown> = {};
    if (updates.nom !== undefined) dbUpdates.nom = updates.nom;
    if (updates.prenom !== undefined) dbUpdates.prenom = updates.prenom;
    if (updates.coutHoraire !== undefined) dbUpdates.cout_horaire = updates.coutHoraire;
    if (updates.role !== undefined) dbUpdates.role = updates.role;
    if (updates.pin !== undefined) dbUpdates.pin = updates.pin;
    await supabase.from('employees').update(dbUpdates).eq('id', id);
  }, []);

  const deleteEmployee = useCallback(async (id: string) => {
    setEmployees(prev => prev.filter(emp => emp.id !== id));
    setTimeEntries(prev => prev.filter(entry => entry.employeeId !== id));
    setMaterialCosts(prev => prev.filter(cost => cost.chantierId !== id));
    if (currentEmployeeId === id) {
      setCurrentEmployee(null);
    }
    await supabase.from('employees').delete().eq('id', id);
  }, [currentEmployeeId, setCurrentEmployee]);

  const addTimeEntry = useCallback(async (entry: Omit<TimeEntry, 'id'>) => {
    const id = Date.now().toString();
    const newEntry: TimeEntry = { ...entry, id };
    setTimeEntries(prev => [...prev, newEntry]);
    await supabase.from('time_entries').insert({
      id, employee_id: entry.employeeId, chantier_id: entry.chantierId || null,
      date: entry.date, heures: entry.heures, description: entry.description || null,
      hour_category_id: entry.hourCategoryId || null,
    });
  }, []);

  const updateTimeEntry = useCallback(async (id: string, updates: Partial<TimeEntry>) => {
    setTimeEntries(prev => prev.map(entry => entry.id === id ? { ...entry, ...updates } : entry));
    const dbUpdates: Record<string, unknown> = {};
    if (updates.employeeId !== undefined) dbUpdates.employee_id = updates.employeeId;
    if (updates.chantierId !== undefined) dbUpdates.chantier_id = updates.chantierId || null;
    if (updates.date !== undefined) dbUpdates.date = updates.date;
    if (updates.heures !== undefined) dbUpdates.heures = updates.heures;
    if (updates.description !== undefined) dbUpdates.description = updates.description || null;
    if (updates.hourCategoryId !== undefined) dbUpdates.hour_category_id = updates.hourCategoryId || null;
    await supabase.from('time_entries').update(dbUpdates).eq('id', id);
  }, []);

  const deleteTimeEntry = useCallback(async (id: string) => {
    setTimeEntries(prev => prev.filter(entry => entry.id !== id));
    await supabase.from('time_entries').delete().eq('id', id);
  }, []);

  const addChantier = useCallback(async (chantier: Omit<Chantier, 'id'>) => {
    const id = `ch${Date.now()}`;
    const newCh: Chantier = { ...chantier, id };
    setChantiers(prev => [...prev, newCh]);
    await supabase.from('chantiers').insert({
      id,
      nom: chantier.nom,
      description: chantier.description || null,
      devis: chantier.devis ?? 0,
      heures_prevues: chantier.heuresPrevues ?? 0,
    });
  }, []);

  const deleteChantier = useCallback(async (id: string) => {
    setChantiers(prev => prev.filter(ch => ch.id !== id));
    setTimeEntries(prev => prev.filter(entry => entry.chantierId !== id));
    setMaterialCosts(prev => prev.filter(cost => cost.chantierId !== id));
    await supabase.from('chantiers').delete().eq('id', id);
  }, []);

  const updateChantier = useCallback(async (id: string, updates: Partial<Chantier>) => {
    setChantiers(prev => prev.map(ch => ch.id === id ? { ...ch, ...updates } : ch));
    const dbUpdates: Record<string, unknown> = {};
    if (updates.nom !== undefined) dbUpdates.nom = updates.nom;
    if (updates.description !== undefined) dbUpdates.description = updates.description || null;
    if (updates.devis !== undefined) dbUpdates.devis = updates.devis;
    if (updates.heuresPrevues !== undefined) dbUpdates.heures_prevues = updates.heuresPrevues;
    if (Object.keys(dbUpdates).length > 0) {
      await supabase.from('chantiers').update(dbUpdates).eq('id', id);
    }
  }, []);

  const addMaterialCost = useCallback(async (cost: Omit<MaterialCost, 'id'>) => {
    const id = `mc${Date.now()}`;
    const newCost: MaterialCost = { ...cost, id };
    setMaterialCosts(prev => [...prev, newCost]);
    await supabase.from('material_costs').insert({ id, chantier_id: cost.chantierId, date: cost.date, montant: cost.montant, description: cost.description });
  }, []);

  const deleteMaterialCost = useCallback(async (id: string) => {
    setMaterialCosts(prev => prev.filter(cost => cost.id !== id));
    await supabase.from('material_costs').delete().eq('id', id);
  }, []);

  const addHourCategory = useCallback(async (cat: Omit<HourCategory, 'id'>) => {
    const id = `hc${Date.now()}`;
    const newCat: HourCategory = { ...cat, id };
    setHourCategories(prev => [...prev, newCat]);
    await supabase.from('hour_categories').insert({ id, nom: cat.nom, pourcentage: cat.pourcentage, is_bureau: cat.isBureau || false });
  }, []);

  const updateHourCategory = useCallback(async (id: string, updates: Partial<HourCategory>) => {
    setHourCategories(prev => prev.map(cat => cat.id === id ? { ...cat, ...updates } : cat));
    const dbUpdates: Record<string, unknown> = {};
    if (updates.nom !== undefined) dbUpdates.nom = updates.nom;
    if (updates.pourcentage !== undefined) dbUpdates.pourcentage = updates.pourcentage;
    if (updates.isBureau !== undefined) dbUpdates.is_bureau = updates.isBureau;
    await supabase.from('hour_categories').update(dbUpdates).eq('id', id);
  }, []);

  const deleteHourCategory = useCallback(async (id: string) => {
    setHourCategories(prev => prev.filter(cat => cat.id !== id));
    await supabase.from('hour_categories').delete().eq('id', id);
  }, []);

  const restoreData = useCallback(async (data: {
    employees: Employee[];
    timeEntries: TimeEntry[];
    chantiers: Chantier[];
    materialCosts: MaterialCost[];
    hourCategories: HourCategory[];
  }) => {
    // Clear all tables then insert
    await Promise.all([
      supabase.from('time_entries').delete().neq('id', ''),
      supabase.from('material_costs').delete().neq('id', ''),
    ]);
    await Promise.all([
      supabase.from('employees').delete().neq('id', ''),
      supabase.from('chantiers').delete().neq('id', ''),
      supabase.from('hour_categories').delete().neq('id', ''),
    ]);

    // Insert new data
    if (data.employees.length > 0) {
      await supabase.from('employees').insert(data.employees.map(e => ({ id: e.id, nom: e.nom, prenom: e.prenom, cout_horaire: e.coutHoraire })));
    }
    if (data.hourCategories.length > 0) {
      await supabase.from('hour_categories').insert(data.hourCategories.map(c => ({ id: c.id, nom: c.nom, pourcentage: c.pourcentage, is_bureau: c.isBureau || false })));
    }
    if (data.chantiers.length > 0) {
      await supabase.from('chantiers').insert(data.chantiers.map(c => ({
        id: c.id,
        nom: c.nom,
        description: c.description || null,
        devis: c.devis ?? 0,
        heures_prevues: c.heuresPrevues ?? 0,
      })));
    }
    if (data.timeEntries.length > 0) {
      await supabase.from('time_entries').insert(data.timeEntries.map(e => ({ id: e.id, employee_id: e.employeeId, chantier_id: e.chantierId || null, date: e.date, heures: e.heures, description: e.description || null, hour_category_id: e.hourCategoryId || null })));
    }
    if (data.materialCosts.length > 0) {
      await supabase.from('material_costs').insert(data.materialCosts.map(c => ({ id: c.id, chantier_id: c.chantierId, date: c.date, montant: c.montant, description: c.description })));
    }

    setEmployees(data.employees);
    setTimeEntries(data.timeEntries);
    setChantiers(data.chantiers);
    setMaterialCosts(data.materialCosts);
    setHourCategories(data.hourCategories);

    // Reset current employee if it no longer exists
    if (currentEmployeeId && !data.employees.some((e) => e.id === currentEmployeeId)) {
      setCurrentEmployee(null);
    }
  }, [currentEmployeeId, setCurrentEmployee]);

  const getHourCategoryById = useCallback(
    (id: string) => hourCategories.find(cat => cat.id === id),
    [hourCategories]
  );

  const getEmployeeById = useCallback(
    (id: string) => employees.find(emp => emp.id === id),
    [employees]
  );

  const getChantierById = useCallback(
    (id: string) => chantiers.find(ch => ch.id === id),
    [chantiers]
  );

  const getTimeEntriesForEmployee = useCallback(
    (employeeId: string) => timeEntries.filter(entry => entry.employeeId === employeeId),
    [timeEntries]
  );

  const getTotalHoursForEmployee = useCallback(
    (employeeId: string) =>
      timeEntries.filter(entry => entry.employeeId === employeeId).reduce((sum, entry) => sum + entry.heures, 0),
    [timeEntries]
  );

  const getEntryCost = useCallback(
    (entry: TimeEntry) => {
      const employee = getEmployeeById(entry.employeeId);
      if (!employee) return 0;
      const cat = entry.hourCategoryId ? getHourCategoryById(entry.hourCategoryId) : null;
      const multiplier = cat ? 1 + cat.pourcentage / 100 : 1;
      return entry.heures * employee.coutHoraire * multiplier;
    },
    [getEmployeeById, getHourCategoryById]
  );

  const getTotalCostForEmployee = useCallback(
    (employeeId: string) => {
      return timeEntries
        .filter(entry => entry.employeeId === employeeId)
        .reduce((sum, entry) => sum + getEntryCost(entry), 0);
    },
    [timeEntries, getEntryCost]
  );

  const chantierStats = useMemo((): ChantierStats[] => {
    const directEntries = timeEntries.filter(entry => entry.chantierId);
    const bureauEntries = timeEntries.filter(entry => !entry.chantierId);
    const totalDirectHours = directEntries.reduce((sum, e) => sum + e.heures, 0);
    const totalBureauHours = bureauEntries.reduce((sum, e) => sum + e.heures, 0);
    const totalBureauCost = bureauEntries.reduce((sum, e) => sum + getEntryCost(e), 0);

    return chantiers.map(chantier => {
      const chantierEntries = directEntries.filter(entry => entry.chantierId === chantier.id);
      const heures = chantierEntries.reduce((sum, entry) => sum + entry.heures, 0);
      const coutMain = chantierEntries.reduce((sum, entry) => sum + getEntryCost(entry), 0);
      const coutMateriel = materialCosts
        .filter(cost => cost.chantierId === chantier.id)
        .reduce((sum, cost) => sum + cost.montant, 0);

      const ratio = totalDirectHours > 0 ? heures / totalDirectHours : 0;
      const heuresBureau = totalBureauHours * ratio;
      const coutBureau = totalBureauCost * ratio;

      return { chantierId: chantier.id, chantierNom: chantier.nom, heures, coutMain, coutMateriel, coutTotal: coutMain + coutMateriel + coutBureau, heuresBureau, coutBureau };
    });
  }, [chantiers, timeEntries, materialCosts, getEntryCost]);

  const stats = useMemo(() => {
    const totalHeures = timeEntries.reduce((sum, entry) => sum + entry.heures, 0);
    const totalCout = timeEntries.reduce((sum, entry) => sum + getEntryCost(entry), 0);
    const totalMateriel = materialCosts.reduce((sum, cost) => sum + cost.montant, 0);

    return {
      totalEmployees: employees.length,
      totalHeures,
      totalCout,
      totalMateriel,
      totalGlobal: totalCout + totalMateriel,
    };
  }, [employees, timeEntries, materialCosts, getEntryCost]);

  return {
    employees,
    setEmployees,
    currentEmployeeId,
    setCurrentEmployeeId,
    hasConnected,
    timeEntries,
    chantiers,
    materialCosts,
    hourCategories,
    loading,
    addEmployee,
    updateEmployee,
    deleteEmployee,
    addTimeEntry,
    updateTimeEntry,
    deleteTimeEntry,
    addChantier,
    deleteChantier,
    updateChantier,
    addMaterialCost,
    deleteMaterialCost,
    addHourCategory,
    updateHourCategory,
    deleteHourCategory,
    getEmployeeById,
    getChantierById,
    getHourCategoryById,
    getEntryCost,
    getTimeEntriesForEmployee,
    getTotalHoursForEmployee,
    getTotalCostForEmployee,
    restoreData,
    chantierStats,
    stats,
    setCurrentEmployee,
    logout,
    loginHistory,
  };
}
