import { Employee, TimeEntry, Chantier, MaterialCost, HourCategory, ChantierStats } from '@/types/employee';
import * as XLSX from 'xlsx';

interface GanttMarker {
  id: string;
  chantierId: string;
  date: string;
  endDate?: string;
  type: 'milestone' | 'appointment' | 'end-date' | 'custom' | 'range';
  label: string;
}

interface BackupData {
  employees: Employee[];
  timeEntries: TimeEntry[];
  chantiers: Chantier[];
  materialCosts: MaterialCost[];
  hourCategories: HourCategory[];
  ganttMarkers: GanttMarker[];
}

export function exportBackup(data: BackupData): void {
  const wb = XLSX.utils.book_new();

  // Employees sheet
  const empRows = data.employees.map(e => ({
    ID: e.id, Nom: e.nom, Prénom: e.prenom, 'Coût Horaire (€)': e.coutHoraire,
    Rôle: e.role, 'Code PIN': e.pin
  }));
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(empRows), 'Employés');

  // Hour Categories sheet
  const catRows = data.hourCategories.map(c => ({
    ID: c.id, Nom: c.nom, 'Pourcentage (%)': c.pourcentage, Bureau: c.isBureau ? 'Oui' : 'Non'
  }));
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(catRows), 'Catégories');

  // Chantiers sheet
  const chRows = data.chantiers.map(c => ({
    ID: c.id,
    Nom: c.nom,
    Description: c.description || '',
    Devis: c.devis ?? 0,
    'Heures prévues': c.heuresPrevues ?? 0,
  }));
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(chRows), 'Chantiers');

  // Time Entries sheet
  const teRows = data.timeEntries.map(e => ({
    ID: e.id, 'ID Employé': e.employeeId, 'ID Chantier': e.chantierId || '',
    Date: e.date, Heures: e.heures, Description: e.description || '',
    'ID Catégorie': e.hourCategoryId || ''
  }));
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(teRows), 'Heures');

  // Material Costs sheet
  const mcRows = data.materialCosts.map(c => ({
    ID: c.id, 'ID Chantier': c.chantierId, Date: c.date,
    'Montant (€)': c.montant, Description: c.description
  }));
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(mcRows), 'Matériaux');

  // Gantt Markers sheet
  const markerRows = data.ganttMarkers?.map(m => ({
    ID: m.id,
    'ID Chantier': m.chantierId,
    Date: m.date,
    'Date fin': m.endDate || '',
    Type: m.type,
    Label: m.label
  })) || [];
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(markerRows), 'Rendez-vous');

  XLSX.writeFile(wb, `sauvegarde_${new Date().toISOString().slice(0, 10)}.xlsx`);
}

export function exportChantierReport(chantiers: Chantier[], chantierStats: ChantierStats[]) {
  const wb = XLSX.utils.book_new();

  const rows = chantierStats.map((s) => {
    const chantier = chantiers.find((c) => c.id === s.chantierId);
    const devis = chantier?.devis ?? 0;
    const heuresPrevues = chantier?.heuresPrevues ?? 0;
    const coutTotal = s.coutTotal;
    const margin = devis - coutTotal;
    const pct = devis > 0 ? (coutTotal / devis) * 100 : 0;

    const totalHours = s.heures + s.heuresBureau;
    const ecartHeures = totalHours - heuresPrevues;
    const pctHeures = heuresPrevues > 0 ? (totalHours / heuresPrevues) * 100 : 0;

    return {
      Chantier: s.chantierNom,
      "Heures réelles": totalHours,
      "Heures prévues": heuresPrevues,
      "Écart heures": ecartHeures,
      "% heures prévues": Number(pctHeures.toFixed(1)),
      Devis: devis,
      "Coût main-d'œuvre": s.coutMain,
      "Coût matériel": s.coutMateriel,
      "Coût bureau": s.coutBureau,
      "Coût total": coutTotal,
      Marge: margin,
      "% devis consommé": Number(pct.toFixed(1)),
    };
  });

  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rows), 'Bilan chantier');
  XLSX.writeFile(wb, `bilan_chantier_${new Date().toISOString().slice(0, 10)}.xlsx`);
}

export function importBackup(fileBuffer: ArrayBuffer): BackupData {
  const wb = XLSX.read(fileBuffer, { type: 'array' });
  const data: BackupData = {
    employees: [], timeEntries: [], chantiers: [], materialCosts: [], hourCategories: [], ganttMarkers: [],
  };

  // Employees
  const empSheet = wb.Sheets['Employés'];
  if (empSheet) {
    const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(empSheet);
    data.employees = rows.map((r: Record<string, unknown>) => ({
      id: String(r['ID'] ?? ''), nom: String(r['Nom'] ?? ''), prenom: String(r['Prénom'] ?? ''),
      coutHoraire: Number(r['Coût Horaire (€)'] ?? 0),
      role: (String(r['Rôle'] ?? 'employe') as 'admin' | 'employe'),
      pin: String(r['Code PIN'] ?? '0000')
    }));
  }

  // Hour Categories
  const catSheet = wb.Sheets['Catégories'];
  if (catSheet) {
    const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(catSheet);
    data.hourCategories = rows.map((r: Record<string, unknown>) => ({
      id: String(r['ID'] ?? ''), nom: String(r['Nom'] ?? ''),
      pourcentage: Number(r['Pourcentage (%)'] ?? 0),
      isBureau: r['Bureau'] === 'Oui'
    }));
  }

  // Chantiers
  const chSheet = wb.Sheets['Chantiers'];
  if (chSheet) {
    const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(chSheet);
    data.chantiers = rows.map((r: Record<string, unknown>) => ({
      id: String(r['ID'] ?? ''),
      nom: String(r['Nom'] ?? ''),
      description: r['Description'] ? String(r['Description']) : undefined,
      devis: Number(r['Devis'] ?? 0),
      heuresPrevues: Number(r['Heures prévues'] ?? 0),
    }));
  }

  // Time Entries
  const teSheet = wb.Sheets['Heures'];
  if (teSheet) {
    const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(teSheet);
    data.timeEntries = rows.map((r: Record<string, unknown>) => ({
      id: String(r['ID'] ?? ''), employeeId: String(r['ID Employé'] ?? ''),
      chantierId: r['ID Chantier'] ? String(r['ID Chantier']) : undefined,
      date: String(r['Date'] ?? ''), heures: Number(r['Heures'] ?? 0),
      description: r['Description'] ? String(r['Description']) : undefined,
      hourCategoryId: r['ID Catégorie'] ? String(r['ID Catégorie']) : undefined
    }));
  }

  // Material Costs
  const mcSheet = wb.Sheets['Matériaux'];
  if (mcSheet) {
    const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(mcSheet);
    data.materialCosts = rows.map((r: Record<string, unknown>) => ({
      id: String(r['ID'] ?? ''), chantierId: String(r['ID Chantier'] ?? ''),
      date: String(r['Date'] ?? ''), montant: Number(r['Montant (€)'] ?? 0),
      description: String(r['Description'] ?? '')
    }));
  }

  // Gantt Markers
  const markerSheet = wb.Sheets['Rendez-vous'];
  if (markerSheet) {
    const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(markerSheet);
    data.ganttMarkers = rows.map((r: Record<string, unknown>) => ({
      id: String(r['ID'] ?? ''),
      chantierId: String(r['ID Chantier'] ?? ''),
      date: String(r['Date'] ?? ''),
      endDate: r['Date fin'] ? String(r['Date fin']) : undefined,
      type: String(r['Type'] ?? 'appointment') as any,
      label: String(r['Label'] ?? '')
    }));
  }

  return data;
}
