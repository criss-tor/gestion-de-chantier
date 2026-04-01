import { useState, useCallback, useMemo } from 'react';
import { Employee, HourCategory } from '@/types/employee';
import { useEmployeeContext } from '@/contexts/EmployeeContext';
import { EmployeeTable } from '@/components/EmployeeTable';
import { AddEmployeeDialog } from '@/components/AddEmployeeDialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Trash2, Pencil } from 'lucide-react';
import { format, subMonths } from 'date-fns';
import { fr } from 'date-fns/locale';

export default function Employees() {
  const {
    employees,
    chantiers,
    timeEntries,
    hourCategories,
    addEmployee,
    updateEmployee,
    deleteEmployee,
    addTimeEntry,
    getEntryCost,
    deleteHourCategory,
    updateHourCategory,
    addHourCategory,
  } = useEmployeeContext();

  const [selectedMonth, setSelectedMonth] = useState(format(new Date(), 'yyyy-MM'));

  const months = useMemo(() => {
    const result: { value: string; label: string }[] = [];
    for (let i = 0; i < 12; i++) {
      const d = subMonths(new Date(), i);
      result.push({ value: format(d, 'yyyy-MM'), label: format(d, 'MMMM yyyy', { locale: fr }) });
    }
    return result;
  }, []);

  const getMonthlyHours = useCallback((id: string) =>
    timeEntries.filter((e) => e.employeeId === id && e.date.startsWith(selectedMonth)).reduce((s, e) => s + e.heures, 0),
    [timeEntries, selectedMonth]);

  const getMonthlyCost = useCallback((id: string) =>
    timeEntries.filter((e) => e.employeeId === id && e.date.startsWith(selectedMonth)).reduce((s, e) => s + getEntryCost(e), 0),
    [timeEntries, selectedMonth, getEntryCost]);

  const [showAddEmployee, setShowAddEmployee] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);

  // États pour les catégories d'heures
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [editingCategory, setEditingCategory] = useState<HourCategory | null>(null);
  const [categoryNom, setCategoryNom] = useState('');
  const [categoryPourcentage, setCategoryPourcentage] = useState('0');

  const handleSaveEmployee = (employeeData: Omit<Employee, 'id'>) => {
    if (editingEmployee) {
      updateEmployee(editingEmployee.id, employeeData);
      setEditingEmployee(null);
    } else {
      addEmployee(employeeData);
    }
  };

  // Fonctions pour les catégories d'heures
  const handleSaveCategory = () => {
    if (!categoryNom) return;
    if (editingCategory) {
      updateHourCategory(editingCategory.id, { nom: categoryNom, pourcentage: parseFloat(categoryPourcentage) || 0 });
      setEditingCategory(null);
    } else {
      addHourCategory({ nom: categoryNom, pourcentage: parseFloat(categoryPourcentage) || 0 });
    }
    setCategoryNom('');
    setCategoryPourcentage('0');
    setShowAddCategory(false);
  };

  const openEditCategory = (category: HourCategory) => {
    setEditingCategory(category);
    setCategoryNom(category.nom);
    setCategoryPourcentage(String(category.pourcentage));
    setShowAddCategory(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Employés</h1>
          <p className="text-muted-foreground">
            {employees.length} employé{employees.length > 1 ? 's' : ''} enregistré{employees.length > 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={selectedMonth} onValueChange={setSelectedMonth}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {months.map((m) => (
                <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={() => setShowAddEmployee(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Ajouter un employé
          </Button>
        </div>
      </div>

      <EmployeeTable
        employees={employees}
        getTotalHours={getMonthlyHours}
        getTotalCost={getMonthlyCost}
        monthLabel={months.find((m) => m.value === selectedMonth)?.label}
        onEdit={(employee) => {
          setEditingEmployee(employee);
          setShowAddEmployee(true);
        }}
        onDelete={deleteEmployee}
      />

      <AddEmployeeDialog
        open={showAddEmployee}
        onOpenChange={(open) => {
          setShowAddEmployee(open);
          if (!open) setEditingEmployee(null);
        }}
        onSave={handleSaveEmployee}
        employee={editingEmployee}
      />

      {/* Section Catégories d'heures */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Catégories d'heures</CardTitle>
              <p className="text-sm text-muted-foreground">
                {hourCategories.length} catégorie{hourCategories.length > 1 ? 's' : ''} configurée{hourCategories.length > 1 ? 's' : ''}
              </p>
            </div>
            <Button onClick={() => setShowAddCategory(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Ajouter une catégorie
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {hourCategories.length === 0 ? (
            <p className="text-sm text-muted-foreground">Aucune catégorie d'heures configurée.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nom</TableHead>
                  <TableHead className="text-right">Pourcentage (%)</TableHead>
                  <TableHead className="text-center">Bureau</TableHead>
                  <TableHead className="w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {hourCategories.map((category) => (
                  <TableRow key={category.id}>
                    <TableCell className="font-medium">{category.nom}</TableCell>
                    <TableCell className="text-right">{category.pourcentage}%</TableCell>
                    <TableCell className="text-center">
                      {category.isBureau ? 'Oui' : 'Non'}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditCategory(category)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteHourCategory(category.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Dialog pour ajouter/modifier une catégorie */}
      <Dialog open={showAddCategory} onOpenChange={setShowAddCategory}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingCategory ? 'Modifier la catégorie' : 'Ajouter une catégorie'}
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="nom">Nom de la catégorie</Label>
              <Input
                id="nom"
                value={categoryNom}
                onChange={(e) => setCategoryNom(e.target.value)}
                placeholder="Ex: Majoré, Absent, Congé..."
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="pourcentage">Pourcentage (%)</Label>
              <Input
                id="pourcentage"
                type="number"
                value={categoryPourcentage}
                onChange={(e) => setCategoryPourcentage(e.target.value)}
                placeholder="0"
                min="0"
                max="200"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddCategory(false)}>
              Annuler
            </Button>
            <Button onClick={handleSaveCategory}>
              {editingCategory ? 'Modifier' : 'Ajouter'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
