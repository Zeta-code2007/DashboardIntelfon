/**
 * INTELFON Dashboard
 * Permissions Manager
 *
 * Responsabilidad:
 * - Controlar accesos por usuario
 * - Validar módulos permitidos
 * - Mantener política de GLOBAL (solo lectura) y GT/SV (operativos)
 */

import { AuthService } from '../services/authService.js';

/**
 * Obtiene usuario actual
 */
export function getCurrentUser() {
    return AuthService.getUser();
}

/**
 * Obtiene la región lógica del usuario.
 */
export function getUserRegion(user = null) {
    const currentUser = user || getCurrentUser();

    if (!currentUser) {
        return null;
    }

    const username = String(currentUser.username || '')
        .toLowerCase()
        .trim();

    if (username === 'intelfon' || username === 'masterintelfon') {
        return 'GLOBAL';
    }

    if (username === 'masterguatemala') {
        return 'GT';
    }

    if (username === 'mastersalvador' || username === 'masterelsalvador') {
        return 'SV';
    }

    if (currentUser.region && ['GLOBAL', 'GT', 'SV'].includes(currentUser.region)) {
        return currentUser.region;
    }

    return null;
}

/**
 * Obtiene rol normalizado del usuario
 */
export function getUserRole(user = null) {
    const currentUser = user || getCurrentUser();

    if (!currentUser) {
        return null;
    }

    return String(currentUser.username || currentUser.role || '')
        .toLowerCase()
        .trim();
}

/**
 * Identifica si el usuario es Master Global
 */
export function isGlobalMaster(user = null) {
    const currentUser = user || getCurrentUser();

    if (!currentUser) {
        return false;
    }

    const role = getUserRole(currentUser);

    return ['intelfon', 'masterintelfon', 'masterglobal'].includes(role)
        || getUserRegion(currentUser) === 'GLOBAL';
}

/**
 * Identifica Master Guatemala
 */
export function isGuatemalaMaster(user = null) {
    const currentUser = user || getCurrentUser();

    if (!currentUser) {
        return false;
    }

    const role = getUserRole(currentUser);

    return ['masterguatemala'].includes(role)
        || getUserRegion(currentUser) === 'GT';
}

/**
 * Identifica Master El Salvador
 */
export function isElSalvadorMaster(user = null) {
    const currentUser = user || getCurrentUser();

    if (!currentUser) {
        return false;
    }

    const role = getUserRole(currentUser);

    return ['mastersalvador', 'masterelsalvador'].includes(role)
        || getUserRegion(currentUser) === 'SV';
}

/**
 * Valida acceso a módulo.
 *
 * Política correcta:
 * - GLOBAL: consulta consolidada y lectura (sin operaciones)
 * - GT/SV: acceso operativo completo
 */
export function canAccess(module, user = null) {
    const currentUser = user || getCurrentUser();

    if (!currentUser) {
        return false;
    }

    const isGlobal = isGlobalMaster(currentUser);
    const isRegional = isGuatemalaMaster(currentUser) || isElSalvadorMaster(currentUser);

    if (isGlobal) {
        return [
            'overview',
            'history',
            'bank-detail',
            'daily-flow',
            'account-detail',
            'reports',
            'resumen',
            'consolidado-general'
        ].includes(module);
    }

    if (isRegional) {
        return [
            'overview',
            'history',
            'bank-detail',
            'daily-flow',
            'account-detail',
            'generator',
            'reports',
            'resumen'
        ].includes(module);
    }

    switch (module) {
        case 'overview':
        case 'history':
        case 'bank-detail':
        case 'daily-flow':
        case 'account-detail':
        case 'reports':
        case 'resumen':
            return true;

        case 'generator':
        case 'users':
        case 'consolidado-general':
            return false;

        default:
            return false;
    }
}

/**
 * Oculta botones según permisos
 */
export function applyPermissions(user = null) {
    const currentUser = user || getCurrentUser();

    if (!currentUser) {
        return;
    }

    const usersButton = document.querySelector('.nav-btn[data-view="users"]');

    if (usersButton) {
        const allowed = canAccess('users', currentUser);
        usersButton.classList.toggle('hidden', !allowed);
        usersButton.style.display = allowed ? 'flex' : 'none';
    }

    const generatorButton = document.querySelector('.nav-btn[data-view="generator"]');

    if (generatorButton) {
        const allowed = canAccess('generator', currentUser);

        if (!allowed) {
            generatorButton.remove();
        }
    }

    const consolidatedButton = document.querySelector('.nav-btn[data-view="consolidado-general"]');

    if (consolidatedButton) {
        const allowed = canAccess('consolidado-general', currentUser);
        consolidatedButton.classList.toggle('hidden', !allowed);
    }
}
