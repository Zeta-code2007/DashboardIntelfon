/*
 * Red Intelfon - Bloqueo de dashboard por usuario master
 *
 * Master INTELFON        => GLOBAL / Consolidado Regional
 * masterguatemala        => GUATEMALA / GTQ
 * mastersalvador         => EL_SALVADOR / USD
 *
 * Se carga DESPUÉS de dashboard.js.
 * No modifica la lógica de sincronización ni cálculos financieros.
 */

(() => {

'use strict';



const COUNTRY = Object.freeze({

    GLOBAL: 'GLOBAL',

    GT: 'GUATEMALA',

    SV: 'EL_SALVADOR'

});





const normalize = (value) => String(value ?? '')

    .normalize('NFD')

    .replace(/[\u0300-\u036f]/g,'')

    .toLowerCase()

    .replace(/[^a-z0-9]+/g,'');







const normalizeCountryCode = (value) => {


    const v = normalize(value);



    // MASTER GLOBAL INTELFON

    if (

        [

            'global',

            'consolidado',

            'consolidadoregional',

            'intelfon',

            'masterintelfon'

        ].includes(v)

        ||

        v.includes('masterintelfon')

    ){

        return COUNTRY.GLOBAL;

    }






    // GUATEMALA

    if (

        [

            'guatemala',

            'gt',

            'gua',

            'masterguatemala'

        ].includes(v)

        ||

        v.includes('masterguatemala')

    ){

        return COUNTRY.GT;

    }






    // EL SALVADOR

    if (

        [

            'elsalvador',

            'salvador',

            'sv',

            'slv',

            'mastersalvador',

            'masterelsalvador'

        ].includes(v)

        ||

        v.includes('mastersalvador')

        ||

        v.includes('masterelsalvador')

    ){

        return COUNTRY.SV;

    }





    return '';

};







function safeStorageValues(storage){


    if(!storage){

        return [];

    }



    const keys=[


        'username',

        'user',

        'usuario',

        'currentUser',

        'authUser',

        'masterUser',

        'master',

        'pais',

        'country',

        'dashboardCountry'


    ];



    const out=[];



    for(const key of keys){


        try{


            const value =
                storage.getItem(key);


            if(value){

                out.push(value);

            }


        }catch(_){}


    }



    return out;

}









function resolveLockedCountry(){



    const params =
        new URLSearchParams(
            location.search
        );



    const candidates=[



        window.DASHBOARD_LOCKED_COUNTRY,


        window.DASHBOARD_MASTER_USER,


        window.CURRENT_USER,


        window.AUTH_USER,


        window.USERNAME,



        window.currentUser &&

        (

            window.currentUser.username ||

            window.currentUser.user ||

            window.currentUser.name

        ),




        window.user &&

        (

            window.user.username ||

            window.user.user ||

            window.user.name

        ),



        document.documentElement?.dataset?.user,


        document.body?.dataset?.user,



        params.get('username'),

        params.get('user'),

        params.get('usuario'),

        params.get('master'),

        params.get('country'),

        params.get('pais'),



        location.pathname,

        location.hash,



        ...safeStorageValues(
            window.sessionStorage
        ),



        ...safeStorageValues(
            window.localStorage
        )



    ].filter(Boolean);





    for(const candidate of candidates){



        const country =
            normalizeCountryCode(
                candidate
            );



        if(country){

            return country;

        }


    }







    const meta =
        window.DASHBOARD_BASE_DATA?.meta || {};



    return normalizeCountryCode(

        meta.lockedCountry ||

        meta.country ||

        meta.pais

    );

}





const lockedCountry =
    resolveLockedCountry();







if(!lockedCountry){


    console.warn(

        '[Intelfon] No se pudo determinar usuario master; no se aplicó bloqueo.'

    );


    return;

}









const config =



    lockedCountry === COUNTRY.GLOBAL



    ? {


        country: COUNTRY.GLOBAL,

        label:'Consolidado Regional',

        currency:'USD',

        symbol:'$'


      }





    :





    lockedCountry === COUNTRY.SV



    ? {


        country: COUNTRY.SV,

        label:'El Salvador',

        currency:'USD',

        symbol:'$'


      }






    :



      {


        country: COUNTRY.GT,

        label:'Guatemala',

        currency:'GTQ',

        symbol:'Q'


      };








window.INTELFON_MASTER_ACCESS = Object.freeze({

    ...config

});









function forceRuntimeCountry(){



    try{


        if(
            typeof ACTIVE_COUNTRY !== 'undefined'
        ){

            ACTIVE_COUNTRY =
                config.country;

        }


    }catch(_){}







    try{


        if(

            typeof COUNTRY_CURRENCY_VIEW !== 'undefined'

            &&

            COUNTRY_CURRENCY_VIEW

        ){


            COUNTRY_CURRENCY_VIEW.GUATEMALA =
                'GTQ';



            COUNTRY_CURRENCY_VIEW.EL_SALVADOR =
                'USD';


        }


    }catch(_){}







    window.DASHBOARD_LOCKED_COUNTRY =
        config.country;


}









function removeCrossCountryAccess(){



    // GLOBAL puede visualizar ambos países

    if(
        config.country === COUNTRY.GLOBAL
    ){

        return;

    }






    const other =

        config.country === COUNTRY.GT

        ? COUNTRY.SV

        : COUNTRY.GT;








    document
    .querySelectorAll(
        '#countrySwitcher, .country-switcher'
    )
    .forEach(el=>{


        el.hidden=true;

        el.style.display='none';

        el.setAttribute(
            'aria-hidden',
            'true'
        );


    });









    document
    .querySelectorAll(
        '[data-country]'
    )
    .forEach(el=>{


        const country =
            normalizeCountryCode(
                el.getAttribute(
                    'data-country'
                )
            );



        if(

            country &&

            country !== config.country

        ){


            el.remove();


        }


        else if(

            country === config.country

        ){


            el.setAttribute(
                'aria-current',
                'true'
            );



            if(
                'disabled' in el
            ){

                el.disabled=true;

            }


        }


    });








    document
    .querySelectorAll(
        '[data-currency-country]'
    )
    .forEach(el=>{


        const country =
            normalizeCountryCode(
                el.getAttribute(
                    'data-currency-country'
                )
            );



        const visible =
            country === config.country;



        el.hidden =
            !visible;



        el.style.display =
            visible
            ? ''
            : 'none';



    });









    document
    .querySelectorAll(
        '.countryLabel'
    )
    .forEach(el=>{


        el.textContent =
            config.label;


    });




    document
    .querySelectorAll(
        '.currencyLabel'
    )
    .forEach(el=>{


        el.textContent =
            `${config.currency} (${config.symbol})`;


    });



}









function rebuildDashboardForLockedCountry(){



    forceRuntimeCountry();




    try{


        if(
            typeof buildFiltered === 'function'
        ){


            DATA =
                buildFiltered(

                    MIN_DATE,

                    MAX_DATE

                );


        }


    }catch(error){


        console.error(

            '[Intelfon] Error reconstruyendo dashboard:',

            error

        );


    }







    try{


        if(
            typeof renderAll === 'function'
        ){

            renderAll();

        }


    }catch(error){


        console.error(

            '[Intelfon] Error renderizando dashboard:',

            error

        );


    }





    removeCrossCountryAccess();


}









document.addEventListener(

'click',

(event)=>{


    if(
        config.country === COUNTRY.GLOBAL
    ){

        return;

    }




    const target =
        event.target?.closest?.(
            '[data-country], a[href]'
        );



    if(!target){

        return;

    }



    const declared =

        target.getAttribute(
            'data-country'
        )

        ||

        target.getAttribute(
            'href'
        )

        ||

        '';





    const targetCountry =
        normalizeCountryCode(
            declared
        );



    if(

        targetCountry &&

        targetCountry !== config.country

    ){


        event.preventDefault();

        event.stopPropagation();

        event.stopImmediatePropagation();


        forceRuntimeCountry();


    }


},

true

);









const observer =
    new MutationObserver(
        ()=>removeCrossCountryAccess()
    );








function init(){



    forceRuntimeCountry();


    rebuildDashboardForLockedCountry();


    removeCrossCountryAccess();





    if(document.body){


        observer.observe(

            document.body,

            {

                childList:true,

                subtree:true,

                attributes:true

            }

        );


    }







    console.info(

        `[Intelfon] Acceso master: ${config.label} · ${config.currency}`

    );



}








if(
    document.readyState === 'loading'
){

    document.addEventListener(

        'DOMContentLoaded',

        init,

        {

            once:true

        }

    );

}

else{


    init();


}







window.IntelfonMasterCountry =
Object.freeze({

    get country(){

        return config.country;

    },


    get currency(){

        return config.currency;

    },


    enforce:

        rebuildDashboardForLockedCountry


});




})();