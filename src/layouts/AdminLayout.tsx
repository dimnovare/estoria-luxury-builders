import { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Building2, FileText, Users, Briefcase,
  Globe, GraduationCap, Mail, MessageSquare, ChevronLeft,
  ExternalLink, Menu,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { label: 'Dashboard', icon: LayoutDashboard, path: '/admin' },
  { label: 'Properties', icon: Building2, path: '/admin/properties' },
  { label: 'Blog', icon: FileText, path: '/admin/blog' },
  { label: 'Team', icon: Users, path: '/admin/team' },
  { label: 'Services', icon: Briefcase, path: '/admin/services' },
  { label: 'Pages', icon: Globe, path: '/admin/pages' },
  { label: 'Careers', icon: GraduationCap, path: '/admin/careers' },
  { label: 'Newsletter', icon: Mail, path: '/admin/newsletter' },
  { label: 'Messages', icon: MessageSquare, path: '/admin/messages' },
];

function getBreadcrumbs(pathname: string) {
  const parts = pathname.split('/').filter(Boolean);
  const crumbs = [{ label: 'Admin', path: '/admin' }];
  if (parts.length > 1) {
    const item = navItems.find(n => n.path === `/admin/${parts[1]}`);
    if (item) crumbs.push({ label: item.label, path: item.path });
  }
  if (parts.length > 2) {
    const last = parts[parts.length - 1];
    if (last === 'new') crumbs.push({ label: 'New', path: pathname });
    else if (parts.includes('edit')) crumbs.push({ label: 'Edit', path: pathname });
    else crumbs.push({ label: last, path: pathname });
  }
  return crumbs;
}

export default function AdminLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { pathname } = useLocation();
  const crumbs = getBreadcrumbs(pathname);

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
            <span className="text-[10px] font-body uppercase tracking-wider bg-primary/20 text-primary px-1.5 py-0.5 rounded">Admin</span>
          </div>
        )}
        {collapsed && <span className="font-heading text-xl text-primary mx-auto">E</span>}
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4 space-y-1 overflow-y-auto">
        {navItems.map(item => (
          <Link
            key={item.path}
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
            {!collapsed && <span>{item.label}</span>}
          </Link>
        ))}
      </nav>

      {/* Bottom */}
      <div className="border-t border-border/50 p-4 shrink-0">
        <a
          href="/"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
        >
          <ExternalLink className="h-4 w-4" />
          {!collapsed && <span>View Site</span>}
        </a>
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
            View Site
          </a>
        </header>

        {/* Content */}
        <main className="p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
