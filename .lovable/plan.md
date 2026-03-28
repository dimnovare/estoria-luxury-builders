

# ESTORIA — Premium Real Estate Website

## Brand & Design System
- Dark luxury aesthetic (#0a0a0a, #111111, #1a1a1a backgrounds)
- Gold accents (#c9a84c, #d4af37) used sparingly
- Cormorant Garamond for headings, DM Sans for body, Outfit for nav
- Premium feel inspired by Four Seasons × Sotheby's

## Core Infrastructure
1. **i18n Setup** — ET (default), EN, RU with browser detection, static UI translations, API content served in correct language
2. **API Layer** — Axios instance with auto `?lang=` param, React Query hooks for all endpoints (properties, blog, team, services, careers, page content)
3. **Routing** — All routes including property detail, blog, team, services, careers, contact, admin placeholder, and 404

## Navigation
- Fixed transparent navbar → solid dark on scroll with smooth transition
- ESTORIA gold logo (Cormorant Garamond, letter-spaced)
- Center links in Outfit font, uppercase, gold underline hover animation
- Language switcher (ET | EN | RU) + gold-bordered "Contact Us" button
- Mobile: fullscreen dark overlay with stacked nav links

## Footer
- 4-column layout: Company info, Quick Links, Services, Contact
- Dark background, gold accent lines, social icons, copyright bar

## Homepage Sections

### 1. Hero (100vh)
- Video/image background from API with dark gradient overlay
- Centered gold logo mark with floating animation
- Staggered text reveal: title → subtitle → search bar
- Search bar: City dropdown, Property Type, Buy/Rent toggle, gold Search button
- Animated scroll indicator

### 2. Featured Properties
- 3-column responsive grid of PropertyCard components
- **PropertyCard** (reusable): 4:3 image with skeleton loading, hover scale + gold tint, sale/rent badge, price badge, title, address, specs (area, rooms, beds), gold border animation on hover
- "View All Properties" gold outline button

### 3. Services
- Row of dark cards with Lucide icons (gold), title, description
- Hover: lift with subtle gold glow
- "View All Services" link

### 4. About Teaser
- Asymmetric layout: 60% image (with parallax), 40% text content from API
- "Learn More" button linking to /about

### 5. Newsletter CTA
- Dark section with gold border accents
- Email input + gold "Subscribe" button
- Success/error states with smooth transitions

## Animations (Framer Motion)
- Page transitions with AnimatePresence (fade + slide)
- Scroll-triggered reveals (whileInView, once: true)
- Staggered grid entrances for property cards
- Navbar background transition on scroll

## Responsive Design
- Mobile-first: 1 → 2 → 3 column grids
- Hero search bar stacks vertically on mobile
- Footer collapses to single column
- Mobile nav: fullscreen overlay

## Loading & Error States
- Dark shimmer skeleton screens
- Elegant inline error messages

## Placeholder Pages
- Properties listing, Property detail, About, Team, Services, Blog, Careers, Contact, Admin — created as route-ready placeholders with consistent layout

