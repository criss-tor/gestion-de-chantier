import { useState, useMemo } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, startOfWeek, endOfWeek, addMonths, subMonths, addWeeks, subWeeks, isSameMonth, isSameDay, parseISO, isWeekend } from 'date-fns';
import { fr } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Calendar, Flag, Trash2, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Chantier, TimeEntry, Employee, HourCategory } from '@/types/employee';

interface GanttMarker {
  id: string;
  chantierId: string;
  date: string;
  endDate?: string;
  type: 'milestone' | 'appointment' | 'end-date' | 'custom' | 'range';
  label: string;
  color?: string;
}

interface GanttChartProps {
  chantiers: Chantier[];
  timeEntries: TimeEntry[];
  employees: Employee[];
  hourCategories: HourCategory[];
  currentDate: Date;
  onMonthChange?: (date: Date) => void;
  markers?: GanttMarker[];
  onAddMarker?: (marker: Omit<GanttMarker, 'id'>) => void;
  onDeleteMarker?: (id: string) => void;
}

export default function GanttChart({
  chantiers,
  timeEntries,
  employees,
  hourCategories,
  currentDate,
  onMonthChange,
  markers = [],
  onAddMarker,
  onDeleteMarker,
}: GanttChartProps) {
  const [viewDate, setViewDate] = useState(currentDate);
  const [showAddMarkerDialog, setShowAddMarkerDialog] = useState(false);
  const [showMarkerDetailDialog, setShowMarkerDetailDialog] = useState(false);
  const [showChantierDetailDialog, setShowChantierDetailDialog] = useState(false);
  const [selectedMarker, setSelectedMarker] = useState<GanttMarker | null>(null);
  const [selectedChantierId, setSelectedChantierId] = useState<string | null>(null);

  // Form for new marker
  const [newMarkerChantierId, setNewMarkerChantierId] = useState('');
  const [newMarkerDate, setNewMarkerDate] = useState('');
  const [newMarkerEndDate, setNewMarkerEndDate] = useState('');
  const [newMarkerType, setNewMarkerType] = useState<GanttMarker['type']>('appointment');
  const [newMarkerLabel, setNewMarkerLabel] = useState('');

  // View mode: month or week
  const [viewMode, setViewMode] = useState<'month' | 'week'>('month');

  // Calculate days to display based on view mode
  const days = useMemo(() => {
    if (viewMode === 'month') {
      const monthStart = startOfMonth(viewDate);
      const monthEnd = endOfMonth(viewDate);
      const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
      const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
      return eachDayOfInterval({ start: calendarStart, end: calendarEnd });
    } else {
      const weekStart = startOfWeek(viewDate, { weekStartsOn: 1 });
      const weekEnd = endOfWeek(viewDate, { weekStartsOn: 1 });
      return eachDayOfInterval({ start: weekStart, end: weekEnd });
    }
  }, [viewDate, viewMode]);

  // Get weeks for header
  const weeks = useMemo(() => {
    const weekNumbers: { week: number; days: Date[] }[] = [];
    let currentWeek: Date[] = [];
    let currentWeekNum = 0;

    days.forEach((day, index) => {
      const weekNum = parseInt(format(day, 'w'));
      if (index === 0 || weekNum !== currentWeekNum) {
        if (currentWeek.length > 0) {
          weekNumbers.push({ week: currentWeekNum, days: currentWeek });
        }
        currentWeekNum = weekNum;
        currentWeek = [day];
      } else {
        currentWeek.push(day);
      }
    });
    if (currentWeek.length > 0) {
      weekNumbers.push({ week: currentWeekNum, days: currentWeek });
    }
    return weekNumbers;
  }, [days]);

  // Get all chantiers (even without entries) to show on Gantt
  const activeChantiers = useMemo(() => {
    return chantiers
      .slice()
      .sort((a, b) => a.nom.localeCompare(b.nom));
  }, [chantiers]);

  // Get entries for each chantier per day
  const getEntriesForChantier = (chantierId: string, day: Date) => {
    const dateStr = format(day, 'yyyy-MM-dd');
    return timeEntries.filter((e) => e.employeeId && e.chantierId === chantierId && e.date === dateStr);
  };

  // Get markers for a chantier on a specific day (including range markers)
  const getMarkersForDay = (chantierId: string, day: Date) => {
    const dateStr = format(day, 'yyyy-MM-dd');
    return markers.filter((m) => {
      if (m.chantierId !== chantierId) return false;
      if ((m.type === 'range' || m.type === 'appointment') && m.endDate) {
        return dateStr >= m.date && dateStr <= m.endDate;
      }
      return m.date === dateStr;
    });
  };

  const handlePrev = () => {
    const newDate = viewMode === 'month' ? subMonths(viewDate, 1) : subWeeks(viewDate, 1);
    setViewDate(newDate);
    onMonthChange?.(newDate);
  };

  const handleNext = () => {
    const newDate = viewMode === 'month' ? addMonths(viewDate, 1) : addWeeks(viewDate, 1);
    setViewDate(newDate);
    onMonthChange?.(newDate);
  };

  const handleToday = () => {
    const newDate = new Date();
    setViewDate(newDate);
    onMonthChange?.(newDate);
  };

  const handleToggleViewMode = () => {
    setViewMode((prev) => (prev === 'month' ? 'week' : 'month'));
  };

  const handleOpenAddMarker = () => {
    // Reset form first
    setNewMarkerChantierId('');
    setNewMarkerDate('');
    setNewMarkerEndDate('');
    setNewMarkerType('appointment');
    setNewMarkerLabel('');
    setShowAddMarkerDialog(true);
  };

  const handleSaveMarker = () => {
    if (!newMarkerChantierId || !newMarkerDate || !newMarkerLabel) return;

    onAddMarker?.({
      chantierId: newMarkerChantierId,
      date: newMarkerDate,
      endDate: (newMarkerType === 'range' || newMarkerType === 'appointment') && newMarkerEndDate ? newMarkerEndDate : undefined,
      type: newMarkerType,
      label: newMarkerLabel,
    });

    // Reset form
    setNewMarkerChantierId('');
    setNewMarkerDate('');
    setNewMarkerEndDate('');
    setNewMarkerType('appointment');
    setNewMarkerLabel('');
    setShowAddMarkerDialog(false);
  };

  const handleMarkerClick = (marker: GanttMarker) => {
    setSelectedMarker(marker);
    setShowMarkerDetailDialog(true);
  };

  const handleChantierClick = (chantierId: string) => {
    setSelectedChantierId(chantierId);
    setShowChantierDetailDialog(true);
  };

  const getMarkerColor = (type: GanttMarker['type']) => {
    switch (type) {
      case 'milestone':
        return 'bg-blue-500';
      case 'appointment':
        return 'bg-orange-500';
      case 'end-date':
        return 'bg-red-500';
      case 'range':
        return 'bg-green-500';
      default:
        return 'bg-purple-500';
    }
  };

  // Calculate total hours for a chantier in the current month
  const getChantierMonthHours = (chantierId: string) => {
    const monthStr = format(viewDate, 'yyyy-MM');
    return timeEntries
      .filter((e) => e.chantierId === chantierId && e.date.startsWith(monthStr))
      .reduce((sum, e) => sum + e.heures, 0);
  };

  // Get employees who worked on a chantier on a specific day
  const getEmployeesForDay = (chantierId: string, day: Date) => {
    const entries = getEntriesForChantier(chantierId, day);
    return entries.map((e) => {
      const emp = employees.find((emp) => emp.id === e.employeeId);
      return emp ? `${emp.prenom} ${emp.nom}` : 'Inconnu';
    });
  };

  // Selected chantier details
  const selectedChantier = selectedChantierId
    ? activeChantiers.find((c) => c.id === selectedChantierId)
    : null;

  const selectedChantierEntries = useMemo(() => {
    if (!selectedChantierId) return [];
    const monthStr = format(viewDate, 'yyyy-MM');
    return timeEntries.filter(
      (e) => e.chantierId === selectedChantierId && e.date.startsWith(monthStr)
    );
  }, [selectedChantierId, timeEntries, viewDate]);

  const selectedChantierEmployees = useMemo(() => {
    const empMap = new Map<string, { employee: Employee; heures: number }>();
    selectedChantierEntries.forEach((entry) => {
      const emp = employees.find((e) => e.id === entry.employeeId);
      if (emp) {
        const existing = empMap.get(emp.id) || { employee: emp, heures: 0 };
        existing.heures += entry.heures;
        empMap.set(emp.id, existing);
      }
    });
    return Array.from(empMap.values()).sort((a, b) => b.heures - a.heures);
  }, [selectedChantierEntries, employees]);

  const selectedChantierDaysWorked = useMemo(() => {
    const days = new Set(selectedChantierEntries.map((e) => e.date));
    return days.size;
  }, [selectedChantierEntries]);

  const selectedChantierPeriod = useMemo(() => {
    if (selectedChantierEntries.length === 0) return '-';
    const dates = selectedChantierEntries.map((e) => parseISO(e.date)).sort((a, b) => a.getTime() - b.getTime());
    return `${format(dates[0], 'dd/MM/yyyy')} - ${format(dates[dates.length - 1], 'dd/MM/yyyy')}`;
  }, [selectedChantierEntries]);

  return (
    <>
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Planning des chantiers
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handleOpenAddMarker}>
                <Flag className="h-4 w-4 mr-1" />
                Marqueur
              </Button>
              <Button variant="outline" size="icon" onClick={handlePrev}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" onClick={handleToday}>Aujourd'hui</Button>
              <Button variant="outline" size="icon" onClick={handleNext}>
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={handleToggleViewMode}>
                {viewMode === 'month' ? 'Semaine' : 'Mois'}
              </Button>
            </div>
          </div>
          <p className="text-lg font-semibold">{format(viewDate, 'MMMM yyyy', { locale: fr })}</p>
        </CardHeader>
        <CardContent>
          {activeChantiers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>Aucun chantier disponible</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  {/* Week numbers row */}
                  <tr>
                    <th className="w-48 min-w-[192px] p-2 text-left border-b"></th>
                    {weeks.map((week, idx) => (
                      <th
                        key={idx}
                        className="p-1 text-center text-xs font-medium text-muted-foreground border-b"
                        colSpan={week.days.length}
                      >
                        S{week.week}
                      </th>
                    ))}
                    <th className="w-20 p-2 text-center border-b">Total</th>
                  </tr>
                  {/* Days row */}
                  <tr>
                    <th className="w-48 min-w-[192px] p-2 text-left text-sm font-medium border-b">Chantier</th>
                    {days.map((day) => {
                      const isCurrentMonth = isSameMonth(day, viewDate);
                      const isTodayDate = isSameDay(day, new Date());
                      const isWeekendDay = isWeekend(day);
                      return (
                        <th
                          key={day.toISOString()}
                          className={`w-8 min-w-[32px] p-1 text-center text-xs border-b ${
                            !isCurrentMonth
                              ? 'bg-muted/30 text-muted-foreground'
                              : isWeekendDay
                              ? 'bg-muted/50 text-muted-foreground'
                              : ''
                          } ${isTodayDate ? 'bg-primary/10 font-bold' : ''}`}
                        >
                          {format(day, 'd')}
                          <br />
                          {format(day, 'EEEEE', { locale: fr })}
                        </th>
                      );
                    })}
                    <th className="w-20 p-2 text-center border-b">h</th>
                  </tr>
                </thead>
                <tbody>
                  {activeChantiers.map((chantier, index) => {
                    const totalHours = getChantierMonthHours(chantier.id);
                    return (
                      <tr key={chantier.id} className={`${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-green-100`}>
                        <td
                          className="p-2 text-sm font-medium cursor-pointer hover:text-primary hover:underline"
                          onClick={() => handleChantierClick(chantier.id)}
                          title="Cliquez pour voir les détails"
                        >
                          {chantier.nom}
                        </td>
                        {days.map((day) => {
                          const isCurrentMonth = isSameMonth(day, viewDate);
                          const isTodayDate = isSameDay(day, new Date());
                          const isWeekendDay = isWeekend(day);
                          const entries = getEntriesForChantier(chantier.id, day);
                          const dayMarkers = getMarkersForDay(chantier.id, day);
                          const hasHours = entries.length > 0;
                          const employeesForDay = getEmployeesForDay(chantier.id, day);

                          return (
                            <td
                              key={day.toISOString()}
                              className={`p-0.5 text-center border-r border-l ${
                                !isCurrentMonth
                                  ? 'bg-muted/30'
                                  : isWeekendDay
                                  ? 'bg-muted/50'
                                  : ''
                              } ${isTodayDate ? 'bg-primary/5' : ''}`}
                            >
                              {hasHours && (
                                <div
                                  className="w-full h-6 bg-blue-200 rounded-sm flex items-center justify-center cursor-help"
                                  title={`${entries.reduce((s, e) => s + e.heures, 0)}h - ${employeesForDay.join(', ')}`}
                                >
                                  <span className="text-xs font-medium text-blue-800">
                                    {entries.reduce((s, e) => s + e.heures, 0)}
                                  </span>
                                </div>
                              )}
                              {dayMarkers.map((marker) => (
                                <div
                                  key={marker.id}
                                  className={`cursor-pointer mx-auto ${
                                    marker.type === 'range' || (marker.type === 'appointment' && marker.endDate && marker.endDate !== marker.date)
                                      ? 'h-2 w-full rounded-sm'
                                      : 'w-3 h-3 rounded-full'
                                  } ${getMarkerColor(marker.type)}`}
                                  title={marker.label}
                                  onClick={() => handleMarkerClick(marker)}
                                />
                              ))}
                            </td>
                          );
                        })}
                        <td className="p-2 text-center font-semibold text-sm">
                          {totalHours > 0 ? `${totalHours}h` : '-'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Marker Dialog */}
      <Dialog open={showAddMarkerDialog} onOpenChange={setShowAddMarkerDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ajouter un marqueur</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Chantier</Label>
              <Select value={newMarkerChantierId} onValueChange={setNewMarkerChantierId}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un chantier" />
                </SelectTrigger>
                <SelectContent>
                  {chantiers.map((ch) => (
                    <SelectItem key={ch.id} value={ch.id}>
                      {ch.nom}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Type</Label>
              <Select
                value={newMarkerType}
                onValueChange={(val) => setNewMarkerType(val as GanttMarker['type'])}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="appointment">Rendez-vous</SelectItem>
                  <SelectItem value="end-date">Date de fin</SelectItem>
                  <SelectItem value="range">Plage (début-fin)</SelectItem>
                  <SelectItem value="custom">Personnalisé</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Date de début</Label>
              <Input
                type="date"
                value={newMarkerDate}
                onChange={(e) => setNewMarkerDate(e.target.value)}
              />
            </div>
            {(newMarkerType === 'range' || newMarkerType === 'appointment') && (
              <div className="grid gap-2">
                <Label>Date de fin {newMarkerType === 'appointment' ? '(optionnelle)' : ''}</Label>
                <Input
                  type="date"
                  value={newMarkerEndDate}
                  onChange={(e) => setNewMarkerEndDate(e.target.value)}
                  placeholder={newMarkerType === 'appointment' ? 'Laisser vide pour 1 jour' : ''}
                />
              </div>
            )}
            <div className="grid gap-2">
              <Label>Libellé</Label>
              <Input
                value={newMarkerLabel}
                onChange={(e) => setNewMarkerLabel(e.target.value)}
                placeholder="Description du marqueur"
              />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleSaveMarker} disabled={!newMarkerChantierId || !newMarkerDate || !newMarkerLabel}>
              Ajouter
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Marker Detail Dialog */}
      <Dialog open={showMarkerDetailDialog} onOpenChange={setShowMarkerDetailDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Détail du marqueur</DialogTitle>
          </DialogHeader>
          {selectedMarker && (
            <div className="grid gap-4 py-4">
              <div className="flex items-center gap-2">
                <div className={`w-4 h-4 rounded-full ${getMarkerColor(selectedMarker.type)}`} />
                <Badge>
                  {selectedMarker.type === 'milestone' && 'Jalon'}
                  {selectedMarker.type === 'appointment' && 'Rendez-vous'}
                  {selectedMarker.type === 'end-date' && 'Date de fin'}
                  {selectedMarker.type === 'range' && 'Plage'}
                  {selectedMarker.type === 'custom' && 'Personnalisé'}
                </Badge>
              </div>
              <div>
                <Label className="text-muted-foreground">Libellé</Label>
                <p className="font-medium">{selectedMarker.label}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Date</Label>
                <p>{format(parseISO(selectedMarker.date), 'dd/MM/yyyy')}</p>
              </div>
              {selectedMarker.endDate && (
                <div>
                  <Label className="text-muted-foreground">Date de fin</Label>
                  <p>{format(parseISO(selectedMarker.endDate), 'dd/MM/yyyy')}</p>
                </div>
              )}
              <div>
                <Label className="text-muted-foreground">Chantier</Label>
                <p>{chantiers.find((c) => c.id === selectedMarker.chantierId)?.nom || 'Inconnu'}</p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="destructive"
              onClick={() => {
                if (selectedMarker) {
                  onDeleteMarker?.(selectedMarker.id);
                  setShowMarkerDetailDialog(false);
                }
              }}
            >
              <Trash2 className="h-4 w-4 mr-1" />
              Supprimer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Chantier Detail Dialog */}
      <Dialog open={showChantierDetailDialog} onOpenChange={setShowChantierDetailDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{selectedChantier?.nom}</DialogTitle>
          </DialogHeader>
          {selectedChantier && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Heures du mois</Label>
                  <p className="text-2xl font-bold">
                    {selectedChantierEntries.reduce((s, e) => s + e.heures, 0)}h
                  </p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Jours travaillés</Label>
                  <p className="text-2xl font-bold">{selectedChantierDaysWorked}</p>
                </div>
              </div>
              <div>
                <Label className="text-muted-foreground">Période</Label>
                <p>{selectedChantierPeriod}</p>
              </div>
              {selectedChantier.devis !== undefined && selectedChantier.devis > 0 && (
                <div>
                  <Label className="text-muted-foreground">Devis</Label>
                  <p>{selectedChantier.devis} CHF</p>
                </div>
              )}
              <div>
                <Label className="text-muted-foreground">Heures par employé</Label>
                <div className="mt-2 space-y-2">
                  {selectedChantierEmployees.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Aucune heure enregistrée</p>
                  ) : (
                    selectedChantierEmployees.map((emp) => (
                      <div key={emp.employee.id} className="flex justify-between items-center">
                        <span className="text-sm">
                          {emp.employee.prenom} {emp.employee.nom}
                        </span>
                        <span className="font-semibold">{emp.heures}h</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}