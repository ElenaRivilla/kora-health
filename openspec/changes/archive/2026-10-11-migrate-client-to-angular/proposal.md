# Proposal

## Why

El cliente de Kora Health está hoy implementado en Flutter, pero la autora del proyecto domina Angular y solo tiene experiencia construyendo aplicaciones web: mantener y hacer crecer un cliente Flutter le resulta más lento y arriesgado que hacerlo en Angular. La migración se plantea ahora porque el cliente solo contiene el andamiaje y un módulo piloto (`water-tracking`): el coste de cambiar de tecnología es mínimo comparado con hacerlo cuando existan más módulos.

## What Changes

- **BREAKING** Se sustituye el cliente Flutter (`kora-health-client/`) por un cliente Angular en una carpeta nueva en paralelo, `kora-health-web/`. Flutter permanece intacto y ejecutable hasta que Angular alcance paridad funcional con el piloto. Una vez retirado Flutter, la carpeta Angular podrá renombrarse a `kora-health-client/`.
- Se crea el proyecto Angular 22 (aplicación única `kora-health-web`, SCSS, pruebas unitarias con el runner que el CLI configura por defecto, configuración en runtime vía `public/assets/config.json`) con la arquitectura de referencia detallada en `design.md`: pantallas por funcionalidad bajo `modules/app-container/`, servicios e integraciones en `services/`, y configuración, DTOs y helpers transversales en `shared/`.
- Se reimplementa en Angular el módulo `water-tracking` con paridad respecto al cliente actual (objetivo diario, registro rápido, historial y estadísticas), verificado contra `openspec/specs/water-tracking/spec.md`.
- Se reescriben en términos neutrales de tecnología los requirements que hoy nombran explícitamente a Flutter (`healthkit-integration`, `ai-assistant`).
- Se retira el cliente Flutter como última fase y se actualizan `README.md` y `CLAUDE.md`.
- El backend no cambia de comportamiento. Único ajuste previsible: permitir el origen del cliente Angular (CORS), que hoy no está configurado.

### Faseo propuesto

Cada fase se delega a un subagente y se cierra con verificación antes de abrir la siguiente.

| Fase | Contenido | Depende de |
|---|---|---|
| 0 | Arquitectura y decisiones → `design.md` | — |
| 1 | Deltas de spec (`healthkit-integration`, `ai-assistant`) y `tasks.md` | 0 |
| 2 | Scaffold del proyecto Angular (CLI, lint, tests, estructura de carpetas) | 1 |
| 3 | Infraestructura transversal: cliente HTTP, configuración de entorno, layout y navegación de 5 secciones, CORS en la API | 2 |
| 4 | Paridad de `water-tracking` en Angular | 3 |
| 5 | Verificación end-to-end contra la spec de `water-tracking` | 4 |
| 6 | Retirada de Flutter y actualización de documentación | 5 |

### Fuera de alcance

- Implementar módulos que hoy son solo spec (`health`, `nutrition-log`, `workouts`, etc.).
- Implementar `sync` (caché offline): igual que en el cliente actual, Angular llamará a la API directamente. La tecnología de almacenamiento local en web se decidirá en el change de `sync`.
- Implementar la lectura de HealthKit y empaquetar el cliente como app iOS (ver decisión más abajo).
- Firebase: aparecía en la arquitectura de referencia solo porque esta se tomó de otro proyecto. No forma parte de este change; su posible uso como proveedor de autenticación se valorará en `add-auth`.
- Autenticación: no se crean `authGuard` ni servicios de autenticación o sesión, ni siquiera como hueco. Llegarán con `add-auth`.
- Traducciones: la interfaz sigue solo en español. La dirección preferida para un change futuro es usar archivos JSON de traducciones, sin una librería pesada (ver `design.md`, decisión 12).
- Pipes: no se crea el pipe de precios ni ningún otro; solo se añadirán cuando una funcionalidad los necesite.

### Decisión tomada: HealthKit con Capacitor, en un change posterior

Una aplicación Angular en navegador no puede leer HealthKit. Decisión confirmada por la autora: el cliente Angular se empaquetará como app iOS con **Capacitor** y leerá HealthKit mediante un plugin nativo, en un change posterior. Así se conserva un único código de cliente y la regla vigente «HealthKit → cliente → API», y esta migración no queda bloqueada. Sigue fuera del alcance de este change: aquí no se instala Capacitor ni ningún plugin. Consecuencia para este change: el cliente web debe funcionar sin HealthKit y nada de su código debe asumir un entorno nativo; cuando llegue, el acceso a HealthKit quedará detrás de una abstracción del cliente.

## Capabilities

### New Capabilities

(ninguna — la migración cambia la tecnología del cliente, no añade comportamiento)

### Modified Capabilities

- `healthkit-integration`: los requirements «Acceso a HealthKit Restringido al Cliente Móvil», «Flujo de Datos de HealthKit» y «Sincronización de HealthKit Controlada por el Usuario» pasan a referirse a la aplicación cliente en el dispositivo iOS, sin nombrar la tecnología. Se mantiene que el backend nunca accede a HealthKit. El `## Purpose` de la spec también nombra a Flutter y se corrige a mano al archivar, porque los deltas no operan sobre él.
- `ai-assistant`: el escenario que nombra «el cliente Flutter» pasa a referirse al cliente, sin nombrar la tecnología. Se mantiene que solo el backend habla con el proveedor de IA.

## Impact

- **Código**: carpeta nueva `kora-health-web/`; eliminación de `kora-health-client/` en la fase 6. En `kora-health-api`, solo configuración de CORS.
- **API**: sin cambios de contrato; el cliente Angular consume los endpoints existentes de `/api/water-tracking`.
- **Dependencias**: se añade el toolchain de Node/Angular CLI; se elimina el de Flutter/Dart al final.
- **Changes en curso**: `add-auth` y `update-profile` tienen secciones de tareas y decisiones de diseño redactadas para Flutter (formularios, almacenamiento del token, edición de perfil sin offline vía Drift). Deben reescribirse para Angular antes de aplicarse; conviene aplicar esta migración primero. `add-auth` es además el change donde se crearán `authGuard` y los servicios de autenticación y sesión, y donde se valorará Firebase como posible proveedor de autenticación.
- **Documentación**: `README.md`, `CLAUDE.md` y las notas de `openspec/specs/initial/ARQUITECTURA.md` describen el cliente Flutter.
