'use client';

import { useState, useTransition } from 'react';
import { toggleCategory } from './actions';

interface CategoryRowProps {
  category: {
    id: string;
    name: string;
    isActive: boolean;
  };
}

export default function CategoryRow({ category }: CategoryRowProps) {
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
      <td style={{ fontVariantNumeric: 'tabular-nums', fontFamily: 'var(--font-mono)', color: 'var(--ink-muted)', fontSize: '13px' }}>
        {category.id.slice(0, 8)}…
      </td>
      <td style={{ fontWeight: 500 }}>{category.name}</td>
      <td>
        <span className={`badge ${category.isActive ? 'badge-success' : 'badge-neutral'}`}>
          {category.isActive ? 'Activo' : 'Inactivo'}
        </span>
      </td>
      <td style={{ textAlign: 'right' }}>
        <button
          type="button"
          onClick={handleToggle}
          disabled={isPending}
          className={`panel-btn-secondary ${isPending ? 'opacity-50 cursor-not-allowed' : ''}`}
          style={{
            color: category.isActive ? 'var(--danger)' : 'var(--success)',
            borderColor: category.isActive ? 'var(--danger-soft)' : 'var(--success-soft)',
          }}
        >
          {isPending ? '...' : category.isActive ? 'Desactivar' : 'Activar'}
        </button>
        {error && <div className="mt-1" style={{ color: 'var(--danger)', fontSize: '12px' }}>{error}</div>}
      </td>
    </tr>
  );
}
