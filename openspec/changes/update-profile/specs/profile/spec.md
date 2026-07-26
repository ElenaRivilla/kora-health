## MODIFIED Requirements

### Requirement: Personal Data Management
El sistema SHALL permitir al usuario ver y editar sus datos personales: nombre de usuario, email, edad, sexo, peso y altura. Los objetivos de calorías y macronutrientes no forman parte de estos datos personales y se gestionan mediante el requirement de configuración de calorías y macronutrientes.

#### Scenario: Datos personales actualizados
- **WHEN** el usuario edita sus datos personales (nombre de usuario, email, edad, sexo, peso o altura) y guarda
- **THEN** el sistema persiste los valores actualizados contra la cuenta del usuario

## ADDED Requirements

### Requirement: Sincronización de peso con HealthKit
El sistema SHALL permitir al usuario introducir su peso manualmente desde el perfil, y SHALL actualizar automáticamente ese peso cuando `health` reciba una nueva medición de peso obtenida de HealthKit, quedando en `profile` siempre el valor de la medición más reciente independientemente de su origen.

#### Scenario: Peso introducido manualmente
- **WHEN** el usuario introduce un peso manualmente en su perfil
- **THEN** el sistema almacena ese valor como el peso vigente del usuario

#### Scenario: Peso actualizado desde HealthKit
- **WHEN** `health` recibe una nueva medición de peso proveniente de HealthKit posterior al último valor conocido
- **THEN** el sistema actualiza el peso vigente en el perfil del usuario con esa medición

### Requirement: Edición del perfil requiere conexión
El sistema SHALL requerir conexión de red para editar cualquier dato del perfil; `profile` no admite escritura offline.

#### Scenario: Edición sin conexión bloqueada
- **WHEN** el usuario intenta editar su perfil sin conexión de red
- **THEN** el sistema impide guardar los cambios hasta que se restablezca la conexión
