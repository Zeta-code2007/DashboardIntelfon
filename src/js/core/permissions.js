/**
 * INTELFON Dashboard
 * Permissions Manager
 *
 * Responsabilidad:
 * - Controlar accesos por usuario
 * - Validar módulos permitidos
 * - Gestionar permisos de Master Global
 */


import { AuthService } from '../services/authService.js';



/**
 * Obtiene usuario actual
 */
export function getCurrentUser(){

    return AuthService.getUser();

}



/**
 * Obtiene rol normalizado del usuario
 */
export function getUserRole(user = null){


    const currentUser =
        user || getCurrentUser();



    if(!currentUser){

        return null;

    }



    return String(
        currentUser.username ||
        currentUser.role ||
        ''
    )
    .toLowerCase()
    .trim();


}



/**
 * Identifica si es Master Global
 *
 * Usuario autorizado:
 * - intelfon
 * - masterIntelfon
 */
export function isGlobalMaster(user = null){


    const role =
        getUserRole(user);



    return [
        'intelfon',
        'masterintelfon',
        'masterglobal'
    ]
    .includes(role);


}



/**
 * Identifica Master Guatemala
 */
export function isGuatemalaMaster(user = null){


    const role =
        getUserRole(user);



    return [
        'masterguatemala'
    ]
    .includes(role);


}



/**
 * Identifica Master El Salvador
 */
export function isElSalvadorMaster(user = null){


    const role =
        getUserRole(user);



    return [
        'mastersalvador',
        'masterelsalvador'
    ]
    .includes(role);


}



/**
 * Valida acceso a módulo
 */
export function canAccess(
    module,
    user = null
){


    const currentUser =
        user || getCurrentUser();



    if(!currentUser){

        return false;

    }



    const globalMaster =
        isGlobalMaster(
            currentUser
        );



    /*
       Master Global tiene acceso total
    */
    if(globalMaster){

        return true;

    }



    /*
       Restricciones regionales
    */
    switch(module){


        case 'consolidado-general':

            return false;



        case 'users':

            return false;



        case 'generator':

        case 'overview':

        case 'history':

        case 'reports':

            return true;



        default:

            return false;


    }


}



/**
 * Oculta botones según permisos
 */
export function applyPermissions(){



    const user =
        getCurrentUser();



    const usersButton =
        document.querySelector(
            '.nav-btn[data-view="users"]'
        );



    if(usersButton){


        const allowed =
            canAccess(
                'users',
                user
            );


        usersButton.classList.toggle(
            'hidden',
            !allowed
        );


        usersButton.style.display =
            allowed
            ? 'flex'
            : 'none';


    }



    const consolidatedButton =
        document.querySelector(
            '.nav-btn[data-view="consolidado-general"]'
        );



    if(consolidatedButton){


        const allowed =
            canAccess(
                'consolidado-general',
                user
            );


        consolidatedButton.classList.toggle(
            'hidden',
            !allowed
        );


    }



}