import { CONFIG } from '../config.js';

let firebaseApp = null;
let db = null;

/**
 * Inicializa el SDK de Firebase (compat) de forma perezosa, una sola vez.
 * Requiere que index.html haya cargado firebase-app-compat.js y
 * firebase-database-compat.js ANTES de este módulo.
 */
function ensureInit() {
    if (db) return db;

    if (typeof firebase === 'undefined') {
        console.error('[FirebaseService] El SDK de Firebase no está cargado. Verifica los <script> en index.html.');
        return null;
    }

    try {
        firebaseApp = firebase.apps.length ? firebase.app() : firebase.initializeApp(CONFIG.FIREBASE);
        db = firebase.database();
    } catch (err) {
        console.error('[FirebaseService] Error al inicializar Firebase:', err);
        db = null;
    }

    return db;
}

export const FirebaseService = {
    getDb() {
        return ensureInit();
    },

    ref(path) {
        const database = ensureInit();
        if (!database) return null;
        return database.ref(path);
    },

    async set(path, value) {
        const r = this.ref(path);
        if (!r) return false;
        try {
            await r.set(value);
            return true;
        } catch (err) {
            console.error(`[FirebaseService] Error al escribir en "${path}":`, err);
            return false;
        }
    },

    onValue(path, callback) {
        const r = this.ref(path);
        if (!r) return () => {};
        const handler = (snapshot) => callback(snapshot.val());
        r.on('value', handler);
        return () => r.off('value', handler);
    },

    /**
     * Lee el valor actual UNA sola vez, directo del servidor (no depende de que el
     * listener en vivo esté al día). Útil para forzar un refresco manual.
     */
    async getOnce(path) {
        const r = this.ref(path);
        if (!r) return null;
        try {
            const snap = await r.once('value');
            return snap.val();
        } catch (err) {
            console.error(`[FirebaseService] Error al leer "${path}":`, err);
            return null;
        }
    },

    onDisconnectSet(path, value) {
        const r = this.ref(path);
        if (!r) return;
        r.onDisconnect().set(value);
    },

    /**
     * Suscribe a los cambios del estado de conexión con Firebase (.info/connected).
     * Útil para re-marcar presencia "en línea" tras reconectar.
     */
    isConnectedRef(callback) {
        const database = ensureInit();
        if (!database) return () => {};
        const connectedRef = database.ref('.info/connected');
        const handler = (snap) => callback(!!snap.val());
        connectedRef.on('value', handler);
        return () => connectedRef.off('value', handler);
    }
};
