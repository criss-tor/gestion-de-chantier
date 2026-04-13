import { useEffect, useState } from 'react';
import { useEmployeeContext } from '@/contexts/EmployeeContext';
import { formatHoursDecimalWithH } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Clock, Package, Users, Trash2, Edit, Plus } from 'lucide-react';

interface ChantierDetailDialogProps {
  chantierId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ChantierDetailDialog({ chantierId, open, onOpenChange }: ChantierDetailDialogProps) {
  const { employees, timeEntries, materialCosts, getChantierById, getEntryCost, chantierStats, updateChantier, deleteMaterialCost, addMaterialCost } = useEmployeeContext();

  const [devisInput, setDevisInput] = useState('0');
  const [heuresPrevuesInput, setHeuresPrevuesInput] = useState('0');
  const [editMode, setEditMode] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<string | null>(null);
  const [newMaterialDescription, setNewMaterialDescription] = useState('');
  const [newMaterialAmount, setNewMaterialAmount] = useState('0');
  const [newMaterialDate, setNewMaterialDate] = useState(new Date().toISOString().slice(0, 10));
  const [showAddMaterial, setShowAddMaterial] = useState(false);

  const chantier = chantierId ? getChantierById(chantierId) : undefined;

  useEffect(() => {
    setDevisInput(String(chantier?.devis ?? 0));
    setHeuresPrevuesInput(String(chantier?.heuresPrevues ?? 0));
  }, [chantier?.devis, chantier?.heuresPrevues]);

  if (!chantier) return null;

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('fr-CH', { style: 'currency', currency: 'CHF' }).format(amount);

  // Group hours by employee
  const chantierEntries = timeEntries.filter((e) => e.chantierId === chantierId);
  const hoursPerEmployee = new Map<string, { heures: number; cout: number }>();
  chantierEntries.forEach((entry) => {
    const emp = employees.find((e) => e.id === entry.employeeId);
    const cost = getEntryCost(entry);
    const existing = hoursPerEmployee.get(entry.employeeId) || { heures: 0, cout: 0 };
    existing.heures += entry.heures;
    existing.cout += cost;
    hoursPerEmployee.set(entry.employeeId, existing);
  });

  const employeeRows = Array.from(hoursPerEmployee.entries()).map(([empId, data]) => {
    const emp = employees.find((e) => e.id === empId);
    return { emp, heures: data.heures, cout: data.cout };
  });

  const totalHeures = employeeRows.reduce((s, r) => s + r.heures, 0);
  const totalMain = employeeRows.reduce((s, r) => s + r.cout, 0);

  // Bureau stats for this chantier
  const stat = chantierStats.find((s) => s.chantierId === chantierId);

  // Material costs
  const chantierMaterials = materialCosts.filter((c) => c.chantierId === chantierId);
  const totalMateriel = chantierMaterials.reduce((s, c) => s + c.montant, 0);
  // Les coûts de bureau ne sont pas inclus car ce sont des frais généraux
  const totalCost = totalMain + totalMateriel;
  const margin = (chantier.devis ?? 0) - totalCost;

  const handleAddMaterial = () => {
    if (newMaterialDescription && newMaterialAmount && chantierId) {
      addMaterialCost({
        chantierId,
        description: newMaterialDescription,
        montant: Number(newMaterialAmount),
        date: newMaterialDate,
      });
      setNewMaterialDescription('');
      setNewMaterialAmount('0');
      setNewMaterialDate(new Date().toISOString().slice(0, 10));
      setShowAddMaterial(false);
    }
  };

  const handleDeleteMaterial = (materialId: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce coût matériel ?')) {
      deleteMaterialCost(materialId);
    }
  };

  const handleEditMaterial = (cost: any) => {
    setEditingMaterial(cost.id);
    setNewMaterialDescription(cost.description);
    setNewMaterialAmount(String(cost.montant));
    setNewMaterialDate(cost.date);
  };

  const handleUpdateMaterial = () => {
    if (editingMaterial && newMaterialDescription && newMaterialAmount && chantierId) {
      // Note: updateMaterialCost n'existe pas dans le contexte, on va simuler une modification
      // en supprimant l'ancien et en ajoutant le nouveau
      deleteMaterialCost(editingMaterial);
      addMaterialCost({
        chantierId,
        description: newMaterialDescription,
        montant: Number(newMaterialAmount),
        date: newMaterialDate,
      });
      setEditingMaterial(null);
      setNewMaterialDescription('');
      setNewMaterialAmount('0');
      setNewMaterialDate(new Date().toISOString().slice(0, 10));
    }
  };

  const handleCancelEdit = () => {
    setEditingMaterial(null);
    setNewMaterialDescription('');
    setNewMaterialAmount('0');
    setNewMaterialDate(new Date().toISOString().slice(0, 10));
  };

  const renderContent = () => (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">{chantier.nom}</DialogTitle>
          {chantier.description && (
            <p className="text-sm text-muted-foreground">{chantier.description}</p>
          )}

          <div className="mt-4 flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Devis (montant prévu) :</span>
              {editMode ? (
                <Input
                  type="number"
                  min={0}
                  step={0.01}
                  value={devisInput}
                  onChange={(e) => setDevisInput(e.target.value)}
                  className="w-32"
                />
              ) : (
                <span className="text-sm font-semibold">{formatCurrency(chantier.devis ?? 0)}</span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Heures prévues :</span>
              {editMode ? (
                <Input
                  type="number"
                  min={0}
                  step={0.5}
                  value={heuresPrevuesInput}
                  onChange={(e) => setHeuresPrevuesInput(e.target.value)}
                  className="w-24"
                />
              ) : (
                <span className="text-sm font-semibold">{formatHoursDecimalWithH(chantier.heuresPrevues ?? 0)}</span>
              )}
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  if (editMode) {
                    const devisValue = Number(devisInput) || 0;
                    const heuresValue = Number(heuresPrevuesInput) || 0;
                    updateChantier(chantierId, { devis: devisValue, heuresPrevues: heuresValue });
                  }
                  setEditMode((prev) => !prev);
                }}
              >
                {editMode ? 'Enregistrer' : 'Modifier'}
              </Button>
              {editMode && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setDevisInput(String(chantier.devis ?? 0));
                    setHeuresPrevuesInput(String(chantier.heuresPrevues ?? 0));
                    setEditMode(false);
                  }}
                >
                  Annuler
                </Button>
              )}
            </div>
          </div>
        </DialogHeader>

        {/* Employee hours */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-muted-foreground" />
            <h3 className="font-semibold text-sm">Heures par employé</h3>
            <Badge variant="secondary" className="ml-auto">{totalHeures}h — {formatCurrency(totalMain)}</Badge>
          </div>

          {/* Les heures de bureau ne sont plus réparties sur les chantiers */}
          {employeeRows.length === 0 ? (
            <p className="text-sm text-muted-foreground py-2">Aucune heure enregistrée</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employé</TableHead>
                  <TableHead>Coût/h</TableHead>
                  <TableHead className="text-right">Heures</TableHead>
                  <TableHead className="text-right">Coût</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {employeeRows.map((row) => (
                  <TableRow key={row.emp?.id}>
                    <TableCell className="font-medium">{row.emp?.prenom} {row.emp?.nom}</TableCell>
                    <TableCell>{row.emp ? formatCurrency(row.emp.coutHoraire) : '-'}</TableCell>
                    <TableCell className="text-right">{row.heures}h</TableCell>
                    <TableCell className="text-right">{formatCurrency(row.cout)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>

        {/* Material costs */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Package className="h-4 w-4 text-muted-foreground" />
              <h3 className="font-semibold text-sm">Coûts matériels</h3>
              <Badge variant="secondary">{chantierMaterials.length} coûts</Badge>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAddMaterial(!showAddMaterial)}
            >
              <Plus className="h-4 w-4 mr-1" />
              Ajouter un coût
            </Button>
          </div>

          {/* Formulaire d'ajout/modification de matériel */}
          {(showAddMaterial || editingMaterial) && (
            <div className="p-3 border rounded-md bg-muted/30 space-y-2">
              <div className="text-sm font-medium">
                {editingMaterial ? 'Modifier le coût matériel' : 'Ajouter un coût matériel'}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
                <Input
                  placeholder="Description"
                  value={newMaterialDescription}
                  onChange={(e) => setNewMaterialDescription(e.target.value)}
                  className="text-sm"
                />
                <Input
                  type="number"
                  placeholder="Montant"
                  value={newMaterialAmount}
                  onChange={(e) => setNewMaterialAmount(e.target.value)}
                  className="text-sm"
                />
                <Input
                  type="date"
                  value={newMaterialDate}
                  onChange={(e) => setNewMaterialDate(e.target.value)}
                  className="text-sm"
                />
                <div className="flex gap-1">
                  <Button size="sm" onClick={editingMaterial ? handleUpdateMaterial : handleAddMaterial}>
                    {editingMaterial ? 'Sauver' : <Plus className="h-4 w-4" />}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={editingMaterial ? handleCancelEdit : () => setShowAddMaterial(false)}
                  >
                    {editingMaterial ? 'Annuler' : 'Annuler'}
                  </Button>
                </div>
              </div>
            </div>
          )}

          {chantierMaterials.length === 0 ? (
            <p className="text-sm text-muted-foreground py-2">Aucun coût matériel enregistré</p>
          ) : (
            <div className="space-y-2 max-h-[300px] overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Description</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Montant</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {chantierMaterials.map((cost) => (
                    <TableRow key={cost.id}>
                      <TableCell>{cost.description}</TableCell>
                      <TableCell className="text-muted-foreground">{cost.date}</TableCell>
                      <TableCell className="text-right font-medium">{formatCurrency(cost.montant)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-1 justify-end">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEditMaterial(cost)}
                            className="h-8 w-8"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteMaterial(cost.id)}
                            className="h-8 w-8 text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>

        {/* Detail des entrées avec descriptions */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <h3 className="font-semibold text-sm">Détail des entrées</h3>
            <Badge variant="secondary" className="ml-auto">{chantierEntries.length} entrées</Badge>
          </div>
          {chantierEntries.length === 0 ? (
            <p className="text-sm text-muted-foreground py-2">Aucune entrée d'heures</p>
          ) : (
            <div className="space-y-2 max-h-[200px] overflow-y-auto">
              {chantierEntries
                .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                .map((entry) => {
                  const emp = employees.find((e) => e.id === entry.employeeId);
                  return (
                    <div key={entry.id} className="flex flex-col bg-muted rounded-md p-2 text-sm gap-1">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{emp?.prenom} {emp?.nom}</span>
                          <span className="text-muted-foreground text-xs">{entry.date}</span>
                        </div>
                        <span className="font-semibold text-primary">{entry.heures}h</span>
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
          )}
        </div>

        {/* Totals */}
        <div className="space-y-2 pt-3 border-t">
          <div className="flex items-center justify-between">
            <span className="font-semibold">Heures réelles</span>
            <span className="text-lg font-bold text-primary">{totalHeures.toFixed(1)} h</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="font-semibold">Heures prévues</span>
            <span className="text-lg font-bold">{(chantier.heuresPrevues ?? 0).toFixed(1)} h</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="font-semibold">Écart</span>
            <span className={`text-lg font-bold ${(totalHeures - (chantier.heuresPrevues ?? 0)) > 0 ? 'text-destructive' : 'text-primary'}`}>
              {(totalHeures - (chantier.heuresPrevues ?? 0)).toFixed(1)} h
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="font-semibold">Coût total</span>
            <span className="text-lg font-bold text-primary">{formatCurrency(totalCost)}</span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );

  try {
    return renderContent();
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Erreur dans ChantierDetailDialog', error);
    return (
      <div className="p-6">
        <h2 className="text-lg font-bold text-destructive">Erreur d'affichage</h2>
        <p className="text-sm text-muted-foreground">Une erreur est survenue lors de l'affichage du chantier.</p>
        <pre className="mt-3 p-3 rounded bg-muted text-xs overflow-auto">
          {String(error)}
        </pre>
      </div>
    );
  }
}
