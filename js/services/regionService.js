import { AuthService } from './authService.js';
import { CONFIG } from '../config.js';

const LAST_REGION_KEY = 'intelfon_last_region';

function validRegion(value) {
    return value === 'GT' || value === 'SV';
}

export const RegionService = {
    getFixedRegion(user = null) {
        const current = user || AuthService.getUser();
        if (!current) return null;

        const username = String(current.username || '').toLowerCase().trim();
        if (username === 'masterguatemala') return 'GT';
        if (username === 'mastersalvador' || username === 'masterelsalvador') return 'SV';
        return null;
    },

    isRegionLocked(user = null) {
        return !!this.getFixedRegion(user);
    },

    getActiveRegion() {
        const user = AuthService.getUser();

        // PRIORIDAD ABSOLUTA: los masters regionales jamás heredan la última región.
        const fixedRegion = this.getFixedRegion(user);
        if (fixedRegion) {
            localStorage.setItem(LAST_REGION_KEY, fixedRegion);
            return fixedRegion;
        }

        // Usuarios asignados a una región también permanecen en su región.
        if (user?.region && validRegion(user.region) && CONFIG.REGIONS[user.region]) {
            localStorage.setItem(LAST_REGION_KEY, user.region);
            return user.region;
        }

        // Solo el master global/intelfon puede conservar una última región vista.
        const stored = localStorage.getItem(LAST_REGION_KEY);
        return (stored && CONFIG.REGIONS[stored]) ? stored : 'GT';
    },

    setActiveRegion(region) {
        if (!validRegion(region) || !CONFIG.REGIONS[region]) return false;

        const fixed = this.getFixedRegion();
        if (fixed && region !== fixed) {
            console.warn(`[RegionService] Acceso bloqueado: este usuario solo puede utilizar ${fixed}.`);
            return false;
        }

        const user = AuthService.getUser();
        if (user?.region && validRegion(user.region) && !AuthService.isGlobalMaster(user) && region !== user.region) {
            console.warn('[RegionService] El usuario tiene una región fija y no puede cambiarla.');
            return false;
        }

        localStorage.setItem(LAST_REGION_KEY, region);
        document.dispatchEvent(new CustomEvent('intelfon-region-changed', { detail: { region } }));
        return true;
    },

    canAccessRegion(region) {
        if (!validRegion(region)) return false;
        const fixed = this.getFixedRegion();
        if (fixed) return fixed === region;

        const user = AuthService.getUser();
        if (user?.region && validRegion(user.region) && !AuthService.isGlobalMaster(user)) {
            return user.region === region;
        }

        return true;
    },

    getOtherRegion(region) {
        const active = region || this.getActiveRegion();
        return active === 'GT' ? 'SV' : 'GT';
    },

    getRegionMeta(regionCode) {
        const code = validRegion(regionCode) ? regionCode : this.getActiveRegion();
        const base = CONFIG.REGIONS[code] || CONFIG.REGIONS.GT || {};

        // Garantía solicitada: El Salvador SIEMPRE se presenta en USD.
        if (code === 'SV') {
            return { ...base, code: 'SV', name: base.name || 'El Salvador', currency: 'USD', symbol: '$' };
        }

        return { ...base, code: 'GT', name: base.name || 'Guatemala', currency: 'GTQ', symbol: 'Q' };
    },

    getCountryName(regionCode = null) {
        return this.getActiveRegion() === 'SV' || regionCode === 'SV' ? 'El Salvador' : 'Guatemala';
    }
};
