'use client';

import { useRef, useState, useTransition } from 'react';
import { createClient } from '@/utils/supabase/client';
import { createRestaurantImageUploadUrl, updateRestaurantImage } from './actions';

interface RestaurantCoverFormProps {
  restaurantId: string;
  initialImageUrl: string | null;
}

export default function RestaurantCoverForm({ restaurantId, initialImageUrl }: RestaurantCoverFormProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [currentUrl, setCurrentUrl] = useState<string | null>(initialImageUrl);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = e.target.files?.[0] ?? null;
    setFile(selected);
    setError(null);
    setSuccess(false);
    setPreview((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return selected ? URL.createObjectURL(selected) : null;
    });
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!file) return;

    setError(null);
    setSuccess(false);

    startTransition(async () => {
      const ext = file.name.split('.').pop()?.toLowerCase() ?? 'jpg';
      const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

      const signed = await createRestaurantImageUploadUrl(restaurantId, fileName);
      if (signed.error || !signed.signedUrl) {
        setError(signed.error ?? 'Error al preparar la subida de la imagen');
        return;
      }

      const uploadRes = await fetch(signed.signedUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': file.type || 'application/octet-stream',
          'Cache-Control': '3600',
          'x-upsert': 'false',
        },
        body: file,
      });

      if (!uploadRes.ok) {
        const detail = await uploadRes.text().catch(() => '');
        console.error('Error uploading restaurant image:', uploadRes.status, detail);
        setError('Error al subir la imagen');
        return;
      }

      const supabase = createClient();
      const { data: urlData } = supabase.storage.from('restaurant_images').getPublicUrl(signed.filePath);

      const result = await updateRestaurantImage(restaurantId, urlData.publicUrl);
      if (result.error) {
        setError(result.error);
        return;
      }

      setCurrentUrl(urlData.publicUrl);
      setFile(null);
      setPreview((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return null;
      });
      if (inputRef.current) inputRef.current.value = '';
      setSuccess(true);
    });
  }

  const shown = preview ?? currentUrl;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div
        className="relative w-full overflow-hidden rounded-xl"
        style={{
          aspectRatio: '16 / 7',
          background: 'var(--surface-inset)',
          border: '1px solid var(--border)',
        }}
      >
        {shown ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={shown} alt="Portada del restaurante" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-2" style={{ color: 'var(--ink-muted)' }}>
            <span className="text-sm">Sin portada</span>
            <span className="text-xs">Así se verá en la app si no subes una imagen</span>
          </div>
        )}
        {preview && (
          <span
            className="absolute left-3 top-3 rounded-full px-2.5 py-0.5 text-xs font-medium"
            style={{ background: 'var(--surface)', color: 'var(--ink-secondary)' }}
          >
            Vista previa
          </span>
        )}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          disabled={isPending}
          className="panel-input flex-1"
        />
        <button
          type="submit"
          disabled={isPending || !file}
          className="panel-btn-primary whitespace-nowrap"
        >
          {isPending ? 'Subiendo...' : 'Guardar portada'}
        </button>
      </div>

      <p className="text-xs" style={{ color: 'var(--ink-muted)' }}>
        Recomendado 1600 × 700 px (proporción 16:7). Se muestra como portada en la app.
      </p>

      {error && (
        <div role="alert" className="rounded-lg p-3 text-sm" style={{ background: 'var(--danger-soft)', color: 'var(--danger)' }}>
          {error}
        </div>
      )}
      {success && (
        <div role="status" className="rounded-lg p-3 text-sm" style={{ background: 'var(--success-soft)', color: 'var(--success)' }}>
          Portada guardada.
        </div>
      )}
    </form>
  );
}
