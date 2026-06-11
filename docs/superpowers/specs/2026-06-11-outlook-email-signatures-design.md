# Estoria Outlook Email Signatures

## Goal

Create polished, copyable Outlook email signatures for Nelia Novare and Julia Berg using Estoria branding and verified public team contact details.

## Approved Layout

Use the compact side-by-side layout:

- Transparent gold Estoria logo on the left.
- Thin gold vertical divider.
- Name, role, phone, email, website, and location on the right.
- White/transparent background with restrained gold and dark gray styling.
- No headshots or social icons.

## Contact Details

### Nelia Novare

- Role: Real Estate Expert
- Phone: +372 5555 4722
- Email: nelia@estoria.estate

### Julia Berg

- Role: Real Estate Expert
- Phone: +372 5870 8330
- Email: julia@estoria.estate

Shared details:

- Website: https://estoria.estate
- Location: Tallinn, Estonia

## Deliverables

1. A transparent PNG logo in `public/` dedicated to email signatures and available from the production Estoria domain.
2. A standalone Outlook-compatible HTML signature for each person.
3. A browser preview page showing both signatures.
4. A copy button for each signature that places Outlook-ready rich HTML and plain text on the clipboard.
5. Brief installation instructions for Outlook desktop and Outlook on the web.

## Outlook Compatibility

Signatures will use:

- Nested HTML tables for layout.
- Inline CSS only.
- Arial and standard system fonts.
- Absolute HTTPS links for the logo and website.
- Explicit image dimensions and border attributes.
- Clickable `tel:`, `mailto:`, and website links.
- No flexbox, grid, SVG, WebP, JavaScript, or external styles inside the copied signature.

The preview page may use JavaScript only for clipboard copying. The signature markup itself remains static and Outlook-safe.

## Logo Asset

Convert the existing transparent Estoria logo to PNG without changing its design. The deployed URL will be:

`https://estoria.estate/email-signature-logo.png`

The signature uses a displayed width of approximately 78 pixels.

## Verification

- Confirm the PNG has transparency and loads from the public Estoria URL after deployment.
- Validate both signatures contain the correct details and absolute links.
- Test rich HTML clipboard output and plain-text fallback.
- Run the project lint, tests, and production build.
- Verify the deployed preview and logo endpoints.
