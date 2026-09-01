import { AuthService } from './authService.js';
import { CONFIG } from '../core/config.js';

const LAST_REGION_KEY = 'intelfon_last_region';

export const RegionService = {
    getActiveRegion() {
        const user = AuthService.getUser();
        const username = String(user?.username || '').toLowerCase().trim();

        if (username === 'masterguatemala') return 'GT';
        if (username === 'mastersalvador' || username === 'masterelsalvador') return 'SV';

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
            return { ...meta, code:'SV', name:'El Salvador', currency:'USD', symbol:'$' };
        }
        return { ...meta, code:'GT', name:'Guatemala', currency:meta.currency || 'GTQ', symbol:meta.symbol || 'Q' };
    }
};
