'use client';

import { useState, useTransition } from 'react';
import {
  createOptionGroup,
  updateOptionGroup,
  deleteOptionGroup,
  type OptionInput,
} from './actions';

export interface OptionItemData {
  id: string;
  name: string;
  extraPrice: number;
  isActive: boolean;
}

export interface OptionGroupData {
  id: string;
  name: string;
  description: string | null;
  minSelect: number;
  maxSelect: number;
  isRequired: boolean;
  options: OptionItemData[];
}

interface OptionGroupsManagerProps {
  restaurantId: string;
  optionGroups: OptionGroupData[];
}

export default function OptionGroupsManager({
  restaurantId,
  optionGroups,
}: OptionGroupsManagerProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<OptionGroupData | null>(null);

  // Form state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [minSelect, setMinSelect] = useState(0);
  const [maxSelect, setMaxSelect] = useState(1);
  const [isRequired, setIsRequired] = useState(false);
  const [options, setOptions] = useState<OptionInput[]>([
    { name: '', extraPrice: 0 },
  ]);

  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function openCreateModal() {
    setEditingGroup(null);
    setName('');
    setDescription('');
    setMinSelect(0);
    setMaxSelect(1);
    setIsRequired(false);
    setOptions([
      { name: '', extraPrice: 0 },
      { name: '', extraPrice: 0 },
    ]);
    setError(null);
    setIsModalOpen(true);
  }

  function openEditModal(group: OptionGroupData) {
    setEditingGroup(group);
    setName(group.name);
    setDescription(group.description || '');
    setMinSelect(group.minSelect);
    setMaxSelect(group.maxSelect);
    setIsRequired(group.isRequired);
    setOptions(
      group.options.length > 0
        ? group.options.map((o) => ({
            id: o.id,
            name: o.name,
            extraPrice: Number(o.extraPrice) || 0,
          }))
        : [{ name: '', extraPrice: 0 }],
    );
    setError(null);
    setIsModalOpen(true);
  }

  function closeModal() {
    if (isPending) return;
    setIsModalOpen(false);
    setEditingGroup(null);
  }

  function handleAddOptionRow() {
    setOptions((prev) => [...prev, { name: '', extraPrice: 0 }]);
  }

  function handleRemoveOptionRow(index: number) {
    if (options.length <= 1) return;
    setOptions((prev) => prev.filter((_, i) => i !== index));
  }

  function handleOptionChange(
    index: number,
    field: 'name' | 'extraPrice',
    value: string | number,
  ) {
    setOptions((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;

    const validOptions = options.filter((o) => o.name.trim().length > 0);
    if (validOptions.length === 0) {
      setError('Debes agregar al menos una opción al grupo');
      return;
    }

    setError(null);
    startTransition(async () => {
      const payload = {
        name: name.trim(),
        description: description.trim() || undefined,
        minSelect: Number(minSelect) || 0,
        maxSelect: Number(maxSelect) || 1,
        isRequired,
        options: validOptions.map((o) => ({
          name: o.name.trim(),
          extraPrice: Number(o.extraPrice) || 0,
        })),
      };

      let result;
      if (editingGroup) {
        result = await updateOptionGroup(restaurantId, editingGroup.id, payload);
      } else {
        result = await createOptionGroup(restaurantId, payload);
      }

      if (result.error) {
        setError(result.error);
      } else {
        closeModal();
      }
    });
  }

  async function handleDelete(group: OptionGroupData) {
    if (!confirm(`¿Eliminar el grupo "${group.name}" y todas sus opciones?`)) return;

    setError(null);
    startTransition(async () => {
      const result = await deleteOptionGroup(restaurantId, group.id);
      if (result.error) {
        alert(result.error);
      }
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p style={{ fontSize: '13px', color: 'var(--ink-secondary)' }}>
            Permite a los clientes elegir salsas, términos de cocción o adicionales con costo extra.
          </p>
        </div>
        <button
          type="button"
          onClick={openCreateModal}
          className="panel-btn-primary text-xs"
        >
          + Nuevo Grupo de Opciones
        </button>
      </div>

      {optionGroups.length === 0 ? (
        <div
          style={{
            padding: '28px',
            textAlign: 'center',
            borderRadius: '12px',
            border: '1px dashed var(--border)',
            color: 'var(--ink-muted)',
            fontSize: '13px',
          }}
        >
          No has configurado grupos de opciones para este restaurante. Agrega uno (ej. Cremas, Adicionales, Término de cocción).
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {optionGroups.map((group) => (
            <div
              key={group.id}
              style={{
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: '12px',
                padding: '16px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}
              className="shadow-sm hover:border-[var(--brand)] transition-colors"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <h4 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--ink)' }}>
                    {group.name}
                  </h4>
                  <span
                    style={{
                      fontSize: '11px',
                      fontWeight: 600,
                      padding: '2px 8px',
                      borderRadius: '10px',
                      background: group.isRequired
                        ? 'var(--brand-soft, rgba(242, 159, 48, 0.15))'
                        : 'var(--surface-inset)',
                      color: group.isRequired ? 'var(--brand)' : 'var(--ink-muted)',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {group.isRequired ? 'Obligatorio' : 'Opcional'}
                  </span>
                </div>

                {group.description && (
                  <p style={{ fontSize: '12px', color: 'var(--ink-muted)', marginTop: '4px' }}>
                    {group.description}
                  </p>
                )}

                <div className="flex items-center gap-2 mt-2">
                  <span
                    style={{
                      fontSize: '11px',
                      color: 'var(--ink-secondary)',
                      background: 'var(--surface-inset)',
                      padding: '2px 6px',
                      borderRadius: '4px',
                    }}
                  >
                    Mín: {group.minSelect} · Máx: {group.maxSelect}
                  </span>
                  <span style={{ fontSize: '11px', color: 'var(--ink-muted)' }}>
                    {group.options.length} opciones
                  </span>
                </div>

                {/* Options preview */}
                <div className="mt-3 pt-3 border-t border-[var(--border)] space-y-1">
                  {group.options.slice(0, 4).map((opt) => (
                    <div
                      key={opt.id}
                      className="flex items-center justify-between text-xs"
                      style={{ color: 'var(--ink-secondary)' }}
                    >
                      <span className="truncate max-w-[170px]">• {opt.name}</span>
                      <span style={{ fontVariantNumeric: 'tabular-nums', fontWeight: 500 }}>
                        {Number(opt.extraPrice) > 0
                          ? `+S/ ${Number(opt.extraPrice).toFixed(2)}`
                          : 'Gratis'}
                      </span>
                    </div>
                  ))}
                  {group.options.length > 4 && (
                    <span style={{ fontSize: '11px', color: 'var(--ink-muted)' }}>
                      +{group.options.length - 4} más...
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 mt-4 pt-3 border-t border-[var(--border)]">
                <button
                  type="button"
                  onClick={() => openEditModal(group)}
                  style={{
                    padding: '4px 10px',
                    fontSize: '12px',
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
                  onClick={() => handleDelete(group)}
                  style={{
                    padding: '4px 10px',
                    fontSize: '12px',
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
          ))}
        </div>
      )}

      {/* Modal Crear / Editar Grupo */}
      {isModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 50,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(0, 0, 0, 0.45)',
            backdropFilter: 'blur(3px)',
            padding: '16px',
          }}
        >
          <div
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: '16px',
              width: '100%',
              maxWidth: '580px',
              maxHeight: '90vh',
              overflowY: 'auto',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '16px 20px',
                borderBottom: '1px solid var(--border)',
              }}
            >
              <h3 style={{ fontSize: '17px', fontWeight: 600, color: 'var(--ink)' }}>
                {editingGroup ? 'Editar Grupo de Opciones' : 'Nuevo Grupo de Opciones'}
              </h3>
              <button
                type="button"
                onClick={closeModal}
                disabled={isPending}
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

            <form onSubmit={handleSubmit} style={{ padding: '20px' }} className="space-y-4">
              <div>
                <label className="panel-label">Nombre del Grupo *</label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  placeholder="Ej. Elige tus salsas, Toppings extra, Término de carne"
                  className="panel-input"
                  disabled={isPending}
                  autoFocus
                />
              </div>

              <div>
                <label className="panel-label">Descripción (Opcional)</label>
                <input
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Ej. Selecciona hasta 3 opciones"
                  className="panel-input"
                  disabled={isPending}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="panel-label">Mínimo a elegir</label>
                  <input
                    type="number"
                    min="0"
                    max="10"
                    value={minSelect}
                    onChange={(e) => setMinSelect(parseInt(e.target.value, 10) || 0)}
                    className="panel-input"
                    disabled={isPending}
                  />
                </div>
                <div>
                  <label className="panel-label">Máximo a elegir</label>
                  <input
                    type="number"
                    min="1"
                    max="20"
                    value={maxSelect}
                    onChange={(e) => setMaxSelect(parseInt(e.target.value, 10) || 1)}
                    className="panel-input"
                    disabled={isPending}
                  />
                </div>
                <div className="flex items-center gap-2 pt-6">
                  <input
                    type="checkbox"
                    id="isRequiredCheckbox"
                    checked={isRequired}
                    onChange={(e) => setIsRequired(e.target.checked)}
                    disabled={isPending}
                    style={{ width: '16px', height: '16px', accentColor: 'var(--brand)' }}
                  />
                  <label
                    htmlFor="isRequiredCheckbox"
                    style={{ fontSize: '13px', fontWeight: 500, color: 'var(--ink)', cursor: 'pointer' }}
                  >
                    ¿Obligatorio?
                  </label>
                </div>
              </div>

              {/* Lista dinámica de opciones */}
              <div className="pt-2">
                <div className="flex items-center justify-between mb-2">
                  <label className="panel-label mb-0">Opciones del Grupo</label>
                  <button
                    type="button"
                    onClick={handleAddOptionRow}
                    disabled={isPending}
                    className="text-xs font-semibold px-2 py-1 rounded"
                    style={{
                      color: 'var(--brand)',
                      background: 'var(--brand-soft, rgba(242, 159, 48, 0.1))',
                      border: 'none',
                      cursor: 'pointer',
                    }}
                  >
                    + Agregar Opción
                  </button>
                </div>

                <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                  {options.map((opt, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <input
                        value={opt.name}
                        onChange={(e) => handleOptionChange(idx, 'name', e.target.value)}
                        placeholder="Nombre (ej. Mayonesa, Queso extra)"
                        className="panel-input flex-1 text-sm py-1.5"
                        disabled={isPending}
                        required
                      />
                      <div className="flex items-center gap-1" style={{ width: '130px' }}>
                        <span style={{ fontSize: '12px', color: 'var(--ink-muted)' }}>+S/</span>
                        <input
                          type="number"
                          step="0.10"
                          min="0"
                          value={opt.extraPrice}
                          onChange={(e) =>
                            handleOptionChange(idx, 'extraPrice', parseFloat(e.target.value) || 0)
                          }
                          placeholder="0.00"
                          className="panel-input text-sm py-1.5"
                          style={{ fontVariantNumeric: 'tabular-nums' }}
                          disabled={isPending}
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveOptionRow(idx)}
                        disabled={isPending || options.length <= 1}
                        title="Quitar opción"
                        style={{
                          padding: '6px',
                          border: 'none',
                          background: 'transparent',
                          color: 'var(--danger)',
                          cursor: options.length <= 1 ? 'not-allowed' : 'pointer',
                          opacity: options.length <= 1 ? 0.3 : 1,
                        }}
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              </div>

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

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'flex-end',
                  gap: '12px',
                  paddingTop: '16px',
                  borderTop: '1px solid var(--border)',
                }}
              >
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={isPending}
                  className="panel-btn-secondary"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isPending || !name.trim()}
                  className="panel-btn-primary"
                >
                  {isPending ? 'Guardando...' : 'Guardar Grupo'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
