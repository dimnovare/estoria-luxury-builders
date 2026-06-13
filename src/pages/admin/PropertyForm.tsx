import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Plus, X, GripVertical, Image as ImageIcon, Loader2, AlertTriangle, RefreshCw, MapPin, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import RichTextEditor from '@/components/ui/RichTextEditor';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';

import {
  useAdminProperty,
  useCreateProperty,
  useUpdateProperty,
  useUploadPropertyImages,
  useDeletePropertyImage,
  useReorderPropertyImages,
  useReprocessPropertyImage,
  useAdminTeam,
  useSetPropertyStatus,
  usePropertyExportPortals,
  toBeLang,
} from '@/hooks/api/useAdmin';
import { useGeocodeProperty } from '@/hooks/api/usePropertyGeocode';
import { propertyTypeLabel, transactionTypeLabel } from '@/lib/enumLabels';
import PropertyPortalControls from '@/components/admin/PropertyPortalControls';
import { initializePortalPublications } from '@/lib/propertyPortalPublications';
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
  const reorderImages = useReorderPropertyImages();
  const reprocessImage = useReprocessPropertyImage();
  const setStatus = useSetPropertyStatus();
  const geocode = useGeocodeProperty();
  const { data: exportPortals = [] } = usePropertyExportPortals();

  // Local copy of the image order so drag-to-reorder feels instant; synced from
  // the server list and persisted via the reorder endpoint on drop.
  type PropImage = NonNullable<typeof existing>['images'][number];
  const [orderedImages, setOrderedImages] = useState<PropImage[]>([]);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);

  useEffect(() => {
    const imgs = existing?.images ?? [];
    setOrderedImages([...imgs].sort((a, b) => a.sortOrder - b.sortOrder));
  }, [existing?.images]);

  const persistOrder = (imgs: PropImage[]) => {
    if (!id) return;
    reorderImages.mutate(
      { id, items: imgs.map((img, i) => ({ id: img.id, sortOrder: i })) },
      {
        onSuccess: () => toast.success(t('admin.properties.images.reordered', 'Image order saved.')),
        onError: () => toast.error(t('admin.properties.images.reorderFailed', "Couldn't save the new order.")),
      }
    );
  };

  const handleImageDrop = (target: number) => {
    setOverIndex(null);
    const from = dragIndex;
    setDragIndex(null);
    if (from === null || from === target) return;
    setOrderedImages(prev => {
      const next = [...prev];
      const [moved] = next.splice(from, 1);
      next.splice(target, 0, moved);
      persistOrder(next);
      return next;
    });
  };

  // Per-image timestamp tracking polling start. After 60s of Pending/Processing
  // we stop trusting the spinner and show "stuck" with a retry button —
  // protects against a wedged Hangfire worker.
  const pollStartRef = useRef<Record<string, number>>({});

  // Pending image-delete id drives the confirm dialog so a single mis-click
  // can't permanently remove an uploaded photo.
  const [pendingImageDelete, setPendingImageDelete] = useState<string | null>(null);

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
  const [portalPublications, setPortalPublications] = useState<Record<string, boolean>>({});

  const [translations, setTranslations] = useState<Record<string, TransFields>>({
    et: { ...emptyTrans },
    en: { ...emptyTrans },
    ru: { ...emptyTrans },
  });

  type FeatureRow = { et: string; en: string; ru: string };
  const emptyFeature: FeatureRow = { et: '', en: '', ru: '' };
  const [features, setFeatures] = useState<FeatureRow[]>([]);

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
      // Backend stores features as a flat string[] (currently the active
      // language's value). Hydrate ET = EN = RU = same value so the editor
      // can show 3-column rows; the user can refine per language and we
      // mirror back into translations.{lang}.features on save.
      setFeatures((existing.features ?? []).map(v => ({ et: v, en: v, ru: v })));
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

  // Build a complete portal map from the registered portals + any saved state, so
  // the form always submits every portal (off by default) and can't leave stale rows.
  useEffect(() => {
    if (exportPortals.length === 0) return;
    setPortalPublications(
      initializePortalPublications(exportPortals, existing?.portalPublications),
    );
  }, [exportPortals, existing?.portalPublications]);

  const updateTranslation = (lang: string, field: string, value: string) => {
    setTranslations(prev => ({ ...prev, [lang]: { ...prev[lang], [field]: value } }));
  };

  // Copy the whole English translation into another language as a starting
  // point, so the user can translate in place instead of retyping field labels.
  const copyTranslationFromEn = (lang: string) => {
    setTranslations(prev => ({ ...prev, [lang]: { ...prev.en } }));
    toast.success(t('admin.properties.toast.copiedFromEn', 'Copied English — now translate it.'));
  };

  const addFeature = () => {
    setFeatures([...features, { ...emptyFeature }]);
  };

  const updateFeature = (idx: number, lang: keyof FeatureRow, value: string) => {
    setFeatures(features.map((f, i) => i === idx ? { ...f, [lang]: value } : f));
  };

  const removeFeature = (idx: number) => {
    setFeatures(features.filter((_, i) => i !== idx));
  };

  const copyFeatureToAllLanguages = (idx: number, value: string) => {
    if (!value.trim()) return;
    setFeatures(features.map((f, i) => i === idx ? { et: value, en: value, ru: value } : f));
  };

  const handleSave = async (asDraft: boolean) => {
    if (!translations.en.title.trim()) {
      toast.error(t('admin.properties.validation.titleRequired'));
      return;
    }

    // The agent is a required FK on the backend — guard here so the owner gets a
    // clear message instead of a generic save failure.
    if (!agentId) {
      toast.error(t('admin.properties.validation.agentRequired'));
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
      // Flat features list (kept for backward compatibility) — picks the
      // first non-empty value across languages so list pages still get a
      // usable string. Per-language values live under translations.{lang}.features.
      features: features
        .map(f => f.en || f.et || f.ru)
        .filter(v => v && v.trim()),
      translations: Object.fromEntries(
        langs.map(l => [
          toBeLang(l),
          {
            ...translations[l],
            features: features.map(f => f[l]).filter(v => v && v.trim()),
          },
        ])
      ),
      // Complete portal map; draft status (not this map) is what keeps a listing
      // out of the feed, so selections are preserved even when saving as draft.
      portalPublications,
    };

    try {
      let propertyId = id;
      if (isEdit && id) {
        await updateProperty.mutateAsync({ id, dto });
      } else {
        const result = await createProperty.mutateAsync(dto) as { id: string };
        propertyId = result.id;
      }

      // Status lives on a separate endpoint, so set it after the content saves.
      // This is what makes "Save & Publish" actually publish (Active) and
      // "Save as Draft" keep the listing hidden (Draft) — mirrors BlogForm.
      if (propertyId) {
        await setStatus.mutateAsync({ id: propertyId, status: asDraft ? 'Draft' : 'Active' });
      }

      if (isEdit) {
        toast.success(asDraft ? t('admin.properties.toast.updated') : t('admin.properties.toast.published'));
        navigate('/admin/properties');
      } else {
        // New listing: stay on the edit screen so the owner can add images next.
        toast.success(t('admin.properties.toast.createdEdit'));
        navigate(`/admin/properties/${propertyId}/edit`);
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
  const helpClass = "text-xs text-[hsl(0_0%_55%)]";
  const requiredMark = <span className="text-[hsl(43_50%_45%)]" title="Required">*</span>;

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
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate('/admin/properties')}
          aria-label={t('admin.common.back')}
          title={t('admin.common.back')}
          className="text-[hsl(0_0%_40%)]"
        >
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
          <Accordion type="multiple" defaultValue={['basics', 'details', 'location', 'visibility']} className="space-y-4">

            {/* ── Basics (required) ─────────────────────────────────────────── */}
            <AccordionItem value="basics" className="border rounded-lg bg-white border-[hsl(0_0%_90%)] shadow-sm">
              <AccordionTrigger className="px-6 py-4 hover:no-underline">
                <span className="text-sm font-medium text-[hsl(0_0%_25%)]">Basics</span>
              </AccordionTrigger>
              <AccordionContent className="px-6 pb-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className={labelClass}>{t('admin.properties.fields.propertyType')} {requiredMark}</Label>
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
                    <Label className={labelClass}>{t('admin.properties.fields.transactionType')} {requiredMark}</Label>
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
                    <Label className={labelClass}>{t('admin.properties.fields.price')} {requiredMark}</Label>
                    <Input type="number" value={price} onChange={e => setPrice(e.target.value)} className={inputClass} />
                    <p className={helpClass}>In euros (€). For rentals, the monthly rent.</p>
                  </div>
                  <div className="space-y-2">
                    <Label className={labelClass}>{t('admin.properties.fields.size')} {requiredMark}</Label>
                    <Input type="number" value={size} onChange={e => setSize(e.target.value)} className={inputClass} />
                    <p className={helpClass}>Floor area in m².</p>
                  </div>
                  <div className="space-y-2">
                    <Label className={labelClass}>{t('admin.properties.fields.rooms')}</Label>
                    <Input type="number" value={rooms} onChange={e => setRooms(e.target.value)} className={inputClass} />
                  </div>
                </div>
                <p className="text-xs text-[hsl(0_0%_55%)]">
                  The listing title and description are set per language in the <strong>Translations</strong> tab — at least the English title is required to save.
                </p>
              </AccordionContent>
            </AccordionItem>

            {/* ── Property details (optional) ───────────────────────────────── */}
            <AccordionItem value="details" className="border rounded-lg bg-white border-[hsl(0_0%_90%)] shadow-sm">
              <AccordionTrigger className="px-6 py-4 hover:no-underline">
                <span className="text-sm font-medium text-[hsl(0_0%_25%)]">Property details <span className="text-[hsl(0_0%_60%)] font-normal">(optional)</span></span>
              </AccordionTrigger>
              <AccordionContent className="px-6 pb-6 space-y-6">
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

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                    <p className={helpClass}>Estonia's A–G energy rating (A = most efficient). Leave blank if unknown.</p>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* ── Location ──────────────────────────────────────────────────── */}
            <AccordionItem value="location" className="border rounded-lg bg-white border-[hsl(0_0%_90%)] shadow-sm">
              <AccordionTrigger className="px-6 py-4 hover:no-underline">
                <span className="text-sm font-medium text-[hsl(0_0%_25%)]">Location on map <span className="text-[hsl(0_0%_60%)] font-normal">(optional)</span></span>
              </AccordionTrigger>
              <AccordionContent className="px-6 pb-6 space-y-4">
                <p className={helpClass}>
                  Set the address in the <strong>Translations</strong> tab, then click <strong>Find on map</strong>.
                  We place the pin from the address automatically — no need to type coordinates by hand.
                </p>

                {/* Resolved-location status. Coordinates are derived, never hand-entered. */}
                <div className="rounded-md border border-[hsl(0_0%_90%)] bg-[hsl(0_0%_98%)] px-4 py-3 text-sm">
                  {lat && lng ? (
                    <div className="flex items-center justify-between gap-3">
                      <span className="flex items-center gap-2 text-[hsl(0_0%_25%)]">
                        <MapPin className="h-4 w-4 text-green-600 shrink-0" />
                        {t('admin.properties.location.located')}{' '}
                        <span className="font-mono text-[hsl(0_0%_45%)]">{parseFloat(lat).toFixed(5)}, {parseFloat(lng).toFixed(5)}</span>
                      </span>
                      <button
                        type="button"
                        className="text-xs text-[hsl(0_0%_50%)] hover:text-red-500 underline shrink-0"
                        onClick={() => { setLat(''); setLng(''); }}
                      >
                        {t('admin.properties.location.clear')}
                      </button>
                    </div>
                  ) : (
                    <span className="text-[hsl(0_0%_50%)]">{t('admin.properties.location.notSet')}</span>
                  )}
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
                      // Geocode the address currently typed in the Translations tab
                      // (ET first, then EN, then RU) so it works before saving.
                      const addr = translations.et?.address || translations.en?.address || translations.ru?.address || '';
                      const cty = translations.et?.city || translations.en?.city || translations.ru?.city || '';
                      geocode.mutate({ id, address: addr, city: cty }, {
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
                    {lat && lng ? t('admin.properties.location.refind') : t('admin.properties.geocodeButton')}
                  </Button>
                  {!id && (
                    <p className={`${helpClass} mt-2`}>Save the property first, then come back here to find it on the map.</p>
                  )}
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* ── Visibility & agent ────────────────────────────────────────── */}
            <AccordionItem value="visibility" className="border rounded-lg bg-white border-[hsl(0_0%_90%)] shadow-sm">
              <AccordionTrigger className="px-6 py-4 hover:no-underline">
                <span className="text-sm font-medium text-[hsl(0_0%_25%)]">Visibility &amp; agent</span>
              </AccordionTrigger>
              <AccordionContent className="px-6 pb-6 space-y-6">
                <div className="space-y-2 max-w-sm">
                  <Label className={labelClass}>{t('admin.properties.fields.agent')}</Label>
                  <Select value={agentId} onValueChange={setAgentId}>
                    <SelectTrigger className={inputClass}><SelectValue placeholder={t('admin.properties.fields.selectAgent')} /></SelectTrigger>
                    <SelectContent>
                      {(teamData ?? []).map(member => (
                        <SelectItem key={member.id} value={member.id}>{member.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className={helpClass}>The contact shown on the listing and used for inquiries.</p>
                </div>

                <div className="flex items-center gap-3">
                  <Switch checked={isFeatured} onCheckedChange={setIsFeatured} />
                  <div>
                    <Label className={labelClass}>{t('admin.properties.fields.featured')}</Label>
                    <p className={helpClass}>Featured properties appear on the homepage.</p>
                  </div>
                </div>

                {exportPortals.length > 0 && (
                  <div className="pt-2 border-t border-[hsl(0_0%_92%)]">
                    <PropertyPortalControls
                      portals={exportPortals}
                      values={portalPublications}
                      states={existing?.portalPublications ?? {}}
                      onChange={(key, enabled) =>
                        setPortalPublications(current => ({ ...current, [key]: enabled }))
                      }
                    />
                  </div>
                )}
              </AccordionContent>
            </AccordionItem>
          </Accordion>
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
                    {lang !== 'en' && (
                      <div className="flex justify-end">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => copyTranslationFromEn(lang)}
                          className="text-xs text-[hsl(0_0%_50%)] hover:text-[hsl(43_50%_45%)]"
                        >
                          <Copy className="h-3.5 w-3.5 mr-1" /> Copy from English
                        </Button>
                      </div>
                    )}
                    <div className="space-y-2">
                      <Label className={labelClass}>{t('admin.properties.fields.title')} {lang === 'en' && requiredMark}</Label>
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
              {orderedImages.length > 0 && (
                <>
                <p className="text-xs text-[hsl(0_0%_45%)] flex items-center gap-1.5">
                  <GripVertical className="h-3.5 w-3.5" />
                  {t('admin.properties.images.dragHint', 'Drag images to reorder. The first image is used as the cover.')}
                </p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {orderedImages.map((img, idx) => {
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
                      <div
                        key={img.id}
                        draggable={!isWorking}
                        onDragStart={() => setDragIndex(idx)}
                        onDragEnter={() => setOverIndex(idx)}
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={() => handleImageDrop(idx)}
                        onDragEnd={() => { setDragIndex(null); setOverIndex(null); }}
                        className={`relative group rounded-lg overflow-hidden border bg-white transition-all ${!isWorking ? 'cursor-grab active:cursor-grabbing' : ''} ${
                          overIndex === idx && dragIndex !== null && dragIndex !== idx
                            ? 'border-[hsl(43_50%_54%)] ring-2 ring-[hsl(43_50%_54%)]'
                            : 'border-[hsl(0_0%_90%)]'
                        } ${dragIndex === idx ? 'opacity-40' : ''}`}
                      >
                        {previewUrl ? (
                          <img src={previewUrl} alt="" draggable={false} className="w-full h-24 object-cover" />
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
                            type="button"
                            className="text-white hover:text-red-400"
                            onClick={() => setPendingImageDelete(img.id)}
                            aria-label={t('admin.common.delete')}
                            title={t('admin.common.delete')}
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
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="features" className="mt-4">
          <Card className="bg-white border-[hsl(0_0%_90%)] shadow-sm">
            <CardContent className="p-6 space-y-3">
              <p className="text-xs text-[hsl(0_0%_50%)]">
                Enter each feature in all three languages. Use the copy button to mirror the EN value into ET and RU.
              </p>
              {features.map((f, idx) => (
                <div key={idx} className="grid grid-cols-1 md:grid-cols-[1fr_1fr_1fr_auto_auto] gap-2 items-center">
                  <Input
                    value={f.et}
                    onChange={e => updateFeature(idx, 'et', e.target.value)}
                    placeholder="ET"
                    className={inputClass}
                  />
                  <Input
                    value={f.en}
                    onChange={e => updateFeature(idx, 'en', e.target.value)}
                    placeholder="EN"
                    className={inputClass}
                  />
                  <Input
                    value={f.ru}
                    onChange={e => updateFeature(idx, 'ru', e.target.value)}
                    placeholder="RU"
                    className={inputClass}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label={t('admin.properties.features.copyEnToAll', 'Copy EN to all languages')}
                    title={t('admin.properties.features.copyEnToAll', 'Copy EN to all languages')}
                    onClick={() => copyFeatureToAllLanguages(idx, f.en)}
                    className="h-9 w-9 text-[hsl(0_0%_45%)] hover:text-[hsl(43_50%_45%)]"
                  >
                    <Copy className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeFeature(idx)}
                    aria-label={t('admin.common.delete')}
                    title={t('admin.common.delete')}
                    className="h-9 w-9 text-[hsl(0_0%_45%)] hover:text-red-500"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              {features.length === 0 && (
                <p className="text-sm text-[hsl(0_0%_60%)]">{t('admin.properties.features.empty')}</p>
              )}
              <Button
                type="button"
                onClick={addFeature}
                variant="outline"
                className="border-[hsl(0_0%_85%)] text-[hsl(0_0%_30%)]"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Feature
              </Button>
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

      <ConfirmDialog
        open={!!pendingImageDelete}
        onOpenChange={(o) => !o && setPendingImageDelete(null)}
        onConfirm={() => { if (pendingImageDelete) handleDeleteImage(pendingImageDelete); setPendingImageDelete(null); }}
        title={t('admin.properties.images.confirmDeleteTitle', 'Delete this image?')}
        description={t('admin.properties.images.confirmDeleteDesc', "The image will be permanently removed. This can't be undone.")}
        confirmLabel={t('admin.common.delete')}
      />
    </div>
  );
}
