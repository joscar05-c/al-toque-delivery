'use client';

import { useState, useTransition } from 'react';
import { approveRestaurant } from './actions';

interface ApplicationRowProps {
  application: {
    id: string;
    business_name: string;
    business_phone: string;
    address: string;
    city: string;
    user_id: string;
  };
}

export default function ApplicationRow({ application }: ApplicationRowProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleApprove() {
    setError(null);
    startTransition(async () => {
      const result = await approveRestaurant(application.id);
      if (result.error) {
        setError(result.error);
      }
    });
  }

  return (
    <tr className={isPending ? 'opacity-50' : ''}>
      <td>
        <div style={{ fontWeight: 500, color: 'var(--ink)', fontSize: '14px' }}>{application.business_name}</div>
      </td>
      <td style={{ fontVariantNumeric: 'tabular-nums', color: 'var(--ink-secondary)', fontSize: '14px' }}>
        {application.business_phone}
      </td>
      <td>
        <div style={{ color: 'var(--ink-secondary)', fontSize: '14px', maxWidth: '280px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {application.address}
        </div>
      </td>
      <td>
        <span className="badge badge-info">
          {application.city}
        </span>
      </td>
      <td style={{ textAlign: 'right' }}>
        <form action={handleApprove} className="inline">
          <button
            type="submit"
            disabled={isPending}
            className="panel-btn-primary"
            style={{ background: 'var(--success)', padding: '6px 14px', fontSize: '13px' }}
          >
            {isPending ? 'Aprobando...' : 'Aprobar'}
          </button>
        </form>
        {error && (
          <div style={{ marginTop: '8px', color: 'var(--danger)', fontSize: '12px' }}>{error}</div>
        )}
      </td>
    </tr>
  );
}
