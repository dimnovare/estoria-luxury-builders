import { ReactNode } from 'react';

interface AdminPageHeaderProps {
  /** Page title (pass an already-translated string, e.g. t('admin.properties.title')). */
  title: string;
  /** Optional one-line explanation for non-technical owners. */
  subtitle?: string;
  /** Right-aligned action slot — the page's primary CTA and any secondary buttons. */
  action?: ReactNode;
  className?: string;
}

/**
 * The one header every admin page uses: title, optional subtitle, and an optional
 * action slot. Tokenized for the `.admin-theme` (no raw hsl literals) so colours stay
 * consistent in light/dark. Layout matches the previous hand-rolled headers exactly
 * (stacked on mobile, row on >=sm), so it is a drop-in replacement.
 */
export default function AdminPageHeader({
  title,
  subtitle,
  action,
  className = '',
}: AdminPageHeaderProps) {
  return (
    <div
      className={`flex flex-col sm:flex-row sm:items-start justify-between gap-3 ${className}`}
    >
      <div>
        <h1 className="text-2xl font-semibold text-foreground">{title}</h1>
        {subtitle && (
          <p className="text-sm text-muted-foreground mt-1 max-w-2xl">{subtitle}</p>
        )}
      </div>
      {action && <div className="flex items-center gap-2 shrink-0">{action}</div>}
    </div>
  );
}
