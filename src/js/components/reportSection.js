import { RegionService } from '../services/regionService.js';

export function renderReportSection(target, title, options = {}) {
    const container = document.createElement('div');
    container.className = 'report-section-host';

    const tabs = document.createElement('nav');
    tabs.className = 'report-section-tabs';

    const sections = [
        ['resumen', 'Resumen ejecutivo', 'overview'],
        ['bancos', 'Detalle por banco', 'bank-detail'],
        ['flujo', 'Flujo diario', 'daily-flow'],
        ['cuentas', 'Detalle de cuentas', 'account-detail'],
    ];

    sections.forEach(([tabTarget, label, viewName]) => {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = `report-section-tab${target === tabTarget ? ' active' : ''}`;
        button.textContent = label;
        button.addEventListener('click', () => {
            document.querySelector(`.nav-btn[data-view="${viewName}"]`)?.click();
        });
        tabs.appendChild(button);
    });

    if (options.showNavigation !== false) container.appendChild(tabs);

    const viewer = document.createElement('iframe');
    viewer.className = 'overview-report-viewer';
    viewer.title = title;
    viewer.loading = 'eager';

    function getViewerUrl() {

        const region =
            options.region ||
            RegionService.getActiveRegion();


        const compact =
            options.compact
                ? '&compact=1'
                : '';


        return `report-viewer.html?region=${encodeURIComponent(region)}${compact}#${target}`;

    }

    viewer.src = getViewerUrl();

    const refreshViewer = () => {
        viewer.src = 'about:blank';
        requestAnimationFrame(() => {
            viewer.src = getViewerUrl();
        });
    };

    window.addEventListener('storage', event => {
        if (event.key === 'intelfon_current_report') refreshViewer();
    });

    window.addEventListener('intelfon-report-updated', event => {
        if (event.detail?.key === 'intelfon_current_report') refreshViewer();
    });

    container.appendChild(viewer);
    return container;
}
