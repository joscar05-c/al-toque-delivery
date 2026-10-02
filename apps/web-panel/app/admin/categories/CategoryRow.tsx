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
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">{category.id.slice(0, 8)}…</td>
      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{category.name}</td>
      <td className="px-6 py-4 whitespace-nowrap">
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
          category.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
        }`}>
          {category.isActive ? 'Activo' : 'Inactivo'}
        </span>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
        <button
          type="button"
          onClick={handleToggle}
          disabled={isPending}
          className="px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
            category.isActive
              ? 'text-red-600 bg-red-50 hover:bg-red-100'
              : 'text-green-600 bg-green-50 hover:bg-green-100'
          } disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isPending ? '...' : category.isActive ? 'Desactivar' : 'Activar'}
        </button>
        {error && <div className="mt-1 text-red-600 text-xs">{error}</div>}
      </td>
    </tr>
  );
}