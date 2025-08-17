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
    const { volunteers, ...rest } = a;
    return rest;
}));
let shifts: Shift[] = readData(shiftsPath, initialShifts.map(s => {
    const { position, volunteer, assembly, ...rest } = s;
    return rest;
}));
let conversations: Conversation[] = readData(conversationsPath, initialConversations);
let messages: ChatMessage[] = readData(messagesPath, initialMessages);

const parseDatesInObject = <T extends { startTime?: any, endTime?: any, startDate?: any, endDate?: any, timestamp?: any }>(item: T): T => {
    const newItem = { ...item };
    if (item.startTime && typeof item.startTime === 'string') newItem.startTime = new Date(item.startTime);
    if (item.endTime && typeof item.endTime === 'string') newItem.endTime = new Date(item.endTime);
    if (item.startDate && typeof item.startDate === 'string') newItem.startDate = new Date(item.startDate);
    if (item.endDate && typeof item.endDate === 'string') newItem.endDate = new Date(item.endDate);
    if (item.timestamp && typeof item.timestamp === 'string') newItem.timestamp = new Date(item.timestamp);
    return newItem;
};

const parseDatesInArray = <T extends { startTime?: any, endTime?: any, startDate?: any, endDate?: any, timestamp?: any }>(items: T[]): T[] => {
    return items.map(parseDatesInObject);
};

// Parse dates after reading from JSON
shifts = parseDatesInArray(shifts);
assemblies = parseDatesInArray(assemblies);
messages = parseDatesInArray(messages);

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
export const getPositions = async (assemblyId?: string): Promise<Position[]> => {
    const allPositions = JSON.parse(JSON.stringify(positions));
    if (assemblyId) {
        return allPositions.filter((p: Position) => p.assemblyId === assemblyId);
    }
    return allPositions;
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
    const stringified = JSON.stringify(populatedAssemblies);
    return parseDatesInArray(JSON.parse(stringified));
}

export const getAssemblies = async (): Promise<Assembly[]> => {
    const sorted = assemblies.sort((a,b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());
    const stringified = JSON.stringify(sorted);
    return parseDatesInArray(JSON.parse(stringified));
}

// Shifts
export const getPopulatedShifts = async (assemblyId?: string): Promise<PopulatedShift[]> => {
    const relevantShifts = assemblyId ? shifts.filter(s => s.assemblyId === assemblyId) : shifts;

    const populated = relevantShifts.map(shift => {
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
    
    const stringified = JSON.stringify(sorted);
    return parseDatesInArray(JSON.parse(stringified));
};

// --- CHAT ---
export const getConversationsForUser = async (userId: string): Promise<Conversation[]> => {
    const userConversations = conversations.filter(c => c.participantIds.includes(userId));
    const populated = userConversations.map(c => {
        const lastMessage = messages
            .filter(m => m.conversationId === c.id)
            .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0];
        return { ...c, lastMessage: lastMessage || null };
    });
    const sorted = populated.sort((a, b) => {
        if (!a.lastMessage) return 1;
        if (!b.lastMessage) return -1;
        return new Date(b.lastMessage.timestamp).getTime() - new Date(a.lastMessage.timestamp).getTime();
    });
    const stringified = JSON.stringify(sorted);
    return parseDatesInArray(JSON.parse(stringified));
};

export const getPopulatedConversation = async (conversationId: string, userId: string): Promise<PopulatedConversation | null> => {
    const conversation = conversations.find(c => c.id === conversationId);

    if (!conversation || !conversation.participantIds.includes(userId)) {
        return null;
    }

    const conversationMessages = messages
        .filter(m => m.conversationId === conversationId)
        .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

    const participants = users.filter(u => conversation.participantIds.includes(u.id));

    const populated: PopulatedConversation = {
        ...conversation,
        messages: conversationMessages,
        participants,
    };
    
    const stringified = JSON.stringify(populated);
    return parseDatesInObject(JSON.parse(stringified));
};

export const addMessageToConversation = async (conversationId: string, senderId: string, text: string): Promise<ChatMessage> => {
    const conversation = conversations.find(c => c.id === conversationId);
    if (!conversation || !conversation.participantIds.includes(senderId)) {
        throw new Error("User not in conversation");
    }

    const newMessage: ChatMessage = {
        id: generateId(),
        conversationId,
        senderId,
        text,
        timestamp: new Date(),
    };
    messages.push(newMessage);
    writeData(messagesPath, messages);
    return parseDatesInObject(JSON.parse(JSON.stringify(newMessage)));
};


// --- CRUD Operations (for Server Actions) ---
export const addUser = async (userData: Omit<User, 'id' | 'passwordHash'> & { password?: string }) => {
    const newUser: User = {
        id: generateId(),
        ...userData,
        passwordHash: userData.password || 'password'
    };
    users.push(newUser);
    writeData(usersPath, users);
    return newUser;
};

export const updateUser = async (userId: string, userData: Partial<Omit<User, 'id' | 'passwordHash'>>) => {
    const userIndex = users.findIndex(u => u.id === userId);
    if(userIndex > -1) {
        users[userIndex] = { ...users[userIndex], ...userData };
        writeData(usersPath, users);
    }
    return users[userIndex];
}

export const deleteUser = async (userId: string) => {
    const userIndex = users.findIndex(u => u.id === userId);
    if(userIndex === -1) {
        throw new Error("User not found");
    }
    
    users.splice(userIndex, 1);

    shifts.forEach(shift => {
        if(shift.volunteerId === userId) {
            shift.volunteerId = null;
        }
    });

    assemblies.forEach(assembly => {
        const volunteerIndex = assembly.volunteerIds.indexOf(userId);
        if(volunteerIndex > -1) {
            assembly.volunteerIds.splice(volunteerIndex, 1);
        }
    });
    
    conversations.forEach(conversation => {
        const participantIndex = conversation.participantIds.indexOf(userId);
        if(participantIndex > -1) {
            conversation.participantIds.splice(participantIndex, 1);
        }
    });
    
    writeData(usersPath, users);
    writeData(shiftsPath, shifts);
    writeData(assembliesPath, assemblies);
    writeData(conversationsPath, conversations);
}

export const addPosition = async (positionData: Omit<Position, 'id'>) => {
    const newPosition: Position = { id: generateId(), ...positionData };
    positions.push(newPosition);
    writeData(positionsPath, positions);
    return newPosition;
};

export const updatePosition = async (positionId: string, positionData: Partial<Omit<Position, 'id'>>) => {
    const index = positions.findIndex(p => p.id === positionId);
    if (index !== -1) {
        positions[index] = { ...positions[index], ...positionData };
        writeData(positionsPath, positions);
    }
};

export const deletePosition = async (positionId: string) => {
    const index = positions.findIndex(p => p.id === positionId);
    if (index === -1) {
        throw new Error("Position not found");
    }
    positions.splice(index, 1);

    shifts.forEach(shift => {
        if (shift.positionId === positionId) {
            shift.volunteerId = null; 
            shift.rejectionReason = 'Posición eliminada';
        }
    });

    writeData(positionsPath, positions);
    writeData(shiftsPath, shifts);
};

export const addAssembly = async (assemblyData: Omit<Assembly, 'id' | 'volunteerIds'>) => {
    const newAssembly: Assembly = {
        id: generateId(),
        ...assemblyData,
        volunteerIds: [],
    };
    assemblies.push(newAssembly);
    writeData(assembliesPath, assemblies);
    return newAssembly;
};

export const updateAssembly = async (assemblyId: string, assemblyData: Partial<Omit<Assembly, 'id'>>) => {
    const index = assemblies.findIndex(a => a.id === assemblyId);
    if (index !== -1) {
        assemblies[index] = { ...assemblies[index], ...assemblyData };
        writeData(assembliesPath, assemblies);
    }
};

export const associateVolunteerToAssembly = async (assemblyId: string, volunteerId: string) => {
    const assembly = assemblies.find(a => a.id === assemblyId);
    if (assembly && !assembly.volunteerIds.includes(volunteerId)) {
        assembly.volunteerIds.push(volunteerId);
        writeData(assembliesPath, assemblies);
    }
}

export const addShift = async (shiftData: Omit<Shift, 'id' | 'rejectionReason' | 'rejectedBy'>) => {
    const newShift: Shift = { id: generateId(), ...shiftData };
    shifts.push(newShift);
    writeData(shiftsPath, shifts);
    return newShift;
};

export const updateShift = async (shiftId: string, volunteerId: string | null) => {
    const shift = shifts.find(s => s.id === shiftId);
    if (shift) {
        shift.volunteerId = volunteerId;
        delete shift.rejectionReason;
        delete shift.rejectedBy;
        writeData(shiftsPath, shifts);
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
    writeData(shiftsPath, shifts);
}

    