import { CONFIG } from '../config.js';

/**
 * Envía el archivo y el tipo de reporte al Webhook de Make.com para su procesamiento real.
 * Realiza una petición POST multipart/form-data y retorna los datos JSON procesados.
 *
 * @param {File[]} files - Archivos de Guatemala y El Salvador.
 * @param {string} tipoReporte - Tipo de reporte seleccionado (Ventas, Inventario, Ejecutivo).
 * @returns {Promise<Object>} Promesa que resuelve al objeto con la estructura de respuesta de Make.
 */
/**
 * Repara problemas comunes de JSON inválido que llegan desde Make cuando el escenario
 * arma la respuesta del Webhook interpolando texto plano en lugar de generar JSON real.
 *
 * Recorre el texto carácter por carácter (respetando si está dentro de un string) para:
 *  1) Escapar saltos de línea / tabs / retornos de carro crudos que hayan quedado
 *     DENTRO de un valor de texto (esto es lo que más rompe el parseo cuando el Excel
 *     original trae celdas con saltos de línea).
 *  2) Fuera de los strings: reemplazar tokens que no son JSON válido (NaN, Infinity,
 *     -Infinity, y los equivalentes de Python None/True/False) por su equivalente JSON.
 *  3) Quitar comas sobrantes antes de "}" o "]".
 *
 * @param {string} text
 * @returns {string}
 */
function sanitizeMakeJsonText(text) {
    let result = '';
    let inString = false;
    let escaped = false;

    for (let i = 0; i < text.length; i++) {
        const ch = text[i];

        if (inString) {
            if (escaped) {
                result += ch;
                escaped = false;
                continue;
            }
            if (ch === '\\') {
                result += ch;
                escaped = true;
                continue;
            }
            if (ch === '"') {
                result += ch;
                inString = false;
                continue;
            }
            const code = ch.charCodeAt(0);
            if (code < 0x20) {
                // Carácter de control crudo dentro de un string: JSON no lo permite sin escapar.
                if (ch === '\n') result += '\\n';
                else if (ch === '\r') result += '\\r';
                else if (ch === '\t') result += '\\t';
                else result += '\\u' + code.toString(16).padStart(4, '0');
                continue;
            }
            result += ch;
            continue;
        }

        if (ch === '"') {
            inString = true;
            result += ch;
            continue;
        }
        result += ch;
    }

    return result
        // Comas sobrantes antes de cerrar objeto/array
        .replace(/,\s*([}\]])/g, '$1')
        // NaN / Infinity / -Infinity como valores (fuera de strings, ya no hay riesgo de tocar texto)
        .replace(/([:,\[]\s*)NaN\b/g, '$1null')
        .replace(/([:,\[]\s*)-?Infinity\b/g, '$1null')
        // Tokens de Python que a veces se cuelan en vez de sus equivalentes JSON
        .replace(/([:,\[]\s*)None\b/g, '$1null')
        .replace(/([:,\[]\s*)True\b/g, '$1true')
        .replace(/([:,\[]\s*)False\b/g, '$1false');
}

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
    if (trimmed === 'Accepted' || trimmed.toLowerCase() === 'accepted') {
        console.log('[MakeService] Make.com aceptó los archivos en modo asíncrono (200 Accepted).');
        return {
            accepted: true,
            asincrono: true,
            estado: 'Archivos recibidos y procesamiento iniciado en Make.com',
            mensaje: 'Make.com ha recibido los archivos con éxito y el escenario se está ejecutando en segundo plano.',
            archivosProcesados: files.length,
            fechaEnvio: new Date().toISOString()
        };
    }

    let data;
    try {
        data = JSON.parse(responseText);
    } catch (e) {
        // Intentar limpiar y reparar problemas comunes en respuestas de Make:
        // - saltos de línea / tabs / retornos de carro SIN escapar dentro de un valor de texto
        //   (muy común cuando Make arma el JSON con interpolación de texto plano y el Excel
        //   trae celdas con saltos de línea)
        // - comas sobrantes antes de "}" o "]"
        // - NaN / Infinity / -Infinity generados por cálculos de Python con datos vacíos (no son JSON válido)
        // - tokens de Python (None / True / False) filtrados por error hacia la respuesta
        try {
            const sanitized = sanitizeMakeJsonText(responseText);
            data = JSON.parse(sanitized);
            console.warn('[MakeService] La respuesta de Make traía JSON inválido; se reparó automáticamente antes de parsear.');
        } catch (repairErr) {
            console.warn('[MakeService] La respuesta de Make es texto plano (200 OK) y no se pudo reparar:', responseText);
            return {
                accepted: true,
                asincrono: true,
                estado: 'Respuesta recibida de Make.com',
                mensaje: responseText.substring(0, 300),
                archivosProcesados: files.length,
                fechaEnvio: new Date().toISOString()
            };
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
