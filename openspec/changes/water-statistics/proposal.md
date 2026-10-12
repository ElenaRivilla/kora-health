# Proposal

## Why

La spec de `water-tracking` exige mostrar «estadísticas resumidas» junto al historial, pero no dice cuáles, y ni la API ni el cliente las ofrecen: hoy solo existen totales diarios. Es la carencia que las verificaciones de `migrate-client-to-angular` y `user-local-day` dejaron registrada como no cubierta. Además, el historial compara todos los días con el objetivo actual, de modo que cambiar el objetivo altera retroactivamente si un día pasado se cumplió; eso invalida cualquier estadística de días cumplidos o rachas. Con el día local ya resuelto en `user-local-day`, se puede concretar y construir.

Al revisar el plan, la autora ha añadido además cómo quiere registrar y ver el agua del día: por **raciones** (vasos) de un tamaño que ella elige, con la lista de las tomas del día a la vista. Registrar agua es el gesto que más se repite en esta capability y hoy obliga a elegir entre tres cantidades fijas; con una ración configurable se reduce a un toque, y el progreso se lee de un vistazo.

## What Changes

- Se **concretan las estadísticas resumidas** de hidratación, calculadas en el servidor para un periodo: media diaria, días con objetivo cumplido (número y porcentaje), racha actual y mejor día.
- El periodo es **seleccionable**: últimos 7 días, últimos 30 días, últimos 3 meses y último año, contados en días locales del usuario. Se elige **por separado en cada bloque** de la vista de estadísticas (resumen, gráfico, calendario e historial): no hay un periodo único para toda la pantalla, y cambiar el de un bloque no altera los demás. La racha actual no depende de ningún periodo.
- **Cada día conserva su objetivo**: se guarda el historial de cambios del objetivo y cada día se evalúa con el objetivo vigente ese día. Un objetivo nuevo rige desde el día local en curso; los días anteriores no cambian.
- Los días registrados antes de este cambio, para los que no existe historial de objetivos, se evalúan con el objetivo vigente en el momento de la migración.
- El **tamaño de la ración** pasa a ser un ajuste del usuario, guardado en el servidor: 250 ml por defecto, entero entre 50 y 2000 ml. Cambiarlo no toca ninguna entrada ni ninguna estadística: las entradas guardan mililitros.
- El cliente reparte la hidratación en dos pantallas, pensadas primero para móvil. La página de Nutrición lleva una **tarjeta compacta**: el total de hoy en grande sobre el objetivo vigente («750 / 2750 ml»), una **fila de vasos**, un acceso secundario «Otra cantidad» con los botones actuales de +100, +250 y +500 ml, y un enlace «Ver estadísticas». **La tarjeta ya no contiene el cambio de objetivo.** La página de Nutrición no lleva gráficos ni listas: alojará después el diario de comidas y debe seguir siendo corta en móvil.
- **Vasos.** Cada vaso es una ración. Los ya bebidos aparecen llenos; el siguiente lleva un «+» y, al tocarlo, registra una ración con una animación de llenado; una marca señala el vaso en el que se alcanza el objetivo. Como máximo ocho vasos por fila; si el objetivo necesita más (2750 ml en raciones de 250 ml son once), siguen en otra fila. Siempre hay un vaso siguiente, de modo que se puede seguir registrando por encima del objetivo. Si el total no es múltiplo de la ración (por una «otra cantidad»), el vaso en curso se ve parcialmente lleno. Los vasos y su animación se dibujan con medios propios (SVG y CSS). La animación respeta la preferencia de movimiento reducido, y los vasos no son la única forma de conocer el progreso: el número y un texto alternativo lo dicen.
- Una **pantalla de detalle de hidratación**, con ruta propia dentro de Nutrición y forma de volver, lleva, de arriba abajo: un bloque de **ajustes** con «Objetivo diario» y «Tamaño de la ración», que se editan ahí; la racha actual; cuatro tarjetas, cada una con su propio selector de periodo en la cabecera: el resumen de estadísticas, un **gráfico de barras** con la referencia del objetivo (una barra por día en los periodos de 7 y 30 días; una barra por semana, con la media diaria de esa semana, en los de 3 meses y un año), un **mapa de calor de calendario** (estilo GitHub) que distingue los días con objetivo cumplido, y la lista del historial por días; y, al final, el bloque **«Tomas de hoy»**, con la cantidad y la hora local de cada toma del día.
- El servidor ofrece el **progreso del día actual** (total de hoy, objetivo vigente, si está cumplido, el tamaño de la ración y el reparto del total en raciones), para que la tarjeta se pinte con una sola petición y no tenga que pedir las estadísticas, decidir qué día es hoy ni hacer cuentas; y la **lista de tomas del día actual**, que hoy la API no expone.
- Se incorpora una **librería de gráficos** al cliente (ECharts), limitada a los gráficos y cargada solo al entrar en la pantalla de detalle de hidratación, no al entrar en Nutrición. Es una excepción acotada a la regla actual de no usar librerías de interfaz.
- El cliente de este change **no define colores ni componentes base propios**: usa los temas claro y oscuro, las variables de color y de movimiento y los componentes base (tarjeta, botón, campo, selector compacto y mensaje de estado) que aportó el change `ui-foundation`, ya implementado y archivado en esta rama (`2026-10-12-ui-foundation`), y sus vistas cumplen los requisitos de la capability `app-shell` que ese change creó (zonas táctiles, foco visible, nombres accesibles, nada solo por el color, uso en móvil y movimiento reducido). Los gráficos toman sus colores del tema en ejecución y se repintan cuando cambia el tema o el color de acento. Lo que `ui-foundation` deja aplazado (fila de lista, interruptor, control segmentado) no se construye aquí: los dos ajustes se presentan con sus campos de formulario dentro de una tarjeta.

### Reglas que fija este change

- **Media diaria**: total del periodo dividido entre los días del periodo transcurridos desde el primer registro del usuario; los días sin entradas cuentan como cero.
- **Día cumplido**: el total del día alcanza o supera el objetivo vigente ese día. Un día sin objetivo vigente no cuenta ni como cumplido ni como incumplido. El porcentaje se calcula sobre los días con objetivo vigente desde el primer registro del usuario; el día en curso cuenta siempre, como no cumplido mientras no alcance su objetivo.
- **Racha actual**: días consecutivos cumplidos hasta hoy; si el día en curso todavía no se ha cumplido, no rompe la racha y se cuenta hasta ayer.
- **Mejor día**: el día de mayor ingesta del periodo y su total.
- **Ración**: un entero de 50 a 2000 ml por usuario, 250 ml mientras no se configure. Se valida con independencia del objetivo (puede ser mayor que él). No tiene historial: cambiarla solo cambia cuánto registra un toque y cuántos vasos se pintan.
- **Vasos**: raciones completas, el cociente entero del total de hoy entre la ración; ración en curso, el resto; vaso del objetivo, el objetivo entre la ración, redondeado hacia arriba. Lo calcula el servidor. Se pintan los vasos necesarios para llegar al del objetivo y siempre uno más allá del último lleno; con más de 24 vasos (tres filas), el progreso por raciones se da con texto.
- **Tomas de hoy**: las entradas del día local actual, de la más reciente a la más antigua, con la hora local que calcula el servidor.

### Fuera de alcance

- Borrar o corregir entradas de agua: la lista de tomas es de solo consulta.
- Consultar las tomas de un día que no sea el actual, y registrar una cantidad libre escrita por el usuario.
- Un historial de cambios del tamaño de la ración.
- Los componentes que `ui-foundation` aplaza (fila de lista, interruptor, control segmentado).
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
  - «Registro Rápido de Agua»: registrar una ración, del tamaño configurado, con una sola interacción; las otras cantidades (100, 250 y 500 ml) quedan como acceso secundario; se puede seguir registrando por encima del objetivo.
  - «Progreso de Hidratación del Día Actual» (requisito nuevo): la vista de nutrición muestra de forma destacada el total de hoy frente al objetivo vigente, junto al registro de agua, y da acceso a la vista de estadísticas; ya no incluye el cambio de objetivo. Sin objetivo, lo indica y lleva a configurarlo.
  - «Tamaño de la Ración Configurable» (requisito nuevo): valor por defecto, límites, y que cambiarlo no altera lo registrado.
  - «Progreso del Día por Raciones» (requisito nuevo): raciones llenas, la siguiente, la parcial, la del objetivo y las que quedan por encima; alternativa textual, estado que no depende solo del color y animación que respeta el movimiento reducido.
  - «Tomas del Día Actual» (requisito nuevo): lista de las tomas de hoy con cantidad y hora local, orden y estado vacío; solo consulta.
  - «Configuración de la Hidratación en la Vista de Estadísticas» (requisito nuevo): objetivo y ración se ven y se cambian desde la vista de estadísticas, que se actualiza al cambiar el objetivo.

## Impact

- **Backend**: tabla nueva para el historial de objetivos, con migración de EF Core que siembra el objetivo actual como vigente para los días ya registrados; el servicio de agua resuelve el objetivo de cada día; endpoint nuevo de estadísticas con periodo y endpoint nuevo, ligero, del día actual; el historial deja de devolver el objetivo actual en todos los días. El tamaño de la ración se guarda como un campo del usuario (precedente: la zona horaria), con su validación, y el reparto del total del día en raciones es una pieza pura del dominio; un endpoint nuevo lista las tomas del día actual con su hora local, que calcula `UserCalendar`. Reutiliza `UserCalendar` e `ILocalDayService`.
- **API**: bajo `/api/water-tracking`, cuatro operaciones nuevas de lectura (estadísticas de un periodo, día actual, tamaño de la ración y tomas del día actual) y una de escritura (`PUT` del tamaño de la ración); `GET /history` mantiene su forma, pero `goalMl` pasa a ser el objetivo de cada día. El parámetro de periodo y el tamaño de la ración se validan. La política de CORS no cambia: `PUT` ya está admitido.
- **Cliente**: una ruta hija nueva bajo Nutrición para la pantalla de detalle (la primera ruta hija de la aplicación), con un ajuste en `HomeComponent` para que la cabecera muestre su título; la página de Nutrición pasa de dos tarjetas a una tarjeta compacta con los vasos; el cambio de objetivo se muda al detalle, que deja de ser de solo lectura; componentes nuevos (vasos, ajustes, tomas, tarjetas con periodo, gráficos) y reubicados en `nutrition/water-tracking/`, un segundo servicio de estado para el detalle (con los ajustes, el periodo de cada tarjeta y una memoria de respuestas por periodo, que se invalida al cambiar el objetivo), DTOs y operaciones nuevas en `WaterTrackingService` (que deja de usar `GET /history`), un componente de gráfico compartido, que se añade también al catálogo de desarrollo, y la dependencia `echarts`. No se crea ningún selector de periodo propio: se usa el selector compacto de `ui-foundation`. Se apoya en `ui-foundation`, ya en la rama, para los colores, los temas, el movimiento y los componentes base.
- **Base de datos**: dos migraciones, cada una en su fase. La primera crea la tabla del historial de objetivos y copia el objetivo existente. La segunda añade a `users` la columna del tamaño de la ración, con 250 como valor por defecto. Ninguna modifica las entradas ni la tabla del objetivo.
- **Pruebas**: nuevas pruebas de backend para el objetivo por día y para cada estadística, con los casos límite (periodo sin datos, sin objetivo, racha y porcentaje con el día en curso incompleto, cambio de objetivo a mitad de periodo, semanas parciales); para el día actual; para la ración (valor por defecto, límites) y el reparto en raciones (completas, resto, vaso del objetivo, sin objetivo); y para las tomas del día (día local, hora local, orden, día vacío); en el cliente, pruebas de los componentes nuevos (incluida la independencia del periodo entre tarjetas, los vasos y los ajustes) y de las rutas, y adaptación de las pruebas existentes de rutas, cabecera, página de Nutrición, estado y servicio.
- **Documentación**: `README.md` y `CLAUDE.md` (la excepción de la librería de gráficos y las convenciones para usarla, la ruta hija, el reparto entre la tarjeta y el detalle, la ración y las tomas).
