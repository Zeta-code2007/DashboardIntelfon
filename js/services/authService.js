import { CONFIG } from '../config.js';

const USERS_DB_KEY = 'intelfon_registered_users_db';

function normalizeUsername(value) {
    return String(value || '').toLowerCase().trim();
}

function fixedRegionByUsername(value) {
    const username = normalizeUsername(value);
    if (username === 'masterguatemala') return 'GT';
    if (username === 'mastersalvador' || username === 'masterelsalvador') return 'SV';
    return null;
}

function persistSession(user) {
    const payload = JSON.stringify(user);
    if (localStorage.getItem(CONFIG.AUTH.sessionKey)) {
        localStorage.setItem(CONFIG.AUTH.sessionKey, payload);
    } else if (sessionStorage.getItem(CONFIG.AUTH.sessionKey)) {
        sessionStorage.setItem(CONFIG.AUTH.sessionKey, payload);
    }
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

        const masterUsername = normalizeUsername(CONFIG.AUTH.masterUsername || 'intelfon');
        const masterEmail = String(CONFIG.AUTH.masterEmail || 'admin@intelfon.com').toLowerCase();
        const masterPass = String(CONFIG.AUTH.defaultPassword || 'intelfon2026');

        const masterIndex = users.findIndex(u =>
            normalizeUsername(u.username) === masterUsername ||
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
            users[masterIndex].region = null;
        }

        const regionalMasters = Array.isArray(CONFIG.AUTH.masters) ? CONFIG.AUTH.masters : [];
        regionalMasters.forEach((masterDef, idx) => {
            const uname = normalizeUsername(masterDef.username);
            if (!uname) return;

            const email = String(masterDef.email || `${uname}@intelfon.com`).toLowerCase();
            const forcedRegion = fixedRegionByUsername(uname);
            const region = forcedRegion || ((masterDef.region === 'GT' || masterDef.region === 'SV') ? masterDef.region : null);

            const existingIndex = users.findIndex(u =>
                normalizeUsername(u.username) === uname ||
                String(u.email || '').toLowerCase() === email
            );

            if (existingIndex === -1) {
                users.push({
                    id: `USR-MASTER-${region || idx}`,
                    name: masterDef.name || (region === 'SV' ? 'Master El Salvador' : 'Master Guatemala'),
                    username: uname,
                    email,
                    password: String(masterDef.password || ''),
                    role: 'Super Admin',
                    isMaster: true,
                    region,
                    createdAt: new Date().toISOString()
                });
            } else {
                users[existingIndex].role = 'Super Admin';
                users[existingIndex].isMaster = true;
                users[existingIndex].username = uname;
                users[existingIndex].region = region;
                if (masterDef.name) users[existingIndex].name = masterDef.name;
            }
        });

        // También repara usuarios regionales antiguos almacenados antes de esta corrección.
        users.forEach(user => {
            const forcedRegion = fixedRegionByUsername(user.username);
            if (forcedRegion) {
                user.region = forcedRegion;
                user.isMaster = true;
                user.role = 'Super Admin';
            }
        });

        localStorage.setItem(USERS_DB_KEY, JSON.stringify(users));
        return users;
    },

    _saveUsersDB(users) {
        localStorage.setItem(USERS_DB_KEY, JSON.stringify(users));
    },

    getFixedRegion(user = null) {
        const current = user || this.getUser();
        return current ? fixedRegionByUsername(current.username) : null;
    },

    isRegionalMaster(user = null) {
        return !!this.getFixedRegion(user);
    },

    isGlobalMaster(user = null) {
        const current = user || this.getUser();
        if (!current) return false;
        const username = normalizeUsername(current.username);
        const email = String(current.email || '').toLowerCase().trim();
        return username === normalizeUsername(CONFIG.AUTH.masterUsername || 'intelfon') ||
               username === 'intelfon' ||
               email === String(CONFIG.AUTH.masterEmail || 'admin@intelfon.com').toLowerCase();
    },

    isMasterAdmin(user = null) {
        const current = user || this.getUser();
        if (!current) return false;

        const uName = normalizeUsername(current.username);
        const uEmail = String(current.email || '').toLowerCase().trim();
        const uRole = String(current.role || '').toLowerCase().trim();

        return uName === 'intelfon' ||
               uName === 'masterguatemala' ||
               uName === 'mastersalvador' ||
               uName === 'masterelsalvador' ||
               uEmail === 'admin@intelfon.com' ||
               uRole === 'super admin' ||
               !!current.isMaster;
    },

    async register(name, email, password, role = 'Analista', region = null) {
        const cleanName = String(name || '').trim();
        const cleanEmail = String(email || '').trim().toLowerCase();
        const cleanPass = String(password || '').trim();
        const cleanRegion = (region === 'GT' || region === 'SV') ? region : null;

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
        const existing = users.find(u =>
            String(u.email || '').toLowerCase() === cleanEmail ||
            normalizeUsername(u.username) === cleanEmail
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
            const uUsername = normalizeUsername(u.username);
            const uName = String(u.name || '').toLowerCase().trim();
            const uPass = String(u.password || '').trim();
            return (uEmail === cleanUser || uUsername === cleanUser || uName === cleanUser) && uPass === cleanPass;
        });

        if (!matchedUser) {
            return { success: false, message: 'Credenciales inválidas. Verifica tu usuario y contraseña.' };
        }

        const forcedRegion = fixedRegionByUsername(matchedUser.username);
        const isMaster = this.isMasterAdmin(matchedUser);

        const userData = {
            id: matchedUser.id,
            name: matchedUser.name,
            email: matchedUser.email,
            username: matchedUser.username,
            role: matchedUser.role || 'Analista',
            isMaster,
            region: forcedRegion || matchedUser.region || null,
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
        const session = localStorage.getItem(CONFIG.AUTH.sessionKey) || sessionStorage.getItem(CONFIG.AUTH.sessionKey);
        if (!session) return null;

        try {
            const user = JSON.parse(session);
            if (!user) return null;

            // Reparación automática de sesiones antiguas:
            // masterguatemala nunca puede quedar en SV y mastersalvador nunca en GT.
            const forcedRegion = fixedRegionByUsername(user.username);
            if (forcedRegion && user.region !== forcedRegion) {
                user.region = forcedRegion;
                user.isMaster = true;
                user.role = 'Super Admin';
                persistSession(user);
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
            persistSession(current);
        }
        return true;
    },

    deleteUser(emailOrId) {
        let users = this._getUsersDB();
        const target = users.find(u => u.email === emailOrId || u.id === emailOrId || u.username === emailOrId);

        if (!target) return false;
        if (this.isMasterAdmin(target)) {
            console.warn('[AuthService] No se puede eliminar a un usuario Master.');
            return false;
        }

        users = users.filter(u => u.id !== target.id && u.email !== target.email);
        this._saveUsersDB(users);
        return true;
    }
};
