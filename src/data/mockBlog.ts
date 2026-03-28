export interface BlogPostItem {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  imageUrl: string;
  category: string;
  date: string;
  readingTime: number;
  author: {
    name: string;
    slug: string;
    role: string;
    imageUrl: string;
    bio: string;
  };
}

export const mockBlogPosts: BlogPostItem[] = [
  {
    id: '1',
    slug: 'tallinn-luxury-market-2025',
    title: 'Tallinn\'s Luxury Real Estate Market: What to Expect in 2025',
    excerpt: 'As Estonia\'s capital continues to attract international attention, the premium property segment shows resilient growth. We analyze the key trends shaping the market this year.',
    content: `<h2>A Year of Opportunity</h2>
<p>The Tallinn luxury real estate market enters 2025 with cautious optimism. After a period of consolidation, premium properties are once again attracting strong interest from both domestic and international buyers.</p>
<p>Several factors are driving this renewed confidence: Estonia\'s continued digital leadership, growing foreign direct investment, and a limited supply of truly premium properties in desirable locations.</p>
<h3>Key Trends</h3>
<ul>
<li><strong>Waterfront premium:</strong> Properties along the Noblessner and Pirita coastline command 15-25% premiums over comparable inland locations</li>
<li><strong>Sustainability matters:</strong> Energy class A properties sell faster and for higher prices than lower-rated alternatives</li>
<li><strong>Smart home integration:</strong> Buyers increasingly expect advanced home automation as standard in premium segments</li>
<li><strong>International buyers:</strong> Finnish, Swedish, and German buyers represent the largest international segments</li>
</ul>
<h3>Price Outlook</h3>
<p>We expect premium property prices in central Tallinn to appreciate 5-8% in 2025, with waterfront properties potentially outperforming at 8-12%. The rental market remains robust, with premium yields averaging 4-5% annually.</p>
<blockquote>The Tallinn market offers a unique combination of European quality of life, digital infrastructure, and relative value compared to other Nordic capitals.</blockquote>
<p>For investors considering the Estonian market, timing remains favorable. The window of relative affordability compared to Helsinki, Stockholm, and Copenhagen continues to narrow as international awareness grows.</p>
<h2>Our Recommendations</h2>
<p>Whether you\'re looking to purchase your primary residence or diversify your investment portfolio, the current market presents compelling opportunities. Our team is ready to guide you through every step.</p>`,
    imageUrl: 'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=1200&q=80',
    category: 'Market Insights',
    date: '2025-03-15',
    readingTime: 6,
    author: {
      name: 'Karl Rebane',
      slug: 'karl-rebane',
      role: 'Investment Director',
      imageUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&q=80',
      bio: 'Karl leads ESTORIA\'s investment advisory practice with over a decade of experience in Baltic real estate.',
    },
  },
  {
    id: '2',
    slug: 'staging-tips-premium-homes',
    title: '7 Staging Secrets That Sell Premium Homes Faster',
    excerpt: 'Professional staging can reduce time on market by up to 73%. Our interior design team shares the techniques that make luxury properties irresistible to discerning buyers.',
    content: `<h2>The Art of First Impressions</h2>
<p>In luxury real estate, first impressions aren\'t just important — they\'re everything. Professional staging transforms a property from a house into a lifestyle proposition, helping buyers envision their future in the space.</p>
<h3>1. Less is More</h3>
<p>Premium buyers want to see space, light, and possibility. Remove personal items and excess furniture. Each room should have a clear purpose and generous circulation space.</p>
<h3>2. Invest in Art</h3>
<p>A few carefully chosen art pieces elevate a space instantly. Abstract works in neutral tones with metallic accents work particularly well in modern luxury interiors.</p>
<h3>3. Layer Your Lighting</h3>
<p>Combine ambient, task, and accent lighting to create warmth and dimension. Smart lighting that adjusts throughout the day creates an unforgettable viewing experience.</p>
<blockquote>A staged home doesn\'t just look better — it feels better. And in luxury real estate, feeling is everything.</blockquote>
<p>Contact our staging team for a complimentary consultation on your property.</p>`,
    imageUrl: 'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=1200&q=80',
    category: 'Tips & Advice',
    date: '2025-02-28',
    readingTime: 5,
    author: {
      name: 'Anna Kask',
      slug: 'anna-kask',
      role: 'Senior Property Consultant',
      imageUrl: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&q=80',
      bio: 'Anna specializes in premium residential properties and has been recognized as Estonia\'s top-performing consultant.',
    },
  },
  {
    id: '3',
    slug: 'old-town-living-guide',
    title: 'The Definitive Guide to Old Town Living in Tallinn',
    excerpt: 'From medieval charm to modern convenience — everything you need to know about making UNESCO\'s best-preserved medieval city your home.',
    content: `<h2>A Living Heritage</h2><p>Tallinn\'s Old Town is not a museum — it\'s a vibrant, living neighborhood where 800 years of history meets contemporary European life. Living here means cobblestone streets, candlelit restaurants, and a community unlike any other.</p><p>Properties in Old Town range from intimate apartments in restored medieval buildings to grand townhouses with private courtyards. Each property tells a unique story.</p>`,
    imageUrl: 'https://images.unsplash.com/photo-1560969184-10fe8719e047?w=1200&q=80',
    category: 'Lifestyle',
    date: '2025-02-10',
    readingTime: 8,
    author: {
      name: 'Maria Tamm',
      slug: 'maria-tamm',
      role: 'CEO & Founder',
      imageUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&q=80',
      bio: 'Maria founded ESTORIA with a vision to redefine luxury real estate in Estonia.',
    },
  },
  {
    id: '4',
    slug: 'investment-guide-estonia',
    title: 'Investing in Estonian Real Estate: A Foreign Buyer\'s Guide',
    excerpt: 'Estonia\'s transparent legal system and digital infrastructure make property investment straightforward for international buyers. Here\'s your complete guide.',
    content: `<h2>Why Estonia?</h2><p>Estonia offers a unique combination of EU membership, digital governance, flat tax system, and growing property values. For international investors, it represents one of Europe\'s most compelling markets.</p>`,
    imageUrl: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1200&q=80',
    category: 'Investment',
    date: '2025-01-20',
    readingTime: 10,
    author: {
      name: 'Karl Rebane',
      slug: 'karl-rebane',
      role: 'Investment Director',
      imageUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&q=80',
      bio: 'Karl leads ESTORIA\'s investment advisory practice with over a decade of experience in Baltic real estate.',
    },
  },
  {
    id: '5',
    slug: 'sustainable-homes-estonia',
    title: 'The Rise of Sustainable Luxury Homes in Estonia',
    excerpt: 'How energy efficiency and eco-conscious design are reshaping premium real estate — and why it matters for your investment.',
    content: `<h2>Green is the New Gold</h2><p>Sustainability is no longer a niche concern — it\'s a defining feature of modern luxury. In Estonia, where winters are long and energy costs significant, sustainable design represents both an ethical choice and a smart investment.</p>`,
    imageUrl: 'https://images.unsplash.com/photo-1518780664697-55e3ad937233?w=1200&q=80',
    category: 'Sustainability',
    date: '2025-01-05',
    readingTime: 7,
    author: {
      name: 'Anna Kask',
      slug: 'anna-kask',
      role: 'Senior Property Consultant',
      imageUrl: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&q=80',
      bio: 'Anna specializes in premium residential properties and has been recognized as Estonia\'s top-performing consultant.',
    },
  },
  {
    id: '6',
    slug: 'kalamaja-neighborhood-guide',
    title: 'Kalamaja: Tallinn\'s Most Creative Neighborhood',
    excerpt: 'Once a fishing village, now the epicenter of Tallinn\'s creative scene. Discover why Kalamaja is the most in-demand neighborhood for young professionals.',
    content: `<h2>From Fishing Village to Cultural Hub</h2><p>Kalamaja\'s transformation is one of Tallinn\'s great urban stories. This former working-class neighborhood has become the city\'s most vibrant cultural district.</p>`,
    imageUrl: 'https://images.unsplash.com/photo-1600573472592-401b489a3cdc?w=1200&q=80',
    category: 'Lifestyle',
    date: '2024-12-15',
    readingTime: 6,
    author: {
      name: 'Maria Tamm',
      slug: 'maria-tamm',
      role: 'CEO & Founder',
      imageUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&q=80',
      bio: 'Maria founded ESTORIA with a vision to redefine luxury real estate in Estonia.',
    },
  },
];
