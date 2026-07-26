# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project status

Kora Health is currently **spec-only**: there is no application code yet (no Flutter client, no backend). The repository contains only OpenSpec artifacts under `openspec/`. Do not assume a `lib/`, `src/`, `pubspec.yaml`, or `.csproj` exists — check before referencing build/test tooling, since none of it has been scaffolded yet.

## Working with OpenSpec

This project uses the [OpenSpec](https://github.com/) spec-driven workflow (`schema: spec-driven` in `openspec/config.yaml`). Specs are the source of truth for what should be built; there is no code to cross-check them against yet.

- `openspec/specs/<capability>/spec.md` — the 11 approved capabilities (current, authoritative state).
- `openspec/changes/` — proposed changes; only `archive/` exists today (no active change in flight).
- `openspec/changes/archive/<date>-<slug>/` — completed changes, each with `proposal.md`, `tasks.md`, `design.md`, and the `specs/` diff that was merged into `openspec/specs/`.
- `openspec/specs/initial/ARQUITECTURA.md` and `FUNCIONALIDADES.md` — the original unstructured notes the first change (`define-initial-specs`) was based on. Their content is now covered by the 11 formal specs; removing this folder was deliberately deferred by the user and is still pending.

### Spec language: Spanish, with English structural keywords

All spec prose (Purpose, requirement/scenario names, requirement bodies, scenario steps) is written in **Spanish** going forward — this applies to new specs and changes too, not just the existing 11. However, the OpenSpec CLI parser hard-requires certain markers to stay in **English** or validation breaks:

- Section headers: `## Purpose`, `## Requirements` (and, for changes, `## Why` / `## What Changes`) — matched case-insensitively but must be these literal English words.
- `### Requirement: <name>` — the `Requirement:` prefix is literal (case-insensitive); `<name>` itself can be Spanish.
- The literal word `SHALL` or `MUST` (word-boundary match) somewhere in every requirement's body — `openspec validate --strict` fails otherwise. Embed it directly in the Spanish sentence, RFC-2119 style: `El sistema SHALL permitir...`.

Everything else is free-form and unvalidated: `#### Escenario: <name>` (any level-4 heading under a requirement counts as a scenario, the word "Scenario"/"Escenario" itself isn't checked), and the `- **CUANDO** ... / - **ENTONCES** ...` bullet style used for scenario steps (translated from WHEN/THEN, purely a formatting convention).

When asked to build a feature, start a new OpenSpec change (proposal + tasks + spec deltas) before writing implementation code, following the same structure as `openspec/changes/archive/2026-07-25-define-initial-specs/`. Validate changes with `openspec validate` before archiving.

### The 11 capabilities and their dependencies

- `sync` and `profile` are foundational — most other capabilities depend on them (local/remote storage strategy, user config).
- `health` depends on `healthkit-integration` (HealthKit is reachable only from the Flutter client; the backend never talks to HealthKit directly — data flows HealthKit → Flutter → API → PostgreSQL).
- `nutrition-log` and `nutrition-goals` are split: `nutrition-log` is the food/meal diary and photo/AI recognition; `nutrition-goals` is the calorie/macro targets and the daily nutrition score. `profile` also holds calorie/macro configuration — don't duplicate that config in `nutrition-goals`.
- `water-tracking` and `recipes` are intentionally separate specs, not folded into `nutrition-log`.
- `workouts` is the training log (routines, exercises, sets/reps/weight, PRs) — modeled after Hevy.
- `progress` aggregates `health`, `nutrition-log`, `nutrition-goals`, and `workouts` data (trends, comparisons, AI-generated summaries) — it should not redefine their underlying data.
- `ai-assistant` is the cross-cutting AI capability (food image recognition, quantity estimation, score explanations, recommendations, summaries, Q&A over user data). The AI provider is consumed **from the backend**, not directly from Flutter. Planned provider: Gemini 2.5 Flash (implementation-level detail still pending its own change).

## Planned architecture (from `openspec/specs/initial/ARQUITECTURA.md`)

Not yet implemented, but this is the target shape design should follow once code exists:

```
Flutter (Dart) --HTTP REST--> ASP.NET Core Web API --> PostgreSQL (Entity Framework Core)
```

**Flutter client** — layered, feature-based:
```
Presentation (Pages, Widgets, Riverpod Providers)
  -> Application (Services, Use Cases)
    -> Data (Dio API client, HealthKit, Drift/SQLite, Repositories)
```
Planned tech: Riverpod (state), Dio (HTTP), Drift/SQLite (local cache + offline). Each feature module (`health`, `nutrition`, `workout`, `progress`, `profile`) is meant to be independent.

**Backend** — layered:
```
Controllers -> Services -> Repositories -> Entity Framework Core -> PostgreSQL
```
Planned folders: `Controllers/`, `Services/`, `Repositories/`, `Entities/`, `DTOs/`, `Mappings/`, `Infrastructure/`, `Authentication/`.

**HealthKit rule**: exclusive to the Flutter app. The backend must never access HealthKit directly; HealthKit data always enters the system via Flutter → API → PostgreSQL.

**AI rule**: the backend is the only component that talks to the AI provider. Flutter sends images/questions/context to the backend, which calls the AI provider and returns the result.

**Sync model**: local (Drift, cache, offline-capable) + remote (PostgreSQL via REST). No multi-device conflict-resolution strategy is planned for now (explicit non-goal, see the archived change's `tasks.md`).

**Future direction**: the API is meant to be shared across multiple clients eventually (Flutter iOS/Android, web) with business logic centralized server-side — factor new backend logic with that in mind rather than putting business rules in the Flutter client.
