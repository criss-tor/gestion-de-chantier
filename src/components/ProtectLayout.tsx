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
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="rounded-xl border border-border bg-card px-6 py-5 text-center shadow-sm">
          <p className="text-sm text-muted-foreground">Chargement de l’application…</p>
        </div>
      </div>
    );
  }

  // Si l'utilisateur n'a jamais se connecté, rediriger vers login
  if (!hasConnected) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}
