import { useState, useMemo, useEffect } from 'react';
import { useEmployeeContext } from '@/contexts/EmployeeContext';
import { supabase } from '@/integrations/supabase/client';
import { formatHoursDecimalWithH } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ChevronLeft, ChevronRight, Plus, Clock, Trash2, Edit, Timer, HardHat, Download } from 'lucide-react';
import { format, startOfWeek, addDays, addWeeks, subWeeks, isSameDay } from 'date-fns';
import { fr } from 'date-fns/locale';
import { PDFExportDialog } from '@/components/PDFExportDialog';
import GanttChart from '@/components/GanttChart';
import { UpcomingAppointments } from '@/components/UpcomingAppointments';

const Dashboard = () => {
  const {
    employees,
    chantiers,
    timeEntries,
    materialCosts,
    hourCategories,
    addTimeEntry,
    updateTimeEntry,
    deleteTimeEntry,
    getEmployeeById,
    getChantierById,
    getHourCategoryById,
    getEntryCost
  } = useEmployeeContext();

  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [selectedChantierId, setSelectedChantierId] = useState('');
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('');
  const [selectedHourCategoryId, setSelectedHourCategoryId] = useState('');
  const [heures, setHeures] = useState('8');
  const [description, setDescription] = useState('');
  const [editingEntryId, setEditingEntryId] = useState<string | null>(null);
  const [showPDFDialog, setShowPDFDialog] = useState(false);

  // State for Gantt markers
  const [markers, setMarkers] = useState<{ id: string; chantierId: string; date: string; endDate?: string; type: 'milestone' | 'appointment' | 'end-date' | 'custom' | 'range'; label: string }[]>([]);

  // Load markers from Supabase on mount
  useEffect(() => {
    const loadMarkers = async () => {
      console.log('Loading markers from Supabase...');
      const { data, error } = await supabase
        .from('gantt_markers')
        .select('*')
        .order('date', { ascending: true });
      if (error) {
        console.error('Error loading markers:', error);
        return;
      }
      console.log('Markers loaded:', data);
      if (data) {
        const transformed = data.map((m) => ({
          id: m.id,
          chantierId: m.chantier_id,
          date: m.date,
          endDate: m.end_date || undefined,
          type: m.type as any,
          label: m.label,
        }));
        console.log('Transformed markers:', transformed);
        setMarkers(transformed);
      }
    };
    loadMarkers();
  }, []);

  const handleAddMarker = async (marker: Omit<{ id: string; chantierId: string; date: string; endDate?: string; type: 'milestone' | 'appointment' | 'end-date' | 'custom' | 'range'; label: string }, 'id'>) => {
    const dbMarker = {
      chantier_id: marker.chantierId,
      date: marker.date,
      end_date: marker.endDate || null,
      type: marker.type,
      label: marker.label,
      color: null,
    };
    const { data, error } = await supabase.from('gantt_markers').insert(dbMarker as any).select().single();
    if (error) {
      console.error('Error adding marker:', error);
      return;
    }
    if (data) {
      const newMarker = {
        id: data.id,
        chantierId: data.chantier_id,
        date: data.date,
        endDate: data.end_date || undefined,
        type: data.type as any,
        label: data.label,
      };
      setMarkers((prev) => [...prev, newMarker]);
    }
  };

  const handleDeleteMarker = async (id: string) => {
    const { error } = await supabase.from('gantt_markers').delete().eq('id', id);
    if (error) {
      console.error('Error deleting marker:', error);
      return;
    }
    setMarkers((prev) => prev.filter((m) => m.id !== id));
  };

  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
  const weekDays = Array.from({ length: 5 }, (_, i) => addDays(weekStart, i));

  const entriesByDay = useMemo(() => {
    const map = new Map<string, typeof timeEntries>();
    weekDays.forEach((day) => {
      const dateStr = format(day, 'yyyy-MM-dd');
      map.set(dateStr, timeEntries.filter((e) => e.date === dateStr));
    });
    return map;
  }, [timeEntries, weekStart]);

  const handleDayClick = (day: Date) => {
    setSelectedDay(day);
    setShowAddDialog(true);
    setSelectedChantierId('');
    setSelectedEmployeeId('');
    setSelectedHourCategoryId(hourCategories[0]?.id || '');
    setHeures('8');
    setDescription('');
    setEditingEntryId(null);
  };

  const selectedCategory = hourCategories.find((c) => c.id === selectedHourCategoryId);
  const isBureauSelected = selectedCategory?.isBureau === true;

  const resetEntryForm = () => {
    setSelectedDay(null);
    setSelectedChantierId('');
    setSelectedEmployeeId('');
    setSelectedHourCategoryId(hourCategories[0]?.id || '');
    setHeures('8');
    setDescription('');
    setEditingEntryId(null);
  };

  const handleEditEntry = (entry: typeof timeEntries[number]) => {
    setSelectedDay(new Date(entry.date));
    setSelectedChantierId(entry.chantierId ?? '');
    setSelectedEmployeeId(entry.employeeId);
    setSelectedHourCategoryId(entry.hourCategoryId ?? (hourCategories[0]?.id || ''));
    setHeures(entry.heures.toString());
    setDescription(entry.description || '');
    setEditingEntryId(entry.id);
    setShowAddDialog(true);
  };

  const handleAddEntry = async () => {
    if (!selectedDay || !selectedEmployeeId || !heures) return;
    if (!isBureauSelected && !selectedChantierId) return;

    const entryData = {
      employeeId: selectedEmployeeId,
      chantierId: isBureauSelected ? undefined : selectedChantierId,
      date: format(selectedDay, 'yyyy-MM-dd'),
      heures: parseFloat(heures),
      description: description || undefined,
      hourCategoryId: selectedHourCategoryId || undefined,
    };

    if (editingEntryId) {
      await updateTimeEntry(editingEntryId, entryData);
    } else {
      await addTimeEntry(entryData);
    }

    resetEntryForm();
  };

  // Preview cost calculation
  const previewCost = useMemo(() => {
    if (!selectedEmployeeId || !heures) return null;
    const emp = employees.find((e) => e.id === selectedEmployeeId);
    if (!emp) return null;
    const cat = selectedHourCategoryId ? hourCategories.find((c) => c.id === selectedHourCategoryId) : null;
    const multiplier = cat ? 1 + cat.pourcentage / 100 : 1;
    return parseFloat(heures) * emp.coutHoraire * multiplier;
  }, [selectedEmployeeId, selectedHourCategoryId, heures, employees, hourCategories]);

  const monthlyStats = useMemo(() => {
    const monthStr = format(currentDate, 'yyyy-MM');
    const monthEntries = timeEntries.filter((e) => e.date.startsWith(monthStr));
    const totalHeures = monthEntries.reduce((s, e) => s + e.heures, 0);
    const totalCout = monthEntries.reduce((s, e) => s + getEntryCost(e), 0);
    // Calculer les heures de bureau (entrées sans chantier)
    const bureauEntries = monthEntries.filter((e) => !e.chantierId);
    const totalBureauHours = bureauEntries.reduce((s, e) => s + e.heures, 0);
    return { totalHeures, totalCout, totalBureauHours };
  }, [timeEntries, currentDate, getEntryCost]);

  const monthlyChantierStats = useMemo(() => {
    const monthStr = format(currentDate, 'yyyy-MM');
    const monthEntries = timeEntries.filter((e) => e.date.startsWith(monthStr));

    // Separate bureau and non-bureau entries
    const directEntries = monthEntries.filter((e) => e.chantierId);
    const bureauEntries = monthEntries.filter((e) => !e.chantierId);
    const monthMaterials = materialCosts.filter((cost) => cost.date.startsWith(monthStr));

    const map = new Map<string, {nom: string;devis: number;heures: number;coutMain: number;coutMateriel: number;coutTotal: number;heuresBureau: number;coutBureau: number;heuresPrevues: number;}>();

    // Count direct hours per chantier
    directEntries.forEach((entry) => {
      const ch = getChantierById(entry.chantierId!);
      if (!ch) return;
      const existing = map.get(ch.id) || { nom: ch.nom, devis: ch.devis ?? 0, heures: 0, coutMain: 0, coutMateriel: 0, coutTotal: 0, heuresBureau: 0, coutBureau: 0, heuresPrevues: ch.heuresPrevues ?? 0 };
      existing.heures += entry.heures;
      existing.coutMain += getEntryCost(entry);
      existing.coutTotal = existing.coutMain + existing.coutMateriel;
      map.set(ch.id, existing);
    });

    // Add material costs per chantier
    monthMaterials.forEach((cost) => {
      const existing = map.get(cost.chantierId);
      if (!existing) {
        const chantier = getChantierById(cost.chantierId);
        if (!chantier) return;
        map.set(cost.chantierId, {
          nom: chantier.nom,
          devis: chantier.devis ?? 0,
          heures: 0,
          coutMain: 0,
          coutMateriel: cost.montant,
          coutTotal: cost.montant,
          heuresBureau: 0,
          coutBureau: 0,
          heuresPrevues: chantier.heuresPrevues ?? 0,
        });
        return;
      }
      existing.coutMateriel += cost.montant;
      existing.coutTotal = existing.coutMain + existing.coutMateriel;
      map.set(cost.chantierId, existing);
    });

    // Distribute bureau hours proportionally
    const totalDirectHours = directEntries.reduce((s, e) => s + e.heures, 0);
    if (totalDirectHours > 0 && bureauEntries.length > 0) {
      const totalBureauHours = bureauEntries.reduce((s, e) => s + e.heures, 0);
      const totalBureauCost = bureauEntries.reduce((s, e) => s + getEntryCost(e), 0);
      map.forEach((stat) => {
        const ratio = stat.heures / totalDirectHours;
        stat.heuresBureau = totalBureauHours * ratio;
        stat.coutBureau = totalBureauCost * ratio;
      });
    }

    return Array.from(map.values()).sort((a, b) => b.heures + b.heuresBureau - (a.heures + a.heuresBureau));
  }, [timeEntries, materialCosts, currentDate, getChantierById, getEntryCost]);

  // Calcul des stats chantier pour la TOTALITÉ (tous les temps, pas limité à un mois)
  const allTimeChantierStats = useMemo(() => {
    // Utiliser TOUTES les entrées, pas filtrées par mois
    const allDirectEntries = timeEntries.filter((e) => e.chantierId);
    const allBureauEntries = timeEntries.filter((e) => !e.chantierId);
    const allMaterials = materialCosts; // Toutes les dépenses de matériel

    const map = new Map<string, {nom: string;devis: number;heures: number;coutMain: number;coutMateriel: number;coutTotal: number;heuresBureau: number;coutBureau: number;heuresPrevues: number;}>();

    // Count direct hours per chantier
    allDirectEntries.forEach((entry) => {
      const ch = getChantierById(entry.chantierId!);
      if (!ch) return;
      const existing = map.get(ch.id) || { nom: ch.nom, devis: ch.devis ?? 0, heures: 0, coutMain: 0, coutMateriel: 0, coutTotal: 0, heuresBureau: 0, coutBureau: 0, heuresPrevues: ch.heuresPrevues ?? 0 };
      existing.heures += entry.heures;
      existing.coutMain += getEntryCost(entry);
      existing.coutTotal = existing.coutMain + existing.coutMateriel;
      map.set(ch.id, existing);
    });

    // Add material costs per chantier
    allMaterials.forEach((cost) => {
      const existing = map.get(cost.chantierId);
      if (!existing) {
        const chantier = getChantierById(cost.chantierId);
        if (!chantier) return;
        map.set(cost.chantierId, {
          nom: chantier.nom,
          devis: chantier.devis ?? 0,
          heures: 0,
          coutMain: 0,
          coutMateriel: cost.montant,
          coutTotal: cost.montant,
          heuresBureau: 0,
          coutBureau: 0,
          heuresPrevues: chantier.heuresPrevues ?? 0,
        });
        return;
      }
      existing.coutMateriel += cost.montant;
      existing.coutTotal = existing.coutMain + existing.coutMateriel;
      map.set(cost.chantierId, existing);
    });

    // Distribute bureau hours proportionally
    const totalDirectHours = allDirectEntries.reduce((s, e) => s + e.heures, 0);
    if (totalDirectHours > 0 && allBureauEntries.length > 0) {
      const totalBureauHours = allBureauEntries.reduce((s, e) => s + e.heures, 0);
      const totalBureauCost = allBureauEntries.reduce((s, e) => s + getEntryCost(e), 0);
      map.forEach((stat) => {
        const ratio = stat.heures / totalDirectHours;
        stat.heuresBureau = totalBureauHours * ratio;
        stat.coutBureau = totalBureauCost * ratio;
      });
    }

    return Array.from(map.values()).sort((a, b) => b.heures + b.heuresBureau - (a.heures + a.heuresBureau));
  }, [timeEntries, materialCosts, getChantierById, getEntryCost]);

  const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('fr-CH', { style: 'currency', currency: 'CHF' }).format(amount);

  const isToday = (day: Date) => isSameDay(day, new Date());

  // Calculate weekly status for each employee
  const weeklyEmployeeStatus = useMemo(() => {
    return employees.map(emp => {
      const weekEntries = timeEntries.filter(e => 
        e.employeeId === emp.id && 
        weekDays.some(day => format(day, 'yyyy-MM-dd') === e.date)
      );
      
      const totalHours = weekEntries.reduce((sum, e) => sum + e.heures, 0);
      const daysWorked = new Set(weekEntries.map(e => e.date)).size;
      const missingDays = 5 - daysWorked;
      
      // Determine status based on total hours
      let status: 'complete' | 'partial' | 'incomplete' | 'empty';
      if (totalHours === 0) status = 'empty';
      else if (totalHours >= 35) status = 'complete';
      else if (totalHours >= 20) status = 'partial';
      else status = 'incomplete';
      
      return {
        employee: emp,
        totalHours,
        daysWorked,
        missingDays,
        status,
        dailyHours: weekDays.map(day => {
          const dateStr = format(day, 'yyyy-MM-dd');
          const dayEntries = weekEntries.filter(e => e.date === dateStr);
          const chantierHours = dayEntries
            .filter(e => !e.hourCategoryId || !getHourCategoryById(e.hourCategoryId)?.isBureau)
            .reduce((sum, e) => sum + e.heures, 0);
          const bureauHours = dayEntries
            .filter(e => e.hourCategoryId && getHourCategoryById(e.hourCategoryId)?.isBureau)
            .reduce((sum, e) => sum + e.heures, 0);
          return {
            day,
            hours: dayEntries.reduce((sum, e) => sum + e.heures, 0),
            chantierHours,
            bureauHours,
            hasEntries: dayEntries.length > 0,
            hasBureauEntries: bureauHours > 0
          };
        })
      };
    }).sort((a, b) => {
      // Sort by status priority, then by name
      const statusPriority = { empty: 0, incomplete: 1, partial: 2, complete: 3 };
      const priorityDiff = statusPriority[b.status] - statusPriority[a.status];
      if (priorityDiff !== 0) return priorityDiff;
      return a.employee.nom.localeCompare(b.employee.nom);
    });
  }, [employees, timeEntries, weekDays, getHourCategoryById]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'complete':
        return <Badge className="bg-green-100 text-green-800">✅ Complet</Badge>;
      case 'partial':
        return <Badge className="bg-yellow-100 text-yellow-800">⚠️ Incomplet</Badge>;
      case 'incomplete':
        return <Badge className="bg-red-100 text-red-800">🔴 Très incomplet</Badge>;
      case 'empty':
        return <Badge className="bg-gray-100 text-gray-800">❌ Aucune saisie</Badge>;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Planning de la semaine      </h1>
          <p className="text-muted-foreground">
            Semaine du {format(weekStart, 'd MMMM yyyy', { locale: fr })}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => setShowPDFDialog(true)}
            className="flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            Export PDF
          </Button>
          <Button variant="outline" size="icon" onClick={() => setCurrentDate(subWeeks(currentDate, 1))}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" onClick={() => setCurrentDate(new Date())}>Aujourd'hui</Button>
          <Button variant="outline" size="icon" onClick={() => setCurrentDate(addWeeks(currentDate, 1))}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Monthly Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Heures du mois</CardTitle>
            <Timer className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatHoursDecimalWithH(monthlyStats.totalHeures)}</div>
            <p className="text-xs text-muted-foreground">{format(currentDate, 'MMMM yyyy', { locale: fr })}</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Détail des heures</CardTitle>
            <HardHat className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm">Heures chantier:</span>
                <span className="font-semibold">{formatHoursDecimalWithH(monthlyStats.totalHeures - monthlyStats.totalBureauHours)} h</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Heures bureau:</span>
                <span className="font-semibold">{formatHoursDecimalWithH(monthlyStats.totalBureauHours)} h</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Upcoming Appointments Widget */}
        <UpcomingAppointments markers={markers} chantiers={chantiers} maxItems={5} />
      </div>

      {/* Employee Weekly Status Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span>👥 Suivi des heures de la semaine</span>
            <Badge variant="outline" className="text-xs">
              {weeklyEmployeeStatus.filter(emp => emp.status === 'empty').length} sans saisie
            </Badge>
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Semaine du {format(weekStart, 'd MMMM yyyy', { locale: fr })}
          </p>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employé</TableHead>
                  <TableHead className="text-center">Lun</TableHead>
                  <TableHead className="text-center">Mar</TableHead>
                  <TableHead className="text-center">Mer</TableHead>
                  <TableHead className="text-center">Jeu</TableHead>
                  <TableHead className="text-center">Ven</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="text-center">Statut</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {weeklyEmployeeStatus.map((empStatus) => (
                  <TableRow key={empStatus.employee.id}>
                    <TableCell className="font-medium">
                      {empStatus.employee.prenom} {empStatus.employee.nom}
                    </TableCell>
                    {empStatus.dailyHours.map((dayHours, index) => (
                      <TableCell key={index} className="text-center">
                        {dayHours.hasEntries ? (
                          <div className="flex flex-col items-center gap-0.5">
                            {dayHours.chantierHours > 0 && (
                              <span className="font-semibold text-blue-500">
                                {formatHoursDecimalWithH(dayHours.chantierHours)}
                              </span>
                            )}
                            {dayHours.hasBureauEntries && (
                              <span className="text-xs text-orange-500 font-medium">
                                {formatHoursDecimalWithH(dayHours.bureauHours)}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-red-500 font-bold">-</span>
                        )}
                      </TableCell>
                    ))}
                    <TableCell className="text-right font-bold">
                      {formatHoursDecimalWithH(empStatus.totalHours)}
                    </TableCell>
                    <TableCell className="text-center">
                      {getStatusBadge(empStatus.status)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          
          {/* Summary Stats */}
          <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {weeklyEmployeeStatus.filter(emp => emp.status === 'complete').length}
              </div>
              <p className="text-xs text-muted-foreground">Complets</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">
                {weeklyEmployeeStatus.filter(emp => emp.status === 'partial').length}
              </div>
              <p className="text-xs text-muted-foreground">Incomplets</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">
                {weeklyEmployeeStatus.filter(emp => emp.status === 'incomplete').length}
              </div>
              <p className="text-xs text-muted-foreground">Très incomplets</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-600">
                {weeklyEmployeeStatus.filter(emp => emp.status === 'empty').length}
              </div>
              <p className="text-xs text-muted-foreground">Aucune saisie</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Gantt Chart */}
      <GanttChart
        chantiers={chantiers}
        timeEntries={timeEntries}
        employees={employees}
        hourCategories={hourCategories}
        currentDate={currentDate}
        markers={markers}
        onAddMarker={handleAddMarker}
        onDeleteMarker={handleDeleteMarker}
      />

      {/* Week Calendar */}
      <div className="grid grid-cols-5 gap-3">
        {weekDays.map((day) => {
          const dateStr = format(day, 'yyyy-MM-dd');
          const dayEntries = entriesByDay.get(dateStr) || [];
          const totalHours = dayEntries.reduce((s, e) => s + e.heures, 0);
          return (
            <Card
              key={dateStr}
              className={`cursor-pointer transition-all hover:shadow-md hover:border-primary/40 ${isToday(day) ? 'border-primary ring-1 ring-primary/20' : ''}`}
              onClick={() => handleDayClick(day)}>
              
              <CardHeader className="pb-2 pt-3 px-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium capitalize">
                    {format(day, 'EEEE', { locale: fr })}
                  </CardTitle>
                  {isToday(day) && <Badge variant="default" className="text-xs px-1.5 py-0">Aujourd'hui</Badge>}
                </div>
                <p className="text-lg font-bold">{format(day, 'd MMM', { locale: fr })}</p>
              </CardHeader>
              <CardContent className="px-3 pb-3 space-y-1.5">
                {dayEntries.length === 0 ?
                <div className="text-center py-4 text-muted-foreground">
                    <Plus className="h-5 w-5 mx-auto mb-1 opacity-40" />
                    <p className="text-xs">Cliquer pour ajouter</p>
                  </div> :

                <>
                    {dayEntries.slice(0, 4).map((entry) => {
                    const emp = getEmployeeById(entry.employeeId);
                    const ch = entry.chantierId ? getChantierById(entry.chantierId) : null;
                    const catLabel = entry.chantierId ? ch?.nom : 'Bureau';
                    return (
                      <div key={entry.id} className="text-xs bg-muted rounded-md p-1.5 flex flex-col gap-0.5">
                        <div className="flex justify-between items-center">
                          <div className="truncate">
                            <span className="font-medium">{emp?.prenom?.[0]}. {emp?.nom}</span>
                            <span className="text-muted-foreground"> — {catLabel}</span>
                          </div>
                          <span className="font-semibold text-primary ml-1 whitespace-nowrap">{entry.heures}h</span>
                        </div>
                        {entry.description && (
                          <div className="text-xs text-muted-foreground italic truncate">
                            💬 {entry.description}
                          </div>
                        )}
                        </div>);

                  })}
                    {dayEntries.length > 4 &&
                  <p className="text-xs text-muted-foreground text-center">+{dayEntries.length - 4} autres</p>
                  }
                    <div className="flex items-center justify-end gap-1 pt-1 border-t border-border">
                      <Clock className="h-3 w-3 text-muted-foreground" />
                      <span className="text-xs font-semibold">{totalHours}h total</span>
                    </div>
                  </>
                }
              </CardContent>
            </Card>);

        })}
      </div>

      {/* Add Entry Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="sm:max-w-[425px] max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle>
              {selectedDay && <>Ajouter des heures — {format(selectedDay, 'EEEE d MMMM', { locale: fr })}</>}
            </DialogTitle>
          </DialogHeader>

          <div className="overflow-y-auto space-y-4 pr-1 max-h-[72vh]">
            {/* Existing entries */}
            {selectedDay && (() => {
              const dateStr = format(selectedDay, 'yyyy-MM-dd');
              const dayEntries = timeEntries.filter((e) => e.date === dateStr);
              if (dayEntries.length === 0) return null;
              return (
                <div className="space-y-2">
                  <Label className="text-sm text-muted-foreground">Entrées existantes</Label>
                  {dayEntries.map((entry) => {
                    const emp = getEmployeeById(entry.employeeId);
                    const ch = entry.chantierId ? getChantierById(entry.chantierId) : null;
                    const cat = entry.hourCategoryId ? getHourCategoryById(entry.hourCategoryId) : null;
                    return (
                      <div key={entry.id} className="flex flex-col bg-muted rounded-md p-2 text-sm gap-1">
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="font-medium">{emp?.prenom} {emp?.nom}</span>
                            <span className="text-muted-foreground"> — {entry.chantierId ? ch?.nom : 'Bureau'} — {entry.heures}h</span>
                            {cat && <span className="text-muted-foreground"> ({cat.nom})</span>}
                          </div>
                          <div className="flex items-center gap-1">
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleEditEntry(entry)}>
                              <Edit className="h-3.5 w-3.5 text-primary" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => deleteTimeEntry(entry.id)}>
                              <Trash2 className="h-3.5 w-3.5 text-destructive" />
                            </Button>
                          </div>
                        </div>
                        {entry.description && (
                          <div className="text-xs text-muted-foreground italic">
                            💬 {entry.description}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            })()}

            <div className="grid gap-4 py-2">
              {!isBureauSelected && (
                <div className="grid gap-2">
                  <Label className="text-base">Chantier</Label>
                  <Select value={selectedChantierId} onValueChange={setSelectedChantierId}>
                    <SelectTrigger className="h-12"><SelectValue placeholder="Sélectionner un chantier" /></SelectTrigger>
                    <SelectContent>
                      {chantiers.map((ch) => (
                        <SelectItem key={ch.id} value={ch.id}>{ch.nom}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="grid gap-2">
                <Label className="text-base">Employé</Label>
                <Select value={selectedEmployeeId} onValueChange={setSelectedEmployeeId}>
                  <SelectTrigger className="h-12"><SelectValue placeholder="Sélectionner un employé" /></SelectTrigger>
                  <SelectContent>
                    {employees.map((emp) => (
                      <SelectItem key={emp.id} value={emp.id}>{emp.prenom} {emp.nom}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label className="text-base">Catégorie d'heures</Label>
                <Select value={selectedHourCategoryId} onValueChange={(val) => {
                  setSelectedHourCategoryId(val);
                  const cat = hourCategories.find((c) => c.id === val);
                  if (cat?.isBureau) setSelectedChantierId('');
                }}>
                  <SelectTrigger className="h-12"><SelectValue placeholder="Sélectionner une catégorie" /></SelectTrigger>
                  <SelectContent>
                    {hourCategories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.nom} ({cat.pourcentage > 0 ? '+' : ''}{cat.pourcentage}%)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label className="text-base">Nombre d'heures</Label>
                <Input type="number" step="0.5" value={heures} onChange={(e) => setHeures(e.target.value)} placeholder="8" className="h-12 text-lg" />
              </div>

              {previewCost !== null && (
                <div className="rounded-md bg-muted p-3 text-sm">
                  <span className="text-muted-foreground">Coût estimé : </span>
                  <span className="font-semibold text-primary">{formatCurrency(previewCost)}</span>
                </div>
              )}

              <div className="grid gap-2">
                <Label className="text-base">Résumé (optionnel)</Label>
                <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Description du travail effectué..." rows={3} className="resize-none text-base" />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button onClick={handleAddEntry} disabled={!isBureauSelected && !selectedChantierId || !selectedEmployeeId || !heures} className="h-12 px-6 text-base">
              <Plus className="mr-2 h-5 w-5" />{editingEntryId ? 'Enregistrer' : 'Ajouter'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Dialog pour export PDF */}
      <PDFExportDialog
        open={showPDFDialog}
        onOpenChange={setShowPDFDialog}
        employees={employees}
        timeEntries={timeEntries}
        chantiers={chantiers}
        hourCategories={hourCategories}
        materialCosts={materialCosts}
        ganttMarkers={markers}
      />
    </div>);

};

export default Dashboard;