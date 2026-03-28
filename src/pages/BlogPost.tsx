import { useParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { ArrowLeft, Share2, Check, Copy } from 'lucide-react';
import { mockBlogPosts } from '@/data/mockBlog';
import BlogCard from '@/components/BlogCard';
import { useState, useEffect, useMemo } from 'react';

export default function BlogPost() {
  const { slug } = useParams();
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);

  const post = mockBlogPosts.find(p => p.slug === slug);

  const relatedPosts = useMemo(() => {
    if (!post) return [];
    return mockBlogPosts
      .filter(p => p.id !== post.id)
      .slice(0, 3);
  }, [post]);

  useEffect(() => {
    if (post) {
      document.title = `${post.title} — ESTORIA Blog`;
      const meta = document.querySelector('meta[name="description"]');
      if (meta) meta.setAttribute('content', post.excerpt);
    }
    return () => { document.title = 'ESTORIA — Where Your Future Lives'; };
  }, [post]);

  if (!post) {
    return (
      <div className="pt-20 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="font-heading text-5xl text-foreground mb-4">{t('common.notFound')}</h1>
          <Link to="/blog" className="text-primary font-nav text-xs uppercase tracking-wider hover:underline">
            ← Back to Blog
          </Link>
        </div>
      </div>
    );
  }

  const formattedDate = new Date(post.date).toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric',
  });

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      await navigator.share({ title: post.title, url });
    } else {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <>
      {/* Hero cover */}
      <section className="relative h-[50vh] min-h-[360px] overflow-hidden">
        <img
          src={post.imageUrl}
          alt={post.title}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-background/20" />
      </section>

      {/* Article */}
      <article className="container mx-auto px-6 max-w-3xl -mt-24 relative z-10 pb-24">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-xs text-muted-foreground font-body mb-8">
            <Link to="/" className="hover:text-primary transition-colors">Home</Link>
            <span>/</span>
            <Link to="/blog" className="hover:text-primary transition-colors">{t('nav.blog')}</Link>
            <span>/</span>
            <span className="text-foreground truncate max-w-[200px]">{post.title}</span>
          </nav>

          {/* Category */}
          <span className="text-[10px] font-nav uppercase tracking-wider text-primary">{post.category}</span>

          {/* Title */}
          <h1 className="font-heading text-4xl md:text-5xl text-foreground font-light mt-3 mb-6 leading-tight">
            {post.title}
          </h1>

          {/* Meta row */}
          <div className="flex items-center gap-4 mb-8">
            <img src={post.author.imageUrl} alt={post.author.name} className="w-10 h-10 rounded-full object-cover" />
            <div>
              <Link to={`/team/${post.author.slug}`} className="text-sm text-foreground font-body hover:text-primary transition-colors">
                {post.author.name}
              </Link>
              <div className="flex items-center gap-2 text-xs text-muted-foreground font-body">
                <span>{formattedDate}</span>
                <span>·</span>
                <span>{post.readingTime} min read</span>
              </div>
            </div>
          </div>

          {/* Gold divider */}
          <div className="h-px gold-gradient mb-10" />

          {/* Content */}
          <div
            className="prose-estoria-article"
            dangerouslySetInnerHTML={{ __html: post.content }}
          />

          {/* Share */}
          <div className="mt-12 pt-8 border-t border-border flex items-center gap-4">
            <span className="text-xs text-muted-foreground font-nav uppercase tracking-wider">Share</span>
            <button
              onClick={handleShare}
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary font-body transition-colors border border-border rounded-sm px-4 py-2"
            >
              {copied ? <><Check size={14} /> Copied!</> : <><Share2 size={14} /> Copy Link</>}
            </button>
          </div>
        </motion.div>

        {/* Author card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-16 bg-card border border-border rounded-sm p-8"
        >
          <div className="flex items-start gap-5">
            <img
              src={post.author.imageUrl}
              alt={post.author.name}
              className="w-16 h-16 rounded-full object-cover flex-shrink-0"
            />
            <div>
              <h3 className="font-heading text-xl text-foreground">{post.author.name}</h3>
              <p className="text-xs text-primary font-nav uppercase tracking-wider mb-3">{post.author.role}</p>
              <p className="text-sm text-muted-foreground font-body leading-relaxed">{post.author.bio}</p>
              <Link
                to={`/team/${post.author.slug}`}
                className="inline-block mt-4 text-xs font-nav uppercase tracking-wider text-primary hover:underline"
              >
                View Profile →
              </Link>
            </div>
          </div>
        </motion.div>
      </article>

      {/* Related posts */}
      {relatedPosts.length > 0 && (
        <section className="py-16 px-6 bg-secondary/20">
          <div className="container mx-auto">
            <div className="w-12 h-px gold-gradient mb-6" />
            <h2 className="font-heading text-3xl text-foreground mb-10">Related Posts</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {relatedPosts.map((p, i) => (
                <BlogCard key={p.id} post={p} index={i} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Back link */}
      <div className="container mx-auto px-6 py-10">
        <Link
          to="/blog"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary font-nav uppercase tracking-wider transition-colors"
        >
          <ArrowLeft size={14} /> Back to Blog
        </Link>
      </div>
    </>
  );
}
