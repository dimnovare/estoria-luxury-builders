import { useState, useMemo, useEffect, Suspense } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  LayoutDashboard, Building2, FileText, Users, Briefcase,
  Globe, GraduationCap, Mail, MessageSquare, ChevronLeft,
  ExternalLink, Menu, LogOut, ScrollText, UserCog, Contact, Handshake,
  ListTodo, Cake, Bell, Settings, X, Building,
} from 'lucide-react';
import type { TFunction } from 'i18next';
import { useAuth, type UserRole } from '@/hooks/useAuth';
import { useInboxCounts } from '@/hooks/api/useInbox';
import { useContactMessageUnreadCount } from '@/hooks/api/useAdmin';
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
  { key: 'inbox',      icon: Mail,            path: '/admin/inbox',      roles: ['Admin', 'Agent'] },
  { key: 'contacts',      icon: Contact,    path: '/admin/contacts',       section: 'CRM' },
  { key: 'companies',     icon: Building,    path: '/admin/companies',     section: 'CRM' },
  { key: 'birthdays',     icon: Cake,       path: '/admin/birthdays',      section: 'CRM' },
  { key: 'savedSearches', icon: Bell,       path: '/admin/saved-searches', section: 'CRM' },
  { key: 'activities',    icon: ScrollText, path: '/admin/activities',     section: 'CRM' },
  // Deals + Tasks moved to the bottom of the CRM group to de-emphasise them
  // (kept available, just lower priority than the relationship surfaces above).
  { key: 'deals',         icon: Handshake,  path: '/admin/deals',          section: 'CRM' },
  { key: 'tasks',         icon: ListTodo,   path: '/admin/tasks',          section: 'CRM' },
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
  const { t, i18n } = useTranslation();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { logout, email, hasAnyRole } = useAuth();
  const crumbs = useMemo(() => getBreadcrumbs(pathname, t), [pathname, t]);

  // Radix Dialog/Select/Popover/Dropdown portal to <body>, OUTSIDE the
  // .admin-theme wrapper, so they would inherit the dark :root tokens and render
  // near-black on the white admin. Tagging <body> with admin-theme while the admin
  // is mounted makes every portaled surface use the light admin tokens.
  useEffect(() => {
    document.body.classList.add('admin-theme');
    return () => document.body.classList.remove('admin-theme');
  }, []);

  // Filter nav by role. Items without `roles` are visible to any authenticated user.
  const visibleNavItems = useMemo(
    () => navItemDefs.filter((item) => !item.roles || hasAnyRole(...item.roles)),
    [hasAnyRole]
  );

  const { data: inboxCounts } = useInboxCounts();
  // Sidebar badge must reflect UNREAD/new mail, not the inbox folder total.
  const inboxUnread = inboxCounts?.unread ?? 0;
  const { data: unreadContacts = 0 } = useContactMessageUnreadCount();

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
      <div className="h-16 flex items-center px-4 border-b border-[hsl(0_0%_16%)]/50 shrink-0">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <span className="font-heading text-xl tracking-[0.2em] text-[hsl(40_33%_95%)]">ESTORIA</span>
            <span className="text-[10px] font-body uppercase tracking-wider bg-[hsl(43_50%_54%)]/20 text-[hsl(43_50%_54%)] px-1.5 py-0.5 rounded">{t('admin.layout.adminBadge')}</span>
          </div>
        )}
        {collapsed && <span className="font-heading text-xl text-[hsl(43_50%_54%)] mx-auto">E</span>}
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
                  <span className="text-[10px] font-nav uppercase tracking-widest text-[hsl(0_0%_60%)]/60">
                    {item.section === 'CRM'
                      ? t('admin.nav.sections.crm')
                      : item.section === 'System'
                        ? t('admin.nav.sections.system')
                        : item.section}
                  </span>
                </div>
              )}
              {item.disabled ? (
                <div
                  className="flex items-center gap-3 px-4 py-2.5 text-sm font-body text-[hsl(0_0%_60%)]/40 cursor-not-allowed"
                  title={collapsed ? t(`admin.nav.${item.key}`) : undefined}
                  aria-label={t(`admin.nav.${item.key}`)}
                >
                  <item.icon className="h-4 w-4 shrink-0" />
                  {!collapsed && <span>{t(`admin.nav.${item.key}`)}</span>}
                </div>
              ) : (
                <Link
                  to={item.path}
                  onClick={() => setMobileOpen(false)}
                  title={collapsed ? t(`admin.nav.${item.key}`) : undefined}
                  aria-label={t(`admin.nav.${item.key}`)}
                  className={cn(
                    'flex items-center gap-3 px-4 py-2.5 text-sm font-body transition-colors relative',
                    isActive(item.path)
                      ? 'text-[hsl(43_50%_54%)] bg-[hsl(43_50%_54%)]/5'
                      : 'text-[hsl(0_0%_60%)] hover:text-[hsl(40_33%_95%)] hover:bg-[hsl(0_0%_16%)]/30'
                  )}
                >
                  {isActive(item.path) && (
                    <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-[hsl(43_50%_54%)]" />
                  )}
                  <item.icon className="h-4 w-4 shrink-0" />
                  {!collapsed && <span className="flex-1">{t(`admin.nav.${item.key}`)}</span>}
                  {!collapsed && item.key === 'inbox' && inboxUnread > 0 && (
                    <span className="ml-auto text-[10px] font-semibold bg-[hsl(43_50%_54%)] text-[hsl(0_0%_4%)] px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                      {inboxUnread}
                    </span>
                  )}
                  {!collapsed && item.key === 'messages' && unreadContacts > 0 && (
                    <span className="ml-auto text-[10px] font-semibold bg-[hsl(43_50%_54%)] text-[hsl(0_0%_4%)] px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                      {unreadContacts}
                    </span>
                  )}
                </Link>
              )}
            </div>
          );
        })}
      </nav>

      {/* Bottom */}
      <div className="border-t border-[hsl(0_0%_16%)]/50 p-4 shrink-0 space-y-3">
        <a
          href="/"
          target="_blank"
          rel="noopener noreferrer"
          title={collapsed ? t('admin.layout.viewSite') : undefined}
          aria-label={t('admin.layout.viewSite')}
          className="flex items-center gap-2 text-sm text-[hsl(0_0%_60%)] hover:text-[hsl(43_50%_54%)] transition-colors"
        >
          <ExternalLink className="h-4 w-4" />
          {!collapsed && <span>{t('admin.layout.viewSite')}</span>}
        </a>
        {!collapsed && email && (
          <p className="text-xs text-[hsl(0_0%_60%)] truncate">{email}</p>
        )}
        <button
          onClick={handleLogout}
          title={collapsed ? t('admin.layout.signOut') : undefined}
          aria-label={t('admin.layout.signOut')}
          className="flex items-center gap-2 text-sm text-[hsl(0_0%_60%)] hover:text-red-400 transition-colors"
        >
          <LogOut className="h-4 w-4" />
          {!collapsed && <span>{t('admin.layout.signOut')}</span>}
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[hsl(0_0%_96%)] flex admin-theme">
      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={() => setMobileOpen(false)} />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed top-0 left-0 bottom-0 z-50 bg-[hsl(0_0%_4%)] border-r border-[hsl(0_0%_15%)] transition-all duration-300',
          collapsed ? 'w-16' : 'w-60',
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        {/* Close button - mobile drawer only */}
        <button
          onClick={() => setMobileOpen(false)}
          aria-label={t('admin.common.close', 'Close menu')}
          className="lg:hidden absolute top-4 right-3 z-10 flex h-8 w-8 items-center justify-center rounded-full text-[hsl(0_0%_60%)] hover:text-[hsl(40_33%_95%)] hover:bg-[hsl(0_0%_16%)]/40 transition-colors"
        >
          <X className="h-5 w-5" />
        </button>
        {sidebar}
        {/* Collapse button - desktop */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="hidden lg:flex absolute -right-3 top-20 h-6 w-6 items-center justify-center rounded-full bg-[hsl(0_0%_4%)] border border-[hsl(0_0%_15%)] text-[hsl(0_0%_60%)] hover:text-[hsl(40_33%_95%)]"
        >
          <ChevronLeft className={cn('h-3 w-3 transition-transform', collapsed && 'rotate-180')} />
        </button>
      </aside>

      {/* Main. text-foreground (dark under .admin-theme) is the default so any
          shadcn Label / plain text that doesn't set its own colour stays legible
          on the white admin surface instead of inheriting the dark-theme cream. */}
      <div className={cn('flex-1 min-w-0 transition-all duration-300 text-foreground', collapsed ? 'lg:ml-16' : 'lg:ml-60')}>
        {/* Top bar */}
        <header className="h-16 bg-white border-b border-[hsl(0_0%_90%)] flex items-center justify-between gap-2 px-4 lg:px-6 sticky top-0 z-30">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <button
              onClick={() => setMobileOpen(true)}
              aria-label={t('admin.layout.openMenu', 'Open menu')}
              title={t('admin.layout.openMenu', 'Open menu')}
              className="lg:hidden flex h-11 w-11 -ml-2 items-center justify-center text-[hsl(0_0%_30%)] hover:text-[hsl(0_0%_15%)]"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div className="flex items-center gap-1.5 text-sm min-w-0 overflow-hidden">
              {crumbs.map((c, i) => {
                const isLast = i === crumbs.length - 1;
                return (
                  // Hide parent crumbs on phones (keep only the current page) so the
                  // breadcrumb never pushes the language switcher off-screen.
                  <span
                    key={c.path}
                    className={cn('items-center gap-1.5 min-w-0', isLast ? 'flex' : 'hidden sm:flex')}
                  >
                    {i > 0 && <span className="text-muted-foreground shrink-0">/</span>}
                    {isLast ? (
                      <span className="text-foreground font-medium truncate">{c.label}</span>
                    ) : (
                      <Link to={c.path} className="text-muted-foreground hover:text-foreground whitespace-nowrap">{c.label}</Link>
                    )}
                  </span>
                );
              })}
            </div>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            {/* Language switcher — always reachable from the topbar */}
            <div
              className="flex items-center gap-0.5 rounded-md border border-[hsl(0_0%_90%)] p-0.5"
              role="group"
              aria-label={t('admin.layout.language', 'Language')}
            >
              {(['et', 'en', 'ru'] as const).map((lng) => {
                const active = i18n.language?.startsWith(lng);
                return (
                  <button
                    key={lng}
                    onClick={() => i18n.changeLanguage(lng)}
                    title={lng.toUpperCase()}
                    aria-label={lng.toUpperCase()}
                    aria-pressed={active}
                    className={cn(
                      'px-2 py-1 text-[11px] font-nav uppercase tracking-wider rounded transition-colors',
                      active
                        ? 'bg-[hsl(43_50%_54%)] text-[hsl(0_0%_4%)] font-semibold'
                        : 'text-[hsl(0_0%_50%)] hover:text-[hsl(0_0%_20%)] hover:bg-[hsl(0_0%_96%)]'
                    )}
                  >
                    {lng}
                  </button>
                );
              })}
            </div>
            <a
              href="/"
              target="_blank"
              rel="noopener noreferrer"
              aria-label={t('admin.layout.viewSite')}
              className="hidden sm:flex items-center gap-1.5 text-sm text-[hsl(0_0%_50%)] hover:text-[hsl(0_0%_20%)] transition-colors"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              {t('admin.layout.viewSite')}
            </a>
          </div>
        </header>

        {/* Content */}
        <main className="p-4 lg:p-6">
          {/* Inner Suspense keeps the sidebar visible while a lazy admin chunk
              loads — only the content area shows the fallback, not the whole
              page. Inline bg colour matches the layout exactly so there is no
              colour flash between renders. */}
          <Suspense fallback={
            <div
              className="min-h-[60vh]"
              style={{ backgroundColor: 'hsl(0, 0%, 96%)' }}
            />
          }>
            {/* ErrorBoundary keyed on route so navigating away from a crashed
                page resets the boundary and lets the user keep working. */}
            <ErrorBoundary key={pathname}>
              <Outlet />
            </ErrorBoundary>
          </Suspense>
        </main>
      </div>
    </div>
  );
}
