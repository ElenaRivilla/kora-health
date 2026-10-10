# profile Specification

## Purpose
Permitir al usuario gestionar sus datos personales, objetivos, nivel de actividad, configuración de calorías/macros, preferencia de sincronización con HealthKit, notificaciones, preferencias y cuenta.

## Requirements

### Requirement: Gestión de Datos Personales
El sistema SHALL permitir al usuario ver y editar sus datos personales.

#### Escenario: Datos personales actualizados
- **CUANDO** el usuario edita sus datos personales y guarda
- **ENTONCES** el sistema persiste los valores actualizados asociados a la cuenta del usuario

### Requirement: Configuración de Objetivos y Nivel de Actividad
El sistema SHALL permitir al usuario configurar sus objetivos y su nivel de actividad.

#### Escenario: Nivel de actividad establecido
- **CUANDO** el usuario selecciona un nivel de actividad y un objetivo
- **ENTONCES** el sistema almacena esta configuración y la pone a disposición de otras capacidades que dependen de ella (p. ej. `nutrition-goals`)

### Requirement: Configuración de Calorías y Macronutrientes
El sistema SHALL permitir al usuario configurar sus ajustes de calorías y macronutrientes desde su perfil.

#### Escenario: Configuración actualizada desde el perfil
- **CUANDO** el usuario actualiza su configuración de calorías o macronutrientes en el perfil
- **ENTONCES** el sistema persiste el cambio y este se refleja en `nutrition-goals`

### Requirement: Preferencia de Sincronización con HealthKit
El sistema SHALL permitir al usuario activar o desactivar la sincronización con HealthKit desde su perfil.

#### Escenario: Sincronización desactivada
- **CUANDO** el usuario desactiva la sincronización con HealthKit en su perfil
- **ENTONCES** el sistema almacena la preferencia para que `healthkit-integration` deje de leer datos de HealthKit para ese usuario

### Requirement: Notificaciones y Preferencias
El sistema SHALL permitir al usuario configurar los ajustes de notificaciones y preferencias generales.

#### Escenario: Preferencia de notificación modificada
- **CUANDO** el usuario desactiva una categoría de notificaciones
- **ENTONCES** el sistema deja de enviar notificaciones de esa categoría a ese usuario

### Requirement: Gestión de Cuenta
El sistema SHALL permitir al usuario gestionar su cuenta, incluyendo los ajustes a nivel de cuenta vinculados a su identidad en el sistema.

#### Escenario: Ajustes de cuenta consultados
- **CUANDO** el usuario abre los ajustes de cuenta
- **ENTONCES** el sistema muestra la información de la cuenta vinculada a su identidad

### Requirement: Zona Horaria del Usuario
El sistema SHALL almacenar en el servidor una zona horaria para cada usuario, expresada como identificador IANA (p. ej. `Europe/Madrid`), y SHALL aplicar una zona horaria por defecto mientras el usuario no haya configurado la suya. El sistema SHALL permitir al usuario consultar y cambiar su zona horaria, y SHALL NOT aceptar un valor que no sea un identificador de zona horaria válido.

#### Escenario: Zona horaria configurada
- **CUANDO** el usuario establece una zona horaria válida (p. ej. `Europe/Madrid`)
- **ENTONCES** el sistema la almacena asociada a su cuenta y la devuelve en las consultas posteriores de su zona horaria

#### Escenario: Usuario sin zona horaria configurada
- **CUANDO** se consulta la zona horaria de un usuario que nunca ha configurado una
- **ENTONCES** el sistema devuelve la zona horaria por defecto y la usa como zona horaria de ese usuario a todos los efectos

#### Escenario: Zona horaria no válida rechazada
- **CUANDO** el usuario intenta establecer un valor que no corresponde a un identificador de zona horaria válido
- **ENTONCES** el sistema rechaza el cambio indicando el motivo y conserva la zona horaria que el usuario tenía hasta ese momento

### Requirement: Día Local del Usuario Calculado en el Servidor
El sistema SHALL considerar «el día» de un usuario como el día natural en la zona horaria de ese usuario, y SHALL calcular en el servidor los límites de cada día (su inicio y su fin) a partir de esa zona horaria. Toda capacidad que agrupe o totalice datos por día SHALL usar este día local, y el sistema SHALL NOT depender de la fecha UTC ni de un cálculo hecho por el cliente para decidir a qué día pertenece un dato.

#### Escenario: Acción realizada pasada la medianoche local
- **CUANDO** un usuario con zona horaria `Europe/Madrid` realiza una acción poco después de su medianoche local, en un instante en el que en UTC todavía es el día anterior
- **ENTONCES** el sistema atribuye esa acción al nuevo día local del usuario y no al día anterior

#### Escenario: Límites del día determinados por el servidor
- **CUANDO** el cliente solicita datos del día actual sin indicar qué fecha es ni dónde empieza o termina el día
- **ENTONCES** el servidor determina cuál es el día actual del usuario y sus límites a partir de la zona horaria almacenada para ese usuario
