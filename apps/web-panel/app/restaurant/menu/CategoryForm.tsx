'use client';

import { useState, useTransition } from 'react';
import { createMenuCategory } from './actions';

interface CategoryFormProps {
  restaurantId: string;
}

export default function CategoryForm({ restaurantId }: CategoryFormProps) {
  const [name, setName] = useState('');
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = await createMenuCategory(restaurantId, formData.get('name') as string);
      if (result.error) setError(result.error);
      else setName('');
    });
  }

  return (
    <form action={handleSubmit} className="flex flex-col sm:flex-row gap-3 w-full">
      <input
        name="name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Nombre de la categoría (ej. Entradas, Bebidas)"
        className="panel-input flex-1"
        disabled={isPending}
      />
      <button
        type="submit"
        disabled={isPending || !name.trim()}
        className="panel-btn-primary whitespace-nowrap"
      >
        {isPending ? 'Creando...' : 'Crear'}
      </button>
      {error && <span className="text-sm" style={{ color: 'var(--danger)' }}>{error}</span>}
    </form>
  );
}
