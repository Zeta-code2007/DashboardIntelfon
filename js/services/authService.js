import { CONFIG } from '../config.js';

const USERS_DB_KEY = 'intelfon_registered_users_db';

const MASTER_IDENTITIES = Object.freeze({
    intelfon: { id:'USR-MASTER', name:'Master INTELFON', region:null, global:true },
    masterguatemala: { id:'USR-MASTER-GT', name:'Master Guatemala', region:'GT', global:false },
    mastersalvador: { id:'USR-MASTER-SV', name:'Master El Salvador', region:'SV', global:false },
    masterelsalvador: { id:'USR-MASTER-SV-ALIAS', name:'Master El Salvador', region:'SV', global:false }
});

const cleanUsername = v => String(v || '').trim().toLowerCase();
const identityOf = v => MASTER_IDENTITIES[cleanUsername(v)] || null;

function uniqueRegionalEmail(username, configuredEmail) {
    const globalEmail = String(CONFIG.AUTH.masterEmail || 'admin@intelfon.com').trim().toLowerCase();
    const wanted = String(configuredEmail || '').trim().toLowerCase();
    return (!wanted || wanted === globalEmail) ? `${username}@intelfon.com` : wanted;
}

export const AuthService = {
    _getUsersDB() {
        let users = [];
        try {
            const parsed = JSON.parse(localStorage.getItem(USERS_DB_KEY) || '[]');
            if (Array.isArray(parsed)) users = parsed;
        } catch (_) {}

        const globalUsername = cleanUsername(CONFIG.AUTH.masterUsername || 'intelfon');
        const globalEmail = String(CONFIG.AUTH.masterEmail || 'admin@intelfon.com').trim().toLowerCase();
        const globalPassword = String(CONFIG.AUTH.defaultPassword || 'intelfon2026');

        let globalUser = users.find(u => cleanUsername(u.username) === globalUsername);
        if (!globalUser) {
            globalUser = { createdAt:new Date().toISOString() };
            users.unshift(globalUser);
        }
        Object.assign(globalUser, {
            id:'USR-MASTER', name:'Master INTELFON', username:globalUsername,
            email:globalEmail, password:globalUser.password || globalPassword,
            role:'Super Admin', isMaster:true, isGlobalMaster:true, region:null
        });

        const defs = new Map();
        (Array.isArray(CONFIG.AUTH.masters) ? CONFIG.AUTH.masters : []).forEach(def => {
            const username = cleanUsername(def?.username);
            if (username) defs.set(username, def);
        });

        for (const username of ['masterguatemala','mastersalvador','masterelsalvador']) {
            const identity = identityOf(username);
            const ownDef = defs.get(username) || {};
            const altDef = identity.region === 'SV'
                ? (defs.get('mastersalvador') || defs.get('masterelsalvador') || {})
                : (defs.get('masterguatemala') || {});

            let regional = users.find(u => cleanUsername(u.username) === username);
            if (!regional) {
                regional = { createdAt:new Date().toISOString() };
                users.push(regional);
            }

            Object.assign(regional, {
                id: identity.id,
                name: identity.name,
                username,
                email: uniqueRegionalEmail(username, ownDef.email ?? altDef.email ?? regional.email),
                password: String(ownDef.password ?? altDef.password ?? regional.password ?? ''),
                role:'Super Admin',
                isMaster:true,
                isGlobalMaster:false,
                region:identity.region
            });
        }

        users = users.filter((u, i, arr) => {
            const un = cleanUsername(u.username);
            if (!un) return true;
            return arr.findIndex(x => cleanUsername(x.username) === un) === i;
        });

        localStorage.setItem(USERS_DB_KEY, JSON.stringify(users));
        return users;
    },

    _saveUsersDB(users) {
        localStorage.setItem(USERS_DB_KEY, JSON.stringify(users));
    },

    isGlobalMaster(user = null) {
        const current = user || this.getUser();
        return !!current && cleanUsername(current.username) === cleanUsername(CONFIG.AUTH.masterUsername || 'intelfon');
    },

    isMasterAdmin(user = null) {
        const current = user || this.getUser();
        return !!current && (!!identityOf(current.username) || !!current.isMaster);
    },

    async login(userOrEmail, password, remember = false) {
        const cleanUser = String(userOrEmail || '').trim().toLowerCase();
        const cleanPass = String(password || '').trim();
        const users = this._getUsersDB();

        let matchedUser = null;
        if (identityOf(cleanUser)) {
            matchedUser = users.find(u =>
                cleanUsername(u.username) === cleanUser &&
                String(u.password || '').trim() === cleanPass
            );
        } else {
            matchedUser = users.find(u => {
                const username = cleanUsername(u.username);
                const email = String(u.email || '').trim().toLowerCase();
                return (username === cleanUser || email === cleanUser) &&
                    String(u.password || '').trim() === cleanPass;
            });
        }

        if (!matchedUser) {
            return { success:false, message:'Credenciales inválidas. Verifica tu usuario y contraseña.' };
        }

        const identity = identityOf(matchedUser.username);
        const userData = {
            id: identity?.id || matchedUser.id,
            name: identity?.name || matchedUser.name,
            email: matchedUser.email,
            username: cleanUsername(matchedUser.username),
            role: matchedUser.role || 'Analista',
            isMaster: !!identity || !!matchedUser.isMaster,
            isGlobalMaster: !!identity?.global,
            region: identity ? identity.region : (matchedUser.region || null),
            avatar:'assets/logo-intelfon.png',
            loginTime:new Date().toISOString()
        };

        const payload = JSON.stringify(userData);
        if (remember) {
            localStorage.setItem(CONFIG.AUTH.sessionKey, payload);
            sessionStorage.removeItem(CONFIG.AUTH.sessionKey);
        } else {
            sessionStorage.setItem(CONFIG.AUTH.sessionKey, payload);
            localStorage.removeItem(CONFIG.AUTH.sessionKey);
        }

        return { success:true, user:userData };
    },

    logout() {
        localStorage.removeItem(CONFIG.AUTH.sessionKey);
        sessionStorage.removeItem(CONFIG.AUTH.sessionKey);
    },

    isAuthenticated() {
        const session = sessionStorage.getItem(CONFIG.AUTH.sessionKey) || localStorage.getItem(CONFIG.AUTH.sessionKey);
        if (!session) return false;
        try { return !!JSON.parse(session)?.username; } catch (_) { return false; }
    },

    getUser() {
        const session = sessionStorage.getItem(CONFIG.AUTH.sessionKey) || localStorage.getItem(CONFIG.AUTH.sessionKey);
        if (!session) return null;
        try {
            const user = JSON.parse(session);
            const identity = identityOf(user?.username);
            if (identity) {
                user.id = identity.id;
                user.name = identity.name;
                user.region = identity.region;
                user.isMaster = true;
                user.isGlobalMaster = identity.global;
                user.role = 'Super Admin';
            }
            return user;
        } catch (_) { return null; }
    },

    getAllUsers() { return this._getUsersDB(); },

    async register(name, email, password, role='Analista', region=null) {
        const cleanName = String(name || '').trim();
        const cleanEmail = String(email || '').trim().toLowerCase();
        const cleanPass = String(password || '').trim();
        const cleanRegion = region === 'GT' || region === 'SV' ? region : null;

        if (!cleanName || cleanName.length < 2) return {success:false,message:'Por favor ingresa un nombre válido.'};
        if (!cleanEmail || (!cleanEmail.includes('@') && cleanEmail.length < 3)) return {success:false,message:'Por favor ingresa un correo o usuario válido.'};
        if (!cleanPass || cleanPass.length < 4) return {success:false,message:'La contraseña debe tener al menos 4 caracteres.'};

        const users = this._getUsersDB();
        if (users.some(u => String(u.email||'').toLowerCase()===cleanEmail || cleanUsername(u.username)===cleanEmail)) {
            return {success:false,message:'Este correo o nombre de usuario ya está registrado.'};
        }

        const newUser = {
            id:`USR-${Date.now().toString().slice(-6)}`, name:cleanName,
            email:cleanEmail.includes('@') ? cleanEmail : `${cleanEmail}@intelfon.com`,
            username:cleanEmail.split('@')[0], password:cleanPass,
            role: role === 'Super Admin' ? 'Analista' : role,
            isMaster:false, isGlobalMaster:false, region:cleanRegion,
            createdAt:new Date().toISOString()
        };
        users.push(newUser);
        this._saveUsersDB(users);
        return {success:true,user:newUser};
    },

    updateUserRegion(emailOrId, region) {
        if (region !== 'GT' && region !== 'SV') return false;
        const users = this._getUsersDB();
        const target = users.find(u => u.email===emailOrId || u.id===emailOrId || u.username===emailOrId);
        if (!target || this.isMasterAdmin(target)) return false;
        target.region = region;
        this._saveUsersDB(users);
        return true;
    },

    deleteUser(emailOrId) {
        let users = this._getUsersDB();
        const target = users.find(u => u.email===emailOrId || u.id===emailOrId || u.username===emailOrId);
        if (!target || this.isMasterAdmin(target)) return false;
        users = users.filter(u => u.id !== target.id);
        this._saveUsersDB(users);
        return true;
    }
};
