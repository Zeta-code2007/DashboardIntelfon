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
    sendToMake
}
from '../../services/make.service.js';



/**
 * Configuración
 */

const MAX_FILES = 10;



/**
 * Inicialización principal
 */

export function initGenerator(){


    const container =
        document.getElementById(
            'generator'
        );



    if(!container){

        console.warn(
            'No existe contenedor generator'
        );

        return;

    }



    renderGenerator(container);



    registerEvents();


}





/**
 * Eventos UI
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




    if(input){


        input.addEventListener(
            'change',
            e=>{


                handleFiles(
                    e.target.files
                );


            }
        );


    }





    if(dropZone){


        dropZone.addEventListener(
            'dragover',
            e=>{

                e.preventDefault();

            }
        );



        dropZone.addEventListener(
            'drop',
            e=>{

                e.preventDefault();


                handleFiles(
                    e.dataTransfer.files
                );


            }
        );


    }





    if(generateBtn){


        generateBtn.addEventListener(
            'click',
            generateReport
        );


    }





    if(clearBtn){


        clearBtn.addEventListener(
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
 * Flujo principal
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


        generatorState.processing=true;



        showLoading();




        /*
            1.
            Enviar archivos a Make
        */


        const response =
            await sendToMake(
                generatorState.selectedFiles
            );






        /*
            2.
            Normalizar respuesta
        */


        const report =
            parseReportData(
                response
            );





        /*
            3.
            Guardar estado
        */


        generatorState.lastProcessedData =
            report;




        generatorState.currentRunId =
            report.ejecucion_id;





        /*
            4.
            Mostrar resultado
        */


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


        generatorState.processing=false;


        hideLoading();



    }


}