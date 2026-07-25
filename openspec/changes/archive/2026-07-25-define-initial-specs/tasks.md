## 1. Validación de las specs

- [x] 1.1 Ejecutar `openspec validate --change define-initial-specs` (o equivalente) y corregir errores de formato en las 11 specs
- [x] 1.2 Revisar que cada requirement tenga al menos un escenario en formato `#### Scenario` con WHEN/THEN
- [x] 1.3 Confirmar que los nombres de capability en kebab-case coinciden entre `proposal.md` y las carpetas de `specs/`

## 2. Revisión cruzada de dependencias entre capabilities

- [x] 2.1 Confirmar que los requisitos de `progress` referencian correctamente a `health`, `nutrition-log`, `nutrition-goals` y `workouts` sin duplicar sus datos
- [x] 2.2 Confirmar que `profile` y `nutrition-goals` no definen dos veces la configuración de calorías/macros
- [x] 2.3 Confirmar que `profile` y `healthkit-integration` no definen dos veces la preferencia de sincronización con HealthKit
- [x] 2.4 Confirmar que `nutrition-log` y `ai-assistant` están alineadas en el requisito de reconocimiento de alimentos por foto (quién detecta, quién calcula)

## 3. Resolución de preguntas abiertas

- [x] 3.1 Decidir si `water-tracking` y `recipes` se mantienen como specs independientes o se fusionan en `nutrition-log` → se mantienen separadas
- [x] 3.2 Decidir el/los proveedor(es) de IA a integrar en `ai-assistant` y anotar cualquier restricción resultante (tamaño de imagen, latencia, coste) → Gemini 2.5 Flash, detalle pendiente para el change de implementación
- [x] 3.3 Decidir si `sync` necesita una estrategia de resolución de conflictos para el futuro multi-dispositivo → no por ahora, anotado como no-goal

## 4. Cierre del change

- [ ] 4.1 Eliminar o archivar `openspec/specs/initial/` una vez confirmado que su contenido está cubierto por las 11 specs nuevas — omitida por decisión del usuario, se deja pendiente para más adelante
- [ ] 4.2 Archivar el change `define-initial-specs` con `openspec archive` para materializar las specs en `openspec/specs/`
