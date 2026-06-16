import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  ArrowLeft, Pencil, Trash2, Phone as PhoneIcon, Mail, Eye, Home, User,
  StickyNote, Clock, Users, FileSignature, ArrowRightLeft, Settings, Plus,
  Briefcase, Loader2, ListTodo, Building2, ExternalLink, ArrowRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import TaskListInline from '@/components/admin/TaskListInline';
import EntityLinkPicker from '@/components/admin/EntityLinkPicker';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { EmptyState } from '@/components/admin/EmptyState';
import { ErrorState } from '@/components/admin/ErrorState';
import {
  useContact, useDeleteContact, useActivities, useCreateActivity,
  useContactNotes, useCreateNote, useToggleNotePin, useDeleteNote, handleCrmError,
  type Activity, type ActivityType,
} from '@/hooks/api/useCrm';
import {
  useContactConnections, useAddContactCompany, useRemoveContactCompany,
  CONTACT_COMPANY_ROLES, type ContactCompanyRole,
} from '@/hooks/api/useRelationships';
import { toast } from 'sonner';
import { formatDistanceToNow, format } from 'date-fns';

const ACTIVITY_TYPES: ActivityType[] = ['Note', 'Call', 'Email', 'Meeting', 'Viewing', 'OfferMade'];

const activityIcons: Record<string, typeof StickyNote> = {
  Note: StickyNote, Call: PhoneIcon, Email: Mail, Meeting: Users,
  Viewing: Eye, OfferMade: FileSignature, StageChange: ArrowRightLeft,
  ContractEvent: FileSignature, SystemEvent: Settings,
};

export default function ContactDetail() {
  const { t } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();

  const { data: contact, isLoading, isError, refetch } = useContact(id);
  const deleteMutation = useDeleteContact();
  const { data: activitiesData } = useActivities({ contactId: id, pageSize: 50 });
  const { data: notes } = useContactNotes(id);
  const createActivity = useCreateActivity();
  const createNote = useCreateNote();
  const togglePin = useToggleNotePin();
  const deleteNote = useDeleteNote();

  const { data: connections } = useContactConnections(id);
  const addCompany = useAddContactCompany();
  const removeCompany = useRemoveContactCompany();

  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [pendingNoteDelete, setPendingNoteDelete] = useState<string | null>(null);
  const [pendingCompanyUnlink, setPendingCompanyUnlink] = useState<string | null>(null);
  const [linkCompanyId, setLinkCompanyId] = useState<string | null>(null);
  const [linkCompanyRole, setLinkCompanyRole] = useState<ContactCompanyRole>('Owner');
  const [quickNote, setQuickNote] = useState('');
  const [showActivityForm, setShowActivityForm] = useState(false);
  const [activityType, setActivityType] = useState<ActivityType>('Note');
  const [activityTitle, setActivityTitle] = useState('');
  const [activityBody, setActivityBody] = useState('');
  const [activityOutcome, setActivityOutcome] = useState('');
  const [activityDuration, setActivityDuration] = useState('');
  const [noteBody, setNoteBody] = useState('');

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (isError || !contact) {
    return (
      <ErrorState
        description={t('admin.contacts.loadDetailError', 'Could not load this contact. Please try again.')}
        onRetry={() => refetch()}
        className="mt-6"
      />
    );
  }

  const handleDelete = async () => {
    try {
      await deleteMutation.mutateAsync(id!);
      toast.success(t('admin.contacts.toast.deleted'));
      navigate('/admin/contacts');
    } catch (err) {
      handleCrmError(err, t('admin.contacts.toast.deleteFailed'));
    }
  };

  const handleQuickNote = async () => {
    if (!quickNote.trim()) return;
    try {
      await createActivity.mutateAsync({
        type: 'Note', title: quickNote.trim(), contactId: id,
      });
      setQuickNote('');
      toast.success(t('admin.contacts.toast.activityAdded'));
    } catch (err) {
      handleCrmError(err, t('admin.crm.toast.saveFailed'));
    }
  };

  const handleLogActivity = async () => {
    if (!activityTitle.trim()) return;
    try {
      await createActivity.mutateAsync({
        type: activityType, title: activityTitle.trim(), body: activityBody || undefined,
        outcome: activityOutcome || undefined,
        durationMinutes: activityDuration ? parseInt(activityDuration) : undefined,
        contactId: id,
      });
      setShowActivityForm(false);
      setActivityTitle(''); setActivityBody(''); setActivityOutcome(''); setActivityDuration('');
      toast.success(t('admin.contacts.toast.activityAdded'));
    } catch (err) {
      handleCrmError(err, t('admin.crm.toast.saveFailed'));
    }
  };

  const handleAddNote = async () => {
    if (!noteBody.trim()) return;
    try {
      await createNote.mutateAsync({ contactId: id!, dto: { body: noteBody.trim() } });
      setNoteBody('');
      toast.success(t('admin.contacts.toast.noteAdded'));
    } catch (err) {
      handleCrmError(err, t('admin.crm.toast.saveFailed'));
    }
  };

  const handleDeleteNote = (noteId: string) => {
    deleteNote.mutate(
      { contactId: id!, noteId },
      {
        onSuccess: () => toast.success(t('admin.contacts.toast.noteDeleted', 'Note deleted')),
        onError: (err) => handleCrmError(err, t('admin.crm.toast.saveFailed')),
      },
    );
  };

  const handleLinkCompany = () => {
    if (!linkCompanyId) return;
    addCompany.mutate(
      { contactId: id!, companyId: linkCompanyId, role: linkCompanyRole, isPrimary: false },
      {
        onSuccess: () => {
          toast.success(t('admin.relations.toast.linked', 'Company linked'));
          setLinkCompanyId(null);
          setLinkCompanyRole('Owner');
        },
        onError: (err) => handleCrmError(err, t('admin.crm.toast.saveFailed')),
      },
    );
  };

  const handleUnlinkCompany = (linkId: string) => {
    removeCompany.mutate(
      { id: linkId, contactId: id! },
      {
        onSuccess: () => toast.success(t('admin.relations.toast.unlinked', 'Connection removed')),
        onError: (err) => handleCrmError(err, t('admin.relations.confirmRemove')),
      },
    );
  };

  const getInitials = (name: string) => name.split(' ').map(p => p[0]).join('').toUpperCase().slice(0, 2);

  const fmtPrice = (value: number, currency: string) => {
    try {
      return new Intl.NumberFormat(undefined, { style: 'currency', currency, maximumFractionDigits: 0 }).format(value);
    } catch {
      return `${value.toLocaleString()} ${currency}`;
    }
  };

  const linkedCompanies = connections?.companies ?? [];
  const linkedProperties = connections?.properties ?? [];
  const linkedTransactions = connections?.transactions ?? [];

  const activities = activitiesData?.items ?? [];
  const sortedNotes = [...(notes ?? [])].sort((a, b) => {
    if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate('/admin/contacts')} className="text-muted-foreground" aria-label={t('admin.common.back', 'Back')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-2xl font-semibold text-foreground">{contact.fullName}</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT — Contact Card */}
        <div className="lg:sticky lg:top-20 lg:self-start space-y-4">
          <Card className="bg-card border-border shadow-sm">
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center gap-4">
                <div className="h-16 w-16 rounded-full bg-primary/10 border-2 border-primary/30 flex items-center justify-center">
                  <span className="text-lg font-medium text-primary">{getInitials(contact.fullName)}</span>
                </div>
                <div>
                  <h2 className="font-semibold text-foreground">{contact.fullName}</h2>
                  <div className="flex gap-1 text-muted-foreground mt-1">
                    {contact.isBuyer && <Eye className="h-3.5 w-3.5" />}
                    {contact.isSeller && <Home className="h-3.5 w-3.5" />}
                    {contact.isTenant && <User className="h-3.5 w-3.5" />}
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-1.5">
                {(contact.tags ?? []).map(tag => (
                  <Badge key={tag} variant="outline" className="text-[10px] bg-primary/10 text-gold-dark border-primary/30">{tag}</Badge>
                ))}
              </div>

              <div className="space-y-2 text-sm">
                {contact.email && (
                  <a href={`mailto:${contact.email}`} className="flex items-center gap-2 text-muted-foreground hover:text-primary">
                    <Mail className="h-3.5 w-3.5" />{contact.email}
                  </a>
                )}
                {contact.phone && (
                  <a href={`tel:${contact.phone}`} className="flex items-center gap-2 text-muted-foreground hover:text-primary">
                    <PhoneIcon className="h-3.5 w-3.5" />{contact.phone}
                  </a>
                )}
                {contact.assignedAgentName && (
                  <p className="text-muted-foreground">{t('admin.contacts.fields.assignedAgent')}: {contact.assignedAgentName}</p>
                )}
                {contact.source && (
                  <p className="text-muted-foreground">{t('admin.contacts.fields.source')}: {contact.source}</p>
                )}
              </div>

              <div className="flex gap-2 pt-2 border-t border-border">
                <Button variant="outline" size="sm" asChild className="flex-1">
                  <Link to={`/admin/contacts/${id}/edit`}><Pencil className="h-3 w-3 mr-1" />{t('admin.common.edit')}</Link>
                </Button>
                <Button variant="outline" size="sm" className="text-destructive hover:text-destructive" onClick={() => setDeleteConfirm(true)} aria-label={t('admin.common.delete')} title={t('admin.common.delete')}>
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* RIGHT — Workspace */}
        <div className="lg:col-span-2">
          <Tabs defaultValue="timeline">
            <TabsList className="bg-muted flex-wrap h-auto">
              <TabsTrigger value="timeline">{t('admin.contacts.tabs.timeline')}</TabsTrigger>
              <TabsTrigger value="companies">{t('admin.contacts.tabs.companies')}</TabsTrigger>
              <TabsTrigger value="properties">{t('admin.contacts.tabs.properties')}</TabsTrigger>
              <TabsTrigger value="transactions">{t('admin.contacts.tabs.transactions')}</TabsTrigger>
              <TabsTrigger value="notes">{t('admin.contacts.tabs.notes')}</TabsTrigger>
              <TabsTrigger value="tasks">{t('admin.contacts.tabs.tasks')}</TabsTrigger>
            </TabsList>

            {/* Timeline */}
            <TabsContent value="timeline" className="space-y-4 mt-4">
              {/* Quick note */}
              <div className="flex gap-2">
                <Input
                  value={quickNote}
                  onChange={(e) => setQuickNote(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleQuickNote(); }}
                  placeholder={t('admin.contacts.quickNotePlaceholder')}
                  className="bg-background border-border"
                />
                <Button variant="outline" onClick={() => setShowActivityForm(true)}>
                  <Plus className="h-4 w-4 mr-1" />{t('admin.contacts.logActivity')}
                </Button>
              </div>

              {/* Activity composer */}
              {showActivityForm && (
                <Card className="bg-card border-border shadow-sm">
                  <CardContent className="p-4 space-y-3">
                    <div className="grid gap-3 sm:grid-cols-2">
                      <Select value={activityType} onValueChange={(v) => setActivityType(v as ActivityType)}>
                        <SelectTrigger className="bg-secondary border-border">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {ACTIVITY_TYPES.map(at => <SelectItem key={at} value={at}>{t(`admin.activities.types.${at}`)}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      <Input value={activityTitle} onChange={(e) => setActivityTitle(e.target.value)} placeholder={t('admin.common.title')} className="bg-secondary border-border" />
                    </div>
                    <Textarea value={activityBody} onChange={(e) => setActivityBody(e.target.value)} placeholder={t('admin.contacts.activityBodyPlaceholder')} className="bg-secondary border-border" rows={3} />
                    <div className="grid gap-3 sm:grid-cols-2">
                      <Input value={activityOutcome} onChange={(e) => setActivityOutcome(e.target.value)} placeholder={t('admin.contacts.activityOutcome')} className="bg-secondary border-border" />
                      <Input value={activityDuration} onChange={(e) => setActivityDuration(e.target.value)} type="number" placeholder={t('admin.contacts.activityDuration')} className="bg-secondary border-border" />
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" size="sm" onClick={() => setShowActivityForm(false)}>{t('admin.common.cancel')}</Button>
                      <Button size="sm" onClick={handleLogActivity}>{t('admin.common.save')}</Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Timeline entries */}
              <div className="space-y-3">
                {activities.map(a => {
                  const Icon = activityIcons[a.type] || StickyNote;
                  return (
                    <Card key={a.id} className="bg-card border-border shadow-sm">
                      <CardContent className="p-4 flex gap-3">
                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                          <Icon className="h-4 w-4 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-baseline gap-2">
                            <span className="text-sm font-medium text-foreground">{a.title}</span>
                            <span className="text-xs text-muted-foreground">{a.userName}</span>
                            <span className="text-xs text-muted-foreground ml-auto shrink-0 tabular-nums">
                              {formatDistanceToNow(new Date(a.createdAt), { addSuffix: true })}
                            </span>
                          </div>
                          {a.body && <p className="text-sm text-muted-foreground mt-1 whitespace-pre-wrap">{a.body}</p>}
                          {a.outcome && <p className="text-xs text-muted-foreground mt-1">{t('admin.contacts.activityOutcome')}: {a.outcome}</p>}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
                {activities.length === 0 && (
                  <EmptyState
                    icon={Clock}
                    title={t('admin.contacts.noActivities')}
                    description={t('admin.contacts.noActivitiesDescription')}
                  />
                )}
              </div>
            </TabsContent>

            {/* Companies */}
            <TabsContent value="companies" className="space-y-4 mt-4">
              {/* Quick link a company */}
              <Card className="bg-card border-border shadow-sm">
                <CardContent className="p-4 space-y-3">
                  <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
                    <EntityLinkPicker
                      type="company"
                      value={linkCompanyId}
                      onChange={(id) => setLinkCompanyId(id)}
                      placeholder={t('admin.relations.addCompany')}
                    />
                    <Select value={linkCompanyRole} onValueChange={(v) => setLinkCompanyRole(v as ContactCompanyRole)}>
                      <SelectTrigger className="h-11 bg-secondary border-border sm:w-44">
                        <SelectValue placeholder={t('admin.relations.role')} />
                      </SelectTrigger>
                      <SelectContent>
                        {CONTACT_COMPANY_ROLES.map((r) => (
                          <SelectItem key={r} value={r}>{t(`admin.relations.roles.contactCompany.${r}`)}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex justify-end">
                    <Button onClick={handleLinkCompany} disabled={!linkCompanyId || addCompany.isPending} className="h-11">
                      {addCompany.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Plus className="h-4 w-4 mr-2" />}
                      {t('admin.relations.addCompany')}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {linkedCompanies.length === 0 ? (
                <EmptyState
                  icon={Building2}
                  title={t('admin.relations.connectedCompanies')}
                  description={t('admin.companies.emptyDescription')}
                />
              ) : (
                <div className="space-y-2">
                  {linkedCompanies.map((c) => (
                    <Card key={c.linkId} className="bg-card border-border shadow-sm">
                      <CardContent className="p-3 flex items-center gap-3">
                        <div className="h-9 w-9 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
                          <Building2 className="h-4 w-4 text-primary" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <Link to={`/admin/companies/${c.companyId}`} className="text-sm font-medium text-foreground hover:text-primary inline-flex items-center gap-1">
                            <span className="truncate">{c.companyName}</span>
                            <ExternalLink className="h-3 w-3 shrink-0 opacity-60" />
                          </Link>
                          <div className="flex flex-wrap gap-1.5 mt-1">
                            <Badge variant="outline" className="text-[10px] bg-primary/10 text-gold-dark border-primary/30">
                              {t(`admin.relations.roles.contactCompany.${c.role}`)}
                            </Badge>
                            {c.title && (
                              <Badge variant="outline" className="text-[10px] text-muted-foreground border-border">{c.title}</Badge>
                            )}
                            {c.ownershipPercent != null && (
                              <Badge variant="outline" className="text-[10px] text-muted-foreground border-border tabular-nums">{c.ownershipPercent}%</Badge>
                            )}
                            {c.isPrimary && (
                              <Badge variant="outline" className="text-[10px] bg-primary/10 text-gold-dark border-primary/30">{t('admin.relations.primary', 'Primary')}</Badge>
                            )}
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-10 w-10 shrink-0 text-muted-foreground hover:text-destructive"
                          onClick={() => setPendingCompanyUnlink(c.linkId)}
                          aria-label={t('admin.relations.removeLink')}
                          title={t('admin.relations.removeLink')}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Transactions (read-only) */}
            <TabsContent value="transactions" className="space-y-4 mt-4">
              {linkedTransactions.length === 0 ? (
                <EmptyState
                  icon={Briefcase}
                  title={t('admin.relations.transactions')}
                  description={t('admin.contacts.noDealsDescription')}
                />
              ) : (
                <div className="space-y-2">
                  {linkedTransactions.map((tx) => (
                    <Card key={tx.id} className="bg-card border-border shadow-sm">
                      <CardContent className="p-3 flex items-center gap-3">
                        <div className="h-9 w-9 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
                          <Briefcase className="h-4 w-4 text-primary" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <span className="text-sm font-medium text-foreground truncate block">{tx.title}</span>
                          <div className="flex flex-wrap gap-1.5 mt-1">
                            <Badge variant="outline" className="text-[10px] text-muted-foreground border-border">{tx.stage}</Badge>
                            <Badge variant="outline" className="text-[10px] text-muted-foreground border-border">{tx.dealType}</Badge>
                            <Badge variant="outline" className="text-[10px] text-muted-foreground border-border">{tx.side}</Badge>
                          </div>
                        </div>
                        {(tx.soldPrice != null || tx.listingPrice != null) && (
                          <span className="text-sm font-medium text-foreground tabular-nums shrink-0">
                            {fmtPrice((tx.soldPrice ?? tx.listingPrice)!, tx.currency)}
                          </span>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Notes */}
            <TabsContent value="notes" className="space-y-4 mt-4">
              <div className="flex gap-2">
                <Textarea
                  value={noteBody}
                  onChange={(e) => setNoteBody(e.target.value)}
                  placeholder={t('admin.contacts.noteBodyPlaceholder')}
                  className="bg-background border-border"
                  rows={2}
                />
                <Button className="self-end" onClick={handleAddNote} aria-label={t('admin.contacts.addNote', 'Add note')} title={t('admin.contacts.addNote', 'Add note')}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              {sortedNotes.map(n => (
                <Card key={n.id} className={`bg-card border-border shadow-sm ${n.isPinned ? 'border-l-2 border-l-primary' : ''}`}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="prose prose-sm max-w-none text-foreground">
                        <p className="whitespace-pre-wrap">{n.body}</p>
                      </div>
                      <div className="flex gap-1 shrink-0 ml-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-10 w-10"
                          onClick={() => togglePin.mutate({ contactId: id!, noteId: n.id, isPinned: !n.isPinned })}
                          aria-label={n.isPinned ? t('admin.contacts.unpinNote', 'Unpin note') : t('admin.contacts.pinNote', 'Pin note')}
                          title={n.isPinned ? t('admin.contacts.unpinNote', 'Unpin note') : t('admin.contacts.pinNote', 'Pin note')}
                        >
                          <StickyNote className={`h-3.5 w-3.5 ${n.isPinned ? 'text-primary' : 'text-muted-foreground'}`} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-10 w-10 text-muted-foreground hover:text-destructive"
                          onClick={() => setPendingNoteDelete(n.id)}
                          aria-label={t('admin.common.delete')}
                          title={t('admin.common.delete')}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">{n.userName} · <span className="tabular-nums">{format(new Date(n.createdAt), 'dd.MM.yyyy HH:mm')}</span></p>
                  </CardContent>
                </Card>
              ))}
              {sortedNotes.length === 0 && (
                <EmptyState
                  icon={StickyNote}
                  title={t('admin.contacts.noNotes')}
                  description={t('admin.contacts.noNotesDescription')}
                />
              )}
            </TabsContent>

            {/* Tasks */}
            <TabsContent value="tasks" className="mt-4">
              <TaskListInline contactId={id} />
            </TabsContent>

            {/* Linked properties */}
            <TabsContent value="properties" className="space-y-4 mt-4">
              {linkedProperties.length === 0 ? (
                <EmptyState
                  icon={Home}
                  title={t('admin.relations.connectedProperties')}
                  description={t('admin.contacts.propertiesPlaceholder')}
                />
              ) : (
                <div className="space-y-2">
                  {linkedProperties.map((p) => (
                    <Card key={p.linkId} className="bg-card border-border shadow-sm">
                      <CardContent className="p-3 flex items-center gap-3">
                        <div className="h-9 w-9 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
                          <Home className="h-4 w-4 text-primary" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <Link to={`/admin/properties/${p.propertyId}/edit`} className="text-sm font-medium text-foreground hover:text-primary inline-flex items-center gap-1">
                            <span className="truncate">{p.title}</span>
                            <ArrowRight className="h-3 w-3 shrink-0 opacity-60" />
                          </Link>
                          <div className="flex flex-wrap gap-1.5 mt-1">
                            <Badge variant="outline" className="text-[10px] bg-primary/10 text-gold-dark border-primary/30">
                              {t(`admin.relations.roles.propertyContact.${p.role}`)}
                            </Badge>
                            {p.city && (
                              <Badge variant="outline" className="text-[10px] text-muted-foreground border-border">{p.city}</Badge>
                            )}
                            <Badge variant="outline" className="text-[10px] text-muted-foreground border-border">{p.status}</Badge>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Delete confirmation */}
      <Dialog open={deleteConfirm} onOpenChange={setDeleteConfirm}>
        <DialogContent>
          <DialogHeader><DialogTitle>{t('admin.contacts.confirmDelete')}</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">{t('admin.contacts.confirmDeleteDesc')}</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirm(false)}>{t('admin.common.cancel')}</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleteMutation.isPending}>{t('admin.common.delete')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Note delete confirmation */}
      <ConfirmDialog
        open={!!pendingNoteDelete}
        onOpenChange={(o) => !o && setPendingNoteDelete(null)}
        onConfirm={() => {
          if (pendingNoteDelete) handleDeleteNote(pendingNoteDelete);
          setPendingNoteDelete(null);
        }}
        title={t('admin.contacts.confirmDeleteNote', 'Delete this note?')}
      />

      {/* Company unlink confirmation */}
      <ConfirmDialog
        open={!!pendingCompanyUnlink}
        onOpenChange={(o) => !o && setPendingCompanyUnlink(null)}
        onConfirm={() => {
          if (pendingCompanyUnlink) handleUnlinkCompany(pendingCompanyUnlink);
          setPendingCompanyUnlink(null);
        }}
        title={t('admin.relations.confirmRemove')}
      />
    </div>
  );
}
