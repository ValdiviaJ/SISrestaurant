import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit2, Trash2, X, Loader2, AlertTriangle, Shield, Mail, User as UserIcon, Lock } from 'lucide-react';
import api from '../../lib/axios';
import { User, UserRole } from '../../types';
import { useAuthStore } from '../../store/useAuthStore';

interface Role {
  id: number;
  name: string;
  slug: string;
}

export const UserCRUD: React.FC = () => {
  const currentUser = useAuthStore((state) => state.user);
  
  // Data State
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Search State
  const [searchQuery, setSearchQuery] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [savingUser, setSavingUser] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});

  // Form State
  const [userForm, setUserForm] = useState({
    name: '',
    email: '',
    password: '',
    role_id: '',
  });

  // Delete State
  const [deletingUserId, setDeletingUserId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Fetch Users and Roles
  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [usersRes, rolesRes] = await Promise.all([
        api.get('/users'),
        api.get('/roles')
      ]);
      setUsers(usersRes.data);
      setRoles(rolesRes.data);
    } catch (err: any) {
      console.error(err);
      setError('Error al cargar la información de usuarios. Verifique que posee permisos de administrador.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Filtered Users List
  const filteredUsers = users.filter((u) => {
    const term = searchQuery.toLowerCase();
    return (
      u.name.toLowerCase().includes(term) ||
      u.email.toLowerCase().includes(term) ||
      u.role.toLowerCase().includes(term)
    );
  });

  // Open Create Modal
  const handleOpenCreate = () => {
    setSelectedUser(null);
    setUserForm({
      name: '',
      email: '',
      password: '',
      role_id: roles.length > 0 ? roles[0].id.toString() : '',
    });
    setFormError(null);
    setFieldErrors({});
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (user: User) => {
    setSelectedUser(user);
    // Find the corresponding role ID from our roles list
    const foundRole = roles.find((r) => r.slug === user.role);
    
    setUserForm({
      name: user.name,
      email: user.email,
      password: '', // Blank password unless changing
      role_id: foundRole ? foundRole.id.toString() : '',
    });
    setFormError(null);
    setFieldErrors({});
    setIsModalOpen(true);
  };

  // Save User (Create/Update)
  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingUser(true);
    setFormError(null);
    setFieldErrors({});

    try {
      const payload: any = {
        name: userForm.name,
        email: userForm.email,
        role_id: parseInt(userForm.role_id),
      };

      // Only send password if provided
      if (userForm.password.trim() !== '') {
        payload.password = userForm.password;
      }

      if (selectedUser) {
        // Edit User
        const res = await api.put(`/users/${selectedUser.id}`, payload);
        setUsers((prev) =>
          prev.map((u) => (u.id === selectedUser.id ? res.data : u))
        );
      } else {
        // Create User
        if (!userForm.password) {
          setFormError('La contraseña es requerida para nuevos usuarios.');
          setSavingUser(false);
          return;
        }
        const res = await api.post('/users', payload);
        setUsers((prev) => [...prev, res.data]);
      }
      
      setIsModalOpen(false);
    } catch (err: any) {
      console.error(err);
      if (err.response && err.response.status === 422) {
        setFieldErrors(err.response.data.errors || {});
        setFormError('Verifique los campos ingresados.');
      } else {
        setFormError(err.response?.data?.message || 'Error al guardar los cambios del usuario.');
      }
    } finally {
      setSavingUser(false);
    }
  };

  // Confirm Delete
  const handleDeleteClick = (user: User) => {
    if (currentUser && currentUser.id === user.id) {
      alert('Seguridad: No puedes eliminar tu propia cuenta de usuario en sesión.');
      return;
    }
    setDeletingUserId(user.id);
  };

  // Execute Delete
  const handleConfirmDelete = async () => {
    if (!deletingUserId) return;
    setDeleting(true);
    try {
      await api.delete(`/users/${deletingUserId}`);
      setUsers((prev) => prev.filter((u) => u.id !== deletingUserId));
      setDeletingUserId(null);
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.message || 'Error al intentar eliminar el usuario.');
    } finally {
      setDeleting(false);
    }
  };

  // Role Badge Styling
  const getRoleBadgeClass = (roleSlug: UserRole) => {
    switch (roleSlug) {
      case 'admin':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-950/20 dark:text-purple-400 border border-purple-200 dark:border-purple-900/30';
      case 'cajero':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-950/20 dark:text-blue-400 border border-blue-200 dark:border-blue-900/30';
      case 'mozo':
        return 'bg-amber-100 text-amber-800 dark:bg-amber-950/20 dark:text-amber-400 border border-amber-200 dark:border-amber-900/30';
      case 'cocina':
        return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/20 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/30';
      default:
        return 'bg-slate-100 text-slate-800 dark:bg-slate-800/20 dark:text-slate-400 border border-slate-200 dark:border-slate-700/30';
    }
  };

  const getRoleLabel = (roleSlug: string) => {
    switch (roleSlug) {
      case 'admin':
        return 'Administrador';
      case 'cajero':
        return 'Cajero';
      case 'mozo':
        return 'Mesero (Mozo)';
      case 'cocina':
        return 'Personal Cocina';
      default:
        return roleSlug;
    }
  };

  return (
    <div className="space-y-6">
      {/* Title / Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">Gestión de Usuarios</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            Administra las cuentas de empleados, sus roles operativos y credenciales.
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white font-semibold shadow-lg shadow-emerald-500/20 text-sm transition-all self-start sm:self-auto"
        >
          <Plus size={18} />
          Nuevo Usuario
        </button>
      </div>

      {/* Action panel & search */}
      <div className="flex items-center justify-between">
        <div className="relative w-full max-w-sm">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
            <Search size={16} />
          </span>
          <input
            type="text"
            placeholder="Buscar por nombre, correo o rol..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none text-xs transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <Loader2 className="animate-spin text-emerald-500" size={32} />
          <p className="text-sm text-slate-500 dark:text-slate-400">Cargando usuarios...</p>
        </div>
      ) : error ? (
        <div className="flex items-start gap-3 p-4 rounded-3xl bg-rose-50 dark:bg-rose-950/15 border border-rose-100 dark:border-rose-900/30 text-rose-700 dark:text-rose-400 text-sm">
          <AlertTriangle className="shrink-0 mt-0.5" size={20} />
          <div className="space-y-1">
            <h4 className="font-bold">Error de Acceso</h4>
            <p className="text-xs leading-relaxed">{error}</p>
            <button 
              onClick={fetchData} 
              className="mt-2 text-xs font-bold underline hover:text-rose-800 dark:hover:text-rose-300"
            >
              Reintentar
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20 text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  <th className="px-6 py-4">Usuario</th>
                  <th className="px-6 py-4">Correo Electrónico</th>
                  <th className="px-6 py-4">Rol Operativo</th>
                  <th className="px-6 py-4">Fecha Registro</th>
                  <th className="px-6 py-4 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-sm">
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-10 text-center text-slate-400 dark:text-slate-500 text-xs">
                      No se encontraron usuarios registrados que coincidan con la búsqueda.
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-950/10 transition-colors">
                      <td className="px-6 py-4 font-bold text-slate-800 dark:text-slate-200">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300 text-xs font-bold uppercase">
                            {u.name.substring(0, 2)}
                          </div>
                          <span>{u.name}</span>
                          {currentUser && currentUser.id === u.id && (
                            <span className="text-[10px] bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-1.5 py-0.5 rounded-md font-medium">
                              Tú
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-slate-500 dark:text-slate-400 font-mono text-xs">
                        {u.email}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold tracking-wide uppercase ${getRoleBadgeClass(u.role)}`}>
                          {getRoleLabel(u.role)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-400 dark:text-slate-500 font-mono text-xs">
                        {u.created_at}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex justify-center gap-2">
                          <button
                            onClick={() => handleOpenEdit(u)}
                            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200/50 dark:border-slate-700/50 transition-colors"
                            title="Editar Usuario"
                          >
                            <Edit2 size={13} />
                          </button>
                          
                          <button
                            onClick={() => handleDeleteClick(u)}
                            disabled={currentUser?.id === u.id}
                            className={`p-2 rounded-xl border transition-colors
                              ${currentUser?.id === u.id
                                ? 'bg-slate-50 dark:bg-slate-950/20 text-slate-300 dark:text-slate-700 border-slate-100 dark:border-slate-850 cursor-not-allowed'
                                : 'bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/10 dark:hover:bg-rose-950/30 text-rose-600 dark:text-rose-450 border-rose-100/60 dark:border-rose-950/40'
                              }
                            `}
                            title={currentUser?.id === u.id ? 'No puedes eliminarte a ti mismo' : 'Eliminar Usuario'}
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* User CRUD Modal (Create / Edit) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 dark:bg-slate-950/60 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800/85 shadow-2xl p-6 relative animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                  <Shield size={18} />
                </div>
                <h3 className="text-lg font-bold text-slate-950 dark:text-white">
                  {selectedUser ? 'Editar Usuario' : 'Nuevo Usuario'}
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Form-level Error Alert */}
            {formError && (
              <div className="mb-4 flex items-start gap-2.5 p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/30 text-rose-700 dark:text-rose-450 text-xs font-semibold">
                <AlertTriangle size={16} className="shrink-0 mt-0.5" />
                <span>{formError}</span>
              </div>
            )}

            {/* User Form */}
            <form onSubmit={handleSaveUser} className="space-y-4">
              {/* Name Field */}
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                  Nombre Completo
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
                    <UserIcon size={14} />
                  </span>
                  <input
                    type="text"
                    required
                    placeholder="Ej. Juan Pérez"
                    value={userForm.name}
                    onChange={(e) => setUserForm({ ...userForm, name: e.target.value })}
                    className={`w-full pl-9 pr-4 py-2.5 rounded-xl border bg-white dark:bg-slate-950 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none text-xs transition-colors
                      ${fieldErrors.name ? 'border-rose-500 focus:border-rose-500 focus:ring-rose-500' : 'border-slate-200 dark:border-slate-800'}
                    `}
                  />
                </div>
                {fieldErrors.name && (
                  <p className="mt-1 text-[10px] font-semibold text-rose-600">{fieldErrors.name[0]}</p>
                )}
              </div>

              {/* Email Field */}
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                  Correo Electrónico
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
                    <Mail size={14} />
                  </span>
                  <input
                    type="email"
                    required
                    placeholder="Ej. empleado@restosuite.com"
                    value={userForm.email}
                    onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                    className={`w-full pl-9 pr-4 py-2.5 rounded-xl border bg-white dark:bg-slate-950 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none text-xs transition-colors
                      ${fieldErrors.email ? 'border-rose-500 focus:border-rose-500 focus:ring-rose-500' : 'border-slate-200 dark:border-slate-800'}
                    `}
                  />
                </div>
                {fieldErrors.email && (
                  <p className="mt-1 text-[10px] font-semibold text-rose-600">{fieldErrors.email[0]}</p>
                )}
              </div>

              {/* Password Field */}
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5 flex justify-between">
                  <span>Contraseña</span>
                  {selectedUser && (
                    <span className="text-[10px] font-medium text-slate-400 normal-case">
                      (Dejar vacío para no cambiar)
                    </span>
                  )}
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
                    <Lock size={14} />
                  </span>
                  <input
                    type="password"
                    required={!selectedUser}
                    placeholder={selectedUser ? '••••••' : 'Mínimo 6 caracteres'}
                    value={userForm.password}
                    onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                    className={`w-full pl-9 pr-4 py-2.5 rounded-xl border bg-white dark:bg-slate-950 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none text-xs transition-colors
                      ${fieldErrors.password ? 'border-rose-500 focus:border-rose-500 focus:ring-rose-500' : 'border-slate-200 dark:border-slate-800'}
                    `}
                  />
                </div>
                {fieldErrors.password && (
                  <p className="mt-1 text-[10px] font-semibold text-rose-600">{fieldErrors.password[0]}</p>
                )}
              </div>

              {/* Role Select Field */}
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5 flex justify-between">
                  <span>Rol Operativo</span>
                  {currentUser && selectedUser && currentUser.id === selectedUser.id && (
                    <span className="text-[10px] font-medium text-rose-500 normal-case">
                      (No puedes cambiar tu propio rol)
                    </span>
                  )}
                </label>
                <select
                  value={userForm.role_id}
                  onChange={(e) => setUserForm({ ...userForm, role_id: e.target.value })}
                  disabled={currentUser !== null && selectedUser !== null && currentUser.id === selectedUser.id}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none text-xs transition-colors text-slate-800 dark:text-slate-200 font-medium disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {roles.map((role) => (
                    <option key={role.id} value={role.id.toString()}>
                      {getRoleLabel(role.slug)} ({role.name})
                    </option>
                  ))}
                </select>
                {fieldErrors.role_id && (
                  <p className="mt-1 text-[10px] font-semibold text-rose-600">{fieldErrors.role_id[0]}</p>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-3 rounded-2xl border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 font-semibold hover:bg-slate-50 dark:hover:bg-slate-800/50 text-xs transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={savingUser}
                  className="flex-1 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white font-semibold shadow-lg shadow-emerald-500/20 text-xs transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  {savingUser && <Loader2 size={14} className="animate-spin" />}
                  <span>{selectedUser ? 'Guardar Cambios' : 'Crear Usuario'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingUserId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 dark:bg-slate-950/60 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800/80 shadow-2xl p-6 text-center animate-in zoom-in-95 duration-200">
            <div className="w-12 h-12 rounded-full bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/30 text-rose-600 dark:text-rose-450 flex items-center justify-center mx-auto mb-4">
              <AlertTriangle size={24} />
            </div>
            
            <h3 className="text-base font-extrabold text-slate-900 dark:text-white mb-2">
              ¿Eliminar cuenta de usuario?
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-6 leading-relaxed">
              Esta acción no se puede deshacer. El empleado perderá acceso inmediato a la plataforma y todos sus registros históricos de comanda permanecerán vinculados.
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => setDeletingUserId(null)}
                disabled={deleting}
                className="flex-1 py-3 rounded-2xl border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 font-semibold hover:bg-slate-50 dark:hover:bg-slate-800/50 text-xs transition-colors disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmDelete}
                disabled={deleting}
                className="flex-1 py-3 rounded-2xl bg-rose-500 hover:bg-rose-600 text-white font-semibold shadow-lg shadow-rose-500/20 text-xs transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                {deleting && <Loader2 size={14} className="animate-spin" />}
                <span>Eliminar Cuenta</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
