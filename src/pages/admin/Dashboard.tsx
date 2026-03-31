import { Link } from 'react-router-dom';
import { Building2, FileText, Users, Mail, MessageSquare, Plus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useAdminStats, useAdminContacts } from '@/hooks/api/useAdmin';

const statusColor: Record<string, string> = {
  New: 'bg-primary/20 text-primary border-primary/30',
  Read: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  Replied: 'bg-green-500/20 text-green-400 border-green-500/30',
};

export default function AdminDashboard() {
  const { data: stats } = useAdminStats();
  const { data: contactsData } = useAdminContacts();

  const statCards = [
    { label: 'Properties',       value: stats?.properties ?? 0,      icon: Building2,    href: '/admin/properties' },
    { label: 'Blog Posts',        value: stats?.blogPosts ?? 0,        icon: FileText,     href: '/admin/blog' },
    { label: 'Team Members',      value: stats?.teamMembers ?? 0,      icon: Users,        href: '/admin/team' },
    { label: 'Unread Messages',   value: stats?.unreadMessages ?? 0,   icon: MessageSquare,href: '/admin/messages', highlight: true },
    { label: 'Subscribers',       value: stats?.subscribers ?? 0,      icon: Mail,         href: '/admin/newsletter' },
  ];

  const recentMessages = (contactsData?.items ?? []).slice(0, 5);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-[hsl(0_0%_15%)]">Dashboard</h1>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {statCards.map(s => (
          <Link key={s.label} to={s.href}>
            <Card className="bg-white border-[hsl(0_0%_90%)] hover:border-[hsl(0_0%_80%)] transition-colors shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <s.icon className={`h-5 w-5 ${s.highlight && s.value > 0 ? 'text-[hsl(43_50%_54%)]' : 'text-[hsl(0_0%_60%)]'}`} />
                  {s.highlight && s.value > 0 && <div className="h-2 w-2 rounded-full bg-[hsl(43_50%_54%)]" />}
                </div>
                <p className={`text-2xl font-semibold ${s.highlight && s.value > 0 ? 'text-[hsl(43_50%_54%)]' : 'text-[hsl(0_0%_15%)]'}`}>{s.value}</p>
                <p className="text-xs text-[hsl(0_0%_50%)] mt-0.5">{s.label}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Recent Messages */}
        <div className="lg:col-span-2">
          <Card className="bg-white border-[hsl(0_0%_90%)] shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-medium text-[hsl(0_0%_15%)]">Recent Messages</CardTitle>
                <Link to="/admin/messages" className="text-xs text-[hsl(43_50%_54%)] hover:underline">View all</Link>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="border-[hsl(0_0%_93%)]">
                    <TableHead className="text-[hsl(0_0%_50%)] text-xs">Name</TableHead>
                    <TableHead className="text-[hsl(0_0%_50%)] text-xs">Subject</TableHead>
                    <TableHead className="text-[hsl(0_0%_50%)] text-xs">Date</TableHead>
                    <TableHead className="text-[hsl(0_0%_50%)] text-xs">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentMessages.map(m => (
                    <TableRow key={m.id} className="border-[hsl(0_0%_93%)]">
                      <TableCell className="text-sm text-[hsl(0_0%_20%)] font-medium py-3">{m.name}</TableCell>
                      <TableCell className="text-sm text-[hsl(0_0%_40%)] py-3">{m.subject}</TableCell>
                      <TableCell className="text-sm text-[hsl(0_0%_50%)] py-3">
                        {m.createdAt ? new Date(m.createdAt).toLocaleDateString() : '—'}
                      </TableCell>
                      <TableCell className="py-3">
                        <Badge variant="outline" className={`text-[10px] ${statusColor[m.status] ?? ''}`}>
                          {m.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                  {recentMessages.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-8 text-[hsl(0_0%_50%)] text-sm">
                        No messages yet.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card className="bg-white border-[hsl(0_0%_90%)] shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-medium text-[hsl(0_0%_15%)]">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button asChild className="w-full bg-[hsl(43_50%_54%)] hover:bg-[hsl(43_50%_48%)] text-[hsl(0_0%_4%)] font-medium">
              <Link to="/admin/properties/new"><Plus className="h-4 w-4 mr-2" />Add Property</Link>
            </Button>
            <Button asChild variant="outline" className="w-full border-[hsl(0_0%_85%)] text-[hsl(0_0%_30%)] hover:bg-[hsl(0_0%_96%)]">
              <Link to="/admin/blog/new"><Plus className="h-4 w-4 mr-2" />New Blog Post</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
