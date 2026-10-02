'use client';

import { useState, useTransition } from 'react';
import { addDriver } from './actions';

interface DriverFormProps {
  restaurantId: string;
}

export default function DriverForm({ restaurantId }: DriverFormProps) {
  const [contact, setContact] = useState('');
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(formData: FormData) {
    setError(null);
    setSuccess(false);
    startTransition(async () => {
      const result = await addDriver(formData);
      if (result.error) setError(result.error);
      else {
        setSuccess(true);
        setContact('');
      }
    });
  }

  return (
    <form action={handleSubmit} className="mb-6 flex gap-3 max-w-2xl">
      <input
        name="restaurantId"
        type="hidden"
        value={restaurantId}
      />
      <input
        name="contact"
        value={contact}
        onChange={(e) => setContact(e.target.value)}
        placeholder="Email o teléfono del repartidor"
        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
        disabled={isPending}
      />
      <button
        type="submit"
        disabled={isPending || !contact.trim()}
        className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {isPending ? 'Vinculando...' : 'Vincular Repartidor'}
      </button>
      {error && <span className="text-red-600 text-sm self-center">{error}</span>}
      {success && <span className="text-green-600 text-sm self-center">✓ Vinculado</span>}
    </form>
  );
}