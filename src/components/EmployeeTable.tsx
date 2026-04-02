import { Employee } from '@/types/employee';
import { formatHoursDecimalWithH } from '@/lib/utils';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { MoreHorizontal, Pencil, Trash2, Clock, User } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

interface EmployeeTableProps {
  employees: Employee[];
  getTotalHours: (id: string) => number;
  getTotalCost: (id: string) => number;
  monthLabel?: string;
  onEdit: (employee: Employee) => void;
  onDelete: (id: string) => void;
  onAddTime: (employee: Employee) => void;
}

export function EmployeeTable({
  employees,
  getTotalHours,
  getTotalCost,
  onEdit,
  onDelete,
  onAddTime,
  monthLabel,
}: EmployeeTableProps) {
  const isMobile = useIsMobile();
  
  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('fr-CH', { style: 'currency', currency: 'CHF' }).format(amount);

  // Vue Mobile: Cartes optimisées
  if (isMobile) {
    return (
      <div className="space-y-3">
        {employees.map((employee) => {
          const totalHours = getTotalHours(employee.id);
          const totalCost = getTotalCost(employee.id);
          
          return (
            <Card key={employee.id} className="overflow-hidden">
              <CardContent className="p-4">
                {/* En-tête avec nom et rôle */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-foreground">
                      {employee.prenom} {employee.nom}
                    </h3>
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium mt-1 ${
                      employee.role === 'admin'
                        ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300'
                        : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300'
                    }`}>
                      {employee.role === 'admin' ? 'Admin' : 'Employé'}
                    </span>
                  </div>
                </div>

                {/* Informations principales */}
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="bg-muted/30 rounded-lg p-3">
                    <div className="text-sm text-muted-foreground mb-1">Coût/h</div>
                    <div className="text-xl font-bold text-foreground">{formatCurrency(employee.coutHoraire)}</div>
                  </div>
                  <div className="bg-muted/30 rounded-lg p-3">
                    <div className="text-sm text-muted-foreground mb-1">Heures{monthLabel ? ` (${monthLabel})` : ''}</div>
                    <div className="text-xl font-bold text-foreground">{formatHoursDecimalWithH(totalHours)}</div>
                  </div>
                </div>

                {/* Coût total et actions */}
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="text-sm text-muted-foreground mb-1">Coût{monthLabel ? ` (${monthLabel})` : ''}</div>
                    <div className="text-xl font-bold text-primary">{formatCurrency(totalCost)}</div>
                  </div>
                  
                  {/* Boutons d'action - plus grands et plus visibles */}
                  <div className="flex gap-2 ml-4">
                    <Button 
                      size="lg" 
                      onClick={() => onAddTime(employee)} 
                      className="h-12 w-12 p-0 bg-green-600 hover:bg-green-700 text-white"
                      title="Ajouter des heures"
                    >
                      <Clock className="h-5 w-5" />
                    </Button>
                    <Button 
                      size="lg" 
                      onClick={() => onEdit(employee)} 
                      variant="outline"
                      className="h-12 w-12 p-0 border-2"
                      title="Modifier"
                    >
                      <Pencil className="h-5 w-5" />
                    </Button>
                    <Button 
                      size="lg" 
                      onClick={() => onDelete(employee.id)} 
                      variant="destructive"
                      className="h-12 w-12 p-0"
                      title="Supprimer"
                    >
                      <Trash2 className="h-5 w-5" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    );
  }

  // Vue Desktop: Tableau original
  return (
    <div className="rounded-xl border bg-card overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50 hover:bg-muted/50">
            <TableHead className="font-semibold">Employé</TableHead>
            <TableHead className="font-semibold">Rôle</TableHead>
            <TableHead className="font-semibold text-right">Coût/h</TableHead>
            <TableHead className="font-semibold text-right">Heures{monthLabel ? ` (${monthLabel})` : ' totales'}</TableHead>
            <TableHead className="font-semibold text-right">Coût{monthLabel ? ` (${monthLabel})` : ' total'}</TableHead>
            <TableHead className="w-[70px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {employees.map((employee) => {
            const totalHours = getTotalHours(employee.id);
            const totalCost = getTotalCost(employee.id);
            return (
              <TableRow key={employee.id} className="group">
                <TableCell>
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <User className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">{employee.nom}</p>
                      <p className="text-sm text-muted-foreground">{employee.prenom}</p>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                    employee.role === 'admin'
                      ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300'
                      : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300'
                  }`}>
                    {employee.role === 'admin' ? 'Admin' : 'Employé'}
                  </span>
                </TableCell>
                <TableCell className="text-right font-medium">{formatCurrency(employee.coutHoraire)}</TableCell>
                <TableCell className="text-right">
                  <span className="font-medium">{formatHoursDecimalWithH(totalHours)}</span>
                  <span className="text-muted-foreground"> h</span>
                </TableCell>
                <TableCell className="text-right font-semibold text-primary">{formatCurrency(totalCost)}</TableCell>
                <TableCell>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button variant="ghost" size="icon" onClick={() => onAddTime(employee)} title="Ajouter des heures">
                      <Clock className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => onEdit(employee)} title="Modifier">
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => onDelete(employee.id)} className="text-destructive hover:text-destructive" title="Supprimer">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
