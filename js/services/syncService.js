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

export const SyncService = {
    /**
     * Inicializa la sincronización en tiempo real para la región del usuario autenticado.
     * Marca presencia "en línea", registra desconexión automática y suscribe todo
     * el estado compartido (presencia, documentos y overrides de ambas regiones).
     * @param {'GT'|'SV'} region
     * @param {Object} user
     */
    initSync(region, user) {
        if (region !== 'GT' && region !== 'SV') return;
        currentRegion = region;

        const presencePath = `${ROOT}/presence/${region}`;
        const markOnline = () => {
            // Se registra primero el "onDisconnect" y luego el estado "online" (orden recomendado
            // por Firebase) para evitar que una desconexión temprana quede sin marcar.
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

        // Si se recupera la conexión con Firebase, vuelve a marcarse "en línea"
        const unConn = FirebaseService.isConnectedRef((isConnected) => {
            if (isConnected) markOnline();
        });
        unsubscribers.push(unConn);

        // Suscripciones en vivo para ambas regiones
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

    /**
     * Detiene todas las suscripciones activas y marca la región actual como desconectada.
     * Llamar al cerrar sesión.
     */
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

    /**
     * Actualiza el estado de "documento subido" para una región (GT o SV).
     * @param {'GT'|'SV'} region
     * @param {{uploaded: boolean, fileName?: string, count?: number}} payload
     */
    async setDocumentStatus(region, payload) {
        return FirebaseService.set(`${ROOT}/documents/${region}`, {
            uploaded: !!payload.uploaded,
            fileName: payload.fileName || null,
            count: payload.count ?? (payload.uploaded ? 1 : 0),
            updatedAt: Date.now()
        });
    },

    /**
     * Activa/desactiva el switch "Ignorar [país contrario]" para una región.
     * @param {'GT'|'SV'} region
     * @param {boolean} ignoreOther
     */
    async setOverride(region, ignoreOther) {
        return FirebaseService.set(`${ROOT}/overrides/${region}`, {
            ignoreOther: !!ignoreOther,
            updatedAt: Date.now()
        });
    },

    /**
     * Verifica si la región puede proceder a procesar el reporte, considerando
     * la conexión y el documento del país contrario, salvo que "Ignorar" esté activo.
     * @param {'GT'|'SV'} region
     */
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
