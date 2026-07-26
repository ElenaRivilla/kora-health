## Why

No existe todavía código en `kora-health-client/` ni en `kora-health-api/` — solo las carpetas vacías y las specs. Antes de implementar `sync` (que necesita un módulo real de datos para probarse de extremo a extremo) hace falta el esqueleto de ambos proyectos y un primer módulo funcionando por completo en ambas capas. Se elige `water-tracking` como piloto por ser el módulo más simple del dominio (un valor numérico diario, objetivo, registro rápido, historial), sin la complejidad de IA o fotos de otros módulos.

## What Changes

- Se crea el esqueleto del proyecto Flutter en `kora-health-client/` con Riverpod, Dio y Drift configurados, siguiendo la organización de capas de `ARQUITECTURA.md` (Presentation / Application / Data).
- Se crea el esqueleto del proyecto ASP.NET Core Web API en `kora-health-api/` con Entity Framework Core y PostgreSQL configurados, siguiendo la organización de capas de `ARQUITECTURA.md` (Controllers / Services / Repositories / Entities / DTOs).
- Se implementa el módulo `water-tracking` de extremo a extremo: entidad y endpoint en el backend, pantalla y repositorio en el cliente, cumpliendo los requisitos ya definidos en `openspec/specs/water-tracking/spec.md`.
- No se implementa todavía `sync` (queda para un change posterior); el cliente llama directamente a la API sin cola local ni caché offline en esta fase.

## Capabilities

### New Capabilities

- `auth`: comportamiento temporal mientras no exista autenticación real — el sistema opera contra un único usuario de prueba sembrado, sin credenciales. Se reemplazará por completo cuando se defina una spec de autenticación real.

### Modified Capabilities

(ninguna — `water-tracking` ya tiene sus requisitos definidos; este change los implementa, no los cambia)

## Impact

- Crea la estructura base de código en `kora-health-client/` y `kora-health-api/` que usarán todos los módulos siguientes.
- Introduce las primeras dependencias reales: Flutter/Dart/Riverpod/Dio/Drift en el cliente; .NET/EF Core/Npgsql en el backend.
- Usa la instancia PostgreSQL gestionada en Neon del usuario; el connection string se almacena vía `dotnet user-secrets`, no en el repositorio.
