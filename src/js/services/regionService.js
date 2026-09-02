import { AuthService } from './authService.js';
import { CONFIG } from '../core/config.js';

const LAST_REGION_KEY = 'intelfon_last_region';


export const RegionService = {


    getActiveRegion() {


        const user =
            AuthService.getUser();



        const username =
            String(
                user?.username || ''
            )
                .toLowerCase()
                .trim();





        // Master global INTELFON

        if (
            username === 'intelfon'
            ||
            username === 'masterintelfon'
        ) {

            return 'GLOBAL';

        }





        // Masters regionales

        if (
            username === 'masterguatemala'
        ) {

            return 'GT';

        }





        if (
            username === 'mastersalvador'
            ||
            username === 'masterelsalvador'
        ) {

            return 'SV';

        }





        // Usuarios normales con región asignada

        if (
            user?.region
            &&
            CONFIG.REGIONS[user.region]
        ) {

            localStorage.setItem(
                LAST_REGION_KEY,
                user.region
            );


            return user.region;

        }







        // Última región guardada

        const stored =
            localStorage.getItem(
                LAST_REGION_KEY
            );



        if (
            stored &&
            CONFIG.REGIONS[stored]
        ) {

            return stored;

        }






        // Fallback general

        return 'GLOBAL';


    },







    getOtherRegion(region) {


        const active =
            region ||
            this.getActiveRegion();




        if (
            active === 'GT'
        ) {

            return 'SV';

        }



        if (
            active === 'SV'
        ) {

            return 'GT';

        }



        return null;


    },









    getRegionMeta(regionCode) {



        if (
            regionCode === 'GLOBAL'
        ) {


            return {

                code: 'GLOBAL',

                name: 'Consolidado Regional',

                currency: 'USD',

                symbol: '$',

                flag: '🌎'

            };


        }






        const meta =
            CONFIG.REGIONS[regionCode]
            ||
            CONFIG.REGIONS.GT;







        if (
            regionCode === 'SV'
        ) {


            return {

                ...meta,

                code: 'SV',

                name: 'El Salvador',

                currency: 'USD',

                symbol: '$'

            };


        }







        return {


            ...meta,

            code: 'GT',

            name: 'Guatemala',

            currency:
                meta.currency || 'GTQ',

            symbol:
                meta.symbol || 'Q'


        };


    }

};