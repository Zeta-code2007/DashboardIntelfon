import { AuthService } from '../services/authService.js';
import { Toast } from '../services/toastService.js';

/**
 * Renderiza la vista de Gestión y Administración de Usuarios de RED INTELFON.
 * @returns {HTMLElement}
 */
export function renderUsers() {
    const container = document.createElement('div');
    container.className = 'max-w-6xl mx-auto space-y-6';

    container.innerHTML = `
        <div class="card-intelfon p-8 space-y-6">
            <!-- Header y Botón Crear Usuario -->
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-6">
                <div>
                    <h3 class="text-xl font-extrabold text-slate-800 dark:text-white tracking-tight">Gestión y Control de Usuarios</h3>
                    <p class="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Administra los accesos, roles y credenciales autorizadas en la plataforma.</p>
                </div>
                <button type="button" id="btn-toggle-add-user" class="btn-intelfon py-2.5 px-4 text-xs font-bold inline-flex items-center space-x-2 shadow-sm self-start sm:self-auto">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"></path></svg>
                    <span>Nuevo Usuario</span>
                </button>
            </div>

            <!-- Formulario Desplegable para Agregar Usuario (Oculto por defecto) -->
            <div id="add-user-card" class="hidden p-6 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4">
                <div class="flex items-center justify-between">
                    <h4 class="text-sm font-bold text-slate-800 dark:text-white">Registrar Nuevo Miembro</h4>
                    <button type="button" id="btn-close-add-user" class="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                    </button>
                </div>

                <form id="form-create-user-admin" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div>
                        <label class="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">Nombre</label>
                        <input type="text" id="admin-new-name" required placeholder="Ej. Ana Morales" class="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs text-slate-800 dark:text-white focus:ring-2 focus:ring-red-500">
                    </div>
                    <div>
                        <label class="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">Correo Electrónico</label>
                        <input type="email" id="admin-new-email" required placeholder="ana@intelfon.com" class="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs text-slate-800 dark:text-white focus:ring-2 focus:ring-red-500">
                    </div>
                    <div>
                        <label class="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">Contraseña</label>
                        <input type="password" id="admin-new-pass" required placeholder="••••••••" class="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs text-slate-800 dark:text-white focus:ring-2 focus:ring-red-500">
                    </div>
                    <div class="flex items-end">
                        <button type="submit" class="w-full py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-red-600 dark:hover:bg-red-700 text-white font-bold text-xs shadow-xs transition-all flex items-center justify-center space-x-1.5">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>
                            <span>Guardar Usuario</span>
                        </button>
                    </div>
                </form>
            </div>

            <!-- Tabla de Usuarios Registrados -->
            <div class="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs">
                <table class="table-modern">
                    <thead>
                        <tr>
                            <th>Usuario</th>
                            <th>Correo Electrónico</th>
                            <th>Rol / Permiso</th>
                            <th>Fecha Registro</th>
                            <th class="text-right">Acciones</th>
                        </tr>
                    </thead>
                    <tbody id="users-table-body" class="divide-y divide-slate-100 dark:divide-slate-800">
                        <!-- Renderizado dinámico -->
                    </tbody>
                </table>
            </div>
        </div>
    `;

    const tableBody = container.querySelector('#users-table-body');
    const btnToggleAdd = container.querySelector('#btn-toggle-add-user');
    const btnCloseAdd = container.querySelector('#btn-close-add-user');
    const addUserCard = container.querySelector('#add-user-card');
    const formCreate = container.querySelector('#form-create-user-admin');

    function renderUserRows() {
        const users = AuthService.getAllUsers();
        if (users.length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="5" class="py-8 text-center text-slate-400 text-xs">No hay usuarios registrados.</td>
                </tr>
            `;
            return;
        }

        tableBody.innerHTML = users.map(u => {
            const isSuperAdmin = u.role === 'Super Admin' || u.email.includes('admin@');
            const roleBadge = isSuperAdmin 
                ? `<span class="px-2.5 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-300 border border-red-200 dark:border-red-800">Super Admin</span>`
                : `<span class="px-2.5 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800">${u.role || 'Analista'}</span>`;

            const dateStr = u.createdAt ? new Date(u.createdAt).toLocaleDateString() : '2026-08-25';

            return `
                <tr class="hover:bg-slate-50/80 dark:hover:bg-slate-900/60 transition-colors">
                    <td class="font-bold text-slate-800 dark:text-white flex items-center space-x-3">
                        <div class="w-8 h-8 rounded-full bg-gradient-to-br from-red-600 to-red-800 text-white font-bold text-xs flex items-center justify-center shadow-xs">
                            ${(u.name || 'U').charAt(0).toUpperCase()}
                        </div>
                        <span>${u.name}</span>
                    </td>
                    <td class="text-slate-500 dark:text-slate-400 font-mono text-xs">${u.email}</td>
                    <td>${roleBadge}</td>
                    <td class="text-slate-400 text-xs">${dateStr}</td>
                    <td class="text-right">
                        ${isSuperAdmin ? `
                            <span class="text-slate-400 text-xs italic">Protegido</span>
                        ` : `
                            <button type="button" data-delete-email="${u.email}" class="btn-delete-user px-2.5 py-1 rounded-lg text-xs text-red-600 hover:bg-red-50 dark:hover:bg-red-950/60 transition-colors font-semibold">
                                Eliminar
                            </button>
                        `}
                    </td>
                </tr>
            `;
        }).join('');

        // Eventos para eliminar usuarios
        tableBody.querySelectorAll('.btn-delete-user').forEach(btn => {
            btn.addEventListener('click', () => {
                const emailToDelete = btn.getAttribute('data-delete-email');
                if (confirm(`¿Estás seguro de que deseas eliminar al usuario ${emailToDelete}?`)) {
                    let allUsers = AuthService.getAllUsers();
                    allUsers = allUsers.filter(u => u.email !== emailToDelete);
                    localStorage.setItem('intelfon_registered_users_db', JSON.stringify(allUsers));
                    Toast.success(`Usuario ${emailToDelete} eliminado correctamente.`, 'Usuario Eliminado');
                    renderUserRows();
                }
            });
        });
    }

    btnToggleAdd.addEventListener('click', () => {
        addUserCard.classList.toggle('hidden');
    });

    btnCloseAdd.addEventListener('click', () => {
        addUserCard.classList.add('hidden');
    });

    formCreate.addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = container.querySelector('#admin-new-name').value;
        const email = container.querySelector('#admin-new-email').value;
        const pass = container.querySelector('#admin-new-pass').value;

        const res = await AuthService.register(name, email, pass);
        if (res.success) {
            Toast.success(`Usuario ${name} registrado con éxito.`, 'Registro Completado');
            formCreate.reset();
            addUserCard.classList.add('hidden');
            renderUserRows();
        } else {
            Toast.error(res.message || 'Error al registrar usuario.');
        }
    });

    renderUserRows();
    return container;
}
