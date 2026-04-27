import { useRef, useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { Download, Upload, Landmark, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useEmployeeContext } from '@/contexts/EmployeeContext';
import { exportBackup, importBackup } from '@/lib/backup';
import { useToast } from '@/hooks/use-toast';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { supabase } from '@/integrations/supabase/client';

export function Layout() {
  const { employees, timeEntries, chantiers, materialCosts, hourCategories, currentEmployeeId, setCurrentEmployee, restoreData, logout } = useEmployeeContext();
  const currentEmployee = currentEmployeeId ? employees.find((e) => e.id === currentEmployeeId) : null;
  const isAdmin = currentEmployee?.role === 'admin';
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const [ganttMarkers, setGanttMarkers] = useState<{ id: string; chantierId: string; date: string; endDate?: string; type: 'milestone' | 'appointment' | 'end-date' | 'custom' | 'range'; label: string }[]>([]);

  // Load markers from Supabase
  useEffect(() => {
    const loadMarkers = async () => {
      const { data, error } = await supabase.from('gantt_markers').select('*').order('date', { ascending: true });
      if (error) {
        console.error('Error loading markers:', error);
        return;
      }
      if (data) {
        setGanttMarkers(data.map(m => ({
          id: m.id,
          chantierId: m.chantier_id,
          date: m.date,
          endDate: m.end_date || undefined,
          type: m.type as any,
          label: m.label
        })));
      }
    };
    loadMarkers();
  }, []);

  const handleExport = () => {
    exportBackup({ employees, timeEntries, chantiers, materialCosts, hourCategories, ganttMarkers });
    toast({ title: 'Sauvegarde exportée', description: 'Le fichier Excel a été téléchargé.' });
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      try {
        const data = importBackup(ev.target?.result as ArrayBuffer);
        restoreData(data);
        // Restore Gantt markers if present
        if (data.ganttMarkers && data.ganttMarkers.length > 0) {
          // Insert markers into Supabase
          const { error } = await supabase.from('gantt_markers').insert(
            data.ganttMarkers.map(m => ({
              chantier_id: m.chantierId,
              date: m.date,
              end_date: m.endDate || null,
              type: m.type,
              label: m.label,
              color: null
            })) as any
          );
          if (error) {
            console.error('Error restoring markers:', error);
          } else {
            setGanttMarkers(data.ganttMarkers);
          }
        }
        toast({ title: 'Restauration réussie', description: `${data.employees.length} employés, ${data.timeEntries.length} entrées, ${data.chantiers.length} chantiers${data.ganttMarkers?.length ? ', ' + data.ganttMarkers.length + ' rendez-vous' : ''} restaurés.` });
      } catch {
        toast({ title: 'Erreur', description: 'Le fichier Excel est invalide.', variant: 'destructive' });
      }
    };
    reader.readAsArrayBuffer(file);
    e.target.value = '';
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        {isAdmin && <AppSidebar />}
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <header className="border-b bg-card/80 backdrop-blur-sm sticky top-0 z-10">
            <div className="px-4 py-4 flex items-center justify-between">
              <div className="flex items-center gap-4">
                {isAdmin && <SidebarTrigger />}
                <div className="flex items-center gap-3">
                  <img 
                    src="/logo.png" 
                    alt="Logo" 
                    className="h-9 w-9 object-contain"
                  />
                  <div>
                    <h1 className="text-xl font-bold">Gestion de Chantiers      </h1>
                    <p className="text-sm text-muted-foreground">Suivi des heures et coûts</p>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-2">
                  {isAdmin && (
                    <select
                      className="input input-sm"
                      value={currentEmployeeId ?? ''}
                      onChange={(e) => setCurrentEmployee(e.target.value || null)}
                    >
                      <option value="">Mode Admin</option>
                      {employees.map((emp) => (
                        <option key={emp.id} value={emp.id}>{emp.prenom} {emp.nom}</option>
                      ))}
                    </select>
                  )}

                  {currentEmployee && (
                    <span className="px-2 py-1 rounded-md border text-sm">
                      {currentEmployee.prenom} {currentEmployee.nom} - {currentEmployee.role}
                    </span>
                  )}

                  <Button variant="ghost" size="sm" onClick={logout}>
                    Déconnexion
                  </Button>
                </div>

                {isAdmin && (
                  <>
                    <Button variant="outline" size="sm" onClick={handleExport}>
                      <Download className="h-4 w-4 mr-1" />
                      Sauvegarder
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
                      <Upload className="h-4 w-4 mr-1" />
                      Restaurer
                    </Button>
                    <input ref={fileInputRef} type="file" accept=".xlsx,.xls" className="hidden" onChange={handleImport} />
                  </>
                )}
              </div>
            </div>
          </header>

          {/* Main Content */}
          <main className="flex-1 p-6">
            <ErrorBoundary>
              <Outlet />
            </ErrorBoundary>
          </main>
        </div>
      </div>
    </SidebarProvider>);

}