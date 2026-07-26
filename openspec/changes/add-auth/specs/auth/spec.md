## ADDED Requirements

### Requirement: Autoregistro de usuario
El sistema SHALL permitir que un usuario nuevo se registre mediante un formulario con email y contraseña, creando la identidad que el resto de capabilities (`profile`, `sync`, etc.) referencian.

#### Scenario: Registro exitoso
- **WHEN** un usuario nuevo envía el formulario de registro con un email no utilizado y una contraseña válida
- **THEN** el sistema crea la cuenta, almacena la contraseña con hash (nunca en texto plano) y devuelve una sesión autenticada para ese usuario

#### Scenario: Email ya registrado
- **WHEN** un usuario intenta registrarse con un email que ya tiene una cuenta asociada
- **THEN** el sistema rechaza el registro sin crear una cuenta duplicada

### Requirement: Inicio de sesión
El sistema SHALL permitir que un usuario con una cuenta existente inicie sesión mediante un formulario con email y contraseña.

#### Scenario: Login exitoso
- **WHEN** un usuario envía el formulario de login con las credenciales correctas de una cuenta existente
- **THEN** el sistema valida las credenciales y devuelve una sesión autenticada para ese usuario

#### Scenario: Credenciales incorrectas
- **WHEN** un usuario envía el formulario de login con un email inexistente o una contraseña incorrecta
- **THEN** el sistema rechaza el inicio de sesión sin revelar cuál de los dos datos es incorrecto

### Requirement: Sesión autenticada para peticiones a la API
El sistema SHALL identificar al usuario autor de cada petición a la API mediante la sesión emitida en el registro o login, para que el resto de capabilities puedan asociar datos al usuario correcto.

#### Scenario: Petición autenticada con sesión válida
- **WHEN** el cliente envía una petición a la API incluyendo una sesión válida y no expirada
- **THEN** el sistema identifica al usuario propietario de la sesión y procesa la petición en su nombre

#### Scenario: Petición sin sesión válida
- **WHEN** el cliente envía una petición a un endpoint que requiere autenticación sin incluir una sesión válida, o con una sesión expirada o inválida
- **THEN** el sistema rechaza la petición sin procesarla
