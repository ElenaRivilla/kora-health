# recipes Specification

## Purpose
Permitir al usuario guardar recetas propias y reutilizarlas para añadir rápidamente todos sus alimentos a una comida en el diario nutricional.
## Requirements
### Requirement: Guardar Receta Propia
El sistema SHALL permitir al usuario crear y guardar una receta compuesta por uno o más alimentos con sus cantidades.

#### Escenario: Receta guardada
- **CUANDO** el usuario crea una receta con un nombre y una lista de alimentos con cantidades
- **ENTONCES** el sistema almacena la receta en la cuenta de ese usuario para su reutilización posterior

### Requirement: Reutilizar Receta Guardada
El sistema SHALL permitir al usuario añadir una receta guardada a una comida del diario nutricional en una sola acción, aplicando todos sus alimentos y cantidades.

#### Escenario: Añadir una receta guardada a una comida
- **CUANDO** el usuario selecciona una receta guardada para añadirla a la cena de hoy
- **ENTONCES** el sistema añade todos los alimentos de la receta, con sus cantidades, a esa entrada de comida
