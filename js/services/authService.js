import { CONFIG } from '../config.js';

/**
 * Servicio de Autenticación para el Dashboard de RED INTELFON
 * Gestiona el inicio de sesión, persistencia (localStorage / sessionStorage) y validación de usuarios.
 */
export const AuthService = {
    /**
     * Valida las credenciales e inicia sesión.
     * @param {string} userOrEmail - Correo o nombre de usuario
     * @param {string} password - Contraseña
     * @param {boolean} remember - Si es true, persiste en localStorage; si no, en sessionStorage
     * @returns {Promise<{success: boolean, message?: string, user?: Object}>}
     */
    async login(userOrEmail, password, remember = false) {
        const cleanUser = String(userOrEmail || '').trim().toLowerCase();
        const cleanPass = String(password || '').trim();

        const expectedEmail = String(CONFIG.AUTH.defaultUser).toLowerCase();
        const expectedUsername = String(CONFIG.AUTH.defaultUsername).toLowerCase();
        const expectedPassword = String(CONFIG.AUTH.defaultPassword);

        // Validar credenciales maestras (permite entrar con correo o con username 'admin')
        const isValidUser = (cleanUser === expectedEmail || cleanUser === expectedUsername);
        const isValidPass = (cleanPass === expectedPassword);

        if (!isValidUser || !isValidPass) {
            return {
                success: false,
                message: 'Usuario o contraseña incorrectos. Verifica tus credenciales.'
            };
        }

        const userData = {
            name: 'Administrador INTELFON',
            email: expectedEmail,
            role: 'Super Admin',
            avatar: 'assets/logo-intelfon.png',
            loginTime: new Date().toISOString()
        };

        const sessionPayload = JSON.stringify(userData);

        if (remember) {
            localStorage.setItem(CONFIG.AUTH.sessionKey, sessionPayload);
            sessionStorage.removeItem(CONFIG.AUTH.sessionKey);
        } else {
            sessionStorage.setItem(CONFIG.AUTH.sessionKey, sessionPayload);
            localStorage.removeItem(CONFIG.AUTH.sessionKey);
        }

        return {
            success: true,
            user: userData
        };
    },

    /**
     * Cierra la sesión activa y elimina las claves almacenadas.
     */
    logout() {
        localStorage.removeItem(CONFIG.AUTH.sessionKey);
        sessionStorage.removeItem(CONFIG.AUTH.sessionKey);
    },

    /**
     * Verifica si existe una sesión activa y válida.
     * @returns {boolean}
     */
    isAuthenticated() {
        const session = localStorage.getItem(CONFIG.AUTH.sessionKey) || sessionStorage.getItem(CONFIG.AUTH.sessionKey);
        if (!session) return false;
        try {
            const parsed = JSON.parse(session);
            return !!(parsed && parsed.email);
        } catch (_) {
            return false;
        }
    },

    /**
     * Retorna los datos del usuario autenticado actualmente.
     * @returns {Object|null}
     */
    getUser() {
        const session = localStorage.getItem(CONFIG.AUTH.sessionKey) || sessionStorage.getItem(CONFIG.AUTH.sessionKey);
        if (!session) return null;
        try {
            return JSON.parse(session);
        } catch (_) {
            return null;
        }
    }
};
