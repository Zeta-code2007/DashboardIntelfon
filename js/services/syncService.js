import { FirebaseService } from './firebaseService.js';
import { CONFIG } from '../config.js';

const ROOT = CONFIG.SYNC.rootPath;

const cache = {
    presence: { GT: { online: false }, SV: { online: false } },
    documents: { GT: { uploaded: false }, SV: { uploaded: false } },
    overrides: { GT: { ignoreOther: false }, SV: { ignoreOther: false } }
};

const unsubscribers = [];
let currentRegion = null;

function otherRegionOf(region) {
    return region === 'GT' ? 'SV' : 'GT';
}

function currentExecutionId() {
    const directKeys = ['intelfon_execution_id', 'ejecucion_id', 'execution_id', 'batch_id'];

    for (const storage of [sessionStorage, localStorage]) {
        for (const key of directKeys) {
            try {
                const value = storage.getItem(key);
                if (value) return String(value).trim();
            } catch (_) {}
        }
    }

    try {
        const raw = localStorage.getItem('intelfon_current_report');
        if (raw) {
            const report = JSON.parse(raw);
            const id =
                report?.ejecucion_id ||
                report?.execution_id ||
                report?.batch_id ||
                report?.meta?.ejecucion_id ||
                report?.meta?.execution_id;
            if (id) return String(id).trim();
        }
    } catch (_) {}

    return '';
}

function normalizeDocumentStatus(value) {
    const doc = value && typeof value === 'object' ? value : { uploaded: false };
    const executionId = currentExecutionId();
    const docExecution = String(
        doc.executionId ||
        doc.ejecucion_id ||
        doc.execution_id ||
        doc.batch_id ||
        ''
    ).trim();

    // Regla antiencajamiento:
    // un "uploaded:true" de una ejecución pasada NO vale para la ejecución actual.
    if (!executionId) {
        return { ...doc, uploaded: false, stale: !!doc.uploaded, reason: 'no-current-execution' };
    }

    if (!docExecution || docExecution !== executionId) {
        return { ...doc, uploaded: false, stale: !!doc.uploaded, reason: 'different-execution' };
    }

    return { ...doc, uploaded: !!doc.uploaded, stale: false };
}

export const SyncService = {
    initSync(region, user) {
        if (region !== 'GT' && region !== 'SV') return;

        // Evita listeners duplicados al reentrar al dashboard.
        this.teardownSync(false);
        currentRegion = region;

        const presencePath = `${ROOT}/presence/${region}`;
        const markOnline = () => {
            FirebaseService.onDisconnectSet(presencePath, {
                online: false,
                user: user?.username || region,
                lastChange: Date.now()
            });
            FirebaseService.set(presencePath, {
                online: true,
                user: user?.username || region,
                lastChange: Date.now()
            });
        };

        markOnline();

        const unConn = FirebaseService.isConnectedRef((isConnected) => {
            if (isConnected) markOnline();
        });
        unsubscribers.push(unConn);

        // Se conserva la sincronización interna de ambas regiones porque canProceed()
        // puede depender del país contrario. La UI ya NO expone esa otra región.
        ['GT', 'SV'].forEach((code) => {
            const unP = FirebaseService.onValue(`${ROOT}/presence/${code}`, (val) => {
                cache.presence[code] = val || { online: false };
                document.dispatchEvent(new CustomEvent('intelfon-sync-presence', {
                    detail: { region: code, value: cache.presence[code] }
                }));
            });

            const unD = FirebaseService.onValue(`${ROOT}/documents/${code}`, (val) => {
                cache.documents[code] = val || { uploaded: false };
                document.dispatchEvent(new CustomEvent('intelfon-sync-document', {
                    detail: { region: code, value: normalizeDocumentStatus(cache.documents[code]) }
                }));
            });

            const unO = FirebaseService.onValue(`${ROOT}/overrides/${code}`, (val) => {
                cache.overrides[code] = val || { ignoreOther: false };
                document.dispatchEvent(new CustomEvent('intelfon-sync-override', {
                    detail: { region: code, value: cache.overrides[code] }
                }));
            });

            unsubscribers.push(unP, unD, unO);
        });
    },

    teardownSync(markOffline = true) {
        if (markOffline && currentRegion) {
            FirebaseService.set(`${ROOT}/presence/${currentRegion}`, {
                online: false,
                lastChange: Date.now()
            });
        }

        unsubscribers.forEach(unsub => {
            try { unsub(); } catch (_) {}
        });
        unsubscribers.length = 0;

        if (markOffline) currentRegion = null;
    },

    getCurrentRegion() {
        return currentRegion;
    },

    getCurrentExecutionId() {
        return currentExecutionId();
    },

    getOtherRegion(region) {
        return otherRegionOf(region);
    },

    getPresence(region) {
        return cache.presence[region] || { online: false };
    },

    getDocumentStatus(region) {
        return normalizeDocumentStatus(cache.documents[region] || { uploaded: false });
    },

    getOverride(region) {
        return cache.overrides[region] || { ignoreOther: false };
    },

    async refreshNow(region = null) {
        const codes = region === 'GT' || region === 'SV' ? [region] : ['GT', 'SV'];

        await Promise.all(codes.flatMap(code => [
            FirebaseService.getOnce(`${ROOT}/presence/${code}`).then((val) => {
                cache.presence[code] = val || { online: false };
                document.dispatchEvent(new CustomEvent('intelfon-sync-presence', {
                    detail: { region: code, value: cache.presence[code] }
                }));
            }),
            FirebaseService.getOnce(`${ROOT}/documents/${code}`).then((val) => {
                cache.documents[code] = val || { uploaded: false };
                document.dispatchEvent(new CustomEvent('intelfon-sync-document', {
                    detail: { region: code, value: normalizeDocumentStatus(cache.documents[code]) }
                }));
            }),
            FirebaseService.getOnce(`${ROOT}/overrides/${code}`).then((val) => {
                cache.overrides[code] = val || { ignoreOther: false };
                document.dispatchEvent(new CustomEvent('intelfon-sync-override', {
                    detail: { region: code, value: cache.overrides[code] }
                }));
            })
        ]));
    },

    async beginExecution(region, executionId) {
        if (region !== 'GT' && region !== 'SV') return false;
        const id = String(executionId || '').trim();
        if (!id) return false;

        sessionStorage.setItem('intelfon_execution_id', id);
        sessionStorage.setItem('ejecucion_id', id);

        const payload = {
            uploaded: false,
            fileName: null,
            count: 0,
            executionId: id,
            ejecucion_id: id,
            updatedAt: Date.now()
        };

        cache.documents[region] = payload;
        document.dispatchEvent(new CustomEvent('intelfon-sync-document', {
            detail: { region, value: payload }
        }));

        return FirebaseService.set(`${ROOT}/documents/${region}`, payload);
    },

    async setDocumentStatus(region, payload) {
        if (region !== 'GT' && region !== 'SV') return false;

        const executionId = String(
            payload?.executionId ||
            payload?.ejecucion_id ||
            payload?.execution_id ||
            payload?.batch_id ||
            currentExecutionId() ||
            ''
        ).trim();

        const value = {
            uploaded: !!payload?.uploaded && !!executionId,
            fileName: payload?.fileName || null,
            count: payload?.count ?? (payload?.uploaded ? 1 : 0),
            executionId: executionId || null,
            ejecucion_id: executionId || null,
            updatedAt: Date.now()
        };

        cache.documents[region] = value;
        document.dispatchEvent(new CustomEvent('intelfon-sync-document', {
            detail: { region, value: normalizeDocumentStatus(value) }
        }));

        return FirebaseService.set(`${ROOT}/documents/${region}`, value);
    },

    async setOverride(region, ignoreOther) {
        return FirebaseService.set(`${ROOT}/overrides/${region}`, {
            ignoreOther: !!ignoreOther,
            updatedAt: Date.now()
        });
    },

    canProceed(region) {
        const other = otherRegionOf(region);
        const override = this.getOverride(region);

        if (override.ignoreOther) return { allowed: true };

        const otherPresence = this.getPresence(other);
        const otherDocs = this.getDocumentStatus(other);

        if (!otherPresence.online) {
            return { allowed: false, reason: 'offline', otherRegion: other };
        }
        if (!otherDocs.uploaded) {
            return { allowed: false, reason: 'no-document', otherRegion: other };
        }

        return { allowed: true };
    }
};
