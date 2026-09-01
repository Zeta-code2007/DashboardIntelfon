/**
 * INTELFON Dashboard
 * Application Entry Point
 *
 * Responsabilidad:
 * - Iniciar módulos principales
 * - Preparar aplicación al cargar
 */


import { initTheme } from './theme.js';
import { initRouter } from './router.js';
import { initSession, checkAuthentication } from './session.js';



document.addEventListener(
    'DOMContentLoaded',
    () => {


        /*
            Inicializar tema visual
        */
        initTheme();



        /*
            Inicializar navegación
        */
        initRouter();



        /*
            Inicializar sesión
        */
        initSession();


        /*
            Validar autenticación antes de mostrar dashboard
        */
        checkAuthentication();



    }
);