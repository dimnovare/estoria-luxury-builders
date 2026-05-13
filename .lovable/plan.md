# Services Page Redesign — Editorial List Layout

## Goal
Replace the bulky alternating image-panel layout on `/services` with a compact, elegant editorial list that shows all services at a glance while keeping 100 % of the existing functionality.

## What stays the same
- Data source: `useServices()` hook + `Service` type (`id`, `slug`, `iconName`, `name`, `description`, `priceInfo`)
- Icon resolution via `resolveServiceIcon(service.iconName)`
- Slug-based anchor links (`id={service.slug || service.id}`)
- Framer Motion scroll animations ( fade + horizontal slide )
- Breadcrumb header, page title, subtitle (i18n via `useTranslation`)
- Bottom CTA section with gold-gradient button
- Error & loading skeleton states
- Dark theme + gold accent (`hsl(43 50% 54%)`), Cormorant Garamond headings

## What changes

### 1. Remove large decorative panels
Delete the second column in the alternating grid (the `aspect-[4/3]` boxes with 80 px faded icons and decorative circles).

### 2. New editorial list structure
Replace the entire services loop with a single-column vertical list:

```text
+-------------------------------------------------------------+
| [icon]  Service Name                    [priceInfo]   [→]   |
|         Description text...                                 |
+-------------------------------------------------------------+
| ─── thin gold-accented divider ───                        |
+-------------------------------------------------------------+
| [icon]  Service Name                    [priceInfo]   [→]   |
|         Description text...                                 |
+-------------------------------------------------------------+
```

Each row:
- **Left**: Small gold-tinted icon square (32–36 px) — no big circle background
- **Center-left**: Service name (Cormorant Garamond, ~text-2xl) + description below
- **Right**: `priceInfo` text (gold, uppercase, tracking-wider) + subtle arrow icon on hover
- **Hover**: row background lightens slightly (`bg-[hsl(0_0%_12%)]`), arrow fades in and slides right
- **Dividers**: thin 1 px lines with a small gold-gradient accent in the center

### 3. Mobile behavior
Rows stack vertically. Icon sits above the text. Price info sits below the description. Full-width tap targets.

### 4. Animation
Use `motion.div` with `whileInView` (fade + translateY) on each row. Stagger not needed — the rows entering viewport sequentially creates natural stagger.

### 5. Styling details
- Row padding: `py-8` desktop, `py-6` mobile
- Row hover: `transition-colors duration-300`
- Icon container: `w-10 h-10 rounded-md` with `bg-[hsl(43_50%_54%/0.08)]` and `text-[hsl(43_50%_54%)]`
- Title: `font-heading text-2xl md:text-3xl font-light text-foreground`
- Description: `text-muted-foreground text-sm leading-relaxed`
- Price: `text-[hsl(43_50%_54%)] font-nav text-xs uppercase tracking-wider`
- Arrow: `opacity-0 group-hover:opacity-100 transition-all duration-300`
- Divider: `h-px bg-border` with centered `gold-gradient` accent strip (`w-16 h-px`)

## Files to edit
- `src/pages/Services.tsx` — full layout rewrite of the services list section

## Out of scope
- Admin editor (`AdminServices.tsx`) — no changes needed
- API / demo data — no changes needed
- Bottom CTA section — keep as-is

## Acceptance check
1. All 4 demo services visible without scrolling on a 1080p screen
2. No horizontal scroll on mobile
3. Hover states work on desktop
4. Build passes (`npm run build` 0 errors)
5. i18n strings still resolve correctly