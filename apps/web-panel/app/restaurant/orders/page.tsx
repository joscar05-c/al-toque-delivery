import Link from 'next/link';

export default function RestaurantOrdersPage() {
  return (
    <main className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Restaurante · Pedidos</h1>
          <p className="mt-1 text-gray-600">Gestión de pedidos del restaurante</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-gray-500">Pendiente: implementar listado de pedidos</p>
          <Link
            href="/login"
            className="mt-4 inline-block text-indigo-600 hover:text-indigo-500"
          >
            Cerrar sesión
          </Link>
        </div>
      </div>
    </main>
  );
}