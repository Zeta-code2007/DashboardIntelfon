import { CONFIG } from '../config.js';

export function renderOverview() {
    const container = document.createElement('div');
    container.className = 'max-w-6xl mx-auto space-y-8';

    container.innerHTML = `
        <!-- TARJETAS KPI SUPERIORES -->
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            
            <!-- KPI 1: Total Reportes -->
            <div class="kpi-card p-6">
                <div class="flex items-center justify-between">
                    <div>
                        <p class="text-xs font-bold uppercase text-slate-500 tracking-wider">Total Reportes</p>
                        <h3 class="text-3xl font-extrabold text-slate-800 mt-1.5 tracking-tight">128</h3>
                    </div>
                    <div class="w-12 h-12 rounded-xl bg-red-50 text-intelfon-red flex items-center justify-center shadow-xs">
                        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h55.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                    </div>
                </div>
                <div class="mt-4 flex items-center text-xs text-emerald-600 font-semibold">
                    <svg class="w-3.5 h-3.5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path></svg>
                    <span>+14.8%</span>
                    <span class="text-slate-400 font-normal ml-1.5">vs. mes anterior</span>
                </div>
            </div>

            <!-- KPI 2: Procesados Hoy -->
            <div class="kpi-card p-6">
                <div class="flex items-center justify-between">
                    <div>
                        <p class="text-xs font-bold uppercase text-slate-500 tracking-wider">Procesados Hoy</p>
                        <h3 class="text-3xl font-extrabold text-slate-800 mt-1.5 tracking-tight">12</h3>
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
                        <h3 class="text-3xl font-extrabold text-slate-800 mt-1.5 tracking-tight">99.2%</h3>
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
                        <h3 class="text-3xl font-extrabold text-slate-800 mt-1.5 tracking-tight">1.8s</h3>
                    </div>
                    <div class="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shadow-xs">
                        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
                    </div>
                </div>
                <div class="mt-4 flex items-center text-xs text-slate-500">
                    <span class="text-amber-600 font-semibold">Alta velocidad</span>
                    <span class="text-slate-400 font-normal ml-1.5">vía Webhook Make EU2</span>
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
                    <span class="px-2.5 py-1 rounded-md text-xs font-semibold bg-slate-100 text-slate-600 self-start sm:self-auto">
                        Actualizado hoy
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
                                <p class="text-xs text-slate-500">Revisa archivos generados anteriormente</p>
                            </div>
                        </button>
                    </div>
                </div>

                <!-- Info Box Make.com Integration -->
                <div class="p-4 rounded-xl bg-slate-50 border border-slate-200/80 text-xs text-slate-600 space-y-1.5">
                    <div class="flex items-center space-x-2 font-bold text-slate-800">
                        <span class="w-2 h-2 rounded-full bg-emerald-500"></span>
                        <span>Make.com Webhook Conectado</span>
                    </div>
                    <p class="text-slate-500 text-[11px]">Procesamiento automatizado de hojas de cálculo con exportación a Google Drive.</p>
                </div>
            </div>
        </div>
    `;

    setTimeout(() => {
        // Gráfica Chart.js con gradiente y diseño moderno
        const ctx = document.getElementById('overviewChart');
        if (ctx) {
            const chartContext = ctx.getContext('2d');
            const gradient = chartContext.createLinearGradient(0, 0, 0, 300);
            gradient.addColorStop(0, '#DC2626');
            gradient.addColorStop(1, 'rgba(220, 38, 38, 0.25)');

            new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago'],
                    datasets: [{
                        label: 'Reportes Generados',
                        data: [65, 78, 90, 81, 95, 110, 105, 128],
                        backgroundColor: gradient,
                        borderRadius: 8,
                        borderSkipped: false,
                        barThickness: 28
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
                            grid: { color: '#F1F5F9', drawBorder: false },
                            ticks: { font: { family: 'Plus Jakarta Sans', size: 11 }, color: '#94A3B8' }
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