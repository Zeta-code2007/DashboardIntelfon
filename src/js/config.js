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
    },

    // Regiones operativas y su moneda por defecto
    REGIONS: {
        GT: { code: 'GT', name: 'Guatemala', flag: '🇬🇹', currency: 'GTQ', currencySymbol: 'Q' },
        SV: { code: 'SV', name: 'El Salvador', flag: '🇸🇻', currency: 'USD', currencySymbol: '$' }
    },

    // Credenciales maestras de acceso para demostración / administración
    AUTH: {
        masterUsername: 'intelfon',
        masterEmail: 'admin@intelfon.com',
        defaultUser: 'intelfon',
        defaultPassword: 'intelfon2026',
        sessionKey: 'intelfon_auth_session',

        // Masters regionales: cada uno redirige por defecto a su dashboard de país
        masters: [
            {
                username: 'masterguatemala',
                email: 'masterguatemala@intelfon.com',
                password: 'Guatemala2026',
                name: 'Master Guatemala',
                region: 'GT'
            },
            {
                username: 'mastersalvador',
                email: 'mastersalvador@intelfon.com',
                password: 'Salvador2026',
                name: 'Master El Salvador',
                region: 'SV'
            }
        ]
    },

    // Configuración de tu proyecto de Firebase (Realtime Database)
    // Reemplaza estos valores con los de TU proyecto (Firebase Console -> Configuración del proyecto -> Tus apps)
    FIREBASE: {
        apiKey: "AIzaSyAnh2AINDxk5Dqw7QXZ577mFfYAuR2j63E",
        authDomain: "reportes-bancarios.firebaseapp.com",
        databaseURL: "https://reportes-bancarios-default-rtdb.firebaseio.com",
        projectId: "reportes-bancarios",
        storageBucket: "reportes-bancarios.firebasestorage.app",
        messagingSenderId: "457368392091",
        appId: "1:457368392091:web:0cb70fbb766bbdc5a6913e",
        measurementId: "G-RX3B70LFWS"
        },

    // Ruta raíz en Firebase donde se guarda el estado de sincronización
    SYNC: {
        rootPath: 'intelfon_sync'
    }
};
