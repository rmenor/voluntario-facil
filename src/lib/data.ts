'use server';

import type { Position, PopulatedShift, Shift, User, Assembly, PopulatedAssembly } from '@/lib/types';
import { initialUsers, initialPositions, initialAssemblies, initialShifts } from '@/lib/mock-data';

// --- In-memory data store ---
let users: User[] = JSON.parse(JSON.stringify(initialUsers));
let positions: Position[] = JSON.parse(JSON.stringify(initialPositions));
let assemblies: Assembly[] = JSON.parse(JSON.stringify(initialAssemblies.map(a => {
    const { volunteers, ...rest } = a;
    return rest;
})));
let shifts: Shift[] = JSON.parse(JSON.stringify(initialShifts.map(s => {
    const { position, volunteer, assembly, ...rest } = s;
    return rest;
})));


const parseDatesInObject = <T extends { startTime?: any, endTime?: any, startDate?: any, endDate?: any }>(item: T): T => {
    const newItem = { ...item };
    if (item.startTime && typeof item.startTime === 'string') newItem.startTime = new Date(item.startTime);
    if (item.endTime && typeof item.endTime === 'string') newItem.endTime = new Date(item.endTime);
    if (item.startDate && typeof item.startDate === 'string') newItem.startDate = new Date(item.startDate);
    if (item.endDate && typeof item.endDate === 'string') newItem.endDate = new Date(item.endDate);
    return newItem;
};

const parseDatesInArray = <T extends { startTime?: any, endTime?: any, startDate?: any, endDate?: any }>(items: T[]): T[] => {
    return items.map(parseDatesInObject);
};

shifts = parseDatesInArray(shifts);
assemblies = parseDatesInArray(assemblies);

// Helper to generate IDs
const generateId = () => Math.random().toString(36).substr(2, 9);

// --- API Functions ---

// Users
export const getUsers = async (): Promise<User[]> => {
    return JSON.parse(JSON.stringify(users));
};

export const getUser = async (id: string): Promise<User | null> => {
    const user = users.find(u => u.id === id);
    return user ? JSON.parse(JSON.stringify(user)) : null;
}

export const getUserByEmail = async (email: string): Promise<User | undefined> => {
    const user = users.find(u => u.email === email);
    return user ? JSON.parse(JSON.stringify(user)) : undefined;
}

// Positions
export const getPositions = async (): Promise<Position[]> => {
    return JSON.parse(JSON.stringify(positions));
};

// Assemblies
export const getPopulatedAssemblies = async (): Promise<PopulatedAssembly[]> => {
    const populatedAssemblies = assemblies.map(assembly => {
        const assemblyVolunteers = users.filter(user => assembly.volunteerIds.includes(user.id));
        return {
            ...assembly,
            volunteers: assemblyVolunteers
        };
    });
    // Simulating the server-to-client data transfer by stringifying and then parsing dates back.
    const stringified = JSON.stringify(populatedAssemblies);
    return parseDatesInArray(JSON.parse(stringified));
}

export const getAssemblies = async (): Promise<Assembly[]> => {
    const sorted = assemblies.sort((a,b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());
    // Simulating the server-to-client data transfer by stringifying and then parsing dates back.
    const stringified = JSON.stringify(sorted);
    return parseDatesInArray(JSON.parse(stringified));
}

// Shifts
export const getPopulatedShifts = async (): Promise<PopulatedShift[]> => {
    const populated = shifts.map(shift => {
        const position = positions.find(p => p.id === shift.positionId);
        const assembly = assemblies.find(a => a.id === shift.assemblyId);
        if (!position || !assembly) return null;

        return {
            ...shift,
            position,
            volunteer: shift.volunteerId ? users.find(u => u.id === shift.volunteerId) || null : null,
            assembly,
        };
    }).filter((s): s is PopulatedShift => s !== null);
    
    const sorted = populated.sort((a,b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
    
    // Simulating the server-to-client data transfer by stringifying and then parsing dates back.
    const stringified = JSON.stringify(sorted);
    return parseDatesInArray(JSON.parse(stringified));
};

// --- CRUD Operations (for Server Actions) ---
export const addUser = async (userData: Omit<User, 'id' | 'passwordHash'> & { password?: string }) => {
    const newUser: User = {
        id: generateId(),
        ...userData,
        passwordHash: userData.password || 'password'
    };
    users.push(newUser);
    return newUser;
};

export const addPosition = async (positionData: Omit<Position, 'id'>) => {
    const newPosition: Position = { id: generateId(), ...positionData };
    positions.push(newPosition);
    return newPosition;
};

export const addAssembly = async (assemblyData: Omit<Assembly, 'id' | 'volunteerIds'>) => {
    const newAssembly: Assembly = {
        id: generateId(),
        ...assemblyData,
        volunteerIds: [],
    };
    assemblies.push(newAssembly);
    return newAssembly;
};

export const updateAssembly = async (assemblyId: string, assemblyData: Partial<Omit<Assembly, 'id'>>) => {
    const index = assemblies.findIndex(a => a.id === assemblyId);
    if (index !== -1) {
        assemblies[index] = { ...assemblies[index], ...assemblyData };
    }
};

export const associateVolunteerToAssembly = async (assemblyId: string, volunteerId: string) => {
    const assembly = assemblies.find(a => a.id === assemblyId);
    if (assembly && !assembly.volunteerIds.includes(volunteerId)) {
        assembly.volunteerIds.push(volunteerId);
    }
}

export const addShift = async (shiftData: Omit<Shift, 'id' | 'rejectionReason' | 'rejectedBy'>) => {
    const newShift: Shift = { id: generateId(), ...shiftData };
    shifts.push(newShift);
    return newShift;
};

export const updateShift = async (shiftId: string, volunteerId: string | null) => {
    const shift = shifts.find(s => s.id === shiftId);
    if (shift) {
        shift.volunteerId = volunteerId;
        delete shift.rejectionReason;
        delete shift.rejectedBy;
    }
};

export const rejectShift = async (shiftId: string, volunteerId: string, reason: string | null) => {
    const shift = shifts.find(s => s.id === shiftId);
    if (!shift || !volunteerId) {
        throw new Error('Cannot reject a shift without a volunteer.');
    }
    
    shift.volunteerId = null;
    shift.rejectionReason = reason || 'Sin motivo';
    shift.rejectedBy = volunteerId;
}