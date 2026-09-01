/**
 * Parser y normalizador de datos del Generator
 *
 * Responsabilidad:
 * - Convertir respuestas de Make/Firebase
 * - Normalizar JSON
 * - Extraer registros
 * - Preparar estructura para dashboard
 */


/**
 * Intenta convertir cualquier valor JSON
 */
export function tryParseJSON(value){

    if(
        typeof value !== 'string'
    ){

        return value;

    }


    try{

        return JSON.parse(value);

    }catch(e){

        return value;

    }

}



/**
 * Convierte arrays que vienen como string JSON
 */
function normalizeArray(value){

    if(
        Array.isArray(value)
    ){

        return value;

    }


    if(
        typeof value === 'string'
    ){

        const parsed = tryParseJSON(value);


        if(
            Array.isArray(parsed)
        ){

            return parsed;

        }

    }


    return [];

}



/**
 * Normalización principal de respuesta Make
 */
export function normalizeMakeData(rawData){


    if(!rawData){

        return null;

    }



    let data = rawData;



    /*
       Algunas respuestas vienen como:
       {
          data:"{json}"
       }
    */

    if(
        typeof data === 'object'
        &&
        data.data
    ){

        data =
            tryParseJSON(data.data);

    }



    /*
       Normalizamos campos principales
    */

    return {


        estado:
            data.estado ||
            'finalizado',



        pais:
            data.pais ||
            data.pais_normalizado ||
            '',



        region:
            data.region ||
            '',



        ejecucion_id:
            data.ejecucion_id ||
            '',



        tipoReporte:
            data.tipoReporte ||
            '',



        bancos_procesados:
            normalizeArray(
                data.bancos_procesados
            ),



        resumen_general:
            normalizeArray(
                data.resumen_general
            ),



        registros:
            normalizeArray(
                data.registros
            ),



        totales_globales:
            data.totales_globales ||
            {},



        reportes_diarios:
            normalizeArray(
                data.reportes_diarios
            ),



        reportes_semanales:
            normalizeArray(
                data.reportes_semanales
            ),



        reportes_mensuales:
            normalizeArray(
                data.reportes_mensuales
            ),



        reportes_por_banco:
            normalizeArray(
                data.reportes_por_banco
            ),



        observaciones:
            normalizeArray(
                data.observaciones
            )

    };


}





/**
 * Extrae filas de movimientos bancarios
 */
export function extractRows(data){


    if(!data){

        return [];

    }



    let rows=[];



    /*
       Caso normal
    */

    if(
        Array.isArray(data.registros)
    ){

        rows.push(
            ...data.registros
        );

    }



    /*
       Caso bancos procesados
    */

    if(
        Array.isArray(
            data.bancos_procesados
        )
    ){

        data.bancos_procesados
        .forEach(bank=>{


            if(
                Array.isArray(
                    bank.estado_cuenta
                )
            ){

                rows.push(
                    ...bank.estado_cuenta
                );

            }


        });

    }



    return rows;

}





/**
 * Convierte respuesta final para dashboard
 */
export function parseReportData(data){


    const normalized =
        normalizeMakeData(data);



    return {


        ...normalized,


        rows:
            extractRows(
                normalized
            )

    };


}