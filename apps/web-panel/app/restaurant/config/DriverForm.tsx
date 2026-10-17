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
    <form action={handleSubmit} className="flex flex-col sm:flex-row gap-3 mb-6">
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
        className="panel-input flex-1 w-full"
        disabled={isPending}
      />
      <button
        type="submit"
        disabled={isPending || !contact.trim()}
        className="panel-btn-primary whitespace-nowrap"
        style={{
          background: 'var(--success)',
        }}
        onMouseDown={(e) => {
          if (!isPending && contact.trim()) (e.currentTarget.style.transform = 'scale(0.97)');
        }}
        onMouseUp={(e) => {
          e.currentTarget.style.transform = 'scale(1)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'scale(1)';
        }}
      >
        {isPending ? 'Vinculando...' : 'Vincular Repartidor'}
      </button>
      {error && <span className="text-sm self-center" style={{ color: 'var(--danger)' }}>{error}</span>}
      {success && <span className="text-sm self-center" style={{ color: 'var(--success)' }}>✓ Vinculado</span>}
    </form>
  );
}
