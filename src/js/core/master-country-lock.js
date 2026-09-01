/*
 * Red Intelfon - Bloqueo de dashboard por usuario master
 * masterguatemala => GUATEMALA / GTQ
 * mastersalvador | masterelsalvador => EL_SALVADOR / USD
 *
 * Se carga DESPUÉS de dashboard.js.
 * No modifica la lógica de sincronización ni el cálculo financiero.
 */
(() => {
  'use strict';

  const COUNTRY = Object.freeze({
    GT: 'GUATEMALA',
    SV: 'EL_SALVADOR'
  });

  const normalize = (value) => String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '');

  const normalizeCountryCode = (value) => {
    const v = normalize(value);
    if (['guatemala', 'gt', 'gua', 'masterguatemala'].includes(v) || v.includes('masterguatemala')) return COUNTRY.GT;
    if (
      ['elsalvador', 'salvador', 'sv', 'slv', 'mastersalvador', 'masterelsalvador'].includes(v) ||
      v.includes('mastersalvador') ||
      v.includes('masterelsalvador')
    ) return COUNTRY.SV;
    return '';
  };

  function safeStorageValues(storage) {
    if (!storage) return [];
    const keys = [
      'username', 'user', 'usuario', 'currentUser', 'authUser',
      'masterUser', 'master', 'pais', 'country', 'dashboardCountry'
    ];
    const out = [];
    for (const key of keys) {
      try {
        const value = storage.getItem(key);
        if (value) out.push(value);
      } catch (_) {}
    }
    return out;
  }

  function resolveLockedCountry() {
    const params = new URLSearchParams(location.search);
    const candidates = [
      window.DASHBOARD_LOCKED_COUNTRY,
      window.DASHBOARD_MASTER_USER,
      window.CURRENT_USER,
      window.AUTH_USER,
      window.USERNAME,
      window.currentUser && (window.currentUser.username || window.currentUser.user || window.currentUser.name),
      window.user && (window.user.username || window.user.user || window.user.name),
      document.documentElement?.dataset?.user,
      document.body?.dataset?.user,
      params.get('username'),
      params.get('user'),
      params.get('usuario'),
      params.get('master'),
      params.get('country'),
      params.get('pais'),
      location.pathname,
      location.hash,
      ...safeStorageValues(window.sessionStorage),
      ...safeStorageValues(window.localStorage)
    ].filter(Boolean);

    for (const candidate of candidates) {
      const country = normalizeCountryCode(candidate);
      if (country) return country;
    }

    // Último respaldo: metadata entregada por el servidor.
    const meta = window.DASHBOARD_BASE_DATA?.meta || {};
    return normalizeCountryCode(meta.lockedCountry || meta.country || meta.pais);
  }

  const lockedCountry = resolveLockedCountry();

  if (!lockedCountry) {
    console.warn('[Intelfon] No se pudo determinar el master actual; no se aplicó bloqueo de país.');
    return;
  }

  const config = lockedCountry === COUNTRY.SV
    ? { country: COUNTRY.SV, label: 'El Salvador', currency: 'USD', symbol: '$' }
    : { country: COUNTRY.GT, label: 'Guatemala', currency: 'GTQ', symbol: 'Q' };

  window.INTELFON_MASTER_ACCESS = Object.freeze({ ...config });

  function forceRuntimeCountry() {
    // ACTIVE_COUNTRY es "let" global en dashboard.js; esta asignación funciona
    // al ser scripts clásicos dentro del mismo contexto global.
    try {
      if (typeof ACTIVE_COUNTRY !== 'undefined') ACTIVE_COUNTRY = config.country;
    } catch (_) {}

    // Moneda fija por país. No permitimos convertir SV a Q ni GT a USD
    // dentro de una sesión master.
    try {
      if (typeof COUNTRY_CURRENCY_VIEW !== 'undefined' && COUNTRY_CURRENCY_VIEW) {
        COUNTRY_CURRENCY_VIEW.GUATEMALA = 'GTQ';
        COUNTRY_CURRENCY_VIEW.EL_SALVADOR = 'USD';
      }
    } catch (_) {}

    window.DASHBOARD_LOCKED_COUNTRY = config.country;
  }

  function removeCrossCountryAccess() {
    const other = config.country === COUNTRY.GT ? COUNTRY.SV : COUNTRY.GT;

    // Un master no necesita selector de país: su país ya está definido por acceso.
    document.querySelectorAll('#countrySwitcher, .country-switcher').forEach(el => {
      el.hidden = true;
      el.style.display = 'none';
      el.setAttribute('aria-hidden', 'true');
    });

    document.querySelectorAll('[data-country]').forEach(el => {
      const country = normalizeCountryCode(el.getAttribute('data-country'));
      if (country && country !== config.country) {
        el.remove();
      } else if (country === config.country) {
        el.setAttribute('aria-current', 'true');
        if ('disabled' in el) el.disabled = true;
      }
    });

    // Solo dejamos visible información/controles del país autorizado.
    document.querySelectorAll('[data-currency-country]').forEach(el => {
      const country = normalizeCountryCode(el.getAttribute('data-currency-country'));
      const visible = country === config.country;
      el.hidden = !visible;
      el.style.display = visible ? '' : 'none';
    });

    // Para master la moneda local es fija.
    const gtToggle = document.getElementById('currency-toggle-gt');
    const svToggle = document.getElementById('currency-toggle-sv');
    if (gtToggle) {
      gtToggle.checked = false;
      gtToggle.disabled = true;
    }
    if (svToggle) {
      svToggle.checked = false;
      svToggle.disabled = true;
    }

    // Oculta cualquier enlace evidente al otro país.
    document.querySelectorAll('a[href], button[data-href]').forEach(el => {
      const target = String(el.getAttribute('href') || el.getAttribute('data-href') || '');
      const targetCountry = normalizeCountryCode(target);
      if (targetCountry === other) {
        el.remove();
      }
    });

    // Etiquetas del dashboard siempre coherentes con la sesión master.
    document.querySelectorAll('.countryLabel').forEach(el => {
      el.textContent = config.label;
    });
    document.querySelectorAll('.currencyLabel').forEach(el => {
      el.textContent = `${config.currency} (${config.symbol})`;
    });
  }

  function rebuildDashboardForLockedCountry() {
    forceRuntimeCountry();

    try {
      if (typeof bankFilter !== 'undefined' && bankFilter) bankFilter.value = 'ALL';
    } catch (_) {}

    try {
      if (
        typeof buildFiltered === 'function' &&
        typeof MIN_DATE !== 'undefined' &&
        typeof MAX_DATE !== 'undefined'
      ) {
        const from = (typeof dateFrom !== 'undefined' && dateFrom?.value) ? dateFrom.value : MIN_DATE;
        const to = (typeof dateTo !== 'undefined' && dateTo?.value) ? dateTo.value : MAX_DATE;
        DATA = buildFiltered(from || MIN_DATE, to || MAX_DATE);
      }
    } catch (error) {
      console.error('[Intelfon] No se pudo reconstruir el dashboard bloqueado:', error);
    }

    try {
      if (typeof renderAll === 'function') renderAll();
    } catch (error) {
      console.error('[Intelfon] Error al renderizar dashboard bloqueado:', error);
    }

    removeCrossCountryAccess();
  }

  // Bloqueo de seguridad de UI en fase de captura: ni un listener viejo puede
  // cambiar el país después de iniciar sesión.
  document.addEventListener('click', (event) => {
    const target = event.target?.closest?.('[data-country], a[href]');
    if (!target) return;

    const declared = target.getAttribute('data-country') || target.getAttribute('href') || '';
    const targetCountry = normalizeCountryCode(declared);

    if (targetCountry && targetCountry !== config.country) {
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
      forceRuntimeCountry();
    }
  }, true);

  // Evita que código legado reactive el selector al re-renderizar.
  const observer = new MutationObserver(() => removeCrossCountryAccess());

  function init() {
    forceRuntimeCountry();
    rebuildDashboardForLockedCountry();
    removeCrossCountryAccess();

    if (document.body) {
      observer.observe(document.body, { childList: true, subtree: true, attributes: true });
    }

    console.info(`[Intelfon] Acceso master bloqueado: ${config.label} · ${config.currency}`);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }

  // API mínima para pruebas/control desde el resto del proyecto.
  window.IntelfonMasterCountry = Object.freeze({
    get country() { return config.country; },
    get currency() { return config.currency; },
    enforce: rebuildDashboardForLockedCountry
  });
})();
