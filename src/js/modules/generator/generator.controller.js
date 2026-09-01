/**
 * Generator Controller
 *
 * Controla el flujo completo del generador.
 *
 * NO contiene:
 * - HTML
 * - estilos
 * - parsing complejo
 * - llamadas directas a Firebase
 *
 * Solo coordina módulos.
 */


import { generatorState } 
from './generator.state.js';


import {
    validateFiles,
    clearFiles
}
from './generator.validation.js';


import {
    renderGenerator,
    renderFiles,
    showLoading,
    hideLoading,
    showError,
    showStatus,
    renderSummaryCards
}
from './generator.ui.js';


import {
    parseReportData
}
from './generator.parser.js';


import {
    enviarArchivosAMake
}
from '../../services/makeService.js';



const MAX_FILES = 10;




/**
 * Inicializa módulo Generator
 */
export function initGenerator(){


    const container =
        document.createElement(
            'div'
        );


    container.id =
        'generator';



    renderGenerator(
        container
    );



    registerEvents();



    return container;


}






/**
 * Registra eventos UI
 */
function registerEvents(){



    const input =
        document.getElementById(
            'file-input'
        );



    const dropZone =
        document.getElementById(
            'drop-zone'
        );



    const generateBtn =
        document.getElementById(
            'generate-report'
        );



    const clearBtn =
        document.getElementById(
            'clear-files'
        );





    input?.addEventListener(
        'change',
        e=>{


            handleFiles(
                e.target.files
            );


        }
    );





    dropZone?.addEventListener(
        'dragover',
        e=>{

            e.preventDefault();

        }
    );





    dropZone?.addEventListener(
        'drop',
        e=>{


            e.preventDefault();


            handleFiles(
                e.dataTransfer.files
            );


        }
    );





    generateBtn?.addEventListener(
        'click',
        generateReport
    );





    clearBtn?.addEventListener(
        'click',
        ()=>{


            clearFiles();


            generatorState.resetFiles();


            renderFiles([]);


            showStatus(
                'Archivos eliminados'
            );


        }
    );


}







/**
 * Manejo de archivos
 */
function handleFiles(files){


    const valid =
        validateFiles(
            files,
            MAX_FILES
        );



    if(valid){


        renderFiles(
            generatorState.selectedFiles
        );


    }


}








/**
 * Generación del reporte
 */
async function generateReport(){



    if(
        !generatorState.selectedFiles.length
    ){


        showError(
            'Debe seleccionar archivos Excel'
        );


        return;


    }





    if(
        generatorState.processing
    ){

        return;

    }





    try{


        generatorState.processing =
            true;



        showLoading();





        const response =
            await enviarArchivosAMake(
                generatorState.selectedFiles,
                'bancario'
            );







        const report =
            parseReportData(
                response
            );






        generatorState.lastProcessedData =
            report;



        generatorState.currentRunId =
            report.ejecucion_id;







        renderSummaryCards({

            bancos:
                report.bancos_procesados?.length
                ||
                0,


            registros:
                report.rows?.length
                ||
                0

        });







        showStatus(
            'Reporte generado correctamente',
            'success'
        );




    }catch(error){


        console.error(
            error
        );


        showError(
            error.message ||
            'Error generando reporte'
        );



    }finally{


        generatorState.processing =
            false;



        hideLoading();


    }



}