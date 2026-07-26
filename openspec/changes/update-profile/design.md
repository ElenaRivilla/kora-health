## Context

`profile` es una capability fundacional (`openspec/specs/profile/spec.md`) de la que dependen `nutrition-goals` (edad/sexo/peso/altura para cálculo de objetivos) y `healthkit-integration` (preferencia de sincronización). Hoy "Personal Data Management" no enumera campos, y no existe ningún requirement sobre cómo se concilia el peso introducido manualmente con el peso que llega de HealthKit a través de `health`. Tampoco está definido si `profile` participa en la escritura offline que sí soportan otras capabilities vía `sync`.

## Goals / Non-Goals

**Goals:**
- Concretar los campos de "Personal Data Management": username, email, edad, sexo, peso, altura.
- Definir que el peso admite dos orígenes — entrada manual del usuario y actualización automática desde `health` cuando llega una nueva medición de HealthKit — y que la medición más reciente (de cualquier origen) es el valor vigente en `profile`.
- Definir que la edición del perfil requiere conexión (sin escritura offline).

**Non-Goals:**
- No se define aquí el algoritmo de cálculo de objetivos calóricos/macros (eso vive en `nutrition-goals`).
- No se resuelve en este change el solapamiento entre "Account Management" de `profile` y la nueva capability `auth` (change `add-auth`) — queda como pregunta abierta.
- No se modela un histórico de peso dentro de `profile`: el histórico de mediciones vive en `health`; `profile` solo expone el valor vigente.

## Decisions

- **`profile.peso` es el valor vigente, no un histórico**: `health` es quien mantiene el histórico de mediciones (ese es su propósito declarado). `profile` solo necesita el dato actual para casos como el cálculo de objetivos en `nutrition-goals`. Alternativa descartada: que `profile` mantenga su propio historial de peso, lo que duplicaría responsabilidad con `health`.
- **Última medición gana, sin importar el origen**: si el usuario introduce un peso manualmente y después llega una medición más reciente de HealthKit (o viceversa), la más reciente por fecha sustituye a la anterior como valor vigente de `profile`. Se evita así una regla de prioridad de origen (manual vs. HealthKit) que añadiría complejidad sin necesidad clara.
- **Edición de perfil requiere conexión**: a diferencia de otras capabilities que cachean cambios localmente vía Drift y sincronizan al reconectar, `profile` es un registro único por usuario y de bajo volumen de escritura; forzar conexión evita tener que resolver conflictos de última hora en un dato compartido por múltiples capabilities dependientes. Alternativa descartada: permitir edición offline con "el timestamp más reciente gana", descartada por simplicidad y porque ya se decidió explícitamente que la edición requiere conexión.
- **`health` es quien empuja el nuevo peso a `profile`** (no `profile` quien lo consulta bajo demanda): cuando `health` recibe una medición de HealthKit, actualiza el valor vigente en `profile`. Esto introduce una dependencia de escritura de `health` hacia `profile` que no existía antes (hasta ahora las dependencias entre capabilities eran solo de lectura de configuración). Se documenta explícitamente aquí porque es una excepción al patrón habitual.

## Risks / Trade-offs

- [Nueva dependencia de escritura `health` → `profile` introduce acoplamiento que no sigue el patrón habitual de "profile es fuente, no destino"] → Mitigación: documentarlo explícitamente como excepción en la spec de `profile`, y revisar en `health`/`healthkit-integration` que el flujo de escritura hacia `profile` quede igualmente documentado cuando se especifique ese lado.
- [Exigir conexión para editar el perfil frustra al usuario sin red] → Mitigación aceptada como decisión consciente dado el bajo volumen de escritura de este dato; se puede revisar en un change futuro si resulta un problema real de UX.
- [Ambigüedad sobre qué pasa si `health` y el usuario escriben un peso casi simultáneamente] → Mitigación: la regla "la medición más reciente por fecha gana" cubre el caso general; no se prevé para este change un mecanismo de resolución de conflictos más fino.

## Open Questions

- ¿Cómo se resuelve el solapamiento entre "Account Management" de `profile` y la nueva capability `auth`? Queda pendiente de un change futuro.
- ¿Debe `profile` exponer también la fecha/origen de la última medición de peso, o solo el valor?
