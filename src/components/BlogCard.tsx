import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import type { BlogPostItem } from '@/data/mockBlog';

interface Props {
  post: BlogPostItem;
  index?: number;
}

export default function BlogCard({ post, index = 0 }: Props) {
  const formattedDate = new Date(post.date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
    >
      <Link to={`/blog/${post.slug}`} className="group block">
        {/* Image */}
        <div className="relative overflow-hidden rounded-sm aspect-video bg-muted">
          <img
            src={post.imageUrl}
            alt={post.title}
            loading="lazy"
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
          {/* Category badge */}
          <span className="absolute top-4 left-4 bg-background/90 text-foreground text-[10px] font-nav uppercase tracking-wider px-3 py-1.5 rounded-sm">
            {post.category}
          </span>
        </div>

        {/* Content */}
        <div className="mt-4 space-y-2">
          <h3 className="font-heading text-xl text-foreground group-hover:text-primary transition-colors duration-300 line-clamp-2">
            {post.title}
          </h3>
          <p className="text-sm text-muted-foreground font-body line-clamp-2 leading-relaxed">
            {post.excerpt}
          </p>

          {/* Author row */}
          <div className="flex items-center gap-3 pt-2">
            <img
              src={post.author.imageUrl}
              alt={post.author.name}
              className="w-7 h-7 rounded-full object-cover"
            />
            <span className="text-xs text-muted-foreground font-body">{post.author.name}</span>
            <span className="text-xs text-muted-foreground/50">·</span>
            <span className="text-xs text-muted-foreground/70 font-body">{formattedDate}</span>
          </div>
        </div>

        {/* Bottom gold border animation */}
        <div className="mt-4 h-px bg-border relative overflow-hidden">
          <div className="absolute inset-y-0 left-1/2 w-0 group-hover:left-0 group-hover:w-full gold-gradient transition-all duration-500" />
        </div>
      </Link>
    </motion.div>
  );
}
