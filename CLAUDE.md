# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project status

Kora Health is in an **early implementation phase**. Both apps are scaffolded and one pilot module is implemented end to end; everything else exists only as specs.

- **Implemented**: `water-tracking` (backend endpoints + Flutter screens), verified manually against the real backend.
- **No real authentication yet**: the backend attributes every request to a single seeded user (`FixedTestUser`, id `1`, username `dev-test-user`). The client sends no credentials.
- **No offline cache yet**: the Drift database is configured with zero tables and runs in memory; the client calls the API directly. Local tables arrive with the `sync` implementation.
- **Spec-only**: `health`, `healthkit-integration`, `nutrition-log`, `nutrition-goals`, `recipes`, `workouts`, `progress`, `ai-assistant`, `sync`, `profile`.
- **No automated tests**: the client has only the default `test/widget_test.dart`; the backend has no test project.

`README.md` has the full setup walkthrough (Neon connection, per-device Flutter run commands). It still names the `.csproj` files without the `Api.` infix and describes a Windows Flutter install — trust the paths in this file over the README where they differ.

## Repository layout

```
openspec/              # Specs (source of truth) and changes
kora-health-api/       # ASP.NET Core backend (net10.0), solution: KoraHealth.Api.slnx
kora-health-client/    # Flutter client
```

## Commands

### Backend (`kora-health-api`)

The connection string is never committed. It lives in `dotnet user-secrets` under `ConnectionStrings:DefaultConnection` and points to a PostgreSQL instance on Neon (see README for the format).

```bash
# Run the API (http://localhost:5001, opens Scalar UI at /scalar/v1)
cd kora-health-api/src/Application && dotnet run

# Build the whole solution
cd kora-health-api && dotnet build KoraHealth.Api.slnx

# Add a migration
cd kora-health-api && dotnet ef migrations add <Name> \
  --project src/Infrastructure/KoraHealth.Api.Infrastructure.csproj \
  --startup-project src/Application/KoraHealth.Api.Application.csproj \
  --output-dir EntityFramework/Migrations
```

On startup `Program.cs` applies pending migrations automatically and seeds the fixed test user, so `dotnet ef database update` is rarely needed by hand.

### Client (`kora-health-client`)

```bash
cd kora-health-client
flutter pub get
flutter run -d chrome --dart-define=API_BASE_URL=http://localhost:5001
flutter analyze
flutter test
dart run build_runner build --delete-conflicting-outputs   # regenerate Drift code (*.g.dart)
```

`API_BASE_URL` is a compile-time define read in `lib/core/env.dart` (default `http://localhost:5001`). The Android emulator needs `http://10.0.2.2:5001` instead of `localhost`.

### OpenSpec

```bash
openspec list                     # active changes and task progress
openspec validate --all --strict  # validate every spec and change
```

## Working with OpenSpec

This project uses the [OpenSpec](https://openspec.dev) spec-driven workflow (`schema: spec-driven` in `openspec/config.yaml`). Specs are the source of truth for what should be built.

- `openspec/specs/<capability>/spec.md` — the 11 approved capabilities (current, authoritative state).
- `openspec/changes/<slug>/` — changes in flight, each with `proposal.md`, `design.md`, `tasks.md` and a `specs/` delta.
- `openspec/changes/archive/<date>-<slug>/` — completed changes: `define-initial-specs`, `refine-sync-spec`, `scaffold-and-water-tracking-pilot`.
- `openspec/specs/initial/ARQUITECTURA.md` and `FUNCIONALIDADES.md` — the original unstructured notes the first change was based on. Their content is now covered by the formal specs; removing this folder was deliberately deferred by the user and is still pending.

When asked to build a feature, start a new OpenSpec change (proposal + tasks + spec deltas) before writing implementation code, following the structure of the archived changes. Validate with `openspec validate` before archiving. The `/opsx:*` commands and `openspec-*` skills in `.claude/` drive this workflow.

### Active changes (proposed, not started)

- `add-auth` (0/16 tasks) — introduces the `auth` capability: self-registration and login with email + password, JWT issued by the backend, hashed passwords. Replaces the fixed test user.
- `update-profile` (0/12 tasks) — pins down the personal-data fields in `profile`, adds weight updates from HealthKit via `health` (latest measurement wins), and requires connectivity to edit the profile.

Known issues to fix before applying or archiving them:

- `update-profile`'s delta modifies `### Requirement: Personal Data Management`, but the main spec's header is now `Gestión de Datos Personales`, so archiving would be refused. The delta header must match the Spanish name.
- Both deltas use English `#### Scenario:` / `WHEN` / `THEN` instead of the Spanish convention below.
- There is no `openspec/specs/auth/spec.md`. The interim "fixed development user" `auth` delta exists only inside the archived scaffold change, although `FixedTestUser.cs` and the README refer to it as if it were a main spec.

### Spec language: Spanish, with English structural keywords

All spec prose (Purpose, requirement/scenario names, requirement bodies, scenario steps) is written in **Spanish** — this applies to new specs and changes too. However, the OpenSpec CLI parser hard-requires certain markers to stay in **English** or validation breaks:

- Section headers: `## Purpose`, `## Requirements` (and, for changes, `## Why` / `## What Changes`) — matched case-insensitively but must be these literal English words.
- `### Requirement: <name>` — the `Requirement:` prefix is literal (case-insensitive); `<name>` itself can be Spanish.
- The literal word `SHALL` or `MUST` (word-boundary match) somewhere in every requirement's body — `openspec validate --strict` fails otherwise. Embed it directly in the Spanish sentence, RFC-2119 style: `El sistema SHALL permitir...`.

Everything else is free-form and unvalidated: `#### Escenario: <name>` (any level-4 heading under a requirement counts as a scenario, the word "Scenario"/"Escenario" itself isn't checked), and the `- **CUANDO** ... / - **ENTONCES** ...` bullet style used for scenario steps (translated from WHEN/THEN, purely a formatting convention).

### The 11 capabilities and their dependencies

- `sync` and `profile` are foundational — most other capabilities depend on them (local/remote storage strategy, user config). `auth` will join them once `add-auth` lands.
- `health` depends on `healthkit-integration` (HealthKit is reachable only from the Flutter client; the backend never talks to HealthKit directly — data flows HealthKit → Flutter → API → PostgreSQL).
- `nutrition-log` and `nutrition-goals` are split: `nutrition-log` is the food/meal diary and photo/AI recognition; `nutrition-goals` is the calorie/macro targets and the daily nutrition score. `profile` also holds calorie/macro configuration — don't duplicate that config in `nutrition-goals`.
- `water-tracking` and `recipes` are intentionally separate specs, not folded into `nutrition-log`.
- `workouts` is the training log (routines, exercises, sets/reps/weight, PRs) — modeled after Hevy.
- `progress` aggregates `health`, `nutrition-log`, `nutrition-goals`, and `workouts` data (trends, comparisons, AI-generated summaries) — it should not redefine their underlying data.
- `ai-assistant` is the cross-cutting AI capability (food image recognition, quantity estimation, score explanations, recommendations, summaries, Q&A over user data). The AI provider is consumed **from the backend**, not directly from Flutter. Planned provider: Gemini 2.5 Flash (implementation-level detail still pending its own change).

## Architecture

```
Flutter (Dart) --HTTP REST--> ASP.NET Core Web API --> PostgreSQL on Neon (Entity Framework Core + Npgsql)
```

### Backend

Four projects under `kora-health-api/src/`. Folder names are short, project files carry the `KoraHealth.Api.` prefix, and C# namespaces omit `Api` (`KoraHealth.Application`, `KoraHealth.Domain`, `KoraHealth.Infrastructure`).

- **Domain** — no dependencies. `Entities/` (EF-mapped, `*Entity`, derive from `BaseEntity`), `Models/` (domain models used by services, derive from `BaseModel`), `Contracts/` (repository and service interfaces).
- **Infrastructure** — `EntityFramework/` (`KoraHealthDbContext`, migrations, snake_case naming via `EFCore.NamingConventions`) and `Repositories/BBDD/` (EF implementations on top of `BaseCRUDRepository`). `Repositories/ExternalServices/` is the placeholder for outbound integrations such as the AI provider.
- **Application** — the host project: `Program.cs`, `Controllers/`, `Services/`, `DTOs/`, `Mappers/AutoMapperProfile.cs`, `Authentication/`. Note that service implementations live here, while their interfaces live in Domain.
- **Common** — empty for now.

Request flow: `Controller → I<Feature>Service → I<Feature>Repository → DbContext`. Each feature gets its own subfolder in every layer (`Controllers/WaterTracking/`, `Services/WaterTracking/`, `Entities/WaterTracking/`, …).

Conventions to follow when adding a feature:

- API request DTOs end in `Rq`, live in `DTOs/<Feature>/Request/`, and derive from `BaseApiRq`, whose `IsValid()` the controller checks before calling the service. Response DTOs end in `Rs` and live in `DTOs/<Feature>/Response/`.
- Three shapes per concept: `*Rq`/`*Rs` (API) ↔ domain model ↔ `*Entity` (persistence). AutoMapper converts between them; register new maps in `AutoMapperProfile`.
- Register services in `Application/ServiceCollectionExtensions.cs` and repositories in `Infrastructure/InfrastructureServiceCollectionExtensions.cs`.
- Routes are kebab-case under `/api/<capability>` (e.g. `/api/water-tracking/goal`).
- Controllers currently take the user from `FixedTestUser.Id`. That constant is temporary and goes away with `add-auth` — don't build new abstractions on top of it.

### Flutter client

Feature-based, with three layers inside each feature under `lib/features/<feature>/`:

```
presentation/   Pages and widgets
application/    Riverpod providers / controllers
data/           API models and repository (Dio calls)
```

- `lib/core/` — cross-cutting infrastructure: `ApiClient` (Dio), `Env`, the Drift `AppDatabase`.
- `lib/providers/` — global Riverpod providers (`apiClientProvider`, `appDatabaseProvider`).
- `lib/shared/`, `lib/services/`, `lib/repositories/`, `lib/models/` — empty placeholders for code not tied to a single feature.
- `lib/main.dart` — `ProviderScope` plus a five-tab `NavigationBar` (Salud, Nutrición, Entrenamiento, Progreso, Perfil). Only Nutrición has content today: it hosts the water-tracking sections. The other tabs are empty placeholders.

Feature modules are meant to stay independent of each other.

### Rules that hold across the codebase

- **HealthKit**: exclusive to the Flutter app. The backend must never access HealthKit directly; HealthKit data always enters via Flutter → API → PostgreSQL.
- **AI**: the backend is the only component that talks to the AI provider. Flutter sends images/questions/context to the backend, which calls the provider and returns the result.
- **Sync model**: local (Drift, cache, offline-capable) + remote (PostgreSQL via REST). No multi-device conflict-resolution strategy is planned for now (explicit non-goal).
- **Business logic lives server-side**: the API is meant to be shared across multiple clients eventually (Flutter iOS/Android, web), so don't put business rules in the Flutter client.
