import { FirebaseService } from './firebaseService.js';
import { CONFIG } from '../core/config.js';

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

export const SyncService = {
    initSync(region, user) {
        if (region !== 'GT' && region !== 'SV') return;
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

        ['GT', 'SV'].forEach((code) => {
            const unP = FirebaseService.onValue(`${ROOT}/presence/${code}`, (val) => {
                cache.presence[code] = val || { online: false };
                document.dispatchEvent(new CustomEvent('intelfon-sync-presence', { detail: { region: code, value: cache.presence[code] } }));
            });
            const unD = FirebaseService.onValue(`${ROOT}/documents/${code}`, (val) => {
                cache.documents[code] = val || { uploaded: false };
                document.dispatchEvent(new CustomEvent('intelfon-sync-document', { detail: { region: code, value: cache.documents[code] } }));
            });
            const unO = FirebaseService.onValue(`${ROOT}/overrides/${code}`, (val) => {
                cache.overrides[code] = val || { ignoreOther: false };
                document.dispatchEvent(new CustomEvent('intelfon-sync-override', { detail: { region: code, value: cache.overrides[code] } }));
            });
            unsubscribers.push(unP, unD, unO);
        });
    },

    teardownSync() {
        if (currentRegion) {
            FirebaseService.set(`${ROOT}/presence/${currentRegion}`, {
                online: false,
                lastChange: Date.now()
            });
        }
        unsubscribers.forEach((unsub) => { try { unsub(); } catch (_) {} });
        unsubscribers.length = 0;
        currentRegion = null;
    },

    getOtherRegion(region) {
        return otherRegionOf(region);
    },

    getPresence(region) {
        return cache.presence[region] || { online: false };
    },

    getDocumentStatus(region) {
        return cache.documents[region] || { uploaded: false };
    },

    getOverride(region) {
        return cache.overrides[region] || { ignoreOther: false };
    },

    async refreshNow() {
        await Promise.all(['GT', 'SV'].flatMap((code) => [
            FirebaseService.getOnce(`${ROOT}/presence/${code}`).then((val) => {
                cache.presence[code] = val || { online: false };
                document.dispatchEvent(new CustomEvent('intelfon-sync-presence', { detail: { region: code, value: cache.presence[code] } }));
            }),
            FirebaseService.getOnce(`${ROOT}/documents/${code}`).then((val) => {
                cache.documents[code] = val || { uploaded: false };
                document.dispatchEvent(new CustomEvent('intelfon-sync-document', { detail: { region: code, value: cache.documents[code] } }));
            }),
            FirebaseService.getOnce(`${ROOT}/overrides/${code}`).then((val) => {
                cache.overrides[code] = val || { ignoreOther: false };
                document.dispatchEvent(new CustomEvent('intelfon-sync-override', { detail: { region: code, value: cache.overrides[code] } }));
            })
        ]));
    },

    async setDocumentStatus(region, payload) {
        return FirebaseService.set(`${ROOT}/documents/${region}`, {
            uploaded: !!payload.uploaded,
            fileName: payload.fileName || null,
            count: payload.count ?? (payload.uploaded ? 1 : 0),
            updatedAt: Date.now()
        });
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
        if (override.ignoreOther) {
            return { allowed: true };
        }
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
