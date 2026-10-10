## 1. Backend - Modelo y almacenamiento

> Nota para 1.1 y 1.2 (tras `user-local-day`): `UserEntity` (`src/Domain/Entities/User/UserEntity.cs`) y la tabla `users` ya existen, con `Username` y `TimeZoneId`. Estas dos tareas deben ampliar la entidad y la tabla existentes con los campos de autenticación, no crearlas. Quien se registre recibe la zona por defecto (`TimeZoneDefaults.DefaultTimeZoneId`) y cualquier zona que venga de fuera pasa por `TimeZoneValidator.TryNormalize`; si el registro debe pedirla o proponerla es una pregunta abierta del design.

- [ ] 1.1 Definir la entidad de usuario (email, hash de contraseña, fecha de creación) en `Entities/`
- [ ] 1.2 Crear la migración de Entity Framework Core para la tabla de usuarios en PostgreSQL
- [ ] 1.3 Integrar un algoritmo de hash de contraseña con salt (bcrypt/Argon2) en la capa de `Services/`

## 2. Backend - Registro y login

- [ ] 2.1 Implementar el endpoint de registro (`POST /auth/register`): valida email no duplicado, crea el usuario con la contraseña hasheada
- [ ] 2.2 Implementar el endpoint de login (`POST /auth/login`): valida credenciales contra el hash almacenado
- [ ] 2.3 Emitir un JWT firmado al completar registro o login, con expiración configurable
- [ ] 2.4 Añadir middleware de autenticación que valide el JWT en las peticiones a endpoints protegidos y exponga el usuario autenticado al resto de `Controllers/`
- [ ] 2.5 Añadir DTOs de request/response para registro y login en `DTOs/`

## 3. Cliente Angular - Formularios y sesión

Requiere que `migrate-client-to-angular` esté aplicado. Las rutas `src/...` son relativas a `kora-health-client/`.

- [ ] 3.1 Crear la pantalla/formulario de registro (email, contraseña) como componente standalone bajo `src/app/modules/app-container/`, en la sección de `profile` o en una sección `auth` dedicada, con su ruta en `src/app/app.routes.ts`
- [ ] 3.2 Crear la pantalla/formulario de login (email, contraseña), con su ruta
- [ ] 3.3 Crear el servicio de autenticación (extiende `BaseHttpService`) con las llamadas a `POST /auth/register` y `POST /auth/login`, y sus DTOs en `src/app/shared/entities/DTOS/`. La ubicación de este servicio y del de sesión la decide este change
- [ ] 3.4 Crear el servicio de sesión que conserva el JWT recibido y un interceptor HTTP, registrado en `src/app/app.config.ts`, que lo adjunta como cabecera `Authorization` en las siguientes peticiones REST. Dónde se guarda el token en el navegador depende de la pregunta abierta del design; no implementar hasta resolverla
- [ ] 3.5 Crear un `authGuard` y aplicarlo a la ruta raíz de `src/app/app.routes.ts`, de modo que las secciones exijan sesión y las pantallas de registro y login queden fuera. Su ubicación la decide este change
- [ ] 3.6 Manejar los errores de registro (email duplicado) y login (credenciales incorrectas) mostrando feedback al usuario
- [ ] 3.7 Añadir la cabecera `Authorization` a las cabeceras permitidas por la política de CORS de la API (`Program.cs`), que hoy solo admite `Content-Type`

## 4. Validación

- [ ] 4.1 Pruebas de backend: registro exitoso, registro con email duplicado, login exitoso, login con credenciales incorrectas
- [ ] 4.2 Pruebas de backend: petición a endpoint protegido con JWT válido, expirado e inválido
- [ ] 4.3 Ejecutar `openspec validate add-auth --strict` antes de archivar el change
