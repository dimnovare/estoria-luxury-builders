import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Plus, X, GripVertical, Image as ImageIcon, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import {
  useAdminProperty,
  useCreateProperty,
  useUpdateProperty,
  useUploadPropertyImages,
  useDeletePropertyImage,
  useAdminTeam,
  toBeLang,
} from '@/hooks/api/useAdmin';
import { toast } from 'sonner';

const langs = ['et', 'en', 'ru'] as const;

type TransFields = { title: string; description: string; address: string; city: string; district: string; };
const emptyTrans: TransFields = { title: '', description: '', address: '', city: '', district: '' };

export default function PropertyForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = !!id;
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: existing, isLoading: loadingProperty } = useAdminProperty(isEdit ? id : undefined);
  const { data: teamData } = useAdminTeam();
  const createProperty = useCreateProperty();
  const updateProperty = useUpdateProperty();
  const uploadImages = useUploadPropertyImages();
  const deleteImage = useDeletePropertyImage();

  const [propertyType, setPropertyType] = useState('');
  const [transactionType, setTransactionType] = useState('sale');
  const [price, setPrice] = useState('');
  const [size, setSize] = useState('');
  const [rooms, setRooms] = useState('');
  const [bedrooms, setBedrooms] = useState('');
  const [bathrooms, setBathrooms] = useState('');
  const [floor, setFloor] = useState('');
  const [totalFloors, setTotalFloors] = useState('');
  const [yearBuilt, setYearBuilt] = useState('');
  const [energyClass, setEnergyClass] = useState('');
  const [lat, setLat] = useState('');
  const [lng, setLng] = useState('');
  const [agentId, setAgentId] = useState('');
  const [isFeatured, setIsFeatured] = useState(false);

  const [translations, setTranslations] = useState<Record<string, TransFields>>({
    et: { ...emptyTrans },
    en: { ...emptyTrans },
    ru: { ...emptyTrans },
  });

  const [features, setFeatures] = useState<string[]>([]);
  const [newFeature, setNewFeature] = useState('');

  // Pre-fill form when existing property loads
  useEffect(() => {
    if (existing) {
      setPropertyType(existing.propertyType.toLowerCase());
      setTransactionType(existing.transactionType.toLowerCase());
      setPrice(existing.price.toString());
      setSize(existing.size.toString());
      setRooms(existing.rooms?.toString() ?? '');
      setBedrooms(existing.bedrooms?.toString() ?? '');
      setBathrooms(existing.bathrooms?.toString() ?? '');
      setFloor(existing.floor?.toString() ?? '');
      setTotalFloors(existing.totalFloors?.toString() ?? '');
      setYearBuilt(existing.yearBuilt?.toString() ?? '');
      setEnergyClass(existing.energyClass ?? '');
      setLat(existing.latitude?.toString() ?? '');
      setLng(existing.longitude?.toString() ?? '');
      setAgentId(existing.agent?.id ?? '');
      setIsFeatured(existing.isFeatured);
      setFeatures(existing.features ?? []);
      setTranslations({
        et: existing.translations['Et']
          ? { ...emptyTrans, ...existing.translations['Et'], district: existing.translations['Et'].district ?? '' }
          : { ...emptyTrans },
        en: existing.translations['En']
          ? { ...emptyTrans, ...existing.translations['En'], district: existing.translations['En'].district ?? '' }
          : { ...emptyTrans },
        ru: existing.translations['Ru']
          ? { ...emptyTrans, ...existing.translations['Ru'], district: existing.translations['Ru'].district ?? '' }
          : { ...emptyTrans },
      });
    }
  }, [existing]);

  const updateTranslation = (lang: string, field: string, value: string) => {
    setTranslations(prev => ({ ...prev, [lang]: { ...prev[lang], [field]: value } }));
  };

  const addFeature = () => {
    if (newFeature.trim() && !features.includes(newFeature.trim())) {
      setFeatures([...features, newFeature.trim()]);
      setNewFeature('');
    }
  };

  const handleSave = async (asDraft: boolean) => {
    const dto = {
      transactionType: transactionType === 'sale' ? 'Sale' : 'Rent',
      propertyType: propertyType.charAt(0).toUpperCase() + propertyType.slice(1),
      price: parseFloat(price) || 0,
      currency: 'EUR',
      size: parseFloat(size) || 0,
      rooms: rooms ? parseInt(rooms) : null,
      bedrooms: bedrooms ? parseInt(bedrooms) : null,
      bathrooms: bathrooms ? parseInt(bathrooms) : null,
      floor: floor ? parseInt(floor) : null,
      totalFloors: totalFloors ? parseInt(totalFloors) : null,
      yearBuilt: yearBuilt ? parseInt(yearBuilt) : null,
      energyClass: energyClass || null,
      latitude: lat ? parseFloat(lat) : null,
      longitude: lng ? parseFloat(lng) : null,
      isFeatured: asDraft ? false : isFeatured,
      agentId,
      features,
      translations: Object.fromEntries(
        langs.map(l => [toBeLang(l), translations[l]])
      ),
    };

    try {
      if (isEdit && id) {
        await updateProperty.mutateAsync({ id, dto });
        toast.success('Property updated');
        navigate('/admin/properties');
      } else {
        const result = await createProperty.mutateAsync(dto) as { id: string };
        toast.success('Property created — upload images in the Images tab');
        navigate(`/admin/properties/${result.id}/edit`);
      }
    } catch {
      toast.error('Failed to save property');
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!isEdit || !id || !e.target.files?.length) return;
    try {
      await uploadImages.mutateAsync({ id, files: e.target.files });
      toast.success('Images uploaded');
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch {
      toast.error('Failed to upload images');
    }
  };

  const handleDeleteImage = async (imageId: string) => {
    if (!id) return;
    try {
      await deleteImage.mutateAsync({ propertyId: id, imageId });
      toast.success('Image removed');
    } catch {
      toast.error('Failed to remove image');
    }
  };

  const isSaving = createProperty.isPending || updateProperty.isPending;

  const inputClass = "border-[hsl(0_0%_85%)] bg-white text-[hsl(0_0%_15%)] focus:border-[hsl(43_50%_54%)] focus:ring-[hsl(43_50%_54%)]";
  const labelClass = "text-sm text-[hsl(0_0%_40%)] font-medium";

  if (isEdit && loadingProperty) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-6 w-6 animate-spin text-[hsl(43_50%_54%)]" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate('/admin/properties')} className="text-[hsl(0_0%_50%)]">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-2xl font-semibold text-[hsl(0_0%_15%)]">{isEdit ? 'Edit Property' : 'New Property'}</h1>
      </div>

      <Tabs defaultValue="general">
        <TabsList className="bg-white border border-[hsl(0_0%_90%)]">
          <TabsTrigger value="general" className="data-[state=active]:bg-[hsl(43_50%_54%)] data-[state=active]:text-[hsl(0_0%_4%)]">General</TabsTrigger>
          <TabsTrigger value="translations" className="data-[state=active]:bg-[hsl(43_50%_54%)] data-[state=active]:text-[hsl(0_0%_4%)]">Translations</TabsTrigger>
          <TabsTrigger value="images" className="data-[state=active]:bg-[hsl(43_50%_54%)] data-[state=active]:text-[hsl(0_0%_4%)]">Images</TabsTrigger>
          <TabsTrigger value="features" className="data-[state=active]:bg-[hsl(43_50%_54%)] data-[state=active]:text-[hsl(0_0%_4%)]">Features</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="mt-4">
          <Card className="bg-white border-[hsl(0_0%_90%)] shadow-sm">
            <CardContent className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className={labelClass}>Property Type</Label>
                  <Select value={propertyType} onValueChange={setPropertyType}>
                    <SelectTrigger className={inputClass}><SelectValue placeholder="Select type" /></SelectTrigger>
                    <SelectContent>
                      {['apartment', 'house', 'commercial', 'land', 'office'].map(t => (
                        <SelectItem key={t} value={t} className="capitalize">{t}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className={labelClass}>Transaction Type</Label>
                  <Select value={transactionType} onValueChange={setTransactionType}>
                    <SelectTrigger className={inputClass}><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sale">Sale</SelectItem>
                      <SelectItem value="rent">Rent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label className={labelClass}>Price (€)</Label>
                  <Input type="number" value={price} onChange={e => setPrice(e.target.value)} className={inputClass} />
                </div>
                <div className="space-y-2">
                  <Label className={labelClass}>Size (m²)</Label>
                  <Input type="number" value={size} onChange={e => setSize(e.target.value)} className={inputClass} />
                </div>
                <div className="space-y-2">
                  <Label className={labelClass}>Rooms</Label>
                  <Input type="number" value={rooms} onChange={e => setRooms(e.target.value)} className={inputClass} />
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label className={labelClass}>Bedrooms</Label>
                  <Input type="number" value={bedrooms} onChange={e => setBedrooms(e.target.value)} className={inputClass} />
                </div>
                <div className="space-y-2">
                  <Label className={labelClass}>Bathrooms</Label>
                  <Input type="number" value={bathrooms} onChange={e => setBathrooms(e.target.value)} className={inputClass} />
                </div>
                <div className="space-y-2">
                  <Label className={labelClass}>Floor</Label>
                  <Input type="number" value={floor} onChange={e => setFloor(e.target.value)} className={inputClass} />
                </div>
                <div className="space-y-2">
                  <Label className={labelClass}>Total Floors</Label>
                  <Input type="number" value={totalFloors} onChange={e => setTotalFloors(e.target.value)} className={inputClass} />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label className={labelClass}>Year Built</Label>
                  <Input type="number" value={yearBuilt} onChange={e => setYearBuilt(e.target.value)} className={inputClass} />
                </div>
                <div className="space-y-2">
                  <Label className={labelClass}>Energy Class</Label>
                  <Select value={energyClass} onValueChange={setEnergyClass}>
                    <SelectTrigger className={inputClass}><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>
                      {['A', 'B', 'C', 'D', 'E', 'F', 'G'].map(c => (
                        <SelectItem key={c} value={c}>{c}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className={labelClass}>Agent</Label>
                  <Select value={agentId} onValueChange={setAgentId}>
                    <SelectTrigger className={inputClass}><SelectValue placeholder="Select agent" /></SelectTrigger>
                    <SelectContent>
                      {(teamData ?? []).map(t => (
                        <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className={labelClass}>Latitude</Label>
                  <Input type="text" value={lat} onChange={e => setLat(e.target.value)} placeholder="59.4370" className={inputClass} />
                </div>
                <div className="space-y-2">
                  <Label className={labelClass}>Longitude</Label>
                  <Input type="text" value={lng} onChange={e => setLng(e.target.value)} placeholder="24.7536" className={inputClass} />
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Switch checked={isFeatured} onCheckedChange={setIsFeatured} />
                <Label className={labelClass}>Featured Property</Label>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="translations" className="mt-4">
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
                      <Input value={translations[lang]?.title || ''} onChange={e => updateTranslation(lang, 'title', e.target.value)} className={inputClass} />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className={labelClass}>Address</Label>
                        <Input value={translations[lang]?.address || ''} onChange={e => updateTranslation(lang, 'address', e.target.value)} className={inputClass} />
                      </div>
                      <div className="space-y-2">
                        <Label className={labelClass}>City</Label>
                        <Input value={translations[lang]?.city || ''} onChange={e => updateTranslation(lang, 'city', e.target.value)} className={inputClass} />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className={labelClass}>District</Label>
                      <Input value={translations[lang]?.district || ''} onChange={e => updateTranslation(lang, 'district', e.target.value)} className={inputClass} />
                    </div>
                    <div className="space-y-2">
                      <Label className={labelClass}>Description</Label>
                      <Textarea rows={8} value={translations[lang]?.description || ''} onChange={e => updateTranslation(lang, 'description', e.target.value)} className={inputClass} />
                    </div>
                  </TabsContent>
                ))}
              </Tabs>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="images" className="mt-4">
          <Card className="bg-white border-[hsl(0_0%_90%)] shadow-sm">
            <CardContent className="p-6 space-y-4">
              {/* Upload zone */}
              <div
                className="border-2 border-dashed border-[hsl(0_0%_85%)] rounded-lg p-8 text-center hover:border-[hsl(43_50%_54%)] transition-colors cursor-pointer"
                onClick={() => fileInputRef.current?.click()}
              >
                <ImageIcon className="h-8 w-8 mx-auto text-[hsl(0_0%_70%)] mb-2" />
                {isEdit ? (
                  <p className="text-sm text-[hsl(0_0%_50%)]">Click to upload images</p>
                ) : (
                  <p className="text-sm text-[hsl(0_0%_50%)]">Save the property first, then add images</p>
                )}
                <p className="text-xs text-[hsl(0_0%_70%)] mt-1">JPG, PNG, WebP — max 10MB each</p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*"
                className="hidden"
                onChange={handleImageUpload}
                disabled={!isEdit}
              />
              {uploadImages.isPending && (
                <div className="flex items-center gap-2 text-sm text-[hsl(0_0%_50%)]">
                  <Loader2 className="h-4 w-4 animate-spin" /> Uploading…
                </div>
              )}

              {/* Image grid */}
              {(existing?.images ?? []).length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {(existing?.images ?? []).map(img => (
                    <div key={img.id} className="relative group rounded-lg overflow-hidden border border-[hsl(0_0%_90%)]">
                      <img src={img.url} alt="" className="w-full h-24 object-cover" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <GripVertical className="h-4 w-4 text-white cursor-grab" />
                        <button
                          className="text-white hover:text-red-400"
                          onClick={() => handleDeleteImage(img.id)}
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                      {img.isCover && (
                        <span className="absolute top-1 left-1 text-[8px] bg-[hsl(43_50%_54%)] text-[hsl(0_0%_4%)] px-1.5 py-0.5 rounded font-medium">Cover</span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="features" className="mt-4">
          <Card className="bg-white border-[hsl(0_0%_90%)] shadow-sm">
            <CardContent className="p-6 space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder="Add a feature..."
                  value={newFeature}
                  onChange={e => setNewFeature(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addFeature())}
                  className={inputClass}
                />
                <Button onClick={addFeature} className="bg-[hsl(43_50%_54%)] hover:bg-[hsl(43_50%_48%)] text-[hsl(0_0%_4%)]">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {features.map(f => (
                  <Badge key={f} variant="secondary" className="bg-[hsl(0_0%_93%)] text-[hsl(0_0%_30%)] border-[hsl(0_0%_85%)] gap-1.5 py-1 px-3">
                    {f}
                    <button onClick={() => setFeatures(features.filter(x => x !== f))} className="hover:text-red-500"><X className="h-3 w-3" /></button>
                  </Badge>
                ))}
                {features.length === 0 && <p className="text-sm text-[hsl(0_0%_60%)]">No features added yet.</p>}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Save buttons */}
      <div className="flex gap-3 justify-end pt-2">
        <Button variant="outline" onClick={() => handleSave(true)} disabled={isSaving} className="border-[hsl(0_0%_85%)] text-[hsl(0_0%_40%)]">
          {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          Save as Draft
        </Button>
        <Button onClick={() => handleSave(false)} disabled={isSaving} className="bg-[hsl(43_50%_54%)] hover:bg-[hsl(43_50%_48%)] text-[hsl(0_0%_4%)]">
          {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          Save & Publish
        </Button>
      </div>
    </div>
  );
}
