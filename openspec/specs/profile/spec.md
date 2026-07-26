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
