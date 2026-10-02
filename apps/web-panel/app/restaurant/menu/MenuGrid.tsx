'use client';

import { useState } from 'react';
import { toggleMenuItem } from './actions';

interface MenuGridProps {
  items: {
    id: string;
    name: string;
    description: string | null;
    price: number;
    image_url: string | null;
    is_active: boolean;
    menu_category_id: string | null;
  }[];
}

export default function MenuGrid({ items }: MenuGridProps) {
  const [pendingToggles, setPendingToggles] = useState<Set<string>>(new Set());

  async function handleToggle(itemId: string, currentStatus: boolean) {
    setPendingToggles((prev) => new Set(prev).add(itemId));
    const result = await toggleMenuItem(itemId, currentStatus);
    setPendingToggles((prev) => {
      const next = new Set(prev);
      next.delete(itemId);
      return next;
    });
    if (result.error) {
      alert(result.error);
    }
  }

  if (items.length === 0) {
    return (
      <div className="text-center text-gray-500 py-12">
        No hay platos registrados. Agrega uno arriba.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {items.map((item) => (
        <div
          key={item.id}
          className={`bg-white rounded-xl shadow-sm border overflow-hidden transition-opacity ${
            pendingToggles.has(item.id) ? 'opacity-50' : ''
          }`}
        >
          <div className="aspect-square bg-gray-100 relative">
            {item.image_url ? (
              <img
                src={item.image_url}
                alt={item.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400">
                <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            )}
            {!item.is_active && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                <span className="px-3 py-1 bg-red-600 text-white text-sm font-medium rounded">Agotado</span>
              </div>
            )}
          </div>
          <div className="p-4 space-y-2">
            <h3 className="font-medium text-gray-900 truncate">{item.name}</h3>
            {item.description && (
              <p className="text-sm text-gray-500 line-clamp-2">{item.description}</p>
            )}
            <div className="flex items-center justify-between pt-2 border-t border-gray-100">
              <span className="text-lg font-bold text-gray-900">S/ {item.price.toFixed(2)}</span>
              <button
                onClick={() => handleToggle(item.id, item.is_active)}
                disabled={pendingToggles.has(item.id)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                  item.is_active
                    ? 'text-red-600 bg-red-50 hover:bg-red-100'
                    : 'text-green-600 bg-green-50 hover:bg-green-100'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {item.is_active ? 'Marcar Agotado' : 'Disponible'}
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}