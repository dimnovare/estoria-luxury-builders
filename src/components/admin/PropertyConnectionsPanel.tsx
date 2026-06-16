import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Users, Building2, ArrowRightLeft, X, Plus, Loader2, Share2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { EmptyState } from '@/components/admin/EmptyState';
import EntityLinkPicker from '@/components/admin/EntityLinkPicker';
import ConnectionsDiagram from '@/components/admin/ConnectionsDiagram';
import {
  usePropertyConnections, useConnectionsGraph,
  useAddPropertyContact, useAddPropertyCompany,
  useRemovePropertyContact, useRemovePropertyCompany,
  useCreateCompany,
  PROPERTY_CONTACT_ROLES, PROPERTY_COMPANY_ROLES,
  type PropertyContactRole, type PropertyCompanyRole,
  type PropertyContactLinkDto, type PropertyCompanyLinkDto, type TransactionDto,
} from '@/hooks/api/useRelationships';
import { useCreateContact } from '@/hooks/api/useCrm';
import { toast } from 'sonner';

interface Props {
  propertyId: string;
}

/** Tokenised role pill. */
function RoleChip({ children }: { children: React.ReactNode }) {
  return (
    <Badge variant="outline" className="text-[10px] bg-primary/10 text-primary border-primary/30">
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

/**
 * Property editor sidebar panel: shows people + companies linked to a property
 * as removable role chips, with quick-add rows for each, plus a read-only
 * transactions summary. Mirrors the CRM card/chip conventions and uses the
 * relationship hooks (which handle cache fan-out + error toasts).
 */
export default function PropertyConnectionsPanel({ propertyId }: Props) {
  const { t } = useTranslation();

  const { data, isLoading, isError, refetch } = usePropertyConnections(propertyId);
  const { data: graph } = useConnectionsGraph('property', propertyId);
  const addContact = useAddPropertyContact();
  const addCompany = useAddPropertyCompany();
  const removeContact = useRemovePropertyContact();
  const removeCompany = useRemovePropertyCompany();
  const createContact = useCreateContact();
  const createCompany = useCreateCompany();

  // Quick-add: person
  const [contactId, setContactId] = useState<string | null>(null);
  const [contactRole, setContactRole] = useState<PropertyContactRole>('Owner');
  const [newContact, setNewContact] = useState(false);
  const [newContactName, setNewContactName] = useState('');
  // Quick-add: company
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [companyRole, setCompanyRole] = useState<PropertyCompanyRole>('OwnerCompany');
  const [newCompany, setNewCompany] = useState(false);
  const [newCompanyName, setNewCompanyName] = useState('');

  // Pending removals (link id + kind) for confirm dialog
  const [pendingRemove, setPendingRemove] =
    useState<{ kind: 'contact' | 'company'; id: string } | null>(null);

  const contacts = data?.contacts ?? [];
  const companies = data?.companies ?? [];
  const transactions = data?.transactions ?? [];

  const handleAddContact = () => {
    if (!contactId) return;
    addContact.mutate(
      { propertyId, contactId, role: contactRole },
      {
        onSuccess: () => {
          setContactId(null);
          setContactRole('Owner');
          toast.success(t('admin.crm.toast.saved', 'Saved'));
        },
      },
    );
  };

  const handleAddCompany = () => {
    if (!companyId) return;
    addCompany.mutate(
      { propertyId, companyId, role: companyRole },
      {
        onSuccess: () => {
          setCompanyId(null);
          setCompanyRole('OwnerCompany');
          toast.success(t('admin.crm.toast.saved', 'Saved'));
        },
      },
    );
  };

  // Create a brand-new person, then link them — so the owner never has to leave
  // the property to add someone who isn't in the system yet.
  const handleCreateAndAddContact = async () => {
    const name = newContactName.trim();
    if (!name) return;
    try {
      const created = await createContact.mutateAsync({ fullName: name, preferredLanguage: 'et' });
      const newId = (created as { id?: string })?.id;
      if (!newId) return;
      await addContact.mutateAsync({ propertyId, contactId: newId, role: contactRole });
      setNewContactName('');
      setNewContact(false);
      setContactRole('Owner');
      toast.success(t('admin.crm.toast.saved', 'Saved'));
    } catch {
      /* the create / link hooks surface their own error toasts */
    }
  };

  const handleCreateAndAddCompany = async () => {
    const name = newCompanyName.trim();
    if (!name) return;
    try {
      const created = await createCompany.mutateAsync({ name });
      if (!created?.id) return;
      await addCompany.mutateAsync({ propertyId, companyId: created.id, role: companyRole });
      setNewCompanyName('');
      setNewCompany(false);
      setCompanyRole('OwnerCompany');
      toast.success(t('admin.crm.toast.saved', 'Saved'));
    } catch {
      /* the create / link hooks surface their own error toasts */
    }
  };

  const confirmRemove = () => {
    if (!pendingRemove) return;
    const { kind, id } = pendingRemove;
    if (kind === 'contact') {
      removeContact.mutate({ id, propertyId });
    } else {
      removeCompany.mutate({ id, propertyId });
    }
    setPendingRemove(null);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-5 w-5 animate-spin text-primary" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="text-center py-8">
        <p className="text-sm text-muted-foreground mb-3">
          {t('admin.relations.loadError', 'Could not load connections.')}
        </p>
        <Button variant="outline" size="sm" onClick={() => refetch()}>
          {t('admin.common.retry', 'Try again')}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ── Connections map ──────────────────────────────────────────── */}
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

      {/* ── Connected people ─────────────────────────────────────────── */}
      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold text-foreground">
            {t('admin.relations.connectedPeople')}
          </h3>
          <span className="text-xs text-muted-foreground tabular-nums">({contacts.length})</span>
        </div>

        {contacts.length === 0 ? (
          <Card className="bg-card border-border shadow-sm">
            <EmptyState
              icon={Users}
              title={t('admin.relations.noContacts', 'No people linked')}
              description={t('admin.relations.noContactsDesc', 'Link an owner, seller, buyer or tenant to this property.')}
              compact
            />
          </Card>
        ) : (
          <div className="space-y-2">
            {contacts.map((c: PropertyContactLinkDto) => (
              <Card key={c.linkId} className="bg-card border-border shadow-sm">
                <CardContent className="p-3 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Link
                        to={`/admin/contacts/${c.contactId}`}
                        className="text-sm font-medium text-foreground hover:text-primary transition-colors truncate"
                      >
                        {c.fullName}
                      </Link>
                      <RoleChip>{t(`admin.relations.roles.propertyContact.${c.role}`)}</RoleChip>
                    </div>
                    {(c.email || c.note) && (
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5 flex-wrap">
                        {c.email && <span className="break-all">{c.email}</span>}
                        {c.note && <span>{c.note}</span>}
                      </div>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-10 w-10 text-muted-foreground hover:text-destructive shrink-0"
                    onClick={() => setPendingRemove({ kind: 'contact', id: c.linkId })}
                    aria-label={t('admin.relations.removeLink')}
                    title={t('admin.relations.removeLink')}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Quick-add person — pick an existing one, or create a new one on the fly */}
        <Card className="bg-card border-border shadow-sm">
          <CardContent className="p-3 space-y-2">
            {newContact ? (
              <Input
                value={newContactName}
                onChange={(e) => setNewContactName(e.target.value)}
                placeholder={t('admin.relations.personNamePlaceholder', 'Full name')}
                className="h-11 bg-secondary border-border"
                aria-label={t('admin.relations.createNewPerson', 'Create a new person')}
              />
            ) : (
              <EntityLinkPicker
                type="contact"
                value={contactId}
                onChange={(id) => setContactId(id)}
                label={t('admin.relations.addPerson')}
              />
            )}
            <div className="flex items-end gap-2">
              <Select value={contactRole} onValueChange={(v) => setContactRole(v as PropertyContactRole)}>
                <SelectTrigger className="h-11 bg-secondary border-border" aria-label={t('admin.relations.role')}>
                  <SelectValue placeholder={t('admin.relations.selectRole', 'Select role')} />
                </SelectTrigger>
                <SelectContent>
                  {PROPERTY_CONTACT_ROLES.map((r) => (
                    <SelectItem key={r} value={r}>
                      {t(`admin.relations.roles.propertyContact.${r}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {newContact ? (
                <Button
                  className="h-11 shrink-0"
                  onClick={handleCreateAndAddContact}
                  disabled={!newContactName.trim() || createContact.isPending || addContact.isPending}
                >
                  {(createContact.isPending || addContact.isPending)
                    ? <Loader2 className="h-4 w-4 animate-spin" />
                    : <Plus className="h-4 w-4 mr-1" />}
                  {t('admin.relations.createAndAdd', 'Create & add')}
                </Button>
              ) : (
                <Button
                  className="h-11 shrink-0"
                  onClick={handleAddContact}
                  disabled={!contactId || addContact.isPending}
                >
                  {addContact.isPending
                    ? <Loader2 className="h-4 w-4 animate-spin" />
                    : <Plus className="h-4 w-4 mr-1" />}
                  {t('admin.relations.add', 'Add')}
                </Button>
              )}
            </div>
            <button
              type="button"
              className="text-xs text-primary hover:underline"
              onClick={() => { setNewContact(!newContact); setContactId(null); setNewContactName(''); }}
            >
              {newContact
                ? t('admin.relations.pickExistingPerson', 'Pick an existing person instead')
                : `+ ${t('admin.relations.createNewPerson', 'Create a new person')}`}
            </button>
          </CardContent>
        </Card>
      </section>

      {/* ── Connected companies ──────────────────────────────────────── */}
      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <Building2 className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold text-foreground">
            {t('admin.relations.connectedCompanies')}
          </h3>
          <span className="text-xs text-muted-foreground tabular-nums">({companies.length})</span>
        </div>

        {companies.length === 0 ? (
          <Card className="bg-card border-border shadow-sm">
            <EmptyState
              icon={Building2}
              title={t('admin.relations.noCompanies', 'No companies linked')}
              description={t('admin.relations.noCompaniesDesc', 'Link an owner, developer or management company to this property.')}
              compact
            />
          </Card>
        ) : (
          <div className="space-y-2">
            {companies.map((co: PropertyCompanyLinkDto) => (
              <Card key={co.linkId} className="bg-card border-border shadow-sm">
                <CardContent className="p-3 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Link
                        to={`/admin/companies/${co.companyId}`}
                        className="text-sm font-medium text-foreground hover:text-primary transition-colors truncate"
                      >
                        {co.name}
                      </Link>
                      <RoleChip>{t(`admin.relations.roles.propertyCompany.${co.role}`)}</RoleChip>
                    </div>
                    {co.note && (
                      <p className="text-xs text-muted-foreground mt-0.5">{co.note}</p>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-10 w-10 text-muted-foreground hover:text-destructive shrink-0"
                    onClick={() => setPendingRemove({ kind: 'company', id: co.linkId })}
                    aria-label={t('admin.relations.removeLink')}
                    title={t('admin.relations.removeLink')}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Quick-add company — pick an existing one, or create a new one on the fly */}
        <Card className="bg-card border-border shadow-sm">
          <CardContent className="p-3 space-y-2">
            {newCompany ? (
              <Input
                value={newCompanyName}
                onChange={(e) => setNewCompanyName(e.target.value)}
                placeholder={t('admin.relations.companyNamePlaceholder', 'Company name')}
                className="h-11 bg-secondary border-border"
                aria-label={t('admin.relations.createNewCompany', 'Create a new company')}
              />
            ) : (
              <EntityLinkPicker
                type="company"
                value={companyId}
                onChange={(id) => setCompanyId(id)}
                label={t('admin.relations.addCompany')}
              />
            )}
            <div className="flex items-end gap-2">
              <Select value={companyRole} onValueChange={(v) => setCompanyRole(v as PropertyCompanyRole)}>
                <SelectTrigger className="h-11 bg-secondary border-border" aria-label={t('admin.relations.role')}>
                  <SelectValue placeholder={t('admin.relations.selectRole', 'Select role')} />
                </SelectTrigger>
                <SelectContent>
                  {PROPERTY_COMPANY_ROLES.map((r) => (
                    <SelectItem key={r} value={r}>
                      {t(`admin.relations.roles.propertyCompany.${r}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {newCompany ? (
                <Button
                  className="h-11 shrink-0"
                  onClick={handleCreateAndAddCompany}
                  disabled={!newCompanyName.trim() || createCompany.isPending || addCompany.isPending}
                >
                  {(createCompany.isPending || addCompany.isPending)
                    ? <Loader2 className="h-4 w-4 animate-spin" />
                    : <Plus className="h-4 w-4 mr-1" />}
                  {t('admin.relations.createAndAdd', 'Create & add')}
                </Button>
              ) : (
                <Button
                  className="h-11 shrink-0"
                  onClick={handleAddCompany}
                  disabled={!companyId || addCompany.isPending}
                >
                  {addCompany.isPending
                    ? <Loader2 className="h-4 w-4 animate-spin" />
                    : <Plus className="h-4 w-4 mr-1" />}
                  {t('admin.relations.add', 'Add')}
                </Button>
              )}
            </div>
            <button
              type="button"
              className="text-xs text-primary hover:underline"
              onClick={() => { setNewCompany(!newCompany); setCompanyId(null); setNewCompanyName(''); }}
            >
              {newCompany
                ? t('admin.relations.pickExistingCompany', 'Pick an existing company instead')
                : `+ ${t('admin.relations.createNewCompany', 'Create a new company')}`}
            </button>
          </CardContent>
        </Card>
      </section>

      {/* ── Transactions (read-only summary) ─────────────────────────── */}
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
              description={t('admin.relations.noTransactionsDesc', 'Deals linked to this property will appear here.')}
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
                  <CardContent className="p-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium text-foreground truncate">{tx.title}</span>
                      <RoleChip>{tx.stage}</RoleChip>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1 flex-wrap tabular-nums">
                      {listing && <span>{t('admin.relations.listingPrice')}: {listing}</span>}
                      {sold && <span>{t('admin.relations.soldPrice')}: {sold}</span>}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </section>

      {/* Remove-link confirmation */}
      <ConfirmDialog
        open={!!pendingRemove}
        onOpenChange={(o) => !o && setPendingRemove(null)}
        onConfirm={confirmRemove}
        title={t('admin.relations.confirmRemove')}
        confirmLabel={t('admin.relations.removeLink')}
      />
    </div>
  );
}
