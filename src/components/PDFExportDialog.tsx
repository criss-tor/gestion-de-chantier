import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { FileText, Download, Calendar, Users, Building2, FileSpreadsheet } from 'lucide-react';
import { Employee, TimeEntry, Chantier, HourCategory } from '@/types/employee';
import { pdfExportService } from '@/lib/pdfExport';
import { format, subMonths } from 'date-fns';
import { fr } from 'date-fns/locale';

interface PDFExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employees: Employee[];
  timeEntries: TimeEntry[];
  chantiers: Chantier[];
  hourCategories: HourCategory[];
}

export function PDFExportDialog({
  open,
  onOpenChange,
  employees,
  timeEntries,
  chantiers,
  hourCategories
}: PDFExportDialogProps) {
  const [exportType, setExportType] = useState<'employee' | 'chantier' | 'global'>('employee');
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('');
  const [selectedChantierId, setSelectedChantierId] = useState<string>('');
  const [selectedMonth, setSelectedMonth] = useState<string>(format(new Date(), 'yyyy-MM'));
  const [isExporting, setIsExporting] = useState(false);

  // Générer la liste des mois disponibles
  const availableMonths = () => {
    const months = [];
    for (let i = 0; i < 12; i++) {
      const date = subMonths(new Date(), i);
      const monthStr = format(date, 'yyyy-MM');
      months.push({
        value: monthStr,
        label: format(date, 'MMMM yyyy', { locale: fr })
      });
    }
    return months;
  };

  const handleExport = async () => {
    setIsExporting(true);
    
    try {
      switch (exportType) {
        case 'employee':
          if (!selectedEmployeeId) {
            alert('Veuillez sélectionner un employé');
            return;
          }
          const employee = employees.find(e => e.id === selectedEmployeeId);
          if (employee) {
            await pdfExportService.exportEmployeeMonthlyReport(
              employee,
              timeEntries,
              chantiers,
              hourCategories,
              selectedMonth
            );
          }
          break;
          
        case 'chantier':
          if (!selectedChantierId) {
            alert('Veuillez sélectionner un chantier');
            return;
          }
          const chantier = chantiers.find(c => c.id === selectedChantierId);
          if (chantier) {
            await pdfExportService.exportChantierReport(
              chantier,
              timeEntries,
              employees,
              hourCategories,
              selectedMonth
            );
          }
          break;
          
        case 'global':
          await pdfExportService.exportGlobalSummary(
            employees,
            timeEntries,
            chantiers,
            selectedMonth
          );
          break;
      }
      
      onOpenChange(false);
    } catch (error) {
      console.error('Erreur lors de l\'export PDF:', error);
      alert('Erreur lors de la génération du PDF');
    } finally {
      setIsExporting(false);
    }
  };

  const getExportDescription = () => {
    switch (exportType) {
      case 'employee':
        return 'Génère un rapport détaillé des heures pour un employé spécifique';
      case 'chantier':
        return 'Génère un bilan des heures et coûts par chantier';
      case 'global':
        return 'Génère un résumé global de tous les employés et chantiers';
    }
  };

  const selectedEmployee = employees.find(e => e.id === selectedEmployeeId);
  const monthEntries = timeEntries.filter(e => e.date.startsWith(selectedMonth));
  const employeeEntries = selectedEmployee 
    ? monthEntries.filter(e => e.employeeId === selectedEmployeeId)
    : [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Export PDF
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Type d'export */}
          <div className="space-y-2">
            <Label>Type de rapport</Label>
            <Select value={exportType} onValueChange={(value: any) => setExportType(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="employee">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Rapport employé
                  </div>
                </SelectItem>
                <SelectItem value="chantier">
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4" />
                    Bilan chantier
                  </div>
                </SelectItem>
                <SelectItem value="global">
                  <div className="flex items-center gap-2">
                    <FileSpreadsheet className="h-4 w-4" />
                    Résumé global
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground">{getExportDescription()}</p>
          </div>

          {/* Sélection du mois */}
          <div className="space-y-2">
            <Label>Mois</Label>
            <Select value={selectedMonth} onValueChange={setSelectedMonth}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {availableMonths().map((month) => (
                  <SelectItem key={month.value} value={month.value}>
                    {month.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Sélection de l'employé (si type employé) */}
          {exportType === 'employee' && (
            <div className="space-y-2">
              <Label>Employé</Label>
              <Select value={selectedEmployeeId} onValueChange={setSelectedEmployeeId}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un employé" />
                </SelectTrigger>
                <SelectContent>
                  {employees.map((employee) => (
                    <SelectItem key={employee.id} value={employee.id}>
                      {employee.prenom} {employee.nom}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Sélection du chantier (si type chantier) */}
          {exportType === 'chantier' && (
            <div className="space-y-2">
              <Label>Chantier</Label>
              <Select value={selectedChantierId} onValueChange={setSelectedChantierId}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un chantier" />
                </SelectTrigger>
                <SelectContent>
                  {chantiers.map((chantier) => (
                    <SelectItem key={chantier.id} value={chantier.id}>
                      {chantier.nom}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Statistiques */}
          <div className="bg-muted/50 p-4 rounded-lg">
            <h4 className="font-medium mb-2">Statistiques pour {format(new Date(selectedMonth + '-01'), 'MMMM yyyy', { locale: fr })}</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Total entrées:</span>
                <Badge variant="outline" className="ml-2">{monthEntries.length}</Badge>
              </div>
              {exportType === 'employee' && selectedEmployee && (
                <div>
                  <span className="text-muted-foreground">Entrées employé:</span>
                  <Badge variant="outline" className="ml-2">{employeeEntries.length}</Badge>
                </div>
              )}
              {exportType === 'chantier' && selectedChantierId && (
                <div>
                  <span className="text-muted-foreground">Entrées chantier:</span>
                  <Badge variant="outline" className="ml-2">
                    {monthEntries.filter(e => e.chantierId === selectedChantierId).length}
                  </Badge>
                </div>
              )}
              <div>
                <span className="text-muted-foreground">Employés actifs:</span>
                <Badge variant="outline" className="ml-2">
                  {new Set(monthEntries.map(e => e.employeeId)).size}
                </Badge>
              </div>
              <div>
                <span className="text-muted-foreground">Chantiers actifs:</span>
                <Badge variant="outline" className="ml-2">
                  {new Set(monthEntries.filter(e => e.chantierId).map(e => e.chantierId)).size}
                </Badge>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button 
            onClick={handleExport} 
            disabled={isExporting || 
              (exportType === 'employee' && !selectedEmployeeId) ||
              (exportType === 'chantier' && !selectedChantierId)}
            className="flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            {isExporting ? 'Génération...' : 'Exporter PDF'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
