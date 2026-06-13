import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Image as ImageIcon, Loader2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import RichTextEditor from '@/components/ui/RichTextEditor';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import TranslateButton from '@/components/admin/TranslateButton';
import {
  useAdminBlogPost,
  useCreateBlogPost,
  useUpdateBlogPost,
  useSetBlogPostStatus,
  useUploadFile,
  useAdminTeam,
  toBeLang,
} from '@/hooks/api/useAdmin';
import { toast } from 'sonner';

const langs = ['et', 'en', 'ru'] as const;

type TransFields = { title: string; excerpt: string; content: string; metaTitle: string; metaDescription: string; };
const emptyTrans: TransFields = { title: '', excerpt: '', content: '', metaTitle: '', metaDescription: '' };

export default function BlogForm() {
  const { t } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = !!id;
  const coverInputRef = useRef<HTMLInputElement>(null);

  const { data: existing, isLoading: loadingPost } = useAdminBlogPost(isEdit ? id : undefined);
  const { data: teamData } = useAdminTeam();
  const createBlogPost = useCreateBlogPost();
  const updateBlogPost = useUpdateBlogPost();
  const setStatus = useSetBlogPostStatus();
  const uploadFile = useUploadFile();

  const [authorId, setAuthorId] = useState('');
  const [coverImageUrl, setCoverImageUrl] = useState('');
  const [uploadingCover, setUploadingCover] = useState(false);

  const [translations, setTranslations] = useState<Record<string, TransFields>>({
    et: { ...emptyTrans },
    en: { ...emptyTrans },
    ru: { ...emptyTrans },
  });

  useEffect(() => {
    if (existing) {
      setAuthorId(existing.authorId);
      setCoverImageUrl(existing.coverImageUrl ?? '');
      setTranslations({
        et: existing.translations['Et']
          ? { ...emptyTrans, ...existing.translations['Et'], excerpt: existing.translations['Et'].excerpt ?? '', metaTitle: existing.translations['Et'].metaTitle ?? '', metaDescription: existing.translations['Et'].metaDescription ?? '' }
          : { ...emptyTrans },
        en: existing.translations['En']
          ? { ...emptyTrans, ...existing.translations['En'], excerpt: existing.translations['En'].excerpt ?? '', metaTitle: existing.translations['En'].metaTitle ?? '', metaDescription: existing.translations['En'].metaDescription ?? '' }
          : { ...emptyTrans },
        ru: existing.translations['Ru']
          ? { ...emptyTrans, ...existing.translations['Ru'], excerpt: existing.translations['Ru'].excerpt ?? '', metaTitle: existing.translations['Ru'].metaTitle ?? '', metaDescription: existing.translations['Ru'].metaDescription ?? '' }
          : { ...emptyTrans },
      });
    }
  }, [existing]);

  const updateT = (lang: string, field: string, value: string) => {
    setTranslations(prev => ({ ...prev, [lang]: { ...prev[lang], [field]: value } }));
  };

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingCover(true);
    try {
      const result = await uploadFile.mutateAsync({ file, folder: 'blog' });
      setCoverImageUrl(result.url);
    } catch {
      toast.error(t('admin.blog.fields.uploadFailed'));
    } finally {
      setUploadingCover(false);
    }
  };

  // publish=true → live on the site; publish=false → saved as a hidden draft.
  // Status lives on a separate endpoint, so we save the content first, then set
  // the status on the resulting post id.
  const handleSave = async (publish: boolean) => {
    if (!translations.et.title.trim()) {
      toast.error(t('admin.blog.validation.titleRequired', 'An Estonian title is required to save.'));
      return;
    }

    // Author is a required FK on the backend — guard for a clear message.
    if (!authorId) {
      toast.error(t('admin.blog.validation.authorRequired', 'Please select an author.'));
      return;
    }

    const dto = {
      authorId,
      coverImageUrl: coverImageUrl || null,
      translations: Object.fromEntries(
        langs.map(l => [toBeLang(l), translations[l]])
      ),
    };

    try {
      let postId = id;
      if (isEdit && id) {
        await updateBlogPost.mutateAsync({ id, dto });
      } else {
        const result = await createBlogPost.mutateAsync(dto) as { id: string };
        postId = result.id;
      }

      if (postId) {
        await setStatus.mutateAsync({ id: postId, status: publish ? 'Published' : 'Draft' });
      }

      toast.success(publish
        ? t('admin.blog.toast.published')
        : t('admin.blog.toast.savedDraft', 'Saved as draft — not visible on the site yet.'));
      navigate('/admin/blog');
    } catch {
      toast.error(t('admin.blog.toast.saveFailed'));
    }
  };

  const isSaving = createBlogPost.isPending || updateBlogPost.isPending || setStatus.isPending;
  const currentStatus = existing?.status;

  const inputClass = "border-border bg-card text-foreground focus:border-primary focus:ring-primary";
  const labelClass = "text-sm text-muted-foreground font-medium";

  if (isEdit && loadingPost) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate('/admin/blog')} className="text-muted-foreground" title={t('admin.common.back')} aria-label={t('admin.common.back')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-2xl font-semibold text-foreground">{isEdit ? t('admin.blog.editTitle') : t('admin.blog.newTitle')}</h1>
      </div>

      <Card className="bg-card border-border shadow-sm">
        <CardContent className="p-6 space-y-4">
          {/* Cover image */}
          <div className="space-y-2">
            <Label className={labelClass}>{t('admin.blog.fields.coverImage')}</Label>
            {coverImageUrl ? (
              <div className="relative rounded-lg overflow-hidden border border-border group">
                <img src={coverImageUrl} alt="" className="w-full h-48 object-cover" />
                <button
                  type="button"
                  onClick={() => setCoverImageUrl('')}
                  className="absolute top-2 right-2 bg-black/60 text-white rounded-full p-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity focus-visible:opacity-100"
                  title={t('admin.blog.fields.removeCover', 'Remove cover image')}
                  aria-label={t('admin.blog.fields.removeCover', 'Remove cover image')}
                >
                  <X className="h-3.5 w-3.5" />
                </button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => coverInputRef.current?.click()}
                  className="absolute bottom-2 right-2 bg-card/90 border-border text-foreground hover:bg-card"
                >
                  <ImageIcon className="h-3.5 w-3.5 mr-1.5" />
                  {t('admin.blog.fields.replaceCover', 'Replace image')}
                </Button>
              </div>
            ) : (
              <button
                type="button"
                className="w-full border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary transition-colors cursor-pointer"
                onClick={() => coverInputRef.current?.click()}
                aria-label={t('admin.blog.fields.uploadCover')}
              >
                {uploadingCover ? (
                  <Loader2 className="h-6 w-6 mx-auto text-primary animate-spin" />
                ) : (
                  <>
                    <ImageIcon className="h-6 w-6 mx-auto text-muted-foreground mb-1" />
                    <p className="text-sm text-muted-foreground">{t('admin.blog.fields.uploadCover')}</p>
                  </>
                )}
              </button>
            )}
            <input ref={coverInputRef} type="file" accept="image/*" className="hidden" onChange={handleCoverUpload} />
          </div>

          <div className="space-y-2">
            <Label className={labelClass}>
              {t('admin.blog.fields.author')}
              <span className="text-destructive ml-1" aria-hidden="true">*</span>
            </Label>
            <Select value={authorId} onValueChange={setAuthorId}>
              <SelectTrigger className={inputClass}><SelectValue placeholder={t('admin.blog.fields.selectAuthor')} /></SelectTrigger>
              <SelectContent>
                {(teamData ?? []).map(member => <SelectItem key={member.id} value={member.id}>{member.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Translation tabs */}
      <Card className="bg-card border-border shadow-sm">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-4 border-b border-border">
            <p className="text-xs text-muted-foreground">
              {t('admin.blog.translateHint', 'Write the post in Estonian, then translate it to the other languages with one click. You can edit afterwards.')}
            </p>
            <TranslateButton
              to={['en', 'ru']}
              fields={{
                title: translations.et?.title || '',
                excerpt: translations.et?.excerpt || '',
                content: translations.et?.content || '',
                metaTitle: translations.et?.metaTitle || '',
                metaDescription: translations.et?.metaDescription || '',
              }}
              onTranslated={(lang, f) => setTranslations(prev => ({ ...prev, [lang]: { ...prev[lang], ...f } }))}
            />
          </div>
          <Tabs defaultValue="et">
            <TabsList className="bg-muted border border-border">
              {langs.map(l => (
                <TabsTrigger key={l} value={l} className="uppercase text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">{l}</TabsTrigger>
              ))}
            </TabsList>
            {langs.map(lang => (
              <TabsContent key={lang} value={lang} className="mt-4 space-y-4">
                <div className="space-y-2">
                  <Label className={labelClass}>
                    {t('admin.blog.fields.title')}
                    {lang === 'et' && <span className="text-destructive ml-1" aria-hidden="true">*</span>}
                  </Label>
                  <Input value={translations[lang]?.title || ''} onChange={e => updateT(lang, 'title', e.target.value)} className={inputClass} />
                </div>
                <div className="space-y-2">
                  <Label className={labelClass}>{t('admin.blog.fields.excerpt')}</Label>
                  <Textarea rows={3} value={translations[lang]?.excerpt || ''} onChange={e => updateT(lang, 'excerpt', e.target.value)} className={inputClass} />
                </div>
                <div className="space-y-2">
                  <Label className={labelClass}>{t('admin.blog.fields.content')}</Label>
                  <RichTextEditor
                    value={translations[lang]?.content || ''}
                    onChange={(html) => updateT(lang, 'content', html)}
                    placeholder={t('admin.blog.fields.content')}
                    minHeight="400px"
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className={labelClass}>{t('admin.blog.fields.metaTitle')}</Label>
                    <Input value={translations[lang]?.metaTitle || ''} onChange={e => updateT(lang, 'metaTitle', e.target.value)} className={inputClass} />
                  </div>
                  <div className="space-y-2">
                    <Label className={labelClass}>{t('admin.blog.fields.metaDescription')}</Label>
                    <Input value={translations[lang]?.metaDescription || ''} onChange={e => updateT(lang, 'metaDescription', e.target.value)} className={inputClass} />
                  </div>
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>

      <div className="flex items-center justify-between gap-3 pt-2">
        <p className="text-xs text-muted-foreground">
          {currentStatus === 'Published'
            ? t('admin.blog.status.liveNote', 'This post is live on the site. Saving as draft will hide it.')
            : t('admin.blog.status.draftNote', 'This post is a hidden draft. Publish it to make it live.')}
        </p>
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={() => handleSave(false)}
            disabled={isSaving}
            className="border-border text-muted-foreground"
          >
            {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {t('admin.blog.saveDraft', 'Save as draft')}
          </Button>
          <Button
            onClick={() => handleSave(true)}
            disabled={isSaving}
            className="bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {t('admin.blog.savePublish', 'Save & publish')}
          </Button>
        </div>
      </div>
    </div>
  );
}
