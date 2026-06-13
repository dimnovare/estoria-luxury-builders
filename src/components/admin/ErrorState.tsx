import { AlertTriangle } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';

interface Props {
  title?: string;
  description?: string;
  onRetry?: () => void;
  retryLabel?: string;
  className?: string;
}

/**
 * Shared admin error-state placeholder. Usage:
 *   <ErrorState description={t('...')} onRetry={refetch} />
 */
export function ErrorState({ title, description, onRetry, retryLabel, className = '' }: Props) {
  const { t } = useTranslation();

  return (
    <div
      className={`flex flex-col items-center justify-center rounded-lg border border-border text-center py-12 px-4 ${className}`}
      role="alert"
    >
      <AlertTriangle className="text-destructive mb-3 h-12 w-12" strokeWidth={1.5} aria-hidden />
      <p className="text-foreground text-sm font-medium">
        {title ?? t('admin.common.errorTitle', 'Something went wrong')}
      </p>
      {description && <p className="text-muted-foreground text-xs mt-1 max-w-xs">{description}</p>}
      {onRetry && (
        <Button variant="outline" onClick={onRetry} className="mt-4">
          {retryLabel ?? t('admin.common.retry', 'Try again')}
        </Button>
      )}
    </div>
  );
}
