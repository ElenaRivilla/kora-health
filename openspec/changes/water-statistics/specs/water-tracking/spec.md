## MODIFIED Requirements

### Requirement: Objetivo Diario de Agua
El sistema SHALL permitir al usuario configurar un objetivo diario de ingesta de agua. Un objetivo SHALL regir desde el día local del usuario en que se establece, incluido ese día, hasta que se establezca otro. El sistema SHALL conservar para cada día anterior el objetivo que estaba vigente ese día, y SHALL NOT alterar el objetivo de los días pasados cuando el usuario cambia su objetivo. Si el usuario establece varios objetivos el mismo día local, SHALL regir el último. El día desde el que rige un objetivo SHALL ser una fecha de calendario que se conserva tal cual cuando el usuario cambia de zona horaria, a diferencia de las entradas, que se reagrupan. Los días anteriores a la existencia del registro de cambios de objetivo SHALL evaluarse con el objetivo que el usuario tenía cuando ese registro empezó a existir.

#### Escenario: Objetivo configurado
- **CUANDO** el usuario establece un objetivo diario de agua
- **ENTONCES** el sistema almacena el objetivo y lo usa para seguir el progreso de ese mismo día local y de los días siguientes

#### Escenario: Cambio de objetivo que no altera los días pasados
- **CUANDO** un usuario con un objetivo de 2000 ml, que el 9 de octubre registró 2200 ml, cambia su objetivo a 3000 ml el 10 de octubre
- **ENTONCES** el 9 de octubre sigue evaluándose con el objetivo de 2000 ml y continúa siendo un día cumplido, y el objetivo de 3000 ml se aplica al 10 de octubre y a los días siguientes

#### Escenario: Varios cambios de objetivo el mismo día
- **CUANDO** el usuario establece un objetivo de 2500 ml y, más tarde ese mismo día local, lo cambia a 1800 ml
- **ENTONCES** el objetivo vigente de ese día es 1800 ml, el último establecido, y el día anterior conserva el objetivo que ya tenía

#### Escenario: Días anteriores al registro de cambios de objetivo
- **CUANDO** se consulta un día registrado antes de que el sistema conservara los cambios de objetivo, por un usuario que en ese momento tenía un objetivo de 2000 ml
- **ENTONCES** el sistema evalúa ese día con el objetivo de 2000 ml

#### Escenario: Objetivo anclado a su fecha al cambiar de zona horaria
- **CUANDO** un usuario que estableció un objetivo de 3000 ml el 10 de octubre cambia después su zona horaria
- **ENTONCES** el objetivo de 3000 ml sigue rigiendo desde el 10 de octubre, y cada entrada, reagrupada según la nueva zona horaria, se evalúa con el objetivo vigente en el día local en el que queda

### Requirement: Registro Rápido de Agua
El sistema SHALL permitir al usuario registrar una entrada de ingesta de agua con un número mínimo de interacciones. El sistema SHALL sumar cada entrada al total del día al que pertenece el instante en que se registró, entendiendo «el día» como el día natural en la zona horaria del usuario definido en `profile`; el día actual es, por tanto, el día local del usuario en el momento de la consulta. El sistema SHALL permitir registrar una ración, es decir, una entrada cuya cantidad es el tamaño de la ración que el usuario tiene configurado, con una sola interacción. El sistema SHALL ofrecer además, como acceso secundario, el registro de otras cantidades: 100, 250 y 500 ml. El usuario SHALL poder seguir registrando agua cuando el objetivo del día ya está alcanzado.

#### Escenario: Entrada rápida registrada
- **CUANDO** el usuario registra una entrada de ingesta de agua
- **ENTONCES** el sistema suma la cantidad al total del día actual, en la zona horaria del usuario, de inmediato

#### Escenario: Entrada registrada de madrugada
- **CUANDO** un usuario con zona horaria `Europe/Madrid` registra una entrada poco después de su medianoche local, en un instante en el que en UTC todavía es el día anterior
- **ENTONCES** el sistema suma la cantidad al total del nuevo día local y el total del día anterior no cambia

#### Escenario: Ración registrada con una sola interacción
- **CUANDO** un usuario con un tamaño de ración de 250 ml, que hoy lleva 500 ml, registra una ración
- **ENTONCES** el sistema registra una entrada de 250 ml con esa única interacción y el total del día actual pasa a 750 ml

#### Escenario: Ración registrada con el tamaño configurado
- **CUANDO** un usuario que ha configurado un tamaño de ración de 330 ml, y que hoy lleva 330 ml, registra una ración
- **ENTONCES** el sistema registra una entrada de 330 ml y el total del día actual pasa a 660 ml

#### Escenario: Otra cantidad registrada
- **CUANDO** un usuario con un tamaño de ración de 250 ml, que hoy lleva 500 ml, abre el registro de otras cantidades y elige 100 ml
- **ENTONCES** el sistema registra una entrada de 100 ml y el total del día actual pasa a 600 ml

#### Escenario: Registro por encima del objetivo
- **CUANDO** un usuario con un objetivo vigente de 2000 ml y un tamaño de ración de 250 ml, que hoy lleva 2000 ml, registra una ración
- **ENTONCES** el sistema registra la entrada y el total del día actual pasa a 2250 ml

### Requirement: Historial y Estadísticas de Agua
El sistema SHALL mantener un historial de la ingesta diaria de agua y SHALL proporcionar estadísticas derivadas de ese historial. Cada total diario del historial SHALL corresponder a un día natural en la zona horaria del usuario definida en `profile`, y el periodo de días que abarca el historial SHALL contarse en esos mismos días locales. El sistema SHALL agrupar las entradas según la zona horaria vigente del usuario en el momento de la consulta, sin alterar los instantes en que se registraron. Cada día del historial SHALL ir acompañado del objetivo vigente ese día, y SHALL NOT compararse con el objetivo actual del usuario cuando este sea distinto del que regía ese día.

#### Escenario: Consultar el historial de agua
- **CUANDO** el usuario abre la vista de estadísticas de hidratación
- **ENTONCES** el sistema muestra el historial, con el total de cada día junto al objetivo vigente ese día, y las estadísticas resumidas de hidratación: media diaria, días con objetivo cumplido (número y porcentaje), racha actual y mejor día; el historial y las estadísticas corresponden cada uno al periodo seleccionado en su bloque

#### Escenario: Cada día del historial lleva su propio objetivo
- **CUANDO** el usuario consulta un historial que incluye el 9 de octubre, día en que regía un objetivo de 2000 ml, y el 10 de octubre, día desde el que rige un objetivo de 3000 ml
- **ENTONCES** el sistema acompaña el 9 de octubre con el objetivo de 2000 ml y el 10 de octubre con el de 3000 ml

#### Escenario: Cada entrada se agrupa en su día local
- **CUANDO** el usuario consulta el historial y existen entradas registradas poco antes y poco después de una medianoche local
- **ENTONCES** el sistema incluye cada entrada en el total del día local en el que se registró, de modo que las anteriores a la medianoche cuentan en un día y las posteriores en el siguiente

#### Escenario: Historial reagrupado al cambiar de zona horaria
- **CUANDO** el usuario cambia su zona horaria y vuelve a consultar el historial
- **ENTONCES** el sistema agrupa todas las entradas, incluidas las anteriores al cambio, según los días de la nueva zona horaria, sin modificar los instantes en que se registraron

## ADDED Requirements

### Requirement: Estadísticas Resumidas de Hidratación
El sistema SHALL proporcionar, para un periodo de días locales del usuario, la media diaria de ingesta, los días con objetivo cumplido (número y porcentaje), la racha actual y el mejor día. El servidor SHALL calcular estas estadísticas, y el cliente SHALL NOT calcularlas ni decidir qué días abarca el periodo. Un día SHALL contar como cumplido cuando tiene objetivo vigente y su total alcanza o supera ese objetivo.

Los días que cuentan para la media diaria y para el porcentaje SHALL ser los del periodo transcurridos desde el primer registro del usuario hasta el día en curso, ambos incluidos. La media diaria SHALL ser la suma de los totales de esos días dividida entre su número, contando como cero los días sin entradas e incluyendo el día en curso. El porcentaje de días cumplidos SHALL calcularse sobre los días que cuentan y tienen objetivo vigente; el día en curso SHALL contar siempre entre ellos si tiene objetivo vigente, como no cumplido mientras su total no alcance el objetivo. La media diaria y el porcentaje SHALL expresarse como números enteros, redondeando la mitad hacia arriba.

La racha actual SHALL ser el número de días consecutivos cumplidos contados hacia atrás desde el día en curso, o desde el día anterior si el día en curso todavía no está cumplido. La racha actual SHALL NOT depender de ningún periodo seleccionado, y SHALL terminar en el primer día no cumplido o sin objetivo vigente. El mejor día SHALL ser el día del periodo con mayor total; si varios días empatan, SHALL ser el más reciente.

#### Escenario: Estadísticas calculadas por el servidor
- **CUANDO** el cliente solicita las estadísticas indicando únicamente el periodo, sin enviar fechas ni límites de día
- **ENTONCES** el servidor determina los días locales que abarca el periodo y devuelve la media diaria, el número y el porcentaje de días cumplidos, la racha actual y el mejor día

#### Escenario: Media diaria con días sin entradas
- **CUANDO** un usuario cuyo primer registro es anterior al periodo consulta los últimos 7 días y los totales de esos días son 2000, 0, 1500, 0, 2500, 1000 y 0 ml
- **ENTONCES** la media diaria es 1000 ml, porque los días sin entradas cuentan como cero y los 7000 ml se reparten entre los 7 días

#### Escenario: Media diaria solo desde el primer registro
- **CUANDO** un usuario cuyo primer registro es del 9 de octubre consulta los últimos 7 días el 12 de octubre, con totales de 2000, 0, 1000 y 1000 ml los días 9, 10, 11 y 12
- **ENTONCES** la media diaria es 1000 ml, resultado de repartir los 4000 ml entre los 4 días transcurridos desde el primer registro, incluido el día en curso, y no entre los 7 del periodo

#### Escenario: Media diaria redondeada
- **CUANDO** un usuario cuyo primer registro es del 11 de octubre consulta las estadísticas el 12 de octubre, con totales de 1000 ml el día 11 y 1001 ml el día 12
- **ENTONCES** la media diaria es 1001 ml, resultado de redondear hacia arriba los 1000,5 ml que salen de repartir 2001 ml entre 2 días

#### Escenario: Día cumplido al alcanzar o superar el objetivo
- **CUANDO** el periodo incluye, con un objetivo vigente de 2000 ml, un día de 2000 ml, otro de 2500 ml y otro de 1999 ml
- **ENTONCES** los días de 2000 y 2500 ml cuentan como cumplidos y el de 1999 ml no

#### Escenario: Día evaluado con el objetivo vigente ese día
- **CUANDO** el periodo incluye el 8 de octubre con 2200 ml y un objetivo vigente de 2000 ml, y el 10 de octubre con 2200 ml y un objetivo vigente de 3000 ml
- **ENTONCES** el 8 de octubre cuenta como cumplido y el 10 de octubre no

#### Escenario: Día sin objetivo vigente
- **CUANDO** el periodo incluye dos días con 3000 ml cada uno, anteriores al primer objetivo que estableció el usuario, y cinco días posteriores con objetivo, de los que tres lo alcanzan
- **ENTONCES** el número de días cumplidos es 3 y el porcentaje es del 60 %, calculado sobre los cinco días con objetivo; los dos días sin objetivo vigente no figuran ni como cumplidos ni como incumplidos

#### Escenario: Porcentaje de días cumplidos
- **CUANDO** un usuario cuyo primer registro es anterior al periodo consulta los últimos 30 días, todos con objetivo vigente, y 15 de ellos alcanzan su objetivo
- **ENTONCES** el sistema indica 15 días cumplidos y un 50 % de días cumplidos

#### Escenario: Día en curso todavía no cumplido cuenta en el porcentaje
- **CUANDO** un usuario cuyo primer registro es anterior al periodo consulta los últimos 7 días, todos con un objetivo vigente de 2000 ml, de los seis días anteriores al día en curso tres alcanzaron el objetivo, y el día en curso lleva 500 ml
- **ENTONCES** el sistema indica 3 días cumplidos y un 43 % de días cumplidos, porque el día en curso cuenta como no cumplido y los 3 días cumplidos se reparten entre 7 días y no entre 6

#### Escenario: Día en curso que pasa a estar cumplido
- **CUANDO** en la situación anterior el usuario alcanza los 2000 ml en el día en curso
- **ENTONCES** el sistema indica 4 días cumplidos y un 57 % de días cumplidos, calculado sobre los mismos 7 días

#### Escenario: Porcentaje sin días con objetivo
- **CUANDO** un usuario que nunca ha establecido un objetivo consulta un periodo en el que tiene registros
- **ENTONCES** el sistema indica 0 días cumplidos y no indica ningún porcentaje, en lugar de un 0 %

#### Escenario: Racha que no se rompe por el día en curso
- **CUANDO** el usuario no cumplió su objetivo el 8 de octubre, lo cumplió los días 9, 10 y 11, y el 12 de octubre, día en curso, lleva 500 ml de un objetivo de 2000 ml
- **ENTONCES** la racha actual es de 3 días, aunque ese mismo día en curso cuenta como no cumplido en el porcentaje

#### Escenario: Racha que incluye el día en curso
- **CUANDO** en la situación anterior el usuario alcanza los 2000 ml el 12 de octubre
- **ENTONCES** la racha actual pasa a ser de 4 días

#### Escenario: Racha a cero
- **CUANDO** el usuario cumplió su objetivo los días 9 y 10 de octubre, el 11 registró 1000 ml de un objetivo de 2000 ml, y el 12 de octubre, día en curso, lleva 500 ml
- **ENTONCES** la racha actual es de 0 días

#### Escenario: Racha más larga que el periodo
- **CUANDO** un usuario que ha cumplido su objetivo cada uno de los últimos 10 días, incluido el día en curso, y no lo cumplió el día anterior a esos diez, consulta los últimos 7 días
- **ENTONCES** la racha actual es de 10 días, la misma que vería con cualquier otro periodo

#### Escenario: Racha interrumpida por un día sin objetivo vigente
- **CUANDO** el usuario registró 3000 ml los días 8 y 9 de octubre, cuando aún no tenía objetivo, estableció un objetivo de 2000 ml el 10 de octubre y lo ha cumplido los días 10, 11 y 12, siendo el 12 el día en curso
- **ENTONCES** la racha actual es de 3 días, porque el 9 de octubre, sin objetivo vigente, la termina y no se cuenta

#### Escenario: Mejor día del periodo
- **CUANDO** los totales del periodo son 1500 ml el 8 de octubre, 3200 ml el 10 de octubre y 2100 ml el 11 de octubre, y el resto de días no tiene entradas
- **ENTONCES** el mejor día es el 10 de octubre con 3200 ml

#### Escenario: Empate en el mejor día
- **CUANDO** los dos mayores totales del periodo son iguales, 2500 ml el 8 de octubre y 2500 ml el 11 de octubre
- **ENTONCES** el mejor día es el 11 de octubre, el más reciente de los dos

#### Escenario: Periodo sin registros
- **CUANDO** un usuario con registros anteriores consulta un periodo en el que no hay ninguna entrada
- **ENTONCES** el sistema responde sin error con una media diaria de 0 ml, 0 días cumplidos, una racha actual de 0 días y ningún mejor día

#### Escenario: Usuario sin ningún registro
- **CUANDO** un usuario que nunca ha registrado agua consulta las estadísticas de cualquier periodo
- **ENTONCES** el sistema responde sin error con 0 días cumplidos, una racha actual de 0 días, ningún mejor día, y sin media diaria ni porcentaje

### Requirement: Progreso de Hidratación del Día Actual
El sistema SHALL mostrar al usuario, en la vista de nutrición, su progreso de hidratación del día actual: el total registrado ese día frente al objetivo vigente ese día, de forma destacada. El día actual SHALL ser el día local del usuario y el servidor SHALL determinarlo, junto con su total, su objetivo vigente y si está cumplido; el cliente SHALL NOT decidir qué día es hoy. El total y el objetivo SHALL estar disponibles como texto, y la forma de presentar el progreso SHALL NOT depender únicamente de un elemento visual. Si el usuario no tiene objetivo vigente, el sistema SHALL mostrar el total del día, indicar que no hay objetivo configurado y ofrecer un acceso a la vista de estadísticas de hidratación para configurarlo.

Desde la vista de nutrición el usuario SHALL poder registrar agua y abrir la vista de estadísticas de hidratación. Registrar una entrada SHALL actualizar el progreso del día actual de inmediato. La vista de nutrición SHALL NOT incluir el cambio del objetivo ni el del tamaño de la ración, ni el historial, ni su representación gráfica, ni la lista de tomas. La vista de estadísticas SHALL ofrecer la configuración del objetivo y del tamaño de la ración, las estadísticas resumidas, la representación gráfica, el historial y las tomas del día actual, con la selección del periodo de cada bloque que depende de un periodo, y SHALL permitir volver a la vista de nutrición.

#### Escenario: Progreso de hoy visible con objetivo
- **CUANDO** un usuario con un objetivo vigente de 2000 ml, que hoy ha registrado 750 ml, abre la vista de nutrición
- **ENTONCES** el sistema muestra de forma destacada que lleva 750 ml de 2000 ml en el día actual

#### Escenario: Progreso de hoy sin entradas
- **CUANDO** un usuario con un objetivo vigente de 2000 ml, que hoy todavía no ha registrado agua, abre la vista de nutrición
- **ENTONCES** el sistema muestra que lleva 0 ml de 2000 ml en el día actual, aunque tenga registros de días anteriores

#### Escenario: Progreso de hoy sin objetivo
- **CUANDO** un usuario que nunca ha establecido un objetivo, y que hoy ha registrado 750 ml, abre la vista de nutrición
- **ENTONCES** el sistema muestra los 750 ml del día actual, indica que no hay objetivo configurado, sin mostrar ningún progreso frente a un objetivo, y ofrece un acceso a la vista de estadísticas de hidratación para configurarlo

#### Escenario: Objetivo del día alcanzado
- **CUANDO** un usuario con un objetivo vigente de 2000 ml lleva 2100 ml en el día actual
- **ENTONCES** el sistema muestra los 2100 ml de 2000 ml e indica con texto que el objetivo del día está cumplido

#### Escenario: Registrar una entrada actualiza el progreso de hoy
- **CUANDO** un usuario que lleva 750 ml de un objetivo de 2000 ml registra una entrada de 250 ml desde la vista de nutrición
- **ENTONCES** el progreso del día actual pasa a 1000 ml de 2000 ml de inmediato, sin que el usuario tenga que volver a abrir la vista

#### Escenario: Objetivo cambiado en las estadísticas, visible al volver
- **CUANDO** un usuario que lleva 750 ml de un objetivo de 2000 ml cambia su objetivo a 2500 ml en la vista de estadísticas de hidratación y vuelve a la vista de nutrición
- **ENTONCES** el progreso del día actual es de 750 ml de 2500 ml

#### Escenario: Progreso de hoy según el día local
- **CUANDO** un usuario con zona horaria `Europe/Madrid` que registró 1500 ml antes de su medianoche local abre la vista de nutrición poco después de esa medianoche, en un instante en el que en UTC todavía es el día anterior
- **ENTONCES** el progreso del día actual es de 0 ml, porque los 1500 ml pertenecen al día local anterior

#### Escenario: Acceso a las estadísticas desde la vista de nutrición
- **CUANDO** el usuario, desde la vista de nutrición, abre las estadísticas de hidratación
- **ENTONCES** el sistema muestra la vista de estadísticas, con la configuración del objetivo y del tamaño de la ración, las estadísticas resumidas, el gráfico, el calendario, el historial y las tomas del día actual, cada bloque que depende de un periodo con la selección del suyo, y el usuario puede volver desde ella a la vista de nutrición

#### Escenario: Vista de nutrición sin configuración, historial ni gráficos
- **CUANDO** el usuario abre la vista de nutrición
- **ENTONCES** de la hidratación ve únicamente el progreso del día actual, su representación por raciones, el registro de agua y el acceso a las estadísticas, y no el cambio del objetivo ni el del tamaño de la ración, ni el historial, el gráfico, el calendario ni la lista de tomas

#### Escenario: Entrada registrada visible después en las estadísticas
- **CUANDO** el usuario registra una entrada desde la vista de nutrición y a continuación abre la vista de estadísticas
- **ENTONCES** el total del día actual, las estadísticas, el historial y la lista de tomas del día ya incluyen esa entrada

### Requirement: Periodo de Consulta Seleccionable
El sistema SHALL permitir al usuario elegir el periodo del historial y de las estadísticas entre los últimos 7 días, los últimos 30 días, los últimos 3 meses y el último año. El periodo SHALL elegirse por separado en cada bloque de la vista de estadísticas que depende de un periodo: el resumen de estadísticas, el gráfico, el calendario y el historial. Cambiar el periodo de un bloque SHALL actualizar ese bloque y SHALL NOT alterar el periodo ni el contenido de los demás. Al abrir la vista de estadísticas, el resumen, el gráfico y el historial SHALL mostrar los últimos 30 días y el calendario los últimos 3 meses. La racha actual SHALL presentarse de forma que quede claro que no depende del periodo de ningún bloque. Cada periodo SHALL contarse en días locales del usuario y SHALL terminar en el día en curso, incluido. Los periodos de 3 meses y de un año SHALL contarse en meses y años de calendario, y SHALL NOT contarse como un número fijo de días. El sistema SHALL NOT aceptar un periodo distinto de los admitidos.

#### Escenario: Periodo de los últimos 7 días
- **CUANDO** el usuario consulta los últimos 7 días y su día local en curso es el 12 de octubre
- **ENTONCES** el sistema abarca los días del 6 al 12 de octubre, ambos incluidos

#### Escenario: Periodo de los últimos 30 días
- **CUANDO** el usuario consulta los últimos 30 días y su día local en curso es el 12 de octubre
- **ENTONCES** el sistema abarca los días del 13 de septiembre al 12 de octubre, ambos incluidos

#### Escenario: Periodo de los últimos 3 meses
- **CUANDO** el usuario consulta los últimos 3 meses y su día local en curso es el 12 de octubre
- **ENTONCES** el sistema abarca tres meses de calendario, del 13 de julio al 12 de octubre, ambos incluidos

#### Escenario: Periodo del último año
- **CUANDO** el usuario consulta el último año y su día local en curso es el 12 de octubre de 2026
- **ENTONCES** el sistema abarca un año de calendario, del 13 de octubre de 2025 al 12 de octubre de 2026, ambos incluidos

#### Escenario: Cambio de periodo en un bloque
- **CUANDO** el usuario, que está viendo los últimos 30 días en el resumen de estadísticas, selecciona en ese bloque los últimos 7 días
- **ENTONCES** el sistema actualiza el resumen para que corresponda a los últimos 7 días, y el gráfico, el calendario y el historial conservan el periodo y el contenido que tenían

#### Escenario: Bloques con periodos distintos
- **CUANDO** el usuario selecciona el último año en el calendario y los últimos 7 días en el historial, sin cambiar el periodo del resumen ni el del gráfico
- **ENTONCES** el calendario muestra el último año, el historial los últimos 7 días, y el resumen y el gráfico siguen mostrando los últimos 30 días

#### Escenario: Periodos iniciales al abrir la vista de estadísticas
- **CUANDO** el usuario abre la vista de estadísticas
- **ENTONCES** el resumen, el gráfico y el historial muestran los últimos 30 días y el calendario los últimos 3 meses, aunque en una visita anterior hubiera elegido otros periodos

#### Escenario: La racha actual no cambia al cambiar un periodo
- **CUANDO** el usuario, con una racha actual de 10 días, cambia el periodo de cualquiera de los bloques
- **ENTONCES** la racha actual sigue siendo de 10 días, y el sistema indica que la racha no depende del periodo

#### Escenario: Periodo no válido rechazado
- **CUANDO** se solicita el historial o las estadísticas con un periodo que no es ninguno de los cuatro admitidos
- **ENTONCES** el sistema rechaza la solicitud indicando el motivo y no devuelve datos de ningún otro periodo en su lugar

### Requirement: Representación Gráfica del Historial
El sistema SHALL presentar el historial como un gráfico de barras que incluye la referencia del objetivo, y como un calendario diario en el que se distinguen los días con objetivo cumplido, cada uno para el periodo seleccionado en su bloque. La distinción entre días cumplidos, no cumplidos y sin registros SHALL NOT depender únicamente del color.

Cuando el periodo del gráfico es de 7 o de 30 días, el gráfico SHALL mostrar una barra por día con el total de ese día. Cuando es de 3 meses o de un año, el gráfico SHALL mostrar una barra por semana, entendida de lunes a domingo en días locales del usuario, cuyo valor es la media diaria de ingesta de esa semana. La media de una semana SHALL calcularse con las mismas reglas que la media diaria del periodo: los días sin entradas cuentan como cero, y solo cuentan los días de la semana que pertenecen al periodo, no son anteriores al primer registro del usuario y no son posteriores al día en curso. La primera y la última semana del periodo pueden ser parciales, y su media SHALL calcularse solo sobre los días que cuentan. El servidor SHALL calcular los valores semanales, con el mismo redondeo que la media diaria.

La referencia del objetivo SHALL ser, en el gráfico diario, el objetivo vigente cada día y, en el gráfico por semanas, la media de los objetivos vigentes en los días de la semana que cuentan y tienen objetivo. La referencia SHALL reflejar los cambios de objetivo dentro del periodo como cambios de nivel, y SHALL NOT mostrarse para un día sin objetivo vigente ni para una semana en la que ningún día que cuenta lo tiene.

#### Escenario: Gráfico diario en los periodos de 7 y 30 días
- **CUANDO** el usuario selecciona en el gráfico los últimos 7 días o los últimos 30 días
- **ENTONCES** el sistema muestra un gráfico con una barra por cada día del periodo, incluidos los días sin entradas, con el total de ese día y con la referencia del objetivo vigente cada día para comparar cada total con él

#### Escenario: Gráfico por semanas en los periodos de 3 meses y un año
- **CUANDO** el usuario selecciona en el gráfico los últimos 3 meses o el último año
- **ENTONCES** el sistema muestra un gráfico con una barra por cada semana del periodo, cuyo valor es la media diaria de ingesta de esa semana, y con la referencia del objetivo de cada semana

#### Escenario: Barra semanal con días sin entradas
- **CUANDO** una semana completa del periodo, de lunes a domingo y posterior al primer registro del usuario, tiene totales de 2000, 0, 1500, 2500, 0, 3000 y 1500 ml, con un objetivo vigente de 2000 ml todos los días
- **ENTONCES** la barra de esa semana vale 1500 ml, resultado de repartir los 10500 ml entre los 7 días, y su referencia del objetivo es 2000 ml

#### Escenario: Semana parcial por el día en curso
- **CUANDO** el día en curso es miércoles y los totales de esa semana son 1800 ml el lunes, 2400 ml el martes y 600 ml el miércoles
- **ENTONCES** la barra de esa semana vale 1600 ml, resultado de repartir los 4800 ml entre los 3 días transcurridos y no entre 7

#### Escenario: Semana parcial por el primer registro
- **CUANDO** el primer registro del usuario es de un sábado, con 850 ml ese día y 1050 ml el domingo
- **ENTONCES** la barra de esa semana vale 950 ml, resultado de repartir los 1900 ml entre los 2 días transcurridos desde el primer registro, y las semanas anteriores no tienen barra

#### Escenario: Referencia semanal con cambio de objetivo a mitad de semana
- **CUANDO** en una semana completa rige un objetivo de 2000 ml de lunes a miércoles y uno de 2700 ml de jueves a domingo
- **ENTONCES** la referencia del objetivo de esa semana es 2400 ml, la media de los objetivos de sus 7 días

#### Escenario: Semana sin objetivo vigente
- **CUANDO** una semana del periodo tiene entradas y ninguno de sus días tiene objetivo vigente
- **ENTONCES** el sistema muestra la barra de esa semana sin referencia del objetivo

#### Escenario: Semana sin entradas
- **CUANDO** una semana completa del periodo, posterior al primer registro del usuario, no tiene ninguna entrada
- **ENTONCES** la barra de esa semana vale 0 ml y la semana conserva su lugar en el gráfico

#### Escenario: Referencia del objetivo que sigue sus cambios
- **CUANDO** el usuario selecciona en el gráfico los últimos 7 días y el objetivo vigente fue de 2000 ml los cuatro primeros y de 3000 ml los tres últimos
- **ENTONCES** la referencia del objetivo se muestra a 2000 ml en los cuatro primeros días y a 3000 ml en los tres últimos, y no como un único nivel para todo el periodo

#### Escenario: Calendario con días cumplidos, no cumplidos y sin registros
- **CUANDO** el periodo del calendario incluye, con un objetivo vigente de 2000 ml, un día de 2300 ml, un día de 800 ml y un día sin entradas
- **ENTONCES** el calendario presenta los tres días de forma distinguible entre sí: el primero como cumplido, el segundo como no cumplido y el tercero como día sin registros

#### Escenario: Calendario diario en todos los periodos
- **CUANDO** el usuario selecciona en el calendario los últimos 3 meses o el último año
- **ENTONCES** el calendario muestra cada día del periodo por separado, a diferencia del gráfico de barras, que con esos periodos agrupa por semanas

#### Escenario: Distinción que no depende solo del color
- **CUANDO** el usuario consulta el calendario sin poder percibir las diferencias de color
- **ENTONCES** puede seguir sabiendo qué días cumplieron el objetivo, porque esa información también está disponible por un medio que no es el color

### Requirement: Tamaño de la Ración Configurable
El sistema SHALL permitir al usuario configurar el tamaño de la ración de agua, en mililitros: la cantidad que se registra con una sola interacción y la unidad en la que se representa el progreso del día. Mientras el usuario no lo configure, el tamaño de la ración SHALL ser de 250 ml. El tamaño de la ración SHALL ser un número entero de mililitros entre 50 y 2000, ambos incluidos; el sistema SHALL rechazar cualquier otro valor indicando el motivo y SHALL conservar el tamaño que había. El tamaño de la ración SHALL guardarse en el servidor como configuración del usuario, y SHALL validarse con independencia del objetivo diario: puede ser mayor que el objetivo.

Cambiar el tamaño de la ración SHALL NOT modificar las entradas ya registradas, sus cantidades, los totales diarios ni las estadísticas. SHALL cambiar únicamente la cantidad que se registra a partir de entonces con una ración y el número de raciones con que se representa el progreso.

#### Escenario: Tamaño de la ración por defecto
- **CUANDO** un usuario que nunca ha configurado el tamaño de la ración consulta su configuración de hidratación o registra una ración
- **ENTONCES** el tamaño de la ración es de 250 ml

#### Escenario: Tamaño de la ración configurado
- **CUANDO** el usuario establece un tamaño de ración de 330 ml
- **ENTONCES** el sistema lo almacena y, a partir de ese momento, registrar una ración suma 330 ml al total del día

#### Escenario: Tamaño de la ración fuera de los límites
- **CUANDO** un usuario con un tamaño de ración de 250 ml intenta establecer uno de 30 ml o uno de 2500 ml
- **ENTONCES** el sistema rechaza el valor indicando que debe estar entre 50 y 2000 ml, y el tamaño de la ración sigue siendo de 250 ml

#### Escenario: Límites del tamaño de la ración incluidos
- **CUANDO** el usuario establece un tamaño de ración de 50 ml o de 2000 ml
- **ENTONCES** el sistema lo acepta, porque ambos límites están incluidos

#### Escenario: Cambio de ración que no altera lo registrado
- **CUANDO** un usuario con un tamaño de ración de 250 ml, que hoy ha registrado tres raciones y lleva 750 ml, cambia el tamaño de la ración a 500 ml
- **ENTONCES** el total del día sigue siendo de 750 ml, sus tres entradas siguen siendo de 250 ml cada una, las estadísticas no cambian, y el progreso del día pasa a representarse como una ración completa y una segunda con 250 de sus 500 ml

#### Escenario: Tamaño de la ración mayor que el objetivo
- **CUANDO** un usuario con un objetivo vigente de 1500 ml establece un tamaño de ración de 2000 ml
- **ENTONCES** el sistema lo acepta, y el objetivo del día se alcanza en la primera ración

### Requirement: Progreso del Día por Raciones
El sistema SHALL representar el progreso de hidratación del día actual, en la vista de nutrición, como una serie de raciones del tamaño configurado, junto al total y al objetivo en texto. El número de raciones completas SHALL ser el cociente entero del total del día entre el tamaño de la ración, y esas raciones SHALL mostrarse llenas. La ración siguiente a la última completa SHALL ser la que permite registrar una ración con una sola interacción y SHALL indicarlo de forma visible; si el total del día no es múltiplo del tamaño de la ración, esa ración SHALL mostrarse parcialmente llena, en la proporción que el resto representa sobre el tamaño de la ración. El sistema SHALL representar siempre una ración siguiente, también cuando el objetivo ya está alcanzado o superado.

Cuando hay objetivo vigente, el sistema SHALL señalar la ración en la que se alcanza el objetivo, que es la que ocupa la posición resultante de dividir el objetivo entre el tamaño de la ración y redondear hacia arriba, y SHALL representar al menos las raciones necesarias para llegar a ella. Sin objetivo vigente, el sistema SHALL NOT señalar ninguna ración como la del objetivo. El servidor SHALL calcular el número de raciones completas, el resto de la ración en curso y la posición de la ración del objetivo; el cliente SHALL NOT calcularlos.

Las raciones SHALL disponerse en filas de ocho como máximo. Cuando haya que representar más de 24 raciones, el sistema SHALL indicar el progreso por raciones con texto en lugar de representarlas una a una, y SHALL seguir permitiendo registrar una ración con una sola interacción.

La representación por raciones SHALL NOT ser la única forma de conocer el progreso: el número de raciones completas, la ración en curso y la ración del objetivo SHALL estar disponibles también como texto. El estado de cada ración (llena, parcialmente llena, vacía, la del objetivo) SHALL NOT distinguirse únicamente por el color. El control que registra una ración SHALL tener un nombre accesible que incluya la cantidad que añade y una zona de pulsación de al menos 44 por 44 píxeles. El llenado de una ración al registrarla SHALL mostrarse con una animación, salvo cuando el usuario ha indicado en su sistema que prefiere reducir el movimiento: en ese caso la ración SHALL cambiar de estado sin animación y el estado final SHALL ser el mismo.

#### Escenario: Raciones completas y ración siguiente
- **CUANDO** un usuario con un objetivo vigente de 2000 ml y un tamaño de ración de 250 ml, que hoy lleva 750 ml, abre la vista de nutrición
- **ENTONCES** el sistema representa ocho raciones: las tres primeras llenas, la cuarta como la siguiente, vacía y con la indicación de que añade una ración, y la octava señalada como la ración en la que se alcanza el objetivo

#### Escenario: Ración parcialmente llena
- **CUANDO** un usuario con un tamaño de ración de 250 ml ha registrado hoy dos raciones y una entrada de 100 ml, de modo que lleva 600 ml
- **ENTONCES** el sistema muestra dos raciones llenas y la tercera parcialmente llena, con 100 de sus 250 ml, y esa tercera ración es la que permite registrar la siguiente

#### Escenario: Registrar una ración con una ración en curso
- **CUANDO** el usuario de la situación anterior, que lleva 600 ml, registra una ración de 250 ml
- **ENTONCES** el total pasa a 850 ml, y el sistema muestra tres raciones llenas y la cuarta parcialmente llena, con 100 de sus 250 ml

#### Escenario: Objetivo que requiere más de una fila
- **CUANDO** un usuario con un objetivo vigente de 2750 ml y un tamaño de ración de 250 ml abre la vista de nutrición
- **ENTONCES** el sistema representa once raciones, ocho en la primera fila y tres en la segunda, y señala la undécima como la ración en la que se alcanza el objetivo

#### Escenario: Objetivo que no es múltiplo de la ración
- **CUANDO** un usuario con un objetivo vigente de 2000 ml y un tamaño de ración de 300 ml lleva 1800 ml en el día actual
- **ENTONCES** el sistema muestra seis raciones llenas y señala la séptima como la ración en la que se alcanza el objetivo, y el objetivo del día todavía no figura como cumplido

#### Escenario: Objetivo alcanzado dentro de una ración
- **CUANDO** el usuario de la situación anterior registra una ración de 300 ml y pasa a llevar 2100 ml
- **ENTONCES** el sistema muestra siete raciones llenas, el objetivo del día figura como cumplido y la octava ración es la siguiente

#### Escenario: Objetivo alcanzado exactamente
- **CUANDO** un usuario con un objetivo vigente de 2000 ml y un tamaño de ración de 250 ml lleva 2000 ml en el día actual
- **ENTONCES** el sistema muestra ocho raciones llenas, la octava señalada como la del objetivo, el objetivo del día como cumplido y una novena ración como la siguiente

#### Escenario: Raciones por encima del objetivo
- **CUANDO** un usuario con un objetivo vigente de 2000 ml y un tamaño de ración de 250 ml lleva 2500 ml en el día actual
- **ENTONCES** el sistema muestra diez raciones llenas, con la octava señalada como la del objetivo, y una undécima ración como la siguiente, de modo que el usuario puede seguir registrando

#### Escenario: Raciones sin objetivo
- **CUANDO** un usuario que nunca ha establecido un objetivo, con un tamaño de ración de 250 ml, lleva 500 ml en el día actual
- **ENTONCES** el sistema muestra dos raciones llenas y la tercera como la siguiente, y no señala ninguna ración como la del objetivo

#### Escenario: Más raciones de las que se representan una a una
- **CUANDO** un usuario con un objetivo vigente de 3000 ml y un tamaño de ración de 100 ml, que hoy lleva 500 ml, abre la vista de nutrición
- **ENTONCES** el sistema, en lugar de representar las 30 raciones, indica con texto que lleva 5 raciones de las 30 del objetivo, y el usuario puede registrar una ración de 100 ml con una sola interacción

#### Escenario: Progreso por raciones disponible como texto
- **CUANDO** un usuario que no puede percibir la representación gráfica de las raciones consulta su progreso, con un objetivo vigente de 2000 ml, un tamaño de ración de 250 ml y 600 ml en el día actual
- **ENTONCES** puede saber por un medio textual que lleva 600 ml de 2000 ml, que ha completado dos raciones, que la tercera está en curso y que el objetivo se alcanza en la octava

#### Escenario: Estado de las raciones que no depende solo del color
- **CUANDO** el usuario consulta las raciones sin poder percibir las diferencias de color
- **ENTONCES** puede seguir distinguiendo las raciones llenas, la parcialmente llena, las vacías y la del objetivo, porque se diferencian también por su forma, por una marca o por texto

#### Escenario: Control de registro con nombre accesible
- **CUANDO** un usuario con un tamaño de ración de 250 ml recorre la vista de nutrición con una tecnología de apoyo
- **ENTONCES** el control que registra una ración se anuncia con un nombre que incluye la cantidad que añade, 250 ml

#### Escenario: Animación de llenado al registrar una ración
- **CUANDO** un usuario que no ha pedido reducir el movimiento registra una ración
- **ENTONCES** la ración registrada pasa a mostrarse llena mediante una animación de llenado

#### Escenario: Llenado sin animación con movimiento reducido
- **CUANDO** un usuario que ha indicado en su sistema que prefiere reducir el movimiento registra una ración
- **ENTONCES** la ración registrada pasa a mostrarse llena sin animación, y el total, las raciones llenas y la ración siguiente quedan igual que si se hubiera animado

### Requirement: Tomas del Día Actual
El sistema SHALL mostrar, en la vista de estadísticas de hidratación, la lista de las tomas del día actual: cada entrada de agua registrada en el día local actual del usuario, con su cantidad y la hora local en que se registró. El servidor SHALL determinar qué entradas pertenecen al día actual y la hora local de cada una, según la zona horaria vigente del usuario en el momento de la consulta; el cliente SHALL NOT enviar fechas ni calcular la hora. La lista SHALL ordenarse de la toma más reciente a la más antigua. Si el día actual no tiene entradas, el sistema SHALL indicarlo con un mensaje. La lista SHALL ser de consulta: el sistema SHALL NOT ofrecer la edición ni el borrado de una toma.

#### Escenario: Tomas con cantidad y hora local
- **CUANDO** un usuario con zona horaria `Europe/Madrid`, que hoy ha registrado 250 ml a las 08:15 y 500 ml a las 13:40, hora local, abre la vista de estadísticas
- **ENTONCES** el sistema muestra dos tomas, primero la de 500 ml a las 13:40 y después la de 250 ml a las 08:15

#### Escenario: Hora de la toma en la zona horaria del usuario
- **CUANDO** un usuario con zona horaria `Europe/Madrid` registra una toma el 12 de octubre a las 06:30 UTC
- **ENTONCES** el sistema muestra esa toma a las 08:30, la hora local del usuario, y no a las 06:30

#### Escenario: Solo las tomas del día local actual
- **CUANDO** un usuario registró una entrada a las 23:50 de ayer y otra a las 00:10 de hoy, hora local
- **ENTONCES** la lista de tomas del día actual contiene únicamente la de las 00:10

#### Escenario: Día sin tomas
- **CUANDO** un usuario que hoy todavía no ha registrado agua abre la vista de estadísticas
- **ENTONCES** el sistema indica con un mensaje que hoy no hay tomas registradas, aunque el usuario tenga registros de días anteriores

#### Escenario: Tomas al cambiar de zona horaria
- **CUANDO** un usuario que registró una toma el 12 de octubre a las 10:00 UTC, y que la veía a las 12:00 con la zona horaria `Europe/Madrid`, cambia su zona horaria a `America/New_York`
- **ENTONCES** el sistema muestra esa toma a las 06:00, y decide si pertenece al día actual según la nueva zona horaria, sin modificar el instante en que se registró

#### Escenario: Lista de tomas sin edición ni borrado
- **CUANDO** el usuario consulta la lista de tomas del día actual
- **ENTONCES** puede ver cada toma, y el sistema no le ofrece ninguna forma de editarla ni de borrarla

### Requirement: Configuración de la Hidratación en la Vista de Estadísticas
El sistema SHALL ofrecer, en la vista de estadísticas de hidratación, la configuración del objetivo diario y del tamaño de la ración: SHALL mostrar el valor actual de cada uno y SHALL permitir cambiarlo. Si el usuario no tiene objetivo, el sistema SHALL indicarlo y SHALL permitir establecerlo desde ahí. Cambiar el objetivo desde la vista de estadísticas SHALL actualizar de inmediato, en esa misma vista, las estadísticas, la representación gráfica y el historial que dependen de él, sin que el usuario tenga que volver a abrirla. Un valor rechazado SHALL comunicarse con texto junto al campo al que corresponde y SHALL NOT modificar el valor vigente.

#### Escenario: Valores actuales de la configuración
- **CUANDO** un usuario con un objetivo de 2750 ml y un tamaño de ración de 250 ml abre la vista de estadísticas
- **ENTONCES** el sistema muestra el objetivo diario de 2750 ml y el tamaño de la ración de 250 ml, y permite cambiar ambos

#### Escenario: Cambio de objetivo que actualiza las estadísticas
- **CUANDO** un usuario con un objetivo de 2750 ml, que hoy lleva 2100 ml, cambia su objetivo a 2000 ml desde la vista de estadísticas
- **ENTONCES** el día en curso pasa a figurar como cumplido en el resumen, el calendario y el historial de esa misma vista, sin volver a abrirla, y los días anteriores conservan el objetivo de 2750 ml

#### Escenario: Cambio del tamaño de la ración desde la vista de estadísticas
- **CUANDO** un usuario con un tamaño de ración de 250 ml lo cambia a 500 ml desde la vista de estadísticas
- **ENTONCES** el sistema muestra el tamaño de la ración de 500 ml, y las estadísticas, el historial y las tomas del día no cambian

#### Escenario: Configuración sin objetivo
- **CUANDO** un usuario que nunca ha establecido un objetivo abre la vista de estadísticas
- **ENTONCES** el sistema indica que no hay objetivo configurado y permite establecerlo; al establecer uno de 2000 ml, el día en curso pasa a evaluarse con ese objetivo

#### Escenario: Valor rechazado junto a su campo
- **CUANDO** un usuario con un tamaño de ración de 250 ml intenta guardar uno de 30 ml
- **ENTONCES** el sistema muestra junto al campo del tamaño de la ración un mensaje que indica que el valor debe estar entre 50 y 2000 ml, y el tamaño de la ración sigue siendo de 250 ml
