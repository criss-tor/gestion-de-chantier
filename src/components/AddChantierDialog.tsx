import { useState } from 'react';
import { Chantier } from '@/types/employee';
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

interface AddChantierDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (chantier: Omit<Chantier, 'id'> & { id?: string }) => void;
}

export function AddChantierDialog({
  open,
  onOpenChange,
  onSave,
}: AddChantierDialogProps) {
  const [nom, setNom] = useState('');
  const [description, setDescription] = useState('');
  const [devis, setDevis] = useState('0');
  const [heuresPrevues, setHeuresPrevues] = useState('0');
  const [customId, setCustomId] = useState('');

  const handleSave = () => {
    if (!nom.trim()) return;
    
    onSave({
      id: customId.trim() || undefined, // Si l'ID est fourni, l'utiliser, sinon undefined pour génération auto
      nom: nom.trim(),
      description: description.trim() || undefined,
      devis: Number(devis) || 0,
      heuresPrevues: Number(heuresPrevues) || 0,
    });
    
    resetForm();
    onOpenChange(false);
  };

  const resetForm = () => {
    setNom('');
    setDescription('');
    setDevis('0');
    setHeuresPrevues('0');
    setCustomId('');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Ajouter un chantier</DialogTitle>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="customId">ID personnalisé (optionnel)</Label>
            <Input
              id="customId"
              value={customId}
              onChange={(e) => setCustomId(e.target.value)}
              placeholder="Laissez vide pour génération automatique"
            />
            <p className="text-xs text-muted-foreground">
              Si vous ne spécifiez pas d'ID, il sera généré automatiquement
            </p>
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="nom">Nom du chantier</Label>
            <Input
              id="nom"
              value={nom}
              onChange={(e) => setNom(e.target.value)}
              placeholder="Ex: Rénovation Villa Lausanne"
            />
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="description">Description (optionnel)</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Description du chantier..."
              rows={3}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="devis">Devis (montant prévu)</Label>
            <Input
              id="devis"
              type="number"
              min={0}
              step={0.01}
              value={devis}
              onChange={(e) => setDevis(e.target.value)}
              placeholder="0"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="heuresPrevues">Heures prévues</Label>
            <Input
              id="heuresPrevues"
              type="number"
              min={0}
              step={0.5}
              value={heuresPrevues}
              onChange={(e) => setHeuresPrevues(e.target.value)}
              placeholder="0"
            />
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button onClick={handleSave} disabled={!nom.trim()}>
            Ajouter
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}