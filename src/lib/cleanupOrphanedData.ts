import { supabase } from '@/integrations/supabase/client';

/**
 * Nettoie les entrées orphelines (chantier_id invalide ou inexistant)
 * Sûr - ne supprime que les données corrompues, pas les chantiers en cours
 */
export async function cleanupOrphanedTimeEntries() {
  try {
    console.log('[Cleanup] Debut du nettoyage des entrees orphelines...');

    // Récupérer tous les chantiers valides
    const { data: validChantiers, error: chantierError } = await supabase
      .from('chantiers')
      .select('id');

    if (chantierError) throw chantierError;

    const validChantiersIds = new Set((validChantiers || []).map(c => c.id));
    console.log(`[Cleanup] Chantiers valides trouves: ${validChantiersIds.size}`);

    // Récupérer TOUTES les entrées de temps (batch par batch si nécessaire)
    const { data: allTimeEntries, error: entriesError } = await supabase
      .from('time_entries')
      .select('id, chantier_id, employee_id, date')
      .limit(10000); // Supabase max limit par requête

    if (entriesError) throw entriesError;

    if (!allTimeEntries || allTimeEntries.length === 0) {
      console.log('[Cleanup] Aucune entree a verifier');
      return { deleted: 0 };
    }

    // Identifier les orphelines
    const orphanedIds = allTimeEntries
      .filter(entry => {
        // L'entrée est orpheline si:
        // 1. chantier_id est défini ET pas valide (string aléatoire, ID inexistant)
        if (entry.chantier_id) {
          return !validChantiersIds.has(entry.chantier_id);
        }
        // Les entrées sans chantier (null) sont VALIDES (ex: travail de bureau)
        return false;
      })
      .map(e => e.id);

    console.log(`[Cleanup] Orphelines trouvees: ${orphanedIds.length}`);

    if (orphanedIds.length === 0) {
      console.log('[Cleanup] Pas de donnees orphelines a supprimer');
      return { deleted: 0 };
    }

    // Supprimer par batch (Supabase limite les requêtes)
    const batchSize = 100;
    let totalDeleted = 0;

    for (let i = 0; i < orphanedIds.length; i += batchSize) {
      const batch = orphanedIds.slice(i, i + batchSize);
      const { error: deleteError } = await supabase
        .from('time_entries')
        .delete()
        .in('id', batch);

      if (deleteError) {
        console.error('[Cleanup] Erreur lors de la suppression:', deleteError);
        throw deleteError;
      }

      totalDeleted += batch.length;
      console.log(`  [Cleanup] Batch ${Math.ceil(i / batchSize) + 1}: ${batch.length} entrees supprimees`);
    }

    console.log(`[Cleanup] Nettoyage termine! ${totalDeleted} entrees orphelines supprimees`);
    return { deleted: totalDeleted };
  } catch (error) {
    console.error('[Cleanup] Erreur lors du nettoyage:', error);
    return { deleted: 0, error };
  }
}

/**
 * Analyse et rapporte l'utilisation de l'espace (diagnostic)
 */
export async function analyzeStorageUsage() {
  try {
    const { data: timeEntries } = await supabase
      .from('time_entries')
      .select('id, chantier_id, created_at')
      .limit(10000);

    const { data: chantiers } = await supabase
      .from('chantiers')
      .select('id, nom, created_at');

    const { data: employees } = await supabase
      .from('employees')
      .select('id, nom, prenom');

    const totalSize = (timeEntries?.length || 0) + (chantiers?.length || 0) + (employees?.length || 0);

    console.log('[Cleanup] Diagnostic de stockage:');
    console.log(`  - Time entries: ${timeEntries?.length || 0}`);
    console.log(`  - Chantiers: ${chantiers?.length || 0}`);
    console.log(`  - Employees: ${employees?.length || 0}`);
    console.log(`  - TOTAL: ${totalSize} enregistrements`);

    return {
      timeEntries: timeEntries?.length || 0,
      chantiers: chantiers?.length || 0,
      employees: employees?.length || 0,
      total: totalSize,
    };
  } catch (error) {
    console.error('[Cleanup] Erreur lors de l\'analyse:', error);
    return null;
  }
}
