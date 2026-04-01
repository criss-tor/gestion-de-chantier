import { useState, useEffect } from 'react';
import { Employee } from '@/types/employee';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface AddEmployeeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (employee: Omit<Employee, 'id'>) => void;
  employee?: Employee | null;
}

export function AddEmployeeDialog({
  open,
  onOpenChange,
  onSave,
  employee,
}: AddEmployeeDialogProps) {
  const [nom, setNom] = useState('');
  const [prenom, setPrenom] = useState('');
  const [coutHoraire, setCoutHoraire] = useState('');
  const [role, setRole] = useState<'admin' | 'employe'>('employe');
  const [pin, setPin] = useState('');

  useEffect(() => {
    if (open) {
      setNom(employee?.nom || '');
      setPrenom(employee?.prenom || '');
      setCoutHoraire(employee?.coutHoraire?.toString() || '');
      setRole(employee?.role || 'employe');
      setPin(employee?.pin || '');
    }
  }, [open, employee]);

  const handleSave = () => {
    if (!nom || !prenom || !coutHoraire || !pin) return;
    if (pin.length !== 4 || !/^\d{4}$/.test(pin)) return;
    onSave({ nom, prenom, coutHoraire: parseFloat(coutHoraire), role, pin });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{employee ? 'Modifier employé' : 'Ajouter un employé'}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="nom">Nom</Label>
            <Input id="nom" value={nom} onChange={(e) => setNom(e.target.value)} placeholder="Dupont" />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="prenom">Prénom</Label>
            <Input id="prenom" value={prenom} onChange={(e) => setPrenom(e.target.value)} placeholder="Jean" />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="coutHoraire">Coût horaire (CHF)</Label>
            <Input id="coutHoraire" type="number" value={coutHoraire} onChange={(e) => setCoutHoraire(e.target.value)} placeholder="85" />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="role">Rôle</Label>
            <Select value={role} onValueChange={(value: 'admin' | 'employe') => setRole(value)}>
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner un rôle" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="employe">Employé</SelectItem>
                <SelectItem value="admin">Administrateur</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="pin">Code PIN (4 chiffres)</Label>
            <Input
              id="pin"
              type="password"
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
              placeholder="1234"
              maxLength={4}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Annuler</Button>
          <Button onClick={handleSave}>{employee ? 'Enregistrer' : 'Ajouter'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
