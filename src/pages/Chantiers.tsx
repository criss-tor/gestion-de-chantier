import { useState } from 'react';
import { useEmployeeContext } from '@/contexts/EmployeeContext';
import { formatHoursDecimalWithH } from '@/lib/utils';
import { AddChantierDialog } from '@/components/AddChantierDialog';
import { AddMaterialCostDialog } from '@/components/AddMaterialCostDialog';
import { PDFExportDialog } from '@/components/PDFExportDialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { ChantierDetailDialog } from '@/components/ChantierDetailDialog';
import { Plus, Trash2, Package, Clock, Hammer, TrendingUp, HardHat } from 'lucide-react';

export default function Chantiers() {
  const {
    chantiers,
    chantierStats,
    materialCosts,
    timeEntries,
    employees,
    hourCategories,
    addChantier,
    deleteChantier,
    addMaterialCost,
  } = useEmployeeContext();

  const [showAddChantier, setShowAddChantier] = useState(false);
  const [showAddMaterial, setShowAddMaterial] = useState(false);
  const [deletingChantier, setDeletingChantier] = useState<string | null>(null);
  const [selectedChantier, setSelectedChantier] = useState<string | null>(null);
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-CH', {
      style: 'currency',
      currency: 'CHF',
    }).format(amount);
  };

  const totalHeures = chantierStats.reduce((sum, s) => sum + s.heures, 0);

  const handleDeleteChantier = () => {
    if (deletingChantier) {
      if (!confirmDelete) {
        // Première confirmation
        setConfirmDelete(true);
      } else {
        // Seconde confirmation - suppression effective
        deleteChantier(deletingChantier);
        setDeletingChantier(null);
        setConfirmDelete(false);
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Gestion des Chantiers</h1>
          <p className="text-muted-foreground">Suivi des coûts par chantier</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowExportDialog(true)}>
            <TrendingUp className="mr-2 h-4 w-4" />
            Exporter bilan (PDF)
          </Button>
          <Button variant="outline" onClick={() => setShowAddMaterial(true)}>
            <Package className="mr-2 h-4 w-4" />
            Frais matériel
          </Button>
          <Button onClick={() => setShowAddChantier(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Nouveau chantier
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Chantiers actifs</CardTitle>
            <HardHat className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{chantiers.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Heures totales</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatHoursDecimalWithH(totalHeures)}</div>
          </CardContent>
        </Card>
      </div>

      {/* Chantiers Table */}
      <Card>
        <CardHeader>
          <CardTitle>Liste des chantiers</CardTitle>
        </CardHeader>
        <CardContent>
          {chantiers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <HardHat className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Aucun chantier enregistré</p>
              <Button 
                variant="outline" 
                className="mt-4"
                onClick={() => setShowAddChantier(true)}
              >
                <Plus className="mr-2 h-4 w-4" />
                Ajouter un chantier
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Chantier</TableHead>
                  <TableHead className="text-right">Heures</TableHead>
                  <TableHead className="text-right">Prévu</TableHead>
                  <TableHead className="text-right">Écart</TableHead>
                  <TableHead className="text-right">Devis</TableHead>
                  <TableHead className="text-right">Marge</TableHead>
                  <TableHead className="text-right">Main-d'œuvre</TableHead>
                  <TableHead className="text-right">Matériel</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="text-right">Facturable (+25%)</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {chantierStats.map((stat) => {
                  const chantier = chantiers.find(c => c.id === stat.chantierId);
                  const devis = chantier?.devis ?? 0;
                  const heuresPrevues = chantier?.heuresPrevues ?? 0;
                  const heuresOverrun = stat.heures - heuresPrevues;
                  const overBudget = stat.coutTotal > devis && devis > 0;
                  return (
                    <TableRow
                      key={stat.chantierId}
                      className={`cursor-pointer hover:bg-muted/50 ${overBudget ? 'bg-destructive/10' : ''}`}
                      onClick={() => setSelectedChantier(stat.chantierId)}
                    >
                      <TableCell>
                        <div>
                          <p className="font-medium flex items-center gap-2">
                            {stat.chantierNom}
                            {heuresOverrun > 0 && (
                              <span className="rounded-full bg-muted/20 px-2 py-0.5 text-[11px] font-semibold text-muted-foreground">
                                +{formatHoursDecimalWithH(heuresOverrun)}
                              </span>
                            )}
                          </p>
                          {chantier?.description && (
                            <p className="text-sm text-muted-foreground">
                              {chantier.description}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">{formatHoursDecimalWithH(stat.heures)}</TableCell>
                      <TableCell className="text-right">{formatHoursDecimalWithH(heuresPrevues)}</TableCell>
                      <TableCell className={`text-right font-semibold ${heuresOverrun > 0 ? 'text-destructive' : 'text-primary'}`}>
                        {formatHoursDecimalWithH(heuresOverrun)}
                      </TableCell>
                      <TableCell className="text-right">{formatCurrency(chantier?.devis ?? 0)}</TableCell>
                      <TableCell className={`text-right font-semibold ${((chantier?.devis ?? 0) - stat.coutTotal) < 0 ? 'text-destructive' : 'text-primary'}`}>
                        {formatCurrency((chantier?.devis ?? 0) - stat.coutTotal)}
                      </TableCell>
                      <TableCell className="text-right">{formatCurrency(stat.coutMain)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(stat.coutMateriel)}</TableCell>
                      <TableCell className="text-right font-semibold text-primary">
                        {formatCurrency(stat.coutTotal)}
                      </TableCell>
                      <TableCell className="text-right font-semibold text-blue-600">
                        {formatCurrency(stat.coutTotal * 1.25)}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => { e.stopPropagation(); setDeletingChantier(stat.chantierId); }}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Dialogs */}
      <AddChantierDialog
        open={showAddChantier}
        onOpenChange={setShowAddChantier}
        onSave={addChantier}
      />

      <AddMaterialCostDialog
        open={showAddMaterial}
        onOpenChange={setShowAddMaterial}
        onSave={addMaterialCost}
        chantiers={chantiers}
      />

      <AlertDialog open={!!deletingChantier} onOpenChange={() => { setDeletingChantier(null); setConfirmDelete(false); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className={confirmDelete ? "text-destructive" : ""}>
              {confirmDelete ? "DERNIÈRE CONFIRMATION" : "Supprimer ce chantier ?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmDelete ? (
                <div className="space-y-2">
                  <p className="font-semibold text-destructive">
                    ATTENTION : Vous allez supprimer TOUTES les données du chantier !
                  </p>
                  <p>Cette action est <strong>irréversible</strong> et supprimera :</p>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    <li>Le chantier et toutes ses informations</li>
                    <li>Toutes les heures enregistrées par les employés</li>
                    <li>Tous les coûts matériels associés</li>
                    <li>Toutes les statistiques et bilans</li>
                  </ul>
                  <p className="font-medium">Êtes-vous absolument certain de continuer ?</p>
                </div>
              ) : (
                <div className="space-y-2">
                  <p>Cette action supprimera également toutes les heures et frais associés à ce chantier.</p>
                  <p>Cliquez sur "Supprimer" pour voir la confirmation finale.</p>
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => { setDeletingChantier(null); setConfirmDelete(false); }}>
              {confirmDelete ? "NON, ANNULER" : "Annuler"}
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteChantier}
              className={confirmDelete ? "bg-destructive hover:bg-destructive/90" : ""}
            >
              {confirmDelete ? "OUI, SUPPRIMER TOUT" : "Supprimer"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <ChantierDetailDialog
        chantierId={selectedChantier}
        open={!!selectedChantier}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedChantier(null);
          }
        }}
      />

      <PDFExportDialog
        open={showExportDialog}
        onOpenChange={setShowExportDialog}
        employees={employees}
        timeEntries={timeEntries}
        chantiers={chantiers}
        hourCategories={hourCategories}
        materialCosts={materialCosts}
      />
    </div>
  );
}