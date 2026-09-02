import { CONFIG } from '../core/config.js';
import { AuthService } from './authService.js';
import { RegionService } from './regionService.js';

/**
 * Lee un archivo y devuelve únicamente el contenido Base64.
 */
function readAsBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = () => {
            const result = String(reader.result || '');
            resolve(result.includes(',') ? result.split(',')[1] : result);
        };

        reader.onerror = () => {
            reject(new Error(`No se pudo leer ${file?.name || 'el archivo'}.`));
        };

        reader.readAsDataURL(file);
    });
}

/**
 * Genera un identificador único para la ejecución.
 */
function createExecutionId(region = 'GT') {
    if (globalThis.crypto?.randomUUID) {
        return `${region}-${crypto.randomUUID()}`;
    }

    return `${region}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

/**
 * Obtiene el ID actual desde options o desde el estado que ya maneja generator.js.
 */
function resolveExecutionId(options = {}, region = 'GT') {
    const candidates = [
        options.executionId,
        options.ejecucion_id,
        options.execution_id,
        sessionStorage.getItem('intelfon_processing_id'),
        localStorage.getItem('intelfon_processing_id'),
        sessionStorage.getItem('intelfon_execution_id'),
        localStorage.getItem('intelfon_execution_id'),
        sessionStorage.getItem('ejecucion_id'),
        localStorage.getItem('ejecucion_id')
    ];

    let executionId = candidates
        .map(value => String(value || '').trim())
        .find(Boolean);

    if (!executionId) {
        executionId = createExecutionId(region);
    }

    try {
        sessionStorage.setItem('intelfon_execution_id', executionId);
        sessionStorage.setItem('ejecucion_id', executionId);
        localStorage.setItem('intelfon_processing_id', executionId);
    } catch (_) {}

    return executionId;
}

/**
 * Normaliza la región activa.
 */
function resolveRegion(options = {}) {
    const explicitRegion = String(options.region || '').trim().toUpperCase();

    if (explicitRegion === 'GT' || explicitRegion === 'SV') {
        return explicitRegion;
    }

    try {
        const activeRegion = RegionService.getActiveRegion();

        if (activeRegion === 'GT' || activeRegion === 'SV') {
            return activeRegion;
        }
    } catch (_) {}

    const country = String(
        options.country ||
        options.pais ||
        ''
    ).trim().toLowerCase();

    if (
        country.includes('salvador') ||
        country === 'sv' ||
        country === 'slv'
    ) {
        return 'SV';
    }

    if (
        country.includes('guatemala') ||
        country.includes('guat') ||
        country === 'gt' ||
        country === 'gtm'
    ) {
        return 'GT';
    }

    throw new Error(
        'No fue posible determinar la región del reporte. Debe ser GT o SV.'
    );
}

/**
 * Devuelve el país oficial según la región.
 */
function resolveCountry(region, options = {}) {
    if (region === 'SV') {
        return 'El Salvador';
    }

    if (region === 'GT') {
        return 'Guatemala';
    }

    const candidate = String(
        options.country ||
        options.pais ||
        ''
    ).trim();

    if (candidate) {
        return candidate;
    }

    throw new Error('No fue posible determinar el país del reporte.');
}

/**
 * Procesa la respuesta de Make.
 */
function parseMakeResponse(responseText, context) {
    const trimmed = String(responseText || '').trim();

    if (!trimmed) {
        throw new Error(
            'El Webhook de Make respondió correctamente pero con el cuerpo vacío.'
        );
    }

    if (trimmed.toLowerCase() === 'accepted') {
        return {
            accepted: true,
            asincrono: true,
            estado: 'procesando',
            mensaje: 'Make.com recibió los archivos y continúa procesando en segundo plano.',
            archivosProcesados: context.filesCount,
            pais: context.pais,
            region: context.region,
            ejecucion_id: context.executionId,
            execution_id: context.executionId,
            fechaEnvio: new Date().toISOString()
        };
    }

    let data;

    try {
        data = JSON.parse(trimmed);
    } catch (_) {
        try {
            const sanitized = trimmed
                .replace(/,\s*([}\]])/g, '$1')
                .replace(/[\u0000-\u001F]+/g, match => {
                    if (
                        match === '\n' ||
                        match === '\r' ||
                        match === '\t'
                    ) {
                        return match;
                    }

                    return '';
                });

            data = JSON.parse(sanitized);
        } catch (_) {
            return {
                accepted: true,
                asincrono: true,
                estado: 'procesando',
                mensaje: trimmed.substring(0, 300),
                archivosProcesados: context.filesCount,
                pais: context.pais,
                region: context.region,
                ejecucion_id: context.executionId,
                execution_id: context.executionId,
                fechaEnvio: new Date().toISOString()
            };
        }
    }

    if (typeof data === 'string') {
        try {
            data = JSON.parse(data);
        } catch (_) {}
    }

    if (
        data &&
        typeof data === 'object' &&
        !Array.isArray(data)
    ) {
        if (!data.pais) {
            data.pais = context.pais;
        }

        if (!data.region) {
            data.region = context.region;
        }

        if (!data.ejecucion_id) {
            data.ejecucion_id = context.executionId;
        }

        if (!data.execution_id) {
            data.execution_id = context.executionId;
        }
    }

    return data;
}

/**
 * Envía archivos Excel a Make.com.
 *
 * Compatible con:
 *
 * enviarArchivosAMake(files, tipoReporte)
 *
 * y:
 *
 * enviarArchivosAMake(files, tipoReporte, {
 *     region: 'GT',
 *     country: 'Guatemala',
 *     executionId: '...'
 * })
 */
export async function enviarArchivosAMake(
    files,
    tipoReporte,
    options = {}
) {
    if (!CONFIG.MAKE_WEBHOOK_URL) {
        throw new Error(
            'La URL del Webhook de Make (CONFIG.MAKE_WEBHOOK_URL) no está configurada.'
        );
    }

    if (
        !Array.isArray(files) ||
        files.length < 1 ||
        files.length > 10 ||
        files.some(file => !file)
    ) {
        throw new Error(
            'Debes seleccionar entre 1 y 10 archivos Excel (.xlsx).'
        );
    }

    for (const file of files) {
        if (
            !String(file.name || '')
                .toLowerCase()
                .endsWith('.xlsx')
        ) {
            throw new Error(
                `El archivo ${file.name || 'seleccionado'} debe ser un Excel .xlsx.`
            );
        }
    }

    const currentUser = AuthService.getUser();
    const userRegion = currentUser
        ? RegionService.getActiveRegion()
        : null;

    if (userRegion !== 'GT' && userRegion !== 'SV') {
        throw new Error(
            userRegion === 'GLOBAL'
                ? 'El usuario global no puede ejecutar procesos operativos.'
                : 'El usuario no tiene una región operativa autorizada para ejecutar procesos.'
        );
    }

    const region = resolveRegion(options);
    const pais = resolveCountry(region, options);
    const executionId = resolveExecutionId(
        options,
        region
    );

    const payloadFiles = await Promise.all(
        files.map(async file => ({
            name: file.name,
            data: await readAsBase64(file),
            mimeType:
                file.type ||
                'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            pais,
            region,
            ejecucion_id: executionId
        }))
    );

    const formData = new FormData();

    formData.append(
        'files',
        JSON.stringify(payloadFiles)
    );

    formData.append(
        'tipoReporte',
        tipoReporte || 'bancario'
    );

    formData.append(
        'pais',
        pais
    );

    formData.append(
        'region',
        region
    );

    formData.append(
        'ejecucion_id',
        executionId
    );

    formData.append(
        'execution_id',
        executionId
    );

    formData.append(
        'cantidad_archivos',
        String(files.length)
    );

    formData.append(
        'origen',
        'dashboard-intelfon'
    );

    formData.append(
        'fecha_envio',
        new Date().toISOString()
    );

    console.log(
        '[MakeService] Enviando a Make:',
        {
            pais,
            region,
            ejecucion_id: executionId,
            execution_id: executionId,
            tipoReporte: tipoReporte || 'bancario',
            archivos: payloadFiles.map(file => file.name)
        }
    );

    let response;

    try {
        response = await fetch(
            CONFIG.MAKE_WEBHOOK_URL,
            {
                method: 'POST',
                body: formData
            }
        );
    } catch (networkError) {
        throw new Error(
            `Error de red al conectar con Make: ${
                networkError?.message ||
                'No se pudo contactar el servidor'
            }.`
        );
    }

    const responseText = await response.text();

    console.log(
        `[MakeService] HTTP ${response.status}; ` +
        `${responseText.length} bytes; ` +
        `${pais}; ${region}; ` +
        `ejecución ${executionId}.`
    );

    if (!response.ok) {
        if (response.status === 500) {
            throw new Error(
                `El escenario de Make.com falló internamente ` +
                `(HTTP 500). ` +
                `Ejecución enviada: ${executionId}. ` +
                `Revisa History / Incomplete executions.`
            );
        }

        throw new Error(
            `Error en Make (${response.status}): ` +
            `${responseText ||
                response.statusText ||
                'Petición no completada'}`
        );
    }

    return parseMakeResponse(
        responseText,
        {
            pais,
            region,
            executionId,
            filesCount: files.length
        }
    );
}