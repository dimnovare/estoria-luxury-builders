import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { mockTeam } from '@/data/mockContent';
import { mockBlogPosts } from '@/data/mockBlog';
import { toast } from 'sonner';

const langs = ['et', 'en', 'ru'] as const;

export default function BlogForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = !!id;
  const existing = isEdit ? mockBlogPosts.find(p => p.id === id) : null;

  const [authorId, setAuthorId] = useState('');
  const [status, setStatus] = useState('draft');
  const [coverPreview] = useState(existing?.imageUrl || '');

  const [translations, setTranslations] = useState<Record<string, { title: string; excerpt: string; content: string; metaTitle: string; metaDescription: string }>>({
    et: { title: existing?.title || '', excerpt: existing?.excerpt || '', content: '', metaTitle: '', metaDescription: '' },
    en: { title: existing?.title || '', excerpt: existing?.excerpt || '', content: '', metaTitle: '', metaDescription: '' },
    ru: { title: '', excerpt: '', content: '', metaTitle: '', metaDescription: '' },
  });

  const updateT = (lang: string, field: string, value: string) => {
    setTranslations(prev => ({ ...prev, [lang]: { ...prev[lang], [field]: value } }));
  };

  const inputClass = "border-[hsl(0_0%_85%)] bg-white text-[hsl(0_0%_15%)] focus:border-[hsl(43_50%_54%)] focus:ring-[hsl(43_50%_54%)]";
  const labelClass = "text-sm text-[hsl(0_0%_40%)] font-medium";

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
            {coverPreview ? (
              <div className="relative rounded-lg overflow-hidden border border-[hsl(0_0%_90%)]">
                <img src={coverPreview} alt="" className="w-full h-48 object-cover" />
              </div>
            ) : (
              <div className="border-2 border-dashed border-[hsl(0_0%_85%)] rounded-lg p-8 text-center hover:border-[hsl(43_50%_54%)] transition-colors cursor-pointer">
                <ImageIcon className="h-6 w-6 mx-auto text-[hsl(0_0%_70%)] mb-1" />
                <p className="text-sm text-[hsl(0_0%_50%)]">Upload cover image</p>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className={labelClass}>Author</Label>
              <Select value={authorId} onValueChange={setAuthorId}>
                <SelectTrigger className={inputClass}><SelectValue placeholder="Select author" /></SelectTrigger>
                <SelectContent>
                  {mockTeam.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className={labelClass}>Status</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger className={inputClass}><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="published">Published</SelectItem>
                </SelectContent>
              </Select>
            </div>
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
        <Button onClick={() => { toast.success('Blog post saved'); navigate('/admin/blog'); }} className="bg-[hsl(43_50%_54%)] hover:bg-[hsl(43_50%_48%)] text-[hsl(0_0%_4%)]">
          Save Post
        </Button>
      </div>
    </div>
  );
}
