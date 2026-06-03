import { useTranslation } from 'react-i18next';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  /** Defaults to a generic delete title. */
  title?: string;
  /** Defaults to "This action can't be undone." */
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  /** Red destructive confirm button. Default true. */
  destructive?: boolean;
}

/**
 * Shared confirmation dialog for destructive / irreversible admin actions, so a
 * non-technical owner can never delete something with a single mis-click. Drive
 * it from a `pendingId` state on the page:
 *
 *   const [pendingDelete, setPendingDelete] = useState<string | null>(null);
 *   // trash button → onClick={() => setPendingDelete(row.id)}
 *   <ConfirmDialog
 *     open={!!pendingDelete}
 *     onOpenChange={(o) => !o && setPendingDelete(null)}
 *     onConfirm={() => { if (pendingDelete) handleDelete(pendingDelete); setPendingDelete(null); }}
 *   />
 *
 * Title/description default to translated generic copy; pass them to be specific
 * (e.g. include the item's name).
 */
export function ConfirmDialog({
  open,
  onOpenChange,
  onConfirm,
  title,
  description,
  confirmLabel,
  cancelLabel,
  destructive = true,
}: ConfirmDialogProps) {
  const { t } = useTranslation();
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title ?? t('admin.common.confirmDeleteTitle')}</AlertDialogTitle>
          <AlertDialogDescription>
            {description ?? t('admin.common.confirmDeleteDesc')}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{cancelLabel ?? t('admin.common.cancel')}</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className={
              destructive
                ? 'bg-red-600 text-white hover:bg-red-700 focus-visible:ring-red-600'
                : undefined
            }
          >
            {confirmLabel ?? t('admin.common.delete')}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export default ConfirmDialog;
