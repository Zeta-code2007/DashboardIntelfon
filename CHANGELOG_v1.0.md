# CHANGELOG v1.0

## 1. Estado inicial del proyecto antes de la estabilización

Antes de la estabilización, el proyecto presentaba una configuración funcional previa con una separación de roles y regiones, pero con una regresión en la capa de permisos y sesión que hacía que el comportamiento global no se tratara consistentemente como un modo de solo lectura.

El sistema estaba estructurado como una aplicación web estática de navegador con una arquitectura basada en servicios, routing, sesión y permisos. La lógica de identidad y región se apoyaba en:

- `src/js/services/authService.js`
- `src/js/services/regionService.js`
- `src/js/core/permissions.js`
- `src/js/core/session.js`
- `src/js/core/router.js`

La intención funcional era clara:

- `GLOBAL` debía tener acceso de consolidación visual y lectura
- `GT` y `SV` debían operar de forma funcional
- `Generator`, `Make` y `Sync` debían quedar restringidos a regiones operativas

Sin embargo, la política real había drifted en la capa de permisos y acceso, y la validación de sesión/router estaba permitiendo comportamientos que no correspondían al modelo final deseado.

En ese punto se evidenció que el problema no era una falla de identidad ni de resolución de región, sino una corrección de política y control de acceso.

## 2. Cambios realizados

### 2.1 Implementación de GLOBAL

Se consolidó el modelo en el que `intelfon` se resuelve como usuario de tipo `GLOBAL`.

Esto implicó dejar explícito que la visión global no es una región operativa, sino una vista consolidada de lectura.

El comportamiento final se basó en:

- resolución de región en `RegionService`
- validación de permisos en `Permissions`
- protección del router
- control del flujo de sesión

### 2.2 Separación GLOBAL vs GT/SV

Se dejó estandarizada la separación del sistema en dos tipos de acceso:

- `GLOBAL`: visualización consolidada / lectura
- `GT` / `SV`: operación del negocio y generación de reportes

La separación se reforzó en las capas de:

- autenticación
- región
- permisos
- router
- sesión
- sincronización
- report viewer

Es decir, el proyecto mantiene compatibilidad con la versión funcional anterior, pero corrige la clasificación semántica y la ejecución real de cada flujo.

### 2.3 Corrección de permisos

Se ajustó la lógica de permisos para restringir `GLOBAL` a accesos no operativos.

Esto afectó principalmente:

- `src/js/core/permissions.js`

La regla fue corregida para que:

- `GLOBAL` no pueda operar como región de producción
- `GT` y `SV` permanezcan habilitados para flujos operativos

### 2.4 Bloqueo Generator para GLOBAL

Se validó y dejó explícito que el módulo `Generator` no está disponible para `GLOBAL`.

Esto se aplicó al nivel de permisos y a la visibilidad de la interfaz. La intención fue evitar que un usuario global pudiese activar actividades que corresponden solamente a las regiones operativas.

### 2.5 Validación de Sync solo GT/SV

Se confirmó que la sincronización regional solo se ejecuta cuando la región activa es `GT` o `SV`.

Esto quedó protegido en la lógica de sesión y en el servicio de sincronización, evitando que `GLOBAL` iniciara procesos de sincronización no permitidos.

### 2.6 Integración de RegionService

Se validó y reforzó el uso de `RegionService` como capa de resolución de región activa.

Esto hizo que el sistema se comportara de forma consistente para:

- `intelfon` => `GLOBAL`
- `masterguatemala` => `GT`
- `mastersalvador` / `masterelsalvador` => `SV`

La integración de esta capa fue clave para mantener la separación entre visualización global y operación regional.

### 2.7 Validación Report Viewer GLOBAL

Se validó que el visor de reportes global funciona como vista consolidada, con carga de datos apropiados para `GLOBAL`.

La revisión confirmó que:

- `overview` carga la vista global
- `report-viewer.html` soporta `GLOBAL`, `GT` y `SV`
- el flujo global no se está ejecutando como operación regional
- la vista consolidada se mantiene compatible con el comportamiento funcional esperado

### 2.8 Documentación técnica creada

Se generó la documentación técnica del estado actual del proyecto para dejar el sistema claramente definido y mantenible.

Los documentos creados fueron:

- `docs/arquitectura.md`
- `docs/permisos.md`
- `docs/flujo-make.md`

Estos archivos describen la estructura actual, la política de permisos y la ruta de flujo real del sistema, sin ampliar la arquitectura ni introducir cambios adicionales.

## 3. Archivos principales afectados

Los archivos principales sobre los que recayó la estabilización fueron:

- `src/js/core/permissions.js`
- `src/js/core/session.js`
- `src/js/core/router.js`
- `src/js/services/regionService.js`
- `report-viewer.html`
- `src/js/modules/generator/generator.controller.js`
- `src/js/services/makeService.js`

## 4. Reglas finales del sistema

### GLOBAL

- Solo visualización
- No Generator
- No Make
- No Sync

### GT/SV

- Operativos
- Generator permitido
- Make permitido
- Sync permitido

## 5. Resultado final

La arquitectura actual quedó estabilizada y validada en su política funcional. La aplicación mantiene compatibilidad con la versión anterior funcional, sin introducir refactorización ni cambios de arquitectura ajenos al objetivo de estabilización.

La regla final del sistema es explícita:

- `GLOBAL` = lectura consolidada
- `GT` / `SV` = operación regional

No hay un flujo operativo de `GLOBAL` hacia `Generator`, `Make` ni `Sync`.
