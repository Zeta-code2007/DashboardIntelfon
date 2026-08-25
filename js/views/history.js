import { obtenerHistorialReportes } from '../services/historyService.js';
import { Toast } from '../services/toastService.js?v=2.9';

export function renderHistory() {
    const container = document.createElement('div');
    container.className = 'max-w-6xl mx-auto space-y-6';

    container.innerHTML = `
        <div class="card-intelfon p-8 space-y-6">
            <!-- Header del Historial -->
            <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-6">
                <div>
                    <h3 class="text-xl font-extrabold text-slate-800 dark:text-white tracking-tight">Historial de Reportes Generados</h3>
                    <p class="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Consulta, filtra y descarga los archivos archivados en Google Sheets.</p>
                </div>
                <div id="history-total-badge" class="px-3 py-1.5 rounded-full bg-red-50 dark:bg-red-950/60 text-red-700 dark:text-red-300 font-bold text-xs border border-red-200 dark:border-red-800 self-start md:self-auto">
                    Cargando archivos...
                </div>
            </div>

            <!-- BARRA DE FILTROS AVANZADOS -->
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 bg-slate-50 dark:bg-slate-900/80 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 text-xs">
                <!-- Buscador de Texto -->
                <div class="relative">
                    <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                    </div>
                    <input 
                        type="text" 
                        id="filter-search" 
                        placeholder="Buscar archivo o ID..." 
                        class="w-full pl-9 pr-3 py-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-white focus:ring-2 focus:ring-red-500"
                    >
                </div>

                <!-- Filtro por Rango de Fecha -->
                <div>
                    <select id="filter-date" class="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-red-500">
                        <option value="all">📅 Todas las fechas</option>
                        <option value="today">Hoy</option>
                        <option value="week">Últimos 7 días</option>
                        <option value="month">Este mes</option>
                    </select>
                </div>

                <!-- Filtro por Entidad Bancaria -->
                <div>
                    <select id="filter-type" class="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-red-500">
                        <option value="all">🏦 Todos los Bancos</option>
                        <option value="industrial">Banco Industrial (BI)</option>
                        <option value="bac">BAC Credomatic</option>
                        <option value="banrural">Banrural</option>
                        <option value="gyt">G&T Continental</option>
                        <option value="promerica">Banco Promerica</option>
                    </select>
                </div>

                <!-- Filtro por Estado -->
                <div>
                    <select id="filter-status" class="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-red-500">
                        <option value="all">⚡ Todos los estados</option>
                        <option value="completado">Completados</option>
                        <option value="pendiente">Pendientes</option>
                    </select>
                </div>
            </div>

            <!-- Tabla de Reportes Anteriores -->
            <div class="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs">
                <table class="table-modern">
                    <thead>
                        <tr>
                            <th>ID Reporte</th>
                            <th>Fecha de Creación</th>
                            <th>Nombre de Archivo</th>
                            <th>Categoría</th>
                            <th>Estado</th>
                            <th class="text-right">Descarga</th>
                        </tr>
                    </thead>
                    <tbody id="table-body" class="divide-y divide-slate-100 dark:divide-slate-800">
                        <!-- Skeleton Loader Inicial -->
                        <tr>
                            <td colspan="6" class="p-8 text-center text-slate-400">
                                <div class="flex items-center justify-center space-x-3">
                                    <svg class="animate-spin h-5 w-5 text-intelfon-red" fill="none" viewBox="0 0 24 24">
                                        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                                        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    <span class="text-sm font-semibold text-slate-600 dark:text-slate-300">Sincronizando con Google Sheets...</span>
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
        const filterType = container.querySelector('#filter-type');
        const filterStatus = container.querySelector('#filter-status');
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
            const typeVal = filterType.value;
            const statusVal = filterStatus.value;

            const now = new Date();
            const todayStr = now.toISOString().slice(0, 10);

            filteredReportes = rawReportes.filter(r => {
                const nombre = String(r.nombreArchivo || r.nombre || '').toLowerCase();
                const id = String(r.id || '').toLowerCase();
                const tipo = String(r.tipo || '').toLowerCase();
                const estado = String(r.estado || '').toLowerCase();
                const fecha = String(r.fecha || '');

                // Filtro texto
                if (query && !nombre.includes(query) && !id.includes(query) && !tipo.includes(query)) {
                    return false;
                }

                // Filtro tipo
                if (typeVal !== 'all' && !tipo.includes(typeVal)) {
                    return false;
                }

                // Filtro estado
                if (statusVal !== 'all' && !estado.includes(statusVal)) {
                    return false;
                }

                // Filtro fecha
                if (dateVal === 'today') {
                    if (!fecha.includes(todayStr) && !fecha.toLowerCase().includes('hoy')) return false;
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
                totalBadge.textContent = `${total} archivo${total === 1 ? '' : 's'} disponible${total === 1 ? '' : 's'}`;
            }

            if (total === 0) {
                tableBody.innerHTML = `
                    <tr>
                        <td colspan="6" class="px-6 py-12 text-center text-slate-400">
                            <div class="max-w-xs mx-auto space-y-2">
                                <div class="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
                                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                                </div>
                                <p class="text-sm font-bold text-slate-700 dark:text-slate-200">No se encontraron reportes</p>
                                <p class="text-xs text-slate-400">Ajusta los filtros o genera un nuevo reporte.</p>
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
                const id = item.id || 'N/A';
                const fecha = item.fecha || 'Reciente';
                const nombre = item.nombreArchivo || item.nombre || 'Reporte.xlsx';
                const tipo = item.tipo || 'General';
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
                        <td class="font-bold text-slate-800 dark:text-white font-mono text-xs">${id}</td>
                        <td class="text-slate-500 dark:text-slate-400 text-xs">${fecha}</td>
                        <td class="font-semibold text-slate-800 dark:text-slate-200 flex items-center space-x-2">
                            <svg class="w-4 h-4 text-emerald-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                            <span class="truncate max-w-[200px]">${nombre}</span>
                        </td>
                        <td>
                            <span class="px-2.5 py-1 rounded-md text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700">
                                ${tipo}
                            </span>
                        </td>
                        <td>
                            <span class="badge-status ${badgeClass}">
                                <span class="badge-status-dot"></span>
                                ${estado}
                            </span>
                        </td>
                        <td class="text-right">
                            <a href="${downloadUrl}" target="_blank" download="${nombre}" class="btn-intelfon text-xs py-1.5 px-3.5 inline-flex items-center space-x-1.5 shadow-xs">
                                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
                                <span>Descargar</span>
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
        filterType.addEventListener('change', applyFilters);
        filterStatus.addEventListener('change', applyFilters);

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