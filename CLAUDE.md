# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project status

Kora Health is in an **early implementation phase**. Both apps are scaffolded and one pilot module is implemented end to end; everything else exists only as specs.

- **Implemented**: `water-tracking` (backend endpoints + Angular screens), verified end to end against the real backend (`openspec/changes/archive/2026-10-11-migrate-client-to-angular/verification.md`). The spec's "estadísticas resumidas" are not implemented anywhere yet: the API only returns daily totals.
- **Visual foundation implemented** (`app-shell` capability): light and dark themes following the system, role-named CSS variables with a single accent, Phosphor icons, the floating navigation and the base components, with every existing screen migrated onto them. Verified in the browser at 375px and 1280px in both themes (`openspec/changes/archive/2026-10-12-ui-foundation/verification.md`); reduced motion, the on-screen keyboard and the safe areas are still to be checked on a real device.
- **Client is Angular**: the original Flutter client was removed; `kora-health-client/` now holds the Angular app. It is a web app designed mobile-first. Reading HealthKit will require packaging it for iOS with Capacitor, which is planned for a later change and not started.
- **No real authentication yet**: the backend attributes every request to a single seeded user (`FixedTestUser`, id `1`, username `dev-test-user`). The client sends no credentials.
- **No offline cache yet**: the client has no local storage and calls the API directly. The local-storage technology for the web client is undecided and belongs to the `sync` implementation.
- **Spec-only**: `health`, `healthkit-integration`, `nutrition-log`, `nutrition-goals`, `recipes`, `workouts`, `progress`, `ai-assistant`, `sync`, `profile` (except its time zone).
- **User time zone and local day**: every user has an IANA time zone stored server-side (`Europe/Madrid` by default), readable and writable at `/api/profile/time-zone`. That endpoint is the only part of `profile` that is implemented. The water history groups entries by the user's local day. Verified end to end against the real backend (`openspec/changes/archive/2026-10-11-user-local-day/verification.md`).
- **Tests**: the client has unit tests (Vitest) next to each component and service; the backend has one xUnit project, `kora-health-api/tests/Application.Tests/`, limited to the local-day calculation, time zone validation and the water history. It needs no database or network.

`README.md` has the full setup walkthrough (Neon connection, CORS, client configuration).

## Repository layout

```
openspec/              # Specs (source of truth) and changes
kora-health-api/       # ASP.NET Core backend (net10.0), solution: KoraHealth.Api.slnx
kora-health-client/    # Angular client (the app is named `kora-health-web` in angular.json and package.json)
```

## Commands

### Backend (`kora-health-api`)

The connection string is never committed. It lives in `dotnet user-secrets` under `ConnectionStrings:DefaultConnection` and points to a PostgreSQL instance on Neon (see README for the format).

```bash
# Run the API (http://localhost:5001, opens Swagger UI at /swagger)
cd kora-health-api/src/Application && dotnet run

# Build the whole solution
cd kora-health-api && dotnet build KoraHealth.Api.slnx

# Run the backend tests (xUnit; no database needed)
cd kora-health-api && dotnet test KoraHealth.Api.slnx

# Add a migration
cd kora-health-api && dotnet ef migrations add <Name> \
  --project src/Infrastructure/KoraHealth.Api.Infrastructure.csproj \
  --startup-project src/Application/KoraHealth.Api.Application.csproj \
  --output-dir EntityFramework/Migrations
```

On startup `Program.cs` applies pending migrations automatically and seeds the fixed test user, so `dotnet ef database update` is rarely needed by hand.

### Client (`kora-health-client`)

Angular CLI is not installed globally; use the npm scripts or `npx ng ...` inside the folder. Angular 22 needs Node `^22.22.3`, `^24.15.0` or `>=26`.

```bash
cd kora-health-client
npm install
npm start                    # dev server on http://localhost:4200
npm run build                # output in dist/kora-health-web
npm test -- --watch=false    # unit tests (Vitest), single run; plain `npm test` watches
npx ng lint                  # angular-eslint
npx ng generate component <path>   # generators emit *.component.ts / *.service.ts with suffixed class names
```

The API base URL is runtime configuration, not a build flag: `public/assets/config.json` (`{ "apiBaseUrl": "http://localhost:5001" }`) is loaded by `AppConfigService` before the app renders, and startup fails visibly if it is missing. The origin serving the client must be listed in the API's CORS configuration (see Backend).

### OpenSpec

```bash
openspec list                     # active changes and task progress
openspec validate --all --strict  # validate every spec and change
```

## Working with OpenSpec

This project uses the [OpenSpec](https://openspec.dev) spec-driven workflow (`schema: spec-driven` in `openspec/config.yaml`). Specs are the source of truth for what should be built.

- `openspec/specs/<capability>/spec.md` — the 12 approved capabilities (current, authoritative state).
- `openspec/changes/<slug>/` — changes in flight, each with `proposal.md`, `design.md`, `tasks.md` and a `specs/` delta.
- `openspec/changes/archive/<date>-<slug>/` — completed changes: `define-initial-specs`, `refine-sync-spec`, `scaffold-and-water-tracking-pilot`, `migrate-client-to-angular`, `user-local-day`, `ui-foundation`.
- `openspec/specs/initial/ARQUITECTURA.md` and `FUNCIONALIDADES.md` — the original unstructured notes the first change was based on. Their content is now covered by the formal specs; removing this folder was deliberately deferred by the user and is still pending.

When asked to build a feature, start a new OpenSpec change (proposal + tasks + spec deltas) before writing implementation code, following the structure of the archived changes. Validate with `openspec validate` before archiving. The `/opsx:*` commands and `openspec-*` skills in `.claude/` drive this workflow.

### Active changes

- `add-auth` (proposed, not started) — introduces the `auth` capability: self-registration and login with email + password, JWT issued by the backend, hashed passwords. Replaces the fixed test user. Its client tasks are written for the Angular client. Depends on `user-local-day` (archived): the user entity and table already exist and every new user must get a time zone.
- `update-profile` (proposed, not started) — pins down the personal-data fields in `profile`, adds weight updates from HealthKit via `health` (latest measurement wins), and requires connectivity to edit the profile. Its client tasks are written for the Angular client. Depends on `user-local-day` (archived): the time zone already lives at `/api/profile/time-zone`, and whether its form edits it is still open.

Known issue: there is no `openspec/specs/auth/spec.md`. The interim "fixed development user" `auth` delta exists only inside the archived scaffold change, although `FixedTestUser.cs` and the README refer to it as if it were a main spec.

### Spec language: Spanish, with English structural keywords

All spec prose (Purpose, requirement/scenario names, requirement bodies, scenario steps) is written in **Spanish** — this applies to new specs and changes too. However, the OpenSpec CLI parser hard-requires certain markers to stay in **English** or validation breaks:

- Section headers: `## Purpose`, `## Requirements` (and, for changes, `## Why` / `## What Changes`) — matched case-insensitively but must be these literal English words.
- `### Requirement: <name>` — the `Requirement:` prefix is literal (case-insensitive); `<name>` itself can be Spanish.
- The literal word `SHALL` or `MUST` (word-boundary match) somewhere in every requirement's body — `openspec validate --strict` fails otherwise. Embed it directly in the Spanish sentence, RFC-2119 style: `El sistema SHALL permitir...`.

Everything else is free-form and unvalidated: `#### Escenario: <name>` (any level-4 heading under a requirement counts as a scenario, the word "Scenario"/"Escenario" itself isn't checked), and the `- **CUANDO** ... / - **ENTONCES** ...` bullet style used for scenario steps (translated from WHEN/THEN, purely a formatting convention).

### The 12 capabilities and their dependencies

- `app-shell` is the client's frame and appearance: main navigation, view title, light and dark themes, single accent, and the accessibility, reduced-motion and mobile guarantees every view meets. The screens of every other capability are built on it.
- `sync` and `profile` are foundational — most other capabilities depend on them (local/remote storage strategy, user config). `auth` will join them once `add-auth` lands.
- `health` depends on `healthkit-integration` (HealthKit is reachable only from the client app running on the user's iOS device; the backend never talks to HealthKit directly — data flows HealthKit → client → API → PostgreSQL).
- `nutrition-log` and `nutrition-goals` are split: `nutrition-log` is the food/meal diary and photo/AI recognition; `nutrition-goals` is the calorie/macro targets and the daily nutrition score. `profile` also holds calorie/macro configuration — don't duplicate that config in `nutrition-goals`.
- `water-tracking` and `recipes` are intentionally separate specs, not folded into `nutrition-log`.
- `workouts` is the training log (routines, exercises, sets/reps/weight, PRs) — modeled after Hevy.
- `progress` aggregates `health`, `nutrition-log`, `nutrition-goals`, and `workouts` data (trends, comparisons, AI-generated summaries) — it should not redefine their underlying data.
- `ai-assistant` is the cross-cutting AI capability (food image recognition, quantity estimation, score explanations, recommendations, summaries, Q&A over user data). The AI provider is consumed **from the backend**, not directly from the client. Planned provider: Gemini 2.5 Flash (implementation-level detail still pending its own change).

## Architecture

```
Angular (TypeScript) --HTTP REST--> ASP.NET Core Web API --> PostgreSQL on Neon (Entity Framework Core + Npgsql)
```

### Backend

Four projects under `kora-health-api/src/`, plus one test project under `kora-health-api/tests/`. Folder names are short, project files carry the `KoraHealth.Api.` prefix, and C# namespaces omit `Api` (`KoraHealth.Application`, `KoraHealth.Domain`, `KoraHealth.Infrastructure`).

- **Domain** — no dependencies. `Entities/` (EF-mapped, `*Entity`, derive from `BaseEntity`), `Models/` (domain models used by services, derive from `BaseModel`), `Contracts/` (repository and service interfaces), and `LocalDay/`, a cross-cutting folder with the pure local-day code: `UserCalendar` (immutable; built from a time zone and an instant, it gives the user's current day, the local day of any instant and the UTC bounds of a range of local days), `TimeZoneValidator` and `TimeZoneDefaults`.
- **Infrastructure** — `EntityFramework/` (`KoraHealthDbContext`, migrations, snake_case naming via `EFCore.NamingConventions`) and `Repositories/BBDD/` (EF implementations on top of `BaseCRUDRepository`). `Repositories/ExternalServices/` is the placeholder for outbound integrations such as the AI provider.
- **Application** — the host project: `Program.cs`, `Controllers/`, `Services/`, `DTOs/`, `Mappers/AutoMapperProfile.cs`, `Authentication/`. Note that service implementations live here, while their interfaces live in Domain.
- **Common** — empty for now.
- **tests/Application.Tests** — xUnit, hand-written test doubles in `TestDoubles/` (no mocking library), one folder per feature (`LocalDay/`, `WaterTracking/`).

Request flow: `Controller → I<Feature>Service → I<Feature>Repository → DbContext`. Each feature gets its own subfolder in every layer (`Controllers/WaterTracking/`, `Services/WaterTracking/`, `Entities/WaterTracking/`, …).

Conventions to follow when adding a feature:

- API request DTOs end in `Rq`, live in `DTOs/<Feature>/Request/`, and derive from `BaseApiRq`, whose `IsValid()` the controller checks before calling the service. Response DTOs end in `Rs` and live in `DTOs/<Feature>/Response/`.
- Three shapes per concept: `*Rq`/`*Rs` (API) ↔ domain model ↔ `*Entity` (persistence). AutoMapper converts between them; register new maps in `AutoMapperProfile`.
- Register services in `Application/ServiceCollectionExtensions.cs` and repositories in `Infrastructure/InfrastructureServiceCollectionExtensions.cs`.
- Routes are kebab-case under `/api/<capability>` (e.g. `/api/water-tracking/goal`, `/api/profile/time-zone`).
- Expected validation failures are not exceptions: the service reports them and the controller answers `400` with a plain-text message (there is no error middleware, so an exception becomes a `500`).
- Read the current time through the injected `TimeProvider` (registered as `TimeProvider.System`) in new code, so it can be replaced in tests. The older `DateTime.UtcNow` calls in `WaterTrackingRepository` were left as they are.
- Time zones: any value coming from outside goes through `TimeZoneValidator.TryNormalize` and the identifier it returns is what gets stored, never the `Id` of the `TimeZoneInfo` (.NET hands back the spelling it was first asked with and caches it for the life of the process).
- Controllers currently take the user from `FixedTestUser.Id`. That constant is temporary and goes away with `add-auth` — don't build new abstractions on top of it.
- CORS: `Program.cs` defines one named policy whose origins come from `Cors:AllowedOrigins` (no wildcard, methods `GET`/`PUT`/`POST`, header `Content-Type`). `appsettings.Development.json` lists `http://localhost:4200`; outside Development no origin is allowed by default. A new HTTP method or request header used by the client must be added to the policy.

### Angular client

Angular 22, standalone components (no `NgModule`; `modules/` is only a grouping name), zoneless (no `zone.js`), state with signals, SCSS on top of role-named CSS variables (see «Base visual» below). No state, UI-component or translation library, no SSR; the only UI dependency is the icon set (`@ng-icons/core` and `@ng-icons/phosphor-icons`, pinned to 36.1.0). Screens are organised by feature under `modules/app-container/`; data access and cross-cutting code live apart:

```
kora-health-client/
  public/assets/config.json     Runtime configuration (API base URL); public/ is the only static folder
  src/
    main.ts                     Bootstrap; renders a visible error if startup fails
    index.html                  color-scheme, the two theme-color tags, viewport-fit=cover
    styles.scss                 Composes the partials in styles/
    styles/                     _tokens (all variables, both themes, accents, motion), _base, _utilities, _mixins
    app/
      app.config.ts             Global providers: router, HttpClient, config.json initializer
      app.routes.ts             Routes (+ /catalogo in development builds only)
      modules/app-container/    Screens by feature
        home/                   App shell: header, floating five-destination navigation, router outlet;
                                home-destinations.ts lists the destinations, their icons and short labels
        health/ nutrition/ workouts/ progress/ profile/   One page component per section
        nutrition/water-tracking/   Goal, quick-log and history components + their signals state service
        catalog/                Component catalog page (development only)
        shared/components/      Base components shared between sections: card, button, field, compact-select, status-message
      services/                 Data access: base-http.service.ts, water-tracking.service.ts
        pipes/                  Presentation pipes; empty until a feature needs one
      shared/                   Cross-cutting: config/, theme/ (ThemeService), entities/DTOS/, helpers/
```

- **Routes**: `/` redirects to `/salud`; `/salud`, `/nutricion`, `/entrenamiento`, `/progreso` and `/perfil` are lazy children of `HomeComponent`, and unknown URLs fall back to `/`. Each route declares its `title`, which the header shows. Only Nutrición has content (water-tracking); the other pages are empty. `/catalogo` exists only when `ngDevMode` is on, has no title and is not a destination.
- **Layout**: mobile-first. Below 768px the navigation is a floating pill anchored to the bottom (it overlays the content, which reserves room for it and handles the safe areas); from 768px up the same markup moves into the header, right of the title, and the content is a centred 45rem column. The shell gives every page its side margin and top spacing: pages only space their own blocks. The main navigation label of Entrenamiento is «Entreno» (also its accessible name); the header still shows «Entrenamiento».
- **Data access**: a service per capability in `services/` extends `BaseHttpService`, which prefixes `apiBaseUrl` and applies a 10s timeout. Components do not call `HttpClient` directly.
- **State**: a signals-based state service per feature, provided by the page that owns it (`WaterTrackingStateService` in `NutritionPageComponent`), not in root.
- **DTOs**: TypeScript `interface`s in `shared/entities/DTOS/<capability>/`, one per file, named like the backend class (`WaterGoalRs`, `SetWaterGoalRq`). Dates stay as ISO `string`s.
- **Naming**: identifiers, files and folders in English; visible text and URL segments in Spanish. Kebab-case files with a type suffix (`*.component.ts`, `*.service.ts`), `app-` selector prefix, one component per folder with its `.ts`, `.html`, `.scss` and `.spec.ts`. Templates use `@if`/`@for`; injection uses `inject()`.
- **Independence**: a section folder under `modules/app-container/` does not import from another section; shared pieces move up to `modules/app-container/shared/`.
- **Not present on purpose**: no auth guard or session services (they arrive with `add-auth`), no Firebase, no pipes, no translations (Spanish text lives in the templates; the preferred future direction is plain JSON i18n files), no stored theme or accent preference and no settings screen to pick them, no Storybook or visual regression tests.

#### Base visual

Established by the `ui-foundation` change; its `design.md` (decisions 1 to 16) holds the full reasoning and the contrast tables.

- **Themes.** Light and dark, following the system by default with no JavaScript: light values in `:root`, dark ones in `@media (prefers-color-scheme: dark)`. Setting `data-theme="light"` or `data-theme="dark"` on `<html>` forces one; no attribute means «follow the system». The root declares `color-scheme`, so native controls and scrollbars follow the theme. `index.html` repeats `--color-bg` of each theme in two `theme-color` tags; keep them in sync with `_tokens.scss`.
- **`ThemeService`** (`src/app/shared/theme/theme.service.ts`, root): signals `preference` (`'system' | 'light' | 'dark'`), `theme` (effective theme), `accent` and `revision`; methods `setPreference` and `setAccent`. The attributes on `<html>` are the source of truth and the service only mirrors and writes them; nothing is persisted. `revision` increases whenever a computed colour may have changed (system theme, `data-theme`, `data-accent` or the root's inline `style`): code that reads computed colours, such as chart palettes, reads `revision()` inside its computation to repaint. Computed colours made with `color-mix()` come back from `getComputedStyle` as `color(srgb r g b)`, not `rgb(…)`.
- **Colour variables by role**, all in `src/styles/_tokens.scss`: `--color-bg`, `--color-surface`, `--color-surface-raised`, `--color-text`, `--color-text-secondary`, `--color-text-disabled`, `--color-border` (decorative), `--color-border-strong` (delimits a control, 3:1), `--color-accent` (fill), `--color-on-accent`, `--color-accent-strong` (accent as text, icon, active item or highlighted data), `--color-accent-soft`, `--color-accent-muted`, `--color-focus-ring`, `--color-success`, `--color-warning`, `--color-danger`, `--color-success-fill`, `--color-danger-fill`, `--color-on-success`, `--color-on-danger` and `--color-data-neutral`. **No colour literal (hex, `rgb()`, `hsl()` or colour name) anywhere outside `_tokens.scss` and the two `theme-color` tags.** Hover and pressed fills are not variables: use the `pressed-fill(--color-…)` mixin (8 % black, through the helper `--color-shade`).
- **Single accent.** `--accent` is the only accent value; the accent roles are `color-mix(in srgb, …)` of it, so changing it changes the whole app without JavaScript. Components never use `--accent` directly. Selectable accents form a closed list (`$accents` in `_tokens.scss`, chosen with `data-accent="<id>"` on `<html>`; today only `indigo`, `#5856d6`). An accent enters the list only if every pair of the contrast table in the design still meets WCAG 2.1 AA in both themes with the current mix percentages; the percentages and the neutral colours are not changed without recalculating that table.
- **Typography, spacing, radii, sizes**: variables (`--font-size-*`, `--font-weight-*`, `--line-height-*`, `--space-1` to `--space-8`, `--radius-sm/md/card/pill`, `--border-width`, `--shadow-floating`, `--size-touch` = 44px, `--size-icon`, `--size-icon-sm`) and mixins in `src/styles/_mixins.scss` (`text-title-page`, `text-title-card`, `text-body`, `text-label`, `text-caption`, `text-nav`, `text-figure`, `wide` for ≥ 48rem, `touch-target`, `control-pill`, `pressed-fill`). Components import them with `@use 'mixins';` (`stylePreprocessorOptions.includePaths` points at `src/styles`). Every control is at least 44 × 44 px; the global `:focus-visible` ring is defined once in `_base.scss` and not redefined.
- **Motion.** Durations and curves only from `--duration-fast` (120ms), `--duration-base` (200ms), `--duration-slow` (400ms), `--ease-standard` and `--ease-enter`; animate only `opacity`, `transform` and colours. With `prefers-reduced-motion: reduce` the durations become `0s` and a global safety net in `_base.scss` stops any other animation; the only literal animation is the loading spinner, which also stops. Animations run from TypeScript (e.g. charts) are not reached by CSS: their code must check the same preference itself.
- **Icons**: Phosphor through `ng-icons`, used directly (`<ng-icon name="phosphorX" />`, no wrapper). Each component registers its own icons in its `providers` with `provideIcons({ … })`, never globally. Outline weight from `@ng-icons/phosphor-icons/regular` (`phosphorX`), fill from `/fill` (`phosphorXFill`): outline at rest, fill when active. Size through `--ng-icon__size: var(--size-icon)` in SCSS; colour is inherited. Icons are hidden from assistive technologies by default; an icon-only button carries its `aria-label` on the button.
- **Base components** (`modules/app-container/shared/components/`): `app-card` (`title`, optional `subtitle`, header control projected with `appCardControl`), `appButton` on `<button>`/`<a>` (`appButton="secondary"`/`"danger"`, `iconOnly`), `app-field` with `<input appInput>` (`label`, `hint`, `error`), `app-compact-select` (`options`, `[(value)]`, required `label`) and `app-status-message` (`kind`: `loading`/`error`/`empty`, optional `retryLabel` and `(retry)`). Designed in the `ui-foundation` design but not built yet: segmented control, list row, switch, button loading state and header back button; the first screen that needs one builds it there.
- **Catalog**: `/catalogo` (development builds only) shows every base component in all its variants and states, plus three buttons to force the theme. Keep it up to date when adding or changing a base component, and in every client change review the affected screens and the catalog in both themes at 375px and then at 1280px.

### Rules that hold across the codebase

- **HealthKit**: exclusive to the client app running on the user's iOS device. The backend must never access HealthKit directly; HealthKit data always enters via client → API → PostgreSQL. The web client must keep working without HealthKit, and no client code may assume a native environment until the Capacitor change exists.
- **AI**: the backend is the only component that talks to the AI provider. The client sends images/questions/context to the backend, which calls the provider and returns the result.
- **Local day**: "the day" is the calendar day in the user's time zone, and the server works it out. Get the user's `UserCalendar` from `ILocalDayService` and use it to find today, to group instants by day and to turn a range of days into UTC bounds. Instants are stored in UTC. No module groups by UTC date, adds 24 hours to move between days, or leaves this calculation to the client, which sends no dates or day limits. A user who changes time zone sees their history regrouped; stored instants do not change.
- **Sync model**: local (cache, offline-capable; storage technology undecided) + remote (PostgreSQL via REST). No multi-device conflict-resolution strategy is planned for now (explicit non-goal).
- **Business logic lives server-side**: the API is meant to be shared across multiple clients eventually, so don't put business rules in the client: it validates input format and presents data, and calculations belong to the API.
