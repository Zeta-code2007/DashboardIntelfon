# Flujo actual de Make y reportes

Este documento describe el flujo realmente implementado en el proyecto sin añadir supuestos adicionales.

## 1. Flujo operativo para GT y SV

### 1.1 Excel

El flujo operativo comienza con archivos Excel cargados en el generador.

Archivo principal:

- `src/js/modules/generator/generator.controller.js`

El proceso de selección y validación se realiza con:

- `generator.validation.js`
- `generator.ui.js`
- `generator.state.js`

### 1.2 Generator

El generador:

- recibe archivos Excel
- valida extensión y cantidad
- dispara la operación de envío

La llamada central es:

- `enviarArchivosAMake(files, tipoReporte)`

ubicada en:

- `src/js/services/makeService.js`

### 1.3 Make

`makeService.js`:

1. lee cada archivo como Base64
2. crea un `executionId`
3. resuelve la región operativa (`GT` o `SV`)
4. arma un `FormData`
5. hace `fetch()` al webhook configurado en `CONFIG.MAKE_WEBHOOK_URL`

La respuesta del webhook se parsea con `parseMakeResponse()`.

### 1.4 Respuesta JSON

La respuesta del webhook puede ser:

- texto `accepted`
- JSON con metadata del proceso
- propiedades como `pais`, `region`, `ejecucion_id`, `execution_id`

El parser se encarga de convertir esa respuesta en una estructura útil para el dashboard.

### 1.5 Parser

Archivo:

- `src/js/modules/generator/generator.parser.js`

El parser normaliza la información y prepara los datos para la vista del report viewer.

### 1.6 Report Viewer

Archivo:

- `report-viewer.html`

El visor toma los datos finalizados y renderiza:

- KPIs
- bancos
- cuentas
- movimientos diarios
- filtros de fecha
- gráficos

El visor además soporta `region=GT`, `region=SV` y `region=GLOBAL`.

## 2. Flujo GLOBAL

Para `intelfon`, el flujo no entra en generación ni sincronización operativa.

El comportamiento actual es:

- `RegionService` -> `GLOBAL`
- `Permissions` -> lectura consolidada
- `Session` -> no llama `SyncService` para GLOBAL
- `Router` -> no permite acceso a `generator`
- `overview` -> carga el visor con `region: 'GLOBAL'`

Esto significa que el usuario `intelfon` ve la vista consolidada global sin ejecutar procesos operativos ni enviar archivos a Make.

## 3. Resumen del flujo

GT/SV:

```
Excel
↓
Generator
↓
Make
↓
Respuesta JSON
↓
Parser
↓
Report Viewer
```

GLOBAL:

```
Login
↓
RegionService = GLOBAL
↓
Permissions = lectura
↓
Report Viewer con región GLOBAL
```

No existe en la implementación actual un flujo de `GLOBAL -> Generator -> Make`; la separación es explícita y funcional.
