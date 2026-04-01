import { useState, useEffect } from 'react';
import { useEmployeeContext } from '@/contexts/EmployeeContext';
import { HourCategory } from '@/types/employee';
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
import { Plus, Trash2, Clock, ChevronLeft, ChevronRight, Edit } from 'lucide-react';
import { formatHoursDecimalWithH } from '@/lib/utils';
import { startOfWeek, addDays, format, isSameMonth, parseISO, subWeeks, addWeeks } from 'date-fns';
import { useOfflineSync } from '@/hooks/useOfflineSync';
import { OfflineIndicator } from '@/components/OfflineIndicator';

export default function Heures() {
  const {
    employees,
    chantiers,
    timeEntries,
    hourCategories,
    addTimeEntry,
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

  const currentEmployee = currentEmployeeId ? employees.find((e) => e.id === currentEmployeeId) : null;
  const isAdmin = currentEmployee?.role === 'admin';

  const [selectedEmployeeId, setSelectedEmployeeId] = useState(currentEmployeeId ?? employees[0]?.id ?? '');
  const [selectedChantierId, setSelectedChantierId] = useState(chantiers[0]?.id ?? '');
  const [selectedHourCategoryId, setSelectedHourCategoryId] = useState(hourCategories[0]?.id ?? '');
  const [entryDate, setEntryDate] = useState(new Date().toISOString().slice(0, 10));
  const [entryHeures, setEntryHeures] = useState('8');
  const [entryMinutes, setEntryMinutes] = useState('0');
  const [entryDesc, setEntryDesc] = useState('');
  const [currentWeekOffset, setCurrentWeekOffset] = useState(0);
  
  // États pour la pagination et la modification
  const [currentPage, setCurrentPage] = useState(1);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editingEntry, setEditingEntry] = useState<any>(null);
  const entriesPerPage = 10;

  useEffect(() => {
    if (isAdmin) {
      setSelectedEmployeeId(currentEmployeeId ?? employees[0]?.id ?? '');
    } else {
      setSelectedEmployeeId(currentEmployeeId ?? '');
    }
  }, [currentEmployeeId, employees, isAdmin]);

  const handleAddEntry = () => {
    if (!selectedEmployeeId || !entryDate || !entryHeures) return;
    const heuresDecimal = parseFloat(entryHeures) + (parseFloat(entryMinutes || '0') / 60);
    
    if (isOffline) {
      // Hors-ligne : sauvegarder localement
      addTimeEntryOffline({
        employeeId: selectedEmployeeId,
        chantierId: selectedChantierId || undefined,
        date: entryDate,
        heures: heuresDecimal,
        description: entryDesc || undefined,
        hourCategoryId: selectedHourCategoryId || undefined,
      });
      alert('✅ Entrée sauvegardée localement. Elle sera synchronisée automatiquement lorsque vous serez en ligne.');
    } else {
      // En ligne : utiliser addTimeEntry du contexte pour mettre à jour le state
      addTimeEntry({
        employeeId: selectedEmployeeId,
        chantierId: selectedChantierId || undefined,
        date: entryDate,
        heures: heuresDecimal,
        description: entryDesc || undefined,
        hourCategoryId: selectedHourCategoryId || undefined,
      });
    }
    
    setEntryHeures('8');
    setEntryMinutes('0');
    setEntryDesc('');
  };

  // Fonctions pour la modification
  const handleEditEntry = (entry: any) => {
    setEditingEntry(entry);
    setSelectedChantierId(entry.chantierId || '');
    setSelectedHourCategoryId(entry.hourCategoryId || '');
    setEntryDate(entry.date);
    
    // Convertir les heures décimales en heures et minutes
    const totalHours = Math.floor(entry.heures);
    const minutes = Math.round((entry.heures - totalHours) * 60);
    setEntryHeures(totalHours.toString());
    setEntryMinutes(minutes.toString());
    setEntryDesc(entry.description || '');
    setShowEditDialog(true);
  };

  const handleUpdateEntry = () => {
    if (!editingEntry || !selectedEmployeeId || !entryDate || !entryHeures) return;
    const heuresDecimal = parseFloat(entryHeures) + (parseFloat(entryMinutes || '0') / 60);
    
    // Supprimer l'ancienne entrée et en ajouter une nouvelle
    deleteTimeEntry(editingEntry.id);
    addTimeEntry({
      employeeId: selectedEmployeeId,
      chantierId: selectedChantierId || undefined,
      date: entryDate,
      heures: heuresDecimal,
      description: entryDesc || undefined,
      hourCategoryId: selectedHourCategoryId || undefined,
    });
    
    setShowEditDialog(false);
    setEditingEntry(null);
    setEntryHeures('8');
    setEntryMinutes('0');
    setEntryDesc('');
  };

  const entriesForEmployee = timeEntries.filter((e) => e.employeeId === selectedEmployeeId);

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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Saisie des heures</h1>
          <p className="text-muted-foreground">Enregistrez vos heures rapidement (chantier, catégorie, date).</p>
        </div>
        <div className="flex items-center gap-3">
          {currentEmployeeId && (
            <div className="text-sm text-muted-foreground">
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

      {/* Nouvelle entrée - déplacée en haut */}
      <Card>
        <CardHeader>
          <CardTitle>Nouvelle entrée</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Employé</Label>
                {isAdmin ? (
                  <select
                    className="input text-lg py-3 px-4"
                    value={selectedEmployeeId}
                    onChange={(e) => setSelectedEmployeeId(e.target.value)}
                  >
                    <option value="">Sélectionner un employé</option>
                    {employees.map((emp) => (
                      <option key={emp.id} value={emp.id}>{emp.prenom} {emp.nom}</option>
                    ))}
                  </select>
                ) : (
                  <Input value={`${currentEmployee?.prenom ?? ''} ${currentEmployee?.nom ?? ''}`} disabled className="text-lg py-3 px-4" />
                )}
              </div>

              <div className="grid gap-2">
                <Label>Chantier</Label>
                <select
                  className="input text-lg py-3 px-4"
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
                <Label>Date</Label>
                <Input type="date" value={entryDate} onChange={(e) => setEntryDate(e.target.value)} className="text-lg py-3 px-4" />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Heures</Label>
                  <Input type="number" step="1" min="0" max="23" value={entryHeures} onChange={(e) => setEntryHeures(e.target.value)} className="text-lg py-3 px-4" placeholder="8" />
                </div>
                <div className="grid gap-2">
                  <Label>Minutes</Label>
                  <div className="flex gap-2">
                    <Input type="number" step="15" min="0" max="59" value={entryMinutes} onChange={(e) => setEntryMinutes(e.target.value)} className="text-lg py-3 px-4 flex-1" placeholder="0" />
                    <div className="flex gap-1">
                      <Button 
                        type="button" 
                        variant="outline" 
                        size="sm" 
                        onClick={() => setEntryMinutes('15')}
                        className="px-2 py-1 text-xs"
                      >
                        15min
                      </Button>
                      <Button 
                        type="button" 
                        variant="outline" 
                        size="sm" 
                        onClick={() => setEntryMinutes('30')}
                        className="px-2 py-1 text-xs"
                      >
                        30min
                      </Button>
                      <Button 
                        type="button" 
                        variant="outline" 
                        size="sm" 
                        onClick={() => setEntryMinutes('45')}
                        className="px-2 py-1 text-xs"
                      >
                        45min
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="grid gap-2">
                <Label>Catégorie</Label>
                <select
                  className="input text-lg py-3 px-4"
                  value={selectedHourCategoryId}
                  onChange={(e) => setSelectedHourCategoryId(e.target.value)}
                >
                  <option value="">Sélectionner</option>
                  {hourCategories.map((cat) => (
                    <option key={cat.id} value={cat.id}>{cat.nom}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid gap-2">
              <Label>Commentaire (optionnel)</Label>
              <Input value={entryDesc} onChange={(e) => setEntryDesc(e.target.value)} placeholder="Ex. Pose de porte" className="text-lg py-3 px-4" />
            </div>

            <div className="flex justify-end">
              <Button onClick={handleAddEntry} disabled={!selectedEmployeeId || !entryDate || !entryHeures} size="lg" className="text-lg py-3 px-6">
                <Plus className="mr-2 h-5 w-5" />
                Enregistrer {entryHeures}h{entryMinutes && entryMinutes !== '0' ? ` ${entryMinutes}min` : ''}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {currentEmployeeId && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Heures cette semaine</CardTitle>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="icon" onClick={() => setCurrentWeekOffset(currentWeekOffset - 1)}>
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="text-sm font-medium px-2">
                    {currentWeekOffset === 0 ? 'Cette semaine' : 
                     currentWeekOffset === -1 ? 'Semaine dernière' :
                     currentWeekOffset === 1 ? 'Semaine prochaine' :
                     `Semaine ${currentWeekOffset > 0 ? '+' : ''}${currentWeekOffset}`}
                  </span>
                  <Button variant="outline" size="icon" onClick={() => setCurrentWeekOffset(currentWeekOffset + 1)}>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{formatHoursDecimalWithH(weekTotal)}</div>
              <div className="text-sm text-muted-foreground">Semaine du {format(weekStart, 'd MMM yyyy')}</div>
              <div className="mt-4 grid grid-cols-5 gap-2">
                {hoursByDay.map(({ day, total }) => (
                  <div key={day.toISOString()} className="text-center">
                    <div className="text-xs text-muted-foreground">
                      {format(day, 'EEEE').replace('Monday', 'Lundi')
                        .replace('Tuesday', 'Mardi')
                        .replace('Wednesday', 'Mercredi')
                        .replace('Thursday', 'Jeudi')
                        .replace('Friday', 'Vendredi')}
                    </div>
                    <div className="text-sm font-semibold">{formatHoursDecimalWithH(total)}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Heures ce mois</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{formatHoursDecimalWithH(monthTotal)}</div>
              <div className="text-sm text-muted-foreground">{format(today, 'MMMM yyyy')}</div>
            </CardContent>
          </Card>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Mes entrées</span>
            <Badge variant="outline" className="text-xs">
              {sortedEntries.length} entrée{sortedEntries.length > 1 ? 's' : ''}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {entriesForEmployee.length === 0 ? (
            <p className="text-sm text-muted-foreground">Aucune entrée pour l'employé sélectionné.</p>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Chantier</TableHead>
                    <TableHead>Categorie</TableHead>
                    <TableHead className="text-right">Heures</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="w-[100px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedEntries.map((entry) => {
                  const chantier = chantiers.find((c) => c.id === entry.chantierId);
                  const category = hourCategories.find((c) => c.id === entry.hourCategoryId);
                  return (
                    <TableRow key={entry.id}>
                      <TableCell>{entry.date}</TableCell>
                      <TableCell>{chantier?.nom ?? ''}</TableCell>
                      <TableCell>
                        {category?.nom ? (
                          <span className={
                            category.nom === 'Absent' || category.nom === 'Congé'
                              ? 'text-amber-600 font-semibold'
                              : ''
                          }>
                            {category.nom}
                          </span>
                        ) : (
                          '-'
                        )}
                      </TableCell>
                      <TableCell className="text-right">{formatHoursDecimalWithH(entry.heures)}</TableCell>
                      <TableCell>{entry.description ?? '-'}</TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon" onClick={() => handleEditEntry(entry)}>
                            <Edit className="h-4 w-4 text-blue-600" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => deleteTimeEntry(entry.id)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
                </TableBody>
              </Table>
              
              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <div className="text-sm text-muted-foreground">
                    Affichage de {startIndex + 1} à {Math.min(startIndex + entriesPerPage, sortedEntries.length)} sur {sortedEntries.length} entrées
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="text-sm font-medium px-2">
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
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
      
      {/* Dialog pour modifier une entrée */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Modifier une entrée</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Date</Label>
              <Input type="date" value={entryDate} onChange={(e) => setEntryDate(e.target.value)} className="text-lg py-3 px-4" />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Heures</Label>
                <Input type="number" step="1" min="0" max="23" value={entryHeures} onChange={(e) => setEntryHeures(e.target.value)} className="text-lg py-3 px-4" placeholder="8" />
              </div>
              <div className="grid gap-2">
                <Label>Minutes</Label>
                <div className="flex gap-2">
                  <Input type="number" step="15" min="0" max="59" value={entryMinutes} onChange={(e) => setEntryMinutes(e.target.value)} className="text-lg py-3 px-4 flex-1" placeholder="0" />
                  <div className="flex gap-1">
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="sm" 
                      onClick={() => setEntryMinutes('15')}
                      className="px-2 py-1 text-xs"
                    >
                      15min
                    </Button>
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="sm" 
                      onClick={() => setEntryMinutes('30')}
                      className="px-2 py-1 text-xs"
                    >
                      30min
                    </Button>
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="sm" 
                      onClick={() => setEntryMinutes('45')}
                      className="px-2 py-1 text-xs"
                    >
                      45min
                    </Button>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="grid gap-2">
              <Label>Catégorie</Label>
              <select
                className="input text-lg py-3 px-4"
                value={selectedHourCategoryId}
                onChange={(e) => setSelectedHourCategoryId(e.target.value)}
              >
                <option value="">Sélectionner</option>
                {hourCategories.map((cat) => (
                  <option key={cat.id} value={cat.id}>{cat.nom}</option>
                ))}
              </select>
            </div>
            
            <div className="grid gap-2">
              <Label>Chantier</Label>
              <select
                className="input text-lg py-3 px-4"
                value={selectedChantierId}
                onChange={(e) => setSelectedChantierId(e.target.value)}
              >
                <option value="">Sélectionner</option>
                {chantiers.map((ch) => (
                  <option key={ch.id} value={ch.id}>{ch.nom}</option>
                ))}
              </select>
            </div>
            
            <div className="grid gap-2">
              <Label>Description</Label>
              <Input value={entryDesc} onChange={(e) => setEntryDesc(e.target.value)} placeholder="Ex. Pose de porte" className="text-lg py-3 px-4" />
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
