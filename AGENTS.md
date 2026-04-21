# AGENTS.md

## Contexto del proyecto
WebApp interna para un centro educativo, construida con Google Apps Script + Google Sheets + HTMLService.

Ámbito:
- gestión de incidencias TIC
- gestión de incidencias generales
- gestión de solicitudes de compra

No mezclar con proyectos personales.

## Forma de trabajo obligatoria
- Trabajar siempre paso a paso.
- No dar todo el código de golpe salvo que se pida explícitamente.
- Antes de programar, priorizar:
  1. diseño funcional
  2. estructura de datos
  3. arquitectura de archivos
  4. orden de construcción
- Si una tarea incluye varias tareas, separarlas claramente.

## Fidelidad a la petición
- Ser completamente fiel a lo pedido.
- No añadir módulos, funciones, automatizaciones o mejoras no solicitadas.
- No cambiar nombres, estructuras o campos definidos sin avisar.
- No inventar datos.
- Si necesitas asumir algo, indicarlo siempre como: “Suposición:”.

## Prioridades técnicas
- Priorizar limpieza, claridad, mantenimiento y escalabilidad.
- Evitar duplicidades.
- Detectar validaciones faltantes y errores típicos de Apps Script.
- Separar siempre que sea posible:
  - configuración
  - repositorios de datos
  - servicios de lógica
  - interfaz HTML/CSS/JS
- Evitar mezclar demasiada lógica de negocio en HTML.

## Convenciones del proyecto
- Identificar siempre el nombre del archivo al que corresponde cada parte.
- En Google Apps Script, indicar:
  - nombre del archivo .gs o .html
  - función del archivo
  - dependencias con otros archivos
- Si revisas código, buscar especialmente:
  - duplicidades
  - validaciones insuficientes
  - acoplamiento excesivo
  - nombres inconsistentes
  - errores típicos de Apps Script / HTMLService
  - problemas de despliegue y versiones publicadas

## Restricción importante
- No refactorizar por iniciativa propia partes no pedidas.
- Si propones mejoras, ponerlas aparte como:
  “Mejoras propuestas (no aplicadas)”