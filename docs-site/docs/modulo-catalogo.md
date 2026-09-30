---
sidebar_position: 4
title: Catálogo y Triaje
---

# Catálogo y Triaje de Hallazgos

Módulo para la normalización de diagnósticos clínicos y configuración de niveles de severidad.

---

## Funcionalidades

- **Matriz de Riesgo:** Asignación de niveles de riesgo (*Crítico, Alto, Medio, Bajo*) por diagnóstico, sincronizados con la base de datos Firestore.
- **Estructura por Categorías:** Clasificación de hallazgos por sistemas corporales (Metabólicos, Auditivos, Oftalmológicos, etc.) con capacidad de agregar nuevas categorías.
- **Bandeja de Triaje:** Gestión de términos médicos no reconocidos durante la carga de nóminas:
  - *Aceptar:* Incorporar al catálogo en una categoría y severidad definida.
  - *Vincular:* Asociar como alias/sinónimo de un diagnóstico maestro.
  - *Rechazar:* Excluir del seguimiento clínico.
- **Exportación:** Descarga del catálogo maestro y la tabla de sinónimos en formato Excel de dos hojas.
