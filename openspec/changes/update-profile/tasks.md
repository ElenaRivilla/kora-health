## 1. Backend - Modelo de datos

- [ ] 1.1 Añadir los campos username, edad, sexo, peso, altura a la entidad de perfil en `Entities/` (email ya se comparte con la identidad de `auth`)
- [ ] 1.2 Crear/actualizar la migración de Entity Framework Core para los nuevos campos en PostgreSQL
- [ ] 1.3 Actualizar los DTOs de perfil (`DTOs/`) para exponer y validar estos campos

## 2. Backend - Endpoints de perfil

- [ ] 2.1 Actualizar el endpoint de edición de perfil para validar y persistir los nuevos campos
- [ ] 2.2 Añadir el endpoint/mecanismo interno mediante el cual `health` actualiza el peso vigente de `profile` al recibir una nueva medición de HealthKit
- [ ] 2.3 Aplicar la regla "la medición más reciente por fecha gana" al actualizar el peso, sea cual sea su origen (manual o HealthKit)

## 3. Flutter - Edición de perfil

- [ ] 3.1 Actualizar el formulario de perfil para incluir username, edad, sexo, peso y altura
- [ ] 3.2 Bloquear el guardado de cambios de perfil cuando no haya conexión de red, mostrando el motivo al usuario
- [ ] 3.3 Reflejar en la UI el peso vigente cuando se actualice automáticamente desde una medición de HealthKit

## 4. Validación

- [ ] 4.1 Pruebas de backend: edición de datos personales con los nuevos campos, actualización de peso desde HealthKit posterior a un peso manual y viceversa
- [ ] 4.2 Pruebas de backend: intento de edición de perfil sin conexión queda bloqueado en el cliente (o rechazado por el backend si se fuerza la petición)
- [ ] 4.3 Ejecutar `openspec validate update-profile --strict` antes de archivar el change
