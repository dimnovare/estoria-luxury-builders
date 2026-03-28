import type { Property } from '@/hooks/api/useProperties';

export interface TeamMember {
  id: string;
  slug: string;
  name: string;
  role: string;
  imageUrl: string;
  bio: string;
  phone: string;
  email: string;
  languages: string[];
}

export interface ServiceItem {
  id: string;
  icon: string;
  title: string;
  description: string;
  price?: string;
}

export interface CareerItem {
  id: string;
  slug: string;
  title: string;
  location: string;
  type: string;
  description: string;
}

export const mockTeam: TeamMember[] = [
  {
    id: '1', slug: 'maria-tamm',
    name: 'Maria Tamm',
    role: 'CEO & Founder',
    imageUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=600&q=80',
    bio: '<p>Maria founded ESTORIA with a vision to redefine luxury real estate in Estonia. With over 15 years of experience in premium property markets across Europe, she brings unparalleled expertise and a deeply personal approach to every client relationship.</p><p>Prior to founding ESTORIA, Maria led the premium division at one of the Baltic\'s largest real estate firms, where she closed over €200M in transactions. She holds a Master\'s degree in Real Estate Management from the London School of Economics.</p><p>Maria is passionate about architecture, sustainable design, and connecting people with spaces that inspire their best lives.</p>',
    phone: '+372 5551 2345',
    email: 'maria@estoria.ee',
    languages: ['Estonian', 'English', 'Russian', 'Finnish'],
  },
  {
    id: '2', slug: 'karl-rebane',
    name: 'Karl Rebane',
    role: 'Investment Director',
    imageUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&q=80',
    bio: '<p>Karl leads ESTORIA\'s investment advisory practice, helping high-net-worth clients build and optimize their real estate portfolios. His analytical approach and deep market knowledge ensure every investment decision is data-driven.</p><p>Before joining ESTORIA, Karl spent a decade in private equity, specializing in Baltic real estate assets. He holds a CFA charter and an MBA from INSEAD.</p>',
    phone: '+372 5559 8765',
    email: 'karl@estoria.ee',
    languages: ['Estonian', 'English', 'German'],
  },
  {
    id: '3', slug: 'anna-kask',
    name: 'Anna Kask',
    role: 'Senior Property Consultant',
    imageUrl: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=600&q=80',
    bio: '<p>Anna specializes in premium residential properties in Tallinn\'s most sought-after neighborhoods. Known for her exceptional attention to detail and warm client relationships, she consistently delivers outstanding results.</p><p>Anna has been recognized as Estonia\'s top-performing property consultant three years running.</p>',
    phone: '+372 5553 4567',
    email: 'anna@estoria.ee',
    languages: ['Estonian', 'English', 'Russian'],
  },
  {
    id: '4', slug: 'erik-mets',
    name: 'Erik Mets',
    role: 'Commercial Property Manager',
    imageUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=600&q=80',
    bio: '<p>Erik manages ESTORIA\'s commercial property portfolio, working with businesses to find the perfect spaces for their operations. His background in corporate real estate and facility management gives him a unique perspective on commercial needs.</p>',
    phone: '+372 5557 6543',
    email: 'erik@estoria.ee',
    languages: ['Estonian', 'English'],
  },
  {
    id: '5', slug: 'liisa-pold',
    name: 'Liisa Põld',
    role: 'Rental Specialist',
    imageUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&q=80',
    bio: '<p>Liisa oversees ESTORIA\'s rental division, matching discerning tenants with premium properties. Her thorough vetting process and property management expertise ensure seamless experiences for both landlords and tenants.</p>',
    phone: '+372 5552 3456',
    email: 'liisa@estoria.ee',
    languages: ['Estonian', 'English', 'Russian', 'French'],
  },
];

export const mockServices: ServiceItem[] = [
  {
    id: '1', icon: 'Building2', title: 'Property Sales',
    description: 'Our sales team provides end-to-end support for buying and selling premium real estate. From market analysis and property valuation to negotiation and closing, we ensure every transaction is handled with precision and discretion. Our network of qualified buyers and sellers gives you access to exclusive off-market opportunities.',
    price: 'Commission: 3-5% of sale price',
  },
  {
    id: '2', icon: 'Home', title: 'Rental Management',
    description: 'Full-service property management for discerning landlords and tenants. We handle tenant screening, lease administration, maintenance coordination, and financial reporting. Our managed properties consistently achieve above-market rental yields while maintaining impeccable condition.',
    price: 'From €150/month per property',
  },
  {
    id: '3', icon: 'TrendingUp', title: 'Investment Advisory',
    description: 'Strategic real estate investment consulting for individuals and institutions. We analyze market trends, identify high-potential assets, and structure deals to maximize returns. Our portfolio approach balances growth with risk management across residential, commercial, and development sectors.',
  },
  {
    id: '4', icon: 'FileCheck', title: 'Property Valuation',
    description: 'Certified property valuations backed by deep local expertise, comprehensive market data, and international standards. Whether for sale, purchase, mortgage, insurance, or legal purposes, our valuations are trusted by banks, courts, and private clients throughout Estonia.',
    price: 'From €350 per valuation',
  },
  {
    id: '5', icon: 'Scale', title: 'Legal Consultation',
    description: 'Navigate the complexities of Estonian real estate law with confidence. Our legal partners provide guidance on property transactions, due diligence, zoning regulations, permits, and contract review. Especially valuable for international buyers unfamiliar with local regulations.',
  },
  {
    id: '6', icon: 'Paintbrush', title: 'Interior Design & Staging',
    description: 'Transform spaces to maximize appeal and value. Our design team offers full interior design services for new properties and professional staging for listings. Staged properties sell 73% faster and for higher prices — our designers make every room tell a compelling story.',
    price: 'Custom pricing',
  },
];

export const mockCareers: CareerItem[] = [
  {
    id: '1', slug: 'senior-property-consultant',
    title: 'Senior Property Consultant',
    location: 'Tallinn',
    type: 'Full-time',
    description: '<h2>About the Role</h2><p>We\'re looking for an experienced property consultant to join our growing team. You\'ll work with high-net-worth clients, managing premium residential transactions from listing to closing.</p><h3>Requirements</h3><ul><li>5+ years of experience in luxury real estate</li><li>Proven track record of high-value transactions</li><li>Fluent in Estonian and English (Russian is a plus)</li><li>Strong negotiation and relationship-building skills</li><li>Real estate license in Estonia</li></ul><h3>What We Offer</h3><ul><li>Competitive base salary + commission</li><li>Access to exclusive property portfolio</li><li>Professional development budget</li><li>Flexible working arrangements</li><li>Premium health insurance</li></ul>',
  },
  {
    id: '2', slug: 'marketing-coordinator',
    title: 'Marketing Coordinator',
    location: 'Tallinn',
    type: 'Full-time',
    description: '<h2>About the Role</h2><p>Join our marketing team to help craft and execute campaigns that position ESTORIA as the leading luxury real estate brand in the Baltics. You\'ll manage digital channels, coordinate photoshoots, and develop compelling property narratives.</p><h3>Requirements</h3><ul><li>3+ years in marketing, preferably luxury or real estate</li><li>Experience with digital marketing, social media, and content creation</li><li>Strong copywriting skills in Estonian and English</li><li>Proficiency in Adobe Creative Suite</li></ul>',
  },
  {
    id: '3', slug: 'property-valuation-analyst',
    title: 'Property Valuation Analyst',
    location: 'Tallinn / Tartu',
    type: 'Full-time',
    description: '<h2>About the Role</h2><p>We\'re seeking a detail-oriented valuation analyst to join our appraisal team. You\'ll conduct property inspections, market research, and prepare certified valuation reports for a diverse portfolio of premium properties.</p><h3>Requirements</h3><ul><li>Degree in Real Estate, Finance, or related field</li><li>Certified valuer or working toward certification</li><li>Analytical mindset with attention to detail</li><li>Valid driver\'s license</li></ul>',
  },
];
