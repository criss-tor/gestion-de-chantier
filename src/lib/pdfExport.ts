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

  // Export PDF du bilan par chantier
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
    pdf.text('Résumé par catégories:', 20, 155);
    pdf.setFont('helvetica', 'normal');
    
    let categoryYPosition = 165;
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
        
        let categoryType = 'atelier';
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

      if (empTotalHours === 0) return;

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
        .slice(0, 5);

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

  // Export PDF du planning Gantt mensuel
  async exportGanttMonthly(
    chantiers: Chantier[],
    entries: TimeEntry[],
    employees: Employee[],
    categories: HourCategory[],
    month: string,
    markers?: { id: string; chantierId: string; date: string; endDate?: string; type: string; label: string }[]
  ): Promise<void> {
    const pdf = new jsPDF('landscape');
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();

    // En-tête
    pdf.setFontSize(20);
    pdf.setFont('helvetica', 'bold');
    pdf.text(`Planning Gantt - ${this.formatMonth(month)}`, pageWidth / 2, 20, { align: 'center' });

    // Filtrer les entrées du mois
    const monthEntries = entries.filter(e => e.date.startsWith(month));

    // Calculer les jours du mois
    const [year, monthNum] = month.split('-');
    const daysInMonth = new Date(parseInt(year), parseInt(monthNum), 0).getDate();

    // Dimensions
    const startX = 50;
    const startY = 40;
    const rowHeight = 12;
    const colWidth = (pageWidth - startX - 20) / daysInMonth;
    const chantierColWidth = 45;

    // En-têtes des jours
    pdf.setFontSize(7);
    pdf.setFont('helvetica', 'normal');

    for (let day = 1; day <= daysInMonth; day++) {
      const x = startX + chantierColWidth + (day - 1) * colWidth;
      const date = new Date(parseInt(year), parseInt(monthNum) - 1, day);
      const dayName = format(date, 'EEE', { locale: fr }).substring(0, 2);
      const isWeekend = date.getDay() === 0 || date.getDay() === 6;

      // Fond gris pour week-end
      if (isWeekend) {
        pdf.setFillColor(240, 240, 240);
        pdf.rect(x, startY - 5, colWidth, rowHeight * (chantiers.length + 1), 'F');
      }

      pdf.text(dayName, x + colWidth / 2, startY, { align: 'center' });
      pdf.text(day.toString(), x + colWidth / 2, startY + 4, { align: 'center' });
    }

    // Ligne de séparation sous les en-têtes
    pdf.line(startX, startY + 5, pageWidth - 20, startY + 5);

    // Afficher les marqueurs au-dessus du tableau
    if (markers && markers.length > 0) {
      const monthMarkers = markers.filter(m => {
        if (m.endDate) {
          return m.date.startsWith(month) || m.endDate.startsWith(month) || 
                 (m.date <= month + '-31' && m.endDate >= month + '-01');
        }
        return m.date.startsWith(month);
      });
      
      if (monthMarkers.length > 0) {
        let markerY = startY - 20;
        pdf.setFontSize(8);
        pdf.setFont('helvetica', 'bold');
        pdf.text('Rendez-vous & Plages:', startX, markerY);
        pdf.setFont('helvetica', 'normal');
        
        monthMarkers.slice(0, 5).forEach((marker, idx) => {
          const chantier = chantiers.find(c => c.id === marker.chantierId);
          const markerText = `${marker.label} (${chantier?.nom || '?'}) - ${format(new Date(marker.date), 'dd/MM', { locale: fr })}${marker.endDate ? ' au ' + format(new Date(marker.endDate), 'dd/MM', { locale: fr }) : ''}`;
          pdf.setFontSize(7);
          pdf.text(markerText, startX + 5, markerY + 5 + (idx * 4));
        });
        
        if (monthMarkers.length > 5) {
          pdf.text(`... et ${monthMarkers.length - 5} autres`, startX + 5, markerY + 5 + (5 * 4));
        }
      }
    }

    // Lignes des chantiers
    let yPosition = startY + 12;

    chantiers.forEach((chantier) => {
      // Nom du chantier (tronqué si trop long)
      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'bold');
      const chantierName = chantier.nom.length > 20 ? chantier.nom.substring(0, 20) + '...' : chantier.nom;
      pdf.text(chantierName, startX + 2, yPosition + 4);

      // Heures du chantier pour ce mois
      const chantierEntries = monthEntries.filter(e => e.chantierId === chantier.id);
      const totalHours = chantierEntries.reduce((sum, e) => sum + e.heures, 0);

      // Afficher les heures à droite du nom
      pdf.setFontSize(7);
      pdf.setFont('helvetica', 'normal');
      pdf.text(`${totalHours.toFixed(1)}h`, startX + chantierColWidth - 2, yPosition + 4, { align: 'right' });

      // Cases pour chaque jour
      pdf.setFontSize(6);

      for (let day = 1; day <= daysInMonth; day++) {
        const x = startX + chantierColWidth + (day - 1) * colWidth;
        const dateStr = `${month}-${day.toString().padStart(2, '0')}`;
        const dayEntries = chantierEntries.filter(e => e.date === dateStr);
        
        // Vérifier s'il y a un marqueur pour ce jour et ce chantier
        const dayMarkers = markers?.filter(m => {
          if (m.chantierId !== chantier.id) return false;
          if (m.endDate) {
            return dateStr >= m.date && dateStr <= m.endDate;
          }
          return m.date === dateStr;
        }) || [];

        if (dayEntries.length > 0 || dayMarkers.length > 0) {
          const dayHours = dayEntries.reduce((sum, e) => sum + e.heures, 0);

          // Calculer le nombre d'employés différents ce jour
          const uniqueEmployees = new Set(dayEntries.map(e => e.employeeId)).size;

          // Couleur selon le nombre d'employés (ou rouge si marqueur)
          if (dayMarkers.length > 0) {
            pdf.setFillColor(239, 68, 68); // Rouge pour marqueur
          } else if (uniqueEmployees >= 3) {
            pdf.setFillColor(34, 197, 94); // Vert foncé
          } else if (uniqueEmployees === 2) {
            pdf.setFillColor(132, 204, 22); // Vert clair
          } else {
            pdf.setFillColor(253, 186, 116); // Orange
          }

          pdf.rect(x + 1, yPosition, colWidth - 2, rowHeight - 2, 'F');

          // Afficher les heures si assez de place
          if (colWidth > 8 && dayHours >= 1) {
            pdf.setTextColor(255, 255, 255);
            pdf.text(dayHours.toFixed(1), x + colWidth / 2, yPosition + 5, { align: 'center' });
            pdf.setTextColor(0, 0, 0);
          }
          
          // Petite indication si marqueur
          if (dayMarkers.length > 0 && colWidth > 12) {
            pdf.setTextColor(255, 255, 255);
            pdf.setFontSize(5);
            pdf.text('●', x + colWidth - 3, yPosition + 3);
            pdf.setFontSize(6);
            pdf.setTextColor(0, 0, 0);
          }
        }

        // Bordure de la case
        pdf.rect(x, yPosition - 2, colWidth, rowHeight);
      }

      yPosition += rowHeight;

      // Nouvelle page si nécessaire
      if (yPosition > pageHeight - 30) {
        pdf.addPage('landscape');
        yPosition = 30;

        // Réimprimer les en-têtes des jours sur la nouvelle page
        pdf.setFontSize(7);
        for (let day = 1; day <= daysInMonth; day++) {
          const x = startX + chantierColWidth + (day - 1) * colWidth;
          const date = new Date(parseInt(year), parseInt(monthNum) - 1, day);
          const dayName = format(date, 'EEE', { locale: fr }).substring(0, 2);
          pdf.text(dayName, x + colWidth / 2, yPosition - 10, { align: 'center' });
          pdf.text(day.toString(), x + colWidth / 2, yPosition - 6, { align: 'center' });
        }
        pdf.line(startX, yPosition - 2, pageWidth - 20, yPosition - 2);
        yPosition += 5;
      }
    });

    // Légende
    const legendY = pageHeight - 20;
    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Légende:', 20, legendY);

    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'normal');

    // Cases légende
    pdf.setFillColor(34, 197, 94);
    pdf.rect(50, legendY - 4, 8, 6, 'F');
    pdf.text('3+ pers.', 62, legendY);

    pdf.setFillColor(132, 204, 22);
    pdf.rect(90, legendY - 4, 8, 6, 'F');
    pdf.text('2 pers.', 102, legendY);

    pdf.setFillColor(253, 186, 116);
    pdf.rect(125, legendY - 4, 8, 6, 'F');
    pdf.text('1 pers.', 137, legendY);

    pdf.setFillColor(239, 68, 68);
    pdf.rect(160, legendY - 4, 8, 6, 'F');
    pdf.text('Rdv/Plage', 172, legendY);

    // Total général
    const totalHours = monthEntries.reduce((sum, e) => sum + e.heures, 0);
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'bold');
    pdf.text(`Total mois: ${totalHours.toFixed(1)} h`, pageWidth - 60, legendY);

    // Pied de page
    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'italic');
    pdf.text(`Généré le ${format(new Date(), 'dd/MM/yyyy HH:mm', { locale: fr })}`, pageWidth / 2, pageHeight - 10, { align: 'center' });

    // Télécharger
    const fileName = `planning_gantt_${month}.pdf`;
    pdf.save(fileName);
  }
}

export const pdfExportService = PDFExportService.getInstance();
