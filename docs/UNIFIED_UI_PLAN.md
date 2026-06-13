# Estoria Unified UI/UX Plan

From the ui-ux-pro-max audit (115 findings, 25 high). Brand: gold `hsl(43 50% 54%)`
on dark public site / `.admin-theme` white admin. Goal: one design logic everywhere,
easy for non-technical Estonian/Russian owners, good on phones.

## The one logic (conventions every page follows)
1. **Tokens, not literals** — never `[hsl(...)]` in page code (~880 today). Map to
   semantic tokens (`bg-background`, `text-foreground`, `text-muted-foreground`,
   `border-border`, `primary`). `.admin-theme` is now token-complete.
2. **One primary CTA via `<Button>`** — one gold `<Button>` (default variant) per
   screen; secondary = `outline`, tertiary = `ghost`, delete = `destructive`. Stop
   hand-rebuilding inline gold (30 occurrences / 21 files).
3. **One field style** — `Input` tokenized (done); shared `adminFormStyles`
   (inputClass/labelClass/helpClass/RequiredMark) instead of 7 copies; label ≥ `hsl(0 0% 25%)`.
4. **One page header** — `<AdminPageHeader title subtitle action />` (subtitle = i18n key)
   on every admin page incl. Dashboard/Inbox; public `<PageHeader>` (gradient + breadcrumb
   + gold underline) for secondary pages.
5. **One empty/loading/error** — shared `<EmptyState>` (done: tokens) on all 8 admin lists
   + public Team/Services/Blog/Careers; `<TableSkeleton>`/`<StatCardSkeleton>`; `<ErrorState onRetry>`.
6. **One mobile list pattern** — AdminDeals split: stacked cards `<lg:hidden>` + table
   `hidden lg:block`. Properties must re-surface price+status; Users status.
7. **Tap targets ≥44px**, icon buttons get `aria-label`, active nav `aria-current`.
8. **Radius** — keep `--radius:0` sharp; `rounded-full` only true circles (avatars).
9. **No GUIDs** — replace raw ID paste (DealForm, TaskForm, AdminInbox) with one
   `<EntityLinkPicker>` search-autocomplete.
10. **Estonian primary, all strings via `t()`** — no hardcoded English.

## Shipped (foundation, commit 392d389 + earlier)
- Portal theme fix (`body.admin-theme` while admin mounted) → dialogs/selects render light.
- `.admin-theme` token-complete (`--success`, `--gold*`, `--radius`, `--sidebar-*`).
- Global `:focus-visible` gold ring (keyboard focus restored site-wide).
- `Input` tokenized; `TabsList` `overflow-x-auto`; `EmptyState` → tokens.
- Admin main area defaults to dark text (faint-text root fix, f26c5e1).
- **`<AdminPageHeader>` shipped + rolled across all 18 admin pages** (0020632) —
  tokenized title/subtitle/action, no raw hsl literals in headers.
- **Public feature batch (43cb362):** PropertyDetail JSON-LD (schema.org
  Residence/Apartment + Offer), `<ContactActions>` (Call/WhatsApp/Email, 44px) on
  PropertyDetail + Team + TeamMemberDetail, mortgage calculator, one-click PDF
  brochure (`/properties/:slug/print`); PropertyForm "Write description (AI)"
  button (backend `/api/admin/ai/describe`, 0c57f6f); website enquiries
  auto-captured as CRM contacts (0c57f6f).

## Shipped 2026-06-13 — full admin sweep (2845819, 518dd7b; backend 7a9feaf)
**P0 — all done**
- ✅ DealDetail/AdminDeals modal inputs → readable light tokens (portal fix).
- ✅ PropertyForm mobile image controls: always-visible on touch, 44px move-left/right
  + delete + set-cover, drag kept on desktop, flex-wrap tabs at 375px.
- ✅ PrivacyPolicy fully i18n; `formatDate()` replaces `toLocaleDateString` across 7 files.
- ✅ EntityLinkPicker (search-autocomplete, no GUID paste) wired into DealForm/TaskForm/AdminInbox.
- ✅ UserForm required marks + validation toast (no more silently-disabled save).
- ✅ Login label/subtitle contrast.
- ✅ AdminCareers edit hydrates all 3 language tabs — required a BACKEND fix:
  new `AdminCareerDetailDto` + `GetByIdAdminAsync` (GET /admin/careers/{id} now returns the
  per-language Translations map; admin GET-by-id previously returned the flat list DTO so
  EN/RU never reached the client) + `useAdminCareer(id)` hook.

**P1 — mostly done**
- ✅ `<AdminPageHeader>` across all 18 admin pages (0020632).
- ✅ `<EmptyState>` / `<ErrorState>` / `<TableSkeleton>` (+StatCardSkeleton) created & adopted on admin lists.
- ✅ Token migration: admin 785→0 raw `[hsl()]` literals; gold→`primary`/`<Button>`, green→`success`,
  red→`destructive`; amber left (no warning token); multi-colour status schemes left intact.
  ESLint `warn` rule bans `[hsl(` in admin className (scoped to src/pages/admin + components/admin).

## Remaining (lower priority, deliberately deferred)
**P1** — Form-pattern unification (stacked Cards vs Dialogs, one RequiredMark, AdminTeam
checkbox multi-select). Public polish: PropertyCard grid gap, shared PageHeader,
PropertyDetail single gold submit, shared `<LanguageSwitcher>`. (Nav breakpoint was already
`xl` — fine; not lowered.)
**P2** — StageBadge/statusColors helper; safe-area on PropertyDetail fixed bar; non-drag
reorder fallback for Services/Team; SEO helper under BlogForm meta.
(✅ DOMPurify on AdminInbox iframe — done: sanitize + `sandbox=""`.)

## Still open (separate tasks)
- Visual smoke pass of the admin after the colour sweep (Vercel preview or local stack).
- E2E desktop + mobile (Playwright 375px) for admin + public.
- kv.ee export adapter — blocked on owner obtaining the kv.ee partner XML spec.
