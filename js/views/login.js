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
            <form id="form-login" class="space-y-4" autocomplete="off">
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
                            placeholder="intelfon"
                            class="w-full pl-10 pr-4 py-3 bg-slate-950/70 border border-slate-800 rounded-xl text-sm text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all"
                            value="intelfon"
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
            <form id="form-register" class="hidden space-y-4" autocomplete="off">
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
                            placeholder="Ej. Ana Morales"
                            class="w-full pl-10 pr-4 py-3 bg-slate-950/70 border border-slate-800 rounded-xl text-sm text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all"
                        >
                    </div>
                </div>

                <div class="space-y-1.5">
                    <label for="reg-email" class="block text-xs font-bold uppercase tracking-wider text-slate-300">Correo Electrónico o Usuario</label>
                    <div class="relative">
                        <div class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>
                        </div>
                        <input
                            type="text"
                            id="reg-email"
                            required
                            placeholder="analista@intelfon.com"
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
                            placeholder="Crea una contraseña"
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

            <!-- Acceso Rápido Master Demo (Exclusivo para la cuenta Master intelfon) -->
            <div class="pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500">
                <span>Acceso Master Admin:</span>
                <button type="button" id="btn-fill-master" class="text-red-400 hover:text-red-300 font-bold hover:underline">
                    Autocompletar (intelfon)
                </button>
            </div>

            <!-- Footer Corporativo -->
            <div class="text-center text-[11px] text-slate-500 space-y-1">
                <p>© 2026 RED INTELFON. Todos los derechos reservados.</p>
                <div class="flex items-center justify-center space-x-2 text-slate-600 text-[10px]">
                    <span>Seguridad SSL 256-bit</span>
                    <span>•</span>
                    <span>Acceso Bancario Protegido</span>
                </div>
            </div>
        </div>
    `;

    // Referencias DOM
    const tabLogin = container.querySelector('#tab-mode-login');
    const tabRegister = container.querySelector('#tab-mode-register');
    const formLogin = container.querySelector('#form-login');
    const formRegister = container.querySelector('#form-register');
    const authAlert = container.querySelector('#auth-alert');
    const alertText = container.querySelector('#alert-text');
    const alertIcon = container.querySelector('#alert-icon');
    const btnSwitchToRegister = container.querySelector('#btn-switch-to-register');
    const btnFillMaster = container.querySelector('#btn-fill-master');

    const inputLoginUser = container.querySelector('#login-user');
    const inputLoginPass = container.querySelector('#login-password');
    const inputLoginRemember = container.querySelector('#login-remember');
    const btnToggleLoginPass = container.querySelector('#btn-toggle-login-pass');

    const inputRegName = container.querySelector('#reg-name');
    const inputRegEmail = container.querySelector('#reg-email');
    const inputRegPass = container.querySelector('#reg-password');

    function showAlert(msg, isSuccess = false) {
        authAlert.classList.remove('hidden', 'bg-red-950/80', 'text-red-200', 'border-red-800', 'bg-emerald-950/80', 'text-emerald-200', 'border-emerald-800');
        if (isSuccess) {
            authAlert.classList.add('bg-emerald-950/80', 'text-emerald-200', 'border', 'border-emerald-800');
            alertIcon.innerHTML = '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>';
            alertIcon.classList.add('text-emerald-400');
            alertIcon.classList.remove('text-red-400');
        } else {
            authAlert.classList.add('bg-red-950/80', 'text-red-200', 'border', 'border-red-800', 'animate-shake');
            alertIcon.innerHTML = '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>';
            alertIcon.classList.add('text-red-400');
            alertIcon.classList.remove('text-emerald-400');
            setTimeout(() => authAlert.classList.remove('animate-shake'), 400);
        }
        alertText.textContent = msg;
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

    // Autocompletar solo para el Master Admin intelfon
    if (btnFillMaster) {
        btnFillMaster.addEventListener('click', () => {
            setMode('login');
            inputLoginUser.value = CONFIG.AUTH.masterUsername;
            inputLoginPass.value = CONFIG.AUTH.defaultPassword;
            authAlert.classList.add('hidden');
        });
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
        btn.innerHTML = `<svg class="animate-spin h-4 w-4 text-white inline mr-2" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> Validando...`;

        const userOrEmail = inputLoginUser.value.trim();
        const password = inputLoginPass.value.trim();
        const remember = inputLoginRemember.checked;

        const result = await AuthService.login(userOrEmail, password, remember);

        if (result.success) {
            showAlert(`¡Bienvenido, ${result.user.name}!`, true);
            setTimeout(() => {
                container.classList.add('opacity-0', 'scale-95');
                setTimeout(() => {
                    container.remove();
                    if (typeof onLoginSuccess === 'function') {
                        onLoginSuccess(result.user);
                    }
                }, 200);
            }, 500);
        } else {
            showAlert(result.message || 'Usuario o contraseña incorrectos.');
            btn.disabled = false;
            btn.innerHTML = `<span>Iniciar Sesión</span>`;
        }
    });

    // Enviar Registro
    formRegister.addEventListener('submit', async (e) => {
        e.preventDefault();
        const btn = formRegister.querySelector('button[type="submit"]');
        btn.disabled = true;
        btn.innerHTML = `<svg class="animate-spin h-4 w-4 text-white inline mr-2" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> Creando cuenta...`;

        const name = inputRegName.value.trim();
        const email = inputRegEmail.value.trim();
        const password = inputRegPass.value.trim();

        const result = await AuthService.register(name, email, password);

        if (result.success) {
            showAlert(`Cuenta creada con éxito. Iniciando sesión...`, true);
            setTimeout(() => {
                container.classList.add('opacity-0', 'scale-95');
                setTimeout(() => {
                    container.remove();
                    if (typeof onLoginSuccess === 'function') {
                        onLoginSuccess(result.user);
                    }
                }, 200);
            }, 600);
        } else {
            showAlert(result.message || 'Error al registrar usuario.');
            btn.disabled = false;
            btn.innerHTML = `<span>Crear Cuenta y Entrar</span>`;
        }
    });

    return container;
}
