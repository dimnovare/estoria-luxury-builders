import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Building2, FileText, Users, Mail, MessageSquare, Plus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useAdminStats, useAdminContacts } from '@/hooks/api/useAdmin';
import { contactStatusLabel } from '@/lib/enumLabels';
import { formatDate } from '@/lib/formatDate';
import AdminPageHeader from '@/components/admin/AdminPageHeader';
import { StatCardSkeleton } from '@/components/admin/TableSkeleton';
import { ErrorState } from '@/components/admin/ErrorState';

const statusColor: Record<string, string> = {
  New: 'bg-primary/20 text-primary border-primary/30',
  Read: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  Replied: 'bg-success/10 text-success border-success/30',
};

export default function AdminDashboard() {
  const { t } = useTranslation();
  const { data: stats, isLoading: statsLoading, isError: statsError, refetch: refetchStats } = useAdminStats();
  const { data: contactsData } = useAdminContacts();

  const statCards = [
    { labelKey: 'admin.dashboard.stats.properties',     value: stats?.properties ?? 0,      icon: Building2,    href: '/admin/properties' },
    { labelKey: 'admin.dashboard.stats.blogPosts',      value: stats?.blogPosts ?? 0,        icon: FileText,     href: '/admin/blog' },
    { labelKey: 'admin.dashboard.stats.teamMembers',    value: stats?.teamMembers ?? 0,      icon: Users,        href: '/admin/team' },
    { labelKey: 'admin.dashboard.stats.unreadMessages', value: stats?.unreadMessages ?? 0,   icon: MessageSquare,href: '/admin/messages', highlight: true },
    { labelKey: 'admin.dashboard.stats.subscribers',    value: stats?.subscribers ?? 0,      icon: Mail,         href: '/admin/newsletter' },
  ];

  const recentMessages = (contactsData?.items ?? []).slice(0, 5);

  return (
    <div className="space-y-6">
      <AdminPageHeader title={t('admin.dashboard.title')} />

      {/* Stats */}
      {statsError ? (
        <ErrorState
          description={t('admin.dashboard.statsError', 'We could not load your dashboard stats. Please try again.')}
          onRetry={() => refetchStats()}
        />
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
          {statsLoading
            ? statCards.map(s => <StatCardSkeleton key={s.labelKey} />)
            : statCards.map(s => (
              <Link key={s.labelKey} to={s.href}>
                <Card className="bg-card border-border hover:border-border transition-colors shadow-sm">
                  <CardContent className="p-3 sm:p-4">
                    <div className="flex items-center justify-between mb-2">
                      <s.icon className={`h-5 w-5 ${s.highlight && s.value > 0 ? 'text-primary' : 'text-muted-foreground'}`} />
                      {s.highlight && s.value > 0 && <div className="h-2 w-2 rounded-full bg-primary" />}
                    </div>
                    <p className={`text-2xl font-semibold tabular-nums ${s.highlight && s.value > 0 ? 'text-primary' : 'text-foreground'}`}>{s.value}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{t(s.labelKey)}</p>
                  </CardContent>
                </Card>
              </Link>
            ))}
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Recent Messages */}
        <div className="lg:col-span-2">
          <Card className="bg-card border-border shadow-sm overflow-hidden">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-medium text-foreground">{t('admin.dashboard.recentMessages')}</CardTitle>
                <Link to="/admin/messages" className="text-xs text-primary hover:underline">{t('admin.dashboard.viewAll')}</Link>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-border">
                    <TableHead className="text-muted-foreground text-xs">{t('admin.common.name')}</TableHead>
                    <TableHead className="text-muted-foreground text-xs hidden sm:table-cell">{t('admin.dashboard.subjectColumn')}</TableHead>
                    <TableHead className="text-muted-foreground text-xs hidden sm:table-cell">{t('admin.common.date')}</TableHead>
                    <TableHead className="text-muted-foreground text-xs">{t('admin.common.status')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentMessages.map(m => (
                    <TableRow key={m.id} className="border-border">
                      <TableCell className="text-sm text-foreground font-medium py-3">
                        <div>{m.name}</div>
                        <div className="text-xs text-muted-foreground sm:hidden">{m.subject}</div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground py-3 hidden sm:table-cell">{m.subject}</TableCell>
                      <TableCell className="text-sm text-muted-foreground py-3 hidden sm:table-cell">
                        {m.createdAt ? formatDate(m.createdAt) : '—'}
                      </TableCell>
                      <TableCell className="py-3">
                        <Badge variant="outline" className={`text-[10px] ${statusColor[m.status] ?? ''}`}>
                          {contactStatusLabel(m.status, t)}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                  {recentMessages.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-8 text-muted-foreground text-sm">
                        {t('admin.dashboard.noMessages')}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card className="bg-card border-border shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-medium text-foreground">{t('admin.dashboard.quickActions')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button asChild className="w-full bg-primary hover:bg-primary text-primary-foreground font-medium">
              <Link to="/admin/properties/new"><Plus className="h-4 w-4 mr-2" />{t('admin.dashboard.addProperty')}</Link>
            </Button>
            <Button asChild variant="outline" className="w-full border-border text-foreground hover:bg-muted">
              <Link to="/admin/blog/new"><Plus className="h-4 w-4 mr-2" />{t('admin.dashboard.newBlogPost')}</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
