import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

interface Props {
  /** Number of body rows to render. */
  rows?: number;
  /** Number of columns per row (including the header). */
  cols?: number;
  className?: string;
}

/**
 * Shared loading skeleton for admin tables. Renders a header row plus
 * `rows` x `cols` placeholder cells. Usage:
 *   {isLoading ? <TableSkeleton rows={8} cols={5} /> : <Table>...</Table>}
 */
export function TableSkeleton({ rows = 6, cols = 4, className }: Props) {
  return (
    <div
      className={cn('w-full space-y-3', className)}
      role="status"
      aria-busy="true"
      aria-live="polite"
    >
      {/* Header row */}
      <div
        className="grid gap-4 border-b pb-3"
        style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
      >
        {Array.from({ length: cols }).map((_, c) => (
          <Skeleton key={`head-${c}`} className="h-4 w-2/3" />
        ))}
      </div>

      {/* Body rows */}
      {Array.from({ length: rows }).map((_, r) => (
        <div
          key={`row-${r}`}
          className="grid gap-4 py-1"
          style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
        >
          {Array.from({ length: cols }).map((_, c) => (
            <Skeleton key={`cell-${r}-${c}`} className="h-4 w-full" />
          ))}
        </div>
      ))}
    </div>
  );
}

interface StatCardSkeletonProps {
  className?: string;
}

/**
 * Card-shaped loading skeleton for dashboard stat cards. Usage:
 *   {isLoading ? <StatCardSkeleton /> : <StatCard ... />}
 */
export function StatCardSkeleton({ className }: StatCardSkeletonProps) {
  return (
    <div
      className={cn('rounded-lg border bg-card p-6 space-y-3', className)}
      role="status"
      aria-busy="true"
      aria-live="polite"
    >
      {/* Label */}
      <Skeleton className="h-4 w-1/2" />
      {/* Value */}
      <Skeleton className="h-8 w-3/4" />
      {/* Sub-label / trend */}
      <Skeleton className="h-3 w-1/3" />
    </div>
  );
}
