import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Building2, FileText, Users, Mail, Plus, UserPlus, CheckCircle2, ArrowRight } from 'lucide-react';
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

  const unread = stats?.unreadMessages ?? 0;

  // Calm "overview" numbers — totals, not actions. The thing that needs action
  // (unread enquiries) gets the attention banner above instead.
  const overviewCards = [
    { labelKey: 'admin.dashboard.stats.properties',  value: stats?.properties ?? 0,  icon: Building2, href: '/admin/properties' },
    { labelKey: 'admin.dashboard.stats.blogPosts',   value: stats?.blogPosts ?? 0,   icon: FileText,  href: '/admin/blog' },
    { labelKey: 'admin.dashboard.stats.teamMembers', value: stats?.teamMembers ?? 0, icon: Users,     href: '/admin/team' },
    { labelKey: 'admin.dashboard.stats.subscribers', value: stats?.subscribers ?? 0, icon: Mail,      href: '/admin/newsletter' },
  ];

  const recentMessages = (contactsData?.items ?? []).slice(0, 5);

  return (
    <div className="space-y-6">
      <AdminPageHeader title={t('admin.dashboard.title')} subtitle={t('admin.dashboard.subtitle')} />

      {/* Needs attention today */}
      {unread > 0 ? (
        <Link to="/admin/messages" className="block">
          <Card className="bg-primary/5 border-primary/30 shadow-sm hover:border-primary/50 transition-colors">
            <CardContent className="p-4 sm:p-5 flex items-center gap-4">
              <div className="h-11 w-11 rounded-full bg-primary/15 border border-primary/30 flex items-center justify-center shrink-0">
                <span className="text-lg font-semibold text-primary tabular-nums">{unread}</span>
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm sm:text-base font-medium text-foreground">
                  {t('admin.dashboard.attention.enquiries', { count: unread })}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">{t('admin.dashboard.attention.enquiriesHint')}</p>
              </div>
              <span className="hidden sm:inline-flex items-center gap-1 text-sm text-primary font-medium shrink-0">
                {t('admin.dashboard.attention.viewEnquiries')}<ArrowRight className="h-4 w-4" />
              </span>
            </CardContent>
          </Card>
        </Link>
      ) : (
        <Card className="bg-card border-border shadow-sm">
          <CardContent className="p-4 sm:p-5 flex items-center gap-3">
            <CheckCircle2 className="h-6 w-6 text-success shrink-0" />
            <div>
              <p className="text-sm font-medium text-foreground">{t('admin.dashboard.attention.allClear')}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{t('admin.dashboard.attention.allClearHint')}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Overview totals */}
      <div>
        <p className="text-xs font-nav uppercase tracking-widest text-muted-foreground mb-3">{t('admin.dashboard.overview')}</p>
        {statsError ? (
          <ErrorState
            description={t('admin.dashboard.statsError', 'We could not load your dashboard stats. Please try again.')}
            onRetry={() => refetchStats()}
          />
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {statsLoading
              ? overviewCards.map(s => <StatCardSkeleton key={s.labelKey} />)
              : overviewCards.map(s => (
                <Link key={s.labelKey} to={s.href}>
                  <Card className="bg-card border-border hover:border-border transition-colors shadow-sm">
                    <CardContent className="p-3 sm:p-4">
                      <s.icon className="h-5 w-5 text-muted-foreground mb-2" />
                      <p className="text-2xl font-semibold tabular-nums text-foreground">{s.value}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{t(s.labelKey)}</p>
                    </CardContent>
                  </Card>
                </Link>
              ))}
          </div>
        )}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Recent enquiries */}
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

        {/* Quick actions — the everyday next steps */}
        <Card className="bg-card border-border shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-medium text-foreground">{t('admin.dashboard.quickActions')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button asChild className="w-full bg-primary hover:bg-primary text-primary-foreground font-medium">
              <Link to="/admin/properties/new"><Plus className="h-4 w-4 mr-2" />{t('admin.dashboard.addProperty')}</Link>
            </Button>
            <Button asChild variant="outline" className="w-full border-border text-foreground hover:bg-muted">
              <Link to="/admin/messages"><Mail className="h-4 w-4 mr-2" />{t('admin.dashboard.replyEnquiries')}</Link>
            </Button>
            <Button asChild variant="outline" className="w-full border-border text-foreground hover:bg-muted">
              <Link to="/admin/contacts/new"><UserPlus className="h-4 w-4 mr-2" />{t('admin.dashboard.addContact')}</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
