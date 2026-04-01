import { Employee, TimeEntry, HourCategory } from '@/types/employee';

export const initialEmployees: Employee[] = [
  { id: '1', nom: 'T', prenom: 'Cristiano', coutHoraire: 90, role: 'admin', pin: '8860' },
  { id: '2', nom: 'Druey', prenom: 'Olivier', coutHoraire: 30, role: 'employe', pin: '2345' },
  { id: '3', nom: 'Da Silva', prenom: 'Machado', coutHoraire: 110, role: 'employe', pin: '3456' },
  { id: '4', nom: 'Kalista', prenom: 'Sébastien', coutHoraire: 85, role: 'employe', pin: '4567' },
  { id: '5', nom: 'Berti', prenom: 'Christophe', coutHoraire: 110, role: 'employe', pin: '5678' },
  { id: '6', nom: 'Crottaz', prenom: 'Yvan', coutHoraire: 110, role: 'employe', pin: '6789' },
  { id: '7', nom: 'Grunenwald', prenom: 'Pascal', coutHoraire: 50, role: 'employe', pin: '7890' },
];

export const initialHourCategories: HourCategory[] = [
  { id: 'hc1', nom: 'Heures normales', pourcentage: 0 },
  
  { id: 'hc2', nom: 'Heures supplémentaires', pourcentage: 25 },
  { id: 'hc3', nom: 'Heures de nuit', pourcentage: 50 },
  { id: 'hc4', nom: 'Heures dimanche/férié', pourcentage: 100 },
  { id: 'hc5', nom: 'Bureau', pourcentage: 0, isBureau: true },
];

export const initialTimeEntries: TimeEntry[] = [
  { id: '1', employeeId: '1', chantierId: 'ch1', date: '2024-01-15', heures: 8, description: 'Travail administratif', hourCategoryId: 'hc1' },
  { id: '2', employeeId: '3', chantierId: 'ch2', date: '2024-01-15', heures: 7.5, description: 'Maintenance équipement', hourCategoryId: 'hc1' },
  { id: '3', employeeId: '4', chantierId: 'ch1', date: '2024-01-15', heures: 8, description: 'Production', hourCategoryId: 'hc1' },
  { id: '4', employeeId: '5', chantierId: 'ch3', date: '2024-01-16', heures: 8, description: 'Installation client', hourCategoryId: 'hc1' },
  { id: '5', employeeId: '2', chantierId: 'ch2', date: '2024-01-16', heures: 4, description: 'Formation', hourCategoryId: 'hc1' },
];
