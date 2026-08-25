import { obtenerHistorialReportes } from '../services/historyService.js';
import { Toast } from '../services/toastService.js?v=3.2';

export function renderHistory() {
    const container = document.createElement('div');
    container.className = 'max-w-6xl mx-auto space-y-6';

    container.innerHTML = `
        <div class="card-intelfon p-8 space-y-6">
            <!-- Header del Historial -->
            <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-6">
                <div>
                    <h3 class="text-xl font-extrabold text-slate-800 dark:text-white tracking-tight">Historial de Reportes Generados</h3>
                    <p class="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Consulta, filtra por fecha y descarga los archivos archivados en Google Sheets.</p>
                </div>
                <div id="history-total-badge" class="px-3.5 py-1.5 rounded-full bg-red-50 dark:bg-red-950/60 text-red-700 dark:text-red-300 font-bold text-xs border border-red-200 dark:border-red-800 self-start md:self-auto">
                    Sincronizando...
                </div>
            </div>

            <!-- BARRA DE FILTRO EXCLUSIVO POR FECHA Y BÚSQUEDA -->
            <div class="flex flex-col sm:flex-row gap-3 bg-slate-50 dark:bg-slate-900/80 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 text-xs">
                <!-- Buscador de Texto -->
                <div class="relative flex-1">
                    <div class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                    </div>
                    <input 
                        type="text" 
                        id="filter-search" 
                        placeholder="Buscar por ID de reporte o nombre de archivo..." 
                        class="w-full pl-10 pr-3 py-2.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-white focus:ring-2 focus:ring-red-500 placeholder:text-slate-400 shadow-2xs"
                    >
                </div>

                <!-- Filtro Único por Fecha -->
                <div class="w-full sm:w-64">
                    <select id="filter-date" class="w-full px-3.5 py-2.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-red-500 shadow-2xs">
                        <option value="all">📅 Todas las fechas</option>
                        <option value="today">Hoy (Últimas 24h)</option>
                        <option value="week">Últimos 7 días</option>
                        <option value="month">Este mes</option>
                    </select>
                </div>
            </div>

            <!-- Tabla de Reportes Anteriores -->
            <div class="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs">
                <table class="table-modern">
                    <thead>
                        <tr>
                            <th>ID Reporte</th>
                            <th>Fecha de Registro</th>
                            <th>Nombre del Archivo</th>
                            <th>Estado</th>
                            <th class="text-right">Acción</th>
                        </tr>
                    </thead>
                    <tbody id="table-body" class="divide-y divide-slate-100 dark:divide-slate-800">
                        <!-- Skeleton Loader Inicial -->
                        <tr>
                            <td colspan="5" class="p-8 text-center text-slate-400">
                                <div class="flex items-center justify-center space-x-3">
                                    <svg class="animate-spin h-5 w-5 text-intelfon-red" fill="none" viewBox="0 0 24 24">
                                        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                                        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    <span class="text-sm font-semibold text-slate-600 dark:text-slate-300">Sincronizando reportes desde Google Sheets...</span>
                                </div>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <!-- CONTROLES DE PAGINACIÓN -->
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2 text-xs text-slate-500 dark:text-slate-400" id="pagination-controls">
                <div class="flex items-center space-x-2">
                    <span>Mostrar</span>
                    <select id="select-page-size" class="px-2.5 py-1 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg font-bold text-slate-700 dark:text-slate-200">
                        <option value="5">5</option>
                        <option value="10" selected>10</option>
                        <option value="25">25</option>
                    </select>
                    <span>por página</span>
                </div>

                <div class="flex items-center space-x-3 self-center">
                    <span id="page-indicator" class="font-semibold">Página 1 de 1</span>
                    <div class="flex items-center space-x-1">
                        <button type="button" id="btn-prev-page" class="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors" disabled>
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path></svg>
                        </button>
                        <button type="button" id="btn-next-page" class="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors" disabled>
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path></svg>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;

    setTimeout(async () => {
        const tableBody = container.querySelector('#table-body');
        const filterSearch = container.querySelector('#filter-search');
        const filterDate = container.querySelector('#filter-date');
        const selectPageSize = container.querySelector('#select-page-size');
        const btnPrev = container.querySelector('#btn-prev-page');
        const btnNext = container.querySelector('#btn-next-page');
        const pageIndicator = container.querySelector('#page-indicator');
        const totalBadge = container.querySelector('#history-total-badge');

        let rawReportes = [];
        let filteredReportes = [];
        let currentPage = 1;
        let pageSize = 10;

        try {
            rawReportes = await obtenerHistorialReportes();
            if (!Array.isArray(rawReportes)) rawReportes = [];
        } catch (_) {
            rawReportes = [];
        }

        function applyFilters() {
            const query = (filterSearch.value || '').toLowerCase().trim();
            const dateVal = filterDate.value;

            const now = new Date();
            const todayStr = now.toISOString().slice(0, 10);

            filteredReportes = rawReportes.filter(r => {
                const nombre = String(r.nombreArchivo || '').toLowerCase();
                const id = String(r.id || '').toLowerCase();
                const fecha = String(r.fecha || '').toLowerCase();

                // Filtro por texto / ID / Nombre
                if (query && !nombre.includes(query) && !id.includes(query)) {
                    return false;
                }

                // Filtro exclusivo por fecha
                if (dateVal === 'today') {
                    const isToday = fecha.includes(todayStr) || fecha.includes('hoy') || fecha.includes('reciente');
                    if (!isToday) return false;
                } else if (dateVal === 'week') {
                    const d = new Date(fecha);
                    if (!isNaN(d.getTime())) {
                        const diffDays = (now - d) / (1000 * 3600 * 24);
                        if (diffDays > 7) return false;
                    }
                } else if (dateVal === 'month') {
                    const currentMonth = now.getMonth() + 1;
                    const match = fecha.match(/(\d{4})[/-](\d{1,2})/) || fecha.match(/(\d{1,2})[/-](\d{1,2})/);
                    if (match && parseInt(match[2], 10) !== currentMonth) return false;
                }

                return true;
            });

            currentPage = 1;
            renderTable();
        }

        function renderTable() {
            const total = filteredReportes.length;
            if (totalBadge) {
                totalBadge.textContent = `${total} reporte${total === 1 ? '' : 's'} encontrado${total === 1 ? '' : 's'}`;
            }

            if (total === 0) {
                tableBody.innerHTML = `
                    <tr>
                        <td colspan="5" class="px-6 py-12 text-center text-slate-400">
                            <div class="max-w-xs mx-auto space-y-2">
                                <div class="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
                                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                                </div>
                                <p class="text-sm font-bold text-slate-700 dark:text-slate-200">No se encontraron reportes</p>
                                <p class="text-xs text-slate-400">Prueba con otra fecha o término de búsqueda.</p>
                            </div>
                        </td>
                    </tr>
                `;
                if (pageIndicator) pageIndicator.textContent = 'Página 0 de 0';
                if (btnPrev) btnPrev.disabled = true;
                if (btnNext) btnNext.disabled = true;
                return;
            }

            const totalPages = Math.ceil(total / pageSize);
            if (currentPage > totalPages) currentPage = totalPages;
            if (currentPage < 1) currentPage = 1;

            const startIndex = (currentPage - 1) * pageSize;
            const pageData = filteredReportes.slice(startIndex, startIndex + pageSize);

            tableBody.innerHTML = pageData.map(item => {
                const id = item.id || 'REP-001';
                const fecha = item.fecha || 'Reciente';
                const nombre = item.nombreArchivo || 'Reporte_Bancario.xlsx';
                const estado = item.estado || 'Completado';
                const urlDescarga = item.urlDescarga || '#';

                let badgeClass = 'badge-success';
                const est = String(estado).toLowerCase();
                if (est.includes('pend')) badgeClass = 'badge-warning';
                else if (est.includes('err') || est.includes('fall')) badgeClass = 'badge-danger';

                let downloadUrl = urlDescarga;
                const driveMatch = String(urlDescarga).match(/\/d\/([a-zA-Z0-9_-]+)/) || String(urlDescarga).match(/id=([a-zA-Z0-9_-]+)/);
                if (driveMatch && driveMatch[1]) {
                    downloadUrl = `https://drive.google.com/uc?export=download&id=${driveMatch[1]}`;
                }

                return `
                    <tr class="hover:bg-slate-50/80 dark:hover:bg-slate-900/60 transition-colors">
                        <td class="font-extrabold text-slate-800 dark:text-white font-mono text-xs text-red-600 dark:text-red-400">
                            ${id}
                        </td>
                        <td class="text-slate-500 dark:text-slate-400 text-xs font-medium">
                            ${fecha}
                        </td>
                        <td class="font-semibold text-slate-800 dark:text-slate-200 flex items-center space-x-2">
                            <svg class="w-4 h-4 text-emerald-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                            <span class="truncate max-w-[280px]">${nombre}</span>
                        </td>
                        <td>
                            <span class="badge-status ${badgeClass}">
                                <span class="badge-status-dot"></span>
                                ${estado}
                            </span>
                        </td>
                        <td class="text-right">
                            <a href="${downloadUrl}" target="_blank" download="${nombre}" class="btn-intelfon text-xs py-1.5 px-3.5 inline-flex items-center space-x-1.5 shadow-xs cursor-pointer">
                                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
                                <span>Descargar Excel</span>
                            </a>
                        </td>
                    </tr>
                `;
            }).join('');

            // Actualizar paginación
            if (pageIndicator) pageIndicator.textContent = `Página ${currentPage} de ${totalPages}`;
            if (btnPrev) btnPrev.disabled = (currentPage <= 1);
            if (btnNext) btnNext.disabled = (currentPage >= totalPages);
        }

        // Listeners de filtros
        filterSearch.addEventListener('input', applyFilters);
        filterDate.addEventListener('change', applyFilters);

        selectPageSize.addEventListener('change', (e) => {
            pageSize = parseInt(e.target.value, 10) || 10;
            currentPage = 1;
            renderTable();
        });

        btnPrev.addEventListener('click', () => {
            if (currentPage > 1) {
                currentPage--;
                renderTable();
            }
        });

        btnNext.addEventListener('click', () => {
            const totalPages = Math.ceil(filteredReportes.length / pageSize);
            if (currentPage < totalPages) {
                currentPage++;
                renderTable();
            }
        });

        applyFilters();
    }, 50);

    return container;
}