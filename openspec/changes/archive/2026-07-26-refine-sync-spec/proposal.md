## Why

La spec `sync` (creada al archivar `define-initial-specs`) describe la sincronización local/remota en términos demasiado generales para implementarla: no dice qué se sincroniza, cuándo se dispara, cómo se recupera de fallos, ni cuánto histórico guarda el dispositivo. Antes de tocar código hay que cerrar esas decisiones y reflejarlas como requisitos verificables.

## What Changes

- Se aclara que la sincronización aplica a los datos de **todas** las capabilities que producen datos de usuario (health, nutrition-log, nutrition-goals, water-tracking, recipes, workouts, profile).
- Se añade un requisito de **descarga inicial** al iniciar sesión, para poblar el caché local en dispositivos nuevos o tras reinstalar.
- Se especifica que el envío local→remoto ocurre **inmediatamente tras cada escritura local**, no de forma periódica o solo manual.
- Se añade una **cola de reintentos persistente**: las entradas que no se pueden enviar quedan encoladas localmente y se reintentan automáticamente, sobreviviendo a un reinicio de la app.
- Se añade un requisito de **sincronización idempotente**: cada entrada creada localmente lleva un identificador único generado en el cliente, para que un reintento no cree duplicados en el backend.
- Se acota el **caché local a una ventana de 90 días**; el remoto sigue siendo la copia autoritativa con el histórico completo.

## Capabilities

### New Capabilities

(ninguna)

### Modified Capabilities

- `sync`: se modifican los requisitos "Local Offline Storage" (ahora acotado a ventana de 90 días) y "Local-Remote Synchronization" (ahora especifica disparo inmediato tras escritura); se mantiene "Remote Persistence" sin cambios de fondo pero se aclara que retiene el histórico completo. Se añaden los requisitos de descarga inicial, cola de reintentos e idempotencia.

## Impact

- Afecta al diseño de la capa `Data` del cliente Flutter (Drift + repositorios) y a los endpoints del backend que reciben escrituras (necesitarán aceptar un identificador de cliente para deduplicar).
- No hay código existente que migrar; es la primera vez que se detalla el comportamiento de `sync` antes de implementarlo en `kora-health-client/` y `kora-health-api/`.
