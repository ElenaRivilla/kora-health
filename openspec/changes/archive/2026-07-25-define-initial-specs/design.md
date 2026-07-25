## Context

Kora Health parte de dos documentos de notas (`openspec/specs/initial/ARQUITECTURA.md` y `FUNCIONALIDADES.md`) que ya fijan la pila tecnológica y la arquitectura de referencia:

- Cliente móvil: Flutter/Dart, Riverpod, Dio, Drift (SQLite local).
- Backend: ASP.NET Core Web API, Entity Framework Core, PostgreSQL.
- Capas: Controllers → Services → Repositories → EF Core → PostgreSQL en el backend; Presentation → Application → Data en el cliente.
- HealthKit accesible únicamente desde Flutter; el backend nunca la toca directamente.
- La IA se consume desde el backend, que reenvía al proveedor de IA correspondiente.
- No hay código ni specs previos: este change es fundacional.

Este documento no re-explica esa arquitectura (queda documentada en `ARQUITECTURA.md`); se centra en las decisiones tomadas al **dividir las notas en 11 capabilities** y en cómo esas capabilities se relacionan entre sí de cara a la implementación futura.

## Goals / Non-Goals

**Goals:**
- Establecer 11 specs independientes y testeables que cubran íntegramente lo descrito en `FUNCIONALIDADES.md`.
- Dejar explícitas las dependencias entre capabilities para que las fases de implementación respeten el orden correcto.
- Servir de base para que `openspec/specs/initial/` pueda retirarse una vez archivado este change.

**Non-Goals:**
- No se diseña aquí el esquema de base de datos, los endpoints REST concretos ni la estructura de carpetas del código — eso corresponde a los changes de implementación de cada capability.
- No se cubren funcionalidades futuras (Android/Health Connect, app web, wearables): quedan fuera de alcance según `ARQUITECTURA.md` y `FUNCIONALIDADES.md`.
- No se detalla aquí la integración concreta con Gemini 2.5 Flash (prompts, contratos de request/response) — eso corresponde al change de implementación de `ai-assistant`.
- No se define una estrategia de resolución de conflictos multi-dispositivo para `sync` en esta fase; se asume un dispositivo activo por usuario.

## Decisions

**Una capability por área con comportamiento propio, en vez de 5 módulos monolíticos.**
Nutrición se dividió en `nutrition-log`, `nutrition-goals`, `water-tracking` y `recipes` porque cada una tiene reglas y ciclo de vida propios (registro diario vs. configuración de objetivos vs. hidratación vs. recetas reutilizables). Alternativa considerada: una única spec `nutrition` — descartada porque mezclaría requisitos con motivos de cambio distintos, dificultando deltas futuros aislados.

**`healthkit-integration` separada de `health`.**
`health` describe qué métricas existen y cómo se visualizan; `healthkit-integration` describe una regla de arquitectura con impacto en comportamiento observable (el backend nunca accede a HealthKit, el flujo de datos es unidireccional desde Flutter). Mantenerlas separadas permite versionar la regla de integración sin tocar la spec de métricas, y viceversa.

**`ai-assistant` como capability transversal única, no repetida en cada módulo.**
Aunque la IA se usa desde nutrición, entrenamientos y progreso, sus requisitos (reconocimiento de imagen, explicaciones, recomendaciones, Q&A contextual) son consistentes independientemente del módulo que los invoque. Se modela como una capability de soporte que las demás consumen, en vez de duplicar requisitos de IA dentro de `nutrition-log`, `workouts` y `progress`.

**`sync` como capability transversal única.**
La sincronización local/remota (Drift + PostgreSQL vía REST) aplica igual a todos los módulos de datos de usuario. Se define una vez en `sync` en lugar de repetir requisitos de "funciona offline" en cada spec.

**`progress` depende explícitamente de `health`, `nutrition-log`, `nutrition-goals` y `workouts`.**
No introduce sus propias métricas: agrega y compara datos que ya existen en otras capabilities. Esto se refleja en los requisitos de `progress`, que referencian esas capabilities en vez de redefinir sus datos.

## Risks / Trade-offs

- **Riesgo**: la granularidad fina (11 specs) puede sentirse como sobre-fragmentación para un equipo pequeño → **Mitigación**: las capabilities pequeñas (`water-tracking`, `recipes`) tienen alcance deliberadamente acotado; si en la práctica siempre se implementan juntas, se pueden fusionar en un change futuro sin perder historial (OpenSpec permite deltas de fusión).
- **Riesgo**: `ai-assistant` y `sync` al ser transversales pueden generar ambigüedad sobre "quién es responsable" cuando se implementen los módulos que las consumen → **Mitigación**: cada capability consumidora (p. ej. `nutrition-log` para reconocimiento de fotos) debe referenciar explícitamente el requisito de `ai-assistant` que usa, en su propio design.md de implementación.
- **Riesgo**: al no existir specs previas, no hay forma de validar estas specs contra código real todavía → **Mitigación**: se tratan como punto de partida vivo; se espera que se ajusten con `openspec-update-change` en cuanto arranque la implementación de cada módulo y aparezcan detalles no previstos en las notas iniciales.

## Open Questions

Resueltas durante la revisión de `tasks.md` (sección 3):

- **`water-tracking` y `recipes`**: se mantienen como specs independientes de `nutrition-log`. Cada una conserva su ciclo de vida propio (hidratación y recetas no dependen del diario de comidas).
- **Proveedor de IA para `ai-assistant`**: Gemini 2.5 Flash. Es una decisión de implementación (HOW), por lo que no se refleja en los requisitos de `ai-assistant/spec.md` (que permanecen agnósticos de proveedor); se aplicará en el design.md del change que implemente `ai-assistant` (llamadas a la API de Gemini, límites de tamaño de imagen/tasa, manejo de coste y latencia).
- **`sync` y resolución de conflictos multi-dispositivo**: no se aborda en esta fase. Se asume un dispositivo activo por usuario por ahora; queda como no-goal explícito (ver sección Goals / Non-Goals) hasta que exista un caso de uso multi-dispositivo real.
