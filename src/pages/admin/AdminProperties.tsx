import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Pencil, Archive } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { allMockProperties } from '@/data/mockProperties';
import { toast } from 'sonner';

const statusColors: Record<string, string> = {
  active: 'bg-green-100 text-green-700 border-green-200',
  draft: 'bg-gray-100 text-gray-600 border-gray-200',
  sold: 'bg-blue-100 text-blue-700 border-blue-200',
  archived: 'bg-red-100 text-red-600 border-red-200',
};

export default function AdminProperties() {
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');

  // Mock status for demo
  const properties = allMockProperties.map((p, i) => ({
    ...p,
    status: i === 0 ? 'active' : i === 1 ? 'draft' : i % 5 === 0 ? 'sold' : 'active',
    updatedAt: '2026-03-' + String(28 - i).padStart(2, '0'),
  }));

  const filtered = properties.filter(p => {
    if (statusFilter !== 'all' && p.status !== statusFilter) return false;
    if (typeFilter !== 'all' && p.propertyType !== typeFilter) return false;
    return true;
  });

  const types = [...new Set(allMockProperties.map(p => p.propertyType))];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-[hsl(0_0%_15%)]">Properties</h1>
        <Button asChild className="bg-[hsl(43_50%_54%)] hover:bg-[hsl(43_50%_48%)] text-[hsl(0_0%_4%)]">
          <Link to="/admin/properties/new"><Plus className="h-4 w-4 mr-2" />Add Property</Link>
        </Button>
      </div>

      {/* Filters */}
      <Card className="bg-white border-[hsl(0_0%_90%)] shadow-sm">
        <CardContent className="p-4 flex flex-wrap gap-3">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[160px] border-[hsl(0_0%_85%)] bg-white text-[hsl(0_0%_20%)]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="sold">Sold</SelectItem>
              <SelectItem value="archived">Archived</SelectItem>
            </SelectContent>
          </Select>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-[160px] border-[hsl(0_0%_85%)] bg-white text-[hsl(0_0%_20%)]">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              {types.map(t => (
                <SelectItem key={t} value={t} className="capitalize">{t}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Table */}
      <Card className="bg-white border-[hsl(0_0%_90%)] shadow-sm">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-[hsl(0_0%_93%)]">
                <TableHead className="text-[hsl(0_0%_50%)] text-xs w-12"></TableHead>
                <TableHead className="text-[hsl(0_0%_50%)] text-xs">Title</TableHead>
                <TableHead className="text-[hsl(0_0%_50%)] text-xs">Type</TableHead>
                <TableHead className="text-[hsl(0_0%_50%)] text-xs">Transaction</TableHead>
                <TableHead className="text-[hsl(0_0%_50%)] text-xs">Price</TableHead>
                <TableHead className="text-[hsl(0_0%_50%)] text-xs">Status</TableHead>
                <TableHead className="text-[hsl(0_0%_50%)] text-xs">Updated</TableHead>
                <TableHead className="text-[hsl(0_0%_50%)] text-xs w-24">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map(p => (
                <TableRow key={p.id} className="border-[hsl(0_0%_93%)]">
                  <TableCell className="py-2">
                    <img src={p.imageUrl} alt="" className="h-10 w-14 object-cover rounded" />
                  </TableCell>
                  <TableCell className="text-sm text-[hsl(0_0%_20%)] font-medium">{p.title}</TableCell>
                  <TableCell className="text-sm text-[hsl(0_0%_40%)] capitalize">{p.propertyType}</TableCell>
                  <TableCell className="text-sm text-[hsl(0_0%_40%)] capitalize">{p.transactionType}</TableCell>
                  <TableCell className="text-sm text-[hsl(0_0%_20%)] font-medium">€{p.price.toLocaleString()}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={`text-[10px] capitalize ${statusColors[p.status]}`}>{p.status}</Badge>
                  </TableCell>
                  <TableCell className="text-sm text-[hsl(0_0%_50%)]">{p.updatedAt}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="icon" asChild className="h-8 w-8 text-[hsl(0_0%_50%)] hover:text-[hsl(0_0%_20%)]">
                        <Link to={`/admin/properties/${p.id}/edit`}><Pencil className="h-3.5 w-3.5" /></Link>
                      </Button>
                      <Button
                        variant="ghost" size="icon"
                        className="h-8 w-8 text-[hsl(0_0%_50%)] hover:text-red-500"
                        onClick={() => toast.success('Property archived')}
                      >
                        <Archive className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {filtered.length === 0 && (
            <p className="text-center py-12 text-[hsl(0_0%_50%)] text-sm">No properties match your filters.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
