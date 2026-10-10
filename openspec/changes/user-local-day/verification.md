# Informe de verificación — `user-local-day`

Este informe se completa en la sección 4 de `tasks.md`. Las secciones anteriores solo añaden la evidencia que no podrá observarse después.

## Referencia previa

Respuestas de la API con el código sin modificar (`git status --short kora-health-api` vacío, commit `b3cd4ad`), antes de crear ningún archivo de este change. Sirven de referencia para las secciones 1 y 3.

- **Fecha y hora de la consulta**: 2026-10-10T23:01:21Z (2026-10-11 01:01 en `Europe/Madrid`).
- **Instancia consultada**: la API ya estaba en marcha en `http://localhost:5001`, arrancada desde Rider a las 00:36 (hora local) sobre este mismo código; no se arrancó otra copia.

`GET http://localhost:5001/api/water-tracking/history?days=30` → `200`

```json
[{"date":"2026-10-10","totalMl":1800,"goalMl":2750}]
```

`GET http://localhost:5001/api/water-tracking/goal` → `200`

```json
{"dailyGoalMl":2750,"dateUpdated":"2026-10-10T22:03:07.938259Z"}
```

- **Suma de `totalMl`**: 1800 ml, en una única fila (`2026-10-10`, día UTC).
- **Diferencia con lo que esperaba el design**: el design daba por buenas seis entradas que suman 1700 ml. La respuesta real suma 1800 ml, así que hay al menos una entrada más (100 ml) registrada después de la verificación de `migrate-client-to-angular`. La API no ofrece ninguna consulta de entradas individuales, de modo que no se conocen aquí sus instantes; se toma 1800 ml como referencia.

## Sección 1

Evidencia recogida al cerrar la sección 1 de `tasks.md`, contra la API real (Neon), con el usuario de prueba fijo.

### Migración

Al arrancar la API con el código de la sección 1 se aplicó exactamente una migración, `20261010230148_AddUserTimeZone`, sin errores. Su `Up` solo añade la columna `time_zone_id` (`text`, no anulable, valor de relleno `Europe/Madrid`) a `users`; su `Down` solo la elimina.

### Usuario sin zona horaria configurada (tarea 1.16)

Consulta hecha a las 2026-10-10T23:08:31Z, **antes de cualquier `PUT`**. Es la única evidencia posible de este escenario: tras el primer `PUT` ya no puede observarse.

`GET http://localhost:5001/api/profile/time-zone` → `200`

```json
{"timeZoneId":"Europe/Madrid"}
```

Demuestra además que el valor de relleno de la migración es `Europe/Madrid` y no la cadena vacía.

### Cambio de zona y rechazos (tarea 1.17)

Secuencia ejecutada a las 2026-10-10T23:13:46Z, con la API recién arrancada. Tras cada `PUT` se hizo un `GET`.

| `PUT` con `timeZoneId` | Respuesta | `GET` posterior |
|---|---|---|
| `UTC` | `200` `{"timeZoneId":"UTC"}` | `UTC` |
| `Foo/Bar` | `400` «TimeZoneId must be a valid IANA time zone identifier, such as Europe/Madrid.» | `UTC` (sin cambios) |
| `Romance Standard Time` | `400`, mismo mensaje | `UTC` (sin cambios) |
| cadena vacía | `400` «TimeZoneId must not be empty, padded with spaces or longer than 64 characters.» | `UTC` (sin cambios) |
| ` Europe/Madrid ` (con espacios) | `400`, mismo mensaje que la cadena vacía | `UTC` (sin cambios) |
| `us/pacific` (alias mal escrito) | `400` «…valid IANA time zone identifier…» | `UTC` (sin cambios) |
| `europe/madrid` (minúsculas) | `200` `{"timeZoneId":"Europe/Madrid"}` (normalizado) | `Europe/Madrid` |
| `UTC` | `200` | `UTC` |
| `Europe/Madrid` | `200` `{"timeZoneId":"Europe/Madrid"}` | `Europe/Madrid` |

La zona del usuario de prueba queda en `Europe/Madrid`.

### `water-tracking` intacto (tarea 1.18)

Con la zona en `Europe/Madrid`, a las 2026-10-10T23:13:49Z (mismo día UTC que la referencia previa):

- `GET /api/water-tracking/history?days=30` → `[{"date":"2026-10-10","totalMl":1800,"goalMl":2750}]`
- `GET /api/water-tracking/goal` → `{"dailyGoalMl":2750,"dateUpdated":"2026-10-10T22:03:07.938259Z"}`

Ambas respuestas son idénticas a la «Referencia previa»: todavía se agrupa por día UTC porque nadie usa aún la zona.

### Desviación respecto a la decisión 3 del design

La validación descrita en el design (buscar con `TryFindSystemTimeZoneById`, exigir `HasIanaId` y guardar el `Id` devuelto) se implementó primero al pie de la letra y falló en real:

- `PUT` con `europe/madrid` guardó `europe/madrid`, sin normalizar: .NET devuelve como `Id` la grafía con la que se le pregunta por primera vez.
- Después, `PUT` con `Europe/Madrid` (bien escrito) también guardó `europe/madrid`: .NET conserva en memoria la primera grafía de cada zona y la reutiliza hasta que el proceso se reinicia.

El design lo había verificado con un programa que consultaba antes la grafía correcta, y por eso no lo vio. Durante unos segundos la base tuvo `europe/madrid`; se reinició la API y se restauró `Europe/Madrid`.

Corrección aprobada por la autora y ya aplicada en `TimeZoneValidator`: la grafía se decide **antes** de pedir la zona al sistema.

- Si el valor coincide, sin distinguir mayúsculas, con una zona de la lista del sistema (`TimeZoneInfo.GetSystemTimeZones()`), se usa la grafía de la lista: `europe/madrid` se guarda como `Europe/Madrid`.
- Si no está en la lista (alias como `Europe/Kiev`, `US/Pacific`, `Etc/UTC`, `CET`), solo se acepta con su grafía exacta, comprobada con `TimeZoneInfo.TryConvertIanaIdToWindowsId`, que distingue mayúsculas. Mal escrito, se rechaza.
- Se mantiene la exigencia de `HasIanaId`, y lo que se guarda es la grafía ya decidida, no el `Id` devuelto.

Consecuencia para la sección 2: las pruebas de la validación (2.8) deben cubrir además una zona de la lista escrita en minúsculas (se normaliza), un alias mal escrito (se rechaza) y que una grafía incorrecta no altera el resultado de una petición posterior bien escrita. Solo verificado en macOS.

## Sección 3

Evidencia recogida al cerrar la sección 3 de `tasks.md` (tarea 3.6), contra la API real (Neon). Solo lecturas: no se hizo ningún `PUT` ni `POST`.

- **Zona del usuario de prueba**: `GET /api/profile/time-zone` → `200` `{"timeZoneId":"Europe/Madrid"}`, antes y después.
- **Antes** (código de la sección 2, commit `36a0ef8`, consulta a las 2026-10-10T23:28:00Z): `GET /api/water-tracking/history?days=30` → `200`

```json
[{"date":"2026-10-10","totalMl":1800,"goalMl":2750}]
```

- **Después** (con `WaterTrackingService` agrupando por día local, consulta a las 2026-10-10T23:29:03Z, 01:29 del día 11 en `Europe/Madrid`): la misma petición → `200`

```json
[{"date":"2026-10-11","totalMl":950,"goalMl":2750},{"date":"2026-10-10","totalMl":850,"goalMl":2750}]
```

- **Suma**: 950 + 850 = 1800 ml, la de la «Referencia previa». La forma de cada fila (`date`, `totalMl`, `goalMl`) y el formato `YYYY-MM-DD` no cambian; el orden sigue siendo de más reciente a más antiguo.
- **Ventana**: con `days=1` la respuesta es solo la fila `2026-10-11` (el día local actual, cuando en UTC todavía era día 10); con `days=2`, las dos filas.

Reparto de las entradas. La API no ofrece ninguna consulta de entradas individuales, así que sus instantes no se leen de la base: se toman de los informes de `migrate-client-to-angular` y el reparto se razona con ellos.

| Fila | Entradas | Instante (UTC) | Día en `Europe/Madrid` (UTC+2) |
|---|---|---|---|
| `2026-10-10`, 850 ml | 100 + 250 + 500 ml, de la sección 3 de `migrate-client-to-angular` | hacia las 19:50 del 2026-10-10 | 21:50 del día 10 |
| `2026-10-11`, 950 ml | 100 + 250 + 500 ml, de la verificación end-to-end de `migrate-client-to-angular` | entre las 22:00 y las 22:05 del 2026-10-10 | pasadas las 00:00 del día 11 |
| | 100 ml, la entrada adicional detectada en la «Referencia previa» | no conocido; posterior a esa verificación | día 11 |

La entrada adicional de 100 ml no figura en ningún informe. Su instante se **deduce**, no se ha observado: las tres entradas de las 19:50Z suman exactamente los 850 ml de la fila del día 10, de modo que la adicional solo puede estar en la fila del día 11, es decir, se registró a las 22:00Z o después. Es coherente con que apareciera después de la verificación de `migrate-client-to-angular`, que terminó hacia las 22:05Z.

