import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useAdminBlogPosts, useDeleteBlogPost } from '@/hooks/api/useAdmin';
import { blogStatusLabel } from '@/lib/enumLabels';
import { toast } from 'sonner';

export default function AdminBlog() {
  const { t } = useTranslation();
  const { data, isLoading } = useAdminBlogPosts();
  const deleteBlogPost = useDeleteBlogPost();

  const posts = data?.items ?? [];

  const handleDelete = async (id: string) => {
    try {
      await deleteBlogPost.mutateAsync(id);
      toast.success(t('admin.blog.toast.deleted'));
    } catch {
      toast.error(t('admin.blog.toast.deleteFailed'));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold text-[hsl(0_0%_15%)]">{t('admin.blog.title')}</h1>
        <Button asChild className="bg-[hsl(43_50%_54%)] hover:bg-[hsl(43_50%_48%)] text-[hsl(0_0%_4%)]">
          <Link to="/admin/blog/new"><Plus className="h-4 w-4 mr-2" />{t('admin.blog.addNew')}</Link>
        </Button>
      </div>

      <Card className="bg-white border-[hsl(0_0%_90%)] shadow-sm">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-[hsl(0_0%_93%)]">
                <TableHead className="text-[hsl(0_0%_50%)] text-xs">{t('admin.blog.table.title')}</TableHead>
                <TableHead className="text-[hsl(0_0%_50%)] text-xs">{t('admin.blog.table.author')}</TableHead>
                <TableHead className="text-[hsl(0_0%_50%)] text-xs">{t('admin.blog.table.status')}</TableHead>
                <TableHead className="text-[hsl(0_0%_50%)] text-xs">{t('admin.blog.table.date')}</TableHead>
                <TableHead className="text-[hsl(0_0%_50%)] text-xs w-24">{t('admin.common.actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-12 text-[hsl(0_0%_50%)] text-sm">{t('admin.common.loading')}</TableCell>
                </TableRow>
              )}
              {!isLoading && posts.map(p => (
                <TableRow key={p.id} className="border-[hsl(0_0%_93%)]">
                  <TableCell className="text-sm text-[hsl(0_0%_20%)] font-medium max-w-[300px] truncate">
                    {p.translations?.['En']?.title ?? p.slug}
                  </TableCell>
                  <TableCell className="text-sm text-[hsl(0_0%_40%)]">{p.authorName}</TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={`text-[10px] ${p.status === 'Published' ? 'bg-green-100 text-green-700 border-green-200' : 'bg-gray-100 text-gray-600 border-gray-200'}`}
                    >
                      {blogStatusLabel(p.status, t)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-[hsl(0_0%_50%)]">
                    {p.publishedAt ? new Date(p.publishedAt).toLocaleDateString() : p.createdAt ? new Date(p.createdAt).toLocaleDateString() : '—'}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="icon" asChild className="h-8 w-8 text-[hsl(0_0%_50%)] hover:text-[hsl(0_0%_20%)]">
                        <Link to={`/admin/blog/${p.id}/edit`}><Pencil className="h-3.5 w-3.5" /></Link>
                      </Button>
                      <Button
                        variant="ghost" size="icon"
                        className="h-8 w-8 text-[hsl(0_0%_50%)] hover:text-red-500"
                        onClick={() => handleDelete(p.id)}
                        disabled={deleteBlogPost.isPending}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {!isLoading && posts.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-12 text-[hsl(0_0%_50%)] text-sm">{t('admin.blog.empty')}</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
