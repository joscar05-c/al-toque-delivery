'use client';

import { useState, useMemo } from 'react';
import UserRow from './UserRow';
import UserEditRoleModal, { UserItem } from './UserEditRoleModal';
import { Search, Users, Shield, Inbox } from 'lucide-react';

interface UsersManagerProps {
  users: UserItem[];
}

export default function UsersManager({ users }: UsersManagerProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'suspended'>('all');
  const [editingUser, setEditingUser] = useState<UserItem | null>(null);

  const counts = useMemo(() => {
    return {
      total: users.length,
      clients: users.filter((u) => u.role_id === 1).length,
      drivers: users.filter((u) => u.role_id === 2).length,
      owners: users.filter((u) => u.role_id === 3).length,
      admins: users.filter((u) => u.role_id === 4).length,
    };
  }, [users]);

  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      // Role filter
      if (roleFilter !== 'all' && String(u.role_id) !== roleFilter) {
        return false;
      }
      // Status filter
      if (statusFilter === 'active' && !u.is_active) return false;
      if (statusFilter === 'suspended' && u.is_active) return false;

      // Search term
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const matchesName = (u.name || '').toLowerCase().includes(term);
        const matchesPhone = (u.phone || '').toLowerCase().includes(term);
        const matchesEmail = (u.email || '').toLowerCase().includes(term);
        const matchesId = u.id.toLowerCase().includes(term);
        return matchesName || matchesPhone || matchesEmail || matchesId;
      }

      return true;
    });
  }, [users, roleFilter, statusFilter, searchTerm]);

  return (
    <div className="space-y-6">
      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="section-card p-4">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">
            Total Usuarios
          </p>
          <p className="text-2xl font-bold mt-1 text-gray-900" style={{ fontVariantNumeric: 'tabular-nums' }}>
            {counts.total}
          </p>
        </div>
        <div className="section-card p-4">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">
            Clientes
          </p>
          <p className="text-2xl font-bold mt-1 text-gray-700" style={{ fontVariantNumeric: 'tabular-nums' }}>
            {counts.clients}
          </p>
        </div>
        <div className="section-card p-4">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-blue-600">
            Repartidores
          </p>
          <p className="text-2xl font-bold mt-1 text-blue-700" style={{ fontVariantNumeric: 'tabular-nums' }}>
            {counts.drivers}
          </p>
        </div>
        <div className="section-card p-4">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-orange-600">
            Dueños Locales
          </p>
          <p className="text-2xl font-bold mt-1 text-orange-700" style={{ fontVariantNumeric: 'tabular-nums' }}>
            {counts.owners}
          </p>
        </div>
        <div className="section-card p-4">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-purple-600">
            Admins
          </p>
          <p className="text-2xl font-bold mt-1 text-purple-700" style={{ fontVariantNumeric: 'tabular-nums' }}>
            {counts.admins}
          </p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por nombre, teléfono, email, ID..."
            className="panel-input pl-9 text-xs"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          )}
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2">
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="panel-input text-xs"
            style={{ width: 'auto' }}
          >
            <option value="all">Todos los roles</option>
            <option value="1">Clientes (1)</option>
            <option value="2">Repartidores (2)</option>
            <option value="3">Dueños Locales (3)</option>
            <option value="4">Administradores (4)</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="panel-input text-xs"
            style={{ width: 'auto' }}
          >
            <option value="all">Todos los estados</option>
            <option value="active">Activos</option>
            <option value="suspended">Suspendidos</option>
          </select>
        </div>
      </div>

      {/* Table Card */}
      <div className="section-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="panel-table w-full">
            <thead>
              <tr>
                <th>Usuario</th>
                <th>Contacto</th>
                <th>Rol</th>
                <th>Estado</th>
                <th>Registro</th>
                <th style={{ textAlign: 'right' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: '64px 16px', textAlign: 'center', color: 'var(--ink-muted)' }}>
                    <div className="flex flex-col items-center justify-center">
                      <Inbox className="w-10 h-10 mb-2 opacity-40 text-gray-400" />
                      <p className="text-sm font-medium text-gray-600">
                        {searchTerm ? 'No se encontraron usuarios con ese criterio' : 'No hay usuarios registrados'}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <UserRow
                    key={user.id}
                    user={user}
                    onEditRole={() => setEditingUser(user)}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL CAMBIO DE ROL FUERA DE LA TABLA */}
      {editingUser && (
        <UserEditRoleModal
          user={editingUser}
          onClose={() => setEditingUser(null)}
        />
      )}
    </div>
  );
}
