import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  FileText, Upload, Download, Trash2, Loader2, Paperclip,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { EmptyState } from '@/components/admin/EmptyState';
import {
  usePropertyDocuments,
  useUploadPropertyDocument,
  useDownloadPropertyDocument,
  useDeletePropertyDocument,
  DOCUMENT_CATEGORIES,
  type DocumentCategory,
} from '@/hooks/api/useRelationships';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface Props {
  propertyId: string;
}

/** Human-readable file size (KB / MB) from a raw byte count. */
function prettySize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(kb < 10 ? 1 : 0)} KB`;
  return `${(kb / 1024).toFixed(1)} MB`;
}

/**
 * Documents panel for a property: upload (file + category + optional notes) and
 * a list of attached documents with download / delete. Mirrors the card-based,
 * role-chip CRM look used across the admin and surfaces clear empty / loading /
 * disabled states for non-technical owners.
 */
export default function PropertyDocumentsPanel({ propertyId }: Props) {
  const { t } = useTranslation();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: documents, isLoading } = usePropertyDocuments(propertyId);
  const upload = useUploadPropertyDocument();
  const download = useDownloadPropertyDocument();
  const remove = useDeletePropertyDocument();

  const [file, setFile] = useState<File | null>(null);
  const [category, setCategory] = useState<DocumentCategory>('Contract');
  const [notes, setNotes] = useState('');
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);

  const resetForm = () => {
    setFile(null);
    setNotes('');
    setCategory('Contract');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleUpload = () => {
    if (!file) return;
    upload.mutate(
      { propertyId, file, category, notes: notes.trim() || undefined },
      {
        onSuccess: () => {
          toast.success(t('admin.documents.toast.uploaded', 'Document uploaded'));
          resetForm();
        },
      },
    );
  };

  const docs = documents ?? [];

  return (
    <div className="space-y-4">
      {/* Upload card */}
      <Card className="bg-card border-border shadow-sm">
        <CardContent className="p-4 space-y-3">
          <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
            {/* File chooser */}
            <div className="flex items-center gap-2">
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                aria-label={t('admin.documents.upload')}
              />
              <Button
                type="button"
                variant="outline"
                className="h-11 justify-start font-normal min-w-0 flex-1"
                onClick={() => fileInputRef.current?.click()}
                disabled={upload.isPending}
              >
                <Paperclip className="h-4 w-4 mr-2 shrink-0" />
                <span className="truncate">
                  {file ? file.name : t('admin.documents.dropHint')}
                </span>
              </Button>
            </div>

            {/* Category */}
            <Select
              value={category}
              onValueChange={(v) => setCategory(v as DocumentCategory)}
              disabled={upload.isPending}
            >
              <SelectTrigger className="h-11 bg-secondary border-border sm:w-48">
                <SelectValue placeholder={t('admin.documents.category')} />
              </SelectTrigger>
              <SelectContent>
                {DOCUMENT_CATEGORIES.map((c) => (
                  <SelectItem key={c} value={c}>
                    {t(`admin.documents.categories.${c}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Input
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder={t('admin.documents.notes')}
            className="h-11 bg-secondary border-border"
            disabled={upload.isPending}
          />

          <div className="flex justify-end">
            <Button
              onClick={handleUpload}
              disabled={!file || upload.isPending}
              className="h-11"
            >
              {upload.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Upload className="h-4 w-4 mr-2" />
              )}
              {upload.isPending ? t('admin.documents.uploading') : t('admin.documents.upload')}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Document list */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
        </div>
      ) : docs.length === 0 ? (
        <EmptyState
          icon={FileText}
          title={t('admin.documents.empty')}
          description={t('admin.documents.dropHint')}
        />
      ) : (
        <div className="space-y-2">
          {docs.map((doc) => {
            const isDownloading = download.isPending && download.variables?.id === doc.id;
            return (
              <Card key={doc.id} className="bg-card border-border shadow-sm">
                <CardContent className="p-3 flex items-center gap-3">
                  <div className="h-9 w-9 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
                    <FileText className="h-4 w-4 text-primary" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-foreground truncate">{doc.fileName}</span>
                      <Badge variant="outline" className="shrink-0 text-[10px] bg-primary/10 text-gold-dark border-primary/30">
                        {t(`admin.documents.categories.${doc.category}`)}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5 tabular-nums">
                      {prettySize(doc.sizeBytes)} · {format(new Date(doc.createdAt), 'dd.MM.yyyy')}
                      {doc.notes ? <span className="not-tabular-nums"> · {doc.notes}</span> : null}
                    </p>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-10 w-10 text-muted-foreground hover:text-primary"
                      onClick={() => download.mutate({ id: doc.id })}
                      disabled={isDownloading}
                      aria-label={t('admin.documents.download')}
                      title={t('admin.documents.download')}
                    >
                      {isDownloading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Download className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-10 w-10 text-muted-foreground hover:text-destructive"
                      onClick={() => setPendingDelete(doc.id)}
                      aria-label={t('admin.documents.delete')}
                      title={t('admin.documents.delete')}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <ConfirmDialog
        open={!!pendingDelete}
        onOpenChange={(o) => !o && setPendingDelete(null)}
        onConfirm={() => {
          if (pendingDelete) {
            remove.mutate(
              { id: pendingDelete, propertyId },
              { onSuccess: () => toast.success(t('admin.documents.toast.deleted', 'Document deleted')) },
            );
          }
          setPendingDelete(null);
        }}
        title={t('admin.documents.confirmDelete')}
      />
    </div>
  );
}
