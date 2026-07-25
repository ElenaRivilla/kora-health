# Arquitectura del proyecto

## Tecnologías

### Cliente móvil

- Flutter
- Dart

### Backend

- ASP.NET Core Web API (.NET)

### Base de datos

- PostgreSQL

### ORM

- Entity Framework Core

### Cliente HTTP

- Dio

### Base de datos local

- Drift (SQLite)

### Gestión de estado

- Riverpod

---

# Arquitectura general

```
                Flutter
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
Presentation
│
├── Pages
├── Widgets
└── Providers (Riverpod)
        │
        ▼
Application
│
├── Services
└── Use Cases
        │
        ▼
Data
│
├── API Client (Dio)
├── HealthKit
├── Drift
└── Repositories
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
Flutter

↓

Service

↓

Dio

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

HealthKit será accesible únicamente desde la aplicación Flutter.

```
HealthKit

↓

Flutter

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

- Drift
- Caché
- Trabajo offline

## Remoto

- PostgreSQL
- Sincronización mediante API REST

---

# Organización del proyecto Flutter

```
lib/

core/
shared/

features/

    health/

    nutrition/

    workout/

    progress/

    profile/

services/

repositories/

models/

providers/
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
- Providers

---

# Inteligencia Artificial

La IA será consumida desde el backend.

La aplicación Flutter enviará:

- imágenes
- preguntas
- contexto

El backend procesará la solicitud utilizando el proveedor de IA correspondiente y devolverá la respuesta al cliente.

---

# Futuro

La API será compartida por distintos clientes.

```
Flutter (iOS)
        │
Flutter (Android)
        │
Aplicación Web
        │
───────────────
ASP.NET Core API
        │
PostgreSQL
```

La lógica de negocio permanecerá centralizada en el backend, permitiendo reutilizar la misma infraestructura para múltiples plataformas.