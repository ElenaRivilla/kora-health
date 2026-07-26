# workouts Specification

## Purpose
Permitir al usuario crear ejercicios y rutinas, registrar sesiones de entrenamiento (series, repeticiones, peso, descanso), y llevar el seguimiento de récords personales y progresión a lo largo del tiempo.
## Requirements
### Requirement: Creación de Ejercicios
El sistema SHALL permitir al usuario crear ejercicios propios para usarlos en rutinas y registros de entrenamiento.

#### Escenario: Ejercicio propio creado
- **CUANDO** el usuario crea un nuevo ejercicio con un nombre
- **ENTONCES** el sistema almacena el ejercicio y lo pone disponible para usarse en rutinas y entrenamientos registrados

### Requirement: Creación de Rutinas
El sistema SHALL permitir al usuario crear una rutina compuesta por uno o más ejercicios.

#### Escenario: Rutina creada
- **CUANDO** el usuario crea una rutina y le añade ejercicios
- **ENTONCES** el sistema almacena la rutina con sus ejercicios para su uso posterior al registrar un entrenamiento

### Requirement: Registro de Entrenamientos
El sistema SHALL permitir al usuario registrar una sesión de entrenamiento anotando, para cada ejercicio realizado, las series, repeticiones, peso utilizado y tiempo de descanso.

#### Escenario: Entrenamiento registrado
- **CUANDO** el usuario registra una sesión de entrenamiento con series, repeticiones, peso y tiempo de descanso para un ejercicio
- **ENTONCES** el sistema almacena la sesión como parte del historial de entrenamientos de ese usuario

### Requirement: Seguimiento de Récords Personales
El sistema SHALL detectar y llevar el seguimiento de récords personales (PRs) por ejercicio basándose en los datos de entrenamiento registrados.

#### Escenario: Nuevo PR detectado
- **CUANDO** una serie registrada para un ejercicio supera la mejor marca previa del usuario para ese ejercicio
- **ENTONCES** el sistema lo registra como un nuevo récord personal para ese ejercicio

### Requirement: Historial de Entrenamientos y Estadísticas de Progresión
El sistema SHALL mantener un historial de los entrenamientos registrados y SHALL proporcionar estadísticas de progresión por ejercicio a lo largo del tiempo.

#### Escenario: Consultar la progresión de un ejercicio
- **CUANDO** el usuario abre la vista de progresión de un ejercicio
- **ENTONCES** el sistema muestra el rendimiento histórico y las estadísticas de progresión de ese ejercicio
