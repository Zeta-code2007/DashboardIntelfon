import { CONFIG } from '../config.js';

const USERS_DB_KEY = 'intelfon_registered_users_db';

function forcedRegion(username) {
    const value = String(username || '').toLowerCase().trim();
    if (value === 'masterguatemala') return 'GT';
    if (value === 'mastersalvador' || value === 'masterelsalvador') return 'SV';
    return null;
}

export const AuthService = {
    _getUsersDB() {
        const stored = localStorage.getItem(USERS_DB_KEY);
        let users = [];
        if (stored) {
            try {
                const parsed = JSON.parse(stored);
                if (Array.isArray(parsed) && parsed.length > 0) users = parsed;
            } catch (_) {}
        }

        const masterUsername = String(CONFIG.AUTH.masterUsername || 'intelfon').toLowerCase();
        const masterEmail = String(CONFIG.AUTH.masterEmail || 'admin@intelfon.com').toLowerCase();
        const masterPass = String(CONFIG.AUTH.defaultPassword || 'intelfon2026');

        const masterIndex = users.findIndex(u =>
            String(u.username || '').toLowerCase() === masterUsername ||
            String(u.email || '').toLowerCase() === masterEmail
        );

        if (masterIndex === -1) {
            users.unshift({
                id: 'USR-MASTER',
                name: 'Master INTELFON',
                username: masterUsername,
                email: masterEmail,
                password: masterPass,
                role: 'Super Admin',
                isMaster: true,
                region: null,
                createdAt: new Date().toISOString()
            });
        } else {
            users[masterIndex].role = 'Super Admin';
            users[masterIndex].isMaster = true;
            users[masterIndex].username = masterUsername;
        }

        const regionalMasters = Array.isArray(CONFIG.AUTH.masters) ? CONFIG.AUTH.masters : [];
        regionalMasters.forEach((masterDef, idx) => {
            const uname = String(masterDef.username || '').toLowerCase();
            if (!uname) return;
            const email = String(masterDef.email || `${uname}@intelfon.com`).toLowerCase();
            const fixed = forcedRegion(uname);

            const existingIndex = users.findIndex(u =>
                String(u.username || '').toLowerCase() === uname ||
                String(u.email || '').toLowerCase() === email
            );

            if (existingIndex === -1) {
                users.push({
                    id: `USR-MASTER-${fixed || masterDef.region || idx}`,
                    name: masterDef.name || `Master ${fixed === 'SV' ? 'El Salvador' : 'Guatemala'}`,
                    username: uname,
                    email,
                    password: String(masterDef.password || ''),
                    role: 'Super Admin',
                    isMaster: true,
                    region: fixed || masterDef.region || null,
                    createdAt: new Date().toISOString()
                });
            } else {
                users[existingIndex].role = 'Super Admin';
                users[existingIndex].isMaster = true;
                users[existingIndex].region = fixed || masterDef.region || users[existingIndex].region || null;
                if (masterDef.name) users[existingIndex].name = users[existingIndex].name || masterDef.name;
            }
        });

        // Reparar registros antiguos de masters regionales.
        users.forEach(u => {
            const fixed = forcedRegion(u.username);
            if (fixed) u.region = fixed;
        });

        localStorage.setItem(USERS_DB_KEY, JSON.stringify(users));
        return users;
    },

    _saveUsersDB(users) {
        localStorage.setItem(USERS_DB_KEY, JSON.stringify(users));
    },

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

    async register(name, email, password, role = 'Analista', region = null) {
        const cleanName = String(name || '').trim();
        const cleanEmail = String(email || '').trim().toLowerCase();
        const cleanPass = String(password || '').trim();
        const cleanRegion = (region === 'GT' || region === 'SV') ? region : null;

        if (!cleanName || cleanName.length < 2) return { success: false, message: 'Por favor ingresa un nombre válido.' };
        if (!cleanEmail || (!cleanEmail.includes('@') && cleanEmail.length < 3)) return { success: false, message: 'Por favor ingresa un correo o usuario válido.' };
        if (!cleanPass || cleanPass.length < 4) return { success: false, message: 'La contraseña debe tener al menos 4 caracteres.' };

        const users = this._getUsersDB();
        const existing = users.find(u =>
            String(u.email || '').toLowerCase() === cleanEmail ||
            String(u.username || '').toLowerCase() === cleanEmail
        );
        if (existing) return { success: false, message: 'Este correo o nombre de usuario ya está registrado.' };

        const newUser = {
            id: `USR-${Date.now().toString().slice(-4)}`,
            name: cleanName,
            email: cleanEmail.includes('@') ? cleanEmail : `${cleanEmail}@intelfon.com`,
            username: cleanEmail.split('@')[0],
            password: cleanPass,
            role: role === 'Super Admin' ? 'Analista' : role,
            isMaster: false,
            region: cleanRegion,
            createdAt: new Date().toISOString()
        };

        users.push(newUser);
        this._saveUsersDB(users);
        return { success: true, user: newUser };
    },

    async login(userOrEmail, password, remember = false) {
        const cleanUser = String(userOrEmail || '').trim().toLowerCase();
        const cleanPass = String(password || '').trim();

        const users = this._getUsersDB();
        const matchedUser = users.find(u => {
            const uEmail = String(u.email || '').toLowerCase().trim();
            const uUsername = String(u.username || '').toLowerCase().trim();
            const uName = String(u.name || '').toLowerCase().trim();
            const uPass = String(u.password || '').trim();
            return (uEmail === cleanUser || uUsername === cleanUser || uName === cleanUser) && uPass === cleanPass;
        });

        if (!matchedUser) return { success: false, message: 'Credenciales inválidas. Verifica tu usuario y contraseña.' };

        const isMaster = this.isMasterAdmin(matchedUser);
        const fixed = forcedRegion(matchedUser.username);

        const userData = {
            id: matchedUser.id,
            name: matchedUser.name,
            email: matchedUser.email,
            username: matchedUser.username,
            role: matchedUser.role || 'Analista',
            isMaster: isMaster,
            region: fixed || matchedUser.region || null,
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

        return { success: true, user: userData };
    },

    logout() {
        localStorage.removeItem(CONFIG.AUTH.sessionKey);
        sessionStorage.removeItem(CONFIG.AUTH.sessionKey);
    },

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

    getUser() {
        const storage = localStorage.getItem(CONFIG.AUTH.sessionKey)
            ? localStorage
            : sessionStorage;
        const session = storage.getItem(CONFIG.AUTH.sessionKey);
        if (!session) return null;

        try {
            const user = JSON.parse(session);
            const fixed = forcedRegion(user?.username);
            if (fixed && user.region !== fixed) {
                user.region = fixed;
                storage.setItem(CONFIG.AUTH.sessionKey, JSON.stringify(user));
            }
            return user;
        } catch (_) {
            return null;
        }
    },

    getAllUsers() {
        return this._getUsersDB();
    },

    updateUserRegion(emailOrId, region) {
        if (region !== 'GT' && region !== 'SV') return false;
        const users = this._getUsersDB();
        const target = users.find(u => u.email === emailOrId || u.id === emailOrId || u.username === emailOrId);
        if (!target || this.isMasterAdmin(target)) return false;

        target.region = region;
        this._saveUsersDB(users);

        const current = this.getUser();
        if (current && (current.id === target.id || current.email === target.email)) {
            current.region = region;
            const payload = JSON.stringify(current);
            if (localStorage.getItem(CONFIG.AUTH.sessionKey)) localStorage.setItem(CONFIG.AUTH.sessionKey, payload);
            else sessionStorage.setItem(CONFIG.AUTH.sessionKey, payload);
        }
        return true;
    },

    deleteUser(emailOrId) {
        let users = this._getUsersDB();
        const target = users.find(u => u.email === emailOrId || u.id === emailOrId || u.username === emailOrId);
        if (!target) return false;
        if (this.isMasterAdmin(target)) return false;
        users = users.filter(u => u.id !== target.id && u.email !== target.email);
        this._saveUsersDB(users);
        return true;
    }
};
