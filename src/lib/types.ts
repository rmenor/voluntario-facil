import type { LucideIcon } from 'lucide-react';

export interface User {
  id: string;
  name: string;
  phone: string;
  email: string;
  role: 'admin' | 'volunteer';
  passwordHash: string;
}

export interface Position {
  id: string;
  name: string;
  description: string;
  iconName: keyof typeof import('lucide-react');
  assemblyId: string;
}

export interface Assembly {
  id: string;
  title: string;
  startDate: Date;
  endDate: Date;
  volunteerIds: string[];
  type: 'regional' | 'circuito';
}

export interface PopulatedAssembly extends Assembly {
    volunteers: User[];
}

export interface Shift {
  id: string;
  positionId: string;
  volunteerId: string | null;
  startTime: Date;
  endTime: Date;
  assemblyId: string;
  rejectionReason?: string | null;
  rejectedBy?: string | null; // ID of volunteer who rejected it
}

export interface PopulatedShift extends Omit<Shift, 'positionId' | 'volunteerId' | 'assemblyId'> {
  position: Position;
  volunteer: User | null; // The currently assigned volunteer
  assembly: Assembly;
}

export interface ChatMessage {
    id: string;
    conversationId: string;
    senderId: string;
    text: string;
    timestamp: Date;
}

export interface Conversation {
    id: string;
    name: string;
    participantIds: string[];
    lastMessage?: ChatMessage | null;
}

export interface PopulatedConversation extends Conversation {
    participants: User[];
    messages: ChatMessage[];
}

    