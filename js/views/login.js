import { AuthService } from '../services/authService.js';
import { CONFIG } from '../config.js';

/**
 * Renderiza la vista completa de Inicio de Sesión y Registro de RED INTELFON.
 * @param {Function} onLoginSuccess - Callback ejecutado tras autenticarse o registrarse con éxito
 * @returns {HTMLElement}
 */
export function renderLogin(onLoginSuccess) {
    const container = document.createElement('div');
    container.className = 'fixed inset-0 z-50 flex items-center justify-center bg-slate-950 px-4 py-8 overflow-y-auto selection:bg-red-500 selection:text-white';

    container.innerHTML = `
        <!-- Fondo Decorativo con Gradiente Sutil -->
        <div class="absolute inset-0 overflow-hidden pointer-events-none">
            <div class="absolute -top-40 -right-40 w-96 h-96 bg-red-600/15 rounded-full blur-3xl"></div>
            <div class="absolute -bottom-40 -left-40 w-96 h-96 bg-red-900/20 rounded-full blur-3xl"></div>
            <div class="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:24px_24px] opacity-40"></div>
        </div>

        <!-- Tarjeta Central de Login / Registro -->
        <div class="relative w-full max-w-md bg-slate-900/90 backdrop-blur-xl border border-slate-800 rounded-3xl p-8 sm:p-10 shadow-2xl shadow-black/80 space-y-7">
            
            <!-- Encabezado de la Tarjeta (Logo & Marca) -->
            <div class="text-center space-y-3">
                <div class="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-red-600 to-red-800 text-white shadow-xl shadow-red-900/40 p-3 mx-auto">
                    <img src="assets/logo-intelfon.png" alt="RED INTELFON" class="h-10 w-auto error-fallback" onerror="this.style.display='none'; this.nextElementSibling.style.display='block';">
                    <span class="hidden font-black text-xl tracking-wider">RI</span>
                </div>
                <div>
                    <h2 class="text-2xl font-extrabold text-white tracking-tight">RED <span class="text-intelfon-red">INTELFON</span></h2>
                    <p class="text-xs text-slate-400 mt-1 font-medium">Dashboard de Reportes Bancarios & Analítica</p>
                </div>
            </div>

            <!-- Selector de Modo: Iniciar Sesión / Crear Cuenta -->
            <div class="flex rounded-xl bg-slate-950 p-1 border border-slate-800">
                <button type="button" id="tab-mode-login" class="flex-1 py-2 text-xs font-bold rounded-lg bg-red-600 text-white shadow-xs transition-all">
                    Iniciar Sesión
                </button>
                <button type="button" id="tab-mode-register" class="flex-1 py-2 text-xs font-bold rounded-lg text-slate-400 hover:text-white transition-all">
                    Crear Cuenta
                </button>
            </div>

            <!-- Alerta de Notificación / Error -->
            <div id="auth-alert" class="hidden p-4 rounded-xl text-xs flex items-start space-x-3 transition-all duration-300">
                <svg id="alert-icon" class="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"></svg>
                <span id="alert-text" class="font-medium"></span>
            </div>

            <!-- FORMULARIO 1: INICIAR SESIÓN -->
            <form id="form-login" class="space-y-4" autocomplete="on">
                <div class="space-y-1.5">
                    <label for="login-user" class="block text-xs font-bold uppercase tracking-wider text-slate-300">Usuario o Correo</label>
                    <div class="relative">
                        <div class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
                        </div>
                        <input
                            type="text"
                            id="login-user"
                            required
                            placeholder="admin@intelfon.com"
                            class="w-full pl-10 pr-4 py-3 bg-slate-950/70 border border-slate-800 rounded-xl text-sm text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all"
                            value="admin@intelfon.com"
                        >
                    </div>
                </div>

                <div class="space-y-1.5">
                    <label for="login-password" class="block text-xs font-bold uppercase tracking-wider text-slate-300">Contraseña</label>
                    <div class="relative">
                        <div class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
                        </div>
                        <input
                            type="password"
                            id="login-password"
                            required
                            placeholder="••••••••••••"
                            class="w-full pl-10 pr-11 py-3 bg-slate-950/70 border border-slate-800 rounded-xl text-sm text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all font-mono"
                            value="intelfon2026"
                        >
                        <button type="button" id="btn-toggle-login-pass" class="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-500 hover:text-slate-300 transition-colors">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path></svg>
                        </button>
                    </div>
                </div>

                <div class="flex items-center justify-between text-xs pt-1">
                    <label class="flex items-center space-x-2 text-slate-400 cursor-pointer select-none">
                        <input type="checkbox" id="login-remember" class="w-4 h-4 rounded border-slate-700 bg-slate-950 text-red-600 focus:ring-red-500 focus:ring-offset-slate-900" checked>
                        <span>Recordarme</span>
                    </label>
                    <button type="button" id="btn-switch-to-register" class="text-red-400 hover:text-red-300 font-semibold transition-colors">
                        ¿Crear cuenta nueva?
                    </button>
                </div>

                <button
                    type="submit"
                    id="btn-login-submit"
                    class="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 active:scale-[0.99] text-white text-sm font-extrabold shadow-lg shadow-red-900/50 transition-all flex items-center justify-center space-x-2 cursor-pointer mt-2"
                >
                    <span>Iniciar Sesión</span>
                </button>
            </form>

            <!-- FORMULARIO 2: CREAR CUENTA (Oculto por defecto) -->
            <form id="form-register" class="hidden space-y-4" autocomplete="on">
                <div class="space-y-1.5">
                    <label for="reg-name" class="block text-xs font-bold uppercase tracking-wider text-slate-300">Nombre Completo</label>
                    <div class="relative">
                        <div class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
                        </div>
                        <input
                            type="text"
                            id="reg-name"
                            required
                            placeholder="Ej. Juan Pérez"
                            class="w-full pl-10 pr-4 py-3 bg-slate-950/70 border border-slate-800 rounded-xl text-sm text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all"
                        >
                    </div>
                </div>

                <div class="space-y-1.5">
                    <label for="reg-email" class="block text-xs font-bold uppercase tracking-wider text-slate-300">Correo Electrónico</label>
                    <div class="relative">
                        <div class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>
                        </div>
                        <input
                            type="email"
                            id="reg-email"
                            required
                            placeholder="usuario@intelfon.com"
                            class="w-full pl-10 pr-4 py-3 bg-slate-950/70 border border-slate-800 rounded-xl text-sm text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all"
                        >
                    </div>
                </div>

                <div class="space-y-1.5">
                    <label for="reg-password" class="block text-xs font-bold uppercase tracking-wider text-slate-300">Contraseña</label>
                    <div class="relative">
                        <div class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
                        </div>
                        <input
                            type="password"
                            id="reg-password"
                            required
                            placeholder="Crea una contraseña segura"
                            class="w-full pl-10 pr-4 py-3 bg-slate-950/70 border border-slate-800 rounded-xl text-sm text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all font-mono"
                        >
                    </div>
                </div>

                <button
                    type="submit"
                    id="btn-register-submit"
                    class="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 active:scale-[0.99] text-white text-sm font-extrabold shadow-lg shadow-red-900/50 transition-all flex items-center justify-center space-x-2 cursor-pointer mt-2"
                >
                    <span>Crear Cuenta y Entrar</span>
                </button>
            </form>

            <!-- Lista Dinámica de Cuentas Registradas en la DB Local -->
            <div class="space-y-2 pt-1 border-t border-slate-800/80">
                <div class="flex items-center justify-between text-[11px]">
                    <span class="font-bold text-slate-400">Cuentas Guardadas en la DB:</span>
                    <span id="registered-count-badge" class="px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono text-[10px]">1 usuario</span>
                </div>
                <div id="registered-users-list" class="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                    <!-- Se llena dinámicamente con AuthService.getAllUsers() -->
                </div>
            </div>

            <!-- Footer Corporativo -->
            <div class="text-center pt-1">
                <p class="text-[11px] text-slate-600">RED INTELFON &copy; 2026 • Plataforma Segura</p>
            </div>
        </div>
    `;

    // Referencias
    const tabLogin = container.querySelector('#tab-mode-login');
    const tabRegister = container.querySelector('#tab-mode-register');
    const formLogin = container.querySelector('#form-login');
    const formRegister = container.querySelector('#form-register');
    const authAlert = container.querySelector('#auth-alert');
    const alertText = container.querySelector('#alert-text');
    const alertIcon = container.querySelector('#alert-icon');
    const btnSwitchToRegister = container.querySelector('#btn-switch-to-register');
    const registeredUsersList = container.querySelector('#registered-users-list');
    const registeredCountBadge = container.querySelector('#registered-count-badge');

    const inputLoginUser = container.querySelector('#login-user');
    const inputLoginPass = container.querySelector('#login-password');
    const inputLoginRemember = container.querySelector('#login-remember');
    const btnToggleLoginPass = container.querySelector('#btn-toggle-login-pass');

    const inputRegName = container.querySelector('#reg-name');
    const inputRegEmail = container.querySelector('#reg-email');
    const inputRegPass = container.querySelector('#reg-password');

    // Función para renderizar chips de usuarios registrados
    function renderRegisteredUsers() {
        const users = AuthService.getAllUsers();
        if (registeredCountBadge) {
            registeredCountBadge.textContent = `${users.length} cuenta${users.length === 1 ? '' : 's'}`;
        }

        if (!registeredUsersList) return;
        registeredUsersList.innerHTML = users.map(u => `
            <button
                type="button"
                data-user-email="${u.email}"
                data-user-pass="${u.password}"
                class="btn-user-chip px-2.5 py-1 rounded-lg bg-slate-950/80 hover:bg-red-950/60 border border-slate-800 hover:border-red-800 text-[11px] text-slate-300 hover:text-white transition-all flex items-center space-x-1.5 truncate max-w-full"
                title="Hacer clic para autocompletar: ${u.email}"
            >
                <span class="w-1.5 h-1.5 rounded-full ${u.role === 'Super Admin' ? 'bg-red-500' : 'bg-blue-400'}"></span>
                <span class="font-semibold truncate">${u.name}</span>
                <span class="text-slate-500 font-mono text-[10px]">(${u.email.split('@')[0]})</span>
            </button>
        `).join('');

        // Añadir listeners a cada chip
        registeredUsersList.querySelectorAll('.btn-user-chip').forEach(chip => {
            chip.addEventListener('click', () => {
                const email = chip.getAttribute('data-user-email');
                const pass = chip.getAttribute('data-user-pass');
                setMode('login');
                inputLoginUser.value = email;
                inputLoginPass.value = pass;
                authAlert.classList.add('hidden');
            });
        });
    }

    renderRegisteredUsers();

    function showAlert(msg, isSuccess = false) {
        alertText.textContent = msg;
        authAlert.classList.remove('hidden', 'bg-red-950/80', 'border-red-800/80', 'text-red-200', 'bg-emerald-950/80', 'border-emerald-800/80', 'text-emerald-200');
        if (isSuccess) {
            authAlert.classList.add('bg-emerald-950/80', 'border-emerald-800/80', 'text-emerald-200');
            alertIcon.innerHTML = `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>`;
        } else {
            authAlert.classList.add('bg-red-950/80', 'border-red-800/80', 'text-red-200');
            alertIcon.innerHTML = `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>`;
        }
    }

    function setMode(mode) {
        authAlert.classList.add('hidden');
        if (mode === 'login') {
            tabLogin.className = 'flex-1 py-2 text-xs font-bold rounded-lg bg-red-600 text-white shadow-xs transition-all';
            tabRegister.className = 'flex-1 py-2 text-xs font-bold rounded-lg text-slate-400 hover:text-white transition-all';
            formLogin.classList.remove('hidden');
            formRegister.classList.add('hidden');
        } else {
            tabRegister.className = 'flex-1 py-2 text-xs font-bold rounded-lg bg-red-600 text-white shadow-xs transition-all';
            tabLogin.className = 'flex-1 py-2 text-xs font-bold rounded-lg text-slate-400 hover:text-white transition-all';
            formRegister.classList.remove('hidden');
            formLogin.classList.add('hidden');
        }
    }

    tabLogin.addEventListener('click', () => setMode('login'));
    tabRegister.addEventListener('click', () => setMode('register'));
    if (btnSwitchToRegister) {
        btnSwitchToRegister.addEventListener('click', () => setMode('register'));
    }

    // Toggle Password Visibility
    let showLoginPass = false;
    btnToggleLoginPass.addEventListener('click', () => {
        showLoginPass = !showLoginPass;
        inputLoginPass.type = showLoginPass ? 'text' : 'password';
    });

    // Enviar Login
    formLogin.addEventListener('submit', async (e) => {
        e.preventDefault();
        const btn = formLogin.querySelector('button[type="submit"]');
        btn.disabled = true;
        btn.innerHTML = `<svg class="animate-spin h-4 w-4 text-white inline mr-2" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> Iniciar Sesión`;

        await new Promise(r => setTimeout(r, 250));
        const res = await AuthService.login(inputLoginUser.value, inputLoginPass.value, inputLoginRemember.checked);

        if (res.success) {
            showAlert('¡Acceso concedido! Entrando...', true);
            container.classList.add('opacity-0', 'transition-opacity', 'duration-300');
            setTimeout(() => {
                container.remove();
                if (typeof onLoginSuccess === 'function') onLoginSuccess(res.user);
            }, 300);
        } else {
            btn.disabled = false;
            btn.textContent = 'Iniciar Sesión';
            showAlert(res.message || 'Credenciales inválidas.');
        }
    });

    // Enviar Registro
    formRegister.addEventListener('submit', async (e) => {
        e.preventDefault();
        const btn = formRegister.querySelector('button[type="submit"]');
        btn.disabled = true;
        btn.innerHTML = `<svg class="animate-spin h-4 w-4 text-white inline mr-2" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> Creando cuenta...`;

        await new Promise(r => setTimeout(r, 250));
        const res = await AuthService.register(inputRegName.value, inputRegEmail.value, inputRegPass.value);

        if (res.success) {
            showAlert('¡Cuenta creada con éxito! Entrando...', true);
            container.classList.add('opacity-0', 'transition-opacity', 'duration-300');
            setTimeout(() => {
                container.remove();
                if (typeof onLoginSuccess === 'function') onLoginSuccess(res.user);
            }, 300);
        } else {
            btn.disabled = false;
            btn.textContent = 'Crear Cuenta y Entrar';
            showAlert(res.message || 'No se pudo crear la cuenta.');
        }
    });

    return container;
}
