## ADDED Requirements

### Requirement: Usuario Fijo de Desarrollo
Hasta que exista autenticación real, el sistema SHALL operar contra un único usuario fijo, pre-sembrado, y SHALL atribuir cada solicitud a la API a ese usuario sin requerir credenciales.

#### Escenario: Solicitud atribuida al usuario sembrado
- **CUANDO** cualquier solicitud del cliente llega al backend
- **ENTONCES** el backend la procesa como perteneciente al usuario fijo sembrado, sin comprobar credenciales

### Requirement: Alcance Temporal
Esta capability SHALL ser reemplazada por completo en cuanto se introduzca una capability de autenticación real (login, credenciales, identidad multiusuario); SHALL NOT ser extendida con usuarios adicionales o gestión de credenciales.

#### Escenario: Se introduce autenticación real
- **CUANDO** se añade al sistema una capability de autenticación real
- **ENTONCES** este comportamiento de usuario fijo se elimina en vez de combinarse con el login real
