# Spec Delta

## Purpose
Definir el armazón y la apariencia comunes de la aplicación cliente: la navegación principal entre sus cinco secciones, el título de la vista actual, los temas claro y oscuro, el color de acento único y las garantías de accesibilidad y de uso en móvil que cumplen todas las vistas.

## ADDED Requirements

### Requirement: Navegación Principal entre Secciones
La aplicación SHALL ofrecer en todas sus vistas una navegación principal con sus cinco secciones (Salud, Nutrición, Entrenamiento, Progreso y Perfil), cada una con un icono y una etiqueta de texto. La navegación SHALL indicar cuál es la sección actual, también cuando el usuario está en una vista interior de esa sección. Si una etiqueta se muestra abreviada, la aplicación SHALL conservar el nombre completo de la sección para las tecnologías de apoyo.

#### Escenario: Cambio de sección
- **CUANDO** el usuario, desde cualquier vista, elige otra sección en la navegación principal
- **ENTONCES** la aplicación muestra el contenido de esa sección y la navegación principal sigue visible con sus cinco secciones

#### Escenario: Sección actual indicada
- **CUANDO** el usuario está en la sección Nutrición
- **ENTONCES** la navegación principal distingue Nutrición de las otras cuatro secciones y la expone como sección actual a las tecnologías de apoyo

#### Escenario: Vista interior de una sección
- **CUANDO** el usuario abre una vista interior de la sección Nutrición
- **ENTONCES** la navegación principal sigue indicando Nutrición como sección actual

#### Escenario: Etiqueta abreviada
- **CUANDO** la etiqueta de la sección Entrenamiento se muestra abreviada en la navegación principal
- **ENTONCES** un lector de pantalla anuncia ese destino con el nombre completo «Entrenamiento»

### Requirement: Dirección Propia de Cada Sección
Cada sección SHALL tener una dirección propia, de modo que se pueda abrir directamente, recargar y compartir, y que los controles «atrás» y «adelante» del navegador recorran las secciones visitadas. La aplicación SHALL abrir la sección Salud cuando se accede a ella sin indicar ninguna sección, y SHALL NOT mostrar una vista vacía o de error ante una dirección que no corresponde a ninguna vista.

#### Escenario: Sección abierta por su dirección
- **CUANDO** el usuario abre directamente la dirección de la sección Progreso, o recarga la página estando en ella
- **ENTONCES** la aplicación muestra la sección Progreso y la navegación principal la indica como sección actual

#### Escenario: Volver atrás con el navegador
- **CUANDO** el usuario pasa de la sección Salud a la sección Perfil y pulsa «atrás» en el navegador
- **ENTONCES** la aplicación vuelve a mostrar la sección Salud y la navegación principal la indica como sección actual

#### Escenario: Aplicación abierta sin indicar sección
- **CUANDO** el usuario abre la aplicación por su dirección raíz
- **ENTONCES** la aplicación muestra la sección Salud

#### Escenario: Dirección desconocida
- **CUANDO** el usuario abre una dirección que no corresponde a ninguna vista de la aplicación
- **ENTONCES** la aplicación lo lleva a la sección Salud, con la navegación principal disponible

### Requirement: Título de la Vista Actual
La aplicación SHALL mostrar en todo momento el título de la vista en la que está el usuario, y SHALL actualizarlo cada vez que cambia la vista. El título de una sección SHALL ser su nombre completo, aunque su etiqueta en la navegación principal se muestre abreviada.

#### Escenario: Título actualizado al cambiar de sección
- **CUANDO** el usuario pasa de la sección Salud a la sección Nutrición
- **ENTONCES** el título mostrado pasa de «Salud» a «Nutrición»

#### Escenario: Título completo con etiqueta abreviada
- **CUANDO** el usuario abre la sección Entrenamiento y su etiqueta en la navegación principal está abreviada
- **ENTONCES** el título mostrado es «Entrenamiento»

### Requirement: Tema Claro y Oscuro
La aplicación SHALL presentarse en un tema claro o en uno oscuro. Por defecto SHALL seguir la preferencia de tema del sistema del usuario, y SHALL cambiar de tema cuando esa preferencia cambia, sin que el usuario tenga que recargar. Todas las vistas SHALL ser legibles y utilizables en ambos temas, y un cambio de tema SHALL NOT alterar la vista en la que está el usuario ni los datos que tiene en pantalla.

#### Escenario: Sistema en tema oscuro
- **CUANDO** el usuario abre la aplicación con el sistema configurado en tema oscuro
- **ENTONCES** todas las vistas se presentan con el tema oscuro: fondos oscuros y texto claro

#### Escenario: Sistema en tema claro
- **CUANDO** el usuario abre la aplicación con el sistema configurado en tema claro
- **ENTONCES** todas las vistas se presentan con el tema claro: fondos claros y texto oscuro

#### Escenario: El sistema cambia de tema con la aplicación abierta
- **CUANDO** el sistema pasa de tema claro a tema oscuro mientras el usuario tiene abierta la sección Nutrición
- **ENTONCES** la aplicación pasa al tema oscuro sin recargar, y el usuario sigue en la sección Nutrición con los mismos datos en pantalla

#### Escenario: Ninguna vista queda fuera del tema
- **CUANDO** el usuario recorre las cinco secciones con el tema oscuro activo
- **ENTONCES** ninguna vista ni ninguna de sus partes conserva la apariencia del tema claro

### Requirement: Color de Acento Único
La aplicación SHALL usar un único color de acento, común a todas sus vistas, para sus elementos acentuados: la acción principal, el elemento activo o seleccionado, los datos destacados y el indicador de foco. Si ese color de acento cambia, todos los elementos acentuados SHALL cambiar con él de forma coherente, y ninguno SHALL conservar el color anterior.

#### Escenario: Mismo acento en toda la aplicación
- **CUANDO** el usuario compara la sección actual resaltada en la navegación principal con el botón de la acción principal de una vista
- **ENTONCES** ambos usan el mismo color de acento, en el tema claro y en el oscuro

#### Escenario: Cambio del color de acento
- **CUANDO** el color de acento de la aplicación se sustituye por otro
- **ENTONCES** todos los elementos acentuados de todas las vistas pasan a mostrar el nuevo color y ninguno conserva el anterior

### Requirement: Contraste Suficiente en Ambos Temas
La aplicación SHALL cumplir en los temas claro y oscuro los umbrales de contraste de WCAG 2.1 nivel AA: al menos 4,5:1 entre el texto de tamaño normal y su fondo, y al menos 3:1 para el texto grande y para los controles y elementos gráficos necesarios para entender o usar la interfaz. Estos umbrales SHALL cumplirse también en el texto secundario y en los elementos que usan el color de acento.

#### Escenario: Texto legible en ambos temas
- **CUANDO** se mide el contraste del texto principal y del texto secundario de una vista frente a su fondo, en el tema claro y en el oscuro
- **ENTONCES** el texto de tamaño normal alcanza al menos 4,5:1 y el texto grande al menos 3:1 en ambos temas

#### Escenario: Controles distinguibles en ambos temas
- **CUANDO** se mide el contraste del borde o del relleno que delimita un control, y el de los iconos de la navegación principal, frente a lo que tienen alrededor
- **ENTONCES** alcanzan al menos 3:1 en el tema claro y en el oscuro

#### Escenario: Texto sobre el color de acento
- **CUANDO** se mide el contraste del texto de un botón de acción principal frente al color de acento de su fondo
- **ENTONCES** alcanza al menos 4,5:1 en el tema claro y en el oscuro

### Requirement: Uso con Teclado y Tecnologías de Apoyo
Todos los controles interactivos de la aplicación SHALL poder alcanzarse y accionarse solo con el teclado, SHALL mostrar un indicador de foco visible cuando lo reciben y SHALL tener un nombre accesible que describa su función, incluidos los que solo muestran un icono. La aplicación SHALL NOT transmitir ninguna información únicamente mediante el color: la sección actual, los estados y los errores SHALL distinguirse además por texto, icono o forma.

#### Escenario: Foco visible al navegar con teclado
- **CUANDO** el usuario recorre una vista con el tabulador
- **ENTONCES** el foco pasa por todos los controles interactivos, incluidos los de la navegación principal, y el control enfocado muestra un indicador visible en el tema claro y en el oscuro

#### Escenario: Control de solo icono
- **CUANDO** un lector de pantalla llega a un botón que solo muestra un icono
- **ENTONCES** anuncia un nombre que describe la acción del botón

#### Escenario: Sección actual sin depender del color
- **CUANDO** la navegación principal se ve sin color, en escala de grises
- **ENTONCES** la sección actual sigue distinguiéndose de las demás

#### Escenario: Error sin depender del color
- **CUANDO** una vista muestra un error o un aviso
- **ENTONCES** lo comunica con un texto, y no solo con un cambio de color

### Requirement: Tamaño Mínimo de las Zonas Táctiles
Todo control interactivo de la aplicación SHALL ofrecer una zona táctil de al menos 44 por 44 puntos CSS, aunque su parte visible sea más pequeña, y las zonas táctiles de controles contiguos SHALL NOT solaparse.

#### Escenario: Destinos de la navegación principal
- **CUANDO** se mide la zona táctil de cada destino de la navegación principal en una pantalla de 375 puntos CSS de ancho
- **ENTONCES** cada una mide al menos 44 por 44 puntos CSS y no se solapa con las de los destinos vecinos

#### Escenario: Control con icono pequeño
- **CUANDO** el usuario toca dentro del área de 44 por 44 puntos CSS centrada en un botón cuyo icono visible es más pequeño
- **ENTONCES** el botón se acciona

### Requirement: Uso en Móvil
La aplicación SHALL estar pensada primero para pantallas de móvil. En una pantalla de 375 puntos CSS de ancho la página SHALL NOT requerir desplazamiento horizontal, y la navegación principal SHALL permanecer al alcance al desplazar el contenido sin impedir ver ni accionar ninguna parte de él. En pantallas más anchas la aplicación SHALL adaptar su disposición sin perder ninguna sección ni función.

#### Escenario: Sin desplazamiento horizontal en móvil
- **CUANDO** el usuario abre cualquier vista en una pantalla de 375 puntos CSS de ancho
- **ENTONCES** todo el contenido cabe a lo ancho y la página no se desplaza en horizontal

#### Escenario: Navegación al alcance al desplazar el contenido
- **CUANDO** el usuario desplaza hacia abajo una vista cuyo contenido es más alto que la pantalla del móvil
- **ENTONCES** la navegación principal sigue visible y accionable sin volver al principio de la vista

#### Escenario: El final del contenido no queda tapado
- **CUANDO** el usuario desplaza una vista hasta el final en una pantalla de móvil
- **ENTONCES** el último elemento del contenido se ve entero y puede accionarse, sin quedar oculto por la navegación principal

#### Escenario: Pantalla ancha
- **CUANDO** el usuario abre la aplicación en una pantalla de al menos 768 puntos CSS de ancho
- **ENTONCES** la navegación principal ofrece las cinco secciones, con icono y etiqueta, y todas las funciones disponibles en móvil siguen disponibles
