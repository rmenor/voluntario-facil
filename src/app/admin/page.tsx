import AdminDashboard from '@/components/admin/AdminDashboard';
import { getPositions, getUsers, getPopulatedShifts, getPopulatedAssemblies } from '@/lib/data';

export default async function AdminPage() {
  const users = await getUsers();
  const positions = await getPositions();
  const shifts = await getPopulatedShifts();
  const assemblies = await getPopulatedAssemblies();
  
  return (
    <AdminDashboard
      initialUsers={users}
      initialPositions={positions}
      initialShifts={shifts}
      initialAssemblies={assemblies}
    />
  );
}
