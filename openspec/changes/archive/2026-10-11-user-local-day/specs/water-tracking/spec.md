## MODIFIED Requirements

### Requirement: Registro Rápido de Agua
El sistema SHALL permitir al usuario registrar una entrada de ingesta de agua con un número mínimo de interacciones. El sistema SHALL sumar cada entrada al total del día al que pertenece el instante en que se registró, entendiendo «el día» como el día natural en la zona horaria del usuario definido en `profile`; el día actual es, por tanto, el día local del usuario en el momento de la consulta.

#### Escenario: Entrada rápida registrada
- **CUANDO** el usuario registra una entrada de ingesta de agua
- **ENTONCES** el sistema suma la cantidad al total del día actual, en la zona horaria del usuario, de inmediato

#### Escenario: Entrada registrada de madrugada
- **CUANDO** un usuario con zona horaria `Europe/Madrid` registra una entrada poco después de su medianoche local, en un instante en el que en UTC todavía es el día anterior
- **ENTONCES** el sistema suma la cantidad al total del nuevo día local y el total del día anterior no cambia

### Requirement: Historial y Estadísticas de Agua
El sistema SHALL mantener un historial de la ingesta diaria de agua y SHALL proporcionar estadísticas derivadas de ese historial. Cada total diario del historial SHALL corresponder a un día natural en la zona horaria del usuario definida en `profile`, y el periodo de días que abarca el historial SHALL contarse en esos mismos días locales. El sistema SHALL agrupar las entradas según la zona horaria vigente del usuario en el momento de la consulta, sin alterar los instantes en que se registraron.

#### Escenario: Consultar el historial de agua
- **CUANDO** el usuario abre la vista de historial de agua
- **ENTONCES** el sistema muestra los totales diarios anteriores y estadísticas resumidas

#### Escenario: Cada entrada se agrupa en su día local
- **CUANDO** el usuario consulta el historial y existen entradas registradas poco antes y poco después de una medianoche local
- **ENTONCES** el sistema incluye cada entrada en el total del día local en el que se registró, de modo que las anteriores a la medianoche cuentan en un día y las posteriores en el siguiente

#### Escenario: Historial reagrupado al cambiar de zona horaria
- **CUANDO** el usuario cambia su zona horaria y vuelve a consultar el historial
- **ENTONCES** el sistema agrupa todas las entradas, incluidas las anteriores al cambio, según los días de la nueva zona horaria, sin modificar los instantes en que se registraron
