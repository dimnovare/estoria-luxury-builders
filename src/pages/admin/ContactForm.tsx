import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, X, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { useContact, useCreateContact, useUpdateContact, useAgents, handleCrmError } from '@/hooks/api/useCrm';
import { toast } from 'sonner';
import { useState } from 'react';

const SOURCES = ['Website', 'Referral', 'SocialMedia', 'ColdCall', 'Event', 'Other'];

const contactSchema = z.object({
  fullName: z.string().min(1).max(200),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().max(50).optional().or(z.literal('')),
  secondaryPhone: z.string().max(50).optional().or(z.literal('')),
  preferredLanguage: z.string().optional(),
  dateOfBirth: z.string().optional().or(z.literal('')),
  address: z.string().max(500).optional().or(z.literal('')),
  company: z.string().max(200).optional().or(z.literal('')),
  position: z.string().max(200).optional().or(z.literal('')),
  isBuyer: z.boolean(),
  isSeller: z.boolean(),
  isTenant: z.boolean(),
  isLandlord: z.boolean(),
  isPartner: z.boolean(),
  source: z.string().optional().or(z.literal('')),
  sourceDetail: z.string().max(500).optional().or(z.literal('')),
  assignedAgentId: z.string().optional().or(z.literal('')),
  consentToMarketing: z.boolean(),
  notes: z.string().max(2000).optional().or(z.literal('')),
});

type ContactFormData = z.infer<typeof contactSchema>;

export default function ContactForm() {
  const { t } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = !!id;

  const { data: existing, isLoading } = useContact(isEdit ? id : undefined);
  const { data: agentsData } = useAgents();
  const agents = agentsData ?? [];
  const createContact = useCreateContact();
  const updateContact = useUpdateContact();

  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState('');

  const { register, handleSubmit, control, reset, formState: { errors } } = useForm<ContactFormData>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      fullName: '',
      email: '',
      phone: '',
      secondaryPhone: '',
      preferredLanguage: 'et',
      dateOfBirth: '',
      address: '',
      company: '',
      position: '',
      isBuyer: false,
      isSeller: false,
      isTenant: false,
      isLandlord: false,
      isPartner: false,
      source: '',
      sourceDetail: '',
      assignedAgentId: '',
      consentToMarketing: false,
      notes: '',
    },
  });

  useEffect(() => {
    if (existing) {
      reset({
        fullName: existing.fullName,
        email: existing.email || '',
        phone: existing.phone || '',
        secondaryPhone: existing.secondaryPhone || '',
        preferredLanguage: existing.preferredLanguage || 'et',
        dateOfBirth: existing.dateOfBirth?.split('T')[0] || '',
        address: existing.address || '',
        company: existing.company || '',
        position: existing.position || '',
        isBuyer: existing.isBuyer,
        isSeller: existing.isSeller,
        isTenant: existing.isTenant,
        isLandlord: existing.isLandlord,
        isPartner: existing.isPartner,
        source: existing.source || '',
        sourceDetail: existing.sourceDetail || '',
        assignedAgentId: existing.assignedAgentId || '',
        consentToMarketing: existing.consentToMarketing,
        notes: existing.notes || '',
      });
      setTags(existing.tags ?? []);
    }
  }, [existing, reset]);

  const addTag = () => {
    const trimmed = newTag.trim();
    if (trimmed && !tags.includes(trimmed)) {
      setTags(prev => [...prev, trimmed]);
    }
    setNewTag('');
  };

  const removeTag = (tag: string) => {
    setTags(prev => prev.filter(t => t !== tag));
  };

  const onSubmit = async (data: ContactFormData) => {
    const dto = {
      ...data,
      email: data.email || undefined,
      phone: data.phone || undefined,
      secondaryPhone: data.secondaryPhone || undefined,
      dateOfBirth: data.dateOfBirth || undefined,
      address: data.address || undefined,
      company: data.company || undefined,
      position: data.position || undefined,
      source: data.source || undefined,
      sourceDetail: data.sourceDetail || undefined,
      assignedAgentId: data.assignedAgentId || undefined,
      notes: data.notes || undefined,
      tags,
    };
    try {
      if (isEdit) {
        await updateContact.mutateAsync({ id, dto });
        toast.success(t('admin.contacts.toast.updated'));
      } else {
        await createContact.mutateAsync(dto);
        toast.success(t('admin.contacts.toast.created'));
      }
      navigate('/admin/contacts');
    } catch (err) {
      handleCrmError(err, t('admin.contacts.toast.saveFailed'));
    }
  };

  if (isEdit && isLoading) {
    return <p className="text-center py-12 text-[hsl(0_0%_50%)]">{t('admin.common.loading')}</p>;
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate('/admin/contacts')} className="text-[hsl(0_0%_50%)] hover:text-[hsl(0_0%_20%)]">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-2xl font-semibold text-[hsl(0_0%_15%)]">
          {isEdit ? t('admin.contacts.editTitle') : t('admin.contacts.newTitle')}
        </h1>
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        <Accordion type="multiple" defaultValue={['identity', 'classification', 'assignment']} className="space-y-4">
          {/* Identity */}
          <AccordionItem value="identity" className="border rounded-lg bg-white border-[hsl(0_0%_90%)] shadow-sm">
            <AccordionTrigger className="px-6 py-4 text-sm font-nav uppercase tracking-wider text-[hsl(0_0%_40%)] hover:no-underline">
              {t('admin.contacts.sections.identity')}
            </AccordionTrigger>
            <AccordionContent className="px-6 pb-6">
              <div className="grid gap-6 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <Label className="font-nav text-xs uppercase tracking-wider text-[hsl(0_0%_50%)]">{t('admin.contacts.fields.fullName')} *</Label>
                  <Input {...register('fullName')} className="mt-1 bg-secondary border-border" />
                  {errors.fullName && <p className="text-xs text-red-500 mt-1">{errors.fullName.message}</p>}
                </div>
                <div>
                  <Label className="font-nav text-xs uppercase tracking-wider text-[hsl(0_0%_50%)]">{t('admin.common.email')}</Label>
                  <Input {...register('email')} type="email" className="mt-1 bg-secondary border-border" />
                </div>
                <div>
                  <Label className="font-nav text-xs uppercase tracking-wider text-[hsl(0_0%_50%)]">{t('admin.common.phone')}</Label>
                  <Input {...register('phone')} className="mt-1 bg-secondary border-border" />
                </div>
                <div>
                  <Label className="font-nav text-xs uppercase tracking-wider text-[hsl(0_0%_50%)]">{t('admin.contacts.fields.secondaryPhone')}</Label>
                  <Input {...register('secondaryPhone')} className="mt-1 bg-secondary border-border" />
                </div>
                <div>
                  <Label className="font-nav text-xs uppercase tracking-wider text-[hsl(0_0%_50%)]">{t('admin.contacts.fields.preferredLang')}</Label>
                  <Controller
                    control={control}
                    name="preferredLanguage"
                    render={({ field }) => (
                      <div className="flex gap-4 mt-2">
                        {['et', 'en', 'ru'].map(lang => (
                          <label key={lang} className="flex items-center gap-1.5 text-sm text-[hsl(0_0%_30%)]">
                            <input type="radio" value={lang} checked={field.value === lang} onChange={() => field.onChange(lang)} className="accent-[hsl(43_50%_54%)]" />
                            {lang.toUpperCase()}
                          </label>
                        ))}
                      </div>
                    )}
                  />
                </div>
                <div>
                  <Label className="font-nav text-xs uppercase tracking-wider text-[hsl(0_0%_50%)]">{t('admin.contacts.fields.dateOfBirth')}</Label>
                  <Input {...register('dateOfBirth')} type="date" className="mt-1 bg-secondary border-border" />
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Address & Company */}
          <AccordionItem value="address" className="border rounded-lg bg-white border-[hsl(0_0%_90%)] shadow-sm">
            <AccordionTrigger className="px-6 py-4 text-sm font-nav uppercase tracking-wider text-[hsl(0_0%_40%)] hover:no-underline">
              {t('admin.contacts.sections.address')}
            </AccordionTrigger>
            <AccordionContent className="px-6 pb-6">
              <div className="grid gap-6 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <Label className="font-nav text-xs uppercase tracking-wider text-[hsl(0_0%_50%)]">{t('admin.contacts.fields.address')}</Label>
                  <Input {...register('address')} className="mt-1 bg-secondary border-border" />
                </div>
                <div>
                  <Label className="font-nav text-xs uppercase tracking-wider text-[hsl(0_0%_50%)]">{t('admin.contacts.fields.company')}</Label>
                  <Input {...register('company')} className="mt-1 bg-secondary border-border" />
                </div>
                <div>
                  <Label className="font-nav text-xs uppercase tracking-wider text-[hsl(0_0%_50%)]">{t('admin.contacts.fields.position')}</Label>
                  <Input {...register('position')} className="mt-1 bg-secondary border-border" />
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Classification */}
          <AccordionItem value="classification" className="border rounded-lg bg-white border-[hsl(0_0%_90%)] shadow-sm">
            <AccordionTrigger className="px-6 py-4 text-sm font-nav uppercase tracking-wider text-[hsl(0_0%_40%)] hover:no-underline">
              {t('admin.contacts.sections.classification')}
            </AccordionTrigger>
            <AccordionContent className="px-6 pb-6">
              <div className="space-y-6">
                <div className="flex flex-wrap gap-6">
                  {(['isBuyer', 'isSeller', 'isTenant', 'isLandlord', 'isPartner'] as const).map(field => (
                    <Controller
                      key={field}
                      control={control}
                      name={field}
                      render={({ field: f }) => (
                        <label className="flex items-center gap-2 text-sm text-[hsl(0_0%_30%)]">
                          <Checkbox checked={f.value} onCheckedChange={f.onChange} />
                          {t(`admin.contacts.fields.${field}`)}
                        </label>
                      )}
                    />
                  ))}
                </div>
                <div className="grid gap-6 sm:grid-cols-2">
                  <div>
                    <Label className="font-nav text-xs uppercase tracking-wider text-[hsl(0_0%_50%)]">{t('admin.contacts.fields.source')}</Label>
                    <Controller
                      control={control}
                      name="source"
                      render={({ field }) => (
                        <Select value={field.value} onValueChange={field.onChange}>
                          <SelectTrigger className="mt-1 bg-secondary border-border">
                            <SelectValue placeholder={t('admin.contacts.fields.selectSource')} />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="">{t('admin.common.all')}</SelectItem>
                            {SOURCES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      )}
                    />
                  </div>
                  <div>
                    <Label className="font-nav text-xs uppercase tracking-wider text-[hsl(0_0%_50%)]">{t('admin.contacts.fields.sourceDetail')}</Label>
                    <Input {...register('sourceDetail')} className="mt-1 bg-secondary border-border" />
                  </div>
                </div>
                <div>
                  <Label className="font-nav text-xs uppercase tracking-wider text-[hsl(0_0%_50%)]">{t('admin.contacts.fields.tags')}</Label>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {tags.map(tag => (
                      <Badge key={tag} variant="outline" className="bg-[hsl(43_50%_54%)]/10 text-[hsl(43_50%_44%)] border-[hsl(43_50%_54%)]/30 gap-1">
                        {tag}
                        <button type="button" onClick={() => removeTag(tag)}><X className="h-3 w-3" /></button>
                      </Badge>
                    ))}
                  </div>
                  <div className="flex gap-2 mt-2">
                    <Input
                      value={newTag}
                      onChange={(e) => setNewTag(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addTag(); } }}
                      placeholder={t('admin.contacts.fields.addTag')}
                      className="bg-secondary border-border flex-1"
                    />
                    <Button type="button" variant="outline" size="icon" onClick={addTag}><Plus className="h-4 w-4" /></Button>
                  </div>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Assignment */}
          <AccordionItem value="assignment" className="border rounded-lg bg-white border-[hsl(0_0%_90%)] shadow-sm">
            <AccordionTrigger className="px-6 py-4 text-sm font-nav uppercase tracking-wider text-[hsl(0_0%_40%)] hover:no-underline">
              {t('admin.contacts.sections.assignment')}
            </AccordionTrigger>
            <AccordionContent className="px-6 pb-6">
              <div>
                <Label className="font-nav text-xs uppercase tracking-wider text-[hsl(0_0%_50%)]">{t('admin.contacts.fields.assignedAgent')}</Label>
                <Controller
                  control={control}
                  name="assignedAgentId"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger className="mt-1 bg-secondary border-border w-full sm:w-[300px]">
                        <SelectValue placeholder={t('admin.contacts.fields.selectAgent')} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">{t('admin.common.all')}</SelectItem>
                        {agents.map(a => <SelectItem key={a.id} value={a.id}>{a.fullName}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Privacy */}
          <AccordionItem value="privacy" className="border rounded-lg bg-white border-[hsl(0_0%_90%)] shadow-sm">
            <AccordionTrigger className="px-6 py-4 text-sm font-nav uppercase tracking-wider text-[hsl(0_0%_40%)] hover:no-underline">
              {t('admin.contacts.sections.privacy')}
            </AccordionTrigger>
            <AccordionContent className="px-6 pb-6">
              <Controller
                control={control}
                name="consentToMarketing"
                render={({ field }) => (
                  <div className="flex items-center gap-3">
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                    <span className="text-sm text-[hsl(0_0%_30%)]">{t('admin.contacts.fields.consentToMarketing')}</span>
                    {existing?.consentToMarketingAt && (
                      <span className="text-xs text-[hsl(0_0%_60%)]">
                        ({new Date(existing.consentToMarketingAt).toLocaleDateString()})
                      </span>
                    )}
                  </div>
                )}
              />
            </AccordionContent>
          </AccordionItem>

          {/* Notes */}
          <AccordionItem value="notes" className="border rounded-lg bg-white border-[hsl(0_0%_90%)] shadow-sm">
            <AccordionTrigger className="px-6 py-4 text-sm font-nav uppercase tracking-wider text-[hsl(0_0%_40%)] hover:no-underline">
              {t('admin.contacts.sections.notes')}
            </AccordionTrigger>
            <AccordionContent className="px-6 pb-6">
              <Textarea {...register('notes')} rows={4} className="bg-secondary border-border" placeholder={t('admin.contacts.fields.notesPlaceholder')} />
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        <div className="flex justify-end gap-3 mt-6">
          <Button type="button" variant="outline" onClick={() => navigate('/admin/contacts')}>{t('admin.common.cancel')}</Button>
          <Button type="submit" className="bg-[hsl(43_50%_54%)] hover:bg-[hsl(43_50%_48%)] text-[hsl(0_0%_4%)]" disabled={createContact.isPending || updateContact.isPending}>
            {t('admin.contacts.saveContact')}
          </Button>
        </div>
      </form>
    </div>
  );
}
