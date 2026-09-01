import { CONFIG } from '../config.js';

/**
 * Consulta el historial de reportes bancarios guardados en Google Sheets a través de Make.com.
 * Normaliza los campos (ID, fecha, archivo, estado, descarga) para garantizar su renderizado.
 * @returns {Promise<Array>}
 */
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
        const rawList = Array.isArray(data) ? data : (data.reportes || data.rows || data.data || []);
        
        return rawList.map((item, index) => {
            if (typeof item !== 'object' || item === null) return item;

            // Búsqueda flexible de ID de reporte
            const id = item.ID_Reporte || item.id || item.ID || item.Codigo || item.Id || item['ID Reporte'] || item['Id Reporte'] || item.reportId || `REP-${String(index + 1).padStart(3, '0')}`;
            
            // Búsqueda flexible de fecha
            const fecha = item.Fecha || item.fecha || item.Fecha_Creacion || item.fecha_creacion || item.Date || item.date || item.timestamp || 'Reciente';
            
            // Búsqueda flexible de nombre de archivo
            const nombreArchivo = item.Nombre_Archivo || item.nombreArchivo || item.nombre || item.Archivo || item.archivo || item.Name || item.filename || 'Reporte_Bancario.xlsx';
            
            // Búsqueda flexible de estado
            const estado = item.Estado || item.estado || item.Status || item.status || 'Completado';
            
            // Búsqueda flexible de URL de descarga
            const urlDescarga = item.URL_Descarga || item.urlDescarga || item.url || item.link || item.downloadUrl || item.webViewLink || item.File_Url || '#';

            return {
                id: String(id),
                fecha: String(fecha),
                nombreArchivo: String(nombreArchivo),
                tipo: item.Tipo || item.tipo || 'Bancario',
                estado: String(estado),
                urlDescarga: String(urlDescarga),
                raw: item
            };
        });
    } catch (error) {
        console.error('Error obteniendo historial de Make/Google Sheets:', error);
        return [];
    }
}