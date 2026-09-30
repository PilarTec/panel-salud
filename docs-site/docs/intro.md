---
sidebar_position: 1
title: Introducción al Sistema
---

# Panel de Salud Ocupacional

Bienvenido a la documentación oficial del **Panel de Salud Ocupacional**, una plataforma integral diseñada para la vigilancia médica, trazabilidad de Exámenes Médicos Ocupacionales (EMO) y control epidemiológico corporativo.

---

## 🎯 Objetivos de la Plataforma

1. **Centralizar la Información Médica:** Consolidar nóminas de evaluaciones periódicas, de ingreso y de retiro en un repositorio seguro y auditado.
2. **Monitoreo Epidemiológico en Tiempo Real:** Visualizar de forma inmediata indicadores de cobertura, vigencia de exámenes, trabajadores observados y pacientes críticos.
3. **Estandarización de Diagnósticos:** Normalizar diagnósticos mediante sinónimos y clasificar su severidad (*Crítico, Alto, Medio, Bajo*) en un catálogo dinámico y configurable.
4. **Trazabilidad y Cumplimiento:** Facilitar el seguimiento de protocolos de vigilancia (PREXOR, Altura Física/Geográfica, Ergonómicos, etc.).

---

## 🧩 Módulos del Sistema

| Módulo | Descripción Principal |
|---|---|
| **[Dashboard Ejecutivo](./modulo-dashboard)** | Visión general con KPIs estratégicos, tasas de cobertura y gráficos de tendencias. |
| **[Exámenes y Protocolos](./modulo-examenes)** | Análisis pormenorizado por tipo de examen, sede operativa y protocolos de riesgo. |
| **[Catálogo y Triaje](./modulo-catalogo)** | Matriz ponderada de riesgo de diagnósticos, gestión de sinónimos y nuevas categorías. |
| **[Verificación de Pacientes](./modulo-pacientes)** | Ficha médica individual, historial de diagnósticos y asignación de aptitud médica. |
| **Carga de Datos** | Ingesta masiva de nóminas en formato Excel con detección inteligente de duplicados. |

---

## 🔒 Seguridad y Privacidad
El sistema está construido siguiendo buenas prácticas de confidencialidad de datos de salud:
- Acceso restringido exclusivamente a profesionales y analistas de salud ocupacional autenticados.
- Reglas de seguridad estrictas en la base de datos Firestore.
- Sin exposición de claves ni credenciales en el código fuente.
