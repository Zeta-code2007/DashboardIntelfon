/*
 * Red Intelfon - Estado de archivo de la ejecución ACTUAL.
 *
 * Soluciona el estado legado que quedaba "Subido" por encontrar un archivo
 * de una ejecución anterior. Solo muestra "Subido" cuando Firebase confirma
 * un archivo del MISMO país y MISMO ejecucion_id actuales.
 */
(() => {
  'use strict';

  const FIREBASE_BASE =
    'https://reportes-bancarios-default-rtdb.firebaseio.com/intelfon_sync/reportes_finalizados';

  const POLL_MS = 5000;
  let timer = null;
  let lastExecutionId = '';

  const normalize = (value) => String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '');

  function normalizedCountry(value) {
    const v = normalize(value);
    if (v.includes('guatemala') || ['gt', 'gua'].includes(v)) return 'Guatemala';
    if (
      v.includes('mastersalvador') ||
      v.includes('masterelsalvador') ||
      v.includes('elsalvador') ||
      v === 'salvador' ||
      ['sv', 'slv'].includes(v)
    ) return 'El Salvador';
    return '';
  }

  function currentCountry() {
    return (
      normalizedCountry(window.INTELFON_MASTER_ACCESS?.country) ||
      normalizedCountry(window.DASHBOARD_LOCKED_COUNTRY) ||
      normalizedCountry(window.DASHBOARD_BASE_DATA?.meta?.country) ||
      normalizedCountry(location.pathname)
    );
  }

  function safeGet(storage, keys) {
    for (const key of keys) {
      try {
        const value = storage?.getItem(key);
        if (value) return value;
      } catch (_) {}
    }
    return '';
  }

  function currentExecutionId() {
    const q = new URLSearchParams(location.search);

    const candidates = [
      window.CURRENT_EXECUTION_ID,
      window.EJECUCION_ID,
      window.ejecucion_id,
      window.batch_id,
      q.get('ejecucion_id'),
      q.get('execution_id'),
      q.get('batch_id'),
      document.documentElement?.dataset?.ejecucionId,
      document.body?.dataset?.ejecucionId,
      safeGet(sessionStorage, ['ejecucion_id', 'execution_id', 'batch_id', 'currentExecutionId']),
      safeGet(localStorage, ['ejecucion_id', 'execution_id', 'batch_id', 'currentExecutionId'])
    ];

    return String(candidates.find(Boolean) || '').trim();
  }

  function statusTargets() {
    const found = new Set();

    [
      '[data-file-status]',
      '#archivoEstado',
      '#fileStatus',
      '#statusArchivo',
      '#archivo-status',
      '#syncFileStatus',
      '.file-status',
      '.archivo-status'
    ].forEach(selector => {
      document.querySelectorAll(selector).forEach(el => found.add(el));
    });

    // Compatibilidad con el HTML viejo: encuentra la etiqueta visual
    // "Archivo: Subido" aunque no tenga id/clase.
    document.querySelectorAll('span, div, p, small, strong, b').forEach(el => {
      const text = (el.textContent || '').trim();
      if (/^archivo\s*:\s*(subido|no\s+subido)\s*$/i.test(text)) {
        found.add(el);
      }
    });

    return [...found];
  }

  function paint(uploaded, detail = '') {
    const value = uploaded ? 'Subido' : 'No subido';
    const country = currentCountry();

    for (const el of statusTargets()) {
      const text = (el.textContent || '').trim();
      if (/^archivo\s*:/i.test(text)) {
        el.textContent = `Archivo: ${value}`;
      } else {
        el.textContent = value;
      }

      el.dataset.fileUploaded = uploaded ? 'true' : 'false';
      el.dataset.fileStatusCountry = country;
      el.dataset.fileStatusExecution = lastExecutionId;
      el.title = detail || `Estado de archivo de la ejecución actual${lastExecutionId ? ` (${lastExecutionId})` : ''}`;
    }

    document.documentElement.dataset.currentFileUploaded = uploaded ? 'true' : 'false';
  }

  function resetLegacyState() {
    // Solo limpia claves que históricamente pueden fijar un indicador visual.
    const keys = [
      'archivoSubido', 'fileUploaded', 'archivo_subido',
      'ultimoArchivoSubido', 'lastUploadedFile'
    ];
    for (const storage of [sessionStorage, localStorage]) {
      for (const key of keys) {
        try { storage.removeItem(key); } catch (_) {}
      }
    }
  }

  function validFileEntries(node, country, executionId) {
    const files = node && typeof node === 'object' ? node.archivos : null;
    if (!files || typeof files !== 'object') return [];

    return Object.values(files).filter(file => {
      if (!file || typeof file !== 'object') return false;

      const fileCountry = normalizedCountry(file.pais || file.country);
      const fileExecution = String(file.ejecucion_id || file.execution_id || '').trim();
      const state = normalize(file.estado);

      return (
        fileCountry === country &&
        fileExecution === executionId &&
        (state === 'archivosubido' || state === 'subido' || Boolean(file.id))
      );
    });
  }

  async function refresh() {
    const country = currentCountry();
    const executionId = currentExecutionId();
    lastExecutionId = executionId;

    // Regla central: SIN ejecución actual, nunca se reutiliza un archivo viejo.
    if (!country || !executionId) {
      paint(false, 'No existe una ejecución actual identificada.');
      return false;
    }

    paint(false, 'Verificando archivo de la ejecución actual…');

    const url =
      `${FIREBASE_BASE}/${encodeURIComponent(country)}/${encodeURIComponent(executionId)}.json` +
      `?ts=${Date.now()}`;

    try {
      const response = await fetch(url, {
        method: 'GET',
        cache: 'no-store',
        headers: { 'Cache-Control': 'no-cache' }
      });

      if (!response.ok) {
        paint(false, `Firebase respondió HTTP ${response.status}.`);
        return false;
      }

      const node = await response.json();
      const files = validFileEntries(node, country, executionId);
      const uploaded = files.length > 0;

      paint(
        uploaded,
        uploaded
          ? `Archivo confirmado para ${country}, ejecución ${executionId}.`
          : `Aún no existe un archivo para ${country}, ejecución ${executionId}.`
      );

      return uploaded;
    } catch (error) {
      console.error('[Intelfon] No se pudo verificar estado de archivo:', error);
      paint(false, 'No fue posible verificar el archivo actual.');
      return false;
    }
  }

  function start() {
    resetLegacyState();
    refresh();

    if (timer) clearInterval(timer);
    timer = setInterval(refresh, POLL_MS);
  }

  // Cuando comienza una nueva sincronización, el estado vuelve inmediatamente
  // a "No subido" y luego se valida únicamente esa ejecución.
  window.addEventListener('intelfon:execution-start', event => {
    const id = String(event.detail?.ejecucion_id || event.detail?.execution_id || '').trim();
    if (id) {
      window.CURRENT_EXECUTION_ID = id;
      try { sessionStorage.setItem('ejecucion_id', id); } catch (_) {}
    }
    paint(false, 'Nueva ejecución iniciada; esperando archivo.');
    refresh();
  });

  window.addEventListener('storage', event => {
    if (['ejecucion_id', 'execution_id', 'batch_id', 'currentExecutionId'].includes(event.key)) {
      paint(false, 'Cambió la ejecución actual; verificando…');
      refresh();
    }
  });

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start, { once: true });
  } else {
    start();
  }

  window.IntelfonFileStatus = Object.freeze({
    refresh,
    reset() { paint(false, 'Estado reiniciado.'); },
    get executionId() { return currentExecutionId(); },
    get country() { return currentCountry(); }
  });
})();
