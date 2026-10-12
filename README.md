# Kora Health

Kora Health es una app personal de seguimiento de salud, nutrición y entrenamientos: métricas de salud (sincronizadas desde Apple HealthKit), diario nutricional con reconocimiento de alimentos por IA, objetivos de calorías/macros, hidratación, entrenamientos, progreso agregado y un asistente de IA transversal.

El proyecto sigue un flujo **spec-driven** con [OpenSpec](https://openspec.dev) — las especificaciones funcionales viven en `openspec/specs/` (en español) y son la fuente de verdad de qué se debe construir. Ver `CLAUDE.md` para más detalle sobre esa convención.

**Stack:**
- **Cliente**: Angular 22 (TypeScript), componentes standalone sin `zone.js`, estado con signals, SCSS. Aplicación web pensada para móvil; todavía sin caché local ni modo offline.
- **Backend**: ASP.NET Core Web API (.NET), Entity Framework Core + Npgsql, arquitectura en 4 proyectos (Domain / Application / Infrastructure / Common).
- **Base de datos**: PostgreSQL gestionado en [Neon](https://neon.tech).

**Estado actual**: sin autenticación real todavía — el backend opera contra un único usuario de prueba fijo y sembrado (`dev-test-user`, id `1`), ver capability `auth`. Módulo piloto implementado de extremo a extremo: `water-tracking`.

## Estructura del repositorio

```
kora-health/
├── openspec/              # Specs (fuente de verdad) y changes (propuestas)
├── kora-health-api/       # Backend ASP.NET Core
│   ├── src/
│   │   ├── Domain/            # Modelos EF, contratos (interfaces), DTOs de dominio, cálculo de día local
│   │   ├── Application/       # Proyecto host (Program.cs, Controllers, Services, DTOs de API, AutoMapper)
│   │   ├── Infrastructure/    # DbContext, repositorios EF Core
│   │   └── Common/            # Vacío por ahora
│   └── tests/
│       └── Application.Tests/ # Pruebas xUnit (día local, validación de zona horaria, historial de agua)
└── kora-health-client/    # Cliente Angular (la aplicación se llama `kora-health-web` en angular.json y package.json)
    ├── public/
    │   └── assets/config.json  # Configuración en runtime (URL base de la API)
    └── src/
        ├── main.ts             # Punto de entrada; muestra un error visible si el arranque falla
        ├── styles.scss         # Compone los parciales de styles/
        ├── styles/             # Variables (_tokens), base, utilidades y mixins
        └── app/
            ├── app.config.ts       # Proveedores globales (router, cliente HTTP, carga de config.json)
            ├── app.routes.ts       # Rutas: /salud, /nutricion, /entrenamiento, /progreso, /perfil (y /catalogo en desarrollo)
            ├── modules/app-container/  # Pantallas por funcionalidad
            │   ├── home/               # Armazón: cabecera, barra de navegación de cinco secciones y contenido
            │   ├── nutrition/          # Única sección con contenido: hidratación (water-tracking)
            │   ├── health/ workouts/ progress/ profile/   # Páginas vacías por ahora
            │   ├── catalog/            # Catálogo de componentes base (solo en desarrollo)
            │   └── shared/components/  # Componentes base: tarjeta, botón, campo, selector compacto, mensaje de estado
            ├── services/           # Acceso a datos (base-http.service.ts, water-tracking.service.ts)
            └── shared/             # Configuración, tema (ThemeService), DTOs y helpers transversales
```

## Backend (`kora-health-api`)

### Requisitos
- .NET SDK (proyecto en `net10.0`, usando el SDK preview instalado en esta máquina).
- Acceso a la instancia de Neon del proyecto (connection string).

### Configurar la conexión a la base de datos

El connection string **nunca** se guarda en el repo. Se configura una sola vez vía `dotnet user-secrets` (fuera del control de versiones):

```bash
cd kora-health-api/src/Application
dotnet user-secrets set "ConnectionStrings:DefaultConnection" "Host=<tu-host-neon>;Port=5432;Database=kora-health;Username=<user>;Password=<password>;SSL Mode=Require;Channel Binding=Require;Trust Server Certificate=true"
```

> Nota: si usas el endpoint pooled de Neon (el que termina en `-pooler`) para operaciones puntuales como `dotnet ef database update` justo después de un `dotnet ef database drop`, puede fallar por caché de enrutamiento del pooler ("database does not exist"). Si pasa, usa el endpoint directo (sin `-pooler`) para esa operación puntual.

### Aplicar migraciones

```bash
cd kora-health-api
dotnet tool install --global dotnet-ef   # solo la primera vez
dotnet ef database update --project src/Infrastructure/KoraHealth.Api.Infrastructure.csproj --startup-project src/Application/KoraHealth.Api.Application.csproj
```

### Arrancar la API

```bash
cd kora-health-api/src/Application
dotnet run
```

Al arrancar, la API aplica migraciones pendientes automáticamente y siembra el usuario de prueba fijo si no existe. Por defecto escucha en `http://localhost:5001` (perfil `Development` en `launchSettings.json`). Se abre automáticamente el navegador en la UI interactiva de **Swagger** (`/swagger`) para probar los endpoints sin necesidad de Postman/curl.

### CORS

La API solo acepta peticiones de navegador desde los orígenes listados en `Cors:AllowedOrigins`. En desarrollo esa lista está en `kora-health-api/src/Application/appsettings.Development.json` y contiene `http://localhost:4200`, el servidor de desarrollo del cliente. Si sirves el cliente desde otro origen (otro puerto, otra máquina), añádelo ahí; fuera de desarrollo no hay ningún origen permitido por defecto.

### Zona horaria del usuario y día local

Cada usuario tiene una zona horaria guardada en el servidor (identificador IANA). El usuario de prueba recibe `Europe/Madrid` por defecto. «El día» es el día natural en esa zona y lo calcula la API: el historial de agua (`GET /api/water-tracking/history`) agrupa las entradas por el día local del usuario, no por la fecha UTC, y cuenta la ventana de `days` en días locales. Las entradas se siguen guardando como instantes UTC, así que al cambiar de zona el historial se reagrupa sin modificar ningún dato.

La zona se consulta y se cambia en `/api/profile/time-zone`:

```bash
curl -s http://localhost:5001/api/profile/time-zone
```

```bash
curl -s -X PUT http://localhost:5001/api/profile/time-zone -H "Content-Type: application/json" -d '{"timeZoneId":"Europe/Madrid"}'
```

- `200` con `{"timeZoneId":"Europe/Madrid"}` en ambos casos. Una zona conocida escrita con otras mayúsculas (`europe/madrid`) se acepta y se guarda bien escrita.
- `400` con un mensaje de texto si el valor no es un identificador IANA válido (`Foo/Bar`, un identificador de Windows como `Romance Standard Time`, la cadena vacía); la zona anterior se conserva.

### Pruebas del backend

El backend tiene un proyecto de pruebas, `kora-health-api/tests/Application.Tests/` (xUnit), limitado a la lógica de día local, la validación de la zona horaria y el historial de agua. No necesita base de datos ni red:

```bash
cd kora-health-api && dotnet test KoraHealth.Api.slnx
```

## Cliente (`kora-health-client`)

### Requisitos
- Node.js `^22.22.3`, `^24.15.0` o `>=26` (lo que exige Angular 22) y npm.
- La API backend corriendo (ver sección anterior).

Angular CLI no hace falta instalarlo globalmente: los scripts de npm usan el del proyecto, y para lo demás sirve `npx ng ...`.

### Instalar dependencias

```bash
cd kora-health-client
npm install
```

### Ejecutar la app

```bash
cd kora-health-client
npm start
```

Sirve la aplicación en `http://localhost:4200` y recarga al guardar. Está pensada para móvil: en pantallas estrechas la navegación de cinco secciones es una barra flotante abajo, y a partir de 768 px de ancho sube a la cabecera.

### Base visual: temas, acento, iconos y componentes

La aplicación tiene tema claro y oscuro y sigue por defecto el del sistema. Todos los colores, tamaños y duraciones son variables CSS por papel definidas en `src/styles/_tokens.scss` (`--color-bg`, `--color-surface`, `--color-text`, `--color-accent`…); fuera de ese archivo no se escribe ningún color literal. `CLAUDE.md` explica las reglas completas.

- **Catálogo de componentes**: con `npm start`, abre `http://localhost:4200/catalogo`. Muestra cada componente base en todas sus variantes y tiene tres botones para forzar el tema (sistema, claro, oscuro). Solo existe en desarrollo; el build de producción no lo incluye.
- **Probar ambos temas**: cambia el tema del sistema operativo (la aplicación cambia sin recargar), usa los botones del catálogo, o pon a mano `data-theme="dark"` o `data-theme="light"` en `<html>` desde las herramientas del navegador. En Chrome también sirve emular `prefers-color-scheme` en DevTools (panel *Rendering*).
- **Probar otro acento**: en DevTools, añade al `<html>` el estilo en línea `--accent: #3264c8` (o `#b82e8a`, `#217283`): cambian a la vez todos los elementos acentuados. Para que un acento sea elegible de verdad tiene que entrar en la lista `$accents` de `_tokens.scss` tras recalcular la tabla de contraste del design de `ui-foundation`.
- **Añadir un icono**: los iconos son [Phosphor](https://phosphoricons.com) a través de `ng-icons`. Importa el que necesites del peso normal (`@ng-icons/phosphor-icons/regular`, p. ej. `phosphorPlus`) o del relleno (`@ng-icons/phosphor-icons/fill`, `phosphorPlusFill`), regístralo en los `providers` del propio componente con `provideIcons({ phosphorPlus })` y úsalo con `<ng-icon name="phosphorPlus" />`. El tamaño se fija en el SCSS con `--ng-icon__size: var(--size-icon)`; el color es el del texto. Por defecto el icono queda oculto a los lectores de pantalla.
- **Añadir un componente base**: va en `src/app/modules/app-container/shared/components/<nombre>/` con sus cuatro archivos (`.ts`, `.html`, `.scss` y `.spec.ts`), usa solo variables y mixins (`@use 'mixins';`) y se añade al catálogo.

Dependencias de interfaz: `@ng-icons/core` y `@ng-icons/phosphor-icons`, ambas en la versión exacta 36.1.0. No hay librería de componentes: los componentes base son propios.

### URL de la API

La URL base de la API no se fija al compilar: el cliente la lee al arrancar de `kora-health-client/public/assets/config.json`.

```json
{ "apiBaseUrl": "http://localhost:5001" }
```

Para apuntar a otra API basta con editar ese archivo (o el `assets/config.json` ya desplegado) y recargar; no hay que recompilar. Si el archivo falta o no trae `apiBaseUrl`, la aplicación no arranca y muestra el error en pantalla. Recuerda que el origen desde el que sirves el cliente tiene que estar permitido por CORS en la API.

### Compilar, probar y lint

```bash
cd kora-health-client
npm run build                 # compila a dist/kora-health-web
npm test -- --watch=false     # pruebas unitarias (Vitest), una sola ejecución
npx ng lint                   # angular-eslint
```

`npm test` a secas arranca en modo observación cuando se lanza desde una terminal interactiva.
