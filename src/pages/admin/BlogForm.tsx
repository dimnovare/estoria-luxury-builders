import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Image as ImageIcon, Loader2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  useAdminBlogPost,
  useCreateBlogPost,
  useUpdateBlogPost,
  useUploadFile,
  useAdminTeam,
  toBeLang,
} from '@/hooks/api/useAdmin';
import { toast } from 'sonner';

const langs = ['et', 'en', 'ru'] as const;

type TransFields = { title: string; excerpt: string; content: string; metaTitle: string; metaDescription: string; };
const emptyTrans: TransFields = { title: '', excerpt: '', content: '', metaTitle: '', metaDescription: '' };

export default function BlogForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = !!id;
  const coverInputRef = useRef<HTMLInputElement>(null);

  const { data: existing, isLoading: loadingPost } = useAdminBlogPost(isEdit ? id : undefined);
  const { data: teamData } = useAdminTeam();
  const createBlogPost = useCreateBlogPost();
  const updateBlogPost = useUpdateBlogPost();
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
      toast.error('Failed to upload cover image');
    } finally {
      setUploadingCover(false);
    }
  };

  const handleSave = async () => {
    const dto = {
      authorId,
      coverImageUrl: coverImageUrl || null,
      translations: Object.fromEntries(
        langs.map(l => [toBeLang(l), translations[l]])
      ),
    };

    try {
      if (isEdit && id) {
        await updateBlogPost.mutateAsync({ id, dto });
        toast.success('Post updated');
      } else {
        await createBlogPost.mutateAsync(dto);
        toast.success('Post created');
      }
      navigate('/admin/blog');
    } catch {
      toast.error('Failed to save post');
    }
  };

  const isSaving = createBlogPost.isPending || updateBlogPost.isPending;

  const inputClass = "border-[hsl(0_0%_85%)] bg-white text-[hsl(0_0%_15%)] focus:border-[hsl(43_50%_54%)] focus:ring-[hsl(43_50%_54%)]";
  const labelClass = "text-sm text-[hsl(0_0%_40%)] font-medium";

  if (isEdit && loadingPost) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-6 w-6 animate-spin text-[hsl(43_50%_54%)]" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate('/admin/blog')} className="text-[hsl(0_0%_50%)]">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-2xl font-semibold text-[hsl(0_0%_15%)]">{isEdit ? 'Edit Post' : 'New Blog Post'}</h1>
      </div>

      <Card className="bg-white border-[hsl(0_0%_90%)] shadow-sm">
        <CardContent className="p-6 space-y-4">
          {/* Cover image */}
          <div className="space-y-2">
            <Label className={labelClass}>Cover Image</Label>
            {coverImageUrl ? (
              <div className="relative rounded-lg overflow-hidden border border-[hsl(0_0%_90%)] group">
                <img src={coverImageUrl} alt="" className="w-full h-48 object-cover" />
                <button
                  onClick={() => setCoverImageUrl('')}
                  className="absolute top-2 right-2 bg-black/60 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ) : (
              <div
                className="border-2 border-dashed border-[hsl(0_0%_85%)] rounded-lg p-8 text-center hover:border-[hsl(43_50%_54%)] transition-colors cursor-pointer"
                onClick={() => coverInputRef.current?.click()}
              >
                {uploadingCover ? (
                  <Loader2 className="h-6 w-6 mx-auto text-[hsl(43_50%_54%)] animate-spin" />
                ) : (
                  <>
                    <ImageIcon className="h-6 w-6 mx-auto text-[hsl(0_0%_70%)] mb-1" />
                    <p className="text-sm text-[hsl(0_0%_50%)]">Upload cover image</p>
                  </>
                )}
              </div>
            )}
            <input ref={coverInputRef} type="file" accept="image/*" className="hidden" onChange={handleCoverUpload} />
          </div>

          <div className="space-y-2">
            <Label className={labelClass}>Author</Label>
            <Select value={authorId} onValueChange={setAuthorId}>
              <SelectTrigger className={inputClass}><SelectValue placeholder="Select author" /></SelectTrigger>
              <SelectContent>
                {(teamData ?? []).map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Translation tabs */}
      <Card className="bg-white border-[hsl(0_0%_90%)] shadow-sm">
        <CardContent className="p-6">
          <Tabs defaultValue="et">
            <TabsList className="bg-[hsl(0_0%_96%)] border border-[hsl(0_0%_90%)]">
              {langs.map(l => (
                <TabsTrigger key={l} value={l} className="uppercase text-xs data-[state=active]:bg-[hsl(43_50%_54%)] data-[state=active]:text-[hsl(0_0%_4%)]">{l}</TabsTrigger>
              ))}
            </TabsList>
            {langs.map(lang => (
              <TabsContent key={lang} value={lang} className="mt-4 space-y-4">
                <div className="space-y-2">
                  <Label className={labelClass}>Title</Label>
                  <Input value={translations[lang]?.title || ''} onChange={e => updateT(lang, 'title', e.target.value)} className={inputClass} />
                </div>
                <div className="space-y-2">
                  <Label className={labelClass}>Excerpt</Label>
                  <Textarea rows={3} value={translations[lang]?.excerpt || ''} onChange={e => updateT(lang, 'excerpt', e.target.value)} className={inputClass} />
                </div>
                <div className="space-y-2">
                  <Label className={labelClass}>Content (HTML)</Label>
                  <Textarea rows={12} value={translations[lang]?.content || ''} onChange={e => updateT(lang, 'content', e.target.value)} className={inputClass} />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className={labelClass}>Meta Title</Label>
                    <Input value={translations[lang]?.metaTitle || ''} onChange={e => updateT(lang, 'metaTitle', e.target.value)} className={inputClass} />
                  </div>
                  <div className="space-y-2">
                    <Label className={labelClass}>Meta Description</Label>
                    <Input value={translations[lang]?.metaDescription || ''} onChange={e => updateT(lang, 'metaDescription', e.target.value)} className={inputClass} />
                  </div>
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={isSaving} className="bg-[hsl(43_50%_54%)] hover:bg-[hsl(43_50%_48%)] text-[hsl(0_0%_4%)]">
          {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          Save Post
        </Button>
      </div>
    </div>
  );
}
