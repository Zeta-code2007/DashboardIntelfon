import { renderOverview } from './views/overview.js';
import { renderGenerator } from './views/generator.js';
import { renderHistory } from './views/history.js';
import { renderLogin } from './views/login.js';
import { renderUsers } from './views/users.js';
import { renderReportSection } from './views/reportSection.js';
import { AuthService } from './services/authService.js';
import { Toast } from './services/toastService.js';

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

    // =========================================================================
    // Control de Tema Oscuro / Claro
    // =========================================================================
    const savedTheme = localStorage.getItem('intelfon_theme') || 'dark';
    if (savedTheme === 'dark') {
        document.documentElement.classList.add('dark');
    } else {
        document.documentElement.classList.remove('dark');
    }

    if (btnToggleTheme) {
        btnToggleTheme.addEventListener('click', () => {
            const isDark = document.documentElement.classList.toggle('dark');
            localStorage.setItem('intelfon_theme', isDark ? 'dark' : 'light');
            Toast.info(isDark ? 'Modo Oscuro activado' : 'Modo Claro activado', 'Tema Visual');
        });
    }

    // =========================================================================
    // Control de Autenticación
    // =========================================================================
    function checkAuthentication() {
        if (!AuthService.isAuthenticated()) {
            showLoginScreen();
        } else {
            showDashboardScreen();
        }
    }

    function showLoginScreen() {
        if (sidebar) sidebar.classList.add('hidden');
        if (mainLayout) mainLayout.classList.add('hidden');
        if (sidebarBackdrop) sidebarBackdrop.classList.add('hidden');

        // Limpiar cualquier vista de login previa
        const existingLogin = document.getElementById('login-modal-container');
        if (existingLogin) existingLogin.remove();

        const loginElement = renderLogin((user) => {
            Toast.success(`Bienvenido, ${user.name}`, 'Inicio de Sesión Exitoso');
            showDashboardScreen(user);
        });
        loginElement.id = 'login-modal-container';
        document.body.appendChild(loginElement);
    }

    function showDashboardScreen(user) {
        const existingLogin = document.getElementById('login-modal-container');
        if (existingLogin) existingLogin.remove();

        if (sidebar) sidebar.classList.remove('hidden');
        if (mainLayout) mainLayout.classList.remove('hidden');
        if (sidebarBackdrop) sidebarBackdrop.classList.remove('hidden');

        const currentUser = user || AuthService.getUser();
        const isMaster = AuthService.isMasterAdmin(currentUser);

        if (currentUser && userDisplayName) {
            userDisplayName.textContent = currentUser.name || (isMaster ? 'Master INTELFON' : 'Analista');
        }

        // RBAC: Ocultar pestaña 'Gestión de Usuarios' si no es Master Admin ("intelfon")
        const navBtnUsers = document.querySelector('.nav-btn[data-view="users"]');
        if (navBtnUsers) {
            if (isMaster) {
                navBtnUsers.classList.remove('hidden');
                navBtnUsers.style.display = 'flex';
            } else {
                navBtnUsers.classList.add('hidden');
                navBtnUsers.style.display = 'none';
            }
        }

        // Cargar vista inicial
        loadView('overview');
    }

    // Botón de Cerrar Sesión
    if (btnLogout) {
        btnLogout.addEventListener('click', () => {
            if (confirm('¿Estás seguro de que deseas cerrar sesión?')) {
                AuthService.logout();
                Toast.info('Has cerrado sesión correctamente.', 'Sesión Finalizada');
                showLoginScreen();
            }
        });
    }

    // =========================================================================
    // Manejo del Sidebar Colapsable (Desktop & Mobile)
    // =========================================================================

    // Recuperar estado previo del sidebar en desktop
    const isSidebarCollapsed = localStorage.getItem('intelfon_sidebar_collapsed') === 'true';
    if (isSidebarCollapsed && sidebar) {
        sidebar.classList.add('collapsed');
    }

    // Toggle en Desktop
    if (btnToggleSidebar && sidebar) {
        btnToggleSidebar.addEventListener('click', () => {
            sidebar.classList.toggle('collapsed');
            const isCollapsed = sidebar.classList.contains('collapsed');
            localStorage.setItem('intelfon_sidebar_collapsed', isCollapsed);
        });
    }

    // Abrir/Cerrar menú en Mobile
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

    if (btnMobileSidebar) {
        btnMobileSidebar.addEventListener('click', openMobileSidebar);
    }

    if (sidebarBackdrop) {
        sidebarBackdrop.addEventListener('click', closeMobileSidebar);
    }

    // Cerrar menú móvil al presionar Escape
    window.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeMobileSidebar();
        }
    });

    // =========================================================================
    // Enrutador y Renderizado de Vistas con Guard RBAC
    // =========================================================================
    const views = {
        overview: {
            title: 'Inicio / Overview',
            render: renderOverview
        },
        generator: {
            title: 'Generar Reporte Excel',
            render: renderGenerator
        },
        history: {
            title: 'Reportes Anteriores',
            render: renderHistory
        },
        'bank-detail': {
            title: 'Detalle por banco',
            render: () => renderReportSection('bancos', 'Detalle por banco')
        },
        'daily-flow': {
            title: 'Flujo diario',
            render: () => renderReportSection('flujo', 'Flujo diario')
        },
        'account-detail': {
            title: 'Detalle de cuentas',
            render: () => renderReportSection('cuentas', 'Detalle de cuentas')
        },
        users: {
            title: 'Gestión de Usuarios (Master)',
            render: renderUsers,
            masterOnly: true
        }
    };

    function loadView(viewName) {
        const view = views[viewName];
        if (!view) return;

        // Middleware Guard RBAC: Proteger ruta 'users'
        if (view.masterOnly && !AuthService.isMasterAdmin()) {
            Toast.warning('Acceso denegado. Solo el Usuario Master (intelfon) tiene acceso a Gestión de Usuarios.', 'Permiso Insuficiente');
            loadView('overview');
            return;
        }

        pageTitle.textContent = view.title;

        navButtons.forEach(btn => {
            if (btn.dataset.view === viewName) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });

        // Limpiar y renderizar con suave fade-in
        appContent.innerHTML = '';
        const renderedView = view.render();
        renderedView.classList.add('transition-all', 'duration-300');
        appContent.appendChild(renderedView);

        // Scroll arriba
        appContent.scrollTop = 0;

        // Si estamos en mobile, cerrar el drawer
        if (window.innerWidth < 1024) {
            closeMobileSidebar();
        }
    }

    window.addEventListener('message', (event) => {
        if (event.data && event.data.type === 'intelfon-report-cleared') {
            const activeView = document.querySelector('.nav-btn.active')?.dataset.view || 'overview';
            loadView(activeView);
            return;
        }
        if (!event.data || event.data.type !== 'intelfon-navigate') return;
        if (typeof event.data.view === 'string') loadView(event.data.view);
    });

    window.addEventListener('storage', (event) => {
        if (event.key === 'intelfon_current_report') {
            const activeView = document.querySelector('.nav-btn.active')?.dataset.view || 'overview';
            loadView(activeView);
        }
    });

    window.addEventListener('intelfon-report-updated', (event) => {
        if (event.detail && event.detail.key === 'intelfon_current_report') {
            const activeView = document.querySelector('.nav-btn.active')?.dataset.view || 'overview';
            if (activeView !== 'generator') loadView(activeView);
        }
    });

    navButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const viewName = btn.dataset.view;
            loadView(viewName);
        });
    });

    // Iniciar verificación de autenticación
    checkAuthentication();
});