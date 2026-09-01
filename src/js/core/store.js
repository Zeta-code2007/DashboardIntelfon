/**
 * INTELFON Dashboard
 * Global Store
 *
 * Responsabilidad:
 * - Mantener estado compartido de la aplicación
 * - Evitar variables globales dispersas
 */


const state = {


    // Usuario actualmente autenticado
    user: null,


    // Región activa
    region: null,


    // Reporte actual generado
    currentReport: null,


    // Datos enviados por Make
    reportData: null,


    // Datos enviados al overview
    overviewData: null,


    // Filtros globales
    filters: {


        country: 'all',

        date: null,

        currency: 'original'


    }


};





/**
 * Obtener estado completo
 */
export function getState(){

    return state;

}





/**
 * Actualizar un valor del estado
 */
export function setState(
    key,
    value
){

    state[key] = value;

}





/**
 * Obtener un valor específico
 */
export function getValue(
    key
){

    return state[key];

}





/**
 * Limpiar estado
 */
export function clearStore(){


    state.user = null;

    state.region = null;

    state.currentReport = null;

    state.reportData = null;

    state.overviewData = null;


}