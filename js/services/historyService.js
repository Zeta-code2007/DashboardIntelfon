import { CONFIG } from '../config.js';

export async function obtenerHistorialReportes() {
    const endpoint = CONFIG.HISTORY_WEBHOOK_URL || CONFIG.HISTORY_ENDPOINT;
    try {
        const response = await fetch(endpoint, {
            method: 'GET'
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        if (Array.isArray(data)) return data;
        if (data && Array.isArray(data.reportes)) return data.reportes;
        if (data && Array.isArray(data.rows)) return data.rows;
        if (data && Array.isArray(data.data)) return data.data;
        return [];
    } catch (error) {
        console.error('Error obteniendo historial de Make/Google Sheets:', error);
        return [];
    }
}