## Why

El proyecto Kora Health parte de dos documentos de notas (`openspec/specs/initial/ARQUITECTURA.md` y `FUNCIONALIDADES.md`) que describen la app pero no están estructurados como specs verificables. Antes de empezar a implementar necesitamos capabilities formales, con requisitos y escenarios, que sirvan de contrato entre lo que se va a construir y cómo se valida.

## What Changes

- Se crean 11 capabilities nuevas, una por cada área funcional identificada en las notas iniciales, cubriendo los 5 módulos de usuario (Salud, Nutrición, Entrenamientos, Progreso, Perfil) desglosados donde tenía sentido mayor granularidad, más las capabilities transversales de soporte (IA, sincronización, integración HealthKit).
- No se modifica ninguna capability existente (el proyecto no tiene specs previas; `specs/initial/` son notas de origen, no una spec).
- Tras archivar este change, `specs/initial/` puede eliminarse porque su contenido queda representado en las nuevas specs.

## Capabilities

### New Capabilities

- `health`: Sincronización y visualización de métricas de salud (peso, IMC, grasa corporal, masa muscular, FC, HRV, SpO2, sueño, pasos, distancia, calorías, VO2 max), históricos y gráficas de evolución.
- `healthkit-integration`: Reglas de la integración con Apple HealthKit — acceso exclusivo desde la app Flutter, el backend nunca accede directamente a HealthKit, flujo de datos HealthKit → Flutter → API → PostgreSQL.
- `nutrition-log`: Diario nutricional por comida (desayuno/almuerzo/cena/tentempié) y registro de alimentos (manual, por foto, detección por IA) con cálculo automático de calorías y macronutrientes.
- `nutrition-goals`: Configuración de objetivos diarios de calorías y macronutrientes, y cálculo/explicación de la puntuación nutricional diaria con recomendaciones.
- `water-tracking`: Registro de consumo de agua, objetivo diario, registro rápido, historial y estadísticas.
- `recipes`: Guardado y reutilización de recetas propias del usuario.
- `workouts`: Rutinas y ejercicios, registro de series/repeticiones/peso/descanso, PRs, historial y progresión.
- `progress`: Evolución agregada del usuario (peso, corporal, nutricional, deportiva), tendencias, comparativas e informes, incluyendo resúmenes generados por IA.
- `profile`: Datos personales, objetivos, nivel de actividad, configuración de calorías/macros, notificaciones, preferencias y cuenta.
- `ai-assistant`: Capacidades de IA transversales — reconocimiento de alimentos por imagen, estimación de cantidades, explicación de puntuaciones, recomendaciones, resúmenes y respuesta a preguntas con contexto de los datos del usuario.
- `sync`: Almacenamiento local (caché/offline) y remoto, y sincronización entre ambos vía API REST.

### Modified Capabilities

(ninguna — no existen specs previas)

## Impact

- Crea la estructura inicial en `openspec/specs/` que servirá de base para el diseño técnico (Flutter + ASP.NET Core + PostgreSQL) y para las tareas de implementación de cada módulo.
- No afecta código existente (proyecto sin implementación todavía).
- Deja constancia de las dependencias entre capabilities (p. ej. `progress` depende de `health`, `nutrition-log` y `workouts`; todas las capabilities de datos de usuario dependen de `sync`).
