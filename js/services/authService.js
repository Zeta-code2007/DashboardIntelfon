import { CONFIG } from '../config.js';

const USERS_DB_KEY = 'intelfon_registered_users_db';

/**
 * Base de Datos y Servicio de Autenticación de RED INTELFON
 * Almacena y administra usuarios registrados con control RBAC y persistencia permanente en localStorage.
 */
export const AuthService = {
    /**
     * Inicializa la base de datos de usuarios con el usuario Master "intelfon" si está vacía.
     */
    _getUsersDB() {
        const stored = localStorage.getItem(USERS_DB_KEY);
        let users = [];
        if (stored) {
            try {
                const parsed = JSON.parse(stored);
                if (Array.isArray(parsed) && parsed.length > 0) {
                    users = parsed;
                }
            } catch (_) {}
        }

        // Asegurar que el Usuario Master "intelfon" siempre exista como único Master
        const masterUsername = String(CONFIG.AUTH.masterUsername || 'intelfon').toLowerCase();
        const masterEmail = String(CONFIG.AUTH.masterEmail || 'admin@intelfon.com').toLowerCase();
        const masterPass = String(CONFIG.AUTH.defaultPassword || 'intelfon2026');

        const masterIndex = users.findIndex(u => 
            String(u.username || '').toLowerCase() === masterUsername || 
            String(u.email || '').toLowerCase() === masterEmail
        );

        if (masterIndex === -1) {
            // Insertar Master al inicio
            users.unshift({
                id: 'USR-MASTER',
                name: 'Master INTELFON',
                username: masterUsername,
                email: masterEmail,
                password: masterPass,
                role: 'Super Admin',
                isMaster: true,
                createdAt: new Date().toISOString()
            });
            localStorage.setItem(USERS_DB_KEY, JSON.stringify(users));
        } else {
            // Asegurar que mantenga atributos de Master
            users[masterIndex].role = 'Super Admin';
            users[masterIndex].isMaster = true;
            users[masterIndex].username = masterUsername;
            localStorage.setItem(USERS_DB_KEY, JSON.stringify(users));
        }

        return users;
    },

    /**
     * Guarda la base de datos completa de usuarios.
     * @param {Array} users 
     */
    _saveUsersDB(users) {
        localStorage.setItem(USERS_DB_KEY, JSON.stringify(users));
    },

    /**
     * Verifica si un usuario es el Master Admin "intelfon".
     * @param {Object} user 
     * @returns {boolean}
     */
    isMasterAdmin(user = null) {
        const current = user || this.getUser();
        if (!current) return false;
        const uName = String(current.username || '').toLowerCase().trim();
        const uEmail = String(current.email || '').toLowerCase().trim();
        const uRole = String(current.role || '').toLowerCase().trim();

        return uName === 'intelfon' || 
               uEmail === 'admin@intelfon.com' || 
               uRole === 'super admin' || 
               !!current.isMaster;
    },

    /**
     * Registra un nuevo usuario en la base de datos local (solo analista/usuario regular).
     * @param {string} name - Nombre completo
     * @param {string} email - Correo electrónico
     * @param {string} password - Contraseña
     * @param {string} role - Rol opcional (por defecto 'Analista')
     * @returns {Promise<{success: boolean, message?: string, user?: Object}>}
     */
    async register(name, email, password, role = 'Analista') {
        const cleanName = String(name || '').trim();
        const cleanEmail = String(email || '').trim().toLowerCase();
        const cleanPass = String(password || '').trim();

        if (!cleanName || cleanName.length < 2) {
            return { success: false, message: 'Por favor ingresa un nombre válido.' };
        }
        if (!cleanEmail || (!cleanEmail.includes('@') && cleanEmail.length < 3)) {
            return { success: false, message: 'Por favor ingresa un correo o usuario válido.' };
        }
        if (!cleanPass || cleanPass.length < 4) {
            return { success: false, message: 'La contraseña debe tener al menos 4 caracteres.' };
        }

        const users = this._getUsersDB();

        // Verificar si el usuario o username ya existe
        const existing = users.find(u => 
            String(u.email || '').toLowerCase() === cleanEmail || 
            String(u.username || '').toLowerCase() === cleanEmail
        );

        if (existing) {
            return { success: false, message: 'Este correo o nombre de usuario ya está registrado.' };
        }

        const newUser = {
            id: `USR-${Date.now().toString().slice(-4)}`,
            name: cleanName,
            email: cleanEmail.includes('@') ? cleanEmail : `${cleanEmail}@intelfon.com`,
            username: cleanEmail.split('@')[0],
            password: cleanPass,
            role: role === 'Super Admin' ? 'Analista' : role, // Solo 'intelfon' es Super Admin
            isMaster: false,
            createdAt: new Date().toISOString()
        };

        users.push(newUser);
        this._saveUsersDB(users);

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

        // Buscar coincidencia flexible: por username, email o nombre
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
            return {
                success: false,
                message: 'Credenciales inválidas. Verifica tu usuario y contraseña.'
            };
        }

        const isMaster = this.isMasterAdmin(matchedUser);

        const userData = {
            id: matchedUser.id,
            name: matchedUser.name,
            email: matchedUser.email,
            username: matchedUser.username,
            role: matchedUser.role || 'Analista',
            isMaster: isMaster,
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
    },

    /**
     * Elimina un usuario por correo o id (protege al Master Admin).
     * @param {string} emailOrId 
     * @returns {boolean}
     */
    deleteUser(emailOrId) {
        let users = this._getUsersDB();
        const target = users.find(u => u.email === emailOrId || u.id === emailOrId || u.username === emailOrId);
        
        if (!target) return false;
        if (this.isMasterAdmin(target)) {
            console.warn('[AuthService] No se puede eliminar al usuario Master Admin.');
            return false;
        }

        users = users.filter(u => u.id !== target.id && u.email !== target.email);
        this._saveUsersDB(users);
        return true;
    }
};
