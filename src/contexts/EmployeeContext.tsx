import { createContext, useContext, ReactNode } from 'react';
import { useEmployeeStore } from '@/hooks/useEmployeeStore';

type EmployeeStoreType = ReturnType<typeof useEmployeeStore>;

const EmployeeContext = createContext<EmployeeStoreType | null>(null);

export function EmployeeProvider({ children }: { children: ReactNode }) {
  const store = useEmployeeStore();
  return (
    <EmployeeContext.Provider value={store}>
      {children}
    </EmployeeContext.Provider>
  );
}

export function useEmployeeContext() {
  const context = useContext(EmployeeContext);
  if (!context) {
    throw new Error('useEmployeeContext must be used within EmployeeProvider');
  }
  return context;
}