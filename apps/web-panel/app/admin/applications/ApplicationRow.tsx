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
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="text-sm font-medium text-gray-900">{application.business_name}</div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="text-sm text-gray-500">{application.business_phone}</div>
      </td>
      <td className="px-6 py-4">
        <div className="text-sm text-gray-500 max-w-xs truncate">{application.address}</div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
          {application.city}
        </span>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
        <form action={handleApprove} className="inline">
          <button
            type="submit"
            disabled={isPending}
            className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isPending ? 'Aprobando...' : 'Aprobar'}
          </button>
        </form>
        {error && (
          <div className="mt-2 text-red-600 text-xs">{error}</div>
        )}
      </td>
    </tr>
  );
}