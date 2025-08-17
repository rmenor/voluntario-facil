import { getPopulatedShifts, getPopulatedAssemblies } from '@/lib/data';
import ScheduleView from '@/components/dashboard/ScheduleView';

export default async function DashboardPage() {
  const shifts = await getPopulatedShifts();
  const assemblies = await getPopulatedAssemblies();
  
  return (
      <ScheduleView shifts={shifts} assemblies={assemblies} />
  );
}
