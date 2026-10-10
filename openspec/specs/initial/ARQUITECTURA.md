# Arquitectura del proyecto

## Tecnologías

### Cliente

- Angular (TypeScript)
- Aplicación web pensada para móvil; se empaquetará para iOS con Capacitor cuando se integre HealthKit

### Backend

- ASP.NET Core Web API (.NET)

### Base de datos

- PostgreSQL

### ORM

- Entity Framework Core

### Cliente HTTP

- `HttpClient` de Angular, a través de un servicio base propio

### Base de datos local

- Pendiente de decidir para el cliente web (se define junto con la sincronización)

### Gestión de estado

- Signals de Angular, sin librería externa

---

# Arquitectura general

```
                Angular
                    │
                    │ HTTP REST
                    ▼
          ASP.NET Core Web API
                    │
                    ▼
             PostgreSQL
```

---

# Arquitectura del cliente

```
Pantallas (modules/app-container)
│
├── Páginas por funcionalidad
├── Componentes
└── Servicios de estado (signals)
        │
        ▼
Servicios (services)
│
├── Servicio base HTTP
└── Un servicio de datos por funcionalidad
        │
        ▼
Compartido (shared)
│
├── Configuración en runtime
├── DTOs
└── Helpers
```

---

# Arquitectura del backend

```
Controllers

↓

Services

↓

Repositories

↓

Entity Framework Core

↓

PostgreSQL
```

---

# Flujo de una petición

```
Componente

↓

Servicio de estado

↓

Servicio de datos

↓

HTTP

↓

Controller

↓

Service

↓

Repository

↓

Entity Framework

↓

PostgreSQL
```

---

# Integración con HealthKit

HealthKit será accesible únicamente desde la aplicación cliente que se ejecuta en el dispositivo iOS del usuario.

```
HealthKit

↓

Cliente

↓

API

↓

PostgreSQL
```

El backend nunca accederá directamente a HealthKit.

---

# Sincronización

La aplicación almacenará datos tanto de forma local como remota.

## Local

- Almacenamiento local del cliente (tecnología pendiente de decidir)
- Caché
- Trabajo offline

## Remoto

- PostgreSQL
- Sincronización mediante API REST

---

# Organización del proyecto Angular

```
src/app/

app.config.ts
app.routes.ts

modules/app-container/

    home/

    health/

    nutrition/

    workouts/

    progress/

    profile/

    shared/

services/

    pipes/

shared/

    config/

    entities/DTOS/

    helpers/
```

Cada módulo será independiente.

---

# Organización del Backend

```
API

Controllers/

Services/

Repositories/

Entities/

DTOs/

Mappings/

Infrastructure/

Authentication/
```

---

# Módulos

- Salud
- Nutrición
- Entrenamientos
- Progreso
- Perfil

Cada módulo tendrá su propio conjunto de:

- Entidades
- DTOs
- Servicios
- Repositorios
- Pantallas
- Servicios de estado

---

# Inteligencia Artificial

La IA será consumida desde el backend.

La aplicación cliente enviará:

- imágenes
- preguntas
- contexto

El backend procesará la solicitud utilizando el proveedor de IA correspondiente y devolverá la respuesta al cliente.

---

# Futuro

La API será compartida por distintos clientes.

```
Aplicación Web (Angular)
        │
App iOS (Angular + Capacitor)
        │
Otros clientes
        │
───────────────
ASP.NET Core API
        │
PostgreSQL
```

La lógica de negocio permanecerá centralizada en el backend, permitiendo reutilizar la misma infraestructura para múltiples plataformas.