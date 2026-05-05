import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useAdminSiteSettings, useUpdateSiteSetting, type SiteSettingDto } from '@/hooks/api/useSiteSettingsAdmin';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

// ── Section definitions ─────────────────────────────────────────────────────

interface FieldDef {
  key: string;
  labelKey: string;
  placeholder?: string;
  type?: 'textarea' | 'number' | 'switch';
  badge?: string;
  rows?: number;
  urlWarning?: boolean;
}

interface SectionDef {
  titleKey: string;
  descriptionKey?: string;
  fields: FieldDef[];
}

const SECTIONS: SectionDef[] = [
  {
    titleKey: 'admin.settings.sections.identity',
    fields: [
      { key: 'contact.email', labelKey: 'admin.settings.fields.contactEmail', placeholder: 'info@estoria.estate' },
      { key: 'contact.phone', labelKey: 'admin.settings.fields.phone', placeholder: '+372 …' },
      { key: 'contact.address', labelKey: 'admin.settings.fields.address', type: 'textarea', rows: 3 },
      { key: 'contact.hours', labelKey: 'admin.settings.fields.hours', placeholder: 'Mon–Fri 09:00–18:00' },
    ],
  },
  {
    titleKey: 'admin.settings.sections.social',
    descriptionKey: 'admin.settings.sections.socialHelp',
    fields: [
      { key: 'social.facebook', labelKey: 'admin.settings.fields.facebook', placeholder: 'https://facebook.com/…', urlWarning: true },
      { key: 'social.instagram', labelKey: 'admin.settings.fields.instagram', placeholder: 'https://instagram.com/…', urlWarning: true },
      { key: 'social.linkedin', labelKey: 'admin.settings.fields.linkedin', placeholder: 'https://linkedin.com/…', urlWarning: true },
    ],
  },
  {
    titleKey: 'admin.settings.sections.stats',
    fields: [
      { key: 'stats.years_experience', labelKey: 'admin.settings.fields.yearsExperience', type: 'number' },
      { key: 'stats.satisfaction_percent', labelKey: 'admin.settings.fields.satisfactionPercent', type: 'number' },
      { key: 'watermark.text', labelKey: 'admin.settings.fields.watermarkText', placeholder: 'ESTORIA' },
    ],
  },
  {
    titleKey: 'admin.settings.sections.features',
    descriptionKey: 'admin.settings.sections.featuresHelp',
    fields: [
      { key: 'watermark.enabled', labelKey: 'admin.settings.fields.watermarkEnabled', type: 'switch' },
      { key: 'ai.descriptions_enabled', labelKey: 'admin.settings.fields.aiDescriptions', type: 'switch', badge: 'BETA' },
      { key: 'ai.replies_enabled', labelKey: 'admin.settings.fields.aiReplies', type: 'switch', badge: 'BETA' },
      { key: 'birthday.auto_send', labelKey: 'admin.settings.fields.birthdayAutoSend', type: 'switch' },
      { key: 'savedsearches.auto_send', labelKey: 'admin.settings.fields.savedSearchAutoSend', type: 'switch' },
    ],
  },
];

const KNOWN_KEYS = new Set(SECTIONS.flatMap(s => s.fields.map(f => f.key)));

// ── Single setting row ──────────────────────────────────────────────────────

function SettingRow({ setting, field }: { setting: SiteSettingDto | undefined; field: FieldDef }) {
  const { t } = useTranslation();
  const update = useUpdateSiteSetting();
  const [value, setValue] = useState(setting?.value ?? '');
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setValue(setting?.value ?? '');
  }, [setting?.value]);

  const isSwitch = field.type === 'switch';
  const dirty = value !== (setting?.value ?? '');

  const urlWarningVisible = field.urlWarning && value && !value.startsWith('https://');

  const handleSave = useCallback(async (newVal?: string) => {
    const v = newVal ?? value;
    setError('');

    if (field.type === 'number' && v !== '') {
      const n = parseInt(v, 10);
      if (isNaN(n) || n < 0) {
        setError(t('admin.settings.validation.positiveInteger'));
        return;
      }
    }

    try {
      await update.mutateAsync({ key: field.key, value: v });
      setSaved(true);
      setTimeout(() => setSaved(false), 1500);
    } catch (e: any) {
      setError(e?.response?.data?.detail ?? e?.message ?? t('admin.settings.toast.saveFailed'));
    }
  }, [value, field, update, t]);

  if (isSwitch) {
    const checked = value === 'true';
    return (
      <div className="flex items-center justify-between py-3 border-b border-[hsl(0_0%_93%)] last:border-0">
        <div className="flex items-center gap-2">
          <span className="text-sm text-[hsl(0_0%_20%)]">{t(field.labelKey)}</span>
          {field.badge && (
            <Badge variant="outline" className="text-[9px] bg-amber-50 text-amber-700 border-amber-200">{field.badge}</Badge>
          )}
          {saved && <Check className="h-3.5 w-3.5 text-green-500" />}
        </div>
        <Switch
          checked={checked}
          onCheckedChange={(c) => {
            const nv = c ? 'true' : 'false';
            setValue(nv);
            handleSave(nv);
          }}
        />
      </div>
    );
  }

  const inputEl = field.type === 'textarea' ? (
    <Textarea
      value={value}
      onChange={(e) => setValue(e.target.value)}
      rows={field.rows ?? 3}
      placeholder={field.placeholder}
      className="bg-[hsl(0_0%_97%)] border-[hsl(0_0%_88%)] text-sm"
    />
  ) : field.type === 'number' ? (
    <Input
      type="number"
      step="1"
      min="0"
      value={value}
      onChange={(e) => setValue(e.target.value)}
      placeholder={field.placeholder}
      className="bg-[hsl(0_0%_97%)] border-[hsl(0_0%_88%)] text-sm max-w-[160px]"
    />
  ) : (
    <Input
      value={value}
      onChange={(e) => setValue(e.target.value)}
      placeholder={field.placeholder}
      className="bg-[hsl(0_0%_97%)] border-[hsl(0_0%_88%)] text-sm"
    />
  );

  return (
    <div className="py-3 border-b border-[hsl(0_0%_93%)] last:border-0 space-y-1.5">
      <div className="flex items-center gap-2">
        <label className="text-xs font-nav uppercase tracking-wider text-[hsl(0_0%_45%)]">{t(field.labelKey)}</label>
        {field.badge && (
          <Badge variant="outline" className="text-[9px]">{field.badge}</Badge>
        )}
      </div>
      <div className="flex gap-2 items-start">
        <div className="flex-1">{inputEl}</div>
        <Button
          size="sm"
          variant={dirty ? 'default' : 'outline'}
          className={cn('shrink-0', dirty ? '' : 'border-[hsl(0_0%_85%)] text-[hsl(0_0%_50%)]')}
          disabled={!dirty && !update.isPending}
          onClick={() => handleSave()}
        >
          {saved ? <Check className="h-3.5 w-3.5" /> : t('admin.settings.save')}
        </Button>
      </div>
      {urlWarningVisible && (
        <p className="text-xs text-amber-600">{t('admin.settings.validation.urlWarning')}</p>
      )}
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}

// ── "Other" section for unknown keys ─────────────────────────────────────────

function OtherSettingRow({ setting }: { setting: SiteSettingDto }) {
  const { t } = useTranslation();
  const vt = setting.valueType ?? 'Text';
  const isJson = vt === 'Json';
  const isHtml = vt === 'Html';

  const field: FieldDef = {
    key: setting.key,
    labelKey: '', // we'll render key directly
    type: (isJson || isHtml) ? 'textarea' : undefined,
    badge: isJson ? 'JSON' : isHtml ? 'HTML' : undefined,
    rows: 6,
  };

  return (
    <div className="py-3 border-b border-[hsl(0_0%_93%)] last:border-0">
      <SettingRow setting={setting} field={{ ...field, labelKey: setting.key }} />
    </div>
  );
}

// ── Main page ───────────────────────────────────────────────────────────────

export default function AdminSettings() {
  const { t } = useTranslation();
  const { data: settings, isLoading } = useAdminSiteSettings();

  const settingsMap = new Map<string, SiteSettingDto>();
  settings?.forEach(s => settingsMap.set(s.key, s));

  const unknownSettings = settings?.filter(s => !KNOWN_KEYS.has(s.key)) ?? [];

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-semibold text-[hsl(0_0%_15%)]">{t('admin.settings.title')}</h1>
        <p className="text-sm text-[hsl(0_0%_50%)] mt-1">{t('admin.settings.subtitle')}</p>
      </div>

      {isLoading && <p className="text-sm text-[hsl(0_0%_50%)]">{t('admin.common.loading')}</p>}

      {!isLoading && SECTIONS.map((section) => (
        <Collapsible key={section.titleKey} defaultOpen>
          <Card className="bg-white border-[hsl(0_0%_90%)] shadow-sm">
            <CollapsibleTrigger className="w-full">
              <CardHeader className="cursor-pointer">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg font-heading text-[hsl(0_0%_15%)]">{t(section.titleKey)}</CardTitle>
                    {section.descriptionKey && (
                      <CardDescription className="text-sm text-[hsl(0_0%_50%)] mt-0.5">{t(section.descriptionKey)}</CardDescription>
                    )}
                  </div>
                  <ChevronDown className="h-4 w-4 text-[hsl(0_0%_50%)] transition-transform [[data-state=open]>&]:rotate-180" />
                </div>
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent className="pt-0 px-6 pb-4">
                {section.fields.map((field) => (
                  <SettingRow key={field.key} setting={settingsMap.get(field.key)} field={field} />
                ))}
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>
      ))}

      {!isLoading && unknownSettings.length > 0 && (
        <Collapsible defaultOpen>
          <Card className="bg-white border-[hsl(0_0%_90%)] shadow-sm">
            <CollapsibleTrigger className="w-full">
              <CardHeader className="cursor-pointer">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg font-heading text-[hsl(0_0%_15%)]">{t('admin.settings.sections.other')}</CardTitle>
                  <ChevronDown className="h-4 w-4 text-[hsl(0_0%_50%)] transition-transform [[data-state=open]>&]:rotate-180" />
                </div>
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent className="pt-0 px-6 pb-4">
                {unknownSettings.map(s => (
                  <OtherSettingRow key={s.key} setting={s} />
                ))}
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>
      )}
    </div>
  );
}
