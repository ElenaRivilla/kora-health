## 1. Scaffolding del cliente (kora-health-client)

- [ ] 1.1 Crear proyecto Flutter en `kora-health-client/` (`flutter create`)
- [ ] 1.2 Añadir dependencias: `flutter_riverpod`, `dio`, `drift` (+ `drift_dev`, `build_runner`)
- [ ] 1.3 Crear estructura de carpetas: `lib/core`, `lib/shared`, `lib/features`, `lib/services`, `lib/repositories`, `lib/models`, `lib/providers`
- [ ] 1.4 Configurar cliente Dio base (URL de la API vía configuración de entorno)
- [ ] 1.5 Configurar base de datos Drift base (sin tablas de módulo todavía)

## 2. Scaffolding del backend (kora-health-api)

- [x] 2.1 Crear proyecto ASP.NET Core Web API en `kora-health-api/`
- [x] 2.2 Añadir Entity Framework Core + Npgsql, configurar `DbContext` apuntando a PostgreSQL
- [x] 2.3 Crear estructura de carpetas: `Controllers/`, `Services/`, `Repositories/`, `Entities/`, `DTOs/`, `Mappings/`, `Infrastructure/`, `Authentication/` (placeholder vacío)
- [x] 2.4 Documentar cómo conectar a PostgreSQL (Neon, connection string en `dotnet user-secrets`, no en el repo)
- [x] 2.5 Crear entidad `User` mínima y sembrar un usuario de prueba fijo (id conocido) al arrancar

## 3. Módulo piloto: water-tracking (backend)

- [x] 3.1 Crear entidad `WaterEntry` (usuario, cantidad, fecha/hora) y `WaterGoal` (usuario, objetivo diario)
- [x] 3.2 Migración de EF Core para las tablas anteriores
- [ ] 3.3 Endpoint para configurar/obtener el objetivo diario de agua (cumple "Daily Water Goal")
- [ ] 3.4 Endpoint para registrar consumo de agua (cumple "Quick Water Logging")
- [ ] 3.5 Endpoint para consultar historial y estadísticas de agua (cumple "Water History and Statistics")

## 4. Módulo piloto: water-tracking (cliente)

- [ ] 4.1 Modelo y repositorio de water-tracking (llamadas Dio a los endpoints del backend)
- [ ] 4.2 Providers Riverpod para objetivo diario, registro rápido e historial
- [ ] 4.3 Pantalla para configurar el objetivo diario
- [ ] 4.4 Pantalla/acción de registro rápido de consumo de agua
- [ ] 4.5 Pantalla de historial y estadísticas de agua

## 5. Verificación end-to-end

- [ ] 5.1 Verificar manualmente los 3 escenarios de `openspec/specs/water-tracking/spec.md` contra el backend real (objetivo configurado, registro rápido, historial)
- [ ] 5.2 Confirmar que el cliente funciona contra la API local con el usuario de prueba fijo
