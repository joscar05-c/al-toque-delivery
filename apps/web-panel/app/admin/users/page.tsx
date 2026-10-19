import { redirect } from 'next/navigation';
import { authorizePanelRole, PANEL_ROLE_IDS } from '@/utils/firebase/authorization';
import UsersManager from './UsersManager';
import { UserItem } from './UserEditRoleModal';

export const dynamic = 'force-dynamic';

export default async function AdminUsersPage() {
  const access = await authorizePanelRole(PANEL_ROLE_IDS.admin);
  if (!access) redirect('/dashboard-redirect');

  const { data: rawUsers, error } = await access.supabase
    .from('users')
    .select(`
      id,
      name,
      email,
      phone,
      phone_verified,
      is_active,
      role_id,
      created_at
    `)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[AdminUsersPage] Error cargando usuarios:', error);
    return (
      <div className="section-card p-5" style={{ color: 'var(--danger)' }}>
        <p className="font-semibold text-sm">Error al cargar usuarios</p>
        <p className="text-xs mt-1 opacity-80">{error.message}</p>
      </div>
    );
  }

  const users = (rawUsers ?? []) as unknown as UserItem[];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-title">Usuarios y Roles</h1>
        <p className="page-subtitle">
          Administra clientes, repartidores, dueños de locales y administradores de la plataforma.
        </p>
      </div>

      <UsersManager users={users} />
    </div>
  );
}
