import { TimeEntry, Employee, Chantier, HourCategory, MaterialCost } from '@/types/employee';

// Interface pour les données hors-ligne
interface OfflineData {
  timeEntries: TimeEntry[];
  pendingActions: PendingAction[];
  lastSync: string;
}

interface PendingAction {
  id: string;
  type: 'add' | 'update' | 'delete';
  table: 'time_entries' | 'material_costs';
  data: unknown;
  timestamp: string;
}

// Clés pour le stockage local
const OFFLINE_DATA_KEY = 'gc_offline_data';
const PENDING_ACTIONS_KEY = 'gc_pending_actions';
const LAST_SYNC_KEY = 'gc_last_sync';

export class OfflineStorage {
  private static instance: OfflineStorage;
  
  static getInstance(): OfflineStorage {
    if (!OfflineStorage.instance) {
      OfflineStorage.instance = new OfflineStorage();
    }
    return OfflineStorage.instance;
  }

  // Vérifier si on est hors-ligne
  isOffline(): boolean {
    return !navigator.onLine;
  }

  // Sauvegarder une entrée en attente de synchronisation
  savePendingEntry(entry: TimeEntry): void {
    const pendingAction: PendingAction = {
      id: `entry_${Date.now()}_${Math.random()}`,
      type: 'add',
      table: 'time_entries',
      data: entry,
      timestamp: new Date().toISOString()
    };

    const pending = this.getPendingActions();
    pending.push(pendingAction);
    localStorage.setItem(PENDING_ACTIONS_KEY, JSON.stringify(pending));
  }

  // Récupérer les actions en attente
  getPendingActions(): PendingAction[] {
    const stored = localStorage.getItem(PENDING_ACTIONS_KEY);
    return stored ? JSON.parse(stored) : [];
  }

  // Supprimer une action en attente (après synchronisation)
  removePendingAction(actionId: string): void {
    const pending = this.getPendingActions();
    const filtered = pending.filter(action => action.id !== actionId);
    localStorage.setItem(PENDING_ACTIONS_KEY, JSON.stringify(filtered));
  }

  // Vider toutes les actions en attente
  clearPendingActions(): void {
    localStorage.removeItem(PENDING_ACTIONS_KEY);
  }

  // Sauvegarder les données hors-ligne
  saveOfflineData(data: {
    timeEntries: TimeEntry[];
    employees: Employee[];
    chantiers: Chantier[];
    hourCategories: HourCategory[];
  }): void {
    const offlineData: OfflineData = {
      timeEntries: data.timeEntries,
      pendingActions: this.getPendingActions(),
      lastSync: new Date().toISOString()
    };
    localStorage.setItem(OFFLINE_DATA_KEY, JSON.stringify(offlineData));
  }

  // Récupérer les données hors-ligne
  getOfflineData(): OfflineData | null {
    const stored = localStorage.getItem(OFFLINE_DATA_KEY);
    return stored ? JSON.parse(stored) : null;
  }

  // Obtenir les entrées hors-ligne
  getOfflineTimeEntries(): TimeEntry[] {
    const data = this.getOfflineData();
    return data ? data.timeEntries : [];
  }

  // Ajouter une entrée localement
  addLocalTimeEntry(entry: TimeEntry): void {
    const data = this.getOfflineData() || { timeEntries: [], pendingActions: [], lastSync: '' };
    data.timeEntries.push(entry);
    this.saveOfflineData({ 
      timeEntries: data.timeEntries,
      employees: [],
      chantiers: [],
      hourCategories: []
    });
    this.savePendingEntry(entry);
  }

  // Mettre à jour la date de dernière synchronisation
  updateLastSync(): void {
    localStorage.setItem(LAST_SYNC_KEY, new Date().toISOString());
  }

  // Obtenir la date de dernière synchronisation
  getLastSync(): string | null {
    return localStorage.getItem(LAST_SYNC_KEY);
  }

  // Calculer le nombre d'actions en attente
  getPendingCount(): number {
    return this.getPendingActions().length;
  }

  // Vérifier si une synchronisation est nécessaire
  needsSync(): boolean {
    return this.getPendingCount() > 0;
  }
}

export const offlineStorage = OfflineStorage.getInstance();
