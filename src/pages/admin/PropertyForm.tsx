import { useId, useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, ArrowRight, Plus, X, GripVertical, Image as ImageIcon, Loader2, AlertTriangle, RefreshCw, MapPin, Copy, Sparkles, Search } from 'lucide-react';
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
  useGenerateDescription,
  useCadastralLookup,
  toBeLang,
} from '@/hooks/api/useAdmin';
import { useGeocodeProperty } from '@/hooks/api/usePropertyGeocode';
import { propertyTypeLabel, transactionTypeLabel } from '@/lib/enumLabels';
import PropertyPortalControls from '@/components/admin/PropertyPortalControls';
import TranslateButton from '@/components/admin/TranslateButton';
import EhakLocationPicker from '@/components/admin/EhakLocationPicker';
import PropertyExtraDetails from '@/components/admin/PropertyExtraDetails';
import PropertyConnectionsPanel from '@/components/admin/PropertyConnectionsPanel';
import PropertyDocumentsPanel from '@/components/admin/PropertyDocumentsPanel';
import type { PropertyExtraFields } from '@/lib/propertyExportOptions';
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
  const fieldId = useId();

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
  const generateDescription = useGenerateDescription();
  const cadastralLookup = useCadastralLookup();
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

  // Touch-friendly reorder fallback (drag-and-drop is hard on phones): move a
  // photo one position left/right. The first photo is the cover.
  const moveImage = (from: number, to: number) => {
    if (to < 0 || to >= orderedImages.length) return;
    setOrderedImages(prev => {
      const next = [...prev];
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
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

  // ── Kinnisvara24 location + extra detail fields (all optional) ──────────────
  // EHAK code + cadastral number drive the Land Board address fill on the portal;
  // `extra` carries the remaining grouped detail fields (condition, heating,
  // amenities, parking, rental, media) edited via <PropertyExtraDetails>.
  const [ehakCode, setEhakCode] = useState<string | null>(null);
  const [cadastralNumber, setCadastralNumber] = useState('');
  const [extra, setExtra] = useState<PropertyExtraFields>({});

  const [translations, setTranslations] = useState<Record<string, TransFields>>({
    et: { ...emptyTrans },
    en: { ...emptyTrans },
    ru: { ...emptyTrans },
  });

  // Features are canonical, non-localized tags (saved searches filter on the
  // exact string), so they're a single list — not per-language.
  const [features, setFeatures] = useState<string[]>([]);

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
      // Kinnisvara24 location + extra detail fields — all optional/nullable.
      setEhakCode(existing.ehakCode ?? null);
      setCadastralNumber(existing.cadastralNumber ?? '');
      setExtra({
        condition: existing.condition ?? null,
        buildingMaterial: existing.buildingMaterial ?? null,
        heatingTypes: existing.heatingTypes ?? [],
        parkingType: existing.parkingType ?? null,
        hasSauna: existing.hasSauna ?? false,
        hasStoreroom: existing.hasStoreroom ?? false,
        hasBasement: existing.hasBasement ?? false,
        hasGarage: existing.hasGarage ?? false,
        hasBalcony: existing.hasBalcony ?? false,
        hasTerrace: existing.hasTerrace ?? false,
        hasElevator: existing.hasElevator ?? false,
        isFurnished: existing.isFurnished ?? false,
        hasAirConditioning: existing.hasAirConditioning ?? false,
        hasFireplace: existing.hasFireplace ?? false,
        kitchenArea: existing.kitchenArea ?? null,
        deposit: existing.deposit ?? null,
        utilityCostSummer: existing.utilityCostSummer ?? null,
        utilityCostWinter: existing.utilityCostWinter ?? null,
        petsAllowed: existing.petsAllowed ?? false,
        videoUrl: existing.videoUrl ?? null,
        virtualTourUrl: existing.virtualTourUrl ?? null,
      });
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

  // Merge a partial patch from <PropertyExtraDetails> back into the extra state.
  const updateExtra = (patch: Partial<PropertyExtraFields>) => {
    setExtra(prev => ({ ...prev, ...patch }));
  };

  // EHAK picker → store the resolved code (or null), and as a convenience prefill
  // the Estonian City/District from the picked municipality/area — but ONLY when
  // the owner hasn't already typed a city, so we never clobber their wording.
  const handleEhakChange = (
    sel: { ehakCode: string; municipality: string; area: string | null; county: string } | null,
  ) => {
    setEhakCode(sel?.ehakCode ?? null);
    if (sel) {
      setTranslations(prev => {
        if (prev.et?.city?.trim()) return prev; // don't overwrite an existing city
        return {
          ...prev,
          et: {
            ...prev.et,
            city: sel.municipality,
            district: sel.area ?? prev.et?.district ?? '',
          },
        };
      });
    }
  };

  // Draft the Estonian listing description from the property's facts so the
  // owner doesn't start from a blank box. They edit it, then use the existing
  // "Translate from Estonian" button to fill EN/RU. Works even with sparse
  // info — the backend copes with whatever facts we send.
  const handleGenerateDescription = () => {
    if (generateDescription.isPending) return;

    const facts: Record<string, string> = {};
    const add = (key: string, value: string | undefined | null) => {
      const v = (value ?? '').toString().trim();
      if (v) facts[key] = v;
    };

    add('propertyType', propertyType ? propertyTypeLabel(propertyType, t) : '');
    add('transactionType', transactionType ? transactionTypeLabel(transactionType, t) : '');
    if (price.trim()) add('price', `${price.trim()} EUR`);
    if (size.trim()) add('size', `${size.trim()} m²`);
    add('rooms', rooms);
    add('bedrooms', bedrooms);
    add('bathrooms', bathrooms);
    add('floor', floor);
    add('totalFloors', totalFloors);
    add('yearBuilt', yearBuilt);
    add('energyClass', energyClass);
    add('city', translations.et?.city);
    add('district', translations.et?.district);
    add('address', translations.et?.address);

    const featureList = features.filter(v => v && v.trim());
    if (featureList.length) add('features', featureList.join(', '));

    generateDescription.mutate(
      { facts, lang: 'et' },
      {
        onSuccess: (result) => {
          updateTranslation('et', 'description', result);
          toast.success(t('admin.properties.aiDescribeDone', 'Draft written — review and edit.'));
        },
        onError: () => toast.error(t('admin.properties.aiDescribeFailed', "Couldn't write a description. Try again.")),
      }
    );
  };

  // Resolve the property's address, administrative location (EHAK) and map pin
  // from its cadastral number via the Land Board. This is an explicit owner
  // action, so it overwrites the Estonian address/city/district outright; EN/RU
  // are left untouched (translate from ET when ready). The lat/lng it fills are
  // the same map-pin state the geocode button uses.
  const handleCadastralLookup = () => {
    const tunnus = cadastralNumber.trim();
    if (!tunnus || cadastralLookup.isPending) return;

    cadastralLookup.mutate(tunnus, {
      onSuccess: (data) => {
        if (!data.found) {
          toast.error(t('admin.properties.extra.location.lookupFailed', 'No property found for that cadastral number.'));
          return;
        }

        setEhakCode(data.settlementEhak || data.municipalityEhak || null);

        const address = `${data.street ?? ''} ${data.houseNumber ?? ''}`.trim();
        setTranslations(prev => ({
          ...prev,
          et: {
            ...prev.et,
            ...(data.street ? { address } : {}),
            city: data.municipality ?? prev.et?.city ?? '',
            district: data.settlement ?? prev.et?.district ?? '',
          },
        }));

        if (data.latitude != null && data.longitude != null) {
          setLat(data.latitude.toString());
          setLng(data.longitude.toString());
        }

        toast.success(t('admin.properties.extra.location.lookupDone', 'Filled from {{address}}.', { address: data.fullAddress ?? tunnus }));
      },
      onError: () => toast.error(t('admin.properties.extra.location.lookupFailed', 'No property found for that cadastral number.')),
    });
  };

  // Copy the whole Estonian translation into another language as a starting
  // point (Estonian is the primary authoring language).
  const copyTranslationFromEt = (lang: string) => {
    setTranslations(prev => ({ ...prev, [lang]: { ...prev.et } }));
    toast.success(t('admin.properties.toast.copiedFromEt', 'Copied Estonian — now translate it.'));
  };

  const addFeature = () => {
    setFeatures([...features, '']);
  };

  const updateFeature = (idx: number, value: string) => {
    setFeatures(features.map((f, i) => i === idx ? value : f));
  };

  const removeFeature = (idx: number) => {
    setFeatures(features.filter((_, i) => i !== idx));
  };

  const handleSave = async (asDraft: boolean) => {
    if (!translations.et.title.trim()) {
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
      // Canonical, non-localized feature tags (saved-search filtering matches
      // them by exact string), stored on the property — not per translation.
      features: features.map(v => v.trim()).filter(Boolean),
      translations: Object.fromEntries(
        langs.map(l => [toBeLang(l), { ...translations[l] }])
      ),
      // Complete portal map; draft status (not this map) is what keeps a listing
      // out of the feed, so selections are preserved even when saving as draft.
      portalPublications,
      // ── Kinnisvara24 location + extra detail fields (all optional) ──────────
      // Empty strings normalise to null so the backend treats "unset" uniformly.
      ehakCode: ehakCode || null,
      cadastralNumber: cadastralNumber.trim() || null,
      condition: extra.condition ?? null,
      buildingMaterial: extra.buildingMaterial ?? null,
      heatingTypes: extra.heatingTypes ?? [],
      parkingType: extra.parkingType ?? null,
      hasSauna: extra.hasSauna ?? false,
      hasStoreroom: extra.hasStoreroom ?? false,
      hasBasement: extra.hasBasement ?? false,
      hasGarage: extra.hasGarage ?? false,
      hasBalcony: extra.hasBalcony ?? false,
      hasTerrace: extra.hasTerrace ?? false,
      hasElevator: extra.hasElevator ?? false,
      isFurnished: extra.isFurnished ?? false,
      hasAirConditioning: extra.hasAirConditioning ?? false,
      hasFireplace: extra.hasFireplace ?? false,
      kitchenArea: extra.kitchenArea ?? null,
      deposit: extra.deposit ?? null,
      utilityCostSummer: extra.utilityCostSummer ?? null,
      utilityCostWinter: extra.utilityCostWinter ?? null,
      petsAllowed: extra.petsAllowed ?? false,
      videoUrl: extra.videoUrl ?? null,
      virtualTourUrl: extra.virtualTourUrl ?? null,
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

  const inputClass = "h-11 border-border bg-card text-foreground focus:border-primary focus:ring-primary";
  const labelClass = "text-sm text-muted-foreground font-medium";
  const helpClass = "text-xs text-muted-foreground";
  const requiredMark = <span className="text-primary" title={t('admin.common.required', 'Required')}>*</span>;

  if (isEdit && loadingProperty) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
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
          className="text-muted-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-2xl font-semibold text-foreground">{isEdit ? t('admin.properties.editTitle') : t('admin.properties.newTitle')}</h1>
      </div>

      <Tabs defaultValue="general">
        <TabsList className="flex w-full justify-start overflow-x-auto bg-card border border-border">
          <TabsTrigger value="general"      className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">{t('admin.properties.tabs.general')}</TabsTrigger>
          <TabsTrigger value="translations" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">{t('admin.properties.tabs.translations')}</TabsTrigger>
          <TabsTrigger value="images"       className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">{t('admin.properties.tabs.images')}</TabsTrigger>
          <TabsTrigger value="features"     className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">{t('admin.properties.tabs.features')}</TabsTrigger>
          {isEdit && (
            <TabsTrigger value="connections" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">{t('admin.properties.tabs.connections', 'Connections')}</TabsTrigger>
          )}
          {isEdit && (
            <TabsTrigger value="documents"   className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">{t('admin.properties.tabs.documents', 'Documents')}</TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="general" className="mt-4">
          <Accordion type="multiple" defaultValue={['basics', 'details', 'location', 'visibility']} className="space-y-4">

            {/* ── Basics (required) ─────────────────────────────────────────── */}
            <AccordionItem value="basics" className="border rounded-lg bg-card border-border shadow-sm">
              <AccordionTrigger className="px-6 py-4 hover:no-underline">
                <span className="text-sm font-medium text-foreground">{t('admin.properties.sections.basics', 'Basics')}</span>
              </AccordionTrigger>
              <AccordionContent className="px-6 pb-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor={`${fieldId}-propertyType`} className={labelClass}>{t('admin.properties.fields.propertyType')} {requiredMark}</Label>
                    <Select value={propertyType} onValueChange={setPropertyType}>
                      <SelectTrigger id={`${fieldId}-propertyType`} className={inputClass}><SelectValue placeholder={t('admin.properties.fields.selectType')} /></SelectTrigger>
                      <SelectContent>
                        {PROPERTY_TYPE_VALUES.map(v => (
                          <SelectItem key={v} value={v}>{propertyTypeLabel(v, t)}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor={`${fieldId}-transactionType`} className={labelClass}>{t('admin.properties.fields.transactionType')} {requiredMark}</Label>
                    <Select value={transactionType} onValueChange={setTransactionType}>
                      <SelectTrigger id={`${fieldId}-transactionType`} className={inputClass}><SelectValue /></SelectTrigger>
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
                    <Label htmlFor={`${fieldId}-price`} className={labelClass}>{t('admin.properties.fields.price')} {requiredMark}</Label>
                    <Input id={`${fieldId}-price`} type="number" inputMode="numeric" value={price} onChange={e => setPrice(e.target.value)} className={inputClass} />
                    <p className={helpClass}>{t('admin.properties.help.price', 'In euros (€). For rentals, the monthly rent.')}</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor={`${fieldId}-size`} className={labelClass}>{t('admin.properties.fields.size')} {requiredMark}</Label>
                    <Input id={`${fieldId}-size`} type="number" inputMode="numeric" value={size} onChange={e => setSize(e.target.value)} className={inputClass} />
                    <p className={helpClass}>{t('admin.properties.help.size', 'Floor area in m².')}</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor={`${fieldId}-rooms`} className={labelClass}>{t('admin.properties.fields.rooms')}</Label>
                    <Input id={`${fieldId}-rooms`} type="number" inputMode="numeric" value={rooms} onChange={e => setRooms(e.target.value)} className={inputClass} />
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  {t('admin.properties.help.titleDescNote', 'The listing title and description are set per language in the Translations tab — at least the Estonian title is required to save.')}
                </p>
              </AccordionContent>
            </AccordionItem>

            {/* ── Property details (optional) ───────────────────────────────── */}
            <AccordionItem value="details" className="border rounded-lg bg-card border-border shadow-sm">
              <AccordionTrigger className="px-6 py-4 hover:no-underline">
                <span className="text-sm font-medium text-foreground">{t('admin.properties.sections.details', 'Property details')} <span className="text-muted-foreground font-normal">{t('admin.properties.sections.optional', '(optional)')}</span></span>
              </AccordionTrigger>
              <AccordionContent className="px-6 pb-6 space-y-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor={`${fieldId}-bedrooms`} className={labelClass}>{t('admin.properties.fields.bedrooms')}</Label>
                    <Input id={`${fieldId}-bedrooms`} type="number" inputMode="numeric" value={bedrooms} onChange={e => setBedrooms(e.target.value)} className={inputClass} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor={`${fieldId}-bathrooms`} className={labelClass}>{t('admin.properties.fields.bathrooms')}</Label>
                    <Input id={`${fieldId}-bathrooms`} type="number" inputMode="numeric" value={bathrooms} onChange={e => setBathrooms(e.target.value)} className={inputClass} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor={`${fieldId}-floor`} className={labelClass}>{t('admin.properties.fields.floor')}</Label>
                    <Input id={`${fieldId}-floor`} type="number" inputMode="numeric" value={floor} onChange={e => setFloor(e.target.value)} className={inputClass} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor={`${fieldId}-totalFloors`} className={labelClass}>{t('admin.properties.fields.totalFloors')}</Label>
                    <Input id={`${fieldId}-totalFloors`} type="number" inputMode="numeric" value={totalFloors} onChange={e => setTotalFloors(e.target.value)} className={inputClass} />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor={`${fieldId}-yearBuilt`} className={labelClass}>{t('admin.properties.fields.yearBuilt')}</Label>
                    <Input id={`${fieldId}-yearBuilt`} type="number" inputMode="numeric" value={yearBuilt} onChange={e => setYearBuilt(e.target.value)} className={inputClass} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor={`${fieldId}-energyClass`} className={labelClass}>{t('admin.properties.fields.energyClass')}</Label>
                    <Select value={energyClass} onValueChange={setEnergyClass}>
                      <SelectTrigger id={`${fieldId}-energyClass`} className={inputClass}><SelectValue placeholder={t('admin.properties.fields.selectEnergyClass')} /></SelectTrigger>
                      <SelectContent>
                        {['A', 'B', 'C', 'D', 'E', 'F', 'G'].map(c => (
                          <SelectItem key={c} value={c}>{c}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className={helpClass}>{t('admin.properties.help.energyClass', "Estonia's A–G energy rating (A = most efficient). Leave blank if unknown.")}</p>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* ── Location ──────────────────────────────────────────────────── */}
            <AccordionItem value="location" className="border rounded-lg bg-card border-border shadow-sm">
              <AccordionTrigger className="px-6 py-4 hover:no-underline">
                <span className="text-sm font-medium text-foreground">{t('admin.properties.sections.location', 'Location on map')} <span className="text-muted-foreground font-normal">{t('admin.properties.sections.optional', '(optional)')}</span></span>
              </AccordionTrigger>
              <AccordionContent className="px-6 pb-6 space-y-4">
                <p className={helpClass}>
                  {t('admin.properties.help.locationIntro', 'Set the address in the Translations tab, then click Find on map. We place the pin from the address automatically — no need to type coordinates by hand.')}
                </p>

                {/* Resolved-location status. Coordinates are derived, never hand-entered. */}
                <div className="rounded-md border border-border bg-muted px-4 py-3 text-sm">
                  {lat && lng ? (
                    <div className="flex items-center justify-between gap-3">
                      <span className="flex items-center gap-2 text-foreground">
                        <MapPin className="h-4 w-4 text-success shrink-0" />
                        {t('admin.properties.location.located')}{' '}
                        <span className="font-mono text-muted-foreground">{parseFloat(lat).toFixed(5)}, {parseFloat(lng).toFixed(5)}</span>
                      </span>
                      <button
                        type="button"
                        className="text-xs text-muted-foreground hover:text-destructive underline shrink-0"
                        onClick={() => { setLat(''); setLng(''); }}
                      >
                        {t('admin.properties.location.clear')}
                      </button>
                    </div>
                  ) : (
                    <span className="text-muted-foreground">{t('admin.properties.location.notSet')}</span>
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
                    <p className={`${helpClass} mt-2`}>{t('admin.properties.help.saveBeforeGeocode', 'Save the property first, then come back here to find it on the map.')}</p>
                  )}
                </div>

                {/* ── Kinnisvara24 administrative location (EHAK) + cadastral ──── */}
                {/* For properties outside Tallinn (e.g. Viimsi), the portal maps
                    the listing by EHAK code; the cadastral number lets it pull
                    the address straight from the Land Board. */}
                <div className="pt-4 border-t border-border space-y-4">
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-foreground">
                      {t('admin.properties.extra.location.title', 'Administrative location (Kinnisvara24)')}
                    </p>
                    <p className={helpClass}>
                      {t('admin.properties.extra.location.intro', 'Pick the municipality and (optionally) the area. This maps the listing for Kinnisvara24 — useful for properties outside Tallinn.')}
                    </p>
                  </div>

                  <EhakLocationPicker ehakCode={ehakCode} onChange={handleEhakChange} />

                  <div className="space-y-2 max-w-sm">
                    <Label htmlFor={`${fieldId}-cadastral`} className={labelClass}>
                      {t('admin.properties.extra.location.cadastral', 'Cadastral number (katastritunnus)')}
                    </Label>
                    <div className="flex items-end gap-2">
                      <Input
                        id={`${fieldId}-cadastral`}
                        value={cadastralNumber}
                        onChange={e => setCadastralNumber(e.target.value)}
                        className={`${inputClass} flex-1`}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleCadastralLookup}
                        disabled={!cadastralNumber.trim() || cadastralLookup.isPending}
                        className="h-11 shrink-0 border-border text-foreground"
                      >
                        {cadastralLookup.isPending
                          ? <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          : <Search className="h-4 w-4 mr-2" />}
                        {t('admin.properties.extra.location.lookup', 'Look up')}
                      </Button>
                    </div>
                    <p className={helpClass}>
                      {t('admin.properties.extra.location.cadastralHelp', 'Optional. If set, Kinnisvara24 fills the address from the Land Board.')}
                    </p>
                    <p className={helpClass}>
                      {t('admin.properties.extra.location.lookupHelp', 'Click Look up to auto-fill the Estonian address, administrative location, and map pin from the Land Board.')}
                    </p>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* ── Visibility & agent ────────────────────────────────────────── */}
            <AccordionItem value="visibility" className="border rounded-lg bg-card border-border shadow-sm">
              <AccordionTrigger className="px-6 py-4 hover:no-underline">
                <span className="text-sm font-medium text-foreground">{t('admin.properties.sections.visibility', 'Visibility & agent')}</span>
              </AccordionTrigger>
              <AccordionContent className="px-6 pb-6 space-y-6">
                <div className="space-y-2 max-w-sm">
                  <Label htmlFor={`${fieldId}-agent`} className={labelClass}>{t('admin.properties.fields.agent')}</Label>
                  <Select value={agentId} onValueChange={setAgentId}>
                    <SelectTrigger id={`${fieldId}-agent`} className={inputClass}><SelectValue placeholder={t('admin.properties.fields.selectAgent')} /></SelectTrigger>
                    <SelectContent>
                      {(teamData ?? []).map(member => (
                        <SelectItem key={member.id} value={member.id}>{member.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className={helpClass}>{t('admin.properties.help.agent', 'The contact shown on the listing and used for inquiries.')}</p>
                </div>

                <div className="flex items-center gap-3">
                  <Switch checked={isFeatured} onCheckedChange={setIsFeatured} aria-label={t('admin.properties.fields.featured')} />
                  <div>
                    <Label className={labelClass}>{t('admin.properties.fields.featured')}</Label>
                    <p className={helpClass}>{t('admin.properties.help.featured', 'Featured properties appear on the homepage.')}</p>
                  </div>
                </div>

                {exportPortals.length > 0 && (
                  <div className="pt-2 border-t border-border">
                    <PropertyPortalControls
                      portals={exportPortals}
                      propertyId={id}
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
          <Card className="bg-card border-border shadow-sm">
            <CardContent className="p-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-4 border-b border-border">
                <p className="text-xs text-muted-foreground">
                  {t('admin.properties.translateHint', 'Write the listing in Estonian, then translate the title and description to the other languages with one click. You can edit afterwards.')}
                </p>
                <TranslateButton
                  to={['en', 'ru']}
                  fields={{
                    title: translations.et?.title || '',
                    description: translations.et?.description || '',
                  }}
                  onTranslated={(lang, f) => setTranslations(prev => ({
                    ...prev,
                    [lang]: {
                      ...prev[lang],
                      ...f,
                      // Address fields are not localised — copy them verbatim from
                      // Estonian so the listing has them and the location mapping stays intact.
                      address: prev.et?.address ?? prev[lang]?.address ?? '',
                      city: prev.et?.city ?? prev[lang]?.city ?? '',
                      district: prev.et?.district ?? prev[lang]?.district ?? '',
                    },
                  }))}
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
                    {lang !== 'et' && (
                      <div className="flex justify-end">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => copyTranslationFromEt(lang)}
                          className="text-xs text-muted-foreground hover:text-primary"
                        >
                          <Copy className="h-3.5 w-3.5 mr-1" /> {t('admin.properties.copyFromEt', 'Copy from Estonian')}
                        </Button>
                      </div>
                    )}
                    <div className="space-y-2">
                      <Label htmlFor={`${fieldId}-title-${lang}`} className={labelClass}>{t('admin.properties.fields.title')} {lang === 'et' && requiredMark}</Label>
                      <Input id={`${fieldId}-title-${lang}`} value={translations[lang]?.title || ''} onChange={e => updateTranslation(lang, 'title', e.target.value)} className={inputClass} />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor={`${fieldId}-address-${lang}`} className={labelClass}>{t('admin.properties.fields.address')}</Label>
                        <Input id={`${fieldId}-address-${lang}`} value={translations[lang]?.address || ''} onChange={e => updateTranslation(lang, 'address', e.target.value)} className={inputClass} />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor={`${fieldId}-city-${lang}`} className={labelClass}>{t('admin.properties.fields.city')}</Label>
                        <Input id={`${fieldId}-city-${lang}`} value={translations[lang]?.city || ''} onChange={e => updateTranslation(lang, 'city', e.target.value)} className={inputClass} />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`${fieldId}-district-${lang}`} className={labelClass}>{t('admin.properties.fields.district')}</Label>
                      <Input id={`${fieldId}-district-${lang}`} value={translations[lang]?.district || ''} onChange={e => updateTranslation(lang, 'district', e.target.value)} className={inputClass} />
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between gap-3">
                        <Label className={labelClass}>{t('admin.properties.fields.description')}</Label>
                        {lang === 'et' && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={handleGenerateDescription}
                            disabled={generateDescription.isPending}
                            className="text-xs text-muted-foreground hover:text-primary"
                          >
                            {generateDescription.isPending
                              ? <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
                              : <Sparkles className="h-3.5 w-3.5 mr-1" />}
                            {t('admin.properties.aiDescribe', 'Write description (AI)')}
                          </Button>
                        )}
                      </div>
                      <RichTextEditor
                        value={translations[lang]?.description ?? ''}
                        onChange={(html) => updateTranslation(lang, 'description', html)}
                        placeholder={t('admin.properties.fields.descriptionPlaceholder', 'Property description...')}
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
          <Card className="bg-card border-border shadow-sm">
            <CardContent className="p-6 space-y-4">
              {/* Upload zone */}
              <div
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${isEdit ? 'border-border hover:border-primary cursor-pointer' : 'border-border opacity-60 cursor-not-allowed'}`}
                onClick={() => isEdit && fileInputRef.current?.click()}
              >
                <ImageIcon className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                {isEdit ? (
                  <p className="text-sm text-muted-foreground">{t('admin.properties.images.uploadEdit')}</p>
                ) : (
                  <p className="text-sm text-muted-foreground">{t('admin.properties.images.uploadCreate')}</p>
                )}
                <p className="text-xs text-muted-foreground mt-1">{t('admin.properties.images.uploadHint')}</p>
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
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" /> {t('admin.properties.images.uploading')}
                </div>
              )}

              {/* Image grid */}
              {orderedImages.length > 0 && (
                <>
                <p className="text-xs text-muted-foreground flex items-center gap-1.5">
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
                        className={`relative group rounded-lg overflow-hidden border bg-card transition-all ${!isWorking ? 'cursor-grab active:cursor-grabbing' : ''} ${
                          overIndex === idx && dragIndex !== null && dragIndex !== idx
                            ? 'border-primary ring-2 ring-primary'
                            : 'border-border'
                        } ${dragIndex === idx ? 'opacity-40' : ''}`}
                      >
                        {previewUrl ? (
                          <img src={previewUrl} alt="" draggable={false} className="w-full h-24 object-cover" />
                        ) : (
                          <div className="w-full h-24 bg-muted flex items-center justify-center">
                            <ImageIcon className="h-6 w-6 text-muted-foreground" />
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
                          <div className="absolute inset-0 bg-destructive/55 flex flex-col items-center justify-center gap-1 px-2 text-center">
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

                        {/* Always visible on touch; hover-reveal on desktop. Move
                            buttons are the touch reorder fallback (drag also works on desktop).
                            pointer-events follow visibility: tappable on touch, only on
                            hover on desktop so they don't intercept clicks while hidden. */}
                        <div className="absolute inset-0 bg-black/45 opacity-100 pointer-events-auto sm:opacity-0 sm:pointer-events-none sm:group-hover:opacity-100 sm:group-hover:pointer-events-auto transition-opacity flex items-center justify-center gap-1">
                          <button
                            type="button"
                            disabled={idx === 0}
                            className="text-white disabled:opacity-30 h-11 w-11 flex items-center justify-center hover:text-primary"
                            onClick={() => moveImage(idx, idx - 1)}
                            aria-label={t('admin.properties.images.moveLeft', 'Move left')}
                            title={t('admin.properties.images.moveLeft', 'Move left')}
                          >
                            <ArrowLeft className="h-5 w-5" />
                          </button>
                          <button
                            type="button"
                            disabled={idx === orderedImages.length - 1}
                            className="text-white disabled:opacity-30 h-11 w-11 flex items-center justify-center hover:text-primary"
                            onClick={() => moveImage(idx, idx + 1)}
                            aria-label={t('admin.properties.images.moveRight', 'Move right')}
                            title={t('admin.properties.images.moveRight', 'Move right')}
                          >
                            <ArrowRight className="h-5 w-5" />
                          </button>
                          <button
                            type="button"
                            className="text-white hover:text-destructive h-11 w-11 flex items-center justify-center"
                            onClick={() => setPendingImageDelete(img.id)}
                            aria-label={t('admin.common.delete')}
                            title={t('admin.common.delete')}
                          >
                            <X className="h-5 w-5" />
                          </button>
                        </div>
                        {img.isCover && (
                          <span className="absolute top-1 left-1 text-[8px] bg-primary text-primary-foreground px-1.5 py-0.5 rounded font-medium">{t('admin.properties.images.cover')}</span>
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
          <Card className="bg-card border-border shadow-sm">
            <CardContent className="p-6 space-y-3">
              <p className="text-xs text-muted-foreground">
                {t('admin.properties.features.help', 'Add each feature as a short tag (e.g. Sauna, Parking). These are used as-is for filtering and search, so they are not translated per language.')}
              </p>
              {features.map((f, idx) => (
                <div key={idx} className="flex gap-2 items-center">
                  <Input
                    value={f}
                    onChange={e => updateFeature(idx, e.target.value)}
                    placeholder={t('admin.properties.features.placeholder', 'e.g. Sauna')}
                    className={`${inputClass} flex-1`}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeFeature(idx)}
                    aria-label={t('admin.common.delete')}
                    title={t('admin.common.delete')}
                    className="h-9 w-9 shrink-0 text-muted-foreground hover:text-destructive"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              {features.length === 0 && (
                <p className="text-sm text-muted-foreground">{t('admin.properties.features.empty')}</p>
              )}
              <Button
                type="button"
                onClick={addFeature}
                variant="outline"
                className="border-border text-foreground"
              >
                <Plus className="h-4 w-4 mr-2" />
                {t('admin.properties.features.add', 'Add feature')}
              </Button>

              {/* ── Kinnisvara24 additional details (all optional) ───────────── */}
              <div className="pt-6 mt-2 border-t border-border space-y-3">
                <p className="text-sm font-medium text-foreground">
                  {t('admin.properties.extra.title', 'Additional details (optional)')}
                </p>
                <PropertyExtraDetails value={extra} onChange={updateExtra} />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {isEdit && id && (
          <TabsContent value="connections" className="mt-4">
            <PropertyConnectionsPanel propertyId={id} />
          </TabsContent>
        )}

        {isEdit && id && (
          <TabsContent value="documents" className="mt-4">
            <PropertyDocumentsPanel propertyId={id} />
          </TabsContent>
        )}
      </Tabs>

      {/* Save buttons */}
      <div className="flex gap-3 justify-end pt-2">
        <Button variant="outline" onClick={() => handleSave(true)} disabled={isSaving} className="border-border text-muted-foreground">
          {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          {t('admin.properties.saveDraft')}
        </Button>
        <Button onClick={() => handleSave(false)} disabled={isSaving} className="bg-primary hover:bg-primary/90 text-primary-foreground">
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
