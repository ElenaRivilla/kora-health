# healthkit-integration Specification

## Purpose
Definir las reglas arquitectónicas de cómo entran en el sistema los datos de Apple HealthKit: leídos exclusivamente por la aplicación cliente en el dispositivo iOS del usuario, nunca accedidos directamente por el backend, y reenviados a la API solo cuando el usuario lo ha activado.

## Requirements

### Requirement: Acceso a HealthKit Restringido al Cliente Móvil
El sistema SHALL acceder a Apple HealthKit exclusivamente desde la aplicación cliente ejecutándose en el dispositivo iOS del usuario. El backend SHALL NOT acceder a HealthKit directamente, bajo ninguna circunstancia.

#### Escenario: El backend no tiene ninguna vía de acceso a HealthKit
- **CUANDO** el backend necesita datos de salud originados en HealthKit
- **ENTONCES** los obtiene únicamente a través de solicitudes enviadas por la aplicación cliente, nunca mediante una conexión directa a HealthKit

### Requirement: Flujo de Datos de HealthKit
El sistema SHALL mover los datos de HealthKit por la ruta fija: los datos del dispositivo HealthKit son leídos por la aplicación cliente ejecutándose en el dispositivo iOS del usuario, enviados a la API del backend por HTTP, y persistidos en PostgreSQL.

#### Escenario: Una lectura de HealthKit llega al almacenamiento
- **CUANDO** la aplicación cliente lee un nuevo valor de HealthKit
- **ENTONCES** la aplicación cliente envía ese valor a la API del backend, y el backend lo persiste en PostgreSQL

### Requirement: Sincronización de HealthKit Controlada por el Usuario
El sistema SHALL leer datos de HealthKit únicamente cuando el usuario ha activado la sincronización con HealthKit para su cuenta.

#### Escenario: Sincronización desactivada
- **CUANDO** un usuario no ha activado la sincronización con HealthKit
- **ENTONCES** la aplicación cliente no lee ni envía datos de HealthKit en nombre de ese usuario
