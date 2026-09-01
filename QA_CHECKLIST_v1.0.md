# QA Checklist v1.0 - Dashboard Bancario Red Intelfon

## 1. Pruebas de login

### 1.1 Login con `intelfon`
- [ ] Ingresar usuario `intelfon` con credenciales válidas.
- [ ] Verificar que la autenticación se realiza correctamente.
- [ ] Confirmar que la sesión queda activa.
- [ ] Verificar que el usuario queda asociado a `GLOBAL`.
- [ ] Confirmar que la vista principal carga en modo consolidado.
- [ ] Validar que no se muestra acceso operativo en la interfaz.

### 1.2 Login con `masterguatemala`
- [ ] Ingresar usuario `masterguatemala` con credenciales válidas.
- [ ] Verificar que la autenticación se realiza correctamente.
- [ ] Confirmar que la sesión queda activa.
- [ ] Verificar que el usuario queda asociado a `GT`.
- [ ] Confirmar que la vista principal carga en modo regional GT.
- [ ] Validar que las funciones operativas quedan habilitadas.

### 1.3 Login con `mastersalvador`
- [ ] Ingresar usuario `mastersalvador` con credenciales válidas.
- [ ] Verificar que la autenticación se realiza correctamente.
- [ ] Confirmar que la sesión queda activa.
- [ ] Verificar que el usuario queda asociado a `SV`.
- [ ] Confirmar que la vista principal carga en modo regional SV.
- [ ] Validar que las funciones operativas quedan habilitadas.

### 1.4 Casos de login inválido
- [ ] Intentar login con usuario inexistente.
- [ ] Intentar login con contraseña incorrecta.
- [ ] Verificar que la aplicación no deja avanzar a dashboard.
- [ ] Verificar que la sesión no queda persistida.

## 2. Pruebas de permisos

### 2.1 Navegación por usuario
- [ ] Para `intelfon`, navegar por las vistas disponibles para `GLOBAL`.
- [ ] Para `masterguatemala`, navegar por las vistas disponibles para `GT`.
- [ ] Para `mastersalvador`, navegar por las vistas disponibles para `SV`.
- [ ] Verificar que no se muestran vistas no autorizadas.
- [ ] Verificar que los menús y accesos reflejan la política del usuario.

### 2.2 Botones visibles
- [ ] Verificar que para `GLOBAL` no aparece la opción de `Generator`.
- [ ] Verificar que para `GT` aparece la opción de `Generator`.
- [ ] Verificar que para `SV` aparece la opción de `Generator`.
- [ ] Validar que el acceso al módulo de generación sigue la política de permisos.
- [ ] Validar que los botones operativos no se muestran para usuarios globales.

### 2.3 Acceso directo por URL
- [ ] Intentar acceder directamente a la ruta del `Generator` como `intelfon`.
- [ ] Verificar que se bloquea el acceso.
- [ ] Intentar acceder directamente a la ruta del `Generator` como `masterguatemala`.
- [ ] Verificar que la ruta es accesible.
- [ ] Intentar acceder directamente a la ruta del `Generator` como `mastersalvador`.
- [ ] Verificar que la ruta es accesible.
- [ ] Intentar acceder a rutas no autorizadas desde otros roles.
- [ ] Confirmar que el router redirige o deniega correctamente.

## 3. Pruebas Generator

### 3.1 Generator para `GT`
- [ ] Iniciar sesión como `masterguatemala`.
- [ ] Abrir `Generator`.
- [ ] Cargar un archivo válido para GT.
- [ ] Confirmar que el flujo de validación se ejecuta.
- [ ] Verificar que el proceso continúa sin bloquearse por permisos.
- [ ] Confirmar que no aparece error de acceso por región.

### 3.2 Generator para `SV`
- [ ] Iniciar sesión como `mastersalvador`.
- [ ] Abrir `Generator`.
- [ ] Cargar un archivo válido para SV.
- [ ] Confirmar que el flujo de validación se ejecuta.
- [ ] Verificar que el proceso continúa sin bloquearse por permisos.
- [ ] Confirmar que no aparece error de acceso por región.

### 3.3 Bloqueo GLOBAL
- [ ] Iniciar sesión como `intelfon`.
- [ ] Verificar que el botón de `Generator` no existe.
- [ ] Intentar abrir la vista del `Generator` mediante acceso directo.
- [ ] Confirmar que el sistema bloquea la navegación.
- [ ] Validar que no se dispara flujo de generación ni envío a Make.

## 4. Pruebas Sync

### 4.1 Presencia GT/SV
- [ ] Iniciar sesión como `masterguatemala`.
- [ ] Confirmar que el sistema inicia sincronización regional.
- [ ] Verificar que se observa presencia o estado activo relacionado con GT.
- [ ] Iniciar sesión como `mastersalvador`.
- [ ] Confirmar que el sistema inicia sincronización regional.
- [ ] Verificar que se observa presencia o estado activo relacionado con SV.

### 4.2 Ausencia GLOBAL
- [ ] Iniciar sesión como `intelfon`.
- [ ] Verificar que no se inicia sincronización regional.
- [ ] Confirmar que no aparecen indicadores de presencia de GT/SV asociados al usuario global.
- [ ] Validar que el usuario global no dispara procesos de sincronización.

## 5. Pruebas Report Viewer

### 5.1 Report Viewer GLOBAL
- [ ] Iniciar sesión como `intelfon`.
- [ ] Cargar la vista de overview o report viewer global.
- [ ] Verificar que la vista se renderiza en modo `GLOBAL`.
- [ ] Validar que los datos consolidados se muestran correctamente.
- [ ] Revisar KPIs y tablas relevantes.
- [ ] Confirmar que no se activa flujo operativo asociado a región.

### 5.2 Report Viewer GT
- [ ] Iniciar sesión como `masterguatemala`.
- [ ] Cargar la vista de report viewer GT.
- [ ] Verificar que los datos correspondan a GT.
- [ ] Validar filtros y métricas.
- [ ] Confirmar que la visualización refleja el contexto regional de GT.

### 5.3 Report Viewer SV
- [ ] Iniciar sesión como `mastersalvador`.
- [ ] Cargar la vista de report viewer SV.
- [ ] Verificar que los datos correspondan a SV.
- [ ] Validar filtros y métricas.
- [ ] Confirmar que la visualización refleja el contexto regional de SV.

### 5.4 Filtros
- [ ] Probar al menos un filtro básico en `GLOBAL`.
- [ ] Probar al menos un filtro básico en `GT`.
- [ ] Probar al menos un filtro básico en `SV`.
- [ ] Verificar que el cambio de filtro actualiza la información visible.
- [ ] Confirmar que los filtros no rompen la vista ni producen datos incoherentes.
- [ ] Verificar que al limpiar filtros se recupera el estado correcto.

### 5.5 Exportación PDF
- [ ] Iniciar sesión como `intelfon`.
- [ ] Generar PDF desde el report viewer global.
- [ ] Verificar que la exportación se completa sin errores.
- [ ] Iniciar sesión como `masterguatemala`.
- [ ] Generar PDF desde el report viewer GT.
- [ ] Verificar que la exportación se completa sin errores.
- [ ] Iniciar sesión como `mastersalvador`.
- [ ] Generar PDF desde el report viewer SV.
- [ ] Verificar que la exportación se completa sin errores.
- [ ] Verificar que el PDF contiene contenido consistente con la vista mostrada.

## 6. Criterios de aprobación / fallo

### Criterios de aprobación
- [ ] El login funciona para `intelfon`, `masterguatemala` y `mastersalvador`.
- [ ] La región asignada coincide con la política esperada.
- [ ] `GLOBAL` solo tiene acceso de visualización.
- [ ] `GT` y `SV` tienen acceso operativo.
- [ ] `Generator` está bloqueado para `GLOBAL`.
- [ ] `Generator` está habilitado para `GT` y `SV`.
- [ ] `Sync` se ejecuta solamente en `GT` y `SV`.
- [ ] `Sync` no se ejecuta en `GLOBAL`.
- [ ] `Report Viewer` funciona correctamente en `GLOBAL`, `GT` y `SV`.
- [ ] Los filtros y la exportación PDF responden correctamente.
- [ ] No se presentan accesos no autorizados por URL ni por UI.

### Criterios de fallo
- [ ] Cualquier usuario logra acceder a `Generator` sin estar autorizado.
- [ ] `GLOBAL` inicia sincronización o flujo de ejecución operativo.
- [ ] `GT` o `SV` quedan bloqueados para operaciones esperadas.
- [ ] La región asignada no coincide con la política esperada.
- [ ] El router permite acceso directo a rutas no autorizadas.
- [ ] Los filtros no actualizan correctamente la vista.
- [ ] El PDF no se genera o contiene contenido incorrecto.
- [ ] La interfaz muestra botones o accesos que no correspondan al perfil del usuario.

## 7. Resultado esperado del sistema

- [ ] `GLOBAL` = solo visualización
- [ ] `GT` = operativo
- [ ] `SV` = operativo
- [ ] `Generator` permitido solo en `GT/SV`
- [ ] `Make` permitido solo en `GT/SV`
- [ ] `Sync` permitido solo en `GT/SV`
- [ ] `Report Viewer` operativo y consistente para todos los perfiles autorizados
