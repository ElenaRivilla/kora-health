# sync Specification

## Purpose
Mantener los datos del usuario usables sin conexión y consistentes entre el dispositivo móvil y el backend: una caché local de 90 días, envío inmediato de los cambios locales, una descarga inicial al iniciar sesión, y una cola de reintentos persistente con entrega idempotente.
## Requirements
### Requirement: Almacenamiento Local sin Conexión
El sistema SHALL almacenar localmente, para cada capacidad que produce datos de usuario (health, nutrition-log, nutrition-goals, water-tracking, recipes, workouts, profile), una ventana móvil con los últimos 90 días de datos de ese usuario, permitiendo que la app siga siendo usable sin conectividad de red.

#### Escenario: Datos disponibles sin conexión
- **CUANDO** el dispositivo no tiene conectividad de red
- **ENTONCES** el usuario puede ver los datos previamente sincronizados de los últimos 90 días y seguir creando nuevas entradas localmente

#### Escenario: Se solicitan datos fuera de la ventana local sin conexión
- **CUANDO** el usuario solicita datos con más de 90 días de antigüedad mientras el dispositivo no tiene conectividad de red
- **ENTONCES** el sistema indica que esos datos no están disponibles sin conexión, en vez de mostrar resultados incompletos o incorrectos

### Requirement: Persistencia Remota
El sistema SHALL persistir la copia autoritativa de los datos del usuario de forma remota, independientemente del almacenamiento local de cualquier dispositivo concreto.

#### Escenario: Los datos sobreviven a la pérdida del almacenamiento local
- **CUANDO** se borra el almacenamiento local de un usuario o se reinstala la app
- **ENTONCES** los datos del usuario siguen disponibles tras iniciar sesión, recuperados desde el almacenamiento remoto

### Requirement: Sincronización Local-Remota
El sistema SHALL intentar sincronizar con el backend cada entrada creada o modificada localmente, en todas las capacidades que producen datos, inmediatamente después de escribirse.

#### Escenario: Entrada sincronizada de inmediato al estar en línea
- **CUANDO** el usuario crea o edita una entrada mientras el dispositivo tiene conectividad de red
- **ENTONCES** el sistema envía esa entrada al backend de inmediato y la marca como sincronizada en cuanto el backend confirma su recepción

#### Escenario: Entradas sin conexión sincronizadas al reconectar
- **CUANDO** se restablece la conectividad después de haber creado entradas sin conexión
- **ENTONCES** el reintento automático del sistema envía las entradas locales pendientes al backend y estas pasan a formar parte del registro remoto

### Requirement: Sincronización Remota Inicial al Iniciar Sesión
El sistema SHALL descargar los últimos 90 días de datos del usuario, de todas las capacidades que producen datos, desde el backend hacia el almacenamiento local cuando el usuario inicia sesión en un dispositivo cuya caché local está vacía o desactualizada.

#### Escenario: Una instalación nueva rellena la caché local
- **CUANDO** el usuario inicia sesión en un dispositivo con la caché local vacía (instalación nueva o reinstalación)
- **ENTONCES** el sistema descarga los últimos 90 días de datos de ese usuario desde el backend al almacenamiento local antes de considerar la app lista para su uso offline-first

### Requirement: Cola de Cambios sin Conexión y Reintentos
El sistema SHALL persistir, en una cola local, cualquier entrada que falle al sincronizarse con el backend, y SHALL reintentar enviarla automáticamente hasta que lo consiga, sobreviviendo a los reinicios de la app.

#### Escenario: Un fallo de sincronización se encola y se reintenta al reconectar
- **CUANDO** una entrada falla al sincronizarse porque el dispositivo no tiene conectividad de red
- **ENTONCES** la entrada permanece en la cola local y el sistema reintenta enviarla automáticamente en cuanto se restablece la conectividad, sin requerir ninguna acción del usuario

#### Escenario: La cola sobrevive a un reinicio de la app
- **CUANDO** la app se reinicia mientras hay entradas pendientes en la cola local
- **ENTONCES** el sistema reanuda el reintento de esas entradas pendientes tras el reinicio

### Requirement: Sincronización Idempotente
El sistema SHALL asignar a cada entrada creada localmente un identificador único generado por el cliente, y SHALL usar ese identificador para evitar que el backend cree un registro duplicado cuando se reintenta un intento de sincronización.

#### Escenario: Un reintento de sincronización no crea un duplicado
- **CUANDO** el sistema reintenta el envío de una entrada cuyo identificador generado por el cliente ya tiene un registro en el backend
- **ENTONCES** el backend reconoce el identificador y no crea un segundo registro para esa entrada
