# Proposal

## Why

El cliente Angular conserva los estilos mínimos que se trasladaron desde Flutter durante la migración: una paleta morada con valores fijos, solo tema claro, sin iconos, una barra de navegación de texto y una única tarjeta sin variantes. No hay una base visual común sobre la que construir pantallas nuevas. La siguiente pantalla, las estadísticas de hidratación (`water-statistics`), es la primera con gráficos, tarjetas con controles y navegación entre vistas; construirla con el estilo actual obligaría a rehacerla. Conviene fijar ahora la base visual, cuando solo existe un módulo, y que el resto de módulos nazcan sobre ella.

La autora ha aportado como referencia visual capturas de una aplicación de entrenamiento con tema oscuro, tarjetas muy redondeadas, un único color de acento, navegación inferior flotante con iconos y controles en forma de píldora. Se toman sus patrones (formas, jerarquía, espaciado), no sus recursos gráficos.

## What Changes

- **Temas claro y oscuro.** La aplicación sigue por defecto el tema del sistema. Todos los colores pasan a definirse como variables por papel (fondo, superficie, texto, texto secundario, borde, acento, éxito, aviso, peligro), con un valor para cada tema.
- **Color de acento en una única variable.** El acento es índigo por ahora, el de la referencia visual, y sustituye al morado heredado de Flutter. Todo color acentuado de la interfaz (acción principal, elemento activo, datos destacados, fondos suaves, anillos de foco) se deriva de esa única variable, de modo que cambiarla cambie toda la aplicación. Que el usuario lo elija desde ajustes queda preparado, pero fuera de este change.
- **Tipografía, espaciado, radios y elevación** como variables, con la escala de la referencia: títulos en negrita, texto secundario atenuado, tarjetas y controles muy redondeados.
- **Movimiento.** Variables de duración y de curva de aceleración para que las animaciones pequeñas de la interfaz sean coherentes, y una regla global que respeta la preferencia de movimiento reducido del sistema. Este change no diseña ninguna animación concreta.
- **Iconos.** Se incorpora un juego de iconos (Phosphor, a través de `ng-icons`), importando solo los que se usan.
- **Navegación principal rediseñada**: barra flotante con los cinco destinos, cada uno con icono y etiqueta, y el destino activo resaltado. La etiqueta de Entrenamiento es «Entreno», y así se anuncia también a las tecnologías de apoyo; el título de la pantalla sigue siendo «Entrenamiento». En pantallas anchas la navegación se adapta sin perder los cinco destinos.
- **Componentes base reutilizables**: tarjeta (con título, subtítulo y control opcional en la cabecera), botón (principal, secundario, de peligro, solo icono), selector compacto, campo de texto y los estados comunes de carga, error y vacío. El control segmentado, la fila de lista (con icono, valor y control al final) y el interruptor quedan diseñados en `design.md` pero no se construyen en este change: ninguna pantalla actual ni `water-statistics` los usa, y los construirá la primera pantalla que los necesite.
- **Las pantallas existentes se migran a la base nueva**: armazón de la aplicación, las cinco páginas de sección y las piezas actuales de hidratación en Nutrición, sin cambiar su comportamiento.
- **Accesibilidad como requisito**: contraste suficiente en ambos temas, foco visible, tamaño mínimo de las zonas táctiles, ninguna información transmitida solo por el color y respeto de la preferencia de movimiento reducido.

### Fuera de alcance

- Pantalla de ajustes: elegir el tema a mano y elegir el color de acento (este change deja el mecanismo listo; la interfaz llega con `update-profile` o un change propio).
- Gráficos y librería de gráficos (pertenecen a `water-statistics`).
- Animaciones concretas: la primera, la de hidratación, pertenece a `water-statistics`. Aquí solo se fija la base de movimiento.
- Control segmentado, fila de lista e interruptor: diseñados, sin construir.
- Menús contextuales, hojas inferiores, diálogos y notificaciones emergentes: se añadirán cuando una funcionalidad los necesite.
- Traducciones.
- Ilustraciones e imágenes propias de los módulos (por ejemplo, las de ejercicios o el mapa muscular de `workouts`).
- Cualquier cambio en la API.

## Capabilities

### New Capabilities

- `app-shell`: armazón y apariencia de la aplicación cliente. Cubre la navegación principal entre las cinco secciones, el tema claro y oscuro, el color de acento único y las garantías de accesibilidad (incluido el movimiento reducido) y de uso en móvil comunes a todas las pantallas.

### Modified Capabilities

(ninguna: el comportamiento de `water-tracking` no cambia, solo su presentación)

## Impact

- **Cliente**: `src/styles.scss` y la carpeta nueva `src/styles/` (variables, temas y movimiento), componentes base nuevos en `modules/app-container/shared/components/`, rediseño de `home/`, adaptación de las páginas de sección y de los componentes de `nutrition/water-tracking/`, y sus pruebas. Dependencias nuevas: `@ng-icons/core` y `@ng-icons/phosphor-icons`.
- **Backend y API**: sin cambios.
- **`water-statistics`** (planificado, sin implementar): sus fases de cliente dependen de este change; usarán estas variables y componentes en lugar de definir los suyos, y sus gráficos leerán los colores de las variables del tema.
- **Documentación**: `CLAUDE.md` y `README.md` (la base visual, cómo usar las variables y los componentes, la regla del acento único, la de los iconos y la del movimiento).
- **Regla del proyecto**: se mantiene «sin librería de componentes de interfaz»; los componentes base son propios. La única dependencia nueva es el juego de iconos.
