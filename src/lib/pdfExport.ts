import jsPDF from 'jspdf';
import { Employee, TimeEntry, Chantier, HourCategory } from '@/types/employee';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export class PDFExportService {
  private static instance: PDFExportService;

  static getInstance(): PDFExportService {
    if (!PDFExportService.instance) {
      PDFExportService.instance = new PDFExportService();
    }
    return PDFExportService.instance;
  }

  // Export PDF des heures mensuelles par employé
  async exportEmployeeMonthlyReport(
    employee: Employee,
    entries: TimeEntry[],
    chantiers: Chantier[],
    categories: HourCategory[],
    month: string
  ): Promise<void> {
    const pdf = new jsPDF();
    const pageWidth = pdf.internal.pageSize.getWidth();
    
    // En-tête
    pdf.setFontSize(20);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Rapport Mensuel des Heures', pageWidth / 2, 30, { align: 'center' });
    
    // Informations employé
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'normal');
    pdf.text(`Employé: ${employee.prenom} ${employee.nom}`, 20, 50);
    pdf.text(`Mois: ${this.formatMonth(month)}`, 20, 60);
    pdf.text(`Coût horaire: ${employee.coutHoraire.toFixed(2)} CHF`, 20, 70);
    
    // Filtrer les entrées du mois
    const monthEntries = entries.filter(e => e.date.startsWith(month));
    const totalHours = monthEntries.reduce((sum, e) => sum + e.heures, 0);
    const totalCost = totalHours * employee.coutHoraire;
    
    // Tableau des entrées
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Détail des heures:', 20, 90);
    
    let yPosition = 100;
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    
    // En-têtes du tableau
    pdf.text('Date', 20, yPosition);
    pdf.text('Chantier', 50, yPosition);
    pdf.text('Heures', 120, yPosition);
    pdf.text('Catégorie', 140, yPosition);
    pdf.text('Coût', 180, yPosition);
    
    yPosition += 10;
    
    // Ligne de séparation
    pdf.line(20, yPosition, 200, yPosition);
    yPosition += 5;
    
    // Données du tableau
    monthEntries.forEach((entry) => {
      const chantier = chantiers.find(c => c.id === entry.chantierId);
      const category = categories.find(c => c.id === entry.hourCategoryId);
      const cost = entry.heures * employee.coutHoraire;
      
      if (yPosition > 250) {
        pdf.addPage();
        yPosition = 30;
      }
      
      pdf.text(entry.date, 20, yPosition);
      pdf.text(chantier?.nom || 'Bureau', 50, yPosition);
      pdf.text(entry.heures.toFixed(2), 120, yPosition);
      pdf.text(category?.nom || '-', 140, yPosition);
      pdf.text(`${cost.toFixed(2)} CHF`, 180, yPosition);
      yPosition += 5;
      
      // Description si présente
      if (entry.description) {
        pdf.setFontSize(9);
        pdf.setFont('helvetica', 'italic');
        pdf.text(`  ${entry.description}`, 50, yPosition);
        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'normal');
      }
      yPosition += 8;
    });
    
    // Total
    yPosition += 10;
    pdf.line(20, yPosition, 200, yPosition);
    yPosition += 5;
    
    pdf.setFont('helvetica', 'bold');
    pdf.text('Total:', 120, yPosition);
    pdf.text(`${totalHours.toFixed(2)} h`, 140, yPosition);
    pdf.text(`${totalCost.toFixed(2)} CHF`, 180, yPosition);
    
    // Pied de page
    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'italic');
    pdf.text(`Généré le ${format(new Date(), 'dd/MM/yyyy HH:mm', { locale: fr })}`, pageWidth / 2, 280, { align: 'center' });
    
    // Télécharger le PDF
    const fileName = `rapport_${employee.nom}_${employee.prenom}_${month}.pdf`;
    pdf.save(fileName);
  }

  // Export PDF du bilan par chantier (un seul chantier sélectionné)
  async exportChantierReport(
    chantier: Chantier,
    entries: TimeEntry[],
    employees: Employee[],
    categories: HourCategory[],
    month: string
  ): Promise<void> {
    const pdf = new jsPDF();
    const pageWidth = pdf.internal.pageSize.getWidth();
    
    // En-tête
    pdf.setFontSize(20);
    pdf.setFont('helvetica', 'bold');
    pdf.text(`Bilan Chantier: ${chantier.nom}`, pageWidth / 2, 30, { align: 'center' });
    
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'normal');
    pdf.text(`Mois: ${this.formatMonth(month)}`, 20, 50);
    
    // Statistiques du chantier
    const chantierEntries = entries.filter(e => e.chantierId === chantier.id && e.date.startsWith(month));
    const totalHours = chantierEntries.reduce((sum, e) => sum + e.heures, 0);
    
    // Calculer le coût total
    let totalCost = 0;
    chantierEntries.forEach(entry => {
      const employee = employees.find(emp => emp.id === entry.employeeId);
      totalCost += entry.heures * (employee?.coutHoraire || 0);
    });
    
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Résumé:', 20, 70);
    pdf.setFont('helvetica', 'normal');
    pdf.text(`Heures totales: ${totalHours.toFixed(2)} h`, 20, 80);
    pdf.text(`Coût total: ${totalCost.toFixed(2)} CHF`, 20, 88);
    pdf.text(`Nombre d'entrées: ${chantierEntries.length}`, 20, 96);
    
    // Détails des entrées avec descriptions
    let yPosition = 115;
    pdf.setFont('helvetica', 'bold');
    pdf.text('Détail des heures et commentaires:', 20, yPosition);
    yPosition += 10;
    
    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'normal');
    
    if (chantierEntries.length === 0) {
      pdf.text('Aucune entrée pour ce mois', 20, yPosition);
    } else {
      // Grouper par date
      const entriesByDate = chantierEntries.reduce((acc, entry) => {
        if (!acc[entry.date]) acc[entry.date] = [];
        acc[entry.date].push(entry);
        return acc;
      }, {} as Record<string, TimeEntry[]>);
      
      const sortedDates = Object.keys(entriesByDate).sort();
      
      sortedDates.forEach((date) => {
        if (yPosition > 250) {
          pdf.addPage();
          yPosition = 30;
        }
        
        pdf.setFont('helvetica', 'bold');
        pdf.text(format(new Date(date), 'dd/MM/yyyy', { locale: fr }), 20, yPosition);
        pdf.setFont('helvetica', 'normal');
        yPosition += 6;
        
        entriesByDate[date].forEach((entry) => {
          const employee = employees.find(emp => emp.id === entry.employeeId);
          const category = categories.find(c => c.id === entry.hourCategoryId);
          
          if (yPosition > 270) {
            pdf.addPage();
            yPosition = 30;
          }
          
          const empName = employee ? `${employee.prenom} ${employee.nom}` : 'Inconnu';
          const catStr = category ? ` [${category.nom}]` : '';
          
          pdf.text(`  ${empName}${catStr}: ${entry.heures.toFixed(2)}h`, 20, yPosition);
          yPosition += 4;
          
          if (entry.description) {
            pdf.setFontSize(8);
            pdf.text(`    Note: ${entry.description}`, 20, yPosition);
            pdf.setFontSize(9);
            yPosition += 4;
          }
        });
        
        yPosition += 3;
      });
    }
    
    // Pied de page
    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'italic');
    pdf.text(`Généré le ${format(new Date(), 'dd/MM/yyyy HH:mm', { locale: fr })}`, pageWidth / 2, 280, { align: 'center' });
    
    // Télécharger le PDF
    const fileName = `bilan_${chantier.nom}_${month}.pdf`.replace(/\s+/g, '_');
    pdf.save(fileName);
  }

  // Export PDF du résumé global
  async exportGlobalSummary(
    employees: Employee[],
    entries: TimeEntry[],
    chantiers: Chantier[],
    month: string
  ): Promise<void> {
    const pdf = new jsPDF();
    const pageWidth = pdf.internal.pageSize.getWidth();
    
    // En-tête
    pdf.setFontSize(20);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Résumé Global Mensuel', pageWidth / 2, 30, { align: 'center' });
    
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'normal');
    pdf.text(`Mois: ${this.formatMonth(month)}`, 20, 50);
    
    // Statistiques par employé
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Résumé par employé:', 20, 70);
    
    let yPosition = 80;
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    
    // En-têtes du tableau
    pdf.text('Employé', 20, yPosition);
    pdf.text('Heures', 100, yPosition);
    pdf.text('Coût', 140, yPosition);
    pdf.text('Jours', 170, yPosition);
    
    yPosition += 10;
    pdf.line(20, yPosition, 200, yPosition);
    yPosition += 5;
    
    // Données du tableau
    employees.forEach((employee) => {
      const employeeEntries = entries.filter(e => e.employeeId === employee.id);
      const totalHours = employeeEntries.reduce((sum, e) => sum + e.heures, 0);
      const totalCost = totalHours * employee.coutHoraire;
      const uniqueDays = new Set(employeeEntries.map(e => e.date)).size;
      
      if (yPosition > 250) {
        pdf.addPage();
        yPosition = 30;
      }
      
      pdf.text(`${employee.prenom} ${employee.nom}`, 20, yPosition);
      pdf.text(`${totalHours.toFixed(2)} h`, 100, yPosition);
      pdf.text(`${totalCost.toFixed(2)} CHF`, 140, yPosition);
      pdf.text(uniqueDays.toString(), 170, yPosition);
      
      yPosition += 8;
    });
    
    // Total général
    const totalHours = entries.reduce((sum, e) => sum + e.heures, 0);
    const totalCost = entries.reduce((sum, e) => {
      const employee = employees.find(emp => emp.id === e.employeeId);
      return sum + (e.heures * (employee?.coutHoraire || 0));
    }, 0);
    
    yPosition += 10;
    pdf.line(20, yPosition, 200, yPosition);
    yPosition += 5;
    
    pdf.setFont('helvetica', 'bold');
    pdf.text('Total général:', 20, yPosition);
    pdf.text(`${totalHours.toFixed(2)} h`, 100, yPosition);
    pdf.text(`${totalCost.toFixed(2)} CHF`, 140, yPosition);
    
    // Pied de page
    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'italic');
    pdf.text(`Généré le ${format(new Date(), 'dd/MM/yyyy HH:mm', { locale: fr })}`, pageWidth / 2, 280, { align: 'center' });
    
    // Télécharger le PDF
    const fileName = `resume_global_${month}.pdf`;
    pdf.save(fileName);
  }

  private formatMonth(month: string): string {
    const [year, monthNum] = month.split('-');
    const date = new Date(parseInt(year), parseInt(monthNum) - 1);
    return format(date, 'MMMM yyyy', { locale: fr });
  }
}

export const pdfExportService = PDFExportService.getInstance();
