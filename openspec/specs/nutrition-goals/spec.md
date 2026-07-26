# nutrition-goals Specification

## Purpose
Permitir al usuario configurar objetivos diarios de calorías y macronutrientes, y calcular un score nutricional diario frente a esos objetivos con una explicación y recomendaciones generadas por IA.
## Requirements
### Requirement: Objetivos Nutricionales Diarios Configurables
El sistema SHALL permitir al usuario configurar objetivos diarios de calorías, proteínas, carbohidratos, grasas, fibra, azúcar y sodio.

#### Escenario: Objetivos guardados
- **CUANDO** el usuario establece un objetivo diario de calorías y macronutrientes
- **ENTONCES** el sistema almacena los objetivos y los usa para evaluar los días siguientes

### Requirement: Score Nutricional Diario
El sistema SHALL calcular un score nutricional diario basado en la calidad de la ingesta de alimentos registrada por el usuario ese día, comparada con los objetivos configurados por el usuario.

#### Escenario: Score disponible tras registrar comidas
- **CUANDO** el usuario ha registrado comidas para el día actual
- **ENTONCES** el sistema calcula un score nutricional para ese día

### Requirement: Explicación y Recomendaciones de IA para el Score Nutricional
El sistema SHALL usar IA para explicar el razonamiento detrás del score nutricional de un día concreto y ofrecer recomendaciones de mejora.

#### Escenario: Explicación solicitada
- **CUANDO** el usuario solicita una explicación del score nutricional de un día
- **ENTONCES** el sistema devuelve una explicación generada por IA y al menos una recomendación basada en la ingesta registrada ese día
