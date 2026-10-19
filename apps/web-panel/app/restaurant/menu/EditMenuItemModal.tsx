'use client';

import { useState, useEffect, useTransition } from 'react';
import { createClient } from '@/utils/supabase/client';
import { updateMenuItem, createMenuImageUploadUrl } from './actions';

export interface MenuItemData {
  id: string;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  menu_category_id: string | null;
  is_active: boolean;
  optionGroupIds?: string[];
}

interface EditMenuItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: MenuItemData | null;
  categories: { id: string; name: string }[];
  optionGroups?: { id: string; name: string }[];
  restaurantId: string;
}

export default function EditMenuItemModal({
  isOpen,
  onClose,
  item,
  categories,
  optionGroups = [],
  restaurantId,
}: EditMenuItemModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [selectedGroupIds, setSelectedGroupIds] = useState<string[]>([]);
  const [preview, setPreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (item) {
      setName(item.name || '');
      setDescription(item.description || '');
      setPrice(item.price !== undefined ? item.price.toString() : '');
      setCategoryId(item.menu_category_id || '');
      setSelectedGroupIds(item.optionGroupIds || []);
      setPreview(item.image_url || null);
      setImageFile(null);
      setError(null);
    }
  }, [item]);

  if (!isOpen || !item) return null;

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;
    setImageFile(file);
    if (file) {
      setPreview(URL.createObjectURL(file));
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!item) return;
    const currentItem = item;
    setError(null);

    startTransition(async () => {
      let newImageUrl: string | undefined = undefined;

      if (imageFile && imageFile.size > 0) {
        const fileExt = imageFile.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${fileExt}`;

        const signed = await createMenuImageUploadUrl(restaurantId, fileName);
        if (signed.error || !signed.signedUrl) {
          setError(signed.error ?? 'Error al preparar la subida de la imagen');
          return;
        }

        const uploadRes = await fetch(signed.signedUrl, {
          method: 'PUT',
          headers: {
            'Content-Type': imageFile.type || 'application/octet-stream',
            'Cache-Control': '3600',
            'x-upsert': 'false',
          },
          body: imageFile,
        });

        if (!uploadRes.ok) {
          const detail = await uploadRes.text().catch(() => '');
          console.error('Error uploading image:', uploadRes.status, detail);
          setError('Error al subir la nueva imagen');
          return;
        }

        const supabase = createClient();
        const { data: urlData } = supabase.storage
          .from('menu_images')
          .getPublicUrl(signed.filePath);
        newImageUrl = urlData.publicUrl;
      }

      const payload = new FormData();
      payload.append('itemId', currentItem.id);
      payload.append('restaurantId', restaurantId);
      payload.append('name', name);
      payload.append('description', description);
      payload.append('price', price);
      payload.append('categoryId', categoryId);
      payload.append('optionGroupIds', JSON.stringify(selectedGroupIds));

      const result = await updateMenuItem(payload, newImageUrl);
      if (result.error) {
        setError(result.error);
      } else {
        onClose();
      }
    });
  }

  return (
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
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '16px 20px',
            borderBottom: '1px solid var(--border)',
          }}
        >
          <div>
            <h3 style={{ fontSize: '17px', fontWeight: 600, color: 'var(--ink)' }}>
              Editar Plato
            </h3>
            <p style={{ fontSize: '13px', color: 'var(--ink-muted)', marginTop: '2px' }}>
              Modifica los detalles del plato en tu catálogo
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isPending}
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--ink-muted)',
              padding: '6px',
              borderRadius: '8px',
            }}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ padding: '20px' }} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="panel-label">Nombre del Plato *</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="panel-input"
                disabled={isPending}
              />
            </div>

            <div>
              <label className="panel-label">Categoría *</label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                required
                className="panel-input"
                disabled={isPending}
              >
                <option value="">Selecciona una categoría</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="panel-label">Precio (S/.) *</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                required
                className="panel-input"
                style={{ fontVariantNumeric: 'tabular-nums' }}
                disabled={isPending}
              />
            </div>

            <div>
              <label className="panel-label">Cambiar Imagen</label>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="panel-input"
                disabled={isPending}
              />
            </div>
          </div>

          <div>
            <label className="panel-label">Descripción</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="panel-input"
              style={{ resize: 'vertical' }}
              disabled={isPending}
              placeholder="Ingredientes, detalles de preparación o guarnición"
            />
          </div>

          {/* Grupos de opciones aplicables a este plato */}
          {optionGroups.length > 0 && (
            <div>
              <label className="panel-label">
                Grupos de Opciones / Personalización para este plato
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-1">
                {optionGroups.map((group) => {
                  const isChecked = selectedGroupIds.includes(group.id);
                  return (
                    <label
                      key={group.id}
                      className="flex items-center gap-2.5 p-2.5 rounded-lg border cursor-pointer text-xs transition-colors"
                      style={{
                        borderColor: isChecked ? 'var(--brand)' : 'var(--border)',
                        background: isChecked
                          ? 'var(--brand-soft, rgba(242, 159, 48, 0.08))'
                          : 'var(--surface-subtle, rgba(0,0,0,0.02))',
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedGroupIds((prev) => [...prev, group.id]);
                          } else {
                            setSelectedGroupIds((prev) =>
                              prev.filter((id) => id !== group.id),
                            );
                          }
                        }}
                        disabled={isPending}
                        style={{
                          width: '15px',
                          height: '15px',
                          accentColor: 'var(--brand)',
                        }}
                      />
                      <span
                        style={{
                          fontWeight: isChecked ? 600 : 400,
                          color: isChecked ? 'var(--brand)' : 'var(--ink)',
                        }}
                      >
                        {group.name}
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>
          )}

          {preview && (
            <div>
              <span className="panel-label">Vista Previa de Imagen</span>
              <div
                style={{
                  width: '96px',
                  height: '96px',
                  borderRadius: '10px',
                  overflow: 'hidden',
                  border: '1px solid var(--border)',
                  marginTop: '4px',
                }}
              >
                <img
                  src={preview}
                  alt="Preview"
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              </div>
            </div>
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
              onClick={onClose}
              disabled={isPending}
              className="panel-btn-secondary"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isPending || !name.trim() || !price || !categoryId}
              className="panel-btn-primary"
            >
              {isPending ? 'Guardando...' : 'Guardar Cambios'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
