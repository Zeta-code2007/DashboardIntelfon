import { RegionService } from '../services/regionService.js';
import { SyncService } from '../services/syncService.js';

function presenceBadgeHtml(online) {
    return online
        ? `<span class="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200"><span class="w-1.5 h-1.5 mr-1.5 bg-emerald-500 rounded-full animate-pulse"></span>Conectado</span>`
        : `<span class="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-100 text-slate-500 border border-slate-200"><span class="w-1.5 h-1.5 mr-1.5 bg-slate-400 rounded-full"></span>Desconectado</span>`;
}

function documentBadgeHtml(doc) {
    const uploaded = !!doc?.uploaded;
    const fileName = doc?.fileName || '';
    const safeTitle = String(fileName).replace(/"/g, '&quot;');

    return uploaded
        ? `<span class="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200" title="${safeTitle}">Documento: Subido</span>`
        : `<span class="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">Documento: No subido</span>`;
}

/**
 * Barra regional privada.
 * Master Guatemala ve SOLO Guatemala.
 * Master El Salvador ve SOLO El Salvador.
 * Ya no se muestra el país contrario ni el switch "Ignorar país contrario".
 */
export function mountRegionStatusBar(targetEl) {
    if (!targetEl) return;

    const myRegion = RegionService.getActiveRegion();
    const myMeta = RegionService.getRegionMeta(myRegion);

    targetEl.innerHTML = `
        <div class="flex flex-wrap items-center gap-3 px-6 md:px-8 py-2.5 bg-white border-b border-slate-200 text-xs">
            <span class="font-bold text-slate-600">Sincronización ${myMeta.name}:</span>
            <span id="sync-presence-badge"></span>
            <span id="sync-document-badge"></span>
            <button type="button" id="sync-refresh-btn" title="Forzar refresco del estado actual" class="p-1 rounded-md text-slate-400 hover:text-intelfon-red hover:bg-red-50 transition-colors">
                <svg id="sync-refresh-icon" class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>
            </button>
            <span class="ml-auto font-semibold text-slate-400">${myMeta.currency}</span>
        </div>
    `;

    const presenceBadge = targetEl.querySelector('#sync-presence-badge');
    const documentBadge = targetEl.querySelector('#sync-document-badge');
    const refreshBtn = targetEl.querySelector('#sync-refresh-btn');
    const refreshIcon = targetEl.querySelector('#sync-refresh-icon');

    function refreshPresence() {
        if (presenceBadge) {
            presenceBadge.innerHTML = presenceBadgeHtml(!!SyncService.getPresence(myRegion).online);
        }
    }

    function refreshDocument() {
        if (documentBadge) {
            documentBadge.innerHTML = documentBadgeHtml(SyncService.getDocumentStatus(myRegion));
        }
    }

    refreshPresence();
    refreshDocument();

    const onPresence = e => {
        if (e.detail?.region === myRegion) refreshPresence();
    };
    const onDocument = e => {
        if (e.detail?.region === myRegion) refreshDocument();
    };

    document.addEventListener('intelfon-sync-presence', onPresence);
    document.addEventListener('intelfon-sync-document', onDocument);

    async function forceRefresh() {
        if (refreshIcon) refreshIcon.classList.add('animate-spin');
        await SyncService.refreshNow(myRegion);
        if (refreshIcon) refreshIcon.classList.remove('animate-spin');
        refreshPresence();
        refreshDocument();
    }

    if (refreshBtn) refreshBtn.addEventListener('click', forceRefresh);

    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') forceRefresh();
    });
}
