import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Plus, X, GripVertical, Image as ImageIcon, Loader2, AlertTriangle, RefreshCw, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import RichTextEditor from '@/components/ui/RichTextEditor';
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
  useReprocessPropertyImage,
  useAdminTeam,
  toBeLang,
} from '@/hooks/api/useAdmin';
import { useGeocodeProperty } from '@/hooks/api/usePropertyGeocode';
import { propertyTypeLabel, transactionTypeLabel } from '@/lib/enumLabels';
import { toast } from 'sonner';

const langs = ['et', 'en', 'ru'] as const;
const PROPERTY_TYPE_VALUES = ['Apartment', 'House', 'Commercial', 'Land', 'Office'] as const;
const TRANSACTION_TYPE_VALUES = ['Sale', 'Rent'] as const;

type TransFields = { title: string; description: string; address: string; city: string; district: string; };
const emptyTrans: TransFields = { title: '', description: '', address: '', city: '', district: '' };

export default function PropertyForm() {
  const { t } = useTranslation();
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
  const reprocessImage = useReprocessPropertyImage();
  const geocode = useGeocodeProperty();

  // Per-image timestamp tracking polling start. After 60s of Pending/Processing
  // we stop trusting the spinner and show "stuck" with a retry button —
  // protects against a wedged Hangfire worker.
  const pollStartRef = useRef<Record<string, number>>({});

  const handleReprocess = async (imageId: string) => {
    try {
      await reprocessImage.mutateAsync(imageId);
      delete pollStartRef.current[imageId];
      toast.success(t('admin.properties.images.reprocessQueued'));
    } catch {
      toast.error(t('admin.properties.images.reprocessFailed'));
    }
  };

  // PascalCase enum values throughout — match server canon and selectable values.
  const [propertyType, setPropertyType] = useState('');
  const [transactionType, setTransactionType] = useState('Sale');
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
      // Normalize to PascalCase regardless of what the API returned
      const norm = (v: string) => v ? v.charAt(0).toUpperCase() + v.slice(1).toLowerCase() : '';
      setPropertyType(norm(existing.propertyType));
      setTransactionType(norm(existing.transactionType) || 'Sale');
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
    if (!translations.en.title.trim()) {
      toast.error(t('admin.properties.validation.titleRequired'));
      return;
    }

    const dto = {
      transactionType,
      propertyType,
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
        toast.success(t('admin.properties.toast.updated'));
        navigate('/admin/properties');
      } else {
        const result = await createProperty.mutateAsync(dto) as { id: string };
        toast.success(t('admin.properties.toast.createdEdit'));
        navigate(`/admin/properties/${result.id}/edit`);
      }
    } catch {
      toast.error(t('admin.properties.toast.saveFailed'));
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!isEdit || !id || !e.target.files?.length) return;
    try {
      await uploadImages.mutateAsync({ id, files: e.target.files });
      toast.success(t('admin.properties.toast.imagesUploaded'));
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch {
      toast.error(t('admin.properties.toast.imageUploadFailed'));
    }
  };

  const handleDeleteImage = async (imageId: string) => {
    if (!id) return;
    try {
      await deleteImage.mutateAsync({ propertyId: id, imageId });
      toast.success(t('admin.properties.toast.imageRemoved'));
    } catch {
      toast.error(t('admin.properties.toast.imageRemoveFailed'));
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
        <h1 className="text-2xl font-semibold text-[hsl(0_0%_15%)]">{isEdit ? t('admin.properties.editTitle') : t('admin.properties.newTitle')}</h1>
      </div>

      <Tabs defaultValue="general">
        <TabsList className="bg-white border border-[hsl(0_0%_90%)]">
          <TabsTrigger value="general"      className="data-[state=active]:bg-[hsl(43_50%_54%)] data-[state=active]:text-[hsl(0_0%_4%)]">{t('admin.properties.tabs.general')}</TabsTrigger>
          <TabsTrigger value="translations" className="data-[state=active]:bg-[hsl(43_50%_54%)] data-[state=active]:text-[hsl(0_0%_4%)]">{t('admin.properties.tabs.translations')}</TabsTrigger>
          <TabsTrigger value="images"       className="data-[state=active]:bg-[hsl(43_50%_54%)] data-[state=active]:text-[hsl(0_0%_4%)]">{t('admin.properties.tabs.images')}</TabsTrigger>
          <TabsTrigger value="features"     className="data-[state=active]:bg-[hsl(43_50%_54%)] data-[state=active]:text-[hsl(0_0%_4%)]">{t('admin.properties.tabs.features')}</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="mt-4">
          <Card className="bg-white border-[hsl(0_0%_90%)] shadow-sm">
            <CardContent className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className={labelClass}>{t('admin.properties.fields.propertyType')}</Label>
                  <Select value={propertyType} onValueChange={setPropertyType}>
                    <SelectTrigger className={inputClass}><SelectValue placeholder={t('admin.properties.fields.selectType')} /></SelectTrigger>
                    <SelectContent>
                      {PROPERTY_TYPE_VALUES.map(v => (
                        <SelectItem key={v} value={v}>{propertyTypeLabel(v, t)}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className={labelClass}>{t('admin.properties.fields.transactionType')}</Label>
                  <Select value={transactionType} onValueChange={setTransactionType}>
                    <SelectTrigger className={inputClass}><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {TRANSACTION_TYPE_VALUES.map(v => (
                        <SelectItem key={v} value={v}>{transactionTypeLabel(v, t)}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label className={labelClass}>{t('admin.properties.fields.price')}</Label>
                  <Input type="number" value={price} onChange={e => setPrice(e.target.value)} className={inputClass} />
                </div>
                <div className="space-y-2">
                  <Label className={labelClass}>{t('admin.properties.fields.size')}</Label>
                  <Input type="number" value={size} onChange={e => setSize(e.target.value)} className={inputClass} />
                </div>
                <div className="space-y-2">
                  <Label className={labelClass}>{t('admin.properties.fields.rooms')}</Label>
                  <Input type="number" value={rooms} onChange={e => setRooms(e.target.value)} className={inputClass} />
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label className={labelClass}>{t('admin.properties.fields.bedrooms')}</Label>
                  <Input type="number" value={bedrooms} onChange={e => setBedrooms(e.target.value)} className={inputClass} />
                </div>
                <div className="space-y-2">
                  <Label className={labelClass}>{t('admin.properties.fields.bathrooms')}</Label>
                  <Input type="number" value={bathrooms} onChange={e => setBathrooms(e.target.value)} className={inputClass} />
                </div>
                <div className="space-y-2">
                  <Label className={labelClass}>{t('admin.properties.fields.floor')}</Label>
                  <Input type="number" value={floor} onChange={e => setFloor(e.target.value)} className={inputClass} />
                </div>
                <div className="space-y-2">
                  <Label className={labelClass}>{t('admin.properties.fields.totalFloors')}</Label>
                  <Input type="number" value={totalFloors} onChange={e => setTotalFloors(e.target.value)} className={inputClass} />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label className={labelClass}>{t('admin.properties.fields.yearBuilt')}</Label>
                  <Input type="number" value={yearBuilt} onChange={e => setYearBuilt(e.target.value)} className={inputClass} />
                </div>
                <div className="space-y-2">
                  <Label className={labelClass}>{t('admin.properties.fields.energyClass')}</Label>
                  <Select value={energyClass} onValueChange={setEnergyClass}>
                    <SelectTrigger className={inputClass}><SelectValue placeholder={t('admin.properties.fields.selectEnergyClass')} /></SelectTrigger>
                    <SelectContent>
                      {['A', 'B', 'C', 'D', 'E', 'F', 'G'].map(c => (
                        <SelectItem key={c} value={c}>{c}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className={labelClass}>{t('admin.properties.fields.agent')}</Label>
                  <Select value={agentId} onValueChange={setAgentId}>
                    <SelectTrigger className={inputClass}><SelectValue placeholder={t('admin.properties.fields.selectAgent')} /></SelectTrigger>
                    <SelectContent>
                      {(teamData ?? []).map(member => (
                        <SelectItem key={member.id} value={member.id}>{member.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className={labelClass}>{t('admin.properties.fields.latitude')}</Label>
                  <Input type="text" value={lat} onChange={e => setLat(e.target.value)} placeholder="59.4370" className={inputClass} />
                </div>
                <div className="space-y-2">
                  <Label className={labelClass}>{t('admin.properties.fields.longitude')}</Label>
                  <Input type="text" value={lng} onChange={e => setLng(e.target.value)} placeholder="24.7536" className={inputClass} />
                </div>
              </div>

              {/* Geocode button — disabled in create mode (no id yet to call against). */}
              <div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={!id || geocode.isPending}
                  onClick={() => {
                    if (!id) return;
                    geocode.mutate(id, {
                      onSuccess: (data) => {
                        setLat(data.latitude.toString());
                        setLng(data.longitude.toString());
                        toast.success(t('admin.properties.toast.geocoded'));
                      },
                      onError: () => toast.error(t('admin.properties.toast.geocodeFailed')),
                    });
                  }}
                >
                  {geocode.isPending
                    ? <Loader2 className="h-3 w-3 animate-spin mr-1" />
                    : <MapPin className="h-3 w-3 mr-1" />}
                  {t('admin.properties.geocodeButton')}
                </Button>
              </div>

              <div className="flex items-center gap-3">
                <Switch checked={isFeatured} onCheckedChange={setIsFeatured} />
                <Label className={labelClass}>{t('admin.properties.fields.featured')}</Label>
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
                      <Label className={labelClass}>{t('admin.properties.fields.title')}</Label>
                      <Input value={translations[lang]?.title || ''} onChange={e => updateTranslation(lang, 'title', e.target.value)} className={inputClass} />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className={labelClass}>{t('admin.properties.fields.address')}</Label>
                        <Input value={translations[lang]?.address || ''} onChange={e => updateTranslation(lang, 'address', e.target.value)} className={inputClass} />
                      </div>
                      <div className="space-y-2">
                        <Label className={labelClass}>{t('admin.properties.fields.city')}</Label>
                        <Input value={translations[lang]?.city || ''} onChange={e => updateTranslation(lang, 'city', e.target.value)} className={inputClass} />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className={labelClass}>{t('admin.properties.fields.district')}</Label>
                      <Input value={translations[lang]?.district || ''} onChange={e => updateTranslation(lang, 'district', e.target.value)} className={inputClass} />
                    </div>
                    <div className="space-y-2">
                      <Label className={labelClass}>{t('admin.properties.fields.description')}</Label>
                      <RichTextEditor
                        value={translations[lang]?.description ?? ''}
                        onChange={(html) => updateTranslation(lang, 'description', html)}
                        placeholder="Property description..."
                        minHeight="200px"
                      />
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
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${isEdit ? 'border-[hsl(0_0%_85%)] hover:border-[hsl(43_50%_54%)] cursor-pointer' : 'border-[hsl(0_0%_90%)] opacity-60 cursor-not-allowed'}`}
                onClick={() => isEdit && fileInputRef.current?.click()}
              >
                <ImageIcon className="h-8 w-8 mx-auto text-[hsl(0_0%_70%)] mb-2" />
                {isEdit ? (
                  <p className="text-sm text-[hsl(0_0%_50%)]">{t('admin.properties.images.uploadEdit')}</p>
                ) : (
                  <p className="text-sm text-[hsl(0_0%_50%)]">{t('admin.properties.images.uploadCreate')}</p>
                )}
                <p className="text-xs text-[hsl(0_0%_70%)] mt-1">{t('admin.properties.images.uploadHint')}</p>
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
                  <Loader2 className="h-4 w-4 animate-spin" /> {t('admin.properties.images.uploading')}
                </div>
              )}

              {/* Image grid */}
              {(existing?.images ?? []).length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {(existing?.images ?? []).map(img => {
                    const status = img.processingStatus ?? 'Done';
                    const isWorking = status === 'Pending' || status === 'Processing';
                    const isFailed = status === 'Failed';

                    // Track when polling started for this image so we can flip
                    // to "stuck" after 60s. Reset on Done/Failed so a future
                    // reprocess starts a fresh window.
                    if (isWorking && !pollStartRef.current[img.id]) {
                      pollStartRef.current[img.id] = Date.now();
                    }
                    if (!isWorking && pollStartRef.current[img.id]) {
                      delete pollStartRef.current[img.id];
                    }

                    const stuck = isWorking
                      && pollStartRef.current[img.id]
                      && Date.now() - pollStartRef.current[img.id] > 60_000;

                    const previewUrl = img.thumbUrl ?? img.url;

                    return (
                      <div key={img.id} className="relative group rounded-lg overflow-hidden border border-[hsl(0_0%_90%)]">
                        {previewUrl ? (
                          <img src={previewUrl} alt="" className="w-full h-24 object-cover" />
                        ) : (
                          <div className="w-full h-24 bg-[hsl(0_0%_94%)] flex items-center justify-center">
                            <ImageIcon className="h-6 w-6 text-[hsl(0_0%_70%)]" />
                          </div>
                        )}

                        {/* Pending/Processing overlay — spinner + label so the
                            admin sees the row exists but isn't ready yet. */}
                        {isWorking && !stuck && (
                          <div className="absolute inset-0 bg-black/55 flex items-center justify-center">
                            <Loader2 className="h-5 w-5 text-white animate-spin" />
                          </div>
                        )}

                        {/* Stuck after 60s — invite a retry rather than spin
                            forever, in case the Hangfire worker wedged. */}
                        {stuck && (
                          <div className="absolute inset-0 bg-black/65 flex flex-col items-center justify-center gap-1 px-2 text-center">
                            <AlertTriangle className="h-5 w-5 text-amber-400" />
                            <span className="text-[10px] text-white font-medium">
                              {t('admin.properties.images.processingStuck')}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleReprocess(img.id)}
                              className="mt-1 text-[10px] text-amber-300 hover:text-amber-200 underline flex items-center gap-1"
                            >
                              <RefreshCw className="h-3 w-3" />
                              {t('admin.properties.images.retry')}
                            </button>
                          </div>
                        )}

                        {/* Failed — same retry affordance, different copy. */}
                        {isFailed && (
                          <div className="absolute inset-0 bg-red-500/55 flex flex-col items-center justify-center gap-1 px-2 text-center">
                            <AlertTriangle className="h-5 w-5 text-white" />
                            <span className="text-[10px] text-white font-medium">
                              {t('admin.properties.images.processingFailed')}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleReprocess(img.id)}
                              className="mt-1 text-[10px] text-white hover:text-amber-200 underline flex items-center gap-1"
                            >
                              <RefreshCw className="h-3 w-3" />
                              {t('admin.properties.images.retry')}
                            </button>
                          </div>
                        )}

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
                          <span className="absolute top-1 left-1 text-[8px] bg-[hsl(43_50%_54%)] text-[hsl(0_0%_4%)] px-1.5 py-0.5 rounded font-medium">{t('admin.properties.images.cover')}</span>
                        )}
                      </div>
                    );
                  })}
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
                  placeholder={t('admin.properties.features.addPlaceholder')}
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
                {features.length === 0 && <p className="text-sm text-[hsl(0_0%_60%)]">{t('admin.properties.features.empty')}</p>}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Save buttons */}
      <div className="flex gap-3 justify-end pt-2">
        <Button variant="outline" onClick={() => handleSave(true)} disabled={isSaving} className="border-[hsl(0_0%_85%)] text-[hsl(0_0%_40%)]">
          {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          {t('admin.properties.saveDraft')}
        </Button>
        <Button onClick={() => handleSave(false)} disabled={isSaving} className="bg-[hsl(43_50%_54%)] hover:bg-[hsl(43_50%_48%)] text-[hsl(0_0%_4%)]">
          {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          {t('admin.properties.savePublish')}
        </Button>
      </div>
    </div>
  );
}
