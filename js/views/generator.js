import { enviarArchivoAMake } from '../services/makeService.js';
import { Toast } from '../services/toastService.js?v=2.9';

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

export function renderGenerator() {
    const container = document.createElement('div');
    container.className = 'max-w-5xl mx-auto space-y-8';

    container.innerHTML = `
        <!-- TARJETA PRINCIPAL DEL FORMULARIO -->
        <div class="card-intelfon p-8 space-y-6">
            <div class="border-b border-slate-100 pb-4">
                <h3 class="text-xl font-extrabold text-slate-800 tracking-tight">Generar Nuevo Reporte Excel</h3>
                <p class="text-sm text-slate-500 mt-1">Sube el archivo bancario en formato Excel (.xlsx) para procesarlo con el flujo automatizado en Make.com.</p>
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
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                    </button>
                </div>
            </div>

            <form id="generator-form" class="space-y-6">
                <div>
                    <label for="tipo-reporte" class="block text-xs font-bold uppercase text-slate-600 tracking-wider mb-2">Tipo de Reporte</label>
                    <select id="tipo-reporte" class="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-red-500 focus:border-red-500 bg-white transition-all shadow-xs">
                        <option value="Ventas">Reporte de Ventas</option>
                        <option value="Inventario">Reporte de Inventario</option>
                        <option value="Ejecutivo">Resumen Ejecutivo</option>
                    </select>
                </div>

                <div>
                    <label class="block text-xs font-bold uppercase text-slate-600 tracking-wider mb-2">Archivo de Origen (.xlsx)</label>
                    <div id="dropzone" class="dropzone-intelfon p-9 text-center">
                        <div class="w-14 h-14 bg-red-50 text-intelfon-red rounded-2xl flex items-center justify-center mx-auto mb-3.5 shadow-2xs">
                            <svg class="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path></svg>
                        </div>
                        <p class="text-sm text-slate-700 font-bold">Arrastra tu archivo Excel aquí o <span class="text-intelfon-red hover:underline">examina en tu equipo</span></p>
                        <p class="text-xs text-slate-400 mt-1">Formato requerido: Libro de Excel XLSX (.xlsx) • Máximo 20MB</p>
                        <input type="file" id="file-input" class="hidden" accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet">
                    </div>

                    <!-- DETALLE DEL ARCHIVO SELECCIONADO -->
                    <div id="file-info-container" class="hidden mt-3 flex items-center justify-between p-3.5 bg-red-50/80 border border-red-200/80 rounded-xl text-xs">
                        <div class="flex items-center space-x-2.5 truncate">
                            <svg class="w-4 h-4 text-intelfon-red flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                            <span id="file-name" class="font-bold text-slate-800 truncate"></span>
                            <span id="file-size" class="text-slate-500 flex-shrink-0"></span>
                        </div>
                        <button type="button" id="btn-remove-file" class="text-red-600 hover:text-red-800 font-bold ml-3 flex-shrink-0 px-2 py-1 rounded hover:bg-red-100 transition-colors">
                            Quitar
                        </button>
                    </div>
                </div>

                <!-- CONTENEDOR DE ESTADO / SPINNER / BARRA DE PROGRESO -->
                <div id="status-container" class="hidden space-y-2.5 bg-slate-50 p-4 rounded-xl border border-slate-200/80">
                    <div class="flex justify-between items-center text-xs font-bold text-slate-700">
                        <span id="status-text" class="flex items-center space-x-2">
                            <svg id="status-spinner" class="animate-spin -ml-0.5 mr-2 h-4 w-4 text-intelfon-red" fill="none" viewBox="0 0 24 24">
                                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            <span id="status-label">Enviando y procesando archivo con Make...</span>
                        </span>
                        <span id="status-subtext" class="text-slate-400 font-normal">Espere un momento</span>
                    </div>
                    <div class="w-full bg-slate-200 rounded-full h-2 overflow-hidden shadow-inner">
                        <div id="progress-bar" class="bg-intelfon-red h-full w-0 transition-all duration-500"></div>
                    </div>
                </div>

                <button type="submit" id="btn-submit" class="w-full btn-intelfon py-3.5 space-x-2 cursor-pointer shadow-md text-sm font-bold tracking-wide">
                    <span id="btn-submit-icon">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path></svg>
                    </span>
                    <span id="btn-submit-text">Generar y Procesar Datos</span>
                </button>
            </form>
        </div>

        <!-- CONTENEDOR DE RESULTADOS Y VISTA PREVIA (INICIALMENTE OCULTO) -->
        <div id="results-panel" class="hidden space-y-8">
            
            <!-- TARJETA 1: RESUMEN Y DATOS EXTRAÍDOS -->
            <div class="card-intelfon p-8 space-y-6">
                <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 pb-5">
                    <div>
                        <span class="badge-status badge-success mb-2">
                            <span class="badge-status-dot"></span>
                            Procesado Exitosamente en Make.com
                        </span>
                        <h4 class="text-xl font-extrabold text-slate-800 tracking-tight">Resumen y Datos Extraídos</h4>
                    </div>

                    <!-- Acciones Principales -->
                    <div class="flex flex-wrap items-center gap-3">
                        <button type="button" id="btn-download-pdf-direct" class="btn-intelfon-primary text-xs py-2.5 px-4 flex items-center shadow-md bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600">
                            <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                            <span>Descargar PDF Oficial</span>
                        </button>
                        <button type="button" id="btn-download-excel" class="btn-intelfon-secondary text-xs py-2.5 px-4 flex items-center shadow-xs border border-slate-300">
                            <svg class="w-4 h-4 mr-1.5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
                            <span>Descargar Excel (.xlsx)</span>
                        </button>
                        <button type="button" id="btn-view-full-report" class="btn-intelfon-secondary text-xs py-2.5 px-4 flex items-center shadow-xs border border-slate-300">
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
                    <button type="button" id="btn-open-interactive-viewer" class="btn-intelfon-primary text-xs py-3 px-6 whitespace-nowrap shadow-lg flex items-center space-x-2 font-bold">
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

    // Referencias a los elementos del DOM
    const dropzone = container.querySelector('#dropzone');
    const fileInput = container.querySelector('#file-input');
    const fileInfoContainer = container.querySelector('#file-info-container');
    const fileNameDisplay = container.querySelector('#file-name');
    const fileSizeDisplay = container.querySelector('#file-size');
    const btnRemoveFile = container.querySelector('#btn-remove-file');
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
    const btnDownloadPdfDirect = container.querySelector('#btn-download-pdf-direct');
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

    let selectedFile = null;
    let currentPreviewUrl = '';
    let lastProcessedData = null;

    // Función para abrir el visor interactivo de código en nueva pestaña
    function abrirVisorInteractivo(autoPrint = false) {
        if (!lastProcessedData) {
            Toast.warning('Aún no se han recibido datos del reporte para previsualizar.');
            return;
        }
        localStorage.setItem('intelfon_current_report', JSON.stringify(lastProcessedData));
        const win = window.open('report-viewer.html', '_blank');
        if (autoPrint && win) {
            win.addEventListener('load', () => {
                setTimeout(() => win.print(), 800);
            });
        }
    }

    if (btnDownloadPdfDirect) {
        btnDownloadPdfDirect.addEventListener('click', () => {
            Toast.info('Abriendo vista de impresión y guardado en PDF...', 'Exportando PDF Oficial');
            abrirVisorInteractivo(true);
        });
    }

    if (btnViewFullReport) {
        btnViewFullReport.addEventListener('click', () => abrirVisorInteractivo(false));
    }
    if (btnOpenInteractiveViewer) {
        btnOpenInteractiveViewer.addEventListener('click', () => abrirVisorInteractivo(false));
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
        resultsPanel.classList.add('hidden');
    }

    function hideError() {
        errorAlert.classList.add('hidden');
        errorMessage.textContent = '';
    }

    btnCloseError.addEventListener('click', hideError);

    // Selección de archivo
    function handleFileSelection(file) {
        if (!file) return;

        // Validar formato estricto .xlsx
        const nameLower = file.name.toLowerCase();
        if (!nameLower.endsWith('.xlsx')) {
            showError('Formato no válido', `El archivo "${file.name}" no es compatible. El flujo de Make requiere estrictamente un archivo Excel en formato .xlsx (no compatible con CSV o XLS binario).`);
            clearFileSelection();
            return;
        }

        const maxSizeBytes = 20 * 1024 * 1024; // 20 MB
        if (file.size > maxSizeBytes) {
            showError('Archivo demasiado grande', `El archivo supera el tamaño máximo permitido de 20MB (${formatFileSize(file.size)}).`);
            clearFileSelection();
            return;
        }

        selectedFile = file;
        fileNameDisplay.textContent = file.name;
        fileSizeDisplay.textContent = `(${formatFileSize(file.size)})`;
        fileInfoContainer.classList.remove('hidden');
        hideError();
    }

    function clearFileSelection() {
        selectedFile = null;
        fileInput.value = '';
        fileInfoContainer.classList.add('hidden');
        fileNameDisplay.textContent = '';
        fileSizeDisplay.textContent = '';
    }

    dropzone.addEventListener('click', () => fileInput.click());

    fileInput.addEventListener('change', (e) => {
        if (e.target.files && e.target.files.length > 0) {
            handleFileSelection(e.target.files[0]);
        }
    });

    btnRemoveFile.addEventListener('click', (e) => {
        e.stopPropagation();
        clearFileSelection();
    });

    // Drag & Drop
    dropzone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropzone.classList.add('dropzone-active');
    });

    dropzone.addEventListener('dragleave', () => dropzone.classList.remove('dropzone-active'));

    dropzone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropzone.classList.remove('dropzone-active');
        if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            handleFileSelection(e.dataTransfer.files[0]);
        }
    });

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
        const fields = ['filas', 'resumen_general', 'bancos_procesados', 'balance_general', 'totales_globales', 'resultado', 'data'];
        for (const field of fields) {
            if (typeof data[field] === 'string') {
                data[field] = tryParseJSON(data[field]);
            }
        }

        // Si viene envuelto en resultado (OpenAI)
        if (data.resultado && typeof data.resultado === 'object') {
            if (Array.isArray(data.resultado.resumen_general)) return data.resultado.resumen_general;
            if (Array.isArray(data.resultado.bancos_procesados)) return data.resultado.bancos_procesados;
            if (Array.isArray(data.resultado.filas)) return data.resultado.filas;
            if (Array.isArray(data.resultado)) return data.resultado;
        }

        // Si viene envuelto en data
        if (data.data && typeof data.data === 'object') {
            if (Array.isArray(data.data.resumen_general)) return data.data.resumen_general;
            if (Array.isArray(data.data.bancos_procesados)) return data.data.bancos_procesados;
            if (Array.isArray(data.data.filas)) return data.data.filas;
            if (Array.isArray(data.data)) return data.data;
        }

        if (Array.isArray(data.filas)) return data.filas;
        if (Array.isArray(data.resumen_general)) return data.resumen_general;
        if (Array.isArray(data.bancos_procesados)) return data.bancos_procesados;
        if (Array.isArray(data.balance_general)) return data.balance_general;
        if (Array.isArray(data.rows)) return data.rows;
        if (Array.isArray(data.items)) return data.items;
        if (Array.isArray(data)) return data;
        return [];
    }

    // Renderizado dinámico de tarjetas de resumen
    function renderSummaryCards(resumen, filas, totalesGlobales, rawData) {
        summaryCards.innerHTML = '';

        // Asegurar que resumen y totalesGlobales sean objetos
        if (typeof resumen === 'string') resumen = tryParseJSON(resumen);
        if (typeof totalesGlobales === 'string') totalesGlobales = tryParseJSON(totalesGlobales);

        if (!totalesGlobales && rawData) {
            if (rawData.resultado?.totales_globales) totalesGlobales = rawData.resultado.totales_globales;
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
            Object.entries(resumen).forEach(([key, val]) => {
                if (!knownKeys.includes(key) && val !== null && val !== undefined) {
                    cards.push({
                        titulo: key.replace(/([A-Z])/g, ' $1').replace(/_/g, ' '),
                        valor: escapeHtml(String(val)),
                        icono: `<svg class="w-6 h-6 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>`,
                        iconBg: 'bg-slate-100 text-slate-600',
                        badge: null
                    });
                }
            });
        }

        summaryCards.innerHTML = cards.map(card => `
            <div class="kpi-card p-5 flex items-center justify-between">
                <div>
                    <p class="text-xs text-slate-400 uppercase font-bold tracking-wider">${card.titulo}</p>
                    <div class="mt-1.5 flex items-center space-x-2">
                        ${card.badge ? `
                            <span class="badge-status ${card.badge}">
                                <span class="badge-status-dot"></span>
                                ${card.valor}
                            </span>
                        ` : `
                            <p class="text-2xl font-extrabold text-slate-800 tracking-tight">${card.valor}</p>
                        `}
                    </div>
                </div>
                <div class="w-12 h-12 rounded-xl ${card.iconBg} flex items-center justify-center shadow-2xs">
                    ${card.icono}
                </div>
            </div>
        `).join('');
    }

    // Renderizado dinámico de la tabla de detalles
    function renderTableRows(filas) {
        tableHead.innerHTML = '';
        tableBody.innerHTML = '';

        if (!filas || !Array.isArray(filas) || filas.length === 0) {
            tableHead.innerHTML = `
                <tr>
                    <th>ID</th>
                    <th>Cliente / Banco</th>
                    <th>Monto / Saldo</th>
                    <th>Estado</th>
                </tr>
            `;
            tableBody.innerHTML = `
                <tr>
                    <td colspan="4" class="px-4 py-8 text-center text-slate-400 text-sm">
                        No se encontraron filas de detalle en la respuesta del reporte.
                    </td>
                </tr>
            `;
            return;
        }

        const sample = filas[0];
        const hasStandardFields = ('id' in sample || 'ID' in sample || 'codigo' in sample) && ('cliente' in sample || 'Cliente' in sample || 'Banco' in sample);

        if (hasStandardFields) {
            tableHead.innerHTML = `
                <tr>
                    <th>ID</th>
                    <th>Cliente / Banco</th>
                    <th>Monto / Saldo</th>
                    <th>Estado</th>
                </tr>
            `;

            tableBody.innerHTML = filas.map(row => {
                const id = row.id ?? row.ID ?? row.codigo ?? row.No_Referencia ?? row.Cuenta ?? '-';
                const cliente = row.cliente ?? row.Cliente ?? row.nombre ?? row.Banco ?? '-';
                const rawMonto = row.monto ?? row.Monto ?? row.Saldo_Final ?? row.Total_Ingresos ?? row.total;
                const monto = typeof rawMonto === 'number' ? `$${rawMonto.toFixed(2)}` : (rawMonto ?? '-');
                const estado = row.estado ?? row.Estado ?? row.status ?? row.Estado_Conciliacion ?? 'Aprobado';

                let badgeClass = 'badge-neutral';
                const est = String(estado).toLowerCase();
                if (est.includes('aprob') || est.includes('optimo') || est.includes('complet') || est.includes('éxito') || est.includes('exito') || est.includes('cuadrado')) {
                    badgeClass = 'badge-success';
                } else if (est.includes('pend') || est.includes('proc') || est.includes('revis')) {
                    badgeClass = 'badge-warning';
                } else if (est.includes('rech') || est.includes('err') || est.includes('cancel') || est.includes('fall') || est.includes('descuadrado')) {
                    badgeClass = 'badge-danger';
                }

                return `
                    <tr class="hover:bg-slate-50 transition-colors">
                        <td class="font-bold text-slate-800">${escapeHtml(String(id))}</td>
                        <td class="text-slate-700 font-medium">${escapeHtml(String(cliente))}</td>
                        <td class="font-extrabold text-slate-900">${escapeHtml(String(monto))}</td>
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
            excelPreviewFrame.src = '';
            currentPreviewUrl = '';
            return;
        }

        const previewEmbedUrl = getEmbedPreviewUrl(urlDescarga);
        currentPreviewUrl = previewEmbedUrl;

        // Configurar botón "Abrir en nueva pestaña"
        btnOpenExternal.href = urlDescarga;
        btnOpenExternal.classList.remove('pointer-events-none', 'opacity-50');

        // Mostrar estado de carga en el iframe
        previewLoader.classList.remove('hidden', 'opacity-0');
        excelPreviewFrame.classList.add('opacity-0');

        // Inyectar URL en el iframe
        excelPreviewFrame.src = previewEmbedUrl;

        // Mostrar sección del documento
        documentPreviewSection.classList.remove('hidden');

        // Manejador de evento al completar la carga del iframe
        excelPreviewFrame.onload = () => {
            previewLoader.classList.add('hidden', 'opacity-0');
            excelPreviewFrame.classList.remove('opacity-0');
        };
    }

    // Botón para recargar el iframe en caso de demora
    btnReloadPreview.addEventListener('click', () => {
        if (currentPreviewUrl) {
            previewLoader.classList.remove('hidden', 'opacity-0');
            excelPreviewFrame.classList.add('opacity-0');
            excelPreviewFrame.src = currentPreviewUrl;
        }
    });

    // Event listener del formulario y botón de procesamiento
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        hideError();

        if (!selectedFile) {
            showError('Archivo requerido', 'Por favor selecciona o arrastra un archivo Excel (.xlsx) antes de continuar.');
            return;
        }

        const tipoReporte = container.querySelector('#tipo-reporte').value;

        // Estado inicial de carga
        statusContainer.classList.remove('hidden');
        resultsPanel.classList.add('hidden');
        documentPreviewSection.classList.add('hidden');
        excelPreviewFrame.src = '';
        currentPreviewUrl = '';

        statusLabel.textContent = 'Enviando y procesando archivo con Make...';
        statusSubtext.textContent = 'Ejecutando escenario en Make.com...';
        statusSpinner.classList.remove('hidden');

        progressBar.className = 'bg-intelfon-red h-full w-0 transition-all duration-500';
        progressBar.style.width = '25%';

        btnSubmit.disabled = true;
        btnSubmit.classList.add('opacity-75', 'cursor-not-allowed');
        btnSubmitIcon.innerHTML = `
            <svg class="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
        `;
        btnSubmitText.textContent = 'Procesando con Make...';

        // Simulación de progresión visual de la barra mientras Make procesa
        const progressTimer = setTimeout(() => {
            if (progressBar) progressBar.style.width = '70%';
        }, 600);

        try {
            // Llamada real al servicio de Make
            const data = await enviarArchivoAMake(selectedFile, tipoReporte);
            clearTimeout(progressTimer);

            // Validar que la respuesta contenga datos
            if (!data) {
                throw new Error('El Webhook de Make no devolvió ningún dato.');
            }

            // Actualizar progreso exitoso
            progressBar.style.width = '100%';
            progressBar.classList.remove('bg-intelfon-red');
            progressBar.classList.add('bg-emerald-600');
            statusLabel.textContent = '¡Procesamiento finalizado exitosamente!';
            statusSubtext.textContent = 'Listo';
            statusSpinner.classList.add('hidden');

            console.log('[Generator] Datos recibidos de MakeService:', data);

            // Extraer urlDescarga y filas de forma flexible
            const urlDescarga = data.urlDescarga || data.downloadUrl || data.webViewLink || data.fileUrl || data.url || data.link || '#';
            currentPreviewUrl = urlDescarga;
            lastProcessedData = data;

            const filas = extractRows(data);
            console.log('[Generator] Filas extraídas:', filas);
            console.log('[Generator] Resumen:', data.resumen);
            console.log('[Generator] Totales Globales:', data.totales_globales);

            // 1. Configurar enlace de descarga directa de Excel
            if (urlDescarga && urlDescarga !== '#') {
                btnDownloadExcel.href = urlDescarga;
                btnDownloadExcel.classList.remove('pointer-events-none', 'opacity-50');
                btnDownloadExcel.removeAttribute('disabled');
            } else {
                btnDownloadExcel.href = '#';
                btnDownloadExcel.classList.add('pointer-events-none', 'opacity-50');
            }

            // 2. Renderizar tarjetas de resumen dinámicas
            renderSummaryCards(data.resumen, filas, data.totales_globales, data);

            // 3. Renderizar filas de la tabla dinámicas
            renderTableRows(filas);

            // 4. Cargar la Vista Previa Interactiva del Documento en Google Drive
            loadDocumentPreview(urlDescarga);

            // 5. Mostrar panel completo de resultados
            resultsPanel.classList.remove('hidden');

            // Scroll suave hacia los resultados
            setTimeout(() => {
                resultsPanel.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }, 100);

        } catch (err) {
            clearTimeout(progressTimer);
            console.error('Error en el procesamiento:', err);

            // Estado de error en barra de progreso
            progressBar.style.width = '100%';
            progressBar.classList.remove('bg-intelfon-red', 'bg-emerald-600');
            progressBar.classList.add('bg-red-800');
            statusLabel.textContent = 'Fallo en la ejecución de Make.com';
            statusSubtext.textContent = 'Error';
            statusSpinner.classList.add('hidden');

            // Mostrar alerta visual descriptiva
            showError(
                'Fallo durante el procesamiento en Make.com',
                err.message || 'Ocurrió un error inesperado al procesar el archivo.'
            );
        } finally {
            // Restaurar estado del botón de envío
            btnSubmit.disabled = false;
            btnSubmit.classList.remove('opacity-75', 'cursor-not-allowed');
            btnSubmitIcon.innerHTML = `
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path></svg>
            `;
            btnSubmitText.textContent = 'Generar y Procesar Datos';
        }
    });

    return container;
}