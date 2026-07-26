## Context

`kora-health-client/` y `kora-health-api/` están vacías. `ARQUITECTURA.md` ya fija la pila (Flutter/Riverpod/Dio/Drift en cliente; ASP.NET Core/EF Core/PostgreSQL en backend) y las capas de cada lado, pero no hay código todavía. `water-tracking` es el módulo elegido como piloto por ser el más simple del dominio. Ninguna de las 11 specs cubre autenticación: no existe una capability `auth`, así que no hay un modelo de usuario/login definido.

## Goals / Non-Goals

**Goals:**
- Dejar `kora-health-client/` y `kora-health-api/` con un esqueleto ejecutable, con las dependencias de `ARQUITECTURA.md` instaladas y la estructura de carpetas de referencia creada.
- Implementar `water-tracking` de extremo a extremo (entidad, endpoint, pantalla, repositorio) cumpliendo `openspec/specs/water-tracking/spec.md`, para tener un módulo real sobre el que construir `sync` en un change posterior.

**Non-Goals:**
- No se implementa `sync` en este change (caché offline, cola de reintentos, idempotencia): el cliente llama a la API directamente.
- No se implementa autenticación real. Se usa un **usuario de prueba fijo** (un único registro `User` sembrado en la base de datos, sin login) tanto en cliente como en backend, hasta que exista una spec `auth`.
- No se implementan el resto de módulos (health, nutrition-log, workouts, etc.).

## Decisions

**Usuario de prueba fijo en vez de autenticación real.**
Como no existe spec `auth`, se siembra un único `User` con un id fijo conocido (p. ej. un GUID constante) en la base de datos al arrancar el backend, y el cliente lo usa como identidad implícita en todas las llamadas (sin pantalla de login). Esto desbloquea el piloto sin inventar un modelo de autenticación que luego habría que rehacer. Cuando exista la spec `auth`, se creará un change dedicado para introducir login real y migrar `water-tracking` (y `sync`) a usar el usuario autenticado en lugar del fijo.

**Estructura de carpetas siguiendo ARQUITECTURA.md al pie de la letra.**
Cliente: `lib/core`, `lib/shared`, `lib/features/water_tracking` (Presentation/Application/Data internos al feature), `lib/services`, `lib/repositories`, `lib/models`, `lib/providers`. Backend: `Controllers/`, `Services/`, `Repositories/`, `Entities/`, `DTOs/`, `Mappings/`, `Infrastructure/`, `Authentication/` (esta última carpeta se crea vacía/placeholder, ya que no hay auth real todavía, pero se respeta la organización ya decidida en ARQUITECTURA.md).

**Water-tracking como vertical slice completo, no como capas separadas por PR.**
Se implementa entidad + endpoint + repositorio + pantalla en un mismo change para poder verificar los escenarios de `water-tracking/spec.md` de extremo a extremo (registrar consumo, ver objetivo, ver historial) antes de pasar a `sync`.

**PostgreSQL gestionado en Neon, no Docker local.**
Se usa la instancia Neon existente del usuario en vez de levantar PostgreSQL en Docker. El connection string se guarda con `dotnet user-secrets` (fuera del repo, nunca en `appsettings.json`), evitando exponer credenciales en git.

## Risks / Trade-offs

- **[Riesgo] El usuario de prueba fijo se filtra a producción si no se retira a tiempo** → Mitigación: se documenta explícitamente en el README del backend y se deja como tarea explícita retirarlo al implementar `auth`.
- **[Riesgo] La estructura de carpetas puede no ajustarse perfectamente una vez se implemente el segundo módulo (nutrition-log, con más complejidad)** → Mitigación: se trata como punto de partida; ajustar la organización de un solo módulo piloto es barato comparado con descubrir el problema tras varios módulos.
