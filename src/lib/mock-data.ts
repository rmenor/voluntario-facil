import type { Position, PopulatedShift, User, PopulatedAssembly, Shift, Assembly } from '@/lib/types';

export const initialUsers: User[] = [
  { id: '1', name: 'Admin User', phone: '123-456-7890', email: 'admin@example.com', role: 'admin', passwordHash: 'adminpassword' },
  { id: '2', name: 'Ana García', phone: '234-567-8901', email: 'ana@example.com', role: 'volunteer', passwordHash: 'password' },
  { id: '3', name: 'Carlos Rodriguez', phone: '345-678-9012', email: 'carlos@example.com', role: 'volunteer', passwordHash: 'password' },
  { id: '4', name: 'Beatriz López', phone: '456-789-0123', email: 'beatriz@example.com', role: 'volunteer', passwordHash: 'password' },
];

export const initialPositions: Position[] = [
  { id: 'p1', name: 'Registro y Bienvenida', description: 'Recibir a los asistentes y entregar materiales.', iconName: 'Handshake' },
  { id: 'p2', name: 'Punto de Información', description: 'Resolver dudas y orientar a los participantes.', iconName: 'MapPin' },
  { id: 'p3', name: 'Logística de Escenario', description: 'Apoyo en el montaje y desmontaje del escenario.', iconName: 'ClipboardList' },
  { id: 'p4', name: 'Comunicación y Redes', description: 'Cubrir el evento en redes sociales.', iconName: 'Megaphone' },
  { id: 'p5', name: 'Coordinación de Voluntarios', description: 'Gestionar equipos de voluntarios en el terreno.', iconName: 'Users' },
  { id: 'p6', name: 'Atención a Ponentes', description: 'Asistir a los ponentes con sus necesidades.', iconName: 'HeartHandshake' },
  { id: 'p7', name: 'Catering', description: 'Apoyo en la zona de comidas y bebidas.', iconName: 'Utensils' },
  { id: 'p8', name: 'Control de Acceso', description: 'Verificar entradas y acreditaciones.', iconName: 'Ticket' },
];

const assembly1Volunteers = initialUsers.filter(u => ['Ana García', 'Carlos Rodriguez', 'Beatriz López'].includes(u.name));
const assembly2Volunteers = initialUsers.filter(u => ['Ana García'].includes(u.name));


export const initialAssemblies: PopulatedAssembly[] = [
    { 
        id: 'a1', 
        title: 'Asamblea General Anual 2024', 
        startDate: new Date('2024-10-26T00:00:00'), 
        endDate: new Date('2024-10-27T23:59:59'), 
        volunteerIds: assembly1Volunteers.map(v => v.id),
        volunteers: assembly1Volunteers
    },
    { 
        id: 'a2', 
        title: 'Encuentro de Verano', 
        startDate: new Date('2024-08-15T00:00:00'), 
        endDate: new Date('2024-08-15T23:59:59'), 
        volunteerIds: assembly2Volunteers.map(v => v.id),
        volunteers: assembly2Volunteers
    },
];

const findUser = (name: string) => initialUsers.find(u => u.name === name);
const findPosition = (name: string) => initialPositions.find(p => p.name === name);
const findAssembly = (title: string) => initialAssemblies.find(a => a.title === title);

export const initialShifts: PopulatedShift[] = [
    { 
        id: 's1', 
        position: findPosition('Registro y Bienvenida')!,
        positionId: findPosition('Registro y Bienvenida')!.id,
        volunteer: findUser('Ana García')!,
        volunteerId: findUser('Ana García')!.id,
        startTime: new Date('2024-10-26T08:00:00'), 
        endTime: new Date('2024-10-26T12:00:00'), 
        assembly: findAssembly('Asamblea General Anual 2024')!,
        assemblyId: findAssembly('Asamblea General Anual 2024')!.id,
    },
    { 
        id: 's2', 
        position: findPosition('Punto de Información')!,
        positionId: findPosition('Punto de Información')!.id,
        volunteer: findUser('Carlos Rodriguez')!,
        volunteerId: findUser('Carlos Rodriguez')!.id,
        startTime: new Date('2024-10-26T08:00:00'), 
        endTime: new Date('2024-10-26T12:00:00'), 
        assembly: findAssembly('Asamblea General Anual 2024')!,
        assemblyId: findAssembly('Asamblea General Anual 2024')!.id,
    },
    { 
        id: 's3',
        position: findPosition('Logística de Escenario')!,
        positionId: findPosition('Logística de Escenario')!.id,
        volunteer: findUser('Beatriz López')!,
        volunteerId: findUser('Beatriz López')!.id,
        startTime: new Date('2024-10-26T09:00:00'),
        endTime: new Date('2024-10-26T13:00:00'),
        assembly: findAssembly('Asamblea General Anual 2024')!,
        assemblyId: findAssembly('Asamblea General Anual 2024')!.id,
    },
    { 
        id: 's4',
        position: findPosition('Catering')!,
        positionId: findPosition('Catering')!.id,
        volunteer: null,
        volunteerId: null,
        startTime: new Date('2024-10-27T10:00:00'),
        endTime: new Date('2024-10-27T14:00:00'),
        assembly: findAssembly('Asamblea General Anual 2024')!,
        assemblyId: findAssembly('Asamblea General Anual 2024')!.id,
    },
    { 
        id: 's5',
        position: findPosition('Registro y Bienvenida')!,
        positionId: findPosition('Registro y Bienvenida')!.id,
        volunteer: null,
        volunteerId: null,
        startTime: new Date('2024-10-27T12:00:00'),
        endTime: new Date('2024-10-27T16:00:00'),
        assembly: findAssembly('Asamblea General Anual 2024')!,
        assemblyId: findAssembly('Asamblea General Anual 2024')!.id,
    },
    { 
        id: 's6',
        position: findPosition('Punto de Información')!,
        positionId: findPosition('Punto de Información')!.id,
        volunteer: findUser('Ana García')!,
        volunteerId: findUser('Ana García')!.id,
        startTime: new Date('2024-10-27T12:00:00'),
        endTime: new Date('2024-10-27T16:00:00'),
        assembly: findAssembly('Asamblea General Anual 2024')!,
        assemblyId: findAssembly('Asamblea General Anual 2024')!.id,
    },
    { 
        id: 's7',
        position: findPosition('Control de Acceso')!,
        positionId: findPosition('Control de Acceso')!.id,
        volunteer: null,
        volunteerId: null,
        startTime: new Date('2024-08-15T13:00:00'),
        endTime: new Date('2024-08-15T17:00:00'),
        assembly: findAssembly('Encuentro de Verano')!,
        assemblyId: findAssembly('Encuentro de Verano')!.id,
    },
    { 
      id: 's8',
      position: findPosition('Comunicación y Redes')!,
      positionId: findPosition('Comunicación y Redes')!.id,
      volunteer: null,
      volunteerId: null, 
      startTime: new Date('2024-10-26T14:00:00'), 
      endTime: new Date('2024-10-26T18:00:00'), 
      assembly: findAssembly('Asamblea General Anual 2024')!,
      assemblyId: findAssembly('Asamblea General Anual 2024')!.id, 
      rejectionReason: 'Tengo otro compromiso',
      rejectedBy: findUser('Carlos Rodriguez')!.id,
    },
];
