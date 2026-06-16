import { useTranslation } from 'react-i18next';
import { ExternalLink, Eye, CalendarClock } from 'lucide-react';
import { useKvImportStatus } from '@/hooks/api/useKvImportStatus';

/**
 * Inline KV.EE status for a single listing, shown in the property editor so the
 * owner never has to leave the page to see whether a listing is live on kv.ee.
 * Renders nothing until KV has reported on this property — keeps the editor calm
 * when the integration isn't in use yet.
 */
export default function PropertyKvStatusCard({ propertyId }: { propertyId: string }) {
  const { t, i18n } = useTranslation();
  // Small catalog → fetch a generous page and pick this property's row client-side.
  const { data } = useKvImportStatus({ pageSize: 200 });
  const row = data?.items.find((r) => r.propertyId === propertyId);
  if (!row) return null;

  const fmtDate = (iso: string | null) => {
    if (!iso) return '—';
    const d = new Date(iso);
    return Number.isNaN(d.getTime()) ? '—' : d.toLocaleDateString(i18n.language);
  };

  return (
    <div className="pt-3 mt-3 border-t border-border">
      <p className="text-xs font-medium text-foreground mb-2">{t('admin.properties.kvStatus.title', 'KV.EE')}</p>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-muted-foreground">
        {row.externalUrl ? (
          <a
            href={row.externalUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-primary hover:underline"
          >
            {t('admin.properties.kvStatus.view', 'View on kv.ee')}
            <ExternalLink className="h-3 w-3" />
          </a>
        ) : (
          <span>{t('admin.properties.kvStatus.notLive', 'Not yet live on kv.ee')}</span>
        )}
        {row.viewedTimes != null && (
          <span className="inline-flex items-center gap-1 tabular-nums">
            <Eye className="h-3 w-3" />
            {row.viewedTimes} {t('admin.properties.kvStatus.views', 'views')}
          </span>
        )}
        {row.expireDate && (
          <span className="inline-flex items-center gap-1 tabular-nums">
            <CalendarClock className="h-3 w-3" />
            {t('admin.properties.kvStatus.expires', 'expires')} {fmtDate(row.expireDate)}
          </span>
        )}
      </div>
    </div>
  );
}
