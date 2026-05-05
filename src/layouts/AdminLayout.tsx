import { useState, useMemo } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  LayoutDashboard, Building2, FileText, Users, Briefcase,
  Globe, GraduationCap, Mail, MessageSquare, ChevronLeft,
  ExternalLink, Menu, LogOut, ScrollText, UserCog, Contact, Handshake,
  ListTodo, Cake, Bell, Settings,
} from 'lucide-react';
import type { TFunction } from 'i18next';
import { useAuth, type UserRole } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';
import ErrorBoundary from '@/components/ErrorBoundary';

interface NavItemDef {
  key: string;
  icon: typeof LayoutDashboard;
  path: string;
  /** Roles allowed to see this item. Omit = any authenticated user. */
  roles?: UserRole[];
  /** Section header rendered above this item when not collapsed */
  section?: string;
  /** If true, render as disabled (greyed-out, not clickable) */
  disabled?: boolean;
}

const navItemDefs: NavItemDef[] = [
  { key: 'dashboard',  icon: LayoutDashboard, path: '/admin' },
  { key: 'properties', icon: Building2,       path: '/admin/properties' },
  { key: 'blog',       icon: FileText,        path: '/admin/blog' },
  { key: 'team',       icon: Users,           path: '/admin/team',       roles: ['Admin'] },
  { key: 'services',   icon: Briefcase,       path: '/admin/services',   roles: ['Admin', 'Editor'] },
  { key: 'pages',      icon: Globe,           path: '/admin/pages',      roles: ['Admin', 'Editor'] },
  { key: 'careers',    icon: GraduationCap,   path: '/admin/careers',    roles: ['Admin', 'Editor'] },
  { key: 'newsletter', icon: Mail,            path: '/admin/newsletter', roles: ['Admin', 'Marketing'] },
  { key: 'messages',   icon: MessageSquare,   path: '/admin/messages' },
  // CRM section
  { key: 'contacts',      icon: Contact,    path: '/admin/contacts',       section: 'CRM' },
  { key: 'deals',         icon: Handshake,  path: '/admin/deals',          section: 'CRM' },
  { key: 'tasks',         icon: ListTodo,   path: '/admin/tasks',          section: 'CRM' },
  { key: 'birthdays',     icon: Cake,       path: '/admin/birthdays',      section: 'CRM' },
  { key: 'savedSearches', icon: Bell,       path: '/admin/saved-searches', section: 'CRM' },
  { key: 'activities',    icon: ScrollText, path: '/admin/activities',     section: 'CRM' },
  // Admin / System section
  { key: 'settings',   icon: Settings,        path: '/admin/settings',   roles: ['Admin'], section: 'System' },
  { key: 'users',      icon: UserCog,         path: '/admin/users',      roles: ['Admin'], section: 'System' },
  { key: 'auditLog',   icon: ScrollText,      path: '/admin/audit-log',  roles: ['Admin'], section: 'System' },
];

function getBreadcrumbs(pathname: string, t: TFunction) {
  const parts = pathname.split('/').filter(Boolean);
  const crumbs: { label: string; path: string }[] = [
    { label: t('admin.layout.breadcrumbAdmin'), path: '/admin' },
  ];
  if (parts.length > 1) {
    const item = navItemDefs.find(n => n.path === `/admin/${parts[1]}`);
    if (item) crumbs.push({ label: t(`admin.nav.${item.key}`), path: item.path });
  }
  if (parts.length > 2) {
    const last = parts[parts.length - 1];
    if (last === 'new') crumbs.push({ label: t('admin.layout.breadcrumbNew'), path: pathname });
    else if (parts.includes('edit')) crumbs.push({ label: t('admin.layout.breadcrumbEdit'), path: pathname });
    else crumbs.push({ label: last, path: pathname });
  }
  return crumbs;
}

export default function AdminLayout() {
  const { t } = useTranslation();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { logout, email, hasAnyRole } = useAuth();
  const crumbs = useMemo(() => getBreadcrumbs(pathname, t), [pathname, t]);

  // Filter nav by role. Items without `roles` are visible to any authenticated user.
  const visibleNavItems = useMemo(
    () => navItemDefs.filter((item) => !item.roles || hasAnyRole(...item.roles)),
    [hasAnyRole]
  );

  const handleLogout = () => {
    logout();
    navigate('/admin/login');
  };

  const isActive = (path: string) => {
    if (path === '/admin') return pathname === '/admin';
    return pathname.startsWith(path);
  };

  const sidebar = (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="h-16 flex items-center px-4 border-b border-border/50 shrink-0">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <span className="font-heading text-xl tracking-[0.2em] text-foreground">ESTORIA</span>
            <span className="text-[10px] font-body uppercase tracking-wider bg-primary/20 text-primary px-1.5 py-0.5 rounded">{t('admin.layout.adminBadge')}</span>
          </div>
        )}
        {collapsed && <span className="font-heading text-xl text-primary mx-auto">E</span>}
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4 space-y-1 overflow-y-auto">
        {visibleNavItems.map((item, idx) => {
          const prevItem = visibleNavItems[idx - 1];
          const showSection = !collapsed && item.section && item.section !== prevItem?.section;
          return (
            <div key={item.path}>
              {showSection && (
                <div className="px-4 pt-4 pb-1">
                  <span className="text-[10px] font-nav uppercase tracking-widest text-muted-foreground/60">{item.section}</span>
                </div>
              )}
              {item.disabled ? (
                <div className="flex items-center gap-3 px-4 py-2.5 text-sm font-body text-muted-foreground/40 cursor-not-allowed">
                  <item.icon className="h-4 w-4 shrink-0" />
                  {!collapsed && <span>{t(`admin.nav.${item.key}`)}</span>}
                </div>
              ) : (
                <Link
                  to={item.path}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    'flex items-center gap-3 px-4 py-2.5 text-sm font-body transition-colors relative',
                    isActive(item.path)
                      ? 'text-primary bg-primary/5'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted/30'
                  )}
                >
                  {isActive(item.path) && (
                    <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-primary" />
                  )}
                  <item.icon className="h-4 w-4 shrink-0" />
                  {!collapsed && <span>{t(`admin.nav.${item.key}`)}</span>}
                </Link>
              )}
            </div>
          );
        })}
      </nav>

      {/* Bottom */}
      <div className="border-t border-border/50 p-4 shrink-0 space-y-3">
        <a
          href="/"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
        >
          <ExternalLink className="h-4 w-4" />
          {!collapsed && <span>{t('admin.layout.viewSite')}</span>}
        </a>
        {!collapsed && email && (
          <p className="text-xs text-muted-foreground truncate">{email}</p>
        )}
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-red-400 transition-colors"
        >
          <LogOut className="h-4 w-4" />
          {!collapsed && <span>{t('admin.layout.signOut')}</span>}
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[hsl(0_0%_96%)] flex">
      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={() => setMobileOpen(false)} />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed top-0 left-0 bottom-0 z-50 bg-background border-r border-border transition-all duration-300',
          collapsed ? 'w-16' : 'w-60',
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        {sidebar}
        {/* Collapse button - desktop */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="hidden lg:flex absolute -right-3 top-20 h-6 w-6 items-center justify-center rounded-full bg-background border border-border text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className={cn('h-3 w-3 transition-transform', collapsed && 'rotate-180')} />
        </button>
      </aside>

      {/* Main */}
      <div className={cn('flex-1 transition-all duration-300', collapsed ? 'lg:ml-16' : 'lg:ml-60')}>
        {/* Top bar */}
        <header className="h-16 bg-white border-b border-[hsl(0_0%_90%)] flex items-center justify-between px-4 lg:px-6 sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <button onClick={() => setMobileOpen(true)} className="lg:hidden text-[hsl(0_0%_40%)]">
              <Menu className="h-5 w-5" />
            </button>
            <div className="flex items-center gap-1.5 text-sm">
              {crumbs.map((c, i) => (
                <span key={c.path} className="flex items-center gap-1.5">
                  {i > 0 && <span className="text-[hsl(0_0%_75%)]">/</span>}
                  {i === crumbs.length - 1 ? (
                    <span className="text-[hsl(0_0%_20%)] font-medium">{c.label}</span>
                  ) : (
                    <Link to={c.path} className="text-[hsl(0_0%_50%)] hover:text-[hsl(0_0%_20%)]">{c.label}</Link>
                  )}
                </span>
              ))}
            </div>
          </div>
          <a
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:flex items-center gap-1.5 text-sm text-[hsl(0_0%_50%)] hover:text-[hsl(0_0%_20%)] transition-colors"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            {t('admin.layout.viewSite')}
          </a>
        </header>

        {/* Content */}
        <main className="p-4 lg:p-6">
          {/* ErrorBoundary keyed on route so navigating away from a crashed page
              resets the boundary and lets the user keep working. */}
          <ErrorBoundary key={pathname}>
            <Outlet />
          </ErrorBoundary>
        </main>
      </div>
    </div>
  );
}
