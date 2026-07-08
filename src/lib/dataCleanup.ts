import { supabase } from '@/integrations/supabase/client';
import { subMonths } from 'date-fns';

/**
 * Nettoie automatiquement les anciennes entrées pour éviter de dépasser le quota Supabase
 * Supprime les entrées de plus de 6 mois
 */
export async function cleanupOldEntries() {
  try {
    // Calculer la date limite (6 mois en arrière)
    const sixMonthsAgo = subMonths(new Date(), 6).toISOString().split('T')[0];
    
    console.log(`🧹 Nettoyage des entrées avant ${sixMonthsAgo}...`);
    
    // Supprimer les time_entries
    const { data: deletedEntries, error: entriesError } = await supabase
      .from('time_entries')
      .delete()
      .lt('date', sixMonthsAgo)
      .select('id');
    
    if (entriesError) {
      console.error('Erreur lors du nettoyage des time_entries:', entriesError);
      return { success: false, error: entriesError };
    }
    
    // Supprimer les material_costs
    const { data: deletedCosts, error: costsError } = await supabase
      .from('material_costs')
      .delete()
      .lt('date', sixMonthsAgo)
      .select('id');
    
    if (costsError) {
      console.error('Erreur lors du nettoyage des material_costs:', costsError);
      return { success: false, error: costsError };
    }
    
    const totalDeleted = (deletedEntries?.length || 0) + (deletedCosts?.length || 0);
    console.log(`✅ ${totalDeleted} entrées archivées (${sixMonthsAgo})`);
    
    return { success: true, deleted: totalDeleted };
  } catch (error) {
    console.error('Erreur inattendue lors du nettoyage:', error);
    return { success: false, error };
  }
}

/**
 * Vérifie la taille approximative de la table pour alerter sur les limites
 */
export async function checkDataSize() {
  try {
    const { count: timeEntriesCount, error: entriesError } = await supabase
      .from('time_entries')
      .select('*', { count: 'exact', head: true });
    
    const { count: costsCount, error: costsError } = await supabase
      .from('material_costs')
      .select('*', { count: 'exact', head: true });
    
    if (entriesError || costsError) {
      console.warn('Impossible de vérifier la taille des données');
      return null;
    }
    
    const totalRecords = (timeEntriesCount || 0) + (costsCount || 0);
    console.log(`📊 Enregistrements total: ${totalRecords}`);
    
    // Alerte si on approche 100k enregistrements (limite prudente)
    if (totalRecords > 80000) {
      console.warn(`⚠️ Attention: ${totalRecords} enregistrements. Approche de la limite!`);
      return { warning: true, records: totalRecords };
    }
    
    return { warning: false, records: totalRecords };
  } catch (error) {
    console.error('Erreur lors de la vérification de la taille:', error);
    return null;
  }
}

/**
 * Planifie un nettoyage automatique une fois par mois
 */
export function scheduleMonthlyCleanup() {
  const lastCleanupKey = 'gc_last_monthly_cleanup_date';
  const lastCleanup = localStorage.getItem(lastCleanupKey);
  const today = new Date().toISOString().split('T')[0];
  
  // Si le dernier nettoyage n'est pas d'aujourd'hui
  if (lastCleanup !== today) {
    // Ne nettoyer que une fois par mois
    const lastCleanupDate = lastCleanup ? new Date(lastCleanup) : null;
    const daysSinceLastCleanup = lastCleanupDate 
      ? Math.floor((new Date().getTime() - lastCleanupDate.getTime()) / (1000 * 60 * 60 * 24))
      : 31;
    
    if (daysSinceLastCleanup >= 30) {
      cleanupOldEntries().then(() => {
        localStorage.setItem(lastCleanupKey, today);
      });
    }
  }
}
