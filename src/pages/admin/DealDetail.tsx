import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  ArrowLeft, Pencil, Calendar, DollarSign,
  StickyNote, Phone, Mail, Users, Eye, FileSignature, ArrowRightLeft, Settings,
  Plus, Trash2, UserPlus, Clock, FileText, ListTodo, Loader2,
} from 'lucide-react';
import TaskListInline from '@/components/admin/TaskListInline';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { EmptyState } from '@/components/admin/EmptyState';
import { ErrorState } from '@/components/admin/ErrorState';
import {
  useDeal, useActivities, useCreateActivity, useChangeStage,
  useAddParticipant, useRemoveParticipant, useContactSearch,
  handleCrmError, DEAL_STAGES, PARTICIPANTS_WRITE_ENABLED,
  type DealStage, type ActivityType,
} from '@/hooks/api/useCrm';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { formatDate } from '@/lib/formatDate';

const stageColors: Record<string, string> = {
  Lead: 'bg-gray-100 text-gray-700', Qualified: 'bg-blue-50 text-blue-700',
  Viewing: 'bg-cyan-50 text-cyan-700', Offer: 'bg-amber-50 text-amber-700',
  Negotiation: 'bg-orange-50 text-orange-700', ContractSigned: 'bg-purple-50 text-purple-700',
  ClosingPending: 'bg-indigo-50 text-indigo-700', Won: 'bg-green-50 text-green-700',
  Lost: 'bg-red-50 text-red-700',
};

const activityIcons: Record<string, typeof StickyNote> = {
  Note: StickyNote, Call: Phone, Email: Mail, Meeting: Users,
  Viewing: Eye, OfferMade: FileSignature, StageChange: ArrowRightLeft,
  ContractEvent: FileSignature, SystemEvent: Settings,
};

const ACTIVITY_TYPES: ActivityType[] = ['Note', 'Call', 'Email', 'Meeting', 'Viewing', 'OfferMade'];

export default function DealDetail() {
  const { t } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();

  const { data: deal, isLoading, isError, refetch } = useDeal(id);
  const { data: activitiesData } = useActivities({ dealId: id, pageSize: 50 });
  const createActivity = useCreateActivity();
  const changeStage = useChangeStage();
  const addParticipant = useAddParticipant();
  const removeParticipant = useRemoveParticipant();

  const [showStageModal, setShowStageModal] = useState(false);
  const [targetStage, setTargetStage] = useState<DealStage | ''>('');
  const [actualValue, setActualValue] = useState('');
  const [lossReason, setLossReason] = useState('');

  const [showActivityForm, setShowActivityForm] = useState(false);
  const [activityType, setActivityType] = useState<ActivityType>('Note');
  const [activityTitle, setActivityTitle] = useState('');
  const [activityBody, setActivityBody] = useState('');

  const [showAddParticipant, setShowAddParticipant] = useState(false);
  const [participantSearch, setParticipantSearch] = useState('');
  const [participantRole, setParticipantRole] = useState('');
  const [selectedParticipantId, setSelectedParticipantId] = useState('');
  const [pendingParticipantRemove, setPendingParticipantRemove] = useState<string | null>(null);
  const { data: participantResults } = useContactSearch(participantSearch);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (isError || !deal) {
    return (
      <div className="py-12">
        <ErrorState
          description={t('admin.deals.loadError', 'Could not load this deal.')}
          onRetry={() => refetch()}
        />
      </div>
    );
  }

  const handleStageChange = async () => {
    if (!targetStage) return;
    if (targetStage === 'Won') {
      const v = parseFloat(actualValue);
      if (!Number.isFinite(v) || v <= 0) { toast.error(t('admin.deals.toast.actualValueRequired')); return; }
    }
    if (targetStage === 'Lost' && lossReason.trim().length < 5) { toast.error(t('admin.deals.toast.lossReasonRequired')); return; }
    try {
      await changeStage.mutateAsync({
        id: id!, stage: targetStage,
        actualValue: targetStage === 'Won' ? parseFloat(actualValue) : undefined,
        lossReason: targetStage === 'Lost' ? lossReason.trim() : undefined,
      });
      toast.success(t('admin.deals.toast.stageChanged'));
      setShowStageModal(false);
    } catch (err) { handleCrmError(err, t('admin.deals.toast.stageChangeFailed')); }
  };

  const handleLogActivity = async () => {
    if (!activityTitle.trim()) return;
    try {
      await createActivity.mutateAsync({ type: activityType, title: activityTitle.trim(), body: activityBody || undefined, dealId: id });
      setShowActivityForm(false); setActivityTitle(''); setActivityBody('');
      toast.success(t('admin.contacts.toast.activityAdded'));
    } catch (err) { handleCrmError(err, t('admin.crm.toast.saveFailed')); }
  };

  const handleAddParticipant = async () => {
    if (!selectedParticipantId || !participantRole) return;
    try {
      await addParticipant.mutateAsync({ dealId: id!, dto: { contactId: selectedParticipantId, role: participantRole } });
      setShowAddParticipant(false); setParticipantSearch(''); setSelectedParticipantId(''); setParticipantRole('');
      toast.success(t('admin.deals.toast.participantAdded'));
    } catch (err) { handleCrmError(err, t('admin.crm.toast.saveFailed')); }
  };

  const handleRemoveParticipant = async (participantId: string) => {
    try {
      await removeParticipant.mutateAsync({ dealId: id!, participantId });
      toast.success(t('admin.deals.toast.participantRemoved'));
    } catch (err) { handleCrmError(err, t('admin.crm.toast.saveFailed')); }
  };

  const activities = activitiesData?.items ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate('/admin/deals')} className="text-muted-foreground" aria-label={t('admin.common.back', 'Back')} title={t('admin.common.back', 'Back')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-2xl font-semibold text-foreground">{deal.title}</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT — Deal Card */}
        <div className="lg:sticky lg:top-20 lg:self-start space-y-4">
          <Card className="bg-card border-border shadow-sm">
            <CardContent className="p-6 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <Badge className={stageColors[deal.stage]}>{t(`admin.deals.stages.${deal.stage}`)}</Badge>
                <Button variant="outline" size="sm" onClick={() => setShowStageModal(true)}>
                  {t('admin.deals.changeStage', 'Change stage')}
                </Button>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t('admin.deals.fields.dealType')}</span>
                  <span className="text-foreground">{t(`admin.deals.dealTypes.${deal.dealType}`)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t('admin.deals.fields.side')}</span>
                  <span className="text-foreground">{t(`admin.deals.sides.${deal.side}`)}</span>
                </div>
                {deal.expectedValue && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t('admin.deals.fields.expectedValue')}</span>
                    <span className="text-foreground font-medium tabular-nums">€{deal.expectedValue.toLocaleString()}</span>
                  </div>
                )}
                {deal.actualValue && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t('admin.deals.fields.actualValue')}</span>
                    <span className="text-foreground font-medium tabular-nums">€{deal.actualValue.toLocaleString()}</span>
                  </div>
                )}
                {deal.expectedCloseDate && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t('admin.deals.fields.expectedCloseDate')}</span>
                    <span className="text-foreground tabular-nums">{formatDate(deal.expectedCloseDate)}</span>
                  </div>
                )}
              </div>

              <div className="border-t border-border pt-3 space-y-2 text-sm">
                <Link to={`/admin/contacts/${deal.primaryContactId}`} className="text-primary hover:underline block">
                  {deal.primaryContactName}
                </Link>
                {deal.propertyTitle && (
                  <p className="text-muted-foreground">{deal.propertyTitle}</p>
                )}
                <p className="text-muted-foreground">{deal.assignedAgentName}</p>
              </div>

              <Button variant="outline" size="sm" asChild className="w-full">
                <Link to={`/admin/deals/${id}/edit`}><Pencil className="h-3 w-3 mr-1" />{t('admin.common.edit')}</Link>
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* RIGHT — Workspace */}
        <div className="lg:col-span-2">
          <Tabs defaultValue="timeline">
            <TabsList className="bg-muted">
              <TabsTrigger value="timeline">{t('admin.contacts.tabs.timeline')}</TabsTrigger>
              <TabsTrigger value="participants">{t('admin.deals.tabs.participants')}</TabsTrigger>
              <TabsTrigger value="documents">{t('admin.deals.tabs.documents')}</TabsTrigger>
              <TabsTrigger value="tasks">{t('admin.deals.tabs.tasks')}</TabsTrigger>
            </TabsList>

            <TabsContent value="timeline" className="space-y-4 mt-4">
              <Button variant="outline" onClick={() => setShowActivityForm(true)}>
                <Plus className="h-4 w-4 mr-1" />{t('admin.contacts.logActivity')}
              </Button>

              {showActivityForm && (
                <Card className="bg-card border-border shadow-sm">
                  <CardContent className="p-4 space-y-3">
                    <div className="grid gap-3 sm:grid-cols-2">
                      <Select value={activityType} onValueChange={(v) => setActivityType(v as ActivityType)}>
                        <SelectTrigger className="bg-background border-border text-foreground"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {ACTIVITY_TYPES.map(at => <SelectItem key={at} value={at}>{t(`admin.activities.types.${at}`)}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      <Input value={activityTitle} onChange={(e) => setActivityTitle(e.target.value)} placeholder={t('admin.common.title')} className="bg-background border-border text-foreground placeholder:text-muted-foreground" />
                    </div>
                    <Textarea value={activityBody} onChange={(e) => setActivityBody(e.target.value)} className="bg-background border-border text-foreground placeholder:text-muted-foreground" rows={3} />
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" size="sm" onClick={() => setShowActivityForm(false)}>{t('admin.common.cancel')}</Button>
                      <Button size="sm" onClick={handleLogActivity}>{t('admin.common.save')}</Button>
                    </div>
                  </CardContent>
                </Card>
              )}

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
                          <span className="text-xs text-muted-foreground ml-auto">{formatDistanceToNow(new Date(a.createdAt), { addSuffix: true })}</span>
                        </div>
                        {a.body && <p className="text-sm text-muted-foreground mt-1 whitespace-pre-wrap">{a.body}</p>}
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
            </TabsContent>

            {/* Participants */}
            <TabsContent value="participants" className="mt-4 space-y-4">
              {PARTICIPANTS_WRITE_ENABLED && (
                <Button variant="outline" onClick={() => setShowAddParticipant(true)}>
                  <UserPlus className="h-4 w-4 mr-1" />{t('admin.deals.addParticipant')}
                </Button>
              )}
              {(deal.participants ?? []).map(p => (
                <Card key={p.id} className="bg-card border-border shadow-sm">
                  <CardContent className="p-4 flex items-center justify-between">
                    <div>
                      <Link to={`/admin/contacts/${p.contactId}`} className="text-sm font-medium text-foreground hover:text-primary">{p.contactName}</Link>
                      <p className="text-xs text-muted-foreground">{p.role}</p>
                    </div>
                    {PARTICIPANTS_WRITE_ENABLED && (
                      <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive"
                        onClick={() => setPendingParticipantRemove(p.id)}
                        aria-label={t('admin.deals.removeParticipant', 'Remove participant')}
                        title={t('admin.deals.removeParticipant', 'Remove participant')}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ))}
              {(deal.participants ?? []).length === 0 && (
                <EmptyState
                  icon={Users}
                  title={t('admin.deals.noParticipants')}
                  description={PARTICIPANTS_WRITE_ENABLED ? t('admin.deals.noParticipantsDescription') : undefined}
                />
              )}
            </TabsContent>

            {/* Documents — placeholder */}
            <TabsContent value="documents" className="mt-4">
              {/* TODO: P3 — document management */}
              <EmptyState
                icon={FileText}
                title={t('admin.deals.documentsPlaceholder')}
              />
            </TabsContent>

            {/* Tasks */}
            <TabsContent value="tasks" className="mt-4">
              <TaskListInline dealId={id} />
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Stage change modal */}
      <Dialog open={showStageModal} onOpenChange={setShowStageModal}>
        <DialogContent>
          <DialogHeader><DialogTitle>{t('admin.deals.changeStage', 'Change stage')}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <Select value={targetStage} onValueChange={(v) => setTargetStage(v as DealStage)}>
              <SelectTrigger className="bg-background border-border text-foreground"><SelectValue placeholder={t('admin.deals.selectStage', 'Select stage')} /></SelectTrigger>
              <SelectContent>
                {DEAL_STAGES.filter(s => s !== deal.stage).map(s => (
                  <SelectItem key={s} value={s}>{t(`admin.deals.stages.${s}`)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {targetStage === 'Won' && (
              <div>
                <Label className="font-nav text-xs uppercase tracking-wider text-muted-foreground">{t('admin.deals.fields.actualValue')} *</Label>
                <Input value={actualValue} onChange={(e) => setActualValue(e.target.value)} type="number" className="mt-1 bg-background border-border text-foreground placeholder:text-muted-foreground" />
              </div>
            )}
            {targetStage === 'Lost' && (
              <div>
                <Label className="font-nav text-xs uppercase tracking-wider text-muted-foreground">{t('admin.deals.fields.lossReason')} *</Label>
                <Textarea value={lossReason} onChange={(e) => setLossReason(e.target.value)} className="mt-1 bg-background border-border text-foreground placeholder:text-muted-foreground" rows={3} />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowStageModal(false)}>{t('admin.common.cancel')}</Button>
            <Button onClick={handleStageChange} disabled={!targetStage || changeStage.isPending}>
              {t('admin.deals.confirmStageChange', 'Confirm')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add participant modal */}
      <Dialog open={showAddParticipant} onOpenChange={setShowAddParticipant}>
        <DialogContent>
          <DialogHeader><DialogTitle>{t('admin.deals.addParticipant')}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="relative">
              <Input
                value={participantSearch}
                onChange={(e) => { setParticipantSearch(e.target.value); setSelectedParticipantId(''); }}
                placeholder={t('admin.deals.fields.searchContact')}
                className="bg-background border-border text-foreground placeholder:text-muted-foreground"
              />
              {participantSearch.length >= 2 && !selectedParticipantId && participantResults && participantResults.length > 0 && (
                <div className="absolute z-10 mt-1 w-full bg-card border border-border rounded-md shadow-lg max-h-48 overflow-auto">
                  {participantResults.map(c => (
                    <button key={c.id} type="button" className="w-full text-left px-3 py-2 text-sm text-foreground hover:bg-muted"
                      onClick={() => { setSelectedParticipantId(c.id); setParticipantSearch(c.fullName); }}>
                      {c.fullName}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <Input value={participantRole} onChange={(e) => setParticipantRole(e.target.value)} placeholder={t('admin.deals.fields.participantRole')} className="bg-background border-border text-foreground placeholder:text-muted-foreground" />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddParticipant(false)}>{t('admin.common.cancel')}</Button>
            <Button onClick={handleAddParticipant} disabled={!selectedParticipantId || !participantRole}>
              {t('admin.common.save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Remove participant confirmation */}
      <ConfirmDialog
        open={!!pendingParticipantRemove}
        onOpenChange={(o) => !o && setPendingParticipantRemove(null)}
        onConfirm={() => {
          if (pendingParticipantRemove) handleRemoveParticipant(pendingParticipantRemove);
          setPendingParticipantRemove(null);
        }}
        title={t('admin.deals.confirmRemoveParticipant', 'Remove this participant?')}
        confirmLabel={t('admin.deals.removeParticipant', 'Remove participant')}
      />
    </div>
  );
}
