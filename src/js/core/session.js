/**
 * INTELFON Dashboard
 * Session Manager
 *
 * Responsabilidad:
 * - Controlar autenticación
 * - Mostrar login/dashboard
 * - Manejar usuario actual
 * - Gestionar cierre de sesión
 * - Inicializar servicios del dashboard
 */


import { AuthService } from '../services/authService.js';
import { Toast } from '../services/toastService.js';

import { RegionService } from '../services/regionService.js';
import { SyncService } from '../services/syncService.js';

import { mountRegionStatusBar } from '../components/regionStatusBar.js';

import { applyPermissions } from './permissions.js';

import { renderLogin } from '../auth/login.js';

import { loadView } from './router.js';



let sidebar = null;
let mainLayout = null;
let sidebarBackdrop = null;
let userDisplayName = null;



/**
 * Inicialización de sesión
 */
export function initSession(){


    sidebar =
        document.getElementById(
            'sidebar'
        );


    mainLayout =
        document.getElementById(
            'main-layout'
        );


    sidebarBackdrop =
        document.getElementById(
            'sidebar-backdrop'
        );


    userDisplayName =
        document.getElementById(
            'user-display-name'
        );



    const btnLogout =
        document.getElementById(
            'btn-logout'
        );



    btnLogout?.addEventListener(
        'click',
        logout
    );


}



/**
 * Verifica autenticación
 */
export function checkAuthentication(){


    if(
        AuthService.isAuthenticated()
    ){

        showDashboardScreen();


    }else{


        showLoginScreen();


    }


}





/**
 * Mostrar pantalla login
 */
export function showLoginScreen(){


    sidebar?.classList.add(
        'hidden'
    );


    mainLayout?.classList.add(
        'hidden'
    );


    sidebarBackdrop?.classList.add(
        'hidden'
    );



    document
    .getElementById(
        'login-modal-container'
    )
    ?.remove();





    const loginElement =
        renderLogin(
            user => {


                Toast.success(
                    `Bienvenido, ${user.name}`,
                    'Inicio de Sesión Exitoso'
                );


                showDashboardScreen(
                    user
                );


            }
        );



    loginElement.id =
        'login-modal-container';



    document.body.appendChild(
        loginElement
    );


}





/**
 * Mostrar dashboard
 */
export function showDashboardScreen(
    user = null
){


    document
    .getElementById(
        'login-modal-container'
    )
    ?.remove();





    sidebar?.classList.remove(
        'hidden'
    );


    mainLayout?.classList.remove(
        'hidden'
    );


    sidebarBackdrop?.classList.remove(
        'hidden'
    );





    const currentUser =
        user ||
        AuthService.getUser();





    updateUserDisplay(
        currentUser
    );




    initializeDashboard(
        currentUser
    );




    applyPermissions();




    loadView(
        'overview'
    );



}





/**
 * Inicialización del dashboard
 */
function initializeDashboard(
    user
){


    const activeRegion =
        RegionService.getActiveRegion();



    const regionMeta =
        RegionService.getRegionMeta(
            activeRegion
        );




    if(
        activeRegion === 'GT'
        ||
        activeRegion === 'SV'
    ){

        SyncService.initSync(
            activeRegion,
            user
        );

    }




    const syncBarContainer =
        document.getElementById(
            'region-sync-bar'
        );



    if(syncBarContainer){


        mountRegionStatusBar(
            syncBarContainer
        );


    }





    const pageSubtitle =
        document.querySelector(
            'header p.text-xs.text-slate-500'
        );



    if(pageSubtitle){


        pageSubtitle.textContent =
            `Dashboard ${regionMeta.name} (${regionMeta.currency}) · Gestión automatizada de reportes bancarios con Make.com`;


    }


}





/**
 * Actualiza nombre visible usuario
 */
function updateUserDisplay(
    currentUser
){


    if(!userDisplayName){

        return;

    }



    const username =
        String(
            currentUser?.username || ''
        )
        .toLowerCase()
        .trim();





    if(
        username ===
        'masterguatemala'
    ){


        userDisplayName.textContent =
            'Master Guatemala';



    }else if(

        username === 'mastersalvador'
        ||
        username === 'masterelsalvador'

    ){


        userDisplayName.textContent =
            'Master El Salvador';



    }else if(

        username === 'intelfon'
        ||
        username === 'masterintelfon'

    ){


        userDisplayName.textContent =
            'Master INTELFON';



    }else{


        userDisplayName.textContent =
            currentUser?.name ||
            'Analista';


    }


}





/**
 * Cerrar sesión
 */
export function logout(){


    if(
        !confirm(
            '¿Estás seguro de que deseas cerrar sesión?'
        )
    ){

        return;

    }



    SyncService.teardownSync();



    AuthService.logout();




    Toast.info(
        'Has cerrado sesión correctamente.',
        'Sesión Finalizada'
    );




    showLoginScreen();


}