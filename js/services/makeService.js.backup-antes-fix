import { CONFIG } from '../config.js';

function readAsBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result).split(',')[1] || '');
        reader.onerror = () => reject(new Error(`No se pudo leer ${file.name}.`));
        reader.readAsDataURL(file);
    });
}

export async function enviarArchivosAMake(files, tipoReporte, options = {}) {
    if (!CONFIG.MAKE_WEBHOOK_URL) {
        throw new Error('La URL del Webhook de Make (CONFIG.MAKE_WEBHOOK_URL) no está configurada.');
    }

    if (!Array.isArray(files) || files.length < 1 || files.length > 10 || files.some(file => !file)) {
        throw new Error('Debes seleccionar entre 1 y 10 archivos Excel (.xlsx).');
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

    const region = options.region === 'SV' ? 'SV' : 'GT';
    const pais = String(options.country || (region === 'SV' ? 'El Salvador' : 'Guatemala'));
    const executionId = String(options.executionId || '').trim();

    const formData = new FormData();
    formData.append('files', JSON.stringify(payloadFiles));
    formData.append('tipoReporte', tipoReporte || 'bancario');

    // Make blueprint ya usa pais y ejecucion_id.
    formData.append('pais', pais);
    formData.append('region', region);
    if (executionId) {
        formData.append('ejecucion_id', executionId);
        formData.append('execution_id', executionId);
    }

    let response;
    try {
        response = await fetch(CONFIG.MAKE_WEBHOOK_URL, {
            method: 'POST',
            body: formData
        });
    } catch (networkError) {
        throw new Error(`Error de red al conectar con Make: ${networkError.message || 'No se pudo contactar el servidor'}.`);
    }

    if (!response.ok) {
        let errorDetails = '';
        try { errorDetails = await response.text(); } catch (_) { errorDetails = response.statusText; }

        if (response.status === 500) {
            throw new Error('El escenario en Make.com falló internamente (HTTP 500). Revisa History / Incomplete executions.');
        }

        throw new Error(`Error en Make (${response.status}): ${errorDetails || response.statusText || 'Petición no completada'}`);
    }

    const responseText = await response.text();
    console.log(`[MakeService] HTTP ${response.status}; ${responseText.length} bytes; ${pais}; ejecución ${executionId || 'sin-id'}.`);

    if (!responseText || responseText.trim() === '') {
        throw new Error('El Webhook de Make respondió correctamente pero sin cuerpo.');
    }

    const trimmed = responseText.trim();

    if (trimmed.toLowerCase() === 'accepted') {
        return {
            accepted: true,
            asincrono: true,
            estado: 'Archivos recibidos y procesamiento iniciado en Make.com',
            mensaje: 'Make.com recibió los archivos y continúa en segundo plano.',
            archivosProcesados: files.length,
            pais,
            region,
            ejecucion_id: executionId || null,
            fechaEnvio: new Date().toISOString()
        };
    }

    let data;
    try {
        data = JSON.parse(responseText);
    } catch (_) {
        try {
            const sanitized = responseText
                .replace(/,\s*([}\]])/g, '$1')
                .replace(/[\u0000-\u001F]+/g, match =>
                    (match === '\n' || match === '\r' || match === '\t') ? match : ''
                );
            data = JSON.parse(sanitized);
        } catch (_) {
            return {
                accepted: true,
                asincrono: true,
                estado: 'Respuesta recibida de Make.com',
                mensaje: responseText.substring(0, 300),
                archivosProcesados: files.length,
                pais,
                region,
                ejecucion_id: executionId || null,
                fechaEnvio: new Date().toISOString()
            };
        }
    }

    if (typeof data === 'string') {
        try { data = JSON.parse(data); } catch (_) {}
    }

    return data;
}
