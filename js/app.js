import { renderOverview } from './views/overview.js?v=2.5';
import { renderGenerator } from './views/generator.js?v=2.5';
import { renderHistory } from './views/history.js?v=2.5';
import { renderLogin } from './views/login.js?v=2.5';
import { AuthService } from './services/authService.js?v=2.5';

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
        if (currentUser && userDisplayName) {
            userDisplayName.textContent = currentUser.name || 'Admin INTELFON';
        }

        // Cargar vista inicial
        loadView('overview');
    }

    // Botón de Cerrar Sesión
    if (btnLogout) {
        btnLogout.addEventListener('click', () => {
            if (confirm('¿Estás seguro de que deseas cerrar sesión?')) {
                AuthService.logout();
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
    // Enrutador y Renderizado de Vistas
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
        }
    };

    function loadView(viewName) {
        const view = views[viewName];
        if (!view) return;

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

    navButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const viewName = btn.dataset.view;
            loadView(viewName);
        });
    });

    // Iniciar verificación de autenticación
    checkAuthentication();
});