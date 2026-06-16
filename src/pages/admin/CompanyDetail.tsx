import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  ArrowLeft, Pencil, Trash2, Mail, Phone as PhoneIcon, Globe, MapPin,
  Building2, Users, Home, ArrowRightLeft, FileText, Download, Loader2, Hash, Share2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { EmptyState } from '@/components/admin/EmptyState';
import { ErrorState } from '@/components/admin/ErrorState';
import ConnectionsDiagram from '@/components/admin/ConnectionsDiagram';
import {
  useCompany, useConnectionsGraph, useDeleteCompany, useDownloadPropertyDocument,
  type CompanyPersonDto, type CompanyPropertyDto, type DocumentDto, type TransactionDto,
} from '@/hooks/api/useRelationships';
import { handleCrmError } from '@/hooks/api/useCrm';
import { toast } from 'sonner';
import { format } from 'date-fns';

/** Pill badge for any relationship role, tokenised (no raw hex). */
function RoleChip({ children }: { children: React.ReactNode }) {
  return (
    <Badge
      variant="outline"
      className="text-[10px] bg-primary/10 text-primary border-primary/30"
    >
      {children}
    </Badge>
  );
}

function formatMoney(amount?: number, currency = 'EUR') {
  if (amount == null) return null;
  try {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency: currency || 'EUR',
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `${amount.toLocaleString()} ${currency}`;
  }
}

export default function CompanyDetail() {
  const { t } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();

  const { data: company, isLoading, isError, refetch } = useCompany(id);
  const { data: graph } = useConnectionsGraph('company', id);
  const deleteMutation = useDeleteCompany();
  const downloadDoc = useDownloadPropertyDocument();

  const [deleteConfirm, setDeleteConfirm] = useState(false);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (isError || !company) {
    return (
      <ErrorState
        description={t('admin.companies.loadDetailError', 'Could not load this company. Please try again.')}
        onRetry={() => refetch()}
        className="mt-6"
      />
    );
  }

  const handleDelete = async () => {
    try {
      await deleteMutation.mutateAsync(id!);
      toast.success(t('admin.companies.toast.deleted'));
      navigate('/admin/companies');
    } catch (err) {
      handleCrmError(err, t('admin.companies.toast.deleteFailed'));
    }
  };

  const handleDownload = (docId: string) => {
    downloadDoc.mutate({ id: docId });
  };

  const people = company.people ?? [];
  const properties = company.properties ?? [];
  const documents = company.documents ?? [];
  const transactions = company.transactions ?? [];

  return (
    <div className="space-y-6">
      {/* Back + title */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate('/admin/companies')}
          className="text-muted-foreground"
          aria-label={t('admin.common.back', 'Back')}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-2xl font-semibold text-foreground">{company.name}</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT — Company card */}
        <div className="lg:sticky lg:top-20 lg:self-start space-y-4">
          <Card className="bg-card border-border shadow-sm">
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center gap-4">
                <div className="h-16 w-16 rounded-xl bg-primary/10 border-2 border-primary/30 flex items-center justify-center shrink-0">
                  <Building2 className="h-7 w-7 text-primary" />
                </div>
                <div className="min-w-0">
                  <h2 className="font-semibold text-foreground truncate">{company.name}</h2>
                  {company.registryCode && (
                    <p className="flex items-center gap-1 text-xs text-muted-foreground mt-1 tabular-nums">
                      <Hash className="h-3 w-3" />{company.registryCode}
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-2 text-sm">
                {company.email && (
                  <a href={`mailto:${company.email}`} className="flex items-center gap-2 text-muted-foreground hover:text-primary break-all">
                    <Mail className="h-3.5 w-3.5 shrink-0" />{company.email}
                  </a>
                )}
                {company.phone && (
                  <a href={`tel:${company.phone}`} className="flex items-center gap-2 text-muted-foreground hover:text-primary">
                    <PhoneIcon className="h-3.5 w-3.5 shrink-0" />{company.phone}
                  </a>
                )}
                {company.website && (
                  <a href={company.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-muted-foreground hover:text-primary break-all">
                    <Globe className="h-3.5 w-3.5 shrink-0" />{company.website}
                  </a>
                )}
                {company.address && (
                  <p className="flex items-center gap-2 text-muted-foreground">
                    <MapPin className="h-3.5 w-3.5 shrink-0" />{company.address}
                  </p>
                )}
                {company.assignedAgentName && (
                  <p className="text-muted-foreground">
                    {t('admin.companies.fields.assignedAgent')}: {company.assignedAgentName}
                  </p>
                )}
              </div>

              {company.notes && (
                <>
                  <Separator />
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">{company.notes}</p>
                </>
              )}

              <div className="flex gap-2 pt-2 border-t border-border">
                <Button variant="outline" size="sm" asChild className="flex-1">
                  <Link to={`/admin/companies/${id}/edit`}>
                    <Pencil className="h-3 w-3 mr-1" />{t('admin.common.edit')}
                  </Link>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-destructive hover:text-destructive"
                  onClick={() => setDeleteConfirm(true)}
                  aria-label={t('admin.common.delete')}
                  title={t('admin.common.delete')}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* RIGHT — Connections */}
        <div className="lg:col-span-2 space-y-6">
          {(graph?.nodes?.length ?? 0) > 1 && (
            <Card className="bg-card border-border shadow-sm">
              <CardContent className="p-3">
                <div className="flex items-center gap-2 mb-1">
                  <Share2 className="h-4 w-4 text-primary" />
                  <h3 className="text-sm font-semibold text-foreground">
                    {t('admin.relations.connectionsMap', 'Connections map')}
                  </h3>
                </div>
                <ConnectionsDiagram nodes={graph!.nodes} edges={graph!.edges} />
              </CardContent>
            </Card>
          )}
          {/* Connected people */}
          <section className="space-y-3">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" />
              <h3 className="text-sm font-semibold text-foreground">
                {t('admin.relations.connectedPeople')}
              </h3>
              <span className="text-xs text-muted-foreground tabular-nums">({people.length})</span>
            </div>
            {people.length === 0 ? (
              <Card className="bg-card border-border shadow-sm">
                <EmptyState
                  icon={Users}
                  title={t('admin.relations.noPeople', 'No people linked')}
                  description={t('admin.relations.noPeopleDesc', 'Link an owner, board member or representative to this company.')}
                  compact
                />
              </Card>
            ) : (
              <div className="space-y-2">
                {people.map((p: CompanyPersonDto) => (
                  <Card key={p.linkId} className="bg-card border-border shadow-sm">
                    <CardContent className="p-4 flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Link
                            to={`/admin/contacts/${p.contactId}`}
                            className="text-sm font-medium text-foreground hover:text-primary transition-colors truncate"
                          >
                            {p.fullName}
                          </Link>
                          <RoleChip>{t(`admin.relations.roles.contactCompany.${p.role}`)}</RoleChip>
                          {p.isPrimary && (
                            <Badge variant="outline" className="text-[10px] bg-secondary text-muted-foreground border-border">
                              {t('admin.relations.primary', 'Primary')}
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1 flex-wrap">
                          {p.title && <span>{p.title}</span>}
                          {p.ownershipPercent != null && (
                            <span className="tabular-nums">{t('admin.relations.ownership')}: {p.ownershipPercent}%</span>
                          )}
                          {p.email && <span className="break-all">{p.email}</span>}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </section>

          {/* Connected properties */}
          <section className="space-y-3">
            <div className="flex items-center gap-2">
              <Home className="h-4 w-4 text-primary" />
              <h3 className="text-sm font-semibold text-foreground">
                {t('admin.relations.connectedProperties')}
              </h3>
              <span className="text-xs text-muted-foreground tabular-nums">({properties.length})</span>
            </div>
            {properties.length === 0 ? (
              <Card className="bg-card border-border shadow-sm">
                <EmptyState
                  icon={Home}
                  title={t('admin.relations.noProperties', 'No properties linked')}
                  description={t('admin.relations.noPropertiesDesc', 'This company is not linked to any property yet.')}
                  compact
                />
              </Card>
            ) : (
              <div className="space-y-2">
                {properties.map((pr: CompanyPropertyDto) => (
                  <Card key={pr.linkId} className="bg-card border-border shadow-sm">
                    <CardContent className="p-4 flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Link
                            to={`/admin/properties/${pr.propertyId}/edit`}
                            className="text-sm font-medium text-foreground hover:text-primary transition-colors truncate"
                          >
                            {pr.title}
                          </Link>
                          <RoleChip>{t(`admin.relations.roles.propertyCompany.${pr.role}`)}</RoleChip>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1 flex-wrap">
                          {pr.city && <span>{pr.city}</span>}
                          {pr.status && <span>{pr.status}</span>}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </section>

          {/* Transactions (read-only) */}
          <section className="space-y-3">
            <div className="flex items-center gap-2">
              <ArrowRightLeft className="h-4 w-4 text-primary" />
              <h3 className="text-sm font-semibold text-foreground">
                {t('admin.relations.transactions')}
              </h3>
              <span className="text-xs text-muted-foreground tabular-nums">({transactions.length})</span>
            </div>
            {transactions.length === 0 ? (
              <Card className="bg-card border-border shadow-sm">
                <EmptyState
                  icon={ArrowRightLeft}
                  title={t('admin.relations.noTransactions', 'No transactions')}
                  description={t('admin.relations.noTransactionsDesc', 'Deals linked to this record will appear here.')}
                  compact
                />
              </Card>
            ) : (
              <div className="space-y-2">
                {transactions.map((tx: TransactionDto) => {
                  const listing = formatMoney(tx.listingPrice, tx.currency);
                  const sold = formatMoney(tx.soldPrice, tx.currency);
                  return (
                    <Card key={tx.id} className="bg-card border-border shadow-sm">
                      <CardContent className="p-4 flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-medium text-foreground truncate">{tx.title}</span>
                            <RoleChip>{tx.stage}</RoleChip>
                          </div>
                          <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1 flex-wrap tabular-nums">
                            {listing && <span>{t('admin.relations.listingPrice')}: {listing}</span>}
                            {sold && <span>{t('admin.relations.soldPrice')}: {sold}</span>}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </section>

          {/* Documents */}
          <section className="space-y-3">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-primary" />
              <h3 className="text-sm font-semibold text-foreground">
                {t('admin.documents.title')}
              </h3>
              <span className="text-xs text-muted-foreground tabular-nums">({documents.length})</span>
            </div>
            {documents.length === 0 ? (
              <Card className="bg-card border-border shadow-sm">
                <EmptyState
                  icon={FileText}
                  title={t('admin.documents.empty')}
                  compact
                />
              </Card>
            ) : (
              <div className="space-y-2">
                {documents.map((doc: DocumentDto) => (
                  <Card key={doc.id} className="bg-card border-border shadow-sm">
                    <CardContent className="p-4 flex items-center justify-between gap-3">
                      <div className="min-w-0 flex items-center gap-3">
                        <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                          <FileText className="h-4 w-4 text-primary" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-medium text-foreground truncate">{doc.fileName}</span>
                            <RoleChip>{t(`admin.documents.categories.${doc.category}`)}</RoleChip>
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5 tabular-nums">
                            {format(new Date(doc.createdAt), 'dd.MM.yyyy')}
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-10 w-10 text-muted-foreground hover:text-primary shrink-0"
                        onClick={() => handleDownload(doc.id)}
                        disabled={downloadDoc.isPending}
                        aria-label={t('admin.documents.download')}
                        title={t('admin.documents.download')}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>

      {/* Delete confirmation */}
      <ConfirmDialog
        open={deleteConfirm}
        onOpenChange={setDeleteConfirm}
        onConfirm={() => { setDeleteConfirm(false); handleDelete(); }}
        title={t('admin.companies.confirmDelete', 'Delete this company?')}
        description={t('admin.companies.confirmDeleteDesc', 'This removes the company and its links. People and properties are not deleted.')}
        confirmLabel={t('admin.common.delete')}
      />
    </div>
  );
}
