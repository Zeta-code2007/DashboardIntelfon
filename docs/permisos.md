# Permisos actuales del proyecto

Este documento describe la política enfocada en la implementación actual del dashboard.

## 1. Usuario `intelfon`

### Región
- `GLOBAL`

### Política
- acceso de solo lectura
- sin operaciones de generación
- sin sincronización regional
- sin envío a Make

### Comportamiento actual

La lógica de región en `src/js/services/regionService.js` devuelve `GLOBAL` para `intelfon`.

La validación de permisos en `src/js/core/permissions.js` restringe los módulos operativos para este usuario.

La interfaz también elimina el botón de Generator para este usuario en `applyPermissions()`.

Resultado actual:
- puede consultar resúmenes y reportes
- no puede usar `Generator`
- no entra en flujos operativos

## 2. Usuario `masterguatemala`

### Región
- `GT`

### Política
- operativo
- acceso a Generator
- sincronización regional habilitada
- envío a Make habilitado

### Comportamiento actual

`RegionService` devuelve `GT` para `masterguatemala`.

`Session` ejecuta `SyncService.initSync('GT', user)` al iniciar el dashboard.

`Permissions` permite acceso a módulos operativos, incluyendo `generator`.

## 3. Usuario `mastersalvador` y `masterelsalvador`

### Región
- `SV`

### Política
- operativo
- acceso a Generator
- sincronización regional habilitada
- envío a Make habilitado

### Comportamiento actual

`RegionService` devuelve `SV` para ambos usuarios.

`Session` ejecuta `SyncService.initSync('SV', user)`.

`Permissions` permite acceso a módulos operativos, incluyendo `generator`.

## 4. Resumen de política

- `intelfon` => `GLOBAL` => lectura consolidada
- `masterguatemala` => `GT` => operativo
- `mastersalvador` / `masterelsalvador` => `SV` => operativo

La separación está implementada y se refuerza en:

- `src/js/core/permissions.js`
- `src/js/core/session.js`
- `src/js/core/router.js`
- `src/js/services/makeService.js`
- `src/js/services/syncService.js`
