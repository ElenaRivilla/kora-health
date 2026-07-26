# ai-assistant Specification

## Purpose
Proporcionar las capacidades de IA transversales usadas en toda la app: reconocimiento de alimentos y estimación de cantidades a partir de imágenes, explicación del score nutricional, recomendaciones dietéticas y deportivas, análisis de tendencias, resúmenes personalizados, y preguntas y respuestas contextuales sobre los datos del usuario — todo procesado por el backend.
## Requirements
### Requirement: Reconocimiento de Alimentos a partir de Imágenes
El sistema SHALL usar IA para reconocer los alimentos presentes en una imagen enviada por el usuario y SHALL estimar la cantidad de cada alimento reconocido.

#### Escenario: Alimentos y cantidades devueltos
- **CUANDO** se envía una imagen de una comida para su reconocimiento
- **ENTONCES** el sistema devuelve una lista de alimentos reconocidos, cada uno con una cantidad estimada

### Requirement: Explicación del Score Nutricional y Recomendaciones
El sistema SHALL usar IA para explicar el score nutricional de un usuario y generar recomendaciones dietéticas basadas en su ingesta registrada.

#### Escenario: Explicación con recomendaciones
- **CUANDO** se recibe una solicitud de explicación del score nutricional para un día concreto
- **ENTONCES** el sistema devuelve una explicación del score junto con al menos una recomendación dietética

### Requirement: Recomendaciones Deportivas
El sistema SHALL usar IA para generar recomendaciones deportivas/de entrenamiento basadas en el historial de entrenamientos y los objetivos del usuario.

#### Escenario: Recomendación generada
- **CUANDO** se recibe una solicitud de recomendación deportiva para un usuario
- **ENTONCES** el sistema devuelve una recomendación basada en el historial de entrenamientos y los objetivos de ese usuario

### Requirement: Análisis de Tendencias y Resúmenes Personalizados
El sistema SHALL usar IA para analizar tendencias en los datos del usuario y generar resúmenes personalizados.

#### Escenario: Resumen de tendencias generado
- **CUANDO** se recibe una solicitud de resumen de tendencias para un usuario
- **ENTONCES** el sistema devuelve un resumen generado por IA que describe tendencias relevantes en los datos de ese usuario

### Requirement: Preguntas y Respuestas Contextuales
El sistema SHALL permitir al usuario hacer preguntas en formato libre y SHALL responderlas usando el contexto completo de los datos almacenados de ese usuario.

#### Escenario: Pregunta respondida con el contexto del usuario
- **CUANDO** el usuario hace una pregunta sobre sus propios datos
- **ENTONCES** el sistema genera una respuesta usando los datos almacenados relevantes de ese usuario como contexto

### Requirement: Procesamiento de IA Gestionado por el Backend
El sistema SHALL procesar todas las solicitudes de IA en el backend, el cual SHALL reenviar la solicitud (imagen, pregunta o contexto) al proveedor de IA correspondiente y devolver la respuesta al cliente.

#### Escenario: El cliente nunca llama directamente al proveedor de IA
- **CUANDO** el cliente Flutter necesita un resultado generado por IA
- **ENTONCES** envía las imágenes, preguntas o contexto necesarios al backend, y es el backend el componente que se comunica con el proveedor de IA
