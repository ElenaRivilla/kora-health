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
- La política de CORS admite `GET`, `PUT` y `POST` con la cabecera `Content-Type`; este change añade operaciones `GET` y un `PUT`, así que no hay que tocarla.
- **La API no expone las entradas individuales.** `POST /entries` devuelve la entrada creada (`WaterEntryRs`: `id`, `amountMl`, `dateCreated`), pero no hay ninguna lectura de entradas: `/history` solo da totales por día. El repositorio tiene una única lectura de entradas, desde un instante UTC, ordenadas de la más reciente a la más antigua.
- **El único ajuste por usuario que existe es la zona horaria**, y marca el precedente: es una propiedad de `UserEntity` (`TimeZoneId`, columna `users.time_zone_id`) inicializada con una constante del dominio (`TimeZoneDefaults`); la lee y la escribe `ProfileRepository` sobre `Users`; se expone en `GET` y `PUT /api/profile/time-zone` con sus `Rq` y `Rs`; y su migración (`AddUserTimeZone`) añade la columna con `defaultValue: "Europe/Madrid"`, sin que la instantánea del modelo declare ningún valor por defecto.
- `UserCalendar` da el día actual (`Today`), el día local de un instante (`GetLocalDay`) y los límites UTC de un rango de días (`GetUtcRange`). No da la hora local de un instante.
- Los `Rq` validan con `IsValid()` (`AmountMl > 0`, `DailyGoalMl > 0`) y el controlador responde `400` con texto plano. Ni el objetivo ni la cantidad de una entrada tienen límite superior.
- Pruebas: `WaterTrackingServiceHistoryTests` construye el servicio real con `InMemoryWaterTrackingRepository`, `InMemoryProfileRepository` y `FixedTimeProvider`. El doble del repositorio guarda un único objetivo y permite fijar el instante de cada entrada (`AddEntryAt`).
- Los modelos de dominio de agua no derivan de `BaseModel`, aunque `CLAUDE.md` lo enuncia como convención. No se corrige aquí.

**Verificado leyendo el código del cliente** (`kora-health-client/`), tal como está en esta rama, es decir, antes de `ui-foundation`, que lo cambia (más abajo):

- `NutritionPageComponent` provee `WaterTrackingStateService` y pinta dos tarjetas: «Hidratación» (objetivo) e «Historial de hidratación» (registro rápido + lista). Su prueba comprueba exactamente esos dos títulos y su orden.
- `WaterTrackingStateService` carga objetivo e historial al crearse; tras registrar una entrada recarga el historial, y tras guardar el objetivo recarga objetivo e historial. Las recargas tras una acción no muestran el estado de carga.
- `WaterTrackingService.getHistory` pide siempre 30 días; es el único uso de `/history`. No hay ningún uso de `Date`, `Intl` ni cálculo de «hoy» en el cliente.
- `WaterQuickLogComponent` pinta tres botones (+100, +250 y +500 ml) que llaman directamente al estado; nada impide un segundo toque mientras el primero está en curso. `WaterGoalSectionComponent` muestra el objetivo y un formulario que ignora en silencio un valor vacío, no entero o no positivo.
- `package.json` no tiene ninguna dependencia de interfaz ni de gráficos. Las pruebas corren con Vitest 5 sobre jsdom 30 mediante el builder `@angular/build:unit-test`.
- `angular.json` fija presupuestos solo para producción: `initial` (aviso a 500 kB, error a 1 MB) y `anyComponentStyle` (aviso a 4 kB, error a 8 kB). **No hay presupuesto para los trozos diferidos.**
- `styles.scss` define once variables de color, con un solo tema; no hay ninguna pensada para escalas de datos. La tarjeta compartida actual, `section-card`, solo tiene título y contenido: su cabecera no admite subtítulo ni un control.
- `app.routes.ts` tiene un solo nivel de rutas bajo `HomeComponent`: ninguna sección tiene rutas hijas. `HomeComponent` construye la navegación con las hijas directas que declaran `path` y `title`, y muestra en la cabecera el `title` de la primera ruta hija activa; la cabecera no tiene más contenido que ese título. `config.json` se pide con una ruta relativa (`assets/config.json`) e `index.html` declara `<base href="/">`.

**Verificado consultando el registro de npm:** la última versión publicada de `echarts` es `6.1.0`.

**No verificado (se da por bueno):** el contenido de la base de Neon (dos días con datos, 2026-10-10 con 850 ml y 2026-10-11 con 1050 ml, y objetivo de 2750 ml: datos aportados por la autora); que haya una sola fila en `water_goals`; el comportamiento real de ECharts 6 en este proyecto. Nada de ECharts se ha ejecutado: todo lo que este documento dice de la librería procede de su documentación y de memoria, y va marcado como **«a comprobar en la fase de implementación»** donde el diseño depende de ello.

**No verificado de `ui-foundation`:** nada de él está implementado. Todo lo que este documento dice de sus variables, componentes y servicio procede de su `design.md` y su `tasks.md`, leídos en `origin/feature/ui-foundation`; si su implementación se aparta de su diseño, las fases de cliente lo detectan en su primera tarea, que lee lo que quedó archivado.

**Dependencia de `ui-foundation`.** La autora ha decidido que la aplicación tendrá tema claro y tema oscuro, y que todo color de acento saldrá de una única variable que más adelante podrá cambiar el usuario desde ajustes. Esa base visual la aporta un change aparte, `ui-foundation`, que **ya está diseñado** en la rama `feature/ui-foundation` (no en esta) y que se implementará, archivará y fusionará antes de las fases de cliente de este change (fases 5 a 8 del Migration Plan). Las fases de backend (2, 3 y 4) no dependen de él. Cuando se escribió la primera versión de este documento ese change no existía y aquí solo se hablaba de «papeles» de color; ahora se usan sus nombres. Lo que este change toma de él, citando sus decisiones como «`ui-foundation`, decisión N»:

- **Variables de color por papel** (decisiones 1 y 3): `--color-bg`, `--color-surface`, `--color-surface-raised`, `--color-text`, `--color-text-secondary`, `--color-text-disabled`, `--color-border`, `--color-border-strong`, `--color-accent` (relleno), `--color-on-accent`, `--color-accent-strong` (acento legible: texto, iconos y datos destacados), `--color-accent-soft`, `--color-accent-muted` (datos secundarios de un gráfico), `--color-focus-ring`, `--color-success`, `--color-warning`, `--color-danger`, sus rellenos y `--color-data-neutral`. `--accent` es la fuente del acento y ningún componente la usa directamente. Los papeles derivados del acento son mezclas con `color-mix()`.
- **Temas** (decisión 2): por defecto el del sistema, solo con CSS; el atributo `data-theme` de `<html>` (`light` o `dark`) lo fuerza.
- **`ThemeService`** (decisión 5), en `src/app/shared/theme/`: señales `preference`, `theme` y `accent`, métodos `setPreference` y `setAccent`, y **`revision`, una señal numérica que se incrementa cada vez que puede haber cambiado algún color calculado**. Es el aviso de repintado de los gráficos (decisión 13 de este documento). Observa `data-theme`, `data-accent` y el `style` de la raíz, y la preferencia del sistema.
- **Tipografía, espaciado, radios, tamaños y movimiento** (decisión 6): mixins de texto (`text-title-card`, `text-body`, `text-label`, `text-caption`, `text-figure`…), `--space-*`, `--radius-*`, `--size-touch` (44 px), `--size-icon`; y, para el movimiento, `--duration-fast` (120 ms), `--duration-base` (200 ms), `--duration-slow` (400 ms, «una barra o un anillo que se llena»), `--ease-standard` y `--ease-enter` («lo que aparece o se llena»). Regla global: con `prefers-reduced-motion: reduce` las tres duraciones valen `0s`; lo animado desde TypeScript debe consultar esa preferencia por su cuenta.
- **Iconos** (decisión 8): Phosphor mediante `ng-icons`, registrados en el componente que los pinta. Deja anotados para este change `plus`, `check` y `arrow-left`.
- **Componentes base** (decisiones 10 y 11), en `modules/app-container/shared/components/`: `app-card` (título, subtítulo opcional y un hueco para un control en la cabecera; sustituye a `section-card`), `appButton` (sobre `<button>` y `<a>`; variantes `primary`, `secondary` y `danger`), `app-field` con la directiva `appInput`, `app-compact-select` (un `<select>` nativo en píldora, con etiqueta accesible obligatoria) y `app-status-message` (`loading`, `error` con reintento opcional y `empty`).
- **Lo que deja diseñado y sin construir** (decisión 12): el control segmentado, la fila de lista, el interruptor, el estado «cargando» del botón y el botón de volver en la cabecera. Tampoco aporta una barra de progreso.
- **Reglas de uso:** ningún color literal fuera de su parcial de variables; un botón con relleno no se coloca sobre la superficie elevada, porque en el tema oscuro su `hover` baja de 3:1 (decisión 1); ninguna animación escribe una duración o una curva sueltas, y solo se animan `opacity`, `transform` y colores (decisión 6); una sola acción principal por vista, que es el motivo de que los botones de registro rápido pasen a secundarios (decisión 13).
- **Dos avisos expresos para este change** (decisiones 3 y 15): la línea del objetivo no se distingue de las barras por luminancia (1,09:1), solo por tono, así que **debe ir discontinua**; y los tres estados no cumplidos del calendario distan entre sí entre 1,04:1 y 1,70:1, así que **necesitan una marca, una trama o un borde propios, además del tono**. Se recogen en las decisiones 16 y 17.
- **Cómo migra las pantallas actuales** (decisión 13): cuando empiecen las fases de cliente, la página de Nutrición tendrá dos `app-card` con el mismo contenido que hoy, el formulario del objetivo usará `app-field` y `appButton`, los mensajes de carga y de error serán `app-status-message` y los tres botones de registro rápido serán secundarios. Las pruebas de hidratación habrán pasado sin cambios, salvo el selector de la tarjeta.
- **Cómo se comprueba que está fusionado:** Migration Plan.

Consecuencia: este change no crea ningún componente que `ui-foundation` ya aporte. El selector de periodo propio que preveía la versión anterior desaparece en favor de `app-compact-select` (decisión 15).

**Referencia visual de la autora para el registro por raciones.** Dos capturas de otra aplicación, de las que se toman los patrones y ningún recurso: una tarjeta «Agua» con el total del día en un número grande («250 / 1000 ml») y, debajo, una fila de ocho vasos, el primero lleno, el siguiente con un «+» para añadir una ración y una marca de verificación sobre el vaso en el que se alcanza el objetivo; y una pantalla de detalle con dos ajustes en lista («Objetivo diario 1000 ml», «Tamaño de la ración 250 ml»), un gráfico de barras con la media diaria y un «Diario» con cada toma (cantidad y hora). Los vasos y su animación se dibujan aquí con SVG y CSS propios.

**Decisiones ya tomadas por la autora** (no se reabren): las cuatro estadísticas y sus reglas (proposal); el periodo seleccionable en días locales; cada día conserva su objetivo y un objetivo nuevo rige desde el día local en curso; los días anteriores al change se evalúan con el objetivo vigente en la migración; el cliente muestra las cuatro estadísticas, gráfico de barras con la referencia del objetivo y mapa de calor de calendario; la racha actual es global (no depende del periodo y un día sin objetivo vigente la rompe); «3 meses» y «año» son meses y años de calendario, no 90 o 365 días fijos; en el porcentaje de días cumplidos el día en curso cuenta siempre (decisión 9); el gráfico de barras es diario en 7 y 30 días y se agrupa por semanas, con la media diaria de cada semana, en 3 meses y 1 año (decisión 16); la librería es ECharts 6.1.0, usada directamente, por módulos y aislada tras un componente propio; ECharts se carga solo al entrar en la pantalla de detalle, no al entrar en Nutrición; **el periodo se elige por tarjeta**: en el detalle no hay un selector global, sino que cada tarjeta que depende de un periodo (resumen, gráfico, calendario e historial) lleva el suyo en su cabecera, con las opciones 7 días, 30 días, 3 meses y año, y cambiar uno no altera los demás (decisión 15); la aplicación tendrá **tema claro y oscuro y un color de acento variable**, que aporta `ui-foundation`: este change no define colores propios ni componentes base, y sus gráficos leen los colores del tema en ejecución (decisión 13).

Y las que la autora ha añadido al revisar el plan, que este documento incorpora:

- **Vasos en la tarjeta de Nutrición.** El total de hoy en grande sobre el objetivo vigente y una fila de vasos, uno por ración: llenos los ya bebidos; el siguiente, con un «+» que registra una ración con una animación de llenado; una marca en el vaso en el que se alcanza el objetivo. Ocho por fila como máximo y, si hacen falta más, otra fila; siempre hay un vaso siguiente, también por encima del objetivo; el vaso en curso se ve parcialmente lleno si el total no es múltiplo de la ración. Conviven con un acceso secundario «Otra cantidad», con los botones actuales de +100, +250 y +500 ml. La animación respeta el movimiento reducido. Los vasos no son la única forma de conocer el progreso, el vaso con «+» es un botón cuyo nombre accesible incluye la cantidad, su zona táctil es de 44 px como mínimo y el estado no depende solo del color (decisión 23).
- **Tamaño de la ración configurable**, por usuario, guardado en el servidor, 250 ml por defecto (decisiones 20 y 21).
- **Lista de tomas.** El detalle incluye «Tomas de hoy», con la cantidad y la hora local de cada toma del día local actual. Las tomas no se borran ni se editan. Se mantiene la tarjeta «Historial» por días (decisión 22).
- **Nuevo reparto de la interfaz.** La tarjeta de Nutrición lleva la cifra, los vasos, «Otra cantidad» y el enlace al detalle, y **ya no contiene el cambio de objetivo**. El detalle (`/nutricion/hidratacion`) empieza con un bloque de ajustes, «Objetivo diario» y «Tamaño de la ración», que se editan ahí; después, la racha, las cuatro tarjetas con periodo y «Tomas de hoy» (decisión 15).

## Goals / Non-Goals

**Goals:**

- Que el objetivo con el que se evalúa un día pasado no cambie nunca al cambiar el objetivo actual.
- Que las estadísticas sean una función pura, probada sin base de datos, y que el servidor sea el único que decide qué día es hoy, qué días abarca el periodo y si un día está cumplido.
- Que una sola respuesta de la API dé al cliente todo lo que pinta una tarjeta de la pantalla de detalle para su periodo, coherente consigo misma, y que esa misma forma de respuesta sirva a las cuatro tarjetas.
- Que cada tarjeta del detalle elija su periodo sin afectar a las demás y sin repetir peticiones cuando dos tarjetas comparten periodo.
- Que ningún color de este change sea literal: todos salen de las variables de `ui-foundation`, también dentro de los gráficos, que se repintan al cambiar de tema o de color de acento.
- Que la página de Nutrición siga siendo corta en un móvil: de la hidratación solo lleva una tarjeta compacta, que se pinta con una sola petición y no pide las estadísticas ni descarga la librería de gráficos.
- Que registrar una ración sea un solo toque, y que cambiar el tamaño de la ración no modifique ningún dato ya guardado.
- Que el servidor siga siendo el único que hace cuentas: también el reparto del día en raciones y la hora local de cada toma.
- Que los vasos no sean la única forma de conocer el progreso ni su animación la única señal de un cambio, y que esa animación desaparezca con la preferencia de movimiento reducido sin cambiar el resultado.
- Que el detalle, que ahora cambia el objetivo, no muestre nunca estadísticas calculadas con el objetivo anterior.
- Que ECharts no entre en el paquete inicial ni se descargue al entrar en Nutrición, y que el único código que lo importa en ejecución esté en una carpeta compartida.
- No romper ningún contrato existente: `GET /goal`, `PUT /goal`, `POST /entries` y `GET /history` conservan su forma, y `PUT /goal` y `POST /entries`, su validación.
- No duplicar nada de `ui-foundation`: ni variables, ni componentes base, ni su mecanismo de aviso de cambio de tema.

**Non-Goals:**

- Borrar o editar objetivos pasados, y cualquier interfaz para ver el historial de objetivos.
- Agregación por meses, estadísticas resumidas por semana o el concepto de «semana cumplida» (la única agregación semanal es la serie del gráfico de barras de los periodos largos, decisión 16), comparativas entre periodos y estadísticas de otros módulos.
- Caché de las estadísticas en el servidor, y caché persistente o entre visitas en el cliente. La única memoria que se guarda es la del estado del detalle, por periodo y solo mientras dura la visita a esa pantalla (decisión 15).
- Un envoltorio genérico de gráficos con API propia que oculte el formato de opciones de ECharts (ver decisión 13).
- Añadir índices o claves foráneas a las tablas existentes (ver Open Questions).
- Un resumen de hidratación en la sección Progreso. Reutilizaría la misma API y el componente de gráfico compartido (decisión 13), pero pertenece al change de `progress`.
- El sistema de temas (claro y oscuro), las variables de color y de movimiento, la tipografía, los iconos, la navegación y los componentes base (tarjeta, botón, campo, selector compacto y mensaje de estado): los aporta `ui-foundation`. Este change los usa y no los define.
- Los componentes que `ui-foundation` deja diseñados y sin construir (fila de lista, interruptor, control segmentado, botón «cargando», botón de volver en la cabecera) y una barra de progreso: no se construyen aquí.
- Borrar o editar una toma, consultar las tomas de un día que no sea el actual y registrar una cantidad libre escrita por el usuario.
- Un historial de cambios del tamaño de la ración, y cualquier relación de validación entre la ración y el objetivo.
- Bloquear en el servidor los registros duplicados: el doble toque se evita en el cliente (decisión 15).
- El selector del color de acento en ajustes.
- Traducciones.

## Decisions

Las decisiones 1 a 19 son las del plan original; las que la autora cambió al revisarlo (13, 15, 16, 17 y 19) están ya reescritas. Las decisiones 20 a 23 recogen lo que añadió después (ración, reparto en raciones, tomas y vasos) y por eso van al final, detrás de la verificación, en lugar de renumerar las anteriores.

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
- **Raciones:** dados el total del día, el objetivo vigente (o `null`) y el tamaño de la ración, calcula las raciones completas, los mililitros de la ración en curso y la posición de la ración del objetivo (decisión 21). Junto a ella, las constantes de la ración: valor por defecto y límites (decisión 20).

Y en `Domain/LocalDay/`, `UserCalendar` gana la hora local de un instante, que usa la lista de tomas (decisión 22).

Los modelos de resultado van en `Domain/Models/WaterTracking/`. `WaterTrackingService` solo orquesta: pide el calendario, carga datos por el repositorio y llama a las piezas puras. El controlador valida el parámetro y mapea a los `Rs` con AutoMapper.

**Alternativa descartada: toda la lógica en el servicio.** Se podría probar igualmente con los dobles, pero cada caso límite de rachas o de medias exigiría montar entradas con instantes UTC y zona horaria; como función pura, la prueba es una lista de días con su total y su objetivo.

Contrato del repositorio (`IWaterTrackingRepository`): cambia la firma de la escritura del objetivo (recibe el día de vigencia y el instante) y se añaden la lectura del historial de objetivos, el instante de la primera entrada del usuario, la lectura de entradas entre dos instantes UTC y, en la fase 4, la lectura y la escritura del tamaño de la ración (decisión 20). La lista de tomas no necesita ninguna lectura nueva: usa la de entradas entre dos instantes.

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

**Día actual: `GET /api/water-tracking/today`.** Sin parámetros; siempre `200`. Devuelve un único objeto referido al día local actual del usuario, con los cuatro campos de un elemento de `days` y, desde la fase 4, los cuatro del reparto en raciones (`servingMl`, `fullServings`, `partialServingMl` y `goalServings`, decisión 21):

| Campo | Tipo | Contenido |
|---|---|---|
| `date` | fecha | El día local actual del usuario, decidido por el servidor |
| `totalMl` | entero | Total del día; `0` si hoy no hay entradas |
| `goalMl` | entero o `null` | Objetivo vigente hoy; `null` si el usuario no tiene objetivo |
| `goalMet` | booleano o `null` | Si el total alcanza o supera el objetivo; `null` si hoy no hay objetivo vigente |

Es la pieza «Serie de días» de la decisión 6 aplicada a un rango de un solo día, de modo que el total, el objetivo y `goalMet` de hoy coinciden por construcción con el último elemento de `days` de las estadísticas. Tres lecturas: zona horaria, historial de objetivos y entradas desde el inicio UTC del día actual; cuatro, con la ración, desde la fase 4. No calcula racha ni primer registro. Tiene su propio `Rs` (`WaterTodayRs`) desde el principio, y no el del elemento de `days`, porque la fase 4 le añade campos que un día de la serie no lleva.

**Por qué un endpoint propio.** La tarjeta de Nutrición solo necesita el total de hoy, el objetivo vigente y la ración, y los vuelve a pedir después de cada registro. Alternativas descartadas:

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

Un año son como máximo 366 días; con una decena de entradas diarias, unos pocos miles de filas de dos enteros y un instante. Agrupar eso en memoria es despreciable frente al viaje a Neon. Agregar en SQL exigiría convertir a la zona del usuario dentro de PostgreSQL, es decir, una segunda implementación del día local con otra base de datos de zonas horarias, en contra de la regla «Local day» de `CLAUDE.md` (todo pasa por `UserCalendar`). Por petición de estadísticas hay cuatro lecturas: zona horaria, historial de objetivos, primera entrada y entradas del periodo. La serie semanal se obtiene de la serie diaria ya calculada, sin lecturas adicionales. La petición del día actual hace cuatro lecturas (tres, hasta que la fase 4 añade la ración) y carga solo las entradas de hoy; la de las tomas, dos; la de la ración, una. Al entrar en el detalle el cliente hace cinco peticiones: el objetivo, la ración, las tomas de hoy y dos de estadísticas (`30d` y `3m`, los periodos por defecto de sus tarjetas). Después, una de estadísticas por cada periodo que se elija por primera vez en esa visita (decisión 15): como máximo cuatro por visita, salvo reintentos tras un error y salvo que se guarde el objetivo, que vuelve a pedir los periodos que haya en pantalla (hasta cuatro más cada vez). La tarjeta de Nutrición hace una sola petición al entrar y otra tras cada registro. La respuesta de un año ocupa en torno a 30 kB de JSON (estimación: 366 días y hasta 54 semanas).

No se ha medido nada: la base real tiene dos días de datos. Si el volumen creciera, lo primero sería un índice sobre `water_entries` (Open Questions), no mover el cálculo a SQL.

### 11. Contrato de la API antes y después

| Operación | Antes | Después |
|---|---|---|
| `GET /api/water-tracking/goal` | Objetivo actual o `404` | Sin cambios |
| `PUT /api/water-tracking/goal` | Sustituye el objetivo; afecta a cómo se ven todos los días | Misma petición y respuesta. **Cambia de significado:** rige desde el día local en curso; los días anteriores conservan el suyo |
| `POST /api/water-tracking/entries` | Registra una entrada | Sin cambios. Registrar una ración es este mismo `POST`, con la ración como cantidad (decisión 21) |
| `GET /api/water-tracking/entries` | No existe | Nuevo (decisión 22): las tomas del día local actual, de la más reciente a la más antigua, con `id`, `amountMl`, `dateCreated` y la hora local `localTime`. Sin parámetros. Siempre `200`; lista vacía si no hay |
| `GET /api/water-tracking/history?days=N` | Días con entradas; `goalMl` = objetivo actual en todos; `days <= 0` → `500` | Misma forma. **Cambia de significado:** `goalMl` es el objetivo vigente cada día, y puede ser `null` en días anteriores al primer objetivo. `days` fuera de 1–366 → `400` |
| `GET /api/water-tracking/statistics?period=P` | No existe | Nuevo (decisión 7): estadísticas, serie diaria densa y serie semanal del periodo. Periodo desconocido → `400` |
| `GET /api/water-tracking/today` | No existe | Nuevo (decisiones 7 y 21): fecha, total, objetivo vigente y cumplimiento del día local actual, y el reparto en raciones (`servingMl`, `fullServings`, `partialServingMl`, `goalServings`). Siempre `200` |
| `GET /api/water-tracking/serving` | No existe | Nuevo (decisión 20): `servingMl`, `minServingMl` y `maxServingMl`. Siempre `200`; 250 si el usuario no lo ha cambiado |
| `PUT /api/water-tracking/serving` | No existe | Nuevo (decisión 20): guarda `servingMl`. Fuera de 50 a 2000 → `400`. No modifica entradas, totales ni estadísticas |
| `GET` y `PUT /api/profile/time-zone` | — | Sin cambios; un cambio de zona reagrupa también las estadísticas, cambia cuál es el día actual y, con él, qué tomas son de hoy y a qué hora local se muestran |

No hay ninguna operación para borrar o editar una entrada, ni para leer las tomas de otro día.

### 12. Pruebas de backend

Mismo proyecto xUnit y mismos dobles, sin librería de simulación. `InMemoryWaterTrackingRepository` se amplía para guardar el historial de objetivos con las reglas de la decisión 2, para devolver la primera entrada y las entradas de un rango y, en la fase 4, para guardar el tamaño de la ración de cada usuario, con 250 mientras no se cambie.

*Piezas puras* (sin servicio ni dobles):

- Objetivo por día: sin filas; una fila sembrada; cambio a mitad de rango; día exactamente igual a `effective_from`; rango anterior a la primera fila.
- Periodo: los cuatro valores, un valor desconocido, y los rangos de `3m` y `1y` en fin de mes y en año bisiesto.
- Media: primer registro anterior al periodo; primer registro dentro del periodo; días sin entradas a cero; redondeo en la mitad exacta; sin entradas.
- Días cumplidos: total igual al objetivo (cumplido); un mililitro por debajo; día sin objetivo excluido; hoy incumplido con objetivo cuenta en el denominador y no en el numerador; hoy sin entradas con objetivo cuenta igual; hoy cumplido cuenta en ambos; hoy sin objetivo no cuenta; redondeo del porcentaje en la mitad exacta; denominador cero.
- Racha: hoy cumplido; hoy incumplido con ayer cumplido; hoy sin entradas; ayer incumplido (cero); racha más larga que el periodo; racha que llega al primer registro; cambio de objetivo en mitad de la racha.
- Mejor día: empate (gana el más reciente); periodo sin entradas.
- Raciones (decisión 21): total cero (0 completas, 0 en curso); total múltiplo de la ración (750 y 250 → 3 y 0); total no múltiplo (600 y 250 → 2 y 100); total por encima del objetivo (2800 con objetivo 2750 → 11 y 50, objetivo en la 11); objetivo múltiplo de la ración (2750 y 250 → 11; 2000 y 250 → 8); objetivo no múltiplo (2000 y 300 → 7); ración mayor que el objetivo (1500 y 2000 → 1); ración igual al objetivo (→ 1); sin objetivo (posición `null`, lo demás igual); los límites de la ración (50 y 2000).
- Validación de la ración (decisión 20): 50 y 2000 aceptados; 49, 2001, 0 y un negativo rechazados.
- Hora local de `UserCalendar` (decisión 22): un instante en horario de verano y otro en horario de invierno de `Europe/Madrid`; un instante cuya hora local cae en el día siguiente al de UTC; la misma hora local repetida en el cambio al horario de invierno; una zona con desfase de media hora.
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
- Ración: un usuario que no la ha cambiado tiene 250; guardar un valor válido lo devuelve en la lectura siguiente y en el día actual; un valor fuera de los límites no llega al repositorio y no cambia el guardado; cambiar la ración no cambia el total del día, el historial ni las estadísticas pedidas antes y después.
- Día actual con raciones: los cuatro campos con el total de las entradas de hoy; tras registrar una entrada igual a la ración, una ración completa más; tras cambiar la ración, el mismo total repartido de otra forma; tras cambiar el objetivo, otra posición del objetivo; sin objetivo, posición `null`.
- Tomas del día: sin entradas hoy (fecha de hoy y lista vacía); varias entradas, de la más reciente a la más antigua, con su hora local; dos entradas en el mismo instante, ordenadas por identificador descendente; entradas justo antes y justo después de la medianoche local (solo las de hoy); tras cambiar de zona horaria, otras horas y, si cambia el día, otras tomas; la suma de las cantidades coincide con el `totalMl` del día actual pedido en el mismo instante.

No se prueba automáticamente: el repositorio de EF (la escritura en una transacción y la migración), que se cubre en la verificación contra la API real, igual que hasta ahora.

### 13. ECharts queda aislado tras un componente compartido y un cargador sustituible

En `modules/app-container/shared/components/chart/`:

- **Componente `app-chart`**: recibe una opción de gráfico y un texto alternativo, y se ocupa del ciclo de vida. Es genérico a propósito, pensando en `progress` y en el resto de `nutrition`.
- **Cargador del motor**: una función que hace la importación dinámica de `echarts/core` y de los módulos necesarios, los registra una sola vez y reutiliza la misma promesa. Se expone mediante un token de inyección para poder sustituirlo.
- **Tipo de opción**: un alias exportado desde esta carpeta, compuesto con los tipos de los módulos registrados.
- **Paleta de los gráficos**: un servicio que entrega, como signal, los colores que usan los gráficos, leídos de las variables CSS de `ui-foundation` en ejecución, y que los vuelve a leer cuando cambia `ThemeService.revision` (apartado «Colores» de esta decisión). Se puede sustituir en las pruebas.

**Regla de aislamiento:** ningún archivo fuera de esa carpeta importa `echarts` en ejecución. Los componentes de cada sección construyen la opción con el tipo exportado por la carpeta compartida (solo tipos, que desaparecen al compilar). Añadir un tipo de gráfico para otra sección consiste en registrarlo en el cargador.

**Alternativa descartada: componentes compartidos con API propia** (`app-bar-chart`, `app-calendar-heatmap` con entradas neutrales). Aislaría también el formato de opciones, pero obliga a diseñar una API de gráficos sin conocer aún las necesidades de `progress`. El alias de tipo deja un único punto de acoplamiento y permite hacerlo después.

**Módulos previstos** (nombres según la documentación de ECharts 5; **a comprobar** que existen igual en la 6.1.0): núcleo; gráficos de barras, de líneas y de mapa de calor; componentes de rejilla, calendario, mapa visual por tramos y descripción emergente; y un único renderizador.

**Renderizador: SVG.** Pocos elementos (como mucho 366 celdas), texto nítido a cualquier densidad de pantalla, menos memoria en móvil y nodos inspeccionables al verificar en el navegador. **A comprobar:** que barras, línea escalonada y mapa de calor sobre calendario se pintan bien con el renderizador SVG.

**Carga diferida.** `app-chart` solo se usa en los componentes de gráfico de la pantalla de detalle de hidratación (decisión 15), que es una ruta perezosa con su propio trozo; la página de Nutrición no importa ni esos componentes ni `app-chart`, de modo que entrar en `/nutricion` no descarga nada de ECharts (los vasos son SVG y CSS propios, decisión 23). Además, la librería no se importa de forma estática ni siquiera en el detalle: con la importación dinámica dentro del cargador queda en un trozo propio, el detalle pinta primero el enlace de vuelta, los ajustes, la racha y las tarjetas con sus selectores, y el motor se descarga cuando se monta el primer gráfico; si no hay datos que pintar, no se descarga. Cómo se comprueba: decisión 18.

**Ciclo de vida en Angular 22 sin zonas:**

- Inicialización tras el primer renderizado en navegador (`afterNextRender`), cuando el contenedor ya tiene tamaño, y solo cuando el cargador ha resuelto.
- Actualización con un `effect` que lee la opción (entrada de tipo signal) y la aplica sustituyendo la anterior, no fusionándola.
- Redimensionado con un `ResizeObserver` sobre el contenedor.
- Al destruir el componente: desconectar el observador y liberar la instancia. Si el componente se destruye antes de que resuelva la importación, no se inicializa nada.
- Sin zonas no hace falta sacar nada de la detección de cambios: ECharts no dispara ninguna.
- Si la carga del motor falla, el componente muestra un mensaje de error en su lugar (`app-status-message` de tipo `error`) y no rompe el resto de la página.
- **Movimiento reducido.** ECharts anima sus gráficos desde JavaScript, y la regla global de `ui-foundation` no alcanza a lo que no es CSS (`ui-foundation`, decisión 6: «quien la escriba debe consultar la misma preferencia y desactivarla»). `app-chart` consulta `matchMedia('(prefers-reduced-motion: reduce)')` y, si se cumple, aplica la opción con las animaciones desactivadas; lo hace en un único sitio, de modo que ningún constructor de opciones tiene que acordarse. Si jsdom no ofrece `matchMedia`, se da por no pedida, como hace `ThemeService`.

**Colores: ninguno literal; se leen del tema en ejecución y el gráfico se repinta cuando el tema cambia.** ECharts necesita valores de color concretos y no se asume que entienda variables CSS, así que no basta con escribir `var(--…)` en la opción. Tampoco se escribe ningún color literal en las opciones ni en el código de los gráficos. El mecanismo tiene tres piezas:

- *Lectura.* Un helper genérico en `shared/helpers/` devuelve el color calculado de una variable CSS. No lee el texto de la variable, que en los papeles derivados del acento es una expresión `color-mix()` sin resolver, sino el color ya resuelto por el navegador: lo aplica a un elemento auxiliar no visible, colgado del documento, y lee su estilo calculado. **El formato de ese valor no está garantizado:** `ui-foundation` advierte (su decisión 15) de que un navegador puede devolver un `color-mix()` calculado como `color(srgb …)` y no como `rgb(…)`, y anota el formato real en su `verification.md`. Si ECharts no entiende ese formato, el helper lo normaliza a `rgb(…)` (por ejemplo, pintando el color en un lienzo de un píxel y leyéndolo); la normalización vive en el helper y en ningún otro sitio.
- *Paleta.* El servicio de paleta de `shared/components/chart/` usa ese helper para componer un objeto con un color por **papel**. La correspondencia entre cada papel y una variable se declara en un único sitio, dentro de esa carpeta, y es la que `ui-foundation` fija para este change (su decisión 15):

  | Papel en los gráficos | Variable de `ui-foundation` |
  |---|---|
  | Serie (dato destacado) | `--color-accent-strong` |
  | Serie atenuada | `--color-accent-muted` |
  | Referencia del objetivo | `--color-warning` |
  | Ejes y líneas de la rejilla | `--color-border` |
  | Texto de ejes y etiquetas | `--color-text-secondary` |
  | Texto de valores | `--color-text` |
  | Fondo y texto de la descripción emergente | `--color-surface-raised` y `--color-text` |
  | Calendario: cumplido | `--color-accent-strong` |
  | Calendario: parcial | `--color-accent-muted` |
  | Calendario: con registro, sin objetivo | `--color-data-neutral` |
  | Calendario: sin registro | `--color-surface-raised`, con borde `--color-border` |
  | Bordes de marca de los estados del calendario (decisión 17) | `--color-accent-strong` y `--color-border-strong` |

  La serie usa el acento legible (`--color-accent-strong`) y no el relleno (`--color-accent`), que es el de los botones. Todos los papeles tienen variable: no hay que derivar ni inventar ningún color. Si la implementación de `ui-foundation` dejara alguno sin ella, se resuelve con la autora, nunca con un literal.
- *Repintado.* Las funciones puras que construyen cada opción (decisión 14) reciben la paleta como argumento. El componente de cada gráfico calcula su opción a partir de sus datos y del signal de la paleta; cuando la paleta cambia, la opción se recalcula y `app-chart` la aplica con el mismo `effect` con que aplica cualquier otro cambio, sin destruir ni recrear la instancia.

**Qué dispara la relectura de la paleta: `ThemeService.revision`.** La versión anterior de este diseño preveía un `MutationObserver` propio sobre el elemento raíz, «mientras no se conozca el mecanismo» de `ui-foundation`. Ya se conoce: `ThemeService` observa `data-theme`, `data-accent` y el `style` de la raíz y la preferencia del sistema, y expone `revision`, que se incrementa cada vez que puede haber cambiado un color calculado. El servicio de paleta lee `revision` dentro de su cálculo y se recalcula solo; **no crea ningún observador propio**. Consecuencia para la verificación: el cambio de acento se prueba cambiando `--accent` en el estilo en línea de `<html>`, que es lo que el servicio observa; editar la regla de la hoja de estilos en las herramientas del navegador no dispara ningún aviso.

**A comprobar en la fase de integración (fase 5):** el formato del color calculado con las variables reales de `ui-foundation`, en ambos temas, y si ECharts lo entiende o hay que normalizarlo; que al cambiar `revision` la lectura devuelve ya los colores del tema nuevo (`ui-foundation` lo comprueba en su fase 1 y lo anota; aquí se confirma con el gráfico); que el gráfico ya pintado cambia de colores sin recargar la página, en los dos sentidos (claro a oscuro y oscuro a claro) y al cambiar `--accent`; que la descripción emergente, que ECharts pinta como HTML propio, también sigue al tema; y que con la preferencia de movimiento reducido emulada el gráfico aparece sin animación.

**Fechas.** El cliente no crea objetos `Date` ni calcula «hoy»: las etiquetas salen de la cadena `YYYY-MM-DD` y el último día lo da el servidor. El eje de las barras es de categorías (cadenas). **A comprobar:** que el calendario de ECharts interpreta `YYYY-MM-DD` como fecha local y no desplaza un día en navegadores con desfase negativo respecto a UTC.

**A comprobar además:** compatibilidad de los tipos de ECharts 6.1.0 con TypeScript 6 y con el compilador de Angular 22; que el empaquetador separa la librería en un trozo diferido y no emite avisos de módulos CommonJS.

### 14. Pruebas de componentes: ECharts no se ejecuta en jsdom

jsdom no tiene canvas, no calcula tamaños (todo mide cero) y, hasta donde se sabe, no implementa `ResizeObserver`. No se da por hecho que el renderizador SVG funcione ahí. Decisión:

- Las pruebas sustituyen el cargador (token de la decisión 13) por un doble que registra las llamadas de inicialización, aplicación de opción, redimensionado y liberación. Con él se prueba `app-chart`: inicializa una vez, aplica la opción cuando cambia el signal, libera al destruirse y no inicializa si se destruye antes de cargar.
- La construcción de cada opción es una función pura por gráfico, que recibe los datos y la paleta (decisión 13), probada aparte: número de puntos, valores, categoría de cada día o de cada semana, presencia e interrupciones de la línea del objetivo, qué serie (diaria o semanal) se usa en cada periodo, y que todos los colores de la opción son los de la paleta recibida: con dos paletas distintas salen dos opciones que solo difieren en los colores, y ninguna contiene un color que no venga de la paleta.
- El servicio de paleta se sustituye en las pruebas de los componentes por una paleta fija; cambiarla en la prueba debe producir una opción nueva. En su propia prueba, `ThemeService` se sustituye por un doble con una señal `revision`: incrementarla produce una paleta nueva. La lectura real de variables CSS y el repintado al cambiar de tema no se prueban en jsdom (no se da por hecho que calcule variables CSS ni colores): se comprueban en el navegador.
- El pintado real se comprueba en un navegador, en las fases 5 y 8 y en la verificación final.
- **A comprobar:** si jsdom 30 ofrece `ResizeObserver`; si no, el componente lo trata como opcional o las pruebas lo sustituyen.

Alternativa descartada: ejecutar ECharts real con renderizador SVG en las pruebas. Podría funcionar, pero depende de comportamientos no verificados y ataría las pruebas a la salida de la librería.

### 15. Rutas, componentes, estado y DTOs del cliente

Decisión de la autora: las estadísticas siguen perteneciendo a `water-tracking`, pero se reparten en dos pantallas. La página de Nutrición lleva una **tarjeta compacta** (el total de hoy en grande, la fila de vasos, el acceso «Otra cantidad» y un enlace al detalle) y todo lo demás vive en una **pantalla de detalle** con ruta propia, que empieza por los ajustes (objetivo diario y tamaño de la ración). **La tarjeta ya no contiene el cambio de objetivo: se cambia desde el detalle**, que por tanto modifica datos. Motivo del reparto: la página de Nutrición alojará después el diario de comidas y debe seguir siendo corta en un móvil.

**Rutas.** En `app.routes.ts`, `nutricion` pasa a ser una ruta sin componente, con `title` «Nutrición» y dos hijas de carga diferida:

| URL | Ruta hija | `title` | Componente |
|---|---|---|---|
| `/nutricion` | `''` | (el de la ruta madre) | `NutritionPageComponent` |
| `/nutricion/hidratacion` | `hidratacion` | «Hidratación» | `WaterStatisticsPageComponent` |

- Las dos hijas se pintan en el `router-outlet` de `HomeComponent`; no se añade ningún componente intermedio. La ruta `/catalogo` que `ui-foundation` declara en modo de desarrollo no se toca.
- **Navegación.** `HomeComponent` construye los cinco destinos a partir de su lista de destinos y de las hijas directas que tienen `path` y `title`; `nutricion` conserva ambos, así que la lista no cambia. El enlace «Nutrición» sigue activo en el detalle porque `routerLinkActive` compara por prefijo, comportamiento que `ui-foundation` conserva y cubre con una prueba (`ui-foundation`, decisión 9). Como efecto, conserva `aria-current="page"` también en el detalle; se acepta. **A comprobar en la fase 6**, con la ruta real.
- **Cabecera.** Hoy `HomeComponent` toma el título de la primera ruta hija, que en el detalle sería «Nutrición». Pasa a tomar el de la ruta activa más profunda que declare uno, de modo que el detalle muestra «Hidratación» y `/nutricion` sigue mostrando «Nutrición» sin depender de que la hija vacía herede el título. Es el único cambio en `home/`, y `ui-foundation` lo deja expresamente para este change. El título de la pestaña del navegador lo fija el router con el mismo criterio.
- **Volver.** La cabecera solo muestra el título y no se le añade ningún control (el botón de volver en la cabecera queda aplazado en `ui-foundation`, decisión 12). El detalle empieza con un enlace visible «Volver a Nutrición», dentro del contenido de la página y por encima de todo lo demás. Es un enlace del router a `/nutricion`, no una llamada al historial del navegador, para que funcione también cuando se ha entrado directamente por la URL. El «atrás» del navegador funciona además por sí solo, porque al detalle se llega con una navegación normal.
- **Recarga directa en `/nutricion/hidratacion`.** El detalle no depende de haber pasado antes por Nutrición: crea su propio estado y pide sus datos. Es la primera ruta de dos segmentos de la aplicación; `config.json` se pide con una ruta relativa que se resuelve contra `<base href="/">`, así que debe cargarse igual. **A comprobar en la fase 6**, recargando en esa URL.
- **Subruta desconocida.** `/nutricion/otra-cosa` no coincide con ninguna hija y cae en la regla global ya existente: redirige a `/` y de ahí a `/salud`, igual que cualquier otra URL desconocida. No se añade una regla propia (Open Questions).

**Reparto de componentes.** En `modules/app-container/nutrition/water-tracking/`, un componente por carpeta:

| Componente | Dónde | Situación | Responsabilidad |
|---|---|---|---|
| `water-today-card` | Tarjeta | Nuevo | Contenedor de la tarjeta «Hidratación»: es el único de la tarjeta que inyecta `WaterTrackingStateService`; compone los cuatro siguientes, el error de un registro fallido y el enlace «Ver estadísticas» |
| `water-today-progress` | Tarjeta | Nuevo | El total de hoy en grande sobre el objetivo vigente («750 / 2750 ml») y el texto de estado («Objetivo cumplido», o «Sin objetivo configurado» con el enlace «Configurar objetivo») |
| `water-glasses` | Tarjeta | Nuevo | La fila de vasos: cuántos se pintan, en qué filas, cuál lleva el «+» y cuál la marca del objetivo; el texto alternativo; emite la petición de registrar una ración (decisión 23) |
| `water-glass` | Tarjeta | Nuevo | Un vaso: el SVG, su nivel de llenado animado, el «+» y la marca del objetivo (decisión 23). Sin lógica |
| `water-quick-log` | Tarjeta | Se queda, cambia | Pasa a ser el acceso secundario «Otra cantidad»: un botón que despliega los tres botones actuales (+100, +250 y +500 ml). Deja de inyectar el estado: emite la cantidad elegida |
| `water-goal-section` | — | Desaparece | Su formulario pasa a `water-settings`, en el detalle. Se elimina con su prueba cuando la tarjeta deja de usarlo (fase 7) |
| `water-statistics-page` | Detalle | Nuevo | Página de la ruta: provee el estado del detalle, pinta el enlace de vuelta, los ajustes, la racha, las cuatro tarjetas con periodo y las tomas de hoy, y conecta cada bloque con sus datos |
| `water-settings` | Detalle | Nuevo | La tarjeta «Ajustes»: «Objetivo diario» y «Tamaño de la ración», cada uno con su valor actual, su campo y su botón de guardar |
| `water-current-streak` | Detalle | Nuevo | La racha actual, fuera de las tarjetas con periodo, con el texto que aclara que no depende de ningún periodo |
| `water-period-card` | Detalle | Nuevo | Envoltorio común de las cuatro tarjetas con periodo, sobre `app-card`: título, subtítulo, `app-compact-select` en el hueco de la cabecera y los estados de carga, error (con «Reintentar») y vacío con `app-status-message`; proyecta el contenido cuando hay datos |
| `water-statistics-summary` | Detalle | Nuevo | Contenido de «Resumen»: media diaria, días cumplidos (número y porcentaje) y mejor día, a partir de la respuesta |
| `water-bar-chart` | Detalle | Nuevo | Contenido de «Evolución»: construye la opción de barras, diaria o semanal según el periodo (decisión 16), y usa `app-chart` |
| `water-calendar-heatmap` | Detalle | Nuevo | Contenido de «Calendario»: construye la opción del calendario, usa `app-chart` y pinta la leyenda |
| `water-history-section` | Detalle | Se mueve | Contenido de «Historial»: la lista de los días con registro; deja de inyectar el estado y recibe los días como entrada |
| `water-today-entries` | Detalle | Nuevo | La tarjeta «Tomas de hoy»: cada toma del día con su cantidad y su hora local, o el mensaje de día sin tomas (decisión 22) |

**No se crea ningún selector de periodo.** La versión anterior de este diseño preveía un componente compartido `period-selector` «salvo que `ui-foundation` ya aporte un selector compacto equivalente». Lo aporta: `app-compact-select` (`ui-foundation`, decisión 11) tiene exactamente esa forma (lista de opciones con valor y texto, valor seleccionado, etiqueta accesible obligatoria y un `<select>` nativo con aspecto de píldora). Se usa ese y `period-selector` desaparece del diseño, con su carpeta, su prueba y su Open Question.

En cada pantalla solo un componente inyecta el estado (`water-today-card` en la tarjeta y la página en el detalle); los demás reciben entradas y emiten salidas, lo que los hace probables sin servicio. `NutritionPageComponent` sigue proveyendo `WaterTrackingStateService` y se limita a colocar `water-today-card`: así, cuando llegue el diario de comidas, la página no sabe nada de la hidratación más allá de esa pieza.

**Base visual: la de `ui-foundation`.** Este change no define estilos de tarjeta, botones, campos, tipografía, iconos ni colores. Lo que usa, con los nombres que fija `ui-foundation`:

| Necesidad | Pieza de `ui-foundation` |
|---|---|
| Tarjetas de las dos pantallas | `app-card` (`title`, `subtitle` y el hueco para un control en la cabecera) |
| Botones y enlaces con aspecto de botón | `appButton` sobre `<button>` y `<a>`, variantes `primary`, `secondary` y `danger` |
| Los dos campos de ajustes | `app-field` (`label`, `hint`, `error`) con el `<input>` nativo marcado con `appInput` |
| Selector de periodo de cada tarjeta | `app-compact-select` |
| «Cargando…», error con «Reintentar» y vacío | `app-status-message` (`kind` `loading`, `error` o `empty`; `retryLabel`; salida `retry`). El botón de reintento queda fuera del elemento con `role="alert"` |
| Textos | Mixins `text-title-card`, `text-body`, `text-label`, `text-caption` y `text-figure` (la cifra grande de la tarjeta) |
| Iconos | Phosphor mediante `ng-icons`, registrados en el componente que los pinta: `plus` y `check` (vasos) y `arrow-left` (volver), que `ui-foundation` deja anotados para este change |
| Colores | Solo las variables `--color-*` por papel; nunca `--accent` directamente ni un color literal |
| Tamaños, espaciado y radios | `--size-touch` (44 px), `--size-icon`, `--space-*` y `--radius-*` |
| Movimiento | `--duration-fast`, `--duration-base`, `--duration-slow`, `--ease-standard` y `--ease-enter`, y la regla global de movimiento reducido |
| Texto solo para tecnologías de apoyo | La utilidad `.visually-hidden` |

Los estilos propios de los componentes de esta carpeta se limitan a la disposición de su contenido y al dibujo de los vasos. Reglas de uso de `ui-foundation` que este change respeta: una sola acción principal por vista (en la tarjeta es el vaso con «+»; los botones de «Otra cantidad» son secundarios, y los de guardar de los ajustes también); un relleno de acento no se coloca sobre la superficie elevada (`--color-surface-raised`), porque en el tema oscuro su estado de `hover` baja de 3:1 (`ui-foundation`, decisión 1): los vasos y sus rellenos van directamente sobre la tarjeta (`--color-surface`); y ninguna animación escribe una duración o una curva sueltas ni anima otra cosa que `opacity`, `transform` y colores. La comprobación que la versión anterior dejaba para la implementación (si la tarjeta base admite un control en la cabecera) queda resuelta: `app-card` lo admite.

**Lo que `ui-foundation` aplaza y cómo se resuelve aquí.** La fila de lista (`app-list-row`), el interruptor y el control segmentado no se construyen en `ui-foundation` (decisión 12) y tampoco aquí. La referencia visual de la autora presenta los dos ajustes como filas de una lista («Objetivo diario 1000 ml», «Tamaño de la ración 250 ml»); sin la fila de lista, se presentan como dos campos (`app-field` con `appInput`) dentro de una `app-card`, que es lo que la base ya ofrece. No se construye una fila de lista mínima: duplicaría una pieza que `update-profile` construirá con su diseño ya escrito, y los dos ajustes son editables con un campo numérico, que es justo lo que `app-field` resuelve. Cuando exista la fila de lista, pasar a ella es un cambio local de `water-settings` (Open Questions). La barra de progreso, que `ui-foundation` tampoco aporta, deja de hacer falta: los vasos son la representación del progreso y la tarjeta ya no pinta ninguna barra.

**Página de Nutrición.** Una sola tarjeta «Hidratación» (`app-card`), en este orden: el total de hoy en grande con su texto de estado, la fila de vasos, el acceso «Otra cantidad» y el enlace «Ver estadísticas» al detalle. Sin cambio de objetivo, sin gráficos, sin mapa de calor y sin listas. El enlace está siempre visible, también sin registros (el detalle muestra entonces sus estados vacíos). La tarjeta «Historial de hidratación» desaparece de esta página.

| Situación | Cifra | Texto de estado | Vasos (ración de 250 ml) |
|---|---|---|---|
| Con objetivo y con entradas | «750 / 2750 ml» | — | Once: tres llenos, el cuarto con «+», la marca en el undécimo |
| Con objetivo y sin entradas hoy | «0 / 2750 ml» | — | Once vacíos: el primero con «+», la marca en el undécimo |
| Objetivo alcanzado (`goalMet` verdadero) | «2800 / 2750 ml» | «Objetivo cumplido» | Doce: once llenos y el duodécimo, con 50 de sus 250 ml, con «+» |
| Sin objetivo (`goalMl` es `null`) | «750 ml» | «Sin objetivo configurado» y el enlace «Configurar objetivo» | Ocho: tres llenos, el cuarto con «+», sin marca |

- La cifra y el texto de estado son texto real, con el mixin `text-figure` para la cifra, y están dentro de una región con `aria-live="polite"`, de modo que el total nuevo se anuncia al registrar.
- Que el día esté cumplido lo dice `goalMet`, no una comparación hecha en el cliente.
- **Sin objetivo** no hay vaso «de objetivo». La tarjeta muestra el total, «Sin objetivo configurado» y un enlace «Configurar objetivo» a `/nutricion/hidratacion`, cuyo primer bloque son los ajustes. Los vasos siguen sirviendo para registrar: se pinta una fila completa de ocho (o los necesarios para que haya siempre uno siguiente), sin marca.
- **«Otra cantidad».** Un botón secundario (`appButton`) con `aria-expanded` y `aria-controls`, plegado por defecto, que despliega debajo el grupo con los tres botones actuales (+100, +250 y +500 ml), también secundarios. No es un menú ni un diálogo: es un bloque que se muestra y se oculta, y se queda abierto tras registrar.
- **Un registro en curso bloquea otro.** Mientras hay una petición de registro pendiente, el vaso con «+» y los tres botones de cantidad llevan `aria-disabled="true"` y no lanzan otra: las entradas no se pueden borrar, así que un doble toque dejaría una entrada duplicada para siempre. No se usa el atributo `disabled`, para que el control no pierda el foco.
- **Carga y error.** Mientras llega el día actual, `app-status-message` con «Cargando…»; si falla, el error con «Reintentar». Un registro fallido se muestra con `app-status-message` de tipo `error` entre los vasos y «Otra cantidad», y no borra lo que ya había en pantalla.

**Pantalla de detalle.** De arriba abajo: enlace de vuelta, ajustes, racha actual, cuatro tarjetas con su propio selector de periodo en la cabecera y las tomas de hoy. No hay selector global. No incluye registro de agua.

| Bloque | Título | Contenido | Selector | Periodo por defecto |
|---|---|---|---|---|
| Ajustes | «Ajustes» | «Objetivo diario» y «Tamaño de la ración», con su valor actual y su formulario | No | — |
| Racha actual | «Racha actual» | Número de días y el texto «Días seguidos cumpliendo tu objetivo. No depende del periodo de las tarjetas.» | No | — |
| Resumen | «Resumen» | Media diaria, días cumplidos (número y porcentaje) y mejor día | Sí | 30 días |
| Gráfico | «Evolución» | Gráfico de barras con la referencia del objetivo (decisión 16) | Sí | 30 días |
| Calendario | «Calendario» | Mapa de calor con su leyenda (decisión 17) | Sí | 3 meses |
| Historial | «Historial» | Lista de los días con registro, del más reciente al más antiguo | Sí | 30 días |
| Tomas de hoy | «Tomas de hoy» | Cada toma del día local actual, con su cantidad y su hora, de la más reciente a la más antigua (decisión 22) | No | — |

**Ajustes: `water-settings`.** Una `app-card` «Ajustes» con dos formularios independientes, uno debajo del otro:

| Ajuste | Etiqueta del campo | Valor inicial del campo | Ayuda (`hint`) | Botón |
|---|---|---|---|---|
| Objetivo diario | «Objetivo diario (ml)» | El objetivo configurado; vacío si no hay | «Rige desde hoy; los días anteriores conservan el suyo.» Sin objetivo: «Aún no has configurado un objetivo.» | «Guardar objetivo» |
| Tamaño de la ración | «Tamaño de la ración (ml)» | La ración configurada (250 si nunca se cambió) | «Entre 50 y 2000 ml. Es lo que añade cada vaso.», con los límites que devuelve el servidor (decisión 20) | «Guardar ración» |

- Cada campo es un `<input type="number">` con `inputmode="numeric"` y `appInput`, proyectado en su `app-field`. Los dos botones son secundarios: la pantalla no tiene una acción principal.
- **Validación.** El cliente solo comprueba el formato (un entero mayor que cero), como hace hoy el formulario del objetivo, pero ya no lo ignora en silencio: muestra «Introduce un número entero mayor que cero» en la entrada `error` de su `app-field`. Los límites de la ración son una regla del servidor: el cliente los recibe en la respuesta y los usa para el texto de ayuda y para los atributos `min` y `max` del campo, sin escribirlos en su código; si el servidor rechaza el valor (`400`), el campo muestra «El tamaño de la ración debe estar entre 50 y 2000 ml», con esos mismos límites. El objetivo no tiene límite superior (no cambia su validación).
- **Tras guardar**, el campo conserva el valor guardado y un texto con `role="status"` dice «Objetivo guardado» o «Ración guardada»; un fallo de red se muestra en la entrada `error` del campo. El valor vigente no cambia si el guardado falla.
- Mientras llegan el objetivo y la ración, la tarjeta muestra «Cargando…» con `app-status-message`; si alguno falla, el error con «Reintentar».
- El objetivo que muestra este bloque es el **configurado** (`GET /goal`), no el vigente hoy: solo difieren en el caso de la decisión 4, durante un día.

**Por qué esos periodos por defecto.**

- *Resumen, 30 días:* es el periodo por defecto de la API y el que ya tenía la pantalla; una media y un porcentaje sobre 7 días oscilan demasiado (cada día pesa un séptimo, decisión 9) y sobre un año dicen poco de cómo va el usuario ahora.
- *Gráfico, 30 días:* es el mayor periodo en el que cada barra sigue siendo un día (decisión 16), que es la lectura más directa; la vista por semanas queda a un toque.
- *Calendario, 3 meses:* con 30 días son cinco o seis columnas y el mapa de calor no dice casi nada que no diga ya el gráfico; 3 meses son 13 o 14 columnas, que es lo máximo que cabe en un móvil sin desplazamiento horizontal (decisión 17), y dan la vista de conjunto que justifica tener un calendario.
- *Historial, 30 días:* una lista de como mucho 30 filas; los periodos largos (hasta 366 filas) se eligen a propósito.

Tres tarjetas comparten periodo por defecto, así que al entrar se hacen dos peticiones de estadísticas (`30d` y `3m`) y no cuatro.

**La racha actual está fuera de las tarjetas con periodo.** Es global (decisión 9) y viaja con el mismo valor en todas las respuestas. Se muestra en su propio bloque, encima de las cuatro tarjetas y sin selector, y lo dice con texto visible, no solo con su posición. Dentro de «Resumen», que sí cambia con su selector, quedan las tres estadísticas que dependen del periodo. El valor se toma de la respuesta de estadísticas más reciente que haya recibido el estado, sea del periodo que sea; mientras no haya llegado ninguna, el bloque muestra «Cargando…», y si todas las peticiones pendientes fallan, una raya.

**Subtítulo de cada tarjeta con periodo.** El intervalo de días que abarca su periodo, tomado de `firstDay` y `lastDay` de su respuesta («13 sep – 12 oct»), con la misma tabla fija de meses de la decisión 16 y sin crear objetos `Date`; va en la entrada `subtitle` de `app-card`. Como cada tarjeta puede tener un periodo distinto, el subtítulo deja a la vista qué días resume cada una. Mientras la tarjeta carga, o si falla, no hay subtítulo.

**El selector de periodo: `app-compact-select`.** El de `ui-foundation`, proyectado en el hueco de la cabecera de `app-card`.

- La lista de opciones («7 días», «30 días», «3 meses», «1 año», con los valores `7d`, `30d`, `3m` y `1y`) se define una sola vez en `nutrition/water-tracking/`. El componente es genérico y no conoce los periodos.
- Cada selector dice a qué tarjeta pertenece: su etiqueta accesible, obligatoria en `app-compact-select`, es «Periodo de» seguido del título de la tarjeta («Periodo de Resumen», «Periodo de Evolución», «Periodo de Calendario», «Periodo de Historial»). Así, cuatro controles con las mismas opciones se distinguen en un lector de pantalla y en las pruebas.
- Las opciones llevan el texto completo («30 días»): `ui-foundation` no define ninguna forma abreviada.
- Es un `<select>` nativo: teclado, lector de pantalla y selector nativo del móvil sin código propio. El control segmentado, además de estar aplazado, no serviría: cuatro opciones no caben en la cabecera de una tarjeta a 375 px.

**Estado: dos servicios, uno por pantalla.** La tarjeta y el detalle nunca están a la vez en pantalla, así que no comparten instancia:

- **`WaterTrackingStateService`** (lo sigue proveyendo `NutritionPageComponent`): el día actual, con su carga y su error; la acción de registrar una cantidad, con su registro en curso y su error. Deja de cargar el objetivo configurado y el historial, y pierde la acción de guardar el objetivo: la tarjeta se pinta entera con la respuesta de `GET /today`, que ya trae el objetivo vigente, la ración y el reparto en raciones (decisión 21). Registrar una ración es registrar `servingMl` mililitros, el valor que vino en esa misma respuesta.
- **`WaterStatisticsStateService`** (nuevo, lo provee `WaterStatisticsPageComponent`): los ajustes (objetivo configurado y ración, con su carga, su guardado y su error), las tomas de hoy, el periodo de cada una de las cuatro tarjetas y una memoria de respuestas por periodo. Detalle en «Estado del detalle», más abajo.

Cada instancia se crea al entrar en su pantalla y se destruye al salir. Por eso el detalle pide siempre datos recientes y ve lo que se haya registrado en la tarjeta justo antes; y, al volver a Nutrición, la tarjeta se crea de nuevo, vuelve a pedir el día actual y pinta ya el objetivo y la ración que se hayan cambiado en el detalle (la marca del objetivo puede haber cambiado de vaso, y el número de vasos también), sin ningún mecanismo de sincronización entre las dos pantallas.

**Estado del detalle: ajustes, tomas, un periodo por tarjeta y una memoria por periodo.**

- *Ajustes.* El objetivo configurado (`GET /goal`, `null` si responde `404`) y la ración con sus límites (`GET /serving`), cada uno con su carga y su error; y dos acciones, guardar el objetivo y guardar la ración, cada una con su guardado en curso y su resultado.
- *Tomas de hoy.* La respuesta de `GET /entries`, con su carga y su error. No depende de ningún periodo.
- *Periodo por tarjeta.* Cuatro valores independientes (resumen, gráfico, calendario e historial), cada uno con su valor por defecto y sin persistir (no hay almacenamiento local). Cambiar el de una tarjeta no toca los otros tres. Vuelven a su valor por defecto en cada entrada a la pantalla.
- *Memoria por periodo.* Para cada uno de los cuatro periodos, como mucho una entrada con su situación (cargando, con datos o con error) y su respuesta. Las tarjetas no guardan datos propios: cada una muestra la entrada del periodo que tiene seleccionado. Sus datos, su carga y su error son, por tanto, los de ese periodo.
- *Sin peticiones duplicadas.* Al seleccionar un periodo, si ya hay una entrada cargando o con datos, se reutiliza y no se pide nada: dos tarjetas con el mismo periodo comparten una única petición y una única respuesta, y volver a un periodo ya visto en la misma visita es instantáneo. Solo se pide cuando no hay entrada o cuando la que hay es un error.
- *Peticiones independientes.* Cada periodo se pide por separado al endpoint de estadísticas (decisión 7). Que uno falle o tarde no afecta a las tarjetas que muestran otro.
- *Respuestas tardías.* Cada respuesta se guarda bajo su periodo, así que una respuesta que llega tarde no puede acabar en una tarjeta que ya muestra otro periodo: se queda en la memoria y sirve si se vuelve a él.
- *Reintento.* Una tarjeta en error ofrece «Reintentar», que vuelve a pedir su periodo; la entrada con error se sustituye y todas las tarjetas con ese periodo pasan a cargar.
- *Valores derivados.* La lista del historial (los días con entradas de la respuesta de su periodo, del más reciente al más antiguo) y la racha actual (de la respuesta más reciente recibida).

**Cuándo se invalida la memoria por periodo.** Antes, solo al entrar: el detalle era de solo lectura. Ahora el detalle cambia el objetivo, y eso sí altera las estadísticas.

| Acción en el detalle | Qué deja obsoleto | Qué se hace |
|---|---|---|
| Guardar el objetivo | Todas las respuestas de estadísticas, de cualquier periodo: el objetivo nuevo rige desde hoy (decisión 2), así que cambian el objetivo y el cumplimiento del día en curso y, con ellos, los días cumplidos, el porcentaje, la racha, la referencia del gráfico y el estado de hoy en el calendario y en el historial | Se invalida la memoria entera. Los periodos que alguna tarjeta está mostrando se vuelven a pedir de inmediato, una vez cada uno, **conservando en pantalla los datos anteriores hasta que llegan los nuevos** (sin estado de carga, para que la página no salte); las entradas de los periodos que nadie muestra se descartan y se pedirán si se eligen. El objetivo configurado se actualiza con la respuesta del `PUT` |
| Guardar la ración | Nada del detalle: ninguna estadística, ni el historial, ni las tomas dependen de la ración (decisión 20) | No se invalida nada. La ración se actualiza con la respuesta del `PUT` |
| Cambiar el periodo de una tarjeta, o «Reintentar» | Nada | Lo descrito arriba |

- *Respuestas anteriores a un cambio de objetivo.* Cada invalidación incrementa un contador de generación; una respuesta de estadísticas pedida con una generación anterior se descarta al llegar, para que una petición que estaba en vuelo cuando se guardó el objetivo no deje en la memoria datos calculados con el objetivo viejo.
- *Las tomas de hoy no se recargan* tras guardar: no cambian con el objetivo ni con la ración, y desde el detalle no se registra agua.
- *Al salir y volver a entrar* (también al volver de Nutrición tras registrar, o al recargar el navegador) la memoria empieza vacía, porque vive en el servicio de estado y este se destruye al salir. No hay caducidad por tiempo (Risks).
- *La tarjeta de Nutrición* no necesita enterarse: no existe mientras el detalle está en pantalla y, al volver, pide el día actual de nuevo.

**Alternativa descartada: que cada tarjeta guarde sus propios datos y haga su propia petición.** Es lo más simple de explicar, pero al entrar pediría cuatro veces (tres de ellas, la misma respuesta de `30d`) y cada vez que dos tarjetas coincidieran en un periodo lo pedirían por duplicado.

**Alternativa descartada: una sola instancia compartida, provista en la ruta `nutricion`.** Ahorraría peticiones al ir y volver, pero los proveedores de ruta no se destruyen al salir de ella, así que el estado quedaría vivo y obsoleto y habría que añadir recargas explícitas al entrar en cada pantalla, además de invalidar el día actual de la tarjeta al guardar un ajuste en el detalle y la memoria del detalle al registrar agua en la tarjeta. Con una instancia por pantalla, toda esa invalidación cruzada ocurre sola.

**Alternativa descartada: un servicio de estado aparte para los ajustes.** Separaría responsabilidades, pero guardar el objetivo tiene que invalidar la memoria por periodo, y dos servicios obligarían a que uno conociera al otro. Los ajustes viven en el estado del detalle.

**`WaterTrackingService`** gana cinco operaciones: el día actual, las estadísticas de un periodo, la ración (leerla y guardarla) y las tomas de hoy; y conserva las del objetivo y la de registrar. Deja de usarse `getHistory`, que se retira del cliente junto con su prueba y con `DEFAULT_HISTORY_DAYS`. **DTOs** nuevos en `shared/entities/DTOS/water-tracking/`, uno por archivo y con el nombre de la clase del backend: la respuesta de estadísticas, el día de la serie, la semana de la serie, el mejor día, el tipo cerrado del periodo, el día actual con sus raciones, la ración (respuesta y petición) y las tomas del día (la respuesta y su elemento). `WaterHistoryDayRs` deja de usarse y se elimina.

**La lista del historial sale de las estadísticas.** El delta de la spec pide que el historial corresponda al periodo elegido en su bloque, uno de los mismos cuatro periodos que los demás. Por eso el cliente no llama a `/history`: el historial es un valor derivado de la serie de las estadísticas de su periodo (los días con entradas, del más reciente al más antiguo), y su carga y su error son los de ese periodo. Cuando coincide en periodo con otra tarjeta, no cuesta ninguna petición. `WaterHistorySectionComponent` conserva su aspecto y añade a cada fila el estado del día (cumplido, no cumplido, sin objetivo) en texto.

**Qué se recarga:**

| Acción | Pantalla | Recarga | Estado de carga visible |
|---|---|---|---|
| Entrar en Nutrición (o volver del detalle) | Tarjeta | El día actual: una petición (`today`) | Sí |
| Registrar una ración (vaso con «+») u otra cantidad | Tarjeta | El día actual | No; se mantiene el dato hasta que llega el nuevo, y entonces se anima el vaso (decisión 23) |
| Entrar en el detalle (o recargar en su URL) | Detalle | Objetivo, ración, tomas de hoy y estadísticas de `30d` (resumen, gráfico e historial) y de `3m` (calendario): cinco peticiones | Sí, cada bloque el suyo |
| Guardar el objetivo | Detalle | Estadísticas de los periodos que hay en pantalla, una vez cada uno | No; se conservan los datos anteriores hasta que llegan los nuevos |
| Guardar la ración | Detalle | Nada | No |
| Cambiar el periodo de una tarjeta a uno no visto en esta visita, o descartado al guardar el objetivo | Detalle | Estadísticas de ese periodo: una petición | Sí, solo en esa tarjeta, conservando su altura para que la página no salte; las demás no cambian |
| Cambiar el periodo de una tarjeta a uno ya cargado en esta visita | Detalle | Nada | No; la tarjeta cambia al instante |
| «Reintentar» en una tarjeta con error | Detalle | Estadísticas de su periodo | Sí, en todas las tarjetas que muestran ese periodo |

**Estados de cada tarjeta con periodo.** Son por tarjeta, no de la página: una puede estar cargando o en error mientras las demás muestran datos. Los tres primeros se pintan con `app-status-message`: *cargando* («Cargando…»); *error* (el mensaje y el botón «Reintentar»; el selector sigue activo para elegir otro periodo); *vacío*, cuando el `firstRecordDay` de su respuesta es `null` (mensaje «Aún no hay registros de agua» en lugar del contenido; las tarjetas de gráfico no montan `app-chart`, de modo que ECharts no se descarga). *Sin objetivo:* en «Resumen», la estadística de días cumplidos con el texto «Sin objetivo»; en «Evolución», barras sin línea de referencia. En los cuatro estados la tarjeta conserva su título y su selector. Como `firstRecordDay` no depende del periodo, un usuario sin registros ve las cuatro tarjetas vacías y la racha a cero. El enlace de vuelta, los ajustes y el bloque de la racha están siempre.

**Pruebas del cliente.**

*Se adaptan* (partiendo del estado en que las deja `ui-foundation`: `app-card` en lugar de `app-section-card`, «Entreno» como etiqueta del destino de Entrenamiento):

- `app.routes.spec.ts`: el doble de `WaterTrackingService` ofrece las operaciones nuevas; se añaden que `/nutricion/hidratacion` se resuelve y que una subruta desconocida bajo `/nutricion` acaba en `/salud`.
- `home.component.spec.ts`: mismo doble; se añade que en el detalle la cabecera muestra «Hidratación», que el destino marcado sigue siendo «Nutrición» y que siguen siendo cinco destinos.
- `nutrition-page.component.spec.ts`: una sola tarjeta «Hidratación» con la cifra, los vasos, «Otra cantidad» y el enlace «Ver estadísticas» con su destino; registrar con el vaso «+» actualiza la cifra sin recargar la página; no hay formulario de objetivo, ni lista del historial, ni gráficos.
- `water-tracking-state.service.spec.ts`: al crearse pide solo el día actual; tras registrar lo recarga sin estado de carga; mientras hay un registro en curso no lanza otro; el error de carga y el de registro, cada uno en su estado; ya no pide el objetivo ni el historial ni guarda el objetivo.
- `water-quick-log.component.spec.ts`: plegado por defecto, con `aria-expanded`; al desplegarlo aparecen los tres botones; emite la cantidad elegida; con un registro en curso no emite.
- `water-history-section.component.spec.ts`: pasa a recibir los días por entrada; se añade el estado de cada día; la carga y el error dejan de ser suyos.
- `water-tracking.service.spec.ts`: se añaden `GET /today`, `GET /statistics` con su periodo, `GET /serving`, `PUT /serving` y `GET /entries`; se retiran las dos pruebas de `/history`.
- `water-goal-section.component.spec.ts`: se elimina con el componente; sus casos (etiqueta, guardado, valores ignorados, error) pasan a la prueba de `water-settings`.

*Nuevas:*

- `water-today-card`: compone la cifra, los vasos, «Otra cantidad» y el enlace; el vaso «+» registra `servingMl` y un botón de cantidad registra la suya; carga, error con «Reintentar» y error de un registro fallido sin perder lo que había.
- `water-today-progress`: las cuatro situaciones de la tabla, «Objetivo cumplido» solo con `goalMet` verdadero, y el enlace «Configurar objetivo» con su destino cuando no hay objetivo.
- `water-glasses` y `water-glass`: las de la decisión 23.
- `water-settings`: muestra el objetivo y la ración actuales en sus campos; sin objetivo, campo vacío y su texto de ayuda; la ayuda de la ración con los límites recibidos; guardar emite el valor; un valor vacío, no entero o no positivo no se envía y muestra el error de formato; el rechazo del servidor se muestra junto a su campo; «Objetivo guardado» y «Ración guardada»; cada etiqueta nombra a su campo.
- `water-today-entries`: una fila por toma con cantidad y hora tal como llegan; orden recibido; mensaje de día sin tomas; carga y error; ningún control de edición ni de borrado.
- `water-statistics-state.service`: al crearse pide el objetivo, la ración, las tomas y `30d` y `3m`, una vez cada uno, aunque tres tarjetas compartan `30d`; periodo por defecto de cada tarjeta; cambiar el periodo de una tarjeta no cambia el de las otras; elegir un periodo ya cargado o en carga no lanza otra petición; elegir uno nuevo lanza exactamente una; una respuesta tardía se guarda en su periodo y no altera lo que muestra una tarjeta que ya está en otro; el error de un periodo afecta solo a las tarjetas que lo muestran; «Reintentar» vuelve a pedirlo; historial derivado (solo días con entradas, orden descendente); racha tomada de la respuesta más reciente; una instancia nueva empieza con la memoria vacía. **Ajustes:** guardar el objetivo vuelve a pedir, una vez cada uno, los periodos en pantalla, descarta los demás y conserva los datos anteriores mientras tanto; una respuesta de estadísticas pedida antes de guardar el objetivo y recibida después se descarta; guardar la ración no lanza ninguna petición de estadísticas ni de tomas; un guardado fallido deja su error y no cambia el valor vigente.
- `water-statistics-page`: enlace de vuelta con su destino; los ajustes, la racha, las cuatro tarjetas con sus títulos y las tomas de hoy, en ese orden; cada selector con su nombre accesible («Periodo de …») y su valor por defecto; cambiar el selector de una tarjeta cambia su contenido y deja intactos el periodo y el contenido de las otras tres; una tarjeta en carga o en error junto a otras con datos; con un usuario sin registros no se monta ningún gráfico; guardar el objetivo actualiza las tarjetas sin recargar la página.
- `water-period-card`: título, subtítulo con el intervalo, `app-compact-select` en la cabecera; estados de carga, error con «Reintentar» y vacío; emite el cambio de periodo y el reintento; proyecta el contenido solo cuando hay datos.
- `water-current-streak` y `water-statistics-summary`: valor de la racha, su texto aclaratorio, carga y raya; valores del resumen, rayas y «Sin objetivo».
- `water-bar-chart` y `water-calendar-heatmap`: las funciones puras que construyen cada opción, con la paleta como argumento (decisión 14).

Ninguna sección importa de otra: lo compartido entre secciones (`app-chart` con su cargador y su paleta, y los componentes base de `ui-foundation`) vive en `modules/app-container/shared/components/`, y el helper genérico que lee un color de una variable CSS, en `shared/helpers/`. Un futuro resumen de hidratación en Progreso usaría la misma API y ese mismo `app-chart`, no los componentes de esta carpeta (Non-Goals).

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

**Cómo se pinta la referencia.** En ambos gráficos es una línea escalonada y **discontinua**, de color `--color-warning`, nunca una línea horizontal única, que sería falsa en cuanto el objetivo cambia dentro del periodo. Va discontinua por un aviso expreso de `ui-foundation` (sus decisiones 3 y 15): ese color cumple 3:1 frente a la tarjeta, pero frente a una barra de color de acento que la cruce solo dista 1,09:1 en claro y 1,08:1 en oscuro, es decir, se distingue por el tono y no por la luminancia. El trazo discontinuo la separa de las barras por la forma. Si cabe sin tapar datos, lleva además la etiqueta «Objetivo» en su extremo (**a comprobar en la fase 5**, a 375 px; si no cabe, la referencia se nombra en el título del gráfico y en el texto alternativo).

- *Diario:* un escalón por día con el `goalMl` de ese día; se interrumpe en los días sin objetivo.
- *Semanal:* un escalón por semana, del ancho de su barra, con `averageGoalMl`; se interrumpe en las semanas sin referencia.

**No existe la «semana cumplida».** La serie semanal no lleva `goalMet` y las barras semanales tienen todas el mismo color: que la media de una semana alcance la media de sus objetivos no dice que sus días se cumplieran, y una segunda definición de «cumplido» contradiría las tarjetas y el calendario, que siguen siendo diarios. La comparación entre barra y referencia es solo visual. En el gráfico diario, las barras de los días cumplidos usan el color de la serie (`--color-accent-strong`) y el resto el de la serie atenuada (`--color-accent-muted`), ambos de la paleta (decisión 13); entre los dos hay 3,37:1 en claro y 5,01:1 en oscuro (`ui-foundation`, decisión 3), y la información no depende solo del color porque la barra alcanza o no la línea.

**Dónde se calcula.** En el servidor, en la pieza pura «Serie de semanas» de la decisión 6, a partir de la misma serie diaria y dentro de la misma respuesta (decisión 7). Es un cálculo, y según `CLAUDE.md` los cálculos pertenecen a la API; el cliente no suma, no promedia y no decide en qué día empieza una semana.

**Presentación en el cliente:**

- Título visible sobre el gráfico, dentro de la tarjeta «Evolución» y distinto según la serie: «Agua por día» y «Media diaria por semana», para que el cambio de significado de la barra no pase inadvertido al cambiar el periodo de esa tarjeta.
- Colores: la serie, la serie atenuada, la línea de referencia, los ejes, la rejilla y el texto salen de la paleta (decisión 13); la opción no contiene ningún color literal.
- Animación: la de entrada de las barras es la de ECharts y se desactiva con la preferencia de movimiento reducido, en `app-chart` (decisión 13).
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

| Estado | Condición | Relleno (paleta de la decisión 13) | Marca propia, además del tono |
|---|---|---|---|
| Cumplido | `goalMet` verdadero | `--color-accent-strong` | Ninguna: es el único relleno pleno |
| Parcial | Hay entradas y `goalMet` falso | `--color-accent-muted` | Borde continuo de `--color-accent-strong` |
| Con registro, sin objetivo | Hay entradas y `goalMet` es `null` | `--color-data-neutral` | Borde discontinuo de `--color-border-strong` |
| Sin registro | Total cero | `--color-surface-raised` | Borde fino de `--color-border`, sin relleno de dato |

**Por qué cada estado no cumplido lleva una marca.** Es el segundo aviso de `ui-foundation` para este change (sus decisiones 3 y 15). «Cumplido» sí se distingue de los otros tres por luminancia, con el acento por defecto: 3,37 · 3,25 · 4,79:1 en claro y 5,01 · 4,04 · 6,85:1 en oscuro, calculado allí. Pero los tres estados no cumplidos no pueden distar 3:1 entre sí: están entre 1,04:1 y 1,70:1, y en el tema claro el parcial y el neutro tienen prácticamente la misma luminancia. El tono solo no basta, así que cada uno lleva un borde distinto (continuo y de acento, discontinuo y neutro, fino y sutil), y la leyenda en HTML reproduce esas mismas marcas con las mismas variables. Vale para los dos temas.

**A comprobar en la fase 5:** que el mapa de calor de ECharts sobre calendario admite un estilo de borde por celda (color, grosor y tipo de trazo) con el renderizador SVG, y que se distingue a tamaño de celda real. Si no lo admite, se usa una trama por estado (los patrones de relleno de ECharts); y si tampoco, se activa el plan B de esta decisión, donde cada celda es un elemento propio y el borde es CSS. En ningún caso se deja la distinción solo al tono.

Este change no fija ningún color: los rellenos y los bordes se resuelven con variables de `ui-foundation` en la paleta de los gráficos, y la leyenda en HTML usa esas mismas variables directamente en sus estilos. Al depender del acento, los estados «cumplido» y «parcial» cambian con el color que elija el usuario.

**Accesibilidad:**

- El calendario no depende solo del color para distinguir los estados: cada estado no cumplido tiene su marca, y la leyenda textual, la descripción emergente de cada celda y la lista del historial dan la misma información con texto. Eso vale con cualquier tema y con cualquier color de acento.
- Además, «cumplido» se distingue de los demás estados por luminosidad, no solo por tono: al menos 3:1 frente a cada uno, en ambos temas, según los valores calculados por `ui-foundation`. **A comprobar en la fase 5** con los colores realmente implementados. Con otro acento ese contraste lo garantiza la lista cerrada de acentos validados de `ui-foundation` (su decisión 4), no este change (Risks).
- Leyenda fuera del gráfico, en HTML, con los cuatro estados: su muestra, con el mismo relleno y la misma marca que la celda, y su nombre en texto.
- Cada gráfico tiene un texto alternativo que resume lo que muestra (periodo y días cumplidos sobre evaluados; en el gráfico semanal, lo indicado en la decisión 16).
- La lista del historial (decisión 15) es la alternativa textual completa: fecha, total, objetivo y estado de cada día con registro, legible con lector de pantalla y teclado. Para que cubra los mismos días que el calendario o el gráfico hay que elegir en la tarjeta «Historial» el mismo periodo, porque cada tarjeta tiene el suyo. No se añade una tabla aparte.
- Al tocar una celda o una barra diaria, descripción emergente con fecha, total y objetivo; la de la barra semanal se describe en la decisión 16. **A comprobar** su comportamiento táctil.

**Alternativa descartada: calendario hecho con una rejilla CSS, sin ECharts.** Sería probable en jsdom, usaría las variables CSS directamente y cada celda sería un elemento real. Se descarta porque la autora eligió ECharts como librería de los gráficos y un segundo modo de dibujar complica reutilizarlo en `progress`. Queda como plan B si las comprobaciones de la fase 5 fallan para el calendario (ver Risks).

### 18. Tamaño del paquete

ECharts completo ronda 1 MB minificado; importando solo los módulos de la decisión 13 se espera bastante menos (**no medido**). Como entra por importación dinámica, queda en un trozo diferido y **no cuenta para el presupuesto `initial`**, que es el único de JavaScript configurado.

No se cambian los presupuestos de `angular.json`. La fase 5 anota el tamaño del paquete inicial antes y después de añadir la librería y el tamaño del trozo de ECharts; el criterio de cierre es que el inicial no crezca más que lo que ocupa el código propio y que no aparezca ningún aviso nuevo. Si ECharts acabara en el paquete inicial, la fase no se cierra. Los estilos de los componentes nuevos deben caber en el presupuesto de 4 kB por componente. Los vasos no añaden ninguna dependencia: son SVG en línea y CSS, y sus dos iconos (`plus` y `check`) viajan en el trozo de la página de Nutrición, que es diferida, porque `ng-icons` se registra por componente (`ui-foundation`, decisión 8). La fase 7 anota cuánto crece ese trozo.

**ECharts ligado a la pantalla de detalle.** La fase 8, que es la primera en la que una pantalla real usa `app-chart`, lo comprueba de dos maneras. En el build de producción (`npm run build`), inspeccionando los trozos de `dist/kora-health-web`: ECharts está en un trozo diferido propio; ni el paquete inicial ni el trozo de la página de Nutrición lo importan, ni directamente ni a través de `app-chart`; solo se llega a él desde el trozo de la pantalla de detalle. Y en el navegador, con la pestaña de red: al cargar `/nutricion` no se pide el trozo de ECharts; se pide al entrar en `/nutricion/hidratacion` con datos que pintar. Si el trozo de Nutrición arrastrara ECharts, la fase no se cierra.

### 19. Verificación end-to-end contra la API real

Las fechas y cantidades de partida son las aportadas por la autora y se confirman en el paso 1. Las entradas no se pueden borrar, y el objetivo y la ración deben quedar en su valor original (2750 ml y 250 ml); toda escritura se aprueba antes con la autora, como en `user-local-day`.

**Observable con los datos existentes, sin escribir nada:**

1. Estado previo: `GET /goal` (2750) y `GET /history` (2026-10-11 con 1050 ml y 2026-10-10 con 850 ml, ambos con `goalMl` 2750).
2. Tras la migración del historial de objetivos: mismas respuestas, byte a byte.
3. Estadísticas de `7d`: serie de siete puntos con ceros; `firstRecordDay` 2026-10-10; media igual a 1900 entre los días transcurridos desde el 10 de octubre hasta el día de la verificación; `daysGoalMet` 0; `daysEvaluated` igual a ese mismo número de días, con el día de la verificación incluido aunque no esté cumplido; porcentaje 0; racha 0; mejor día 2026-10-11 con 1050 ml. `GET /today` devuelve la fecha del día de la verificación, su total (cero si ese día no hay entradas), `goalMl` 2750 y `goalMet` falso, y coincide con el último elemento de `days`.
4. Los cuatro periodos empiezan antes del primer registro: la media y `daysEvaluated` son los mismos en todos; cambian solo la longitud de `days` (7, 30, 89–92, 365–366) y la de `weeks`. En `3m` y `1y`, la semana del lunes 5 al domingo 11 de octubre de 2026 es un caso real de primer registro a mitad de semana: `daysCounted` 2, `averageDailyMl` 950 (1900 entre los dos días que cuentan, sábado 10 y domingo 11) y `averageGoalMl` 2750; las semanas anteriores llevan `daysCounted` 0 y medias `null`; la última semana está recortada por el día de la verificación.
5. Rechazos: `period` desconocido y `days=0` responden `400`.
6. Tras la migración de la ración: `GET /goal`, `GET /history` y `GET /statistics` responden igual que antes de ella. `GET /serving` devuelve `servingMl` 250, `minServingMl` 50 y `maxServingMl` 2000. `GET /today` lleva además `servingMl` 250, `fullServings` y `partialServingMl` iguales al cociente y al resto de su `totalMl` entre 250, y `goalServings` 11 (2750 entre 250). `GET /entries` devuelve la fecha del día de la verificación y las tomas de ese día, de la más reciente a la más antigua, cada una con su `localTime` (la hora de `Europe/Madrid` de su `dateCreated`); lista vacía si ese día no hay entradas. `PUT /serving` con 30 y con 2500 responde `400` y no cambia nada (`GET /serving` sigue en 250): son peticiones rechazadas, que no escriben.
7. En el navegador. La aplicación es mobile-first: todo se comprueba primero con un viewport de móvil (375 px de ancho) y después se repite a ancho de escritorio (1280 px, con la navegación en la cabecera). Las comprobaciones visuales se hacen **en los dos temas**, claro y oscuro, en ambos anchos, empezando por 375 px:
   - *Tarjeta de Nutrición (`/nutricion`):* una sola tarjeta «Hidratación» con la cifra de hoy («X / 2750 ml»), once vasos en dos filas (ocho y tres) con los llenos que correspondan al total, el «+» en el siguiente y la marca en el undécimo, el acceso «Otra cantidad» plegado (al desplegarlo, los tres botones) y el enlace «Ver estadísticas»; sin formulario de objetivo, sin gráficos, sin calendario y sin listas; la página no tiene desplazamiento horizontal. La zona táctil del vaso con «+» mide al menos 44 por 44 px, su nombre accesible incluye «250 ml» y la fila tiene su texto alternativo. En la pestaña de red se pide `today` y nada más de hidratación (ni `goal`, ni `serving`, ni `statistics`, ni `history`, ni `entries`), y no se descarga el trozo de ECharts.
   - *Entrar al detalle:* el enlace «Ver estadísticas» lleva a `/nutricion/hidratacion`; la cabecera muestra «Hidratación»; el destino activo de la navegación sigue siendo «Nutrición»; se piden `goal`, `serving`, `entries` y `statistics` dos veces, una con `30d` y otra con `3m`, y, en ese momento y no antes, el trozo de ECharts.
   - *Contenido del detalle:* el enlace de vuelta; la tarjeta «Ajustes» con el objetivo (2750) y la ración (250) en sus campos; la racha actual con su texto aclaratorio; cuatro tarjetas («Resumen», «Evolución», «Calendario» e «Historial»), cada una con su selector en la cabecera y su periodo por defecto (30 días, 30 días, 3 meses y 30 días) y con el intervalo de días como subtítulo; y «Tomas de hoy», con las tomas del día o su mensaje de día sin tomas. Barras con la línea del objetivo discontinua, calendario con su leyenda y lista del historial; al recorrer los cuatro periodos en la tarjeta «Evolución», barras diarias en 7 y 30 días y semanales en 3 meses y 1 año (todas visibles sin desplazamiento horizontal, con la referencia escalonada); al recorrerlos en «Calendario», desplazamiento horizontal solo dentro del calendario en 1 año; la página no tiene desplazamiento horizontal en ningún caso.
   - *Periodo por tarjeta:* cambiar el periodo de una tarjeta cambia solo esa tarjeta (contenido y subtítulo); las otras tres conservan su periodo y su contenido, y la racha, los ajustes y las tomas no cambian. Se comprueba con las cuatro tarjetas, una por una. En la pestaña de red: elegir un periodo no visto lanza una sola petición de `statistics`; elegir en otra tarjeta ese mismo periodo, o volver a uno ya visto, no lanza ninguna. Salir del detalle y volver a entrar restaura los periodos por defecto y vuelve a pedir `30d` y `3m`. Con teclado: se llega a cada selector con el tabulador y se cambia de opción con las flechas; cada selector tiene su nombre accesible («Periodo de …»).
   - *Temas:* todo lo anterior se ve bien en tema claro y en tema oscuro. Con el detalle abierto y los gráficos ya pintados, cambiar de tema repinta barras, línea de referencia, ejes, texto y celdas del calendario sin recargar la página, y la leyenda sigue coincidiendo con las celdas; lo mismo al cambiar el valor de `--accent` en el estilo en línea de `<html>` (el selector de acento en ajustes no existe todavía), que cambia también el agua de los vasos. Los estados del calendario siguen distinguiéndose en ambos temas, por su marca además de por su tono, y la leyenda textual está presente.
   - *Volver:* el enlace «Volver a Nutrición» lleva a `/nutricion`; el «atrás» del navegador hace lo mismo, y el «adelante» vuelve al detalle.
   - *Recarga directa:* recargar el navegador en `/nutricion/hidratacion` muestra el detalle completo, con «Hidratación» en la cabecera y «Nutrición» activo, sin pasar antes por Nutrición.
   - *Subruta desconocida:* `/nutricion/no-existe` acaba en `/salud`.
   - *Destino activo:* en `/nutricion` y en `/nutricion/hidratacion` hay un único destino marcado, «Nutrición», tanto en la barra inferior del móvil como en la cabecera de escritorio.

**Requiere escribir datos de prueba** (todo desde la interfaz, salvo que se indique otra cosa):

8. Cambio de objetivo desde el detalle: guardar en «Ajustes» un valor distinto de 2750 → sin recargar la página, se vuelven a pedir las estadísticas de los periodos en pantalla y el día de hoy pasa a evaluarse con ese objetivo en el resumen, el gráfico, el calendario y el historial; el 10 y el 11 de octubre siguen con 2750, en `/history` y en `days`; `GET /today` lleva el objetivo nuevo y su `goalServings`. Al volver a Nutrición, la tarjeta muestra el objetivo nuevo en la cifra y la marca ha cambiado de vaso.
9. Segundo cambio el mismo día → solo cuenta el último. El valor de este segundo cambio es el total de hoy más 500 ml, para que dos raciones lo alcancen en el paso 12.
10. Cambio de ración: guardar 500 en «Ajustes» → `GET /serving` devuelve 500; `GET /today` lleva `servingMl` 500 y el reparto recalculado; el total de hoy, `GET /history`, `GET /statistics` y `GET /entries` no cambian; al volver a Nutrición la tarjeta pinta los vasos de 500 ml y el «+» anuncia 500 ml. A continuación, guardar 250 de nuevo y comprobar que todo vuelve a como estaba. Un valor de 30 muestra su mensaje junto al campo y no cambia nada.
11. Registrar una ración: tocar el vaso con «+» en la tarjeta → el total sube exactamente 250 ml sin recargar la página, el vaso se llena con su animación, el «+» pasa al siguiente y el foco con él; se hace un solo `POST` de 250 ml. `GET /today` lo refleja. En el detalle, «Tomas de hoy» muestra la toma la primera, con 250 ml y su hora local.
12. Segunda ración, con la preferencia de movimiento reducido emulada → el vaso pasa a lleno sin animación y el estado final es el mismo. Con ella el total alcanza el objetivo temporal del paso 9: la tarjeta muestra «Objetivo cumplido» y hay un vaso más allá de la marca; `GET /today` lleva `goalMet` verdadero; en las estadísticas, hoy cumplido, racha 1, `daysGoalMet` 1; `daysEvaluated` no cambia, porque hoy ya contaba antes de cumplirse, y el porcentaje sube. Al entrar después en el detalle se ven ya las dos tomas.
13. Otra cantidad: desplegar «Otra cantidad» y registrar 100 ml → el total sube 100 ml y el vaso siguiente queda parcialmente lleno, con 100 de sus 250 ml; `GET /today` lleva `partialServingMl` 100; la toma de 100 ml encabeza «Tomas de hoy».
14. Opcional, con cambio de zona y restauración: objetivo fijado en una zona adelantada y de nuevo tras volver a `Europe/Madrid`, para observar que no queda una fila posterior a hoy; y, con la zona cambiada, que `GET /entries` da otra `localTime` para las mismas tomas y decide con la zona nueva cuáles son de hoy.
15. Restaurar: objetivo 2750, ración 250 y zona `Europe/Madrid`. Hoy vuelve a evaluarse con 2750, y `GET /today` lleva `servingMl` 250 y `goalServings` 11.

Estado final de la base: la fila sembrada, una fila del historial de objetivos con la fecha de la verificación y valor 2750, la ración en 250, y las tres entradas añadidas en los pasos 11 a 13 (dos de 250 ml y una de 100 ml), que son permanentes y pasan a formar parte de los datos de referencia.

**Cubierto solo por prueba automática** (no debe leerse como verificado en real): usuario sin objetivo y días sin objetivo (incluidos la tarjeta de Nutrición y los ajustes sin objetivo configurado); rachas de más de un día y racha que continúa con el día en curso incompleto; racha más larga que el periodo; periodo de un año con datos; primer registro anterior al periodo; redondeos y empates; fin de mes y año bisiesto en `3m` y `1y`; semana que cruza un cambio de objetivo en mitad de la semana, semana sin objetivo, semana entera sin entradas posterior al primer registro y semana recortada por el inicio del periodo; ración mayor que el objetivo, objetivo que no es múltiplo de la ración y más de 24 vasos; los límites exactos de la ración (50 y 2000); tomas a ambos lados de la medianoche local y en el cambio de hora.

**Límites:** solo macOS; un único navegador de escritorio emulando un móvil de 375 px de ancho, salvo que la autora lo pruebe en un teléfono (la zona táctil de los vasos y su animación solo se juzgan de verdad en un dispositivo). El tema se cambia emulando `prefers-color-scheme`, con el atributo `data-theme` de `<html>` o con `ThemeService.setPreference`; el color de acento, cambiando `--accent` en el estilo en línea de `<html>`; el movimiento reducido, emulando `prefers-reduced-motion`.

### 20. Tamaño de la ración: un campo del usuario, validado en el servidor, con sus dos endpoints

Decisión de la autora: el tamaño de la ración es un ajuste por usuario guardado en el servidor, de 250 ml por defecto. Aquí se resuelve dónde vive, cómo se valida y cómo se expone.

**Dónde se guarda: una columna de `users`.** Columna `water_serving_ml` (entero, no anulable, valor por defecto 250), propiedad `WaterServingMl` de `UserEntity`. Es el precedente del proyecto para un ajuste por usuario: la zona horaria es `users.time_zone_id`, con su valor por defecto en una constante del dominio y un endpoint propio para leerla y cambiarla. Todo usuario tiene valor desde el primer momento, también los que cree `add-auth`, sin fila que sembrar y sin el caso «todavía no configurado».

- La constante del valor por defecto y los dos límites viven en `Domain/WaterTracking/` (nombre propuesto: `WaterServingDefaults`, con `DefaultServingMl` = 250, `MinServingMl` = 50 y `MaxServingMl` = 2000), como `TimeZoneDefaults` vive en `Domain/LocalDay/`. La entidad se inicializa con la constante y el sembrado de `Program.cs` la asigna de forma explícita, igual que hace con la zona horaria.
- **Reparto por capas.** El dato vive en la fila del usuario, pero pertenece a `water-tracking`: lo leen y lo escriben `IWaterTrackingRepository` y `WaterTrackingRepository`, sobre `Users`, igual que `ProfileRepository` lee y escribe la zona horaria sobre esa misma tabla. Ningún repositorio pasa por el otro, y `profile` no gana ninguna operación. El servicio y el controlador son los de agua.

*Alternativa descartada: una columna en `water_goals`, junto al objetivo.* Parece el sitio natural, pero esa fila no existe hasta que el usuario fija un objetivo (por eso `GET /goal` responde `404`): guardar una ración sin objetivo obligaría a crear la fila con un objetivo inventado o a hacer anulable `daily_goal_ml`, y en ambos casos cambiaría lo que hoy significa «no hay fila» para `GET /goal`. Además modificaría la tabla que la decisión 1 deja intacta a propósito, que es lo que hace seguro revertir.

*Alternativa descartada: una tabla propia de ajustes de agua.* Mantendría todo dentro de las tablas de agua, pero son una tabla, una entidad, un `DbSet` y la lógica de «fila ausente = valor por defecto» para un solo entero. Si aparecen más ajustes de hidratación, se podrá extraer entonces sin cambiar la API.

**Sin historial.** A diferencia del objetivo, la ración no se guarda por día: ningún día se evalúa con ella. Las entradas guardan mililitros, no raciones.

**Qué pasa al cambiar la ración: nada con lo ya registrado.** No se toca ninguna entrada, ningún total, el historial ni ninguna estadística. Cambian dos cosas, y solo desde ese momento: cuántos mililitros registra el vaso con «+» y en cuántos vasos se reparte el total del día (decisión 21). Un usuario que lleva 750 ml en tres raciones de 250 y cambia la ración a 500 ve una ración completa y la segunda a medias; sus tres entradas siguen siendo de 250 ml.

**Migración: propia, en la fase que la usa.** El change tiene ya la migración del historial de objetivos (decisión 3), en la fase 2. La columna de la ración va en **otra migración, en la fase 4**, y no en la misma:

- Cada fase sigue siendo autocontenida: la fase 2 no añade una columna que ningún código usa hasta dos fases después, y se puede cerrar y verificar sin saber nada de raciones.
- Cada migración se revisa y se aprueba por separado antes de arrancar la API, con una sola cosa que mirar; y cada una tiene su propio `Down`.
- El coste es una segunda escritura de esquema contra Neon, con su propio visto bueno.

Contenido: `Up` añade la columna `water_serving_ml` a `users`, de tipo entero, no anulable y con valor por defecto 250; `Down` la elimina. Nada más. **Atención al valor por defecto:** para una columna entera no anulable, EF Core genera `defaultValue: 0`, y un 0 dejaría al usuario existente con una ración no válida. El valor 250 se fija en el `AddColumn` de la migración, como en `AddUserTimeZone`, cuya columna lleva `"Europe/Madrid"` sin que la instantánea del modelo declare ningún valor por defecto. Es lo primero que se revisa en el archivo generado, antes de arrancar la API. Es la primera vez en este change que una migración toca una tabla existente; lo hace solo añadiendo una columna con valor por defecto, que el código anterior ignora.

**Validación.** Un entero entre 50 y 2000 ml, ambos incluidos.

- *Por qué esos límites.* 50 ml es un sorbo o una taza pequeña; por debajo, los vasos dejan de ser una unidad útil. 2000 ml es una botella grande; por encima, ya no es «una ración». Con los valores habituales (200 a 500 ml) el objetivo actual de 2750 ml se reparte en 6 a 14 vasos.
- *Relación con el objetivo: ninguna.* La ración y el objetivo se validan cada uno por su cuenta. Una ración mayor que el objetivo es válida: el objetivo se alcanza en el primer vaso. Atarlos obligaría a que `PUT /goal` empezara a rechazar valores que hoy acepta (rompería un contrato que este change promete no romper) y a decidir en qué orden se cambian cuando hay que mover los dos. El reparto en vasos está definido para cualquier combinación (decisión 21), y la tarjeta tiene su salida para cuando salen demasiados (decisión 23).
- *Dónde.* Siguiendo la convención del proyecto, el `Rq` (`SetWaterServingRq`, que deriva de `BaseApiRq`) comprueba el intervalo en `IsValid()` con las constantes del dominio, el controlador responde `400` con un mensaje de texto plano que indica el intervalo admitido, y no se lanza ninguna excepción. Un valor rechazado no cambia el guardado.

**Endpoints**, en `WaterTrackingController`, con el usuario de `FixedTestUser.Id` como el resto:

| Operación | Petición | Respuesta |
|---|---|---|
| `GET /api/water-tracking/serving` | Sin parámetros | Siempre `200`, con `WaterServingRs`. Nunca `404`: un usuario que no la ha cambiado tiene 250 |
| `PUT /api/water-tracking/serving` | `SetWaterServingRq`: `servingMl` (entero) | `200` con `WaterServingRs` y el valor guardado; `400` con texto plano si está fuera de 50 a 2000 |

`WaterServingRs`:

| Campo | Tipo | Contenido |
|---|---|---|
| `servingMl` | entero | Tamaño de la ración del usuario |
| `minServingMl` | entero | Límite inferior admitido (50) |
| `maxServingMl` | entero | Límite superior admitido (2000) |

Los límites viajan en la respuesta para que el cliente los muestre en el texto de ayuda y en el mensaje de rechazo sin escribirlos en su código: la regla sigue viviendo solo en el servidor (decisión 15).

La política de CORS no cambia: `PUT` y `Content-Type` ya están admitidos.

**La tarjeta no llama a `GET /serving`.** La ración viaja también en `GET /today` (decisión 21), que es lo único que pide la tarjeta. `GET /serving` lo usa el bloque de ajustes del detalle.

### 21. Reparto del día en raciones: lo calcula el servidor y viaja en `GET /today`

La tarjeta tiene que saber cuántos vasos están llenos, cuánto lleva el vaso en curso y en qué vaso se alcanza el objetivo. Se podría sostener que es mera presentación a partir de tres números (total, objetivo y ración). **Se decide que lo calcula el servidor**, por tres motivos:

- Es aritmética con reglas, no disposición: una división entera, un resto y un redondeo hacia arriba. `CLAUDE.md` dice que el cliente valida el formato y presenta datos, y que los cálculos pertenecen a la API; este mismo diseño ya aplica ese criterio a algo comparable, la media de cada semana (decisión 16), para que el cliente «no sume ni promedie».
- La API está pensada para varios clientes: con el reparto hecho, todos pintan los mismos vasos sin reimplementar el redondeo.
- Es una función pura trivial de probar sin interfaz, con los casos límite escritos una vez.

**Lo que calcula el servidor y lo que no.**

| Calcula el servidor (regla) | Decide el cliente (disposición) |
|---|---|
| Raciones completas | Cuántos vasos pinta: los necesarios para llegar al del objetivo y siempre uno más allá del último lleno |
| Mililitros de la ración en curso | Filas de ocho, y el límite de 24 vasos (decisión 23) |
| Posición de la ración del objetivo | Altura del agua del vaso en curso: la proporción entre los mililitros en curso y la ración, igual que antes era presentación la anchura de la barra |
| Si el día está cumplido (`goalMet`, decisión 7) | Dónde va el «+»: en el vaso siguiente al último lleno |

**Pieza pura** en `Domain/WaterTracking/` (decisión 6), a partir del total del día, el objetivo vigente (o `null`) y la ración:

- *Raciones completas:* el cociente entero del total entre la ración.
- *Mililitros en curso:* el resto de esa división; `0` si el total es múltiplo de la ración.
- *Ración del objetivo:* el objetivo entre la ración, redondeado hacia arriba; `null` si no hay objetivo vigente. Es la posición (empezando en 1) del vaso en el que el total alcanza el objetivo.

Ejemplos: total 600, objetivo 2750, ración 250 → 2 completas, 100 ml en curso, objetivo en la 11. Total 2800 → 11 completas, 50 ml en curso. Objetivo 2000 con ración 300 → objetivo en la 7 (6,67 redondeado hacia arriba). Objetivo 1500 con ración 2000 → objetivo en la 1.

**`GET /today` gana cuatro campos** respecto a la tabla de la decisión 7. La respuesta deja de tener la misma forma que un elemento de `days` y pasa a tener su propio `Rs` (`WaterTodayRs`), que la fase 3 crea ya con ese nombre para que la fase 4 solo le añada campos:

| Campo | Tipo | Contenido |
|---|---|---|
| `date`, `totalMl`, `goalMl`, `goalMet` | | Como en la decisión 7 |
| `servingMl` | entero | Tamaño de la ración del usuario |
| `fullServings` | entero | Raciones completas del día |
| `partialServingMl` | entero | Mililitros de la ración en curso; `0` si no hay ninguna a medias |
| `goalServings` | entero o `null` | Posición de la ración en la que se alcanza el objetivo; `null` si hoy no hay objetivo vigente |

**Por qué en `GET /today` y no en otra petición.** Es la recomendación de la autora y se adopta: la tarjeta se pinta entera con una sola petición, y el total, el objetivo, la ración y el reparto salen del mismo instante y no pueden contradecirse. La petición pasa de tres lecturas a cuatro (la de la ración). Es un cambio aditivo sobre un endpoint que nace en este mismo change, sin clientes anteriores.

*Alternativa descartada: que el cliente pida `GET /serving` y `GET /today` y haga las cuentas.* Dos peticiones al entrar y después de cada registro, y las reglas en el cliente.

*Alternativa descartada: que el servidor devuelva la lista de vasos ya dispuesta (uno por elemento, con su estado).* Metería en la API decisiones de pantalla (cuántos caben en una fila, el límite de 24) que otro cliente puede querer distintas.

**Registrar una ración no necesita un endpoint.** El vaso con «+» hace `POST /entries` con `amountMl` igual al `servingMl` de la respuesta de `/today` que está en pantalla. La entrada guarda mililitros, como cualquier otra, y no recuerda que fue «una ración».

### 22. Tomas del día: `GET /api/water-tracking/entries`

El bloque «Tomas de hoy» necesita las entradas individuales, que hoy la API no expone (`/history` y las estadísticas solo dan totales por día).

**Ruta y parámetros.** `GET /api/water-tracking/entries`, sobre la misma ruta en la que ya se registra con `POST`. **Sin parámetros: devuelve siempre las tomas del día local actual del usuario.** No se añade un parámetro de fecha: ninguna pantalla lo necesita y sería la primera fecha que envía el cliente, en contra de la regla «Local day» de `CLAUDE.md` (el cliente no envía fechas ni límites de día). Consultar otro día queda fuera de alcance; la respuesta lleva la fecha, de modo que se podrá añadir después un parámetro opcional sin romper a nadie.

**Respuesta** (`WaterDayEntriesRs`, siempre `200`):

| Campo | Tipo | Contenido |
|---|---|---|
| `date` | fecha | El día local actual del usuario, decidido por el servidor |
| `entries` | lista | Las tomas de ese día, **de la más reciente a la más antigua**; lista vacía si no hay ninguna |

Cada elemento (`WaterDayEntryRs`):

| Campo | Tipo | Contenido |
|---|---|---|
| `id` | entero | Identificador de la entrada |
| `amountMl` | entero | Cantidad |
| `dateCreated` | instante | El instante UTC en que se registró, con el mismo nombre y formato que en `WaterEntryRs` |
| `localTime` | texto | La hora local del usuario en ese instante, en formato `HH:mm` de 24 horas («08:15») |

**La hora la calcula el servidor.** Se devuelven las dos cosas, y el cliente Angular solo usa `localTime`:

- La zona horaria del usuario vive en el servidor y puede no ser la del navegador. Si el cliente formateara el instante, usaría la zona del dispositivo, o tendría que pedir la zona del usuario y convertir por su cuenta, que es justo lo que la regla «Local day» evita. El servidor, que ya ha decidido con `UserCalendar` que la toma pertenece a hoy, dice con ese mismo calendario a qué hora local fue: el día y la hora nunca pueden contradecirse.
- El cliente sigue sin crear objetos `Date` ni usar `Intl` (decisión 13): pinta la cadena tal como llega.
- `dateCreated` se conserva para otros clientes y como criterio de orden inequívoco; el cliente Angular no lo interpreta.
- `localTime` es un texto ya formateado, y no un valor de hora serializado, para que su forma no dependa de cómo serialice .NET una hora (con o sin segundos). Formato fijo de 24 horas, sin configuración regional.

Para ello `UserCalendar` (`Domain/LocalDay/`) gana una operación: la hora local de un instante, junto a la que ya da el día local. Es el único cambio en esa carpeta.

**Orden.** Por instante descendente y, a igualdad de instante, por identificador descendente. La hora local no sirve como criterio: en el cambio al horario de invierno una misma hora local ocurre dos veces (Risks).

**Estado vacío.** La API responde `200` con `entries` vacía; el cliente muestra «Hoy todavía no has registrado agua» con `app-status-message` de tipo `empty`, no una lista vacía.

**Solo consulta.** Las tomas no se pueden borrar ni editar: sigue fuera de alcance, como en el proposal. No hay `DELETE` ni `PUT` de una entrada, la lista no pinta ningún control por fila y el `id` viaja solo como identidad de cada fila. Una toma registrada por error se queda.

**Lecturas.** Dos: la zona horaria y las entradas desde el inicio UTC del día actual (los límites los da `UserCalendar.GetUtcRange`, como en el resto). No lee objetivos ni la ración.

**Se mantiene además la tarjeta «Historial»**, que es otra cosa: totales por día de un periodo. «Tomas de hoy» son las entradas sueltas de un solo día.

**En el cliente** (`water-today-entries`, decisión 15): una `app-card` «Tomas de hoy» con una lista (`ul`), una fila por toma con la cantidad («250 ml») como texto principal y la hora («08:15») en secundario; «Cargando…», error con «Reintentar» y vacío con `app-status-message`. El subtítulo de la tarjeta no repite la fecha: el título ya dice que son las de hoy.

### 23. Vasos: SVG propio, llenado animado con las variables de movimiento y accesibilidad

Decisión de la autora, tomada de su referencia visual: el progreso de hoy se ve como una fila de vasos y se registra tocando el siguiente. De la referencia se toma el patrón; el dibujo es propio.

**Qué se pinta.** `water-glasses` recibe la respuesta de `/today` y pinta, en orden:

| Vaso | Cuáles | Aspecto |
|---|---|---|
| Lleno | Los `fullServings` primeros | Agua hasta arriba |
| Siguiente | El que va después del último lleno. Siempre existe | Con un «+». Vacío si `partialServingMl` es `0`; si no, con agua hasta la proporción `partialServingMl` / `servingMl`. Es el único interactivo: registra una ración |
| Vacío | Los que quedan hasta el del objetivo | Solo el contorno |
| Del objetivo | El de la posición `goalServings`, si no es `null`. Puede ser a la vez lleno, siguiente o vacío | Una marca de verificación encima |

- **Cuántos.** Con objetivo: el mayor entre `goalServings` y `fullServings` + 1, de modo que se llega siempre al vaso del objetivo y siempre hay uno siguiente, también por encima del objetivo. Sin objetivo: el mayor entre 8 y `fullServings` + 1, sin marca. Es disposición, no una regla (decisión 21).
- **Filas.** Ocho vasos por fila como máximo, en una rejilla de ocho columnas; el noveno empieza otra fila, alineada a la izquierda. Con 2750 ml y raciones de 250 ml son once: ocho y tres.
- **Más de 24 vasos** (tres filas; por ejemplo, 3000 ml en raciones de 100 ml). No se pintan uno a uno: la tarjeta muestra el progreso por raciones con texto («5 de 30 raciones», o «5 raciones» sin objetivo) y un botón «Añadir ración (+100 ml)», que es el mismo control que el vaso con «+». Mantiene la tarjeta compacta sin limitar lo que el usuario puede configurar.

**Dibujo.** `water-glass` es un SVG en línea, propio, con tres partes: el contorno del vaso; el agua, un rectángulo recortado por el interior del vaso; y, superpuestos fuera del SVG, el «+» y la marca del objetivo, con los iconos `plus` y `check` de Phosphor (`ui-foundation`, decisión 8). No se usa ninguna imagen, ilustración ni recurso de la aplicación de referencia, ni ninguna librería de animación.

| Parte | Variable de `ui-foundation` |
|---|---|
| Contorno del vaso | `--color-border-strong` (3:1 frente a la tarjeta en ambos temas) |
| Agua | `--color-accent` (5,65:1 y 3,54:1 frente a la tarjeta) |
| Interior vacío | Ninguno: se ve la tarjeta (`--color-surface`) |
| «+» | `--color-accent-strong` |
| Marca del objetivo, pendiente y alcanzado | `--color-text-secondary` y `--color-success` |
| Foco | El anillo global (`--color-focus-ring`) |

El interior vacío no usa `--color-surface-raised`: es la regla de `ui-foundation` de no poner un relleno de acento sobre la superficie elevada (decisión 15). El `hover` y la pulsación del vaso siguiente cambian el contorno y el «+», no el agua.

**Animación de llenado.** Solo CSS, sin temporizadores ni animación desde TypeScript:

- La altura del agua se expresa como una fracción de 0 a 1 en una propiedad personalizada del vaso, que el componente fija a partir de sus datos (1 en un vaso lleno; `partialServingMl` / `servingMl` en el vaso en curso; 0 en uno vacío). El agua se escala en vertical con `transform`, con el origen en la base.
- La transición es de `transform`, con `--duration-slow` (la duración que `ui-foundation` reserva para «una barra o un anillo que se llena») y `--ease-enter` (lo que se llena: empieza rápido y frena al llegar). El «+» y la marca cambian con `opacity` y color en `--duration-fast`. No se escribe ninguna duración ni curva suelta, y solo se animan `transform`, `opacity` y colores, como exige `ui-foundation`.
- **Cuándo se anima: al llegar el dato confirmado, no al tocar.** El toque lanza el registro; cuando el servidor responde y llega el día actual nuevo, el vaso pasa de su nivel anterior a lleno y el «+» salta al siguiente. No es optimista: si el registro falla no hay nada que deshacer, y lo que se ve es siempre lo que el servidor ha guardado. Mientras dura la petición el vaso está bloqueado (decisión 15). La animación no retrasa nada: el registro ya está hecho cuando empieza.
- **Al entrar no se anima.** Los vasos aparecen en su estado; solo se anima un cambio de nivel. **A comprobar en la fase 7:** que al cargar la tarjeta los vasos llenos no se llenan desde cero.
- Con «Otra cantidad» se anima igual: el vaso en curso sube a su nivel nuevo, y si la cantidad completa uno o más vasos, cada uno pasa a lleno a la vez.

**Movimiento reducido.** Con `prefers-reduced-motion: reduce`, `ui-foundation` pone a `0s` las tres variables de duración (decisión 6), así que la transición deja de verse y el vaso cambia de estado al instante, sin una línea de código en este change. El estado final es idéntico. Como la animación es solo CSS con esas variables, no hay nada que consultar desde TypeScript. Los gráficos sí se animan desde JavaScript y lo tratan aparte (decisión 13). **A comprobar en la fase 7**, emulando la preferencia en el navegador.

**Accesibilidad.**

- *Los vasos no son la única forma de conocer el progreso.* La cifra de `water-today-progress` es texto real, y la fila lleva además un texto alternativo, con la utilidad `.visually-hidden`, compuesto con los campos de la respuesta: «2 raciones completas de 250 ml y una en curso. El objetivo se alcanza en la ración 11.» (sin objetivo, sin la segunda frase). Los vasos que no son el siguiente son decorativos (`aria-hidden`).
- *El vaso con «+» es un `<button>`* con nombre accesible que incluye la cantidad: «Añadir una ración de 250 ml». Es el único elemento enfocable de la fila.
- *Zona táctil de 44 por 44 px* (`--size-touch`). A 375 px caben ocho vasos de unos 34 px de ancho en el interior de la tarjeta (311 px), más estrechos que 44 px; la zona táctil del vaso siguiente se amplía hasta 44 px con su relleno, por encima de sus vecinos, que no son interactivos y por tanto no compiten con ella. **A comprobar en la fase 7**, midiéndola a 375 px.
- *El estado no depende solo del color.* Lleno, parcial y vacío se distinguen por la altura del agua, que es forma; el siguiente, por el «+»; el del objetivo, por la marca de verificación; y que el objetivo está cumplido lo dice el texto «Objetivo cumplido», no el color de la marca.
- *El foco no se pierde al registrar.* Tras un registro, el «+» pasa a otro vaso: si el botón tenía el foco, lo recibe el nuevo vaso siguiente.
- *El total nuevo se anuncia* por la región `aria-live` de la cifra (decisión 15); la animación no es la única señal del cambio.

**Pruebas** (jsdom no calcula estilos ni ejecuta transiciones: se prueba la estructura, no el movimiento).

- `water-glasses`: número de vasos en cada caso (11 con 2750 y 250; 12 con 2800 de 2750; 8 sin objetivo; `fullServings` + 1 cuando se supera el objetivo); cuáles están llenos; el nivel del vaso en curso (100 de 250); un único botón, en el vaso siguiente, con su nombre accesible y la cantidad; la marca en `goalServings` y ninguna sin objetivo; el texto alternativo en cada caso; con más de 24, el texto de raciones y el botón «Añadir ración» en lugar de los vasos; emite la petición de registrar y no la emite con un registro en curso (`aria-disabled`); tras cambiar los datos, el foco pasa al nuevo vaso siguiente.
- `water-glass`: la fracción de llenado se refleja en su propiedad; el «+» y la marca aparecen solo cuando se piden; el SVG es decorativo.
- En el navegador (fase 7): la animación de llenado, su ausencia con movimiento reducido, que al entrar no se anima, la zona táctil medida, y el aspecto en ambos temas y a 375 px y 1280 px.

## Risks / Trade-offs

- [Las dos migraciones se aplican solas al arrancar la API contra la base real] → Cada una se revisa, con su SQL, y se aprueba antes de arrancar, anotando el estado previo (decisiones 3 y 20). La primera no toca las tablas existentes; la segunda solo añade una columna a `users`.
- [EF Core genera `defaultValue: 0` para la columna de la ración: si no se corrige, el usuario existente queda con una ración de 0 ml, que es un valor no válido y dejaría el reparto en raciones dividiendo por cero] → El 250 se fija en la migración y es lo primero que se revisa antes de arrancar (decisión 20); tras arrancar, `GET /serving` debe devolver 250 (paso 6 de la decisión 19).
- [`water_goals` podría tener más de una fila por usuario: no hay índice único] → Comprobarlo antes de migrar; si ocurriera, la migración falla entera y no deja datos a medias.
- [Dato duplicado entre `water_goals` y la última fila del historial] → Una sola operación de escritura en una transacción; invariante documentado y cubierto con los dobles; retirada de `water_goals` en Open Questions.
- [Dos `PUT /goal` simultáneos el primer cambio del día chocarían con el índice único y uno respondería `500`] → Se acepta: un solo usuario y una acción manual. No se añade reintento.
- [El repositorio de EF no tiene pruebas automáticas; el doble reimplementa sus reglas] → Los pasos 8, 9, 10 y 14 de la decisión 19 ejercitan el repositorio real.
- [Cambiar de zona horaria desplaza hasta un día la frontera entre dos objetivos] → Comportamiento documentado (decisión 4), acotado y reversible.
- [Cambiar el objetivo altera el día de hoy y puede romper o crear la racha de hoy] → Es la regla aprobada; el detalle, que es donde se cambia, vuelve a pedir las estadísticas en pantalla al guardarlo, y la tarjeta pide el día actual cada vez que se entra en Nutrición (decisión 15).
- [Los días anteriores al change se evalúan con 2750 ml aunque en su momento el objetivo fuera otro] → Decisión de la autora; no hay dato mejor.
- [Suposiciones sobre ECharts 6 que resulten falsas, como ocurrió con una API de plataforma en `user-local-day`] → Todas están marcadas «a comprobar» y la fase 5 existe para resolverlas en un navegador real antes de construir los gráficos del detalle. Plan B para el calendario: rejilla CSS (decisión 17), que no cambia la API ni las specs.
- [ECharts acaba en el paquete inicial o pesa más de lo esperado] → Medición obligatoria en la fase 5 (decisión 18).
- [Una importación descuidada hace que la página de Nutrición arrastre ECharts] → Inspección de los trozos del build y de la pestaña de red en la fase 8 y en el paso 7 de la decisión 19 (decisión 18).
- [Las pruebas de componentes no ejecutan ECharts: un gráfico puede estar roto con todas las pruebas en verde] → Comprobación en navegador, en ambos temas, en las fases 5, 8 y 9; las funciones que construyen opciones sí están probadas.
- [La barra semanal promedia y oculta la variación entre días, y una semana parcial de un solo día pesa a la vista lo mismo que una completa] → La descripción emergente indica cuántos días cuentan; el calendario y la lista del historial dan el detalle diario del mismo periodo.
- [La referencia semanal es una media de objetivos y, en una semana con cambio de objetivo, muestra un nivel que nunca fue el objetivo de ningún día] → Se rotula como «objetivo medio» y no se deriva de ella ningún estado de cumplimiento (decisión 16).
- [La barra cambia de significado al cambiar el periodo de la tarjeta «Evolución»: total de un día o media diaria de una semana] → Título distinto sobre el gráfico y texto alternativo propio de cada serie.
- [El porcentaje de días cumplidos baja al empezar cada día y se recupera al cumplirlo, mientras que la racha no se inmuta] → Decisión de la autora; la asimetría y su motivo están en la decisión 9.
- [`/history` gana un límite superior de 366 días que antes no tenía] → Ningún cliente lo supera; queda en la tabla de contrato y en el README.
- [`/history` queda sin ningún cliente que lo use y puede degradarse sin que nadie lo note] → Sigue cubierto por las pruebas de backend y por los pasos 1, 2, 6 y 8 de la decisión 19.
- [Sin índice en `water_entries`, la consulta de un año recorre toda la tabla] → Irrelevante con el volumen actual; Open Questions.
- [Las estadísticas y el cambio de objetivo quedan a un toque de distancia, y la página de Nutrición ya no muestra ni la racha ni el historial] → Decisión de la autora; la tarjeta conserva lo que se usa a diario (el progreso y el registro), el enlace «Ver estadísticas» está siempre visible y, sin objetivo, la tarjeta lleva directamente a configurarlo.
- [La tarjeta y el detalle no comparten estado: ir y volver repite peticiones] → Se acepta: es una petición en la tarjeta y cinco en el detalle, y garantizan que cada pantalla muestra datos recientes, que es además lo que hace que un ajuste cambiado en el detalle se vea en la tarjeta sin sincronizar nada; la memoria del detalle no sobrevive a la visita (decisión 15, Non-Goals).
- [`ui-foundation` está diseñado pero no implementado ni fusionado: si no lo está cuando toque, las fases de cliente no pueden empezar] → Dependencia explícita en el Migration Plan, con la forma de comprobarla: las fases 5 a 8 la comprueban en su primera tarea y, si no se cumple, paran e informan; las fases 2, 3 y 4 (backend) no dependen de él y pueden adelantarse.
- [La implementación de `ui-foundation` puede apartarse de su diseño, que es lo único que se ha leído: otro nombre de variable, otra entrada en un componente base, otro formato de color] → La primera tarea de cada fase de cliente lee lo archivado (design, specs y `verification.md`) y anota las diferencias; los puntos «a comprobar» de las decisiones 13 y 17 se resuelven en la fase 5, antes de construir el contenido del detalle. Si algo no encaja se decide con la autora, sin modificar la base visual desde este change.
- [Los colores derivados del acento son `color-mix()` y su valor calculado puede llegar como `color(srgb …)`, que ECharts puede no entender] → Lo advierte `ui-foundation`, que anota el formato real; el helper de lectura lo normaliza si hace falta (decisión 13), y se comprueba en la fase 5.
- [Los colores de los gráficos se leen en ejecución: si la relectura no se dispara, un gráfico queda con los colores del tema anterior] → La paleta depende de `ThemeService.revision` (decisión 13); se comprueba en el navegador en las fases 5 y 8 y en el paso 7 de la decisión 19, porque las pruebas automáticas no ejecutan ni ECharts ni el cálculo de estilos.
- [Con otro color de acento, el contraste entre los estados del calendario deja de estar calculado] → Los estados no cumplidos llevan cada uno su marca y el calendario tiene además leyenda, descripción emergente y lista del historial (decisión 17); el contraste de un acento nuevo lo garantiza la lista cerrada de acentos validados de `ui-foundation`. Queda sin proteger cambiar `--accent` a mano, que es solo una vía de verificación.
- [El borde por celda del calendario puede no ser posible en ECharts, o no verse a ese tamaño] → Punto «a comprobar» de la decisión 17, con dos salidas escritas (trama o plan B) y ninguna que deje la distinción solo al tono.
- [Cuatro selectores en una pantalla pueden confundir: el resumen puede hablar de 30 días y el calendario de 3 meses a la vez] → Cada tarjeta muestra como subtítulo el intervalo de días que abarca, cada selector se nombra con su tarjeta, y la racha, que no depende de ninguno, está fuera de las tarjetas y lo dice con texto (decisión 15).
- [Tarjetas con periodos distintos salen de respuestas distintas, pedidas en instantes distintos: si entre dos peticiones pasa la medianoche local, una tarjeta puede terminar en un día y otra en el siguiente; y una pantalla que se deja abierta sigue mostrando lo que se cargó al entrar] → Se acepta: cada tarjeta es coherente consigo misma, porque sale de una sola respuesta, y su subtítulo dice qué días abarca; salir y volver a entrar lo corrige. No se añade caducidad por tiempo.
- [La respuesta lleva siempre todo: una tarjeta que solo necesita el resumen recibe también la serie de un año] → Trade-off de la decisión 7: una sola forma de respuesta y peticiones compartidas entre tarjetas a cambio de unos 30 kB en el peor caso.
- [Es la primera ruta hija de la aplicación: cambia cómo `HomeComponent` obtiene el título y puede afectar a la navegación, a la recarga directa y a la carga de `config.json`] → Puntos «a comprobar» de la decisión 15, con pruebas de rutas y de la cabecera en la fase 6 y comprobación en navegador en el paso 7 de la decisión 19.
- [El objetivo de la cifra de la tarjeta y el que muestra el campo de «Ajustes» pueden diferir durante un día tras un cambio de zona horaria hacia atrás: uno es el vigente hoy y el otro el configurado] → Es el caso particular de la decisión 4, acotado a un día; ahora están además en pantallas distintas.
- [Cuatro endpoints más que mantener (`/today`, `/serving` en lectura y escritura, y la lectura de `/entries`)] → `/today` reutiliza la pieza de la serie de días y la de raciones; los de la ración siguen el patrón de la zona horaria; la lista de tomas reutiliza una lectura que ya existe. Sus alternativas están en las decisiones 7, 20, 21 y 22.
- [La regla «sin librerías de interfaz» deja de ser absoluta] → La excepción se acota por escrito en `CLAUDE.md`: solo ECharts, solo gráficos, solo importado en `shared/components/chart/`.

- [El detalle deja de ser de solo lectura: guardar el objetivo deja obsoleta su memoria por periodo, y una respuesta en vuelo puede llegar después con datos del objetivo anterior] → Invalidación completa al guardar, nueva petición de los periodos en pantalla y un contador de generación que descarta las respuestas anteriores (decisión 15), con sus pruebas.
- [El cambio de objetivo está ahora más escondido: ya no está en la pantalla donde se registra el agua] → Decisión de la autora, siguiendo su referencia; es un ajuste que se toca pocas veces. Los ajustes son el primer bloque del detalle y, sin objetivo, la tarjeta enlaza a ellos con «Configurar objetivo».
- [Los dos ajustes se presentan como campos de formulario y no como las filas de lista de la referencia] → `ui-foundation` aplaza la fila de lista y aquí no se duplica (decisión 15); pasar a ella después es un cambio local (Open Questions).
- [Una ración muy pequeña frente al objetivo da decenas de vasos (55 con 2750 ml y 50 ml)] → Con más de 24 vasos la tarjeta da el progreso por raciones en texto y conserva el registro con un toque (decisión 23); no se limita lo que el usuario puede configurar.
- [La ración y el objetivo no se validan entre sí: caben combinaciones raras, como una ración mayor que el objetivo] → Deliberado, para no cambiar la validación de `PUT /goal`; el reparto en vasos está definido para todas (decisiones 20 y 21) y cubierto con pruebas.
- [Las entradas no se pueden borrar: un toque de más en un vaso queda para siempre, y ahora registrar es más fácil que nunca] → El vaso y los botones se bloquean mientras hay un registro en curso (decisión 15). Un toque equivocado pero deliberado no tiene remedio: borrar tomas sigue fuera de alcance, y «Tomas de hoy» al menos lo deja a la vista.
- [El vaso no se llena hasta que responde el servidor: con Neon puede tardar y el toque parece no hacer nada] → El control queda marcado como ocupado mientras tanto; el llenado optimista es una Open Question con su coste.
- [La animación de los vasos no se puede probar en jsdom] → Las pruebas cubren la estructura y el nivel de cada vaso; el movimiento, su ausencia con movimiento reducido y que no se anima al entrar se comprueban en el navegador, en la fase 7 y en los pasos 11 y 12 de la decisión 19.
- [Ocho vasos no caben a 44 px cada uno en un móvil de 375 px] → Solo el vaso siguiente es interactivo y solo él necesita la zona táctil mínima, que se amplía sobre sus vecinos (decisión 23); se mide en la fase 7. En un teléfono más estrecho que 375 px no se ha comprobado.
- [La hora de las tomas se da en la zona del perfil, no en la del dispositivo: un usuario de viaje que no ha cambiado su zona ve horas que no coinciden con su reloj] → Es coherente con el resto de la aplicación, que agrupa los días con esa misma zona (decisión 22); editarla pertenece a `update-profile`.
- [En el cambio al horario de invierno dos tomas pueden mostrar la misma hora local, o una hora anterior a la de la toma que la precede] → El orden es siempre por instante (decisión 22); se acepta la rareza una noche al año.
- [`GET /entries` devuelve todas las tomas del día sin límite] → Un día tiene, como mucho, unas decenas; no se pagina.
- [La migración de la ración toca `users`, la tabla que `add-auth` va a ampliar] → Es una columna con valor por defecto, independiente de las suyas; se anota en su design en la fase 9 para que su migración no la pise.
- [Dos fases de cliente (6 y 7) dejan durante un tiempo el objetivo editable en dos sitios] → Es el precio de no tener nunca la aplicación a medias (Migration Plan); la fase 7 lo retira de la tarjeta.

## Migration Plan

Cada fase la ejecuta una sesión distinta, toca un conjunto acotado de archivos y no se cierra sin su verificación; la orquestadora verifica y hace los commits.

**Dependencia de `ui-foundation`.** Las fases de cliente (5, 6, 7 y 8) requieren que el change `ui-foundation` esté implementado, archivado y fusionado en la rama de trabajo antes de empezar: aporta las variables de color y de movimiento, los temas claro y oscuro, `ThemeService` y los componentes base que este change usa y no define. Cada una de esas fases empieza comprobándolo y, si no lo está, para e informa. Las fases de backend (2, 3 y 4) no dependen de él y pueden hacerse antes. La fase 9 lo necesita porque verifica el cliente en ambos temas.

**Cómo se comprueba que `ui-foundation` está fusionado.** Con las tres condiciones que el propio `ui-foundation` se compromete a dejar (su decisión 15 y su tarea de cierre): existe un directorio `openspec/changes/archive/*-ui-foundation`; `openspec list` no lo muestra entre los changes activos; y `CLAUDE.md` tiene su apartado «Base visual», que describe los temas y las variables de color. Y, además, con lo que este change va a usar de verdad: existen `openspec/specs/app-shell/spec.md`, `kora-health-client/src/styles/_tokens.scss`, `kora-health-client/src/app/shared/theme/theme.service.ts` y, en `modules/app-container/shared/components/`, las carpetas `card`, `button`, `field`, `compact-select` y `status-message`. Su `verification.md` archivado se lee antes de empezar: anota el formato literal en que el navegador devuelve los colores calculados y si la lectura hecha al recibir el aviso de cambio de tema devuelve ya los colores nuevos, dos datos de los que depende la decisión 13.

| Fase | Qué produce | Archivos que toca | Verificación de cierre |
|---|---|---|---|
| 0 | Este documento | `openspec/changes/water-statistics/design.md` | `openspec status --change water-statistics` marca `design` como completo |
| 1 | Delta de `water-tracking` y `tasks.md` | `openspec/changes/water-statistics/` | `openspec validate water-statistics --strict` |
| 2 | Historial de objetivos: entidad, índice único, migración con siembra, repositorio, resolución del objetivo por día, `PUT /goal` y `GET /history` con objetivo por día, `days` validado; pruebas | `Domain/` (entidad, contrato, pieza de objetivo por día), `Infrastructure/` (contexto, migración e instantánea, repositorio), `Application/` (servicio, controlador), `tests/Application.Tests/` | Migración revisada antes de arrancar; `dotnet build` y `dotnet test` pasan; al arrancar se aplica una sola migración; `GET /goal` y `GET /history` idénticos al estado previo; `days=0` → `400` |
| 3 | Estadísticas y día actual en backend: periodo, serie densa, serie semanal, cálculo puro, servicio, `Rs`, mapas, endpoints `statistics` y `today` (todavía sin raciones); pruebas | `Domain/` (piezas puras, modelos, contratos), `Infrastructure/` (lecturas nuevas del repositorio), `Application/` (servicio, DTOs, controlador, `AutoMapperProfile`), `tests/Application.Tests/` | `dotnet test` pasa; pasos 3 a 5 de la decisión 19 contra la API real, sin escrituras |
| 4 | Ración y tomas en backend: columna de la ración con su migración, constantes y validación, `GET` y `PUT /serving`, reparto en raciones y sus cuatro campos en `GET /today`, hora local en `UserCalendar`, `GET /entries`; pruebas | `Domain/` (entidad del usuario, constantes, pieza de raciones, `LocalDay/UserCalendar`, modelos, contratos), `Infrastructure/` (migración e instantánea, repositorio), `Application/` (servicio, DTOs, controlador, `AutoMapperProfile`, `Program.cs`), `tests/Application.Tests/` | Migración revisada antes de arrancar (solo añade una columna, con 250 por defecto); `dotnet build` y `dotnet test` pasan; al arrancar se aplica una sola migración; paso 6 de la decisión 19 contra la API real, sin escrituras |
| 5 | Requiere `ui-foundation` fusionado. Integración de ECharts y componente de gráfico compartido: dependencia, cargador, `app-chart`, tipo de opción, paleta de los gráficos leída de las variables del tema y repintado con `ThemeService.revision`, helper de lectura de colores, animaciones desactivadas con movimiento reducido; pruebas con el doble | `kora-health-client/package.json` y su lock, `modules/app-container/shared/components/chart/`, `shared/helpers/` | `npm test -- --watch=false`, `npx ng lint` y `npm run build` pasan; tamaños del paquete inicial y del trozo de ECharts anotados; cada punto «a comprobar» de las decisiones 13, 14 y 17 resuelto en un navegador, en tema claro y en tema oscuro, con un montaje desechable que no se confirma, y su resultado anotado; ningún color literal en la carpeta del gráfico |
| 6 | Requiere `ui-foundation` fusionado. Ruta y detalle básico, con los ajustes y las tomas: ruta hija y título de la cabecera; DTOs y las cinco operaciones del servicio; estado del detalle completo (ajustes, tomas, periodo por tarjeta, memoria por periodo y su invalidación); página de detalle con el enlace de vuelta, la tarjeta «Ajustes» (objetivo y ración) y «Tomas de hoy»; un enlace «Ver estadísticas» en la página de Nutrición, que por lo demás no cambia; pruebas | `app.routes.ts`, `modules/app-container/home/`, `shared/entities/DTOS/water-tracking/`, `services/water-tracking.service.ts`, `modules/app-container/nutrition/` y sus pruebas | Pruebas, lint y build pasan; con datos reales, primero a 375 px y después a ancho de escritorio, en tema claro y en tema oscuro: entrar al detalle, ver los ajustes con sus valores y las tomas de hoy, volver, recarga directa en el detalle, subruta desconocida, cabecera y destino activo; puntos «a comprobar» de la decisión 15 resueltos; la página de Nutrición sigue funcionando como antes |
| 7 | Requiere `ui-foundation` fusionado. Tarjeta de Nutrición con los vasos: estado de la tarjeta sobre `GET /today`, cifra grande, fila de vasos con su animación, «Otra cantidad», tarjeta compuesta y página de Nutrición; se retira de la tarjeta el objetivo (`water-goal-section` desaparece); la lista del historial se muda al detalle, como tarjeta «Historial» con su periodo por defecto (`30d`), todavía sin selector; se retira el uso de `/history`; pruebas | `modules/app-container/nutrition/`, `services/water-tracking.service.ts`, `shared/entities/DTOS/water-tracking/` y sus pruebas | Pruebas, lint y build pasan; con datos reales, a 375 px y a 1280 px y en ambos temas: la tarjeta con su cifra y sus once vasos, sin formulario de objetivo; `/nutricion` pide solo `today`; el historial se ve en el detalle; puntos «a comprobar» de la decisión 23 resueltos (zona táctil, sin animación al entrar, movimiento reducido), con una entrada real solo si la autora la aprueba |
| 8 | Requiere `ui-foundation` fusionado. Contenido del detalle: racha actual y las cuatro tarjetas con periodo, con `app-compact-select` y sus estados (resumen, gráfico de barras, mapa de calor de calendario y el historial, que gana su selector); pruebas | `modules/app-container/nutrition/water-tracking/` y sus pruebas | Pruebas, lint y build pasan; el detalle se ve con datos reales a 375 px y a ancho de escritorio, en tema claro y en tema oscuro, recorriendo los cuatro periodos en cada tarjeta; cambiar el periodo de una tarjeta no cambia las demás; los gráficos se repintan al cambiar de tema; inspección de los trozos del build y de la pestaña de red según la decisión 18: `/nutricion` no arrastra ECharts y el paquete inicial no crece más que el código propio |
| 9 | Verificación end-to-end y documentación | `openspec/changes/water-statistics/verification.md` (se crea en la fase 2 con la referencia previa y se completa aquí), `README.md`, `CLAUDE.md` | Los pasos de la decisión 19 documentados con su resultado, a 375 px y a escritorio y en ambos temas; cada escenario del delta comprobado en real o cubierto por una prueba, indicando cuál; objetivo en 2750, ración en 250 y zona en `Europe/Madrid` al terminar; `openspec validate --all --strict` pasa |
| 10 | Cierre | Specs principales, archivo del change, `CLAUDE.md` (estado del proyecto y cambios archivados) | Specs sincronizadas, change archivado, validación estricta en verde |

Notas:

- Las fases 2 y 4 son las únicas que cambian el esquema, cada una con su migración (decisiones 3 y 20). La 2 ya cambia un comportamiento visible (`goalMl` por día), aunque con los datos actuales la respuesta es idéntica.
- **Por qué la ración y las tomas tienen su propia fase de backend.** Sumadas a la fase 3 la dejarían con una migración, tres endpoints más y el doble de pruebas, demasiado para una sesión. Separadas, la fase 3 se cierra sin saber nada de raciones y la 4 añade campos a un `GET /today` que ya existe y está probado. La fase 4 depende de la 3 por eso.
- **Por qué la tarjeta con los vasos tiene su propia fase de cliente.** La antigua fase de «tarjeta compacta, ruta y esqueleto del detalle» ya era la mayor del plan; con los vasos, los ajustes, las tomas y el cambio de estado no cabe en una sesión. Se parte en dos, en un orden que no deja nunca la aplicación a medias. La fase 6 construye la ruta y el detalle con los ajustes y las tomas **sin tocar la tarjeta actual**: al cerrarla, el objetivo se puede cambiar en los dos sitios y Nutrición sigue igual que antes. La fase 7 sustituye la tarjeta, retira de ella el objetivo, que ya está en el detalle, y muda la lista del historial al detalle en la misma fase en que sale de Nutrición. En ningún momento hay una pantalla sin forma de cambiar el objetivo ni un historial que no se vea en ninguna parte.
- Las fases 5 y 2 a 4 no dependen entre sí y tocan árboles distintos. La 6 depende de la 3 y de la 4 (no usa ECharts ni `app-chart`), así que puede hacerse antes o después de la 5. La 7 depende de la 4 y de la 6. La 8 depende de la 5 y de la 6; no depende de la 7, pero se hace después para no tocar a la vez la misma carpeta. Las fases 5 a 8 dependen además de `ui-foundation`; si se retrasa, las fases 2, 3 y 4 pueden cerrarse mientras tanto.
- El servicio de estado del detalle nace completo en la fase 6 (ajustes, tomas, periodo por tarjeta, memoria por periodo e invalidación), aunque en esa fase solo existan la tarjeta «Ajustes» y «Tomas de hoy» y nadie pinte todavía las estadísticas que pide al crearse (`30d` y `3m`). La fase 7 le da su primer consumidor, la tarjeta «Historial», y la 8 añade la racha, las otras tres tarjetas y los selectores, ambas sin tocar el estado.
- Si alguna comprobación de la fase 5 falla, se resuelve con la autora antes de empezar la 8: puede cambiar el renderizador, la forma de leer los colores o de marcar los estados del calendario, o activarse el plan B del calendario, pero no la API.
- Las escrituras de prueba en la base real se concentran en la fase 9 y se aprueban antes. En las fases 6 y 7, guardar un ajuste o registrar una ración de verdad se hace solo si la autora lo aprueba; si no, queda para los pasos 8 a 13 de la decisión 19.

**Rollback.** Ninguna fase modifica ni borra entradas ni la tabla `water_goals`. Revertir el código de las fases 3 y 5 a 8 no deja rastro en la base. Revertir el código de la fase 2 sin deshacer la migración es seguro: el código anterior ignora la tabla nueva y sigue leyendo `water_goals`, que se ha mantenido al día; los cambios de objetivo hechos entretanto se conservan como objetivo actual y solo se pierde su historial si además se aplica el `Down`, que elimina la tabla. Revertir el código de la fase 4 sin deshacer su migración también es seguro: el código anterior no conoce la columna `water_serving_ml`, que tiene valor por defecto, así que ni la lee ni falla al insertar un usuario; su `Down` elimina la columna y con ella la ración configurada, sin tocar nada más. Retirar ECharts consiste en revertir la fase 8 en lo que toca a los gráficos y la fase 5, y desinstalar el paquete; la tarjeta de Nutrición, los ajustes, las tomas y la lista del historial (fases 6 y 7) no dependen de él.

## Open Questions

Ninguna cambia las specs, el enfoque ni el reparto de tareas. Cada una tiene un valor por defecto, que es lo que se hace si nadie decide otra cosa.

1. **¿Añadir un índice sobre `water_entries` (`user_id`, `date_created`)?** Por defecto: no; el volumen actual no lo justifica y el proposal limita las migraciones a crear una tabla, copiar el objetivo y añadir la columna de la ración.
2. **¿Añadir un índice único sobre `water_goals.user_id`?** Por defecto: no; se comprueba a mano antes de migrar.
3. **¿Retirar `water_goals` y derivar el objetivo actual del historial?** Por defecto: se mantiene; se puede hacer en un change posterior sin tocar la API.
4. **¿Recordar el periodo elegido en cada tarjeta entre visitas?** Por defecto: no; cada tarjeta vuelve a su periodo por defecto (decisión 15) cada vez que se entra en la pantalla de detalle. Depende del almacenamiento local, que pertenece a `sync`.
5. **¿Plegar o paginar la lista del historial en los periodos largos (hasta 366 filas en un año)?** Por defecto: no; se muestra entera. Su tarjeta abre en 30 días, de modo que una lista larga solo aparece si el usuario elige un periodo largo; pero ya no es el último bloque de la pantalla: debajo queda «Tomas de hoy», que una lista de un año aleja.
6. **¿Imponer con una regla de ESLint que `echarts` solo se importe en la carpeta compartida?** Por defecto: no; la regla queda escrita en `CLAUDE.md`.
7. **¿Redirigir una subruta desconocida bajo `/nutricion` a `/nutricion` en lugar de a `/salud`?** Por defecto: no; se aplica la regla global ya existente, sin reglas propias de la sección.
8. **¿Pasar los dos ajustes a filas de lista cuando `update-profile` construya `app-list-row`?** Por defecto: no en este change; se presentan como dos campos en una tarjeta (decisión 15). Cambiarlo después solo toca `water-settings`.
9. **¿Completar siempre la última fila de vasos hasta ocho, como en la referencia visual?** Por defecto: no; con objetivo se pintan los vasos necesarios para llegar al del objetivo y uno más allá del último lleno (once con 2750 ml y 250 ml: ocho y tres). Solo sin objetivo se pinta una fila completa de ocho (decisión 23).
10. **¿Cambiar los periodos por defecto de las tarjetas?** Por defecto: resumen, gráfico e historial en 30 días y calendario en 3 meses (decisión 15). Cambiarlos solo toca una constante por tarjeta y el número de peticiones al entrar.
11. **¿Otros límites para la ración, o un tope de vasos distinto de 24?** Por defecto: de 50 a 2000 ml (decisión 20) y, con más de 24 vasos, el progreso por raciones en texto (decisión 23). Los límites son tres constantes del dominio; el tope de vasos, una del cliente. Ambos figuran en el delta de la spec, así que cambiarlos antes de archivar exige tocar también sus escenarios.
12. **¿Añadir `app-chart` al catálogo de componentes de `ui-foundation` (`/catalogo`)?** Por defecto: no; la fase 5 comprueba el gráfico con un montaje desechable y, desde la fase 8, la pantalla de detalle lo muestra con datos reales. Añadirlo al catálogo daría una vista fija en ambos temas a costa de que el catálogo importe el gráfico.
13. **¿Animar el vaso al tocar, sin esperar la respuesta del servidor?** Por defecto: no; se anima cuando llega el dato confirmado (decisión 23). Si en un teléfono el retardo resulta molesto, pasar a un llenado optimista con vuelta atrás al fallar es un cambio local de `water-glasses` y del estado de la tarjeta.
