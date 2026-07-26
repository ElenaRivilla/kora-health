## Why

El requirement actual de "Personal Data Management" en `profile` no especifica qué campos forman los datos personales, lo que deja ambigüedad de cara a implementación y a otras capabilities que dependen de ellos (p. ej. `nutrition-goals` necesita edad/sexo/peso/altura para calcular objetivos). Además, el peso es un dato que puede llegar tanto de forma manual como desde HealthKit (vía `health`), y hoy no hay ningún requirement que defina cómo se concilian ambas fuentes. Por último, falta definir si editar el perfil requiere conexión, dado que `profile` no participa en escritura offline como otras capabilities.

## What Changes

- Se concreta el requirement "Personal Data Management" de `profile` con los campos exactos: nombre de usuario, email, edad, sexo, peso y altura. Los objetivos de calorías/macronutrientes permanecen en `nutrition-goals`/su requirement dedicado en `profile`, sin duplicarse aquí.
- Se añade un nuevo requirement: el peso se puede introducir manualmente desde `profile`, y se actualiza automáticamente cuando `health` registra una nueva medición de peso obtenida de HealthKit.
- Se añade un nuevo requirement: la edición del perfil requiere conexión — no hay escritura offline de `profile`, a diferencia de otras capabilities que sí soportan edición local vía `sync`.
- No se modifican los requirements de "Goals and Activity Level Configuration", "Calorie and Macronutrient Configuration", "HealthKit Sync Preference" ni "Notifications and Preferences".
- "Account Management" se mantiene sin cambios en este change; su solapamiento con la nueva capability `auth` (ver change `add-auth`) queda como pregunta abierta para un change futuro.

## Capabilities

### New Capabilities
(ninguna)

### Modified Capabilities
- `profile`: se concreta "Personal Data Management" con los campos exactos (username, email, edad, sexo, peso, altura); se añade el requirement de entrada manual de peso y actualización automática desde `health`/HealthKit; se añade el requirement de que la edición del perfil requiere conexión.

## Impact

- Modelo de datos de `profile` en el backend (Entities/DTOs) pasa a tener campos explícitos.
- Flujo nuevo entre `health` y `profile`: cuando `health` recibe una medición de peso desde HealthKit, debe propagar el nuevo valor al perfil del usuario.
- El cliente Flutter no debe permitir editar `profile` sin conexión (a diferencia de otras pantallas que sí cachean cambios offline vía Drift).
