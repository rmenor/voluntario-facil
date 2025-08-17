'use client';
import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { getPopulatedShifts, getAssemblies } from '@/lib/data';
import { PopulatedShift, PopulatedAssembly } from '@/lib/types';
import { useEffect, useState, useMemo } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Printer, Loader2 } from 'lucide-react';

function PrintViewContent() {
  const searchParams = useSearchParams();
  const assemblyId = searchParams.get('assemblyId');
  const [shifts, setShifts] = useState<PopulatedShift[]>([]);
  const [assembly, setAssembly] = useState<PopulatedAssembly | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      const allShifts = await getPopulatedShifts();
      const allAssemblies = await getAssemblies();

      const targetAssembly = allAssemblies.find(a => a.id === assemblyId) || null;
      setAssembly(targetAssembly as PopulatedAssembly | null);

      const filtered = assemblyId && assemblyId !== 'all'
        ? allShifts.filter(shift => shift.assemblyId === assemblyId)
        : allShifts;

      setShifts(filtered);
      setLoading(false);
    }
    fetchData();
  }, [assemblyId]);
  
  const groupedShifts = useMemo(() => {
    return shifts.reduce((acc, shift) => {
      const dateKey = format(shift.startTime, 'yyyy-MM-dd');
      if (!acc[dateKey]) {
        acc[dateKey] = [];
      }
      acc[dateKey].push(shift);
      return acc;
    }, {} as Record<string, PopulatedShift[]>);
  }, [shifts]);

  const sortedDates = Object.keys(groupedShifts).sort();

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-8 print:p-0">
      <div className="flex justify-between items-center mb-6 print:hidden">
        <div>
          <h1 className="text-2xl font-bold">Hoja de Turnos</h1>
          <p className="text-muted-foreground">
            {assembly ? assembly.title : 'Todos las asambleas'}
          </p>
        </div>
        <Button onClick={() => window.print()}>
          <Printer className="mr-2 h-4 w-4" /> Imprimir
        </Button>
      </div>

      <div className="print-container">
        <style jsx global>{`
          @media print {
            body {
              background-color: #fff;
            }
            .print-container {
              margin: 0;
              padding: 0;
              font-size: 10pt;
            }
            @page {
              size: A4;
              margin: 20mm;
            }
          }
        `}</style>

        <h1 className="text-xl font-bold text-center mb-1">Hoja de Turnos</h1>
        <h2 className="text-lg text-center text-gray-700 mb-6">
          {assembly ? assembly.title : 'Todas las asambleas'}
        </h2>

        {sortedDates.map(date => (
          <div key={date} className="mb-8 page-break">
            <h3 className="text-lg font-semibold mb-2 capitalize border-b pb-1">
              {format(new Date(date), "eeee, d 'de' MMMM 'de' yyyy", { locale: es })}
            </h3>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[150px]">Horario</TableHead>
                  <TableHead>Posición</TableHead>
                  <TableHead>Voluntario Asignado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {groupedShifts[date].map(shift => (
                  <TableRow key={shift.id}>
                    <TableCell>{format(shift.startTime, 'HH:mm')} - {format(shift.endTime, 'HH:mm')}</TableCell>
                    <TableCell>{shift.position.name}</TableCell>
                    <TableCell>{shift.volunteer?.name || <span className="text-muted-foreground">Sin asignar</span>}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ))}
        {shifts.length === 0 && (
          <div className="text-center py-16 text-muted-foreground">
            No hay turnos para mostrar.
          </div>
        )}
      </div>
    </div>
  );
}

export default function PrintPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <PrintViewContent />
        </Suspense>
    )
}
