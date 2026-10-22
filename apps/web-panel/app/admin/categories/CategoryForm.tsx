'use client';

import { useState, useTransition } from 'react';
import { createCategory } from './actions';
import { Plus, Tag, X, AlertCircle } from 'lucide-react';

const COMMON_ICONS = ['🍔', '🍕', '🍗', '🍜', '🍣', '🥗', '🌮', '🥩', '🍰', '🍦', '☕', '🥤', '🥪', '🥟', '🍻'];

export default function CategoryForm() {
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedIcon, setSelectedIcon] = useState('🍔');
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!name.trim()) return;

    setError(null);
    const formData = new FormData();
    formData.set('name', name.trim());
    formData.set('description', description.trim());
    formData.set('icon', selectedIcon.trim());

    startTransition(async () => {
      const result = await createCategory(formData);
      if (result.error) {
        setError(result.error);
      } else {
        setName('');
        setDescription('');
        setSelectedIcon('🍔');
        setIsOpen(false);
      }
    });
  }

  return (
    <>
      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => {
            setError(null);
            setIsOpen(true);
          }}
          className="panel-btn-primary"
          style={{ padding: '8px 16px', fontSize: '13px' }}
        >
          <Plus style={{ width: '16px', height: '16px' }} />
          <span>Nueva Categoría</span>
        </button>
      </div>

      {/* MODAL DIALOG */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="section-card w-full max-w-md p-6 bg-white shadow-xl relative animate-in fade-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b mb-4" style={{ borderColor: 'var(--border)' }}>
              <div className="flex items-center gap-2">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-lg"
                  style={{ background: 'var(--brand-soft)' }}
                >
                  {selectedIcon || <Tag style={{ width: '16px', height: '16px', color: 'var(--brand)' }} />}
                </div>
                <div>
                  <h3 className="text-base font-bold" style={{ color: 'var(--ink)' }}>
                    Crear Nueva Categoría
                  </h3>
                  <p className="text-xs" style={{ color: 'var(--ink-muted)' }}>
                    Aparecerá en los filtros de la aplicación móvil y panel web.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  setError(null);
                }}
                className="p-1 rounded-md text-gray-400 hover:text-gray-700 hover:bg-gray-100"
              >
                <X style={{ width: '18px', height: '18px' }} />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="panel-label">
                  Nombre de la categoría (Requerido)
                </label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ej: Hamburguesas, Pollerías, Chifa, Postres..."
                  className="panel-input"
                  required
                  disabled={isPending}
                  autoFocus
                />
              </div>

              <div>
                <label className="panel-label">Ícono / Emoji representativo</label>
                <div className="flex items-center gap-2 mb-2">
                  <input
                    type="text"
                    value={selectedIcon}
                    onChange={(e) => setSelectedIcon(e.target.value)}
                    placeholder="🍔"
                    className="panel-input text-center text-lg w-20"
                    maxLength={10}
                    disabled={isPending}
                  />
                  <span className="text-xs text-gray-400">
                    Selecciona uno rápido o escribe cualquier emoji:
                  </span>
                </div>

                <div className="flex flex-wrap gap-1.5 p-2 rounded-lg" style={{ background: 'var(--surface-inset)', border: '1px solid var(--border)' }}>
                  {COMMON_ICONS.map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => setSelectedIcon(emoji)}
                      className={`w-7 h-7 text-sm rounded flex items-center justify-center transition-transform hover:scale-115 ${
                        selectedIcon === emoji ? 'bg-orange-500 text-white shadow-xs' : 'hover:bg-white'
                      }`}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="panel-label">Descripción (Opcional)</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Breve descripción del tipo de comida o negocios que pertenecen a esta categoría..."
                  rows={2}
                  className="panel-input"
                  style={{ resize: 'vertical' }}
                  disabled={isPending}
                />
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
                  onClick={() => {
                    setIsOpen(false);
                    setError(null);
                  }}
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
                  {isPending ? 'Creando...' : 'Crear Categoría'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
