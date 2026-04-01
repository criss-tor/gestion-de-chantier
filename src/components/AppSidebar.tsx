import { Users, HardHat, LayoutDashboard, Clock } from 'lucide-react';
import { NavLink } from '@/components/NavLink';
import { useLocation } from 'react-router-dom';
import { useEmployeeContext } from '@/contexts/EmployeeContext';
import { useIsMobile } from '@/hooks/use-mobile';

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar';

const menuItems = [
  { title: 'Dashboard', url: '/', icon: LayoutDashboard, adminOnly: true },
  { title: 'Employés', url: '/employes', icon: Users, adminOnly: true },
  { title: 'Heures', url: '/heures', icon: Clock },
  { title: 'Chantiers', url: '/chantiers', icon: HardHat, adminOnly: true },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const location = useLocation();
  const { currentEmployeeId, employees } = useEmployeeContext();
  const isActive = (path: string) => location.pathname === path;
  const isMobile = useIsMobile();
  
  // Déterminer si on est en mode admin
  const isAdmin = currentEmployeeId === null || (currentEmployeeId && employees.find(e => e.id === currentEmployeeId)?.role === 'admin');

  return (
    <Sidebar collapsible={isMobile ? "offcanvas" : "icon"}>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems
                .filter((item) => !item.adminOnly || isAdmin)
                .map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild isActive={isActive(item.url)}>
                      <NavLink to={item.url} end className="hover:bg-muted/50" activeClassName="bg-primary/10 text-primary font-medium">
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
