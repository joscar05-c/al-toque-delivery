'use client';

import { useState, useTransition } from 'react';
import { createMenuItem } from './actions';

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
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      setPreview(URL.createObjectURL(file));
    } else {
      setPreview(null);
    }
  }

  async function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = await createMenuItem(formData);
      if (result.error) setError(result.error);
      else {
        setName('');
        setDescription('');
        setPrice('');
        setCategoryId('');
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
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
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