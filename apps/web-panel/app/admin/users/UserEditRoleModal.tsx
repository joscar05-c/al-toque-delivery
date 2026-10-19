'use client';

import { useState, useTransition } from 'react';
import { updateUserRole } from './actions';
import { X, User, AlertCircle, Shield } from 'lucide-react';

export interface UserItem {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  phone_verified: boolean;
  is_active: boolean;
  role_id: number | null;
  created_at: string;
  role?: { id: number; name: string } | null;
}

interface UserEditRoleModalProps {
  user: UserItem;
  onClose: () => void;
}

const ROLES = [
  { id: 1, name: 'Cliente', desc: 'Realiza pedidos y visualiza el catálogo de comida.' },
  { id: 2, name: 'Repartidor', desc: 'Gestiona entregas asignadas y ubicación GPS.' },
  { id: 3, name: 'Propietario Restaurante', desc: 'Administra su restaurante, menús y pedidos en cocina.' },
  { id: 4, name: 'Administrador', desc: 'Acceso total a la plataforma y configuración.' },
];

export default function UserEditRoleModal({ user, onClose }: UserEditRoleModalProps) {
  const [selectedRoleId, setSelectedRoleId] = useState<number>(user.role_id || 1);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    startTransition(async () => {
      const result = await updateUserRole(user.id, selectedRoleId);
      if (result.error) {
        setError(result.error);
      } else {
        onClose();
      }
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
      <div className="section-card w-full max-w-md p-6 bg-white shadow-xl relative animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between pb-3 border-b mb-4" style={{ borderColor: 'var(--border)' }}>
          <div className="flex items-center gap-2">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center text-sm"
              style={{ background: 'var(--brand-soft)', color: 'var(--brand)' }}
            >
              <Shield style={{ width: '16px', height: '16px' }} />
            </div>
            <div>
              <h3 className="text-base font-bold" style={{ color: 'var(--ink)' }}>
                Cambiar Rol de Usuario
              </h3>
              <p className="text-xs truncate max-w-[200px]" style={{ color: 'var(--ink-muted)' }}>
                {user.name || user.phone || user.id}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-md text-gray-400 hover:text-gray-700 hover:bg-gray-100"
          >
            <X style={{ width: '18px', height: '18px' }} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            {ROLES.map((role) => (
              <label
                key={role.id}
                className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                  selectedRoleId === role.id
                    ? 'border-orange-500 bg-orange-50/50'
                    : 'border-gray-200 hover:bg-gray-50'
                }`}
              >
                <input
                  type="radio"
                  name="roleId"
                  value={role.id}
                  checked={selectedRoleId === role.id}
                  onChange={() => setSelectedRoleId(role.id)}
                  className="mt-1"
                  disabled={isPending}
                />
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold" style={{ color: 'var(--ink)' }}>
                      {role.name}
                    </span>
                    <span className="text-xs font-mono text-gray-400">ID: {role.id}</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">{role.desc}</p>
                </div>
              </label>
            ))}
          </div>

          {error && (
            <div
              className="text-xs p-2.5 rounded-md flex items-center gap-2"
              style={{ background: 'var(--danger-soft)', color: 'var(--danger)' }}
            >
              <AlertCircle style={{ width: '16px', height: '16px', flexShrink: 0 }} />
              <span>{error}</span>
            </div>
          )}

          <div className="pt-3 border-t flex items-center justify-end gap-2" style={{ borderColor: 'var(--border)' }}>
            <button
              type="button"
              onClick={onClose}
              disabled={isPending}
              className="panel-btn-secondary"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isPending || selectedRoleId === user.role_id}
              className="panel-btn-primary"
            >
              {isPending ? 'Guardando...' : 'Asignar Rol'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
