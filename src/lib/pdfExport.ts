import jsPDF from 'jspdf';
import { Employee, TimeEntry, Chantier, HourCategory, MaterialCost } from '@/types/employee';
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
    
    // Filtrer les entrées du mois pour CET employé uniquement
    const monthEntries = entries.filter(e => e.date.startsWith(month) && e.employeeId === employee.id);
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
    pdf.text('Catégorie', 150, yPosition);
    
    yPosition += 10;
    
    // Ligne de séparation
    pdf.line(20, yPosition, 200, yPosition);
    yPosition += 5;
    
    // Données du tableau
    monthEntries.forEach((entry) => {
      const chantier = chantiers.find(c => c.id === entry.chantierId);
      const category = categories.find(c => c.id === entry.hourCategoryId);
      
      if (yPosition > 250) {
        pdf.addPage();
        yPosition = 30;
      }
      
      pdf.text(entry.date, 20, yPosition);
      pdf.text(chantier?.nom || 'Bureau', 50, yPosition);
      pdf.text(entry.heures.toFixed(2), 120, yPosition);
      pdf.text(category?.nom || '-', 150, yPosition);
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
    pdf.text(`${totalHours.toFixed(2)} h`, 150, yPosition);
    
    // Résumé par chantier
    yPosition += 15;
    pdf.setFontSize(12);
    pdf.text('Résumé par chantier:', 20, yPosition);
    yPosition += 10;
    
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    
    // Calculer les heures par chantier
    const chantierHours = new Map<string, { nom: string; heures: number }>();
    let autresHours = 0;
    
    monthEntries.forEach((entry) => {
      if (entry.chantierId) {
        const chantier = chantiers.find(c => c.id === entry.chantierId);
        if (chantier) {
          const existing = chantierHours.get(chantier.id) || { nom: chantier.nom, heures: 0 };
          existing.heures += entry.heures;
          chantierHours.set(chantier.id, existing);
        }
      } else {
        autresHours += entry.heures;
      }
    });
    
    // Afficher les heures par chantier
    chantierHours.forEach((data) => {
      if (yPosition > 260) {
        pdf.addPage();
        yPosition = 30;
      }
      pdf.text(`- ${data.nom}:`, 25, yPosition);
      pdf.text(`${data.heures.toFixed(2)} h`, 100, yPosition);
      yPosition += 6;
    });
    
    // Afficher les heures divers/bureau
    if (autresHours > 0) {
      if (yPosition > 260) {
        pdf.addPage();
        yPosition = 30;
      }
      pdf.setFont('helvetica', 'bold');
      pdf.text('- Divers/Bureau:', 25, yPosition);
      pdf.text(`${autresHours.toFixed(2)} h`, 100, yPosition);
      pdf.setFont('helvetica', 'normal');
      yPosition += 6;
    }
    
    // Pied de page
    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'italic');
    pdf.text(`Généré le ${format(new Date(), 'dd/MM/yyyy HH:mm', { locale: fr })}`, pageWidth / 2, 280, { align: 'center' });
    
    // Télécharger le PDF
    const fileName = `rapport_${employee.nom}_${employee.prenom}_${month}.pdf`;
    pdf.save(fileName);
  }

  // Export PDF du bilan par chantier (tout le chantier, pas seulement un mois)
  async exportChantierReport(
    chantier: Chantier,
    entries: TimeEntry[],
    employees: Employee[],
    categories: HourCategory[],
    materialCosts: MaterialCost[]
  ): Promise<void> {
    const pdf = new jsPDF();
    const pageWidth = pdf.internal.pageSize.getWidth();
    
    // En-tête
    pdf.setFontSize(20);
    pdf.setFont('helvetica', 'bold');
    pdf.text(`Bilan Complet Chantier: ${chantier.nom}`, pageWidth / 2, 30, { align: 'center' });
    
    // Informations du chantier
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'normal');
    pdf.text(`ID: ${chantier.id}`, 20, 50);
    if (chantier.description) {
      pdf.text(`Description: ${chantier.description}`, 20, 60);
      pdf.text(`Devis: ${chantier.devis ? chantier.devis.toFixed(2) + ' CHF' : 'Non défini'}`, 20, 70);
      pdf.text(`Heures prévues: ${chantier.heuresPrevues ? chantier.heuresPrevues.toFixed(2) + ' h' : 'Non défini'}`, 20, 80);
    } else {
      pdf.text(`Devis: ${chantier.devis ? chantier.devis.toFixed(2) + ' CHF' : 'Non défini'}`, 20, 60);
      pdf.text(`Heures prévues: ${chantier.heuresPrevues ? chantier.heuresPrevues.toFixed(2) + ' h' : 'Non défini'}`, 20, 70);
    }
    
    // Statistiques du chantier (toutes les entrées)
    const chantierEntries = entries.filter(e => e.chantierId === chantier.id);
    const totalHours = chantierEntries.reduce((sum, e) => sum + e.heures, 0);
    const chantierMaterials = materialCosts.filter(cost => cost.chantierId === chantier.id);
    const totalMaterialCost = chantierMaterials.reduce((sum, cost) => sum + cost.montant, 0);
    
    // Calculer le coût main d'œuvre total
    let totalMainCost = 0;
    chantierEntries.forEach(entry => {
      const employee = employees.find(emp => emp.id === entry.employeeId);
      totalMainCost += entry.heures * (employee?.coutHoraire || 0);
    });
    const totalCost = totalMainCost + totalMaterialCost;
    
    // Résumé par catégories
    const hoursByCategory = new Map<string, { hours: number; cost: number; name: string }>();
    
    chantierEntries.forEach(entry => {
      const employee = employees.find(emp => emp.id === entry.employeeId);
      const category = categories.find(c => c.id === entry.hourCategoryId);
      const categoryName = category ? category.nom : 'Non défini';
      const entryCost = entry.heures * (employee?.coutHoraire || 0);
      
      const existing = hoursByCategory.get(categoryName) || { hours: 0, cost: 0, name: categoryName };
      existing.hours += entry.heures;
      existing.cost += entryCost;
      hoursByCategory.set(categoryName, existing);
    });
    
    // Afficher le résumé général
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Résumé général:', 20, 100);
    pdf.setFont('helvetica', 'normal');
    pdf.text(`Heures totales: ${totalHours.toFixed(2)} h`, 20, 110);
    pdf.text(`Coût main d'œuvre: ${totalMainCost.toFixed(2)} CHF`, 20, 118);
    pdf.text(`Coût matériel: ${totalMaterialCost.toFixed(2)} CHF`, 20, 126);
    pdf.text(`Coût total: ${totalCost.toFixed(2)} CHF`, 20, 134);
    pdf.text(`Nombre d'entrées: ${chantierEntries.length}`, 20, 142);
    
    // Afficher le résumé par catégories
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Résumé par catégories:', 20, 140);
    pdf.setFont('helvetica', 'normal');
    
    let categoryYPosition = 150;
    pdf.setFontSize(10);
    
    if (hoursByCategory.size === 0) {
      pdf.text('Aucune entrée trouvée', 20, categoryYPosition);
    } else {
      // En-tête du tableau
      pdf.setFont('helvetica', 'bold');
      pdf.text('Catégorie', 20, categoryYPosition);
      pdf.text('Heures', 80, categoryYPosition);
      pdf.text('Coût', 120, categoryYPosition);
      pdf.text('%', 160, categoryYPosition);
      categoryYPosition += 6;
      
      // Données du tableau
      pdf.setFont('helvetica', 'normal');
      const sortedCategories = Array.from(hoursByCategory.entries()).sort((a, b) => b[1].hours - a[1].hours);
      
      sortedCategories.forEach(([categoryName, data]) => {
        if (categoryYPosition > 250) {
          pdf.addPage();
          categoryYPosition = 30;
        }
        
        const percentage = totalHours > 0 ? (data.hours / totalHours * 100).toFixed(1) : '0';
        pdf.text(categoryName, 20, categoryYPosition);
        pdf.text(`${data.hours.toFixed(2)} h`, 80, categoryYPosition);
        pdf.text(`${data.cost.toFixed(2)} CHF`, 120, categoryYPosition);
        pdf.text(`${percentage}%`, 160, categoryYPosition);
        categoryYPosition += 6;
      });
    }
    
    // Détails des entrées avec descriptions
    let detailsYPosition = categoryYPosition > 200 ? categoryYPosition + 20 : categoryYPosition + 10;
    pdf.setFont('helvetica', 'bold');
    pdf.text('Détail des heures et commentaires:', 20, detailsYPosition);
    detailsYPosition += 10;
    
    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'normal');
    
    if (chantierEntries.length === 0) {
      pdf.text('Aucune entrée pour ce chantier', 20, detailsYPosition);
    } else {
      if (chantierMaterials.length > 0) {
        detailsYPosition += 8;
        pdf.setFont('helvetica', 'bold');
        pdf.text('Coûts matériels:', 20, detailsYPosition);
        detailsYPosition += 8;
        pdf.setFont('helvetica', 'normal');
        chantierMaterials.forEach((cost) => {
          if (detailsYPosition > 250) {
            pdf.addPage();
            detailsYPosition = 30;
          }
          pdf.text(`- ${cost.date} ${cost.description || ''}: ${cost.montant.toFixed(2)} CHF`, 25, detailsYPosition);
          detailsYPosition += 6;
        });
      }
      // Grouper par date, puis par catégorie
      const entriesByDate = chantierEntries.reduce((acc, entry) => {
        if (!acc[entry.date]) acc[entry.date] = {};
        const catId = entry.hourCategoryId || 'none';
        if (!acc[entry.date][catId]) acc[entry.date][catId] = [];
        acc[entry.date][catId].push(entry);
        return acc;
      }, {} as Record<string, Record<string, TimeEntry[]>>);
      
      const sortedDates = Object.keys(entriesByDate).sort();
      
      sortedDates.forEach((date) => {
        if (detailsYPosition > 250) {
          pdf.addPage();
          detailsYPosition = 30;
        }
        
        // Date en gras
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(10);
        pdf.text(format(new Date(date), 'dd/MM/yyyy', { locale: fr }), 20, detailsYPosition);
        pdf.setFont('helvetica', 'normal');
        detailsYPosition += 8;
        
        // Grouper par catégorie pour cette date
        const entriesByCategory = entriesByDate[date];
        
        Object.entries(entriesByCategory).forEach(([catId, entries]) => {
          if (detailsYPosition > 270) {
            pdf.addPage();
            detailsYPosition = 30;
          }
          
          // Nom de catégorie en italique
          const category = categories.find(c => c.id === catId);
          const catName = category ? category.nom : 'Non défini';
          pdf.setFont('helvetica', 'italic');
          pdf.setFontSize(9);
          pdf.text(`  ${catName}:`, 25, detailsYPosition);
          pdf.setFont('helvetica', 'normal');
          detailsYPosition += 5;
          
          // Entrées de cette catégorie
          entries.forEach((entry) => {
            if (detailsYPosition > 275) {
              pdf.addPage();
              detailsYPosition = 30;
            }
            
            const employee = employees.find(emp => emp.id === entry.employeeId);
            const empName = employee ? `${employee.prenom} ${employee.nom}` : 'Inconnu';
            
            pdf.setFontSize(9);
            pdf.text(`    • ${empName}: ${entry.heures.toFixed(2)}h`, 30, detailsYPosition);
            detailsYPosition += 4;
            
            if (entry.description) {
              pdf.setFontSize(8);
              pdf.text(`      "${entry.description}"`, 30, detailsYPosition);
              pdf.setFontSize(9);
              detailsYPosition += 4;
            }
          });
          
          detailsYPosition += 2;
        });
        
        detailsYPosition += 5;
      });
    }
    
    // Pied de page
    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'italic');
    pdf.text(`Généré le ${format(new Date(), 'dd/MM/yyyy HH:mm', { locale: fr })}`, pageWidth / 2, 280, { align: 'center' });
    
    // Télécharger le PDF
    const fileName = `bilan_complet_${chantier.nom}.pdf`.replace(/\s+/g, '_');
    pdf.save(fileName);
  }

  // Export PDF du résumé global
  async exportGlobalSummary(
    employees: Employee[],
    entries: TimeEntry[],
    chantiers: Chantier[],
    month: string,
    getHourCategoryById?: (id: string) => HourCategory | undefined
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

    let yPosition = 70;

    // === STATISTIQUES GÉNÉRALES ===
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    pdf.text('📊 Statistiques générales:', 20, yPosition);
    yPosition += 15;

    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');

    // Calculs des statistiques
    const monthEntries = entries.filter(e => e.date.startsWith(month));
    const totalHours = monthEntries.reduce((sum, e) => sum + e.heures, 0);
    const chantierEntries = monthEntries.filter(e => e.chantierId);
    const bureauEntries = monthEntries.filter(e => !e.chantierId);
    const chantierHours = chantierEntries.reduce((sum, e) => sum + e.heures, 0);
    const bureauHours = bureauEntries.reduce((sum, e) => sum + e.heures, 0);
    const uniqueDays = new Set(monthEntries.map(e => e.date)).size;
    const activeEmployees = new Set(monthEntries.map(e => e.employeeId)).size;

    // Affichage des stats générales
    pdf.text(`Nombre total d'heures: ${totalHours.toFixed(1)} h`, 25, yPosition);
    yPosition += 8;
    pdf.text(`Heures chantier: ${chantierHours.toFixed(1)} h (${totalHours > 0 ? ((chantierHours / totalHours) * 100).toFixed(0) : 0}%)`, 25, yPosition);
    yPosition += 8;
    pdf.text(`Heures bureau: ${bureauHours.toFixed(1)} h (${totalHours > 0 ? ((bureauHours / totalHours) * 100).toFixed(0) : 0}%)`, 25, yPosition);
    yPosition += 8;
    pdf.text(`Jours avec activité: ${uniqueDays}`, 25, yPosition);
    yPosition += 8;
    pdf.text(`Employés actifs: ${activeEmployees}`, 25, yPosition);
    yPosition += 8;
    pdf.text(`Moyenne heures/jour: ${(totalHours / Math.max(uniqueDays, 1)).toFixed(1)} h`, 25, yPosition);

    yPosition += 15;

    // === RÉPARTITION PAR EMPLOYÉ ===
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    pdf.text('👥 Répartition par employé:', 20, yPosition);
    yPosition += 10;

    pdf.setFontSize(7);
    pdf.setFont('helvetica', 'normal');

    // En-têtes du tableau
    pdf.text('Employé', 20, yPosition);
    pdf.text('Atelier', 55, yPosition);
    pdf.text('Pose', 75, yPosition);
    pdf.text('Dessin', 90, yPosition);
    pdf.text('Bureau', 110, yPosition);
    pdf.text('Total', 130, yPosition);
    pdf.text('Jours', 150, yPosition);

    yPosition += 8;
    pdf.line(20, yPosition, 180, yPosition);
    yPosition += 5;

    // Données du tableau
    employees.forEach((employee) => {
      const employeeEntries = monthEntries.filter(e => e.employeeId === employee.id);
      
      // Séparer les heures par catégorie
      let atelierHours = 0;
      let poseHours = 0;
      let dessinHours = 0;
      let bureauHours = 0;
      
      employeeEntries.forEach(entry => {
        const category = entry.hourCategoryId && getHourCategoryById ? getHourCategoryById(entry.hourCategoryId) : null;
        
        let categoryType = 'atelier'; // default
        if (category) {
          const categoryName = category.nom.toLowerCase();
          if (category.isBureau) {
            categoryType = 'bureau';
          } else if (categoryName.includes('pose')) {
            categoryType = 'pose';
          } else if (categoryName.includes('dessin')) {
            categoryType = 'dessin';
          } else if (categoryName.includes('atelier')) {
            categoryType = 'atelier';
          }
        }
        
        if (categoryType === 'atelier') atelierHours += entry.heures;
        else if (categoryType === 'pose') poseHours += entry.heures;
        else if (categoryType === 'dessin') dessinHours += entry.heures;
        else if (categoryType === 'bureau') bureauHours += entry.heures;
      });
      
      const empTotalHours = atelierHours + poseHours + dessinHours + bureauHours;
      const empUniqueDays = new Set(employeeEntries.map(e => e.date)).size;

      if (empTotalHours === 0) return; // Ne pas afficher les employés sans heures

      if (yPosition > 250) {
        pdf.addPage();
        yPosition = 30;
      }

      pdf.text(`${employee.prenom} ${employee.nom}`, 20, yPosition);
      pdf.text(`${atelierHours.toFixed(1)}h`, 55, yPosition);
      pdf.text(`${poseHours.toFixed(1)}h`, 75, yPosition);
      pdf.text(`${dessinHours.toFixed(1)}h`, 90, yPosition);
      pdf.text(`${bureauHours.toFixed(1)}h`, 110, yPosition);
      pdf.text(`${empTotalHours.toFixed(1)}h`, 130, yPosition);
      pdf.text(empUniqueDays.toString(), 150, yPosition);

      yPosition += 7;
    });

    yPosition += 10;

    // === TOP CHANTIERS ===
    if (chantiers.length > 0 && chantierEntries.length > 0) {
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'bold');
      pdf.text('🏗️ Top chantiers du mois:', 20, yPosition);
      yPosition += 10;

      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'normal');

      // Calculer les heures par chantier
      const chantierStats = chantiers.map(chantier => {
        const chantierEntries = monthEntries.filter(e => e.chantierId === chantier.id);
        const totalHours = chantierEntries.reduce((sum, e) => sum + e.heures, 0);
        return { nom: chantier.nom, heures: totalHours };
      }).filter(stat => stat.heures > 0)
        .sort((a, b) => b.heures - a.heures)
        .slice(0, 5); // Top 5

      chantierStats.forEach((stat, index) => {
        if (yPosition > 250) {
          pdf.addPage();
          yPosition = 30;
        }

        pdf.text(`${index + 1}. ${stat.nom}: ${stat.heures.toFixed(1)} h`, 25, yPosition);
        yPosition += 7;
      });
    }

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
