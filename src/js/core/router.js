/**
 * INTELFON Dashboard
 * Router
 *
 * Responsabilidad:
 * - Administrar navegación entre vistas
 * - Cargar módulos visuales
 * - Controlar cambios de pantalla
 *
 * No maneja:
 * - Login
 * - Sesión
 * - Firebase
 * - Make
 */


import { renderOverview } from '../views/overview.js';
import { renderHistory } from '../views/history.js';
import { renderUsers } from '../views/users.js';

import { renderGenerator } from '../modules/generator/generator.ui.js';

import { renderReportSection } from '../components/reportSection.js';

import { canAccess } from './permissions.js';



let appContent = null;
let pageTitle = null;
let navButtons = [];





/**
 * Registro de vistas disponibles
 */
const views = {


    overview: {

        title:
            'Inicio / Overview',

        render:
            renderOverview

    },



    generator: {

        title:
            'Generar Reporte Excel',

        render:
            renderGenerator

    },



    history: {

        title:
            'Reportes Anteriores',

        render:
            renderHistory

    },



    'bank-detail': {

        title:
            'Detalle por banco',

        render(){

            return renderReportSection(
                'bancos',
                'Detalle por banco'
            );

        }

    },



    'daily-flow': {

        title:
            'Flujo diario',

        render(){

            return renderReportSection(
                'flujo',
                'Flujo diario'
            );

        }

    },



    'account-detail': {

        title:
            'Detalle de cuentas',

        render(){

            return renderReportSection(
                'cuentas',
                'Detalle de cuentas'
            );

        }

    },



    users: {

        title:
            'Gestión de Usuarios',

        render:
            renderUsers,

        permission:
            'users'

    }


};





/**
 * Inicializa navegación
 */
export function initRouter(){


    appContent =
        document.getElementById(
            'app-content'
        );



    pageTitle =
        document.getElementById(
            'page-title'
        );



    navButtons =
        document.querySelectorAll(
            '.nav-btn'
        );





    navButtons.forEach(
        button => {


            button.addEventListener(
                'click',
                ()=>{


                    loadView(
                        button.dataset.view
                    );


                }
            );


        }
    );





    window.addEventListener(
        'message',
        handleMessage
    );



    window.addEventListener(
        'storage',
        handleStorage
    );


}






/**
 * Carga una vista
 */
export function loadView(viewName){


    const view =
        views[viewName];



    if(!view){


        console.warn(
            `Vista no encontrada: ${viewName}`
        );


        return;


    }





    if(
        view.permission &&
        !canAccess(
            view.permission
        )
    ){


        console.warn(
            'Acceso restringido'
        );


        loadView(
            'overview'
        );


        return;


    }





    if(pageTitle){


        pageTitle.textContent =
            view.title;


    }





    navButtons.forEach(
        button => {


            button.classList.toggle(
                'active',
                button.dataset.view === viewName
            );


        }
    );





    if(!appContent){

        return;

    }





    appContent.innerHTML = '';





    const element =
        view.render();





    if(element){


        element.classList.add(
            'transition-all',
            'duration-300'
        );


        appContent.appendChild(
            element
        );


    }





    appContent.scrollTop = 0;





    if(
        window.innerWidth < 1024
    ){

        closeMobileSidebar();

    }



}






/**
 * Eventos internos entre módulos
 */
function handleMessage(event){



    if(
        event.data?.type ===
        'intelfon-report-cleared'
    ){


        const activeView =
            document.querySelector(
                '.nav-btn.active'
            )
            ?.dataset.view
            ||
            'overview';



        loadView(
            activeView
        );



        return;


    }





    if(
        event.data?.type ===
        'intelfon-navigate'
        &&
        typeof event.data.view === 'string'
    ){


        loadView(
            event.data.view
        );


    }



}






/**
 * Actualización por almacenamiento
 */
function handleStorage(event){



    if(
        event.key ===
        'intelfon_current_report'
    ){



        const activeView =
            document.querySelector(
                '.nav-btn.active'
            )
            ?.dataset.view
            ||
            'overview';




        loadView(
            activeView
        );


    }



}







/**
 * Cierre menú móvil
 */
function closeMobileSidebar(){


    const sidebar =
        document.getElementById(
            'sidebar'
        );



    const backdrop =
        document.getElementById(
            'sidebar-backdrop'
        );



    if(
        !sidebar ||
        !backdrop
    ){

        return;

    }





    sidebar.classList.add(
        '-translate-x-full'
    );



    backdrop.classList.add(
        'opacity-0',
        'pointer-events-none'
    );



    backdrop.classList.remove(
        'opacity-100',
        'pointer-events-auto'
    );



    document.body.classList.remove(
        'overflow-hidden'
    );


}