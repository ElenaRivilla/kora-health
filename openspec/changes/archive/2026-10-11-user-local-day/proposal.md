# Proposal

## Why

La API decide a qué día pertenece cada entrada de agua usando la fecha UTC. Para una usuaria en España, lo que se registra entre las 00:00 y las 02:00 (01:00 en invierno) se suma al día anterior, y el «total del día actual» no coincide con su día real. Se detectó en la verificación end-to-end de `migrate-client-to-angular`. Conviene corregirlo ahora, con un solo módulo implementado, para que `nutrition-log`, `workouts` y el resto nazcan ya con la regla correcta en vez de copiar el patrón actual.

## What Changes

- Cada usuario pasa a tener una **zona horaria** (identificador IANA, por ejemplo `Europe/Madrid`) guardada en el servidor. El usuario de prueba fijo recibe un valor por defecto.
- La API ofrece una forma mínima de **consultar y cambiar** la zona horaria del usuario. No se añade pantalla en el cliente: la edición de perfil completa pertenece al change `update-profile`.
- Se establece la regla transversal de que **«el día» es el día natural en la zona horaria del usuario**, calculado en el servidor.
- `water-tracking` aplica esa regla: el total del día actual y la agrupación del historial usan el día local del usuario, y la ventana de «últimos N días» se cuenta en días locales.
- Las entradas se siguen almacenando como instantes en UTC; solo cambia cómo se agrupan. No hay migración de datos existentes: el historial se recalcula solo al consultarlo.

### Fuera de alcance

- Estadísticas resumidas de hidratación y conservación del objetivo de cada día (change posterior, que depende de este).
- Detectar o proponer automáticamente la zona horaria desde el navegador.
- Pantalla de perfil o cualquier interfaz para cambiar la zona horaria.
- Aplicar la regla a módulos que aún no están implementados (la adoptarán al implementarse).

## Capabilities

### New Capabilities

(ninguna)

### Modified Capabilities

- `profile`: se añade un requirement para la zona horaria del usuario (se almacena, tiene valor por defecto, se puede consultar y cambiar, y solo admite zonas válidas) y la regla de que los límites del día se calculan en el servidor con esa zona.
- `water-tracking`: los requirements «Registro Rápido de Agua» e «Historial y Estadísticas de Agua» pasan a definir «el día» como el día local del usuario, con escenarios para una entrada registrada de madrugada.

## Impact

- **Backend**: campo nuevo en la entidad de usuario y su migración de EF Core; valor por defecto en el sembrado del usuario de prueba; endpoint mínimo para leer y cambiar la zona horaria; `WaterTrackingService` deja de usar la fecha UTC para agrupar y para calcular la ventana del historial.
- **Pruebas**: se introduce un proyecto de pruebas mínimo en el backend, limitado a la lógica de día local, la validación de la zona horaria y el historial de agua. `README.md` y `CLAUDE.md`, que hoy dicen que el backend no tiene pruebas, se actualizan.
- **API**: endpoints nuevos para la zona horaria. El contrato de `/api/water-tracking` no cambia de forma; cambia el significado de la fecha de cada día del historial (día local en vez de día UTC).
- **Cliente**: sin cambios previstos de comportamiento; muestra las fechas tal como llegan. Se revisará que no asuma UTC en ningún punto.
- **Datos existentes**: las entradas de prueba del 2026-10-10 registradas pasada la medianoche local pasarán a mostrarse en el 2026-10-11.
- **Changes en curso**: `update-profile` modifica otro requirement de `profile` («Gestión de Datos Personales»); no entra en conflicto, pero deberá decidir si la zona horaria se edita desde su formulario.
