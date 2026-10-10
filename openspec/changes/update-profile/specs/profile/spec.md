## MODIFIED Requirements

### Requirement: Gestión de Datos Personales
El sistema SHALL permitir al usuario ver y editar sus datos personales: nombre de usuario, email, edad, sexo, peso y altura. Los objetivos de calorías y macronutrientes no forman parte de estos datos personales y se gestionan mediante el requirement de configuración de calorías y macronutrientes.

#### Escenario: Datos personales actualizados
- **CUANDO** el usuario edita sus datos personales (nombre de usuario, email, edad, sexo, peso o altura) y guarda
- **ENTONCES** el sistema persiste los valores actualizados asociados a la cuenta del usuario

## ADDED Requirements

### Requirement: Sincronización de Peso con HealthKit
El sistema SHALL permitir al usuario introducir su peso manualmente desde el perfil, y SHALL actualizar automáticamente ese peso cuando `health` reciba una nueva medición de peso obtenida de HealthKit, quedando en `profile` siempre el valor de la medición más reciente independientemente de su origen.

#### Escenario: Peso introducido manualmente
- **CUANDO** el usuario introduce un peso manualmente en su perfil
- **ENTONCES** el sistema almacena ese valor como el peso vigente del usuario

#### Escenario: Peso actualizado desde HealthKit
- **CUANDO** `health` recibe una nueva medición de peso proveniente de HealthKit posterior al último valor conocido
- **ENTONCES** el sistema actualiza el peso vigente en el perfil del usuario con esa medición

### Requirement: Edición del Perfil Requiere Conexión
El sistema SHALL requerir conexión de red para editar cualquier dato del perfil; `profile` no admite escritura offline.

#### Escenario: Edición sin conexión bloqueada
- **CUANDO** el usuario intenta editar su perfil sin conexión de red
- **ENTONCES** el sistema impide guardar los cambios hasta que se restablezca la conexión
