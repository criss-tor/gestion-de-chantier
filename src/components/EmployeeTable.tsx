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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Pencil, Trash2, Clock, User } from 'lucide-react';

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
  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('fr-CH', { style: 'currency', currency: 'CHF' }).format(amount);

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
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 transition-opacity">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => onAddTime(employee)}>
                        <Clock className="mr-2 h-4 w-4" />Ajouter des heures
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onEdit(employee)}>
                        <Pencil className="mr-2 h-4 w-4" />Modifier
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onDelete(employee.id)} className="text-destructive focus:text-destructive">
                        <Trash2 className="mr-2 h-4 w-4" />Supprimer
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
