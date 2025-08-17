import type { Position, PopulatedShift, User, PopulatedAssembly, Shift, Assembly } from '@/lib/types';

export const initialUsers: User[] = [
  { id: '1', name: 'Admin User', phone: '123-456-7890', email: 'admin@example.com', role: 'admin', passwordHash: 'adminpassword' },
  { id: '2', name: 'Andrés García', phone: '234-567-8901', email: 'andres@example.com', role: 'volunteer', passwordHash: 'password' },
  { id: '3', name: 'Carlos Rodriguez', phone: '345-678-9012', email: 'carlos@example.com', role: 'volunteer', passwordHash: 'password' },
  { id: '4', name: 'Benito López', phone: '456-789-0123', email: 'benito@example.com', role: 'volunteer', passwordHash: 'password' },
  { id: '5', name: 'Admin Secundario', phone: '555-555-5555', email: 'admin2@example.com', role: 'admin', passwordHash: 'adminpassword' },
];

export const initialPositions: Position[] = [
  { id: 'p1', name: 'Posición 1', description: 'Control de estacionamiento - Sector A', iconName: 'ParkingCircle' },
  { id: 'p2', name: 'Posición 2', description: 'Control de estacionamiento - Sector B', iconName: 'ParkingCircle' },
  { id: 'p3', name: 'Posición 3', description: 'Control de estacionamiento - Sector C', iconName: 'ParkingCircle' },
  { id: 'p4', name: 'Posición 4', description: 'Control de estacionamiento - Sector D', iconName: 'ParkingCircle' },
  { id: 'p5', name: 'Posición 5', description: 'Control de estacionamiento - Apoyo logístico', iconName: 'TrafficCone' },
  { id: 'p6', name: 'Posición 6', description: 'Control de estacionamiento - Supervisión', iconName: 'UserCheck' },
  { id: 'p7', name: 'Posición 7', description: 'Control de estacionamiento - Comunicación', iconName: 'RadioTower' },
  { id: 'p8', name: 'Posición 8', description: 'Control de estacionamiento - Registro', iconName: 'ClipboardCheck' },
];

const assembly1VolunteerIds = ['2', '3', '4'];
const assembly2VolunteerIds = ['2'];

export const initialAssemblies: PopulatedAssembly[] = [
    {
        id: 'a1',
        title: 'Adoración Pura',
        startDate: new Date('2024-10-26T00:00:00'),
        endDate: new Date('2024-10-27T23:59:59'),
        volunteerIds: assembly1VolunteerIds,
        volunteers: initialUsers.filter(u => assembly1VolunteerIds.includes(u.id)),
        type: 'regional'
    },
    {
        id: 'a2',
        title: 'Asamblea de Circuito',
        startDate: new Date('2024-08-15T00:00:00'),
        endDate: new Date('2024-08-15T23:59:59'),
        volunteerIds: assembly2VolunteerIds,
        volunteers: initialUsers.filter(u => assembly2VolunteerIds.includes(u.id)),
        type: 'circuito'
    },
];


const findUser = (id: string | null) => initialUsers.find(u => u.id === id) || null;
const findPosition = (id: string) => initialPositions.find(p => p.id === id)!;
const findAssembly = (id: string) => initialAssemblies.find(a => a.id === id)!;

export const initialShifts: PopulatedShift[] = [
    {
        id: 's1',
        positionId: 'p1',
        position: findPosition('p1'),
        volunteerId: '2',
        volunteer: findUser('2'),
        startTime: new Date('2024-10-26T08:00:00'),
        endTime: new Date('2024-10-26T12:00:00'),
        assemblyId: 'a1',
        assembly: findAssembly('a1'),
    },
    {
        id: 's2',
        positionId: 'p2',
        position: findPosition('p2'),
        volunteerId: '3',
        volunteer: findUser('3'),
        startTime: new Date('2024-10-26T08:00:00'),
        endTime: new Date('2024-10-26T12:00:00'),
        assemblyId: 'a1',
        assembly: findAssembly('a1'),
    },
    {
        id: 's3',
        positionId: 'p3',
        position: findPosition('p3'),
        volunteerId: '4',
        volunteer: findUser('4'),
        startTime: new Date('2024-10-26T09:00:00'),
        endTime: new Date('2024-10-26T13:00:00'),
        assemblyId: 'a1',
        assembly: findAssembly('a1'),
    },
    {
        id: 's4',
        positionId: 'p4',
        position: findPosition('p4'),
        volunteerId: null,
        volunteer: null,
        startTime: new Date('2024-10-27T10:00:00'),
        endTime: new Date('2024-10-27T14:00:00'),
        assemblyId: 'a1',
        assembly: findAssembly('a1'),
    },
    {
        id: 's5',
        positionId: 'p5',
        position: findPosition('p5'),
        volunteerId: null,
        volunteer: null,
        startTime: new Date('2024-10-27T12:00:00'),
        endTime: new Date('2024-10-27T16:00:00'),
        assemblyId: 'a1',
        assembly: findAssembly('a1'),
    },
    {
        id: 's6',
        positionId: 'p6',
        position: findPosition('p6'),
        volunteerId: '2',
        volunteer: findUser('2'),
        startTime: new Date('2024-10-27T12:00:00'),
        endTime: new Date('2024-10-27T16:00:00'),
        assemblyId: 'a1',
        assembly: findAssembly('a1'),
    },
    {
        id: 's7',
        positionId: 'p7',
        position: findPosition('p7'),
        volunteerId: null,
        volunteer: null,
        startTime: new Date('2024-08-15T13:00:00'),
        endTime: new Date('2024-08-15T17:00:00'),
        assemblyId: 'a2',
        assembly: findAssembly('a2'),
    },
    {
      id: 's8',
      positionId: 'p8',
      position: findPosition('p8'),
      volunteerId: null,
      volunteer: null,
      startTime: new Date('2024-10-26T14:00:00'),
      endTime: new Date('2024-10-26T18:00:00'),
      assemblyId: 'a1',
      assembly: findAssembly('a1'),
    },
];
