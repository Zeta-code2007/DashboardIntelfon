import { CONFIG } from '../config.js';

/**
 * Envía el archivo y el tipo de reporte al Webhook de Make.com para su procesamiento real.
 * Realiza una petición POST multipart/form-data y retorna los datos JSON procesados.
 *
 * @param {File} file - Archivo seleccionado (debe ser formato .xlsx para ser compatible con openpyxl en Make).
 * @param {string} tipoReporte - Tipo de reporte seleccionado (Ventas, Inventario, Ejecutivo).
 * @returns {Promise<Object>} Promesa que resuelve al objeto con la estructura de respuesta de Make.
 */
export async function enviarArchivoAMake(file, tipoReporte) {
    if (!CONFIG.MAKE_WEBHOOK_URL) {
        throw new Error('La URL del Webhook de Make (CONFIG.MAKE_WEBHOOK_URL) no está configurada.');
    }

    if (!file) {
        throw new Error('Debes seleccionar un archivo válido antes de procesar.');
    }

    // El flujo de Make procesa el archivo con Python openpyxl y valida que sea un XLSX real
    const fileNameLower = file.name.toLowerCase();
    if (!fileNameLower.endsWith('.xlsx')) {
        throw new Error('El archivo seleccionado debe ser un archivo Excel válido con extensión .xlsx (los formatos .csv o .xls no son soportados por el escenario en Make).');
    }

    // Preparar carga multipart/form-data estándar
    const formData = new FormData();
    formData.append('file', file, file.name);
    formData.append('filename', file.name);
    formData.append('tipoReporte', tipoReporte || 'bancario');

    let response;
    try {
        response = await fetch(CONFIG.MAKE_WEBHOOK_URL, {
            method: 'POST',
            body: formData
        });
    } catch (networkError) {
        throw new Error(`Error de red al conectar con Make: ${networkError.message || 'No se pudo contactar el servidor'}. Verifica tu conexión a Internet o bloqueadores de CORS.`);
    }

    if (!response.ok) {
        let errorDetails = '';
        try {
            errorDetails = await response.text();
        } catch (_) {
            errorDetails = response.statusText;
        }

        if (response.status === 500) {
            throw new Error(`El escenario en Make.com falló internamente durante la ejecución (HTTP 500: Scenario failed to complete). Por favor revisa el historial de ejecuciones en Make.com ("History / Incomplete executions") para identificar el módulo específico que falló (ej. Python, OpenAI, Google Drive o Gmail).`);
        }

        throw new Error(`Error en el servidor de Make (${response.status}): ${errorDetails || response.statusText || 'Petición no completada'}`);
    }

    // Obtener y parsear el cuerpo de la respuesta de Make
    const responseText = await response.text();
    console.log('[MakeService] Respuesta RAW recibida de Make (HTTP ' + response.status + '):', responseText);

    if (!responseText || responseText.trim() === '') {
        throw new Error('El Webhook de Make respondió exitosamente (200 OK) pero con el cuerpo vacío. Verifica que el módulo Webhook Respond esté activo y conectado al final de la ruta del escenario.');
    }

    const trimmed = responseText.trim();
    if (trimmed === 'Accepted') {
        throw new Error('Make.com recibió el archivo pero respondió "Accepted" (asíncrono) sin devolver los datos del reporte. Esto ocurre cuando el escenario en Make no tiene el módulo "Webhook response" al final del flujo o no se ha importado el blueprint corregido.');
    }

    let data;
    try {
        data = JSON.parse(responseText);
    } catch (e) {
        throw new Error(`Make.com devolvió una respuesta que no es JSON válido: "${responseText.substring(0, 150)}...". Asegúrate de que el último módulo en Make sea "Webhook response" y devuelva un JSON.`);
    }

    // Si el JSON viene con doble codificación como string
    if (typeof data === 'string') {
        try {
            data = JSON.parse(data);
        } catch (_) { }
    }

    console.log('[MakeService] Objeto final parseado:', data);
    return data;
}