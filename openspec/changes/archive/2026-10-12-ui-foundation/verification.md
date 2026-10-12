# Verification

## Referencia previa

Tomada antes de crear o modificar ningún archivo del cliente (`git status --short kora-health-client` vacío).

- **Fecha:** 2026-10-12
- **Node:** v24.21.0 (instalado con nvm para esta verificación: la versión activa hasta entonces, v24.12.0, no cumple el mínimo de Angular 22, `^24.15.0`, y el CLI se negaba a arrancar)
- **Pruebas (`npm test -- --watch=false`):** 16 archivos de prueba y 49 pruebas, todas en verde
- **Lint (`npx ng lint`):** `All files pass linting.`
- **Build (`npm run build`):**

| Trozo | Nombre | Sin comprimir | Transferido |
|---|---|---|---|
| Inicial | `main` | 256.99 kB | 69.69 kB |
| Inicial | `styles` | 1.07 kB | 442 bytes |
| Inicial | **Total inicial** | 258.06 kB | 70.13 kB |
| Diferido | `nutrition-page-component` | 8.79 kB | 2.55 kB |
| Diferido | `workouts-page-component` | 249 bytes | 249 bytes |
| Diferido | `progress-page-component` | 249 bytes | 249 bytes |
| Diferido | `profile-page-component` | 247 bytes | 247 bytes |
| Diferido | `health-page-component` | 245 bytes | 245 bytes |

Sin avisos de presupuesto.

### Pantallas actuales (375 px, tema claro, API real, solo lectura)

Método de verificación visual de todo el change: la ventana de Chrome (154) de esta máquina no se puede redimensionar desde la sesión (`innerWidth` sigue en 2048), así que la aplicación se carga en un `<iframe>` del mismo origen con el ancho exacto (375 o 1280 px). El tema del sistema se emula con la propiedad `color-scheme` del `<iframe>`: dentro del marco, `prefers-color-scheme` sigue el `color-scheme` usado del elemento que lo contiene, y cambia en vivo sin recargar (comprobado: `matchMedia('(prefers-color-scheme: dark)').matches` pasa de `false` a `true` al cambiarlo).

| Sección | `h1` | Destino actual (`aria-current`) | Contenido de `main` |
|---|---|---|---|
| `/salud` | Salud | Salud | vacío |
| `/nutricion` | Nutrición | Nutrición | ver abajo |
| `/entrenamiento` | Entrenamiento | Entrenamiento | vacío |
| `/progreso` | Progreso | Progreso | vacío |
| `/perfil` | Perfil | Perfil | vacío |

En todas: una navegación `aria-label="Secciones"` con cinco enlaces de texto, «Salud», «Nutrición», «Entrenamiento», «Progreso», «Perfil», en una barra inferior; sin desplazamiento horizontal.

Nutrición, texto literal de `main` (`innerText`):

```
Hidratación

Objetivo actual: 2750 ml

Nuevo objetivo (ml)
Guardar objetivo
Historial de hidratación
+100 ml
+250 ml
+500 ml
2026-10-11
1050 ml / 2750 ml
2026-10-10
850 ml / 2750 ml
```

Botones: «Guardar objetivo», «+100 ml», «+250 ml», «+500 ml» (los tres de registro rápido dentro de un `role="group"`, en la tarjeta del historial). Aspecto: tarjetas moradas claras con línea divisoria bajo el título, botones morados en píldora, campo blanco con borde gris.

Peticiones a la API al entrar en Nutrición (Resource Timing del marco), exactamente dos:

1. `GET http://localhost:5001/api/water-tracking/goal` → `{"dailyGoalMl":2750,"dateUpdated":"2026-10-10T22:03:07.938259Z"}`
2. `GET http://localhost:5001/api/water-tracking/history?days=30` → `[{"date":"2026-10-11","totalMl":1050,"goalMl":2750},{"date":"2026-10-10","totalMl":850,"goalMl":2750}]`

No se pulsó ningún botón. Al arrancar, la API informó `No migrations were applied. The database is already up to date.`

## Sección 1

### 1.6 Importación de `mixins` (punto «a comprobar» de la decisión 7)

`angular.json` lleva `stylePreprocessorOptions.includePaths: ["src/styles"]` en las opciones de build. `home.component.scss` importa `@use 'mixins';` y sustituye su consulta de pantalla ancha por `@include mixins.wide`. Resuelven la importación tanto `npm run build` como `npm test -- --watch=false` (el builder `@angular/build:unit-test` hereda las opciones de build). **Queda la vía de `includePaths`**; no hacen falta rutas relativas.

### 1.8 `index.html`

El HTML servido por `ng serve` contiene `viewport` con `viewport-fit=cover`, `<meta name="color-scheme" content="light dark">` y las dos `theme-color` (`#f6f4f9` con `prefers-color-scheme: light`, `#0e0e11` con `dark`). La aplicación arranca.

### 1.11 `color-mix()` y formato del color calculado (decisión 4)

Navegador: Chrome 154 (`Chrome/154.0.0.0`, Windows). `color-mix()` soportado: los cuatro papeles derivados tienen valor calculado.

**Formato literal** que devuelve `getComputedStyle(el).color` para un color hecho con `color-mix()`: `color(srgb r g b)` con canales en 0–1 y decimales, **no** `rgb(…)`. Los colores escritos en hexadecimal se devuelven como `rgb(r, g, b)`. Lo necesita `water-statistics` (decisión 15): su helper tendrá que normalizar `color(srgb …)` si ECharts no lo entiende.

| Papel | Claro (literal) | Claro (hex) | Design | Oscuro (literal) | Oscuro (hex) | Design |
|---|---|---|---|---|---|---|
| `--color-accent` | `color(srgb 0.345098 0.337255 0.839216)` | `#5856d6` | `#5856d6` | `color(srgb 0.39749 0.390275 0.852078)` | `#6564d9` | `#6564d9` |
| `--color-accent-strong` | `color(srgb 0.345098 0.337255 0.839216)` | `#5856d6` | `#5856d6` | `color(srgb 0.672549 0.668628 0.919608)` | `#ababeb` | `#acaaea` |
| `--color-accent-soft` | `color(srgb 0.921412 0.920471 0.980706)` | `#ebebfa` | `#ebebfa` | `color(srgb 0.161569 0.159843 0.28251)` | `#292948` | `#292948` |
| `--color-accent-muted` | `color(srgb 0.770784 0.768039 0.943725)` | `#c5c4f1` | `#c5c4f1` | `color(srgb 0.215686 0.212157 0.446667)` | `#373672` | `#373672` |

Única diferencia: `--color-accent-strong` oscuro, `#ababeb` frente a `#acaaea`, una unidad por canal (el navegador mezcla sin redondear a 8 bits: 0,6725 × 255 = 171,5). Es redondeo.

### 1.12 Contraste con los valores implementados

Calculado en la consola del navegador (fórmula de luminancia relativa de WCAG 2.1) a partir de los colores calculados que devuelve Chrome en cada tema, sin redondear los canales de las mezclas. No queda ningún script en el repositorio.

| Par | Umbral | Claro design | Claro medido | Oscuro design | Oscuro medido |
|---|---|---|---|---|---|
| Texto / fondo | 4,5 | 15,63 | 15,63 | 17,45 | 17,45 |
| Texto / superficie | 4,5 | 17,07 | 17,07 | 15,38 | 15,38 |
| Texto / superficie elevada | 4,5 | 14,48 | 14,48 | 13,44 | 13,44 |
| Texto / acento suave | 4,5 | 14,47 | 14,44 | 12,63 | 12,65 |
| Texto secundario / fondo | 4,5 | 6,53 | 6,53 | 8,55 | 8,55 |
| Texto secundario / superficie | 4,5 | 7,13 | 7,13 | 7,54 | 7,54 |
| Texto secundario / superficie elevada | 4,5 | 6,05 | 6,05 | 6,59 | 6,59 |
| Texto secundario / acento suave | 4,5 | 6,04 | 6,03 | 6,19 | 6,20 |
| Texto sobre acento / relleno de acento | 4,5 | 5,65 | 5,65 | 4,80 | 4,81 |
| Relleno de acento / fondo | 3 | 5,17 | 5,17 | 4,02 | 4,01 |
| Relleno de acento / superficie | 3 | 5,65 | 5,65 | 3,54 | 3,53 |
| Relleno de acento / superficie elevada | 3 | 4,79 | 4,79 | 3,10 | 3,09 |
| Acento legible / fondo | 4,5 | 5,17 | 5,17 | 8,90 | 8,92 |
| Acento legible / superficie | 4,5 | 5,65 | 5,65 | 7,84 | 7,87 |
| Acento legible / superficie elevada | 4,5 | 4,79 | 4,79 | 6,85 | 6,88 |
| Acento legible / acento suave | 4,5 | 4,79 | 4,78 | 6,44 | 6,47 |
| Anillo de foco / fondo | 3 | 5,17 | 5,17 | 8,90 | 8,92 |
| Anillo de foco / superficie | 3 | 5,65 | 5,65 | 7,84 | 7,87 |
| Anillo de foco / superficie elevada | 3 | 4,79 | 4,79 | 6,85 | 6,88 |
| Borde de control / fondo | 3 | 3,65 | 3,65 | 4,60 | 4,60 |
| Borde de control / superficie | 3 | 3,99 | 3,99 | 4,05 | 4,05 |
| Borde de control / superficie elevada | 3 | 3,39 | 3,39 | 3,54 | 3,54 |
| Éxito / fondo | 4,5 | 5,34 | 5,34 | 9,95 | 9,95 |
| Éxito / superficie | 4,5 | 5,83 | 5,83 | 8,77 | 8,77 |
| Éxito / superficie elevada | 4,5 | 4,95 | 4,95 | 7,66 | 7,66 |
| Aviso / fondo | 4,5 | 5,61 | 5,61 | 9,63 | 9,63 |
| Aviso / superficie | 4,5 | 6,13 | 6,13 | 8,48 | 8,48 |
| Aviso / superficie elevada | 4,5 | 5,20 | 5,20 | 7,42 | 7,42 |
| Peligro / fondo | 4,5 | 5,98 | 5,98 | 7,57 | 7,57 |
| Peligro / superficie | 4,5 | 6,54 | 6,54 | 6,67 | 6,67 |
| Peligro / superficie elevada | 4,5 | 5,54 | 5,54 | 5,83 | 5,83 |
| Texto sobre peligro / relleno de peligro | 4,5 | 6,54 | 6,54 | 4,81 | 4,81 |
| Texto sobre éxito / relleno de éxito | 4,5 | 5,83 | 5,83 | 4,78 | 4,78 |
| Relleno de peligro / superficie | 3 | 6,54 | 6,54 | 3,53 | 3,53 |
| Relleno de éxito / superficie | 3 | 5,83 | 5,83 | 3,56 | 3,56 |
| Acento legible / acento atenuado | 3 | 3,37 | 3,37 | 5,01 | 5,03 |
| Acento legible / dato neutro | 3 | 3,25 | 3,25 | 4,04 | 4,05 |
| Acento legible / celda vacía (superficie elevada) | 3 | 4,79 | 4,79 | 6,85 | 6,88 |
| Línea de objetivo (aviso) / superficie | 3 | 6,13 | 6,13 | 8,48 | 8,48 |

Todos los pares cumplen su umbral en ambos temas. La mayor diferencia con el design es de 0,03 (centésimas, por la mezcla sin redondear). El par más justo es relleno de acento / superficie elevada en oscuro: 3,09.

### 1.13 Acento único

Nutrición a 375 px, sin modificar ningún archivo. Elementos acentuados presentes: el fondo de «Guardar objetivo» y de los tres botones de registro rápido (todavía la clase `.button`), el fondo, el texto y el borde del destino activo, y el anillo de foco de un control enfocado con el tabulador (`:focus-visible` real, enlace «Salud»).

| Elemento | Claro, índigo | Claro, `--accent: #3264c8` | Oscuro, índigo | Oscuro, `#3264c8` |
|---|---|---|---|---|
| Fondo de los cuatro botones | `#5856d6` | `#3264c8` | `#6564d9` | `#4270cc` |
| Fondo del destino activo | `#ebebfa` | `#e6ecf8` | `#292948` | `#212c45` |
| Texto y borde del destino activo | `#5856d6` | `#3264c8` | `#ababeb` | `#98b1e4` |
| Anillo de foco | `#5856d6` | `#3264c8` | `#ababeb` | `#98b1e4` |

Con `--accent: #3264c8` en el estilo en línea de `<html>` todos cambian a la vez al azul y sus derivados, en ambos temas, y ninguno conserva el índigo. Al quitar el estilo en línea, todos vuelven a los valores de la primera columna de su tema. `git status --short` no muestra ningún archivo modificado por la prueba.

### 1.14 Movimiento reducido

**No verificado en el navegador**: la sesión no puede emular `prefers-reduced-motion` (sin acceso a las DevTools; el truco del `<iframe>` solo sirve para `prefers-color-scheme`). Sin la emulación, `--duration-fast`, `--duration-base` y `--duration-slow` valen `120ms`, `200ms` y `400ms` (leído con `getComputedStyle`). En el CSS generado (`dist/…/styles-*.css`) están las dos reglas:

```
@media (prefers-reduced-motion:reduce){:root{--duration-fast: 0s;--duration-base: 0s;--duration-slow: 0s}}
@media (prefers-reduced-motion:reduce){*,*:before,*:after{animation-duration:.01ms!important;animation-iteration-count:1!important;transition-duration:.01ms!important;scroll-behavior:auto!important}}
```

Queda pendiente para la sección 5 (tarea 5.7), que pedirá comprobarlo en el sistema de la usuaria.

### 1.15 Colores leídos al recibir el aviso de cambio (decisión 5)

`ThemeService` aún no tiene consumidor, así que se escuchó desde la consola. Al cambiar el tema emulado del sistema, en el propio evento `change` de `matchMedia('(prefers-color-scheme: dark)')`, `--color-bg` calculado ya es el del tema nuevo (`#0e0e11`, `rgb(14, 14, 17)`). Con un `MutationObserver` sobre `data-theme`, en cada notificación (`light`, `dark` y quitarlo) `--color-bg` ya es el del tema nuevo. Ninguna lectura devolvió el color antiguo.

### 1.16 Cierre automático

- `npm test -- --watch=false`: 17 archivos y 56 pruebas en verde (antes, 16 y 49; las nuevas son las 7 de `theme.service.spec.ts`).
- `npx ng lint`: `All files pass linting.`
- `npm run build`: sin avisos de presupuesto.

| Trozo | Referencia | Sección 1 |
|---|---|---|
| `main` | 256.99 kB / 69.69 kB | 256.83 kB / 69.66 kB |
| `styles` | 1.07 kB / 442 bytes | 4.55 kB / 1.15 kB |
| Total inicial | 258.06 kB / 70.13 kB | 261.39 kB / 70.81 kB |
| `nutrition-page-component` | 8.79 kB / 2.55 kB | 8.65 kB / 2.51 kB |

- Búsqueda de las once variables antiguas: sin resultados. Los dos usos antiguos de `--color-surface` son ahora `--color-bg` (fondo del `body`) y `--color-surface-raised` (fondo del campo del objetivo).
- Búsqueda de colores literales (incluidos los archivos sin seguimiento): solo `src/styles/_tokens.scss` y las dos `theme-color` de `src/index.html`. Las pruebas de `ThemeService` usan valores de prueba no cromáticos (`forced-background`, `other-accent`) para no romper esta regla.
- `git status --short`: cambios solo bajo `kora-health-client/` y en `openspec/changes/ui-foundation/`; nada en `kora-health-api/`; `package.json` sin cambios.

Nombres propuestos que el design no fija: el valor de `--shadow-floating` (`0 0.25rem 1rem rgb(29 27 32 / 12%)` en claro y `0 0.25rem 1rem rgb(0 0 0 / 50%)` en oscuro), los mixins `wide`, `touch-target` y `control-pill`, y la lista de acentos como mapa de SCSS (`$accents`, con `'indigo'`), de modo que el hexadecimal del índigo se escribe una sola vez.

### 1.17 Cierre visual

A 375 px y a 1280 px, en tema claro y oscuro, las cinco secciones (colores calculados):

| Ancho y tema | Fondo | Cabecera | Texto | Desplazamiento horizontal |
|---|---|---|---|---|
| 375 claro | `#f6f4f9` | `#ffffff` | `#1d1b20` | no, en las cinco |
| 375 oscuro | `#0e0e11` | `#1c1c20` | `#f4f3f7` | no, en las cinco |
| 1280 claro | `#f6f4f9` | `#ffffff` | `#1d1b20` | no |
| 1280 oscuro | `#0e0e11` | `#1c1c20` | `#f4f3f7` | no |

- Nutrición: tarjetas `#ffffff` / `#1c1c20` y campo `#eeebf3` / `#27272d`. El texto de `main` es idéntico al de la «Referencia previa» en ambos temas, y la entrada lanza las mismas dos lecturas (`/api/water-tracking/goal` y `/api/water-tracking/history?days=30`).
- Cambio del tema del sistema con la aplicación abierta en Nutrición: pasa a oscuro sin recargar, sigue en `/nutricion`, los datos de pantalla son los mismos y no hay peticiones nuevas.
- `data-theme="light"` con el sistema en oscuro da fondo `#f6f4f9` y `color-scheme: light`; `data-theme="dark"` con el sistema en claro da fondo `#0e0e11` y `color-scheme: dark`.
- Capturas de Nutrición a 375 px en claro y en oscuro, enseñadas a la usuaria en la conversación.

Paleta presentada a la usuaria para su revisión visual (riesgo «los valores se han elegido por cálculo, sin verlos»).

## Sección 2

### 2.1 Instalación de `ng-icons` (con el visto bueno de la usuaria)

`npm install --save-exact @ng-icons/core@36.1.0 @ng-icons/phosphor-icons@36.1.0`, salida literal:

```
added 2 packages, and audited 409 packages in 4s

120 packages are looking for funding
  run `npm fund` for details

found 0 vulnerabilities
npm warn install-scripts 4 packages have install scripts not yet covered by allowScripts:
npm warn install-scripts   @parcel/watcher@2.6.0 (install: node-gyp rebuild)
npm warn install-scripts   esbuild@0.28.2 (postinstall: node install.js)
npm warn install-scripts   lmdb@3.5.6 (install: node-gyp rebuild)
npm warn install-scripts   msgpackr-extract@3.0.4 (install: node-gyp rebuild)
npm warn install-scripts
npm warn install-scripts Run `npm install-scripts ls` to review, or `npm install-scripts approve <pkg>` to allow.
```

Los avisos de `install-scripts` se refieren a dependencias que ya estaban en el proyecto (`@angular/build` y su cadena), no a los dos paquetes nuevos.

Versiones instaladas: `@ng-icons/core@36.1.0` y `@ng-icons/phosphor-icons@36.1.0`. `package.json` solo añade esas dos líneas, con la versión exacta.

| Paquete | Dependencia entre pares declarada | Resuelta con |
|---|---|---|
| `@ng-icons/core` | `@angular/core >=22.0.0` | 22.2.2 |
| `@ng-icons/core` | `@angular/common >=22.0.0` | 22.2.2 |
| `@ng-icons/core` | `rxjs ^6.5.3 \|\| ^7.4.0` | 7.8.2 |
| `@ng-icons/core` | `@schematics/angular >=22.0.0` | 22.2.2 (llega con `@angular/cli`) |
| `@ng-icons/core` | `@angular-devkit/schematics >=22.0.0` | 22.2.2 (llega con `@angular/cli`) |
| `@ng-icons/phosphor-icons` | `@ng-icons/core ^36.1.0` (dependencia, no par) | 36.1.0 |

`npm ls` termina con código 0, sin `UNMET PEER DEPENDENCY` ni `invalid`.

### 2.2 Puntos «a comprobar» de la decisión 8

- Rutas de importación: contorno en `@ng-icons/phosphor-icons/regular` y relleno en `@ng-icons/phosphor-icons/fill`. El paquete también expone `bold`, `duotone`, `light` y `thin`, que no se usan.
- Nombre exportado: `phosphor<NombreEnPascalCase>` en contorno y `phosphor<NombreEnPascalCase>Fill` en relleno.
- Tamaño: `<ng-icon>` tiene una entrada `size` que escribe la variable `--ng-icon__size` en su estilo; su hoja de estilos usa `width/height: var(--ng-icon__size, 1em)`. Este change no usa la entrada: el SCSS de quien pinta el icono fija `--ng-icon__size: var(--size-icon)` en el elemento, sin píxeles en las plantillas.
- Color: `color: var(--ng-icon__color, currentColor)` dentro de `@layer ng-icon`, y los SVG de Phosphor usan `fill="currentColor"`: hereda el color del texto.
- Accesibilidad: el anfitrión lleva `role="img"` y, si quien lo usa no pone `aria-hidden`, el componente le añade `aria-hidden="true"`. Queda oculto por defecto; no hace falta añadirlo en cada uso.

| Icono de Phosphor | Contorno: nombre exportado | Relleno: nombre exportado |
|---|---|---|
| `heartbeat` | `phosphorHeartbeat` | `phosphorHeartbeatFill` |
| `fork-knife` | `phosphorForkKnife` | `phosphorForkKnifeFill` |
| `barbell` | `phosphorBarbell` | `phosphorBarbellFill` |
| `chart-bar` | `phosphorChartBar` | `phosphorChartBarFill` |
| `user-circle` | `phosphorUserCircle` | `phosphorUserCircleFill` |
| `caret-down` | `phosphorCaretDown` | (no se usa) |
| `warning-circle` | `phosphorWarningCircle` | (no se usa) |
| `circle-notch` | `phosphorCircleNotch` | (no se usa) |

Los trece existen con el nombre previsto; no ha hecho falta ningún sustituto.

### 2.3 `ng-icons` sin `zone.js` y en jsdom

Una prueba temporal (`src/app/ng-icons-probe.spec.ts`, borrada después) pintó `phosphorHeartbeat` y `phosphorHeartbeatFill` registrados en los proveedores de un componente de prueba: cada `<ng-icon>` contiene su `<svg>` y lleva `aria-hidden="true"`, sin errores ni avisos en la salida de Vitest (18 archivos y 57 pruebas en verde). **Las pruebas usan el icono real, sin dobles.** En el navegador, sin `zone.js`, los diez iconos de la navegación se pintan (ver 2.11).

### 2.10 Cierre automático

- `npm test -- --watch=false`: 17 archivos y 60 pruebas en verde (`home.component.spec.ts` pasa de 3 a 7 pruebas; `app.routes.spec.ts` sin cambios y en verde).
- `npx ng lint`: `All files pass linting.`
- `npm run build`: sin avisos de presupuesto.

| Trozo | Referencia | Sección 1 | Sección 2 |
|---|---|---|---|
| `main` | 256.99 kB / 69.69 kB | 256.83 kB / 69.66 kB | 273.51 kB / 74.87 kB |
| `styles` | 1.07 kB / 442 bytes | 4.55 kB / 1.15 kB | 4.55 kB / 1.15 kB |
| Total inicial | 258.06 kB / 70.13 kB | 261.39 kB / 70.81 kB | 278.06 kB / 76.02 kB |
| `nutrition-page-component` | 8.79 kB / 2.55 kB | 8.65 kB / 2.51 kB | 8.66 kB / 2.52 kB |

Incremento del paquete inicial respecto a la sección 1: **+16.67 kB sin comprimir** (+5.21 kB transferidos), entre la librería y los diez iconos. Algo por encima de la estimación del design (10 a 15 kB), y muy lejos de los presupuestos (aviso a 500 kB, error a 1 MB). `home.component.scss` compilado y comprimido mide unos 3.4 kB, por debajo del aviso por componente (4 kB): la barra sigue dentro de `HomeComponent`. Las búsquedas de 1.16 siguen sin resultados.

### 2.11 Cierre visual y de accesibilidad

Nombres propuestos: la lista de destinos vive en `home/home-destinations.ts` (`HOME_DESTINATIONS` y `HOME_ICONS`).

Zonas táctiles de los cinco destinos (`getBoundingClientRect` del enlace), sin solaparse:

| Ancho | Salud | Nutrición | Entreno | Progreso | Perfil |
|---|---|---|---|---|---|
| 375 px | 68.3 × 54.4 | 68.3 × 54.4 | 68.3 × 54.4 | 68.3 × 54.4 | 68.3 × 54.4 |
| 320 px | 57.3 × 54.4 | 57.3 × 54.4 | 57.3 × 54.4 | 57.3 × 54.4 | 57.3 × 54.4 |
| 1280 px | 85.9 × 44.0 | 107.3 × 44.0 | 98.0 × 44.0 | 104.9 × 44.0 | 82.4 × 44.0 |

- 375 px: barra flotante de 351.2 × 64 px, a 12 px de los lados y del borde inferior, en píldora y con sombra. Cinco destinos con icono (24 px) y etiqueta; en el activo solo se ve el icono relleno y en los demás, el de contorno.
- 1280 px: la navegación está en la cabecera, a la derecha del título, con icono (20 px) y etiqueta en horizontal, `position: static` y `box-shadow: none`. El contenido se centra en una columna de 45rem (relleno lateral de 280 px) sin reservar el espacio de la barra (relleno inferior de 32 px).
- Sin desplazamiento horizontal: `scrollWidth` igual a `clientWidth` en el documento y en `main`, a 375, 320 y 1280 px.
- Final del contenido (2.7), con un marco de 375 × 560 para forzar el desplazamiento en Nutrición: `main` reserva 88 px al final, con `scroll-padding-bottom` de 88 px. Desplazado hasta el final, la última tarjeta acaba 12 px por encima de la barra, y `elementFromPoint` en el centro de la última fila devuelve la propia fila, no la barra. `nutrition-page.component.scss` ha perdido su relleno propio.
- Cambio de sección pulsando cada destino (Nutrición, Entreno, Progreso, Perfil, Salud): cada vez cambian la ruta y el título, y un solo destino tiene la clase activa y `aria-current="page"`. En `/entrenamiento` el título es «Entrenamiento» y el destino activo, «Entreno».
- Escala de grises (`filter: grayscale(1)` sobre el marco), en claro y en oscuro: el destino activo se sigue distinguiendo por la píldora, el icono relleno y la etiqueta en negrita.
- Teclado (375 px): el tabulador recorre Salud, Nutrición, Entreno, Progreso y Perfil, cada uno con `:focus-visible` y anillo sólido `#5856d6` en claro y `#ababeb` en oscuro (visto en captura). Entrar sobre «Perfil» navega a `/perfil`.
- Accesibilidad (a 2048 px, en la pestaña sin marco, porque la herramienta no lee dentro de un `<iframe>`): una navegación «Secciones» con una lista de cinco enlaces. Sus textos son «Salud», «Nutrición», «Entreno», «Progreso» y «Perfil»; ninguno lleva `aria-label`, así que el nombre accesible es el texto visible, y el actual lleva `aria-current="page"`. Los dos iconos de cada enlace llevan `role="img"` y `aria-hidden="true"`; la herramienta de lectura los lista igualmente, pero quedan fuera del árbol accesible.

Límite: el comportamiento con el teclado en pantalla y con las zonas seguras solo se puede comprobar en un teléfono o un simulador. Queda pedido a la usuaria.

## Sección 3

Nombres propuestos que el design no fija: el hueco para el control de la cabecera de `app-card` se rellena con el atributo `appCardControl`; la clase de la directiva `appInput` es `InputDirective` (`field/input.directive.ts`); el tipo de las opciones del selector es `CompactSelectOption` (`{ value: string; label: string }`, valor siempre texto); el catálogo es `CatalogPageComponent` (`catalog/catalog-page.component.*`); el bloque BEM del botón es `app-button` (`app-button--primary`, `--secondary`, `--danger`, `--icon-only`) y no `button`, para no chocar con la clase global `.button`, que sigue viva hasta la sección 4, ni con la búsqueda `\.button\b` de 4.6.

Decisiones de implementación que conviene revisar:

- **`--color-shade` en `_tokens.scss`.** El design dice que el `hover` y la pulsación oscurecen el relleno con un 8 % de negro, y a la vez prohíbe colores literales, también `black`, fuera de `_tokens.scss`. La salida es una única variable auxiliar, `--color-shade: #000000`, documentada como «no es un papel», y el mixin `pressed-fill($fill)` de `_mixins.scss`, que hace `color-mix(in srgb, var($fill) 92%, var(--color-shade))`. Los componentes usan el mixin, nunca la variable.
- **`appButton` con selector de atributo**: la regla `@angular-eslint/component-selector` del proyecto solo acepta elementos con prefijo `app`. Se desactiva en esa línea, con un comentario que lo justifica (decisión 10).
- **`app-field` sin encapsulación de estilos** (`ViewEncapsulation.None`): el `<input>` proyectado pertenece a la vista de quien lo usa, y los estilos encapsulados de `app-field` no le llegarían. Todas sus reglas empiezan por `.field`.
- El botón deshabilitado no cambia al pasar el puntero: las reglas de `hover` y pulsación llevan `:not(:disabled, [aria-disabled='true'])`.
- El catálogo se declara con `typeof ngDevMode === 'undefined' || ngDevMode`: en producción Angular define `ngDevMode` como `false`, el optimizador elimina la rama y con ella el `import()` del trozo.
- Fallo encontrado y corregido al revisar el catálogo: el selector compacto (`position: relative`) se pintaba encima de la barra flotante al pasar por debajo. `.home__nav` lleva ahora `z-index: 1`; tras el cambio, `elementFromPoint` sobre el selector, cuando está bajo la barra, devuelve la barra.

### 3.1 a 3.7 Pruebas

`npm test -- --watch=false`: 23 archivos y 83 pruebas en verde. Nuevas: `button.component.spec.ts` (5), `card.component.spec.ts` (4), `field.component.spec.ts` (4), `compact-select.component.spec.ts` (4), `status-message.component.spec.ts` (5) y `catalog-page.component.spec.ts` (1). `app.routes.spec.ts` y las pruebas de `home` pasan sin cambios respecto a la sección 2.

### 3.8 El catálogo no entra en producción

```
npm run build
Get-ChildItem -Recurse dist/kora-health-web/browser -File | Select-String -Pattern 'Catálogo de componentes','catalog-page' -List
```

La búsqueda no devuelve ningún archivo. La lista de trozos diferidos de producción es la misma que en la sección 2 (nutrición y las cuatro páginas vacías), sin `catalog-page-component`. En el servidor de desarrollo, en cambio, el trozo existe (`chunk-…js | catalog-page-component | 63.24 kB`) y `/catalogo` se abre.

### 3.9 Cierre automático

- Pruebas: 83 en verde. Lint: `All files pass linting.`
- Build sin avisos de presupuesto: ningún estilo de componente supera 4 kB.

| Trozo | Referencia | Sección 2 | Sección 3 |
|---|---|---|---|
| `main` | 256.99 kB / 69.69 kB | 273.51 kB / 74.87 kB | 273.52 kB / 74.83 kB |
| `styles` | 1.07 kB / 442 bytes | 4.55 kB / 1.15 kB | 4.58 kB / 1.16 kB |
| Total inicial | 258.06 kB / 70.13 kB | 278.06 kB / 76.02 kB | 278.10 kB / 75.99 kB |
| `nutrition-page-component` | 8.79 kB / 2.55 kB | 8.66 kB / 2.52 kB | 8.66 kB / 2.52 kB |

- Búsqueda de colores literales: solo las dos `theme-color` de `src/index.html`, además de `_tokens.scss`. Búsqueda de las variables antiguas: sin resultados.
- Ningún archivo de `shared/components/` importa de una carpeta de sección.

### 3.10 Cierre visual, en el catálogo

- 375 px y 1280 px, en claro y en oscuro: los nueve bloques del catálogo se ven y se leen, sin desplazamiento horizontal (documento y `main`). Capturas del catálogo a 375 px en oscuro y en claro, enseñadas a la usuaria.
- Tarjeta con título largo: a 375 px el título se parte en siete líneas y el selector queda dentro de la tarjeta (borde derecho del control a 327.2 px, de la tarjeta a 344.0 px); a 1280 px, dos líneas.
- Zonas táctiles: el botón de solo icono mide 44 × 44 px y el selector compacto, 140.8 × 44 px. Todos los botones miden 44 px de alto (Sistema 98, Claro 79, Oscuro 93, Principal 104, Secundario 123, Peligro 92, Deshabilitado 142, Enlace como botón 181 y Reintentar 117 px de ancho).
- Nombres accesibles (etiqueta o texto): «Sistema», «Claro», «Oscuro», «Principal», «Secundario», «Peligro», «Deshabilitado», «Más opciones» (botón de solo icono, `aria-label`), «Enlace como botón», «Periodo» (los dos selectores, `aria-label`), «Normal», «Con ayuda» y «Con error» (campos, por su `<label>`) y «Reintentar».
- Teclado, en oscuro: el tabulador pasa por los catorce controles del catálogo después de los cinco destinos, cada uno con `:focus-visible` y anillo sólido `#ababeb`. «Deshabilitado» queda fuera del recorrido, como corresponde.
- Botones de tema del catálogo (`ThemeService.setPreference`):

| Acción | `data-theme` | `ThemeService.theme` | `theme-color` (claro, oscuro) | Fondo |
|---|---|---|---|---|
| Inicio | ninguno | light | `#f6f4f9`, `#0e0e11` | `#f6f4f9` |
| Oscuro | dark | dark | `#0e0e11`, `#0e0e11` | `#0e0e11` |
| Claro | light | light | `#f6f4f9`, `#f6f4f9` | `#f6f4f9` |
| Claro, con el sistema en oscuro | light | light | `#f6f4f9`, `#f6f4f9` | `#f6f4f9` |
| Sistema (sistema oscuro) | ninguno | dark | `#f6f4f9`, `#0e0e11` (restauradas) | `#0e0e11` |
| Sistema (sistema claro) | ninguno | light | `#f6f4f9`, `#0e0e11` | `#f6f4f9` |

- Prueba del acento único en el catálogo (lecturas tras esperar a que acabe la transición de 120 ms; a mitad de transición Chrome devuelve el color interpolado en `oklab(…)`):

| Tema y acento | Botón principal | Botón de tema pulsado | Anillo de foco (`--color-focus-ring`) | Borde del selector |
|---|---|---|---|---|
| Claro, índigo | `#5856d6` | `#5856d6` | `#5856d6` | `#827d8c` |
| Claro, `--accent: #3264c8` | `#3264c8` | `#3264c8` | `#3264c8` | `#827d8c` |
| Claro, restaurado | `#5856d6` | `#5856d6` | `#5856d6` | `#827d8c` |
| Oscuro, índigo | `#6564d9` | `#6564d9` | `#ababeb` | `#7d7a88` |
| Oscuro, `#3264c8` | `#4270cc` | `#4270cc` | `#98b1e4` | `#7d7a88` |
| Oscuro, restaurado | `#6564d9` | `#6564d9` | `#ababeb` | `#7d7a88` |

El borde del selector no es un elemento acentuado y no cambia.

## Sección 4

### 4.1 Red de seguridad

SHA-1 de las tres pruebas de hidratación antes de tocar nada:

```
0513d046af6e3c59fdf95919445f24b8dab81be8  water-goal-section.component.spec.ts
9246aa58aad6198ada918a0d98fc77914177bd64  water-history-section.component.spec.ts
18a18f0831b6512dea1767feaf5ff10dea706b42  water-quick-log.component.spec.ts
```

Tras la migración (4.6), las tres sumas son idénticas: las pruebas pasan sin haberse modificado.

### 4.2 a 4.6 Migración

- `nutrition-page`: dos `app-card` («Hidratación» e «Historial de hidratación»), en el mismo orden y con el mismo contenido. En `nutrition-page.component.spec.ts`, la prueba «should render the hydration card and the hydration history card» cambia sus dos selectores `app-section-card` (el de los títulos, `app-section-card h2`, y el de las tarjetas, `app-section-card`) por `app-card`. El segundo también estaba en esa prueba y apuntaba al componente eliminado. Las otras dos pruebas no cambian.
- `water-goal-section`: «Cargando…» y «Error: …» pasan a `app-status-message` sin `retryLabel`; la etiqueta y el campo, a `app-field` con `appInput` (el `<input>` conserva `#goalInput`, `id="water-goal-input"`, `type`, `inputmode`, `min` y `step`); «Guardar objetivo», a `appButton` principal. El `.ts` solo cambia en `imports`.
- `water-quick-log`: los tres botones pasan a `appButton="secondary"` (Open Question 1, valor por defecto), con el mismo texto y `type="button"`.
- `water-history-section`: los estados pasan a `app-status-message`; la lista conserva `ul` y `li`, con la fecha en `text-body`, el total en `text-caption` y las filas separadas por `--color-border`. El historial vacío sigue sin texto.
- Eliminados `shared/components/section-card/` (componente y prueba) y la clase global `.button` de `_base.scss`. `grep -rn -E 'section-card|SectionCard|class="button"|\.button\b' src`: sin resultados.

### 4.7 Cierre automático

- `npm test -- --watch=false`: 22 archivos y 82 pruebas en verde (una menos que en la sección 3: la de `section-card`, que sustituye `card.component.spec.ts`).
- `npx ng lint`: `All files pass linting.`
- `npm run build`: sin avisos de presupuesto.

| Trozo | Referencia | Sección 3 | Sección 4 |
|---|---|---|---|
| `main` | 256.99 kB / 69.69 kB | 273.52 kB / 74.83 kB | 277.50 kB / 76.13 kB |
| `styles` | 1.07 kB / 442 bytes | 4.58 kB / 1.16 kB | 4.32 kB / 1.09 kB |
| Total inicial | 258.06 kB / 70.13 kB | 278.10 kB / 75.99 kB | 281.81 kB / 77.22 kB |
| `nutrition-page-component` | 8.79 kB / 2.55 kB | 8.66 kB / 2.52 kB | 17.91 kB / 4.38 kB |

`nutrition-page-component` crece porque ahora incluye los componentes base que usa (tarjeta, campo, mensaje de estado y sus tres iconos). `main` crece 4 kB porque el botón y su código compartido suben al paquete inicial. Los estilos globales bajan al quitar `.button`.

- Búsquedas del paso 3 de la decisión 16, todas sin resultados: las once variables antiguas; colores literales fuera de `_tokens.scss` y de las dos `theme-color` de `src/index.html`; `.button` y `section-card`.
- `transition` y `animation` en `*.scss`: `home.component.scss`, `button.component.scss`, `compact-select.component.scss` y `field.component.scss` solo usan `var(--duration-fast)` y `var(--ease-standard)` (las dos primeras, en declaraciones de varias líneas). Las excepciones son el giro del indicador de carga (`status-message-spin 1s linear infinite`, desactivado con movimiento reducido) y la red de seguridad global de `_base.scss` (`0.01ms`), que define la decisión 6.
- `git status --short`: sin cambios en `kora-health-api/`, en `services/` ni en `water-tracking-state.service.ts`.

### 4.8 Cierre visual contra la API real (solo lectura)

API arrancada sin migraciones pendientes. En Nutrición, a 375 px y a 1280 px, en claro y en oscuro:

- El texto de `main` es **idéntico** al de la «Referencia previa» en las cuatro combinaciones (comparación exacta de `innerText`): títulos de las dos tarjetas, objetivo actual, etiqueta del campo, los tres botones de registro, «Guardar objetivo» y las dos filas del historial.
- La entrada lanza exactamente las mismas dos lecturas (`/api/water-tracking/goal` y `/api/water-tracking/history?days=30`), con las mismas respuestas que en la referencia (`{"dailyGoalMl":2750,…}` y las filas del 2026-10-11 con 1050 ml y del 2026-10-10 con 850 ml), y ninguna petición más.
- Una sola acción principal en la vista («Guardar objetivo»); los tres botones de registro son secundarios.
- El final del historial no queda tapado por la barra y no hay desplazamiento horizontal.
- Capturas de Nutrición a 375 px en claro y en oscuro, y a 1280 px en oscuro, enseñadas a la usuaria.

Estado de error con la API detenida (375 px, claro), recargando Nutrición:

- `role="alert"` del objetivo: «Error: Http failure response for http://localhost:5001/api/water-tracking/goal: 0 undefined»
- `role="alert"` del historial: «Error: Http failure response for http://localhost:5001/api/water-tracking/history?days=30: 0 undefined»

Es el mismo texto que antes de la migración: la plantilla sigue escribiendo `Error: {{ error }}` y el mensaje sale de `WaterTrackingStateService`, que no se ha tocado; las pruebas de objetivo e historial, sin modificar, comprueban el texto exacto del aviso. Cada aviso lleva el icono `warning-circle` además del color de peligro (`#b3261e`). No se pulsó ningún botón de registro ni «Guardar objetivo». API detenida al terminar; el servidor de desarrollo sigue en marcha para la sección 5.

## Sección 5

Verificación completa sobre la aplicación terminada (secciones 1 a 4 aplicadas). Navegador: Chrome 154 en Windows; la aplicación se carga en un `<iframe>` del mismo origen con el ancho exacto, y el tema del sistema se emula con el `color-scheme` del marco (ver «Referencia previa»). Las 32 filas corresponden a los 32 `#### Escenario` del delta `specs/app-shell/spec.md` (`grep -c '^#### Escenario'` = 32).

Correcciones hechas durante esta sección:

- **Zona táctil del botón de solo icono.** Chrome no acepta toques en las esquinas redondeadas de un elemento: en el botón circular de 44 px, `elementFromPoint` en las cuatro esquinas de su cuadrado de 44 × 44 no devolvía el botón. Ahora `appButton` lleva un `::before` cuadrado (`position: absolute; inset: 0`) que cubre toda la caja, y las cuatro esquinas lo accionan.

| # | Requirement / escenario | Resultado | Cómo | Evidencia |
|---|---|---|---|---|
| 1 | Navegación / Cambio de sección | Cumple | Verificado en el navegador, 375 px (claro) y 1280 px (oscuro) | Desde cada una de las cinco secciones se pulsa otra: cambian la ruta y el título, y la navegación sigue con cinco enlaces |
| 2 | Navegación / Sección actual indicada | Cumple | Verificado en el navegador, 375 y 1280 px, ambos temas | Un solo enlace con la clase activa y `aria-current="page"`, distinguido por la píldora, el icono relleno, el color y la negrita; el árbol de accesibilidad lo expone como actual (sección 2) |
| 3 | Navegación / Vista interior de una sección | Cumple | Cubierto solo por prueba automática («should keep the section destination active in an inner view», `home.component.spec.ts`): ninguna sección tiene aún rutas hijas | Con rutas propias de la prueba, `/nutricion/detalle` mantiene activo Nutrición |
| 4 | Navegación / Etiqueta abreviada | Cumple | Verificado en el navegador, 375 y 1280 px | El enlace se llama «Entreno» (texto visible, sin `aria-label`); en `/entrenamiento` el `h1` es «Entrenamiento». También en la prueba «should show the full title of a destination whose label is shortened» |
| 5 | Dirección propia / Sección abierta por su dirección | Cumple | Verificado en el navegador, 375 y 1280 px | Abrir `/progreso` y recargar: `h1` «Progreso» y destino actual «Progreso» |
| 6 | Dirección propia / Volver atrás con el navegador | Cumple | Verificado en el navegador, 375 y 1280 px | De Salud a Perfil y `history.back()`: vuelve a `/salud`, con Salud actual |
| 7 | Dirección propia / Aplicación abierta sin indicar sección | Cumple | Verificado en el navegador, 375 y 1280 px; y «should redirect / to /salud» | `/` lleva a `/salud` |
| 8 | Dirección propia / Dirección desconocida | Cumple | Verificado en el navegador, 375 y 1280 px; y «should redirect an unknown URL to /salud» | `/no-existe/de-verdad` lleva a `/salud`, con los cinco destinos |
| 9 | Título / Título actualizado al cambiar de sección | Cumple | Verificado en el navegador, 375 y 1280 px | De Salud a Nutrición, el `h1` pasa de «Salud» a «Nutrición» |
| 10 | Título / Título completo con etiqueta abreviada | Cumple | Verificado en el navegador, 375 y 1280 px | `/entrenamiento`: `h1` «Entrenamiento», destino «Entreno» |
| 11 | Tema / Sistema en tema oscuro | Cumple | Verificado en el navegador, 375 y 1280 px | Abierto en oscuro: fondo `#0e0e11`, cabecera `#1c1c20`, texto `#f4f3f7` |
| 12 | Tema / Sistema en tema claro | Cumple | Verificado en el navegador, 375 y 1280 px | Abierto en claro: fondo `#f6f4f9`, cabecera `#ffffff`, texto `#1d1b20` |
| 13 | Tema / El sistema cambia de tema con la aplicación abierta | Cumple | Verificado en el navegador, 375 y 1280 px, en Nutrición | Pasa a oscuro sin recargar; sigue en `/nutricion`, el texto de `main` es idéntico y no hay peticiones nuevas |
| 14 | Tema / Ninguna vista queda fuera del tema | Cumple | Verificado en el navegador, 375 y 1280 px, cinco secciones y catálogo en oscuro | Ningún elemento con fondo, texto o borde de un color propio del tema claro (solo el texto blanco de los botones principal y de peligro, que es `--color-on-accent` y `--color-on-danger` en ambos temas). Los controles nativos (`select`, `input`) heredan `color-scheme: light dark`, resuelto a oscuro, y lo mismo las barras de desplazamiento. `data-theme` forzado en ambos sentidos funciona |
| 15 | Acento / Mismo acento en toda la aplicación | Cumple, con matiz | Verificado en el navegador, 375 px, ambos temas | Claro: píldora `#ebebfa`, texto e icono activos `#5856d6` y botón principal `#5856d6`. Oscuro: texto e icono activos `#ababeb`, botón `#6564d9` y píldora `#292948`. Todos salen de la misma fuente, `--accent`; en oscuro, el destino activo usa el papel «acento legible» y el botón el «relleno de acento», derivados distintos del mismo índigo según la decisión 3 |
| 16 | Acento / Cambio del color de acento | Cumple | Verificado en el navegador, 375 px, ambos temas, en Nutrición y en el catálogo | Con `--accent: #3264c8` en `<html>` cambian todos: píldora, texto, icono, botón principal, botón de tema pulsado y anillo de foco (claro `#e6ecf8`/`#3264c8`; oscuro `#212c45`/`#98b1e4`/`#4270cc`). Al quitarlo, todos vuelven al índigo; `git status` sin cambios |
| 17 | Contraste / Texto legible en ambos temas | Cumple | Cálculo sobre los colores calculados del navegador | Texto: 15,63–17,07 (claro) y 13,44–17,45 (oscuro). Texto secundario: 6,03–7,13 y 6,20–8,55. Todo ≥ 4,5 |
| 18 | Contraste / Controles distinguibles en ambos temas | Cumple | Cálculo sobre los colores calculados | Borde de control frente a fondo, superficie y elevada: 3,65 · 3,99 · 3,39 (claro) y 4,60 · 4,05 · 3,54 (oscuro). Iconos de la navegación en reposo (texto secundario sobre superficie): 7,13 y 7,54; icono activo (acento legible sobre acento suave): 4,78 y 6,47 |
| 19 | Contraste / Texto sobre el color de acento | Cumple | Cálculo sobre los colores calculados | Texto del botón principal sobre el acento: 5,65 (claro) y 4,81 (oscuro); en `hover` y pulsación, 6,41 y 5,50 |
| 20 | Teclado / Foco visible al navegar con teclado | Cumple | Verificado en el navegador con el tabulador real, 375 px, ambos temas | Cinco destinos, los cinco controles de Nutrición y los catorce del catálogo: todos reciben el foco con `:focus-visible` y anillo sólido `#5856d6` (claro) o `#ababeb` (oscuro). Entrar sobre un destino navega |
| 21 | Teclado / Control de solo icono | Cumple | Verificado en el navegador (catálogo) y prueba «should keep the projected content and the native attributes» | El botón de solo icono se llama «Más opciones» (`aria-label`), y su icono no tiene texto |
| 22 | Teclado / Sección actual sin depender del color | Cumple | Verificado en el navegador, `filter: grayscale(1)`, ambos temas (sección 2) | Siguen distinguiéndolo la píldora, el icono relleno y la etiqueta en negrita |
| 23 | Teclado / Error sin depender del color | Cumple | Verificado en el navegador con la API detenida (sección 4) | Los avisos dicen «Error: Http failure response for …» con texto, e icono `warning-circle`; `role="alert"` |
| 24 | Movimiento reducido / Cambio instantáneo | No verificado en el navegador | Comprobadas las reglas del CSS generado | Con `prefers-reduced-motion: reduce`, `--duration-*` valen `0s` y la red de seguridad global reduce cualquier transición a `0.01ms`. La sesión no puede emular esta preferencia. **Pedido a la usuaria** |
| 25 | Movimiento reducido / Estado de carga sin animación | No verificado en el navegador | Reglas del CSS generado y prueba «should announce loading as a status with the exact message» | El indicador lleva `animation: none` con movimiento reducido, y el texto «Cargando…» está en `role="status"`. **Pedido a la usuaria** |
| 26 | Movimiento reducido / La preferencia cambia con la aplicación abierta | No verificado en el navegador | Reglas del CSS generado | Las reglas son consultas de medios de CSS, que el navegador reevalúa en vivo sin JavaScript. **Pedido a la usuaria** |
| 27 | Zonas táctiles / Destinos de la navegación principal | Cumple | Verificado en el navegador, 375 y 320 px | 68,3 × 54,4 px a 375 y 57,3 × 54,4 px a 320, sin solaparse |
| 28 | Zonas táctiles / Control con icono pequeño | Cumple (tras la corrección) | Verificado en el navegador, 375 px, catálogo | Botón de solo icono de 44 × 44 px: `elementFromPoint` en sus cuatro esquinas devuelve el botón, y un clic real en la esquina superior izquierda lo acciona (1 clic). En Nutrición: campo 309,6 × 44, «Guardar objetivo» 163,9 × 44, registro rápido 99,7 / 102,1 / 102,1 × 44, sin solaparse |
| 29 | Móvil / Sin desplazamiento horizontal | Cumple | Verificado en el navegador, 375 px | Cinco secciones y catálogo: `scrollWidth` igual a `clientWidth` en el documento y en `main` |
| 30 | Móvil / Navegación al alcance al desplazar | Cumple | Verificado en el navegador, 375 × 560 | Al desplazar `main`, la barra sigue en la misma posición (y = 484) y un punto en su centro devuelve un enlace |
| 31 | Móvil / El final del contenido no queda tapado | Cumple | Verificado en el navegador, 375 × 560, Nutrición | Al final, la última tarjeta acaba en y = 472,1 y la barra empieza en y = 484; la última fila responde a `elementFromPoint` |
| 32 | Móvil / Pantalla ancha | Cumple | Verificado en el navegador, 768 y 1280 px | Navegación en la cabecera (`position: static`), cinco destinos con icono y etiqueta sin partirse a 768 px; en Nutrición, el mismo campo y los mismos cuatro botones |

### 5.4 Contraste definitivo

Recalculado sobre los colores calculados finales; coincide con la tabla de la sección 1 (1.12) en todos los pares, sin ningún fallo. Las tres filas de los escenarios son la 17, la 18 y la 19 de la tabla anterior. Rellenos oscurecidos un 8 % (`hover` y pulsación), texto blanco frente a relleno y relleno frente a superficie: acento 6,41 / 6,41, peligro 7,37 / 7,37 y éxito 6,60 / 6,60 en claro; acento 5,50 / 3,09, peligro 5,51 / 3,08 y éxito 5,47 / 3,11 en oscuro. Todos cumplen 4,5 y 3, y coinciden con la decisión 1 salvo centésimas.

### 5.9 Hidratación contra la API real

- Lectura: entrar en Nutrición lanza las mismas dos lecturas que en la «Referencia previa» y muestra los mismos datos (sección 4).
- Escritura, **con el visto bueno de la usuaria**: se pulsó una vez «+100 ml» (registro rápido, el de menor cantidad). Peticiones observadas: un único `POST http://localhost:5001/api/water-tracking/entries` con cuerpo `{"amountMl":100}`, el mismo que construye `WaterTrackingService.logEntry`, sin cambios en este change, seguido de la relectura `GET /api/water-tracking/history?days=30` que ya hacía el servicio de estado. El historial se actualiza sin recargar (aparece «2026-10-12 · 100 ml / 2750 ml») y, tras recargar, el total persiste: la API devuelve `{"date":"2026-10-12","totalMl":100,"goalMl":2750}`.
- **Entrada creada en Neon:** 100 ml el 2026-10-12 (día local de Europe/Madrid), usuario fijo `1`. El objetivo no se ha tocado.
- Servidores detenidos al terminar.

### 5.10 y 5.11 Documentación

- `CLAUDE.md`: el cliente Angular describe ahora el SCSS sobre variables por papel y la única dependencia de interfaz (los iconos); actualiza el árbol de carpetas (`index.html`, `styles/`, `home-destinations.ts`, `catalog/`, `shared/components/` con los cinco componentes base y `shared/theme/`), las rutas (`/catalogo` solo en desarrollo), la disposición (barra flotante, columna de 45rem, márgenes en el armazón, «Entreno») y la lista «Not present on purpose». El apartado nuevo «Base visual» trata los temas y `data-theme`, `ThemeService` y `revision`, las variables de color por papel con la regla de ningún color literal, el acento único con la lista cerrada y su criterio AA, la tipografía y los mixins, el movimiento, los iconos, los componentes base y los aplazados, y el catálogo. `grep -n -E 'data-theme|--color-accent|ThemeService|catalogo' CLAUDE.md` encuentra 7 líneas.
- `README.md`: árbol de carpetas actualizado y apartado nuevo «Base visual: temas, acento, iconos y componentes», con cómo ver el catálogo, cómo probar ambos temas y otro acento, cómo añadir un icono y un componente base, y las dos dependencias nuevas. Rutas y nombres citados comprobados: `src/styles/_tokens.scss`, `src/styles/_mixins.scss`, `shared/components/`, `catalog/`, `shared/theme/theme.service.ts`, `@ng-icons/phosphor-icons/regular` y `/fill`, y los ejemplos `phosphorPlus` y `phosphorPlusFill` existen en el paquete.

### 5.12 Cierre

- La tabla de escenarios tiene 32 filas, una por escenario, sin ninguna vacía. Cada una dice si está verificada en el navegador (con ancho y tema), cubierta solo por prueba automática (la 3) o no verificada en el navegador (las 24, 25 y 26, movimiento reducido).
- `npm test -- --watch=false`: 22 archivos y 82 pruebas en verde. `npx ng lint`: sin errores. `npm run build`: sin avisos de presupuesto. `openspec validate --all --strict`: 15 de 15 válidos. `git status --short`: nada en `kora-health-api/`.

Tamaños finales frente a la referencia:

| Trozo | Referencia | Final |
|---|---|---|
| `main` | 256.99 kB / 69.69 kB | 277.50 kB / 76.10 kB |
| `styles` | 1.07 kB / 442 bytes | 4.32 kB / 1.09 kB |
| Total inicial | 258.06 kB / 70.13 kB | 281.81 kB / 77.19 kB |
| `nutrition-page-component` | 8.79 kB / 2.55 kB | 17.99 kB / 4.40 kB |

El paquete inicial crece 23.75 kB sin comprimir (+7.06 kB transferidos), a un 56 % del aviso de presupuesto (500 kB).

**Límites de esta verificación:**

- Un único navegador de escritorio (Chrome 154 en Windows) que emula el móvil con un `<iframe>` del ancho exacto. Sin dispositivo ni simulador.
- No se ha podido emular `prefers-reduced-motion` (escenarios 24 a 26): solo están comprobadas las reglas del CSS generado.
- El teclado en pantalla y las zonas seguras (`env(safe-area-inset-*)`, `viewport-fit=cover`) no se pueden comprobar en un navegador de escritorio.

**Pedido a la usuaria, en su teléfono o en su sistema:**

1. Con «Reducir movimiento» activado en el sistema, el `hover` o la pulsación de un botón y el cambio de destino activo son instantáneos, y «Cargando…» aparece sin el icono girando. Al activarlo con la aplicación abierta, deja de animar sin recargar.
2. En el teléfono, con la muesca y la barra de inicio, la barra flotante queda por encima de la zona segura inferior y la cabecera no queda bajo la muesca. Al escribir en «Nuevo objetivo (ml)», el teclado tapa la barra en lugar de empujarla sobre el campo; si la barra flotara sobre el teclado, hay que avisar antes de añadir nada (decisión 9).

## Sección 6

- 6.1: las 58 casillas de las secciones 1 a 5 están marcadas; `openspec validate ui-foundation --strict` da `Change 'ui-foundation' is valid`.
- 6.2: `openspec archive ui-foundation --yes`. El aviso de 4 tareas incompletas corresponde a la propia sección 6, que no puede estar cerrada antes de archivar. Salida: `app-shell: create`, `+ 10 added`, `Change 'ui-foundation' archived as '2026-10-12-ui-foundation'`. El archivo contiene `proposal.md`, `design.md`, `tasks.md`, `verification.md` y `specs/app-shell/spec.md`, y `openspec list` ya no muestra `ui-foundation`.
- 6.3: el archivado dejó el `## Purpose` de `openspec/specs/app-shell/spec.md` como «TBD - created by archiving change ui-foundation…»; se ha sustituido por el texto del delta. La spec tiene 10 `### Requirement:` y 32 `#### Escenario`, igual que el delta archivado. `openspec validate --all --strict`: 15 de 15, incluida `spec/app-shell`.
- 6.4: `CLAUDE.md` cuenta 12 capabilities («the 12 approved capabilities» y «The 12 capabilities and their dependencies», con una línea para `app-shell`), añade `ui-foundation` a los changes archivados y, en «Project status», la base visual implementada. `grep -n -E '\b11\b' CLAUDE.md` solo encuentra fechas (`2026-10-11`), ningún recuento.
- 6.5: `openspec validate --all --strict` pasa (15 de 15); `openspec list` no muestra `ui-foundation`. Se cumplen las tres condiciones que comprueba `water-statistics`: existe `openspec/changes/archive/2026-10-12-ui-foundation`, `openspec list` no lo muestra activo y `CLAUDE.md` describe los temas (`data-theme`, `ThemeService`) y las variables de color. `npm test -- --watch=false` (82 en verde), `npx ng lint` (sin errores) y `npm run build` (sin avisos de presupuesto) siguen pasando.

Nota de entorno: la CLI `openspec` está instalada como paquete global de Node 24.12.0. Tras activar Node 24.21.0 con nvm (necesario para Angular 22), deja de estar en el `PATH`, así que se ha ejecutado con su ruta completa (`%LOCALAPPDATA%\nvm\v24.12.0\openspec.cmd`).
