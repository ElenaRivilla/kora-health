## MODIFIED Requirements

### Requirement: Procesamiento de IA Gestionado por el Backend
El sistema SHALL procesar todas las solicitudes de IA en el backend, el cual SHALL reenviar la solicitud (imagen, pregunta o contexto) al proveedor de IA correspondiente y devolver la respuesta al cliente.

#### Escenario: El cliente nunca llama directamente al proveedor de IA
- **CUANDO** el cliente necesita un resultado generado por IA
- **ENTONCES** envía las imágenes, preguntas o contexto necesarios al backend, y es el backend el componente que se comunica con el proveedor de IA
