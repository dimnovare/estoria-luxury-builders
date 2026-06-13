import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  useAdminSiteSettings,
  useAdminSiteSettingDetail,
  useUpdateSiteSetting,
  type SiteSettingDto,
} from '@/hooks/api/useSiteSettingsAdmin';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ChevronDown, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import AdminPageHeader from '@/components/admin/AdminPageHeader';

/// Mirror of the backend SiteSettingService.TranslatableKeys whitelist —
/// keys whose value is user-facing copy and should differ across EE/EN/RU.
/// Keep in sync with src/Estoria.Application/Services/SiteSettingService.cs.
const TRANSLATABLE_KEYS = new Set(['contact.hours', 'contact.address']);

const SUPPORTED_LANGUAGES = ['Et', 'En', 'Ru'] as const;
type SupportedLanguage = typeof SUPPORTED_LANGUAGES[number];

// ── Section definitions ─────────────────────────────────────────────────────

interface FieldDef {
  key: string;
  labelKey: string;
  placeholder?: string;
  // i18n key for a translatable placeholder (used when the example contains
  // words that should localise, e.g. weekday names). Resolved at render time.
  placeholderKey?: string;
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
      { key: 'contact.hours', labelKey: 'admin.settings.fields.hours', placeholderKey: 'admin.settings.fields.hoursPlaceholder', placeholder: 'Mon–Fri 09:00–18:00' },
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
      { key: 'birthday.auto_send', labelKey: 'admin.settings.fields.birthdayAutoSend', type: 'switch' },
      { key: 'savedsearches.auto_send', labelKey: 'admin.settings.fields.savedSearchAutoSend', type: 'switch' },
    ],
  },
];

const KNOWN_KEYS = new Set(SECTIONS.flatMap(s => s.fields.map(f => f.key)));

// Keys that exist in the backend but have no working implementation yet. We
// hide them entirely (not even in the "Other" catch-all) so the admin UI never
// implies a capability that isn't wired up. Re-add to a section when shipped.
const HIDDEN_KEYS = new Set(['ai.descriptions_enabled', 'ai.replies_enabled']);

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
  const placeholder = field.placeholderKey ? t(field.placeholderKey, field.placeholder ?? '') : field.placeholder;

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
    } catch (e) {
      const err = e as { response?: { data?: { detail?: string } }; message?: string };
      setError(err?.response?.data?.detail ?? err?.message ?? t('admin.settings.toast.saveFailed'));
    }
  }, [value, field, update, t]);

  if (isSwitch) {
    const checked = value === 'true';
    return (
      <div className="flex items-center justify-between py-3 border-b border-border last:border-0">
        <div className="flex items-center gap-2">
          <span className="text-sm text-foreground">{t(field.labelKey)}</span>
          {field.badge && (
            <Badge variant="outline" className="text-[9px] bg-amber-50 text-amber-700 border-amber-200">{field.badge}</Badge>
          )}
          {saved && <Check className="h-3.5 w-3.5 text-success" />}
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
      placeholder={placeholder}
      className="bg-muted border-border text-sm"
    />
  ) : field.type === 'number' ? (
    <Input
      type="number"
      step="1"
      min="0"
      value={value}
      onChange={(e) => setValue(e.target.value)}
      placeholder={placeholder}
      className="bg-muted border-border text-sm max-w-[160px]"
    />
  ) : (
    <Input
      value={value}
      onChange={(e) => setValue(e.target.value)}
      placeholder={placeholder}
      className="bg-muted border-border text-sm"
    />
  );

  return (
    <div className="py-3 border-b border-border last:border-0 space-y-1.5">
      <div className="flex items-center gap-2">
        <label className="text-xs font-nav uppercase tracking-wider text-muted-foreground">{t(field.labelKey)}</label>
        {field.badge && (
          <Badge variant="outline" className="text-[9px]">{field.badge}</Badge>
        )}
      </div>
      <div className="flex gap-2 items-start">
        <div className="flex-1">{inputEl}</div>
        <Button
          size="sm"
          variant={dirty ? 'default' : 'outline'}
          className={cn('shrink-0', dirty ? '' : 'border-border text-muted-foreground')}
          disabled={!dirty && !update.isPending}
          onClick={() => handleSave()}
          aria-label={saved ? t('admin.settings.saved', 'Saved') : t('admin.settings.save')}
          title={saved ? t('admin.settings.saved', 'Saved') : t('admin.settings.save')}
        >
          {saved ? <Check className="h-3.5 w-3.5" /> : t('admin.settings.save')}
        </Button>
      </div>
      {urlWarningVisible && (
        <p className="text-xs text-amber-600">{t('admin.settings.validation.urlWarning')}</p>
      )}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

// ── Translatable setting (per-language tabs) ───────────────────────────────

/// One language tab's editor. Owns its own dirty/saved state so the three
/// tabs save independently — switching tabs while a save is in flight
/// doesn't drop work.
function TranslatableSettingEditor({
  settingKey,
  language,
  initialValue,
  type,
  placeholder,
  rows,
}: {
  settingKey: string;
  language: SupportedLanguage;
  initialValue: string;
  type?: FieldDef['type'];
  placeholder?: string;
  rows?: number;
}) {
  const { t } = useTranslation();
  const update = useUpdateSiteSetting();
  const [value, setValue] = useState(initialValue);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setValue(initialValue);
  }, [initialValue]);

  const dirty = value !== initialValue;

  const handleSave = useCallback(async () => {
    setError('');
    try {
      await update.mutateAsync({ key: settingKey, value, lang: language });
      setSaved(true);
      setTimeout(() => setSaved(false), 1500);
    } catch (e) {
      const err = e as { response?: { data?: { detail?: string; error?: string } }; message?: string };
      setError(
        err?.response?.data?.detail
          ?? err?.response?.data?.error
          ?? err?.message
          ?? t('admin.settings.toast.saveFailed'),
      );
    }
  }, [settingKey, language, value, update, t]);

  const inputEl = type === 'textarea' ? (
    <Textarea
      value={value}
      onChange={(e) => setValue(e.target.value)}
      rows={rows ?? 3}
      placeholder={placeholder}
      className="bg-muted border-border text-sm"
    />
  ) : (
    <Input
      value={value}
      onChange={(e) => setValue(e.target.value)}
      placeholder={placeholder}
      className="bg-muted border-border text-sm"
    />
  );

  return (
    <div className="space-y-1.5">
      <div className="flex gap-2 items-start">
        <div className="flex-1">{inputEl}</div>
        <Button
          size="sm"
          variant={dirty ? 'default' : 'outline'}
          className={cn('shrink-0', dirty ? '' : 'border-border text-muted-foreground')}
          disabled={!dirty || update.isPending}
          onClick={handleSave}
          aria-label={saved ? t('admin.settings.saved', 'Saved') : t('admin.settings.save')}
          title={saved ? t('admin.settings.saved', 'Saved') : t('admin.settings.save')}
        >
          {saved ? <Check className="h-3.5 w-3.5" /> : t('admin.settings.save')}
        </Button>
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

/// Wraps the row label + 3 language tabs. Pulls the per-language values
/// from the admin-detail endpoint (one fetch per translatable key, not per
/// tab) so the form populates without flicker.
function TranslatableSettingRow({ field }: { field: FieldDef }) {
  const { t } = useTranslation();
  const { data: detail } = useAdminSiteSettingDetail(field.key);

  const lookup = (lang: SupportedLanguage) =>
    detail?.translations?.find(t => t.language === lang)?.value ?? '';

  return (
    <div className="py-3 border-b border-border last:border-0 space-y-1.5">
      <div className="flex items-center gap-2">
        <label className="text-xs font-nav uppercase tracking-wider text-muted-foreground">{t(field.labelKey)}</label>
        <Badge variant="outline" className="text-[9px]">EE / EN / RU</Badge>
      </div>
      <Tabs defaultValue="Et">
        <TabsList className="grid grid-cols-3 mb-3">
          <TabsTrigger value="Et">EE</TabsTrigger>
          <TabsTrigger value="En">EN</TabsTrigger>
          <TabsTrigger value="Ru">RU</TabsTrigger>
        </TabsList>
        {SUPPORTED_LANGUAGES.map(lang => (
          <TabsContent key={lang} value={lang}>
            <TranslatableSettingEditor
              settingKey={field.key}
              language={lang}
              initialValue={lookup(lang)}
              type={field.type}
              placeholder={field.placeholderKey ? t(field.placeholderKey, field.placeholder ?? '') : field.placeholder}
              rows={field.rows}
            />
          </TabsContent>
        ))}
      </Tabs>
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
    <div className="py-3 border-b border-border last:border-0">
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

  const unknownSettings = settings?.filter(s => !KNOWN_KEYS.has(s.key) && !HIDDEN_KEYS.has(s.key)) ?? [];

  return (
    <div className="space-y-6 max-w-3xl">
      <AdminPageHeader
        title={t('admin.settings.title')}
        subtitle={t('admin.settings.subtitle', 'Global site settings — contact details, social links, and stats shown throughout the public site. Changes take effect within 30 seconds.')}
      />

      {isLoading && <p className="text-sm text-muted-foreground">{t('admin.common.loading')}</p>}

      {!isLoading && SECTIONS.map((section) => (
        <Collapsible key={section.titleKey} defaultOpen>
          <Card className="bg-card border-border shadow-sm">
            <CollapsibleTrigger className="w-full">
              <CardHeader className="cursor-pointer">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <CardTitle className="text-lg font-heading text-foreground">{t(section.titleKey)}</CardTitle>
                    {section.descriptionKey && (
                      <CardDescription className="text-sm text-muted-foreground mt-0.5">{t(section.descriptionKey)}</CardDescription>
                    )}
                  </div>
                  <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform [[data-state=open]>&]:rotate-180" />
                </div>
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent className="pt-0 px-6 pb-4">
                {section.fields.map((field) => (
                  TRANSLATABLE_KEYS.has(field.key)
                    ? <TranslatableSettingRow key={field.key} field={field} />
                    : <SettingRow key={field.key} setting={settingsMap.get(field.key)} field={field} />
                ))}
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>
      ))}

      {!isLoading && unknownSettings.length > 0 && (
        <Collapsible defaultOpen>
          <Card className="bg-card border-border shadow-sm">
            <CollapsibleTrigger className="w-full">
              <CardHeader className="cursor-pointer">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <CardTitle className="text-lg font-heading text-foreground">{t('admin.settings.sections.other')}</CardTitle>
                  <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform [[data-state=open]>&]:rotate-180" />
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
