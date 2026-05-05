import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useAdminProperties, useDeleteProperty } from '@/hooks/api/useAdmin';
import { propertyTypeLabel, transactionTypeLabel, propertyStatusLabel } from '@/lib/enumLabels';
import { toast } from 'sonner';

const statusColors: Record<string, string> = {
  Active: 'bg-green-100 text-green-700 border-green-200',
  Draft: 'bg-gray-100 text-gray-600 border-gray-200',
  Sold: 'bg-blue-100 text-blue-700 border-blue-200',
  Rented: 'bg-purple-100 text-purple-700 border-purple-200',
  Archived: 'bg-red-100 text-red-600 border-red-200',
};

const STATUS_VALUES = ['Active', 'Draft', 'Sold', 'Rented', 'Archived'] as const;
const TYPE_VALUES = ['Apartment', 'House', 'Commercial', 'Land', 'Office'] as const;

export default function AdminProperties() {
  const { t } = useTranslation();
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');

  const { data, isLoading } = useAdminProperties();
  const deleteProperty = useDeleteProperty();

  const properties = data?.items ?? [];

  const filtered = properties.filter(p => {
    if (statusFilter !== 'all' && p.status !== statusFilter) return false;
    if (typeFilter !== 'all' && p.propertyType !== typeFilter) return false;
    return true;
  });

  const handleDelete = async (id: string) => {
    try {
      await deleteProperty.mutateAsync(id);
      toast.success(t('admin.properties.toast.deleted'));
    } catch {
      toast.error(t('admin.properties.toast.deleteFailed'));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold text-[hsl(0_0%_15%)]">{t('admin.properties.title')}</h1>
        <Button asChild className="bg-[hsl(43_50%_54%)] hover:bg-[hsl(43_50%_48%)] text-[hsl(0_0%_4%)]">
          <Link to="/admin/properties/new"><Plus className="h-4 w-4 mr-2" />{t('admin.properties.addNew')}</Link>
        </Button>
      </div>

      {/* Filters */}
      <Card className="bg-white border-[hsl(0_0%_90%)] shadow-sm">
        <CardContent className="p-4 flex flex-wrap gap-3">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-[160px] border-[hsl(0_0%_85%)] bg-white text-[hsl(0_0%_20%)]">
              <SelectValue placeholder={t('admin.properties.filters.status')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('admin.properties.filters.allStatuses')}</SelectItem>
              {STATUS_VALUES.map(v => (
                <SelectItem key={v} value={v}>{propertyStatusLabel(v, t)}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-full sm:w-[160px] border-[hsl(0_0%_85%)] bg-white text-[hsl(0_0%_20%)]">
              <SelectValue placeholder={t('admin.properties.filters.type')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('admin.properties.filters.allTypes')}</SelectItem>
              {TYPE_VALUES.map(v => (
                <SelectItem key={v} value={v}>{propertyTypeLabel(v, t)}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Table */}
      <Card className="bg-white border-[hsl(0_0%_90%)] shadow-sm overflow-hidden">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-[hsl(0_0%_93%)]">
                <TableHead className="text-[hsl(0_0%_50%)] text-xs w-12 hidden sm:table-cell"></TableHead>
                <TableHead className="text-[hsl(0_0%_50%)] text-xs">{t('admin.properties.table.title')}</TableHead>
                <TableHead className="text-[hsl(0_0%_50%)] text-xs hidden md:table-cell">{t('admin.properties.table.type')}</TableHead>
                <TableHead className="text-[hsl(0_0%_50%)] text-xs hidden md:table-cell">{t('admin.properties.table.transaction')}</TableHead>
                <TableHead className="text-[hsl(0_0%_50%)] text-xs hidden sm:table-cell">{t('admin.properties.table.price')}</TableHead>
                <TableHead className="text-[hsl(0_0%_50%)] text-xs">{t('admin.properties.table.status')}</TableHead>
                <TableHead className="text-[hsl(0_0%_50%)] text-xs w-24">{t('admin.common.actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12 text-[hsl(0_0%_50%)] text-sm">
                    {t('admin.common.loading')}
                  </TableCell>
                </TableRow>
              )}
              {!isLoading && filtered.map(p => (
                <TableRow key={p.id} className="border-[hsl(0_0%_93%)]">
                  <TableCell className="py-2 hidden sm:table-cell">
                    <img
                      src={p.coverImageUrl || '/placeholder.jpg'}
                      alt=""
                      className="h-10 w-14 object-cover rounded"
                    />
                  </TableCell>
                  <TableCell className="text-sm text-[hsl(0_0%_20%)] font-medium">
                    {p.translations?.['En']?.title ?? p.slug}
                  </TableCell>
                  <TableCell className="text-sm text-[hsl(0_0%_40%)] hidden md:table-cell">{propertyTypeLabel(p.propertyType, t)}</TableCell>
                  <TableCell className="text-sm text-[hsl(0_0%_40%)] hidden md:table-cell">{transactionTypeLabel(p.transactionType, t)}</TableCell>
                  <TableCell className="text-sm text-[hsl(0_0%_20%)] font-medium hidden sm:table-cell">
                    €{p.price.toLocaleString()}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={`text-[10px] ${statusColors[p.status] ?? 'bg-gray-100 text-gray-600 border-gray-200'}`}
                    >
                      {propertyStatusLabel(p.status, t)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost" size="icon"
                        asChild
                        className="h-8 w-8 text-[hsl(0_0%_50%)] hover:text-[hsl(0_0%_20%)]"
                      >
                        <Link to={`/admin/properties/${p.id}/edit`}><Pencil className="h-3.5 w-3.5" /></Link>
                      </Button>
                      <Button
                        variant="ghost" size="icon"
                        className="h-8 w-8 text-[hsl(0_0%_50%)] hover:text-red-500"
                        onClick={() => handleDelete(p.id)}
                        disabled={deleteProperty.isPending}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {!isLoading && filtered.length === 0 && (
            <p className="text-center py-12 text-[hsl(0_0%_50%)] text-sm">{t('admin.properties.noMatch')}</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
