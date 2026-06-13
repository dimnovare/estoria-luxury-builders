import i18n from '@/i18n';

const LOCALE: Record<string, string> = { et: 'et-EE', en: 'en-US', ru: 'ru-RU' };

/**
 * Locale-aware date formatting that follows the active UI language, so the
 * Estonian/Russian site stops showing English month names. Defaults to a long
 * date (e.g. "13. juuni 2026" in ET).
 */
export function formatDate(
  date: string | Date | null | undefined,
  options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'long', day: 'numeric' },
): string {
  if (!date) return '';
  const d = typeof date === 'string' ? new Date(date) : date;
  if (Number.isNaN(d.getTime())) return '';
  const lang = (i18n.language || 'et').slice(0, 2);
  return d.toLocaleDateString(LOCALE[lang] ?? 'et-EE', options);
}
