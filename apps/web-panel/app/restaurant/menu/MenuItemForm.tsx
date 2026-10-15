'use client';

import { useState, useTransition } from 'react';
import { createClient } from '@/utils/supabase/client';
import { createMenuItem, createMenuImageUploadUrl } from './actions';

interface MenuItemFormProps {
  restaurantId: string;
  categories: { id: string; name: string }[];
}

export default function MenuItemForm({ restaurantId, categories }: MenuItemFormProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [categoryId, setCategoryId] = useState('');
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
      // Generar una URL de subida firmada en el servidor (service_role, bypass
      // RLS) y subir el archivo directo a esa URL. Así no dependemos del token
      // de Firebase en el cliente ni del límite de body del Server Action.
      let imageUrl: string | null = null;
      if (imageFile && imageFile.size > 0) {
        const fileExt = imageFile.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${fileExt}`;

        const signed = await createMenuImageUploadUrl(restaurantId, fileName);
        if (signed.error || !signed.signedUrl) {
          setError(signed.error ?? 'Error al preparar la subida de la imagen');
          return;
        }

        // Hacemos el PUT directo a la URL firmada con fetch. No usamos
        // supabase-js uploadToSignedUrl porque éste re-valida el JWT de la URL
        // en el cliente y falla con "Invalid Compact JWS" (incompatibilidad de
        // versiones). La URL firmada ya viene autorizada por el servidor.
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

      // Armamos un FormData limpio (sin el File) y pasamos la URL aparte.
      const payload = new FormData();
      payload.append('restaurantId', restaurantId);
      payload.append('name', (formData.get('name') as string) ?? '');
      payload.append('description', (formData.get('description') as string) ?? '');
      payload.append('price', (formData.get('price') as string) ?? '');
      payload.append('categoryId', (formData.get('categoryId') as string) ?? '');

      const result = await createMenuItem(payload, imageUrl);
      if (result.error) setError(result.error);
      else {
        setName('');
        setDescription('');
        setPrice('');
        setCategoryId('');
        setImageFile(null);
        if (preview) URL.revokeObjectURL(preview);
        setPreview(null);
      }
    });
  }

  return (
    <form action={handleSubmit} className="space-y-4 max-w-2xl">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
          <input
            name="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            disabled={isPending}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Categoría</label>
          <select
            name="categoryId"
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            disabled={isPending}
          >
            <option value="">Selecciona una categoría</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Precio (S/.)</label>
          <input
            name="price"
            type="number"
            step="0.01"
            min="0"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            disabled={isPending}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Imagen</label>
          <input
            name="image"
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            disabled={isPending}
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
        <textarea
          name="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          disabled={isPending}
          placeholder="Descripción opcional del plato"
        />
      </div>

      {preview && (
        <div className="relative w-32 h-32 rounded-lg overflow-hidden border border-gray-200">
          <img src={preview} alt="Preview" className="w-full h-full object-cover" />
        </div>
      )}

      <input name="restaurantId" type="hidden" value={restaurantId} />

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={isPending || !name.trim() || !price || !categoryId}
          className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isPending ? 'Creando...' : 'Agregar Plato'}
        </button>
        {error && <span className="text-red-600 text-sm">{error}</span>}
      </div>
    </form>
  );
}