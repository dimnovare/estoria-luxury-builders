# Property Portal Export Framework Design

Date: 2026-06-12

## Summary

Estoria will gain a reusable property-export framework for publishing selected
listings to external real-estate portals. Kinnisvara24 is the first adapter, but
the persistence model, admin UI, feed orchestration, validation, and public
routing will not depend on Kinnisvara24-specific fields.

Each property has an independent on/off switch for each installed portal. All
portal switches default to off, including for existing properties. A listing is
exported only when it is active, enabled for that portal, and valid according to
the portal adapter.

## Goals

- Export Estoria listings to Kinnisvara24 using its documented XML format.
- Let administrators opt individual properties into each portal.
- Make later portal integrations additive rather than requiring new columns on
  `Property` or another bespoke feed implementation.
- Keep portal-specific field mappings and validation isolated in adapters.
- Produce deterministic, standards-compliant output that external systems can
  poll safely.
- Surface portal validation problems in the property editor.

## Non-goals

- Importing listings from external portals into Estoria.
- Receiving publication status or leads back from Kinnisvara24.
- Scheduling outbound push jobs; Kinnisvara24 polls a public feed URL.
- Building dynamic forms for arbitrary portal-specific override fields in this
  first version.
- Automatically enabling existing or newly created properties.

## Repositories

The work spans both Estoria repositories:

- Backend: `C:\Users\Dmitri.MARKIT\source\repos\Estoria`
- Frontend: `C:\Users\Dmitri.MARKIT\source\repos\estoria-luxury-builders`

The backend owns portal registration, persistence, validation, feed generation,
and serialization. The frontend renders registered portal switches and their
validation state.

## Architecture

### Portal adapter

The application layer defines `IPropertyExportAdapter`. Each adapter exposes:

- A stable lowercase key, such as `kinnisvara24`.
- A display name for the admin UI.
- The response content type and preferred public filename.
- Validation for a normalized property export record.
- Serialization of a collection of valid normalized records.

Adapters are registered through dependency injection. A
`PropertyExportAdapterRegistry` resolves adapters by key and returns metadata
for the admin API. Duplicate keys cause application startup to fail.

Portal-specific constants, value mappings, location codes, and document
structure remain inside the corresponding adapter. The shared framework does
not assume XML and can support JSON or another format later.

### Shared export record

`PropertyExportService` queries Estoria data once and maps it into a normalized
record containing:

- Property identity, slug, type, transaction, status, price, currency, and area.
- Rooms, bedrooms, bathrooms, floor data, year, and energy class.
- Coordinates.
- All property translations.
- Ordered processed images with their available variants.
- Assigned agent identity, translated name, email, phone, and photo.
- Canonical Estoria listing URL.
- Optional per-publication settings JSON.

Adapters consume this record and do not query Entity Framework directly. This
keeps mapping tests independent from persistence tests and prevents portal code
from leaking into the property service.

### Feed orchestration

For a requested portal key, `PropertyExportService`:

1. Resolves the adapter from the registry.
2. Queries properties that are `Active` and have an enabled publication row for
   that portal.
3. Builds normalized export records in deterministic property-ID order.
4. Runs adapter validation for every record.
5. Logs structured warnings and excludes invalid records.
6. Passes the valid records to the adapter serializer.
7. Returns the adapter content type and serialized body.

An invalid listing does not make the complete feed unavailable. A serializer or
database failure is a feed-level failure and returns HTTP 500 after being
logged. Zero valid listings produces a valid empty document.

## Data Model

Add `PropertyPortalPublication`:

| Field | Type | Behavior |
| --- | --- | --- |
| `Id` | `Guid` | Standard Estoria entity ID |
| `PropertyId` | `Guid` | Required FK to `Property`, cascade delete |
| `PortalKey` | `string(64)` | Stable registered adapter key |
| `IsEnabled` | `bool` | Defaults to false |
| `SettingsJson` | nullable `jsonb` | Reserved for future portal-specific overrides |
| timestamps | existing base fields | Standard Estoria audit timestamps |

The table has a unique index on `(PropertyId, PortalKey)` and an index on
`(PortalKey, IsEnabled, PropertyId)` for feed queries.

`Property` receives a `PortalPublications` navigation collection. No
portal-specific field is added to `Property`, and there is no database table for
portal definitions: installed adapters are the source of truth.

Missing rows are treated as disabled. Create and update operations store rows
only for portal keys supplied by the admin form and reject unknown keys. The
initial migration creates no enabled publication rows.

## Admin API

### Portal metadata

`GET /api/admin/property-export-portals` returns installed adapters:

```json
[
  {
    "key": "kinnisvara24",
    "displayName": "Kinnisvara24",
    "feedUrl": "https://estoria.estate/kinnisvara24.xml"
  }
]
```

The endpoint uses the same authorization policy as property administration.

### Property reads and writes

Admin property detail responses add:

```json
{
  "portalPublications": {
    "kinnisvara24": {
      "isEnabled": true,
      "validationErrors": []
    }
  }
}
```

Create and update DTOs accept a boolean map:

```json
{
  "portalPublications": {
    "kinnisvara24": true
  }
}
```

Validation errors are computed from the current property data and adapter. A
draft or incomplete property may remain opted in while errors exist, but it is
not exported until it becomes both active and valid. This supports the existing
workflow where images and other details may be added after the first save.

Publication changes are saved in the same transaction as property scalar,
translation, and feature updates. Audit details include changed portal keys.

## Admin UI

The property form fetches portal metadata and renders one switch per installed
adapter in the existing **Visibility & agent** section.

Each switch shows:

- The portal display name.
- Whether publishing is enabled.
- A short explanation that only active, valid properties are exported.
- Adapter validation errors returned by the admin property detail endpoint.

For a new property every switch starts off. Existing properties without
publication rows also display as off. The frontend sends a complete boolean map
on create and update so removed or disabled selections cannot remain stale.

The UI contains no hard-coded list of portal keys. Adding a registered backend
adapter automatically exposes another switch.

## Public Feed API

The backend exposes:

- `GET /property-feeds/{portalKey}` as the generic adapter route.
- `GET /kinnisvara24.xml` as a stable friendly alias for the first adapter.

Both routes are anonymous. Unknown portal keys return HTTP 404. Responses use
the adapter content type, UTF-8, and `Cache-Control: public, max-age=300`.

The frontend Vercel configuration rewrites:

```text
/kinnisvara24.xml -> https://api.estoria.estate/kinnisvara24.xml
```

Kinnisvara24 receives `https://estoria.estate/kinnisvara24.xml`. The generic
route remains available on the API domain for diagnostics and future routing.

## Kinnisvara24 Adapter

The implementation follows the official documentation at
`https://kinnisvara24.ee/docs/import/xml`.

### Document structure

- Root element: `<objects>`.
- One child element per listing.
- Object element names:
  - `Apartment` -> `<apartment>`
  - `House` -> `<house>`
  - `Commercial` -> `<commercial>`
  - `Office` -> `<commercial>` with
    `<purposes><purpose>PURPOSE_BUREAU</purpose></purposes>`
  - `Land` -> `<land>`
- `external_id` is the property's stable GUID in `D` format.
- Only active records are included, with Kinnisvara24 status `ACTIVE`.
- `Sale` maps to `TRANSACTION_SALE`.
- `Rent` maps to `TRANSACTION_GIVE_RENT`.

### Core field mapping

- `price` from Estoria price using invariant decimal formatting.
- `area_size` from size.
- `rooms`, `bedrooms`, and `bathrooms` when present.
- `floor` and `floors` from floor and total floors.
- `build_year` from year built.
- `energy_class` mapped to `ENERGY_CLASS_A` through `ENERGY_CLASS_H`; unsupported
  values are omitted.
- `slogan`, `slogan_eng`, and `slogan_rus` from translated titles.
- Repeated `info` elements with `lang="et"`, `lang="en"`, or `lang="ru"` from
  available descriptions.
- `additional_info_url` from the canonical Estoria property URL.
- `url_title` from the Estonian title, falling back to English and then any
  available title.
- `map_point` from coordinates when both latitude and longitude exist.

HTML in descriptions remains part of the description string and is XML-escaped
by the serializer. XML is generated with `XmlWriter` or LINQ to XML, never
string interpolation.

### Location mapping

Kinnisvara24 expects portal codes for county, city, and city part. The adapter
owns case-insensitive lookup tables for Estoria city and district values.
Tallinn districts used by current listings are included in the first mapping.

The adapter splits an Estoria address into `street` and `no` only when the final
token clearly matches an Estonian building-number pattern. Otherwise the full
address is sent as `street` and `no` is omitted.

An enabled property with an unmapped required city or unsupported object type
receives an admin validation error and is excluded from the feed. New location
codes are added to the adapter without changing shared framework code.

### Agent mapping

- `owner_email` is always emitted and is required for a valid listing.
- `owner_mobile` uses the Estoria agent phone.
- `owner_picture` uses the agent photo URL when available.
- `owner_firstname` and `owner_surname` are derived from the translated agent
  name when it has at least two name parts. Kinnisvara24 can derive a name from
  email when these fields are absent.

### Images

Only images with processing status `Done` and a non-empty public URL are used.
The cover image is first, followed by the remaining images in `SortOrder`.
Each image selects `LargeUrl`, then `MediumUrl`, then legacy `Url`. URLs are
written as repeated `pic_url` elements.

## Validation

Shared validation checks framework invariants:

- The adapter exists.
- The publication references a registered portal key.
- The property is active before feed inclusion.

The Kinnisvara24 adapter validates:

- Supported Estoria property type.
- Supported transaction type.
- Positive price and area.
- At least one non-empty title and description.
- Mappable city/location.
- Assigned agent with a valid email address.

Images, coordinates, energy class, room counts, and translated variants beyond
the available fallback are optional.

## Security

- Feed routes are read-only and expose only already-public active listings.
- Draft, archived, sold, rented, and non-opted-in properties never enter the
  normalized feed query.
- `SettingsJson` is never serialized automatically; only an adapter may read
  explicitly supported keys.
- Admin portal metadata and publication controls remain authorized.
- No credentials are required for the first Kinnisvara24 feed. HTTP Basic Auth
  can be added at the route boundary later if Estoria chooses a protected feed.

## Testing

### Backend unit tests

- Registry resolves unique adapters and rejects duplicate keys.
- Framework filters by portal key, enabled state, and active property status.
- Unknown portal keys return not found.
- Invalid records are excluded without breaking valid records.
- Kinnisvara24 object and transaction mappings are correct.
- Numeric values use invariant formatting.
- XML-special characters are escaped and output parses as XML.
- Multilingual `info` and title fields use the correct language values.
- Location and address mappings cover supported Tallinn data.
- Agent fields and image fallback/order are correct.
- An empty result produces a valid `<objects>` document.

### Backend integration tests

- Migration creates the publication table and indexes.
- Admin create/update persists publication switches transactionally.
- Admin detail returns enabled state and adapter validation errors.
- Public feed includes an active enabled valid property.
- Public feed excludes disabled, draft, archived, and invalid properties.

### Frontend tests

- Registered portals render as switches.
- Missing publication state defaults to off.
- Existing state hydrates correctly.
- Save payload contains the complete portal boolean map.
- Validation errors are visible beside the matching portal.

### End-to-end checks

- `/kinnisvara24.xml` returns HTTP 200 and `application/xml`.
- The response parses as XML and has an `<objects>` root.
- The Vercel public-domain rewrite serves the same feed.

## Rollout

1. Deploy the backend migration, framework, adapter, admin API, and feed routes.
2. Deploy the frontend switches and public Vercel rewrite.
3. Verify the production feed while all switches remain off.
4. Enable a single representative property and validate its generated XML.
5. Send `https://estoria.estate/kinnisvara24.xml` to Kinnisvara24 for import
   setup.
6. Enable additional properties after Kinnisvara24 confirms the sample import.

## Acceptance Criteria

- Administrators can independently enable or disable Kinnisvara24 publication
  on a property.
- All portal switches are off by default.
- The feed contains only active, enabled, adapter-valid properties.
- Kinnisvara24 receives valid UTF-8 XML using its documented root, object names,
  fields, values, agent data, languages, and image structure.
- Validation problems are visible in the property editor and do not break the
  complete feed.
- Portal keys are not hard-coded in the frontend.
- A second adapter can be added without adding a property column or changing
  shared feed orchestration.
