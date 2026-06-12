# Property Portal Export Framework Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a reusable per-property portal export framework and ship Kinnisvara24 as its first XML adapter.

**Architecture:** The backend stores portal selections in a join table, maps properties into a normalized export record, and delegates validation and serialization to code-registered adapters. The frontend discovers registered adapters from an admin endpoint and renders reusable publication switches without hard-coded portal keys.

**Tech Stack:** .NET 8, ASP.NET Core, Entity Framework Core/PostgreSQL, LINQ to XML, xUnit/Testcontainers, React 18, TypeScript, TanStack Query, Radix UI, Vitest/Testing Library, Vercel rewrites.

---

## Repository Boundaries

- Backend commands run from `C:\Users\Dmitri.MARKIT\source\repos\Estoria`.
- Frontend commands run from `C:\Users\Dmitri.MARKIT\source\repos\estoria-luxury-builders`.
- Keep backend and frontend commits separate because they are independent Git repositories.
- Do not enable any property for Kinnisvara24 during migration or deployment.

## File Structure

### Backend files

- Create `src/Estoria.Domain/Entities/PropertyPortalPublication.cs`
  - Stores one property's selection for one registered portal.
- Modify `src/Estoria.Domain/Entities/Property.cs`
  - Adds the publication navigation collection.
- Create `src/Estoria.Infrastructure/Persistence/Configurations/PropertyPortalPublicationConfiguration.cs`
  - Defines keys, indexes, PostgreSQL `jsonb`, and cascade behavior.
- Modify `src/Estoria.Application/Interfaces/IAppDbContext.cs`
- Modify `src/Estoria.Infrastructure/Persistence/AppDbContext.cs`
  - Exposes the new DbSet.
- Generate `src/Estoria.Infrastructure/Migrations/*_AddPropertyPortalPublications.cs`
- Modify `src/Estoria.Infrastructure/Migrations/AppDbContextModelSnapshot.cs`
  - Generated migration artifacts.
- Create `src/Estoria.Application/PropertyExports/PropertyExportModels.cs`
  - Normalized records, document, metadata, and validation DTOs.
- Create `src/Estoria.Application/PropertyExports/IPropertyExportAdapter.cs`
  - Portal adapter contract.
- Create `src/Estoria.Application/PropertyExports/PropertyExportAdapterRegistry.cs`
  - Enforces unique stable keys and resolves adapters.
- Create `src/Estoria.Application/PropertyExports/PropertyExportRecordFactory.cs`
  - Maps loaded domain entities into normalized records.
- Create `src/Estoria.Application/PropertyExports/PropertyPortalPublicationService.cs`
  - Validates keys, synchronizes selections, and builds admin publication states.
- Create `src/Estoria.Application/PropertyExports/PropertyExportService.cs`
  - Loads enabled active properties, skips invalid records, and builds feed documents.
- Create `src/Estoria.Application/PropertyExports/Kinnisvara24/Kinnisvara24LocationMap.cs`
  - Owns Kinnisvara24 location codes and address splitting.
- Create `src/Estoria.Application/PropertyExports/Kinnisvara24/Kinnisvara24ExportAdapter.cs`
  - Validates records and serializes Kinnisvara24 XML.
- Modify `src/Estoria.Application/DependencyInjection.cs`
  - Registers the framework and adapter.
- Modify `src/Estoria.Application/DTOs/Properties/PropertyWriteDto.cs`
- Modify `src/Estoria.Application/DTOs/Properties/AdminPropertyDetailDto.cs`
- Modify `src/Estoria.Application/Services/PropertyService.cs`
  - Persists selections transactionally and returns validation state.
- Create `src/Estoria.Api/Controllers/Admin/AdminPropertyExportPortalsController.cs`
  - Returns registered portal metadata.
- Modify `src/Estoria.Api/Controllers/Public/FeedsController.cs`
  - Adds generic and friendly feed routes.
- Modify `src/Estoria.Api/Program.cs`
  - Resolves the registry during startup so duplicate keys fail immediately.
- Create backend tests:
  - `tests/Estoria.Tests/PropertyPortalPublicationModelTests.cs`
  - `tests/Estoria.Tests/PropertyExportAdapterRegistryTests.cs`
  - `tests/Estoria.Tests/Kinnisvara24LocationMapTests.cs`
  - `tests/Estoria.Tests/Kinnisvara24ExportAdapterTests.cs`
  - `tests/Estoria.Tests/PropertyExportServiceTests.cs`
  - `tests/Estoria.Tests/PropertyPortalPublicationServiceTests.cs`

### Frontend files

- Modify `src/hooks/api/useAdmin.ts`
  - Adds portal metadata/state types and query hook.
- Create `src/lib/propertyPortalPublications.ts`
  - Initializes a complete boolean map from metadata and saved state.
- Create `src/lib/propertyPortalPublications.test.ts`
- Create `src/components/admin/PropertyPortalControls.tsx`
  - Reusable switches and validation messages.
- Create `src/components/admin/PropertyPortalControls.test.tsx`
- Modify `src/pages/admin/PropertyForm.tsx`
  - Loads metadata, hydrates state, renders controls, and saves the complete map.
- Modify `vercel.json`
  - Proxies the public friendly XML URL.
- Modify `e2e/smoke-live.spec.ts`
  - Adds a read-only production feed smoke check.

## Task 1: Add Portal Publication Persistence

**Files:**
- Create: `C:\Users\Dmitri.MARKIT\source\repos\Estoria\tests\Estoria.Tests\PropertyPortalPublicationModelTests.cs`
- Create: `C:\Users\Dmitri.MARKIT\source\repos\Estoria\src\Estoria.Domain\Entities\PropertyPortalPublication.cs`
- Modify: `C:\Users\Dmitri.MARKIT\source\repos\Estoria\src\Estoria.Domain\Entities\Property.cs`
- Create: `C:\Users\Dmitri.MARKIT\source\repos\Estoria\src\Estoria.Infrastructure\Persistence\Configurations\PropertyPortalPublicationConfiguration.cs`
- Modify: `C:\Users\Dmitri.MARKIT\source\repos\Estoria\src\Estoria.Application\Interfaces\IAppDbContext.cs`
- Modify: `C:\Users\Dmitri.MARKIT\source\repos\Estoria\src\Estoria.Infrastructure\Persistence\AppDbContext.cs`
- Generate: `C:\Users\Dmitri.MARKIT\source\repos\Estoria\src\Estoria.Infrastructure\Migrations\*_AddPropertyPortalPublications.cs`
- Modify: `C:\Users\Dmitri.MARKIT\source\repos\Estoria\src\Estoria.Infrastructure\Migrations\AppDbContextModelSnapshot.cs`

- [ ] **Step 1: Write the failing EF model test**

```csharp
using Estoria.Domain.Entities;
using Estoria.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Estoria.Tests;

public sealed class PropertyPortalPublicationModelTests
{
    [Fact]
    public void Model_DefinesPublicationKeysIndexesAndJsonSettings()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseNpgsql("Host=localhost;Database=model_only;Username=test;Password=test")
            .Options;
        using var db = new AppDbContext(options);

        var entity = db.Model.FindEntityType(typeof(PropertyPortalPublication));
        Assert.NotNull(entity);
        Assert.Equal("jsonb", entity!.FindProperty(nameof(PropertyPortalPublication.SettingsJson))!.GetColumnType());

        var indexes = entity.GetIndexes().ToList();
        Assert.Contains(indexes, i =>
            i.IsUnique &&
            i.Properties.Select(p => p.Name).SequenceEqual(
                [nameof(PropertyPortalPublication.PropertyId), nameof(PropertyPortalPublication.PortalKey)]));
        Assert.Contains(indexes, i =>
            i.Properties.Select(p => p.Name).SequenceEqual(
                [nameof(PropertyPortalPublication.PortalKey), nameof(PropertyPortalPublication.IsEnabled),
                 nameof(PropertyPortalPublication.PropertyId)]));
    }
}
```

- [ ] **Step 2: Run the test and verify it fails to compile**

Run:

```powershell
dotnet test tests/Estoria.Tests/Estoria.Tests.csproj --filter PropertyPortalPublicationModelTests
```

Expected: FAIL because `PropertyPortalPublication` does not exist.

- [ ] **Step 3: Add the entity and navigation**

Create `PropertyPortalPublication.cs`:

```csharp
using Estoria.Domain.Base;

namespace Estoria.Domain.Entities;

public class PropertyPortalPublication : BaseEntity
{
    public Guid PropertyId { get; set; }
    public string PortalKey { get; set; } = string.Empty;
    public bool IsEnabled { get; set; }
    public string? SettingsJson { get; set; }

    public Property Property { get; set; } = null!;
}
```

Add to `Property`:

```csharp
public List<PropertyPortalPublication> PortalPublications { get; set; } = [];
```

- [ ] **Step 4: Configure persistence and DbSets**

Create `PropertyPortalPublicationConfiguration.cs`:

```csharp
using Estoria.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Estoria.Infrastructure.Persistence.Configurations;

public sealed class PropertyPortalPublicationConfiguration
    : IEntityTypeConfiguration<PropertyPortalPublication>
{
    public void Configure(EntityTypeBuilder<PropertyPortalPublication> builder)
    {
        builder.Property(p => p.PortalKey).IsRequired().HasMaxLength(64);
        builder.Property(p => p.IsEnabled).HasDefaultValue(false);
        builder.Property(p => p.SettingsJson).HasColumnType("jsonb");

        builder.HasIndex(p => new { p.PropertyId, p.PortalKey }).IsUnique();
        builder.HasIndex(p => new { p.PortalKey, p.IsEnabled, p.PropertyId });

        builder.HasOne(p => p.Property)
            .WithMany(p => p.PortalPublications)
            .HasForeignKey(p => p.PropertyId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
```

Add this property to both `IAppDbContext` and `AppDbContext`:

```csharp
DbSet<PropertyPortalPublication> PropertyPortalPublications { get; }
```

```csharp
public DbSet<PropertyPortalPublication> PropertyPortalPublications
    => Set<PropertyPortalPublication>();
```

- [ ] **Step 5: Run the focused model test**

Run:

```powershell
dotnet test tests/Estoria.Tests/Estoria.Tests.csproj --filter PropertyPortalPublicationModelTests
```

Expected: PASS.

- [ ] **Step 6: Generate the migration**

Run:

```powershell
dotnet ef migrations add AddPropertyPortalPublications --project src/Estoria.Infrastructure --startup-project src/Estoria.Api
```

Expected: a migration ending in `AddPropertyPortalPublications` plus updated model snapshot. Inspect the `Up` method and confirm it creates no publication data and defines both indexes.

- [ ] **Step 7: Verify the backend build**

Run:

```powershell
dotnet build Estoria.slnx
```

Expected: PASS with zero errors.

- [ ] **Step 8: Commit the persistence layer**

```powershell
git add src/Estoria.Domain/Entities/Property.cs src/Estoria.Domain/Entities/PropertyPortalPublication.cs src/Estoria.Application/Interfaces/IAppDbContext.cs src/Estoria.Infrastructure/Persistence/AppDbContext.cs src/Estoria.Infrastructure/Persistence/Configurations/PropertyPortalPublicationConfiguration.cs src/Estoria.Infrastructure/Migrations tests/Estoria.Tests/PropertyPortalPublicationModelTests.cs
git commit -m "feat: add property portal publication persistence"
```

## Task 2: Define Export Contracts and Adapter Registry

**Files:**
- Create: `C:\Users\Dmitri.MARKIT\source\repos\Estoria\tests\Estoria.Tests\PropertyExportAdapterRegistryTests.cs`
- Create: `C:\Users\Dmitri.MARKIT\source\repos\Estoria\src\Estoria.Application\PropertyExports\PropertyExportModels.cs`
- Create: `C:\Users\Dmitri.MARKIT\source\repos\Estoria\src\Estoria.Application\PropertyExports\IPropertyExportAdapter.cs`
- Create: `C:\Users\Dmitri.MARKIT\source\repos\Estoria\src\Estoria.Application\PropertyExports\PropertyExportAdapterRegistry.cs`

- [ ] **Step 1: Write registry tests**

```csharp
using Estoria.Application.PropertyExports;

namespace Estoria.Tests;

public sealed class PropertyExportAdapterRegistryTests
{
    [Fact]
    public void Registry_ResolvesAdapterCaseInsensitively()
    {
        var adapter = new StubAdapter("kinnisvara24");
        var registry = new PropertyExportAdapterRegistry([adapter]);

        Assert.Same(adapter, registry.GetRequired("KINNISVARA24"));
        Assert.Equal("kinnisvara24", registry.All.Single().Key);
    }

    [Fact]
    public void Registry_RejectsDuplicateKeys()
    {
        var ex = Assert.Throws<InvalidOperationException>(() =>
            new PropertyExportAdapterRegistry(
                [new StubAdapter("same"), new StubAdapter("SAME")]));

        Assert.Contains("same", ex.Message, StringComparison.OrdinalIgnoreCase);
    }

    private sealed class StubAdapter(string key) : IPropertyExportAdapter
    {
        public string Key => key;
        public string DisplayName => key;
        public string ContentType => "text/plain";
        public string PublicFileName => $"{key}.txt";
        public IReadOnlyList<string> Validate(PropertyExportRecord record) => [];
        public string Serialize(IReadOnlyList<PropertyExportRecord> records) => string.Empty;
    }
}
```

- [ ] **Step 2: Run the test and verify it fails**

Run:

```powershell
dotnet test tests/Estoria.Tests/Estoria.Tests.csproj --filter PropertyExportAdapterRegistryTests
```

Expected: FAIL because the export contracts do not exist.

- [ ] **Step 3: Add normalized export models**

Create `PropertyExportModels.cs`:

```csharp
using Estoria.Domain.Enums;

namespace Estoria.Application.PropertyExports;

public sealed record PropertyExportTranslation(
    string Title,
    string Description,
    string Address,
    string City,
    string? District);

public sealed record PropertyExportImage(
    Guid Id,
    string? Url,
    string? MediumUrl,
    string? LargeUrl,
    int SortOrder,
    bool IsCover,
    ImageProcessingStatus ProcessingStatus);

public sealed record PropertyExportAgent(
    Guid Id,
    IReadOnlyDictionary<Language, string> Names,
    string Email,
    string Phone,
    string? PhotoUrl);

public sealed record PropertyExportRecord(
    Guid Id,
    string Slug,
    PropertyType PropertyType,
    TransactionType TransactionType,
    PropertyStatus Status,
    decimal Price,
    string Currency,
    decimal Size,
    int? Rooms,
    int? Bedrooms,
    int? Bathrooms,
    int? Floor,
    int? TotalFloors,
    int? YearBuilt,
    string? EnergyClass,
    double? Latitude,
    double? Longitude,
    IReadOnlyDictionary<Language, PropertyExportTranslation> Translations,
    IReadOnlyList<PropertyExportImage> Images,
    PropertyExportAgent Agent,
    string CanonicalUrl,
    string? SettingsJson);

public sealed record PropertyExportDocument(string ContentType, string Body);

public sealed record PropertyExportPortalMetadata(
    string Key,
    string DisplayName,
    string FeedUrl);

public sealed record PropertyPortalPublicationState(
    bool IsEnabled,
    IReadOnlyList<string> ValidationErrors);
```

- [ ] **Step 4: Add the adapter interface and registry**

Create `IPropertyExportAdapter.cs`:

```csharp
namespace Estoria.Application.PropertyExports;

public interface IPropertyExportAdapter
{
    string Key { get; }
    string DisplayName { get; }
    string ContentType { get; }
    string PublicFileName { get; }
    IReadOnlyList<string> Validate(PropertyExportRecord record);
    string Serialize(IReadOnlyList<PropertyExportRecord> records);
}
```

Create `PropertyExportAdapterRegistry.cs`:

```csharp
namespace Estoria.Application.PropertyExports;

public sealed class PropertyExportAdapterRegistry
{
    private readonly IReadOnlyDictionary<string, IPropertyExportAdapter> _byKey;

    public PropertyExportAdapterRegistry(IEnumerable<IPropertyExportAdapter> adapters)
    {
        var list = adapters.ToList();
        var duplicate = list.GroupBy(a => a.Key, StringComparer.OrdinalIgnoreCase)
            .FirstOrDefault(g => g.Count() > 1);
        if (duplicate is not null)
            throw new InvalidOperationException(
                $"Duplicate property export adapter key '{duplicate.Key}'.");

        _byKey = list.ToDictionary(a => a.Key, StringComparer.OrdinalIgnoreCase);
        All = list.OrderBy(a => a.DisplayName, StringComparer.OrdinalIgnoreCase).ToList();
    }

    public IReadOnlyList<IPropertyExportAdapter> All { get; }

    public bool TryGet(string key, out IPropertyExportAdapter adapter)
        => _byKey.TryGetValue(key, out adapter!);

    public IPropertyExportAdapter GetRequired(string key)
        => TryGet(key, out var adapter)
            ? adapter
            : throw new KeyNotFoundException($"Property export portal '{key}' is not registered.");

    public void ValidateKeys(IEnumerable<string> keys)
    {
        var unknown = keys.FirstOrDefault(k => !_byKey.ContainsKey(k));
        if (unknown is not null)
            throw new ArgumentException($"Unknown property export portal '{unknown}'.");
    }
}
```

- [ ] **Step 5: Run the registry tests**

Run:

```powershell
dotnet test tests/Estoria.Tests/Estoria.Tests.csproj --filter PropertyExportAdapterRegistryTests
```

Expected: PASS.

- [ ] **Step 6: Commit the contracts**

```powershell
git add src/Estoria.Application/PropertyExports tests/Estoria.Tests/PropertyExportAdapterRegistryTests.cs
git commit -m "feat: add property export adapter contracts"
```

## Task 3: Implement Kinnisvara24 Location Mapping

**Files:**
- Create: `C:\Users\Dmitri.MARKIT\source\repos\Estoria\tests\Estoria.Tests\Kinnisvara24LocationMapTests.cs`
- Create: `C:\Users\Dmitri.MARKIT\source\repos\Estoria\src\Estoria.Application\PropertyExports\Kinnisvara24\Kinnisvara24LocationMap.cs`

- [ ] **Step 1: Write mapping and address tests**

```csharp
using Estoria.Application.PropertyExports.Kinnisvara24;

namespace Estoria.Tests;

public sealed class Kinnisvara24LocationMapTests
{
    [Theory]
    [InlineData("Tallinn", "Kristiine", "COUNTY_HARJUMAA", "CITY_TALLINN", "CITYPART_TALLINN_KRISTIINE")]
    [InlineData("Tallinn", "Kesklinn", "COUNTY_HARJUMAA", "CITY_TALLINN", "CITYPART_TALLINN_CENTER")]
    [InlineData("Tallinn", "Põhja-Tallinn", "COUNTY_HARJUMAA", "CITY_TALLINN", "CITYPART_TALLINN_NORTH")]
    public void Resolve_ReturnsVerifiedTallinnCodes(
        string city, string district, string county, string cityCode, string cityPart)
    {
        var result = Kinnisvara24LocationMap.Resolve(city, district);

        Assert.NotNull(result);
        Assert.Equal(county, result!.County);
        Assert.Equal(cityCode, result.City);
        Assert.Equal(cityPart, result.CityPart);
    }

    [Fact]
    public void Resolve_ReturnsNullForUnmappedCity()
        => Assert.Null(Kinnisvara24LocationMap.Resolve("Madrid", null));

    [Theory]
    [InlineData("Madara 1", "Madara", "1")]
    [InlineData("Pirita tee 26b/1", "Pirita tee", "26b/1")]
    [InlineData("Address without number", "Address without number", null)]
    public void SplitAddress_OnlySeparatesClearBuildingNumber(
        string input, string street, string? number)
    {
        var result = Kinnisvara24LocationMap.SplitAddress(input);
        Assert.Equal(street, result.Street);
        Assert.Equal(number, result.Number);
    }
}
```

- [ ] **Step 2: Run the test and verify it fails**

Run:

```powershell
dotnet test tests/Estoria.Tests/Estoria.Tests.csproj --filter Kinnisvara24LocationMapTests
```

Expected: FAIL because `Kinnisvara24LocationMap` does not exist.

- [ ] **Step 3: Implement the isolated mapping table**

```csharp
using System.Text.RegularExpressions;

namespace Estoria.Application.PropertyExports.Kinnisvara24;

public sealed record Kinnisvara24Location(string County, string City, string? CityPart);
public sealed record Kinnisvara24Address(string Street, string? Number);

public static partial class Kinnisvara24LocationMap
{
    private static readonly IReadOnlyDictionary<string, string> TallinnDistricts =
        new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
        {
            ["Haabersti"] = "CITYPART_TALLINN_HAABERSTI",
            ["Kesklinn"] = "CITYPART_TALLINN_CENTER",
            ["Kristiine"] = "CITYPART_TALLINN_KRISTIINE",
            ["Lasnamäe"] = "CITYPART_TALLINN_LASNAMAE",
            ["Mustamäe"] = "CITYPART_TALLINN_MUSTAMAE",
            ["Nõmme"] = "CITYPART_TALLINN_NOMME",
            ["Pirita"] = "CITYPART_TALLINN_PIRITA",
            ["Põhja-Tallinn"] = "CITYPART_TALLINN_NORTH",
        };

    public static Kinnisvara24Location? Resolve(string city, string? district)
    {
        if (!city.Equals("Tallinn", StringComparison.OrdinalIgnoreCase))
            return null;

        string? cityPart = null;
        if (!string.IsNullOrWhiteSpace(district))
            TallinnDistricts.TryGetValue(district.Trim(), out cityPart);

        return new Kinnisvara24Location(
            "COUNTY_HARJUMAA",
            "CITY_TALLINN",
            cityPart);
    }

    public static Kinnisvara24Address SplitAddress(string address)
    {
        var trimmed = address.Trim();
        var match = BuildingNumberRegex().Match(trimmed);
        return match.Success
            ? new Kinnisvara24Address(
                match.Groups["street"].Value.Trim(),
                match.Groups["number"].Value)
            : new Kinnisvara24Address(trimmed, null);
    }

    [GeneratedRegex(
        @"^(?<street>.+?)\s+(?<number>\d+[A-Za-z]?(?:/\d+[A-Za-z]?)?)$",
        RegexOptions.CultureInvariant)]
    private static partial Regex BuildingNumberRegex();
}
```

- [ ] **Step 4: Run the focused tests**

Run:

```powershell
dotnet test tests/Estoria.Tests/Estoria.Tests.csproj --filter Kinnisvara24LocationMapTests
```

Expected: PASS.

- [ ] **Step 5: Commit the mapping**

```powershell
git add src/Estoria.Application/PropertyExports/Kinnisvara24/Kinnisvara24LocationMap.cs tests/Estoria.Tests/Kinnisvara24LocationMapTests.cs
git commit -m "feat: map Estoria locations for Kinnisvara24"
```

## Task 4: Implement the Kinnisvara24 XML Adapter

**Files:**
- Create: `C:\Users\Dmitri.MARKIT\source\repos\Estoria\tests\Estoria.Tests\Kinnisvara24ExportAdapterTests.cs`
- Create: `C:\Users\Dmitri.MARKIT\source\repos\Estoria\src\Estoria.Application\PropertyExports\Kinnisvara24\Kinnisvara24ExportAdapter.cs`

- [ ] **Step 1: Write adapter validation and serialization tests**

Create tests with one shared valid record:

```csharp
using System.Xml.Linq;
using Estoria.Application.PropertyExports;
using Estoria.Application.PropertyExports.Kinnisvara24;
using Estoria.Domain.Enums;

namespace Estoria.Tests;

public sealed class Kinnisvara24ExportAdapterTests
{
    private readonly Kinnisvara24ExportAdapter _adapter = new();

    [Fact]
    public void Serialize_WritesDocumentMappingsLanguagesAgentAndOrderedImages()
    {
        var record = ValidRecord() with
        {
            Images =
            [
                new(Guid.NewGuid(), "legacy-2", "medium-2", "large-2", 2, false, ImageProcessingStatus.Done),
                new(Guid.NewGuid(), "legacy-cover", "medium-cover", "large-cover", 5, true, ImageProcessingStatus.Done),
                new(Guid.NewGuid(), "pending", null, null, 0, false, ImageProcessingStatus.Pending),
            ]
        };

        var xml = _adapter.Serialize([record]);
        var document = XDocument.Parse(xml);
        var listing = Assert.Single(document.Root!.Elements());

        Assert.Equal("objects", document.Root.Name.LocalName);
        Assert.Equal("apartment", listing.Name.LocalName);
        Assert.Equal(record.Id.ToString("D"), listing.Element("external_id")!.Value);
        Assert.Equal("TRANSACTION_SALE", listing.Element("transaction_type")!.Value);
        Assert.Equal("ACTIVE", listing.Element("status")!.Value);
        Assert.Equal("352000.00", listing.Element("price")!.Value);
        Assert.Equal("70.80", listing.Element("area_size")!.Value);
        Assert.Equal("CITYPART_TALLINN_KRISTIINE", listing.Element("citypart")!.Value);
        Assert.Equal("Madara", listing.Element("street")!.Value);
        Assert.Equal("1", listing.Element("no")!.Value);
        Assert.Equal("nelia@estoria.estate", listing.Element("owner_email")!.Value);
        Assert.Equal(["large-cover", "large-2"],
            listing.Element("images")!.Elements("pic_url").Select(x => x.Value));
        Assert.Equal(["et", "en", "ru"],
            listing.Elements("info").Select(x => x.Attribute("lang")!.Value));
    }

    [Fact]
    public void Serialize_EscapesXmlAndMapsOfficePurpose()
    {
        var record = ValidRecord() with
        {
            PropertyType = PropertyType.Office,
            Translations = new Dictionary<Language, PropertyExportTranslation>
            {
                [Language.Et] = new("A & B", "<p>5 < 7 & hea</p>", "Madara 1", "Tallinn", "Kristiine"),
            }
        };

        var xml = _adapter.Serialize([record]);
        var listing = XDocument.Parse(xml).Root!.Element("commercial")!;

        Assert.Equal("PURPOSE_BUREAU",
            listing.Element("purposes")!.Element("purpose")!.Value);
        Assert.Equal("<p>5 < 7 & hea</p>", listing.Element("info")!.Value);
    }

    [Fact]
    public void Validate_ReturnsActionableErrors()
    {
        var invalid = ValidRecord() with
        {
            Price = 0,
            Size = 0,
            Agent = ValidRecord().Agent with { Email = string.Empty },
            Translations = new Dictionary<Language, PropertyExportTranslation>
            {
                [Language.Et] = new("", "", "Gran Via 1", "Madrid", null),
            }
        };

        var errors = _adapter.Validate(invalid);

        Assert.Contains(errors, e => e.Contains("price", StringComparison.OrdinalIgnoreCase));
        Assert.Contains(errors, e => e.Contains("area", StringComparison.OrdinalIgnoreCase));
        Assert.Contains(errors, e => e.Contains("email", StringComparison.OrdinalIgnoreCase));
        Assert.Contains(errors, e => e.Contains("location", StringComparison.OrdinalIgnoreCase));
        Assert.Contains(errors, e => e.Contains("title", StringComparison.OrdinalIgnoreCase));
        Assert.Contains(errors, e => e.Contains("description", StringComparison.OrdinalIgnoreCase));
    }

    [Fact]
    public void Serialize_EmptyCollectionProducesValidObjectsDocument()
        => Assert.Empty(XDocument.Parse(_adapter.Serialize([])).Root!.Elements());

    private static PropertyExportRecord ValidRecord()
    {
        var translations = new Dictionary<Language, PropertyExportTranslation>
        {
            [Language.Et] = new("Uus külaliskorter", "<p>Kirjeldus</p>", "Madara 1", "Tallinn", "Kristiine"),
            [Language.En] = new("New guest apartment", "<p>Description</p>", "Madara 1", "Tallinn", "Kristiine"),
            [Language.Ru] = new("Новая квартира", "<p>Описание</p>", "Madara 1", "Tallinn", "Kristiine"),
        };
        var agent = new PropertyExportAgent(
            Guid.NewGuid(),
            new Dictionary<Language, string> { [Language.Et] = "Nelia Novare" },
            "nelia@estoria.estate",
            "+37255554722",
            "https://cdn.estoria.estate/team/nelia.jpg");

        return new PropertyExportRecord(
            Guid.Parse("bef6abb2-f2a4-4a0b-bbd4-4da988ab66e5"),
            "new-guest-apartment-for-sale-in-kristiine",
            PropertyType.Apartment,
            TransactionType.Sale,
            PropertyStatus.Active,
            352000m,
            "EUR",
            70.80m,
            3,
            2,
            1,
            2,
            4,
            2023,
            "B",
            59.42,
            24.72,
            translations,
            [],
            agent,
            "https://estoria.estate/properties/new-guest-apartment-for-sale-in-kristiine",
            null);
    }
}
```

- [ ] **Step 2: Run the tests and verify they fail**

Run:

```powershell
dotnet test tests/Estoria.Tests/Estoria.Tests.csproj --filter Kinnisvara24ExportAdapterTests
```

Expected: FAIL because the adapter does not exist.

- [ ] **Step 3: Implement adapter metadata and validation**

Create `Kinnisvara24ExportAdapter` with these public members:

```csharp
public sealed class Kinnisvara24ExportAdapter : IPropertyExportAdapter
{
    public string Key => "kinnisvara24";
    public string DisplayName => "Kinnisvara24";
    public string ContentType => "application/xml";
    public string PublicFileName => "kinnisvara24.xml";

    public IReadOnlyList<string> Validate(PropertyExportRecord record)
    {
        var errors = new List<string>();
        if (record.PropertyType is not (PropertyType.Apartment or PropertyType.House
            or PropertyType.Commercial or PropertyType.Office or PropertyType.Land))
            errors.Add("Property type is not supported by Kinnisvara24.");
        if (record.TransactionType is not (TransactionType.Sale or TransactionType.Rent))
            errors.Add("Transaction type is not supported by Kinnisvara24.");
        if (record.Price <= 0) errors.Add("A positive price is required.");
        if (record.Size <= 0) errors.Add("A positive area is required.");
        if (string.IsNullOrWhiteSpace(record.Agent.Email)
            || !System.Net.Mail.MailAddress.TryCreate(record.Agent.Email, out _))
            errors.Add("The assigned agent needs a valid email address.");

        var translations = record.Translations.Values;
        if (!translations.Any(t => !string.IsNullOrWhiteSpace(t.Title)))
            errors.Add("At least one title is required.");
        if (!translations.Any(t => !string.IsNullOrWhiteSpace(t.Description)))
            errors.Add("At least one description is required.");

        var locationTranslation = ResolveTranslation(record);
        if (locationTranslation is null
            || Kinnisvara24LocationMap.Resolve(
                locationTranslation.City, locationTranslation.District) is null)
            errors.Add("The property location is not mapped for Kinnisvara24.");

        return errors;
    }
```

Use a private translation fallback in ET, EN, then any available language.

- [ ] **Step 4: Implement XML serialization with LINQ to XML**

Implement `Serialize` and helpers so they:

- Create `XDocument(new XDeclaration("1.0", "utf-8", null), new XElement("objects", ...))`.
- Map object names, transaction values, status, invariant decimals, room fields,
  energy class, location, address, translations, coordinates, agent, office
  purpose, and ordered processed images exactly as asserted above.
- Add optional elements only when values exist.
- Select images in this order:

```csharp
record.Images
    .Where(i => i.ProcessingStatus == ImageProcessingStatus.Done)
    .OrderByDescending(i => i.IsCover)
    .ThenBy(i => i.SortOrder)
    .Select(i => i.LargeUrl ?? i.MediumUrl ?? i.Url)
    .Where(url => !string.IsNullOrWhiteSpace(url));
```

- Format decimals with `"0.00"` and coordinates with invariant culture.
- Split an agent name at the first space into `owner_firstname` and
  `owner_surname`; omit those fields when no two-part name exists.
- Return `document.ToString(SaveOptions.DisableFormatting)`.

- [ ] **Step 5: Run adapter tests**

Run:

```powershell
dotnet test tests/Estoria.Tests/Estoria.Tests.csproj --filter Kinnisvara24ExportAdapterTests
```

Expected: PASS.

- [ ] **Step 6: Commit the adapter**

```powershell
git add src/Estoria.Application/PropertyExports/Kinnisvara24/Kinnisvara24ExportAdapter.cs tests/Estoria.Tests/Kinnisvara24ExportAdapterTests.cs
git commit -m "feat: serialize Kinnisvara24 property XML"
```

## Task 5: Add Shared Record Mapping and Feed Orchestration

**Files:**
- Create: `C:\Users\Dmitri.MARKIT\source\repos\Estoria\tests\Estoria.Tests\PropertyExportServiceTests.cs`
- Create: `C:\Users\Dmitri.MARKIT\source\repos\Estoria\src\Estoria.Application\PropertyExports\PropertyExportRecordFactory.cs`
- Create: `C:\Users\Dmitri.MARKIT\source\repos\Estoria\src\Estoria.Application\PropertyExports\PropertyExportService.cs`
- Modify: `C:\Users\Dmitri.MARKIT\source\repos\Estoria\src\Estoria.Application\DependencyInjection.cs`

- [ ] **Step 1: Write feed filtering integration tests**

Use `PostgresFixture` to seed:

- one active enabled valid property,
- one active disabled property,
- one draft enabled property,
- one active enabled property invalid according to a test adapter.

The key assertion should be:

```csharp
await using var db = _fixture.CreateContext();
var registry = new PropertyExportAdapterRegistry([new TestAdapter()]);
var service = new PropertyExportService(
    db, registry, NullLogger<PropertyExportService>.Instance);

var document = await service.BuildFeedAsync("test");

Assert.NotNull(document);
Assert.Equal("text/plain", document!.ContentType);
Assert.Equal(validPropertyId.ToString("D"), document.Body);
```

Also assert:

```csharp
Assert.Null(await service.BuildFeedAsync("missing"));
```

Use this test adapter:

```csharp
private sealed class TestAdapter : IPropertyExportAdapter
{
    public string Key => "test";
    public string DisplayName => "Test";
    public string ContentType => "text/plain";
    public string PublicFileName => "test.txt";

    public IReadOnlyList<string> Validate(PropertyExportRecord record)
        => record.Slug.StartsWith("invalid-", StringComparison.Ordinal)
            ? ["invalid"]
            : [];

    public string Serialize(IReadOnlyList<PropertyExportRecord> records)
        => string.Join(",", records.Select(r => r.Id.ToString("D")));
}
```

Use one seed helper that creates a valid agent and property, then conditionally
adds a publication row:

```csharp
private static Property NewProperty(
    Guid agentId,
    string slug,
    PropertyStatus status,
    bool? enabled)
{
    var property = new Property
    {
        AgentId = agentId,
        Slug = slug,
        Status = status,
        PropertyType = PropertyType.Apartment,
        TransactionType = TransactionType.Sale,
        Price = 100000m,
        Size = 50m,
    };
    property.Translations.Add(new PropertyTranslation
    {
        PropertyId = property.Id,
        Language = Language.En,
        Title = slug,
        Description = "Description",
        Address = "Madara 1",
        City = "Tallinn",
        District = "Kristiine",
    });
    if (enabled.HasValue)
        property.PortalPublications.Add(new PropertyPortalPublication
        {
            PropertyId = property.Id,
            PortalKey = "test",
            IsEnabled = enabled.Value,
        });
    return property;
}
```

Add all four properties to one context, save once, and retain the valid
property ID for the assertion:

```csharp
var agent = new TeamMember
{
    Slug = $"agent-{Guid.NewGuid():N}",
    Email = "agent@estoria.estate",
    Phone = "+37255550000",
};
agent.Translations.Add(new TeamMemberTranslation
{
    TeamMemberId = agent.Id,
    Language = Language.En,
    Name = "Test Agent",
    Role = "Agent",
});

var valid = NewProperty(agent.Id, "valid", PropertyStatus.Active, true);
db.AddRange(
    agent,
    valid,
    NewProperty(agent.Id, "disabled", PropertyStatus.Active, false),
    NewProperty(agent.Id, "draft", PropertyStatus.Draft, true),
    NewProperty(agent.Id, "invalid-data", PropertyStatus.Active, true));
await db.SaveChangesAsync();
var validPropertyId = valid.Id;
```

- [ ] **Step 2: Run the tests and verify they fail**

Run:

```powershell
dotnet test tests/Estoria.Tests/Estoria.Tests.csproj --filter PropertyExportServiceTests
```

Expected: FAIL because the factory and service do not exist.

- [ ] **Step 3: Implement the normalized record factory**

`PropertyExportRecordFactory.FromEntity(Property property, string? settingsJson)`
must:

```csharp
return new PropertyExportRecord(
    property.Id,
    property.Slug,
    property.PropertyType,
    property.TransactionType,
    property.Status,
    property.Price,
    property.Currency,
    property.Size,
    property.Rooms,
    property.Bedrooms,
    property.Bathrooms,
    property.Floor,
    property.TotalFloors,
    property.YearBuilt,
    property.EnergyClass,
    property.Latitude,
    property.Longitude,
    property.Translations.ToDictionary(
        t => t.Language,
        t => new PropertyExportTranslation(
            t.Title, t.Description, t.Address, t.City, t.District)),
    property.Images.Select(i => new PropertyExportImage(
        i.Id, i.Url, i.MediumUrl, i.LargeUrl, i.SortOrder,
        i.IsCover, i.ProcessingStatus)).ToList(),
    new PropertyExportAgent(
        property.Agent.Id,
        property.Agent.Translations.ToDictionary(t => t.Language, t => t.Name),
        property.Agent.Email,
        property.Agent.Phone,
        property.Agent.PhotoUrl),
    $"https://estoria.estate/properties/{property.Slug}",
    settingsJson);
```

- [ ] **Step 4: Implement feed orchestration**

`BuildFeedAsync` must use one EF query:

```csharp
var properties = await _db.Properties
    .AsNoTracking()
    .Include(p => p.Translations)
    .Include(p => p.Images)
    .Include(p => p.Agent).ThenInclude(a => a.Translations)
    .Include(p => p.PortalPublications)
    .Where(p => p.Status == PropertyStatus.Active
        && p.PortalPublications.Any(x =>
            x.PortalKey == adapter.Key && x.IsEnabled))
    .OrderBy(p => p.Id)
    .ToListAsync(ct);
```

For each property, locate its matching publication row and map settings:

```csharp
var publication = property.PortalPublications.Single(p =>
    p.PortalKey.Equals(adapter.Key, StringComparison.OrdinalIgnoreCase));
var record = PropertyExportRecordFactory.FromEntity(
    property, publication.SettingsJson);
```

Call `adapter.Validate` for every record. Log invalid records with portal key,
property ID, and joined errors, then exclude them. Return:

```csharp
return new PropertyExportDocument(
    adapter.ContentType,
    adapter.Serialize(validRecords));
```

Unknown portal keys return `null`.

- [ ] **Step 5: Register framework services**

Add to `AddApplication`:

```csharp
services.AddSingleton<IPropertyExportAdapter, Kinnisvara24ExportAdapter>();
services.AddSingleton<PropertyExportAdapterRegistry>();
services.AddScoped<PropertyExportService>();
```

Add the required `using` statements for `PropertyExports` and
`PropertyExports.Kinnisvara24`.

- [ ] **Step 6: Run service tests and full backend tests**

Run:

```powershell
dotnet test tests/Estoria.Tests/Estoria.Tests.csproj --filter PropertyExportServiceTests
dotnet test Estoria.slnx
```

Expected: PASS.

- [ ] **Step 7: Commit shared orchestration**

```powershell
git add src/Estoria.Application/PropertyExports/PropertyExportRecordFactory.cs src/Estoria.Application/PropertyExports/PropertyExportService.cs src/Estoria.Application/DependencyInjection.cs tests/Estoria.Tests/PropertyExportServiceTests.cs
git commit -m "feat: orchestrate property portal feeds"
```

## Task 6: Persist Admin Selections and Return Validation State

**Files:**
- Create: `C:\Users\Dmitri.MARKIT\source\repos\Estoria\tests\Estoria.Tests\PropertyPortalPublicationServiceTests.cs`
- Create: `C:\Users\Dmitri.MARKIT\source\repos\Estoria\src\Estoria.Application\PropertyExports\PropertyPortalPublicationService.cs`
- Modify: `C:\Users\Dmitri.MARKIT\source\repos\Estoria\src\Estoria.Application\DTOs\Properties\PropertyWriteDto.cs`
- Modify: `C:\Users\Dmitri.MARKIT\source\repos\Estoria\src\Estoria.Application\DTOs\Properties\AdminPropertyDetailDto.cs`
- Modify: `C:\Users\Dmitri.MARKIT\source\repos\Estoria\src\Estoria.Application\Services\PropertyService.cs`
- Modify: `C:\Users\Dmitri.MARKIT\source\repos\Estoria\src\Estoria.Application\DependencyInjection.cs`

- [ ] **Step 1: Write selection synchronization tests**

Cover these cases with `PostgresFixture`:

```csharp
[Fact]
public async Task SyncAsync_EnablesSelectedPortalAndDisablesOmittedExistingPortal()
```

Seed an existing enabled row, call:

```csharp
await service.SyncAsync(propertyId,
    new Dictionary<string, bool> { ["other"] = true });
await db.SaveChangesAsync();
```

Assert the existing `kinnisvara24` row is false and `other` is true.

Also cover:

```csharp
[Fact]
public async Task SyncAsync_RejectsUnknownPortalKey()
```

and:

```csharp
[Fact]
public void BuildStates_ReturnsEveryRegisteredPortalAndValidationErrors()
```

Use two test adapters so both keys are registered:

```csharp
private sealed class TestAdapter(string key, IReadOnlyList<string>? errors = null)
    : IPropertyExportAdapter
{
    public string Key => key;
    public string DisplayName => key;
    public string ContentType => "text/plain";
    public string PublicFileName => $"{key}.txt";
    public IReadOnlyList<string> Validate(PropertyExportRecord record)
        => errors ?? [];
    public string Serialize(IReadOnlyList<PropertyExportRecord> records)
        => string.Empty;
}
```

Construct the service with:

```csharp
var registry = new PropertyExportAdapterRegistry(
    [new TestAdapter("kinnisvara24"), new TestAdapter("other", ["invalid"])]);
var service = new PropertyPortalPublicationService(db, registry);
```

- [ ] **Step 2: Write a real `PropertyService` create/update integration test**

In the same test file, construct `PropertyService` with the real
`AuditService`, the publication service, `NullLogger<PropertyService>.Instance`,
and a stub `ICurrentUserService`. Seed an agent, then create and update a
property through the public service methods:

```csharp
var currentUser = new StubCurrentUser();
var registry = new PropertyExportAdapterRegistry(
    [new Kinnisvara24ExportAdapter()]);
var publicationService = new PropertyPortalPublicationService(db, registry);
var audit = new AuditService(db, currentUser, new HttpContextAccessor());
var propertyService = new PropertyService(
    db,
    audit,
    currentUser,
    NullLogger<PropertyService>.Instance,
    publicationService);

var create = new CreatePropertyDto
{
    PropertyType = PropertyType.Apartment,
    TransactionType = TransactionType.Sale,
    Price = 200000m,
    Size = 60m,
    AgentId = agentId,
    Translations = new Dictionary<Language, PropertyTranslationDto>
    {
        [Language.En] = new()
        {
            Title = "Portal test apartment",
            Description = "Description",
            Address = "Madara 1",
            City = "Tallinn",
            District = "Kristiine",
        },
    },
    PortalPublications = new Dictionary<string, bool>
    {
        ["kinnisvara24"] = true,
    },
};

var propertyId = await propertyService.CreateAsync(create);
var created = await propertyService.GetByIdAdminAsync(propertyId);

Assert.True(created!.PortalPublications["kinnisvara24"].IsEnabled);

var update = new UpdatePropertyDto
{
    PropertyType = create.PropertyType,
    TransactionType = create.TransactionType,
    Price = create.Price,
    Size = create.Size,
    AgentId = create.AgentId,
    Translations = create.Translations,
    PortalPublications = new Dictionary<string, bool>
    {
        ["kinnisvara24"] = false,
    },
};

await propertyService.UpdateAsync(propertyId, update);
var updated = await propertyService.GetByIdAdminAsync(propertyId);

Assert.False(updated!.PortalPublications["kinnisvara24"].IsEnabled);
```

Add this test stub:

```csharp
private sealed class StubCurrentUser : ICurrentUserService
{
    public Guid? UserId => null;
    public string? Email => "admin@estoria.estate";
    public string[] Roles => ["Admin"];
    public bool IsAuthenticated => true;
    public bool IsInRole(UserRole role) => role == UserRole.Admin;
}
```

The test file needs `Microsoft.AspNetCore.Http`,
`Microsoft.Extensions.Logging.Abstractions`, and the application/domain
namespaces used above. This test
proves DTO binding, child-row persistence, transactional update, admin mapping,
and validation-state output work together.

- [ ] **Step 3: Run tests and verify they fail**

Run:

```powershell
dotnet test tests/Estoria.Tests/Estoria.Tests.csproj --filter PropertyPortalPublicationServiceTests
```

Expected: FAIL because the publication service is missing.

- [ ] **Step 4: Implement publication synchronization**

The service must validate incoming keys, then:

```csharp
public async Task<IReadOnlyList<string>> SyncAsync(
    Guid propertyId,
    IReadOnlyDictionary<string, bool> selections,
    CancellationToken ct = default)
{
    _registry.ValidateKeys(selections.Keys);
    var existing = await _db.PropertyPortalPublications
        .Where(p => p.PropertyId == propertyId)
        .ToListAsync(ct);
    var changed = new List<string>();

    foreach (var row in existing)
    {
        var enabled = selections.TryGetValue(row.PortalKey, out var selected) && selected;
        if (row.IsEnabled == enabled) continue;
        row.IsEnabled = enabled;
        changed.Add(row.PortalKey);
    }

    foreach (var (key, enabled) in selections)
    {
        if (existing.Any(p => p.PortalKey.Equals(key, StringComparison.OrdinalIgnoreCase)))
            continue;
        _db.PropertyPortalPublications.Add(new PropertyPortalPublication
        {
            PropertyId = propertyId,
            PortalKey = _registry.GetRequired(key).Key,
            IsEnabled = enabled,
        });
        changed.Add(key);
    }

    return changed;
}
```

`AddToNewProperty` validates keys and attaches child rows before the first save.
`BuildStates` iterates every registered adapter, treats missing rows as disabled,
maps the property through `PropertyExportRecordFactory`, and calls adapter
validation.

- [ ] **Step 5: Extend property DTOs**

Add to `CreatePropertyDto`:

```csharp
public Dictionary<string, bool> PortalPublications { get; set; }
    = new(StringComparer.OrdinalIgnoreCase);
```

Add to `AdminPropertyDetailDto`:

```csharp
public Dictionary<string, PropertyPortalPublicationState> PortalPublications { get; set; }
    = new(StringComparer.OrdinalIgnoreCase);
```

- [ ] **Step 6: Integrate selections into `PropertyService`**

Inject `PropertyPortalPublicationService`.

Use this constructor ordering so the integration test and DI agree:

```csharp
public PropertyService(
    IAppDbContext db,
    AuditService audit,
    ICurrentUserService currentUser,
    ILogger<PropertyService> logger,
    PropertyPortalPublicationService portalPublications)
{
    _db = db;
    _audit = audit;
    _currentUser = currentUser;
    _logger = logger;
    _portalPublications = portalPublications;
}
```

For admin reads, include:

```csharp
.Include(p => p.PortalPublications)
```

After mapping each admin property DTO, assign:

```csharp
dto.PortalPublications = _portalPublications.BuildStates(property);
```

During create, before adding the property:

```csharp
_portalPublications.AddToNewProperty(property, dto.PortalPublications);
```

During update, call `SyncAsync` inside the existing transaction after replacing
translations/features and before the final `SaveChangesAsync`. Include the
returned changed keys in the `Property.Update` audit details:

```csharp
IReadOnlyList<string> changedPortalKeys = [];

await _db.ExecuteInTransactionAsync(async ct2 =>
{
    await _db.SaveChangesAsync(ct2);
    await _db.PropertyTranslations.Where(t => t.PropertyId == id).ExecuteDeleteAsync(ct2);
    await _db.PropertyFeatures.Where(f => f.PropertyId == id).ExecuteDeleteAsync(ct2);

    // Re-add translations and features using the existing loops.
    changedPortalKeys = await _portalPublications.SyncAsync(
        id, dto.PortalPublications, ct2);

    await _db.SaveChangesAsync(ct2);
}, ct);
```

Then include:

```csharp
details: new
{
    property.Slug,
    property.PropertyType,
    property.TransactionType,
    property.Price,
    ChangedPortalKeys = changedPortalKeys,
}
```

- [ ] **Step 7: Register the publication service**

Add to `AddApplication`:

```csharp
services.AddScoped<PropertyPortalPublicationService>();
```

- [ ] **Step 8: Run focused and full backend tests**

Run:

```powershell
dotnet test tests/Estoria.Tests/Estoria.Tests.csproj --filter PropertyPortalPublicationServiceTests
dotnet test Estoria.slnx
```

Expected: PASS.

- [ ] **Step 9: Commit admin persistence**

```powershell
git add src/Estoria.Application/PropertyExports/PropertyPortalPublicationService.cs src/Estoria.Application/DTOs/Properties/PropertyWriteDto.cs src/Estoria.Application/DTOs/Properties/AdminPropertyDetailDto.cs src/Estoria.Application/Services/PropertyService.cs src/Estoria.Application/DependencyInjection.cs tests/Estoria.Tests/PropertyPortalPublicationServiceTests.cs
git commit -m "feat: manage per-property portal publication"
```

## Task 7: Expose Portal Metadata and Public Feed Routes

**Files:**
- Create: `C:\Users\Dmitri.MARKIT\source\repos\Estoria\tests\Estoria.Tests\PropertyFeedRouteTests.cs`
- Modify: `C:\Users\Dmitri.MARKIT\source\repos\Estoria\tests\Estoria.Tests\Estoria.Tests.csproj`
- Create: `C:\Users\Dmitri.MARKIT\source\repos\Estoria\src\Estoria.Api\Controllers\Admin\AdminPropertyExportPortalsController.cs`
- Modify: `C:\Users\Dmitri.MARKIT\source\repos\Estoria\src\Estoria.Api\Controllers\Public\FeedsController.cs`
- Modify: `C:\Users\Dmitri.MARKIT\source\repos\Estoria\src\Estoria.Api\Program.cs`

- [ ] **Step 1: Add failing route and authorization tests**

Add an API project reference to the test project:

```xml
<ProjectReference Include="..\..\src\Estoria.Api\Estoria.Api.csproj" />
```

Create:

```csharp
using System.Reflection;
using Estoria.Api.Controllers.Admin;
using Estoria.Api.Controllers.Public;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Estoria.Tests;

public sealed class PropertyFeedRouteTests
{
    [Theory]
    [InlineData(nameof(FeedsController.PropertyFeed), "property-feeds/{portalKey}")]
    [InlineData(nameof(FeedsController.Kinnisvara24), "kinnisvara24.xml")]
    public void FeedsController_ExposesExpectedRoutes(string methodName, string template)
    {
        var method = typeof(FeedsController).GetMethod(methodName);
        Assert.NotNull(method);
        Assert.Equal(template, method!.GetCustomAttribute<HttpGetAttribute>()!.Template);
    }

    [Fact]
    public void PortalMetadataController_IsRestrictedToAdmins()
    {
        var authorize = typeof(AdminPropertyExportPortalsController)
            .GetCustomAttribute<AuthorizeAttribute>();
        Assert.NotNull(authorize);
        Assert.Equal("Admin", authorize!.Roles);
    }
}
```

- [ ] **Step 2: Run the route tests and verify they fail**

Run:

```powershell
dotnet test tests/Estoria.Tests/Estoria.Tests.csproj --filter PropertyFeedRouteTests
```

Expected: FAIL because the controller/actions do not exist.

- [ ] **Step 3: Add the authorized metadata endpoint**

```csharp
using Estoria.Application.PropertyExports;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Estoria.Api.Controllers.Admin;

[ApiController]
[Route("api/admin/property-export-portals")]
[Authorize(Roles = "Admin")]
public sealed class AdminPropertyExportPortalsController : ControllerBase
{
    private const string PublicBaseUrl = "https://estoria.estate";
    private readonly PropertyExportAdapterRegistry _registry;

    public AdminPropertyExportPortalsController(PropertyExportAdapterRegistry registry)
        => _registry = registry;

    [HttpGet]
    public IActionResult GetAll()
        => Ok(_registry.All.Select(a => new PropertyExportPortalMetadata(
            a.Key,
            a.DisplayName,
            $"{PublicBaseUrl}/{a.PublicFileName}")));
}
```

- [ ] **Step 4: Add generic and friendly feed actions**

Inject `PropertyExportService` into `FeedsController`, then add:

```csharp
[HttpGet("property-feeds/{portalKey}")]
[ResponseCache(Duration = 300, Location = ResponseCacheLocation.Any)]
public async Task<IActionResult> PropertyFeed(
    string portalKey, CancellationToken ct = default)
{
    var document = await _propertyExports.BuildFeedAsync(portalKey, ct);
    return document is null
        ? NotFound()
        : Content(document.Body, document.ContentType, Encoding.UTF8);
}

[HttpGet("kinnisvara24.xml")]
[ResponseCache(Duration = 300, Location = ResponseCacheLocation.Any)]
public Task<IActionResult> Kinnisvara24(CancellationToken ct = default)
    => PropertyFeed("kinnisvara24", ct);
```

Preserve the existing sitemap action unchanged.

- [ ] **Step 5: Force duplicate-key validation during startup**

Immediately after `var app = builder.Build();` in `Program.cs`, add:

```csharp
_ = app.Services.GetRequiredService<
    Estoria.Application.PropertyExports.PropertyExportAdapterRegistry>();
```

- [ ] **Step 6: Run route tests, build, and full backend tests**

Run:

```powershell
dotnet test tests/Estoria.Tests/Estoria.Tests.csproj --filter PropertyFeedRouteTests
dotnet build Estoria.slnx
dotnet test Estoria.slnx
```

Expected: PASS.

- [ ] **Step 7: Run the API locally and inspect the empty feed**

Run:

```powershell
dotnet run --project src/Estoria.Api
```

In another terminal:

```powershell
curl.exe -i http://localhost:5000/kinnisvara24.xml
```

Use the actual launch URL printed by ASP.NET if it differs. Expected: HTTP 200,
XML content type, and an `<objects>` root with no listings because all switches
default off.

- [ ] **Step 8: Commit API routes**

```powershell
git add src/Estoria.Api/Controllers/Admin/AdminPropertyExportPortalsController.cs src/Estoria.Api/Controllers/Public/FeedsController.cs src/Estoria.Api/Program.cs tests/Estoria.Tests/Estoria.Tests.csproj tests/Estoria.Tests/PropertyFeedRouteTests.cs
git commit -m "feat: expose property portal feeds"
```

## Task 8: Add Frontend Portal Discovery and Reusable Controls

**Files:**
- Modify: `C:\Users\Dmitri.MARKIT\source\repos\estoria-luxury-builders\src\hooks\api\useAdmin.ts`
- Create: `C:\Users\Dmitri.MARKIT\source\repos\estoria-luxury-builders\src\lib\propertyPortalPublications.ts`
- Create: `C:\Users\Dmitri.MARKIT\source\repos\estoria-luxury-builders\src\lib\propertyPortalPublications.test.ts`
- Create: `C:\Users\Dmitri.MARKIT\source\repos\estoria-luxury-builders\src\components\admin\PropertyPortalControls.tsx`
- Create: `C:\Users\Dmitri.MARKIT\source\repos\estoria-luxury-builders\src\components\admin\PropertyPortalControls.test.tsx`

- [ ] **Step 1: Write boolean-map tests**

```typescript
import { describe, expect, it } from 'vitest';
import { initializePortalPublications } from '@/lib/propertyPortalPublications';

const portals = [
  { key: 'kinnisvara24', displayName: 'Kinnisvara24', feedUrl: '/kinnisvara24.xml' },
  { key: 'second', displayName: 'Second', feedUrl: '/second.xml' },
];

describe('initializePortalPublications', () => {
  it('defaults every registered portal to off', () => {
    expect(initializePortalPublications(portals)).toEqual({
      kinnisvara24: false,
      second: false,
    });
  });

  it('hydrates saved state but still returns a complete map', () => {
    expect(initializePortalPublications(portals, {
      kinnisvara24: { isEnabled: true, validationErrors: [] },
    })).toEqual({
      kinnisvara24: true,
      second: false,
    });
  });
});
```

- [ ] **Step 2: Write controls component tests**

```tsx
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import PropertyPortalControls from '@/components/admin/PropertyPortalControls';

describe('PropertyPortalControls', () => {
  it('renders discovered portals and reports switch changes', () => {
    const onChange = vi.fn();
    render(
      <PropertyPortalControls
        portals={[{ key: 'kinnisvara24', displayName: 'Kinnisvara24', feedUrl: '/kinnisvara24.xml' }]}
        values={{ kinnisvara24: false }}
        states={{}}
        onChange={onChange}
      />,
    );

    fireEvent.click(screen.getByRole('switch', { name: 'Publish to Kinnisvara24' }));
    expect(onChange).toHaveBeenCalledWith('kinnisvara24', true);
  });

  it('shows adapter validation errors beside the portal', () => {
    render(
      <PropertyPortalControls
        portals={[{ key: 'kinnisvara24', displayName: 'Kinnisvara24', feedUrl: '/kinnisvara24.xml' }]}
        values={{ kinnisvara24: true }}
        states={{
          kinnisvara24: {
            isEnabled: true,
            validationErrors: ['The property location is not mapped for Kinnisvara24.'],
          },
        }}
        onChange={vi.fn()}
      />,
    );

    expect(screen.getByText(/location is not mapped/i)).toBeVisible();
  });
});
```

- [ ] **Step 3: Run tests and verify they fail**

Run:

```powershell
npm test -- src/lib/propertyPortalPublications.test.ts src/components/admin/PropertyPortalControls.test.tsx
```

Expected: FAIL because the helper and component do not exist.

- [ ] **Step 4: Add API types and query hook**

Add to `useAdmin.ts`:

```typescript
export interface PropertyExportPortal {
  key: string;
  displayName: string;
  feedUrl: string;
}

export interface PropertyPortalPublicationState {
  isEnabled: boolean;
  validationErrors: string[];
}
```

Add to `AdminProperty`:

```typescript
portalPublications: Record<string, PropertyPortalPublicationState>;
```

Add the hook:

```typescript
export function usePropertyExportPortals() {
  return useQuery({
    queryKey: ['admin', 'property-export-portals'],
    queryFn: () =>
      api.get<PropertyExportPortal[]>('/admin/property-export-portals')
        .then(r => r.data),
    staleTime: 5 * 60_000,
  });
}
```

- [ ] **Step 5: Implement the complete-map helper**

```typescript
import type {
  PropertyExportPortal,
  PropertyPortalPublicationState,
} from '@/hooks/api/useAdmin';

export function initializePortalPublications(
  portals: PropertyExportPortal[],
  saved: Record<string, PropertyPortalPublicationState> = {},
): Record<string, boolean> {
  return Object.fromEntries(
    portals.map(portal => [portal.key, saved[portal.key]?.isEnabled ?? false]),
  );
}
```

- [ ] **Step 6: Implement reusable portal controls**

The component must render each metadata item using:

```tsx
<Switch
  id={`portal-${portal.key}`}
  aria-label={`Publish to ${portal.displayName}`}
  checked={values[portal.key] ?? false}
  onCheckedChange={(checked) => onChange(portal.key, checked)}
/>
```

Display:

```tsx
<Label htmlFor={`portal-${portal.key}`}>
  Publish to {portal.displayName}
</Label>
```

and render every `states[portal.key]?.validationErrors` entry in an amber
message list. Include the help text: “Only active properties with valid portal
data are included in the feed.”

- [ ] **Step 7: Run focused frontend tests**

Run:

```powershell
npm test -- src/lib/propertyPortalPublications.test.ts src/components/admin/PropertyPortalControls.test.tsx
```

Expected: PASS.

- [ ] **Step 8: Commit reusable frontend support**

```powershell
git add src/hooks/api/useAdmin.ts src/lib/propertyPortalPublications.ts src/lib/propertyPortalPublications.test.ts src/components/admin/PropertyPortalControls.tsx src/components/admin/PropertyPortalControls.test.tsx
git commit -m "feat: add reusable property portal controls"
```

## Task 9: Integrate Portal Controls and Public Rewrite

**Files:**
- Modify: `C:\Users\Dmitri.MARKIT\source\repos\estoria-luxury-builders\src\pages\admin\PropertyForm.tsx`
- Modify: `C:\Users\Dmitri.MARKIT\source\repos\estoria-luxury-builders\vercel.json`
- Modify: `C:\Users\Dmitri.MARKIT\source\repos\estoria-luxury-builders\e2e\smoke-live.spec.ts`

- [ ] **Step 1: Load and initialize portal state in `PropertyForm`**

Import:

```typescript
import PropertyPortalControls from '@/components/admin/PropertyPortalControls';
import { initializePortalPublications } from '@/lib/propertyPortalPublications';
import { usePropertyExportPortals } from '@/hooks/api/useAdmin';
```

Load metadata:

```typescript
const { data: exportPortals = [] } = usePropertyExportPortals();
const [portalPublications, setPortalPublications] =
  useState<Record<string, boolean>>({});
```

Hydrate only from metadata and the loaded property:

```typescript
useEffect(() => {
  if (exportPortals.length === 0) return;
  setPortalPublications(
    initializePortalPublications(
      exportPortals,
      existing?.portalPublications,
    ),
  );
}, [exportPortals, existing?.portalPublications]);
```

- [ ] **Step 2: Render dynamic controls in Visibility & agent**

After the featured switch, add:

```tsx
<PropertyPortalControls
  portals={exportPortals}
  values={portalPublications}
  states={existing?.portalPublications ?? {}}
  onChange={(key, enabled) =>
    setPortalPublications(current => ({ ...current, [key]: enabled }))
  }
/>
```

- [ ] **Step 3: Add the complete map to create/update payloads**

Inside the existing `dto` object add:

```typescript
portalPublications,
```

Do not clear selections when saving as draft. Draft status itself prevents feed
inclusion.

- [ ] **Step 4: Add the Vercel feed rewrite**

Place this rewrite before the SPA catch-all:

```json
{ "source": "/kinnisvara24.xml", "destination": "https://api.estoria.estate/kinnisvara24.xml" }
```

- [ ] **Step 5: Add the read-only production smoke test**

```typescript
test('Kinnisvara24 feed is served as valid XML', async ({ request }) => {
  const res = await request.get(`${BASE}/kinnisvara24.xml`);
  expect(res.status()).toBe(200);
  expect(res.headers()['content-type']).toContain('xml');
  const body = await res.text();
  expect(body).toContain('<objects');
  expect(body).toContain('</objects>');
});
```

- [ ] **Step 6: Run frontend tests, lint, and build**

Run:

```powershell
npm test
npm run lint
npm run build
```

Expected: all tests pass, ESLint exits zero, and Vite completes a production build.

- [ ] **Step 7: Inspect the local admin form**

Run the local backend and frontend, open the property editor, and verify:

- Kinnisvara24 appears under **Visibility & agent**.
- It is off for existing properties without a publication row.
- Enabling and saving persists after reload.
- A mapped Tallinn property shows no location error.
- An unmapped city shows the adapter validation error without crashing the form.
- Saving as draft leaves the switch enabled but the property absent from feed.

- [ ] **Step 8: Commit the frontend integration**

```powershell
git add src/pages/admin/PropertyForm.tsx vercel.json e2e/smoke-live.spec.ts
git commit -m "feat: integrate Kinnisvara24 publication controls"
```

## Task 10: Final Cross-Repository Verification

**Files:**
- Verify only; do not change unrelated files.

- [ ] **Step 1: Run all backend checks**

From the backend:

```powershell
dotnet build Estoria.slnx
dotnet test Estoria.slnx
git status --short
```

Expected: build and tests pass; status contains no uncommitted feature files.

- [ ] **Step 2: Run all frontend checks**

From the frontend:

```powershell
npm test
npm run lint
npm run build
git status --short
```

Expected: tests, lint, and build pass; status contains no uncommitted feature
files other than this plan if it has not yet been committed.

- [ ] **Step 3: Verify generated XML against acceptance criteria**

Enable exactly one valid Tallinn property in the local database and request:

```powershell
curl.exe -s http://localhost:5000/kinnisvara24.xml
```

Use the actual launch URL if different. Parse the output:

```powershell
[xml]$feed = curl.exe -s http://localhost:5000/kinnisvara24.xml
$feed.objects.ChildNodes.Count
```

Expected: count is `1`; the listing contains the selected property's stable
GUID, transaction, price, area, translated info, agent email, canonical URL,
and ordered image URLs.

- [ ] **Step 4: Verify exclusion behavior**

Confirm the feed omits:

- an active property whose switch is off,
- an enabled draft property,
- an enabled property with an unmapped city,
- an enabled property with an invalid agent email.

The endpoint must remain HTTP 200 with valid XML in every case.

- [ ] **Step 5: Review both diffs**

Run in each repository:

```powershell
git log --oneline -10
git diff HEAD~1 --check
```

Then review the complete feature range from the first feature commit to HEAD.
Confirm there are no unrelated reversions, secrets, enabled production
publications, or generated build artifacts.

- [ ] **Step 6: Push both repositories only after checks pass**

```powershell
git push
```

Expected: both current branches push successfully. After deployment, verify
`https://estoria.estate/kinnisvara24.xml` returns HTTP 200 and a valid
`<objects>` document before enabling a production listing.
