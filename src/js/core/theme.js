/**
 * INTELFON Dashboard
 * Theme Manager
 *
 * Responsabilidad:
 * - Cargar tema guardado
 * - Cambiar modo oscuro/claro
 * - Persistir preferencia del usuario
 */


import { Toast } from '../services/toastService.js';



/**
 * Inicializa el tema al cargar la aplicación
 */
export function initTheme() {


    const savedTheme =
        localStorage.getItem('intelfon_theme')
        ||
        'dark';



    document.documentElement.classList.toggle(
        'dark',
        savedTheme === 'dark'
    );



    const btnToggleTheme =
        document.getElementById(
            'btn-toggle-theme'
        );



    if (!btnToggleTheme) {
        return;
    }



    btnToggleTheme.addEventListener(
        'click',
        () => {


            const isDark =
                document.documentElement
                .classList
                .toggle('dark');



            const newTheme =
                isDark
                ? 'dark'
                : 'light';



            localStorage.setItem(
                'intelfon_theme',
                newTheme
            );



            Toast.info(
                isDark
                ? 'Modo Oscuro activado'
                : 'Modo Claro activado',
                'Tema Visual'
            );


        }
    );


}