import { renderOverview } from './views/overview.js';
import { renderGenerator } from './views/generator.js';
import { renderHistory } from './views/history.js';
import { renderLogin } from './views/login.js';
import { renderUsers } from './views/users.js';
import { renderReportSection } from './views/reportSection.js';
import { AuthService } from './services/authService.js';
import { Toast } from './services/toastService.js';
import { RegionService } from './services/regionService.js';
import { SyncService } from './services/syncService.js';
import { mountRegionStatusBar } from './views/regionStatusBar.js';

document.addEventListener('DOMContentLoaded', () => {
    const appContent = document.getElementById('app-content');
    const pageTitle = document.getElementById('page-title');
    const navButtons = document.querySelectorAll('.nav-btn');

    const sidebar = document.getElementById('sidebar');
    const mainLayout = document.getElementById('main-layout');
    const btnToggleSidebar = document.getElementById('btn-toggle-sidebar');
    const btnMobileSidebar = document.getElementById('btn-mobile-sidebar');
    const sidebarBackdrop = document.getElementById('sidebar-backdrop');
    const btnLogout = document.getElementById('btn-logout');
    const userDisplayName = document.getElementById('user-display-name');
    const btnToggleTheme = document.getElementById('btn-toggle-theme');

    const savedTheme = localStorage.getItem('intelfon_theme') || 'dark';
    document.documentElement.classList.toggle('dark', savedTheme === 'dark');

    btnToggleTheme?.addEventListener('click', () => {
        const isDark = document.documentElement.classList.toggle('dark');
        localStorage.setItem('intelfon_theme', isDark ? 'dark' : 'light');
        Toast.info(isDark ? 'Modo Oscuro activado' : 'Modo Claro activado', 'Tema Visual');
    });

    function checkAuthentication() {
        AuthService.isAuthenticated() ? showDashboardScreen() : showLoginScreen();
    }

    function showLoginScreen() {
        sidebar?.classList.add('hidden');
        mainLayout?.classList.add('hidden');
        sidebarBackdrop?.classList.add('hidden');

        document.getElementById('login-modal-container')?.remove();

        const loginElement = renderLogin(user => {
            Toast.success(`Bienvenido, ${user.name}`, 'Inicio de Sesión Exitoso');
            showDashboardScreen(user);
        });

        loginElement.id = 'login-modal-container';
        document.body.appendChild(loginElement);
    }

    function showDashboardScreen(user) {
        document.getElementById('login-modal-container')?.remove();

        sidebar?.classList.remove('hidden');
        mainLayout?.classList.remove('hidden');
        sidebarBackdrop?.classList.remove('hidden');

        const currentUser = user || AuthService.getUser();
        const username = String(currentUser?.username || '').toLowerCase().trim();

        if (userDisplayName) {
            if (username === 'masterguatemala') userDisplayName.textContent = 'Master Guatemala';
            else if (username === 'mastersalvador' || username === 'masterelsalvador') userDisplayName.textContent = 'Master El Salvador';
            else if (username === 'intelfon') userDisplayName.textContent = 'Master INTELFON';
            else userDisplayName.textContent = currentUser?.name || 'Analista';
        }

        // Gestión de Usuarios solamente para master global intelfon.
        const navBtnUsers = document.querySelector('.nav-btn[data-view="users"]');
        if (navBtnUsers) {
            const globalMaster = AuthService.isGlobalMaster(currentUser);
            navBtnUsers.classList.toggle('hidden', !globalMaster);
            navBtnUsers.style.display = globalMaster ? 'flex' : 'none';
        }

        const activeRegion = RegionService.getActiveRegion();
        const regionMeta = RegionService.getRegionMeta(activeRegion);

        // Mantener motor original de sincronización.
        SyncService.initSync(activeRegion, currentUser);

        const syncBarContainer = document.getElementById('region-sync-bar');
        if (syncBarContainer) mountRegionStatusBar(syncBarContainer);

        const pageSubtitle = document.querySelector('header p.text-xs.text-slate-500');
        if (pageSubtitle) {
            pageSubtitle.textContent =
                `Dashboard ${regionMeta.name} (${regionMeta.currency}) · Gestión automatizada de reportes bancarios con Make.com`;
        }

        loadView('overview');
    }

    btnLogout?.addEventListener('click', () => {
        if (confirm('¿Estás seguro de que deseas cerrar sesión?')) {
            SyncService.teardownSync();
            AuthService.logout();
            Toast.info('Has cerrado sesión correctamente.', 'Sesión Finalizada');
            showLoginScreen();
        }
    });

    const isSidebarCollapsed = localStorage.getItem('intelfon_sidebar_collapsed') === 'true';
    if (isSidebarCollapsed) sidebar?.classList.add('collapsed');

    btnToggleSidebar?.addEventListener('click', () => {
        sidebar?.classList.toggle('collapsed');
        localStorage.setItem('intelfon_sidebar_collapsed', sidebar?.classList.contains('collapsed') ? 'true' : 'false');
    });

    function openMobileSidebar() {
        if (!sidebar || !sidebarBackdrop) return;
        sidebar.classList.remove('-translate-x-full');
        sidebarBackdrop.classList.remove('opacity-0', 'pointer-events-none');
        sidebarBackdrop.classList.add('opacity-100', 'pointer-events-auto');
        document.body.classList.add('overflow-hidden');
    }

    function closeMobileSidebar() {
        if (!sidebar || !sidebarBackdrop) return;
        sidebar.classList.add('-translate-x-full');
        sidebarBackdrop.classList.add('opacity-0', 'pointer-events-none');
        sidebarBackdrop.classList.remove('opacity-100', 'pointer-events-auto');
        document.body.classList.remove('overflow-hidden');
    }

    btnMobileSidebar?.addEventListener('click', openMobileSidebar);
    sidebarBackdrop?.addEventListener('click', closeMobileSidebar);
    window.addEventListener('keydown', e => { if (e.key === 'Escape') closeMobileSidebar(); });

    const views = {
        overview: { title: 'Inicio / Overview', render: renderOverview },
        generator: { title: 'Generar Reporte Excel', render: renderGenerator },
        history: { title: 'Reportes Anteriores', render: renderHistory },
        'bank-detail': { title: 'Detalle por banco', render: () => renderReportSection('bancos', 'Detalle por banco') },
        'daily-flow': { title: 'Flujo diario', render: () => renderReportSection('flujo', 'Flujo diario') },
        'account-detail': { title: 'Detalle de cuentas', render: () => renderReportSection('cuentas', 'Detalle de cuentas') },
        users: { title: 'Gestión de Usuarios (Master)', render: renderUsers, globalMasterOnly: true }
    };

    function loadView(viewName) {
        const view = views[viewName];
        if (!view) return;

        if (view.globalMasterOnly && !AuthService.isGlobalMaster()) {
            Toast.warning('Acceso denegado. Solo Master INTELFON puede gestionar usuarios.', 'Permiso Insuficiente');
            loadView('overview');
            return;
        }

        if (pageTitle) pageTitle.textContent = view.title;

        navButtons.forEach(btn => btn.classList.toggle('active', btn.dataset.view === viewName));

        appContent.innerHTML = '';
        const renderedView = view.render();
        renderedView.classList.add('transition-all', 'duration-300');
        appContent.appendChild(renderedView);
        appContent.scrollTop = 0;

        if (window.innerWidth < 1024) closeMobileSidebar();
    }

    window.addEventListener('message', event => {
        if (event.data?.type === 'intelfon-report-cleared') {
            const activeView = document.querySelector('.nav-btn.active')?.dataset.view || 'overview';
            loadView(activeView);
            return;
        }
        if (event.data?.type === 'intelfon-navigate' && typeof event.data.view === 'string') {
            loadView(event.data.view);
        }
    });

    window.addEventListener('storage', event => {
        if (event.key === 'intelfon_current_report') {
            const activeView = document.querySelector('.nav-btn.active')?.dataset.view || 'overview';
            loadView(activeView);
        }
    });

    window.addEventListener('intelfon-report-updated', event => {
        if (event.detail?.key === 'intelfon_current_report') {
            const activeView = document.querySelector('.nav-btn.active')?.dataset.view || 'overview';
            if (activeView !== 'generator') loadView(activeView);
        }
    });

    navButtons.forEach(btn => btn.addEventListener('click', () => loadView(btn.dataset.view)));

    checkAuthentication();
});
