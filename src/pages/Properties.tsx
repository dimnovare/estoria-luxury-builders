import { useState, useMemo } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Search, X, ChevronLeft, ChevronRight, ChevronDown, SlidersHorizontal, Loader2, Bell } from 'lucide-react';
import PropertyCard from '@/components/PropertyCard';
import SaveSearchModal from '@/components/SaveSearchModal';
import { useProperties } from '@/hooks/api/useProperties';
import { usePublicCities, usePropertyTypeOptions } from '@/hooks/api/usePublic';
import type { SavedSearchFilter } from '@/hooks/api/useSavedSearches';
import Seo from '@/components/Seo';

const PAGE_SIZE = 12;
// URL param value → translation key under filters.sort.*
const sortOptionMap = [
  { value: 'newest',     labelKey: 'newest'    },
  { value: 'price-asc',  labelKey: 'priceAsc'  },
  { value: 'price-desc', labelKey: 'priceDesc' },
  { value: 'size',       labelKey: 'sizeDesc'  },
] as const;

export default function Properties() {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [saveSearchOpen, setSaveSearchOpen] = useState(false);

  // Read filters from URL
  const transaction = searchParams.get('transaction') || '';
  const propertyType = searchParams.get('type') || '';
  const city = searchParams.get('city') || '';
  const minPrice = searchParams.get('minPrice') || '';
  const maxPrice = searchParams.get('maxPrice') || '';
  const sort = searchParams.get('sort') || 'newest';
  const page = parseInt(searchParams.get('page') || '1', 10);

  const { data, isLoading, error } = useProperties(
    { type: propertyType, transaction, city, minPrice, maxPrice, sort },
    page
  );

  const { data: cities } = usePublicCities();
  const { data: typeOptions } = usePropertyTypeOptions();
  const cityList = useMemo(() => cities ?? [], [cities]);
  const propertyTypes = useMemo(() => typeOptions?.propertyTypes ?? [], [typeOptions]);

  const sortOptions = useMemo(
    () => sortOptionMap.map(({ value, labelKey }) => ({ value, label: t(`filters.sort.${labelKey}`) })),
    [t]
  );

  const properties = data?.data ?? [];
  const totalCount = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  const updateFilter = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams);
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    if (key !== 'page') params.set('page', '1');
    setSearchParams(params);
  };

  const resetFilters = () => {
    setSearchParams({});
  };

  // Snapshot the current filter for SaveSearchModal. Strings → numbers where
  // the API expects numeric ranges; transaction is normalized to the API's
  // PascalCase enum so the saved row matches what the digest worker filters on.
  const savedSearchFilter: SavedSearchFilter = useMemo(() => ({
    type: propertyType
      ? propertyType.charAt(0).toUpperCase() + propertyType.slice(1)
      : undefined,
    transaction:
      transaction === 'buy' ? 'Sale'
      : transaction === 'rent' ? 'Rent'
      : undefined,
    city: city || undefined,
    minPrice: minPrice ? Number(minPrice) : undefined,
    maxPrice: maxPrice ? Number(maxPrice) : undefined,
  }), [propertyType, transaction, city, minPrice, maxPrice]);

  const activeFilters = useMemo(() => {
    const filters: { key: string; label: string; value: string }[] = [];
    if (transaction)
      filters.push({
        key: 'transaction',
        label: transaction === 'buy' ? t('hero.buy') : t('hero.rent'),
        value: transaction,
      });
    if (propertyType) {
      const matched = propertyTypes.find((opt) => opt.value === propertyType);
      filters.push({ key: 'type', label: matched?.label ?? propertyType, value: propertyType });
    }
    if (city) filters.push({ key: 'city', label: city, value: city });
    if (minPrice) filters.push({ key: 'minPrice', label: `${t('filters.min')} €${minPrice}`, value: minPrice });
    if (maxPrice) filters.push({ key: 'maxPrice', label: `${t('filters.max')} €${maxPrice}`, value: maxPrice });
    return filters;
  }, [transaction, propertyType, city, minPrice, maxPrice, propertyTypes, t]);

  const pageNumbers = useMemo(() => {
    const pages: (number | '...')[] = [];
    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (page > 3) pages.push('...');
      for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++)
        pages.push(i);
      if (page < totalPages - 2) pages.push('...');
      pages.push(totalPages);
    }
    return pages;
  }, [totalPages, page]);

  const FilterControls = ({ mobile = false }: { mobile?: boolean }) => (
    <div className={`flex ${mobile ? 'flex-col gap-4' : 'flex-row flex-wrap items-center gap-3'}`}>
      {/* Transaction toggle */}
      <div className="flex rounded-sm overflow-hidden border border-border">
        <button
          onClick={() => updateFilter('transaction', transaction === 'buy' ? '' : 'buy')}
          className={`px-5 py-2.5 text-xs font-nav uppercase tracking-wider transition-colors ${
            transaction === 'buy'
              ? 'gold-gradient text-primary-foreground'
              : 'bg-secondary text-muted-foreground hover:text-foreground'
          }`}
        >
          {t('hero.buy')}
        </button>
        <button
          onClick={() => updateFilter('transaction', transaction === 'rent' ? '' : 'rent')}
          className={`px-5 py-2.5 text-xs font-nav uppercase tracking-wider transition-colors ${
            transaction === 'rent'
              ? 'gold-gradient text-primary-foreground'
              : 'bg-secondary text-muted-foreground hover:text-foreground'
          }`}
        >
          {t('hero.rent')}
        </button>
      </div>

      {/* Property type */}
      <div className="relative">
        <select
          value={propertyType}
          onChange={(e) => updateFilter('type', e.target.value)}
          aria-label={t('hero.type', 'Property type')}
          className="appearance-none bg-secondary text-foreground text-sm font-body pl-4 pr-10 py-2.5 rounded-sm border border-border outline-none cursor-pointer focus:border-primary transition-colors"
        >
          <option value="">{t('hero.allTypes')}</option>
          {propertyTypes.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <ChevronDown
          size={16}
          aria-hidden="true"
          className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-primary"
        />
      </div>

      {/* City */}
      <div className="relative">
        <select
          value={city}
          onChange={(e) => updateFilter('city', e.target.value)}
          disabled={cityList.length === 0}
          aria-label={t('hero.city', 'City')}
          className="appearance-none bg-secondary text-foreground text-sm font-body pl-4 pr-10 py-2.5 rounded-sm border border-border outline-none cursor-pointer disabled:cursor-not-allowed focus:border-primary transition-colors"
        >
          <option value="">{t('hero.allCities')}</option>
          {cityList.map((c) => (
            <option key={c.name} value={c.name}>
              {c.name}
            </option>
          ))}
        </select>
        <ChevronDown
          size={16}
          aria-hidden="true"
          className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-primary"
        />
      </div>

      {/* Price range */}
      <div className="flex items-center gap-2">
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
            €
          </span>
          <input
            type="number"
            placeholder={t('filters.min')}
            aria-label={t('filters.minPrice', 'Minimum price')}
            value={minPrice}
            onChange={(e) => updateFilter('minPrice', e.target.value)}
            className="bg-secondary text-foreground text-sm font-body pl-7 pr-3 py-2.5 rounded-sm border border-border outline-none w-28 focus:border-primary transition-colors"
          />
        </div>
        <span className="text-muted-foreground">–</span>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
            €
          </span>
          <input
            type="number"
            placeholder={t('filters.max')}
            aria-label={t('filters.maxPrice', 'Maximum price')}
            value={maxPrice}
            onChange={(e) => updateFilter('maxPrice', e.target.value)}
            className="bg-secondary text-foreground text-sm font-body pl-7 pr-3 py-2.5 rounded-sm border border-border outline-none w-28 focus:border-primary transition-colors"
          />
        </div>
      </div>

      {activeFilters.length > 0 && (
        <button
          onClick={resetFilters}
          className="text-xs text-muted-foreground hover:text-primary font-nav uppercase tracking-wider transition-colors"
        >
          {t('filters.reset')}
        </button>
      )}
    </div>
  );

  return (
    <>
      <Seo
        title="Properties for Sale & Rent in Tallinn | Estoria"
        description="Browse premium apartments, houses, and commercial real estate for sale and rent in Tallinn and across Estonia with Estoria."
        path="/properties"
      />
      {/* Header */}
      <section className="pt-20 pb-12 bg-gradient-to-b from-secondary/80 to-background">
        <div className="container mx-auto px-4 sm:px-6 pt-12">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            {/* Breadcrumb */}
            <nav className="flex items-center gap-2 text-xs text-muted-foreground font-body mb-6">
              <Link to="/" className="hover:text-primary transition-colors">
                {t('nav.home')}
              </Link>
              <span>/</span>
              <span className="text-foreground">{t('nav.properties')}</span>
            </nav>
            <h1 className="font-heading text-5xl md:text-6xl font-light text-foreground">
              {t('nav.properties')}
            </h1>
          </motion.div>
        </div>
      </section>

      {/* Filter bar — desktop */}
      <div className="sticky top-20 z-30 bg-card/95 backdrop-blur-md border-b border-border hidden md:block">
        <div className="container mx-auto px-6 py-4 flex items-center gap-4">
          <div className="flex-1">
            <FilterControls />
          </div>
          <button
            type="button"
            onClick={() => setSaveSearchOpen(true)}
            className="shrink-0 flex items-center gap-2 border border-primary/40 text-primary px-3 py-2 rounded-sm font-nav text-xs uppercase tracking-wider hover:bg-primary/10 transition-colors"
          >
            <Bell size={14} />
            {t('savedSearch.cta')}
          </button>
        </div>
      </div>

      {/* Filter bar — mobile */}
      <div className="sticky top-20 z-30 bg-card/95 backdrop-blur-md border-b border-border md:hidden">
        <div className="container mx-auto px-6 py-3 flex items-center justify-between">
          <button
            onClick={() => setMobileFiltersOpen(true)}
            className="flex items-center gap-2 text-sm font-nav uppercase tracking-wider text-muted-foreground"
          >
            <SlidersHorizontal size={16} />
            {t('filters.filters')}
            {activeFilters.length > 0 && (
              <span className="gold-gradient text-primary-foreground text-[10px] w-5 h-5 rounded-full flex items-center justify-center">
                {activeFilters.length}
              </span>
            )}
          </button>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setSaveSearchOpen(true)}
              className="flex items-center gap-1.5 border border-primary/40 text-primary px-2.5 py-1.5 rounded-sm font-nav text-[11px] uppercase tracking-wider"
              aria-label={t('savedSearch.cta')}
            >
              <Bell size={12} />
            </button>
            <div className="relative">
              <select
                value={sort}
                onChange={(e) => updateFilter('sort', e.target.value)}
                aria-label={t('filters.sortBy', 'Sort by')}
                className="appearance-none bg-secondary text-foreground text-xs font-body pl-3 pr-8 py-2 rounded-sm border border-border outline-none focus:border-primary transition-colors"
              >
                {sortOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <ChevronDown
                size={14}
                aria-hidden="true"
                className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-primary"
              />
            </div>
          </div>
        </div>
      </div>

      <SaveSearchModal
        open={saveSearchOpen}
        onClose={() => setSaveSearchOpen(false)}
        filter={savedSearchFilter}
      />

      {/* Mobile filter drawer */}
      {mobileFiltersOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-background/98 backdrop-blur-lg overflow-y-auto"
        >
          <div className="container mx-auto px-6 py-8">
            <div className="flex items-center justify-between mb-8">
              <h2 className="font-heading text-2xl text-foreground">{t('filters.filters')}</h2>
              <button
                onClick={() => setMobileFiltersOpen(false)}
                aria-label={t('common.close', 'Close')}
                className="text-foreground"
              >
                <X size={24} />
              </button>
            </div>
            <FilterControls mobile />
            <button
              onClick={() => setMobileFiltersOpen(false)}
              className="mt-8 w-full gold-gradient text-primary-foreground py-3 rounded-sm font-nav text-xs uppercase tracking-wider"
            >
              {t('filters.showResults', { count: totalCount })}
            </button>
          </div>
        </motion.div>
      )}

      {/* Active filter pills */}
      {activeFilters.length > 0 && (
        <div className="container mx-auto px-6 py-3">
          <div className="flex flex-wrap gap-2">
            {activeFilters.map((f) => (
              <button
                key={f.key}
                onClick={() => updateFilter(f.key, '')}
                className="flex items-center gap-1.5 text-xs font-nav uppercase tracking-wider border border-primary/40 text-primary px-3 py-1.5 rounded-full hover:bg-primary/10 transition-colors"
              >
                {f.label}
                <X size={12} />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Results */}
      <section className="py-12 px-4 sm:px-6">
        <div className="container mx-auto">
          {/* Top row */}
          <div className="flex items-center justify-between mb-8">
            <p className="text-sm text-muted-foreground font-body">
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <Loader2 size={14} className="animate-spin" /> {t('common.loading')}
                </span>
              ) : (
                <>
                  {t('properties.showing', { count: properties.length, total: totalCount })}
                </>
              )}
            </p>
            <div className="hidden md:block relative">
              <select
                value={sort}
                onChange={(e) => updateFilter('sort', e.target.value)}
                aria-label={t('filters.sortBy', 'Sort by')}
                className="appearance-none bg-secondary text-foreground text-sm font-body pl-4 pr-10 py-2 rounded-sm border border-border outline-none cursor-pointer focus:border-primary transition-colors"
              >
                {sortOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <ChevronDown
                size={16}
                aria-hidden="true"
                className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-primary"
              />
            </div>
          </div>

          {/* Grid */}
          {error ? (
            <div className="text-center py-24">
              <p className="text-muted-foreground font-body">
                {t('properties.loadFailed')}
              </p>
              <button
                onClick={resetFilters}
                className="mt-4 text-xs font-nav uppercase tracking-wider text-primary hover:underline"
              >
                {t('filters.resetFilters')}
              </button>
            </div>
          ) : isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="aspect-[4/3] bg-secondary rounded-sm mb-4" />
                  <div className="h-5 bg-secondary rounded-sm w-3/4 mb-2" />
                  <div className="h-4 bg-secondary rounded-sm w-1/2" />
                </div>
              ))}
            </div>
          ) : properties.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {properties.map((property, i) => (
                <PropertyCard key={property.id} property={property} index={i} />
              ))}
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-24"
            >
              <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-secondary flex items-center justify-center">
                <Search className="text-muted-foreground" size={32} />
              </div>
              <h3 className="font-heading text-2xl text-foreground mb-2">{t('properties.empty.title')}</h3>
              <p className="text-muted-foreground font-body text-sm">
                {t('properties.empty.subtitle')}
              </p>
              <button
                onClick={resetFilters}
                className="mt-6 text-xs font-nav uppercase tracking-wider text-primary hover:underline"
              >
                {t('filters.resetAll')}
              </button>
            </motion.div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-16">
              <button
                onClick={() => updateFilter('page', String(page - 1))}
                disabled={page <= 1}
                aria-label={t('common.previousPage', 'Previous page')}
                className="w-10 h-10 flex items-center justify-center rounded-sm border border-border text-muted-foreground hover:text-primary hover:border-primary transition-colors disabled:opacity-30 disabled:hover:text-muted-foreground disabled:hover:border-border"
              >
                <ChevronLeft size={16} />
              </button>

              {pageNumbers.map((p, i) =>
                p === '...' ? (
                  <span key={`ellipsis-${i}`} className="px-2 text-muted-foreground">
                    …
                  </span>
                ) : (
                  <button
                    key={p}
                    onClick={() => updateFilter('page', String(p))}
                    aria-label={t('common.goToPage', 'Go to page {{page}}', { page: p })}
                    aria-current={p === page ? 'page' : undefined}
                    className={`w-10 h-10 flex items-center justify-center rounded-sm text-sm font-body transition-colors ${
                      p === page
                        ? 'border border-primary text-primary'
                        : 'border border-border text-muted-foreground hover:text-foreground hover:border-foreground/30'
                    }`}
                  >
                    {p}
                  </button>
                )
              )}

              <button
                onClick={() => updateFilter('page', String(page + 1))}
                disabled={page >= totalPages}
                aria-label={t('common.nextPage', 'Next page')}
                className="w-10 h-10 flex items-center justify-center rounded-sm border border-border text-muted-foreground hover:text-primary hover:border-primary transition-colors disabled:opacity-30 disabled:hover:text-muted-foreground disabled:hover:border-border"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
