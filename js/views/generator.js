import { enviarArchivosAMake } from '../services/makeService.js';
import { Toast } from '../services/toastService.js';
import { SyncService } from '../services/syncService.js';
import { RegionService } from '../services/regionService.js';
import { FirebaseService } from '../services/firebaseService.js';
import { CONFIG } from '../config.js';
/**
 * Función auxiliar para sanitizar cadenas y prevenir inyecciones HTML.
 */
function escapeHtml(str) {
    if (str === null || str === undefined) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

/**
 * Formatea el tamaño de bytes a una cadena legible (KB, MB).
 */
function formatFileSize(bytes) {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Transforma la URL de descarga o enlace de Google Drive en una URL optimizada para incrustar en un iframe.
 * @param {string} url - URL del archivo devuelta por Make (data.urlDescarga).
 * @returns {string} URL formateada para el visor de Google Drive / Docs.
 */
function getEmbedPreviewUrl(url) {
    if (!url || typeof url !== 'string' || url === '#' || url.trim() === '') {
        return '';
    }

    const trimmedUrl = url.trim();

    // 1. Enlace estándar de Google Drive: https://drive.google.com/file/d/ID_DEL_ARCHIVO/view
    const driveFileMatch = trimmedUrl.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
    if (driveFileMatch && driveFileMatch[1]) {
        return `https://drive.google.com/file/d/${driveFileMatch[1]}/preview`;
    }

    // 2. Enlace de Google Drive por parámetro id: https://drive.google.com/open?id=ID o ?id=ID
    const driveIdMatch = trimmedUrl.match(/[?&]id=([a-zA-Z0-9_-]+)/);
    if (driveIdMatch && driveIdMatch[1]) {
        return `https://drive.google.com/file/d/${driveIdMatch[1]}/preview`;
    }

    // 3. Enlace de Google Sheets: https://docs.google.com/spreadsheets/d/ID_HOJA/
    const sheetMatch = trimmedUrl.match(/\/spreadsheets\/d\/([a-zA-Z0-9_-]+)/);
    if (sheetMatch && sheetMatch[1]) {
        return `https://docs.google.com/spreadsheets/d/${sheetMatch[1]}/preview`;
    }

    // 4. Si la URL ya incluye el endpoint de preview directo
    if (trimmedUrl.includes('/preview')) {
        return trimmedUrl;
    }

    // 5. Fallback para URLs públicas directas (ej: S3, Storage, etc.) usando el visor oficial de Google Docs
    return `https://docs.google.com/gview?url=${encodeURIComponent(trimmedUrl)}&embedded=true`;
}

function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function esperarReporteFinalFirebase(
    pais,
    executionId,
    timeoutMs = 300000
) {
    const inicio = Date.now();

    const path =
        `${CONFIG.SYNC.rootPath}/reportes_finalizados/` +
        `${pais}/${executionId}`;

    console.log(
        '[Generator] Esperando resultado oficial de Make:',
        path
    );

    while (Date.now() - inicio < timeoutMs) {
        let reporte = null;

        try {
            reporte = await FirebaseService.getOnce(path);
        } catch (error) {
            console.warn(
                '[Generator] Firebase todavía no disponible:',
                error
            );
        }

        if (reporte) {
            console.log(
                '[Generator] Estado Firebase:',
                reporte.estado
            );

            if (
                reporte.estado === 'finalizado' &&
                String(reporte.ejecucion_id || '') ===
                    String(executionId)
            ) {
                return reporte;
            }

            if (
                reporte.estado === 'error' ||
                reporte.estado === 'fallido'
            ) {
                throw new Error(
                    reporte.mensaje ||
                    reporte.error ||
                    'Make reportó un error durante el procesamiento.'
                );
            }
        }

        await delay(3000);
    }

    throw new Error(
        'Make no finalizó el reporte dentro de 5 minutos. ' +
        'Revisa el historial del escenario en Make.'
    );
}

export function renderGenerator() {
    const container = document.createElement('div');
    container.className = 'max-w-5xl mx-auto space-y-8';

    // La región activa determina exclusivamente qué país puede subir/procesar archivos.
    // Cada sesión (Guatemala o El Salvador) solo ve y gestiona los datos de su propio país.
    const activeRegion = RegionService.getActiveRegion();
    const regionMeta = RegionService.getRegionMeta(activeRegion);
    const isGT = activeRegion === 'GT';

    container.innerHTML = `
        <!-- TARJETA PRINCIPAL DEL FORMULARIO -->
        <div class="card-intelfon p-8 space-y-6">
            <div class="border-b border-slate-100 pb-4">
                <h3 class="text-xl font-extrabold text-slate-800 tracking-tight">Generar Nuevo Reporte Excel · ${regionMeta.flag} ${regionMeta.name}</h3>
                <p class="text-sm text-slate-500 mt-1">Sube el/los archivo(s) bancario(s) de ${regionMeta.name} en formato Excel (.xlsx) para procesarlos con el flujo automatizado en Make.com.</p>
            </div>

            <!-- ALERTA VISUAL DE ERROR (OCULTA POR DEFECTO) -->
            <div id="error-alert" class="hidden bg-red-50/90 border-l-4 border-intelfon-red p-5 rounded-r-xl shadow-xs">
                <div class="flex items-start">
                    <div class="flex-shrink-0 mt-0.5">
                        <svg class="h-5 w-5 text-intelfon-red" viewBox="0 0 20 20" fill="currentColor">
                            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"/>
                        </svg>
                    </div>
                    <div class="ml-3.5 flex-1 space-y-1">
                        <h4 id="error-title" class="text-sm font-bold text-red-900">Error al procesar la solicitud</h4>
                        <p id="error-message" class="text-xs text-red-700 leading-relaxed"></p>
                    </div>
                    <button type="button" id="btn-close-error" class="ml-auto text-red-400 hover:text-red-700 p-1">
                        <svg class="w-4 h-4 fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                    </button>
                </div>
            </div>

            <form id="generator-form" class="space-y-6">
                <div>
                    <label for="tipo-reporte" class="block text-xs font-bold uppercase text-slate-600 tracking-wider mb-2">Tipo de Reporte</label>
                    <select id="tipo-reporte" class="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-red-500 focus:border-red-500 bg-white transition-all shadow-xs">
                        <option value="bancario">Bancario / Finanzas</option>
                        <option value="ventas">Ventas</option>
                        <option value="inventario">Inventario</option>
                    </select>
                </div>

                <!-- ZONA DE CARGA: solo el país de la sesión activa. Cada dashboard gestiona
                     únicamente sus propios archivos; no existe forma de subir los del otro país. -->
                <div class="space-y-2">
                    <div class="flex items-center justify-between">
                        <label class="block text-xs font-bold uppercase text-slate-600 tracking-wider">${regionMeta.flag} ${regionMeta.name}</label>
                        <span id="sv-counter-badge" class="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-500">${isGT ? '1 archivo' : '1 a 10 archivos'}</span>
                    </div>
                    <div id="dropzone-sv" class="dropzone-intelfon group">
                        <input type="file" id="file-input-sv" class="hidden" ${isGT ? '' : 'multiple'} accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet">
                        <div class="flex flex-col items-center justify-center space-y-3 pointer-events-none">
                            <div class="w-16 h-16 rounded-2xl bg-red-50 text-intelfon-red flex items-center justify-center group-hover:scale-110 transition-transform duration-200 shadow-xs">
                                <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path></svg>
                            </div>
                            <div class="space-y-1"><p class="text-sm font-bold text-slate-700"><span class="text-intelfon-red hover:underline">Seleccionar Excel${isGT ? '' : '(es)'} ${regionMeta.code}</span></p><p class="text-xs text-slate-400 font-medium">${isGT ? 'Un archivo .xlsx, máximo 20 MB' : 'De 1 a 10 archivos .xlsx (máx. 20 MB c/u)'}</p></div>
                        </div>
                    </div>
                </div>

                <div id="file-info-sv" class="hidden p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-3 transition-all">
                    <div class="flex items-center justify-between pb-2 border-b border-slate-200/70">
                        <div class="flex items-center space-x-2">
                            <span class="text-xs font-bold text-slate-700 uppercase tracking-wide">Archivos ${regionMeta.name}:</span>
                            <span id="sv-files-count-badge" class="text-xs font-semibold text-emerald-700 bg-emerald-100/80 px-2.5 py-0.5 rounded-full">0 / ${isGT ? '1' : '10'} seleccionados</span>
                        </div>
                        <button type="button" id="btn-remove-all-sv" class="text-xs font-semibold text-red-500 hover:text-red-700 hover:underline transition-colors flex items-center space-x-1">
                            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                            <span>Eliminar todos</span>
                        </button>
                    </div>
                    <div id="sv-files-list" class="space-y-2 max-h-60 overflow-y-auto pr-1"></div>
                    <div class="pt-1 flex items-center justify-between text-xs text-slate-400">
                        <span>${isGT ? 'Haz clic o arrastra tu archivo en el recuadro.' : 'Haz clic o arrastra más archivos en el recuadro para añadir hasta 10.'}</span>
                    </div>
                </div>

                <!-- CONTENEDOR DE ESTADO DE CARGA Y PROGRESO -->
                <div id="status-container" class="hidden space-y-3 pt-2">
                    <div class="flex items-center justify-between text-xs">
                        <span id="status-label" class="font-bold text-slate-700">Analizando ${regionMeta.name}...</span>
                        <div class="flex items-center space-x-2">
                            <span id="status-spinner" class="animate-spin w-3 h-3 border-2 border-intelfon-red border-t-transparent rounded-full inline-block"></span>
                            <span id="status-subtext" class="text-slate-400 font-medium">Ejecutando escenario...</span>
                        </div>
                    </div>
                    <div class="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden shadow-inner">
                        <div id="progress-bar" class="bg-intelfon-red h-full w-0 transition-all duration-500"></div>
                    </div>
                </div>

                <!-- BOTÓN PRINCIPAL DE ENVÍO -->
                <button
                    type="submit"
                    id="btn-submit"
                    class="btn-intelfon w-full py-4 text-sm font-bold flex items-center justify-center space-x-2 shadow-lg shadow-red-900/10 cursor-pointer"
                >
                    <span id="btn-submit-icon">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path>
                        </svg>
                    </span>
                    <span id="btn-submit-text">Procesar reporte de ${regionMeta.name}</span>
                </button>
                <button type="button" id="btn-clear-dashboard" class="btn-intelfon-secondary w-full py-3 text-sm flex items-center justify-center space-x-2 border border-slate-300 dark:border-slate-700">
                    <svg class="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                    <span>Limpiar dashboard</span>
                </button>
            </form>
        </div>

        <!-- =========================================================================
             SECCIÓN DE RESULTADOS (OCULTA POR DEFECTO HASTA RECIBIR RESPUESTA DE MAKE)
             ========================================================================= -->
        <div id="results-panel" class="hidden space-y-8 animate-fade-in">
            
            <!-- TARJETA 1: ACCIONES RÁPIDAS Y PREVISUALIZACIÓN -->
            <div class="card-intelfon p-8 space-y-6">
                <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
                    <div>
                        <div class="flex items-center space-x-2">
                            <span class="badge-status badge-success">
                                <span class="badge-status-dot"></span>
                                Procesado Exitosamente
                            </span>
                            <span class="text-xs text-slate-400">Respuesta recibida</span>
                        </div>
                        <h4 class="text-lg font-extrabold text-slate-800 tracking-tight mt-1">Resultado del Procesamiento</h4>
                    </div>

                    <!-- Acciones Principales -->
                    <div class="flex flex-wrap items-center gap-3">
                        <button type="button" id="btn-download-excel" class="btn-intelfon-primary text-xs py-2.5 px-4 flex items-center shadow-md bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600">
                            <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
                            <span>Descargar Archivo Excel (.xlsx)</span>
                        </button>
                        <button type="button" id="btn-transfer-overview" class="btn-intelfon-secondary text-xs py-2.5 px-4 flex items-center shadow-xs border border-slate-300 dark:border-slate-700">
                            <svg class="w-4 h-4 mr-2 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 12h16m-7-7l7 7-7 7"></path></svg>
                            <span>Transferir datos al Overview</span>
                        </button>
                        <button type="button" id="btn-view-full-report" class="btn-intelfon-secondary text-xs py-2.5 px-4 flex items-center shadow-xs border border-slate-300 dark:border-slate-700">
                            <svg class="w-4 h-4 mr-2 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path></svg>
                            <span>Ver en Pantalla Completa</span>
                        </button>
                    </div>
                </div>

                <!-- Resumen Estadístico Dinámico (Tarjetas KPI) -->
                <div>
                    <h5 class="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Métricas Generales</h5>
                    <div id="summary-cards" class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                        <!-- Se renderiza dinámicamente -->
                    </div>
                </div>

                <!-- Tabla de Previsualización Dinámica -->
                <div>
                    <h5 class="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Detalle del Contenido</h5>
                    <div class="overflow-x-auto border border-slate-200 rounded-xl shadow-xs">
                        <table class="table-modern">
                            <thead id="table-head">
                                <tr>
                                    <th>ID</th>
                                    <th>Cliente / Banco</th>
                                    <th>Monto / Saldo</th>
                                    <th>Estado</th>
                                </tr>
                            </thead>
                            <tbody id="table-body" class="divide-y divide-slate-100">
                                <!-- Filas dinámicas -->
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            <!-- TARJETA 2: BANNER Y VISOR INTERACTIVO -->
            <div id="document-preview-section" class="card-intelfon p-8 space-y-6">
                <!-- Banner Destacado del Visor de Código -->
                <div class="p-6 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-800 text-white rounded-2xl flex flex-col md:flex-row items-center justify-between gap-5 shadow-lg border border-slate-800">
                    <div class="space-y-1.5 text-center md:text-left">
                        <div class="flex items-center justify-center md:justify-start space-x-2">
                            <span class="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-intelfon-red text-white">
                                Visor Web Interactivo
                            </span>
                            <span class="text-xs text-slate-400 font-medium">• Generado en Código</span>
                        </div>
                        <h4 class="text-xl font-extrabold text-white tracking-tight">Informe Completo de Conciliación y Movimientos</h4>
                        <p class="text-xs text-slate-300 max-w-xl">Abre el visor en una nueva pestaña para consultar todas las transacciones, balances por cuenta bancaria, resúmenes periódicos y observaciones sin depender de visores externos.</p>
                    </div>
                    <button type="button" id="btn-open-interactive-viewer" class="btn-intelfon-primary text-xs py-3 px-6 whitespace-nowrap shadow-lg flex items-center space-x-2 font-bold cursor-pointer">
                        <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path></svg>
                        <span>Abrir Informe en Nueva Pestaña</span>
                    </button>
                </div>

                <!-- Visor Google Drive Opcional con Botones -->
                <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 border-t border-slate-100 pt-5">
                    <div>
                        <h5 class="text-sm font-bold text-slate-700">Visor de Archivo Original (Google Drive)</h5>
                        <p class="text-xs text-slate-400">Si tu archivo en Drive tiene permisos públicos, puedes visualizarlo directamente abajo.</p>
                    </div>
                    <div class="flex items-center space-x-3">
                        <button type="button" id="btn-reload-preview" class="btn-intelfon-secondary text-xs py-1.5 px-3" title="Recargar visor">
                            <svg class="w-3.5 h-3.5 mr-1.5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>
                            <span>Recargar Visor</span>
                        </button>
                        <a id="btn-open-external" href="#" target="_blank" rel="noopener noreferrer" class="btn-intelfon-secondary text-xs py-1.5 px-3" title="Abrir en Google Drive">
                            <svg class="w-3.5 h-3.5 mr-1.5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path></svg>
                            <span>Abrir en Google Drive</span>
                        </a>
                    </div>
                </div>

                <!-- CONTENEDOR DEL VISOR IFRAME -->
                <div class="excel-preview-container">
                    <div id="preview-loader" class="excel-preview-loader">
                        <div class="p-5 bg-white rounded-2xl shadow-xl border border-slate-100 flex flex-col items-center space-y-3 max-w-xs text-center">
                            <div class="w-12 h-12 rounded-xl bg-red-50 text-intelfon-red flex items-center justify-center">
                                <svg class="animate-spin h-6 w-6" fill="none" viewBox="0 0 24 24">
                                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                            </div>
                            <div>
                                <p class="text-sm font-extrabold text-slate-800">Cargando visor...</p>
                                <p class="text-xs text-slate-400 mt-0.5">Sincronizando con Drive</p>
                            </div>
                        </div>
                    </div>

                    <!-- Iframe Embebido -->
                    <iframe
                        id="excel-preview-frame"
                        class="excel-preview-iframe opacity-0"
                        src=""
                        title="Vista Previa de Reporte Excel"
                        allow="autoplay"
                    ></iframe>
                </div>
            </div>

        </div>
    `;

    // Referencias a los elementos del DOM.
    // Solo existe UN dropzone en el DOM: el del país de la sesión activa.
    const maxFiles = isGT ? 1 : 10;
    const dropzone = container.querySelector('#dropzone-sv');
    const fileInput = container.querySelector('#file-input-sv');
    const fileInfoContainer = container.querySelector('#file-info-sv');
    const svCounterBadge = container.querySelector('#sv-counter-badge');
    const svFilesCountBadge = container.querySelector('#sv-files-count-badge');
    const svFilesList = container.querySelector('#sv-files-list');
    const btnRemoveAllSv = container.querySelector('#btn-remove-all-sv');
    const form = container.querySelector('#generator-form');

    const errorAlert = container.querySelector('#error-alert');
    const errorTitle = container.querySelector('#error-title');
    const errorMessage = container.querySelector('#error-message');
    const btnCloseError = container.querySelector('#btn-close-error');

    const statusContainer = container.querySelector('#status-container');
    const progressBar = container.querySelector('#progress-bar');
    const statusLabel = container.querySelector('#status-label');
    const statusSubtext = container.querySelector('#status-subtext');
    const statusSpinner = container.querySelector('#status-spinner');

    const btnSubmit = container.querySelector('#btn-submit');
    const btnSubmitIcon = container.querySelector('#btn-submit-icon');
    const btnSubmitText = container.querySelector('#btn-submit-text');

    const resultsPanel = container.querySelector('#results-panel');
    const btnTransferOverview = container.querySelector('#btn-transfer-overview');
    const btnClearDashboard = container.querySelector('#btn-clear-dashboard');
    const btnViewFullReport = container.querySelector('#btn-view-full-report');
    const btnOpenInteractiveViewer = container.querySelector('#btn-open-interactive-viewer');
    const btnDownloadExcel = container.querySelector('#btn-download-excel');
    const summaryCards = container.querySelector('#summary-cards');
    const tableHead = container.querySelector('#table-head');
    const tableBody = container.querySelector('#table-body');

    // Referencias de la sección de Vista Previa del Documento
    const documentPreviewSection = container.querySelector('#document-preview-section');
    const btnOpenExternal = container.querySelector('#btn-open-external');
    const btnReloadPreview = container.querySelector('#btn-reload-preview');
    const previewLoader = container.querySelector('#preview-loader');
    const excelPreviewFrame = container.querySelector('#excel-preview-frame');

    // Un solo arreglo: los archivos del país de la sesión activa (máx. 1 si es GT, hasta 10 si es SV).
    const selectedFiles = [];
    let currentPreviewUrl = '';
    let lastProcessedData = null;
    let currentRunId = null;

    // Estado limpio de esta NUEVA instancia del generador.
    // No toca canProceed(); solo refleja que todavía no se seleccionó archivo aquí.
    SyncService.setDocumentStatus(activeRegion, {
        uploaded: false,
        fileName: null,
        count: 0
    }).catch(() => {});

    function createRunId() {
        if (crypto.randomUUID) return crypto.randomUUID();
        return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    }

    function purgeReportState() {
        ['intelfon_current_report', 'intelfon_processing_id'].forEach(key => {
            localStorage.removeItem(key);
        });
    }

    function replaceCurrentReport(data, runId) {
        purgeReportState();
        const snapshot = {
            runId,
            createdAt: new Date().toISOString(),
            data
        };
        const snapshotJson = JSON.stringify(snapshot);

        localStorage.setItem('intelfon_current_report', snapshotJson);

        const updateEvent = new CustomEvent('intelfon-report-updated', {
            detail: { key: 'intelfon_current_report', value: snapshot }
        });
        window.dispatchEvent(updateEvent);
    }

    // Función para abrir el visor interactivo de código en nueva pestaña / pantalla completa
    function abrirVisorInteractivo() {
        let dataToOpen = lastProcessedData;
        let runIdToOpen = currentRunId;

        if (!dataToOpen) {
            try {
                const stored = JSON.parse(localStorage.getItem('intelfon_current_report') || 'null');
                if (stored && (stored.data || stored.resultado || stored.bancos_procesados)) {
                    dataToOpen = stored.data || stored;
                    runIdToOpen = stored.runId || createRunId();
                }
            } catch (_) {}
        }

        if (!dataToOpen) {
            Toast.warning('Primero debes procesar un archivo nuevo para previsualizarlo.');
            return;
        }
        replaceCurrentReport(dataToOpen, runIdToOpen);
        window.open('report-viewer.html#resumen', '_blank');
    }

    function transferirAlOverview() {
        let dataToTransfer = lastProcessedData;
        let runIdToTransfer = currentRunId;

        if (!dataToTransfer) {
            try {
                const stored = JSON.parse(localStorage.getItem('intelfon_current_report') || 'null');
                if (stored && (stored.data || stored.resultado || stored.bancos_procesados)) {
                    dataToTransfer = stored.data || stored;
                    runIdToTransfer = stored.runId || createRunId();
                }
            } catch (_) {}
        }

        if (!dataToTransfer) {
            Toast.warning('Primero debes procesar un archivo nuevo para transferir sus datos.');
            return;
        }

        try {
            replaceCurrentReport(dataToTransfer, runIdToTransfer);
            const navBtn = document.querySelector('.nav-btn[data-view="overview"]');
            if (navBtn) {
                navBtn.click();
                Toast.success('Datos transferidos al Overview correctamente.', 'Overview Actualizado');
            } else {
                Toast.info('El archivo ya quedó disponible para el Overview.', 'Transferencia Guardada');
            }
        } catch (_) {
            Toast.error('No se pudo transferir el reporte al Overview.', 'Error de almacenamiento');
        }
    }

    if (btnTransferOverview) {
        btnTransferOverview.addEventListener('click', transferirAlOverview);
    }
    if (btnClearDashboard) {
        btnClearDashboard.addEventListener('click', () => {
            if (!confirm('¿Deseas limpiar los datos actuales del dashboard? Esta acción no elimina el archivo original.')) return;
            purgeReportState();
            lastProcessedData = null;
            currentPreviewUrl = '';
            clearFileSelection();
            resultsPanel.classList.add('hidden');
            documentPreviewSection.classList.add('hidden');
            excelPreviewFrame.src = '';
            hideError();
            window.dispatchEvent(new CustomEvent('intelfon-report-updated', {
                detail: { key: 'intelfon_current_report', value: null }
            }));
            Toast.success('Dashboard limpiado. Ya puedes generar un nuevo reporte.', 'Dashboard limpio');
        });
    }
    if (btnViewFullReport) {
        btnViewFullReport.addEventListener('click', () => abrirVisorInteractivo());
    }
    if (btnOpenInteractiveViewer) {
        btnOpenInteractiveViewer.addEventListener('click', () => abrirVisorInteractivo());
    }

    // Manejador de descarga directa de Excel (.xlsx)
    if (btnDownloadExcel) {
        btnDownloadExcel.addEventListener('click', (e) => {
            e.preventDefault();
            if (!currentPreviewUrl || currentPreviewUrl === '#') {
                Toast.error('El archivo no cuenta con un enlace de descarga disponible en este momento.');
                return;
            }
            let directUrl = currentPreviewUrl;
            const driveMatch = currentPreviewUrl.match(/\/d\/([a-zA-Z0-9_-]+)/) || currentPreviewUrl.match(/id=([a-zA-Z0-9_-]+)/);
            if (driveMatch && driveMatch[1]) {
                directUrl = `https://drive.google.com/uc?export=download&id=${driveMatch[1]}`;
            }
            Toast.success('Iniciando descarga directa de archivo Excel...', 'Descarga Excel');
            const a = document.createElement('a');
            a.href = directUrl;
            a.download = 'ReporteFinancieroIntelfon.xlsx';
            a.target = '_blank';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
        });
    }

    // Métodos de visualización de errores
    function showError(title, message) {
    errorTitle.textContent = title;
    errorMessage.textContent = message;
    errorAlert.classList.remove('hidden');

    // Si Make falla, NO mostrar resultados anteriores.
    resultsPanel.classList.add('hidden');

    if (btnTransferOverview) btnTransferOverview.disabled = true;
    if (btnViewFullReport) btnViewFullReport.disabled = true;
    if (btnOpenInteractiveViewer) btnOpenInteractiveViewer.disabled = true;
}

    function hideError() {
        errorAlert.classList.add('hidden');
        errorMessage.textContent = '';
    }

    btnCloseError.addEventListener('click', hideError);

    // Renderiza la lista de archivos del país de la sesión activa
    function renderSvFilesList() {
        if (!svFilesList) return;
        svFilesList.innerHTML = '';

        const count = selectedFiles.length;
        if (svCounterBadge) {
            if (count > 0) {
                svCounterBadge.textContent = `${count} / ${maxFiles} seleccionado${count > 1 ? 's' : ''}`;
                svCounterBadge.className = 'text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700';
            } else {
                svCounterBadge.textContent = isGT ? '1 archivo' : '1 a 10 archivos';
                svCounterBadge.className = 'text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-500';
            }
        }

        if (count === 0) {
            fileInfoContainer.classList.add('hidden');
            if (fileInput) fileInput.value = '';
            return;
        }

        fileInfoContainer.classList.remove('hidden');
        if (svFilesCountBadge) {
            svFilesCountBadge.textContent = `${count} / ${maxFiles} seleccionado${count > 1 ? 's' : ''}`;
        }

        selectedFiles.forEach((file, index) => {
            const item = document.createElement('div');
            item.className = 'flex items-center justify-between p-2.5 rounded-lg bg-white border border-slate-200/80 shadow-2xs hover:border-slate-300 transition-colors';
            item.innerHTML = `
                <div class="flex items-center space-x-2.5 overflow-hidden flex-1 mr-2">
                    <div class="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                        </svg>
                    </div>
                    <div class="truncate">
                        <p class="text-xs font-bold text-slate-800 truncate" title="${escapeHtml(file.name)}">
                            <span class="text-slate-400 font-semibold mr-1">#${index + 1}</span>${escapeHtml(file.name)}
                        </p>
                        <p class="text-[11px] text-slate-400 font-medium">${formatFileSize(file.size)}</p>
                    </div>
                </div>
                <button type="button" class="btn-remove-sv-file p-1.5 text-slate-400 hover:text-red-500 rounded-md hover:bg-red-50 transition-colors flex-shrink-0" data-index="${index}" title="Eliminar este archivo">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                    </svg>
                </button>
            `;
            svFilesList.appendChild(item);
        });

        svFilesList.querySelectorAll('.btn-remove-sv-file').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const idx = parseInt(btn.getAttribute('data-index'), 10);
                if (!isNaN(idx) && idx >= 0 && idx < selectedFiles.length) {
                    const removed = selectedFiles.splice(idx, 1);
                    renderSvFilesList();
                    syncDocumentStatus();
                    Toast.info(`Se quitó "${removed[0]?.name}".`, 'Archivo removido');
                }
            });
        });
    }

    // Reporta a Firebase (Realtime Database) el estado del/los documento(s) del país activo
    function syncDocumentStatus() {
        SyncService.setDocumentStatus(activeRegion, {
            uploaded: selectedFiles.length > 0,
            fileName: selectedFiles[0]?.name,
            count: selectedFiles.length
        });
    }

    if (btnRemoveAllSv) {
        btnRemoveAllSv.addEventListener('click', (e) => {
            e.stopPropagation();
            clearFileSelection();
            Toast.info(`Se eliminaron todos los archivos de ${regionMeta.name}.`, 'Lista vaciada');
        });
    }

    // Selección de archivo(s) — siempre para el país de la sesión activa
    function handleFileSelection(files) {
        const selected = Array.from(files || []);
        if (!selected.length) return;

        const maxSizeBytes = 20 * 1024 * 1024;
        const validFiles = [];
        const invalidFormatFiles = [];
        const oversizedFiles = [];

        for (const file of selected) {
            if (!file.name.toLowerCase().endsWith('.xlsx')) {
                invalidFormatFiles.push(file.name);
            } else if (file.size > maxSizeBytes) {
                oversizedFiles.push(`${file.name} (${formatFileSize(file.size)})`);
            } else {
                validFiles.push(file);
            }
        }

        if (invalidFormatFiles.length > 0) {
            Toast.error(`Los siguientes archivos no son .xlsx y fueron omitidos: ${invalidFormatFiles.join(', ')}`, 'Formato no compatible');
        }
        if (oversizedFiles.length > 0) {
            Toast.error(`Los siguientes archivos superan los 20 MB y fueron omitidos: ${oversizedFiles.join(', ')}`, 'Archivo muy pesado');
        }

        if (validFiles.length === 0) return;

        // Evitar duplicados exactos (mismo nombre y tamaño)
        const newlyAdded = [];
        for (const vf of validFiles) {
            if (!selectedFiles.some(f => f.name === vf.name && f.size === vf.size)) {
                newlyAdded.push(vf);
            }
        }

        const combined = [...selectedFiles, ...newlyAdded];
        if (combined.length > maxFiles) {
            Toast.warning(`${regionMeta.name} permite un máximo de ${maxFiles} archivo${maxFiles > 1 ? 's' : ''}. Se tomaron los primeros ${maxFiles}.`, `Límite de ${maxFiles} archivo${maxFiles > 1 ? 's' : ''}`);
            selectedFiles.length = 0;
            selectedFiles.push(...combined.slice(0, maxFiles));
        } else {
            selectedFiles.length = 0;
            selectedFiles.push(...combined);
            if (newlyAdded.length > 0) {
                Toast.success(`Se agregaron ${newlyAdded.length} archivo(s) para ${regionMeta.name} (Total: ${selectedFiles.length}/${maxFiles}).`, 'Archivos cargados');
            }
        }

        renderSvFilesList();
        hideError();
        syncDocumentStatus();
    }

    function clearFileSelection() {
        selectedFiles.length = 0;
        if (fileInput) fileInput.value = '';
        renderSvFilesList();
        SyncService.setDocumentStatus(activeRegion, { uploaded: false, count: 0 });
    }

    if (dropzone) {
        dropzone.addEventListener('click', () => {
            if (fileInput) {
                fileInput.value = '';
                fileInput.click();
            }
        });
        dropzone.addEventListener('dragover', event => {
            event.preventDefault();
            dropzone.classList.add('dropzone-active');
        });
        dropzone.addEventListener('dragleave', () => dropzone.classList.remove('dropzone-active'));
        dropzone.addEventListener('drop', event => {
            event.preventDefault();
            dropzone.classList.remove('dropzone-active');
            handleFileSelection(event.dataTransfer?.files);
        });
    }
    if (fileInput) {
        fileInput.addEventListener('change', event => handleFileSelection(event.target.files));
    }

    // Parser directo de Excel (cliente) para extraer saldos, movimientos y bancos al instante
    async function parseExcelFilesToReport(gtFile, svFiles) {
        if (typeof XLSX === 'undefined') {
            console.warn('[Generator] SheetJS XLSX no está cargado aún en window.');
            return null;
        }

        const allFiles = [
            { file: gtFile, country: 'GT' },
            ...(svFiles || []).map(f => ({ file: f, country: 'SV' }))
        ];

        const bancosProcesados = [];
        const allFilas = [];
        let grandTotalIngresosUSD = 0;
        let grandTotalEgresosUSD = 0;
        let grandTotalNetoUSD = 0;
        let grandTotalSaldoFinalUSD = 0;
        const rateGTQ = 7.80;

        for (const item of allFiles) {
            if (!item.file) continue;
            try {
                const buffer = await item.file.arrayBuffer();
                const workbook = XLSX.read(buffer, { type: 'array', cellDates: true });
                
                const fileName = item.file.name;
                const country = item.country;
                const isGT = country === 'GT';
                const defaultCurrency = isGT ? 'GTQ' : 'USD';

                let fileBank = 'Banco General';
                const fLow = fileName.toLowerCase();
                if (fLow.includes('bi') || fLow.includes('industrial')) fileBank = 'Banco Industrial';
                else if (fLow.includes('banrural')) fileBank = 'Banrural';
                else if (fLow.includes('g&t') || fLow.includes('gyt')) fileBank = 'Banco G&T Continental';
                else if (fLow.includes('bac')) fileBank = isGT ? 'BAC Credomatic GT' : 'BAC Credomatic SV';
                else if (fLow.includes('bam') || fLow.includes('agromercantil')) fileBank = 'BAM';
                else if (fLow.includes('agricola') || fLow.includes('agrícola')) fileBank = 'Banco Agrícola';
                else if (fLow.includes('cuscatlan') || fLow.includes('cuscatlán')) fileBank = 'Banco Cuscatlán';
                else if (fLow.includes('davivienda')) fileBank = 'Banco Davivienda SV';
                else if (fLow.includes('promerica')) fileBank = isGT ? 'Banco Promerica GT' : 'Banco Promerica SV';
                else if (fLow.includes('azul')) fileBank = 'Banco Azul';
                else if (fLow.includes('hipotecario')) fileBank = 'Banco Hipotecario';
                else fileBank = isGT ? 'Banco Guatemala' : 'Banco El Salvador';

                workbook.SheetNames.forEach((sheetName, sIdx) => {
                    const ws = workbook.Sheets[sheetName];
                    if (!ws) return;
                    const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });
                    if (!rows || rows.length < 2) return;

                    let headerRowIdx = -1;
                    let colFecha = -1, colDesc = -1, colDebe = -1, colHaber = -1, colSaldo = -1, colDoc = -1, colTipo = -1;

                    for (let r = 0; r < Math.min(rows.length, 10); r++) {
                        const row = rows[r].map(c => String(c).trim().toLowerCase());
                        const fIdx = row.findIndex(c => c.includes('fecha') || c.includes('date'));
                        const dIdx = row.findIndex(c => c.includes('descrip') || c.includes('concepto') || c.includes('detalle'));
                        const dbIdx = row.findIndex(c => c.includes('cargo') || c.includes('debe') || c.includes('debito') || c.includes('egreso') || c.includes('retiro'));
                        const crIdx = row.findIndex(c => c.includes('abono') || c.includes('haber') || c.includes('credito') || c.includes('ingreso') || c.includes('deposito'));
                        const sIdxCol = row.findIndex(c => c.includes('saldo') || c.includes('balance'));

                        if (fIdx !== -1 || dIdx !== -1 || dbIdx !== -1 || crIdx !== -1) {
                            headerRowIdx = r;
                            colFecha = fIdx;
                            colDesc = dIdx;
                            colDebe = dbIdx;
                            colHaber = crIdx;
                            colSaldo = sIdxCol;
                            colDoc = row.findIndex(c => c.includes('doc') || c.includes('ref') || c.includes('num') || c.includes('comprobante'));
                            colTipo = row.findIndex(c => c.includes('tipo') || c.includes('tt'));
                            break;
                        }
                    }

                    // Si no se detectó una fila de encabezado con columnas reales de fecha/descripción/
                    // debe/haber, esta hoja NO es un estado de cuenta bancario real (podría ser una
                    // portada, notas, hoja en blanco, etc.). La saltamos por completo: antes se contaba
                    // igual como una "cuenta" más y, al no tener columnas identificadas, el código cayó
                    // en un atajo que tomaba el primer número de cada fila como si fuera un monto,
                    // generando saldos y totales absurdamente grandes.
                    if (headerRowIdx === -1) return;

                    const movimientos = [];
                    let sumIngresos = 0;
                    let sumEgresos = 0;
                    let initialBalance = 0;
                    let finalBalance = 0;

                    const startR = headerRowIdx !== -1 ? headerRowIdx + 1 : 1;
                    for (let r = startR; r < rows.length; r++) {
                        const row = rows[r];
                        if (!row || row.every(cell => cell === '' || cell === null || cell === undefined)) continue;

                        let fecha = colFecha !== -1 ? row[colFecha] : (row[0] || '');
                        if (fecha instanceof Date) fecha = fecha.toLocaleDateString('es-GT');
                        const desc = colDesc !== -1 ? String(row[colDesc] || '') : String(row[1] || '');
                        const doc = colDoc !== -1 ? String(row[colDoc] || '') : (row[2] || '');
                        const tipo = colTipo !== -1 ? String(row[colTipo] || '') : '';

                        let debe = 0;
                        if (colDebe !== -1) debe = Math.abs(parseFloat(String(row[colDebe]).replace(/[^0-9.-]+/g, '')) || 0);
                        let haber = 0;
                        if (colHaber !== -1) haber = Math.abs(parseFloat(String(row[colHaber]).replace(/[^0-9.-]+/g, '')) || 0);

                        let saldo = colSaldo !== -1 ? parseFloat(String(row[colSaldo]).replace(/[^0-9.-]+/g, '')) : 0;
                        if (isNaN(saldo)) saldo = 0;

                        if (debe > 0 || haber > 0 || desc.trim() !== '') {
                            sumIngresos += haber;
                            sumEgresos += debe;
                            if (movimientos.length === 0 && saldo !== 0) {
                                initialBalance = saldo - haber + debe;
                            }
                            finalBalance = saldo !== 0 ? saldo : (initialBalance + sumIngresos - sumEgresos);

                            const mov = {
                                Fecha: fecha || '2026-08-01',
                                TT: tipo || (haber > 0 ? 'NC' : 'ND'),
                                Tipo: tipo || (haber > 0 ? 'Abono' : 'Cargo'),
                                Descripcion: desc || 'Movimiento bancario',
                                'No. Doc': doc || `DOC-${r}`,
                                Documento: doc || `DOC-${r}`,
                                Debe: debe,
                                Haber: haber,
                                Saldo: finalBalance,
                                archivo: fileName,
                                hoja: sheetName,
                                fila: r + 1
                            };
                            movimientos.push(mov);
                            allFilas.push({
                                id: `MOV-${country}-${r + 1}`,
                                cliente: desc || `${fileBank} - ${sheetName}`,
                                monto: haber > 0 ? haber : debe,
                                tipo: haber > 0 ? 'Ingreso' : 'Egreso',
                                estado: 'Conciliado',
                                banco: fileBank,
                                cuenta: sheetName,
                                pais: country
                            });
                        }
                    }

                    const neto = sumIngresos - sumEgresos;
                    const factorUSD = isGT ? (1 / rateGTQ) : 1;
                    const bankRecord = {
                        Banco: fileBank,
                        Cuenta: `${sheetName} (${fileName.replace('.xlsx', '')})`,
                        Moneda: defaultCurrency,
                        Pais: country,
                        _country: country,
                        Saldo_Inicial: parseFloat(initialBalance.toFixed(2)),
                        Total_Ingresos: parseFloat(sumIngresos.toFixed(2)),
                        Total_Egresos: parseFloat(sumEgresos.toFixed(2)),
                        Saldo_Final: parseFloat(finalBalance.toFixed(2)),
                        Neto: parseFloat(neto.toFixed(2)),
                        Cantidad_Movimientos: movimientos.length,
                        Tipo_Cambio_GTQ_USD: rateGTQ,
                        Saldo_Inicial_USD: parseFloat((initialBalance * factorUSD).toFixed(2)),
                        Total_Ingresos_USD: parseFloat((sumIngresos * factorUSD).toFixed(2)),
                        Total_Egresos_USD: parseFloat((sumEgresos * factorUSD).toFixed(2)),
                        Saldo_Final_USD: parseFloat((finalBalance * factorUSD).toFixed(2)),
                        Neto_USD: parseFloat((neto * factorUSD).toFixed(2)),
                        estado_cuenta: movimientos
                    };

                    grandTotalIngresosUSD += bankRecord.Total_Ingresos_USD;
                    grandTotalEgresosUSD += bankRecord.Total_Egresos_USD;
                    grandTotalNetoUSD += bankRecord.Neto_USD;
                    grandTotalSaldoFinalUSD += bankRecord.Saldo_Final_USD;

                    bancosProcesados.push(bankRecord);
                });
            } catch (err) {
                console.error('[Generator] Error extrayendo datos de Excel:', item.file.name, err);
            }
        }

        const regional = bancosProcesados.map(b => [
            b.Pais, b.Banco, b.Cuenta, b.Moneda, 'USD', b.Tipo_Cambio_GTQ_USD,
            b.Saldo_Inicial_USD, b.Total_Ingresos_USD, b.Total_Egresos_USD, b.Saldo_Final_USD,
            b.Saldo_Final_USD, 0, 'OK'
        ]);
        regional.push(['TOTAL REGIONAL', 'Todos', 'Todas', 'USD', 'USD', rateGTQ, '', parseFloat(grandTotalIngresosUSD.toFixed(2)), parseFloat(grandTotalEgresosUSD.toFixed(2)), parseFloat(grandTotalSaldoFinalUSD.toFixed(2)), '', parseFloat(grandTotalNetoUSD.toFixed(2)), '']);

        return {
            estado: `${regionMeta.name} procesado (vista previa local)`,
            fileName: 'ReporteFinancieroIntelfon.xlsx',
            bancos_procesados: bancosProcesados,
            resumen_general: bancosProcesados,
            registros: bancosProcesados,
            filas: allFilas,
            totales_globales: {
                tipo_cambio_gtq_usd: rateGTQ,
                total_ingresos_usd: parseFloat(grandTotalIngresosUSD.toFixed(2)),
                total_egresos_usd: parseFloat(grandTotalEgresosUSD.toFixed(2)),
                total_neto_usd: parseFloat(grandTotalNetoUSD.toFixed(2)),
                saldo_final_global: parseFloat(grandTotalSaldoFinalUSD.toFixed(2))
            },
            guatemala: bancosProcesados.filter(b => b.Pais === 'GT'),
            el_salvador: bancosProcesados.filter(b => b.Pais === 'SV'),
            consolidadoRegionalUSD: regional,
            filasFuenteCompletas: allFilas.length
        };
    }

    // Helper: intenta parsear un string JSON, devuelve el valor original si no es parseable
    function tryParseJSON(val) {
        if (typeof val === 'string') {
            const trimmed = val.trim();
            if ((trimmed.startsWith('[') && trimmed.endsWith(']')) || (trimmed.startsWith('{') && trimmed.endsWith('}'))) {
                try { return JSON.parse(trimmed); } catch (e) { /* no es JSON válido */ }
            }
        }
        return val;
    }

    // Extrae y normaliza las filas desde cualquier estructura de Make
    function extractRows(data) {
        if (!data) return [];

        // Parsear campos que pueden venir como strings JSON
        const fields = ['filas', 'registros', 'resumen_general', 'bancos_procesados', 'balance_general', 'totales_globales', 'resultado', 'data', 'result', 'consolidadoRegionalUSD', 'consolidado_regional_usd', 'archivosExcel', 'archivos_excel'];
        for (const field of fields) {
            if (typeof data[field] === 'string') {
                data[field] = tryParseJSON(data[field]);
            }
        }

        // Si viene envuelto en resultado (OpenAI)
        if (data.resultado && typeof data.resultado === 'object') {
            if (Array.isArray(data.resultado.resumen_general) && data.resultado.resumen_general.length) return data.resultado.resumen_general;
            if (Array.isArray(data.resultado.bancos_procesados) && data.resultado.bancos_procesados.length) return data.resultado.bancos_procesados;
            if (Array.isArray(data.resultado.registros) && data.resultado.registros.length) return data.resultado.registros;
            if (Array.isArray(data.resultado.filas) && data.resultado.filas.length) return data.resultado.filas;
            if (Array.isArray(data.resultado) && data.resultado.length) return data.resultado;
        }

        // Si viene envuelto en result desde el módulo ExecuteCode de Make
        if (data.result && typeof data.result === 'object') {
            for (const field of ['filas', 'registros', 'resumen_general', 'bancos_procesados', 'totales_globales']) {
                if (typeof data.result[field] === 'string') data.result[field] = tryParseJSON(data.result[field]);
            }
            if (Array.isArray(data.result.resumen_general) && data.result.resumen_general.length) return data.result.resumen_general;
            if (Array.isArray(data.result.bancos_procesados) && data.result.bancos_procesados.length) return data.result.bancos_procesados;
            if (Array.isArray(data.result.registros) && data.result.registros.length) return data.result.registros;
            if (Array.isArray(data.result.filas) && data.result.filas.length) return data.result.filas;
            if (Array.isArray(data.result) && data.result.length) return data.result;
        }

        // Si viene envuelto en data
        if (data.data && typeof data.data === 'object') {
            if (Array.isArray(data.data.resumen_general) && data.data.resumen_general.length) return data.data.resumen_general;
            if (Array.isArray(data.data.bancos_procesados) && data.data.bancos_procesados.length) return data.data.bancos_procesados;
            if (Array.isArray(data.data.registros) && data.data.registros.length) return data.data.registros;
            if (Array.isArray(data.data.filas) && data.data.filas.length) return data.data.filas;
            if (Array.isArray(data.data) && data.data.length) return data.data;
        }

        if (Array.isArray(data.bancos_procesados) && data.bancos_procesados.length) return data.bancos_procesados;
        if (Array.isArray(data.registros) && data.registros.length) return data.registros;
        if (Array.isArray(data.resumen_general) && data.resumen_general.length) return data.resumen_general;
        if (Array.isArray(data.filas) && data.filas.length) return data.filas;
        if (Array.isArray(data) && data.length) return data;

        return [];
    }

    // Renderiza las tarjetas de resumen según la respuesta de Make
    function renderSummaryCards(resumen, filas, totalesGlobales, rawData) {
        summaryCards.innerHTML = '';

        // Si no viene resumen pero sí totalesGlobales o rawData
        if (!resumen && rawData) {
            if (rawData.totales_globales) totalesGlobales = rawData.totales_globales;
            if (rawData.data?.totales_globales) totalesGlobales = rawData.data.totales_globales;
        }

        let totalRegistros = resumen?.totalRegistros ?? resumen?.total_registros;
        let montoTotal = resumen?.montoTotal ?? resumen?.monto_total;
        let estadoGeneral = resumen?.estadoGeneral ?? resumen?.estado_general;

        // Si montoTotal es un objeto o JSON
        if (typeof montoTotal === 'string' && (montoTotal.startsWith('{') || montoTotal.startsWith('['))) {
            const parsed = tryParseJSON(montoTotal);
            if (parsed && typeof parsed === 'object') {
                montoTotal = parsed.Saldo_Final_Global ?? parsed.Total_Ingresos_Global ?? parsed.montoTotal;
            }
        }

        if ((!montoTotal || montoTotal === '$0.00') && totalesGlobales && typeof totalesGlobales === 'object') {
            const val = totalesGlobales.Saldo_Final_Global ?? totalesGlobales.Total_Ingresos_Global;
            if (val !== undefined && val !== null) {
                montoTotal = typeof val === 'number'
                    ? `$${val.toLocaleString('en-US', { minimumFractionDigits: 2 })}`
                    : String(val);
            }
        }

        // Si aún no hay montoTotal y hay filas, sumar los montos
        if ((!montoTotal || montoTotal === '$0.00') && Array.isArray(filas) && filas.length > 0) {
            const suma = filas.reduce((acc, r) => {
                const m = r.Saldo_Final ?? r.Total_Ingresos ?? r.monto ?? r.Monto;
                return acc + (typeof m === 'number' ? m : (parseFloat(String(m).replace(/[^0-9.-]+/g, '')) || 0));
            }, 0);
            if (suma > 0) {
                montoTotal = `$${suma.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
            }
        }

        if (totalRegistros === undefined || totalRegistros === null || totalRegistros === 0) {
            totalRegistros = (filas && Array.isArray(filas) && filas.length > 0) ? filas.length : '0';
        }
        if (!montoTotal) {
            montoTotal = '$0.00';
        }
        if (!estadoGeneral) {
            estadoGeneral = 'Óptimo';
        }

        // Definir badge para el estado general
        let estadoBadgeClass = 'badge-success';
        const estadoLower = String(estadoGeneral).toLowerCase();
        if (estadoLower.includes('pend') || estadoLower.includes('proc')) {
            estadoBadgeClass = 'badge-warning';
        } else if (estadoLower.includes('err') || estadoLower.includes('rech') || estadoLower.includes('fall')) {
            estadoBadgeClass = 'badge-danger';
        }

        const cards = [
            {
                titulo: 'Total Registros',
                valor: escapeHtml(String(totalRegistros)),
                icono: `<svg class="w-6 h-6 text-intelfon-red" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>`,
                iconBg: 'bg-red-50 text-intelfon-red',
                badge: null
            },
            {
                titulo: 'Monto Total',
                valor: escapeHtml(String(montoTotal)),
                icono: `<svg class="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>`,
                iconBg: 'bg-emerald-50 text-emerald-600',
                badge: null
            },
            {
                titulo: 'Estado General',
                valor: escapeHtml(String(estadoGeneral)),
                icono: `<svg class="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>`,
                iconBg: 'bg-blue-50 text-blue-600',
                badge: estadoBadgeClass
            }
        ];

        // Añadir campos adicionales de resumen si vienen en la respuesta de Make
        if (resumen && typeof resumen === 'object') {
            const knownKeys = ['totalRegistros', 'total_registros', 'montoTotal', 'monto_total', 'estadoGeneral', 'estado_general'];
            for (const [key, value] of Object.entries(resumen)) {
                if (!knownKeys.includes(key) && value !== null && value !== undefined && typeof value !== 'object') {
                    cards.push({
                        titulo: escapeHtml(key.replace(/_/g, ' ')),
                        valor: escapeHtml(String(value)),
                        icono: `<svg class="w-6 h-6 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>`,
                        iconBg: 'bg-slate-100 text-slate-600',
                        badge: null
                    });
                }
            }
        }

        cards.forEach(card => {
            const div = document.createElement('div');
            div.className = 'p-5 bg-slate-50 rounded-xl border border-slate-100 space-y-2';
            div.innerHTML = `
                <div class="flex items-center justify-between">
                    <p class="text-xs font-bold uppercase tracking-wider text-slate-600">${card.titulo}</p>
                    <div class="w-9 h-9 rounded-lg ${card.iconBg} flex items-center justify-center">
                        ${card.icono}
                    </div>
                </div>
                <div class="flex items-center space-x-2">
                    <h5 class="text-xl font-black text-slate-800">${card.valor}</h5>
                    ${card.badge ? `<span class="badge-status ${card.badge}">${card.valor}</span>` : ''}
                </div>
            `;
            summaryCards.appendChild(div);
        });
    }

    // Renderiza las filas de la tabla según los datos recibidos de Make
    function renderTableRows(filas) {
        tableHead.innerHTML = '';
        tableBody.innerHTML = '';

        if (!filas || filas.length === 0) {
            tableHead.innerHTML = `<tr><th class="w-1/3">Estado del Proceso</th><th>Detalle de la Operación</th></tr>`;
            tableBody.innerHTML = `
                <tr>
                    <td class="font-semibold text-emerald-700 bg-emerald-50/50">
                        <span class="inline-flex items-center gap-2">
                            <span class="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                            Recibido por Make.com
                        </span>
                    </td>
                    <td class="text-slate-600">
                        Los archivos fueron transferidos exitosamente a Make.com. El análisis financiero, generación de libros Excel y despacho de correo se están ejecutando en segundo plano.
                    </td>
                </tr>
            `;
            return;
        }

        const sample = filas[0];
        const isStandard = ('id' in sample || 'ID' in sample || 'codigo' in sample || 'Codigo' in sample) &&
                           ('cliente' in sample || 'nombre' in sample || 'Cliente' in sample || 'Nombre' in sample);

        if (isStandard) {
            tableHead.innerHTML = `
                <tr>
                    <th>ID</th>
                    <th>Cliente / Detalle</th>
                    <th>Monto</th>
                    <th>Estado</th>
                </tr>
            `;

            tableBody.innerHTML = filas.map(item => {
                const id = item.id ?? item.ID ?? item.codigo ?? item.Codigo ?? '---';
                const cliente = item.cliente ?? item.nombre ?? item.Cliente ?? item.Nombre ?? item.descripcion ?? 'Sin nombre';
                const monto = item.monto ?? item.Monto ?? item.total ?? item.Total ?? item.saldo ?? item.Saldo ?? '$0.00';
                const estado = item.estado ?? item.Estado ?? item.status ?? 'Completado';

                let badgeClass = 'badge-success';
                const estLower = String(estado).toLowerCase();
                if (estLower.includes('pend') || estLower.includes('proc')) badgeClass = 'badge-warning';
                else if (estLower.includes('err') || estLower.includes('fall') || estLower.includes('rech')) badgeClass = 'badge-danger';

                return `
                    <tr class="hover:bg-slate-50 transition-colors">
                        <td class="font-bold text-slate-800">${escapeHtml(String(id))}</td>
                        <td class="text-slate-600">${escapeHtml(String(cliente))}</td>
                        <td class="font-bold text-slate-800">${typeof monto === 'number' ? `$${monto.toLocaleString('en-US', { minimumFractionDigits: 2 })}` : escapeHtml(String(monto))}</td>
                        <td>
                            <span class="badge-status ${badgeClass}">
                                <span class="badge-status-dot"></span>
                                ${escapeHtml(String(estado))}
                            </span>
                        </td>
                    </tr>
                `;
            }).join('');
        } else {
            const keys = Object.keys(sample).filter(k => typeof sample[k] !== 'object');
            tableHead.innerHTML = `<tr>${keys.map(k => `<th>${escapeHtml(k.replace(/_/g, ' '))}</th>`).join('')}</tr>`;

            tableBody.innerHTML = filas.map(row => `
                <tr class="hover:bg-slate-50 transition-colors">
                    ${keys.map(k => `<td class="text-slate-700 font-medium">${escapeHtml(String(row[k] ?? ''))}</td>`).join('')}
                </tr>
            `).join('');
        }
    }

    // Configuración y carga del visor interactivo del documento
    function loadDocumentPreview(urlDescarga) {
        if (!urlDescarga || urlDescarga === '#') {
            documentPreviewSection.classList.add('hidden');
            if (excelPreviewFrame) excelPreviewFrame.src = '';
            currentPreviewUrl = '';
            return;
        }

        const previewEmbedUrl = getEmbedPreviewUrl(urlDescarga);
        currentPreviewUrl = previewEmbedUrl;

        // Configurar botón "Abrir en nueva pestaña"
        if (btnOpenExternal) {
            btnOpenExternal.href = urlDescarga;
            btnOpenExternal.classList.remove('pointer-events-none', 'opacity-50');
        }

        // Mostrar estado de carga en el iframe
        if (previewLoader) previewLoader.classList.remove('hidden', 'opacity-0');
        if (excelPreviewFrame) {
            excelPreviewFrame.classList.add('opacity-0');
            excelPreviewFrame.src = previewEmbedUrl;
            excelPreviewFrame.onload = () => {
                if (previewLoader) previewLoader.classList.add('hidden', 'opacity-0');
                excelPreviewFrame.classList.remove('opacity-0');
            };
        }

        // Mostrar sección del documento
        documentPreviewSection.classList.remove('hidden');
    }

    function createExcelDownloadUrl(response) {
        let base64 = response?.archivoExcelBase64 || response?.excelBase64 || response?.result?.data || response?.consolidadoGeneral?.data || response?.data;
        if (!base64 && Array.isArray(response?.archivosExcel) && response.archivosExcel.length > 0) {
            base64 = response.archivosExcel[0]?.data;
        }
        if (!base64 || typeof base64 !== 'string' || base64.length < 20) return '';
        return `data:application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;base64,${base64}`;
    }

    // Botón para recargar el iframe en caso de demora
    if (btnReloadPreview) {
        btnReloadPreview.addEventListener('click', () => {
            if (currentPreviewUrl && excelPreviewFrame) {
                if (previewLoader) previewLoader.classList.remove('hidden', 'opacity-0');
                excelPreviewFrame.classList.add('opacity-0');
                excelPreviewFrame.src = currentPreviewUrl;
            }
        });
    }

    // Event listener del formulario y botón de procesamiento
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        hideError();

        if (!selectedFiles.length) {
            showError(
                `Falta${isGT ? '' : 'n'} archivo${isGT ? '' : 's'} de ${regionMeta.name}`,
                `Por favor selecciona ${isGT ? 'el archivo Excel (.xlsx)' : 'entre 1 y 10 archivos Excel (.xlsx)'} para ${regionMeta.name}.`
            );
            return;
        }

        if (selectedFiles.length > maxFiles) {
            showError('Límite de archivos excedido', `${regionMeta.name} permite un máximo de ${maxFiles} archivo${maxFiles > 1 ? 's' : ''} Excel.`);
            return;
        }

        // Gate de sincronización regional: exige que el país contrario esté conectado
        // y haya confirmado su documento, salvo que el switch "Ignorar [país]" esté activo
        const syncCheck = SyncService.canProceed(activeRegion);
        if (!syncCheck.allowed) {
            const otherMeta = RegionService.getRegionMeta(syncCheck.otherRegion);
            const reasonText = syncCheck.reason === 'offline'
                ? `${otherMeta.name} figura como Desconectado`
                : `${otherMeta.name} aún no ha confirmado su documento`;
            showError(
                'Sincronización pendiente',
                `${reasonText}. Activa el switch "Ignorar ${otherMeta.name}" en la barra de sincronización si deseas continuar sin esperar, o espera a que se conecte.`
            );
            return;
        }

        const tipoReporte = container.querySelector('#tipo-reporte').value;
        const totalArchivos = selectedFiles.length;

        // Estado inicial de carga
        statusContainer.classList.remove('hidden');
        resultsPanel.classList.add('hidden');
        documentPreviewSection.classList.add('hidden');

        if (excelPreviewFrame) {
            excelPreviewFrame.src = '';
        }

        currentPreviewUrl = '';

        // Limpiar cualquier resultado de una ejecución anterior.
        if (summaryCards) {
            summaryCards.innerHTML = '';
        }

        if (tableHead) {
            tableHead.innerHTML = '';
        }

        if (tableBody) {
            tableBody.innerHTML = '';
        }

        statusLabel.textContent = `Enviando y procesando ${totalArchivos} archivo${totalArchivos > 1 ? 's' : ''} con Make...`;
        statusSubtext.textContent = 'Ejecutando escenario en Make.com...';
        statusSpinner.classList.remove('hidden');

        progressBar.className = 'bg-intelfon-red h-full w-0 transition-all duration-500';
        progressBar.style.width = '25%';

        const processingId = createRunId();
        currentRunId = processingId;
        purgeReportState();
        localStorage.setItem('intelfon_processing_id', processingId);
        lastProcessedData = null;

        btnSubmit.disabled = true;
        btnSubmit.classList.add('opacity-75', 'cursor-not-allowed');
        btnSubmitIcon.innerHTML = `
            <svg class="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
        `;
        btnSubmitText.textContent = `Procesando ${totalArchivos} archivo(s) con Make...`;

        let currentStep = 0;
        const steps = [
            { width: '35%', label: `Enviando ${totalArchivos} archivos a Make.com...`, sub: 'Cargando datos...' },
            { width: '55%', label: 'Analizando cuentas y transacciones con IA...', sub: `Extracción financiera de ${regionMeta.name}...` },
            { width: '75%', label: 'Calculando saldos y conciliación contable...', sub: 'Procesando balances...' },
            { width: '90%', label: 'Sincronizando con Google Sheets y Drive...', sub: 'Finalizando informe...' }
        ];

        const progressInterval = setInterval(() => {
            if (currentStep < steps.length) {
                const s = steps[currentStep];
                if (progressBar) progressBar.style.width = s.width;
                if (statusLabel) statusLabel.textContent = s.label;
                if (statusSubtext) statusSubtext.textContent = s.sub;
                currentStep++;
            }
        }, 4000);

try {
    statusLabel.textContent =
        `Enviando ${regionMeta.name} a Make...`;

    statusSubtext.textContent =
        'Make está procesando el reporte oficial';

    progressBar.style.width = '60%';

    const data = await enviarArchivosAMake(
        selectedFiles,
        tipoReporte,
        {
            region: activeRegion,
            country: regionMeta.name,
            executionId: processingId
        }
    );

    if (currentRunId !== processingId) {
        throw new Error(
            'Esta respuesta pertenece a una ejecución anterior.'
        );
    }

    const respuestaAsincrona =
        data?.accepted === true ||
        data?.aceptado === true ||
        data?.asincrono === true ||
        String(data?.estado || '').toLowerCase() ===
            'procesando';

    let finalReportData = null;

    if (respuestaAsincrona) {
        statusLabel.textContent =
            'Make recibió el archivo. Analizando...';

        statusSubtext.textContent =
            'Esperando resultado oficial de Make';

        progressBar.style.width = '75%';

        finalReportData =
            await esperarReporteFinalFirebase(
                regionMeta.name,
                processingId
            );
    } else {
        /*
         * Solo aceptamos una respuesta directa si realmente
         * contiene resultado financiero.
         */
        const filasDirectas = extractRows(data);

        if (
            filasDirectas.length === 0 &&
            !data?.bancos_procesados?.length
        ) {
            throw new Error(
                'Make respondió, pero todavía no existe ' +
                'un reporte financiero final.'
            );
        }

        finalReportData = data;
    }

    if (!finalReportData) {
        throw new Error(
            'No se recibió el resultado final de Make.'
        );
    }

    const finalExecutionId = String(
        finalReportData.ejecucion_id ||
        finalReportData.execution_id ||
        ''
    ).trim();

    if (
        finalExecutionId &&
        finalExecutionId !== String(processingId)
    ) {
        throw new Error(
            'Firebase devolvió un reporte de otra ejecución.'
        );
    }

    /*
     * AQUÍ, Y SOLO AQUÍ, el resultado pasa a ser
     * oficial para el dashboard.
     */
    lastProcessedData = finalReportData;

    replaceCurrentReport(
        finalReportData,
        processingId
    );

    /*
     * Buscar URL del Excel.
     * Make guarda los archivos dentro de:
     * reportes_finalizados/{pais}/{ejecucion_id}/archivos
     */
    let archivoFirebase = null;

    if (
        finalReportData.archivos &&
        typeof finalReportData.archivos === 'object'
    ) {
        archivoFirebase =
            Object.values(
                finalReportData.archivos
            )[0] || null;
    }

    const urlDescarga =
        finalReportData.urlDescarga ||
        finalReportData.downloadUrl ||
        archivoFirebase?.urlDescarga ||
        archivoFirebase?.url ||
        '#';

    currentPreviewUrl = urlDescarga;

    const filas =
        extractRows(finalReportData);

    renderSummaryCards(
        finalReportData.resumen ||
        finalReportData.resumen_general,
        filas,
        finalReportData.totales_globales,
        finalReportData
    );

    renderTableRows(filas);

    if (
        urlDescarga &&
        urlDescarga !== '#'
    ) {
        loadDocumentPreview(urlDescarga);
    }

    resultsPanel.classList.remove('hidden');

    if (btnTransferOverview) {
        btnTransferOverview.disabled = false;
    }

    if (btnViewFullReport) {
        btnViewFullReport.disabled = false;
    }

    if (btnOpenInteractiveViewer) {
        btnOpenInteractiveViewer.disabled = false;
    }

    clearInterval(progressInterval);

    progressBar.style.width = '100%';
    progressBar.classList.remove(
        'bg-intelfon-red'
    );
    progressBar.classList.add(
        'bg-emerald-600'
    );

    statusLabel.textContent =
        '¡Reporte oficial finalizado!';

    statusSubtext.textContent =
        'Resultado confirmado por Make y Firebase';

    statusSpinner.classList.add('hidden');

    Toast.success(
        'Make terminó correctamente y el dashboard fue actualizado.',
        'Reporte Oficial'
    );

    localStorage.removeItem(
        'intelfon_processing_id'
    );

    setTimeout(() => {
        resultsPanel.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
        });
    }, 100);

    if (btnDownloadExcel) {
        btnDownloadExcel.href =
            urlDescarga !== '#'
                ? urlDescarga
                : '#';

        btnDownloadExcel.classList.toggle(
            'pointer-events-none',
            urlDescarga === '#'
        );

        btnDownloadExcel.classList.toggle(
            'opacity-50',
            urlDescarga === '#'
        );
    }

        } catch (err) {
            clearInterval(progressInterval);
            localStorage.removeItem('intelfon_processing_id');
            lastProcessedData = null;
            console.error('Error en el procesamiento:', err);
            progressBar.style.width = '100%';
            progressBar.classList.remove('bg-intelfon-red', 'bg-emerald-600');
            progressBar.classList.add('bg-red-800');
            statusLabel.textContent = 'Fallo en la ejecución de Make.com';
            statusSubtext.textContent = 'Error';
            statusSpinner.classList.add('hidden');

            showError(
                'No se pudo procesar el archivo con Make.com.',
                err?.message || 'El flujo no devolvió una respuesta válida. Verifica Make.com e inténtalo nuevamente.'
            );
        } finally {
            btnSubmit.disabled = false;
            btnSubmit.classList.remove('opacity-75', 'cursor-not-allowed');
            btnSubmitIcon.innerHTML = `
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path></svg>
            `;
            btnSubmitText.textContent = `Procesar reporte de ${regionMeta.name}`;
        }
    });

    return container;
}
