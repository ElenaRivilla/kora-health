## Context

Kora Health no tiene hoy ninguna capability que defina cómo se crea o autentica un usuario. La arquitectura planeada es Flutter (Dart) → ASP.NET Core Web API → PostgreSQL (`openspec/specs/initial/ARQUITECTURA.md`), sin backend intermedio adicional, así que `auth` vive en el backend y expone endpoints REST consumidos por Flutter. `profile`, `sync` y el resto de capabilities asumen una identidad de usuario ya existente contra la que persistir datos.

## Goals / Non-Goals

**Goals:**
- Permitir que un usuario nuevo se autoregistre mediante un formulario (email + contraseña).
- Permitir que un usuario existente inicie sesión mediante un formulario (email + contraseña).
- Emitir una sesión autenticada que el resto de la API pueda usar para identificar al usuario en cada petición.
- Almacenar las credenciales de forma segura (contraseña con hash, nunca en texto plano).

**Non-Goals:**
- Login social / OAuth con proveedores externos (Google, Apple, etc.).
- Recuperación o reseteo de contraseña.
- Verificación de email.
- Autenticación multifactor.
- Gestión de roles o permisos (autorización granular) — este change cubre autenticación, no autorización.

## Decisions

- **Formulario email + contraseña como único método**: es el mecanismo más simple que desbloquea el resto de capabilities (todas dependen de tener un usuario identificado), y coincide con lo pedido. Login social queda fuera para no ampliar el alcance.
- **Sesión basada en token (JWT) emitido por el backend tras un login o registro exitoso**: Flutter almacena el token y lo envía en la cabecera `Authorization` en las siguientes peticiones REST. Alternativa descartada: sesiones con estado (cookies + almacenamiento de sesión en servidor), que añaden complejidad de infraestructura innecesaria para un API REST sin servidor de sesión compartido.
- **Contraseñas almacenadas con hash + salt (algoritmo tipo bcrypt/Argon2)**: nunca se persiste la contraseña en texto plano. Es un requisito de seguridad mínimo, no una preferencia.
- **`auth` como capability fundacional**: junto a `profile` y `sync`, es una dependencia implícita del resto del sistema (cualquier dato por usuario necesita una identidad de `auth`). No se modela como dependencia explícita en cada spec porque sería redundante — se documenta aquí como decisión transversal.

## Risks / Trade-offs

- [Contraseñas comprometidas por un algoritmo de hash débil] → Mitigación: usar un algoritmo de hash lento y con salt (bcrypt/Argon2), nunca hash rápido tipo SHA-256 puro.
- [Robo de token JWT (XSS, interceptación en tránsito)] → Mitigación: HTTPS obligatorio en todas las llamadas, expiración corta del token; la estrategia de renovación (refresh token) queda como pregunta abierta.
- [Ausencia de recuperación de contraseña bloquea a usuarios que la olvidan] → Aceptado como no-goal explícito de este change; se abordará en un change posterior.

## Migration Plan

No aplica: no existe implementación previa de autenticación en el proyecto (spec-only). Este change introduce la capability desde cero.

## Open Questions

- ¿Duración de expiración del JWT y estrategia de renovación (refresh token) o simplemente re-login al expirar?
- ¿Cuándo se abordará la recuperación de contraseña y la verificación de email — change inmediato siguiente o más adelante?
- ¿`profile`, al consumir `auth`, necesita algún dato adicional del registro (username) más allá del email, o el username se gestiona por separado en `profile`?
