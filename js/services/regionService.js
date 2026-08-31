import { AuthService } from './authService.js';
import { CONFIG } from '../config.js';

const LAST_REGION_KEY = 'intelfon_last_region';

function forcedRegion(user) {
    const username = String(user?.username || '').toLowerCase().trim();
    if (username === 'masterguatemala') return 'GT';
    if (username === 'mastersalvador' || username === 'masterelsalvador') return 'SV';
    return null;
}

export const RegionService = {
    getActiveRegion() {
        const user = AuthService.getUser();

        // ÚNICO cambio funcional: los masters regionales nunca heredan otra región.
        const forced = forcedRegion(user);
        if (forced && CONFIG.REGIONS[forced]) {
            localStorage.setItem(LAST_REGION_KEY, forced);
            return forced;
        }

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
        const meta = CONFIG.REGIONS[regionCode] || CONFIG.REGIONS.GT;
        if (regionCode === 'SV') {
            return { ...meta, currency: 'USD', symbol: '$' };
        }
        return meta;
    }
};
