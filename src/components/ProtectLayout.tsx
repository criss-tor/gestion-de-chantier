import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useEmployeeContext } from '@/contexts/EmployeeContext';

interface ProtectLayoutProps {
  children: ReactNode;
}

export function ProtectLayout({ children }: ProtectLayoutProps) {
  const { hasConnected, loading } = useEmployeeContext();

  // Attendre le chargement
  if (loading) {
    return null;
  }

  // Si l'utilisateur n'a jamais se connecté, rediriger vers login
  if (!hasConnected) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}
