import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Plus, Pencil, Trash2, Globe, EyeOff, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import AdminPageHeader from '@/components/admin/AdminPageHeader';
import { EmptyState } from '@/components/admin/EmptyState';
import { ErrorState } from '@/components/admin/ErrorState';
import { TableSkeleton } from '@/components/admin/TableSkeleton';
import { useAdminBlogPosts, useDeleteBlogPost, useSetBlogPostStatus } from '@/hooks/api/useAdmin';
import { blogStatusLabel } from '@/lib/enumLabels';
import { formatDate } from '@/lib/formatDate';
import { toast } from 'sonner';

export default function AdminBlog() {
  const { t } = useTranslation();
  const { data, isLoading, isError, refetch } = useAdminBlogPosts();
  const deleteBlogPost = useDeleteBlogPost();
  const setStatus = useSetBlogPostStatus();

  const posts = data?.items ?? [];
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);
  const pendingPost = posts.find(p => p.id === pendingDelete);
  const pendingTitle = pendingPost?.translations?.['En']?.title ?? pendingPost?.slug;

  const handleDelete = async (id: string) => {
    try {
      await deleteBlogPost.mutateAsync(id);
      toast.success(t('admin.blog.toast.deleted'));
    } catch {
      toast.error(t('admin.blog.toast.deleteFailed'));
    }
  };

  const handleToggleStatus = async (id: string, currentStatus: string) => {
    const next = currentStatus === 'Published' ? 'Draft' : 'Published';
    try {
      await setStatus.mutateAsync({ id, status: next });
      toast.success(next === 'Published'
        ? t('admin.blog.toast.published')
        : t('admin.blog.toast.unpublished'));
    } catch {
      toast.error(t('admin.blog.toast.statusFailed'));
    }
  };

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title={t('admin.blog.title')}
        subtitle={t('admin.blog.subtitle', 'Write and publish blog articles. Save as Draft to preview before publishing. Each post supports Estonian, English, and Russian content.')}
        action={
          <Button asChild className="shrink-0">
            <Link to="/admin/blog/new"><Plus className="h-4 w-4 mr-2" />{t('admin.blog.addNew')}</Link>
          </Button>
        }
      />

      {isError ? (
        <ErrorState
          description={t('admin.blog.error', 'Could not load blog posts. Please try again.')}
          onRetry={() => refetch()}
        />
      ) : (
      <Card className="bg-card border-border shadow-sm overflow-hidden">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
          {isLoading ? (
            <div className="p-4">
              <TableSkeleton rows={6} cols={5} />
            </div>
          ) : posts.length === 0 ? (
            <EmptyState
              icon={FileText}
              title={t('admin.blog.empty')}
              description={t('admin.blog.emptyDesc', 'Create your first blog post to share news and stories.')}
              action={
                <Button asChild>
                  <Link to="/admin/blog/new"><Plus className="h-4 w-4 mr-2" />{t('admin.blog.addNew')}</Link>
                </Button>
              }
            />
          ) : (
          <Table>
            <TableHeader>
              <TableRow className="border-border">
                <TableHead className="text-muted-foreground text-xs">{t('admin.blog.table.title')}</TableHead>
                <TableHead className="text-muted-foreground text-xs hidden sm:table-cell">{t('admin.blog.table.author')}</TableHead>
                <TableHead className="text-muted-foreground text-xs hidden sm:table-cell">{t('admin.blog.table.status')}</TableHead>
                <TableHead className="text-muted-foreground text-xs hidden sm:table-cell">{t('admin.blog.table.date')}</TableHead>
                <TableHead className="text-muted-foreground text-xs w-20">{t('admin.common.actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {posts.map(p => (
                <TableRow key={p.id} className="border-border">
                  <TableCell className="text-sm text-foreground font-medium max-w-[200px] sm:max-w-[300px] truncate">
                    <div className="truncate">{p.translations?.['En']?.title ?? p.slug}</div>
                    <div className="text-xs text-muted-foreground sm:hidden">
                      {blogStatusLabel(p.status, t)}
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground hidden sm:table-cell">{p.authorName}</TableCell>
                  <TableCell className="hidden sm:table-cell">
                    <Badge
                      variant="outline"
                      className={`text-[10px] ${p.status === 'Published' ? 'bg-success/10 text-success border-success/30' : 'bg-muted text-muted-foreground border-border'}`}
                    >
                      {blogStatusLabel(p.status, t)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground hidden sm:table-cell tabular-nums">
                    {p.publishedAt ? formatDate(p.publishedAt) : p.createdAt ? formatDate(p.createdAt) : '—'}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost" size="icon"
                        className={`h-8 w-8 transition-colors ${p.status === 'Published' ? 'text-success hover:text-amber-600' : 'text-muted-foreground hover:text-success'}`}
                        onClick={() => handleToggleStatus(p.id, p.status)}
                        disabled={setStatus.isPending}
                        title={p.status === 'Published' ? t('admin.blog.unpublish') : t('admin.blog.publish')}
                        aria-label={p.status === 'Published' ? t('admin.blog.unpublish') : t('admin.blog.publish')}
                      >
                        {p.status === 'Published'
                          ? <EyeOff className="h-3.5 w-3.5" />
                          : <Globe className="h-3.5 w-3.5" />}
                      </Button>
                      <Button variant="ghost" size="icon" asChild className="h-8 w-8 text-muted-foreground hover:text-foreground transition-colors">
                        <Link to={`/admin/blog/${p.id}/edit`} title={t('admin.common.edit')} aria-label={t('admin.common.edit')}><Pencil className="h-3.5 w-3.5" /></Link>
                      </Button>
                      <Button
                        variant="ghost" size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive transition-colors"
                        onClick={() => setPendingDelete(p.id)}
                        disabled={deleteBlogPost.isPending}
                        title={t('admin.common.delete')}
                        aria-label={t('admin.common.delete')}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          )}
          </div>
        </CardContent>
      </Card>
      )}

      <ConfirmDialog
        open={!!pendingDelete}
        onOpenChange={(o) => !o && setPendingDelete(null)}
        onConfirm={() => { if (pendingDelete) handleDelete(pendingDelete); setPendingDelete(null); }}
        description={pendingTitle
          ? t('admin.blog.confirmDeleteDesc', 'Delete "{{title}}"? This action can\'t be undone.', { title: pendingTitle })
          : undefined}
      />
    </div>
  );
}
