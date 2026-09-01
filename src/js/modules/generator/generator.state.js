/**
 * Estado global del módulo Generator
 * 
 * Este archivo únicamente mantiene memoria temporal
 * del proceso actual.
 */

export const generatorState = {

    // Archivos seleccionados por el usuario
    selectedFiles: [],


    // URL actual del Excel generado
    currentPreviewUrl: '',


    // Último resultado recibido desde Make/Firebase
    lastProcessedData: null,


    // Identificador único de ejecución
    currentRunId: null,


    // Indica si existe un proceso activo
    processing: false,


    // Región actual (GT / SV)
    activeRegion: null,


    // Limpia solamente la información del reporte actual
    resetReport(){

        this.currentPreviewUrl = '';
        this.lastProcessedData = null;
        this.currentRunId = null;
        this.processing = false;

    },


    // Limpia selección de archivos
    resetFiles(){

        this.selectedFiles.length = 0;

    }

};