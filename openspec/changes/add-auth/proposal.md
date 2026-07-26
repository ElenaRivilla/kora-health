## Why

Kora Health no dispone de ninguna capability que defina cómo un usuario obtiene una identidad en el sistema. `profile` ya asume la existencia de una cuenta ("Account Management") y otras capabilities (`sync`, `nutrition-goals`, etc.) dependen de que los datos estén asociados a un usuario identificado, pero el registro y el login nunca se han especificado. Antes de detallar cómo `profile` gestiona el perfil de un usuario ya autenticado, hace falta definir cómo ese usuario se da de alta y accede al sistema.

## What Changes

- Se crea la capability `auth`, que cubre el autoregistro de usuarios y el login mediante formulario (email + contraseña).
- El autoregistro crea la identidad de usuario que el resto de capabilities (`profile`, `sync`, etc.) referencian.
- El login valida credenciales y establece una sesión autenticada para las siguientes peticiones a la API.
- No se modifica ninguna capability existente en este change; la revisión de "Account Management" en `profile` para evitar solapamiento con `auth` se abordará en un change posterior específico de `profile`.

## Capabilities

### New Capabilities
- `auth`: Autoregistro de usuarios mediante formulario, login mediante formulario, y gestión de la sesión autenticada que identifica al usuario en el resto de capabilities.

### Modified Capabilities
(ninguna en este change)

## Impact

- Nuevo dominio de identidad de usuario (cuenta, credenciales, sesión) del que pasan a depender `profile` y, transitivamente, cualquier capability que persista datos por usuario.
- Requiere almacenamiento seguro de credenciales (hash de contraseña) en el backend.
- Los endpoints de la API que hoy asumen un usuario ya identificado pasarán a depender de la sesión/token emitidos por `auth`.
