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
      <div style={{
        textAlign: 'center',
        color: 'var(--ink-muted)',
        padding: '48px 0',
        fontSize: '14px',
      }}>
        No hay platos registrados. Agrega uno arriba.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 grid-responsive-4">
      {items.map((item) => (
        <div
          key={item.id}
          style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: '12px',
            overflow: 'hidden',
            transition: 'opacity 200ms ease, box-shadow 200ms ease',
            opacity: pendingToggles.has(item.id) ? 0.5 : 1,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(120, 80, 40, 0.08)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.boxShadow = 'none';
          }}
        >
          {/* Image */}
          <div style={{ aspectRatio: '1 / 1', background: 'var(--surface-inset)', position: 'relative' }}>
            {item.image_url ? (
              <img
                src={item.image_url}
                alt={item.name}
                style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
              />
            ) : (
              <div style={{
                width: '100%',
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--ink-muted)',
              }}>
                <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            )}
            {!item.is_active && (
              <div style={{
                position: 'absolute',
                inset: 0,
                background: 'rgba(0,0,0,0.55)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <span className="badge badge-danger" style={{
                  fontSize: '12px',
                  fontWeight: 600,
                  padding: '4px 12px',
                  background: 'var(--danger)',
                  color: '#fff',
                }}>
                  Agotado
                </span>
              </div>
            )}
          </div>

          {/* Content */}
          <div style={{ padding: '14px' }}>
            <h3 style={{
              fontSize: '14px',
              fontWeight: 600,
              color: 'var(--ink)',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}>
              {item.name}
            </h3>
            {item.description && (
              <p style={{
                fontSize: '13px',
                color: 'var(--ink-muted)',
                lineHeight: 1.4,
                marginTop: '4px',
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
              }}>
                {item.description}
              </p>
            )}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginTop: '12px',
              paddingTop: '12px',
              borderTop: '1px solid var(--border)',
            }}>
              <span style={{
                fontSize: '16px',
                fontWeight: 700,
                color: 'var(--ink)',
                fontVariantNumeric: 'tabular-nums',
              }}>
                S/ {item.price.toFixed(2)}
              </span>
              <button
                onClick={() => handleToggle(item.id, item.is_active)}
                disabled={pendingToggles.has(item.id)}
                style={{
                  padding: '5px 12px',
                  fontSize: '12px',
                  fontWeight: 600,
                  borderRadius: '8px',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'transform 100ms ease, opacity 150ms ease',
                  background: item.is_active ? 'var(--danger-soft)' : 'var(--success-soft)',
                  color: item.is_active ? 'var(--danger)' : 'var(--success)',
                  opacity: pendingToggles.has(item.id) ? 0.5 : 1,
                }}
                onMouseDown={(e) => {
                  if (!pendingToggles.has(item.id)) (e.currentTarget.style.transform = 'scale(0.97)');
                }}
                onMouseUp={(e) => {
                  e.currentTarget.style.transform = 'scale(1)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'scale(1)';
                }}
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
