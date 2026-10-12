# Design

## Context

Motivación y alcance: ver `proposal.md` (Why, What Changes, «Reglas que fija este change», Fuera de alcance). Requisitos: ver el delta de `specs/water-tracking/spec.md` de este change, escrito en paralelo y contrastado con este documento al terminar. Aquí solo se recoge el estado actual que condiciona el diseño.

**Verificado leyendo el código del backend** (`kora-health-api/`):

- Existen dos tablas de agua: `water_goals` (`id`, `user_id`, `daily_goal_ml`, `date_updated`) y `water_entries` (`id`, `user_id`, `amount_ml`, `date_created`). La instantánea del modelo de EF no declara para ellas más que la clave primaria: **no hay índice único sobre `water_goals.user_id`, ni índice sobre `water_entries`, ni clave foránea a `users`**. El código asume una fila de objetivo por usuario (`SingleOrDefaultAsync`), pero la base no lo garantiza.
- `KoraHealthDbContext` sigue sin `OnModelCreating`: todo el esquema sale de las convenciones (snake_case).
- `WaterTrackingService.GetHistoryAsync` pide el calendario del usuario a `ILocalDayService`, carga las entradas desde el inicio UTC del primer día de la ventana, las agrupa en memoria con `UserCalendar.GetLocalDay` y asigna a **todos** los días el objetivo actual. Solo devuelve días con entradas, del más reciente al más antiguo.
- `GetHistoryAsync` rechaza `days <= 0` con una excepción (`ArgumentOutOfRangeException`); como no hay middleware de errores, `GET /history?days=0` responde `500`. Un `days` enorme desborda `DateOnly.AddDays` y acaba igual.
- `SetGoalAsync` del repositorio sobrescribe la única fila de `water_goals` y fija `date_updated` con `DateTime.UtcNow`. No existe forma de borrar un objetivo ni una entrada.
- `GET /goal` responde `404` si no hay objetivo. `AddControllers()` se usa sin opciones: JSON en camelCase, los `null` se serializan, `DateOnly` sale como `YYYY-MM-DD`.
- La política de CORS admite `GET`, `PUT` y `POST`; este change solo añade operaciones `GET`.
- Pruebas: `WaterTrackingServiceHistoryTests` construye el servicio real con `InMemoryWaterTrackingRepository`, `InMemoryProfileRepository` y `FixedTimeProvider`. El doble del repositorio guarda un único objetivo y permite fijar el instante de cada entrada (`AddEntryAt`).
- Los modelos de dominio de agua no derivan de `BaseModel`, aunque `CLAUDE.md` lo enuncia como convención. No se corrige aquí.

**Verificado leyendo el código del cliente** (`kora-health-client/`):

- `NutritionPageComponent` provee `WaterTrackingStateService` y pinta dos tarjetas: «Hidratación» (objetivo) e «Historial de hidratación» (registro rápido + lista). Su prueba comprueba exactamente esos dos títulos y su orden.
- `WaterTrackingStateService` carga objetivo e historial al crearse; tras registrar una entrada recarga el historial, y tras guardar el objetivo recarga objetivo e historial. Las recargas tras una acción no muestran el estado de carga.
- `WaterTrackingService.getHistory` pide siempre 30 días; es el único uso de `/history`. No hay ningún uso de `Date`, `Intl` ni cálculo de «hoy» en el cliente.
- `package.json` no tiene ninguna dependencia de interfaz ni de gráficos. Las pruebas corren con Vitest 5 sobre jsdom 30 mediante el builder `@angular/build:unit-test`.
- `angular.json` fija presupuestos solo para producción: `initial` (aviso a 500 kB, error a 1 MB) y `anyComponentStyle` (aviso a 4 kB, error a 8 kB). **No hay presupuesto para los trozos diferidos.**
- `styles.scss` define once variables de color, con un solo tema; no hay ninguna pensada para escalas de datos. La tarjeta compartida actual, `section-card`, solo tiene título y contenido: su cabecera no admite subtítulo ni un control.
- `app.routes.ts` tiene un solo nivel de rutas bajo `HomeComponent`: ninguna sección tiene rutas hijas. `HomeComponent` construye la navegación con las hijas directas que declaran `path` y `title`, y muestra en la cabecera el `title` de la primera ruta hija activa; la cabecera no tiene más contenido que ese título. `config.json` se pide con una ruta relativa (`assets/config.json`) e `index.html` declara `<base href="/">`.

**Verificado consultando el registro de npm:** la última versión publicada de `echarts` es `6.1.0`.

**No verificado (se da por bueno):** el contenido de la base de Neon (dos días con datos, 2026-10-10 con 850 ml y 2026-10-11 con 1050 ml, y objetivo de 2750 ml: datos aportados por la autora); que haya una sola fila en `water_goals`; el comportamiento real de ECharts 6 en este proyecto. Nada de ECharts se ha ejecutado: todo lo que este documento dice de la librería procede de su documentación y de memoria, y va marcado como **«a comprobar en la fase de implementación»** donde el diseño depende de ello.

**Dependencia de `ui-foundation`.** La autora ha decidido que la aplicación tendrá tema claro y tema oscuro, y que todo color de acento saldrá de una única variable que más adelante podrá cambiar el usuario desde ajustes. Esa base visual (variables de color, temas, tipografía, iconos, navegación y componentes base como la tarjeta, el botón y el control segmentado) la aporta un change aparte, `ui-foundation`, que **todavía no existe en el repositorio** (no hay `openspec/changes/ui-foundation/`) y que se implementará y fusionará antes de las fases de cliente de este change (fases 4, 5 y 6 del Migration Plan). Las fases de backend (2 y 3) no dependen de él. Consecuencia para este documento: no se nombra ninguna variable ni ningún componente base concreto, porque aún no están definidos; donde hace falta un color o un componente base se dice «según `ui-foundation`» y se describe solo el papel que cumple.

**Decisiones ya tomadas por la autora** (no se reabren): las cuatro estadísticas y sus reglas (proposal); el periodo seleccionable en días locales; cada día conserva su objetivo y un objetivo nuevo rige desde el día local en curso; los días anteriores al change se evalúan con el objetivo vigente en la migración; el cliente muestra las cuatro estadísticas, gráfico de barras con la referencia del objetivo y mapa de calor de calendario; la racha actual es global (no depende del periodo y un día sin objetivo vigente la rompe); «3 meses» y «año» son meses y años de calendario, no 90 o 365 días fijos; en el porcentaje de días cumplidos el día en curso cuenta siempre (decisión 9); el gráfico de barras es diario en 7 y 30 días y se agrupa por semanas, con la media diaria de cada semana, en 3 meses y 1 año (decisión 16); la librería es ECharts 6.1.0, usada directamente, por módulos y aislada tras un componente propio; las estadísticas pertenecen a `water-tracking` y se reparten entre una tarjeta compacta en la página de Nutrición (progreso de hoy, registro rápido, objetivo y enlace al detalle) y una pantalla de detalle con ruta propia (estadísticas, gráfico, mapa de calor e historial), y ECharts se carga solo al entrar en esa pantalla de detalle, no al entrar en Nutrición (decisión 15); **el periodo se elige por tarjeta**: en el detalle no hay un selector global, sino que cada tarjeta que depende de un periodo (resumen, gráfico, calendario e historial) lleva el suyo en su cabecera, con las opciones 7 días, 30 días, 3 meses y año, y cambiar uno no altera los demás (decisión 15); la aplicación tendrá **tema claro y oscuro y un color de acento variable**, que aporta `ui-foundation`: este change no define colores propios ni componentes base, y sus gráficos leen los colores del tema en ejecución (decisión 13).

## Goals / Non-Goals

**Goals:**

- Que el objetivo con el que se evalúa un día pasado no cambie nunca al cambiar el objetivo actual.
- Que las estadísticas sean una función pura, probada sin base de datos, y que el servidor sea el único que decide qué día es hoy, qué días abarca el periodo y si un día está cumplido.
- Que una sola respuesta de la API dé al cliente todo lo que pinta una tarjeta de la pantalla de detalle para su periodo, coherente consigo misma, y que esa misma forma de respuesta sirva a las cuatro tarjetas.
- Que cada tarjeta del detalle elija su periodo sin afectar a las demás y sin repetir peticiones cuando dos tarjetas comparten periodo.
- Que ningún color de este change sea literal: todos salen de las variables de `ui-foundation`, también dentro de los gráficos, que se repintan al cambiar de tema o de color de acento.
- Que la página de Nutrición siga siendo corta en un móvil: de la hidratación solo lleva una tarjeta compacta, que no pide las estadísticas ni descarga la librería de gráficos.
- Que ECharts no entre en el paquete inicial ni se descargue al entrar en Nutrición, y que el único código que lo importa en ejecución esté en una carpeta compartida.
- No romper ningún contrato existente: `GET /goal`, `PUT /goal`, `POST /entries` y `GET /history` conservan su forma.

**Non-Goals:**

- Borrar o editar objetivos pasados, y cualquier interfaz para ver el historial de objetivos.
- Agregación por meses, estadísticas resumidas por semana o el concepto de «semana cumplida» (la única agregación semanal es la serie del gráfico de barras de los periodos largos, decisión 16), comparativas entre periodos y estadísticas de otros módulos.
- Caché de las estadísticas en el servidor, y caché persistente o entre visitas en el cliente. La única memoria que se guarda es la del estado del detalle, por periodo y solo mientras dura la visita a esa pantalla (decisión 15).
- Un envoltorio genérico de gráficos con API propia que oculte el formato de opciones de ECharts (ver decisión 13).
- Añadir índices o claves foráneas a las tablas existentes (ver Open Questions).
- Un resumen de hidratación en la sección Progreso. Reutilizaría la misma API y el componente de gráfico compartido (decisión 13), pero pertenece al change de `progress`.
- El sistema de temas (claro y oscuro), las variables de color, la tipografía, los iconos, la navegación y los componentes base (tarjeta, botón, control segmentado): los aporta `ui-foundation`. Este change los usa y no los define.
- El selector del color de acento en ajustes.
- Traducciones.

## Decisions

### 1. El historial de objetivos es una tabla nueva; `water_goals` se mantiene como «objetivo actual»

Tabla nueva `water_goal_history` (entidad `WaterGoalHistoryEntity` en `Domain/Entities/WaterTracking/`):

| Columna | Tipo | Significado |
|---|---|---|
| `id` | entero, clave primaria | Como el resto de entidades (`BaseEntity`) |
| `user_id` | entero | Usuario; sin clave foránea, igual que las otras dos tablas de agua |
| `daily_goal_ml` | entero | Objetivo en mililitros |
| `effective_from` | `date` | Día local del usuario desde el que rige, inclusive |
| `date_created` | `timestamp with time zone` | Instante UTC de la última escritura de la fila |

Índice único sobre (`user_id`, `effective_from`). Es la primera configuración fluida del proyecto: se añade `OnModelCreating` a `KoraHealthDbContext` solo para este índice, porque el atributo equivalente obligaría a `Domain` a depender de EF Core.

`water_goals` no se toca: sigue siendo lo que el usuario tiene configurado y lo que devuelven `GET /goal` y `PUT /goal`. La tabla nueva responde a otra pregunta: qué objetivo regía cada día.

**Invariante:** para cada usuario con objetivo, la fila del historial con `effective_from` más reciente tiene el mismo valor que su fila de `water_goals`. Lo garantiza la escritura de la decisión 2.

**Por qué no sustituir `water_goals`.** Derivar el objetivo actual de la última fila del historial dejaría una sola fuente de verdad, pero exige borrar una tabla en la misma migración que copia sus datos, y deja el código anterior inservible si hay que revertir sin deshacer la migración. Manteniéndola, la migración solo crea y copia, `GET /goal` no cambia ni una línea y revertir el código es seguro. El coste es un dato duplicado que se escribe en una sola operación. Retirarla más adelante no cambia ningún contrato (Open Questions).

**Alternativa descartada: guardar solo el instante del cambio y derivar el día al consultar.** Reagruparía los cambios de objetivo con la zona horaria igual que las entradas, pero impide deduplicar por día al escribir (la tabla solo crecería), obliga a derivar en cada consulta y no elimina el efecto de frontera, solo lo mueve. Como `date_created` se conserva, se puede cambiar de criterio más adelante sin perder información.

**A comprobar en la fase de implementación:** que Npgsql genera `date` para la propiedad `DateOnly` y que el índice único aparece en la migración generada.

### 2. `PUT /goal` escribe el objetivo actual y la fila del día local en curso; el último cambio del día gana

El servicio obtiene el `UserCalendar` del usuario, toma `Today` como día de vigencia y la hora de `TimeProvider`, y pide al repositorio una única operación que, en una sola llamada a `SaveChangesAsync` (una transacción):

1. actualiza o crea la fila de `water_goals` (como hoy);
2. si ya existe una fila del historial con `effective_from` igual a hoy, la sobrescribe (valor y `date_created`); si no, la crea;
3. elimina las filas del historial de ese usuario con `effective_from` posterior a hoy.

El paso 2 resuelve varios cambios en el mismo día local: solo cuenta el último, y los valores intermedios no dejan rastro. El paso 3 solo actúa tras un cambio de zona horaria hacia atrás (ver decisión 4) y mantiene el invariante de la decisión 1.

La respuesta de `PUT /goal` y la de `GET /goal` no cambian de forma ni de origen. El cliente actual sigue funcionando sin tocarlo.

Consecuencias que se aceptan porque se derivan de la regla aprobada («rige desde el día local en curso»): cambiar el objetivo modifica la evaluación del día de hoy, también si ya estaba cumplido con el objetivo anterior, y por tanto puede alterar la racha; guardar el mismo valor que ya había crea igualmente la fila de hoy, sin efecto observable.

El constructor de `WaterTrackingService` recibe además `TimeProvider`; el repositorio deja de leer el reloj en esta operación. Las llamadas a `DateTime.UtcNow` de `AddEntryAsync` se quedan como están.

### 3. Migración: crear la tabla y sembrar una fila por objetivo existente, vigente desde `2000-01-01`

La migración crea la tabla y el índice y, a continuación, ejecuta una sentencia SQL escrita a mano que inserta en el historial una fila por cada fila de `water_goals`, con su `user_id`, su `daily_goal_ml`, `effective_from = 2000-01-01` y `date_created` igual al `date_updated` de origen. No modifica `water_goals` ni `water_entries`. Su `Down` elimina la tabla nueva.

**Por qué una fecha fija en el pasado y no el día del primer registro.** La decisión de la autora es que todos los días anteriores al change se evalúen con el objetivo vigente en la migración. El día local del primer registro depende de la zona horaria: si el usuario cambia después a una zona más al oeste, sus primeras entradas pasan al día anterior y quedarían sin objetivo. Una fecha anterior a cualquier dato posible de la aplicación cubre todos los días ya registrados en cualquier zona, no requiere calcular días locales en SQL y deja la migración determinista. El valor se declara como constante con nombre en el dominio para que la fila sembrada sea reconocible.

**Por qué `2000-01-01` y no la fecha mínima.** Npgsql puede tratar las fechas mínima y máxima de .NET como `-infinity` e `infinity` (no comprobado); una fecha corriente evita depender de ese comportamiento.

**Por qué `date_created` copia `date_updated`.** Conserva cuándo se fijó realmente ese objetivo y hace que la migración produzca lo mismo se ejecute cuando se ejecute.

**Antes de arrancar la API** (lección de `user-local-day`: `Program.cs` aplica las migraciones al iniciar): revisar el archivo generado y el SQL que produce, comprobar que la inserción va después de la creación de la tabla y que no hay ninguna operación sobre las tablas existentes, anotar las respuestas actuales de `GET /goal` y `GET /history`, y confirmar que `water_goals` tiene una sola fila por usuario. Si hubiera dos filas para un usuario la inserción violaría el índice único y la migración fallaría entera, sin cambios parciales.

Los usuarios creados después (con `add-auth`) no tienen fila sembrada: su primer objetivo rige desde el día en que lo fijan y sus días anteriores quedan sin objetivo.

### 4. El día de vigencia es una fecha de calendario guardada; no se reinterpreta al cambiar de zona horaria

`effective_from` se guarda como fecha y se compara con los días locales calculados con la zona **vigente en la consulta**. Las entradas, en cambio, son instantes y se reagrupan. Efecto: tras un cambio de zona, una entrada próxima a una medianoche puede pasar a un día regido por otro objetivo. El desajuste afecta como máximo a un día alrededor de cada cambio de objetivo, no altera ningún dato guardado y se deshace al volver a la zona anterior.

Caso particular: el usuario fija un objetivo en su día D y después cambia a una zona en la que todavía es D−1. Durante ese día `GET /goal` devuelve el objetivo nuevo, pero el día en curso se evalúa con el anterior, porque la fila nueva rige desde D. Si en ese intervalo vuelve a cambiar el objetivo, el paso 3 de la decisión 2 elimina la fila de D, de modo que nunca «resucita» un objetivo más antiguo que el último fijado.

### 5. El objetivo de cada día se resuelve en memoria con una sola consulta

Para cualquier rango, el repositorio devuelve todas las filas del historial de objetivos del usuario ordenadas por `effective_from` (como máximo una por día en que cambió el objetivo: unas pocas). Una pieza pura del dominio recorre los días del rango en orden y avanza un puntero sobre esas filas: el objetivo del día D es el de la fila con mayor `effective_from` que no supera D, y `null` si no hay ninguna. Ni una consulta por día ni subconsultas correlacionadas.

`GetHistoryAsync` usa esa misma pieza en lugar del objetivo actual.

### 6. Reparto por capas: cálculo puro en `Domain`, orquestación en el servicio

Siguiendo el precedente de `Domain/LocalDay/`, se añade `Domain/WaterTracking/` con código puro, sin reloj ni base de datos:

- **Serie de días:** dadas las entradas, el historial de objetivos, un `UserCalendar` y un rango de días, produce un punto por día (día, total, objetivo vigente o `null`), con cero en los días sin entradas. Con un rango de un solo día da el día actual (decisión 7).
- **Serie de semanas:** dadas una serie de días, el día actual y el día del primer registro, produce un punto por cada semana de lunes a domingo que toca el rango (días que cuentan, media diaria y referencia del objetivo), con las reglas de la decisión 16. Solo usa las fechas de la serie de días: no necesita el calendario del usuario ni vuelve a tocar las entradas.
- **Estadísticas:** dadas una serie de días, el día actual y el día del primer registro, calcula las cuatro estadísticas con las reglas de la decisión 9.
- **Periodo:** el conjunto cerrado de periodos, la conversión desde el texto del parámetro y el primer día de cada periodo a partir de hoy.

Los modelos de resultado van en `Domain/Models/WaterTracking/`. `WaterTrackingService` solo orquesta: pide el calendario, carga datos por el repositorio y llama a las piezas puras. El controlador valida el parámetro y mapea a los `Rs` con AutoMapper.

**Alternativa descartada: toda la lógica en el servicio.** Se podría probar igualmente con los dobles, pero cada caso límite de rachas o de medias exigiría montar entradas con instantes UTC y zona horaria; como función pura, la prueba es una lista de días con su total y su objetivo.

Contrato del repositorio (`IWaterTrackingRepository`): cambia la firma de la escritura del objetivo (recibe el día de vigencia y el instante) y se añaden la lectura del historial de objetivos, el instante de la primera entrada del usuario y la lectura de entradas entre dos instantes UTC.

### 7. Endpoints nuevos: `GET /api/water-tracking/statistics?period=…` y `GET /api/water-tracking/today`

El primero alimenta cada tarjeta de la pantalla de detalle; el segundo, descrito al final de esta decisión, la tarjeta compacta de Nutrición.

**Parámetro.** `period` admite exactamente `7d`, `30d`, `3m` y `1y`. Si falta, se usa `30d` (como el valor por defecto de `days` en `/history`). Cualquier otro valor responde `400` con un mensaje de texto plano que enumera los valores admitidos; no se lanza excepción.

**Rango de cada periodo**, siempre en días locales y terminando hoy inclusive:

| Valor | Primer día | Días |
|---|---|---|
| `7d` | hoy − 6 días | 7 |
| `30d` | hoy − 29 días | 30 |
| `3m` | el día siguiente a hoy menos tres meses de calendario | 89 a 92 |
| `1y` | el día siguiente a hoy menos un año de calendario | 365 o 366 |

Se usan meses y años de calendario porque así los nombra el proposal («3 meses», «año»); el ajuste de fin de mes es el de `DateOnly.AddMonths`. Alternativa descartada: 90 y 365 días fijos, más simple pero que no coincide con lo que el usuario entiende por «hace tres meses». Confirmado por la autora. Ejemplo: si hoy es el 12 de octubre de 2026, `3m` abarca del 13 de julio al 12 de octubre de 2026 (92 días) y `1y` del 13 de octubre de 2025 al 12 de octubre de 2026 (365 días). El primer día es el siguiente al mismo día del mes de origen para que el periodo dure exactamente tres meses o un año, igual que `7d` dura exactamente siete días.

**Respuesta** (`WaterStatisticsRs`, siempre `200` para un periodo válido):

| Campo | Tipo | Contenido |
|---|---|---|
| `period` | texto | El periodo aplicado |
| `firstDay`, `lastDay` | fecha | Límites del periodo; `lastDay` es el día local actual del usuario |
| `firstRecordDay` | fecha o `null` | Día local de la primera entrada del usuario, en cualquier fecha; `null` si nunca ha registrado |
| `averageDailyMl` | entero o `null` | Media diaria |
| `daysGoalMet` | entero | Días cumplidos |
| `daysEvaluated` | entero | Días que cuentan para el porcentaje |
| `goalMetPercentage` | entero o `null` | Porcentaje de días cumplidos |
| `currentStreakDays` | entero | Racha actual |
| `bestDay` | objeto o `null` | `date` y `totalMl` del mejor día |
| `days` | lista | Un elemento por cada día del periodo, del más antiguo al más reciente: `date`, `totalMl`, `goalMl` (o `null`) y `goalMet` (`true`, `false`, o `null` si ese día no tiene objetivo) |
| `weeks` | lista | Un elemento por cada semana de lunes a domingo que toca el periodo, de la más antigua a la más reciente: `firstDay`, `lastDay`, `daysCounted`, `averageDailyMl` (o `null`) y `averageGoalMl` (o `null`). Definición en la decisión 16. Se devuelve en los cuatro periodos |

**La serie densa diaria y la serie semanal van en esta respuesta**, no en `/history` ni en un endpoint aparte. Motivos: las cuatro estadísticas, las barras y el calendario salen del mismo calendario y del mismo instante (dos peticiones separadas podrían caer a ambos lados de una medianoche y contradecirse); `/history` conserva su contrato disperso; y cada tarjeta del detalle se pinta con una sola respuesta, la de su periodo (decisión 15). `goalMet` viaja con cada día para que el cliente no reimplemente la regla de «día cumplido», y la serie semanal viaja ya calculada para que el cliente no promedie nada. `days` se devuelve siempre completo porque el mapa de calor y la lista del historial son diarios en los cuatro periodos; `weeks` se devuelve también siempre, aunque el cliente solo la pinta en `3m` y `1y`, para que la respuesta tenga una sola forma (en `7d` son una o dos semanas).

**Una sola forma de respuesta, aunque el periodo se elija por tarjeta.** Que cada tarjeta del detalle tenga su propio periodo (decisión 15) no cambia el contrato: es el mismo endpoint con el mismo `period`, pedido una vez por cada periodo distinto que haya en pantalla. La respuesta lleva siempre todo, aunque la tarjeta que la pide use solo una parte: el resumen con periodo de un año recibe también 366 días y hasta 54 semanas que no pinta (unos 30 kB, decisión 10). Se acepta a cambio de tres cosas: una sola forma de respuesta que probar y documentar; que dos tarjetas con el mismo periodo compartan una única petición, lo que solo es posible si la respuesta sirve a cualquiera de ellas; y que la racha y el primer registro, que no dependen del periodo, lleguen con cualquier respuesta. Alternativa descartada: un parámetro que elija qué partes devolver (por ejemplo solo el resumen, sin `days` ni `weeks`). Ahorraría bytes en un caso poco frecuente, pero multiplica las formas de la respuesta y las claves de la memoria del cliente (periodo y partes) e impide compartir peticiones entre tarjetas. Si el peso llegara a importar, se puede añadir después sin romper a ningún cliente.

**Respuestas en los casos límite:**

- *Sin ninguna entrada:* `firstRecordDay`, `averageDailyMl`, `goalMetPercentage` y `bestDay` a `null`; contadores y racha a cero; `days` completo con totales a cero; `weeks` completo con `daysCounted` a cero y sus dos medias a `null`.
- *Sin objetivo:* `goalMl` y `goalMet` a `null` en todos los días; `averageGoalMl` a `null` en todas las semanas; `daysGoalMet` y `daysEvaluated` a cero; `goalMetPercentage` a `null`; racha a cero. Media, mejor día y medias semanales se calculan igual.
- *El periodo empieza antes del primer registro:* `days` cubre el periodo entero; los días anteriores a `firstRecordDay` llevan total cero y no entran en la media ni en el porcentaje. `weeks` cubre también el periodo entero: las semanas anteriores a la del primer registro llevan `daysCounted` a cero y sus medias a `null`.
- *Hay registros, pero ninguno en el periodo:* media `0`, mejor día `null`; cada semana con días que cuentan lleva `averageDailyMl` a `0`.

**Día actual: `GET /api/water-tracking/today`.** Sin parámetros; siempre `200`. Devuelve un único objeto con la misma forma que un elemento de `days`, referido al día local actual del usuario:

| Campo | Tipo | Contenido |
|---|---|---|
| `date` | fecha | El día local actual del usuario, decidido por el servidor |
| `totalMl` | entero | Total del día; `0` si hoy no hay entradas |
| `goalMl` | entero o `null` | Objetivo vigente hoy; `null` si el usuario no tiene objetivo |
| `goalMet` | booleano o `null` | Si el total alcanza o supera el objetivo; `null` si hoy no hay objetivo vigente |

Es la pieza «Serie de días» de la decisión 6 aplicada a un rango de un solo día, de modo que el total, el objetivo y `goalMet` de hoy coinciden por construcción con el último elemento de `days` de las estadísticas. Tres lecturas: zona horaria, historial de objetivos y entradas desde el inicio UTC del día actual. No calcula racha ni primer registro. El `Rs` es el mismo que el del elemento de `days`.

**Por qué un endpoint propio.** La tarjeta de Nutrición solo necesita el total de hoy y el objetivo vigente, y los vuelve a pedir después de cada registro rápido. Alternativas descartadas:

- *Pedir `statistics?period=7d` y quedarse con el último elemento de `days`.* No añade nada al contrato, pero cada toque en un botón de registro lanzaría el cálculo completo: cuatro lecturas y, para cualquier usuario con una racha de siete días o más, la carga de un bloque adicional de un año de entradas (decisión 9), para descartar casi toda la respuesta.
- *Pedir `history?days=1`.* Es ligero, pero `/history` omite los días sin entradas, así que no da el objetivo vigente cuando hoy aún no hay registros, y no lleva `goalMet`: el cliente tendría que suplir el objetivo con `GET /goal` (que no siempre es el vigente hoy, decisión 4) y decidir por su cuenta si el día está cumplido.
- *Sumar en el cliente lo que se va registrando.* Obligaría al cliente a saber qué día es hoy y cuándo cambia.

### 8. `GET /history`: misma forma, `goalMl` por día, y `days` validado

`/history` sigue devolviendo solo los días con entradas, del más reciente al más antiguo, con `date`, `totalMl` y `goalMl`. Cambia el significado de `goalMl`: pasa a ser el objetivo vigente ese día (decisión 5), y es `null` en los días anteriores al primer objetivo del usuario aunque hoy tenga uno.

**Este change corrige el `500` de `days`.** El controlador responde `400` con texto plano cuando `days` queda fuera de 1 a 366. Se corrige aquí porque el controlador ya se modifica, porque dejar un parámetro validado junto a otro que revienta sería incoherente con la convención de `CLAUDE.md`, y porque no altera la spec. El límite superior es nuevo: hoy `days=1000` funciona. Ningún cliente lo usa (el cliente Angular envía siempre 30) y 366 coincide con el periodo máximo de las estadísticas.

**El cliente Angular deja de llamar a `/history`** (decisión 15): el delta exige que la lista del historial corresponda al periodo seleccionado en su bloque, y eso ya lo da la serie de las estadísticas. El endpoint se conserva en la API, con su contrato, para otros clientes; sigue cubierto por las pruebas de backend y por la verificación.

### 9. Definiciones exactas de las estadísticas

Sea el periodo el rango de la decisión 7 y «hoy» su último día.

**Días computables.** Los días del periodo desde `firstRecordDay` (o desde el primer día del periodo, si el primer registro es anterior) hasta hoy, ambos inclusive.

**Media diaria.** Suma de los totales de los días computables dividida entre el número de días computables. Hoy cuenta aunque esté incompleto: su total está en el numerador y excluirlo dejaría la media indefinida el primer día de uso. Resultado entero en mililitros, redondeando la mitad hacia arriba (no el redondeo bancario por defecto de .NET). `null` si el usuario no tiene ninguna entrada.

**Días cumplidos y porcentaje.** Un día está cumplido si tiene objetivo vigente y su total lo alcanza o lo supera. `daysEvaluated` cuenta los días computables con objetivo vigente, **incluido siempre el día en curso**: si hoy tiene objetivo vigente entra en el denominador desde el primer instante del día y cuenta como no cumplido hasta que su total alcanza el objetivo (decisión de la autora). Si hoy no tiene objetivo vigente no cuenta, como cualquier otro día sin objetivo. `daysGoalMet` cuenta los cumplidos entre ellos; el día en curso solo suma cuando ya está cumplido. El porcentaje es `daysGoalMet` entre `daysEvaluated` por cien, entero con el mismo redondeo, y `null` si `daysEvaluated` es cero.

**Asimetría deliberada con la racha.** En el porcentaje, hoy incompleto cuenta como no cumplido; en la racha, hoy incompleto no la rompe. No es una incoherencia, son dos preguntas distintas. El porcentaje describe el periodo tal como está ahora, con el mismo conjunto de días que la media diaria (los días computables, hoy incluido), de modo que «días cumplidos», «días evaluados» y el calendario, cuando muestra ese mismo periodo, cuentan lo mismo que se ve en pantalla; el coste es que el porcentaje baja al empezar cada día y se recupera al cumplirlo (en `7d`, hasta un séptimo). La racha, en cambio, es un contador de continuidad: si hoy incompleto la rompiera, valdría cero cada mañana para cualquier usuario y solo sería distinta de cero después de cumplir el día, con lo que dejaría de informar de nada. Por eso la racha da de plazo el día en curso y el porcentaje no.

**Racha actual.** Número de días consecutivos cumplidos contando hacia atrás desde hoy si hoy está cumplido, o desde ayer si no lo está (incumplido o sin entradas). El primer día no cumplido la termina. **No depende de ningún periodo seleccionado**: se calcula sobre todo el historial, de modo que la misma racha se ve con cualquier periodo. Por eso viaja con el mismo valor en todas las respuestas, y el cliente la muestra fuera de las tarjetas que tienen selector de periodo (decisión 15). Un día sin objetivo termina la racha y no se cuenta; en la práctica solo puede haber días sin objetivo antes del primer objetivo del usuario (no existe forma de quitarlo), así que nunca quedan en medio de una racha. Un día sin entradas nunca está cumplido, porque el objetivo es siempre mayor que cero.

**Mejor día.** El día del periodo con mayor total, siempre que sea mayor que cero. En caso de empate, el más reciente. `null` si no hay entradas en el periodo.

**Carga de datos para la racha.** El servicio carga las entradas del periodo. Si la racha llega al primer día cargado y `firstRecordDay` es anterior, carga un bloque más hacia atrás (un año) y continúa, hasta que la racha se corta o se alcanza el primer registro. En el caso habitual hay una sola consulta de entradas.

### 10. Rendimiento: se sigue agrupando en memoria

Un año son como máximo 366 días; con una decena de entradas diarias, unos pocos miles de filas de dos enteros y un instante. Agrupar eso en memoria es despreciable frente al viaje a Neon. Agregar en SQL exigiría convertir a la zona del usuario dentro de PostgreSQL, es decir, una segunda implementación del día local con otra base de datos de zonas horarias, en contra de la regla «Local day» de `CLAUDE.md` (todo pasa por `UserCalendar`). Por petición de estadísticas hay cuatro lecturas: zona horaria, historial de objetivos, primera entrada y entradas del periodo. La serie semanal se obtiene de la serie diaria ya calculada, sin lecturas adicionales. La petición del día actual hace tres lecturas y carga solo las entradas de hoy. Al entrar en el detalle el cliente hace dos peticiones de estadísticas (`30d` y `3m`, los periodos por defecto de sus tarjetas) y, después, una más por cada periodo que se elija por primera vez en esa visita (decisión 15): como máximo cuatro por visita, salvo reintentos tras un error. La respuesta de un año ocupa en torno a 30 kB de JSON (estimación: 366 días y hasta 54 semanas).

No se ha medido nada: la base real tiene dos días de datos. Si el volumen creciera, lo primero sería un índice sobre `water_entries` (Open Questions), no mover el cálculo a SQL.

### 11. Contrato de la API antes y después

| Operación | Antes | Después |
|---|---|---|
| `GET /api/water-tracking/goal` | Objetivo actual o `404` | Sin cambios |
| `PUT /api/water-tracking/goal` | Sustituye el objetivo; afecta a cómo se ven todos los días | Misma petición y respuesta. **Cambia de significado:** rige desde el día local en curso; los días anteriores conservan el suyo |
| `POST /api/water-tracking/entries` | Registra una entrada | Sin cambios |
| `GET /api/water-tracking/history?days=N` | Días con entradas; `goalMl` = objetivo actual en todos; `days <= 0` → `500` | Misma forma. **Cambia de significado:** `goalMl` es el objetivo vigente cada día, y puede ser `null` en días anteriores al primer objetivo. `days` fuera de 1–366 → `400` |
| `GET /api/water-tracking/statistics?period=P` | No existe | Nuevo (decisión 7): estadísticas, serie diaria densa y serie semanal del periodo. Periodo desconocido → `400` |
| `GET /api/water-tracking/today` | No existe | Nuevo (decisión 7): fecha, total, objetivo vigente y cumplimiento del día local actual. Siempre `200` |
| `GET` y `PUT /api/profile/time-zone` | — | Sin cambios; un cambio de zona reagrupa también las estadísticas y cambia cuál es el día actual |

### 12. Pruebas de backend

Mismo proyecto xUnit y mismos dobles, sin librería de simulación. `InMemoryWaterTrackingRepository` se amplía para guardar el historial de objetivos con las reglas de la decisión 2 y para devolver la primera entrada y las entradas de un rango.

*Piezas puras* (sin servicio ni dobles):

- Objetivo por día: sin filas; una fila sembrada; cambio a mitad de rango; día exactamente igual a `effective_from`; rango anterior a la primera fila.
- Periodo: los cuatro valores, un valor desconocido, y los rangos de `3m` y `1y` en fin de mes y en año bisiesto.
- Media: primer registro anterior al periodo; primer registro dentro del periodo; días sin entradas a cero; redondeo en la mitad exacta; sin entradas.
- Días cumplidos: total igual al objetivo (cumplido); un mililitro por debajo; día sin objetivo excluido; hoy incumplido con objetivo cuenta en el denominador y no en el numerador; hoy sin entradas con objetivo cuenta igual; hoy cumplido cuenta en ambos; hoy sin objetivo no cuenta; redondeo del porcentaje en la mitad exacta; denominador cero.
- Racha: hoy cumplido; hoy incumplido con ayer cumplido; hoy sin entradas; ayer incumplido (cero); racha más larga que el periodo; racha que llega al primer registro; cambio de objetivo en mitad de la racha.
- Mejor día: empate (gana el más reciente); periodo sin entradas.
- Serie semanal: semana completa; primera semana recortada por el inicio del periodo; última semana recortada por hoy; hoy lunes (semana de un solo día); primer registro a mitad de semana (solo cuentan los días desde el primer registro); semana entera anterior al primer registro (cero días que cuentan, medias `null`); semana entera sin entradas posterior al primer registro (media cero, no `null`); semana que cruza un cambio de objetivo (referencia igual a la media de los objetivos de sus días); semana con días sin objetivo y días con objetivo (la referencia promedia solo los que lo tienen); semana sin ningún día con objetivo (referencia `null`); redondeo en la mitad exacta de la media y de la referencia; la suma de los totales de las semanas entre la suma de sus días que cuentan coincide con la media diaria del periodo; número y límites de las semanas en los cuatro periodos, con el periodo empezando en lunes y en otro día.

*Servicio con dobles:*

- Cambiar el objetivo no cambia el `goalMl` de los días anteriores en el historial, y sí el de hoy.
- Dos cambios el mismo día local dejan una sola fila con el último valor.
- Cambio de objetivo tras retroceder de zona horaria: se eliminan las filas posteriores a hoy.
- Fila sembrada en `2000-01-01`: cubre días de cualquier zona.
- Estadísticas de un año con datos sintéticos y racha que obliga a cargar un segundo bloque.
- Serie densa: un punto por día, orden ascendente, ceros donde no hay entradas.
- Serie semanal en la respuesta de los cuatro periodos, en orden ascendente y coherente con la serie diaria de la misma respuesta.
- Día actual: sin entradas hoy (total cero, objetivo vigente, no cumplido); con entradas por debajo del objetivo y al alcanzarlo; sin objetivo (`goalMl` y `goalMet` a `null`); entradas justo antes y justo después de la medianoche local (solo cuentan las de hoy); tras cambiar el objetivo hoy lleva el nuevo; tras cambiar de zona horaria el día actual es el de la zona nueva; y coincide con el último elemento de `days` de las estadísticas pedidas en el mismo instante.
- Las pruebas existentes de `GetHistoryAsync` se adaptan al constructor nuevo y siguen pasando.

No se prueba automáticamente: el repositorio de EF (la escritura en una transacción y la migración), que se cubre en la verificación contra la API real, igual que hasta ahora.

### 13. ECharts queda aislado tras un componente compartido y un cargador sustituible

En `modules/app-container/shared/components/chart/`:

- **Componente `app-chart`**: recibe una opción de gráfico y un texto alternativo, y se ocupa del ciclo de vida. Es genérico a propósito, pensando en `progress` y en el resto de `nutrition`.
- **Cargador del motor**: una función que hace la importación dinámica de `echarts/core` y de los módulos necesarios, los registra una sola vez y reutiliza la misma promesa. Se expone mediante un token de inyección para poder sustituirlo.
- **Tipo de opción**: un alias exportado desde esta carpeta, compuesto con los tipos de los módulos registrados.
- **Paleta de los gráficos**: un servicio que entrega, como signal, los colores que usan los gráficos, leídos de las variables CSS del tema en ejecución, y que los vuelve a leer cuando cambia el tema o el color de acento (apartado «Colores» de esta decisión). Se puede sustituir en las pruebas.

**Regla de aislamiento:** ningún archivo fuera de esa carpeta importa `echarts` en ejecución. Los componentes de cada sección construyen la opción con el tipo exportado por la carpeta compartida (solo tipos, que desaparecen al compilar). Añadir un tipo de gráfico para otra sección consiste en registrarlo en el cargador.

**Alternativa descartada: componentes compartidos con API propia** (`app-bar-chart`, `app-calendar-heatmap` con entradas neutrales). Aislaría también el formato de opciones, pero obliga a diseñar una API de gráficos sin conocer aún las necesidades de `progress`. El alias de tipo deja un único punto de acoplamiento y permite hacerlo después.

**Módulos previstos** (nombres según la documentación de ECharts 5; **a comprobar** que existen igual en la 6.1.0): núcleo; gráficos de barras, de líneas y de mapa de calor; componentes de rejilla, calendario, mapa visual por tramos y descripción emergente; y un único renderizador.

**Renderizador: SVG.** Pocos elementos (como mucho 366 celdas), texto nítido a cualquier densidad de pantalla, menos memoria en móvil y nodos inspeccionables al verificar en el navegador. **A comprobar:** que barras, línea escalonada y mapa de calor sobre calendario se pintan bien con el renderizador SVG.

**Carga diferida.** `app-chart` solo se usa en los componentes de gráfico de la pantalla de detalle de hidratación (decisión 15), que es una ruta perezosa con su propio trozo; la página de Nutrición no importa ni esos componentes ni `app-chart`, de modo que entrar en `/nutricion` no descarga nada de ECharts. Además, la librería no se importa de forma estática ni siquiera en el detalle: con la importación dinámica dentro del cargador queda en un trozo propio, el detalle pinta primero el enlace de vuelta, la racha y las tarjetas con sus selectores, y el motor se descarga cuando se monta el primer gráfico; si no hay datos que pintar, no se descarga. Cómo se comprueba: decisión 18.

**Ciclo de vida en Angular 22 sin zonas:**

- Inicialización tras el primer renderizado en navegador (`afterNextRender`), cuando el contenedor ya tiene tamaño, y solo cuando el cargador ha resuelto.
- Actualización con un `effect` que lee la opción (entrada de tipo signal) y la aplica sustituyendo la anterior, no fusionándola.
- Redimensionado con un `ResizeObserver` sobre el contenedor.
- Al destruir el componente: desconectar el observador y liberar la instancia. Si el componente se destruye antes de que resuelva la importación, no se inicializa nada.
- Sin zonas no hace falta sacar nada de la detección de cambios: ECharts no dispara ninguna.
- Si la carga del motor falla, el componente muestra un mensaje de error en su lugar y no rompe el resto de la página.

**Colores: ninguno literal; se leen del tema en ejecución y el gráfico se repinta cuando el tema cambia.** ECharts necesita valores de color concretos y no se asume que entienda variables CSS, así que no basta con escribir `var(--…)` en la opción. Tampoco se escribe ningún color literal en las opciones ni en el código de los gráficos. El mecanismo tiene tres piezas:

- *Lectura.* Un helper genérico en `shared/helpers/` devuelve el color calculado de una variable CSS. No lee el texto de la variable (que puede ser una expresión sin resolver, según cómo defina `ui-foundation` sus temas), sino el color ya resuelto por el navegador: lo aplica a un elemento auxiliar no visible, colgado del documento, y lee su estilo calculado.
- *Paleta.* El servicio de paleta de `shared/components/chart/` usa ese helper para componer un objeto con un color por **papel**: serie (el color de acento), serie atenuada, referencia del objetivo, ejes y líneas de la rejilla, texto, fondo de la descripción emergente y los cuatro estados del calendario (decisión 17). Qué variable de `ui-foundation` cumple cada papel se declara en un único sitio, dentro de esa carpeta; los nombres no se fijan aquí porque `ui-foundation` aún no existe. Si a algún papel no le corresponde ninguna variable, se resuelve con la autora (se añade en `ui-foundation` o se deriva de la variable de acento), nunca con un literal.
- *Repintado.* Las funciones puras que construyen cada opción (decisión 14) reciben la paleta como argumento. El componente de cada gráfico calcula su opción a partir de sus datos y del signal de la paleta; cuando la paleta cambia, la opción se recalcula y `app-chart` la aplica con el mismo `effect` con que aplica cualquier otro cambio, sin destruir ni recrear la instancia.

Qué dispara la relectura de la paleta: un `MutationObserver` sobre el elemento raíz del documento, atento a sus atributos (clase, atributos de datos y estilo en línea, que es donde un sistema de temas cambia de tema o fija la variable de acento), y la escucha del cambio de la preferencia de esquema de color del sistema (`matchMedia('(prefers-color-scheme: dark)')`), por si el tema sigue al sistema. Si `ui-foundation` expone su propio aviso de cambio de tema o de acento (un servicio o un signal), se usa ese en lugar del observador, que es el plan por defecto mientras no se conozca su mecanismo. El servicio de paleta se crea con el primer gráfico y deja de observar cuando se destruye.

**A comprobar en la fase de integración (fase 4):** que el color calculado que devuelve el navegador llega en un formato que ECharts entiende (si `ui-foundation` define colores con funciones de color modernas, el valor calculado puede no ser `rgb(…)`); que el cambio de tema y el cambio de la variable de acento disparan la relectura con el mecanismo real de `ui-foundation`, y que la lectura ocurre cuando los estilos nuevos ya están aplicados; que el gráfico ya pintado cambia de colores sin recargar la página, en los dos sentidos (claro a oscuro y oscuro a claro); y que la descripción emergente, que ECharts pinta como HTML propio, también sigue al tema.

**Fechas.** El cliente no crea objetos `Date` ni calcula «hoy»: las etiquetas salen de la cadena `YYYY-MM-DD` y el último día lo da el servidor. El eje de las barras es de categorías (cadenas). **A comprobar:** que el calendario de ECharts interpreta `YYYY-MM-DD` como fecha local y no desplaza un día en navegadores con desfase negativo respecto a UTC.

**A comprobar además:** compatibilidad de los tipos de ECharts 6.1.0 con TypeScript 6 y con el compilador de Angular 22; que el empaquetador separa la librería en un trozo diferido y no emite avisos de módulos CommonJS.

### 14. Pruebas de componentes: ECharts no se ejecuta en jsdom

jsdom no tiene canvas, no calcula tamaños (todo mide cero) y, hasta donde se sabe, no implementa `ResizeObserver`. No se da por hecho que el renderizador SVG funcione ahí. Decisión:

- Las pruebas sustituyen el cargador (token de la decisión 13) por un doble que registra las llamadas de inicialización, aplicación de opción, redimensionado y liberación. Con él se prueba `app-chart`: inicializa una vez, aplica la opción cuando cambia el signal, libera al destruirse y no inicializa si se destruye antes de cargar.
- La construcción de cada opción es una función pura por gráfico, que recibe los datos y la paleta (decisión 13), probada aparte: número de puntos, valores, categoría de cada día o de cada semana, presencia e interrupciones de la línea del objetivo, qué serie (diaria o semanal) se usa en cada periodo, y que todos los colores de la opción son los de la paleta recibida: con dos paletas distintas salen dos opciones que solo difieren en los colores, y ninguna contiene un color que no venga de la paleta.
- El servicio de paleta se sustituye en las pruebas de los componentes por una paleta fija; cambiarla en la prueba debe producir una opción nueva. La lectura real de variables CSS y el repintado al cambiar de tema no se prueban en jsdom (no se da por hecho que calcule variables CSS ni colores): se comprueban en el navegador.
- El pintado real se comprueba en un navegador, en las fases 4 y 6 y en la verificación final.
- **A comprobar:** si jsdom 30 ofrece `ResizeObserver`; si no, el componente lo trata como opcional o las pruebas lo sustituyen.

Alternativa descartada: ejecutar ECharts real con renderizador SVG en las pruebas. Podría funcionar, pero depende de comportamientos no verificados y ataría las pruebas a la salida de la librería.

### 15. Rutas, componentes, estado y DTOs del cliente

Decisión de la autora: las estadísticas siguen perteneciendo a `water-tracking`, pero se reparten en dos pantallas. La página de Nutrición lleva una **tarjeta compacta** (progreso de hoy, registro rápido, objetivo y un enlace al detalle) y todo lo demás vive en una **pantalla de detalle** con ruta propia. Motivo: la página de Nutrición alojará después el diario de comidas y debe seguir siendo corta en un móvil.

**Rutas.** En `app.routes.ts`, `nutricion` pasa a ser una ruta sin componente, con `title` «Nutrición» y dos hijas de carga diferida:

| URL | Ruta hija | `title` | Componente |
|---|---|---|---|
| `/nutricion` | `''` | (el de la ruta madre) | `NutritionPageComponent` |
| `/nutricion/hidratacion` | `hidratacion` | «Hidratación» | `WaterStatisticsPageComponent` |

- Las dos hijas se pintan en el `router-outlet` de `HomeComponent`; no se añade ningún componente intermedio.
- **Navegación.** `HomeComponent` construye los cinco destinos con las hijas directas que tienen `path` y `title`; `nutricion` conserva ambos, así que la lista no cambia. El enlace «Nutrición» sigue activo en el detalle porque `routerLinkActive` compara por prefijo. Como efecto, conserva `aria-current="page"` también en el detalle; se acepta. **A comprobar en la fase 5.**
- **Cabecera.** Hoy `HomeComponent` toma el título de la primera ruta hija, que en el detalle sería «Nutrición». Pasa a tomar el de la ruta activa más profunda que declare uno, de modo que el detalle muestra «Hidratación» y `/nutricion` sigue mostrando «Nutrición» sin depender de que la hija vacía herede el título. Es el único cambio en `home/`. El título de la pestaña del navegador lo fija el router con el mismo criterio.
- **Volver.** La cabecera solo muestra el título y no se le añade ningún control. El detalle empieza con un enlace visible «Volver a Nutrición», dentro del contenido de la página y por encima de la racha y de las tarjetas. Es un enlace del router a `/nutricion`, no una llamada al historial del navegador, para que funcione también cuando se ha entrado directamente por la URL. El «atrás» del navegador funciona además por sí solo, porque al detalle se llega con una navegación normal.
- **Recarga directa en `/nutricion/hidratacion`.** El detalle no depende de haber pasado antes por Nutrición: crea su propio estado y pide sus datos. Es la primera ruta de dos segmentos de la aplicación; `config.json` se pide con una ruta relativa que se resuelve contra `<base href="/">`, así que debe cargarse igual. **A comprobar en la fase 5**, recargando en esa URL.
- **Subruta desconocida.** `/nutricion/otra-cosa` no coincide con ninguna hija y cae en la regla global ya existente: redirige a `/` y de ahí a `/salud`, igual que cualquier otra URL desconocida. No se añade una regla propia (Open Questions).

**Reparto de componentes.** En `modules/app-container/nutrition/water-tracking/`, un componente por carpeta:

| Componente | Dónde | Situación | Responsabilidad |
|---|---|---|---|
| `water-today-progress` | Tarjeta | Nuevo | Progreso de hoy: texto y barra de progreso |
| `water-quick-log` | Tarjeta | Se queda | Los tres botones; pasa a mostrar también el error de un registro fallido |
| `water-goal-section` | Tarjeta | Se queda | Objetivo actual y formulario para cambiarlo, plegado tras un botón «Cambiar objetivo» cuando ya hay objetivo |
| `water-statistics-page` | Detalle | Nuevo | Página de la ruta: provee el estado del detalle, pinta el enlace de vuelta, la racha y las cuatro tarjetas con periodo, y conecta cada tarjeta con su periodo y sus datos |
| `water-current-streak` | Detalle | Nuevo | La racha actual, fuera de las tarjetas con periodo, con el texto que aclara que no depende de ningún periodo |
| `water-period-card` | Detalle | Nuevo | Envoltorio común de las cuatro tarjetas con periodo: título, subtítulo, selector de periodo en la cabecera y los estados de carga, error (con «Reintentar») y vacío; proyecta el contenido cuando hay datos |
| `water-statistics-summary` | Detalle | Nuevo | Contenido de «Resumen»: media diaria, días cumplidos (número y porcentaje) y mejor día, a partir de la respuesta |
| `water-bar-chart` | Detalle | Nuevo | Contenido de «Evolución»: construye la opción de barras, diaria o semanal según el periodo (decisión 16), y usa `app-chart` |
| `water-calendar-heatmap` | Detalle | Nuevo | Contenido de «Calendario»: construye la opción del calendario, usa `app-chart` y pinta la leyenda |
| `water-history-section` | Detalle | Se mueve | Contenido de «Historial»: la lista de los días con registro; deja de inyectar el estado y recibe los días como entrada |

Y en `modules/app-container/shared/components/`, porque no es específico de la hidratación:

| Componente | Situación | Responsabilidad |
|---|---|---|
| `period-selector` (`app-period-selector`) | Nuevo, salvo que `ui-foundation` ya aporte un selector compacto equivalente | Control compacto para elegir una opción de una lista corta; descrito más abajo |

Ningún componente desaparece. La página de detalle sustituye al contenedor `water-statistics-section` de una versión anterior de este diseño, y el antiguo selector global (`water-period-selector`) y el bloque `water-statistics-cards` de la versión anterior pasan a ser `period-selector`, compartido, y `water-statistics-summary`. En el detalle solo la página inyecta el estado; los demás reciben entradas, lo que los hace probables sin servicio. Los tres componentes de la tarjeta siguen inyectando `WaterTrackingStateService`, como hoy.

**Base visual: según `ui-foundation`.** Este change no define estilos de tarjeta, botones, tipografía, iconos ni colores. Las tarjetas de las dos pantallas usan la tarjeta base que deje `ui-foundation` (hoy es `section-card`), y los botones y enlaces, sus componentes o estilos base. Los estilos propios de los componentes de esta carpeta se limitan a la disposición de su contenido y solo usan variables de `ui-foundation`: ningún color literal en SCSS, en plantillas ni en TypeScript. La cabecera de `water-period-card` necesita título, subtítulo y un hueco para el selector. **A comprobar en la fase 5:** que la tarjeta base de `ui-foundation` admite ese contenido en su cabecera; si no lo admite, `water-period-card` coloca el selector como primer elemento del cuerpo de la tarjeta, se informa a la autora, y no se modifica el componente base desde este change.

**Página de Nutrición.** Una sola tarjeta «Hidratación», en este orden: progreso de hoy, registro rápido, objetivo y el enlace «Ver estadísticas» al detalle. Sin gráficos, sin mapa de calor y sin lista. El enlace está siempre visible, también sin registros (el detalle muestra entonces su estado vacío). La tarjeta «Historial de hidratación» desaparece de esta página.

**Pantalla de detalle.** De arriba abajo: enlace de vuelta, racha actual y cuatro tarjetas, cada una con su propio selector de periodo en la cabecera. No hay selector global. No incluye registro rápido ni formulario de objetivo: es de solo lectura.

| Bloque | Título | Contenido | Selector | Periodo por defecto |
|---|---|---|---|---|
| Racha actual | «Racha actual» | Número de días y el texto «Días seguidos cumpliendo tu objetivo. No depende del periodo de las tarjetas.» | No | — |
| Resumen | «Resumen» | Media diaria, días cumplidos (número y porcentaje) y mejor día | Sí | 30 días |
| Gráfico | «Evolución» | Gráfico de barras con la referencia del objetivo (decisión 16) | Sí | 30 días |
| Calendario | «Calendario» | Mapa de calor con su leyenda (decisión 17) | Sí | 3 meses |
| Historial | «Historial» | Lista de los días con registro, del más reciente al más antiguo | Sí | 30 días |

**Por qué esos periodos por defecto.**

- *Resumen, 30 días:* es el periodo por defecto de la API y el que ya tenía la pantalla; una media y un porcentaje sobre 7 días oscilan demasiado (cada día pesa un séptimo, decisión 9) y sobre un año dicen poco de cómo va el usuario ahora.
- *Gráfico, 30 días:* es el mayor periodo en el que cada barra sigue siendo un día (decisión 16), que es la lectura más directa; la vista por semanas queda a un toque.
- *Calendario, 3 meses:* con 30 días son cinco o seis columnas y el mapa de calor no dice casi nada que no diga ya el gráfico; 3 meses son 13 o 14 columnas, que es lo máximo que cabe en un móvil sin desplazamiento horizontal (decisión 17), y dan la vista de conjunto que justifica tener un calendario.
- *Historial, 30 días:* una lista de como mucho 30 filas al final de la pantalla; los periodos largos (hasta 366 filas) se eligen a propósito.

Tres tarjetas comparten periodo por defecto, así que al entrar se hacen dos peticiones (`30d` y `3m`) y no cuatro.

**La racha actual está fuera de las tarjetas con periodo.** Es global (decisión 9) y viaja con el mismo valor en todas las respuestas. Se muestra en su propio bloque, encima de las cuatro tarjetas y sin selector, y lo dice con texto visible, no solo con su posición. Dentro de «Resumen», que sí cambia con su selector, quedan las tres estadísticas que dependen del periodo. El valor se toma de la respuesta de estadísticas más reciente que haya recibido el estado, sea del periodo que sea; mientras no haya llegado ninguna, el bloque muestra «Cargando…», y si todas las peticiones pendientes fallan, una raya.

**Subtítulo de cada tarjeta.** El intervalo de días que abarca su periodo, tomado de `firstDay` y `lastDay` de su respuesta («13 sep – 12 oct»), con la misma tabla fija de meses de la decisión 16 y sin crear objetos `Date`. Como cada tarjeta puede tener un periodo distinto, el subtítulo deja a la vista qué días resume cada una. Mientras la tarjeta carga, o si falla, no hay subtítulo.

**El selector de periodo: `app-period-selector`.** Un único componente reutilizable para las cuatro tarjetas, en `modules/app-container/shared/components/period-selector/`, porque el mismo patrón servirá a `progress` y al resto de `nutrition`.

- Es genérico: recibe la lista de opciones (valor y texto), el valor seleccionado y una etiqueta accesible obligatoria, y emite el valor elegido. No conoce los periodos de la hidratación; la lista («7 días», «30 días», «3 meses», «1 año», con los valores `7d`, `30d`, `3m` y `1y`) se define una sola vez en `nutrition/water-tracking/`.
- Es un control nativo (`<select>`) con el aspecto compacto de la referencia visual de la autora (el valor elegido y un indicador de desplegable): teclado, lector de pantalla y selector nativo del móvil sin código propio. No se construye un menú a medida.
- Cada selector dice a qué tarjeta pertenece: su nombre accesible es «Periodo de» seguido del título de la tarjeta («Periodo de Resumen», «Periodo de Evolución», «Periodo de Calendario», «Periodo de Historial»). Así, cuatro controles con las mismas opciones se distinguen en un lector de pantalla y en las pruebas.
- Las opciones llevan el texto completo («30 días»), no una abreviatura como «30D», que un lector de pantalla leería mal (Open Questions).
- Su aspecto sale solo de las variables de `ui-foundation`. Si `ui-foundation` ya aporta un selector compacto equivalente, se usa ese y este componente no se crea; el control segmentado de `ui-foundation` no sirve aquí, porque cuatro opciones no caben en la cabecera de una tarjeta a 375 px.

**Progreso de hoy en la tarjeta.** Sale de `GET /today` (decisión 7), sin estadísticas y sin ECharts:

| Situación | Texto | Barra |
|---|---|---|
| Con objetivo y con entradas | «1050 ml de 2750 ml» | Rellena en proporción, con tope en el 100 % |
| Con objetivo y sin entradas hoy | «0 ml de 2750 ml» | Vacía |
| Objetivo alcanzado (`goalMet` verdadero) | «2800 ml de 2750 ml» y «Objetivo cumplido» | Llena |
| Sin objetivo (`goalMl` es `null`) | «1050 ml hoy» y «Sin objetivo configurado» | No se pinta |

La barra usa el componente de barra de progreso de `ui-foundation` si lo aporta; si no, es un elemento propio de `water-today-progress` cuyos estilos usan solo las variables de `ui-foundation` (el relleno, la variable de acento), sin ningún color literal. Lleva `role="progressbar"`, con mínimo 0, máximo el objetivo, valor actual limitado al objetivo y, como texto del valor, la misma frase visible; el texto visible es además la alternativa completa. Que el día esté cumplido lo dice `goalMet`, no una comparación hecha en el cliente; la anchura de la barra es presentación. Mientras carga muestra «Cargando…» con `role="status"` y, si falla, el error con `role="alert"`, como las secciones actuales. Sin objetivo, el formulario del objetivo aparece desplegado.

**Estado: dos servicios, uno por pantalla.** La tarjeta y el detalle nunca están a la vez en pantalla y el detalle es de solo lectura, así que no comparten instancia:

- **`WaterTrackingStateService`** (lo sigue proveyendo `NutritionPageComponent`): objetivo actual y día actual, cada uno con su carga y su error, y las acciones de registrar y de guardar el objetivo. Deja de cargar el historial.
- **`WaterStatisticsStateService`** (nuevo, lo provee `WaterStatisticsPageComponent`): el periodo de cada una de las cuatro tarjetas y una memoria de respuestas por periodo. Detalle en «Estado del detalle», más abajo.

Cada instancia se crea al entrar en su pantalla y se destruye al salir. Por eso el detalle pide siempre datos recientes y ve lo que se haya registrado o cambiado en la tarjeta justo antes, sin ningún mecanismo de sincronización; y al volver a Nutrición la tarjeta se recarga.

**Estado del detalle: un periodo por tarjeta y una memoria por periodo.**

- *Periodo por tarjeta.* Cuatro valores independientes (resumen, gráfico, calendario e historial), cada uno con su valor por defecto y sin persistir (no hay almacenamiento local). Cambiar el de una tarjeta no toca los otros tres. Vuelven a su valor por defecto en cada entrada a la pantalla.
- *Memoria por periodo.* Para cada uno de los cuatro periodos, como mucho una entrada con su situación (cargando, con datos o con error) y su respuesta. Las tarjetas no guardan datos propios: cada una muestra la entrada del periodo que tiene seleccionado. Sus datos, su carga y su error son, por tanto, los de ese periodo.
- *Sin peticiones duplicadas.* Al seleccionar un periodo, si ya hay una entrada cargando o con datos, se reutiliza y no se pide nada: dos tarjetas con el mismo periodo comparten una única petición y una única respuesta, y volver a un periodo ya visto en la misma visita es instantáneo. Solo se pide cuando no hay entrada o cuando la que hay es un error.
- *Peticiones independientes.* Cada periodo se pide por separado al endpoint de estadísticas (decisión 7). Que uno falle o tarde no afecta a las tarjetas que muestran otro.
- *Respuestas tardías.* Cada respuesta se guarda bajo su periodo, así que una respuesta que llega tarde no puede acabar en una tarjeta que ya muestra otro periodo: se queda en la memoria y sirve si se vuelve a él. No hace falta cancelar ni encadenar peticiones.
- *Reintento.* Una tarjeta en error ofrece «Reintentar», que vuelve a pedir su periodo; la entrada con error se sustituye y todas las tarjetas con ese periodo pasan a cargar.
- *Cuándo se invalida la memoria.* Al entrar en la pantalla, y solo entonces. Desde el detalle no se registra agua ni se cambia el objetivo, que son las dos acciones que cambiarían las estadísticas, así que dentro de una visita no hay nada propio que la invalide. Como la memoria vive en el servicio de estado y este se destruye al salir, entrar de nuevo (también al volver de Nutrición tras registrar o cambiar el objetivo, o al recargar el navegador) empieza con la memoria vacía, sin lógica de invalidación. No hay caducidad por tiempo (Risks).
- *Valores derivados.* La lista del historial (los días con entradas de la respuesta de su periodo, del más reciente al más antiguo) y la racha actual (de la respuesta más reciente recibida).

**Alternativa descartada: que cada tarjeta guarde sus propios datos y haga su propia petición.** Es lo más simple de explicar, pero al entrar pediría cuatro veces (tres de ellas, la misma respuesta de `30d`) y cada vez que dos tarjetas coincidieran en un periodo lo pedirían por duplicado.

**Alternativa descartada: una sola instancia compartida, provista en la ruta `nutricion`.** Ahorraría una petición al ir y volver, pero los proveedores de ruta no se destruyen al salir de ella, así que el estado quedaría vivo y obsoleto y habría que añadir recargas explícitas al entrar en cada pantalla, además de invalidar la memoria del detalle al registrar agua o cambiar el objetivo desde la tarjeta. Con una instancia por pantalla, esa invalidación ocurre sola.

**`WaterTrackingService`** gana dos operaciones: el día actual y las estadísticas de un periodo. Deja de usarse `getHistory`, que se retira del cliente junto con su prueba y con `DEFAULT_HISTORY_DAYS`. **DTOs** nuevos en `shared/entities/DTOS/water-tracking/`, uno por archivo y con el nombre de la clase del backend: la respuesta de estadísticas, el día (elemento de la serie y también respuesta de `/today`), la semana de la serie, el mejor día y el tipo cerrado del periodo. `WaterHistoryDayRs` deja de usarse y se elimina.

**La lista del historial sale de las estadísticas.** El delta de la spec pide que el historial corresponda al periodo elegido en su bloque, uno de los mismos cuatro periodos que los demás. Por eso el cliente no llama a `/history`: el historial es un valor derivado de la serie de las estadísticas de su periodo (los días con entradas, del más reciente al más antiguo), y su carga y su error son los de ese periodo. Cuando coincide en periodo con otra tarjeta, no cuesta ninguna petición. `WaterHistorySectionComponent` conserva su aspecto y añade a cada fila el estado del día (cumplido, no cumplido, sin objetivo) en texto.

**Qué se recarga:**

| Acción | Pantalla | Recarga | Estado de carga visible |
|---|---|---|---|
| Entrar en Nutrición (o volver del detalle) | Tarjeta | Objetivo y día actual | Sí, cada bloque el suyo |
| Registrar una entrada | Tarjeta | Día actual | No; se mantiene el dato hasta que llega el nuevo |
| Guardar el objetivo | Tarjeta | Objetivo y día actual | No |
| Entrar en el detalle (o recargar en su URL) | Detalle | Estadísticas de `30d` (resumen, gráfico e historial) y de `3m` (calendario): dos peticiones | Sí, cada tarjeta el suyo |
| Cambiar el periodo de una tarjeta a uno no visto en esta visita | Detalle | Estadísticas de ese periodo: una petición | Sí, solo en esa tarjeta, conservando su altura para que la página no salte; las demás no cambian |
| Cambiar el periodo de una tarjeta a uno ya cargado en esta visita | Detalle | Nada | No; la tarjeta cambia al instante |
| «Reintentar» en una tarjeta con error | Detalle | Estadísticas de su periodo | Sí, en todas las tarjetas que muestran ese periodo |

Un registro fallido se muestra junto a los botones de registro rápido, con `role="alert"`, y no borra el progreso que ya había en pantalla.

**Estados de cada tarjeta del detalle.** Son por tarjeta, no de la página: una puede estar cargando o en error mientras las demás muestran datos. *Cargando* (texto con `role="status"` dentro de la tarjeta); *error* (mensaje con `role="alert"` y botón «Reintentar»; el selector sigue activo para elegir otro periodo); *vacío*, cuando el `firstRecordDay` de su respuesta es `null` (mensaje «Aún no hay registros de agua» en lugar del contenido; las tarjetas de gráfico no montan `app-chart`, de modo que ECharts no se descarga); *sin objetivo* (en «Resumen», la estadística de días cumplidos con el texto «Sin objetivo»; en «Evolución», barras sin línea de referencia). En los cuatro estados la tarjeta conserva su título y su selector. Como `firstRecordDay` no depende del periodo, un usuario sin registros ve las cuatro tarjetas vacías y la racha a cero. El enlace de vuelta y el bloque de la racha están siempre.

**Pruebas del cliente.**

*Se adaptan:*

- `app.routes.spec.ts`: el doble de `WaterTrackingService` ofrece las operaciones nuevas; se añaden que `/nutricion/hidratacion` se resuelve y que una subruta desconocida bajo `/nutricion` acaba en `/salud`.
- `home.component.spec.ts`: mismo doble; se añade que en el detalle la cabecera muestra «Hidratación», que el destino marcado sigue siendo «Nutrición» y que siguen siendo cinco destinos.
- `nutrition-page.component.spec.ts`: una sola tarjeta «Hidratación» con progreso, registro rápido, objetivo y el enlace «Ver estadísticas» con su destino; registrar con un toque actualiza el progreso de hoy sin recargar la página; no hay ni lista del historial ni gráficos.
- `water-tracking-state.service.spec.ts`: carga objetivo y día actual al crearse; tras registrar recarga solo el día actual; tras guardar el objetivo recarga ambos; cada error en su estado.
- `water-goal-section.component.spec.ts`: formulario plegado con objetivo y desplegado sin él; el resto de casos se conservan.
- `water-quick-log.component.spec.ts`: se añade el error de un registro fallido.
- `water-history-section.component.spec.ts`: pasa a recibir los días por entrada; se añade el estado de cada día; la carga y el error dejan de ser suyos.
- `water-tracking.service.spec.ts`: se añaden `GET /today` y `GET /statistics` con su periodo; se retiran las dos pruebas de `/history`.

*Nuevas:*

- `water-today-progress`: las cuatro situaciones de la tabla, los atributos de la barra, el tope al superar el objetivo, carga y error.
- `water-statistics-state.service`: al crearse pide `30d` y `3m`, una vez cada uno, aunque tres tarjetas compartan `30d`; periodo por defecto de cada tarjeta; cambiar el periodo de una tarjeta no cambia el de las otras; elegir un periodo ya cargado o en carga no lanza otra petición; elegir uno nuevo lanza exactamente una; una respuesta tardía se guarda en su periodo y no altera lo que muestra una tarjeta que ya está en otro; el error de un periodo afecta solo a las tarjetas que lo muestran; «Reintentar» vuelve a pedirlo; historial derivado (solo días con entradas, orden descendente); racha tomada de la respuesta más reciente; una instancia nueva empieza con la memoria vacía.
- `water-statistics-page`: enlace de vuelta con su destino; la racha y las cuatro tarjetas con sus títulos; cada selector con su nombre accesible («Periodo de …») y su valor por defecto; cambiar el selector de una tarjeta cambia su contenido y deja intactos el periodo y el contenido de las otras tres; una tarjeta en carga o en error junto a otras con datos; con un usuario sin registros no se monta ningún gráfico.
- `water-period-card`: título, subtítulo con el intervalo, selector en la cabecera; estados de carga, error con «Reintentar» y vacío; emite el cambio de periodo y el reintento; proyecta el contenido solo cuando hay datos.
- `period-selector` (compartido): pinta las opciones recibidas, marca la seleccionada, emite la elegida, expone la etiqueta como nombre accesible y se maneja con teclado por ser un control nativo.
- `water-current-streak` y `water-statistics-summary`: valor de la racha, su texto aclaratorio, carga y raya; valores del resumen, rayas y «Sin objetivo».
- `water-bar-chart` y `water-calendar-heatmap`: las funciones puras que construyen cada opción, con la paleta como argumento (decisión 14).

Ninguna sección importa de otra: lo compartido entre secciones (`app-chart` con su cargador y su paleta, y `period-selector`) vive en `modules/app-container/shared/components/`, y el helper genérico que lee un color de una variable CSS, en `shared/helpers/`. Un futuro resumen de hidratación en Progreso usaría la misma API y ese mismo `app-chart`, no los componentes de esta carpeta (Non-Goals).

### 16. Gráfico de barras: una barra por día en 7 y 30 días; una barra por semana en 3 meses y 1 año

Decisión de la autora, que sustituye a la anterior (una barra por día en todos los periodos, con desplazamiento horizontal en los largos).

**Qué serie usa cada periodo.** El cliente elige la serie por el `period` de la respuesta, sin calcular nada:

| Periodo | Serie | Barras | Cada barra |
|---|---|---|---|
| 7 días | `days` | 7 | Total del día |
| 30 días | `days` | 30 | Total del día |
| 3 meses | `weeks` | 13 o 14 | Media diaria de la semana |
| 1 año | `weeks` | 53 o 54 | Media diaria de la semana |

En los cuatro casos las barras caben en el ancho de un móvil: **el gráfico de barras no necesita desplazamiento horizontal** y el eje de valores va a la izquierda.

**Qué es una semana.** De lunes a domingo, en días locales del usuario. La serie semanal se construye sobre las fechas de la serie diaria, que ya son días locales, así que la zona horaria no interviene una segunda vez. El periodo se reparte entre todas las semanas que toca. De cada una, `firstDay` es su lunes, o el primer día del periodo si la semana empieza antes; `lastDay` es su domingo, u hoy si la semana no ha terminado. La primera y la última semana pueden ser parciales.

**Días que cuentan.** Los días de la semana que son días computables según la decisión 9: están dentro del periodo, no son anteriores a `firstRecordDay` y no son posteriores a hoy. Una semana puede quedar recortada por tres motivos, que se pueden combinar: el inicio del periodo, el primer registro del usuario y el día en curso. `daysCounted` es el número de días que cuentan (de 0 a 7). El día en curso cuenta aunque esté incompleto, igual que en la media diaria.

**Valor de la barra (`averageDailyMl`).** Suma de los totales de los días que cuentan dividida entre `daysCounted`. Los días sin entradas cuentan como cero. Entero en mililitros, redondeando la mitad hacia arriba. Es la misma regla que la media diaria del periodo aplicada a una semana; por eso la suma de los totales de todas las semanas, dividida entre la suma de sus `daysCounted`, es la media diaria del periodo.

- Semana con días que cuentan y ninguna entrada: `averageDailyMl` es `0` y la barra tiene altura cero.
- Semana sin ningún día que cuente (entera anterior al primer registro, o usuario sin registros): `daysCounted` es `0` y `averageDailyMl` es `null`. No hay barra; el hueco conserva su sitio en el eje.
- Semana parcial: la media se calcula solo sobre los días que cuentan. Si hoy es miércoles, la semana en curso promedia lunes, martes y miércoles; si el primer registro fue un sábado, esa semana promedia sábado y domingo.

**Referencia del objetivo (`averageGoalMl`).** Media de los objetivos vigentes en los días de la semana que cuentan y tienen objetivo vigente, con el mismo redondeo. El objetivo puede cambiar a mitad de semana: con 2000 ml de lunes a miércoles y 2700 ml de jueves a domingo, la referencia es 2400 ml. Los días que cuentan pero no tienen objetivo no entran en esta media (solo puede ocurrir en la semana en que el usuario fija su primer objetivo). Si ningún día que cuenta tiene objetivo, `averageGoalMl` es `null` y esa semana no tiene referencia.

**Cómo se pinta la referencia.** En ambos gráficos es una línea escalonada, nunca una línea horizontal única, que sería falsa en cuanto el objetivo cambia dentro del periodo:

- *Diario:* un escalón por día con el `goalMl` de ese día; se interrumpe en los días sin objetivo.
- *Semanal:* un escalón por semana, del ancho de su barra, con `averageGoalMl`; se interrumpe en las semanas sin referencia.

**No existe la «semana cumplida».** La serie semanal no lleva `goalMet` y las barras semanales tienen todas el mismo color: que la media de una semana alcance la media de sus objetivos no dice que sus días se cumplieran, y una segunda definición de «cumplido» contradiría las tarjetas y el calendario, que siguen siendo diarios. La comparación entre barra y referencia es solo visual. En el gráfico diario, las barras de los días cumplidos usan el color de la serie (el de acento) y el resto el de la serie atenuada, ambos de la paleta (decisión 13), y la información no depende solo del color porque la barra alcanza o no la línea.

**Dónde se calcula.** En el servidor, en la pieza pura «Serie de semanas» de la decisión 6, a partir de la misma serie diaria y dentro de la misma respuesta (decisión 7). Es un cálculo, y según `CLAUDE.md` los cálculos pertenecen a la API; el cliente no suma, no promedia y no decide en qué día empieza una semana.

**Presentación en el cliente:**

- Título visible sobre el gráfico, dentro de la tarjeta «Evolución» y distinto según la serie: «Agua por día» y «Media diaria por semana», para que el cambio de significado de la barra no pase inadvertido al cambiar el periodo de esa tarjeta.
- Colores: la serie, la serie atenuada, la línea de referencia, los ejes, la rejilla y el texto salen de la paleta (decisión 13); la opción no contiene ningún color literal.
- Eje de categorías. En el diario, el día. En el semanal, la fecha de inicio de la semana (`firstDay`) con día y mes abreviado («5 oct»), obtenida de la cadena `YYYY-MM-DD` con una tabla fija de meses, sin crear objetos `Date`. En 3 meses se etiqueta una semana de cada dos; en 1 año, solo la primera semana que empieza en cada mes.
- Descripción emergente de la barra semanal: intervalo de la semana (`firstDay` a `lastDay`), media diaria, objetivo medio (o «Sin objetivo») y días que cuentan cuando son menos de siete, por ejemplo «Semana del 5 al 11 de oct · media 1500 ml al día · objetivo medio 2400 ml» o «… · 3 días».
- Texto alternativo. Diario: periodo y días cumplidos sobre evaluados. Semanal: que cada barra es la media diaria de una semana, el periodo, el número de semanas y la media diaria del periodo. Todos los valores salen de campos de la respuesta.

**Alternativas descartadas:**

- *Una barra por día también en 3 meses y 1 año, con desplazamiento horizontal o con el zoom de la librería de gráficos.* Era la decisión anterior; la autora prefiere ver el periodo entero de un vistazo. El detalle diario de los periodos largos lo dan el calendario y la lista del historial.
- *Que la barra sea el total de la semana.* Las semanas parciales parecerían malas semanas y la barra no se podría comparar con un objetivo que es diario.
- *Bloques de siete días contados hacia atrás desde hoy.* Evitaría la última semana parcial, pero las barras no coincidirían con las columnas del calendario, que van de lunes a domingo, y cada barra cambiaría de días a diario.
- *Promediar en el cliente a partir de `days`.* Contrario a la regla de `CLAUDE.md` y obligaría al cliente a conocer el primer registro, el redondeo y el inicio de la semana.

### 17. Mapa de calor: semanas en columnas, tamaño de celda fijo, cuatro estados

**Orientación y rango.** Siempre horizontal, como en GitHub: siete filas (de lunes a domingo) y una columna por semana, con celdas de tamaño fijo. El ancho resulta del número de semanas:

| Periodo | Columnas | En un móvil |
|---|---|---|
| 7 días | 1 o 2 | Cabe |
| 30 días | 5 o 6 | Cabe |
| 3 meses | 13 o 14 | Cabe, justo |
| 1 año | 53 o 54 | Desplazamiento horizontal, abierto en las semanas más recientes |

Solo se pintan los días del periodo. Una sola orientación y un solo constructor de opción para los cuatro periodos; con 7 días el calendario aporta poco, pero se mantiene por coherencia. El periodo por defecto de la tarjeta «Calendario» es 3 meses (decisión 15), el mayor que cabe sin desplazamiento. El contenedor desplazable recibe foco de teclado y un nombre accesible.

**Estados.** Cada día se clasifica con los datos del servidor, sin recalcular reglas:

| Estado | Condición | Papel de color (paleta de la decisión 13, según `ui-foundation`) |
|---|---|---|
| Cumplido | `goalMet` verdadero | Acento pleno |
| Parcial | Hay entradas y `goalMet` falso | Acento atenuado |
| Con registro, sin objetivo | Hay entradas y `goalMet` es `null` | Neutro |
| Sin registro | Total cero | Superficie, con borde |

Este change no fija ningún color: los cuatro papeles se resuelven con variables de `ui-foundation` en la paleta de los gráficos, y la leyenda en HTML usa esas mismas variables directamente en sus estilos. Al depender del acento, los estados «cumplido» y «parcial» cambian con el color que elija el usuario. Si a un papel no le corresponde ninguna variable, se resuelve con la autora (decisión 13), nunca con un color suelto en un componente.

**Accesibilidad:**

- El calendario no depende solo del color para distinguir los estados: la leyenda textual, la descripción emergente de cada celda y la lista del historial dan la misma información con texto, y eso vale con cualquier tema y con cualquier color de acento.
- Además, «cumplido» debe distinguirse de los demás estados por luminosidad, no por tono. **A comprobar, en tema claro y en tema oscuro:** contraste de al menos 3:1 entre «cumplido» y cada uno de los otros estados; «parcial» y «sin registro» pueden ser tonos próximos y dependen del borde. Con un color de acento elegido por el usuario ese contraste ya no lo puede garantizar este change: depende de las variantes que derive `ui-foundation` (Risks).
- Leyenda textual fuera del gráfico, en HTML, con los cuatro estados.
- Cada gráfico tiene un texto alternativo que resume lo que muestra (periodo y días cumplidos sobre evaluados; en el gráfico semanal, lo indicado en la decisión 16).
- La lista del historial (decisión 15) es la alternativa textual completa: fecha, total, objetivo y estado de cada día con registro, legible con lector de pantalla y teclado. Para que cubra los mismos días que el calendario o el gráfico hay que elegir en la tarjeta «Historial» el mismo periodo, porque cada tarjeta tiene el suyo. No se añade una tabla aparte.
- Al tocar una celda o una barra diaria, descripción emergente con fecha, total y objetivo; la de la barra semanal se describe en la decisión 16. **A comprobar** su comportamiento táctil.

**Alternativa descartada: calendario hecho con una rejilla CSS, sin ECharts.** Sería probable en jsdom, usaría las variables CSS directamente y cada celda sería un elemento real. Se descarta porque la autora eligió ECharts como librería de los gráficos y un segundo modo de dibujar complica reutilizarlo en `progress`. Queda como plan B si las comprobaciones de la fase 4 fallan para el calendario (ver Risks).

### 18. Tamaño del paquete

ECharts completo ronda 1 MB minificado; importando solo los módulos de la decisión 13 se espera bastante menos (**no medido**). Como entra por importación dinámica, queda en un trozo diferido y **no cuenta para el presupuesto `initial`**, que es el único de JavaScript configurado.

No se cambian los presupuestos de `angular.json`. La fase 4 anota el tamaño del paquete inicial antes y después de añadir la librería y el tamaño del trozo de ECharts; el criterio de cierre es que el inicial no crezca más que lo que ocupa el código propio y que no aparezca ningún aviso nuevo. Si ECharts acabara en el paquete inicial, la fase no se cierra. Los estilos de los componentes nuevos deben caber en el presupuesto de 4 kB por componente.

**ECharts ligado a la pantalla de detalle.** La fase 6, que es la primera en la que una pantalla real usa `app-chart`, lo comprueba de dos maneras. En el build de producción (`npm run build`), inspeccionando los trozos de `dist/kora-health-web`: ECharts está en un trozo diferido propio; ni el paquete inicial ni el trozo de la página de Nutrición lo importan, ni directamente ni a través de `app-chart`; solo se llega a él desde el trozo de la pantalla de detalle. Y en el navegador, con la pestaña de red: al cargar `/nutricion` no se pide el trozo de ECharts; se pide al entrar en `/nutricion/hidratacion` con datos que pintar. Si el trozo de Nutrición arrastrara ECharts, la fase no se cierra.

### 19. Verificación end-to-end contra la API real

Las fechas y cantidades de partida son las aportadas por la autora y se confirman en el paso 1. Las entradas no se pueden borrar y el objetivo debe quedar en 2750 ml; toda escritura se aprueba antes con la autora, como en `user-local-day`.

**Observable con los datos existentes, sin escribir nada:**

1. Estado previo: `GET /goal` (2750) y `GET /history` (2026-10-11 con 1050 ml y 2026-10-10 con 850 ml, ambos con `goalMl` 2750).
2. Tras la migración: mismas respuestas, byte a byte.
3. Estadísticas de `7d`: serie de siete puntos con ceros; `firstRecordDay` 2026-10-10; media igual a 1900 entre los días transcurridos desde el 10 de octubre hasta el día de la verificación; `daysGoalMet` 0; `daysEvaluated` igual a ese mismo número de días, con el día de la verificación incluido aunque no esté cumplido; porcentaje 0; racha 0; mejor día 2026-10-11 con 1050 ml. `GET /today` devuelve la fecha del día de la verificación, su total (cero si ese día no hay entradas), `goalMl` 2750 y `goalMet` falso, y coincide con el último elemento de `days`.
4. Los cuatro periodos empiezan antes del primer registro: la media y `daysEvaluated` son los mismos en todos; cambian solo la longitud de `days` (7, 30, 89–92, 365–366) y la de `weeks`. En `3m` y `1y`, la semana del lunes 5 al domingo 11 de octubre de 2026 es un caso real de primer registro a mitad de semana: `daysCounted` 2, `averageDailyMl` 950 (1900 entre los dos días que cuentan, sábado 10 y domingo 11) y `averageGoalMl` 2750; las semanas anteriores llevan `daysCounted` 0 y medias `null`; la última semana está recortada por el día de la verificación.
5. Rechazos: `period` desconocido y `days=0` responden `400`.
6. En el navegador. La aplicación es mobile-first: todo se comprueba primero con un viewport de móvil (375 px de ancho) y después se repite a ancho de escritorio (1280 px, con la navegación en la cabecera). Las comprobaciones visuales se hacen **en los dos temas**, claro y oscuro, en ambos anchos, empezando por 375 px:
   - *Tarjeta de Nutrición (`/nutricion`):* una sola tarjeta «Hidratación» con el progreso de hoy («X ml de 2750 ml» y su barra), los tres botones de registro, el objetivo y el enlace «Ver estadísticas»; sin gráficos, sin calendario y sin lista; la página no tiene desplazamiento horizontal. En la pestaña de red se piden `goal` y `today`, no `statistics` ni `history`, y no se descarga el trozo de ECharts.
   - *Entrar al detalle:* el enlace «Ver estadísticas» lleva a `/nutricion/hidratacion`; la cabecera muestra «Hidratación»; el destino activo de la navegación sigue siendo «Nutrición»; se pide `statistics` dos veces, una con `30d` y otra con `3m`, y, en ese momento y no antes, el trozo de ECharts.
   - *Contenido del detalle:* la racha actual con su texto aclaratorio y cuatro tarjetas («Resumen», «Evolución», «Calendario» e «Historial»), cada una con su selector en la cabecera y su periodo por defecto (30 días, 30 días, 3 meses y 30 días) y con el intervalo de días como subtítulo; barras con la línea del objetivo, calendario con su leyenda y lista del historial; al recorrer los cuatro periodos en la tarjeta «Evolución», barras diarias en 7 y 30 días y semanales en 3 meses y 1 año (todas visibles sin desplazamiento horizontal, con la referencia escalonada); al recorrerlos en «Calendario», desplazamiento horizontal solo dentro del calendario en 1 año; la página no tiene desplazamiento horizontal en ningún caso.
   - *Periodo por tarjeta:* cambiar el periodo de una tarjeta cambia solo esa tarjeta (contenido y subtítulo); las otras tres conservan su periodo y su contenido, y la racha no cambia. Se comprueba con las cuatro tarjetas, una por una. En la pestaña de red: elegir un periodo no visto lanza una sola petición de `statistics`; elegir en otra tarjeta ese mismo periodo, o volver a uno ya visto, no lanza ninguna. Salir del detalle y volver a entrar restaura los periodos por defecto y vuelve a pedir `30d` y `3m`. Con teclado: se llega a cada selector con el tabulador y se cambia de opción con las flechas; cada selector tiene su nombre accesible («Periodo de …»).
   - *Temas:* todo lo anterior se ve bien en tema claro y en tema oscuro. Con el detalle abierto y los gráficos ya pintados, cambiar de tema repinta barras, línea de referencia, ejes, texto y celdas del calendario sin recargar la página, y la leyenda sigue coincidiendo con las celdas; lo mismo al cambiar el valor de la variable de acento (desde las herramientas del navegador, porque el selector de acento en ajustes no existe todavía). Los estados del calendario siguen distinguiéndose en ambos temas y la leyenda textual está presente.
   - *Volver:* el enlace «Volver a Nutrición» lleva a `/nutricion`; el «atrás» del navegador hace lo mismo, y el «adelante» vuelve al detalle.
   - *Recarga directa:* recargar el navegador en `/nutricion/hidratacion` muestra el detalle completo, con «Hidratación» en la cabecera y «Nutrición» activo, sin pasar antes por Nutrición.
   - *Subruta desconocida:* `/nutricion/no-existe` acaba en `/salud`.
   - *Destino activo:* en `/nutricion` y en `/nutricion/hidratacion` hay un único destino marcado, «Nutrición», tanto en la barra inferior del móvil como en la cabecera de escritorio.

**Requiere escribir datos de prueba:**

7. Cambio de objetivo: `PUT` a un valor distinto → el día de hoy pasa a tener ese objetivo, en `/today` y en la tarjeta de Nutrición, y el 10 y el 11 de octubre siguen con 2750, en `/history` y en `days`.
8. Segundo cambio el mismo día → solo cuenta el último.
9. Día cumplido: con el objetivo temporalmente bajo, una entrada que lo alcance, registrada desde la tarjeta de Nutrición → el progreso de hoy se actualiza en la tarjeta sin recargar la página y pasa a «Objetivo cumplido»; `GET /today` lleva `goalMet` verdadero; en las estadísticas, hoy cumplido, racha 1, `daysGoalMet` 1; `daysEvaluated` no cambia, porque hoy ya contaba antes de cumplirse, y el porcentaje sube. Al entrar después en el detalle se ve ya la entrada nueva.
10. Opcional, con cambio de zona y restauración: objetivo fijado en una zona adelantada y de nuevo tras volver a `Europe/Madrid`, para observar que no queda una fila posterior a hoy.
11. Restaurar: `PUT` con 2750 y zona `Europe/Madrid`. Hoy vuelve a evaluarse con 2750.

Estado final de la base: la fila sembrada, una fila del historial con la fecha de la verificación y valor 2750, y las entradas añadidas en el paso 9, que son permanentes y pasan a formar parte de los datos de referencia.

**Cubierto solo por prueba automática** (no debe leerse como verificado en real): usuario sin objetivo y días sin objetivo (incluida la tarjeta de Nutrición sin objetivo configurado); rachas de más de un día y racha que continúa con el día en curso incompleto; racha más larga que el periodo; periodo de un año con datos; primer registro anterior al periodo; redondeos y empates; fin de mes y año bisiesto en `3m` y `1y`; semana que cruza un cambio de objetivo en mitad de la semana, semana sin objetivo, semana entera sin entradas posterior al primer registro y semana recortada por el inicio del periodo.

**Límites:** solo macOS; un único navegador de escritorio emulando un móvil de 375 px de ancho, salvo que la autora lo pruebe en un teléfono. El tema se cambia con el mecanismo que aporte `ui-foundation`; el color de acento, editando su variable en las herramientas del navegador.

## Risks / Trade-offs

- [La migración se aplica sola al arrancar la API contra la base real] → Revisar el archivo y su SQL antes de arrancar, y anotar el estado previo (decisión 3). La migración no toca las tablas existentes.
- [`water_goals` podría tener más de una fila por usuario: no hay índice único] → Comprobarlo antes de migrar; si ocurriera, la migración falla entera y no deja datos a medias.
- [Dato duplicado entre `water_goals` y la última fila del historial] → Una sola operación de escritura en una transacción; invariante documentado y cubierto con los dobles; retirada de `water_goals` en Open Questions.
- [Dos `PUT /goal` simultáneos el primer cambio del día chocarían con el índice único y uno respondería `500`] → Se acepta: un solo usuario y una acción manual. No se añade reintento.
- [El repositorio de EF no tiene pruebas automáticas; el doble reimplementa sus reglas] → Los pasos 7, 8 y 10 de la decisión 19 ejercitan el repositorio real.
- [Cambiar de zona horaria desplaza hasta un día la frontera entre dos objetivos] → Comportamiento documentado (decisión 4), acotado y reversible.
- [Cambiar el objetivo altera el día de hoy y puede romper o crear la racha de hoy] → Es la regla aprobada; el cliente recarga el progreso de hoy al guardar el objetivo para que se vea de inmediato, y el detalle pide las estadísticas cada vez que se entra.
- [Los días anteriores al change se evalúan con 2750 ml aunque en su momento el objetivo fuera otro] → Decisión de la autora; no hay dato mejor.
- [Suposiciones sobre ECharts 6 que resulten falsas, como ocurrió con una API de plataforma en `user-local-day`] → Todas están marcadas «a comprobar» y la fase 4 existe para resolverlas en un navegador real antes de construir los gráficos del detalle. Plan B para el calendario: rejilla CSS (decisión 17), que no cambia la API ni las specs.
- [ECharts acaba en el paquete inicial o pesa más de lo esperado] → Medición obligatoria en la fase 4 (decisión 18).
- [Una importación descuidada hace que la página de Nutrición arrastre ECharts] → Inspección de los trozos del build y de la pestaña de red en la fase 6 y en el paso 6 de la decisión 19 (decisión 18).
- [Las pruebas de componentes no ejecutan ECharts: un gráfico puede estar roto con todas las pruebas en verde] → Comprobación en navegador, en ambos temas, en las fases 4, 6 y 7; las funciones que construyen opciones sí están probadas.
- [La barra semanal promedia y oculta la variación entre días, y una semana parcial de un solo día pesa a la vista lo mismo que una completa] → La descripción emergente indica cuántos días cuentan; el calendario y la lista del historial dan el detalle diario del mismo periodo.
- [La referencia semanal es una media de objetivos y, en una semana con cambio de objetivo, muestra un nivel que nunca fue el objetivo de ningún día] → Se rotula como «objetivo medio» y no se deriva de ella ningún estado de cumplimiento (decisión 16).
- [La barra cambia de significado al cambiar el periodo de la tarjeta «Evolución»: total de un día o media diaria de una semana] → Título distinto sobre el gráfico y texto alternativo propio de cada serie.
- [El porcentaje de días cumplidos baja al empezar cada día y se recupera al cumplirlo, mientras que la racha no se inmuta] → Decisión de la autora; la asimetría y su motivo están en la decisión 9.
- [`/history` gana un límite superior de 366 días que antes no tenía] → Ningún cliente lo supera; queda en la tabla de contrato y en el README.
- [`/history` queda sin ningún cliente que lo use y puede degradarse sin que nadie lo note] → Sigue cubierto por las pruebas de backend y por los pasos 1, 2 y 7 de la decisión 19.
- [Sin índice en `water_entries`, la consulta de un año recorre toda la tabla] → Irrelevante con el volumen actual; Open Questions.
- [Las estadísticas quedan a un toque de distancia y la página de Nutrición ya no muestra ni la racha ni el historial] → Decisión de la autora; la tarjeta conserva lo que se usa a diario (progreso, registro y objetivo) y el enlace «Ver estadísticas» está siempre visible.
- [La tarjeta y el detalle no comparten estado: ir y volver repite peticiones] → Se acepta: son dos peticiones por pantalla y garantizan que cada una muestra datos recientes; la memoria del detalle no sobrevive a la visita (decisión 15, Non-Goals).
- [`ui-foundation` no existe todavía: si no está fusionado cuando toque, las fases de cliente no pueden empezar, y sus nombres de variables y componentes no se conocen] → Dependencia explícita en el Migration Plan: las fases 4, 5 y 6 comprueban primero que está fusionado y, si no, paran e informan; las fases 2 y 3 (backend) no dependen de él y pueden adelantarse. Este documento describe papeles, no nombres, y el único sitio que asocia papeles con variables es la paleta de la decisión 13.
- [Lo que aporte `ui-foundation` puede no encajar con lo supuesto aquí: una tarjeta sin hueco en la cabecera, otro mecanismo de cambio de tema, colores en un formato que ECharts no entienda] → Puntos «a comprobar» de las decisiones 13 y 15, que se resuelven en las fases 4 y 5 antes de construir el contenido del detalle; si alguno falla se decide con la autora, sin modificar la base visual desde este change.
- [Los colores de los gráficos se leen en ejecución: si la relectura no se dispara, un gráfico queda con los colores del tema anterior] → Observador del elemento raíz más la preferencia del sistema, o el aviso propio de `ui-foundation` si existe (decisión 13); se comprueba en el navegador en las fases 4 y 6 y en el paso 6 de la decisión 19, porque las pruebas automáticas no ejecutan ni ECharts ni el cálculo de estilos.
- [Con un color de acento elegido por el usuario, el contraste entre los estados del calendario deja de estar garantizado por este change] → El calendario no depende solo del color (leyenda, descripción emergente y lista del historial, decisión 17); el contraste de las variantes del acento es responsabilidad de `ui-foundation` y del futuro selector de acento.
- [Cuatro selectores en una pantalla pueden confundir: el resumen puede hablar de 30 días y el calendario de 3 meses a la vez] → Cada tarjeta muestra como subtítulo el intervalo de días que abarca, cada selector se nombra con su tarjeta, y la racha, que no depende de ninguno, está fuera de las tarjetas y lo dice con texto (decisión 15).
- [Tarjetas con periodos distintos salen de respuestas distintas, pedidas en instantes distintos: si entre dos peticiones pasa la medianoche local, una tarjeta puede terminar en un día y otra en el siguiente; y una pantalla que se deja abierta sigue mostrando lo que se cargó al entrar] → Se acepta: cada tarjeta es coherente consigo misma, porque sale de una sola respuesta, y su subtítulo dice qué días abarca; salir y volver a entrar lo corrige. No se añade caducidad por tiempo.
- [La respuesta lleva siempre todo: una tarjeta que solo necesita el resumen recibe también la serie de un año] → Trade-off de la decisión 7: una sola forma de respuesta y peticiones compartidas entre tarjetas a cambio de unos 30 kB en el peor caso.
- [`period-selector` puede duplicar un componente base que `ui-foundation` ya aporte] → La fase 6 lo comprueba antes de crearlo y, si existe un equivalente, usa ese (decisión 15).
- [Es la primera ruta hija de la aplicación: cambia cómo `HomeComponent` obtiene el título y puede afectar a la navegación, a la recarga directa y a la carga de `config.json`] → Puntos «a comprobar» de la decisión 15, con pruebas de rutas y de la cabecera en la fase 5 y comprobación en navegador en el paso 6 de la decisión 19.
- [El progreso de la tarjeta y el objetivo que muestra el formulario pueden diferir durante un día tras un cambio de zona horaria hacia atrás: uno es el vigente hoy y el otro el configurado] → Es el caso particular de la decisión 4, acotado a un día.
- [Un endpoint más que mantener (`/today`)] → Reutiliza la pieza de la serie de días y el mismo `Rs` que un elemento de `days`; sus alternativas están en la decisión 7.
- [La regla «sin librerías de interfaz» deja de ser absoluta] → La excepción se acota por escrito en `CLAUDE.md`: solo ECharts, solo gráficos, solo importado en `shared/components/chart/`.

## Migration Plan

Cada fase la ejecuta una sesión distinta, toca un conjunto acotado de archivos y no se cierra sin su verificación; la orquestadora verifica y hace los commits.

**Dependencia de `ui-foundation`.** Las fases de cliente (4, 5 y 6) requieren que el change `ui-foundation` esté implementado y fusionado en la rama de trabajo antes de empezar: aporta las variables de color, los temas claro y oscuro y los componentes base que este change usa y no define. Cada una de esas fases empieza comprobándolo y, si no lo está, para e informa. Las fases de backend (2 y 3) no dependen de él y pueden hacerse antes. La fase 7 lo necesita porque verifica el cliente en ambos temas.

| Fase | Qué produce | Archivos que toca | Verificación de cierre |
|---|---|---|---|
| 0 | Este documento | `openspec/changes/water-statistics/design.md` | `openspec status --change water-statistics` marca `design` como completo |
| 1 | Delta de `water-tracking` y `tasks.md` | `openspec/changes/water-statistics/` | `openspec validate water-statistics --strict` |
| 2 | Historial de objetivos: entidad, índice único, migración con siembra, repositorio, resolución del objetivo por día, `PUT /goal` y `GET /history` con objetivo por día, `days` validado; pruebas | `Domain/` (entidad, contrato, pieza de objetivo por día), `Infrastructure/` (contexto, migración e instantánea, repositorio), `Application/` (servicio, controlador), `tests/Application.Tests/` | Migración revisada antes de arrancar; `dotnet build` y `dotnet test` pasan; al arrancar se aplica una sola migración; `GET /goal` y `GET /history` idénticos al estado previo; `days=0` → `400` |
| 3 | Estadísticas y día actual en backend: periodo, serie densa, serie semanal, cálculo puro, servicio, `Rs`, mapas, endpoints `statistics` y `today`; pruebas | `Domain/` (piezas puras, modelos, contratos), `Infrastructure/` (lecturas nuevas del repositorio), `Application/` (servicio, DTOs, controlador, `AutoMapperProfile`), `tests/Application.Tests/` | `dotnet test` pasa; pasos 3 a 5 de la decisión 19 contra la API real, sin escrituras |
| 4 | Requiere `ui-foundation` fusionado. Integración de ECharts y componente de gráfico compartido: dependencia, cargador, `app-chart`, tipo de opción, paleta de los gráficos leída de las variables del tema y repintado al cambiar de tema o de acento, helper de lectura de colores; pruebas con el doble | `kora-health-client/package.json` y su lock, `modules/app-container/shared/components/chart/`, `shared/helpers/` | `npm test -- --watch=false`, `npx ng lint` y `npm run build` pasan; tamaños del paquete inicial y del trozo de ECharts anotados; cada punto «a comprobar» de las decisiones 13, 14 y 17 resuelto en un navegador, en tema claro y en tema oscuro, con un montaje desechable que no se confirma, y su resultado anotado; ningún color literal en la carpeta del gráfico |
| 5 | Requiere `ui-foundation` fusionado. Tarjeta compacta en Nutrición, ruta y esqueleto del detalle: ruta hija y título de la cabecera; DTOs y las dos operaciones del servicio; estado de la tarjeta y estado del detalle (periodo por tarjeta y memoria por periodo); progreso de hoy, registro rápido y objetivo en una sola tarjeta con el enlace «Ver estadísticas»; página de detalle con el enlace de vuelta y la tarjeta «Historial» con su periodo por defecto (`30d`), todavía sin selector; se retira el uso de `/history`; pruebas | `app.routes.ts`, `modules/app-container/home/`, `shared/entities/DTOS/water-tracking/`, `services/water-tracking.service.ts`, `modules/app-container/nutrition/` y sus pruebas | Pruebas, lint y build pasan; con datos reales, primero a 375 px y después a ancho de escritorio, en tema claro y en tema oscuro: la tarjeta muestra el progreso de hoy y se actualiza al registrar; entrar al detalle, volver, recarga directa en el detalle, subruta desconocida, cabecera y destino activo; puntos «a comprobar» de la decisión 15 resueltos; `/nutricion` no pide `statistics` |
| 6 | Requiere `ui-foundation` fusionado. Contenido del detalle: selector de periodo compartido, racha actual, las cuatro tarjetas con su selector y sus estados (resumen, gráfico de barras, mapa de calor de calendario e historial); pruebas | `modules/app-container/nutrition/water-tracking/`, `modules/app-container/shared/components/period-selector/` y sus pruebas | Pruebas, lint y build pasan; el detalle se ve con datos reales a 375 px y a ancho de escritorio, en tema claro y en tema oscuro, recorriendo los cuatro periodos en cada tarjeta; cambiar el periodo de una tarjeta no cambia las demás; los gráficos se repintan al cambiar de tema; inspección de los trozos del build y de la pestaña de red según la decisión 18: `/nutricion` no arrastra ECharts y el paquete inicial no crece más que el código propio |
| 7 | Verificación end-to-end y documentación | `openspec/changes/water-statistics/verification.md` (se crea en la fase 2 con la referencia previa y se completa aquí), `README.md`, `CLAUDE.md` | Los pasos de la decisión 19 documentados con su resultado, a 375 px y a escritorio y en ambos temas; cada escenario del delta comprobado en real o cubierto por una prueba, indicando cuál; objetivo en 2750 y zona en `Europe/Madrid` al terminar; `openspec validate --all --strict` pasa |
| 8 | Cierre | Specs principales, archivo del change, `CLAUDE.md` (estado del proyecto y cambios archivados) | Specs sincronizadas, change archivado, validación estricta en verde |

Notas:

- La fase 2 es la única que cambia el esquema y ya cambia un comportamiento visible (`goalMl` por día), aunque con los datos actuales la respuesta es idéntica.
- Las fases 3 y 4 no dependen entre sí y tocan árboles distintos. La 5 depende solo de la 3 (no usa ECharts ni `app-chart`), así que puede hacerse antes o después de la 4; la 6 depende de la 4 y de la 5. Las fases 4, 5 y 6 dependen además de `ui-foundation`; si se retrasa, las fases 2 y 3 pueden cerrarse mientras tanto.
- La fase 5 deja la aplicación en un estado coherente por sí sola: la lista del historial se muda al detalle en la misma fase en que sale de Nutrición, alimentada ya por las estadísticas con el periodo por defecto de su tarjeta, de modo que no hay ningún momento en que el historial no se vea en ninguna parte. El servicio de estado del detalle nace ya en la fase 5 con el periodo por tarjeta y la memoria por periodo, aunque en esa fase solo exista la tarjeta «Historial» y todavía no tenga selector. La fase 6 añade el selector, la racha y las otras tres tarjetas.
- Si alguna comprobación de la fase 4 falla, se resuelve con la autora antes de empezar la 6: puede cambiar el renderizador, la forma de leer los colores o de detectar el cambio de tema, o activar el plan B del calendario, pero no la API.
- Las escrituras en la base real se concentran en la fase 7 y se aprueban antes. En las fases 5 y 6 la comprobación de que la tarjeta se actualiza al registrar se hace con una entrada real solo si la autora la aprueba; si no, queda para el paso 9 de la decisión 19.

**Rollback.** Ninguna fase modifica ni borra entradas ni la tabla `water_goals`. Revertir el código de las fases 3 a 6 no deja rastro en la base. Revertir el código de la fase 2 sin deshacer la migración es seguro: el código anterior ignora la tabla nueva y sigue leyendo `water_goals`, que se ha mantenido al día; los cambios de objetivo hechos entretanto se conservan como objetivo actual y solo se pierde su historial si además se aplica el `Down`, que elimina la tabla. Retirar ECharts consiste en revertir las fases 6 y 4 y desinstalar el paquete; la tarjeta de Nutrición y la lista del detalle (fase 5) no dependen de él.

## Open Questions

Ninguna cambia las specs, el enfoque ni el reparto de tareas. Cada una tiene un valor por defecto, que es lo que se hace si nadie decide otra cosa.

1. **¿Añadir un índice sobre `water_entries` (`user_id`, `date_created`)?** Por defecto: no; el volumen actual no lo justifica y el proposal limita la migración a crear una tabla y copiar el objetivo.
2. **¿Añadir un índice único sobre `water_goals.user_id`?** Por defecto: no; se comprueba a mano antes de migrar.
3. **¿Retirar `water_goals` y derivar el objetivo actual del historial?** Por defecto: se mantiene; se puede hacer en un change posterior sin tocar la API.
4. **¿Recordar el periodo elegido en cada tarjeta entre visitas?** Por defecto: no; cada tarjeta vuelve a su periodo por defecto (decisión 15) cada vez que se entra en la pantalla de detalle. Depende del almacenamiento local, que pertenece a `sync`.
5. **¿Plegar o paginar la lista del historial en los periodos largos (hasta 366 filas en un año)?** Por defecto: no; se muestra entera. El valor por defecto no cambia, pero la pregunta pierde peso: la lista ya no está en la página de Nutrición, sino al final de la pantalla de detalle, donde no desplaza ningún otro contenido, y su tarjeta abre en 30 días, de modo que una lista larga solo aparece si el usuario elige un periodo largo.
6. **¿Imponer con una regla de ESLint que `echarts` solo se importe en la carpeta compartida?** Por defecto: no; la regla queda escrita en `CLAUDE.md`.
7. **¿Redirigir una subruta desconocida bajo `/nutricion` a `/nutricion` en lugar de a `/salud`?** Por defecto: no; se aplica la regla global ya existente, sin reglas propias de la sección.
8. **¿Mostrar siempre el formulario del objetivo en la tarjeta de Nutrición?** Por defecto: no; queda plegado tras «Cambiar objetivo» cuando ya hay objetivo, para que la tarjeta sea compacta, y desplegado cuando no lo hay.
9. **¿Abreviar el texto del selector de periodo («30D») como en la referencia visual?** Por defecto: no; las opciones llevan el texto completo («30 días»), que se lee bien con un lector de pantalla. Si `ui-foundation` define una forma abreviada con su nombre accesible, se adopta.
10. **¿Cambiar los periodos por defecto de las tarjetas?** Por defecto: resumen, gráfico e historial en 30 días y calendario en 3 meses (decisión 15). Cambiarlos solo toca una constante por tarjeta y el número de peticiones al entrar.
