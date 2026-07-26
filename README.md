# Kora Health

Kora Health es una app personal de seguimiento de salud, nutrición y entrenamientos: métricas de salud (sincronizadas desde Apple HealthKit), diario nutricional con reconocimiento de alimentos por IA, objetivos de calorías/macros, hidratación, entrenamientos, progreso agregado y un asistente de IA transversal.

El proyecto sigue un flujo **spec-driven** con [OpenSpec](https://github.com/) — las especificaciones funcionales viven en `openspec/specs/` (en español) y son la fuente de verdad de qué se debe construir. Ver `CLAUDE.md` para más detalle sobre esa convención.

**Stack:**
- **Cliente**: Flutter (Dart), Riverpod (estado), Dio (HTTP), Drift/SQLite (caché local, todavía sin tablas de módulo).
- **Backend**: ASP.NET Core Web API (.NET), Entity Framework Core + Npgsql, arquitectura en 4 proyectos (Domain / Application / Infrastructure / Common).
- **Base de datos**: PostgreSQL gestionado en [Neon](https://neon.tech).

**Estado actual**: sin autenticación real todavía — el backend opera contra un único usuario de prueba fijo y sembrado (`dev-test-user`, id `1`), ver capability `auth`. Módulo piloto implementado de extremo a extremo: `water-tracking`.

## Estructura del repositorio

```
kora-health/
├── openspec/              # Specs (fuente de verdad) y changes (propuestas)
├── kora-health-api/       # Backend ASP.NET Core
│   └── src/
│       ├── Domain/            # Modelos EF, contratos (interfaces), DTOs de dominio
│       ├── Application/       # Proyecto host (Program.cs, Controllers, Services, DTOs de API, AutoMapper)
│       ├── Infrastructure/    # DbContext, repositorios EF Core
│       └── Common/            # Vacío por ahora
└── kora-health-client/    # Cliente Flutter
    └── lib/
        ├── core/               # Infraestructura transversal: cliente Dio, config de entorno, base Drift (sin tablas todavía)
        ├── shared/             # Vacío por ahora (widgets/utilidades compartidas entre features)
        ├── providers/          # Providers Riverpod globales (ApiClient, AppDatabase)
        ├── services/           # Vacío por ahora
        ├── repositories/       # Vacío por ahora (repositorios genéricos, no ligados a un feature)
        ├── models/             # Vacío por ahora (modelos genéricos, no ligados a un feature)
        ├── features/           # Módulos por funcionalidad, cada uno en capas Data / Application / Presentation
        │   └── water_tracking/     # Único módulo piloto implementado de extremo a extremo
        │       ├── data/               # Modelos de API y repositorio (llamadas Dio al backend)
        │       ├── application/        # Providers/controllers Riverpod del feature
        │       └── presentation/       # Pantallas y widgets
        └── main.dart           # Entry point (ProviderScope + navegación a las pantallas de water-tracking)
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
dotnet ef database update --project src/Infrastructure/KoraHealth.Infrastructure.csproj --startup-project src/Application/KoraHealth.Application.csproj
```

### Arrancar la API

```bash
cd kora-health-api/src/Application
dotnet run
```

Al arrancar, la API aplica migraciones pendientes automáticamente y siembra el usuario de prueba fijo si no existe. Por defecto escucha en `http://localhost:5001` (perfil `Development` en `launchSettings.json`). Se abre automáticamente el navegador en la UI interactiva de **Scalar** (`/scalar/v1`) para probar los endpoints sin necesidad de Postman/curl.

## Cliente (`kora-health-client`)

### Requisitos
- Flutter SDK (instalado en esta máquina en `C:\flutter`, clonado del repo oficial en la rama `stable`).
- La API backend corriendo (ver sección anterior).

### Instalar dependencias

```bash
cd kora-health-client
flutter pub get
```

### Ejecutar la app

La URL de la API se pasa por variable de entorno de compilación (`API_BASE_URL`), **y cambia según dónde corra el cliente**:

| Destino | Comando | URL de la API |
|---|---|---|
| Chrome | `flutter run -d chrome --dart-define=API_BASE_URL=http://localhost:5001` | `localhost` funciona tal cual |
| Edge | `flutter run -d edge --dart-define=API_BASE_URL=http://localhost:5001` | `localhost` funciona tal cual |
| Otro navegador (p. ej. Opera GX) | `flutter run -d web-server --web-port=8080 --dart-define=API_BASE_URL=http://localhost:5001` y luego abrir `http://localhost:8080` manualmente en ese navegador | `localhost` funciona tal cual |
| Emulador Android | `flutter run -d emulator-5554 --dart-define=API_BASE_URL=http://10.0.2.2:5001` | **`10.0.2.2`**, no `localhost` — el emulador tiene su propia red virtual y `10.0.2.2` es la dirección especial que apunta al `localhost` de la máquina anfitriona |
| Windows desktop | `flutter run -d windows --dart-define=API_BASE_URL=http://localhost:5001` | `localhost` funciona, pero requiere el workload "Desktop development with C++" de Visual Studio instalado (no incluido por defecto) |

Ajusta el puerto al que realmente esté escuchando tu instancia de `dotnet run`.

### Ver la lista de dispositivos/emuladores disponibles

```bash
flutter devices      # dispositivos/navegadores ya conectados
flutter emulators    # emuladores Android creados (arrancar con: flutter emulators --launch <id>)
```

### Ejecutar en un dispositivo distinto a Chrome/Edge (p. ej. Opera GX)

Flutter no detecta Opera GX como dispositivo porque busca navegadores concretos (Chrome, Edge). La solución es usar `-d web-server`, que sirve la app en un puerto local sin abrir ningún navegador, y abrir esa URL tú manualmente en el navegador que prefieras (ver tabla arriba). Con `web-server` no hay hot reload automático al guardar — pulsa `r` en la terminal donde corre `flutter run` para forzar un hot restart y luego recarga la pestaña.
