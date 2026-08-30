import { AuthService } from './authService.js';
import { CONFIG } from '../config.js';

const LAST_REGION_KEY = 'intelfon_last_region';

export const RegionService = {
    /**
     * Determina la región activa según el usuario autenticado.
     * masterguatemala / mastersalvador usan siempre su región asignada.
     * Otros usuarios (ej. "intelfon") usan la última región vista o Guatemala por defecto.
     * @returns {'GT'|'SV'}
     */
    getActiveRegion() {
        const user = AuthService.getUser();
        if (user?.region && CONFIG.REGIONS[user.region]) {
            localStorage.setItem(LAST_REGION_KEY, user.region);
            return user.region;
        }
        const stored = localStorage.getItem(LAST_REGION_KEY);
        return (stored && CONFIG.REGIONS[stored]) ? stored : 'GT';
    },

    getOtherRegion(region) {
        const active = region || this.getActiveRegion();
        return active === 'GT' ? 'SV' : 'GT';
    },

    getRegionMeta(regionCode) {
        return CONFIG.REGIONS[regionCode] || CONFIG.REGIONS.GT;
    }
};
