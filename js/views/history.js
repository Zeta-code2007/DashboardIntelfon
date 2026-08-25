import { obtenerHistorialReportes } from '../services/historyService.js';

export function renderHistory() {
    const container = document.createElement('div');
    container.className = 'max-w-6xl mx-auto space-y-6';

    container.innerHTML = `
        <div class="card-intelfon p-8 space-y-6">
            <!-- Header del Historial y Buscador -->
            <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-6">
                <div>
                    <h3 class="text-xl font-extrabold text-slate-800 tracking-tight">Historial de Reportes Generados</h3>
                    <p class="text-sm text-slate-500 mt-0.5">Consulta y descarga los archivos Excel creados y archivados previamente.</p>
                </div>
                
                <!-- Barra de Búsqueda -->
                <div class="relative w-full md:w-72">
                    <div class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                    </div>
                    <input 
                        type="text" 
                        id="search-input" 
                        placeholder="Buscar por ID o nombre..." 
                        class="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all placeholder:text-slate-400 shadow-2xs"
                    >
                </div>
            </div>

            <!-- Tabla de Reportes Anteriores -->
            <div class="overflow-x-auto border border-slate-200 rounded-xl shadow-xs">
                <table class="table-modern">
                    <thead>
                        <tr>
                            <th>ID Reporte</th>
                            <th>Fecha</th>
                            <th>Nombre de Archivo</th>
                            <th>Categoría</th>
                            <th>Estado</th>
                            <th class="text-right">Acción</th>
                        </tr>
                    </thead>
                    <tbody id="table-body" class="divide-y divide-slate-100">
                        <!-- Skeleton Loader Inicial -->
                        <tr>
                            <td colspan="6" class="p-8 text-center text-slate-400">
                                <div class="flex items-center justify-center space-x-3">
                                    <svg class="animate-spin h-5 w-5 text-intelfon-red" fill="none" viewBox="0 0 24 24">
                                        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                                        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    <span class="text-sm font-semibold text-slate-600">Cargando historial de reportes...</span>
                                </div>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    `;

    setTimeout(async () => {
        const tableBody = container.querySelector('#table-body');
        const searchInput = container.querySelector('#search-input');

        let reportes = [];
        try {
            reportes = await obtenerHistorialReportes();
            if (!Array.isArray(reportes)) reportes = [];
        } catch (_) {
            reportes = [];
        }

        function renderRows(data) {
            if (!data || data.length === 0) {
                tableBody.innerHTML = `
                    <tr>
                        <td colspan="6" class="px-6 py-12 text-center text-slate-400">
                            <div class="max-w-xs mx-auto space-y-2">
                                <div class="w-10 h-10 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                                </div>
                                <p class="text-sm font-bold text-slate-700">No se encontraron reportes</p>
                                <p class="text-xs text-slate-400">Intenta con otro término de búsqueda o genera un nuevo reporte.</p>
                            </div>
                        </td>
                    </tr>
                `;
                return;
            }

            tableBody.innerHTML = data.map(item => {
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

                return `
                    <tr class="hover:bg-slate-50/80 transition-colors">
                        <td class="font-bold text-slate-800">${id}</td>
                        <td class="text-slate-500 text-xs">${fecha}</td>
                        <td class="font-semibold text-slate-800 flex items-center space-x-2">
                            <svg class="w-4 h-4 text-emerald-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                            <span class="truncate">${nombre}</span>
                        </td>
                        <td>
                            <span class="px-2.5 py-1 rounded-md text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200/60">
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
                            <a href="${urlDescarga}" target="_blank" rel="noopener noreferrer" class="btn-intelfon text-xs py-1.5 px-3.5 inline-flex items-center space-x-1.5 shadow-xs">
                                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
                                <span>Descargar</span>
                            </a>
                        </td>
                    </tr>
                `;
            }).join('');
        }

        renderRows(reportes);

        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                const query = e.target.value.toLowerCase().trim();
                if (!query) {
                    renderRows(reportes);
                    return;
                }
                const filtrados = reportes.filter(r => {
                    const nombre = (r.nombreArchivo || r.nombre || '').toLowerCase();
                    const id = (r.id || '').toLowerCase();
                    const tipo = (r.tipo || '').toLowerCase();
                    return nombre.includes(query) || id.includes(query) || tipo.includes(query);
                });
                renderRows(filtrados);
            });
        }
    }, 50);

    return container;
}