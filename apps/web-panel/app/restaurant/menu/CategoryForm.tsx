'use client';

import { useState, useTransition } from 'react';
import { createMenuCategory, updateMenuCategory, deleteMenuCategory } from './actions';

export interface MenuCategoryData {
  id: string;
  name: string;
  description: string | null;
  sortOrder?: number;
  isActive?: boolean;
  itemCount?: number;
}

interface CategoryFormProps {
  restaurantId: string;
  categories: MenuCategoryData[];
}

export default function CategoryForm({ restaurantId, categories }: CategoryFormProps) {
  // New category form state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  // Edit category state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');

  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setError(null);

    startTransition(async () => {
      const result = await createMenuCategory(restaurantId, name.trim(), description.trim());
      if (result.error) {
        setError(result.error);
      } else {
        setName('');
        setDescription('');
        setIsCreating(false);
      }
    });
  }

  function startEditing(category: MenuCategoryData) {
    setEditingId(category.id);
    setEditName(category.name);
    setEditDescription(category.description || '');
    setError(null);
  }

  function cancelEditing() {
    setEditingId(null);
    setEditName('');
    setEditDescription('');
  }

  async function handleUpdate(categoryId: string) {
    if (!editName.trim()) return;
    setError(null);

    startTransition(async () => {
      const result = await updateMenuCategory(
        restaurantId,
        categoryId,
        editName.trim(),
        editDescription.trim() || undefined,
      );
      if (result.error) {
        setError(result.error);
      } else {
        cancelEditing();
      }
    });
  }

  async function handleDelete(category: MenuCategoryData) {
    if (category.itemCount && category.itemCount > 0) {
      alert(
        `La categoría "${category.name}" tiene ${category.itemCount} plato(s) asociado(s). Reasigna o elimina los platos antes de borrarla.`,
      );
      return;
    }

    if (!confirm(`¿Estás seguro de eliminar la categoría "${category.name}"?`)) {
      return;
    }

    setError(null);
    startTransition(async () => {
      const result = await deleteMenuCategory(restaurantId, category.id);
      if (result.error) {
        setError(result.error);
      }
    });
  }

  return (
    <div className="space-y-5">
      {/* List of existing categories */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--ink-secondary)' }}>
            Categorías Activas ({categories.length})
          </span>
          {!isCreating && (
            <button
              type="button"
              onClick={() => setIsCreating(true)}
              className="text-xs font-semibold px-2.5 py-1 rounded-lg"
              style={{
                color: 'var(--brand)',
                background: 'var(--brand-soft, rgba(242, 159, 48, 0.1))',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              + Nueva Categoría
            </button>
          )}
        </div>

        {categories.length === 0 ? (
          <div
            style={{
              padding: '24px',
              textAlign: 'center',
              borderRadius: '10px',
              border: '1px dashed var(--border)',
              color: 'var(--ink-muted)',
              fontSize: '13px',
            }}
          >
            No hay categorías registradas. Agrega una para organizar los platos de tu restaurante.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {categories.map((cat) => {
              const isEditing = editingId === cat.id;

              if (isEditing) {
                return (
                  <div
                    key={cat.id}
                    style={{
                      background: 'var(--surface)',
                      border: '1px solid var(--brand)',
                      borderRadius: '10px',
                      padding: '12px',
                    }}
                    className="space-y-2 shadow-sm"
                  >
                    <input
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      placeholder="Nombre de categoría"
                      className="panel-input text-sm py-1.5"
                      disabled={isPending}
                      autoFocus
                    />
                    <input
                      value={editDescription}
                      onChange={(e) => setEditDescription(e.target.value)}
                      placeholder="Descripción opcional"
                      className="panel-input text-xs py-1.5"
                      disabled={isPending}
                    />
                    <div className="flex items-center justify-end gap-2 pt-1">
                      <button
                        type="button"
                        onClick={cancelEditing}
                        disabled={isPending}
                        className="text-xs px-2.5 py-1 rounded-md"
                        style={{
                          background: 'transparent',
                          border: '1px solid var(--border)',
                          color: 'var(--ink-muted)',
                        }}
                      >
                        Cancelar
                      </button>
                      <button
                        type="button"
                        onClick={() => handleUpdate(cat.id)}
                        disabled={isPending || !editName.trim()}
                        className="text-xs px-2.5 py-1 rounded-md panel-btn-primary"
                      >
                        {isPending ? 'Guardando...' : 'Guardar'}
                      </button>
                    </div>
                  </div>
                );
              }

              return (
                <div
                  key={cat.id}
                  style={{
                    background: 'var(--surface-subtle, rgba(0,0,0,0.02))',
                    border: '1px solid var(--border)',
                    borderRadius: '10px',
                    padding: '12px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                  }}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--ink)' }}>
                        {cat.name}
                      </h4>
                      {cat.description && (
                        <p
                          style={{
                            fontSize: '12px',
                            color: 'var(--ink-muted)',
                            marginTop: '2px',
                            lineHeight: 1.3,
                          }}
                        >
                          {cat.description}
                        </p>
                      )}
                    </div>
                    <span
                      style={{
                        fontSize: '11px',
                        fontWeight: 600,
                        padding: '2px 8px',
                        borderRadius: '12px',
                        background: 'var(--surface-inset)',
                        color: 'var(--ink-secondary)',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {cat.itemCount ?? 0} {cat.itemCount === 1 ? 'plato' : 'platos'}
                    </span>
                  </div>

                  <div className="flex items-center justify-end gap-2 mt-3 pt-2 border-t border-[var(--border)]">
                    <button
                      type="button"
                      onClick={() => startEditing(cat)}
                      disabled={isPending}
                      title="Editar categoría"
                      style={{
                        padding: '4px 8px',
                        fontSize: '11px',
                        fontWeight: 500,
                        borderRadius: '6px',
                        border: '1px solid var(--border)',
                        background: 'var(--surface)',
                        color: 'var(--ink)',
                        cursor: 'pointer',
                      }}
                    >
                      Editar
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(cat)}
                      disabled={isPending}
                      title="Eliminar categoría"
                      style={{
                        padding: '4px 8px',
                        fontSize: '11px',
                        fontWeight: 500,
                        borderRadius: '6px',
                        border: '1px solid var(--border)',
                        background: 'transparent',
                        color: 'var(--danger)',
                        cursor: 'pointer',
                      }}
                    >
                      Eliminar
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Create Category Modal / Inline Form */}
      {isCreating && (
        <form
          onSubmit={handleCreate}
          style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: '12px',
            padding: '16px',
          }}
          className="space-y-3"
        >
          <div className="flex items-center justify-between">
            <h4 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--ink)' }}>
              Nueva Categoría de Menú
            </h4>
            <button
              type="button"
              onClick={() => setIsCreating(false)}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--ink-muted)',
                cursor: 'pointer',
                fontSize: '18px',
              }}
            >
              ✕
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="panel-label">Nombre de Categoría *</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ej. Entradas, Hamburguesas, Bebidas"
                className="panel-input"
                disabled={isPending}
                required
                autoFocus
              />
            </div>
            <div>
              <label className="panel-label">Descripción (Opcional)</label>
              <input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Breve detalle de los platos en esta sección"
                className="panel-input"
                disabled={isPending}
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => setIsCreating(false)}
              disabled={isPending}
              className="panel-btn-secondary text-xs"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isPending || !name.trim()}
              className="panel-btn-primary text-xs"
            >
              {isPending ? 'Creando...' : 'Crear Categoría'}
            </button>
          </div>
        </form>
      )}

      {error && (
        <div
          style={{
            padding: '10px 14px',
            borderRadius: '8px',
            background: 'var(--danger-soft, rgba(239, 68, 68, 0.1))',
            color: 'var(--danger)',
            fontSize: '13px',
          }}
        >
          {error}
        </div>
      )}
    </div>
  );
}
