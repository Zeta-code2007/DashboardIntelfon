import { CONFIG } from '../config.js';

const USERS_DB_KEY = 'intelfon_registered_users_db';

/**
 * Base de Datos y Servicio de Autenticación de RED INTELFON
 * Almacena y administra usuarios registrados con persistencia en localStorage.
 */
export const AuthService = {
    /**
     * Inicializa la base de datos de usuarios con el usuario Administrador por defecto si está vacía.
     */
    _getUsersDB() {
        const stored = localStorage.getItem(USERS_DB_KEY);
        if (stored) {
            try {
                const parsed = JSON.parse(stored);
                if (Array.isArray(parsed) && parsed.length > 0) {
                    return parsed;
                }
            } catch (_) {}
        }

        // Usuario inicial por defecto
        const defaultUsers = [
            {
                id: 'USR-001',
                name: 'Administrador INTELFON',
                email: String(CONFIG.AUTH.defaultUser).toLowerCase(),
                username: String(CONFIG.AUTH.defaultUsername).toLowerCase(),
                password: String(CONFIG.AUTH.defaultPassword),
                role: 'Super Admin',
                createdAt: new Date().toISOString()
            }
        ];
        localStorage.setItem(USERS_DB_KEY, JSON.stringify(defaultUsers));
        return defaultUsers;
    },

    /**
     * Registra un nuevo usuario en la base de datos local.
     * @param {string} name - Nombre completo
     * @param {string} email - Correo electrónico
     * @param {string} password - Contraseña
     * @returns {Promise<{success: boolean, message?: string, user?: Object}>}
     */
    async register(name, email, password) {
        const cleanName = String(name || '').trim();
        const cleanEmail = String(email || '').trim().toLowerCase();
        const cleanPass = String(password || '').trim();

        if (!cleanName || cleanName.length < 2) {
            return { success: false, message: 'Por favor ingresa tu nombre completo.' };
        }
        if (!cleanEmail || !cleanEmail.includes('@') && cleanEmail.length < 3) {
            return { success: false, message: 'Por favor ingresa un correo o usuario válido.' };
        }
        if (!cleanPass || cleanPass.length < 4) {
            return { success: false, message: 'La contraseña debe tener al menos 4 caracteres.' };
        }

        const users = this._getUsersDB();

        // Verificar si el usuario ya existe
        const existing = users.find(u => 
            u.email.toLowerCase() === cleanEmail || 
            (u.username && u.username.toLowerCase() === cleanEmail)
        );

        if (existing) {
            return { success: false, message: 'Este correo o usuario ya se encuentra registrado.' };
        }

        const newUser = {
            id: `USR-${Date.now().toString().slice(-4)}`,
            name: cleanName,
            email: cleanEmail,
            username: cleanEmail.split('@')[0],
            password: cleanPass,
            role: 'Analista',
            createdAt: new Date().toISOString()
        };

        users.push(newUser);
        localStorage.setItem(USERS_DB_KEY, JSON.stringify(users));

        // Iniciar sesión automáticamente tras el registro
        const sessionPayload = JSON.stringify({
            name: newUser.name,
            email: newUser.email,
            role: newUser.role,
            avatar: 'assets/logo-intelfon.png',
            loginTime: new Date().toISOString()
        });
        localStorage.setItem(CONFIG.AUTH.sessionKey, sessionPayload);

        return {
            success: true,
            user: newUser
        };
    },

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

        const users = this._getUsersDB();
        console.log('[AuthService] Intentando login con:', cleanUser, '| Usuarios en DB:', users);

        // Buscar coincidencia flexible: por email, por username o por nombre
        const matchedUser = users.find(u => {
            const uEmail = String(u.email || '').toLowerCase().trim();
            const uUsername = String(u.username || '').toLowerCase().trim();
            const uName = String(u.name || '').toLowerCase().trim();
            const uPass = String(u.password || '').trim();

            const isUserMatch = (uEmail === cleanUser || uUsername === cleanUser || uName === cleanUser);
            const isPassMatch = (uPass === cleanPass);

            return isUserMatch && isPassMatch;
        });

        if (!matchedUser) {
            console.warn('[AuthService] No se encontró coincidencia para:', cleanUser);
            return {
                success: false,
                message: 'Usuario o contraseña incorrectos. Verifica tus datos o crea una cuenta.'
            };
        }

        const userData = {
            name: matchedUser.name,
            email: matchedUser.email,
            role: matchedUser.role || 'Usuario',
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
     * Cierra la sesión activa.
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
    },

    /**
     * Obtiene la lista completa de usuarios registrados.
     * @returns {Array}
     */
    getAllUsers() {
        return this._getUsersDB();
    }
};
