# Proposal

## Why

La spec de `water-tracking` exige mostrar «estadísticas resumidas» junto al historial, pero no dice cuáles, y ni la API ni el cliente las ofrecen: hoy solo existen totales diarios. Es la carencia que las verificaciones de `migrate-client-to-angular` y `user-local-day` dejaron registrada como no cubierta. Además, el historial compara todos los días con el objetivo actual, de modo que cambiar el objetivo altera retroactivamente si un día pasado se cumplió; eso invalida cualquier estadística de días cumplidos o rachas. Con el día local ya resuelto en `user-local-day`, se puede concretar y construir.

## What Changes

- Se **concretan las estadísticas resumidas** de hidratación, calculadas en el servidor para un periodo: media diaria, días con objetivo cumplido (número y porcentaje), racha actual y mejor día.
- El periodo es **seleccionable**: últimos 7 días, últimos 30 días, últimos 3 meses y último año, contados en días locales del usuario. Se elige **por separado en cada bloque** de la vista de estadísticas (resumen, gráfico, calendario e historial): no hay un periodo único para toda la pantalla, y cambiar el de un bloque no altera los demás. La racha actual no depende de ningún periodo.
- **Cada día conserva su objetivo**: se guarda el historial de cambios del objetivo y cada día se evalúa con el objetivo vigente ese día. Un objetivo nuevo rige desde el día local en curso; los días anteriores no cambian.
- Los días registrados antes de este cambio, para los que no existe historial de objetivos, se evalúan con el objetivo vigente en el momento de la migración.
- El cliente reparte la hidratación en dos pantallas, pensadas primero para móvil. La página de Nutrición lleva una **tarjeta compacta**: el progreso de hoy (total del día local actual frente al objetivo vigente), los botones de registro rápido, el objetivo (verlo y cambiarlo) y un enlace «Ver estadísticas». Una **pantalla de detalle de hidratación**, con ruta propia dentro de Nutrición y forma de volver, lleva la racha actual y cuatro tarjetas, cada una con su propio selector de periodo en la cabecera: el resumen de estadísticas, un **gráfico de barras** con la referencia del objetivo (una barra por día en los periodos de 7 y 30 días; una barra por semana, con la media diaria de esa semana, en los de 3 meses y un año), un **mapa de calor de calendario** (estilo GitHub) que distingue los días con objetivo cumplido, y la lista del historial. La página de Nutrición no lleva gráficos ni la lista: alojará después el diario de comidas y debe seguir siendo corta en móvil.
- El servidor ofrece el **progreso del día actual** (total de hoy, objetivo vigente y si está cumplido), para que la tarjeta no tenga que pedir las estadísticas ni decidir qué día es hoy.
- Se incorpora una **librería de gráficos** al cliente (ECharts), limitada a los gráficos y cargada solo al entrar en la pantalla de detalle de hidratación, no al entrar en Nutrición. Es una excepción acotada a la regla actual de no usar librerías de interfaz.
- El cliente de este change **no define colores ni componentes base propios**: usa los temas claro y oscuro, la variable de color de acento y los componentes base que aporta el change `ui-foundation`, que debe estar fusionado antes de empezar el trabajo de cliente. Los gráficos toman sus colores del tema en ejecución y se repintan cuando cambia el tema o el color de acento.

### Reglas que fija este change

- **Media diaria**: total del periodo dividido entre los días del periodo transcurridos desde el primer registro del usuario; los días sin entradas cuentan como cero.
- **Día cumplido**: el total del día alcanza o supera el objetivo vigente ese día. Un día sin objetivo vigente no cuenta ni como cumplido ni como incumplido. El porcentaje se calcula sobre los días con objetivo vigente desde el primer registro del usuario; el día en curso cuenta siempre, como no cumplido mientras no alcance su objetivo.
- **Racha actual**: días consecutivos cumplidos hasta hoy; si el día en curso todavía no se ha cumplido, no rompe la racha y se cuenta hasta ayer.
- **Mejor día**: el día de mayor ingesta del periodo y su total.

### Fuera de alcance

- Borrar o corregir entradas de agua.
- Editar la zona horaria desde la interfaz (`update-profile`).
- Estadísticas de otros módulos y la capability `progress`. En particular, un resumen de hidratación en la sección Progreso: reutilizaría la misma API y el mismo componente de gráfico compartido, pero pertenece al change de `progress`.
- Notificaciones, recordatorios o metas semanales.
- Exportar datos.
- El sistema de temas (claro y oscuro), las variables de color, la tipografía, los iconos, la navegación y los componentes base, que pertenecen a `ui-foundation`; y el selector del color de acento en ajustes.

## Capabilities

### New Capabilities

(ninguna)

### Modified Capabilities

- `water-tracking`:
  - «Objetivo Diario de Agua»: el objetivo rige desde el día local en que se establece y los días anteriores conservan el objetivo que tenían.
  - «Historial y Estadísticas de Agua»: cada día del historial se acompaña del objetivo vigente ese día; se concretan las estadísticas resumidas, sus reglas de cálculo y el periodo, seleccionable por separado en cada bloque de la vista de estadísticas; el historial se presenta también como gráfico de barras (diario o por semanas, según el periodo) y como calendario de días cumplidos.
  - «Progreso de Hidratación del Día Actual» (requisito nuevo): la vista de nutrición muestra el progreso de hoy frente al objetivo vigente, junto al registro rápido y al objetivo, y da acceso a la vista de estadísticas, que reúne las estadísticas, la representación gráfica y el historial, cada bloque con su propio periodo.

## Impact

- **Backend**: tabla nueva para el historial de objetivos, con migración de EF Core que siembra el objetivo actual como vigente para los días ya registrados; el servicio de agua resuelve el objetivo de cada día; endpoint nuevo de estadísticas con periodo y endpoint nuevo, ligero, del día actual; el historial deja de devolver el objetivo actual en todos los días. Reutiliza `UserCalendar` e `ILocalDayService`.
- **API**: dos endpoints nuevos de lectura bajo `/api/water-tracking` (estadísticas de un periodo y día actual); `GET /history` mantiene su forma, pero `goalMl` pasa a ser el objetivo de cada día. El parámetro de periodo se valida.
- **Cliente**: una ruta hija nueva bajo Nutrición para la pantalla de detalle (la primera ruta hija de la aplicación), con un ajuste en `HomeComponent` para que la cabecera muestre su título; la página de Nutrición pasa de dos tarjetas a una tarjeta compacta; componentes nuevos y reubicados en `nutrition/water-tracking/`, un segundo servicio de estado para el detalle (con el periodo de cada tarjeta y una memoria de respuestas por periodo, para no repetir peticiones), DTOs y operaciones nuevas en `WaterTrackingService` (que deja de usar `GET /history`), un componente de gráfico compartido, un selector de periodo compartido y la dependencia `echarts`. Depende de `ui-foundation` para los colores, los temas y los componentes base.
- **Base de datos**: una migración que crea una tabla y copia el objetivo existente; no modifica las entradas.
- **Pruebas**: nuevas pruebas de backend para el objetivo por día y para cada estadística, con los casos límite (periodo sin datos, sin objetivo, racha y porcentaje con el día en curso incompleto, cambio de objetivo a mitad de periodo, semanas parciales); y para el día actual; en el cliente, pruebas de los componentes nuevos (incluida la independencia del periodo entre tarjetas) y de las rutas, y adaptación de las pruebas existentes de rutas, cabecera, página de Nutrición, estado y servicio.
- **Documentación**: `README.md` y `CLAUDE.md` (la excepción de la librería de gráficos y las convenciones para usarla, la ruta hija y el reparto entre la tarjeta y el detalle).
