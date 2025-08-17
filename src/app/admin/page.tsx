import AdminDashboard from '@/components/admin/AdminDashboard';
import { getPositions, getPopulatedAssemblies, getUsers, getPopulatedShifts } from '@/lib/data';

export default async function AdminPage() {
  const users = await getUsers();
  const positions = await getPositions();
  const assemblies = await getPopulatedAssemblies();
  const shifts = await getPopulatedShifts();
  
  return (
    <AdminDashboard
      initialUsers={users}
      initialPositions={positions}
      initialShifts={shifts}
      initialAssemblies={assemblies}
    />
  );
}
