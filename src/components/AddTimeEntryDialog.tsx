import { useState, useEffect, useMemo } from 'react';
import { Employee, TimeEntry, Chantier, HourCategory } from '@/types/employee';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface AddTimeEntryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (entry: Omit<TimeEntry, 'id'>) => void;
  employee: Employee | null;
  chantiers: Chantier[];
  hourCategories?: HourCategory[];
}

export function AddTimeEntryDialog({
  open,
  onOpenChange,
  onSave,
  employee,
  chantiers,
  hourCategories = [],
}: AddTimeEntryDialogProps) {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [heures, setHeures] = useState('');
  const [chantierId, setChantierId] = useState('');
  const [description, setDescription] = useState('');
  const [hourCategoryId, setHourCategoryId] = useState('');

  useEffect(() => {
    if (open) {
      setDate(new Date().toISOString().split('T')[0]);
      setHeures('');
      setChantierId('');
      setDescription('');
      setHourCategoryId(hourCategories[0]?.id || '');
    }
  }, [open, hourCategories]);

  const selectedCategory = hourCategories.find((c) => c.id === hourCategoryId);
  const isBureauSelected = selectedCategory?.isBureau === true;

  const previewCost = useMemo(() => {
    if (!employee || !heures) return null;
    const cat = hourCategoryId ? hourCategories.find((c) => c.id === hourCategoryId) : null;
    const multiplier = cat ? 1 + cat.pourcentage / 100 : 1;
    return parseFloat(heures) * employee.coutHoraire * multiplier;
  }, [employee, heures, hourCategoryId, hourCategories]);

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('fr-CH', { style: 'currency', currency: 'CHF' }).format(amount);

  const handleSave = () => {
    if (!employee || !date || !heures) return;
    if (!isBureauSelected && !chantierId) return;

    onSave({
      employeeId: employee.id,
      chantierId: isBureauSelected ? undefined : chantierId,
      date,
      heures: parseFloat(heures),
      description: description || undefined,
      hourCategoryId: hourCategoryId || undefined,
    });

    onOpenChange(false);
  };

  if (!employee) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            Ajouter des heures pour {employee.prenom} {employee.nom}
          </DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {!isBureauSelected && (
            <div className="grid gap-2">
              <Label htmlFor="chantier">Chantier</Label>
              <Select value={chantierId} onValueChange={setChantierId}>
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

          {isBureauSelected && (
            <div className="rounded-md bg-accent/50 p-3 text-sm text-muted-foreground">
              Les heures Bureau seront réparties automatiquement sur les chantiers au prorata.
            </div>
          )}

          {hourCategories.length > 0 && (
            <div className="grid gap-2">
              <Label>Catégorie d'heures</Label>
              <Select value={hourCategoryId} onValueChange={(val) => {
                setHourCategoryId(val);
                const cat = hourCategories.find((c) => c.id === val);
                if (cat?.isBureau) setChantierId('');
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner une catégorie" />
                </SelectTrigger>
                <SelectContent>
                  {hourCategories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.nom} ({cat.pourcentage > 0 ? '+' : ''}{cat.pourcentage}%)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="grid gap-2">
            <Label htmlFor="date">Date</Label>
            <Input
              id="date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="heures">Nombre d'heures</Label>
            <Input
              id="heures"
              type="number"
              step="0.5"
              value={heures}
              onChange={(e) => setHeures(e.target.value)}
              placeholder="8"
            />
          </div>

          {previewCost !== null && (
            <div className="rounded-md bg-muted p-3 text-sm">
              <span className="text-muted-foreground">Coût estimé : </span>
              <span className="font-semibold text-primary">{formatCurrency(previewCost)}</span>
            </div>
          )}

          <div className="grid gap-2">
            <Label htmlFor="description">Description (optionnel)</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Description du travail effectué..."
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button onClick={handleSave} disabled={(!isBureauSelected && !chantierId) || !heures}>
            Ajouter
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
