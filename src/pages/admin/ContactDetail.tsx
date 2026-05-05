import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  ArrowLeft, Pencil, Trash2, Phone as PhoneIcon, Mail, Eye, Home, User,
  StickyNote, Clock, Users, FileSignature, ArrowRightLeft, Settings, Plus,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import {
  useContact, useDeleteContact, useActivities, useCreateActivity,
  useContactNotes, useCreateNote, useToggleNotePin, useDeleteNote, handleCrmError,
  type Activity, type ActivityType,
} from '@/hooks/api/useCrm';
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

  const { data: contact, isLoading } = useContact(id);
  const deleteMutation = useDeleteContact();
  const { data: activitiesData } = useActivities({ contactId: id, pageSize: 50 });
  const { data: notes } = useContactNotes(id);
  const createActivity = useCreateActivity();
  const createNote = useCreateNote();
  const togglePin = useToggleNotePin();
  const deleteNote = useDeleteNote();

  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [quickNote, setQuickNote] = useState('');
  const [showActivityForm, setShowActivityForm] = useState(false);
  const [activityType, setActivityType] = useState<ActivityType>('Note');
  const [activityTitle, setActivityTitle] = useState('');
  const [activityBody, setActivityBody] = useState('');
  const [activityOutcome, setActivityOutcome] = useState('');
  const [activityDuration, setActivityDuration] = useState('');
  const [noteBody, setNoteBody] = useState('');

  if (isLoading || !contact) {
    return <p className="text-center py-12 text-[hsl(0_0%_50%)]">{t('admin.common.loading')}</p>;
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

  const getInitials = (name: string) => name.split(' ').map(p => p[0]).join('').toUpperCase().slice(0, 2);

  const activities = activitiesData?.items ?? [];
  const sortedNotes = [...(notes ?? [])].sort((a, b) => {
    if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate('/admin/contacts')} className="text-[hsl(0_0%_50%)]">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-2xl font-semibold text-[hsl(0_0%_15%)]">{contact.fullName}</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT — Contact Card */}
        <div className="lg:sticky lg:top-20 lg:self-start space-y-4">
          <Card className="bg-white border-[hsl(0_0%_90%)] shadow-sm">
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center gap-4">
                <div className="h-16 w-16 rounded-full bg-[hsl(43_50%_54%)]/10 border-2 border-[hsl(43_50%_54%)]/30 flex items-center justify-center">
                  <span className="text-lg font-medium text-[hsl(43_50%_54%)]">{getInitials(contact.fullName)}</span>
                </div>
                <div>
                  <h2 className="font-semibold text-[hsl(0_0%_15%)]">{contact.fullName}</h2>
                  <div className="flex gap-1 text-[hsl(0_0%_50%)] mt-1">
                    {contact.isBuyer && <Eye className="h-3.5 w-3.5" />}
                    {contact.isSeller && <Home className="h-3.5 w-3.5" />}
                    {contact.isTenant && <User className="h-3.5 w-3.5" />}
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-1.5">
                {(contact.tags ?? []).map(tag => (
                  <Badge key={tag} variant="outline" className="text-[10px] bg-[hsl(43_50%_54%)]/10 text-[hsl(43_50%_44%)] border-[hsl(43_50%_54%)]/30">{tag}</Badge>
                ))}
              </div>

              <div className="space-y-2 text-sm">
                {contact.email && (
                  <a href={`mailto:${contact.email}`} className="flex items-center gap-2 text-[hsl(0_0%_40%)] hover:text-[hsl(43_50%_54%)]">
                    <Mail className="h-3.5 w-3.5" />{contact.email}
                  </a>
                )}
                {contact.phone && (
                  <a href={`tel:${contact.phone}`} className="flex items-center gap-2 text-[hsl(0_0%_40%)] hover:text-[hsl(43_50%_54%)]">
                    <PhoneIcon className="h-3.5 w-3.5" />{contact.phone}
                  </a>
                )}
                {contact.assignedAgentName && (
                  <p className="text-[hsl(0_0%_50%)]">{t('admin.contacts.fields.assignedAgent')}: {contact.assignedAgentName}</p>
                )}
                {contact.source && (
                  <p className="text-[hsl(0_0%_50%)]">{t('admin.contacts.fields.source')}: {contact.source}</p>
                )}
              </div>

              <div className="flex gap-2 pt-2 border-t border-[hsl(0_0%_93%)]">
                <Button variant="outline" size="sm" asChild className="flex-1">
                  <Link to={`/admin/contacts/${id}/edit`}><Pencil className="h-3 w-3 mr-1" />{t('admin.common.edit')}</Link>
                </Button>
                <Button variant="outline" size="sm" className="text-red-500 hover:text-red-600" onClick={() => setDeleteConfirm(true)}>
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* RIGHT — Workspace */}
        <div className="lg:col-span-2">
          <Tabs defaultValue="timeline">
            <TabsList className="bg-[hsl(0_0%_95%)]">
              <TabsTrigger value="timeline">{t('admin.contacts.tabs.timeline')}</TabsTrigger>
              <TabsTrigger value="deals">{t('admin.contacts.tabs.deals')}</TabsTrigger>
              <TabsTrigger value="notes">{t('admin.contacts.tabs.notes')}</TabsTrigger>
              <TabsTrigger value="properties">{t('admin.contacts.tabs.properties')}</TabsTrigger>
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
                  className="bg-white border-[hsl(0_0%_85%)]"
                />
                <Button variant="outline" onClick={() => setShowActivityForm(true)}>
                  <Plus className="h-4 w-4 mr-1" />{t('admin.contacts.logActivity')}
                </Button>
              </div>

              {/* Activity composer */}
              {showActivityForm && (
                <Card className="bg-white border-[hsl(0_0%_90%)] shadow-sm">
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
                      <Button size="sm" className="bg-[hsl(43_50%_54%)] hover:bg-[hsl(43_50%_48%)] text-[hsl(0_0%_4%)]" onClick={handleLogActivity}>{t('admin.common.save')}</Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Timeline entries */}
              <div className="space-y-3">
                {activities.map(a => {
                  const Icon = activityIcons[a.type] || StickyNote;
                  return (
                    <Card key={a.id} className="bg-white border-[hsl(0_0%_90%)] shadow-sm">
                      <CardContent className="p-4 flex gap-3">
                        <div className="h-8 w-8 rounded-full bg-[hsl(43_50%_54%)]/10 flex items-center justify-center shrink-0">
                          <Icon className="h-4 w-4 text-[hsl(43_50%_54%)]" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-baseline gap-2">
                            <span className="text-sm font-medium text-[hsl(0_0%_20%)]">{a.title}</span>
                            <span className="text-xs text-[hsl(0_0%_60%)]">{a.userName}</span>
                            <span className="text-xs text-[hsl(0_0%_60%)] ml-auto shrink-0">
                              {formatDistanceToNow(new Date(a.createdAt), { addSuffix: true })}
                            </span>
                          </div>
                          {a.body && <p className="text-sm text-[hsl(0_0%_40%)] mt-1 whitespace-pre-wrap">{a.body}</p>}
                          {a.outcome && <p className="text-xs text-[hsl(0_0%_50%)] mt-1">{t('admin.contacts.activityOutcome')}: {a.outcome}</p>}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
                {activities.length === 0 && (
                  <p className="text-center py-8 text-[hsl(0_0%_50%)] text-sm">{t('admin.contacts.noActivities')}</p>
                )}
              </div>
            </TabsContent>

            {/* Deals */}
            <TabsContent value="deals" className="mt-4">
              <div className="flex justify-end mb-4">
                <Button asChild variant="outline" className="border-[hsl(43_50%_54%)] text-[hsl(43_50%_54%)]">
                  <Link to={`/admin/deals/new?contactId=${id}`}><Plus className="h-4 w-4 mr-1" />{t('admin.deals.addNew')}</Link>
                </Button>
              </div>
              {/* TODO: fetch deals by contactId and render cards */}
              <p className="text-center py-8 text-[hsl(0_0%_50%)] text-sm">{t('admin.contacts.noDeals')}</p>
            </TabsContent>

            {/* Notes */}
            <TabsContent value="notes" className="space-y-4 mt-4">
              <div className="flex gap-2">
                <Textarea
                  value={noteBody}
                  onChange={(e) => setNoteBody(e.target.value)}
                  placeholder={t('admin.contacts.noteBodyPlaceholder')}
                  className="bg-white border-[hsl(0_0%_85%)]"
                  rows={2}
                />
                <Button className="bg-[hsl(43_50%_54%)] hover:bg-[hsl(43_50%_48%)] text-[hsl(0_0%_4%)] self-end" onClick={handleAddNote}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              {sortedNotes.map(n => (
                <Card key={n.id} className={`bg-white border-[hsl(0_0%_90%)] shadow-sm ${n.isPinned ? 'border-l-2 border-l-[hsl(43_50%_54%)]' : ''}`}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="prose prose-sm max-w-none text-[hsl(0_0%_30%)]">
                        <p className="whitespace-pre-wrap">{n.body}</p>
                      </div>
                      <div className="flex gap-1 shrink-0 ml-2">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => togglePin.mutate({ contactId: id!, noteId: n.id, isPinned: !n.isPinned })}>
                          <StickyNote className={`h-3.5 w-3.5 ${n.isPinned ? 'text-[hsl(43_50%_54%)]' : 'text-[hsl(0_0%_60%)]'}`} />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-[hsl(0_0%_60%)] hover:text-red-500" onClick={() => deleteNote.mutate({ contactId: id!, noteId: n.id })}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                    <p className="text-xs text-[hsl(0_0%_60%)] mt-2">{n.userName} · {format(new Date(n.createdAt), 'dd.MM.yyyy HH:mm')}</p>
                  </CardContent>
                </Card>
              ))}
              {sortedNotes.length === 0 && (
                <p className="text-center py-8 text-[hsl(0_0%_50%)] text-sm">{t('admin.contacts.noNotes')}</p>
              )}
            </TabsContent>

            {/* Properties of interest */}
            <TabsContent value="properties" className="mt-4">
              {/* TODO: P3 — properties of interest linked to this contact */}
              <p className="text-center py-8 text-[hsl(0_0%_50%)] text-sm">{t('admin.contacts.propertiesPlaceholder')}</p>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Delete confirmation */}
      <Dialog open={deleteConfirm} onOpenChange={setDeleteConfirm}>
        <DialogContent>
          <DialogHeader><DialogTitle>{t('admin.contacts.confirmDelete')}</DialogTitle></DialogHeader>
          <p className="text-sm text-[hsl(0_0%_50%)]">{t('admin.contacts.confirmDeleteDesc')}</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirm(false)}>{t('admin.common.cancel')}</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleteMutation.isPending}>{t('admin.common.delete')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
