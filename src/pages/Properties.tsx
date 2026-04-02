import { useState, useMemo } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Search, X, ChevronLeft, ChevronRight, SlidersHorizontal, Loader2 } from 'lucide-react';
import PropertyCard from '@/components/PropertyCard';
import { useProperties } from '@/hooks/api/useProperties';

const PAGE_SIZE = 12;
const propertyTypes = ['apartment', 'house', 'commercial', 'land', 'office'];
const cities = ['Tallinn', 'Tartu', 'Pärnu'];
const sortOptions = [
  { value: 'newest', label: 'Newest' },
  { value: 'price-asc', label: 'Price: Low → High' },
  { value: 'price-desc', label: 'Price: High → Low' },
  { value: 'size', label: 'Size: Largest' },
];

export default function Properties() {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

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

  const activeFilters = useMemo(() => {
    const filters: { key: string; label: string; value: string }[] = [];
    if (transaction)
      filters.push({
        key: 'transaction',
        label: transaction === 'buy' ? t('hero.buy') : t('hero.rent'),
        value: transaction,
      });
    if (propertyType) filters.push({ key: 'type', label: propertyType, value: propertyType });
    if (city) filters.push({ key: 'city', label: city, value: city });
    if (minPrice) filters.push({ key: 'minPrice', label: `Min €${minPrice}`, value: minPrice });
    if (maxPrice) filters.push({ key: 'maxPrice', label: `Max €${maxPrice}`, value: maxPrice });
    return filters;
  }, [transaction, propertyType, city, minPrice, maxPrice, t]);

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
      <select
        value={propertyType}
        onChange={(e) => updateFilter('type', e.target.value)}
        className="bg-secondary text-foreground text-sm font-body px-4 py-2.5 rounded-sm border border-border outline-none cursor-pointer"
      >
        <option value="">{t('hero.allTypes')}</option>
        {propertyTypes.map((type) => (
          <option key={type} value={type}>
            {t(`hero.${type}` as any, { defaultValue: type.charAt(0).toUpperCase() + type.slice(1) })}
          </option>
        ))}
      </select>

      {/* City */}
      <select
        value={city}
        onChange={(e) => updateFilter('city', e.target.value)}
        className="bg-secondary text-foreground text-sm font-body px-4 py-2.5 rounded-sm border border-border outline-none cursor-pointer"
      >
        <option value="">{t('hero.allCities')}</option>
        {cities.map((c) => (
          <option key={c} value={c}>
            {c}
          </option>
        ))}
      </select>

      {/* Price range */}
      <div className="flex items-center gap-2">
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
            €
          </span>
          <input
            type="number"
            placeholder="Min"
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
            placeholder="Max"
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
          Reset
        </button>
      )}
    </div>
  );

  return (
    <>
      {/* Header */}
      <section className="pt-20 pb-12 bg-gradient-to-b from-secondary/80 to-background">
        <div className="container mx-auto px-6 pt-12">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            {/* Breadcrumb */}
            <nav className="flex items-center gap-2 text-xs text-muted-foreground font-body mb-6">
              <Link to="/" className="hover:text-primary transition-colors">
                Home
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
        <div className="container mx-auto px-6 py-4">
          <FilterControls />
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
            Filters
            {activeFilters.length > 0 && (
              <span className="gold-gradient text-primary-foreground text-[10px] w-5 h-5 rounded-full flex items-center justify-center">
                {activeFilters.length}
              </span>
            )}
          </button>
          <select
            value={sort}
            onChange={(e) => updateFilter('sort', e.target.value)}
            className="bg-secondary text-foreground text-xs font-body px-3 py-2 rounded-sm border border-border outline-none"
          >
            {sortOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>

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
              <h2 className="font-heading text-2xl text-foreground">Filters</h2>
              <button onClick={() => setMobileFiltersOpen(false)} className="text-foreground">
                <X size={24} />
              </button>
            </div>
            <FilterControls mobile />
            <button
              onClick={() => setMobileFiltersOpen(false)}
              className="mt-8 w-full gold-gradient text-primary-foreground py-3 rounded-sm font-nav text-xs uppercase tracking-wider"
            >
              Show Results ({totalCount})
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
      <section className="py-12 px-6">
        <div className="container mx-auto">
          {/* Top row */}
          <div className="flex items-center justify-between mb-8">
            <p className="text-sm text-muted-foreground font-body">
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <Loader2 size={14} className="animate-spin" /> Loading…
                </span>
              ) : (
                <>
                  Showing <span className="text-foreground">{properties.length}</span> of{' '}
                  <span className="text-foreground">{totalCount}</span> properties
                </>
              )}
            </p>
            <div className="hidden md:block">
              <select
                value={sort}
                onChange={(e) => updateFilter('sort', e.target.value)}
                className="bg-secondary text-foreground text-sm font-body px-4 py-2 rounded-sm border border-border outline-none cursor-pointer"
              >
                {sortOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Grid */}
          {error ? (
            <div className="text-center py-24">
              <p className="text-muted-foreground font-body">
                Failed to load properties. Please try again.
              </p>
              <button
                onClick={resetFilters}
                className="mt-4 text-xs font-nav uppercase tracking-wider text-primary hover:underline"
              >
                Reset filters
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
              <h3 className="font-heading text-2xl text-foreground mb-2">No properties found</h3>
              <p className="text-muted-foreground font-body text-sm">
                Try adjusting your filters to see more results.
              </p>
              <button
                onClick={resetFilters}
                className="mt-6 text-xs font-nav uppercase tracking-wider text-primary hover:underline"
              >
                Reset all filters
              </button>
            </motion.div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-16">
              <button
                onClick={() => updateFilter('page', String(page - 1))}
                disabled={page <= 1}
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
