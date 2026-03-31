import { useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import BlogCard from '@/components/BlogCard';
import { Skeleton } from '@/components/ui/skeleton';
import { useBlogPosts } from '@/hooks/api/useContent';

const PAGE_SIZE = 9;

export default function Blog() {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const page = parseInt(searchParams.get('page') || '1', 10);

  const { data, isLoading, error } = useBlogPosts(page);

  const allPosts = data?.data ?? [];
  const featured = page === 1 ? allPosts[0] : null;
  const gridPosts = page === 1 ? allPosts.slice(1) : allPosts;
  const totalCount = data?.total ?? 0;
  // Total pages accounting for the featured slot on page 1
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  const updatePage = (p: number) => {
    const params = new URLSearchParams(searchParams);
    params.set('page', String(p));
    setSearchParams(params);
  };

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

  return (
    <>
      {/* Header */}
      <section className="pt-20 pb-12 bg-gradient-to-b from-secondary/80 to-background">
        <div className="container mx-auto px-6 pt-12">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <nav className="flex items-center gap-2 text-xs text-muted-foreground font-body mb-6">
              <Link to="/" className="hover:text-primary transition-colors">
                Home
              </Link>
              <span>/</span>
              <span className="text-foreground">{t('nav.blog')}</span>
            </nav>
            <h1 className="font-heading text-5xl md:text-6xl font-light text-foreground">
              Insights & News
            </h1>
            <div className="w-16 h-px gold-gradient mt-4" />
          </motion.div>
        </div>
      </section>

      {isLoading ? (
        <div className="container mx-auto px-6 py-8">
          {/* Featured skeleton */}
          <Skeleton className="aspect-[21/9] w-full rounded-sm mb-5" />
          <Skeleton className="h-7 w-2/3 mb-2" />
          <Skeleton className="h-4 w-1/2 mb-12" />
          {/* Grid skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i}>
                <Skeleton className="aspect-[4/3] rounded-sm mb-4" />
                <Skeleton className="h-5 w-3/4 mb-2" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            ))}
          </div>
        </div>
      ) : error ? (
        <div className="text-center py-32">
          <p className="text-muted-foreground font-body">Failed to load posts. Please try again.</p>
        </div>
      ) : (
        <>
          {/* Featured post */}
          {featured && (
            <section className="container mx-auto px-6 pb-16">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <Link to={`/blog/${featured.slug}`} className="group block">
                  <div className="relative overflow-hidden rounded-sm aspect-[21/9] bg-muted">
                    <img
                      src={featured.coverImageUrl || '/placeholder.jpg'}
                      alt={featured.title}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-8 md:p-12">
                      {featured.category && (
                        <span className="text-[10px] font-nav uppercase tracking-wider text-primary mb-3 block">
                          {featured.category}
                        </span>
                      )}
                      <h2 className="font-heading text-3xl md:text-4xl lg:text-5xl text-foreground font-light group-hover:text-primary transition-colors max-w-3xl">
                        {featured.title}
                      </h2>
                    </div>
                  </div>
                  <div className="mt-5 max-w-3xl">
                    <p className="text-muted-foreground font-body leading-relaxed">
                      {featured.excerpt}
                    </p>
                    <div className="flex items-center gap-3 mt-4">
                      {featured.authorPhotoUrl && (
                        <img
                          src={featured.authorPhotoUrl}
                          alt={featured.authorName}
                          className="w-8 h-8 rounded-full object-cover"
                        />
                      )}
                      <span className="text-sm text-muted-foreground font-body">
                        {featured.authorName}
                      </span>
                      {featured.publishedAt && (
                        <>
                          <span className="text-muted-foreground/50">·</span>
                          <span className="text-sm text-muted-foreground/70 font-body">
                            {new Date(featured.publishedAt).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                            })}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </Link>
              </motion.div>
            </section>
          )}

          {/* Grid */}
          <section className="py-16 px-6 bg-secondary/20">
            <div className="container mx-auto">
              {gridPosts.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {gridPosts.map((post, i) => (
                    <BlogCard key={post.id} post={post} index={i} />
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground font-body py-16">No more posts.</p>
              )}

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-16">
                  <button
                    onClick={() => updatePage(page - 1)}
                    disabled={page <= 1}
                    className="w-10 h-10 flex items-center justify-center rounded-sm border border-border text-muted-foreground hover:text-primary hover:border-primary transition-colors disabled:opacity-30"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  {pageNumbers.map((p, i) =>
                    p === '...' ? (
                      <span key={`e-${i}`} className="px-2 text-muted-foreground">
                        …
                      </span>
                    ) : (
                      <button
                        key={p}
                        onClick={() => updatePage(p as number)}
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
                    onClick={() => updatePage(page + 1)}
                    disabled={page >= totalPages}
                    className="w-10 h-10 flex items-center justify-center rounded-sm border border-border text-muted-foreground hover:text-primary hover:border-primary transition-colors disabled:opacity-30"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              )}
            </div>
          </section>
        </>
      )}
    </>
  );
}
