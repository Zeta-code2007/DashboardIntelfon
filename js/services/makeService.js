import { CONFIG } from '../config.js';

/**
 * Envía el archivo y el tipo de reporte al Webhook de Make.com para su procesamiento real.
 * Realiza una petición POST multipart/form-data y retorna los datos JSON procesados.
 *
 * @param {File[]} files - Archivos de Guatemala y El Salvador.
 * @param {string} tipoReporte - Tipo de reporte seleccionado (Ventas, Inventario, Ejecutivo).
 * @returns {Promise<Object>} Promesa que resuelve al objeto con la estructura de respuesta de Make.
 */
function readAsBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result).split(',')[1] || '');
        reader.onerror = () => reject(new Error(`No se pudo leer ${file.name}.`));
        reader.readAsDataURL(file);
    });
}

export async function enviarArchivosAMake(files, tipoReporte) {
    if (!CONFIG.MAKE_WEBHOOK_URL) {
        throw new Error('La URL del Webhook de Make (CONFIG.MAKE_WEBHOOK_URL) no está configurada.');
    }

    if (!Array.isArray(files) || files.length < 2 || files.length > 11 || files.some(file => !file)) {
        throw new Error('Debes seleccionar 1 archivo de Guatemala y entre 1 y 10 archivos de El Salvador (máximo 11 archivos en total).');
    }

    for (const file of files) {
        if (!file.name.toLowerCase().endsWith('.xlsx')) {
            throw new Error(`El archivo ${file.name} debe ser un Excel .xlsx.`);
        }
    }

    const payloadFiles = await Promise.all(files.map(async file => ({
        name: file.name,
        data: await readAsBase64(file),
        mimeType: file.type || 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    })));
    const formData = new FormData();
    formData.append('files', JSON.stringify(payloadFiles));
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
    console.log('[MakeService] Respuesta recibida de Make (HTTP ' + response.status + ', tamaño ' + responseText.length + ').');

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
        // Intentar limpiar y reparar problemas comunes en respuestas de Make (trailing commas, comillas o caracteres de escape)
        try {
            const sanitized = responseText
                .replace(/,\s*([}\]])/g, '$1')
                .replace(/[\u0000-\u001F]+/g, (match) => {
                    if (match === '\n' || match === '\r' || match === '\t') return match;
                    return '';
                });
            data = JSON.parse(sanitized);
        } catch (repairErr) {
            console.error('[MakeService] Error al parsear JSON original:', e);
            console.error('[MakeService] Texto de respuesta recibido:', responseText);
            throw new Error(`Make.com devolvió una respuesta que no es JSON válido: "${responseText.substring(0, 150)}...". Asegúrate de que el último módulo en Make sea "Webhook response" y devuelva un JSON.`);
        }
    }

    // Si el JSON viene con doble codificación como string
    if (typeof data === 'string') {
        try {
            data = JSON.parse(data);
        } catch (_) { }
    }

    console.log('[MakeService] Respuesta JSON recibida y procesada correctamente.');
    return data;
}
