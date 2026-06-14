import { useId, useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import EntityLinkPicker from '@/components/admin/EntityLinkPicker';
import {
  useDeal, useCreateDeal, useUpdateDeal, useAgents, useContactSearch,
  handleCrmError, DEAL_STAGES, type DealStage,
} from '@/hooks/api/useCrm';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

// Shared base; cross-field rules (close-date future-only on create) are layered on top.
const baseDealSchema = z.object({
  title: z.string().trim().min(3, { message: 'admin.deals.errors.titleMin' }).max(300),
  primaryContactId: z.string().min(1, { message: 'admin.deals.errors.contactRequired' }),
  propertyId: z.string().optional().or(z.literal('')),
  assignedAgentId: z.string().min(1, { message: 'admin.deals.errors.agentRequired' }),
  dealType: z.enum(['Sale', 'Rent']),
  side: z.enum(['BuyerSide', 'SellerSide', 'BothSides']),
  expectedCloseDate: z.string().optional().or(z.literal('')),
  expectedValue: z.string()
    .optional()
    .or(z.literal(''))
    .refine(v => !v || (Number.isFinite(parseFloat(v)) && parseFloat(v) > 0), {
      message: 'admin.deals.errors.expectedValuePositive',
    }),
  currency: z.string().default('EUR'),
  commissionPercent: z.string().optional().or(z.literal('')),
});

const createDealSchema = baseDealSchema.refine(
  d => !d.expectedCloseDate || new Date(d.expectedCloseDate) > new Date(),
  { path: ['expectedCloseDate'], message: 'admin.deals.errors.closeDateFuture' },
);

// On edit we don't re-check future-only, since the deal may already have a past close
// date (or the user is just adjusting unrelated fields).
const editDealSchema = baseDealSchema;

type DealFormData = z.infer<typeof baseDealSchema>;

export default function DealForm() {
  const { t } = useTranslation();
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const isEdit = !!id;
  const fieldId = useId();
  const { user, hasRole } = useAuth();
  const isAdmin = hasRole('Admin');

  const { data: existing, isLoading } = useDeal(isEdit ? id : undefined);
  const { data: agentsData } = useAgents();
  const agents = agentsData ?? [];
  const createDeal = useCreateDeal();
  const updateDeal = useUpdateDeal();

  const [contactSearch, setContactSearch] = useState('');
  const [selectedContactName, setSelectedContactName] = useState('');
  const { data: contactResults } = useContactSearch(contactSearch);

  const { register, handleSubmit, control, reset, setValue, formState: { errors } } = useForm<DealFormData>({
    resolver: zodResolver(isEdit ? editDealSchema : createDealSchema),
    defaultValues: {
      title: '',
      primaryContactId: searchParams.get('contactId') || '',
      propertyId: '',
      assignedAgentId: !isAdmin && user ? user.id : '',
      dealType: 'Sale',
      side: 'BuyerSide',
      expectedCloseDate: '',
      expectedValue: '',
      currency: 'EUR',
      commissionPercent: '',
    },
  });

  useEffect(() => {
    if (existing) {
      reset({
        title: existing.title,
        primaryContactId: existing.primaryContactId,
        propertyId: existing.propertyId || '',
        assignedAgentId: existing.assignedAgentId,
        dealType: existing.dealType,
        side: existing.side,
        expectedCloseDate: existing.expectedCloseDate?.split('T')[0] || '',
        expectedValue: existing.expectedValue?.toString() || '',
        currency: existing.currency,
        commissionPercent: existing.commissionPercent?.toString() || '',
      });
      setSelectedContactName(existing.primaryContactName);
    }
  }, [existing, reset]);

  const onSubmit = async (data: DealFormData) => {
    const dto: Record<string, unknown> = {
      title: data.title,
      primaryContactId: data.primaryContactId,
      propertyId: data.propertyId || undefined,
      assignedAgentId: data.assignedAgentId,
      dealType: data.dealType,
      side: data.side,
      expectedCloseDate: data.expectedCloseDate || undefined,
      expectedValue: data.expectedValue ? parseFloat(data.expectedValue) : undefined,
      currency: data.currency,
      commissionPercent: data.commissionPercent ? parseFloat(data.commissionPercent) : undefined,
    };
    // Note: stage is NOT sent via PUT — use POST /deals/{id}/stage instead
    try {
      if (isEdit) {
        await updateDeal.mutateAsync({ id, dto });
        toast.success(t('admin.deals.toast.updated'));
      } else {
        await createDeal.mutateAsync(dto);
        toast.success(t('admin.deals.toast.created'));
      }
      navigate('/admin/deals');
    } catch (err) {
      handleCrmError(err, t('admin.deals.toast.saveFailed'));
    }
  };

  // Save stays clickable; if zod validation blocks submit we surface a clear
  // toast so a non-technical user on mobile (where the failing field may be
  // off-screen) understands something is missing. Inline field errors still
  // render as before — this only adds the toast.
  const onInvalid = () => {
    toast.error(t('admin.deals.validation.required', 'Please fill in all required fields marked with *.'));
  };

  const isSaving = createDeal.isPending || updateDeal.isPending;

  // Visual-only asterisk for required fields. aria-hidden so screen readers
  // rely on the field's own required semantics rather than reading the "*".
  const RequiredMark = () => <span aria-hidden="true" className="text-destructive ml-0.5">*</span>;

  if (isEdit && isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate('/admin/deals')} className="text-muted-foreground" aria-label={t('admin.common.back', 'Back')} title={t('admin.common.back', 'Back')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-2xl font-semibold text-foreground">
          {isEdit ? t('admin.deals.editTitle') : t('admin.deals.newTitle')}
        </h1>
      </div>

      <form onSubmit={handleSubmit(onSubmit, onInvalid)}>
        <Card className="bg-card border-border shadow-sm">
          <CardContent className="p-6 space-y-6">
            <div>
              <Label htmlFor={`${fieldId}-title`} className="font-nav text-xs uppercase tracking-wider text-muted-foreground">{t('admin.deals.fields.title')}<RequiredMark /></Label>
              <Input id={`${fieldId}-title`} {...register('title')} className="mt-1 bg-secondary border-border text-foreground placeholder:text-muted-foreground" />
              {errors.title && <p className="text-xs text-destructive mt-1">{t(errors.title.message ?? '')}</p>}
            </div>

            {/* Contact autocomplete */}
            <div>
              <Label htmlFor={`${fieldId}-primary-contact`} className="font-nav text-xs uppercase tracking-wider text-muted-foreground">{t('admin.deals.fields.primaryContact')}<RequiredMark /></Label>
              <div className="relative mt-1">
                <Input
                  id={`${fieldId}-primary-contact`}
                  value={selectedContactName || contactSearch}
                  onChange={(e) => { setContactSearch(e.target.value); setSelectedContactName(''); setValue('primaryContactId', ''); }}
                  placeholder={t('admin.deals.fields.searchContact')}
                  className="bg-secondary border-border text-foreground placeholder:text-muted-foreground"
                />
                {contactSearch.length >= 2 && !selectedContactName && contactResults && contactResults.length > 0 && (
                  <div className="absolute z-10 mt-1 w-full bg-card border border-border rounded-md shadow-lg max-h-48 overflow-auto">
                    {contactResults.map(c => (
                      <button
                        key={c.id}
                        type="button"
                        className="w-full text-left px-3 py-2 text-sm hover:bg-muted text-foreground"
                        onClick={() => {
                          setValue('primaryContactId', c.id);
                          setSelectedContactName(c.fullName);
                          setContactSearch('');
                        }}
                      >
                        {c.fullName} {c.email && <span className="text-muted-foreground">({c.email})</span>}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              {errors.primaryContactId && <p className="text-xs text-destructive mt-1">{t(errors.primaryContactId.message ?? 'admin.deals.fields.contactRequired')}</p>}
            </div>

            {/* Linked property (optional) — search & select instead of pasting a raw ID */}
            <div>
              <Label className="font-nav text-xs uppercase tracking-wider text-muted-foreground">
                {t('admin.deals.fields.linkedProperty', 'Linked property')}
              </Label>
              <Controller
                control={control}
                name="propertyId"
                render={({ field }) => (
                  <EntityLinkPicker
                    type="property"
                    value={field.value || null}
                    onChange={(id) => field.onChange(id ?? '')}
                    placeholder={t('admin.deals.fields.searchProperty', 'Search a property…')}
                    className="mt-1"
                  />
                )}
              />
              <p className="text-xs text-muted-foreground mt-1">
                {t('admin.deals.fields.propertyPickerHelp', 'Optional. Search and select the property to link to this deal. Leave empty if there is no property yet.')}
              </p>
            </div>

            {/* Agent — disabled for non-Admin */}
            <div>
              <Label htmlFor={`${fieldId}-assigned-agent`} className="font-nav text-xs uppercase tracking-wider text-muted-foreground">{t('admin.deals.fields.assignedAgent')}<RequiredMark /></Label>
              <Controller
                control={control}
                name="assignedAgentId"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange} disabled={!isAdmin}>
                    <SelectTrigger id={`${fieldId}-assigned-agent`} className="mt-1 bg-secondary border-border text-foreground placeholder:text-muted-foreground">
                      <SelectValue placeholder={t('admin.contacts.fields.selectAgent')} />
                    </SelectTrigger>
                    <SelectContent>
                      {agents.map(a => <SelectItem key={a.id} value={a.id}>{a.fullName}</SelectItem>)}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.assignedAgentId && <p className="text-xs text-destructive mt-1">{t(errors.assignedAgentId.message ?? '')}</p>}
              {!isAdmin && <p className="text-xs text-muted-foreground mt-1">{t('admin.deals.agentLocked', 'This deal is locked to your account. Ask an administrator to reassign it.')}</p>}
            </div>

            <div className="grid gap-6 sm:grid-cols-2">
              <div>
                <Label htmlFor={`${fieldId}-deal-type`} className="font-nav text-xs uppercase tracking-wider text-muted-foreground">{t('admin.deals.fields.dealType')}</Label>
                <Controller
                  control={control}
                  name="dealType"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger id={`${fieldId}-deal-type`} className="mt-1 bg-secondary border-border text-foreground placeholder:text-muted-foreground"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Sale">{t('admin.deals.dealTypes.Sale')}</SelectItem>
                        <SelectItem value="Rent">{t('admin.deals.dealTypes.Rent')}</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
              <div>
                <Label htmlFor={`${fieldId}-side`} className="font-nav text-xs uppercase tracking-wider text-muted-foreground">{t('admin.deals.fields.side')}</Label>
                <Controller
                  control={control}
                  name="side"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger id={`${fieldId}-side`} className="mt-1 bg-secondary border-border text-foreground placeholder:text-muted-foreground"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="BuyerSide">{t('admin.deals.sides.BuyerSide')}</SelectItem>
                        <SelectItem value="SellerSide">{t('admin.deals.sides.SellerSide')}</SelectItem>
                        <SelectItem value="BothSides">{t('admin.deals.sides.BothSides')}</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
            </div>

            <div className="grid gap-6 sm:grid-cols-3">
              <div>
                <Label htmlFor={`${fieldId}-expected-value`} className="font-nav text-xs uppercase tracking-wider text-muted-foreground">{t('admin.deals.fields.expectedValue')}</Label>
                <Input id={`${fieldId}-expected-value`} {...register('expectedValue')} type="number" inputMode="numeric" className="mt-1 bg-secondary border-border text-foreground placeholder:text-muted-foreground" />
                {errors.expectedValue && <p className="text-xs text-destructive mt-1">{t(errors.expectedValue.message ?? '')}</p>}
              </div>
              <div>
                <Label htmlFor={`${fieldId}-currency`} className="font-nav text-xs uppercase tracking-wider text-muted-foreground">{t('admin.deals.fields.currency')}</Label>
                <Input id={`${fieldId}-currency`} {...register('currency')} className="mt-1 bg-secondary border-border text-foreground placeholder:text-muted-foreground" />
              </div>
              <div>
                <Label htmlFor={`${fieldId}-commission-percent`} className="font-nav text-xs uppercase tracking-wider text-muted-foreground">{t('admin.deals.fields.commissionPercent')}</Label>
                <Input id={`${fieldId}-commission-percent`} {...register('commissionPercent')} type="number" step="0.1" inputMode="decimal" className="mt-1 bg-secondary border-border text-foreground placeholder:text-muted-foreground" />
              </div>
            </div>

            <div>
              <Label htmlFor={`${fieldId}-expected-close-date`} className="font-nav text-xs uppercase tracking-wider text-muted-foreground">{t('admin.deals.fields.expectedCloseDate')}</Label>
              <Input id={`${fieldId}-expected-close-date`} {...register('expectedCloseDate')} type="date" className="mt-1 bg-secondary border-border text-foreground placeholder:text-muted-foreground w-auto" />
              {errors.expectedCloseDate && <p className="text-xs text-destructive mt-1">{t(errors.expectedCloseDate.message ?? '')}</p>}
            </div>

            {/* Edit-only: stage info (read-only, use /stage endpoint to change) */}
            {isEdit && existing && (
              <div className="border-t border-border pt-4 space-y-4">
                <p className="text-xs text-muted-foreground">{t('admin.deals.stageHint', 'The stage can only be changed from the deals board or the change-stage button, so every change is recorded in the activity log.')}</p>
                {existing.stage === 'Won' && (
                  <div>
                    <Label className="font-nav text-xs uppercase tracking-wider text-muted-foreground">{t('admin.deals.fields.actualValue')}</Label>
                    <p className="text-sm text-foreground mt-1">€{existing.actualValue?.toLocaleString() ?? '—'}</p>
                  </div>
                )}
                {existing.stage === 'Lost' && (
                  <div>
                    <Label className="font-nav text-xs uppercase tracking-wider text-muted-foreground">{t('admin.deals.fields.lossReason')}</Label>
                    <p className="text-sm text-foreground mt-1">{existing.lossReason || '—'}</p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="flex justify-end gap-3 mt-6">
          <Button type="button" variant="outline" onClick={() => navigate('/admin/deals')}>{t('admin.common.cancel')}</Button>
          <Button type="submit" className="bg-primary hover:bg-primary/90 text-primary-foreground" disabled={isSaving}>
            {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {t('admin.deals.saveDeal')}
          </Button>
        </div>
      </form>
    </div>
  );
}
