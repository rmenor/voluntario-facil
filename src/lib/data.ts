'use server';

import type { Position, PopulatedShift, Shift, User, Assembly, PopulatedAssembly, Conversation, PopulatedConversation, ChatMessage } from '@/lib/types';
import { initialUsers, initialPositions, initialAssemblies, initialShifts, initialConversations, initialMessages } from '@/lib/mock-data';
import fs from 'fs';
import path from 'path';

// --- File-based persistence ---
const dataDir = path.join(process.cwd(), 'src', 'lib', 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const usersPath = path.join(dataDir, 'users.json');
const positionsPath = path.join(dataDir, 'positions.json');
const assembliesPath = path.join(dataDir, 'assemblies.json');
const shiftsPath = path.join(dataDir, 'shifts.json');
const conversationsPath = path.join(dataDir, 'conversations.json');
const messagesPath = path.join(dataDir, 'messages.json');

const readData = <T>(filePath: string, initialData: T): T => {
  try {
    if (fs.existsSync(filePath)) {
      const fileContent = fs.readFileSync(filePath, 'utf-8');
      return JSON.parse(fileContent) as T;
    } else {
      fs.writeFileSync(filePath, JSON.stringify(initialData, null, 2), 'utf-8');
      return initialData;
    }
  } catch (error) {
    console.error(`Error reading data from ${filePath}:`, error);
    // If parsing fails, fall back to initial data
    return initialData;
  }
};

const writeData = <T>(filePath: string, data: T) => {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
  } catch (error) {
    console.error(`Error writing data to ${filePath}:`, error);
  }
};

// --- In-memory data store, initialized from files ---
let users: User[] = readData(usersPath, initialUsers);
let positions: Position[] = readData(positionsPath, initialPositions);
let assemblies: Assembly[] = readData(assembliesPath, initialAssemblies.map(a => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { volunteers, ...rest } = a;
    return rest;
}));
let shifts: Shift[] = readData(shiftsPath, initialShifts.map(s => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { position, volunteer, assembly, ...rest } = s;
    return rest;
}));
let conversations: Conversation[] = readData(conversationsPath, initialConversations);
let messages: ChatMessage[] = readData(messagesPath, initialMessages);


// --- Data Access Functions ---
function generateId() {
    return Math.random().toString(36).substring(2, 11);
}

// USERS
export async function getUsers(): Promise<User[]> {
    return users;
}

export async function getUser(id: string): Promise<User | null> {
    return users.find(u => u.id === id) || null;
}

export async function getUserByEmail(email: string): Promise<User | null> {
    return users.find(u => u.email === email) || null;
}

export async function addUser(user: Omit<User, 'id'>): Promise<User> {
    const newUser = { ...user, id: generateId() };
    users.push(newUser);
    writeData(usersPath, users);
    return newUser;
}

export async function updateUser(id: string, data: Partial<Omit<User, 'id'>>): Promise<User> {
    const userIndex = users.findIndex(u => u.id === id);
    if (userIndex === -1) throw new Error('User not found');
    users[userIndex] = { ...users[userIndex], ...data };
    writeData(usersPath, users);
    return users[userIndex];
}

export async function deleteUser(id: string): Promise<void> {
    const userIndex = users.findIndex(u => u.id === id);
    if (userIndex === -1) throw new Error('User not found');

    // Remove from users
    users.splice(userIndex, 1);
    writeData(usersPath, users);

    // Unassign from shifts
    shifts = shifts.map(s => s.volunteerId === id ? { ...s, volunteerId: null } : s);
    writeData(shiftsPath, shifts);

    // Remove from assemblies
    assemblies = assemblies.map(a => ({
        ...a,
        volunteerIds: a.volunteerIds.filter(vId => vId !== id)
    }));
    writeData(assembliesPath, assemblies);

    // Remove from conversations
    conversations = conversations.map(c => ({
        ...c,
        participantIds: c.participantIds.filter(pId => pId !== id)
    }));
    writeData(conversationsPath, conversations);
}


// POSITIONS
export async function getPositions(assemblyId?: string): Promise<Position[]> {
    if (assemblyId) {
        return positions.filter(p => p.assemblyId === assemblyId);
    }
    return positions;
}

export async function addPosition(position: Omit<Position, 'id'>): Promise<Position> {
    const newPosition = { ...position, id: generateId() };
    positions.push(newPosition);
    writeData(positionsPath, positions);
    return newPosition;
}

export async function updatePosition(id: string, data: Partial<Omit<Position, 'id' | 'assemblyId'>>): Promise<Position> {
    const positionIndex = positions.findIndex(p => p.id === id);
    if (positionIndex === -1) throw new Error('Position not found');
    positions[positionIndex] = { ...positions[positionIndex], ...data };
    writeData(positionsPath, positions);
    return positions[positionIndex];
}

export async function deletePosition(id: string): Promise<void> {
    const positionIndex = positions.findIndex(p => p.id === id);
    if (positionIndex === -1) throw new Error('Position not found');
    
    // Unassign this position from all shifts
    shifts = shifts.map(s => s.positionId === id ? { ...s, positionId: 'unassigned' } : s); // Or handle differently
    writeData(shiftsPath, shifts);

    positions.splice(positionIndex, 1);
    writeData(positionsPath, positions);
}


// ASSEMBLIES
export async function getAssemblies(): Promise<Assembly[]> {
    return assemblies;
}

export async function getPopulatedAssemblies(): Promise<PopulatedAssembly[]> {
    return assemblies.map(assembly => ({
        ...assembly,
        startDate: new Date(assembly.startDate),
        endDate: new Date(assembly.endDate),
        volunteers: users.filter(user => assembly.volunteerIds.includes(user.id))
    }));
}

export async function addAssembly(assemblyData: Omit<Assembly, 'id' | 'volunteerIds'>): Promise<Assembly> {
    const newAssembly: Assembly = {
        ...assemblyData,
        id: generateId(),
        volunteerIds: [],
    };
    assemblies.push(newAssembly);
    writeData(assembliesPath, assemblies);
    return newAssembly;
}

export async function updateAssembly(id: string, data: Partial<Omit<Assembly, 'id'>>): Promise<Assembly> {
    const assemblyIndex = assemblies.findIndex(a => a.id === id);
    if (assemblyIndex === -1) throw new Error('Assembly not found');
    
    assemblies[assemblyIndex] = { ...assemblies[assemblyIndex], ...data };
    writeData(assembliesPath, assemblies);
    return assemblies[assemblyIndex];
}

export async function associateVolunteerToAssembly(assemblyId: string, volunteerId: string): Promise<void> {
    const assembly = assemblies.find(a => a.id === assemblyId);
    if (!assembly) throw new Error('Assembly not found');
    if (!assembly.volunteerIds.includes(volunteerId)) {
        assembly.volunteerIds.push(volunteerId);
        writeData(assembliesPath, assemblies);
    }
}


// SHIFTS
export async function getPopulatedShifts(assemblyId?: string): Promise<PopulatedShift[]> {
    const allAssemblies = await getPopulatedAssemblies();
    const allPositions = await getPositions();

    const targetShifts = assemblyId ? shifts.filter(s => s.assemblyId === assemblyId) : shifts;

    return targetShifts.map(shift => {
        const position = allPositions.find(p => p.id === shift.positionId);
        const volunteer = users.find(u => u.id === shift.volunteerId);
        const assembly = allAssemblies.find(a => a.id === shift.assemblyId);

        if (!position || !assembly) {
            // This can happen if a position or assembly was deleted.
            // You might want to handle this more gracefully.
            return null;
        }

        return {
            ...shift,
            startTime: new Date(shift.startTime),
            endTime: new Date(shift.endTime),
            position,
            volunteer: volunteer || null,
            assembly,
        };
    }).filter((s): s is PopulatedShift => s !== null);
}

export async function addShift(shiftData: Omit<Shift, 'id'>): Promise<Shift> {
    const newShift = { ...shiftData, id: generateId() };
    shifts.push(newShift);
    writeData(shiftsPath, shifts);
    return newShift;
}

export async function updateShift(shiftId: string, volunteerId: string | null): Promise<Shift> {
    const shiftIndex = shifts.findIndex(s => s.id === shiftId);
    if (shiftIndex === -1) throw new Error("Shift not found");

    shifts[shiftIndex].volunteerId = volunteerId;
    // If we assign a volunteer, clear any previous rejection
    if (volunteerId) {
        shifts[shiftIndex].rejectionReason = null;
        shifts[shiftIndex].rejectedBy = null;
    }
    writeData(shiftsPath, shifts);
    return shifts[shiftIndex];
}


export async function rejectShift(shiftId: string, volunteerId: string, reason: string | null): Promise<void> {
    const shiftIndex = shifts.findIndex(s => s.id === shiftId && s.volunteerId === volunteerId);
    if (shiftIndex === -1) throw new Error("Turno no encontrado o no te pertenece.");

    const updatedShift: Shift = {
        ...shifts[shiftIndex],
        volunteerId: null,
        rejectionReason: reason || 'Sin motivo',
        rejectedBy: volunteerId,
    };
    
    shifts[shiftIndex] = updatedShift;
    writeData(shiftsPath, shifts);
}

// CHAT
export async function getConversationsForUser(userId: string): Promise<Conversation[]> {
    const userConversations = conversations.filter(c => c.participantIds.includes(userId));
    
    return userConversations.map(conv => {
        const lastMessage = [...messages]
            .filter(m => m.conversationId === conv.id)
            .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0];
        return {
            ...conv,
            lastMessage: lastMessage || null
        };
    }).sort((a,b) => {
        if (!a.lastMessage) return 1;
        if (!b.lastMessage) return -1;
        return new Date(b.lastMessage.timestamp).getTime() - new Date(a.lastMessage.timestamp).getTime();
    });
}

export async function getPopulatedConversation(conversationId: string, userId: string): Promise<PopulatedConversation | null> {
    const conversation = conversations.find(c => c.id === conversationId);
    if (!conversation || !conversation.participantIds.includes(userId)) return null;

    const participants = users.filter(u => conversation.participantIds.includes(u.id));
    const conversationMessages = messages
        .filter(m => m.conversationId === conversationId)
        .sort((a,b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

    return {
        ...conversation,
        participants,
        messages: conversationMessages.map(m => ({...m, timestamp: new Date(m.timestamp)}))
    };
}

export async function addMessageToConversation(conversationId: string, senderId: string, text: string): Promise<ChatMessage> {
    const conversation = conversations.find(c => c.id === conversationId);
    if (!conversation || !conversation.participantIds.includes(senderId)) {
        throw new Error("No tienes permiso para enviar mensajes a esta conversación.");
    }
    const newMessage: ChatMessage = {
        id: generateId(),
        conversationId,
        senderId,
        text,
        timestamp: new Date()
    };
    messages.push(newMessage);
    writeData(messagesPath, messages);
    return newMessage;
}

    