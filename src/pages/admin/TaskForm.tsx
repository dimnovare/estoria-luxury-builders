import { useState, useEffect, useId } from 'react';
import { useTranslation } from 'react-i18next';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import EntityLinkPicker from '@/components/admin/EntityLinkPicker';
import { useTask, useCreateTask, useUpdateTask, type TaskPriority, type TaskRecurrence, type CreateTaskDto } from '@/hooks/api/useTasks';
import { useContactSearch, useAgents } from '@/hooks/api/useCrm';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { handleCrmError } from '@/hooks/api/useCrm';
import { Loader2 } from 'lucide-react';

const PRIORITIES: TaskPriority[] = ['Low', 'Normal', 'High'];
const RECURRENCES: TaskRecurrence[] = ['None', 'Daily', 'Weekly', 'Monthly'];

interface TaskFormProps {
  taskId?: string;
  open: boolean;
  onClose: () => void;
  /** Pre-fill linked entity */
  defaultContactId?: string;
  defaultDealId?: string;
  defaultPropertyId?: string;
}

export default function TaskForm({ taskId, open, onClose, defaultContactId, defaultDealId, defaultPropertyId }: TaskFormProps) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const fieldId = useId();
  const isEdit = !!taskId;

  const { data: existingTask, isLoading: loadingTask } = useTask(taskId);
  const { data: agents } = useAgents();
  const createMutation = useCreateTask();
  const updateMutation = useUpdateTask();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueAt, setDueAt] = useState('');
  const [priority, setPriority] = useState<TaskPriority>('Normal');
  const [assignedToId, setAssignedToId] = useState(user?.id ?? '');
  const [reminderAt, setReminderAt] = useState('');
  const [recurrence, setRecurrence] = useState<TaskRecurrence>('None');

  // Link tabs
  const [linkType, setLinkType] = useState<'contact' | 'deal' | 'property'>(
    defaultContactId ? 'contact' : defaultDealId ? 'deal' : 'contact'
  );
  const [contactId, setContactId] = useState(defaultContactId ?? '');
  const [dealId, setDealId] = useState(defaultDealId ?? '');
  const [propertyId, setPropertyId] = useState(defaultPropertyId ?? '');

  // Contact search
  const [contactSearch, setContactSearch] = useState('');
  const { data: contactResults } = useContactSearch(contactSearch);

  // Populate on edit
  useEffect(() => {
    if (existingTask) {
      setTitle(existingTask.title);
      setDescription(existingTask.description ?? '');
      setDueAt(existingTask.dueAt?.slice(0, 16) ?? '');
      setPriority(existingTask.priority);
      setAssignedToId(existingTask.assignedToUserId);
      setReminderAt(existingTask.reminderAt?.slice(0, 16) ?? '');
      setRecurrence(existingTask.recurrence ?? 'None');
      if (existingTask.contactId) { setLinkType('contact'); setContactId(existingTask.contactId); }
      else if (existingTask.dealId) { setLinkType('deal'); setDealId(existingTask.dealId); }
      else if (existingTask.propertyId) { setLinkType('property'); setPropertyId(existingTask.propertyId); }
    }
  }, [existingTask]);

  const handleSubmit = async () => {
    if (!title.trim() || !dueAt) {
      toast.error(t('admin.tasks.toast.requiredFields'));
      return;
    }
    if (reminderAt && new Date(reminderAt) > new Date(dueAt)) {
      toast.error(t('admin.tasks.toast.reminderBeforeDue'));
      return;
    }

    const dto: CreateTaskDto = {
      title: title.trim(),
      description: description.trim() || undefined,
      dueAt: new Date(dueAt).toISOString(),
      priority,
      assignedToUserId: assignedToId,
      reminderAt: reminderAt ? new Date(reminderAt).toISOString() : undefined,
      recurrence: recurrence !== 'None' ? recurrence : undefined,
      contactId: linkType === 'contact' && contactId ? contactId : undefined,
      dealId: linkType === 'deal' && dealId ? dealId : undefined,
      propertyId: linkType === 'property' && propertyId ? propertyId : undefined,
    };

    try {
      if (isEdit) {
        await updateMutation.mutateAsync({ id: taskId!, dto });
        toast.success(t('admin.tasks.toast.updated'));
      } else {
        await createMutation.mutateAsync(dto);
        toast.success(t('admin.tasks.toast.created'));
      }
      onClose();
    } catch (err) {
      handleCrmError(err, t('admin.tasks.toast.saveFailed'));
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  // Visual-only asterisk for required fields. aria-hidden so screen readers
  // rely on the input's own state instead of reading the "*".
  const RequiredMark = () => <span aria-hidden="true" className="text-destructive ml-0.5">*</span>;

  return (
    <Dialog open={open} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto bg-card text-foreground">
        <DialogHeader>
          <DialogTitle>{isEdit ? t('admin.tasks.editTitle') : t('admin.tasks.newTitle')}</DialogTitle>
        </DialogHeader>

        {isEdit && loadingTask ? (
          <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>
        ) : (
          <div className="space-y-4">
            {/* Title */}
            <div>
              <Label htmlFor={`${fieldId}-title`} className="font-nav text-xs uppercase tracking-wider text-muted-foreground">{t('admin.common.title')}<RequiredMark /></Label>
              <Input id={`${fieldId}-title`} value={title} onChange={(e) => setTitle(e.target.value)} autoComplete="off" className="mt-1 h-11 bg-card border-border text-foreground placeholder:text-muted-foreground" />
            </div>

            {/* Description */}
            <div>
              <Label htmlFor={`${fieldId}-description`} className="font-nav text-xs uppercase tracking-wider text-muted-foreground">{t('admin.tasks.fields.description')}</Label>
              <Textarea id={`${fieldId}-description`} value={description} onChange={(e) => setDescription(e.target.value)} className="mt-1 bg-card border-border text-foreground placeholder:text-muted-foreground" rows={3} />
            </div>

            {/* Due At */}
            <div>
              <Label htmlFor={`${fieldId}-dueAt`} className="font-nav text-xs uppercase tracking-wider text-muted-foreground">{t('admin.tasks.fields.dueAt')}<RequiredMark /></Label>
              <Input id={`${fieldId}-dueAt`} type="datetime-local" value={dueAt} onChange={(e) => setDueAt(e.target.value)} className="mt-1 h-11 bg-card border-border text-foreground placeholder:text-muted-foreground" />
            </div>

            {/* Priority segmented */}
            <div>
              <Label className="font-nav text-xs uppercase tracking-wider text-muted-foreground">{t('admin.tasks.fields.priority')}</Label>
              <div className="flex gap-1 mt-1">
                {PRIORITIES.map(p => (
                  <Button
                    key={p}
                    type="button"
                    variant={priority === p ? 'default' : 'outline'}
                    size="sm"
                    className={priority === p ? 'bg-primary text-primary-foreground' : 'bg-card border-border text-foreground hover:bg-muted hover:text-foreground'}
                    onClick={() => setPriority(p)}
                  >
                    {t(`admin.tasks.priority.${p}`)}
                  </Button>
                ))}
              </div>
            </div>

            {/* Assigned To */}
            <div>
              <Label htmlFor={`${fieldId}-assignedTo`} className="font-nav text-xs uppercase tracking-wider text-muted-foreground">{t('admin.tasks.fields.assignedTo')}</Label>
              <Select value={assignedToId} onValueChange={setAssignedToId}>
                <SelectTrigger id={`${fieldId}-assignedTo`} className="mt-1 bg-card border-border text-foreground placeholder:text-muted-foreground"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(agents ?? []).map(a => (
                    <SelectItem key={a.id} value={a.id}>{a.fullName}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Linked to */}
            <div>
              <Label className="font-nav text-xs uppercase tracking-wider text-muted-foreground">{t('admin.tasks.fields.linkedTo')}</Label>
              <Tabs value={linkType} onValueChange={(v) => setLinkType(v as typeof linkType)} className="mt-1">
                <TabsList className="bg-muted">
                  <TabsTrigger value="contact">{t('admin.tasks.link.contact')}</TabsTrigger>
                  <TabsTrigger value="deal">{t('admin.tasks.link.deal')}</TabsTrigger>
                  <TabsTrigger value="property">{t('admin.tasks.link.property')}</TabsTrigger>
                </TabsList>
                <TabsContent value="contact" className="mt-2">
                  <div className="relative">
                    <Input
                      value={contactSearch}
                      onChange={(e) => { setContactSearch(e.target.value); setContactId(''); }}
                      placeholder={t('admin.deals.fields.searchContact')}
                      className="h-11 bg-card border-border text-foreground placeholder:text-muted-foreground"
                    />
                    {contactResults && contactResults.length > 0 && !contactId && (
                      <div className="absolute z-10 top-full mt-1 w-full bg-card border border-border rounded-md shadow-lg max-h-40 overflow-y-auto">
                        {contactResults.map(c => (
                          <button
                            key={c.id}
                            type="button"
                            className="w-full px-3 py-2 text-left text-sm hover:bg-muted"
                            onClick={() => { setContactId(c.id); setContactSearch(c.fullName); }}
                          >
                            {c.fullName} {c.email ? `· ${c.email}` : ''}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </TabsContent>
                <TabsContent value="deal" className="mt-2">
                  <EntityLinkPicker
                    type="deal"
                    value={dealId || null}
                    onChange={(id) => setDealId(id ?? '')}
                    placeholder={t('admin.tasks.link.dealIdPlaceholder')}
                  />
                  <p className="text-xs text-muted-foreground mt-1.5">
                    {t('admin.tasks.link.dealPickerHelp', 'Optional. Search and select the deal this task relates to, or leave blank if it isn’t about a specific deal.')}
                  </p>
                </TabsContent>
                <TabsContent value="property" className="mt-2">
                  <EntityLinkPicker
                    type="property"
                    value={propertyId || null}
                    onChange={(id) => setPropertyId(id ?? '')}
                    placeholder={t('admin.tasks.link.propertyIdPlaceholder')}
                  />
                  <p className="text-xs text-muted-foreground mt-1.5">
                    {t('admin.tasks.link.propertyPickerHelp', 'Optional. Search and select the property this task relates to, or leave blank if it isn’t about a specific property.')}
                  </p>
                </TabsContent>
              </Tabs>
            </div>

            {/* Reminder */}
            <div>
              <Label htmlFor={`${fieldId}-reminderAt`} className="font-nav text-xs uppercase tracking-wider text-muted-foreground">{t('admin.tasks.fields.reminderAt')}</Label>
              <Input id={`${fieldId}-reminderAt`} type="datetime-local" value={reminderAt} onChange={(e) => setReminderAt(e.target.value)} className="mt-1 h-11 bg-card border-border text-foreground placeholder:text-muted-foreground" />
            </div>

            {/* Recurrence */}
            <div>
              {/* TODO: P2.6 recurrence engine — currently UI-only, backend ignores */}
              <Label htmlFor={`${fieldId}-recurrence`} className="font-nav text-xs uppercase tracking-wider text-muted-foreground">{t('admin.tasks.fields.recurrence')}</Label>
              <Select value={recurrence} onValueChange={(v) => setRecurrence(v as TaskRecurrence)}>
                <SelectTrigger id={`${fieldId}-recurrence`} className="mt-1 bg-card border-border text-foreground placeholder:text-muted-foreground"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {RECURRENCES.map(r => (
                    <SelectItem key={r} value={r}>{t(`admin.tasks.recurrence.${r}`)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose} className="border-border text-foreground bg-card hover:bg-muted">{t('admin.common.cancel')}</Button>
          <Button
            className="bg-primary text-primary-foreground"
            onClick={handleSubmit}
            disabled={isPending}
          >
            {isPending && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
            {t('admin.common.save')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
