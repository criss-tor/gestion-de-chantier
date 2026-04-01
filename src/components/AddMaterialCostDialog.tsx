import { useState } from 'react';
import { MaterialCost, Chantier } from '@/types/employee';
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

interface AddMaterialCostDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (cost: Omit<MaterialCost, 'id'>) => void;
  chantiers: Chantier[];
}

export function AddMaterialCostDialog({
  open,
  onOpenChange,
  onSave,
  chantiers,
}: AddMaterialCostDialogProps) {
  const [chantierId, setChantierId] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [montant, setMontant] = useState('');
  const [description, setDescription] = useState('');

  const handleSave = () => {
    if (!chantierId || !date || !montant || !description) return;
    
    onSave({
      chantierId,
      date,
      montant: parseFloat(montant),
      description,
    });
    
    resetForm();
    onOpenChange(false);
  };

  const resetForm = () => {
    setChantierId('');
    setDate(new Date().toISOString().split('T')[0]);
    setMontant('');
    setDescription('');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Ajouter des frais de matériel</DialogTitle>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
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
            <Label htmlFor="montant">Montant (CHF)</Label>
            <Input
              id="montant"
              type="number"
              step="0.01"
              value={montant}
              onChange={(e) => setMontant(e.target.value)}
              placeholder="150.00"
            />
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Matériaux, outils, fournitures..."
              rows={3}
            />
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button 
            onClick={handleSave} 
            disabled={!chantierId || !montant || !description}
          >
            Ajouter
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}