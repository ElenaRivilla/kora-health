## ADDED Requirements

### Requirement: Autoregistro de Usuario
El sistema SHALL permitir que un usuario nuevo se registre mediante un formulario con email y contraseña, creando la identidad que el resto de capabilities (`profile`, `sync`, etc.) referencian.

#### Escenario: Registro exitoso
- **CUANDO** un usuario nuevo envía el formulario de registro con un email no utilizado y una contraseña válida
- **ENTONCES** el sistema crea la cuenta, almacena la contraseña con hash (nunca en texto plano) y devuelve una sesión autenticada para ese usuario

#### Escenario: Email ya registrado
- **CUANDO** un usuario intenta registrarse con un email que ya tiene una cuenta asociada
- **ENTONCES** el sistema rechaza el registro sin crear una cuenta duplicada

### Requirement: Inicio de Sesión
El sistema SHALL permitir que un usuario con una cuenta existente inicie sesión mediante un formulario con email y contraseña.

#### Escenario: Login exitoso
- **CUANDO** un usuario envía el formulario de login con las credenciales correctas de una cuenta existente
- **ENTONCES** el sistema valida las credenciales y devuelve una sesión autenticada para ese usuario

#### Escenario: Credenciales incorrectas
- **CUANDO** un usuario envía el formulario de login con un email inexistente o una contraseña incorrecta
- **ENTONCES** el sistema rechaza el inicio de sesión sin revelar cuál de los dos datos es incorrecto

### Requirement: Sesión Autenticada para Peticiones a la API
El sistema SHALL identificar al usuario autor de cada petición a la API mediante la sesión emitida en el registro o login, para que el resto de capabilities puedan asociar datos al usuario correcto.

#### Escenario: Petición autenticada con sesión válida
- **CUANDO** el cliente envía una petición a la API incluyendo una sesión válida y no expirada
- **ENTONCES** el sistema identifica al usuario propietario de la sesión y procesa la petición en su nombre

#### Escenario: Petición sin sesión válida
- **CUANDO** el cliente envía una petición a un endpoint que requiere autenticación sin incluir una sesión válida, o con una sesión expirada o inválida
- **ENTONCES** el sistema rechaza la petición sin procesarla
