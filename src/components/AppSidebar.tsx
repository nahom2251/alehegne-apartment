import { useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { NavLink } from '@/components/NavLink';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  useSidebar,
} from '@/components/ui/sidebar';
import {
  LayoutDashboard,
  Building2,
  Zap,
  Droplets,
  DollarSign,
  Users,
  Settings,
} from 'lucide-react';

const AppSidebar = () => {
  const { state } = useSidebar();
  const collapsed = state === 'collapsed';
  const location = useLocation();
  const { isSuperAdmin } = useAuth();
  const { t } = useLanguage();

  const menuItems = [
    { title: t('nav.dashboard'), url: '/', icon: LayoutDashboard },
    { title: t('nav.apartments'), url: '/apartments', icon: Building2 },
    { title: t('nav.electricity'), url: '/electricity', icon: Zap },
    { title: t('nav.water'), url: '/water', icon: Droplets },
    { title: t('nav.revenue'), url: '/revenue', icon: DollarSign },
  ];

  if (isSuperAdmin) {
    menuItems.push({ title: t('nav.users'), url: '/users', icon: Users });
  }

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border">
      <SidebarContent className="bg-sidebar">
        <SidebarGroup>
          <SidebarGroupLabel className="px-4 py-3">
            {!collapsed && (
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg gold-gradient flex items-center justify-center">
                  <Building2 className="w-4 h-4 text-card" />
                </div>
                <span className="font-bold text-sm text-sidebar-foreground">AS Apt.</span>
              </div>
            )}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      end={item.url === '/'}
                      className="hover:bg-sidebar-accent/50"
                      activeClassName="bg-sidebar-accent text-sidebar-primary font-medium"
                    >
                      <item.icon className="mr-2 h-4 w-4" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="bg-sidebar border-t border-sidebar-border p-3">
        {!collapsed && (
          <p className="text-xs text-muted-foreground text-center">{t('app.powered')}</p>
        )}
      </SidebarFooter>
    </Sidebar>
  );
};

export default AppSidebar;
