---
sidebar_position: 4
title: Módulo Catálogo y Triaje
---

# Módulo de Catálogo y Triaje de Hallazgos

El núcleo clínico de la plataforma: permite a los médicos ocupacionales definir la severidad de cada diagnóstico y normalizar la terminología médica.

---

## 🎛️ Funcionalidades Clave

1. **Matriz de Riesgo Ponderado:**
   - Cada diagnóstico puede asignarse a un nivel de riesgo: **Crítico**, **Alto**, **Medio** o **Bajo**.
   - Los cambios de riesgo actualizan en tiempo real los registros de todos los pacientes en memoria y en Firestore.
2. **Organización por Categorías:**
   - Agrupación lógica de diagnósticos: *Oftalmológicos, Metabólicos, Cardiovasculares, Hematológicos, Musculoesqueléticos, Auditivos, Respiratorios y Otros*.
   - Posibilidad de crear **nuevas categorías personalizadas** con selector de emojis integrado.
3. **Triaje Inteligente de Nuevos Hallazgos:**
   - Cuando se carga un Excel con diagnósticos no reconocidos por el sistema, estos pasan a una bandeja de triaje asistido.
   - El analista puede:
     - **Aceptar:** Asignar a una categoría existente con su nivel de riesgo.
     - **Vincular:** Establecer como sinónimo o alias de un diagnóstico principal ya registrado.
     - **Rechazar:** Descartar diagnósticos no pertinentes para la vigilancia ocupacional.
4. **Exportación a Excel Multi-Hoja:**
   - Descarga directa en Excel con el catálogo consolidado en la primera hoja y la matriz de sinónimos/vínculos en la segunda hoja.
