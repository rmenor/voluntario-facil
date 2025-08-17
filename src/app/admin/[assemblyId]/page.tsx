import { getPopulatedShifts, getPopulatedAssemblies, getUsers, getPositions } from '@/lib/data';
import AssemblyDetailDashboard from '@/components/admin/AssemblyDetailDashboard';
import { notFound } from 'next/navigation';

export default async function AssemblyDetailPage({ params }: { params: { assemblyId: string } }) {
  const { assemblyId } = params;
  
  const allAssemblies = await getPopulatedAssemblies();
  const allUsers = await getUsers();
  
  const assembly = allAssemblies.find(a => a.id === assemblyId);
  
  if (!assembly) {
    notFound();
  }
  
  const shifts = await getPopulatedShifts(assemblyId);
  const positions = await getPositions(assemblyId);

  // The volunteers for this assembly are already populated in the assembly object
  const volunteers = assembly.volunteers;

  return (
      <AssemblyDetailDashboard 
        assembly={assembly}
        initialShifts={shifts}
        initialVolunteers={volunteers}
        allUsers={allUsers}
        allPositions={positions}
      />
  );
}

    