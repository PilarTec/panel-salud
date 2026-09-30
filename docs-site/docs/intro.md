---
sidebar_position: 1
title: Introducción
---

# Panel de Salud Ocupacional

Documentación del sistema web para gestionar y consultar exámenes médicos de los trabajadores.

---

## Qué hace el sistema

1. **Guardar datos de exámenes:** Permite subir y almacenar la información de exámenes de ingreso, periódicos y de retiro.
2. **Control de vigencias y aptitud:** Muestra cuántos trabajadores tienen sus exámenes al día, cuántos están vencidos y quiénes tienen observaciones médicas.
3. **Catálogo de diagnósticos:** Ordena los hallazgos médicos por categorías y permite clasificarlos por nivel de riesgo (Crítico, Alto, Medio, Bajo).
4. **Filtros por puesto de trabajo:** Permite buscar trabajadores expuestos a ruido, trabajo en altura o esfuerzo físico.

---

## Módulos del Sistema

| Módulo | Descripción |
|---|---|
| **[Dashboard](./modulo-dashboard)** | Resumen general con gráficos, totales por sede y estado de exámenes. |
| **[Exámenes y Protocolos](./modulo-examenes)** | Lista detallada por tipo de examen, sede y factores de riesgo. |
| **[Catálogo y Triaje](./modulo-catalogo)** | Lista de diagnósticos, niveles de riesgo y vinculación de términos nuevos. |
| **[Verificación de Pacientes](./modulo-pacientes)** | Búsqueda por trabajador, ficha médica y estado de aptitud. |

---

## Seguridad
- Inicio de sesión obligatorio para ver o editar información.
- Claves de conexión guardadas en variables de entorno `.env` en lugar del código fuente.
- Reglas en Firestore para que solo usuarios autorizados puedan leer o guardar datos.
