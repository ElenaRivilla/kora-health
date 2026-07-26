## Context

La spec `sync` original (de `define-initial-specs`) quedó deliberadamente abstracta: decía que había almacenamiento local y remoto y que se sincronizaban, sin fijar alcance, disparadores ni manejo de fallos. Ahora que el cliente (`kora-health-client/`) y la API (`kora-health-api/`) viven en el mismo repo y se acerca la implementación, hay que cerrar esas decisiones. Se mantiene el supuesto ya fijado en `define-initial-specs`: un único dispositivo activo por usuario (sin resolución de conflictos multi-dispositivo).

## Goals / Non-Goals

**Goals:**
- Fijar qué datos sincroniza `sync`, cuándo se dispara, cómo se recupera de fallos y qué guarda el caché local.
- Dejar la spec lista para que la implementación en `kora-health-client/` (Drift + repositorios) y `kora-health-api/` (endpoints de escritura) tenga un contrato claro.

**Non-Goals:**
- Resolución de conflictos multi-dispositivo (sigue fuera de alcance, ver `define-initial-specs`).
- Diseño concreto del esquema de la cola local (tabla Drift, forma del payload) — corresponde al change que implemente `sync` en el cliente.
- Diseño del endpoint/contrato exacto de deduplicación en el backend — corresponde al change que implemente `sync` en la API.

## Decisions

**Ventana local de 90 días, remoto sin límite.**
Se decidió no espejar todo el histórico en el dispositivo. 90 días cubre comparativas trimestrales de `progress` sin forzar al cliente a descargar/mantener años de datos de salud/nutrición/entrenamiento. Alternativa descartada: espejo completo (más simple de implementar pero crece indefinidamente y no aporta valor offline para datos muy antiguos).

**Push inmediato tras cada escritura, no por lotes ni periódico.**
Se prioriza que el usuario vea su dato reflejado como "sincronizado" lo antes posible y se minimiza la ventana en la que un fallo del dispositivo podría perder cambios no enviados. Alternativa descartada: sincronización periódica (más simple de implementar pero introduce latencia y una ventana de pérdida mayor).

**Cola de reintentos persistente en vez de reintento en memoria.**
Si el reintento solo viviera en memoria, cerrar la app mientras hay entradas pendientes las perdería. Se requiere que la cola persista (en Drift, ya usado como storage local) y se reanude al reiniciar la app.

**Identificador único generado en cliente para idempotencia.**
Como el push es inmediato y hay reintentos automáticos, es posible que una entrada llegue al backend pero la confirmación (ACK) se pierda antes de llegar al cliente; sin un identificador estable, el reintento crearía un duplicado. Se opta por que el cliente genere el identificador (UUID) en el momento de la escritura local, en vez de esperar uno del backend, precisamente para poder reintentar sin depender de haber recibido respuesta la primera vez.

**Descarga inicial completa (últimos 90 días) en el sign-in, no descarga perezosa.**
Para que el caché de 90 días quede consistente desde el primer uso en un dispositivo nuevo o tras reinstalar, se descarga esa ventana completa al iniciar sesión, en vez de ir pidiendo datos a demanda según el usuario navega. Es más simple y evita estados intermedios de "caché parcialmente poblado" difíciles de razonar.

## Risks / Trade-offs

- **[Riesgo] Push inmediato por cada escritura puede generar mucho tráfico de red si el usuario registra muchas entradas rápido (p. ej. varias series de un entrenamiento seguidas)** → Mitigación: esto es un detalle de implementación (se puede agrupar en el cliente antes de enviar sin romper el requisito, que solo exige que el intento de sync ocurra inmediatamente después de la escritura, no que cada llamada de red sea 1:1 con cada entrada); se deja para el design.md de implementación.
- **[Riesgo] Ventana de 90 días puede sentirse corta si en el futuro se quiere comparar año contra año en `progress` estando offline** → Mitigación: la ventana es un valor de spec, no arquitectónico; se puede ampliar en un change futuro sin romper el resto de requisitos de `sync`.
- **[Riesgo] Cola de reintentos infinita si una entrada es permanentemente inválida (p. ej. rechazada por el backend por validación, no por conectividad)** → Mitigación: el requisito "Offline Change Queue and Retry" solo cubre fallos de sincronización por falta de conectividad; el manejo de errores de validación del backend no está cubierto aquí y debe definirse en el change que implemente el endpoint correspondiente.
