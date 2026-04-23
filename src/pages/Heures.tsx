import { useState, useEffect } from 'react';
import { useEmployeeContext } from '@/contexts/EmployeeContext';
import { HourCategory, TimeEntry } from '@/types/employee';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, Clock, ChevronLeft, ChevronRight, Edit, Check } from 'lucide-react';
import { formatHoursDecimalWithH } from '@/lib/utils';
import { startOfWeek, addDays, format, isSameMonth, parseISO, subWeeks, addWeeks } from 'date-fns';
import { fr } from 'date-fns/locale/fr';
import { useOfflineSync } from '@/hooks/useOfflineSync';
import { OfflineIndicator } from '@/components/OfflineIndicator';
import { useIsMobile } from '@/hooks/use-mobile';
import { useSearchParams } from 'react-router-dom';

export default function Heures() {
  const isMobile = useIsMobile();
  const [searchParams] = useSearchParams();
  const preselectedEmployeeId = searchParams.get('employee');
  
  const {
    employees,
    chantiers,
    timeEntries,
    hourCategories,
    addTimeEntry,
    updateTimeEntry,
    deleteTimeEntry,
    currentEmployeeId,
  } = useEmployeeContext();

  // Hook pour le mode hors-ligne
  const {
    isOnline,
    isOffline,
    pendingCount,
    isSyncing,
    lastSync,
    syncPendingData,
    addTimeEntryOffline,
    needsSync
  } = useOfflineSync();

  // États pour le formulaire
  const [selectedEmployeeId, setSelectedEmployeeId] = useState(preselectedEmployeeId || currentEmployeeId || '');
  const [selectedChantierId, setSelectedChantierId] = useState('');
  const [selectedHourCategoryId, setSelectedHourCategoryId] = useState('');
  const [entryDate, setEntryDate] = useState(new Date().toISOString().slice(0, 10));
  const [entryHeures, setEntryHeures] = useState('0');
  const [entryMinutes, setEntryMinutes] = useState('0');
  const [entryDescription, setEntryDescription] = useState('');
  const [editingEntry, setEditingEntry] = useState<TimeEntry | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // États pour la pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [entriesPerPage] = useState(isMobile ? 5 : 10);
  const [currentWeekOffset, setCurrentWeekOffset] = useState(0);

  // Vérifier si l'utilisateur est admin
  const currentEmployee = employees.find((e) => e.id === currentEmployeeId);
  const isAdmin = currentEmployee?.role === 'admin';

  // Filtrer les entrées pour l'employé sélectionné
  const entriesForEmployee = selectedEmployeeId
    ? timeEntries.filter((e) => e.employeeId === selectedEmployeeId)
    : timeEntries;

  // Calculs pour les statistiques
  const today = new Date();
  const currentWeekDate = addWeeks(today, currentWeekOffset);
  const weekStart = startOfWeek(currentWeekDate, { weekStartsOn: 1 });
  const weekDays = Array.from({ length: 5 }).map((_, i) => addDays(weekStart, i)); // Lundi au Vendredi
  const hoursByDay = weekDays.map((day) => {
    const dayKey = format(day, 'yyyy-MM-dd');
    const total = entriesForEmployee
      .filter((e) => e.date === dayKey)
      .reduce((sum, e) => sum + e.heures, 0);
    return { day, total };
  });
  const weekTotal = hoursByDay.reduce((sum, day) => sum + day.total, 0);
  const monthTotal = entriesForEmployee
    .filter((e) => isSameMonth(parseISO(e.date), today))
    .reduce((sum, e) => sum + e.heures, 0);

  // Pagination des entrées
  const sortedEntries = entriesForEmployee
    .slice()
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  
  const totalPages = Math.ceil(sortedEntries.length / entriesPerPage);
  const startIndex = (currentPage - 1) * entriesPerPage;
  const paginatedEntries = sortedEntries.slice(startIndex, startIndex + entriesPerPage);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleAddEntry = async () => {
    // Si on est en mode édition, utiliser handleUpdateEntry
    if (editingEntry) {
      await handleUpdateEntry();
      return;
    }

    // Vérifier qu'il y a au moins des heures ou des minutes
    const totalHours = parseFloat(entryHeures || '0') + (parseFloat(entryMinutes || '0') / 60);
    if (!selectedEmployeeId || !entryDate || totalHours <= 0) return;

    // Validation des règles chantier/catégorie
    const validationError = validateEntry();
    if (!validationError.valid) {
      alert(validationError.message);
      return;
    }

    setIsSubmitting(true); // Démarrer le chargement
    
    const newEntry = {
      id: Date.now().toString(),
      employeeId: selectedEmployeeId,
      chantierId: selectedChantierId || null,
      hourCategoryId: selectedHourCategoryId || null,
      date: entryDate,
      heures: totalHours,  // Utilise totalHours calculé plus haut
      description: entryDescription,
    };

    try {
      if (isOffline) {
        addTimeEntryOffline(newEntry);
      } else {
        await addTimeEntry(newEntry);
      }

      // Réinitialiser le formulaire
      setEntryDate(new Date().toISOString().slice(0, 10));
      setEntryHeures('0');
      setEntryMinutes('0');
      setEntryDescription('');
      setSelectedChantierId('');
      setSelectedHourCategoryId('');
      
      // Feedback visuel de succès
      setTimeout(() => {
        setIsSubmitting(false);
      }, 1000);
    } catch (error) {
      console.error('Erreur lors de l\'ajout de l\'entrée:', error);
      setIsSubmitting(false);
    }
  };

  const handleEditEntry = (entry: TimeEntry) => {
    setEditingEntry(entry);
    setSelectedEmployeeId(entry.employeeId);
    setSelectedChantierId(entry.chantierId || '');
    setSelectedHourCategoryId(entry.hourCategoryId || '');
    setEntryDate(entry.date);
    const hours = Math.floor(entry.heures);
    const minutes = Math.round((entry.heures - hours) * 60);
    setEntryHeures(hours.toString());
    setEntryMinutes(minutes.toString());
    setEntryDescription(entry.description || '');
    setShowEditDialog(true); // Ouvre le dialogue d'édition
  };

  // Fonction de validation pour les règles chantier/catégorie
  const validateEntry = () => {
    const selectedCategory = hourCategories.find(cat => cat.id === selectedHourCategoryId);
    const categoryName = selectedCategory?.nom?.toLowerCase();
    
    // Cas 1: Aucun chantier ET aucune catégorie sélectionnées -> invalide
    if (!selectedChantierId && !selectedHourCategoryId) {
      return { valid: false, message: 'Vous devez sélectionner soit (chantier + catégorie Atelier/Pose/Dessin) soit (catégorie Divers/Absent)' };
    }
    
    // Cas 2: Chantier sélectionné sans catégorie -> invalide
    if (selectedChantierId && !selectedHourCategoryId) {
      return { valid: false, message: 'Pour un chantier, une catégorie est obligatoire (Atelier, Pose ou Dessin)' };
    }
    
    // Cas 3: Catégorie atelier/pose/dessin sans chantier -> invalide
    if (categoryName && ['atelier', 'pose', 'dessin'].includes(categoryName) && !selectedChantierId) {
      return { valid: false, message: 'Pour la catégorie ' + selectedCategory.nom + ', un chantier est obligatoire' };
    }
    
    // Cas 4: Chantier sélectionné avec catégorie non valide -> invalide
    if (selectedChantierId && categoryName && !['atelier', 'pose', 'dessin'].includes(categoryName)) {
      return { valid: false, message: 'Pour un chantier, la catégorie doit être Atelier, Pose ou Dessin' };
    }
    
    // Cas 5: Catégorie divers/absent sans chantier -> valide
    if (categoryName && ['divers', 'absent'].includes(categoryName) && !selectedChantierId) {
      return { valid: true, message: '' };
    }
    
    // Cas 6: Chantier + catégorie atelier/pose/dessin -> valide
    if (selectedChantierId && categoryName && ['atelier', 'pose', 'dessin'].includes(categoryName)) {
      return { valid: true, message: '' };
    }
    
    return { valid: true, message: '' };
  };

  const handleUpdateEntry = async () => {
    const validationError = validateEntry();
    if (!validationError.valid) {
      alert(validationError.message);
      return;
    }

    if (!editingEntry || !selectedEmployeeId || !entryDate) return;

    const totalHours = parseFloat(entryHeures || '0') + (parseFloat(entryMinutes || '0')) / 60;
    
    // Utilise updateTimeEntry pour modifier l'entrée existante
    await updateTimeEntry(editingEntry.id, {
      employeeId: selectedEmployeeId,
      chantierId: selectedChantierId || null,
      hourCategoryId: selectedHourCategoryId || null,
      date: entryDate,
      heures: totalHours,
      description: entryDescription,
    });
    
    setShowEditDialog(false);
    setEditingEntry(null);
  };

  const handleDeleteEntry = async (entryId: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer cette entrée ?')) {
      await deleteTimeEntry(entryId);
    }
  };

  const handleClearForm = () => {
    setEntryDate(new Date().toISOString().slice(0, 10));
    setEntryHeures('0');
    setEntryMinutes('0');
    setEntryDescription('');
    setSelectedChantierId('');
    setSelectedHourCategoryId('');
  };

  return (
    <div className={`space-y-6 ${isMobile ? 'max-w-full mx-auto px-3 overflow-x-hidden' : 'max-w-6xl mx-auto'}`}>
      <div className={`flex items-center ${isMobile ? 'flex-col gap-3' : 'justify-between'}`}>
        <div>
          <h1 className={`font-bold ${isMobile ? 'text-xl' : 'text-2xl'}`}>Saisie des heures</h1>
          <p className="text-muted-foreground text-sm">Enregistrez vos heures rapidement (chantier, catégorie, date).</p>
        </div>
        <div className={`flex items-center ${isMobile ? 'w-full' : 'gap-3'}`}>
          {currentEmployeeId && (
            <div className={`text-sm text-muted-foreground ${isMobile ? 'text-center' : ''}`}>
              Connecté en tant que : <span className="font-semibold text-primary">{employees.find((e) => e.id === currentEmployeeId)?.prenom ?? ''} {employees.find((e) => e.id === currentEmployeeId)?.nom ?? ''}</span>
            </div>
          )}
          <OfflineIndicator
            isOnline={isOnline}
            isOffline={isOffline}
            pendingCount={pendingCount}
            isSyncing={isSyncing}
            lastSync={lastSync}
            onSync={syncPendingData}
          />
        </div>
      </div>

      {/* Nouvelle entrée */}
      <Card>
        <CardHeader>
          <CardTitle className={isMobile ? 'text-lg' : ''}>Nouvelle entrée</CardTitle>
        </CardHeader>
        <CardContent>
          <div className={`grid gap-4 ${isMobile ? '' : 'md:grid-cols-2'}`}>
            <div className="grid gap-2">
              <Label className={isMobile ? 'text-base' : ''}>Employé</Label>
              {isAdmin ? (
                <select
                  className={`input ${isMobile ? 'h-12 text-base' : 'text-lg py-3 px-4'}`}
                  value={selectedEmployeeId}
                  onChange={(e) => setSelectedEmployeeId(e.target.value)}
                >
                  <option value="">Sélectionner un employé</option>
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>{emp.prenom} {emp.nom}</option>
                  ))}
                </select>
              ) : (
                <Input value={`${currentEmployee?.prenom ?? ''} ${currentEmployee?.nom ?? ''}`} disabled className={`${isMobile ? 'h-12 text-base' : 'text-lg py-3 px-4'}`} />
              )}
            </div>

            <div className="grid gap-2 p-3 border-2 border-blue-200 rounded-lg bg-blue-50/30">
              <Label className={`${isMobile ? 'text-base' : ''} text-blue-700 font-semibold`}>Chantier</Label>
              <select
                className={`input ${isMobile ? 'h-12 text-base' : 'text-lg py-3 px-4'} border-blue-200 focus:border-blue-500 focus:ring-blue-500`}
                value={selectedChantierId}
                onChange={(e) => setSelectedChantierId(e.target.value)}
              >
                <option value="">(Aucun)</option>
                {chantiers.map((ch) => (
                  <option key={ch.id} value={ch.id}>{ch.nom}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label className={isMobile ? 'text-base' : ''}>Date</Label>
              <Input type="date" value={entryDate} onChange={(e) => setEntryDate(e.target.value)} className={`${isMobile ? 'h-12 text-base' : 'text-lg py-3 px-4'}`} />
            </div>
            
            <div className="grid gap-2">
              <Label className={isMobile ? 'text-base' : ''}>Heures et minutes</Label>
              <div className="flex flex-wrap gap-2 items-center">
                <Input 
                  type="number" 
                  step="1" 
                  min="0" 
                  max="23" 
                  value={entryHeures} 
                  onChange={(e) => setEntryHeures(e.target.value === '' ? '0' : e.target.value)} 
                  className={`${isMobile ? 'h-12 w-16 text-base' : 'text-lg py-3 px-4 w-14'}`} 
                  placeholder="0" 
                />
                <span className="flex items-center text-lg font-medium">h</span>
                <Input 
                  type="number" 
                  step="15" 
                  min="0" 
                  max="59" 
                  value={entryMinutes} 
                  onChange={(e) => setEntryMinutes(e.target.value)} 
                  onBlur={(e) => setEntryMinutes(e.target.value === '' ? '0' : e.target.value)} 
                  className={`${isMobile ? 'h-12 w-16 text-base' : 'text-lg py-3 px-4 w-14'}`} 
                  placeholder="0" 
                />
                <span className="flex items-center text-lg font-medium">min</span>
                <div className="flex gap-1">
                  <button 
                    type="button" 
                    onClick={() => setEntryMinutes('15')}
                    className={`border rounded bg-background hover:bg-muted ${isMobile ? 'h-8 px-2 text-xs' : 'px-2 py-1 text-xs'} transition-colors`}
                  >
                    15
                  </button>
                  <button 
                    type="button" 
                    onClick={() => setEntryMinutes('30')}
                    className={`border rounded bg-background hover:bg-muted ${isMobile ? 'h-8 px-2 text-xs' : 'px-2 py-1 text-xs'} transition-colors`}
                  >
                    30
                  </button>
                  <button 
                    type="button" 
                    onClick={() => setEntryMinutes('45')}
                    className={`border rounded bg-background hover:bg-muted ${isMobile ? 'h-8 px-2 text-xs' : 'px-2 py-1 text-xs'} transition-colors`}
                  >
                    45
                  </button>
                </div>
              </div>
            </div>
            
            <div className="grid gap-2 p-3 border-2 border-blue-200 rounded-lg bg-blue-50/30">
              <Label className={`${isMobile ? 'text-base' : ''} text-blue-700 font-semibold`}>Catégorie</Label>
              <select
                className={`input ${isMobile ? 'h-12 text-base' : 'text-lg py-3 px-4'} border-blue-200 focus:border-blue-500 focus:ring-blue-500`}
                value={selectedHourCategoryId}
                onChange={(e) => setSelectedHourCategoryId(e.target.value)}
              >
                <option value="">Sélectionner une catégorie</option>
                {hourCategories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.nom}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid gap-2 p-3 border-2 border-blue-200 rounded-lg bg-blue-50/30">
              <Label className={`${isMobile ? 'text-base' : ''} text-blue-700 font-semibold`}>Description</Label>
              <Input 
                type="text" 
                value={entryDescription} 
                onChange={(e) => setEntryDescription(e.target.value)} 
                className={`${isMobile ? 'h-12 text-base' : 'text-lg py-3 px-4'} border-blue-200 focus:border-blue-500 focus:ring-blue-500`} 
                placeholder="Description du travail effectué..." 
              />
            </div>
          </div>

          <div className={`flex gap-3 mt-4 ${isMobile ? 'flex-col' : ''}`}>
            <Button 
              onClick={handleAddEntry} 
              disabled={!selectedEmployeeId || !entryDate || (parseFloat(entryHeures || '0') + parseFloat(entryMinutes || '0') / 60) <= 0 || isSubmitting || !validateEntry().valid}
              className={`${isMobile ? 'h-12 text-base' : ''} transition-all duration-1000 ${isSubmitting ? 'bg-green-500 hover:bg-green-500' : ''}`}
            >
              {isSubmitting ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-t-2 border-b-2 border-r-2 border-l-2 border-gray-300"></div>
                  Validation...
                </>
              ) : (
                <>
                  <Check className="mr-2 h-4 w-4" />Valider ({entryHeures}h{entryMinutes !== '0' ? entryMinutes : ''})
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Statistiques et liste des entrées */}
      {currentEmployeeId && (
        <div className={`grid gap-4 ${isMobile ? 'grid-cols-1' : 'md:grid-cols-2'}`}>
          <Card>
            <CardHeader>
              <CardTitle className={isMobile ? 'text-lg' : ''}>Résumé hebdomadaire</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 mb-4">
                <Button variant="outline" size="sm" onClick={() => setCurrentWeekOffset(currentWeekOffset - 1)}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm font-medium">
                  Semaine du {format(weekStart, 'dd MMM')}
                </span>
                <Button variant="outline" size="sm" onClick={() => setCurrentWeekOffset(currentWeekOffset + 1)}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
              <div className="space-y-2">
                {weekDays.map((day, index) => (
                  <div key={index} className="flex justify-between items-center">
                    <span className="text-sm">{format(day, 'EEEE', { locale: fr })}</span>
                    <span className="font-medium">{formatHoursDecimalWithH(hoursByDay[index].total)}</span>
                  </div>
                ))}
                <div className="border-t pt-2 mt-2">
                  <div className="flex justify-between items-center font-bold">
                    <span>Total semaine</span>
                    <span>{formatHoursDecimalWithH(weekTotal)}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className={isMobile ? 'text-lg' : ''}>Statistiques du mois</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Heures du mois</span>
                  <span className="font-bold text-lg">{formatHoursDecimalWithH(monthTotal)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Liste des entrées */}
      <Card>
        <CardHeader>
          <CardTitle className={isMobile ? 'text-lg' : ''}>Entrées enregistrées</CardTitle>
        </CardHeader>
        <CardContent>
          {paginatedEntries.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              Aucune entrée trouvée pour la période sélectionnée.
            </p>
          ) : (
            <>
              <div className={`${isMobile ? 'overflow-x-auto -mx-3 px-3' : ''}`}>
                <Table className={isMobile ? 'min-w-[480px]' : ''}>
                  <TableHeader>
                    <TableRow>
                      <TableHead className={`${isMobile ? 'min-w-[55px] px-0.5' : ''}`}>Date</TableHead>
                      <TableHead className={`${isMobile ? 'min-w-[65px] px-0.5' : ''}`}>Employé</TableHead>
                      <TableHead className={`${isMobile ? 'min-w-[65px] px-0.5' : ''}`}>Chantier</TableHead>
                      <TableHead className={`${isMobile ? 'min-w-[55px] px-0.5' : ''}`}>Cat.</TableHead>
                      <TableHead className={`${isMobile ? 'min-w-[40px] px-0.5' : ''}`}>H</TableHead>
                      <TableHead className={`${isMobile ? 'min-w-[75px] px-0.5' : ''}`}>Note</TableHead>
                      <TableHead className={`${isMobile ? 'min-w-[55px] px-0.5' : ''}`}>Act.</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedEntries.map((entry) => {
                      const emp = employees.find((e) => e.id === entry.employeeId);
                      const ch = entry.chantierId ? chantiers.find((c) => c.id === entry.chantierId) : null;
                      const cat = entry.hourCategoryId ? hourCategories.find((c) => c.id === entry.hourCategoryId) : null;
                      return (
                        <TableRow key={entry.id}>
                          <TableCell className={`${isMobile ? 'px-0.5 py-1' : ''}`}>{format(parseISO(entry.date), 'dd/MM', { locale: fr })}</TableCell>
                          <TableCell className={`${isMobile ? 'px-0.5 py-1' : ''}`}>{emp?.prenom}</TableCell>
                          <TableCell className={`${isMobile ? 'px-0.5 py-1' : ''}`}>{ch?.nom || 'Bureau'}</TableCell>
                          <TableCell className={`${isMobile ? 'px-0.5 py-1' : ''}`}>
                            {cat && (
                              <Badge variant={cat.isBureau ? 'secondary' : 'default'} className={isMobile ? 'px-1 py-0' : ''}>
                                {cat.nom.slice(0, 6)}
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className={`${isMobile ? 'px-0.5 py-1' : ''}`}>{formatHoursDecimalWithH(entry.heures)}</TableCell>
                          <TableCell className={`${isMobile ? 'max-w-[75px] px-0.5 py-1' : 'max-w-xs truncate'}`}>{entry.description || '-'}</TableCell>
                          <TableCell className={`${isMobile ? 'px-0.5 py-1' : ''}`}>
                            <div className="flex gap-0">
                              <Button variant="ghost" size="icon" className={isMobile ? 'h-6 w-6 p-0' : ''} onClick={() => handleEditEntry(entry)}>
                                <Edit className="h-3 w-3" />
                              </Button>
                              <Button variant="ghost" size="icon" className={isMobile ? 'h-6 w-6 p-0' : ''} onClick={() => handleDeleteEntry(entry.id)}>
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-center items-center gap-2 mt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="text-sm">
                    Page {currentPage} sur {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Dialog d'édition */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className={isMobile ? 'max-w-sm' : 'sm:max-w-[425px]'}>
          <DialogHeader>
            <DialogTitle>Modifier l'entrée</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Date</Label>
              <Input type="date" value={entryDate} onChange={(e) => setEntryDate(e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label>Chantier</Label>
              <select
                className="input h-10 text-base border rounded px-3"
                value={selectedChantierId}
                onChange={(e) => setSelectedChantierId(e.target.value)}
              >
                <option value="">(Aucun)</option>
                {chantiers.map((ch) => (
                  <option key={ch.id} value={ch.id}>{ch.nom}</option>
                ))}
              </select>
            </div>
            <div className="grid gap-2">
              <Label>Catégorie</Label>
              <select
                className="input h-10 text-base border rounded px-3"
                value={selectedHourCategoryId}
                onChange={(e) => setSelectedHourCategoryId(e.target.value)}
              >
                <option value="">Sélectionner une catégorie</option>
                {hourCategories.map((cat) => (
                  <option key={cat.id} value={cat.id}>{cat.nom}</option>
                ))}
              </select>
            </div>
            <div className="grid gap-2">
              <Label>Heures</Label>
              <Input type="number" step="1" min="0" max="23" value={entryHeures} onChange={(e) => setEntryHeures(e.target.value === '' ? '0' : e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label>Minutes</Label>
              <Input type="number" step="15" min="0" max="59" value={entryMinutes} onChange={(e) => setEntryMinutes(e.target.value)} onBlur={(e) => setEntryMinutes(e.target.value === '' ? '0' : e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label>Description</Label>
              <Input type="text" value={entryDescription} onChange={(e) => setEntryDescription(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              Annuler
            </Button>
            <Button onClick={handleUpdateEntry}>
              Mettre à jour
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
