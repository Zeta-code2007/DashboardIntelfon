/**
 * Servicio de Notificaciones Toast Corporativas para RED INTELFON
 * Proporciona notificaciones flotantes animadas (success, error, info, warning)
 */

class ToastServiceSingleton {
    constructor() {
        this.container = null;
        this._initContainer();
    }

    _initContainer() {
        let el = document.getElementById('intelfon-toast-container');
        if (!el) {
            el = document.createElement('div');
            el.id = 'intelfon-toast-container';
            el.className = 'fixed top-5 right-5 z-[9999] flex flex-col space-y-3 pointer-events-none max-w-sm w-full px-4 sm:px-0';
            document.body.appendChild(el);
        }
        this.container = el;
    }

    /**
     * Muestra una notificación Toast
     * @param {Object} options - { title, message, type: 'success'|'error'|'info'|'warning', duration: 4000 }
     */
    show({ title = '', message = '', type = 'info', duration = 4000 }) {
        if (!this.container) this._initContainer();

        const toast = document.createElement('div');
        toast.className = 'pointer-events-auto flex items-start p-4 rounded-2xl bg-slate-900/95 text-white backdrop-blur-xl border border-slate-800 shadow-2xl shadow-black/60 transform translate-x-12 opacity-0 transition-all duration-300 relative overflow-hidden group';

        let iconSvg = '';
        let borderAccent = 'border-l-4 border-l-blue-500';
        let progressBg = 'bg-blue-500';

        if (type === 'success') {
            borderAccent = 'border-l-4 border-l-emerald-500';
            progressBg = 'bg-emerald-500';
            iconSvg = `
                <div class="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center flex-shrink-0 mr-3">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>
                </div>
            `;
        } else if (type === 'error') {
            borderAccent = 'border-l-4 border-l-red-500';
            progressBg = 'bg-red-500';
            iconSvg = `
                <div class="w-8 h-8 rounded-xl bg-red-500/20 text-red-400 flex items-center justify-center flex-shrink-0 mr-3">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                </div>
            `;
        } else if (type === 'warning') {
            borderAccent = 'border-l-4 border-l-amber-500';
            progressBg = 'bg-amber-500';
            iconSvg = `
                <div class="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center flex-shrink-0 mr-3">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
                </div>
            `;
        } else {
            iconSvg = `
                <div class="w-8 h-8 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center flex-shrink-0 mr-3">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                </div>
            `;
        }

        toast.classList.add(...borderAccent.split(' '));

        toast.innerHTML = `
            ${iconSvg}
            <div class="flex-1 min-w-0 mr-2">
                ${title ? `<h5 class="text-xs font-bold text-slate-100 tracking-tight">${title}</h5>` : ''}
                <p class="text-xs text-slate-300 mt-0.5 leading-relaxed break-words">${message}</p>
            </div>
            <button type="button" class="btn-close-toast text-slate-500 hover:text-white p-1 rounded-lg transition-colors flex-shrink-0">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
            </button>
            <div class="toast-progress absolute bottom-0 left-0 right-0 h-0.5 ${progressBg} origin-left" style="animation: toastProgress ${duration}ms linear forwards;"></div>
        `;

        this.container.appendChild(toast);

        // Animar entrada
        requestAnimationFrame(() => {
            toast.classList.remove('translate-x-12', 'opacity-0');
            toast.classList.add('translate-x-0', 'opacity-100');
        });

        // Manejar cierre manual
        const closeBtn = toast.querySelector('.btn-close-toast');
        const removeToast = () => {
            toast.classList.remove('translate-x-0', 'opacity-100');
            toast.classList.add('translate-x-12', 'opacity-0');
            setTimeout(() => toast.remove(), 300);
        };

        if (closeBtn) closeBtn.addEventListener('click', removeToast);

        // Autocierre
        if (duration > 0) {
            setTimeout(removeToast, duration);
        }
    }

    success(message, title = 'Operación Exitosa') {
        this.show({ title, message, type: 'success' });
    }

    error(message, title = 'Ocurrió un Error') {
        this.show({ title, message, type: 'error', duration: 5000 });
    }

    warning(message, title = 'Atención') {
        this.show({ title, message, type: 'warning', duration: 4500 });
    }

    info(message, title = 'Información') {
        this.show({ title, message, type: 'info' });
    }
}

export const Toast = new ToastServiceSingleton();
