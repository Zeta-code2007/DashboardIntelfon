# Arquitectura actual del proyecto

Este documento describe la implementación actual del dashboard de RED INTELFON tal como está en el código.

## 1. Visión general

El proyecto es una aplicación web estática en navegador, con módulos JavaScript ES importados y una estructura por capas:

- autenticación
- sesión
- permisos
- enrutamiento
- servicios de región/sincronización
- generador de reportes
- Make webhook
- visor de reportes

No es un framework SPA completo; la navegación se resuelve con un router propio y la vista principal se carga en el DOM.

## 2. Flujo completo: login hasta dashboard

### 2.1 Inicio de la app

El punto de entrada es:

- `src/js/core/app.js`

En `DOMContentLoaded` se inicializan:

1. `initTheme()`
2. `initRouter()`
3. `initSession()`

### 2.2 Login

La autenticación está en:

- `src/js/services/authService.js`

`AuthService` mantiene usuarios semilla para:

- `intelfon`
- `masterguatemala`
- `mastersalvador`
- `masterelsalvador`

El usuario se guarda en `sessionStorage` o `localStorage` según el tipo de sesión (`remember`).

La lógica principal:

- `_getUsersDB()` obtiene o crea la base local de usuarios
- `login()` valida usuario/contraseña
- `isAuthenticated()` verifica sesión activa
- `getUser()` reconstruye el usuario actual
- `logout()` limpia la sesión

### 2.3 Sesión y dashboard

La sesión está en:

- `src/js/core/session.js`

Flujo:

1. `checkAuthentication()` decide si mostrar login o dashboard
2. `showLoginScreen()` renderiza login
3. `showDashboardScreen(user)` elimina modal de login y abre el dashboard
4. `initializeDashboard(user)` calcula la región activa y arranca sincronización si aplica
5. `applyPermissions()` aplica visibilidad del menú
6. `loadView('overview')` carga la vista inicial

### 2.4 Región activa

La resolución de región está en:

- `src/js/services/regionService.js`

`RegionService.getActiveRegion()` devuelve:

- `GLOBAL` para `intelfon`
- `GT` para `masterguatemala`
- `SV` para `mastersalvador` o `masterelsalvador`

También expone:

- `getOtherRegion(region)`
- `getRegionMeta(regionCode)`

### 2.5 Permisos y enrutamiento

Los permisos están en:

- `src/js/core/permissions.js`

La política actual es:

- `GLOBAL` = lectura consolidada
- `GT` / `SV` = acceso operativo

El router está en:

- `src/js/core/router.js`

`views` define cada vista con:

- `title`
- `render`
- `permission`

Antes de renderizar una vista, `loadView(viewName)` ejecuta:

- `view.permission && !canAccess(view.permission)`

Si falla, redirige a `overview`.

## 3. AuthService

Archivo:

- `src/js/services/authService.js`

Responsabilidades actuales:

- definir identidades maestras
- construir base local de usuarios
- validar credenciales
- guardar sesión
- devolver usuario actual
- resolver si el usuario es global o regional

Se usa para distinguir:

- `intelfon` (GLOBAL)
- `masterguatemala` (GT)
- `mastersalvador` (SV)
- `masterelsalvador` (SV)

## 4. RegionService

Archivo:

- `src/js/services/regionService.js`

Responsabilidades actuales:

- resolver la región del usuario autenticado
- devolver metadatos de país/región
- manejar fallback a última región guardada en `localStorage`

La lógica central es:

- si username es `intelfon` => `GLOBAL`
- si username es `masterguatemala` => `GT`
- si username es `mastersalvador` o `masterelsalvador` => `SV`

## 5. Permissions

Archivo:

- `src/js/core/permissions.js`

Responsabilidades actuales:

- `getCurrentUser()`
- `getUserRegion()`
- `getUserRole()`
- `isGlobalMaster()`
- `isGuatemalaMaster()`
- `isElSalvadorMaster()`
- `canAccess(module, user)`
- `applyPermissions()`

La política actual es explícita:

- GLOBAL: solo módulos de consulta/lectura
- GT/SV: módulos operativos incluidos `generator`

Esto se aplica también a la visibilidad del botón de menú.

## 6. Router

Archivo:

- `src/js/core/router.js`

El router registra vistas como:

- `overview`
- `generator`
- `history`
- `bank-detail`
- `daily-flow`
- `account-detail`
- `users`

Cada una tiene `permission` y la validación se hace en `loadView()` usando `canAccess()`.

## 7. Session

Archivo:

- `src/js/core/session.js`

`initSession()` prepara nodos DOM del sidebar y logout.

`showDashboardScreen(user)`:

1. elimina modal de login
2. muestra sidebar y contenido principal
3. obtiene usuario actual
4. llama `initializeDashboard(currentUser)`
5. llama `applyPermissions()`
6. carga la vista `overview`

`initializeDashboard(user)`:

- obtiene `activeRegion = RegionService.getActiveRegion()`
- si la región es `GT` o `SV`, inicializa `SyncService.initSync(activeRegion, user)`
- actualiza el subtítulo del header y el estado de región

## 8. SyncService

Archivo:

- `src/js/services/syncService.js`

Es un servicio de sincronización Firebase orientado a:

- presencia por región
- documentos cargados
- overrides por región

Solo se activa si la región es `GT` o `SV`:

- `if (region !== 'GT' && region !== 'SV') return;`

Escucha y publica eventos como:

- `intelfon-sync-presence`
- `intelfon-sync-document`
- `intelfon-sync-override`

No se usa para `GLOBAL`.

## 9. Generator

Archivos principales:

- `src/js/modules/generator/generator.controller.js`
- `src/js/modules/generator/generator.state.js`
- `src/js/modules/generator/generator.validation.js`
- `src/js/modules/generator/generator.ui.js`
- `src/js/modules/generator/generator.parser.js`

El generador atiende la selección de archivos Excel, validación y envío a Make.

El flujo actual es:

1. `initGenerator()` crea el contenedor
2. `registerEvents()` conecta input/dropzone/button
3. `handleFiles(files)` valida archivos
4. `generateReport()` lanza el envío
5. `enviarArchivosAMake(...)` envía archivos al webhook
6. `parseReportData(...)` interpreta la respuesta

La operación real de envío se delega a:

- `src/js/services/makeService.js`

## 10. Make

Archivo:

- `src/js/services/makeService.js`

Responsabilidades actuales:

- leer archivos como Base64
- crear `executionId`
- resolver la región `GT` o `SV`
- armar `FormData`
- POST al webhook configurado en `CONFIG.MAKE_WEBHOOK_URL`
- parsear la respuesta del webhook

La lógica central valida que la región sea operativa:

- `GT`
- `SV`

Y rechaza/evita una región que no sea operativa.

## 11. Report Viewer

Archivo:

- `report-viewer.html`

Es un visor completo de reportes bancarios.`reportSection.js` lo carga en un iframe con query param `region` y un hash de vista (`#resumen`, `#bancos`, etc.).

El visor:

- interpreta el parámetro `region`
- soporta `GLOBAL`, `GT` y `SV`
- crea `COUNTRY_CONFIG`
- separa `RAW_TRANSACTIONS_BY_COUNTRY`
- acumula `BASE_DATA_BY_COUNTRY`
- construye `GLOBAL` como suma de GT + SV
- renderiza KPIs, tablas, gráficos y filtros

El `overview` manda explícitamente `region: 'GLOBAL'` en:

- `src/js/views/overview.js`

Esto es el punto de entrada de la vista consolidada global.

## 12. Resumen funcional

El sistema actual establece claramente dos niveles:

- `GLOBAL`: consolidado, lectura, ninguna operación de sincronización ni generación
- `GT` / `SV`: operativos, generación, sincronización y envío a Make

La separación está reforzada por:

- `AuthService`
- `RegionService`
- `Permissions`
- `Session`
- `SyncService`
- `MakeService`
- `Router`
- `report-viewer.html`

No hay una refactorización completa ni una arquitectura alternativa; el proyecto sigue un modelo funcional basado en servicios y reglas de permisos por usuario y región.
