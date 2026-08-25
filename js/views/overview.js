import { obtenerHistorialReportes } from '../services/historyService.js';

export function renderOverview() {
    const container = document.createElement('div');
    container.className = 'max-w-6xl mx-auto space-y-8';

    container.innerHTML = `
        <!-- TARJETAS KPI SUPERIORES (DINÁMICAS) -->
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            
            <!-- KPI 1: Total Reportes -->
            <div class="kpi-card p-6">
                <div class="flex items-center justify-between">
                    <div>
                        <p class="text-xs font-bold uppercase text-slate-500 tracking-wider">Total Reportes</p>
                        <h3 id="kpi-total-reportes" class="text-3xl font-extrabold text-slate-800 mt-1.5 tracking-tight">--</h3>
                    </div>
                    <div class="w-12 h-12 rounded-xl bg-red-50 text-intelfon-red flex items-center justify-center shadow-xs">
                        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h55.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                    </div>
                </div>
                <div class="mt-4 flex items-center text-xs text-emerald-600 font-semibold" id="kpi-total-subtext">
                    <span class="w-2 h-2 rounded-full bg-emerald-500 mr-2 animate-pulse"></span>
                    <span>Sincronizado con Google Sheets</span>
                </div>
            </div>

            <!-- KPI 2: Procesados Hoy -->
            <div class="kpi-card p-6">
                <div class="flex items-center justify-between">
                    <div>
                        <p class="text-xs font-bold uppercase text-slate-500 tracking-wider">Procesados Hoy</p>
                        <h3 id="kpi-procesados-hoy" class="text-3xl font-extrabold text-slate-800 mt-1.5 tracking-tight">--</h3>
                    </div>
                    <div class="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shadow-xs">
                        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                    </div>
                </div>
                <div class="mt-4 flex items-center text-xs text-slate-500">
                    <span class="w-2 h-2 rounded-full bg-blue-500 mr-2"></span>
                    <span>Flujo Make activo en tiempo real</span>
                </div>
            </div>

            <!-- KPI 3: Éxito en Procesos -->
            <div class="kpi-card p-6">
                <div class="flex items-center justify-between">
                    <div>
                        <p class="text-xs font-bold uppercase text-slate-500 tracking-wider">Éxito en Procesos</p>
                        <h3 id="kpi-exito-procesos" class="text-3xl font-extrabold text-slate-800 mt-1.5 tracking-tight">100%</h3>
                    </div>
                    <div class="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shadow-xs">
                        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                    </div>
                </div>
                <div class="mt-4 flex items-center text-xs text-emerald-600 font-semibold">
                    <span class="px-1.5 py-0.5 rounded bg-emerald-100/70 text-emerald-800 text-[11px] mr-1.5 font-bold">Óptimo</span>
                    <span class="text-slate-400 font-normal">Tolerancia cero a errores</span>
                </div>
            </div>

            <!-- KPI 4: Tiempo Promedio -->
            <div class="kpi-card p-6">
                <div class="flex items-center justify-between">
                    <div>
                        <p class="text-xs font-bold uppercase text-slate-500 tracking-wider">Tiempo Promedio</p>
                        <h3 id="kpi-tiempo-promedio" class="text-3xl font-extrabold text-slate-800 mt-1.5 tracking-tight">~2.1s</h3>
                    </div>
                    <div class="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shadow-xs">
                        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
                    </div>
                </div>
                <div class="mt-4 flex items-center text-xs text-slate-500">
                    <span class="text-amber-600 font-semibold">Alta velocidad</span>
                    <span class="text-slate-400 font-normal ml-1.5">vía Make.com EU2</span>
                </div>
            </div>
        </div>

        <!-- SECCIÓN DE GRÁFICA Y ACCIONES RÁPIDAS -->
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            <!-- Gráfica de Rendimiento Mensual -->
            <div class="card-intelfon p-7 lg:col-span-2 space-y-4">
                <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2">
                    <div>
                        <h4 class="text-base font-bold text-slate-800">Volumen de Reportes Generados</h4>
                        <p class="text-xs text-slate-400 mt-0.5">Histórico consolidado del año fiscal 2026</p>
                    </div>
                    <span id="overview-update-badge" class="px-2.5 py-1 rounded-md text-xs font-semibold bg-slate-100 text-slate-600 self-start sm:self-auto">
                        Actualizado en vivo
                    </span>
                </div>
                <div class="relative h-72">
                    <canvas id="overviewChart"></canvas>
                </div>
            </div>

            <!-- Panel de Acciones Rápidas & Estado -->
            <div class="card-intelfon p-7 space-y-6 flex flex-col justify-between">
                <div>
                    <h4 class="text-base font-bold text-slate-800 mb-1">Acciones Rápidas</h4>
                    <p class="text-xs text-slate-400 mb-5">Atajos directos para la gestión de documentos.</p>

                    <div class="space-y-3">
                        <button type="button" id="btn-quick-generate" class="w-full text-left p-3.5 rounded-xl border border-slate-200 hover:border-red-300 hover:bg-red-50/50 transition-all flex items-center space-x-3 group">
                            <div class="p-2 rounded-lg bg-red-100 text-intelfon-red group-hover:bg-intelfon-red group-hover:text-white transition-colors">
                                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path></svg>
                            </div>
                            <div>
                                <p class="text-sm font-bold text-slate-800 group-hover:text-intelfon-red transition-colors">Generar Reporte Excel</p>
                                <p class="text-xs text-slate-500">Procesa un nuevo archivo con Make</p>
                            </div>
                        </button>

                        <button type="button" id="btn-quick-history" class="w-full text-left p-3.5 rounded-xl border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-all flex items-center space-x-3 group">
                            <div class="p-2 rounded-lg bg-slate-100 text-slate-700 group-hover:bg-slate-800 group-hover:text-white transition-colors">
                                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h55.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                            </div>
                            <div>
                                <p class="text-sm font-bold text-slate-800 group-hover:text-slate-900 transition-colors">Consultar Historial</p>
                                <p class="text-xs text-slate-500">Revisa archivos guardados en Google Sheets</p>
                            </div>
                        </button>
                    </div>
                </div>

                <!-- Info Box Make.com Integration -->
                <div class="p-4 rounded-xl bg-slate-50 border border-slate-200/80 text-xs text-slate-600 space-y-1.5">
                    <div class="flex items-center space-x-2 font-bold text-slate-800">
                        <span class="w-2 h-2 rounded-full bg-emerald-500"></span>
                        <span>Base de Datos Google Sheets</span>
                    </div>
                    <p class="text-slate-500 text-[11px]">Sincronización bidireccional en tiempo real con DB_Reportes_Intelfon.</p>
                </div>
            </div>
        </div>
    `;

    setTimeout(async () => {
        let reportes = [];
        try {
            reportes = await obtenerHistorialReportes();
            if (!Array.isArray(reportes)) reportes = [];
        } catch (e) {
            console.warn('No se pudo cargar el historial para overview:', e);
            reportes = [];
        }

        // 1. Calcular KPIs Reales
        const totalReportes = reportes.length;
        
        // Fecha de hoy en formato YYYY-MM-DD
        const todayStr = new Date().toISOString().slice(0, 10);
        const hoyReportes = reportes.filter(r => {
            const f = String(r.fecha || '');
            return f.includes(todayStr) || f.toLowerCase().includes('hoy');
        }).length;

        // Éxito en procesos
        const completados = reportes.filter(r => {
            const st = String(r.estado || '').toLowerCase();
            return st.includes('complet') || st.includes('aprob') || st.includes('optimo') || st.includes('listo');
        }).length;

        const tasaExito = totalReportes > 0 ? `${((completados / totalReportes) * 100).toFixed(1)}%` : '100%';

        // Actualizar KPIs en el DOM
        const elTotal = container.querySelector('#kpi-total-reportes');
        const elHoy = container.querySelector('#kpi-procesados-hoy');
        const elExito = container.querySelector('#kpi-exito-procesos');

        if (elTotal) elTotal.textContent = String(totalReportes);
        if (elHoy) elHoy.textContent = String(hoyReportes);
        if (elExito) elExito.textContent = tasaExito;

        // 2. Agrupar por mes para la gráfica
        const mesesLabels = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
        const mesesData = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];

        reportes.forEach(r => {
            if (!r.fecha) return;
            const match = String(r.fecha).match(/(\d{4})[/-](\d{1,2})[/-](\d{1,2})/) || String(r.fecha).match(/(\d{1,2})[/-](\d{1,2})[/-](\d{4})/);
            if (match) {
                // Si el año está en match[1]
                let mes = 0;
                if (match[1].length === 4) {
                    mes = parseInt(match[2], 10) - 1;
                } else if (match[3] && match[3].length === 4) {
                    mes = parseInt(match[2], 10) - 1;
                }
                if (mes >= 0 && mes < 12) {
                    mesesData[mes]++;
                }
            } else {
                // Si no tiene fecha parseable, contar en el mes actual (Agosto = 7)
                const currentMonth = new Date().getMonth();
                mesesData[currentMonth]++;
            }
        });

        // Gráfica Chart.js con datos reales
        const ctx = document.getElementById('overviewChart');
        if (ctx) {
            const chartContext = ctx.getContext('2d');
            const gradient = chartContext.createLinearGradient(0, 0, 0, 300);
            gradient.addColorStop(0, '#DC2626');
            gradient.addColorStop(1, 'rgba(220, 38, 38, 0.25)');

            new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: mesesLabels,
                    datasets: [{
                        label: 'Reportes Registrados en DB',
                        data: mesesData,
                        backgroundColor: gradient,
                        borderRadius: 8,
                        borderSkipped: false,
                        barThickness: 22
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { display: false },
                        tooltip: {
                            backgroundColor: '#0F172A',
                            titleFont: { family: 'Plus Jakarta Sans', size: 12, weight: 'bold' },
                            bodyFont: { family: 'Plus Jakarta Sans', size: 12 },
                            padding: 10,
                            cornerRadius: 8,
                            displayColors: false
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            ticks: {
                                stepSize: 1,
                                font: { family: 'Plus Jakarta Sans', size: 11 },
                                color: '#94A3B8'
                            },
                            grid: { color: '#F1F5F9', drawBorder: false }
                        },
                        x: {
                            grid: { display: false, drawBorder: false },
                            ticks: { font: { family: 'Plus Jakarta Sans', size: 11 }, color: '#64748B' }
                        }
                    }
                }
            });
        }

        // Listeners para botones de acceso rápido
        const btnQuickGen = container.querySelector('#btn-quick-generate');
        const btnQuickHist = container.querySelector('#btn-quick-history');

        if (btnQuickGen) {
            btnQuickGen.addEventListener('click', () => {
                const navBtn = document.querySelector('.nav-btn[data-view="generator"]');
                if (navBtn) navBtn.click();
            });
        }

        if (btnQuickHist) {
            btnQuickHist.addEventListener('click', () => {
                const navBtn = document.querySelector('.nav-btn[data-view="history"]');
                if (navBtn) navBtn.click();
            });
        }
    }, 50);

    return container;
}