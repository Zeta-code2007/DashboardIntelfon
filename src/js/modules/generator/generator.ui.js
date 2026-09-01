/**
 * Generator UI
 *
 * Responsabilidad:
 * - Renderizar interfaz
 * - Mostrar estados
 * - Actualizar componentes visuales
 */


/**
 * Escapa HTML básico
 */
function escapeHtml(value){

    if(value === null || value === undefined){
        return '';
    }

    return String(value)
        .replace(/&/g,'&amp;')
        .replace(/</g,'&lt;')
        .replace(/>/g,'&gt;')
        .replace(/"/g,'&quot;')
        .replace(/'/g,'&#039;');

}




/**
 * Render principal del módulo
 */
export function renderGenerator(container){


    if(!container){
        return;
    }


    container.innerHTML = `

        <section class="generator-container">


            <div class="generator-header">

                <h2>
                    Generador de Reportes Bancarios
                </h2>


                <p>
                    Carga tus estados de cuenta para generar el análisis financiero.
                </p>

            </div>



            <div class="generator-upload">


                <div 
                    id="drop-zone"
                    class="drop-zone"
                >

                    <span>
                        Arrastra tus archivos Excel aquí
                    </span>


                    <small>
                        o selecciona manualmente
                    </small>


                    <input 
                        id="file-input"
                        type="file"
                        multiple
                        accept=".xlsx"
                    >

                </div>


            </div>



            <div 
                id="files-preview"
                class="files-preview"
            ></div>



            <div class="generator-actions">


                <button
                    id="generate-report"
                    class="btn-primary"
                >

                    Generar Reporte

                </button>


                <button
                    id="clear-files"
                    class="btn-secondary"
                >

                    Limpiar

                </button>


            </div>




            <div 
                id="generator-status"
                class="generator-status"
            ></div>



            <div 
                id="generator-results"
            ></div>



        </section>

    `;


}




/**
 * Render archivos seleccionados
 */
export function renderFiles(files){


    const container =
        document.getElementById(
            'files-preview'
        );


    if(!container){
        return;
    }



    if(!files.length){

        container.innerHTML =
            `
            <p>
                No hay archivos seleccionados
            </p>
            `;

        return;

    }



    container.innerHTML =
        files.map(file=>{


            return `

            <div class="file-card">


                <strong>
                    ${escapeHtml(file.name)}
                </strong>


                <span>
                    ${formatBytes(file.size)}
                </span>


            </div>

            `;


        }).join('');

}





/**
 * Formato tamaño archivo
 */
function formatBytes(bytes){


    if(!bytes){
        return '0 B';
    }


    const sizes =
    [
        'B',
        'KB',
        'MB',
        'GB'
    ];


    const index =
        Math.floor(
            Math.log(bytes)
            /
            Math.log(1024)
        );


    return (

        parseFloat(
            (
                bytes /
                Math.pow(
                    1024,
                    index
                )

            )
            .toFixed(2)
        )

        +
        ' '
        +
        sizes[index]

    );


}





/**
 * Actualiza estado del proceso
 */
export function showStatus(
    message,
    type='info'
){


    const box =
        document.getElementById(
            'generator-status'
        );


    if(!box){
        return;
    }



    box.className =
        `generator-status ${type}`;


    box.innerHTML =
        `
        <span>
            ${escapeHtml(message)}
        </span>
        `;


}





/**
 * Limpia mensajes
 */
export function clearStatus(){


    const box =
        document.getElementById(
            'generator-status'
        );


    if(box){

        box.innerHTML='';

    }

}





/**
 * Render resumen financiero
 */
export function renderSummaryCards(summary){


    const container =
        document.getElementById(
            'generator-results'
        );


    if(!container){
        return;
    }



    if(!summary){

        container.innerHTML='';

        return;

    }



    container.innerHTML = `


    <div class="summary-grid">


        <div class="summary-card">

            <h4>
                Bancos Procesados
            </h4>

            <strong>
                ${summary.bancos || 0}
            </strong>

        </div>




        <div class="summary-card">

            <h4>
                Registros
            </h4>

            <strong>
                ${summary.registros || 0}
            </strong>

        </div>




        <div class="summary-card">

            <h4>
                Estado
            </h4>

            <strong>
                Finalizado
            </strong>

        </div>



    </div>


    `;


}





/**
 * Mostrar error general
 */
export function showError(message){


    showStatus(
        message,
        'error'
    );


}





/**
 * Mostrar cargando
 */
export function showLoading(){


    showStatus(
        'Procesando información, espere por favor...',
        'loading'
    );


}





/**
 * Ocultar cargando
 */
export function hideLoading(){

    clearStatus();

}