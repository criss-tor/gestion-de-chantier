import { useState, useCallback, useMemo, useEffect } from 'react';
import { Employee, TimeEntry, Chantier, MaterialCost, ChantierStats, HourCategory } from '@/types/employee';
import { supabase } from '@/integrations/supabase/client';

// Clés de localStorage spécifiques à chaque session pour éviter les conflits
const getSessionKey = (baseKey: string) => {
  // Utiliser un identifiant de session unique pour chaque utilisateur
  const sessionId = sessionStorage.getItem('gc_sessionId') || generateSessionId();
  if (!sessionStorage.getItem('gc_sessionId')) {
    sessionStorage.setItem('gc_sessionId', sessionId);
  }
  return `${baseKey}_${sessionId}`;
};

const generateSessionId = () => {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
};

export function useSecureEmployeeStore() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [currentEmployeeId, setCurrentEmployeeId] = useState<string | null>(() => {
    const stored = localStorage.getItem(getSessionKey('gc_currentEmployeeId'));
    return stored || null;
  });
  const [hasConnected, setHasConnected] = useState(() => {
    const stored = localStorage.getItem(getSessionKey('gc_hasConnected'));
    return stored === 'true';
  });
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([]);
  const [chantiers, setChantiers] = useState<Chantier[]>([]);
  const [materialCosts, setMaterialCosts] = useState<MaterialCost[]>([]);
  const [hourCategories, setHourCategories] = useState<HourCategory[]>([]);
  const [loading, setLoading] = useState(true);

  // Vérifier l'authentification au chargement
  useEffect(() => {
    const checkAuth = () => {
      const sessionId = sessionStorage.getItem('gc_sessionId');
      if (!sessionId) {
        // Nouvelle session, effacer les données potentiellement sensibles
        setCurrentEmployeeId(null);
        setHasConnected(false);
        sessionStorage.setItem('gc_sessionId', generateSessionId());
      }
    };
    checkAuth();
  }, []);

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
    localStorage.setItem(getSessionKey('gc_hasConnected'), 'true');
    if (id) {
      localStorage.setItem(getSessionKey('gc_currentEmployeeId'), id);
    } else {
      localStorage.removeItem(getSessionKey('gc_currentEmployeeId'));
    }
  }, [employees]);

  const logout = useCallback(() => {
    setCurrentEmployeeId(null);
    setHasConnected(false);
    localStorage.removeItem(getSessionKey('gc_currentEmployeeId'));
    localStorage.removeItem(getSessionKey('gc_hasConnected'));
    // Générer une nouvelle session pour éviter la réutilisation
    sessionStorage.removeItem('gc_sessionId');
    sessionStorage.setItem('gc_sessionId', generateSessionId());
  }, []);

  // ... (le reste des fonctions reste identique)

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
  };
}
