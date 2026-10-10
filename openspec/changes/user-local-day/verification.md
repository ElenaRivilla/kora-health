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


## Sección 4: verificación end-to-end

Verificación de la sección 4 de `tasks.md` contra la API real (Neon), con el usuario de prueba fijo, siguiendo los ocho pasos de la decisión 10 del design.

### Entorno

| Dato | Valor |
|---|---|
| Fecha y hora | 2026-10-10T23:36Z a 23:37Z (01:36–01:37 del 2026-10-11 en `Europe/Madrid`) |
| Rama y commit | `feature/user-local-day`, `fef168b` |
| SDK de .NET | 10.0.401 |
| xUnit | 2.9.3 (`xunit.runner.visualstudio` 3.1.4) |
| Sistema operativo | macOS 26.3 (arm64). **Solo se ha verificado en macOS** |
| API | `http://localhost:5001`, entorno `Development`; al arrancar no aplicó ninguna migración |
| Cliente | `http://localhost:4200`, servidor de desarrollo de Angular |

La verificación coincidió con la madrugada en `Europe/Madrid`: era día 11 en hora local y todavía día 10 en UTC. Por eso el paso 7 pudo observar en real una entrada registrada pasada la medianoche local.

### Los ocho pasos de la decisión 10

| Paso | Qué | Resultado |
|---|---|---|
| 1 | Referencia con día UTC | Cumple. Recogida en «Referencia previa»: una fila, `2026-10-10`, 1800 ml |
| 2 | `Europe/Madrid`: dos filas | Cumple |
| 3 | `UTC`: vuelve la fila única | Cumple |
| 4 | Zona muy adelantada y zona atrasada | Cumple |
| 5 | Ventana de un día en dos zonas con «hoy» distinto | Cumple |
| 6 | Rechazos de zonas no válidas | Cumple |
| 7 | Entrada nueva en el día local actual | Cumple |
| 8 | Zona restaurada a `Europe/Madrid` | Cumple |

#### Pasos 2 a 4: el historial se reagrupa con la zona (tarea 4.2)

Consultas hechas a las 2026-10-10T23:37:08Z. Tras cada `PUT /api/profile/time-zone` (todos `200`), un `GET` confirmó la zona y se pidió `GET /api/water-tracking/history?days=30`:

| Zona del usuario | Historial devuelto | Suma |
|---|---|---|
| `Europe/Madrid` (partida) | `[{"date":"2026-10-11","totalMl":950,"goalMl":2750},{"date":"2026-10-10","totalMl":850,"goalMl":2750}]` | 1800 ml |
| `UTC` | `[{"date":"2026-10-10","totalMl":1800,"goalMl":2750}]` | 1800 ml |
| `Pacific/Kiritimati` (UTC+14) | `[{"date":"2026-10-11","totalMl":1800,"goalMl":2750}]` | 1800 ml |
| `America/Los_Angeles` (UTC−7) | `[{"date":"2026-10-10","totalMl":1800,"goalMl":2750}]` | 1800 ml |

Las mismas entradas cambian de día según la zona y la suma no varía: no se pierde ni se duplica ninguna, y los instantes almacenados no se modifican (al volver a `Europe/Madrid` reaparece el reparto 950 / 850).

#### Paso 5: la ventana se cuenta en días locales (tarea 4.3)

A las 2026-10-10T23:37:09Z era 2026-10-11 13:37 en `Pacific/Kiritimati` y 2026-10-10 12:37 en `Pacific/Pago_Pago`. La petición `GET /api/water-tracking/history?days=1` no indica fecha ni límites:

| Zona del usuario | «Hoy» en esa zona | Respuesta con `days=1` |
|---|---|---|
| `Pacific/Kiritimati` | 2026-10-11 | `[{"date":"2026-10-11","totalMl":1800,"goalMl":2750}]` |
| `Pacific/Pago_Pago` | 2026-10-10 | `[{"date":"2026-10-10","totalMl":1800,"goalMl":2750}]` |

En cada caso la única fila es la del día local actual de esa zona. Es el servidor quien decide qué día es hoy y dónde empieza.

#### Paso 6: rechazos (tarea 4.4)

Con la zona en `Pacific/Pago_Pago`, a las 2026-10-10T23:37:10Z:

| `PUT` con `timeZoneId` | Respuesta | `GET` posterior |
|---|---|---|
| `Foo/Bar` | `400` «TimeZoneId must be a valid IANA time zone identifier, such as Europe/Madrid.» | `Pacific/Pago_Pago` (sin cambios) |
| `Romance Standard Time` | `400`, mismo mensaje | `Pacific/Pago_Pago` (sin cambios) |
| cadena vacía | `400` «TimeZoneId must not be empty, padded with spaces or longer than 64 characters.» | `Pacific/Pago_Pago` (sin cambios) |

#### Paso 7: entrada nueva (tarea 4.5)

Con la zona de nuevo en `Europe/Madrid`, en `http://localhost:4200/nutricion`:

- Antes: la pantalla mostraba `2026-10-11` con `950 ml / 2750 ml` y `2026-10-10` con `850 ml / 2750 ml`.
- Se pulsó una vez el botón `+100 ml`. Peticiones observadas: preflight `OPTIONS /api/water-tracking/entries` → `204`, `POST /api/water-tracking/entries` → `200` y `GET /api/water-tracking/history?days=30` → `200`. Consola del navegador sin errores.
- Después, sin recargar (leído a las 2026-10-10T23:37:21Z): `2026-10-11` con `1050 ml / 2750 ml`; `2026-10-10` sigue en `850 ml / 2750 ml`.

El total del día local actual subió exactamente 100 ml y ninguna otra fila cambió. La pantalla muestra las fechas tal como las envía la API (`YYYY-MM-DD`), sin convertirlas.

La entrada se registró a las 23:37 UTC del día 10, es decir, a la 01:37 del día 11 en `Europe/Madrid`: pasada la medianoche local y con UTC todavía en el día anterior. Se sumó al día 11 y el día 10 no cambió, que es lo que pide el escenario «Entrada registrada de madrugada». Con el código anterior a este change (agrupación por fecha UTC) habría caído en el día 10; eso no se comprobó de nuevo cambiando la zona a `UTC` después de registrarla, porque no estaba en la lista de escrituras aprobada, pero se deduce del instante de la entrada.

#### Paso 8: zona restaurada (tarea 4.6)

A las 2026-10-10T23:37:28Z: `PUT` con `Europe/Madrid` → `200`; `GET /api/profile/time-zone` → `{"timeZoneId":"Europe/Madrid"}`. API y cliente detenidos después.

### Resultado por escenario

Diez escenarios: cinco del delta de `profile` y cinco del delta de `water-tracking`.

| Capability | Escenario | Estado | Evidencia |
|---|---|---|---|
| `profile` | Zona horaria configurada | Verificado contra la API real | Tareas 4.2 y 1.17: cada `PUT` válido se devuelve en el `GET` posterior |
| `profile` | Usuario sin zona horaria configurada | Verificado contra la API real | Tarea 1.16, antes del primer `PUT` (ya no es observable después) |
| `profile` | Zona horaria no válida rechazada | Verificado contra la API real | Tareas 4.4 y 1.17 |
| `profile` | Acción realizada pasada la medianoche local | Verificado contra la API real | Tarea 4.5 (entrada a la 01:37 local, 23:37 UTC del día anterior) y, sobre entradas ya existentes, tareas 3.6 y 4.2 |
| `profile` | Límites del día determinados por el servidor | Verificado contra la API real | Tarea 4.3 |
| `water-tracking` | Entrada rápida registrada | Verificado contra la API real | Tarea 4.5 |
| `water-tracking` | Entrada registrada de madrugada | Verificado contra la API real | Tarea 4.5. Observación única, 97 minutos después de la medianoche local; el instante exacto de la medianoche lo cubre solo la prueba `GetLocalDay_AroundMadridMidnight_ReturnsTheLocalDay` |
| `water-tracking` | Consultar el historial de agua | Parcial: totales diarios verificados contra la API real; **estadísticas resumidas no cubiertas** | Tareas 4.2 y 4.5 para los totales. Las estadísticas no existen ni en la API ni en el cliente: carencia heredada, fuera del alcance de este change |
| `water-tracking` | Cada entrada se agrupa en su día local | Verificado contra la API real | Tareas 3.6 y 4.2 (reparto 950 / 850 en `Europe/Madrid`) |
| `water-tracking` | Historial reagrupado al cambiar de zona horaria | Verificado contra la API real | Tarea 4.2 |

### Cubierto solo por prueba automática

No se ha observado en real y no debe leerse como verificado contra la API:

| Comportamiento | Prueba que lo cubre |
|---|---|
| Día de 25 horas (cambio de hora de otoño) | `GetUtcRange_DayWhenClocksGoBack_Lasts25Hours` |
| Día de 23 horas (cambio de hora de primavera) | `GetUtcRange_DayWhenClocksGoForward_Lasts23Hours` |
| Rango de varios días que cruza un cambio de hora | `GetUtcRange_SeveralDaysAcrossAClockChange_IsNotAMultipleOf24Hours` |
| Medianoche inexistente (`America/Havana`, 2026-03-08) | `GetUtcRange_MidnightThatDoesNotExist_StartsAtTheClockJump` |
| Medianoche que ocurre dos veces | `GetUtcRange_MidnightThatHappensTwice_StartsAtTheFirstOne` |
| Instantes justo antes y justo después de la medianoche local | `GetLocalDay_AroundMadridMidnight_ReturnsTheLocalDay` y `GetHistoryAsync_EntriesAroundLocalMidnight_FallOnTwoLocalDays` |
| Zona almacenada que deja de resolverse | `GetCalendarAsync_StoredTimeZoneThatCannotBeResolved_FallsBackToTheDefaultAndWarns` |
| Entradas anteriores a la ventana descartadas | `GetHistoryAsync_EntriesBeforeTheWindow_AreDroppedEvenIfTheRepositoryReturnsThem` |
| Una grafía incorrecta no contamina peticiones posteriores | `TryNormalize_AfterAWronglyCasedZone_StillReturnsTheRightSpelling` y `TryNormalize_AfterAWronglyCasedAlias_StillAcceptsTheRightSpelling` (el fallo original sí se vio en real en la sección 1) |

### Límites de esta verificación

- Solo macOS. La lista de zonas del sistema, los alias disponibles y el trato de mayúsculas pueden variar en Linux y en Windows.
- La base tiene dos días de datos; no se ha visto en real un historial más largo ni un día sin entradas entre dos con entradas.
- La API no permite consultar entradas individuales: los instantes de las entradas anteriores se toman de informes previos, salvo el de la entrada de la tarea 4.5, que se registró durante esta verificación.

### Escrituras en la base durante la sección 4

Todas sobre el usuario de prueba (id 1), aprobadas antes por la autora:

| # | Escritura |
|---|---|
| 1 | Zona → `UTC` |
| 2 | Zona → `Pacific/Kiritimati` |
| 3 | Zona → `America/Los_Angeles` |
| 4 | Zona → `Pacific/Kiritimati` |
| 5 | Zona → `Pacific/Pago_Pago` |
| 6 | Zona → `Europe/Madrid` |
| 7 | Entrada de agua de 100 ml (botón `+100 ml`), a las 2026-10-10T23:37Z |
| 8 | Zona → `Europe/Madrid` (ya lo estaba) |

Los tres `PUT` rechazados no escribieron nada. Estado final: zona `Europe/Madrid`; historial `2026-10-11` con 1050 ml y `2026-10-10` con 850 ml (1900 ml en total); objetivo sin tocar, 2750 ml.
