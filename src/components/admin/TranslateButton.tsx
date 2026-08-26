import { useTranslation } from 'react-i18next';
import { Languages, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { useTranslateContent } from '@/hooks/api/useAdmin';

interface TranslateButtonProps {
  /** Source language the content is authored in. Default Estonian. */
  from?: string;
  /** Target languages to fill, e.g. ['en','ru']. */
  to: string[];
  /** Current source-language field values (key → text). */
  fields: Record<string, string>;
  /** Human labels per field key, used to name empty source fields in warnings. */
  fieldLabels?: Record<string, string>;
  /** Called once per target language with that language's translated fields. */
  onTranslated: (lang: string, fields: Record<string, string>) => void;
  className?: string;
}

/**
 * One-click "Translate from Estonian" button shared by every content form. The
 * author writes Estonian, clicks once, and the other languages are filled in
 * (and remain fully editable). HTML and placeholders are preserved server-side.
 */
export default function TranslateButton({
  from = 'et',
  to,
  fields,
  fieldLabels,
  onTranslated,
  className,
}: TranslateButtonProps) {
  const { t } = useTranslation();
  const translate = useTranslateContent();

  const hasContent = Object.values(fields).some(v => v && v.trim());

  const handleClick = () => {
    if (!hasContent) {
      toast.warning(t('admin.common.aiTranslateEmpty'));
      return;
    }

    // Only fields filled in on the Estonian tab can be translated. Silently
    // skipping the empty ones is what made "the description didn't translate"
    // look like a broken translator — it was simply never written in Estonian.
    const missing = Object.keys(fields).filter(k => !fields[k]?.trim());
    if (missing.length > 0) {
      const names = missing.map(k => fieldLabels?.[k] ?? k).join(', ');
      toast.warning(t('admin.common.aiTranslateMissing', { fields: names }));
    }

    translate.mutate(
      { from, to, fields },
      {
        onSuccess: (result) => {
          for (const lang of to) {
            if (result[lang]) onTranslated(lang, result[lang]);
          }
          toast.success(t('admin.common.aiTranslateDone'));
        },
        onError: () => toast.error(t('admin.common.aiTranslateFailed')),
      },
    );
  };

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={handleClick}
      disabled={translate.isPending}
      className={className}
    >
      {translate.isPending
        ? <Loader2 className="h-4 w-4 mr-2 animate-spin" />
        : <Languages className="h-4 w-4 mr-2" />}
      {translate.isPending
        ? t('admin.common.aiTranslating')
        : t('admin.common.aiTranslate')}
    </Button>
  );
}
