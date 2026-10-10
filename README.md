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
        ├── styles.scss         # Estilos globales
        └── app/
            ├── app.config.ts       # Proveedores globales (router, cliente HTTP, carga de config.json)
            ├── app.routes.ts       # Rutas: /salud, /nutricion, /entrenamiento, /progreso, /perfil
            ├── modules/app-container/  # Pantallas por funcionalidad
            │   ├── home/               # Armazón: cabecera, navegación de cinco secciones y contenido
            │   ├── nutrition/          # Única sección con contenido: hidratación (water-tracking)
            │   ├── health/ workouts/ progress/ profile/   # Páginas vacías por ahora
            │   └── shared/             # Componentes compartidos entre secciones
            ├── services/           # Acceso a datos (base-http.service.ts, water-tracking.service.ts)
            └── shared/             # Configuración, DTOs y helpers transversales
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

Sirve la aplicación en `http://localhost:4200` y recarga al guardar. Está pensada para móvil: en pantallas estrechas la navegación de cinco secciones queda abajo, y a partir de 768 px de ancho sube a la cabecera.

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
