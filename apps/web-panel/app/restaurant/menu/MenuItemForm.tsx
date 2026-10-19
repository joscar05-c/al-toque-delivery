'use client';

import { useState, useTransition } from 'react';
import { createClient } from '@/utils/supabase/client';
import { createMenuItem, createMenuImageUploadUrl } from './actions';

interface MenuItemFormProps {
  restaurantId: string;
  categories: { id: string; name: string }[];
  optionGroups?: { id: string; name: string }[];
}

export default function MenuItemForm({
  restaurantId,
  categories,
  optionGroups = [],
}: MenuItemFormProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [selectedGroupIds, setSelectedGroupIds] = useState<string[]>([]);
  const [preview, setPreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;
    setImageFile(file);
    setPreview(file ? URL.createObjectURL(file) : null);
  }

  async function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      let imageUrl: string | null = null;
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
          setError('Error al subir la imagen');
          return;
        }

        const supabase = createClient();
        const { data: urlData } = supabase.storage.from('menu_images').getPublicUrl(signed.filePath);
        imageUrl = urlData.publicUrl;
      }

      const payload = new FormData();
      payload.append('restaurantId', restaurantId);
      payload.append('name', (formData.get('name') as string) ?? '');
      payload.append('description', (formData.get('description') as string) ?? '');
      payload.append('price', (formData.get('price') as string) ?? '');
      payload.append('categoryId', (formData.get('categoryId') as string) ?? '');
      payload.append('optionGroupIds', JSON.stringify(selectedGroupIds));

      const result = await createMenuItem(payload, imageUrl);
      if (result.error) setError(result.error);
      else {
        setName('');
        setDescription('');
        setPrice('');
        setCategoryId('');
        setSelectedGroupIds([]);
        setImageFile(null);
        if (preview) URL.revokeObjectURL(preview);
        setPreview(null);
      }
    });
  }

  if (categories.length === 0) {
    return (
      <div
        style={{
          padding: '16px 20px',
          borderRadius: '10px',
          background: 'var(--brand-soft, rgba(242, 159, 48, 0.08))',
          border: '1px solid rgba(242, 159, 48, 0.25)',
          color: 'var(--ink)',
          fontSize: '13px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
        }}
      >
        <span style={{ fontSize: '20px' }}>💡</span>
        <div>
          <p style={{ fontWeight: 600 }}>Crea una categoría primero</p>
          <p style={{ color: 'var(--ink-secondary)', marginTop: '2px' }}>
            Para agregar platos a tu catálogo, primero debes registrar al menos una categoría arriba (ej. Entradas, Platos de Fondo, Bebidas).
          </p>
        </div>
      </div>
    );
  }

  return (
    <form action={handleSubmit} className="space-y-4 w-full">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="panel-label">Nombre del Plato *</label>
          <input
            name="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            placeholder="Ej. Lomo Saltado, Pizza Margarita"
            className="panel-input"
            disabled={isPending}
          />
        </div>
        <div>
          <label className="panel-label">Categoría *</label>
          <select
            name="categoryId"
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            required
            className="panel-input"
            disabled={isPending}
          >
            <option value="">Selecciona una categoría</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="panel-label">Precio (S/.) *</label>
          <input
            name="price"
            type="number"
            step="0.01"
            min="0"
            placeholder="0.00"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            required
            className="panel-input"
            style={{ fontVariantNumeric: 'tabular-nums' }}
            disabled={isPending}
          />
        </div>
        <div>
          <label className="panel-label">Foto del Plato</label>
          <input
            name="image"
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
          name="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          className="panel-input"
          style={{ resize: 'vertical' }}
          disabled={isPending}
          placeholder="Descripción opcional: ingredientes, acompañamiento, etc."
        />
      </div>

      {/* Selector de Grupos de Opciones */}
      {optionGroups.length > 0 && (
        <div>
          <label className="panel-label">
            Grupos de Opciones y Personalización (Opcional)
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 mt-1">
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
          <span className="panel-label">Vista Previa</span>
          <div style={{
            width: '110px',
            height: '110px',
            borderRadius: '10px',
            overflow: 'hidden',
            border: '1px solid var(--border)',
            marginTop: '4px',
          }}>
            <img src={preview} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
        </div>
      )}

      <input name="restaurantId" type="hidden" value={restaurantId} />

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={isPending || !name.trim() || !price || !categoryId}
          className="panel-btn-primary"
        >
          {isPending ? 'Guardando plato...' : 'Agregar Plato'}
        </button>
        {error && <span className="text-sm" style={{ color: 'var(--danger)' }}>{error}</span>}
      </div>
    </form>
  );
}
