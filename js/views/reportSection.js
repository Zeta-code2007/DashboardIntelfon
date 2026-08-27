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
            const navButton = document.querySelector(`.nav-btn[data-view="${viewName}"]`);
            if (navButton) navButton.click();
        });
        tabs.appendChild(button);
    });

    if (options.showNavigation !== false) container.appendChild(tabs);

    const viewer = document.createElement('iframe');
    viewer.className = 'overview-report-viewer';
    viewer.title = title;
    const compactParam = options.compact ? '&compact=1' : '';
    viewer.src = `report-viewer.html?v=4.6${compactParam}#${target}`;
    viewer.loading = 'eager';
    container.appendChild(viewer);

    return container;
}
