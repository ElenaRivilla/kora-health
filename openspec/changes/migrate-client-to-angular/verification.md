# Informe de verificación end-to-end — `water-tracking` en el cliente Angular

Verificación de la sección 4 de `tasks.md`: el cliente Angular (`kora-health-web/`) contra la API real (`kora-health-api`, base de datos PostgreSQL en Neon), escenario a escenario de `openspec/specs/water-tracking/spec.md`.

## Entorno

| Dato | Valor |
|---|---|
| Fecha | 2026-10-11 (hora local, CEST); 2026-10-10 22:00–22:05 en UTC |
| Rama y commit | `feature/migrate-client-to-angular`, `2a33535` |
| `@angular/core` | 22.2.2 |
| Node | v24.21.0 |
| Runner de pruebas | Vitest 5.0.3 (builder `@angular/build:unit-test`) |
| API | `http://localhost:5001`, entorno `Development`, usuario de prueba fijo (id `1`) |
| Cliente | `http://localhost:4200`, servidor de desarrollo de Angular |
| Navegador | panel de navegador de la sesión, sin errores de consola en ningún paso |

Estado de la base al empezar: objetivo de 2750 ml e historial con un único día, `2026-10-10`, con 850 ml.

## Resultado por escenario

| Requirement | Escenario | Resultado |
|---|---|---|
| Objetivo Diario de Agua | Objetivo configurado | **Cumple** (con una salvedad, ver abajo) |
| Registro Rápido de Agua | Entrada rápida registrada | **Cumple** |
| Historial y Estadísticas de Agua | Consultar el historial de agua | **Parcialmente cubierto**: totales diarios sí; estadísticas resumidas **no cubiertas** (carencia heredada) |

### Objetivo configurado — cumple

- En `/nutricion` se escribió `3000` en «Nuevo objetivo (ml)» y se pulsó «Guardar objetivo». La pantalla pasó de «Objetivo actual: 2750 ml» a «Objetivo actual: 3000 ml» sin recargar.
- Peticiones observadas: preflight `OPTIONS /api/water-tracking/goal` → 204, `PUT /api/water-tracking/goal` → 200, y a continuación `GET /goal` y `GET /history?days=30` → 200.
- Tras recargar la página, sigue mostrando «Objetivo actual: 3000 ml». `GET /api/water-tracking/goal` devolvió `{"dailyGoalMl":3000,...}`.
- El historial lo usa como referencia del progreso: la fila del día pasó de `850 ml / 2750 ml` a `850 ml / 3000 ml`, y la API devolvió `"goalMl":3000` para ese día.
- **Salvedad**: la parte «lo usa para seguir el progreso los días siguientes» solo se ha podido comprobar sobre el día que ya existía. No se ha observado un cambio de día real con el objetivo ya guardado.
- **No visto en real**: el texto «Sin objetivo configurado todavía» (caso sin objetivo, respuesta `404`), porque la base ya tenía un objetivo y la API no permite borrarlo. Está cubierto solo por prueba unitaria.

### Entrada rápida registrada — cumple

Cada botón registra con una sola pulsación y el total del día sube exactamente esa cantidad, sin recargar la página:

| Acción | Total del día antes | Total del día después | Diferencia |
|---|---|---|---|
| `+100 ml` | 850 ml | 950 ml | +100 |
| `+250 ml` | 950 ml | 1200 ml | +250 |
| `+500 ml` | 1200 ml | 1700 ml | +500 |

Cada pulsación produjo un `POST /api/water-tracking/entries` → 200 seguido de un `GET /history?days=30` → 200. El total se leyó de la pantalla un segundo después de cada pulsación.

### Consultar el historial de agua — parcialmente cubierto

**Totales diarios: cumple.** La vista mostró `2026-10-10` con `1700 ml / 3000 ml`, y `GET /api/water-tracking/history?days=30` devolvió `[{"date":"2026-10-10","totalMl":1700,"goalMl":3000}]`: misma fecha, mismo total y mismo objetivo. Limitación de la prueba: la base solo contiene un día, así que no se ha visto en real una lista de varios días ni su orden.

**Estadísticas resumidas: NO CUBIERTAS.** Comprobado de hecho:

- La respuesta de `GET /history` es una lista de `{ date, totalMl, goalMl }` y nada más; no trae medias, rachas, porcentajes ni ningún otro agregado.
- La pantalla de Nutrición no muestra ninguna estadística: solo el objetivo, los tres botones y la lista de días.
- El cliente Flutter tampoco las muestra (`water_history_section.dart` solo lista los días).

Es una carencia **heredada**, anterior a este change y fuera de su alcance (Risks y Open Question 6 del design): no es una regresión de la migración. No se ha calculado nada en el cliente ni se ha ampliado la API. Queda pendiente de un change propio.

## Comparación con el cliente Flutter

**Método: lectura de código, no ejecución.** Flutter no está instalado en esta máquina y, además, su origen no está en la lista de orígenes permitidos por CORS, que no se ha modificado. La comparación se hizo leyendo `kora-health-client/lib/main.dart` y `kora-health-client/lib/features/water_tracking/`. Todo lo que sigue sobre el comportamiento de Flutter es, por tanto, deducido del código.

Igual en ambos clientes:

- Las cinco secciones de navegación y sus etiquetas: Salud, Nutrición, Entrenamiento, Progreso, Perfil; solo Nutrición tiene contenido.
- Nutrición con dos tarjetas: «Hidratación» (objetivo) e «Historial de hidratación» (registro rápido e historial).
- Textos: «Objetivo actual: N ml», «Sin objetivo configurado todavía», «Nuevo objetivo (ml)», «Guardar objetivo», `+100 ml`, `+250 ml`, `+500 ml`, y `total ml / objetivo ml` (o solo el total si no hay objetivo).
- Las cuatro llamadas a la API, con las mismas rutas, cuerpos y `days=30`; el `404` del objetivo se trata como «sin objetivo».
- Validación del objetivo: se ignoran los valores vacíos, no enteros o `<= 0`.
- La fecha del historial se muestra como `YYYY-MM-DD`.

Diferencias esperadas (decididas en el design):

| Diferencia | Flutter | Angular |
|---|---|---|
| Recarga tras guardar el objetivo (decisión 7) | Solo recarga el objetivo; la columna de objetivo del historial queda desfasada hasta refrescar | Recarga objetivo e historial. Verificado: la fila pasó a `/ 3000 ml` al guardar |
| URL por sección (decisión 4) | Una sola pantalla con pestañas en memoria | Rutas propias (`/salud`, `/nutricion`, …) y botón «atrás» del navegador |

Otras diferencias, menores:

| Diferencia | Flutter | Angular |
|---|---|---|
| Posición de la navegación | Barra inferior (`NavigationBar`) | Barra en la cabecera, a la derecha del título |
| Indicador de carga | Indicador circular, sin texto | Texto «Cargando…» |
| Error al guardar el objetivo o registrar una entrada | No se muestra al usuario | Se muestra «Error: …» en la sección afectada |
| Fallo al cargar la configuración | No aplica (URL fijada al compilar) | Mensaje visible «No se ha podido iniciar Kora Health…» |

Ninguna se considera una diferencia no deseada, así que no se ha corregido nada en `kora-health-web/` (tarea 4.8).

## Observaciones heredadas del backend

No son regresiones ni forman parte de este change; se anotan porque afectan a cómo se leen los escenarios.

- **El «día actual» es el día UTC.** La API agrupa las entradas por fecha UTC. Esta verificación se hizo justo después de la medianoche local (CEST) y las tres entradas se sumaron al `2026-10-10`, cuando en hora local ya era día 11. Entre las 00:00 y las 02:00 locales (01:00 en invierno), el total «de hoy» corresponde al día anterior.
- **El objetivo del historial es el actual, no el de cada día.** `GET /history` devuelve el objetivo vigente para todos los días: al cambiarlo, cambia también para los días pasados (visto: el `2026-10-10` pasó de `/ 2750` a `/ 3000` y de vuelta).
- **No hay forma de borrar ni corregir una entrada** ni de eliminar el objetivo desde la API.

## Datos escritos en la base durante la verificación

Todos para el usuario de prueba fijo, desde la pantalla de Angular:

| Escritura | Valor |
|---|---|
| Objetivo | 2750 → 3000 ml |
| Entrada | 100 ml |
| Entrada | 250 ml |
| Entrada | 500 ml |
| Objetivo | 3000 → 2750 ml (restaurado) |

Estado final: objetivo de 2750 ml (con `dateUpdated` de esta verificación) e historial `2026-10-10` con 1700 ml. Las tres entradas, que suman 850 ml, permanecen en la base.

## Verificación de cierre

Resultados de la tarea 4.8, ejecutados tras escribir este informe:

| Comprobación | Resultado |
|---|---|
| `npm run build` | Sin errores |
| `npm test -- --watch=false` | 49 pruebas en 16 archivos, todas en verde |
| `npx ng lint` | Sin avisos |
| Cambios en `kora-health-client/` o `kora-health-api/` | Ninguno |
