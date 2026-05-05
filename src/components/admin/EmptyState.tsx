import { type LucideIcon } from 'lucide-react';

interface Props {
  icon?: LucideIcon;
  title: string;
  description?: string;
  /** Optional primary CTA (e.g. "Add Contact"). Render whatever button-like node fits. */
  action?: React.ReactNode;
  /**
   * Compact mode: smaller padding + smaller icon, for use inside narrow
   * containers like kanban columns or tab panels.
   */
  compact?: boolean;
}

/**
 * Shared empty-state placeholder. Usage:
 *   <EmptyState icon={User} title={t('...')} description={t('...')}
 *               action={<Button asChild>...</Button>} />
 */
export function EmptyState({ icon: Icon, title, description, action, compact = false }: Props) {
  return (
    <div className={`flex flex-col items-center justify-center text-center ${compact ? 'py-6 px-3' : 'py-12 px-4'}`}>
      {Icon && (
        <Icon
          className={`text-[hsl(0_0%_75%)] mb-3 ${compact ? 'h-8 w-8' : 'h-12 w-12'}`}
          strokeWidth={1.5}
          aria-hidden
        />
      )}
      <p className={`text-[hsl(0_0%_45%)] ${compact ? 'text-xs' : 'text-sm'} font-medium`}>{title}</p>
      {description && (
        <p className={`text-[hsl(0_0%_55%)] ${compact ? 'text-[11px]' : 'text-xs'} mt-1 max-w-xs`}>
          {description}
        </p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
