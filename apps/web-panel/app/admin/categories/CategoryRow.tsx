'use client';

import { useState, useTransition } from 'react';
import { toggleCategory } from './actions';
import { CategoryItem } from './CategoryEditModal';
import { Edit2, Tag } from 'lucide-react';

interface CategoryRowProps {
  category: CategoryItem;
  onEdit: () => void;
}

export default function CategoryRow({ category, onEdit }: CategoryRowProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  async function handleToggle() {
    setError(null);
    startTransition(async () => {
      const result = await toggleCategory(category.id, category.isActive);
      if (result.error) setError(result.error);
    });
  }

  return (
    <tr className={isPending ? 'opacity-50' : ''}>
      {/* Ícono & Nombre */}
      <td>
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-lg flex items-center justify-center text-lg flex-shrink-0"
            style={{
              background: 'var(--surface-inset)',
              border: '1px solid var(--border)',
            }}
          >
            {category.icon || <Tag style={{ width: '16px', height: '16px', color: 'var(--brand)' }} />}
          </div>
          <div>
            <div style={{ fontWeight: 600, color: 'var(--ink)', fontSize: '14px' }}>
              {category.name}
            </div>
            {category.description && (
              <div
                className="text-xs truncate max-w-[280px] mt-0.5"
                style={{ color: 'var(--ink-muted)' }}
                title={category.description}
              >
                {category.description}
              </div>
            )}
          </div>
        </div>
      </td>

      {/* ID */}
      <td style={{ fontVariantNumeric: 'tabular-nums', fontFamily: 'var(--font-mono)', color: 'var(--ink-muted)', fontSize: '12px' }}>
        {category.id.slice(0, 8)}…
      </td>

      {/* Estado */}
      <td>
        <span className={`badge ${category.isActive ? 'badge-success' : 'badge-neutral'}`}>
          {category.isActive ? '● Activo' : '○ Inactivo'}
        </span>
      </td>

      {/* Acciones */}
      <td style={{ textAlign: 'right' }}>
        <div className="flex items-center justify-end gap-1.5">
          <button
            type="button"
            onClick={onEdit}
            className="panel-btn-secondary"
            style={{ padding: '6px 10px', fontSize: '12px' }}
            title="Editar nombre, ícono y descripción"
          >
            <Edit2 style={{ width: '13px', height: '13px' }} />
            <span>Editar</span>
          </button>

          <button
            type="button"
            onClick={handleToggle}
            disabled={isPending}
            className={`panel-btn-secondary ${isPending ? 'opacity-50 cursor-not-allowed' : ''}`}
            style={{
              padding: '6px 12px',
              fontSize: '12px',
              color: category.isActive ? 'var(--danger)' : 'var(--success)',
              borderColor: category.isActive ? 'var(--danger-soft)' : 'var(--success-soft)',
            }}
          >
            {isPending ? '...' : category.isActive ? 'Desactivar' : 'Activar'}
          </button>
        </div>

        {error && <div className="mt-1" style={{ color: 'var(--danger)', fontSize: '11px', textAlign: 'right' }}>{error}</div>}
      </td>
    </tr>
  );
}
