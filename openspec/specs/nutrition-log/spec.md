# nutrition-log Specification

## Purpose
Permitir al usuario registrar las comidas diarias (desayuno, comida, cena, snack) con alimentos añadidos manualmente o detectados a partir de fotos mediante IA, y calcular automáticamente las calorías y macronutrientes resultantes.
## Requirements
### Requirement: Diario de Comidas Diario
El sistema SHALL permitir al usuario registrar entradas bajo desayuno, comida, cena y snack para cada día, y cada entrada de comida SHALL poder contener uno o más alimentos.

#### Escenario: Registrar una comida con varios alimentos
- **CUANDO** el usuario añade dos alimentos a la entrada de la comida de hoy
- **ENTONCES** el sistema almacena ambos alimentos bajo esa comida para ese día, y ambos son recuperables al consultar el diario

### Requirement: Entrada Manual de Alimentos
El sistema SHALL permitir al usuario añadir un alimento a una comida especificando manualmente el alimento y su cantidad.

#### Escenario: Entrada manual aceptada
- **CUANDO** el usuario selecciona un alimento e introduce una cantidad manualmente
- **ENTONCES** el sistema añade esa entrada de alimento a la comida seleccionada

### Requirement: Registro de Comidas Basado en Fotos
El sistema SHALL permitir al usuario registrar una comida haciendo o subiendo una fotografía, y SHALL usar IA para detectar los alimentos presentes en esa fotografía.

#### Escenario: Alimentos detectados a partir de una foto
- **CUANDO** el usuario envía una foto de una comida
- **ENTONCES** el sistema devuelve una lista de alimentos detectados para que el usuario los confirme antes de añadirlos a la comida

### Requirement: Cálculo Nutricional Automático
Para cada entrada de alimento registrada, el sistema SHALL calcular automáticamente las calorías, proteínas, carbohidratos, grasas, fibra, azúcar y sodio.

#### Escenario: Nutrientes calculados al registrar
- **CUANDO** se añade una entrada de alimento a una comida, ya sea manualmente o mediante detección por foto
- **ENTONCES** el sistema calcula y almacena las calorías, proteínas, carbohidratos, grasas, fibra, azúcar y sodio de esa entrada
