# Estoria Outlook Email Signatures Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deliver deployable, Outlook-compatible, copyable email signatures for Nelia Novare and Julia Berg with a transparent Estoria PNG logo.

**Architecture:** A small TypeScript signature-data module owns verified contact details and generates static table-based HTML plus plain text. A public React page renders previews and copies both MIME representations to the clipboard. Standalone HTML files reuse the same approved markup manually, while a transparent PNG in `public/` gives Outlook a broadly supported remote image URL.

**Tech Stack:** React 18, TypeScript, Vitest, browser Clipboard API, table-based HTML email markup, ImageMagick.

---

### Task 1: Signature data and Outlook-safe markup

**Files:**
- Create: `src/lib/emailSignatures.ts`
- Test: `src/lib/emailSignatures.test.ts`

- [ ] **Step 1: Write failing tests for both staff records and generated markup**

Test that:

- Nelia and Julia have the approved names, roles, formatted phones, emails, and `tel:` values.
- Generated HTML contains table markup, inline styles, absolute HTTPS logo/website URLs, clickable phone/email links, and no `flex`, `grid`, `svg`, or `webp`.
- Generated plain text contains the same contact details.

- [ ] **Step 2: Run the focused test and confirm it fails**

Run:

```powershell
bun run test src/lib/emailSignatures.test.ts
```

Expected: failure because `emailSignatures.ts` does not exist.

- [ ] **Step 3: Implement the typed records and generators**

Create:

```ts
export interface EmailSignaturePerson {
  slug: 'nelia-novare' | 'julia-berg';
  name: string;
  role: string;
  phoneDisplay: string;
  phoneHref: string;
  email: string;
}

export const EMAIL_SIGNATURE_PEOPLE: EmailSignaturePerson[] = [...];
export function buildSignatureHtml(person: EmailSignaturePerson): string;
export function buildSignatureText(person: EmailSignaturePerson): string;
```

Use `https://estoria.estate/email-signature-logo.png`, nested tables, Arial, inline styles, explicit image dimensions, and HTML escaping for person-provided text.

- [ ] **Step 4: Run the focused test and confirm it passes**

Run:

```powershell
bun run test src/lib/emailSignatures.test.ts
```

Expected: all signature data and markup tests pass.

### Task 2: Transparent signature logo

**Files:**
- Create: `public/email-signature-logo.png`

- [ ] **Step 1: Convert the approved transparent WebP logo to PNG**

Run ImageMagick against `public/logo-88.webp`, preserving transparency and dimensions:

```powershell
magick public/logo-88.webp -define png:color-type=6 public/email-signature-logo.png
```

- [ ] **Step 2: Inspect the PNG**

Verify with ImageMagick that the output format is PNG and alpha is present, then visually inspect it.

Expected: transparent background, unchanged gold Estoria mark.

### Task 3: Copyable browser page

**Files:**
- Create: `src/pages/EmailSignatures.tsx`
- Create: `src/pages/EmailSignatures.test.tsx`
- Modify: `src/App.tsx`

- [ ] **Step 1: Write failing page tests**

Render the page and assert:

- Both names and both copy buttons appear.
- Clicking Nelia’s button invokes `navigator.clipboard.write` with `text/html` and `text/plain`.
- The page includes Outlook desktop and Outlook web installation instructions.

- [ ] **Step 2: Run the page test and confirm it fails**

Run:

```powershell
bun run test src/pages/EmailSignatures.test.tsx
```

Expected: failure because the page does not exist.

- [ ] **Step 3: Implement the page**

Build a public `/email-signatures` page that:

- Renders the actual generated signature HTML inside a white preview surface.
- Provides one `Copy for Outlook` button per person.
- Uses `ClipboardItem` with both rich HTML and plain text.
- Falls back to copying plain text when rich clipboard APIs are unavailable.
- Shows concise Outlook desktop and Outlook web installation steps.

- [ ] **Step 4: Add the route**

Add:

```tsx
<Route path="/email-signatures" element={<EmailSignatures />} />
```

inside the public `MainLayout` routes.

- [ ] **Step 5: Run the page tests**

Run:

```powershell
bun run test src/pages/EmailSignatures.test.tsx
```

Expected: page and clipboard tests pass.

### Task 4: Standalone signature files

**Files:**
- Create: `public/email-signatures/nelia-novare.html`
- Create: `public/email-signatures/julia-berg.html`

- [ ] **Step 1: Create complete standalone HTML documents**

Each document must:

- Contain the same approved Outlook-safe signature table.
- Use the production PNG URL.
- Include the correct person-specific links and details.
- Avoid scripts and external styles.

- [ ] **Step 2: Validate their content**

Use `rg` to confirm the expected name, email, phone, website, and PNG URL in each file, and confirm `webp`, `flex`, `grid`, and `<svg` are absent.

### Task 5: Full verification and deployment

**Files:**
- Verify all files above.

- [ ] **Step 1: Run all automated checks**

Run:

```powershell
bun run test
npm run lint
bun run build
vercel build --yes
```

Expected: tests and builds pass; lint has zero errors.

- [ ] **Step 2: Browser-check the copy page**

Open `/email-signatures`, verify both previews and logo rendering, click both copy buttons, and confirm success feedback.

- [ ] **Step 3: Commit and push**

Commit the implementation and push `main`.

- [ ] **Step 4: Verify production**

Confirm:

- `https://estoria.estate/email-signatures`
- `https://estoria.estate/email-signature-logo.png`
- Both standalone HTML URLs

return successfully and display the approved content.
