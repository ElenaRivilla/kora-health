# Design

## Context

Motivación y alcance: ver `proposal.md` (Why, What Changes, Fuera de alcance). Requisitos: ver el delta `specs/app-shell/spec.md` de este change, escrito en paralelo y contrastado con este documento al terminar. Aquí solo se recoge el estado actual que condiciona el diseño.

**Verificado leyendo el código del cliente** (`kora-health-client/`):

- `src/styles.scss` (1,1 kB compilado) define once variables de color con nombres de Material 3 (`--color-primary`, `--color-on-primary`, `--color-primary-container`, `--color-on-primary-container`, `--color-surface`, `--color-surface-container`, `--color-on-surface`, `--color-on-surface-variant`, `--color-outline`, `--color-outline-variant`, `--color-error`) y `--font-family-base`, con un solo tema. También define la clase global `.button` y `.startup-error`, que usa `main.ts` cuando falla el arranque. No hay parciales, mixins ni variables de espaciado, radios o tipografía: los valores están escritos en cada componente.
- `index.html` solo declara `viewport` (`width=device-width, initial-scale=1`): no hay `color-scheme`, `theme-color` ni `viewport-fit`.
- `HomeComponent` es una rejilla de altura `100dvh` con cabecera, contenido y navegación. El contenido (`main`) es el contenedor que se desplaza, no el documento. La navegación es una lista de enlaces de texto construida con las rutas hijas que declaran `path` y `title`; el destino activo se marca con `routerLinkActive` (coincidencia por prefijo) y `ariaCurrentWhenActive="page"`. Desde 48rem (768 px) la navegación sube a la cabecera. El título (`h1`) sale del `title` de la primera ruta hija activa.
- Las cinco páginas de sección existen; cuatro están vacías (plantilla y estilos de 0 bytes). `NutritionPageComponent` pinta dos `app-section-card` y aplica su propio relleno de página.
- `SectionCardComponent` (`app-section-card`): un `title` obligatorio (`h2`), una línea divisoria y el contenido proyectado. Solo lo usa la página de Nutrición.
- Los tres componentes de `nutrition/water-tracking/` usan la clase global `.button` (cuatro botones, todos con el mismo aspecto), un `<input type="number">` con su `<label>`, y párrafos de estado con `role="status"` («Cargando…») y `role="alert"` («Error: …»). El historial vacío pinta una lista vacía sin ningún mensaje.
- Pruebas (Vitest 5 sobre jsdom 30, builder `@angular/build:unit-test`): dependen del marcado en pocos puntos, enumerados en la decisión 14. Las más sensibles: `home.component.spec.ts` compara el texto de los cinco enlaces; `nutrition-page.component.spec.ts` busca `app-section-card h2`; las de objetivo e historial exigen que el texto del elemento con `role="alert"` sea exactamente «Error: sin conexión», y la del historial, que el componente vacío no tenga ningún texto.
- `package.json` no tiene ninguna dependencia de interfaz ni de iconos. `angular.json` fija presupuestos solo en producción: paquete inicial (aviso a 500 kB, error a 1 MB) y estilos por componente (aviso a 4 kB, error a 8 kB). No hay `stylePreprocessorOptions`.
- En `dist/` hay un build del 2026-10-11 (no se ha reconstruido para este documento): `main` 257 kB y `styles` 1,1 kB sin comprimir. Sirve de orden de magnitud; la referencia real se mide en la fase 1.
- La regla de `CLAUDE.md` sitúa el código transversal en `src/app/shared/` (`config/`, `entities/`, `helpers/`) y los componentes compartidos entre secciones en `modules/app-container/shared/components/`.

**Verificado consultando el registro de npm (2026-10-12):** `@ng-icons/core` 36.1.0 es la última versión, licencia MIT, y declara como dependencias entre pares `@angular/core` y `@angular/common` `>=22.0.0`, `rxjs`, y además `@schematics/angular` y `@angular-devkit/schematics` `>=22.0.0`. `@ng-icons/phosphor-icons` 36.1.0, licencia MIT, depende de `@ng-icons/core` `^36.1.0` y ocupa 17 MB descomprimido (contiene todos los iconos en todos los pesos; al paquete de la aplicación solo llega lo que se importa).

**Verificado por cálculo:** todos los ratios de contraste de las decisiones 1, 3 y 4, con la fórmula de luminancia relativa de WCAG 2.1 y mezclas en sRGB redondeadas a 8 bits por canal, mediante un script que no se deja en el repositorio.

**Medido en las capturas de la referencia** (`IMG_4466` e `IMG_4477`, color más frecuente de cada zona): el acento del botón principal y de las barras es `#5856d6` (rgb 88, 86, 214); el fondo, `#070707`; la tarjeta, `#1c1c1c`; la superficie elevada, `#222222`. En la propia referencia el acento da 5,65:1 con el texto blanco y 3,02:1 frente a su tarjeta.

**No verificado (se da por bueno y se marca «a comprobar al implementar» donde el diseño depende de ello):** nada de `ng-icons` se ha instalado ni ejecutado: su API, los nombres exactos de los iconos y su comportamiento sin `zone.js` y en jsdom proceden de su documentación y de memoria. El soporte de navegadores de `color-mix()`, `light-dark()` y la sintaxis de color relativo se cita de memoria. Tampoco se ha comprobado en un navegador el formato en que se serializa un color calculado con `color-mix()`.

**Referencia visual.** La autora aportó 25 capturas de una aplicación de entrenamiento con tema oscuro. De ellas se toman patrones, descritos aquí con palabras: fondo casi negro con tarjetas un tono más claras y un borde muy sutil; esquinas muy redondeadas en las tarjetas y forma de píldora en botones, campos y selectores; un único color de acento para la acción principal, el destino activo y los datos de los gráficos; barra de navegación inferior flotante, separada de los bordes de la pantalla, con icono y etiqueta por destino y el destino activo dentro de una píldora, con el icono relleno y en color de acento; títulos en negrita y texto secundario atenuado; tarjetas de gráfico con título, subtítulo y un selector de periodo compacto en la cabecera; listas de ajustes agrupadas en tarjetas, con icono, etiqueta y, al final, un valor, un interruptor o una flecha; la acción destructiva en rojo anaranjado; los estados completados en verde; el botón principal deshabilitado con el acento apagado. No se usan sus iconos, ilustraciones ni imágenes, ni se replica ninguna pantalla.

**Decisiones ya tomadas por la autora** (no se reabren): tema claro y oscuro, por defecto el del sistema, con el mecanismo preparado para elegirlo a mano más adelante; acento índigo, el de la referencia visual (`#5856d6`), con todo color acentuado derivado de una única variable; el requisito de contraste es WCAG 2.1 AA, sin márgenes internos añadidos; iconos Phosphor mediante `ng-icons` 36.1.0, contorno en reposo y relleno en activo, importando solo los usados; navegación en barra flotante con los cinco destinos, icono y etiqueta, y «Entreno» como etiqueta de Entrenamiento, visible y accesible a la vez, con «Entrenamiento» como título de la vista; control segmentado, fila de lista e interruptor aplazados hasta la primera pantalla que los necesite (decisión 12); animaciones pequeñas en la interfaz, para las que este change aporta solo la base (decisión 6); ninguna librería de componentes de interfaz; mobile-first, con 375 px como primer ancho de diseño y de verificación.

**Change dependiente.** `water-statistics` está planificado en otra rama y sus fases de cliente esperan esta base. Sus expectativas y cómo se cumplen están en la decisión 15.

## Goals / Non-Goals

**Goals:**

- Que ningún componente escriba un color, un radio o un tamaño de letra suelto: todo sale de variables por papel definidas en un único sitio.
- Que los dos temas cumplan AA con valores calculados, no estimados, y que el contraste siga garantizado si cambia el acento.
- Que cambiar el acento sea cambiar un solo valor, sin JavaScript que recalcule colores.
- Que el comportamiento, los textos y las peticiones a la API de las pantallas actuales no cambien: solo cambia su presentación.
- Que `water-statistics` encuentre lo que espera (decisión 15) y no tenga que definir variables ni componentes base propios.
- Que cada fase sea autocontenida y deje la aplicación funcionando.

**Non-Goals:**

- No se construyen componentes que ninguna pantalla actual ni `water-statistics` usa: control segmentado, fila de lista, interruptor y el estado «cargando» del botón quedan diseñados y sin construir (decisión 12).
- No se guarda ninguna preferencia de tema o de acento ni se crea interfaz para elegirlas.
- No se cambia el modelo de desplazamiento (lo sigue haciendo el contenido, no el documento) ni se añaden animaciones de transición entre rutas.
- No se añade una barra de progreso, un diálogo ni ningún otro componente que la propuesta no enumera.
- No se añaden textos nuevos a las pantallas existentes (ni mensajes de vacío en las cuatro páginas sin contenido, ni en el historial).
- No se introduce ninguna herramienta nueva (Storybook, pruebas de regresión visual, linters de estilos).

## Decisions

### 1. Variables por papel, con prefijo de categoría

Las variables CSS nombran el papel que cumplen, no su valor ni su posición en una paleta. Convención: `--<categoría>-<papel>[-<variante>]`, en inglés y kebab-case, con las categorías `color`, `font`, `space`, `radius`, `shadow`, `size`, `duration` y `ease`. La única excepción es `--accent`, sin categoría, porque no es un papel sino la **fuente** de la que se derivan los papeles de acento (decisión 4).

| Variable | Papel |
|---|---|
| `--color-bg` | Fondo de la aplicación |
| `--color-surface` | Superficie de tarjetas, cabecera y barra de navegación |
| `--color-surface-raised` | Superficie elevada sobre una tarjeta: campos, selectores, botón secundario, descripciones emergentes, celdas vacías |
| `--color-text` | Texto principal |
| `--color-text-secondary` | Texto secundario, etiquetas, iconos en reposo |
| `--color-text-disabled` | Texto de controles deshabilitados |
| `--color-border` | Borde sutil y líneas divisorias (decorativo, sin requisito de contraste) |
| `--color-border-strong` | Borde que delimita un control (3:1) |
| `--accent` | Fuente del acento: el único valor que cambiará un futuro selector |
| `--color-accent` | Relleno de acento: botón principal, pista activa de un control |
| `--color-on-accent` | Texto e iconos sobre `--color-accent` |
| `--color-accent-strong` | Acento legible sobre superficies: texto, iconos, destino activo y datos destacados |
| `--color-accent-soft` | Fondo suave de acento: píldora del destino activo, resaltados |
| `--color-accent-muted` | Acento atenuado: datos secundarios de un gráfico |
| `--color-focus-ring` | Anillo de foco (igual a `--color-accent-strong`) |
| `--color-success`, `--color-warning`, `--color-danger` | Éxito, aviso y peligro como texto, icono o trazo sobre superficies |
| `--color-success-fill`, `--color-danger-fill` | Rellenos de éxito y de peligro (botón de peligro, marca de completado) |
| `--color-on-success`, `--color-on-danger` | Texto e iconos sobre esos rellenos |
| `--color-data-neutral` | Dato sin valoración en un gráfico (ni cumplido ni incumplido) |

No hay `--color-warning-fill`: ningún componente rellena con el color de aviso. Los estados de `hover` y de pulsación no tienen variable: cada componente oscurece su relleno mezclándolo con un 8 % de negro, que mantiene el contraste en ambos temas sobre el fondo y sobre la tarjeta. Calculado para los tres rellenos (acento, peligro y éxito): el texto blanco queda en 6,41 · 7,35 · 6,57:1 en claro y en 5,48 · 5,52 · 5,44:1 en oscuro, y el relleno frente a la tarjeta, en 6,41 · 7,35 · 6,57:1 en claro y en 3,10 · 3,08 · 3,12:1 en oscuro. Sobre la superficie elevada del tema oscuro el relleno oscurecido baja de 3:1 (2,71 el de acento): un botón con relleno no se coloca directamente sobre una superficie elevada, que es a su vez la superficie de otros controles.

**Correspondencia con las variables actuales**, que desaparecen:

| Variable actual | Sustituta |
|---|---|
| `--color-primary` | `--color-accent` (relleno) o `--color-accent-strong` (texto, foco) |
| `--color-on-primary` | `--color-on-accent` |
| `--color-primary-container` | `--color-accent-soft` |
| `--color-on-primary-container` | `--color-accent-strong` |
| `--color-surface` | `--color-bg` |
| `--color-surface-container` | `--color-surface` |
| `--color-on-surface` | `--color-text` |
| `--color-on-surface-variant` | `--color-text-secondary` |
| `--color-outline` | `--color-border-strong` |
| `--color-outline-variant` | `--color-border` |
| `--color-error` | `--color-danger` |

Atención: `--color-surface` **cambia de significado** (hoy es el fondo de la página; pasará a ser la tarjeta). Por eso el renombrado se hace de una vez en la fase 1, sin alias temporales, y esa fase termina comprobando que no queda ninguna referencia a los once nombres antiguos.

*Alternativa descartada:* conservar los nombres de Material 3. Arrastran un vocabulario (`container`, `variant`, `outline`) que no describe los papeles que este change necesita (superficie elevada, acento legible, datos) y sugieren una dependencia de Material que no existe.

### 2. Temas: preferencia del sistema por defecto y un atributo en la raíz para forzarlo

- **Por defecto**, solo CSS: los valores del tema claro se declaran en `:root` y los del oscuro dentro de `@media (prefers-color-scheme: dark)`. No interviene JavaScript, así que no hay parpadeo al cargar y el cambio de tema del sistema con la aplicación abierta se aplica solo.
- **Para forzarlo**, el atributo `data-theme` del elemento raíz (`<html>`), con los valores `light` y `dark`; su ausencia significa «seguir al sistema». Los valores oscuros se escriben una sola vez en un mixin de SCSS que se incluye en dos sitios: la consulta de medios (limitada a la raíz que no lleve `data-theme="light"`) y la raíz con `data-theme="dark"`. Cuesta duplicar unas 25 declaraciones en el CSS generado, por debajo de 1 kB.
- **`color-scheme`**: la raíz declara `light dark`, y `light` o `dark` cuando el tema está forzado, para que los controles nativos (el desplegable de un `<select>`, las flechas de un campo numérico, el autocompletado) y las barras de desplazamiento sigan al tema. `index.html` añade además `<meta name="color-scheme" content="light dark">`, de modo que el lienzo del navegador ya es oscuro antes de que cargue la hoja de estilos.
- **`theme-color`**: dos etiquetas `meta` en `index.html`, cada una con su `media` (`prefers-color-scheme` claro y oscuro) y el valor de `--color-bg` de ese tema. Son los dos únicos colores literales fuera del parcial de variables; un comentario en ambos sitios remite al otro.
- **Parpadeo cuando exista la elección manual.** Mientras solo se siga al sistema no hay ninguno. Cuando un change posterior guarde la elección del usuario, el atributo tendrá que estar puesto antes del primer pintado: eso exige un guion mínimo en línea en `index.html`, que no se añade ahora porque no hay nada que leer. Dónde se guarda esa preferencia pertenece a ese change.

*Alternativa descartada:* `light-dark()` con `color-scheme` como único conmutador. Evita la duplicación y no necesita mixin, pero exige navegadores más recientes que el resto del diseño (de memoria: Chrome 123, Firefox 120, Safari 17.5; a comprobar) y la aplicación acabará ejecutándose en la vista web de iOS, cuya versión depende del sistema del dispositivo. La consulta de medios y el atributo funcionan en cualquier navegador que entienda variables CSS.

*Alternativa descartada:* una clase en `body` gestionada desde Angular. Dependería de que la aplicación haya arrancado, lo que produce parpadeo y deja sin tema la pantalla de error de arranque de `main.ts`.

### 3. Valores de ambos temas y contraste calculado

Punto de partida: el índigo de la referencia (`#5856d6`, medido en sus capturas) y, para el oscuro, su estética (fondo casi negro, tarjetas un tono más claras). Los neutros llevan un matiz frío leve para acompañar al acento. El morado heredado de Flutter desaparece.

| Variable | Claro | Oscuro |
|---|---|---|
| `--color-bg` | `#f6f4f9` | `#0e0e11` |
| `--color-surface` | `#ffffff` | `#1c1c20` |
| `--color-surface-raised` | `#eeebf3` | `#27272d` |
| `--color-text` | `#1d1b20` | `#f4f3f7` |
| `--color-text-secondary` | `#5a5663` | `#aeabb8` |
| `--color-text-disabled` | `#8e8a97` | `#6d6a77` |
| `--color-border` | `#dcd8e3` | `#33333b` |
| `--color-border-strong` | `#827d8c` | `#7d7a88` |
| `--accent` | `#5856d6` | `#5856d6` (el mismo) |
| `--color-accent` | `#5856d6` (el acento tal cual) | `#6564d9` (92 % acento, 8 % blanco) |
| `--color-on-accent` | `#ffffff` | `#ffffff` |
| `--color-accent-strong` | `#5856d6` (el acento tal cual) | `#acaaea` (50 % acento, 50 % blanco) |
| `--color-accent-soft` | `#ebebfa` (12 % acento sobre la superficie) | `#292948` (22 % acento sobre la superficie) |
| `--color-accent-muted` | `#c5c4f1` (35 % acento sobre la superficie) | `#373672` (45 % acento sobre la superficie) |
| `--color-success` | `#1b7438` | `#5fd083` |
| `--color-success-fill` / `--color-on-success` | `#1b7438` / `#ffffff` | `#2c8249` / `#ffffff` |
| `--color-warning` | `#955000` | `#f5a742` |
| `--color-danger` | `#b3261e` | `#ff7a6b` |
| `--color-danger-fill` / `--color-on-danger` | `#b3261e` / `#ffffff` | `#c7463c` / `#ffffff` |
| `--color-data-neutral` | `#c6c3ce` | `#4a4a54` |

Los valores de las cuatro filas derivadas del acento son el resultado de la mezcla con el índigo, redondeado a 8 bits por canal; en el código no se escriben como hexadecimales, sino como la mezcla (decisión 4). Respecto a la primera versión de esta tabla, además del acento cambian tres valores: el dato neutro del tema claro se aclara (con el índigo, más luminoso que el morado anterior, `#b9b6c1` quedaba a 2,83:1 del dato destacado) y los rellenos de peligro y de éxito del tema oscuro se aclaran un poco (`#c2362b` y `#1f7a3d` cumplían en reposo, pero al oscurecerse en `hover` bajaban de 3:1 frente a la tarjeta). Las superficies y los demás neutros no se han tocado.

**Contraste (ratio WCAG 2.1, calculado).** Umbral: los de WCAG 2.1 nivel AA, que es lo que exige el delta de spec: 4,5:1 para texto normal y 3:1 para texto grande y elementos de interfaz. No se aplica ningún margen interno por encima de AA. Todos los pares con umbral lo cumplen.

| Par (primero sobre segundo) | Umbral | Claro | Oscuro |
|---|---|---|---|
| Texto / fondo | 4,5 | 15,63 | 17,45 |
| Texto / superficie | 4,5 | 17,07 | 15,38 |
| Texto / superficie elevada | 4,5 | 14,48 | 13,44 |
| Texto / acento suave | 4,5 | 14,47 | 12,63 |
| Texto secundario / fondo | 4,5 | 6,53 | 8,55 |
| Texto secundario / superficie | 4,5 | 7,13 | 7,54 |
| Texto secundario / superficie elevada | 4,5 | 6,05 | 6,59 |
| Texto secundario / acento suave | 4,5 | 6,04 | 6,19 |
| Texto sobre acento / relleno de acento | 4,5 | 5,65 | 4,80 |
| Relleno de acento / fondo | 3 | 5,17 | 4,02 |
| Relleno de acento / superficie | 3 | 5,65 | 3,54 |
| Relleno de acento / superficie elevada | 3 | 4,79 | 3,10 |
| Acento legible / fondo | 4,5 | 5,17 | 8,90 |
| Acento legible / superficie | 4,5 | 5,65 | 7,84 |
| Acento legible / superficie elevada | 4,5 | 4,79 | 6,85 |
| Acento legible / acento suave | 4,5 | 4,79 | 6,44 |
| Anillo de foco (acento legible) / fondo, superficie, elevada | 3 | 5,17 · 5,65 · 4,79 | 8,90 · 7,84 · 6,85 |
| Borde de control / fondo | 3 | 3,65 | 4,60 |
| Borde de control / superficie | 3 | 3,99 | 4,05 |
| Borde de control / superficie elevada | 3 | 3,39 | 3,54 |
| Éxito / fondo, superficie, elevada | 4,5 | 5,34 · 5,83 · 4,95 | 9,95 · 8,77 · 7,66 |
| Aviso / fondo, superficie, elevada | 4,5 | 5,61 · 6,13 · 5,20 | 9,63 · 8,48 · 7,42 |
| Peligro / fondo, superficie, elevada | 4,5 | 5,98 · 6,54 · 5,54 | 7,57 · 6,67 · 5,83 |
| Texto sobre peligro / relleno de peligro | 4,5 | 6,54 | 4,81 |
| Texto sobre éxito / relleno de éxito | 4,5 | 5,83 | 4,78 |
| Relleno de peligro / superficie | 3 | 6,54 | 3,53 |
| Relleno de éxito / superficie | 3 | 5,83 | 3,56 |
| Acento legible / acento atenuado (datos) | 3 | 3,37 | 5,01 |
| Acento legible / dato neutro | 3 | 3,25 | 4,04 |
| Acento legible / celda vacía (superficie elevada) | 3 | 4,79 | 6,85 |
| Línea de objetivo (aviso) / superficie | 3 | 6,13 | 8,48 |

Pares sin umbral, a título informativo: texto deshabilitado sobre superficie, 3,37 y 3,22 (WCAG exime a los controles deshabilitados); borde sutil sobre superficie, 1,40 y 1,36 (decorativo); acento atenuado frente a dato neutro, 1,04 y 1,24; acento atenuado y dato neutro frente a la celda vacía, entre 1,37 y 1,70; el trazo de aviso frente al acento legible, 1,09 y 1,08, y frente al acento atenuado, 3,66 y 5,43.

**Límites que se aceptan y se dejan escritos:**

- Los tres estados «no destacados» de un gráfico (atenuado, neutro, vacío) no pueden distar 3:1 entre sí en el tema claro: para distar 3:1 del dato destacado tienen que ser más claros que una luminancia de 0,51, y entre ese valor y el blanco solo caben 1,9:1. En el tema claro, además, el atenuado y el neutro tienen prácticamente la misma luminancia (1,04:1) y solo los separa el tono. **Para `water-statistics`:** los estados no cumplidos del calendario (parcial, con registro sin objetivo, sin registro) necesitan en el tema claro algo más que el tono: una marca, una trama o un borde propios de cada estado, además de la leyenda y la descripción emergente que ya exige. En el tema oscuro se separan algo más (1,24 a 1,70), pero tampoco llegan a 3:1, así que la regla vale para ambos.
- El trazo de aviso (la línea del objetivo) cumple 3:1 frente a la tarjeta (6,13 y 8,48), pero no se distingue por luminancia de una barra de color de acento que cruce (1,09 y 1,08): solo lo hace por tono. Con el índigo esto no mejora respecto al morado anterior. **Para `water-statistics`:** la línea de objetivo debe ir discontinua (y, si cabe, con etiqueta), no continua.
- En el tema oscuro, el relleno de acento es el índigo aclarado un 8 % (`#6564d9`), no el índigo exacto. La ventana es estrecha: con texto blanco a 4,5:1 el relleno no puede superar una luminancia de 0,183, y para distar 3:1 de la superficie elevada (`#27272d`) necesita al menos 0,162; el índigo tal cual tiene 0,136. Entre el 7 % y el 11 % de blanco se cumplen las dos condiciones; se toma el 8 %, el más cercano a la referencia que deja algo de margen en ambas (4,80 y 3,10). No ha hecho falta tocar las superficies oscuras ni recurrir a texto oscuro sobre el acento.

*Alternativa descartada:* usar en el tema oscuro el índigo exacto (`#5856d6`), como hace la referencia. Con texto blanco da 5,65:1 y frente al fondo 3,41:1, pero frente a la tarjeta queda en 3,01:1, sin margen (cualquier oscurecimiento en `hover` lo baja de 3:1), y frente a la superficie elevada en 2,63:1. Habría que prohibir el relleno de acento sobre la superficie elevada (donde `water-statistics` prevé pintar su barra de progreso) o igualar la superficie elevada a la tarjeta (tendría que bajar a `#1d1d21`), con lo que se perdería un nivel de la jerarquía. La diferencia visual entre `#5856d6` y `#6564d9` es pequeña; si la autora prefiere el índigo exacto, es cambiar un porcentaje y aceptar esa restricción.

### 4. Acento único: una variable fuente, derivados con `color-mix()` y lista cerrada de acentos validados

**Mecanismo.** `--accent` es el único valor de acento escrito en el proyecto. Los cuatro papeles de acento se declaran en cada tema como una mezcla en espacio sRGB de `--accent` con blanco o con la superficie del tema, en los porcentajes de la tabla de la decisión 3. `--color-focus-ring` es `--color-accent-strong`. Ningún componente referencia `--accent` directamente: usa los papeles. Cambiar `--accent` cambia la aplicación entera, sin JavaScript que calcule nada.

**Por qué mezcla en sRGB.** El resultado es una interpolación lineal de los tres canales, que cualquiera puede reproducir a mano y que el script de contraste calcula exactamente, de modo que los ratios de la decisión 3 son los que pintará el navegador. Una mezcla en OKLab da tintes algo más uniformes, pero sus resultados solo se pueden verificar reimplementando la conversión.

**Soporte de navegadores (de memoria; a comprobar al implementar con los navegadores de la verificación):** `color-mix()` desde Chrome 111, Firefox 113 y Safari 16.2. Un navegador anterior ignoraría las declaraciones derivadas y dejaría sin color los elementos acentuados; no se añade alternativa porque la aplicación solo se ejecuta en local y en navegadores actuales. A comprobar también que el navegador mezcla como el script (el script redondea a 8 bits; el navegador puede conservar decimales, con diferencias de centésimas en el ratio).

**Elegir el acento en el futuro: lista cerrada, por atributo.** Un acento arbitrario no garantiza el contraste, porque los porcentajes de mezcla son fijos y la ventana del relleno en el tema oscuro es estrecha (decisión 3). Calculado con los mismos porcentajes: un azul `#2f5fb3` (6,16:1 con el blanco) y un magenta `#a23b72` (6,17:1) son demasiado oscuros y dejan el relleno del tema oscuro a 2,87:1 y 2,82:1 de la superficie elevada; al morado anterior `#65558f` (6,46:1) le pasa lo mismo (2,79:1); un naranja `#b3541e` (5,00:1) es demasiado claro y deja el texto blanco del botón en 4,33:1 en oscuro y el acento como texto en 4,24:1 sobre la superficie elevada en claro. En cambio cumplen todos los pares, por ejemplo, un azul `#3264c8` (5,54:1), un magenta `#b82e8a` (5,53:1) y un verde azulado `#217283` (5,53:1). Por tanto:

- El futuro selector ofrecerá solo acentos de una lista validada. Cada acento es una regla del parcial de variables que fija `--accent` cuando la raíz lleva `data-accent="<identificador>"`. Sin atributo rige el índigo. Elegir un acento es poner un atributo; añadir uno es añadir una regla de una línea. Los colores siguen viviendo solo en SCSS.
- Un acento entra en la lista si cumple, en ambos temas, los umbrales AA de todos los pares de la tabla de la decisión 3 en los que interviene, calculados con los porcentajes de mezcla vigentes. No hay otro criterio: el umbral interno de contraste con el blanco que usaba la primera versión de este documento era más estricto que AA, no respondía a ningún requisito y se elimina. Como orientación para buscar candidatos (no como criterio): los acentos que cumplen tienen un contraste con el blanco de entre 5,3:1 y 5,9:1 aproximadamente, es decir, una luminosidad parecida a la del índigo; lo que decide es la tabla completa.
- En este change la lista tiene una sola entrada, el índigo. No se construye el selector ni se añaden más acentos. Los tres ejemplos que cumplen sirven para la prueba del acento único de la verificación (decisión 16).

*Alternativa descartada:* sintaxis de color relativo (`oklch(from var(--accent) …)`) para derivar ajustando la luminosidad. Permitiría además elegir automáticamente texto claro u oscuro sobre el acento, pero su soporte es más reciente (de memoria: Chrome 119, Safari 16.4, Firefox 128; a comprobar) y el resultado no se puede verificar con una cuenta sencilla.

*Alternativa descartada:* que el texto sobre el acento se elija solo (`contrast-color()` o un cálculo con color relativo), para admitir cualquier acento. Soporte insuficiente y, aun con él, los demás pares (acento como texto, datos de los gráficos) seguirían sin garantía.

*Alternativa descartada:* calcular los derivados en TypeScript y escribirlos como estilos en línea. Es justo el JavaScript que la decisión de la autora quiere evitar, y duplicaría la paleta en dos lenguajes.

### 5. `ThemeService`: tema efectivo, acento y aviso de cambio

Se crea en este change, porque `water-statistics` lo espera para repintar sus gráficos (decisión 15). Ubicación: `src/app/shared/theme/theme.service.ts`, junto a `shared/config/`, por ser transversal y no pertenecer a ninguna sección; provisto en la raíz.

La fuente de verdad son los atributos del elemento raíz, no el servicio: el CSS funciona sin él, y el servicio solo los refleja y los escribe. Se crea la primera vez que alguien lo inyecta; la aplicación no lo necesita para pintarse.

| Miembro | Tipo | Contenido |
|---|---|---|
| `preference` | signal de `'system' \| 'light' \| 'dark'` | Lo que dice `data-theme`; `'system'` si no está |
| `theme` | signal de `'light' \| 'dark'` | Tema efectivo: el forzado o, si no, el del sistema |
| `accent` | signal de texto o `null` | Identificador de `data-accent`; `null` es el acento por defecto |
| `revision` | signal numérico | Se incrementa cada vez que puede haber cambiado algún color calculado |
| `setPreference(…)` | método | Pone o quita `data-theme` y actualiza las etiquetas `theme-color` |
| `setAccent(…)` | método | Pone o quita `data-accent` |

- **Qué observa.** Un `MutationObserver` sobre los atributos `data-theme`, `data-accent` y `style` del elemento raíz, y el evento de cambio de `matchMedia('(prefers-color-scheme: dark)')`. Observar los atributos, y no solo sus propios métodos, hace que también detecte un cambio hecho desde las herramientas del navegador, que es como `water-statistics` verifica el cambio de acento. Cualquier cambio incrementa `revision`.
- **`revision` es el aviso de repintado.** Quien lee colores calculados (la paleta de los gráficos) lo lee dentro de su cálculo y se recalcula solo. No se exponen los colores resueltos: leerlos es responsabilidad del helper que `water-statistics` ya tiene diseñado, y este change no escribe ningún color en TypeScript.
- **`setPreference` y `theme-color`.** Con un tema forzado, las dos etiquetas `meta` reciben el valor de `--color-bg` leído de la raíz; al volver a `'system'` recuperan su contenido original.
- **Sin persistencia.** Los métodos no guardan nada: al recargar se vuelve al sistema y al índigo. En este change solo los usa el catálogo de componentes (decisión 16), para revisar ambos temas sin tocar la configuración del sistema.
- **Entorno de pruebas.** jsdom no implementa `matchMedia`: si no existe, el servicio da por claro el tema del sistema y no falla. Sus pruebas lo sustituyen por un doble.

A comprobar al implementar: que el evento de `matchMedia` y la notificación del observador llegan con los estilos nuevos ya aplicados, de modo que una lectura hecha al recibir el aviso devuelve los colores del tema nuevo.

*Alternativa descartada:* no crear servicio y que cada consumidor observe la raíz (el plan por defecto de `water-statistics`). Repartiría el conocimiento del mecanismo de temas por varios sitios.

### 6. Tipografía, espaciado, radios, bordes y elevación

**Tipografía.** Se conserva la familia del sistema (`--font-family-base`, la pila actual): no se descarga ninguna fuente. Tamaños en `rem`.

| Variable | Valor | Uso |
|---|---|---|
| `--font-size-xs` | 0,6875rem (11 px) | Etiquetas de la barra de navegación |
| `--font-size-sm` | 0,8125rem (13 px) | Subtítulos, etiquetas de campo, texto secundario |
| `--font-size-md` | 1rem (16 px) | Texto base, botones, campos |
| `--font-size-lg` | 1,125rem (18 px) | Título de tarjeta |
| `--font-size-xl` | 1,375rem (22 px) | Título de la vista |
| `--font-size-2xl` | 1,75rem (28 px) | Cifras destacadas |
| `--font-weight-regular` / `-medium` / `-semibold` / `-bold` | 400 / 500 / 600 / 700 | |
| `--line-height-tight` / `--line-height-base` | 1,2 / 1,5 | Títulos y cifras / texto |

Los estilos de texto con nombre son mixins de SCSS que combinan tamaño, peso e interlineado: `text-title-page` (xl, negrita), `text-title-card` (lg, seminegrita), `text-body` (md, normal), `text-label` (sm, media), `text-caption` (sm, normal, color secundario), `text-nav` (xs, seminegrita) y `text-figure` (2xl, negrita). El texto de los campos no baja de 16 px: por debajo, Safari en iOS amplía la página al enfocarlos.

**Espaciado.** Escala de 4 px: `--space-1` (0,25rem), `--space-2` (0,5), `--space-3` (0,75), `--space-4` (1), `--space-5` (1,25), `--space-6` (1,5) y `--space-8` (2). Margen lateral de página y relleno de tarjeta: `--space-4`. Separación entre tarjetas: `--space-4`.

**Radios.** `--radius-sm` (0,375rem: celdas, marcas pequeñas), `--radius-md` (0,75rem: bloques dentro de una tarjeta), `--radius-card` (1,25rem) y `--radius-pill` (62,5rem: botones, campos, selectores, barra de navegación y píldora del destino activo).

**Bordes.** `--border-width` (0,0625rem). Las tarjetas llevan borde sutil (`--color-border`), porque en el tema claro la tarjeta blanca apenas se separa del fondo (1,09:1) y en el oscuro la referencia también lo usa. Los controles que se delimitan por su borde usan `--color-border-strong`.

**Foco.** Un único anillo para toda la aplicación: contorno de 0,125rem de `--color-focus-ring`, separado 0,125rem, solo con `:focus-visible`. Se define una vez en los estilos globales para todo elemento enfocable y los componentes no lo redefinen, salvo para ajustar la separación. El acento legible cumple 3:1 frente a los tres fondos en ambos temas (5,17 · 5,65 · 4,79 en claro y 8,90 · 7,84 · 6,85 en oscuro).

**Elevación.** La jerarquía se expresa con el color de la superficie (fondo, superficie, superficie elevada), no con sombras, que en el tema oscuro no se ven. Hay una sola sombra, `--shadow-floating`, para lo que flota sobre el contenido (la barra de navegación), con un valor por tema. Es, con las etiquetas `theme-color`, la única excepción a «ningún color literal fuera de las variables de color», y vive en el mismo parcial.

**Tamaños.** `--size-touch` (2,75rem, 44 px: altura mínima de todo control), `--size-icon` (1,5rem) y `--size-icon-sm` (1,25rem).

**Movimiento.** La interfaz tendrá animaciones pequeñas; la primera, la de hidratación, la diseña `water-statistics`. Este change aporta solo la base para que todas sean coherentes: variables de duración y de curva, nombradas por papel, y la regla global de movimiento reducido. No diseña ninguna animación concreta más allá de las transiciones de color de sus propios controles y del giro del indicador de carga.

| Variable | Valor | Uso |
|---|---|---|
| `--duration-fast` | 120ms | Respuesta inmediata de un control: cambio de color o de opacidad en `hover`, pulsación, foco y selección |
| `--duration-base` | 200ms | Cambio pequeño de tamaño o de posición dentro de una pieza: un indicador que se desplaza, un bloque que aparece o se pliega |
| `--duration-slow` | 400ms | Animación de un dato: una barra o un anillo que se llena, una cifra que cambia |
| `--ease-standard` | `cubic-bezier(0.2, 0, 0, 1)` | Curva por defecto: cambios de estado y movimientos dentro de la pantalla |
| `--ease-enter` | `cubic-bezier(0, 0, 0.2, 1)` | Lo que aparece o se llena: empieza rápido y frena al llegar |

Reglas: ninguna animación escribe una duración o una curva sueltas; solo se animan `opacity`, `transform` y colores, salvo necesidad justificada; ninguna animación retrasa una acción ni es la única forma de comunicar un cambio.

**Movimiento reducido (regla global).** Con `prefers-reduced-motion: reduce`, las animaciones no esenciales se desactivan o se sustituyen por un cambio instantáneo, y el estado final es el mismo que con movimiento. Se aplica en dos sitios, ambos globales, para que ningún componente tenga que acordarse: en `_tokens.scss`, las tres variables de duración valen `0s` dentro de esa consulta de medios, de modo que todo lo que use las variables pasa a ser instantáneo; y en `_base.scss`, una regla de red de seguridad dentro de la misma consulta reduce a una duración inapreciable y a una sola repetición cualquier animación o transición que no las use, y desactiva el desplazamiento suave. El indicador de carga deja de girar y queda como icono fijo junto a su texto («Cargando…»), que es lo que comunica el estado. Una animación hecha desde TypeScript (por ejemplo, la de un gráfico) no la alcanza el CSS: quien la escriba debe consultar la misma preferencia y desactivarla; es responsabilidad de ese change.

### 7. Estructura de los estilos

`src/styles.scss` deja de contener reglas y pasa a componer parciales de una carpeta nueva, `src/styles/`:

| Parcial | Contenido | Genera CSS |
|---|---|---|
| `_tokens.scss` | Todas las variables: color por tema, lista de acentos, tipografía, espaciado, radios, sombra, tamaños y movimiento (con sus valores para movimiento reducido) | Sí |
| `_base.scss` | Lo que hoy hay en `styles.scss`: reinicio de márgenes, `box-sizing`, `body`, el anillo de foco global, la regla de red de seguridad de `prefers-reduced-motion` (decisión 6) y `.startup-error` | Sí |
| `_utilities.scss` | Una sola utilidad: `.visually-hidden` | Sí |
| `_mixins.scss` | Mixins sin salida propia: los estilos de texto, el punto de corte de pantalla ancha (48rem), la zona táctil mínima y la píldora de control | No |

- **Qué es global y qué no.** Global: variables, reinicio, tipografía del `body`, foco y la utilidad. Todo lo demás vive en el SCSS de su componente, que solo usa variables y mixins. No hay clases globales de componente: la clase `.button` desaparece (decisión 10).
- **Uso de los mixins desde los componentes.** Se añade `stylePreprocessorOptions.includePaths` con `src/styles` en `angular.json`, para que un componente importe `mixins` sin rutas relativas largas. A comprobar al implementar que el builder de pruebas (`@angular/build:unit-test`) respeta esa opción; si no, se usan rutas relativas y no se toca `angular.json`.
- **El punto de corte es un mixin** y no una variable CSS, porque una consulta de medios no admite variables.
- **Nombres de clases.** Se mantiene la convención actual: BEM con el nombre del componente como bloque (`card__title`, `home__nav-link--active`). Los estilos del elemento anfitrión van en `:host`.
- **Presupuestos.** Los estilos globales pasan de 1,1 kB a una estimación de 4 a 5 kB, que cuentan en el paquete inicial (hoy a la mitad del aviso). El riesgo real es el presupuesto por componente (aviso a 4 kB): el candidato a rozarlo es `home.component.scss`, que hoy ya compila unos 2 kB. Si lo supera, la barra de navegación se extrae a un componente propio dentro de `home/`; no se suben los presupuestos.

### 8. Iconos con `ng-icons`

- **Uso directo, sin componente envoltorio.** Las plantillas usan el componente de `ng-icons` tal cual. Un envoltorio propio solo añadiría una capa sin aportar nada todavía.
- **Registro por componente, no global.** Cada componente que pinta iconos registra los suyos en sus propios proveedores. Así, los iconos de una pantalla diferida viajan en el trozo de esa pantalla y no en el paquete inicial, y cada prueba de componente es autosuficiente, sin tener que registrar iconos en el `TestBed`. Al paquete inicial solo llegan los del armazón (los diez de la navegación), porque `HomeComponent` no es diferido: una estimación de 10 a 15 kB sin comprimir entre la librería y los iconos, a medir en la fase 2.
- **Contorno y relleno.** Phosphor publica cada icono en varios pesos; se usan dos: el normal (contorno) y el relleno. A comprobar al implementar la ruta de importación de cada peso y el nombre exportado de cada icono.
- **Tamaño y color heredados.** El icono toma el color del texto que lo contiene (`currentColor`) y su tamaño se fija con las variables `--size-icon` y `--size-icon-sm`, sin tamaños en píxeles en las plantillas. A comprobar cómo expone la librería el tamaño (entrada o `font-size`) y que el color por defecto es el heredado.
- **Accesibilidad.** Dos casos y ninguno más. *Decorativo* (acompaña a un texto visible, como en la navegación): oculto a las tecnologías de apoyo. *Único contenido de un control* (botón de solo icono): el nombre accesible va en el control (`aria-label`), nunca en el icono, que sigue oculto. A comprobar si la librería ya oculta el icono por defecto; si no, se añade `aria-hidden` en cada uso.
- **Pruebas en Vitest y jsdom.** Las pruebas no comparan trazados SVG: comprueban que el icono esperado está presente (por su nombre) y, sobre todo, el texto y los atributos accesibles del control. A comprobar que la librería pinta en jsdom sin errores y sin `zone.js`; si no, las pruebas de componentes sustituyen el icono por un doble.
- **Dependencias entre pares.** `@ng-icons/core` pide `@schematics/angular` y `@angular-devkit/schematics` `>=22`. El proyecto no los declara, pero llegan con `@angular/cli`. A comprobar que `npm install` no informa de conflicto; no se añade ningún paquete más que los dos de iconos.

**Iconos de este change** (nombre de Phosphor; cada uno en contorno y, donde se indica, en relleno; todos «a comprobar al implementar» que existen con ese nombre en el paquete):

| Uso | Icono | Pesos |
|---|---|---|
| Destino Salud | `heartbeat` | Contorno y relleno |
| Destino Nutrición | `fork-knife` | Contorno y relleno |
| Destino Entrenamiento | `barbell` | Contorno y relleno |
| Destino Progreso | `chart-bar` | Contorno y relleno |
| Destino Perfil | `user-circle` | Contorno y relleno |
| Indicador del selector compacto | `caret-down` | Contorno |
| Estado de error | `warning-circle` | Contorno |
| Estado de carga | `circle-notch` | Contorno |

Trece en total. Quedan anotados para los componentes aplazados y para `water-statistics`, sin importarse aquí: `caret-right` (fila de lista), `arrow-left` (volver), `check` (completado), `x` (cerrar), `plus`, `trash` y `dots-three`.

### 9. Armazón: barra flotante, cabecera y pantallas anchas

**Modelo de desplazamiento: no cambia.** El armazón sigue ocupando `100dvh` y el contenido sigue siendo el contenedor que se desplaza. La barra deja de ser una fila de la rejilla y pasa a superponerse al borde inferior del armazón.

**Barra flotante en móvil (menos de 768 px).**

- *Posición y forma.* Anclada abajo, separada `--space-3` de los lados y del borde inferior, con forma de píldora, superficie `--color-surface`, borde sutil y `--shadow-floating`. Altura de 4rem.
- *Zonas seguras.* La separación inferior suma `env(safe-area-inset-bottom)`, y las laterales, sus `env()` correspondientes. Para que esos valores no sean cero en un iPhone, `viewport` añade `viewport-fit=cover`; a cambio, la cabecera suma `env(safe-area-inset-top)` a su relleno.
- *El contenido no queda tapado.* El contenedor que se desplaza reserva al final un relleno igual a la altura de la barra más sus separaciones y la zona segura, calculado a partir de las mismas variables que la barra, de modo que no puedan desajustarse. Declara además el mismo valor como margen de desplazamiento inferior, para que un campo enfocado no quede detrás de la barra.
- *Teclado en pantalla.* No se añade código. La barra está anclada al armazón, que mide `100dvh`, y el teclado no cambia esa medida ni en iOS ni en Chrome para Android (comportamiento por defecto; a comprobar en un dispositivo o emulador): el teclado tapa la barra en lugar de empujarla sobre el campo. Si en la comprobación la barra flotara sobre el teclado, se informa a la autora antes de añadir nada.
- *Destinos.* Cinco, de igual anchura (a 375 px, unos 68 px cada uno; a 320 px, unos 57 px), con una zona táctil mínima de 44 por 44 px, sin solaparse. Cada uno es un enlace con el icono encima y la etiqueta debajo (`text-nav`).
- *Etiqueta corta.* Los destinos y su presentación (ruta, par de iconos y, opcionalmente, etiqueta corta) se declaran en una lista dentro de `home/`. La etiqueta de un destino es su etiqueta corta si la tiene y, si no, el `title` de su ruta, que no se duplica. Solo Entrenamiento lleva etiqueta corta, «Entreno». El nombre accesible del enlace es su texto visible, sin `aria-label` ni texto oculto: «Entreno» se anuncia como se ve, lo que cumple el criterio «etiqueta en el nombre» (WCAG 2.5.3) y permite a quien usa control por voz decir lo que lee. El nombre completo, «Entrenamiento», aparece en el título de la vista. Una prueba comprueba que cada destino de la lista corresponde a una ruta hija con título.
- *Destino activo.* Se distingue por cuatro cosas a la vez: icono relleno en lugar de contorno, píldora de fondo `--color-accent-soft`, color `--color-accent-strong` y mayor peso de la etiqueta; para las tecnologías de apoyo, `aria-current="page"`. En escala de grises siguen distinguiéndolo la píldora y el relleno del icono. Los destinos en reposo usan `--color-text-secondary` (7,13:1 y 7,54:1 sobre la barra).
- *Rutas hijas.* Se conserva la coincidencia por prefijo de `routerLinkActive`, así que una vista interior (`/nutricion/…`) mantiene activo su destino. Como hoy ninguna sección tiene rutas hijas, lo cubre una prueba con una configuración de rutas propia de la prueba.
- *Cambio de icono sin depender de la detección de cambios.* Cada enlace contiene sus dos iconos y es el CSS, a partir de la clase de activo, el que muestra uno u otro. Se evita así leer el estado de `routerLinkActive` desde la plantilla, cuyo refresco sin `zone.js` habría que comprobar.

**Pantallas anchas (768 px o más): la navegación se queda en la cabecera.** Misma lista y mismo componente; cambia la disposición: la píldora de navegación se coloca a la derecha del título, con icono y etiqueta en horizontal, sin sombra y sin superponerse al contenido (que ya no reserva relleno inferior). La etiqueta sigue siendo «Entreno» en todos los anchos, para tener un único texto en el marcado. El contenido se centra con un ancho máximo de 45rem, para que las tarjetas no se estiren a 1280 px.

*Alternativa descartada:* barra lateral. Es el patrón habitual de escritorio, pero obligaría a diseñar una segunda disposición del armazón para una aplicación pensada para móvil y de una sola columna, y `water-statistics` ya tiene escritas sus verificaciones con «la navegación en la cabecera» a 1280 px. Si algún día se quiere, es un cambio local a `home/`.

**Cabecera.** Muestra el título de la vista (`h1`, `text-title-page`), que sigue saliendo del `title` de la ruta; ese cálculo no se toca (lo cambiará `water-statistics` para las rutas hijas). No tiene controles. Su rejilla deja una zona inicial, hoy vacía y sin anchura, donde un change posterior podrá colocar un botón de volver sin rehacer la cabecera; no se crea ninguna entrada, proyección ni componente para ello, porque `water-statistics` ha decidido que su enlace de vuelta vaya en el contenido de la página.

**Relleno de página.** El margen lateral y la separación superior pasan del SCSS de cada página al contenedor de contenido del armazón, para que todas las vistas tengan los mismos márgenes. Las páginas solo definen la separación entre sus bloques.

### 10. Botón: componente con selector de atributo sobre elementos nativos

`ButtonComponent`, en `shared/components/button/`, con selector de atributo sobre `<button>` y `<a>` (`appButton`). Su plantilla solo proyecta el contenido.

- **Por qué sobre el elemento nativo.** Se conservan sin código propio el tipo de botón, el envío de formularios, `disabled`, el foco, el teclado y, en un enlace, `routerLink` y `href`. Las pruebas actuales siguen encontrando `button`.
- **Por qué componente y no directiva o clase global.** Una directiva no puede llevar estilos, así que obligaría a mantener la clase global `.button`; un componente de atributo encapsula sus estilos en el anfitrión y deja sitio para pintar el indicador de carga cuando se construya.
- **Entradas.** La variante, como valor del propio atributo: `primary` (por defecto), `secondary` o `danger`. Y `iconOnly`, booleana.
- **Variantes.** *Principal*: relleno `--color-accent`, texto `--color-on-accent`. *Secundario*: relleno `--color-surface-raised`, texto `--color-text`, borde `--color-border-strong`. *Peligro*: relleno `--color-danger-fill`, texto `--color-on-danger`. *Solo icono*: circular, de 44 px, combinable con cualquiera de las tres. Todas con forma de píldora, altura mínima `--size-touch` y `text-body` en peso medio.
- **Estados.** Reposo, `hover` y pulsado (decisión 1), foco (anillo global) y deshabilitado: relleno `--color-surface-raised`, texto `--color-text-disabled`, sin borde y sin cambio al pasar el puntero. En `<button>`, con el atributo nativo `disabled`; en `<a>`, con `aria-disabled`.
- **Accesibilidad.** El nombre accesible es el texto proyectado. En un botón de solo icono es obligatorio un `aria-label`: en modo de desarrollo, el componente avisa por consola si falta.
- **Pruebas.** Clase de cada variante; variante por defecto; `iconOnly`; que el contenido proyectado y los atributos nativos (`type`, `disabled`) se conservan; y que funciona sobre `<a>`.
- **Aplazado:** el estado «cargando» (decisión 12).

### 11. Componentes base que se construyen

Todos en `modules/app-container/shared/components/<nombre>/`, uno por carpeta con sus cuatro archivos, autónomos, con entradas de tipo signal, sin estado propio más allá de lo indicado y sin conocer ninguna sección.

**Tarjeta: `CardComponent` (`app-card`). Sustituye a `section-card`.**

- *Entradas:* `title` (obligatoria) y `subtitle` (opcional).
- *Proyección:* el cuerpo, por defecto; y un hueco con nombre para **un control en la cabecera**, que se coloca a la derecha del título, alineado arriba.
- *Estructura:* una `section` nombrada por su título (`aria-labelledby`), con el título como `h2`, el subtítulo debajo (`text-caption`) y el cuerpo. Desaparece la línea divisoria entre cabecera y cuerpo. Si no hay subtítulo ni control, no queda hueco vacío. A 375 px, el título se parte en varias líneas antes que empujar al control fuera de la tarjeta.
- *Aspecto:* superficie `--color-surface`, borde sutil, `--radius-card`, relleno `--space-4`.
- *Pruebas:* título y contenido proyectado; subtítulo presente y ausente; control proyectado en la cabecera y fuera del cuerpo; la sección queda nombrada por su título.
- *Por qué sustituir y no ampliar `section-card`:* la API crece (subtítulo, hueco) y el nombre actual describe un uso («sección de una página»), no la pieza. Solo la usa una página, así que renombrar cuesta dos pruebas. La sustitución se hace en la fase 4, que termina sin `section-card` en el repositorio.

**Campo de texto: `FieldComponent` (`app-field`) y la directiva `appInput`.**

- *Reparto:* el `<input>` nativo se queda en la plantilla de quien lo usa, marcado con `appInput`, y se proyecta dentro de `app-field`, que aporta la etiqueta, el texto de ayuda y el error. Así el consumidor conserva su referencia al `<input>`, su `type`, su `inputmode` y sus validaciones nativas; el formulario del objetivo, que lee el valor de una referencia de plantilla, no cambia su lógica.
- *Entradas de `app-field`:* `label` (obligatoria), `hint` y `error` (opcionales).
- *Accesibilidad:* `app-field` asocia la etiqueta al campo (genera un identificador si el `<input>` no trae uno) y, cuando hay ayuda o error, los enlaza con `aria-describedby`; con error marca el campo con `aria-invalid`. El error se distingue por texto, y además por el icono y el color de peligro.
- *Aspecto:* etiqueta encima (`text-label`); campo en forma de píldora, relleno `--color-surface-raised`, borde `--color-border-strong` (es lo que lo delimita con 3:1), texto de 16 px, altura mínima `--size-touch`; con error, borde `--color-danger`.
- *Pruebas:* la etiqueta nombra al campo; ayuda y error enlazados; `aria-invalid` solo con error; el `<input>` proyectado sigue siendo el del consumidor.

**Selector compacto: `CompactSelectComponent` (`app-compact-select`).**

- *Qué es:* un `<select>` nativo con aspecto de píldora compacta: el valor elegido y un indicador de desplegable (`caret-down`). Teclado, lector de pantalla y selector nativo del móvil sin código propio.
- *Entradas:* la lista de opciones (valor y texto), el valor seleccionado (enlace de doble sentido) y una etiqueta accesible **obligatoria**, que no se muestra. Es genérico: no conoce periodos ni ningún otro dominio.
- *Aspecto:* relleno `--color-surface-raised`, borde `--color-border-strong`, `text-label`, y la altura mínima de 44 px: la píldora de la referencia es más baja, pero aquí manda la zona táctil. Las opciones llevan su texto completo; este change no define abreviaturas.
- *Pruebas:* pinta las opciones recibidas; marca la seleccionada; emite la elegida; expone la etiqueta como nombre accesible.

**Mensaje de estado: `StatusMessageComponent` (`app-status-message`).** Cubre los tres estados comunes con una sola pieza.

- *Entradas:* `kind` (`loading`, `error` o `empty`) y `retryLabel` (opcional). *Salida:* `retry`. *Proyección:* el texto del mensaje, que pone quien lo usa.
- *Comportamiento:* `loading` pinta el indicador giratorio y el mensaje dentro de un elemento con `role="status"`; `error`, el icono de aviso y el mensaje dentro de un elemento con `role="alert"`, en color de peligro; `empty`, el mensaje en color secundario, sin rol. El botón de reintento solo aparece en `error` y solo si se pasa `retryLabel`; es un botón secundario y queda **fuera** del elemento con `role="alert"`, de modo que el texto del aviso es exactamente el mensaje.
- *Pruebas:* rol y texto de cada tipo; el icono no añade texto; el botón aparece solo con `retryLabel` y en `error`, y emite `retry`.

### 12. Componentes y estados que se documentan y no se construyen

Regla: se construye lo que usan las pantallas actuales y lo que `water-statistics` va a usar. Lo siguiente queda diseñado, para que quien lo necesite lo construya coherente con el resto, en la misma carpeta de componentes compartidos:

| Pieza | Diseño previsto | Por qué se aplaza |
|---|---|---|
| Control segmentado (`app-segmented-control`) | Grupo de botones de opción nativos (`radio`) con un nombre de grupo obligatorio: flechas y foco nativos. Contenedor en píldora con `--color-surface-raised`; el segmento elegido, con `--color-surface`, peso mayor y borde. De dos a cuatro opciones cortas; para más, o en la cabecera de una tarjeta, el selector compacto | No lo usa ninguna pantalla actual, y `water-statistics` lo descarta expresamente para sus periodos |
| Fila de lista (`app-list-row`) | Icono inicial opcional, etiqueta, valor opcional en color secundario y un hueco final para un control o una flecha (`caret-right`). Filas agrupadas dentro de una tarjeta, separadas por `--color-border`. Si la fila entera navega, es un enlace; si contiene un control, no es interactiva. Variante de peligro para una acción destructiva | Es el patrón de las pantallas de ajustes, que llegan con `update-profile` |
| Interruptor (`appSwitch`) | Directiva sobre `<input type="checkbox">` con `role="switch"`; pista con `--color-accent` cuando está activo y `--color-border-strong` cuando no; el estado se distingue además por la posición del mando. Zona táctil de 44 px. Su etiqueta la aporta la fila de lista o un `<label>` | Igual que la fila de lista |
| Botón «cargando» | Entrada `loading`: indicador giratorio en lugar del contenido, `aria-busy`, y el botón no se puede accionar mientras dura, sin perder el foco | Ninguna pantalla lo puede usar: el estado de hidratación no expone si hay un guardado en curso, y añadirlo cambiaría su comportamiento |
| Botón de volver en la cabecera | Botón de solo icono (`arrow-left`) en la zona inicial de la cabecera | `water-statistics` pone su enlace de vuelta en el contenido |

La barra de progreso no está en la propuesta y no se añade: `water-statistics` tiene previsto construir la suya con las variables de este change si no existe.

La autora ha aceptado este aplazamiento: el control segmentado, la fila de lista y el interruptor se construirán con la primera pantalla que los necesite, y la propuesta los enumera ya como aplazados.

### 13. Migración de las pantallas existentes

Ni el comportamiento, ni los textos, ni las peticiones cambian. Ningún servicio de estado ni de acceso a datos se toca.

| Pieza | Qué cambia |
|---|---|
| `styles.scss`, `index.html`, `angular.json` | Decisiones 2 y 7. `.startup-error` se conserva, con `--color-danger` |
| `home/` | Plantilla y estilos nuevos de la cabecera y la barra (decisión 9); lista de destinos con sus iconos; registro de los diez iconos. La lógica del título no cambia |
| Las cinco páginas | Pierden su relleno propio, que pasa al armazón. Las cuatro vacías siguen vacías |
| `nutrition-page` | Dos `app-card` con los mismos títulos, en el mismo orden y con el mismo contenido |
| `water-goal-section` | «Cargando…» y «Error: …» pasan a `app-status-message`; etiqueta y campo, a `app-field` con `appInput`; «Guardar objetivo», a botón principal. El texto del objetivo actual usa los estilos de texto con nombre |
| `water-quick-log` | Los tres botones pasan a botón **secundario**: la vista queda con una sola acción principal (Open Questions) |
| `water-history-section` | «Cargando…» y «Error: …» pasan a `app-status-message`. La lista conserva su marcado (`ul` y `li`), con la fecha como texto principal y el total en secundario, y filas separadas por `--color-border`. El historial vacío sigue sin mensaje |
| `section-card` | Se elimina, con su prueba |
| Clase global `.button` | Se elimina al terminar la migración, cuando ya nadie la usa |

No se muestra ningún error nuevo: el formulario del objetivo sigue ignorando en silencio un valor no válido, y la entrada `error` de `app-field` no se usa en él.

### 14. Pruebas afectadas

| Prueba | Efecto | Adaptación |
|---|---|---|
| `home.component.spec.ts` | La comparación de etiquetas espera «Entrenamiento» | Pasa a esperar «Entreno», y se comprueba que ningún enlace lleva `aria-label`, de modo que su nombre accesible es el texto visible. Se añaden: cinco destinos con icono; el activo muestra el icono relleno y `aria-current`; en `/entrenamiento` el título es «Entrenamiento»; una vista interior mantiene activo su destino (con rutas propias de la prueba) |
| `nutrition-page.component.spec.ts` | Busca `app-section-card` | Cambia el selector a `app-card`. Las demás comprobaciones no cambian |
| `section-card.component.spec.ts` | Se elimina con el componente | La sustituye `card.component.spec.ts` |
| `water-goal-section.component.spec.ts` | Debe pasar sin cambios | Es la red de seguridad de la migración: etiqueta, primer botón, roles y texto exacto del aviso. Si hay que tocarla, es una señal de que cambió el comportamiento |
| `water-history-section.component.spec.ts` | Debe pasar sin cambios | Ídem: texto de las filas, lista vacía sin ningún texto, roles |
| `water-quick-log.component.spec.ts` | Debe pasar sin cambios | |
| `app.routes.spec.ts`, `app.component.spec.ts`, `water-tracking-state.service.spec.ts`, pruebas de `services/` y de `shared/config/`, y las de las cuatro páginas vacías | No afectadas | |

Pruebas nuevas: `theme.service.spec.ts` (preferencia, tema efectivo con y sin `matchMedia`, cambio del sistema, `revision` al cambiar cada atributo, los dos métodos), las de los cinco componentes base (decisiones 10 y 11) y una de humo del catálogo.

Lo que las pruebas no cubren: jsdom no calcula variables CSS, consultas de medios ni disposición. Colores, temas, tamaños táctiles y solapamientos se comprueban en el navegador (decisión 16).

### 15. Lo que espera `water-statistics` y cómo se cumple

Leído de su `design.md` y su `tasks.md` en `origin/feature/water-statistics`.

| Expectativa | Cómo se cumple |
|---|---|
| Ningún color literal: todo de variables, también en los gráficos | Variables por papel de la decisión 1 |
| Serie (color de acento) | `--color-accent-strong` |
| Serie atenuada | `--color-accent-muted` |
| Referencia del objetivo | `--color-warning` (3:1 o más frente a la tarjeta; ver el límite de la decisión 3) |
| Ejes y líneas de la rejilla | `--color-border` |
| Texto de los gráficos | `--color-text-secondary`; `--color-text` para valores |
| Fondo de la descripción emergente | `--color-surface-raised`, con texto `--color-text` (14,48:1 y 13,44:1) |
| Calendario: cumplido, parcial, con registro sin objetivo, sin registro | `--color-accent-strong`, `--color-accent-muted`, `--color-data-neutral`, y `--color-surface-raised` con borde `--color-border` |
| «Cumplido» a 3:1 o más de cada uno de los otros tres estados, en ambos temas | Calculado: 3,37 · 3,25 · 4,79 en claro y 5,01 · 4,04 · 6,85 en oscuro |
| Los otros tres estados del calendario, distinguibles entre sí | **No por el color solo** (entre 1,04 y 1,70): cada uno necesita una marca, una trama o un borde propios, sobre todo en el tema claro (límites de la decisión 3) |
| Línea de objetivo distinguible de las barras | **No por luminancia** (1,09 y 1,08 frente al acento legible): debe ir discontinua (límites de la decisión 3) |
| Animación de hidratación y de los gráficos | Variables `--duration-*` y `--ease-*` y la regla de movimiento reducido (decisión 6). Lo animado desde TypeScript debe consultar `prefers-reduced-motion` por su cuenta |
| Si a un papel no le corresponde ninguna variable, se resuelve con la autora | Todos los papeles que enumera tienen variable |
| Tarjeta con título, subtítulo y un control en la cabecera | `app-card` (decisión 11) |
| Selector compacto equivalente a su `period-selector` | `app-compact-select`, con la misma forma que describe: opciones, valor, etiqueta accesible obligatoria, `<select>` nativo. Su tarea 5.2 no necesita crear el suyo |
| Estados de carga, error con «Reintentar» y vacío | `app-status-message` |
| Botones y enlaces base | `appButton` |
| Barra de progreso, «si la aporta» | No se aporta; construye la suya con `--color-accent` y `--color-surface-raised` (4,79 y 3,10 entre relleno y pista) |
| Aviso de cambio de tema o de acento, para repintar | `ThemeService.revision` (decisión 5); sustituye a su observador por defecto |
| Cambiar el acento desde las herramientas del navegador repinta la serie | El servicio observa el `style` y `data-accent` de la raíz. La prueba debe cambiar `--accent` en el estilo en línea de `<html>`; editar la regla de la hoja de estilos no dispara ningún aviso |
| Cambiar de tema con «el mecanismo que aporte `ui-foundation`» | `data-theme` en `<html>`, `ThemeService.setPreference` o la emulación de `prefers-color-scheme` |
| Formato del color calculado que entienda ECharts | **No garantizado.** Los papeles derivados del acento son `color-mix()`, y un navegador puede devolver su valor calculado como `color(srgb …)` en lugar de `rgb(…)`. Está entre sus puntos «a comprobar» de la fase 4; si ECharts no lo entiende, su helper debe normalizar el color (por ejemplo, pintándolo en un lienzo y leyendo el píxel). Este change no cambia el mecanismo por ello |
| Destino activo también en `/nutricion/hidratacion`, único, en la barra y en la cabecera | Decisión 9 |
| Cabecera con solo el título; su cálculo lo cambia él | La cabecera no añade controles y el cálculo del título no se toca |
| Abreviar el periodo («30D») si este change define una forma abreviada | No se define: las opciones llevan el texto completo |
| Comprueba que este change está fusionado con: un directorio `openspec/changes/archive/*-ui-foundation`, que `openspec list` no lo muestre activo y que `CLAUDE.md` describa los temas y las variables de color | Las fases 5 y 6 del Migration Plan dejan las tres cosas: la 5 añade a `CLAUDE.md` un apartado «Base visual» que nombra los temas (`data-theme`, `ThemeService`) y las variables de color por papel |
| Lee el design y las specs archivados para anotar nombres de variables, mecanismo de tema y componentes | Decisiones 1, 2, 5, 10 y 11 de este documento, y `CLAUDE.md` |

### 16. Verificación

Se documenta en `openspec/changes/ui-foundation/verification.md`, que crea la fase 1 con la referencia previa y completa la fase 5.

1. **Referencia previa (fase 1, antes de tocar nada):** número de pruebas que pasan, resultado de `npx ng lint`, y tamaños de `npm run build` (paquete inicial, estilos globales, cada trozo diferido).
2. **Automática, al cerrar cada fase:** `npm test -- --watch=false`, `npx ng lint` y `npm run build` sin avisos de presupuesto, con los tamaños anotados junto a los de la referencia.
3. **Búsquedas, al cerrar las fases 1 y 4:** ninguna referencia a las once variables antiguas; ningún color literal (hexadecimal, `rgb()`, `hsl()` o nombre) fuera de `_tokens.scss` y de las dos etiquetas `theme-color`; tras la fase 4, ningún uso de `.button` ni de `section-card`.
4. **Visual, en el navegador:** siempre primero a 375 px de ancho y después a 1280 px, y en ambos temas emulando `prefers-color-scheme`. Se revisan las cinco secciones, Nutrición con datos reales, y cada componente base en todos sus estados desde el catálogo. En cada combinación: nada conserva el aspecto del otro tema, no hay desplazamiento horizontal, la barra no tapa el final del contenido y el destino activo se distingue. Además: cambio del tema del sistema con la aplicación abierta sin recargar; `data-theme` forzado en ambos sentidos; un valor distinto de `--accent` (uno de los ejemplos validados de la decisión 4) en el estilo en línea de la raíz, para ver que cambian a la vez todos los elementos acentuados; y la emulación de `prefers-reduced-motion: reduce`, para ver que las transiciones pasan a ser instantáneas y el indicador de carga no gira.
5. **Contraste:** la tabla de la decisión 3 es la referencia. En el navegador se leen los colores calculados de los cuatro papeles derivados del acento, en ambos temas, y se comparan con los valores de la tabla, para confirmar que la mezcla da lo calculado, y se recalcula cada par de la tabla con los valores realmente implementados; se anota además el formato en que el navegador los devuelve.
6. **Teclado y zonas táctiles:** recorrido con el tabulador de cada vista y del catálogo, con el anillo de foco visible en ambos temas; medida de la zona táctil de los cinco destinos a 375 px y de un botón de solo icono (44 por 44 px, sin solaparse).
7. **Contra la API real:** con el backend en marcha, entrar en Nutrición lanza las mismas dos lecturas que antes (objetivo e historial) y muestra los mismos datos. Solo lectura. Un registro de agua con un toque se hace únicamente si la autora lo aprueba, porque escribe en la base de datos real; no se cambia el objetivo.
8. **Límites:** un único navegador de escritorio emulando el móvil, salvo que la autora lo pruebe en un teléfono; el comportamiento con el teclado en pantalla y las zonas seguras solo se puede comprobar de verdad en un dispositivo o un simulador.

**Catálogo de componentes: se construye.** Una página interna, `modules/app-container/catalog/`, en la ruta `/catalogo`, hija del armazón pero fuera de la lista de destinos. Muestra cada componente base en todas sus variantes y estados, con datos fijos, y tres botones para forzar el tema con `ThemeService`.

- *Por qué:* tres de los cinco componentes base tienen variantes que ninguna pantalla actual muestra (el control en la cabecera de la tarjeta, el selector compacto, el mensaje de vacío y el de error con reintento, el botón de peligro y el de solo icono). Sin una página que los pinte no se pueden revisar a 375 px ni en ambos temas, y `water-statistics` los recibiría sin haberse visto nunca.
- *Coste:* una página con su prueba de humo y una ruta; es diferida, así que no pesa en el paquete inicial. Hay que mantenerla al añadir componentes.
- *Solo en desarrollo:* la ruta se declara únicamente en modo de desarrollo. A comprobar en la fase 3 que el build de producción no incluye su trozo; si lo incluyera, se informa a la autora (Open Questions).
- *Alternativa descartada:* Storybook u otra herramienta. Es una dependencia y una configuración de build nuevas para cinco componentes.
- *Alternativa descartada:* un montaje desechable que no se confirma. Habría que rehacerlo en cada change que añada un componente base.

## Risks / Trade-offs

- [Nada de `ng-icons` se ha ejecutado: puede no pintar sin `zone.js` o en jsdom, o un icono puede no existir con el nombre propuesto] → La fase 2 empieza resolviendo cada punto «a comprobar» de la decisión 8 antes de rediseñar el armazón; si un nombre no existe se elige el equivalente más cercano y se anota; si la librería no funciona, se para y se decide con la autora.
- [`color-mix()` devuelve colores calculados en un formato que ECharts puede no entender] → Se anota el formato real en la fase 1 (paso 5 de la decisión 16) para que `water-statistics` lo sepa antes de empezar; la normalización es de su helper (decisión 15).
- [Con otro acento, el contraste deja de estar garantizado] → Lista cerrada de acentos validados y criterio de entrada (decisión 4). Queda sin proteger el cambio manual de `--accent` desde las herramientas del navegador, que es solo una vía de verificación.
- [La ventana de contraste del relleno de acento en el tema oscuro es estrecha (4,80:1 con el texto, 3,10:1 frente a la superficie elevada)] → Los porcentajes de mezcla y los neutros del tema oscuro no se retocan sin recalcular la tabla; lo recuerda un comentario en `_tokens.scss`.
- [`--color-surface` cambia de significado respecto al nombre actual] → Renombrado completo en una sola fase, con búsqueda de cierre (decisión 1).
- [Los valores de color se han elegido por cálculo, sin verlos] → La fase 1 termina con una revisión visual de la autora; puede ajustar tonos siempre que la tabla de contraste se recalcule y siga cumpliendo.
- [El presupuesto de estilos por componente (4 kB) puede saltar en `home`] → Extraer la barra a un componente propio dentro de `home/` (decisión 7); no se suben los presupuestos.
- [La barra flotante puede comportarse mal con el teclado en pantalla o con las zonas seguras, y un navegador de escritorio no lo reproduce] → Se declara como límite de la verificación y se pide a la autora una comprobación en su teléfono; no se añade JavaScript preventivo.
- [`viewport-fit=cover` hace que el contenido pueda quedar bajo la muesca si alguna zona olvida su `env()`] → Solo el armazón gestiona las zonas seguras; las páginas viven dentro de su contenedor.
- [Un lector de pantalla anuncia «Entreno», una forma coloquial, en lugar de «Entrenamiento»] → Decisión de la autora, que da prioridad al criterio «etiqueta en el nombre»; el nombre completo se muestra y se anuncia en el título de la vista.
- [Una animación posterior puede olvidar el movimiento reducido] → Las variables de duración valen cero con esa preferencia y hay una regla global de red de seguridad (decisión 6); solo quedan fuera las animaciones hechas desde TypeScript, que cada change debe tratar.
- [Los componentes base nacen con un solo consumidor y su API puede no encajar con el siguiente] → Se mantienen mínimos; `water-statistics` es el segundo consumidor inmediato y sus fases 4 y 5 tienen puntos de comprobación para ello.
- [El catálogo puede acabar en el build de producción] → Comprobación en la fase 3.
- [Instalar dos paquetes modifica `package.json` y su lock] → Lo hace la fase 2, con la aprobación previa de la autora, fijando la versión 36.1.0 exacta.
- [Sin pruebas de regresión visual, un cambio posterior puede romper un tema sin que falle ninguna prueba] → Se acepta; el catálogo y la revisión en ambos temas forman parte de la verificación de cada change de cliente.

## Migration Plan

Cada fase la ejecuta una sesión distinta, que arranca sin contexto y lee `CLAUDE.md`, la propuesta, este documento, el delta de spec y `verification.md`. La sesión orquestadora repite la verificación de cierre de cada fase y es la que hace los commits. Cada fase deja la aplicación funcionando y las pruebas en verde.

| Fase | Contenido | Archivos | Verificación de cierre |
|---|---|---|---|
| 1 | Referencia previa. Variables y temas: parciales de `src/styles/`, tema oscuro, lista de acentos con el índigo, tipografía, espaciado, radios, movimiento (variables y regla de movimiento reducido), foco global. Renombrado mecánico de las once variables antiguas en los estilos existentes, sin cambiar la disposición. `index.html` (`color-scheme`, `theme-color`, `viewport-fit`). `ThemeService` y sus pruebas | `src/styles.scss`, `src/styles/`, `src/index.html`, `angular.json`, `src/app/shared/theme/`, los `.scss` existentes, `verification.md` | Pruebas, lint y build pasan, con tamaños anotados; ninguna referencia a los nombres antiguos; la aplicación actual se ve en ambos temas a 375 px y a 1280 px y cambia con el sistema sin recargar; colores calculados de los papeles de acento comparados con la tabla y su formato anotado; tabla de contraste recalculada con los valores implementados; prueba del acento único con otro valor de `--accent`; revisión visual de la paleta por la autora |
| 2 | Iconos y armazón: instalación de los dos paquetes (con aprobación), puntos «a comprobar» de la decisión 8, barra flotante, cabecera, disposición de pantalla ancha, relleno de página en el armazón; pruebas de `home` | `package.json` y su lock, `modules/app-container/home/`, los `.scss` de las páginas | Pruebas, lint y build pasan; incremento del paquete inicial anotado; los puntos «a comprobar» resueltos y anotados; a 375 px y a 1280 px, en ambos temas: cinco destinos con icono y etiqueta, activo distinguible también en escala de grises, zonas táctiles medidas, el final del contenido de Nutrición no queda tapado, recorrido con teclado |
| 3 | Componentes base (tarjeta, botón, campo, selector compacto, mensaje de estado) con sus pruebas, y el catálogo | `modules/app-container/shared/components/`, `modules/app-container/catalog/`, `app.routes.ts` | Pruebas, lint y build pasan, sin avisos de presupuesto por componente; el catálogo muestra cada variante y estado a 375 px y a 1280 px en ambos temas; el build de producción no incluye el catálogo |
| 4 | Migración de Nutrición y de los tres componentes de hidratación; eliminación de `section-card` y de la clase `.button`; adaptación de las pruebas de la decisión 14 | `modules/app-container/nutrition/`, `modules/app-container/shared/components/section-card/`, `src/styles/` | Pruebas, lint y build pasan; las tres pruebas de hidratación pasan sin haberse modificado; búsquedas del paso 3 de la decisión 16; Nutrición con datos reales en ambos temas y ambos anchos, con las mismas dos lecturas a la API |
| 5 | Verificación completa (decisión 16) y documentación: `verification.md`, y `CLAUDE.md` y `README.md` con los temas, las variables por papel, la regla del acento único, los iconos, los componentes base, el catálogo, el movimiento y `ThemeService` | `verification.md`, `CLAUDE.md`, `README.md` | Cada escenario del delta de spec comprobado en el navegador o cubierto por una prueba, indicando cuál; tamaños finales frente a la referencia; `openspec validate --all --strict` pasa |
| 6 | Cierre: archivado del change, que crea `openspec/specs/app-shell/spec.md`; actualización de la lista de changes y de capabilities de `CLAUDE.md` | `openspec/`, `CLAUDE.md` | Existe `openspec/changes/archive/<fecha>-ui-foundation/`; `openspec list` no lo muestra; `openspec validate --all --strict` pasa |

- Orden estricto: cada fase depende de la anterior. La fase 3 podría adelantarse a la 2 (no usa el armazón, salvo para alojar el catálogo), pero no se gana nada.
- **Reversión.** No hay datos ni API afectados: revertir es revertir los commits de la fase. Las fases 1 a 3 son aditivas respecto al comportamiento; la 4 es la única que modifica pantallas con contenido.
- **Dependencia hacia `water-statistics`.** Sus fases de cliente no empiezan hasta que la fase 6 de este change esté cerrada y fusionada en su rama.

## Open Questions

Cada una con el valor que se aplica si no se decide otra cosa.

1. **¿Los tres botones de registro rápido, secundarios o principales?** Por defecto: secundarios, para dejar una sola acción principal por vista. Se decide viendo la pantalla en la fase 4.
2. **¿El catálogo, también en producción?** Por defecto: solo en desarrollo.
3. **¿Mensaje de «sin contenido» en las cuatro páginas vacías y en el historial vacío?** Por defecto: no; no se añaden textos en este change.
4. **¿Etiqueta completa «Entrenamiento» en la navegación de pantalla ancha, donde cabe?** Por defecto: «Entreno» en todos los anchos.
5. **¿Comprobación automática del contraste al añadir un acento?** Por defecto: no en este change; el cálculo se repite a mano y se anota. Corresponde al change que construya el selector.
6. **¿El índigo exacto de la referencia también en el tema oscuro?** Por defecto: no; en oscuro el relleno es el índigo aclarado un 8 % (`#6564d9`), que cumple AA sobre las tres superficies. La alternativa y su coste están en la decisión 3.

Cerradas por la autora, y ya incorporadas al documento: el acento es el índigo de la referencia y no el morado heredado (decisiones 3 y 4); el control segmentado, la fila de lista y el interruptor quedan aplazados (decisión 12); la etiqueta «Entreno» es también el nombre accesible del destino (decisión 9).
