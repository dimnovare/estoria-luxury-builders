import { useEffect, useId } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import EntityLinkPicker from '@/components/admin/EntityLinkPicker';
import {
  useCompany,
  useCreateCompany,
  useUpdateCompany,
  type CompanyWriteDto,
} from '@/hooks/api/useRelationships';

const companySchema = z.object({
  name: z.string().trim().min(1, { message: 'admin.companies.errors.nameRequired' }).max(200),
  registryCode: z.string().max(100).optional().or(z.literal('')),
  email: z.string().trim().email({ message: 'admin.companies.errors.emailInvalid' }).optional().or(z.literal('')),
  phone: z.string().max(50).optional().or(z.literal('')),
  website: z.string().max(300).optional().or(z.literal('')),
  address: z.string().max(500).optional().or(z.literal('')),
  notes: z.string().max(2000).optional().or(z.literal('')),
  assignedAgentId: z.string().optional().or(z.literal('')),
});

type CompanyFormData = z.infer<typeof companySchema>;

const EMPTY: CompanyFormData = {
  name: '',
  registryCode: '',
  email: '',
  phone: '',
  website: '',
  address: '',
  notes: '',
  assignedAgentId: '',
};

export default function CompanyForm() {
  const { t } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = !!id;
  const fieldId = useId();

  const { data: existing, isLoading } = useCompany(isEdit ? id : undefined);
  const createCompany = useCreateCompany();
  const updateCompany = useUpdateCompany();

  const { register, handleSubmit, control, reset, formState: { errors } } = useForm<CompanyFormData>({
    resolver: zodResolver(companySchema),
    defaultValues: EMPTY,
  });

  useEffect(() => {
    if (existing) {
      reset({
        name: existing.name,
        registryCode: existing.registryCode || '',
        email: existing.email || '',
        phone: existing.phone || '',
        website: existing.website || '',
        address: existing.address || '',
        notes: existing.notes || '',
        assignedAgentId: existing.assignedAgentId || '',
      });
    }
  }, [existing, reset]);

  const onSubmit = async (data: CompanyFormData) => {
    // Drop empty optional strings so the backend treats them as unset.
    const dto: CompanyWriteDto = {
      name: data.name.trim(),
      registryCode: data.registryCode?.trim() || undefined,
      email: data.email?.trim() || undefined,
      phone: data.phone?.trim() || undefined,
      website: data.website?.trim() || undefined,
      address: data.address?.trim() || undefined,
      notes: data.notes?.trim() || undefined,
      assignedAgentId: data.assignedAgentId || undefined,
    };
    try {
      // The mutations surface their own created/updated/saveFailed toasts.
      if (isEdit && id) {
        await updateCompany.mutateAsync({ id, dto });
      } else {
        await createCompany.mutateAsync(dto);
      }
      navigate('/admin/companies');
    } catch {
      // Toast already shown by the hook's onError; stay on the form.
    }
  };

  const isSaving = createCompany.isPending || updateCompany.isPending;

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
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate('/admin/companies')}
          className="text-muted-foreground hover:text-foreground"
          aria-label={t('admin.common.back')}
          title={t('admin.common.back')}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-2xl font-semibold text-foreground">
          {isEdit ? t('admin.companies.editTitle') : t('admin.companies.newTitle')}
        </h1>
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        <Accordion type="multiple" defaultValue={['identity', 'contact', 'assignment']} className="space-y-4">
          {/* Company details */}
          <AccordionItem value="identity" className="border rounded-lg bg-card border-border shadow-sm">
            <AccordionTrigger className="px-6 py-4 text-sm font-nav uppercase tracking-wider text-muted-foreground hover:no-underline">
              {t('admin.companies.sections.identity')}
            </AccordionTrigger>
            <AccordionContent className="px-6 pb-6">
              <div className="grid gap-6 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <Label htmlFor={`${fieldId}-name`} className="font-nav text-xs uppercase tracking-wider text-muted-foreground">
                    {t('admin.companies.fields.name')}<span aria-hidden="true" className="text-destructive ml-0.5">*</span>
                  </Label>
                  <Input
                    id={`${fieldId}-name`}
                    {...register('name')}
                    required
                    aria-required
                    autoComplete="organization"
                    placeholder={t('admin.companies.fields.namePlaceholder')}
                    className="mt-1 h-11 bg-secondary border-border text-foreground"
                  />
                  {errors.name && <p className="text-xs text-destructive mt-1">{t(errors.name.message ?? '')}</p>}
                </div>
                <div>
                  <Label htmlFor={`${fieldId}-registryCode`} className="font-nav text-xs uppercase tracking-wider text-muted-foreground">
                    {t('admin.companies.fields.registryCode')}
                  </Label>
                  <Input
                    id={`${fieldId}-registryCode`}
                    {...register('registryCode')}
                    inputMode="numeric"
                    placeholder={t('admin.companies.fields.registryCodePlaceholder')}
                    className="mt-1 h-11 bg-secondary border-border text-foreground"
                  />
                </div>
                <div>
                  <Label htmlFor={`${fieldId}-website`} className="font-nav text-xs uppercase tracking-wider text-muted-foreground">
                    {t('admin.companies.fields.website')}
                  </Label>
                  <Input
                    id={`${fieldId}-website`}
                    {...register('website')}
                    type="url"
                    inputMode="url"
                    autoComplete="url"
                    placeholder={t('admin.companies.fields.websitePlaceholder')}
                    className="mt-1 h-11 bg-secondary border-border text-foreground"
                  />
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Contact details */}
          <AccordionItem value="contact" className="border rounded-lg bg-card border-border shadow-sm">
            <AccordionTrigger className="px-6 py-4 text-sm font-nav uppercase tracking-wider text-muted-foreground hover:no-underline">
              {t('admin.companies.sections.contact')}
            </AccordionTrigger>
            <AccordionContent className="px-6 pb-6">
              <div className="grid gap-6 sm:grid-cols-2">
                <div>
                  <Label htmlFor={`${fieldId}-email`} className="font-nav text-xs uppercase tracking-wider text-muted-foreground">
                    {t('admin.common.email')}
                  </Label>
                  <Input
                    id={`${fieldId}-email`}
                    {...register('email')}
                    type="email"
                    inputMode="email"
                    autoComplete="email"
                    className="mt-1 h-11 bg-secondary border-border text-foreground"
                  />
                  {errors.email && <p className="text-xs text-destructive mt-1">{t(errors.email.message ?? '')}</p>}
                </div>
                <div>
                  <Label htmlFor={`${fieldId}-phone`} className="font-nav text-xs uppercase tracking-wider text-muted-foreground">
                    {t('admin.common.phone')}
                  </Label>
                  <Input
                    id={`${fieldId}-phone`}
                    {...register('phone')}
                    type="tel"
                    inputMode="tel"
                    autoComplete="tel"
                    className="mt-1 h-11 bg-secondary border-border text-foreground"
                  />
                </div>
                <div className="sm:col-span-2">
                  <Label htmlFor={`${fieldId}-address`} className="font-nav text-xs uppercase tracking-wider text-muted-foreground">
                    {t('admin.companies.fields.address')}
                  </Label>
                  <Input
                    id={`${fieldId}-address`}
                    {...register('address')}
                    autoComplete="street-address"
                    className="mt-1 h-11 bg-secondary border-border text-foreground"
                  />
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Assignment */}
          <AccordionItem value="assignment" className="border rounded-lg bg-card border-border shadow-sm">
            <AccordionTrigger className="px-6 py-4 text-sm font-nav uppercase tracking-wider text-muted-foreground hover:no-underline">
              {t('admin.companies.sections.assignment')}
            </AccordionTrigger>
            <AccordionContent className="px-6 pb-6">
              <Controller
                control={control}
                name="assignedAgentId"
                render={({ field }) => (
                  <EntityLinkPicker
                    type="user"
                    value={field.value || null}
                    onChange={(v) => field.onChange(v ?? '')}
                    label={t('admin.companies.fields.assignedAgent')}
                    className="sm:max-w-md"
                  />
                )}
              />
              <p className="text-xs text-muted-foreground mt-2">{t('admin.companies.fields.assignedAgentHelp')}</p>
            </AccordionContent>
          </AccordionItem>

          {/* Notes */}
          <AccordionItem value="notes" className="border rounded-lg bg-card border-border shadow-sm">
            <AccordionTrigger className="px-6 py-4 text-sm font-nav uppercase tracking-wider text-muted-foreground hover:no-underline">
              {t('admin.companies.sections.notes')}
            </AccordionTrigger>
            <AccordionContent className="px-6 pb-6">
              <Textarea
                {...register('notes')}
                rows={4}
                className="bg-secondary border-border text-foreground"
                placeholder={t('admin.companies.fields.notesPlaceholder')}
              />
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        <div className="flex justify-end gap-3 mt-6">
          <Button type="button" variant="outline" onClick={() => navigate('/admin/companies')}>
            {t('admin.common.cancel')}
          </Button>
          <Button type="submit" className="bg-primary hover:bg-primary/90 text-primary-foreground" disabled={isSaving}>
            {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {t('admin.companies.save')}
          </Button>
        </div>
      </form>
    </div>
  );
}
