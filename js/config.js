// Configuración global del Dashboard de RED INTELFON

export const CONFIG = {
    // Webhook principal de Make para procesamiento de reportes
    MAKE_WEBHOOK_URL: 'https://hook.eu2.make.com/uf2f68usry02c9ljgb8wcoy634ymbkcf',

    // Webhook de Make para consultar historial de reportes (Notion / Google Sheets)
    HISTORY_WEBHOOK_URL: 'https://hook.eu2.make.com/fa2xcbqi6a9aupb9bby5wqp5wuelk9ea',

    // Alias de compatibilidad hacia el webhook de historial
    HISTORY_ENDPOINT: 'https://hook.eu2.make.com/fa2xcbqi6a9aupb9bby5wqp5wuelk9ea',

    // Identidad visual de RED INTELFON para gráficos (Chart.js)
    THEME: {
        primaryRed: '#DC2626',
        darkRed: '#B91C1C',
        darkGray: '#1F2937',
        lightGray: '#F3F4F6',
        accentBorder: '#E5E7EB'
    }
};
