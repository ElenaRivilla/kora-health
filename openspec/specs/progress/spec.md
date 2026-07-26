# progress Specification

## Purpose
Agregar la evolución del usuario en salud, nutrición y entrenamientos en tendencias, comparaciones, informes y resúmenes personalizados generados por IA.
## Requirements
### Requirement: Vista Agregada de Evolución
El sistema SHALL presentar la evolución del usuario en peso, composición corporal, nutrición y rendimiento deportivo/de entrenamiento, agregando datos de las capacidades `health`, `nutrition-log`, `nutrition-goals` y `workouts`.

#### Escenario: Consultar la evolución general
- **CUANDO** el usuario abre la vista de progreso
- **ENTONCES** el sistema muestra los datos de evolución de peso, composición corporal, nutrición y entrenamientos en un rango de tiempo seleccionable

### Requirement: Tendencias y Comparaciones
El sistema SHALL calcular tendencias sobre los datos históricos del usuario y SHALL permitir comparar diferentes periodos de tiempo.

#### Escenario: Comparar dos periodos
- **CUANDO** el usuario selecciona dos periodos de tiempo para comparar
- **ENTONCES** el sistema muestra la tendencia y la diferencia entre ambos periodos para la métrica seleccionada

### Requirement: Informes de Progreso
El sistema SHALL generar informes que resuman el progreso del usuario en un rango de tiempo seleccionado.

#### Escenario: Informe generado
- **CUANDO** el usuario solicita un informe de progreso para un rango de tiempo
- **ENTONCES** el sistema genera un informe que cubre las métricas relevantes de ese rango

### Requirement: Resúmenes de Progreso Generados por IA
El sistema SHALL usar IA para generar resúmenes y recomendaciones personalizados basados en los datos de progreso agregados del usuario.

#### Escenario: Resumen generado
- **CUANDO** el usuario solicita un resumen de progreso
- **ENTONCES** el sistema devuelve un resumen y recomendaciones generados por IA basados en los datos de progreso recientes del usuario
