import { renderReportSection } from './reportSection.js';

export function renderOverview() {

    const container = renderReportSection(
        'resumen',
        'Resumen ejecutivo',
        {
            compact: false,
            showNavigation: false,
            region: 'GLOBAL'
        }
    );


    container.classList.add(
        'overview-overview-shell',
        'overview-viewer-host'
    );


    return container;

}