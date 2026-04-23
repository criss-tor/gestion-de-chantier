import { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useEmployeeContext } from '@/contexts/EmployeeContext';

interface RequireAdminProps {
  children: ReactNode;
}

export function RequireAdmin({ children }: RequireAdminProps) {
  const { employees, currentEmployeeId, loading } = useEmployeeContext();
  const location = useLocation();

  // Attendre le chargement des employés
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="rounded-xl border border-border bg-card px-6 py-5 text-center shadow-sm">
          <p className="text-sm text-muted-foreground">Chargement de l’application…</p>
        </div>
      </div>
    );
  }

  if (!currentEmployeeId) {
    // Pas de connexion détectée
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  const user = employees.find(e => e.id === currentEmployeeId);
  if (!user || user.role !== 'admin') {
    // Employé connecté, accès refusé
    return <Navigate to="/heures" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}
