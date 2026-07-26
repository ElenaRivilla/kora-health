# health Specification

## Purpose
Registrar y visualizar las métricas de salud del usuario (peso, IMC, grasa corporal, masa muscular, frecuencia cardíaca, HRV, SpO2, sueño, pasos, distancia, calorías, VO2 máx) sincronizadas desde Apple HealthKit, incluyendo tendencias históricas a lo largo del tiempo.
## Requirements
### Requirement: Registro de Métricas de Salud
El sistema SHALL almacenar y mostrar las siguientes métricas de salud del usuario: peso, IMC, porcentaje de grasa corporal, masa muscular, frecuencia cardíaca, variabilidad de la frecuencia cardíaca (HRV), saturación de oxígeno en sangre (SpO2), sueño, pasos diarios, distancia recorrida, calorías activas, calorías en reposo, y VO2 máx.

#### Escenario: Métricas disponibles tras la sincronización
- **CUANDO** se han sincronizado datos de salud para el usuario
- **ENTONCES** el usuario puede ver los valores actuales de cada métrica soportada

### Requirement: Historial y Evolución de Métricas de Salud
El sistema SHALL mantener un registro histórico de cada métrica de salud y SHALL presentar ese historial como gráficas que muestren la evolución a lo largo del tiempo.

#### Escenario: Consultar el historial de una métrica
- **CUANDO** el usuario abre la vista de historial de una métrica concreta
- **ENTONCES** el sistema muestra una gráfica con los valores de esa métrica a lo largo del tiempo, construida a partir de los registros históricos almacenados

### Requirement: Ingesta de Datos de Salud
El sistema SHALL aceptar datos de métricas de salud enviados por el cliente móvil y persistirlos asociados al usuario correspondiente.

#### Escenario: Nuevos valores de métrica recibidos
- **CUANDO** el cliente móvil envía nuevos valores de métricas de salud para el usuario
- **ENTONCES** el sistema almacena los valores y los asocia con el tipo de métrica, la marca de tiempo y el usuario correctos
