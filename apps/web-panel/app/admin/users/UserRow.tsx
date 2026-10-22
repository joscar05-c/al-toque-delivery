'use client';

import { useState, useTransition } from 'react';
import { toggleUserActive, togglePhoneVerified } from './actions';
import { UserItem } from './UserEditRoleModal';
import { Shield, Phone, Mail, CheckCircle, XCircle } from 'lucide-react';

interface UserRowProps {
  user: UserItem;
  onEditRole: () => void;
}

export default function UserRow({ user, onEditRole }: UserRowProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleToggleActive() {
    setError(null);
    startTransition(async () => {
      const result = await toggleUserActive(user.id, user.is_active);
      if (result.error) setError(result.error);
    });
  }

  function handleTogglePhoneVerified() {
    setError(null);
    startTransition(async () => {
      const result = await togglePhoneVerified(user.id, user.phone_verified);
      if (result.error) setError(result.error);
    });
  }

  const roleBadge = () => {
    switch (user.role_id) {
      case 4:
        return (
          <span className="badge" style={{ background: '#2E1065', color: '#E9D5FF' }}>
            👑 Admin
          </span>
        );
      case 3:
        return (
          <span className="badge" style={{ background: 'var(--brand-soft)', color: 'var(--brand)' }}>
            🍽️ Dueño Local
          </span>
        );
      case 2:
        return (
          <span className="badge" style={{ background: 'var(--info-soft)', color: 'var(--info)' }}>
            🛵 Repartidor
          </span>
        );
      case 1:
      default:
        return (
          <span className="badge badge-neutral">
            👤 Cliente
          </span>
        );
    }
  };

  return (
    <tr className={isPending ? 'opacity-50' : ''}>
      {/* Usuario */}
      <td>
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs flex-shrink-0"
            style={{ background: 'var(--surface-inset)', color: 'var(--ink)' }}
          >
            {(user.name?.[0] || user.phone?.[user.phone.length - 2] || 'U').toUpperCase()}
          </div>
          <div>
            <div style={{ fontWeight: 600, color: 'var(--ink)', fontSize: '14px' }}>
              {user.name || 'Sin nombre registrado'}
            </div>
            <div className="text-[11px] font-mono text-gray-400 mt-0.5">
              ID: {user.id.slice(0, 10)}…
            </div>
          </div>
        </div>
      </td>

      {/* Contacto */}
      <td>
        <div className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--ink)' }}>
          <Phone style={{ width: '12px', height: '12px', color: 'var(--ink-muted)' }} />
          <span style={{ fontVariantNumeric: 'tabular-nums' }}>
            {user.phone || 'Sin teléfono'}
          </span>
          <button
            type="button"
            onClick={handleTogglePhoneVerified}
            disabled={isPending || !user.phone}
            title={user.phone_verified ? 'Teléfono verificado (clic para cambiar)' : 'Teléfono no verificado (clic para verificar)'}
            className="cursor-pointer"
          >
            {user.phone_verified ? (
              <CheckCircle style={{ width: '13px', height: '13px', color: 'var(--success)' }} />
            ) : (
              <XCircle style={{ width: '13px', height: '13px', color: 'var(--ink-muted)' }} />
            )}
          </button>
        </div>

        {user.email && (
          <div className="flex items-center gap-1.5 text-[11px] text-gray-500 mt-1">
            <Mail style={{ width: '11px', height: '11px' }} />
            <span className="truncate max-w-[160px]" title={user.email}>{user.email}</span>
          </div>
        )}
      </td>

      {/* Rol */}
      <td>
        <div className="flex items-center gap-1.5">
          {roleBadge()}
        </div>
      </td>

      {/* Estado */}
      <td>
        <span className={`badge ${user.is_active ? 'badge-success' : 'badge-neutral'}`}>
          {user.is_active ? '● Activo' : '○ Suspendido'}
        </span>
      </td>

      {/* Registro */}
      <td style={{ fontSize: '12px', color: 'var(--ink-muted)' }}>
        {new Date(user.created_at).toLocaleDateString()}
      </td>

      {/* Acciones */}
      <td style={{ textAlign: 'right' }}>
        <div className="flex items-center justify-end gap-1.5">
          <button
            type="button"
            onClick={onEditRole}
            className="panel-btn-secondary"
            style={{ padding: '6px 10px', fontSize: '12px' }}
            title="Cambiar rol"
          >
            <Shield style={{ width: '13px', height: '13px' }} />
            <span>Rol</span>
          </button>

          <button
            type="button"
            onClick={handleToggleActive}
            disabled={isPending}
            className={`panel-btn-secondary ${isPending ? 'opacity-50 cursor-not-allowed' : ''}`}
            style={{
              padding: '6px 10px',
              fontSize: '12px',
              color: user.is_active ? 'var(--danger)' : 'var(--success)',
              borderColor: user.is_active ? 'var(--danger-soft)' : 'var(--success-soft)',
            }}
          >
            {isPending ? '...' : user.is_active ? 'Suspender' : 'Activar'}
          </button>
        </div>

        {error && (
          <div className="mt-1 text-[11px] text-red-600 text-right">
            {error}
          </div>
        )}
      </td>
    </tr>
  );
}
