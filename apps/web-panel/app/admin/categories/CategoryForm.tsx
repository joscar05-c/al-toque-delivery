'use client';

import { useState, useTransition } from 'react';
import { createCategory } from './actions';

export default function CategoryForm() {
  const [name, setName] = useState('');
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = await createCategory(formData);
      if (result.error) setError(result.error);
      else setName('');
    });
  }

  return (
    <form action={handleSubmit} className="mb-6 flex gap-3 max-w-md">
      <input
        name="name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Nombre de la categoría"
        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
        disabled={isPending}
      />
      <button
        type="submit"
        disabled={isPending || !name.trim()}
        className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {isPending ? 'Creando...' : 'Crear'}
      </button>
      {error && <span className="text-red-600 text-sm self-center">{error}</span>}
    </form>
  );
}