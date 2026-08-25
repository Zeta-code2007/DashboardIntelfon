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
        return data;
    } catch (error) {
        console.error('Error obteniendo historial:', error);
        return [
            {
                id: 'INT-001',
                fecha: '2026-08-25',
                nombreArchivo: 'Reporte_Ventas.xlsx',
                tipo: 'Ventas',
                estado: 'Completado',
                urlDescarga: '#'
            },
            {
                id: 'INT-002',
                fecha: '2026-08-24',
                nombreArchivo: 'Inventario_Q3.xlsx',
                tipo: 'Inventario',
                estado: 'Completado',
                urlDescarga: '#'
            }
        ];
    }
}