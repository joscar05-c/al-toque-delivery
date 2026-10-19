'use client';

import { useState, useMemo } from 'react';
import { toggleMenuItem, deleteMenuItem } from './actions';
import EditMenuItemModal, { type MenuItemData } from './EditMenuItemModal';

interface MenuGridProps {
  items: MenuItemData[];
  categories: { id: string; name: string }[];
  optionGroups?: { id: string; name: string }[];
  restaurantId: string;
}

export default function MenuGrid({
  items,
  categories,
  optionGroups = [],
  restaurantId,
}: MenuGridProps) {
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [pendingToggles, setPendingToggles] = useState<Set<string>>(new Set());
  const [editingItem, setEditingItem] = useState<MenuItemData | null>(null);

  // Map of categories by ID for quick lookup
  const categoryMap = useMemo(() => {
    const map = new Map<string, string>();
    categories.forEach((c) => map.set(c.id, c.name));
    return map;
  }, [categories]);

  // Filtered items
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      // Category filter
      if (selectedCategoryId !== 'all') {
        if (selectedCategoryId === 'uncategorized') {
          if (item.menu_category_id) return false;
        } else if (item.menu_category_id !== selectedCategoryId) {
          return false;
        }
      }

      // Search query filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesName = item.name.toLowerCase().includes(query);
        const matchesDesc = item.description?.toLowerCase().includes(query);
        return matchesName || matchesDesc;
      }

      return true;
    });
  }, [items, selectedCategoryId, searchQuery]);

  // Category counts
  const categoryCounts = useMemo(() => {
    const counts = new Map<string, number>();
    let uncategorizedCount = 0;

    items.forEach((item) => {
      if (item.menu_category_id) {
        counts.set(item.menu_category_id, (counts.get(item.menu_category_id) || 0) + 1);
      } else {
        uncategorizedCount += 1;
      }
    });

    return { counts, uncategorizedCount };
  }, [items]);

  async function handleToggle(itemId: string, currentStatus: boolean) {
    setPendingToggles((prev) => new Set(prev).add(itemId));
    const result = await toggleMenuItem(itemId, currentStatus, restaurantId);
    setPendingToggles((prev) => {
      const next = new Set(prev);
      next.delete(itemId);
      return next;
    });
    if (result.error) {
      alert(result.error);
    }
  }

  async function handleDelete(itemId: string, name: string) {
    if (!confirm(`¿Estás seguro de que deseas eliminar "${name}" del menú?`)) return;
    setPendingToggles((prev) => new Set(prev).add(itemId));
    const result = await deleteMenuItem(itemId, restaurantId);
    setPendingToggles((prev) => {
      const next = new Set(prev);
      next.delete(itemId);
      return next;
    });
    if (result.error) {
      alert(result.error);
    }
  }

  return (
    <div className="space-y-4">
      {/* Filters and search bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        {/* Category Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
          <button
            type="button"
            onClick={() => setSelectedCategoryId('all')}
            style={{
              padding: '6px 12px',
              fontSize: '13px',
              fontWeight: 500,
              borderRadius: '8px',
              border: 'none',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              background:
                selectedCategoryId === 'all'
                  ? 'var(--brand)'
                  : 'var(--surface-subtle, rgba(0,0,0,0.03))',
              color: selectedCategoryId === 'all' ? '#fff' : 'var(--ink)',
              transition: 'all 150ms ease',
            }}
          >
            Todos ({items.length})
          </button>

          {categories.map((c) => {
            const count = categoryCounts.counts.get(c.id) || 0;
            const isSelected = selectedCategoryId === c.id;
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => setSelectedCategoryId(c.id)}
                style={{
                  padding: '6px 12px',
                  fontSize: '13px',
                  fontWeight: 500,
                  borderRadius: '8px',
                  border: 'none',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  background: isSelected
                    ? 'var(--brand)'
                    : 'var(--surface-subtle, rgba(0,0,0,0.03))',
                  color: isSelected ? '#fff' : 'var(--ink)',
                  transition: 'all 150ms ease',
                }}
              >
                {c.name} ({count})
              </button>
            );
          })}

          {categoryCounts.uncategorizedCount > 0 && (
            <button
              type="button"
              onClick={() => setSelectedCategoryId('uncategorized')}
              style={{
                padding: '6px 12px',
                fontSize: '13px',
                fontWeight: 500,
                borderRadius: '8px',
                border: 'none',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                background:
                  selectedCategoryId === 'uncategorized'
                    ? 'var(--danger)'
                    : 'var(--danger-soft, rgba(239, 68, 68, 0.1))',
                color: selectedCategoryId === 'uncategorized' ? '#fff' : 'var(--danger)',
                transition: 'all 150ms ease',
              }}
            >
              Sin Categoría ({categoryCounts.uncategorizedCount})
            </button>
          )}
        </div>

        {/* Quick Search */}
        <div style={{ minWidth: '200px' }}>
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar plato..."
            className="panel-input text-xs py-1.5"
          />
        </div>
      </div>

      {/* Grid */}
      {filteredItems.length === 0 ? (
        <div
          style={{
            textAlign: 'center',
            color: 'var(--ink-muted)',
            padding: '48px 0',
            fontSize: '14px',
            border: '1px dashed var(--border)',
            borderRadius: '12px',
          }}
        >
          {items.length === 0
            ? 'No hay platos registrados en este restaurante.'
            : 'No se encontraron platos con el filtro seleccionado.'}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 grid-responsive-4">
          {filteredItems.map((item) => {
            const categoryName = item.menu_category_id
              ? categoryMap.get(item.menu_category_id) || 'Categoría'
              : 'Sin categoría';

            const optionGroupsCount = item.optionGroupIds?.length ?? 0;

            return (
              <div
                key={item.id}
                style={{
                  background: 'var(--surface)',
                  border: '1px solid var(--border)',
                  borderRadius: '12px',
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column',
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
                {/* Image & Status Badge */}
                <div
                  style={{
                    aspectRatio: '16 / 10',
                    background: 'var(--surface-inset)',
                    position: 'relative',
                  }}
                >
                  {item.image_url ? (
                    <img
                      src={item.image_url}
                      alt={item.name}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        display: 'block',
                      }}
                    />
                  ) : (
                    <div
                      style={{
                        width: '100%',
                        height: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'var(--ink-muted)',
                      }}
                    >
                      <svg
                        className="w-10 h-10"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1.5}
                          d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                      </svg>
                    </div>
                  )}

                  {/* Category Pill Tag */}
                  <span
                    style={{
                      position: 'absolute',
                      top: '8px',
                      left: '8px',
                      fontSize: '11px',
                      fontWeight: 600,
                      padding: '3px 8px',
                      borderRadius: '6px',
                      background: 'rgba(0, 0, 0, 0.65)',
                      color: '#fff',
                      backdropFilter: 'blur(4px)',
                    }}
                  >
                    {categoryName}
                  </span>

                  {/* Option Groups Count Badge */}
                  {optionGroupsCount > 0 && (
                    <span
                      style={{
                        position: 'absolute',
                        top: '8px',
                        right: '8px',
                        fontSize: '10px',
                        fontWeight: 600,
                        padding: '3px 7px',
                        borderRadius: '6px',
                        background: 'var(--brand)',
                        color: '#fff',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                      }}
                    >
                      {optionGroupsCount} {optionGroupsCount === 1 ? 'grupo' : 'grupos'}
                    </span>
                  )}

                  {!item.is_active && (
                    <div
                      style={{
                        position: 'absolute',
                        inset: 0,
                        background: 'rgba(0,0,0,0.55)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <span
                        className="badge badge-danger"
                        style={{
                          fontSize: '12px',
                          fontWeight: 600,
                          padding: '4px 12px',
                          background: 'var(--danger)',
                          color: '#fff',
                        }}
                      >
                        Agotado
                      </span>
                    </div>
                  )}
                </div>

                {/* Content */}
                <div
                  style={{
                    padding: '14px',
                    display: 'flex',
                    flexDirection: 'column',
                    flex: 1,
                    justifyContent: 'space-between',
                  }}
                >
                  <div>
                    <h3
                      style={{
                        fontSize: '14px',
                        fontWeight: 600,
                        color: 'var(--ink)',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {item.name}
                    </h3>
                    {item.description && (
                      <p
                        style={{
                          fontSize: '13px',
                          color: 'var(--ink-muted)',
                          lineHeight: 1.4,
                          marginTop: '4px',
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                        }}
                      >
                        {item.description}
                      </p>
                    )}
                  </div>

                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginTop: '12px',
                      paddingTop: '12px',
                      borderTop: '1px solid var(--border)',
                    }}
                  >
                    <span
                      style={{
                        fontSize: '16px',
                        fontWeight: 700,
                        color: 'var(--ink)',
                        fontVariantNumeric: 'tabular-nums',
                      }}
                    >
                      S/ {Number(item.price).toFixed(2)}
                    </span>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      {/* Availability toggle */}
                      <button
                        onClick={() => handleToggle(item.id, item.is_active)}
                        disabled={pendingToggles.has(item.id)}
                        style={{
                          padding: '4px 10px',
                          fontSize: '11px',
                          fontWeight: 600,
                          borderRadius: '6px',
                          border: 'none',
                          cursor: 'pointer',
                          transition: 'transform 100ms ease, opacity 150ms ease',
                          background: item.is_active
                            ? 'var(--danger-soft)'
                            : 'var(--success-soft)',
                          color: item.is_active ? 'var(--danger)' : 'var(--success)',
                          opacity: pendingToggles.has(item.id) ? 0.5 : 1,
                        }}
                      >
                        {item.is_active ? 'Agotado' : 'Disponible'}
                      </button>

                      {/* Edit item */}
                      <button
                        type="button"
                        onClick={() => setEditingItem(item)}
                        disabled={pendingToggles.has(item.id)}
                        title="Editar plato"
                        style={{
                          padding: '5px',
                          borderRadius: '6px',
                          border: '1px solid var(--border)',
                          background: 'transparent',
                          color: 'var(--ink-secondary)',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <svg
                          className="w-3.5 h-3.5 hover:text-amber-600 transition-colors"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                          strokeWidth={1.75}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                          />
                        </svg>
                      </button>

                      {/* Delete item */}
                      <button
                        type="button"
                        onClick={() => handleDelete(item.id, item.name)}
                        disabled={pendingToggles.has(item.id)}
                        title="Eliminar plato del menú"
                        style={{
                          padding: '5px',
                          borderRadius: '6px',
                          border: '1px solid var(--border)',
                          background: 'transparent',
                          color: 'var(--ink-muted)',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <svg
                          className="w-3.5 h-3.5 hover:text-red-600 transition-colors"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                          strokeWidth={1.75}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Edit modal */}
      <EditMenuItemModal
        isOpen={editingItem !== null}
        onClose={() => setEditingItem(null)}
        item={editingItem}
        categories={categories}
        optionGroups={optionGroups}
        restaurantId={restaurantId}
      />
    </div>
  );
}
