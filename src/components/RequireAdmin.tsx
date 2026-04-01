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
    return null;
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
