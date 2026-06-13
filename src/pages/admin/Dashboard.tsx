import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Building2, FileText, Users, Mail, MessageSquare, Plus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useAdminStats, useAdminContacts } from '@/hooks/api/useAdmin';
import { contactStatusLabel } from '@/lib/enumLabels';
import AdminPageHeader from '@/components/admin/AdminPageHeader';

const statusColor: Record<string, string> = {
  New: 'bg-primary/20 text-primary border-primary/30',
  Read: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  Replied: 'bg-green-500/20 text-green-400 border-green-500/30',
};

export default function AdminDashboard() {
  const { t } = useTranslation();
  const { data: stats } = useAdminStats();
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
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
        {statCards.map(s => (
          <Link key={s.labelKey} to={s.href}>
            <Card className="bg-white border-[hsl(0_0%_90%)] hover:border-[hsl(0_0%_80%)] transition-colors shadow-sm">
              <CardContent className="p-3 sm:p-4">
                <div className="flex items-center justify-between mb-2">
                  <s.icon className={`h-5 w-5 ${s.highlight && s.value > 0 ? 'text-[hsl(43_50%_54%)]' : 'text-[hsl(0_0%_60%)]'}`} />
                  {s.highlight && s.value > 0 && <div className="h-2 w-2 rounded-full bg-[hsl(43_50%_54%)]" />}
                </div>
                <p className={`text-2xl font-semibold ${s.highlight && s.value > 0 ? 'text-[hsl(43_50%_54%)]' : 'text-[hsl(0_0%_15%)]'}`}>{s.value}</p>
                <p className="text-xs text-[hsl(0_0%_50%)] mt-0.5">{t(s.labelKey)}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Recent Messages */}
        <div className="lg:col-span-2">
          <Card className="bg-white border-[hsl(0_0%_90%)] shadow-sm overflow-hidden">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-medium text-[hsl(0_0%_15%)]">{t('admin.dashboard.recentMessages')}</CardTitle>
                <Link to="/admin/messages" className="text-xs text-[hsl(43_50%_54%)] hover:underline">{t('admin.dashboard.viewAll')}</Link>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-[hsl(0_0%_93%)]">
                    <TableHead className="text-[hsl(0_0%_50%)] text-xs">{t('admin.common.name')}</TableHead>
                    <TableHead className="text-[hsl(0_0%_50%)] text-xs hidden sm:table-cell">{t('admin.dashboard.subjectColumn')}</TableHead>
                    <TableHead className="text-[hsl(0_0%_50%)] text-xs hidden sm:table-cell">{t('admin.common.date')}</TableHead>
                    <TableHead className="text-[hsl(0_0%_50%)] text-xs">{t('admin.common.status')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentMessages.map(m => (
                    <TableRow key={m.id} className="border-[hsl(0_0%_93%)]">
                      <TableCell className="text-sm text-[hsl(0_0%_20%)] font-medium py-3">
                        <div>{m.name}</div>
                        <div className="text-xs text-[hsl(0_0%_50%)] sm:hidden">{m.subject}</div>
                      </TableCell>
                      <TableCell className="text-sm text-[hsl(0_0%_40%)] py-3 hidden sm:table-cell">{m.subject}</TableCell>
                      <TableCell className="text-sm text-[hsl(0_0%_50%)] py-3 hidden sm:table-cell">
                        {m.createdAt ? new Date(m.createdAt).toLocaleDateString() : '—'}
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
                      <TableCell colSpan={4} className="text-center py-8 text-[hsl(0_0%_50%)] text-sm">
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
        <Card className="bg-white border-[hsl(0_0%_90%)] shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-medium text-[hsl(0_0%_15%)]">{t('admin.dashboard.quickActions')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button asChild className="w-full bg-[hsl(43_50%_54%)] hover:bg-[hsl(43_50%_48%)] text-[hsl(0_0%_4%)] font-medium">
              <Link to="/admin/properties/new"><Plus className="h-4 w-4 mr-2" />{t('admin.dashboard.addProperty')}</Link>
            </Button>
            <Button asChild variant="outline" className="w-full border-[hsl(0_0%_85%)] text-[hsl(0_0%_30%)] hover:bg-[hsl(0_0%_96%)]">
              <Link to="/admin/blog/new"><Plus className="h-4 w-4 mr-2" />{t('admin.dashboard.newBlogPost')}</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
