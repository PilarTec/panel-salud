---
sidebar_position: 1
title: Introducción
---

# Panel de Salud Ocupacional

Documentación técnica y funcional del sistema de vigilancia epidemiológica y gestión de Exámenes Médicos Ocupacionales (EMO).

---

## Objetivos del Sistema

1. **Centralización de datos:** Consolidación de nóminas médicas periódicas, de ingreso y de retiro en base de datos protegida.
2. **Seguimiento epidemiológico:** Indicadores de cobertura, vigencia de exámenes y distribución de aptitud en tiempo real.
3. **Estandarización diagnóstica:** Normalización de hallazgos mediante sinónimos y matriz de severidad ponderada (Crítico, Alto, Medio, Bajo).
4. **Vigilancia por protocolos:** Trazabilidad de agentes ocupacionales (ruido, altura física/geográfica, ergonomía).

---

## Módulos Principales

| Módulo | Alcance |
|---|---|
| **[Dashboard](./modulo-dashboard)** | Métricas ejecutivas, coberturas y evolución temporal. |
| **[Exámenes y Protocolos](./modulo-examenes)** | Desglose por tipo de evaluación, sede y factores de riesgo. |
| **[Catálogo y Triaje](./modulo-catalogo)** | Matriz de riesgo, administración de diagnósticos y sinónimos. |
| **[Verificación de Pacientes](./modulo-pacientes)** | Consulta nominal, ficha médica individual y control de aptitud. |

---

## Seguridad
- Autenticación requerida para todas las consultas y modificaciones en base de datos.
- Aislamiento de credenciales mediante variables de entorno locales.
- Reglas de Firestore que restringen la lectura y escritura a cuentas autorizadas.
