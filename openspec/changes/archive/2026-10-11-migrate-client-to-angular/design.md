# Design

## Context

Motivación y alcance: ver `proposal.md` (Why, What Changes, Fuera de alcance). Aquí solo se recoge el estado actual que condiciona el diseño.

**Cliente Flutter que se migra** (`kora-health-client/lib/`, unas 400 líneas):

- `main.dart`: `HomeScreen` con una `NavigationBar` de cinco destinos (Salud, Nutrición, Entrenamiento, Progreso, Perfil) y una `AppBar` con el nombre de la sección activa. Solo Nutrición tiene contenido: dos tarjetas, «Hidratación» (objetivo) e «Historial de hidratación» (registro rápido + lista de días). Las otras cuatro son `SizedBox.shrink()`.
- `core/env.dart` + `core/api_client.dart`: URL base de la API como constante de compilación (`--dart-define=API_BASE_URL`, por defecto `http://localhost:5001`) y un cliente Dio con timeouts de 10 s.
- `features/water_tracking/`: modelos, repositorio (cuatro llamadas), providers de Riverpod y tres widgets.
- `core/database/` y `providers/app_database_provider.dart`: base de datos Drift sin tablas. Pertenece a `sync`, que queda fuera de alcance; no tiene equivalente en este change.

**API que consume** (`WaterTrackingController`, rutas bajo `/api/water-tracking`):

| Método y ruta | Petición | Respuesta |
|---|---|---|
| `GET /goal` | — | `WaterGoalRs` o `404` si no hay objetivo |
| `PUT /goal` | `SetWaterGoalRq { dailyGoalMl }` | `WaterGoalRs { dailyGoalMl, dateUpdated }`; `400` si `dailyGoalMl <= 0` |
| `POST /entries` | `LogWaterRq { amountMl }` | `WaterEntryRs { id, amountMl, dateCreated }`; `400` si `amountMl <= 0` |
| `GET /history?days=30` | — | `WaterHistoryDayRs[] { date, totalMl, goalMl? }`, solo días con entradas, orden descendente |

**Restricciones verificadas en el código:**

- `Program.cs` no configura CORS (no hay ninguna referencia a CORS en `kora-health-api/src`). Un cliente servido desde otro origen (`http://localhost:4200`) no puede llamar hoy a la API desde el navegador.
- No hay autenticación: el controlador usa `FixedTestUser.Id` y el cliente no envía credenciales.
- La API solo escucha en `http://localhost:5001` (`launchSettings.json`).
- La spec de `water-tracking` exige «estadísticas resumidas» en el historial, pero ni la API ni el cliente Flutter las ofrecen hoy: `GET /history` devuelve únicamente totales diarios. Es una carencia previa a este change (ver Risks).

**Decisiones ya tomadas por la autora** (no se reabren): Angular **22** fijado por major (la estable actual; ver decisión 2); proyecto nuevo en `kora-health-web/` en paralelo a `kora-health-client/`; ejecución por fases delegadas a subagentes; arquitectura de carpetas y capas de la sección siguiente; qué piezas de esa arquitectura no entran en este change (decisión 12); HealthKit mediante Capacitor en un change posterior (decisión 10).

## Goals / Non-Goals

**Goals:**

- Fijar la arquitectura objetivo del cliente Angular y dónde vive cada pieza del piloto, de modo que las fases 2 a 6 se puedan ejecutar sin tomar decisiones estructurales nuevas.
- Que cada fase sea autocontenida: entradas claras, archivos que toca y un criterio de verificación propio.
- Paridad funcional con el cliente Flutter actual en `water-tracking` y en la navegación de cinco secciones.
- Dejar constancia de qué piezas llegarán con otros changes (autenticación, traducciones, HealthKit) sin reservarles carpetas, archivos ni placeholders en este.

**Non-Goals:**

- No se rediseña la interfaz: misma información y mismas acciones que el cliente Flutter.
- No se añade comportamiento nuevo a la API ni se cambia su contrato. El único cambio de backend es CORS.
- No se introducen librerías que la arquitectura de referencia no concreta (gestión de estado, componentes UI, traducciones). Ver decisión 12 y Open Questions.
- No se incluye Firebase (decisión 12).
- No se crean `authGuard`, servicios de autenticación ni de sesión, ni siquiera como hueco: llegarán con `add-auth` (decisión 12).
- No se implementa la lectura de HealthKit ni se empaqueta el cliente con Capacitor: se hará en un change posterior (decisión 10).
- No se cubre el despliegue a producción (hosting, dominios, HTTPS): hoy el proyecto solo se ejecuta en local.

## Decisions

### 1. Arquitectura de referencia del proyecto Angular

Aplicación web construida con Angular 22. La organización del código de interfaz es principalmente por funcionalidad: las pantallas y sus componentes viven bajo `modules/app-container`, mientras que los servicios, modelos y utilidades transversales se agrupan aparte.

```text
kora-health-web/
|-- public/                         # Archivos estáticos servidos desde la raíz
|   `-- assets/config.json          # Configuración de la aplicación en runtime
|-- src/
|   |-- main.ts                     # Punto de entrada y arranque de Angular
|   |-- index.html                  # Documento HTML anfitrión
|   |-- styles.scss                 # Estilos globales
|   |-- assets/                     # Recursos del código fuente (fonts, img, scripts)
|   |-- environments/               # Preparada para configuración por entorno; actualmente vacía
|   `-- app/
|       |-- app.component.*         # Componente raíz
|       |-- app.config.ts           # Proveedores globales y configuración de Angular
|       |-- app.routes.ts           # Rutas
|       |-- modules/app-container/  # Funcionalidades y pantallas de la aplicación
|       |   |-- home/
|       |   `-- shared/             # Componentes, entidades e iconos de estas funcionalidades
|       |-- services/               # Acceso a datos e integraciones
|       |   `-- pipes/              # Transformaciones reutilizables de presentación
|       `-- shared/                 # Configuración, tipos y helpers transversales
|           |-- entities/DTOS/
|           `-- helpers/
|-- angular.json                    # Targets de build, serve y test
`-- package.json                    # Dependencias y comandos npm
```

Capas:

- **Arranque y composición:** `main.ts` inicia la aplicación; `app.component.*` aporta la raíz visual. En la arquitectura completa, `app.config.ts` registra router, cliente HTTP, traducciones, animaciones y servicios globales (lo que se registra en este change se acota más abajo).
- **Navegación:** `app.routes.ts` conecta las URL con las páginas. Cuando exista autenticación (`add-auth`), las páginas protegidas usarán un `authGuard`; en este change no hay ninguno.
- **Funcionalidades:** `modules/app-container/` agrupa pantallas por dominio funcional.
- **Servicios:** `services/` centraliza integraciones y operaciones reutilizables. `base-http.service.ts` sirve como base para llamadas HTTP. `services/pipes/` es el lugar de las transformaciones de presentación (formatos de fechas, números, valores nulos), que se añadirán solo cuando una funcionalidad las necesite.
- **Compartido:** `app/shared/` contiene configuración de aplicación, constantes, DTOs y helpers comunes. `modules/app-container/shared/` queda más cerca de las pantallas y reúne componentes, entidades e iconos compartidos por esas funcionalidades.

Build: `npm start` (servidor de desarrollo), `npm run build`, `npm test` (pruebas unitarias con el runner que configure el CLI, ver decisión 11). `angular.json` define una sola aplicación, `kora-health-web`, con `sourceRoot` `src`; TypeScript en `tsconfig.json`, `tsconfig.app.json`, `tsconfig.spec.json`.

Esta es la arquitectura completa a la que tiende el cliente. **En este change, `app.config.ts` registra solo router y cliente HTTP** (más el cargador de configuración de la decisión 5). Firebase no forma parte del proyecto; `authGuard` y los servicios de autenticación y sesión no se crean ni se les reserva ubicación; las traducciones no se implementan (decisión 12). Las animaciones no se registran hasta que una pantalla las necesite (Open Questions).

*Alternativa descartada:* replicar la estructura de Flutter (`features/<feature>/{presentation,application,data}`). Se descarta porque la razón de la migración es trabajar con la estructura que la autora domina.

### 2. Scaffold con el CLI fijado a la major 22

El proyecto se genera con `npx @angular/cli@22 new kora-health-web` desde la raíz del repositorio, con estilos SCSS, sin SSR, con enrutado y sin crear un repositorio git anidado. No se usa un CLI global para que la versión no dependa de la máquina.

**Por qué la 22.** Es la major estable actual (`@angular/cli` `latest` = 22.2.2; la 22.0.0 se publicó el 2026-06-03), es compatible con el Node instalado (`@angular/cli@22` exige Node `^22.22.3 || ^24.15.0 || >=26.0.0` y la máquina tiene Node 24.21.0 con npm 11.19.0) y elegirla no tiene coste de migración, porque todavía no existe código Angular.

**Qué está verificado y qué no.** Lo que sigue se ha comprobado con `npx @angular/cli@22 version`, `npx @angular/cli@22 new --help` y leyendo los schematics de la 22.2.2, sin generar el proyecto: los flags `--style`, `--routing`, `--ssr`, `--skip-git`, `--ai-config`, `--file-name-style-guide`, `--test-runner`, `--zoneless` y `--standalone` existen; `--standalone` vale `true` por defecto, `--test-runner` vale `vitest` y `--file-name-style-guide` vale `2025`; la aplicación se crea sin `zone.js` salvo que se pida lo contrario; y la carpeta de estáticos que el schematic declara en `angular.json` es `public/`. Todo lo demás (el contenido exacto de `angular.json` y `package.json`, los nombres de los archivos generados, el comando de pruebas no interactivo) es una inferencia que la fase 2 comprueba sobre el proyecto generado.

Ajustes necesarios para que el resultado coincida con la arquitectura de referencia:

- **Sufijos clásicos en los nombres de archivo.** El CLI 22 genera por defecto archivos sin sufijo (`app.ts`, `app.html`), mientras que la arquitectura de referencia usa nombres con sufijo de tipo (`app.component.*`, `base-http.service.ts`). Se mantiene la arquitectura: los generadores deben producir `*.component.ts`, `*.service.ts`, `*.guard.ts` y `*.pipe.ts` mediante las opciones de `schematics` de `angular.json`, y el componente raíz debe llamarse `app.component.*`. El CLI 22 ofrece para ello `--file-name-style-guide=2016`, que según sus schematics escribe esa configuración en `angular.json` y nombra el componente raíz con sufijo; se genera con ese flag. La fase 2 comprueba el resultado y, si no coincide, configura `schematics` y renombra el componente raíz a mano.
- **Carpetas vacías de la arquitectura** (`src/environments/`, `src/assets/`, `services/pipes/`, `shared/helpers/`, `modules/app-container/shared/`, y las que se llenan en fases posteriores, `modules/app-container/home/` y `shared/entities/DTOS/`): el CLI no las crea; se añaden con un `.gitkeep` mientras estén vacías. Crear `services/pipes/` no es adelantar ningún pipe: es una carpeta de la arquitectura y solo contiene su `.gitkeep` (decisión 12).
- **`public/assets/` frente a `src/assets/`.** Con el CLI 22 lo que se sirve como estático es `public/` (a confirmar en el `angular.json` generado). `src/assets/` se usa solo para recursos referenciados desde el código o los estilos (fuentes, imágenes), que el bundler resuelve; **no** se añade como carpeta estática en `angular.json`, porque ambas acabarían publicándose bajo `/assets/` y podrían pisarse.
- **Detección de cambios:** se adopta el valor por defecto del CLI 22, que crea la aplicación **sin `zone.js`** (zoneless). No se pasa `--zoneless=false`. Encaja con el estado basado en signals de la decisión 7; a cambio, las pruebas no pueden apoyarse en utilidades que dependen de `zone.js`.
- **Scripts de `package.json`:** `npm start`, `npm run build`, `npm test`, tal como los genera el CLI.

*Alternativa descartada:* la major 20 prevista inicialmente. Se descarta por decisión de la autora: ya no es la estable actual y, sin código que migrar, no aporta nada frente a la 22.

### 3. Convenciones de código

- **Componentes standalone** (valor por defecto del CLI 22, coherente con `app.config.ts` y `app.routes.ts`): no se crean `NgModule`. La carpeta `modules/` es solo un nombre de agrupación.
- **Control de flujo nativo** en plantillas (`@if`, `@for`) e inyección con `inject()`.
- **Idioma:** identificadores, nombres de archivo y carpetas en inglés, igual que el backend y el cliente actual; textos visibles y segmentos de URL en español.
- **Nombres de archivo** en kebab-case con sufijo de tipo (`water-goal-section.component.ts`, `water-tracking.service.ts`). Selector de componentes con prefijo `app-`.
- **Un componente por carpeta**, con su `.ts`, `.html`, `.scss` y `.spec.ts`.
- **DTOs** como `interface` de TypeScript que reflejan el JSON de la API, con el mismo nombre que la clase del backend (`WaterGoalRs`, `SetWaterGoalRq`). Las fechas se tipan como `string` (ISO), que es lo que viaja en el JSON; no se convierten a `Date` en el DTO.
- **Independencia entre funcionalidades:** una carpeta de sección bajo `modules/app-container/` no importa de otra sección. Lo que compartan sube a `modules/app-container/shared/`.
- **Sin lógica de negocio en el cliente** (regla vigente del proyecto): el cliente valida formato de entrada y presenta datos; los cálculos pertenecen a la API.

### 4. Navegación y encaje en `modules/app-container/`

`home/` contiene el **armazón de la aplicación**: es el equivalente directo del `HomeScreen` de Flutter (cabecera con el título de la sección activa, barra de navegación de cinco destinos y un `router-outlet` para el contenido). Cada sección es una carpeta hermana con su página, cargada de forma diferida.

| URL | Componente | Carpeta | Contenido en este change |
|---|---|---|---|
| `/` | — | — | Redirige a `/salud` (primera pestaña, igual que Flutter) |
| `/salud` | `HealthPageComponent` | `modules/app-container/health/` | Página vacía |
| `/nutricion` | `NutritionPageComponent` | `modules/app-container/nutrition/` | Hidratación (piloto) |
| `/entrenamiento` | `WorkoutsPageComponent` | `modules/app-container/workouts/` | Página vacía |
| `/progreso` | `ProgressPageComponent` | `modules/app-container/progress/` | Página vacía |
| `/perfil` | `ProfilePageComponent` | `modules/app-container/profile/` | Página vacía |
| cualquier otra | — | — | Redirige a `/` |

- `app.routes.ts` declara una ruta raíz con `HomeComponent` y las cinco secciones como rutas hijas. El título de cada sección se declara en la propia ruta y la cabecera lo lee de ahí, de modo que la etiqueta de la navegación y el título no se duplican.
- Los nombres de carpeta siguen a los capabilities de OpenSpec (`health`, `workouts`, `progress`, `profile`); `nutrition` agrupa lo que el usuario ve en la pestaña Nutrición, que hoy es solo `water-tracking`.
- Ninguna ruta lleva `authGuard` en este change: no hay autenticación y el guard no se crea ni se le reserva ubicación (decisión 12). `add-auth` lo creará y lo aplicará a la ruta raíz.

*Alternativa descartada:* mantener una única pantalla con pestañas en memoria, como en Flutter. Con rutas reales cada sección tiene URL propia, funciona el botón «atrás» del navegador y el guard futuro se aplica en un solo punto.

### 5. Configuración en runtime con `public/assets/config.json`

Sustituye a `--dart-define=API_BASE_URL`. El archivo se versiona con el valor por defecto de desarrollo:

```json
{ "apiBaseUrl": "http://localhost:5001" }
```

- Lo carga un servicio de configuración en `app/shared/` (la arquitectura sitúa ahí la «configuración de aplicación»), ejecutado como inicializador de aplicación registrado en `app.config.ts`. Angular espera a que termine antes de pintar ninguna pantalla, así que ningún servicio puede hacer una llamada sin tener la URL base.
- El archivo se pide por ruta relativa al propio origen (`assets/config.json`), sin pasar por la URL base de la API.
- Si el archivo no se puede cargar o no contiene `apiBaseUrl`, el arranque falla con un mensaje visible. No se cae en silencio a un valor por defecto embebido: apuntar a una API equivocada sin avisar es peor que no arrancar.
- Cambiar de API no requiere recompilar: basta con editar el JSON servido. `src/environments/` se deja vacía, como indica la arquitectura.

*Alternativas descartadas:* `environment.ts` con reemplazo en build (obliga a recompilar por entorno, igual que el `--dart-define` que se quiere dejar atrás); pedir el JSON con `fetch` en `main.ts` antes de arrancar (equivalente en resultado, pero saca la configuración de `app.config.ts`, donde la arquitectura concentra los proveedores).

### 6. Acceso a datos: `base-http.service.ts` y servicio de `water-tracking`

- `services/base-http.service.ts`: clase base que recibe el cliente HTTP de Angular y la configuración, compone la URL (`apiBaseUrl` + ruta relativa) y expone operaciones tipadas de lectura y escritura. Aplica el mismo timeout de 10 s que el cliente Dio actual. No añade cabeceras de autenticación (las incorporará `add-auth`, previsiblemente con un interceptor registrado en `app.config.ts`).
- `services/water-tracking.service.ts`: extiende la base y expone las cuatro operaciones de la API (`getGoal`, `setGoal`, `logEntry`, `getHistory`). Conserva la semántica del repositorio Flutter: un `404` en `getGoal` se traduce en «sin objetivo» (`null`), no en error; `getHistory` pide 30 días por defecto.
- Los servicios de datos no guardan estado: devuelven observables y nada más.

### 7. Estado y componentes del piloto

Sin librería de estado (valor por defecto conservador, ver Open Questions): un servicio de estado propio de la funcionalidad, con signals, sustituye a los providers de Riverpod.

- `WaterTrackingStateService`, en la carpeta de la funcionalidad y provisto en la página de Nutrición (no global): mantiene el objetivo y el historial, cada uno con su estado de carga y de error, y expone `setGoal` y `logEntry`.
- Tras `logEntry` se recarga el historial (igual que Flutter invalida `waterHistoryProvider`). Tras `setGoal` se recargan objetivo **e historial**: en Flutter solo se recarga el objetivo y la columna de objetivo del historial queda desfasada hasta refrescar; se corrige de paso porque no cuesta nada.
- Componentes, todos de presentación sobre ese servicio: sección de objetivo (objetivo actual o «Sin objetivo configurado todavía», campo numérico y botón «Guardar objetivo»; ignora valores vacíos o `<= 0`), registro rápido (botones `+100 ml`, `+250 ml`, `+500 ml`) y sección de historial (fecha y `total ml / objetivo ml`, o solo el total si no hay objetivo).
- La tarjeta con título que envuelve cada sección es reutilizable por otras pantallas, así que va a `modules/app-container/shared/`.
- La fecha del historial es una fecha de calendario (`YYYY-MM-DD`): se muestra tal cual, sin conversión de zona horaria.
- No se crea ningún pipe propio: el piloto no lo necesita y los pipes solo se añaden cuando una funcionalidad los necesite (decisión 12). `services/pipes/` sigue conteniendo solo su `.gitkeep`.

### 8. Correspondencia Flutter → Angular

Rutas de Flutter relativas a `kora-health-client/lib/`; rutas de Angular relativas a `kora-health-web/src/app/` salvo que se indique.

| Flutter | Angular | Notas |
|---|---|---|
| `main.dart` → `main()`, `MyApp` | `src/main.ts`, `app.component.*`, `app.config.ts` | Arranque y raíz |
| `main.dart` → `HomeScreen` | `modules/app-container/home/home.component.*` + `app.routes.ts` | Armazón y navegación de 5 secciones |
| `main.dart` → `NutritionScreen` | `modules/app-container/nutrition/nutrition-page.component.*` | Página de Nutrición |
| `main.dart` → `_SectionCard` | `modules/app-container/shared/components/section-card/section-card.component.*` | Tarjeta con título |
| `main.dart` → `ThemeData` | `src/styles.scss` | Estilos globales |
| `core/env.dart` | `public/assets/config.json` + `shared/config/app-config.service.ts` | Runtime en lugar de compilación |
| `core/api_client.dart` | `services/base-http.service.ts` | Base de llamadas HTTP |
| `providers/api_client_provider.dart` | — | Lo cubre la inyección de dependencias de Angular |
| `core/database/*`, `providers/app_database_provider.dart` | — | Sin equivalente: pertenece a `sync` |
| `features/water_tracking/data/water_tracking_models.dart` | `shared/entities/DTOS/water-tracking/` (`water-goal-rs.ts`, `water-entry-rs.ts`, `water-history-day-rs.ts`, `set-water-goal-rq.ts`, `log-water-rq.ts`) | Un archivo por DTO |
| `features/water_tracking/data/water_tracking_repository.dart` | `services/water-tracking.service.ts` | Extiende `BaseHttpService` |
| `features/water_tracking/application/water_tracking_providers.dart` | `modules/app-container/nutrition/water-tracking/water-tracking-state.service.ts` | Signals en lugar de Riverpod |
| `features/water_tracking/presentation/water_goal_section.dart` | `modules/app-container/nutrition/water-tracking/water-goal-section/` | |
| `features/water_tracking/presentation/water_history_section.dart` | `modules/app-container/nutrition/water-tracking/water-history-section/` | |
| `features/water_tracking/presentation/water_quick_log_widget.dart` | `modules/app-container/nutrition/water-tracking/water-quick-log/` | |
| `shared/`, `services/`, `repositories/`, `models/` (vacías) | `shared/`, `services/` | |
| `test/widget_test.dart` | `*.spec.ts` junto a cada archivo | |

### 9. CORS en la API (único cambio de backend)

Se añade a la API una política de CORS con nombre que permite únicamente una lista de orígenes leída de configuración. En desarrollo esa lista contiene el origen del servidor de Angular, `http://localhost:4200`; no se usa comodín.

- La lista vive en la configuración de la aplicación (`appsettings.Development.json`), no en el código, de modo que añadir un origen no requiere recompilar y la configuración base no abre ningún origen.
- La política permite los métodos y cabeceras que usa el cliente (`GET`, `PUT`, `POST` con cuerpo JSON, lo que implica petición previa `OPTIONS`). No habilita credenciales: el cliente no envía cookies ni cabeceras de autorización.
- Se aplica a todos los controladores, en el pipeline antes de la autorización.
- No cambia ningún contrato ni comportamiento de la API.

*Alternativa descartada:* un proxy en el servidor de desarrollo de Angular que reenvíe `/api` a la API. Evita tocar el backend, pero solo funciona en desarrollo, oculta el problema hasta el primer despliegue y contradice la configuración en runtime (la URL base dejaría de ser la que dice `config.json`).

### 10. HealthKit: Capacitor en un change posterior, detrás de una abstracción

El cliente Flutter no contiene hoy código de HealthKit, así que no hay nada que migrar. La forma de llegar a HealthKit desde un cliente web está decidida por la autora: el cliente Angular se empaquetará como app iOS con **Capacitor** y leerá HealthKit con un plugin nativo, en un change posterior. Sigue fuera del alcance de este change: no se instala Capacitor ni ningún plugin, y no se añade ninguna plataforma nativa al proyecto.

Reglas para este change:

- El cliente web debe funcionar sin HealthKit.
- Nada del código de este change debe asumir un entorno nativo: se ejecuta en un navegador y no depende de APIs de Capacitor ni del dispositivo.
- Cuando se implemente `healthkit-integration`, el resto del cliente dependerá de un contrato definido en `services/` y nunca de una implementación concreta, con una implementación «no disponible» para el navegador. No se crea ese contrato ahora, porque todavía no tiene ningún consumidor.

*Alternativa descartada:* una app nativa separada solo para HealthKit. Obligaría a mantener dos clientes; con Capacitor se conserva un único código y la regla vigente «HealthKit → cliente → API».

### 11. Pruebas

- Se usa el runner de pruebas unitarias que el CLI 22 configure por defecto, sin pasar `--test-runner`. Se espera Vitest: es el valor por defecto que declara `ng new --help`, y Karma está deprecado. La fase 2 lo confirma leyendo el `angular.json` y el `package.json` generados, identifica el runner real y deja documentado el comando no interactivo (`npm test` con las opciones que correspondan), que las fases siguientes reutilizan.
- **Desviación consciente respecto a la arquitectura aportada**, que nombraba Karma: se prefiere el runner por defecto y con soporte de la versión elegida a conservar uno deprecado.
- Las pruebas se escriben con las utilidades de pruebas de Angular y con la API del runner del proyecto, sin añadir librerías de pruebas.
- Cobertura mínima de este change, todo con el cliente HTTP simulado: `BaseHttpService` (composición de la URL), `WaterTrackingService` (las cuatro llamadas y el caso `404` → `null`), el servicio de estado (recargas tras `setGoal` y `logEntry`) y una prueba de render por componente.
- La verificación extremo a extremo de la fase 5 es manual, en el navegador y contra la API real, igual que se verificó el piloto en Flutter. No se añade un framework de e2e.

### 12. Piezas de la arquitectura de referencia que no entran en este change

La arquitectura de la decisión 1 se tomó como base de otro proyecto. La autora ha cerrado qué partes de ella no se trasladan a este change:

- **Firebase: no se incluye.** Aparecía en la arquitectura solo por venir de ese otro proyecto. `app.config.ts` no lo registra y no se instala ningún paquete suyo. Su posible uso como proveedor de autenticación se valorará en el change `add-auth`, no aquí.
- **`authGuard` y servicios de autenticación y sesión: no se crean.** No hacen falta hasta que exista autenticación, así que tampoco se les reserva un hueco: ni carpeta, ni archivo vacío, ni placeholder. Llegarán con `add-auth`, que decidirá también su ubicación. Ninguna ruta queda protegida.
- **Traducciones: no se implementan.** La interfaz sigue solo en español, con los textos directamente en las plantillas. Dirección preferida para un change futuro: archivos JSON de traducciones (uno por idioma), sin una librería pesada. Encaje previsto en esta arquitectura: los JSON como estáticos en `public/assets/i18n/`, junto a `config.json`; un servicio propio en `app/shared/` que los cargue, registrado en `app.config.ts`; y, si hace falta, un pipe de traducción en `services/pipes/`. Nada de eso se crea ahora; los textos se extraerán de las plantillas cuando llegue ese change.
- **Pipes: solo cuando una funcionalidad los necesite.** No se crea el pipe de precios (no hay precios en el dominio de Kora) ni ningún otro por adelantado. El piloto no necesita ninguno (decisión 7).

## Risks / Trade-offs

- **[La spec exige «estadísticas resumidas» y ni la API ni el cliente Flutter las ofrecen]** → Paridad significa aquí paridad con el cliente Flutter. La fase 5 debe registrar ese escenario como incumplimiento heredado, no como regresión. No se calculan estadísticas en el cliente (la lógica de negocio vive en la API) ni se amplía la API en este change. Ver Open Questions.
- **[El runner de pruebas no es el que nombraba la arquitectura aportada]** → Desviación consciente (decisión 11): se usa el runner por defecto del CLI 22 en lugar de Karma, que está deprecado. Que ese runner sea Vitest es una expectativa, no un hecho comprobado sobre el proyecto: la fase 2 lo identifica y documenta el comando no interactivo antes de escribir ninguna prueba.
- **[El comportamiento por defecto del CLI 22 se conoce por su ayuda y sus schematics, no por un proyecto generado]** → Decisión 2: la fase 2 comprueba sobre el resultado los nombres de archivo, la carpeta de estáticos, la ausencia de `zone.js` y el runner, y para e informa si algo no coincide con lo previsto.
- **[El CLI 22 no genera por defecto los nombres de archivo de la arquitectura de referencia]** → Decisión 2: se genera con `--file-name-style-guide=2016` y la fase 2 verifica que el componente raíz es `app.component.*` y que `ng generate` produce `*.component.ts` y `*.service.ts`; si no, se configura `schematics` y se renombra a mano.
- **[`public/assets/` y `src/assets/` pueden colisionar bajo `/assets/`]** → Decisión 2: solo `public/` se publica como estático.
- **[Dos clientes conviviendo durante la migración]** → Durante las fases 2 a 5 no se añade funcionalidad al cliente Flutter. `add-auth` y `update-profile` no se aplican hasta cerrar la fase 6 (sus tareas de cliente están escritas para Flutter y habrá que reescribirlas).
- **[CORS demasiado abierto si se copia la configuración de desarrollo a producción]** → Lista de orígenes explícita, solo en la configuración de desarrollo, sin comodín ni credenciales.
- **[Sin librería de componentes, la interfaz parte de cero]** → Aceptado: el piloto son dos tarjetas, un campo, cuatro botones y una lista. La barra de navegación debe ser usable en pantalla estrecha y ancha. Si más adelante se elige una librería, el coste de adaptar el piloto es bajo.
- **[Las fechas del historial las agrupa la API por día UTC]** → Comportamiento actual del backend, idéntico en Flutter. Fuera de alcance; no se compensa en el cliente.
- **[`config.json` no disponible al arrancar]** → Fallo visible en el arranque (decisión 5), con una prueba unitaria del caso.

## Migration Plan

Las fases son las de `proposal.md`. Cada una se delega a un subagente, toca un conjunto acotado de archivos y no se da por cerrada sin su verificación. Flutter permanece intacto y ejecutable hasta la fase 6.

| Fase | Qué produce | Archivos que toca | Verificación de cierre |
|---|---|---|---|
| 0 | Este documento | `openspec/changes/migrate-client-to-angular/design.md` | `openspec status` marca `design` como completo |
| 1 | Deltas de `healthkit-integration` y `ai-assistant`; `tasks.md` | `openspec/changes/migrate-client-to-angular/` | `openspec validate migrate-client-to-angular --strict` |
| 2 | Proyecto Angular 22 con la estructura de la decisión 1, sufijos configurados, carpetas vacías y lint | `kora-health-web/` (nuevo), `.gitignore` si hace falta | `npm run build` y `npm test` pasan; `npm start` sirve la aplicación vacía; la versión instalada de `@angular/core` es 22.x; runner de pruebas identificado y comando no interactivo documentado |
| 3 | `config.json` y su servicio, `BaseHttpService`, `HomeComponent` con las cinco rutas, CORS en la API | `kora-health-web/`; en `kora-health-api`, solo `Program.cs` y `appsettings.Development.json` | Las cinco URL muestran su sección y la navegación marca la activa; una petición desde `http://localhost:4200` a la API no es bloqueada por el navegador; `dotnet build` pasa; pruebas unitarias en verde |
| 4 | DTOs, `WaterTrackingService`, servicio de estado y los tres componentes dentro de la página de Nutrición | `kora-health-web/src/app/` | Pruebas unitarias en verde; contra la API real: consultar y guardar objetivo, registrar con los tres botones, ver el historial actualizado |
| 5 | Informe de verificación escenario a escenario contra `openspec/specs/water-tracking/spec.md`, comparando con el cliente Flutter | Ninguno de código (correcciones en `kora-health-web/` si aparecen diferencias) | Los tres escenarios comprobados en el navegador; diferencias respecto a Flutter documentadas; la carencia de estadísticas anotada como heredada |
| 6 | Retirada de Flutter y documentación al día | Se elimina `kora-health-client/`; `README.md`, `CLAUDE.md`, `openspec/specs/initial/ARQUITECTURA.md` | No quedan referencias a Flutter, Dart, Riverpod, Dio o Drift fuera de `openspec/changes/archive/`; `openspec validate --all --strict` pasa |

Notas sobre la fase 6:

- La eliminación de `kora-health-client/` va en un commit propio, sin mezclar con otros cambios, para poder revertirla de forma limpia.
- **Renombrado opcional** de `kora-health-web/` a `kora-health-client/`: se decide en ese momento. Si se hace, va en un commit separado posterior al borrado y hay que actualizar las rutas en `README.md` y `CLAUDE.md`. El nombre de la aplicación en `angular.json` y `package.json` (`kora-health-web`) puede mantenerse: no depende del nombre de la carpeta.
- Antes de aplicar `add-auth` y `update-profile` hay que reescribir sus tareas y decisiones de cliente para Angular (ver `proposal.md`, Impact).

**Rollback.** Hasta la fase 5, deshacer la migración consiste en borrar `kora-health-web/` y revertir el cambio de CORS; el cliente Flutter no se ha tocado. A partir de la fase 6, se revierte el commit de eliminación.

## Open Questions

Ninguna bloquea el scaffold ni la paridad de `water-tracking`. Firebase, autenticación, traducciones, pipes y HealthKit ya no son preguntas abiertas: la autora las ha cerrado (decisiones 10 y 12). También está cerrada la del runner de pruebas: se usa el que configure por defecto el CLI 22 (decisión 11). En cada una de las que siguen se indica el valor por defecto con el que se trabaja en este change mientras la autora no decida otra cosa.

1. **Gestión de estado.** No se menciona ninguna librería. **Por defecto: servicios con signals de Angular, sin librería externa (decisión 7).**
2. **Librería de componentes y estilos.** No se menciona ninguna; Flutter usaba Material. **Por defecto: SCSS propio, sin librería.**
3. **Animaciones.** La arquitectura las registra en `app.config.ts`, pero el piloto no tiene ninguna. **Por defecto: no se registran hasta que una pantalla las necesite.**
4. **SSR.** La arquitectura no lo menciona. **Por defecto: sin SSR, aplicación de página única.**
5. **Herramienta de lint.** `proposal.md` incluye lint en la fase 2, pero la arquitectura no nombra ninguna y el CLI no trae una por defecto. **Por defecto: la integración de ESLint que ofrece el propio CLI al ejecutar `ng lint` por primera vez (`angular-eslint`), con su configuración recomendada; que el CLI 22 siga ofreciéndola así se comprueba en la fase 2. Si la autora prefiere no añadirla, la fase 2 se cierra sin lint.**
6. **Estadísticas de hidratación.** La spec las exige y nadie las implementa hoy. ¿Se abordan en un change propio (requiere ampliar la API) o se ajusta la spec? **Por defecto: fuera de este change; la fase 5 lo deja anotado.**
7. **Sección inicial.** `/` redirige a `/salud` por paridad con Flutter, aunque es una página vacía. **Por defecto: `/salud`; cambiarlo a `/nutricion` es una línea en `app.routes.ts`.**
