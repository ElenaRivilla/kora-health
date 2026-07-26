## 1. Backend - Modelo y almacenamiento

- [ ] 1.1 Definir la entidad de usuario (email, hash de contraseña, fecha de creación) en `Entities/`
- [ ] 1.2 Crear la migración de Entity Framework Core para la tabla de usuarios en PostgreSQL
- [ ] 1.3 Integrar un algoritmo de hash de contraseña con salt (bcrypt/Argon2) en la capa de `Services/`

## 2. Backend - Registro y login

- [ ] 2.1 Implementar el endpoint de registro (`POST /auth/register`): valida email no duplicado, crea el usuario con la contraseña hasheada
- [ ] 2.2 Implementar el endpoint de login (`POST /auth/login`): valida credenciales contra el hash almacenado
- [ ] 2.3 Emitir un JWT firmado al completar registro o login, con expiración configurable
- [ ] 2.4 Añadir middleware de autenticación que valide el JWT en las peticiones a endpoints protegidos y exponga el usuario autenticado al resto de `Controllers/`
- [ ] 2.5 Añadir DTOs de request/response para registro y login en `DTOs/`

## 3. Flutter - Formularios y sesión

- [ ] 3.1 Crear la pantalla/formulario de registro (email, contraseña) en el módulo de `profile` o un módulo `auth` dedicado
- [ ] 3.2 Crear la pantalla/formulario de login (email, contraseña)
- [ ] 3.3 Implementar las llamadas a `POST /auth/register` y `POST /auth/login` desde el cliente Dio
- [ ] 3.4 Almacenar el JWT recibido de forma segura en el dispositivo y adjuntarlo como cabecera `Authorization` en las siguientes peticiones REST
- [ ] 3.5 Manejar los errores de registro (email duplicado) y login (credenciales incorrectas) mostrando feedback al usuario

## 4. Validación

- [ ] 4.1 Pruebas de backend: registro exitoso, registro con email duplicado, login exitoso, login con credenciales incorrectas
- [ ] 4.2 Pruebas de backend: petición a endpoint protegido con JWT válido, expirado e inválido
- [ ] 4.3 Ejecutar `openspec validate add-auth --strict` antes de archivar el change
