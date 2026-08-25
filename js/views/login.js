import { AuthService } from '../services/authService.js';
import { CONFIG } from '../config.js';

/**
 * Renderiza la vista completa de Inicio de Sesión de RED INTELFON.
 * @param {Function} onLoginSuccess - Callback ejecutado tras autenticarse con éxito
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

        <!-- Tarjeta Central de Login -->
        <div class="relative w-full max-w-md bg-slate-900/90 backdrop-blur-xl border border-slate-800 rounded-3xl p-8 sm:p-10 shadow-2xl shadow-black/80 space-y-8">
            
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

            <!-- Alerta de Error (Oculta por defecto) -->
            <div id="login-error-alert" class="hidden p-4 rounded-xl bg-red-950/80 border border-red-800/80 text-red-200 text-xs flex items-start space-x-3 transition-all duration-300">
                <svg class="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                <span id="login-error-text" class="font-medium">Credenciales incorrectas.</span>
            </div>

            <!-- Formulario de Autenticación -->
            <form id="login-form" class="space-y-5" autocomplete="on">
                <!-- Campo: Usuario / Correo -->
                <div class="space-y-1.5">
                    <label for="login-user" class="block text-xs font-bold uppercase tracking-wider text-slate-300">Usuario o Correo</label>
                    <div class="relative">
                        <div class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
                        </div>
                        <input
                            type="text"
                            id="login-user"
                            name="username"
                            required
                            placeholder="admin@intelfon.com"
                            class="w-full pl-10 pr-4 py-3 bg-slate-950/70 border border-slate-800 rounded-xl text-sm text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all"
                            value="admin@intelfon.com"
                        >
                    </div>
                </div>

                <!-- Campo: Contraseña -->
                <div class="space-y-1.5">
                    <label for="login-password" class="block text-xs font-bold uppercase tracking-wider text-slate-300">Contraseña</label>
                    <div class="relative">
                        <div class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
                        </div>
                        <input
                            type="password"
                            id="login-password"
                            name="password"
                            required
                            placeholder="••••••••••••"
                            class="w-full pl-10 pr-11 py-3 bg-slate-950/70 border border-slate-800 rounded-xl text-sm text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all font-mono"
                            value="intelfon2026"
                        >
                        <!-- Botón Ver/Ocultar Contraseña -->
                        <button type="button" id="btn-toggle-password" class="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-500 hover:text-slate-300 transition-colors" title="Mostrar/Ocultar contraseña">
                            <svg id="eye-icon" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path></svg>
                        </button>
                    </div>
                </div>

                <!-- Recordarme y Ayuda -->
                <div class="flex items-center justify-between text-xs">
                    <label class="flex items-center space-x-2 text-slate-400 cursor-pointer select-none">
                        <input type="checkbox" id="login-remember" class="w-4 h-4 rounded border-slate-700 bg-slate-950 text-red-600 focus:ring-red-500 focus:ring-offset-slate-900" checked>
                        <span>Recordar mi sesión</span>
                    </label>
                    <span class="text-slate-500 hover:text-slate-400 cursor-help" title="Credenciales predeterminadas: admin@intelfon.com / intelfon2026">
                        ¿Olvidaste contraseña?
                    </span>
                </div>

                <!-- Botón de Envío -->
                <button
                    type="submit"
                    id="btn-login-submit"
                    class="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 active:scale-[0.99] text-white text-sm font-extrabold shadow-lg shadow-red-900/50 transition-all flex items-center justify-center space-x-2 cursor-pointer"
                >
                    <span id="btn-login-icon">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"></path></svg>
                    </span>
                    <span id="btn-login-text">Iniciar Sesión</span>
                </button>
            </form>

            <!-- Credenciales de Demostración Sugeridas -->
            <div class="p-3.5 bg-slate-950/60 rounded-xl border border-slate-800/80 text-[11px] text-slate-400 flex items-center justify-between">
                <div>
                    <p class="font-bold text-slate-300">Acceso Rápido Demo:</p>
                    <p class="text-slate-500 font-mono">admin@intelfon.com / intelfon2026</p>
                </div>
                <button type="button" id="btn-autofill" class="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold transition-colors">
                    Autocompletar
                </button>
            </div>

            <!-- Footer Corporativo -->
            <div class="text-center pt-2">
                <p class="text-[11px] text-slate-600">RED INTELFON &copy; 2026 • Plataforma Segura</p>
            </div>
        </div>
    `;

    // Referencias al DOM
    const form = container.querySelector('#login-form');
    const inputUser = container.querySelector('#login-user');
    const inputPass = container.querySelector('#login-password');
    const inputRemember = container.querySelector('#login-remember');
    const btnTogglePassword = container.querySelector('#btn-toggle-password');
    const eyeIcon = container.querySelector('#eye-icon');
    const btnSubmit = container.querySelector('#btn-login-submit');
    const btnText = container.querySelector('#btn-login-text');
    const btnIcon = container.querySelector('#btn-login-icon');
    const errorAlert = container.querySelector('#login-error-alert');
    const errorText = container.querySelector('#login-error-text');
    const btnAutofill = container.querySelector('#btn-autofill');

    // Toggle Mostrar/Ocultar contraseña
    let showPassword = false;
    btnTogglePassword.addEventListener('click', () => {
        showPassword = !showPassword;
        inputPass.type = showPassword ? 'text' : 'password';
        eyeIcon.innerHTML = showPassword 
            ? `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18"></path>`
            : `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>`;
    });

    // Autocompletar credenciales sugeridas
    if (btnAutofill) {
        btnAutofill.addEventListener('click', () => {
            inputUser.value = CONFIG.AUTH.defaultUser;
            inputPass.value = CONFIG.AUTH.defaultPassword;
            errorAlert.classList.add('hidden');
        });
    }

    // Manejo del formulario de Login
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        errorAlert.classList.add('hidden');

        btnSubmit.disabled = true;
        btnSubmit.classList.add('opacity-75', 'cursor-not-allowed');
        btnText.textContent = 'Verificando...';
        btnIcon.innerHTML = `
            <svg class="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
        `;

        // Breve retraso visual de 300ms para feedback elegante
        await new Promise(r => setTimeout(r, 300));

        const result = await AuthService.login(inputUser.value, inputPass.value, inputRemember.checked);

        if (result.success) {
            btnText.textContent = '¡Bienvenido!';
            container.classList.add('opacity-0', 'transition-opacity', 'duration-300');
            setTimeout(() => {
                container.remove();
                if (typeof onLoginSuccess === 'function') {
                    onLoginSuccess(result.user);
                }
            }, 300);
        } else {
            btnSubmit.disabled = false;
            btnSubmit.classList.remove('opacity-75', 'cursor-not-allowed');
            btnText.textContent = 'Iniciar Sesión';
            btnIcon.innerHTML = `
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"></path></svg>
            `;

            errorText.textContent = result.message || 'Credenciales inválidas.';
            errorAlert.classList.remove('hidden');
            
            // Animación de sacudida leve para error
            const card = container.querySelector('.max-w-md');
            card.classList.add('animate-shake');
            setTimeout(() => card.classList.remove('animate-shake'), 500);
        }
    });

    return container;
}
