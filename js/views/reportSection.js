import { RegionService } from '../services/regionService.js';

const CURRENT_REPORT_KEY = 'intelfon_current_report';
const SOURCE_REPORT_KEY = 'intelfon_current_report_source';

function toNumber(value) {
    if (value === null || value === undefined || value === '') return 0;
    if (typeof value === 'number') return Number.isFinite(value) ? value : 0;

    let text = String(value).trim()
        .replace(/[Q$€]/g, '')
        .replace(/\s/g, '');

    if (text.includes(',') && text.includes('.')) {
        if (text.lastIndexOf(',') > text.lastIndexOf('.')) {
            text = text.replace(/\./g, '').replace(',', '.');
        } else {
            text = text.replace(/,/g, '');
        }
    } else if (text.includes(',')) {
        const parts = text.split(',');
        text = parts[parts.length - 1].length <= 2
            ? `${parts.slice(0, -1).join('')}.${parts[parts.length - 1]}`
            : parts.join('');
    }

    const number = Number(text);
    return Number.isFinite(number) ? number : 0;
}

function normalizeCountry(value) {
    const text = String(value || '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .trim();

    if (text === 'gt' || text.includes('guatemala')) return 'GT';
    if (text === 'sv' || text.includes('salvador')) return 'SV';
    return '';
}

function rowRegion(row) {
    if (!row || typeof row !== 'object') return '';
    return normalizeCountry(row.Pais || row['País'] || row.pais || row.Country || row.country);
}

function normalizeMoneyRow(row, key = '') {
    if (!row || typeof row !== 'object' || Array.isArray(row)) return row;

    const ingresos = toNumber(
        row.ingresos ?? row.Ingresos ??
        row.creditos ?? row.créditos ?? row.Creditos ?? row.Créditos ??
        row.credits ?? row.Credits ??
        row.credit ?? row.Credit ??
        row.Ingreso ?? row.ingreso ?? 0
    );

    const egresos = Math.abs(toNumber(
        row.egresos ?? row.Egresos ??
        row.debitos ?? row.débitos ?? row.Debitos ?? row.Débitos ??
        row.debits ?? row.Debits ??
        row.debit ?? row.Debit ??
        row.Egreso ?? row.egreso ?? 0
    ));

    const movimientos = toNumber(
        row.movimientos ?? row.Movimientos ??
        row.movementCount ?? row.movements ??
        row.registros ?? row.Registros ?? 0
    );

    const netRaw =
        row.neto ?? row.Neto ??
        row.flujo_neto ?? row.flujoNeto ??
        row.netFlow ?? row.net;

    const neto = netRaw === undefined || netRaw === null || netRaw === ''
        ? ingresos - egresos
        : toNumber(netRaw);

    const periodo =
        row.periodo ?? row.Periodo ??
        row.fecha ?? row.Fecha ??
        row.date ?? row.Date ??
        row.fecha_normalizada ??
        key;

    return {
        ...row,

        // Nombres Make
        ingresos,
        egresos,
        neto,
        movimientos,
        periodo,

        // Aliases usados por distintas versiones del visor.
        creditos: ingresos,
        créditos: ingresos,
        Creditos: ingresos,
        Créditos: ingresos,
        credits: ingresos,
        Credits: ingresos,
        credit: ingresos,
        Credit: ingresos,

        debitos: egresos,
        débitos: egresos,
        Debitos: egresos,
        Débitos: egresos,
        debits: egresos,
        Debits: egresos,
        debit: egresos,
        Debit: egresos,

        flujo_neto: neto,
        flujoNeto: neto,
        netFlow: neto,
        net: neto,

        movements: movimientos,
        movementCount: movimientos,

        date: periodo,
        fecha: periodo
    };
}

function normalizeCollection(collection, activeRegion, filterByRegion = true) {
    if (typeof collection === 'string') {
        try {
            collection = JSON.parse(collection);
        } catch (_) {
            return collection;
        }
    }

    if (Array.isArray(collection)) {
        return collection
            .filter(row => !filterByRegion || !rowRegion(row) || rowRegion(row) === activeRegion)
            .map((row, index) => normalizeMoneyRow(row, String(index)));
    }

    if (collection && typeof collection === 'object') {
        const out = {};
        Object.entries(collection).forEach(([key, row]) => {
            if (filterByRegion && rowRegion(row) && rowRegion(row) !== activeRegion) return;
            out[key] = normalizeMoneyRow(row, key);
        });
        return out;
    }

    return collection;
}

function normalizeBankRecord(record, activeRegion) {
    if (!record || typeof record !== 'object') return record;
    if (rowRegion(record) && rowRegion(record) !== activeRegion) return null;

    const totalIngresos = toNumber(
        record.Total_Ingresos ?? record.total_ingresos ??
        record.ingresos ?? record.creditos ?? record.credits ?? 0
    );

    const totalEgresos = Math.abs(toNumber(
        record.Total_Egresos ?? record.total_egresos ??
        record.egresos ?? record.debitos ?? record.debits ?? 0
    ));

    const neto = toNumber(record.Neto ?? record.neto ?? record.netFlow ?? (totalIngresos - totalEgresos));

    const movimientos = Array.isArray(record.estado_cuenta)
        ? record.estado_cuenta.map((movement, index) => normalizeMoneyRow(movement, String(index)))
        : record.estado_cuenta;

    return {
        ...record,
        Total_Ingresos: totalIngresos,
        Total_Egresos: totalEgresos,
        Neto: neto,
        ingresos: totalIngresos,
        egresos: totalEgresos,
        neto,
        creditos: totalIngresos,
        credits: totalIngresos,
        debitos: totalEgresos,
        debits: totalEgresos,
        netFlow: neto,
        estado_cuenta: movimientos
    };
}

function parseMaybeJson(value) {
    if (typeof value !== 'string') return value;
    try { return JSON.parse(value); } catch (_) { return value; }
}

function prepareReportForViewer() {
    const activeRegion = RegionService.getActiveRegion();
    const meta = RegionService.getRegionMeta(activeRegion);

    let raw = localStorage.getItem(CURRENT_REPORT_KEY);
    if (!raw) return;

    let report;
    try {
        report = JSON.parse(raw);
    } catch (_) {
        return;
    }

    // Si este payload no fue filtrado antes, conservar una copia fuente.
    if (!report?.__viewerRegionFiltered) {
        try {
            localStorage.setItem(SOURCE_REPORT_KEY, raw);
        } catch (_) {}
    } else {
        // Si ya estaba filtrado, reconstruir desde la última fuente completa.
        const source = localStorage.getItem(SOURCE_REPORT_KEY);
        if (source) {
            try { report = JSON.parse(source); } catch (_) {}
        }
    }

    if (!report || typeof report !== 'object') return;

    // Parsear campos que Make/Firebase pueden entregar serializados como JSON string.
    [
        'bancos_procesados',
        'reportes_diarios',
        'reportes_semanales',
        'reportes_mensuales',
        'reportes_por_banco',
        'resumen_general'
    ].forEach(key => {
        if (report[key] !== undefined) report[key] = parseMaybeJson(report[key]);
    });

    if (Array.isArray(report.bancos_procesados)) {
        report.bancos_procesados = report.bancos_procesados
            .map(row => normalizeBankRecord(row, activeRegion))
            .filter(Boolean);
    }

    report.reportes_diarios = normalizeCollection(report.reportes_diarios, activeRegion);
    report.reportes_semanales = normalizeCollection(report.reportes_semanales, activeRegion);
    report.reportes_mensuales = normalizeCollection(report.reportes_mensuales, activeRegion);
    report.reportes_por_banco = normalizeCollection(report.reportes_por_banco, activeRegion);

    // Aliases raíz para visores antiguos/nuevos.
    report.reportesDiarios = report.reportes_diarios;
    report.dailyReports = report.reportes_diarios;
    report.daily = report.reportes_diarios;

    report.reportesSemanales = report.reportes_semanales;
    report.weeklyReports = report.reportes_semanales;

    report.reportesMensuales = report.reportes_mensuales;
    report.monthlyReports = report.reportes_mensuales;

    report.reportesPorBanco = report.reportes_por_banco;
    report.bankReports = report.reportes_por_banco;

    report.region = activeRegion;
    report.country = meta.name;
    report.pais = meta.name;
    report.currency = meta.currency;
    report.moneda = meta.currency;
    report.__viewerRegionFiltered = activeRegion;
    report.__viewerNormalizedAt = Date.now();

    // Para SV garantizamos USD en los metadatos que usa el viewer.
    if (activeRegion === 'SV') {
        report.currency = 'USD';
        report.moneda = 'USD';
        if (report.meta && typeof report.meta === 'object') {
            report.meta.currency = 'USD';
            report.meta.country = 'El Salvador';
            report.meta.pais = 'El Salvador';
        }
    }

    try {
        localStorage.setItem(CURRENT_REPORT_KEY, JSON.stringify(report));
    } catch (error) {
        console.error('[ReportSection] No se pudo preparar el reporte para el visor:', error);
    }
}

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

    // IMPORTANTE: normaliza y filtra ANTES de que report-viewer.html lea localStorage.
    prepareReportForViewer();

    const viewer = document.createElement('iframe');
    viewer.className = 'overview-report-viewer';
    viewer.title = title;

    const compactParam = options.compact ? '&compact=1' : '';

    function getViewerUrl() {
        const activeRegion = RegionService.getActiveRegion();
        return `report-viewer.html?region=${encodeURIComponent(activeRegion)}${compactParam}#${target}`;
    }

    viewer.src = getViewerUrl();

    const refreshViewer = () => {
        prepareReportForViewer();
        const next = getViewerUrl();
        viewer.src = 'about:blank';
        requestAnimationFrame(() => {
            viewer.src = next;
        });
    };

    window.addEventListener('storage', event => {
        if (event.key === CURRENT_REPORT_KEY) refreshViewer();
    });

    window.addEventListener('intelfon-report-updated', event => {
        if (event.detail && event.detail.key === CURRENT_REPORT_KEY) refreshViewer();
    });

    // Evita recargar el iframe en cada focus si no hubo cambios reales.
    viewer.loading = 'eager';
    container.appendChild(viewer);

    return container;
}
