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

## Remaining (priority order)
**P0**
- DealDetail/AdminDeals stage & participant modals: drop `bg-secondary/border-border`
  near-black inputs; delete TaskForm `bg-white` patch (portal fix makes them moot).
- PropertyForm mobile: image delete/reorder are hover-only → add `opacity-100 sm:opacity-0
  sm:group-hover` + move-left/right buttons (touch reorder + set-cover); feature-row 5-col
  grid + TabsList overflow at 375px.
- i18n: PrivacyPolicy is 100% hardcoded English → `privacy.*` (et/en/ru); `formatDate(date,lang)`
  helper to replace `toLocaleDateString('en-US')` (BlogCard, Blog, BlogPost); wrap admin
  subtitles + PropertyForm section headers/help; strip jargon (IsActive, Lucide names, R2).
- Non-technical: EntityLinkPicker (no GUID paste); UserForm required marks + validation toast
  (not silently-disabled save) + photo upload; AdminTasks header "New task"; AdminCareers
  hydrate all 3 language tabs on edit.
- Faint: Login labels/subtitle + raw hex → tokens.

**P1**
- `<AdminPageHeader>` + roll out to every admin page (i18n subtitles).
- Adopt `<EmptyState>` on the 8 admin lists + public Team/Services/Blog/Careers (+ empty i18n keys).
- `<TableSkeleton>`/`<ErrorState>`; Dashboard loading/error.
- Token migration: literals → tokens; inline gold → `<Button>`; raw green/red/amber → `text-success/destructive/warning`. Add ESLint ban on `[hsl(` in className.
- Form pattern: full-page forms = stacked Cards; inline = Dialogs w/ sticky footer; one RequiredMark; AdminTeam checkbox-group multi-select.
- Public: one PropertyCard grid gap (gap-6); shared PageHeader; PropertyDetail single gold submit; nav breakpoint → lg; shared `<LanguageSwitcher>`.

**P2** — StageBadge/statusColors helper; safe-area on PropertyDetail fixed bar; DOMPurify on AdminInbox iframe; non-drag reorder fallback for Services/Team; SEO helper under BlogForm meta.

## Still open (separate tasks)
- E2E desktop + mobile (Playwright 375px) for admin + public.
- Feature proposals doc.
