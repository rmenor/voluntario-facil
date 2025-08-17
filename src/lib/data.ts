'use server';

import type { Position, PopulatedShift, Shift, User, Assembly, PopulatedAssembly } from '@/lib/types';
import db from '@/lib/db';

const generateId = () => Math.random().toString(36).substr(2, 9);

const getAssemblyVolunteerIds = (assemblyId: string): string[] => {
  const rows = db.prepare('SELECT volunteerId FROM assembly_volunteers WHERE assemblyId = ?').all(assemblyId) as { volunteerId: string }[];
  return rows.map(r => r.volunteerId);
};

// Users
export const getUsers = async (): Promise<User[]> => {
  return db.prepare('SELECT * FROM users').all() as User[];
};

export const getUser = async (id: string): Promise<User | null> => {
  const row = db.prepare('SELECT * FROM users WHERE id = ?').get(id) as User | undefined;
  return row || null;
};

export const getUserByEmail = async (email: string): Promise<User | undefined> => {
  const row = db.prepare('SELECT * FROM users WHERE email = ?').get(email) as User | undefined;
  return row;
};

// Positions
export const getPositions = async (): Promise<Position[]> => {
  return db.prepare('SELECT * FROM positions').all() as Position[];
};

// Assemblies
export const getAssemblies = async (): Promise<Assembly[]> => {
  const rows = db.prepare('SELECT * FROM assemblies ORDER BY startDate DESC').all() as any[];
  return rows.map(r => ({
    id: r.id,
    title: r.title,
    startDate: new Date(r.startDate),
    endDate: new Date(r.endDate),
    volunteerIds: getAssemblyVolunteerIds(r.id),
    type: r.type
  }));
};

export const getPopulatedAssemblies = async (): Promise<PopulatedAssembly[]> => {
  const assemblies = await getAssemblies();
  const stmt = db.prepare('SELECT u.* FROM users u JOIN assembly_volunteers av ON u.id = av.volunteerId WHERE av.assemblyId = ?');
  return assemblies.map(a => ({
    ...a,
    volunteers: stmt.all(a.id) as User[]
  }));
};

// Shifts
export const getPopulatedShifts = async (): Promise<PopulatedShift[]> => {
  const rows = db.prepare(`
    SELECT s.*, p.name as pName, p.description as pDescription, p.iconName as pIconName,
           a.title as aTitle, a.startDate as aStartDate, a.endDate as aEndDate, a.type as aType,
           u.id as uId, u.name as uName, u.phone as uPhone, u.email as uEmail, u.role as uRole, u.passwordHash as uPasswordHash
    FROM shifts s
    JOIN positions p ON s.positionId = p.id
    JOIN assemblies a ON s.assemblyId = a.id
    LEFT JOIN users u ON s.volunteerId = u.id
  `).all() as any[];

  const shifts = rows.map(r => ({
    id: r.id,
    positionId: r.positionId,
    volunteerId: r.volunteerId,
    startTime: new Date(r.startTime),
    endTime: new Date(r.endTime),
    assemblyId: r.assemblyId,
    rejectionReason: r.rejectionReason || null,
    rejectedBy: r.rejectedBy || null,
    position: { id: r.positionId, name: r.pName, description: r.pDescription, iconName: r.pIconName },
    volunteer: r.volunteerId ? { id: r.uId, name: r.uName, phone: r.uPhone, email: r.uEmail, role: r.uRole, passwordHash: r.uPasswordHash } : null,
    assembly: { id: r.assemblyId, title: r.aTitle, startDate: new Date(r.aStartDate), endDate: new Date(r.aEndDate), volunteerIds: getAssemblyVolunteerIds(r.assemblyId), type: r.aType }
  })) as PopulatedShift[];

  return shifts.sort((a,b) => a.startTime.getTime() - b.startTime.getTime());
};

// CRUD Operations
export const addUser = async (userData: Omit<User, 'id' | 'passwordHash'> & { password?: string }) => {
  const newUser: User = { id: generateId(), ...userData, passwordHash: userData.password || 'password' };
  db.prepare('INSERT INTO users (id, name, phone, email, role, passwordHash) VALUES (@id, @name, @phone, @email, @role, @passwordHash)').run(newUser);
  return newUser;
};

export const updateUser = async (userId: string, userData: Partial<Omit<User, 'id' | 'passwordHash'>>) => {
  const sets = Object.keys(userData).map(k => `${k} = @${k}`).join(', ');
  db.prepare(`UPDATE users SET ${sets} WHERE id = @id`).run({ id: userId, ...userData });
  return getUser(userId);
};

export const addPosition = async (positionData: Omit<Position, 'id'>) => {
  const newPosition: Position = { id: generateId(), ...positionData };
  db.prepare('INSERT INTO positions (id, name, description, iconName) VALUES (@id, @name, @description, @iconName)').run(newPosition);
  return newPosition;
};

export const addAssembly = async (assemblyData: Omit<Assembly, 'id' | 'volunteerIds'>) => {
  const newAssembly: Assembly = { id: generateId(), ...assemblyData, volunteerIds: [] };
  db.prepare('INSERT INTO assemblies (id, title, startDate, endDate, type) VALUES (@id, @title, @startDate, @endDate, @type)').run({ ...newAssembly, startDate: newAssembly.startDate.toISOString(), endDate: newAssembly.endDate.toISOString() });
  return newAssembly;
};

export const updateAssembly = async (assemblyId: string, assemblyData: Partial<Omit<Assembly, 'id'>>) => {
  const data: any = { ...assemblyData };
  if (data.startDate) data.startDate = data.startDate.toISOString();
  if (data.endDate) data.endDate = data.endDate.toISOString();
  const sets = Object.keys(data).map(k => `${k} = @${k}`).join(', ');
  if (sets) db.prepare(`UPDATE assemblies SET ${sets} WHERE id = @id`).run({ id: assemblyId, ...data });
};

export const associateVolunteerToAssembly = async (assemblyId: string, volunteerId: string) => {
  db.prepare('INSERT OR IGNORE INTO assembly_volunteers (assemblyId, volunteerId) VALUES (?, ?)').run(assemblyId, volunteerId);
};

export const addShift = async (shiftData: Omit<Shift, 'id' | 'rejectionReason' | 'rejectedBy'>) => {
  const newShift: Shift = { id: generateId(), ...shiftData };
  db.prepare('INSERT INTO shifts (id, positionId, volunteerId, startTime, endTime, assemblyId) VALUES (@id, @positionId, @volunteerId, @startTime, @endTime, @assemblyId)').run({ ...newShift, startTime: newShift.startTime.toISOString(), endTime: newShift.endTime.toISOString() });
  return newShift;
};

export const updateShift = async (shiftId: string, volunteerId: string | null) => {
  db.prepare('UPDATE shifts SET volunteerId = ?, rejectionReason = NULL, rejectedBy = NULL WHERE id = ?').run(volunteerId, shiftId);
};

export const rejectShift = async (shiftId: string, volunteerId: string, reason: string | null) => {
  if (!volunteerId) throw new Error('Cannot reject a shift without a volunteer.');
  db.prepare('UPDATE shifts SET volunteerId = NULL, rejectionReason = ?, rejectedBy = ? WHERE id = ?').run(reason || 'Sin motivo', volunteerId, shiftId);
};
