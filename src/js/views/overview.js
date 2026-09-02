import { renderReportSection } from './reportSection.js';
import { RegionService } from '../services/regionService.js';

export function renderOverview() {

    const container = renderReportSection(
        'resumen',
        'Resumen ejecutivo',
        {
            compact: false,
            showNavigation: false,
            region: RegionService.getActiveRegion()
        }
    );


    container.classList.add(
        'overview-overview-shell',
        'overview-viewer-host'
    );


    return container;

}