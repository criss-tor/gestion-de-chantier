import { useState, useEffect, useCallback } from 'react';
import { offlineStorage } from '@/lib/offlineStorage';
import { TimeEntry } from '@/types/employee';
import { supabase } from '@/integrations/supabase/client';

export function useOfflineSync() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pendingCount, setPendingCount] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSync, setLastSync] = useState<string | null>(null);

  // Mettre à jour le statut de connexion
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      // Tenter de synchroniser quand on revient en ligne
      if (offlineStorage.needsSync()) {
        syncPendingData();
      }
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Mettre à jour le compteur d'actions en attente
  useEffect(() => {
    const updatePendingCount = () => {
      setPendingCount(offlineStorage.getPendingCount());
      setLastSync(offlineStorage.getLastSync());
    };

    updatePendingCount();
    
    // Mettre à jour toutes les 30 secondes
    const interval = setInterval(updatePendingCount, 30000);
    return () => clearInterval(interval);
  }, []);

  // Synchroniser les données en attente
  const syncPendingData = useCallback(async () => {
    if (!isOnline || isSyncing) return;

    setIsSyncing(true);
    const pendingActions = offlineStorage.getPendingActions();
    
    if (pendingActions.length === 0) {
      setIsSyncing(false);
      return;
    }

    console.log(`Synchronisation de ${pendingActions.length} actions en attente...`);

    try {
      for (const action of pendingActions) {
        try {
          if (action.type === 'add' && action.table === 'time_entries') {
            const entry = action.data;
            await supabase.from('time_entries').insert({
              id: entry.id,
              employee_id: entry.employeeId,
              chantier_id: entry.chantierId || null,
              date: entry.date,
              heures: entry.heures,
              description: entry.description || null,
              hour_category_id: entry.hourCategoryId || null
            });
            
            // Supprimer l'action en attente après succès
            offlineStorage.removePendingAction(action.id);
          }
        } catch (error) {
          console.error('Erreur lors de la synchronisation d\'une action:', error);
        }
      }

      // Mettre à jour la date de dernière synchronisation
      offlineStorage.updateLastSync();
      setPendingCount(offlineStorage.getPendingCount());
      setLastSync(offlineStorage.getLastSync());
      
    } catch (error) {
      console.error('Erreur lors de la synchronisation:', error);
    } finally {
      setIsSyncing(false);
    }
  }, [isOnline, isSyncing]);

  // Ajouter une entrée (gère hors-ligne automatiquement)
  const addTimeEntryOffline = useCallback((entry: Omit<TimeEntry, 'id'>) => {
    const newEntry: TimeEntry = {
      ...entry,
      id: `offline_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    };

    if (isOnline) {
      // En ligne : ajouter directement à Supabase
      return supabase.from('time_entries').insert({
        id: newEntry.id,
        employee_id: newEntry.employeeId,
        chantier_id: newEntry.chantierId || null,
        date: newEntry.date,
        heures: newEntry.heures,
        description: newEntry.description || null,
        hour_category_id: newEntry.hourCategoryId || null
      });
    } else {
      // Hors-ligne : sauvegarder localement
      offlineStorage.addLocalTimeEntry(newEntry);
      setPendingCount(prev => prev + 1);
      return Promise.resolve({ data: null, error: null });
    }
  }, [isOnline]);

  return {
    isOnline,
    isOffline: !isOnline,
    pendingCount,
    isSyncing,
    lastSync,
    syncPendingData,
    addTimeEntryOffline,
    needsSync: pendingCount > 0
  };
}
