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

  // Export PDF du bilan par chantier
  async exportChantierReport(
    chantiers: Chantier[],
    entries: TimeEntry[],
    employees: Employee[],
    month: string
  ): Promise<void> {
    const pdf = new jsPDF();
    const pageWidth = pdf.internal.pageSize.getWidth();
    
    // En-tête
    pdf.setFontSize(20);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Bilan Mensuel des Chantiers', pageWidth / 2, 30, { align: 'center' });
    
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'normal');
    pdf.text(`Mois: ${this.formatMonth(month)}`, 20, 50);
    
    // Calculer les statistiques par chantier
    const chantierStats = chantiers.map(chantier => {
      const chantierEntries = entries.filter(e => e.chantierId === chantier.id);
      const totalHours = chantierEntries.reduce((sum, e) => sum + e.heures, 0);
      
      // Calculer le coût total
      let totalCost = 0;
      chantierEntries.forEach(entry => {
        const employee = employees.find(emp => emp.id === entry.employeeId);
        totalCost += entry.heures * (employee?.coutHoraire || 0);
      });
      
      return {
        chantier,
        totalHours,
        totalCost,
        entryCount: chantierEntries.length
      };
    }).sort((a, b) => b.totalCost - a.totalCost);
    
    // Tableau des chantiers
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Répartition par chantier:', 20, 70);
    
    let yPosition = 80;
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    
    // En-têtes du tableau
    pdf.text('Chantier', 20, yPosition);
    pdf.text('Heures', 100, yPosition);
    pdf.text('Entrées', 130, yPosition);
    pdf.text('Coût', 160, yPosition);
    
    yPosition += 10;
    pdf.line(20, yPosition, 200, yPosition);
    yPosition += 5;
    
    // Données du tableau
    chantierStats.forEach((stat) => {
      if (yPosition > 250) {
        pdf.addPage();
        yPosition = 30;
      }
      
      pdf.text(stat.chantier.nom, 20, yPosition);
      pdf.text(`${stat.totalHours.toFixed(2)} h`, 100, yPosition);
      pdf.text(stat.entryCount.toString(), 130, yPosition);
      pdf.text(`${stat.totalCost.toFixed(2)} CHF`, 160, yPosition);
      
      yPosition += 8;
    });
    
    // Total général
    const totalHours = chantierStats.reduce((sum, s) => sum + s.totalHours, 0);
    const totalCost = chantierStats.reduce((sum, s) => sum + s.totalCost, 0);
    
    yPosition += 10;
    pdf.line(20, yPosition, 200, yPosition);
    yPosition += 5;
    
    pdf.setFont('helvetica', 'bold');
    pdf.text('Total général:', 20, yPosition);
    pdf.text(`${totalHours.toFixed(2)} h`, 100, yPosition);
    pdf.text(`${totalCost.toFixed(2)} CHF`, 160, yPosition);
    
    // Pied de page
    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'italic');
    pdf.text(`Généré le ${format(new Date(), 'dd/MM/yyyy HH:mm', { locale: fr })}`, pageWidth / 2, 280, { align: 'center' });
    
    // Télécharger le PDF
    const fileName = `bilan_chantiers_${month}.pdf`;
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
