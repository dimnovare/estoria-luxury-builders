# Property Portal Export Framework Handoff

Date: 2026-06-13

This is the continuation point for adding reusable property portal exports to
Estoria, with Kinnisvara24 as the first adapter.

## Read First

- Design:
  `docs/superpowers/specs/2026-06-12-property-portal-export-framework-design.md`
- Detailed implementation plan:
  `docs/superpowers/plans/2026-06-12-property-portal-export-framework.md`
- Kinnisvara24 XML documentation:
  https://kinnisvara24.ee/docs/import/xml

The design and plan are committed in the frontend repository:

- `3ce3a09 docs: design property portal export framework`
- `cfc7a67 docs: plan property portal export framework`

## Repository and Branch State

Frontend repository:

```text
C:\Users\Dmitri.MARKIT\source\repos\estoria-luxury-builders
branch: main
HEAD: cfc7a67
```

Frontend feature worktree:

```text
C:\Users\Dmitri.MARKIT\.config\superpowers\worktrees\estoria-luxury-builders\property-portal-export
branch: codex/property-portal-export
HEAD: cfc7a67
working tree: clean at handoff
```

Backend repository:

```text
C:\Users\Dmitri.MARKIT\source\repos\Estoria
branch: master
HEAD: 100d484
```

Backend feature worktree containing the implementation:

```text
C:\Users\Dmitri.MARKIT\.config\superpowers\worktrees\Estoria\property-portal-export
branch: codex/property-portal-export
HEAD: 5864da9
```

Do not continue from the backend repository's `master` checkout unless commit
`5864da9` is first cherry-picked. The feature worktree already has the correct
state.

Nothing has been pushed or deployed.

## Completed: Task 1 Persistence

Backend commit:

```text
5864da9 feat: add property portal publication persistence
```

Implemented:

- `PropertyPortalPublication` entity
- Collection navigation on `Property`
- EF configuration
- `AppDbContext` and `IAppDbContext` DbSets
- PostgreSQL migration, designer, and model snapshot
- EF model metadata test

Database behavior:

- Unique index on `(PropertyId, PortalKey)`
- Feed lookup index on `(PortalKey, IsEnabled, PropertyId)`
- `PortalKey` required, maximum 64 characters
- `IsEnabled` defaults to `false`
- `SettingsJson` is nullable `jsonb`
- Property deletion cascades to publication rows

Verification completed:

- Focused model test passed
- Full backend suite passed: 3/3 tests
- Backend build passed with zero errors and warnings
- EF reported no pending model changes
- Independent spec review passed
- Independent code-quality review passed

Residual non-blocking test gap: the model test does not perform a real
PostgreSQL insert/load or cascade-delete round trip.

## Interrupted: Task 2 Contracts and Registry

There is one untracked file in the backend feature worktree:

```text
tests/Estoria.Tests/PropertyExportAdapterRegistryTests.cs
```

It contains six tests for:

- Case-insensitive `TryGet` and `GetRequired`
- Case-insensitive duplicate rejection
- Sorting `All` by adapter key
- `KeyNotFoundException` for an unknown required key
- Case-insensitive `ValidateKeys`
- `ArgumentException` for unknown keys

No production files were created. The focused test command was interrupted, so
there is no recorded red-test output. Full tests and build were not run for
Task 2.

Continue Task 2 with strict TDD:

1. Run the focused tests and confirm they fail because the contracts do not
   exist.
2. Create:
   - `src/Estoria.Application/PropertyExports/PropertyExportModels.cs`
   - `src/Estoria.Application/PropertyExports/IPropertyExportAdapter.cs`
   - `src/Estoria.Application/PropertyExports/PropertyExportAdapterRegistry.cs`
3. Make the focused tests pass.
4. Run the full backend tests and build.
5. Commit as:
   `feat: add property export adapter contracts`

The latest intended Task 2 API, reflected by the interrupted tests, is:

- Duplicate keys throw `ArgumentException`.
- `All` is sorted case-insensitively by adapter `Key`.
- Adapter `Serialize` accepts
  `IReadOnlyCollection<PropertyExportRecord>`.

These details supersede older snippets in the long plan that show
`InvalidOperationException`, sorting by display name, or `IReadOnlyList`.

Shared models still needed:

- `PropertyExportTranslation`
- `PropertyExportImage`
- `PropertyExportAgent`
- `PropertyExportRecord`
- `PropertyExportDocument`
- `PropertyExportPortalMetadata`
- `PropertyPortalPublicationState`

Adapter interface properties/methods:

- `Key`
- `DisplayName`
- `ContentType`
- `PublicFileName`
- `Validate(PropertyExportRecord)`
- `Serialize(IReadOnlyCollection<PropertyExportRecord>)`

## Remaining Implementation Order

### Task 3: Kinnisvara24 Location Mapping

Add an isolated mapping class and tests.

Initial verified scope is Tallinn only:

- Haabersti
- Kesklinn
- Kristiine
- Lasnamae
- Mustamae
- Nomme
- Pirita
- Pohja-Tallinn

Use the exact accented Estonian district names and Kinnisvara24 codes from the
plan. Do not invent a code for Viimsi. Unmapped locations must fail adapter
validation and be omitted from the feed.

Also implement conservative address splitting:

- `Madara 1` -> street `Madara`, number `1`
- `Pirita tee 26b/1` -> street `Pirita tee`, number `26b/1`
- Text without a clear final building number remains entirely in `street`

Commit:
`feat: map Estoria locations for Kinnisvara24`

### Task 4: Kinnisvara24 XML Adapter

Implement validation and XML serialization using LINQ to XML.

Important confirmed format:

- Root element: `<objects>`
- Listing element depends on type, such as `apartment`, `house`, `commercial`,
  or `land`
- `external_id` is required and unique
- Sale: `TRANSACTION_SALE`
- Rent: `TRANSACTION_GIVE_RENT`
- Agent email is required
- Include translated `info` elements, canonical URL, location codes, address,
  price, size, rooms/floors/year/energy fields when available, coordinates,
  and ordered processed image URLs
- Prefer cover image, then sort order
- Prefer large URL, then medium URL, then original URL
- Use invariant numeric formatting
- Validation errors skip one listing rather than break the complete feed

Commit:
`feat: add Kinnisvara24 XML export adapter`

### Task 5: Feed Orchestration

Add the normalized entity-to-export mapping, adapter registry integration,
feed service, logging for skipped invalid listings, and dependency injection.

Only export properties that are:

- `PropertyStatus.Active`
- Explicitly enabled for the requested portal
- Valid for that adapter

All portal switches default off.

### Task 6: Admin Publication State

Extend property write/admin DTOs and `PropertyService`:

- Save a complete portal-key boolean map transactionally
- Return enabled state plus current adapter validation errors
- Reject unknown portal keys
- Preserve the generic join-table design; do not add portal-specific columns
  to `Property`

### Task 7: API Routes

Add:

- Admin endpoint returning registered portal metadata
- Generic public feed:
  `/property-feeds/{portalKey}`
- Friendly first-portal feed:
  `/kinnisvara24.xml`

The first version's feed is public and unauthenticated. Resolve the registry at
startup so duplicate adapter keys fail fast.

### Task 8: Frontend Portal Controls

Add:

- Portal metadata query/types in `src/hooks/api/useAdmin.ts`
- Boolean-state initializer in
  `src/lib/propertyPortalPublications.ts`
- Reusable `PropertyPortalControls` component
- Unit/component tests

The UI must discover registered portals dynamically. Do not hardcode a single
Kinnisvara24 checkbox into the form.

### Task 9: Property Form and Vercel Rewrite

Integrate the reusable portal controls into `PropertyForm`, submit the complete
map, and proxy `/kinnisvara24.xml` to the backend feed in `vercel.json`.

Add a read-only live smoke check, but keep the portal toggle off by default.

### Task 10: Final Verification and Delivery

Run:

- Focused tests for every task
- Full backend tests and build
- Frontend tests, typecheck/lint, and production build
- Feed route tests
- Browser/admin form verification
- Final diff review

Then push both feature branches. Do not enable listings or deploy a feed
without confirming the environment and migration rollout.

## Design Decisions to Preserve

- This is a reusable framework for future portals, not a one-off
  Kinnisvara24 implementation.
- Portal adapters are code implementations keyed by strings.
- Per-property selection lives in `PropertyPortalPublication`.
- Portal-specific optional settings live in nullable `SettingsJson`.
- Frontend portal controls are metadata-driven.
- Invalid listings are omitted and logged individually.
- A bad listing must not make the complete XML feed fail.
- Viimsi is intentionally unmapped in the initial adapter.
- All publication selections default to disabled.

## Immediate Resume Commands

```powershell
cd C:\Users\Dmitri.MARKIT\.config\superpowers\worktrees\Estoria\property-portal-export
git status --short
dotnet test tests/Estoria.Tests/Estoria.Tests.csproj --filter PropertyExportAdapterRegistryTests
```

The expected first result is a compile failure because
`Estoria.Application.PropertyExports` has not yet been implemented.
