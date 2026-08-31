import { RegionService } from '../services/regionService.js';
import { SyncService } from '../services/syncService.js';
import { Toast } from '../services/toastService.js';

function presenceBadgeHtml(online) {
    return online
        ? `<span class="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200"><span class="w-1.5 h-1.5 mr-1.5 bg-emerald-500 rounded-full animate-pulse"></span>Conectado</span>`
        : `<span class="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-100 text-slate-500 border border-slate-200"><span class="w-1.5 h-1.5 mr-1.5 bg-slate-400 rounded-full"></span>Desconectado</span>`;
}

function documentBadgeHtml(uploaded, fileName) {
    const safeTitle = fileName ? String(fileName).replace(/"/g, '&quot;') : '';
    return uploaded
        ? `<span class="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200" title="${safeTitle}">Archivo: Subido</span>`
        : `<span class="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">Archivo: No subido</span>`;
}

export function mountRegionStatusBar(targetEl) {
    if (!targetEl) return;

    const myRegion = RegionService.getActiveRegion();
    const otherRegion = RegionService.getOtherRegion(myRegion);
    const otherMeta = RegionService.getRegionMeta(otherRegion);

    targetEl.innerHTML = `
        <div class="flex flex-wrap items-center gap-3 px-6 md:px-8 py-2.5 bg-white border-b border-slate-200 text-xs">
            <span class="font-bold text-slate-600">Coordinación con ${otherMeta.name}:</span>
            <span id="sync-presence-badge"></span>
            <span id="sync-document-badge"></span>
            <button type="button" id="sync-refresh-btn" title="Forzar refresco desde Firebase" class="p-1 rounded-md text-slate-400 hover:text-intelfon-red hover:bg-red-50 transition-colors">↻</button>
            <label class="ml-auto inline-flex items-center gap-2 cursor-pointer select-none">
                <span class="font-semibold text-slate-500">Ignorar ${otherMeta.name}</span>
                <span class="relative inline-block w-9 h-5">
                    <input type="checkbox" id="sync-override-toggle" class="peer sr-only">
                    <span class="absolute inset-0 rounded-full bg-slate-300 peer-checked:bg-intelfon-red transition-colors"></span>
                    <span class="absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform peer-checked:translate-x-4"></span>
                </span>
            </label>
        </div>`;

    const presenceBadge = targetEl.querySelector('#sync-presence-badge');
    const documentBadge = targetEl.querySelector('#sync-document-badge');
    const overrideToggle = targetEl.querySelector('#sync-override-toggle');
    const refreshBtn = targetEl.querySelector('#sync-refresh-btn');

    const refreshPresence = () => {
        presenceBadge.innerHTML = presenceBadgeHtml(!!SyncService.getPresence(otherRegion).online);
    };
    const refreshDocument = () => {
        const doc = SyncService.getDocumentStatus(otherRegion);
        documentBadge.innerHTML = documentBadgeHtml(!!doc.uploaded, doc.fileName);
    };
    const refreshOverride = () => {
        overrideToggle.checked = !!SyncService.getOverride(myRegion).ignoreOther;
    };

    refreshPresence();
    refreshDocument();
    refreshOverride();

    document.addEventListener('intelfon-sync-presence', e => {
        if (e.detail.region === otherRegion) refreshPresence();
    });
    document.addEventListener('intelfon-sync-document', e => {
        if (e.detail.region === otherRegion) refreshDocument();
    });
    document.addEventListener('intelfon-sync-override', e => {
        if (e.detail.region === myRegion) refreshOverride();
    });

    overrideToggle.addEventListener('change', async () => {
        const value = overrideToggle.checked;
        const ok = await SyncService.setOverride(myRegion, value);
        if (!ok) {
            overrideToggle.checked = !value;
            Toast.error('No se pudo actualizar el switch.', 'Firebase');
        }
    });

    const forceRefresh = async () => {
        await SyncService.refreshNow();
        refreshPresence();
        refreshDocument();
        refreshOverride();
    };

    refreshBtn?.addEventListener('click', forceRefresh);
    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') forceRefresh();
    });
}
