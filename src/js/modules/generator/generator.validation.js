import { Toast } from '../../services/toastService.js';
import { generatorState } from './generator.state.js';


/**
 * Escapa HTML para evitar inyección
 */
export function escapeHtml(str){

    if(str === null || str === undefined){
        return '';
    }

    return String(str)
        .replace(/&/g,'&amp;')
        .replace(/</g,'&lt;')
        .replace(/>/g,'&gt;')
        .replace(/"/g,'&quot;')
        .replace(/'/g,'&#039;');

}



/**
 * Formatea tamaño archivo
 */
export function formatFileSize(bytes){

    if(!bytes){
        return '0 B';
    }


    const k = 1024;

    const sizes=[
        'B',
        'KB',
        'MB',
        'GB'
    ];


    const i=Math.floor(
        Math.log(bytes)/Math.log(k)
    );


    return (
        parseFloat(
            (bytes / Math.pow(k,i))
            .toFixed(2)
        )
        +
        ' '
        +
        sizes[i]
    );

}




/**
 * Valida y agrega archivos seleccionados
 */
export function validateFiles(
    files,
    maxFiles,
    regionName
){

    const selected =
        Array.from(files || []);


    if(!selected.length){
        return false;
    }



    const maxSize =
        20 * 1024 * 1024;



    const valid=[];



    for(const file of selected){


        if(
            !file.name
            .toLowerCase()
            .endsWith('.xlsx')
        ){

            Toast.error(
                `${file.name} no es Excel válido`
            );

            continue;

        }



        if(file.size > maxSize){

            Toast.error(
                `${file.name} supera los 20MB`
            );

            continue;

        }



        const duplicate =
            generatorState.selectedFiles
            .some(
                f =>
                f.name === file.name &&
                f.size === file.size
            );


        if(!duplicate){

            valid.push(file);

        }


    }



    if(!valid.length){

        return false;

    }



    const combined = [
        ...generatorState.selectedFiles,
        ...valid
    ];



    generatorState.selectedFiles =
        combined.slice(
            0,
            maxFiles
        );



    Toast.success(
        `${generatorState.selectedFiles.length} archivo(s) cargado(s)`
    );


    return true;

}




/**
 * Limpia selección actual
 */
export function clearFiles(){

    generatorState.selectedFiles.length=0;

}