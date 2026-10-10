# Design

## Context

Motivación y alcance: ver `proposal.md` (Why, What Changes, Fuera de alcance). Requisitos: ver los deltas de `specs/profile/spec.md` y `specs/water-tracking/spec.md` de este change. Aquí solo se recoge el estado actual que condiciona el diseño.

**Verificado leyendo el código del backend** (`kora-health-api/src/`):

- `WaterTrackingService.GetHistoryAsync` calcula el límite inferior de la ventana como la medianoche UTC de hace `days - 1` días (`DateTime.UtcNow.Date`) y agrupa cada entrada por la fecha UTC de `DateCreated`. Es el único punto del backend donde se decide a qué día pertenece un dato.
- `WaterTrackingRepository.GetEntriesSinceAsync(userId, sinceUtc)` ya recibe un instante UTC y filtra `DateCreated >= sinceUtc`. `AddEntryAsync` fija `DateCreated` con el reloj del servidor en UTC; el cliente no envía fecha.
- Las columnas `date_created` y `date_updated` son `timestamp with time zone` (instantánea del modelo de EF). Npgsql solo acepta para ese tipo valores `DateTime` con `Kind = Utc`.
- `UserEntity` tiene únicamente `Id` y `Username`. `KoraHealthDbContext` no tiene configuración fluida (`OnModelCreating` no existe): tabla `users`, columnas en snake_case por convención.
- No existe ningún endpoint de «total de hoy»: el total del día actual es la fila del historial cuya fecha coincide con el día en curso (y no hay fila si ese día no tiene entradas).
- `Program.cs` siembra el usuario de prueba si no existe (`Id` y `Username`), y la política de CORS solo permite los métodos `GET`, `PUT` y `POST` con la cabecera `Content-Type`.
- Los controladores responden `400` con un mensaje de texto plano cuando `IsValid()` falla. `ErrorRs` existe pero no se usa. No hay middleware de excepciones: una excepción del servicio acaba en `500`.
- No hay ningún `DTO`, modelo, servicio, repositorio ni controlador de perfil o de usuario. `Domain/Contracts/` solo contiene `WaterTracking`. El proyecto `Common` está vacío.
- La instantánea del modelo y los `Designer` de las migraciones nombran los tipos sin el sufijo `Entity` (`...User.User`, `...WaterEntry`), y la migración `RenameEntitiesAndModels` está vacía: la instantánea no refleja los nombres actuales de las clases.
- Ningún `.csproj` activa `InvariantGlobalization`. La solución (`KoraHealth.Api.slnx`) tiene cuatro proyectos y ninguno de pruebas. El SDK instalado es .NET 10.0.401.

**Verificado leyendo el código del cliente** (`kora-health-client/src/`): el historial se pinta con la cadena `date` tal como llega (`YYYY-MM-DD`), en el orden recibido; el DTO la tipa como `string`. Una búsqueda en todo `src/` (excluidas las pruebas) no encuentra ningún `new Date`, `Date.now`, `toISOString`, pipe de fecha, `Intl` ni referencia a UTC o a zonas horarias. El cliente no calcula «hoy» ni destaca la fila del día actual.

**Verificado ejecutando .NET 10 en esta máquina (macOS)**, con un programa desechable fuera del repositorio:

- `TimeZoneInfo.TryFindSystemTimeZoneById` encuentra `Europe/Madrid`, `UTC`, `Etc/UTC`, `CET` y los alias antiguos `Europe/Kiev` y `US/Pacific`; no encuentra `Foo/Bar`, la cadena vacía ni un identificador con espacios alrededor.
- **También encuentra el identificador de Windows `Romance Standard Time`**, pero el resultado tiene `HasIanaId = false`. Buscar la zona no basta para garantizar que es IANA.
- `europe/madrid` (en minúsculas) se encuentra y el resultado devuelve `Id = Europe/Madrid`.
- En `Europe/Madrid`, el día 2026-10-25 empieza a las 2026-10-24T22:00Z y el siguiente a las 2026-10-25T23:00Z (día de 25 horas); el 2026-03-29 empieza a las 2026-03-28T23:00Z y el siguiente a las 2026-03-29T22:00Z (día de 23 horas).
- En `America/Havana`, la medianoche local del 2026-03-08 **no existe** (el cambio de hora ocurre a las 00:00) y `TimeZoneInfo.ConvertTimeToUtc` lanza `ArgumentException` para ella.
- 2026-10-10T19:50Z es el 10 de octubre a las 21:50 en `Europe/Madrid`; 2026-10-10T22:00Z es el 11 de octubre a las 00:00.

**No verificado (se da por bueno):** el comportamiento en Linux y Windows (solo se ha ejecutado en macOS); que la base de datos de Neon contenga las seis entradas de prueba descritas en la decisión 10 (dato aportado por la autora, no consultado); el contenido exacto de la migración que generará `dotnet ef` con la instantánea desfasada.

**Decisiones ya tomadas por la autora** (no se reabren): la zona horaria es un dato del usuario guardado en el servidor como identificador IANA, con valor por defecto para el usuario de prueba; la API ofrece una forma mínima de consultarla y cambiarla, sin pantalla en el cliente; «el día» es el día natural en la zona del usuario, calculado en el servidor, y `water-tracking` lo aplica al total de hoy, a la agrupación del historial y a la ventana de «últimos N días»; las entradas siguen siendo instantes UTC y no se migran.

## Goals / Non-Goals

**Goals:**

- Que exista **una sola pieza** en el backend que responda a «qué día es para este usuario», «a qué día pertenece este instante» y «entre qué instantes UTC cae este rango de días», y que los módulos futuros la reutilicen en vez de copiar aritmética de fechas.
- Que esa pieza sea comprobable sin base de datos ni reloj real, porque sus casos límite (cambios de hora, medianoche) no se pueden esperar a mano.
- Que `water-tracking` deje de usar la fecha UTC sin cambiar la forma de su contrato ni tocar el cliente.
- Que cada fase del plan sea autocontenida y tenga su propio criterio de cierre.

**Non-Goals:**

- No se crea el recurso de perfil completo (`GET`/`PUT /api/profile`), ni modelos o tablas de perfil: solo el subrecurso de zona horaria.
- No se introduce una abstracción de «usuario actual» sobre `FixedTestUser`: el controlador nuevo lo usa igual que `WaterTrackingController`, y `add-auth` lo sustituirá en ambos.
- No se sustituyen por `TimeProvider` los `DateTime.UtcNow` del repositorio de agua (marca temporal de las entradas y del objetivo): no afectan a la regla del día y cambiarlos amplía el alcance.
- No se añade límite inferior ni superior al parámetro `days` del historial, ni middleware de errores, ni se adopta `ErrorRs` (ver Open Questions 4).
- No se añade un proyecto de pruebas general para el backend: las pruebas se limitan a la lógica de día local y a su uso en el historial de agua (decisión 9).
- No se añade ninguna dependencia de terceros para zonas horarias (NodaTime, TimeZoneConverter): basta con `TimeZoneInfo` de la BCL.

## Decisions

### 1. La zona horaria es una columna obligatoria de `users`

`UserEntity` gana una propiedad de texto `TimeZoneId`, obligatoria. Por convención de nombres la columna será `time_zone_id`, de tipo `text` y `NOT NULL`, igual que `username` (sin longitud máxima en base de datos; la longitud se acota en la validación de entrada, decisión 3). No se añade `OnModelCreating` solo para esto.

- **Filas existentes:** la migración añade la columna con `Europe/Madrid` como valor para las filas que ya existen. `dotnet ef` propone una cadena vacía como valor de relleno para una columna de texto obligatoria; hay que **cambiarlo a mano por `Europe/Madrid`** en la migración generada. Hoy solo existe la fila del usuario de prueba.
- **Usuarios nuevos y sembrado:** el valor por defecto vive en **una única constante** del dominio. La entidad se inicializa con ella y el sembrado de `Program.cs` la asigna de forma explícita, de modo que una base de datos recién creada y una ya migrada acaban con el mismo valor.
- **Valor residual en la columna:** la migración deja `Europe/Madrid` como `DEFAULT` de la columna en PostgreSQL. Se acepta y no se declara en el modelo: el código nunca depende de él, y tiene una utilidad concreta en el rollback (ver Migration Plan).
- **Sin valores nulos:** el escenario «usuario sin zona horaria configurada» del delta de `profile` se cumple porque todo usuario tiene siempre un valor, que es el por defecto hasta que lo cambie. No se distingue «nunca configurada» de «configurada con el valor por defecto»; nada en el alcance lo necesita.

**Por qué `Europe/Madrid` y no `UTC`.** La única usuaria real del sistema está en España y la aplicación está en español. Con `UTC` como valor por defecto el fallo que motiva el change seguiría ocurriendo hasta que alguien llamara al endpoint, y no hay pantalla para hacerlo. `UTC` sería «neutral» solo en apariencia: es incorrecto para casi cualquier usuario.

*Alternativas descartadas:* columna anulable con el valor por defecto aplicado al leer (obliga a todo consumidor a recordar el caso nulo); tabla de perfil separada (pertenece a `update-profile` y hoy tendría una sola columna); guardar un desplazamiento fijo como `+02:00` (no sobrevive a los cambios de hora).

### 2. Endpoint mínimo: `GET` y `PUT /api/profile/time-zone`

| Método y ruta | Petición | Respuesta |
|---|---|---|
| `GET /api/profile/time-zone` | — | `200` con `TimeZoneRs { timeZoneId }` |
| `PUT /api/profile/time-zone` | `SetTimeZoneRq { timeZoneId }` | `200` con `TimeZoneRs { timeZoneId }` (el valor almacenado); `400` con un mensaje de texto si la zona no es válida |

- **Cuelga de `profile`** porque las rutas del repositorio son `/api/<capability>` y el requirement vive en la spec de `profile`. Se descarta `/api/users/{id}/...` porque con `add-auth` el usuario saldrá del token y no de la ruta, y `/api/users/me` porque introduce un recurso que ninguna capacidad nombra.
- **Es un subrecurso, no un campo de `PUT /api/profile`**, porque el recurso de perfil completo todavía no está definido: sus campos los fija `update-profile`. Cuando ese change cree `GET`/`PUT /api/profile`, el subrecurso sigue siendo válido tal cual; si prefiere absorber la zona en su formulario, lo decide entonces (Open Questions 1).
- **`PUT` y no `PATCH`**: se sustituye el valor completo del subrecurso, y además la política de CORS actual solo admite `GET`, `PUT` y `POST`, así que no hay que tocarla.
- **`GET` nunca responde `404`**: todo usuario tiene zona (decisión 1). El `404` de `GET /api/water-tracking/goal` no es un precedente aplicable.
- **Encaje por capas**, siguiendo las convenciones de CLAUDE.md, con `Profile` como nombre de la funcionalidad: controlador en `Controllers/Profile/`, DTOs en `DTOs/Profile/Request/` y `DTOs/Profile/Response/`, interfaz del servicio y del repositorio en `Domain/Contracts/.../Profile/`, servicio en `Services/Profile/`, repositorio en `Repositories/BBDD/`, mapas en `AutoMapperProfile` y registros en las dos clases de extensiones. La entidad sigue en `Entities/User/`. El repositorio solo ofrece leer y escribir la zona de un usuario; no se construye un CRUD de usuarios (lo necesitará `add-auth`, con sus propios campos).
- El controlador toma el usuario de `FixedTestUser.Id`, igual que el de agua.

### 3. Validación: zona resoluble por el sistema **y** con identificador IANA

La regla es una sola función de dominio que, dada una cadena, devuelve el identificador que se debe guardar o indica que no es válida:

1. Se busca con `TimeZoneInfo.TryFindSystemTimeZoneById` (no lanza excepción).
2. Si se encuentra, se exige además `HasIanaId`. Sin esta segunda comprobación la API aceptaría identificadores de Windows como `Romance Standard Time`, que .NET resuelve en cualquier plataforma (verificado en macOS).
3. Se guarda el `Id` que devuelve el sistema, no la cadena recibida. En macOS eso normaliza `europe/madrid` a `Europe/Madrid`.

Reparto de responsabilidades: `SetTimeZoneRq.IsValid()` comprueba solo la forma (no vacío, sin espacios alrededor, longitud razonable); la comprobación contra la base de datos de zonas la hace el servicio con la función de dominio, porque es una regla de negocio y cualquier otro llamador futuro (por ejemplo el registro de `add-auth`) debe pasar por ella. Ante una zona no válida el servicio **no modifica nada** e informa al controlador, que responde `400` con un mensaje de texto plano, como el resto de la API. No se usa una excepción para este caso: sin middleware acabaría en `500`.

Comportamientos que se aceptan de forma consciente:

- **Alias antiguos** (`Europe/Kiev`, `US/Pacific`, `CET`) y `UTC` / `Etc/UTC` son válidos y se guardan tal cual: son identificadores IANA legítimos.
- **Mayúsculas y minúsculas:** que `europe/madrid` se acepte depende del sistema de archivos (macOS lo acepta; en Linux es de esperar que se rechace). Lo que se guarda es correcto en ambos casos; la diferencia es solo que un valor mal escrito recibe `400` en un sitio y se normaliza en otro.
- **Windows:** los identificadores IANA se resuelven mediante ICU, presente por defecto en las versiones de Windows con soporte. No debe activarse `InvariantGlobalization` en la API (hoy no lo está).
- **Zona almacenada que deja de resolverse** (base de datos de zonas distinta entre máquinas, o un valor editado a mano en la base de datos): al calcular el día local se usa la zona por defecto y se registra un aviso en el log, en vez de fallar con `500` en todas las consultas del usuario. `GET /api/profile/time-zone` devuelve el valor almacenado sin maquillarlo.

*Alternativa descartada:* una lista cerrada de zonas mantenida en el código (se queda obsoleta y duplica la base de datos del sistema).

### 4. La lógica de día local se reparte en un cálculo puro y un servicio fino

**Cálculo puro (proyecto `Domain`, sin dependencias).** Un tipo inmutable que representa «el calendario de un usuario en un momento dado»: se construye con una zona horaria y el instante actual, y ofrece tres operaciones:

- el **día local actual**;
- el **día local de un instante UTC** cualquiera;
- los **límites UTC de un rango de días locales**: instante de inicio del primer día (inclusive) e instante de inicio del día siguiente al último (exclusive).

No lee el reloj ni la base de datos: todo lo que necesita lo recibe al construirse. Por eso se puede probar con instantes fijos, y por eso un módulo puede agrupar miles de filas en memoria sin llamadas asíncronas por fila.

**Servicio (`ILocalDayService` en `Domain/Contracts/Services/`, implementación en `Application/Services/`).** Dado un `userId`, lee su zona mediante el repositorio de la decisión 2, toma la hora actual de `TimeProvider` y devuelve el tipo anterior ya construido. Es lo único que los módulos inyectan. Lectura de la zona: una consulta por petición; no se cachea.

- **Ubicación:** CLAUDE.md sitúa las interfaces en `Domain` y las implementaciones de servicio en `Application`; se sigue tal cual. El cálculo puro va en `Domain` y no en `Common` porque `Domain` no referencia a `Common` y la regla («el día es el día natural en la zona del usuario») es de negocio, no una utilidad genérica. Como no pertenece a una sola funcionalidad, usa su propia subcarpeta transversal en cada capa, hermana de `WaterTracking`.
- **Hora actual testeable:** se registra `TimeProvider.System` como singleton en `ServiceCollectionExtensions` y el servicio lo recibe por constructor. `TimeProvider` forma parte de la BCL; no hace falta ningún paquete. Es el primer uso en el repositorio y pasa a ser la forma recomendada de leer la hora en código nuevo.
- **Un solo «ahora» por petición:** el instante actual se captura una vez al construir el tipo, de modo que el día actual y los límites de la ventana son coherentes entre sí aunque la petición cruce la medianoche.

*Alternativas descartadas:* un helper estático que llame a `DateTime.UtcNow` (no se puede probar el paso de medianoche); calcular el día en SQL con `AT TIME ZONE` (reparte la regla entre C# y PostgreSQL, depende de la base de datos de zonas de Neon y no la del servidor, y cada módulo tendría que repetirla en sus consultas); que el cliente envíe su desplazamiento horario (contradice la regla «la lógica de negocio vive en el servidor» y la decisión 3 de la autora).

### 5. Reglas de cálculo del día local

- **Nunca se suman 24 horas.** Los rangos se calculan restando o sumando días de calendario a una fecha y convirtiendo después cada fecha a su instante de inicio. Es lo que hace correctos los días de 23 y 25 horas.
- **Inicio de un día local = el primer instante UTC cuyo día local es ese día.** Normalmente es la medianoche local. Si la medianoche no existe (el reloj salta en ese momento, como en `America/Havana`), es el instante del salto; si la medianoche ocurre dos veces, es la primera de las dos. La conversión directa de la BCL lanza excepción en el primer caso (verificado), así que la implementación debe tratarlo de forma explícita y las pruebas deben cubrirlo.
- **El día de un instante** se obtiene convirtiendo el instante UTC a la zona y tomando la fecha. Siempre está definido; no tiene casos especiales.
- **Los instantes que se pasan a la base de datos llevan `Kind = Utc`**, requisito de Npgsql para `timestamp with time zone`.

### 6. Cambios en `water-tracking`

- `WaterTrackingService` recibe `ILocalDayService`. En `GetHistoryAsync` obtiene el calendario del usuario; el primer día de la ventana es el día local actual menos `days - 1`; el límite inferior que pasa al repositorio es el instante UTC de inicio de ese día.
- La agrupación pasa a ser por el día local de `DateCreated`. Como salvaguarda, los días anteriores al primer día de la ventana se descartan después de agrupar, de modo que el resultado es correcto aunque el límite inferior fuese demasiado amplio en algún caso extremo.
- **El repositorio no cambia**: `GetEntriesSinceAsync` ya recibe un instante UTC. No se añade límite superior porque `DateCreated` lo pone el servidor y no hay entradas futuras.
- `LogEntryAsync`, `GetGoalAsync` y `SetGoalAsync` no cambian. Registrar una entrada sigue guardando el instante; «se suma al día actual» es consecuencia de cómo se agrupa al consultar.
- El objetivo que acompaña a cada día sigue siendo el objetivo vigente hoy para todos los días (comportamiento actual; conservar el objetivo de cada día es de un change posterior).

Casos límite y comportamiento esperado:

| Caso | Comportamiento |
|---|---|
| Entrada un segundo antes de la medianoche local | Cuenta en el día que termina |
| Entrada en la medianoche local o después | Cuenta en el día que empieza, aunque en UTC siga siendo el día anterior |
| Día de 23 horas (inicio del horario de verano) | Un único día, más corto; ninguna entrada queda sin día |
| Día de 25 horas (fin del horario de verano) | Un único día, más largo; la hora repetida pertenece entera a ese día |
| Consulta que coincide con la medianoche local | Día actual y ventana se calculan con el mismo instante |
| La usuaria cambia de zona horaria | **Todo el historial se reagrupa** con la zona nueva, incluidas las entradas anteriores al cambio, y la ventana de N días se recalcula. Los instantes almacenados no se tocan. Es el comportamiento esperado (decisión 4 de la autora y escenario «Historial reagrupado al cambiar de zona horaria»): la suma total no cambia, solo en qué día cae cada entrada |
| Usuaria que viaja sin cambiar su zona | Sus días siguen siendo los de la zona guardada; no hay autodetección |

### 7. Contrato de `water-tracking`: misma forma, distinto significado de `date`

`GET /api/water-tracking/history` sigue devolviendo una lista de `{ date, totalMl, goalMl }` ordenada de más reciente a más antigua y solo con los días que tienen entradas. Cambia el significado:

- `date` es un **día natural en la zona horaria vigente del usuario** en el momento de la consulta, no un día UTC. Sigue siendo una fecha sin hora ni desplazamiento (`YYYY-MM-DD`).
- `days` cuenta **días locales** terminando en el día local actual.
- Dos consultas con zonas distintas pueden devolver fechas y totales por día distintos para las mismas entradas.

`dateCreated` (entradas) y `dateUpdated` (objetivo) siguen siendo instantes UTC. No se añade la zona a las respuestas de agua: quien la necesite la consulta en `/api/profile/time-zone`.

### 8. Cliente: sin cambios

Comprobado en el código (ver Context): el cliente muestra `date` como texto, no calcula fechas y no hace ninguna suposición sobre UTC. **No hay que modificar ningún archivo de `kora-health-client/`**, ni DTOs, ni servicios, ni pruebas. El comentario del DTO («fecha de calendario tal como la envía la API») sigue siendo cierto. No se añade DTO ni servicio para la zona horaria: no hay pantalla que los use.

### 9. Pruebas: un proyecto mínimo para la lógica de fechas

Se introduce el primer proyecto de pruebas del backend, porque los casos que hay que garantizar (medianoche, días de 23 y 25 horas, zona con medianoche inexistente) no se pueden provocar a mano contra la API real y son justo donde estaba el fallo.

- **Dónde:** `kora-health-api/tests/Application.Tests/`, con el archivo de proyecto `KoraHealth.Api.Application.Tests.csproj` (carpeta corta y prefijo en el archivo, como el resto), añadido a `KoraHealth.Api.slnx`. Referencia al proyecto `Application`, que ya arrastra `Domain`.
- **Con qué:** xUnit, con la plantilla `dotnet new xunit` del SDK instalado. Sin librería de dobles ni de aserciones: los dobles necesarios (un repositorio de agua en memoria y un calendario fijo) se escriben a mano.
- **Qué cubre, y nada más:**
  - El cálculo puro: día de un instante a ambos lados de la medianoche de `Europe/Madrid`; límites de los días 2026-03-29 y 2026-10-25; rango de varios días que cruza un cambio de hora; inicio de día en una zona cuya medianoche no existe; zona `UTC` como caso trivial.
  - La validación de la zona: IANA válida, alias, identificador de Windows rechazado, cadena desconocida, cadena vacía.
  - `GetHistoryAsync`: entradas a ambos lados de la medianoche local caen en días distintos; la ventana de N días excluye lo anterior a su primer día local; cambiar la zona reagrupa las mismas entradas.
- **Qué no cubre:** controladores, repositorios, EF Core, el resto de `WaterTrackingService`. No se usa base de datos en las pruebas.
- Las pruebas usan fechas de 2026 ya comprobadas en esta máquina y dependen de la base de datos de zonas del sistema operativo.

*Alternativa descartada:* verificar solo a mano. La verificación manual de la decisión 10 demuestra que la API está bien cableada, pero no puede ejercitar los cambios de hora.

### 10. Verificación end-to-end sin esperar a medianoche

Se apoya en las entradas de prueba que ya existen según la autora: seis entradas del 2026-10-10 UTC, unas hacia las 19:50Z y otras entre las 22:00Z y las 22:05Z. Cambiar la zona del usuario de prueba mueve la frontera del día sobre esas entradas, lo que equivale a observar el paso de la medianoche.

1. **Antes de la fase 4**, anotar la respuesta de `GET /api/water-tracking/history?days=30`: una única fila `2026-10-10` con la suma de las seis entradas.
2. Con `Europe/Madrid` (valor por defecto tras la migración): dos filas, `2026-10-11` con las entradas de las 22:00–22:05Z y `2026-10-10` con las de las 19:50Z. La suma de ambas es la del paso 1.
3. `PUT` con `UTC`: vuelve la fila única del paso 1.
4. `PUT` con una zona muy adelantada (`Pacific/Kiritimati`, UTC+14): todas las entradas en `2026-10-11`. Con una atrasada (`America/Los_Angeles`): todas en `2026-10-10`.
5. Ventana: con `days=1`, comparar dos zonas en las que «hoy» sea una fecha distinta en el momento de la prueba y comprobar que la fila devuelta, si la hay, es la del día local actual de cada una.
6. Rechazos: `PUT` con `Foo/Bar`, con `Romance Standard Time` y con cadena vacía responden `400`, y un `GET` posterior devuelve la zona anterior sin cambios.
7. Registrar una entrada y comprobar que se suma a la fila del día local actual de la zona vigente.
8. **Dejar la zona en `Europe/Madrid`** al terminar.

Las fechas esperadas de los pasos 2 a 4 no dependen del día en que se ejecute la prueba mientras las entradas sigan dentro de la ventana de 30 días. Si la base de datos no contiene esas entradas, el paso 7 permite crear otras y repetir el razonamiento con sus instantes.

## Risks / Trade-offs

- **[La instantánea de EF no refleja los nombres actuales de las entidades]** → Al generar la migración, comprobar que contiene únicamente la columna nueva de `users`. Si aparece cualquier otra operación (renombrados, recreación de tablas), parar e informar antes de aplicarla: la API aplica las migraciones pendientes al arrancar contra la base de datos real.
- **[El valor de relleno que propone `dotnet ef` es una cadena vacía]** → Decisión 1: se corrige a mano y la fase 2 lo comprueba leyendo la fila del usuario de prueba tras arrancar.
- **[Buscar la zona no basta: .NET acepta identificadores de Windows]** → Decisión 3: se exige `HasIanaId`, con prueba unitaria y paso 6 de la verificación.
- **[Comportamiento distinto entre sistemas operativos]** (mayúsculas, alias disponibles, versión de la base de datos de zonas) → Se guarda el identificador que devuelve el sistema; una zona almacenada que no se resuelva usa la zona por defecto con aviso en el log. Solo se ha verificado en macOS.
- **[Zonas cuya medianoche no existe o se repite]** → Decisión 5: regla explícita para el inicio del día y prueba con `America/Havana`. La salvaguarda de la decisión 6 evita resultados erróneos aunque el límite calculado fuese impreciso.
- **[Cambiar de zona reescribe el pasado]** → Comportamiento aceptado y documentado. Será relevante para el change posterior de historial de objetivos y estadísticas, que tendrá que decidir si «el objetivo de aquel día» se ancla a un día local o a un instante.
- **[El valor por defecto `Europe/Madrid` es incorrecto para usuarios de otros países]** → Hoy solo hay un usuario. `add-auth` deberá decidir qué zona recibe quien se registra (Open Questions 2).
- **[Una consulta más por petición del historial]** (leer la zona) → Coste despreciable con un usuario; no se cachea para no introducir invalidación.
- **[Primer proyecto de pruebas del backend]** → Puede invitar a ampliarlo. La decisión 9 fija su alcance; cualquier ampliación va en otro change.
- **[`add-auth` también modifica `users`]** → Sus tareas hablan de «definir la entidad de usuario» y «crear la migración para la tabla de usuarios» como si no existieran. Quien aplique el segundo de los dos changes debe partir de la entidad y la tabla ya existentes y asignar la zona por defecto al crear usuarios.
- **[Las entradas de prueba descritas no se han consultado]** → La verificación de la decisión 10 tiene una alternativa que no depende de ellas.

## Migration Plan

Cada fase se delega a una sesión distinta, toca un conjunto acotado de archivos y no se cierra sin su verificación. Todas las rutas de código son de `kora-health-api/`; el cliente no se toca en ninguna.

| Fase | Qué produce | Archivos que toca | Verificación de cierre |
|---|---|---|---|
| 0 | Este documento | `openspec/changes/user-local-day/design.md` | `openspec status --change user-local-day` marca `design` como completo |
| 1 | Deltas de `profile` y `water-tracking`; `tasks.md` | `openspec/changes/user-local-day/` | `openspec validate user-local-day --strict` |
| 2 | Zona horaria del usuario: propiedad en `UserEntity`, constante del valor por defecto, migración, sembrado, función de validación, repositorio, servicio, DTOs, controlador `api/profile/time-zone`, mapas y registros | `Domain/` (entidad, constante, validación, contratos), `Infrastructure/` (repositorio, migración e instantánea, registro), `Application/` (servicio, DTOs, controlador, `AutoMapperProfile`, `ServiceCollectionExtensions`, `Program.cs`) | `dotnet build` pasa; la migración solo añade la columna; al arrancar, `GET /api/profile/time-zone` devuelve `Europe/Madrid`; `PUT` con una zona válida la cambia y con una no válida responde `400` sin cambiarla; `GET /api/water-tracking/history` responde **exactamente igual que antes** |
| 3 | Pieza de día local y proyecto de pruebas: cálculo puro, `ILocalDayService` y su implementación, registro de `TimeProvider`, proyecto xUnit con las pruebas del cálculo y de la validación | `Domain/` (cálculo, contrato), `Application/` (servicio, registro), `tests/Application.Tests/` (nuevo), `KoraHealth.Api.slnx` | `dotnet build` y `dotnet test` pasan sobre la solución; ningún endpoint cambia de comportamiento (nadie usa aún la pieza) |
| 4 | `water-tracking` adopta el día local; pruebas de `GetHistoryAsync` | `Application/Services/WaterTracking/WaterTrackingService.cs`, `tests/Application.Tests/` | `dotnet test` pasa; pasos 1 y 2 de la decisión 10 contra la API real |
| 5 | Verificación end-to-end y documentación | `openspec/changes/user-local-day/verification.md` (nuevo); `CLAUDE.md` y `README.md` (comando `dotnet test`, existencia del proyecto de pruebas, endpoint de zona horaria, regla del día local para módulos nuevos) | Los ocho pasos de la decisión 10 documentados con su resultado; cada escenario de los dos deltas comprobado o cubierto por una prueba, indicando cuál; `openspec validate --all --strict` pasa; `npm test -- --watch=false` del cliente sigue en verde sin haber tocado nada |

Notas:

- La fase 2 es la única que cambia el esquema. Antes de arrancar la API con la migración nueva, anotar la respuesta actual del historial (paso 1 de la decisión 10): es la referencia para las fases 2 y 4.
- Las fases 2 y 3 no cambian el comportamiento de `water-tracking`; el cambio visible llega entero en la fase 4, que es pequeña y fácil de revertir.
- La fase 3 depende del repositorio de zona de la fase 2; no se pueden intercambiar.

**Rollback.** Las entradas de agua no se modifican en ninguna fase, así que no hay datos que restaurar. Revertir la fase 4 devuelve la agrupación por día UTC sin tocar nada más. Revertir la fase 3 elimina la pieza y el proyecto de pruebas. Revertir el código de la fase 2 sin deshacer la migración es seguro: la columna sobrante tiene valor por defecto en PostgreSQL, así que el código antiguo puede seguir insertando usuarios; para retirarla del todo se aplica el `Down` de la migración, que elimina la columna.

## Open Questions

Ninguna bloquea las fases. En cada una se indica el valor por defecto con el que se trabaja mientras la autora no decida otra cosa.

1. **¿`update-profile` editará la zona desde su formulario y absorberá el endpoint en `/api/profile`?** **Por defecto: no. El subrecurso `/api/profile/time-zone` se mantiene como única vía y `update-profile` lo decide en su propio diseño.**
2. **¿Qué zona recibe un usuario que se registra con `add-auth`?** **Por defecto: la constante `Europe/Madrid`, hasta que `add-auth` o un change de autodetección decidan pedirla o proponerla.**
3. **¿Se canonizan los alias antiguos (`Europe/Kiev` → `Europe/Kyiv`)?** **Por defecto: no; se guarda el identificador tal como lo devuelve el sistema.**
4. **`days` no se valida en el controlador**: un valor menor o igual que cero provoca hoy un `500` y no hay máximo. Es previo a este change. **Por defecto: no se toca aquí; queda anotado para un change de saneamiento de la API.**
5. **¿Debe la respuesta del historial incluir la zona con la que se calculó?** Ayudaría a un cliente a explicar las fechas. **Por defecto: no; la forma del contrato no cambia (decisión 7).**
6. **Versión de xUnit y utilidades de tiempo para pruebas.** **Por defecto: lo que genere la plantilla `dotnet new xunit` del SDK instalado, sin paquetes adicionales; la fase 3 documenta la versión resultante.**
