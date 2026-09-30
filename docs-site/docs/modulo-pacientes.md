---
sidebar_position: 5
title: Módulo Verificación de Pacientes
---

# Módulo de Verificación y Ficha Médica

Permite a los profesionales de la salud consultar la lista nominal de pacientes, auditar sus diagnósticos y emitir o modificar la condición de aptitud.

---

## 📋 Características

1. **Tabla de Pacientes con Filtros Dinámicos:**
   - Filtro reactivo *"Con Hallazgos Críticos"* que evalúa si el paciente tiene al menos un diagnóstico crítico en el catálogo activo.
   - Búsqueda por ID anónimo, periodo, aptitud, proceso, sede o país.
2. **Ficha Médica Individual (Modal):**
   - **Columna de Resultados:** Visualización consolidada de exámenes de laboratorio (glucosa, colesterol, triglicéridos, hemoglobina) y evaluaciones especializadas (oftalmología, audiometría, espirometría, radiografía).
   - **Columna de Hallazgos:** Selección y deselección de diagnósticos con insignias de riesgo de colores.
   - **Segmented Switch:** Alterna entre ver el catálogo completo de opciones o únicamente los diagnósticos seleccionados del paciente.
3. **Gestión de Aptitud Laboral:**
   - Modificación con diálogo de confirmación para evitar cambios accidentales entre:
     - *APTO*
     - *APTO CON RESTRICCIONES*
     - *OBSERVADO*
     - *NO APTO*
     - *SIN APTITUD*
   - Sincronización inmediata con Firestore.
