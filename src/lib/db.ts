import Database from 'better-sqlite3';
import { initialUsers, initialPositions, initialAssemblies, initialShifts, initialConversations, initialMessages } from '@/lib/mock-data';

const db = new Database('data.db');

db.exec(`
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  name TEXT,
  phone TEXT,
  email TEXT UNIQUE,
  role TEXT,
  passwordHash TEXT
);
CREATE TABLE IF NOT EXISTS positions (
  id TEXT PRIMARY KEY,
  name TEXT,
  description TEXT,
  iconName TEXT
);
CREATE TABLE IF NOT EXISTS assemblies (
  id TEXT PRIMARY KEY,
  title TEXT,
  startDate TEXT,
  endDate TEXT,
  type TEXT
);
CREATE TABLE IF NOT EXISTS assembly_volunteers (
  assemblyId TEXT,
  volunteerId TEXT,
  PRIMARY KEY (assemblyId, volunteerId)
);
CREATE TABLE IF NOT EXISTS shifts (
  id TEXT PRIMARY KEY,
  positionId TEXT,
  volunteerId TEXT,
  startTime TEXT,
  endTime TEXT,
  assemblyId TEXT,
  rejectionReason TEXT,
  rejectedBy TEXT
);
CREATE TABLE IF NOT EXISTS conversations (
  id TEXT PRIMARY KEY,
  name TEXT
);
CREATE TABLE IF NOT EXISTS conversation_participants (
  conversationId TEXT,
  userId TEXT,
  PRIMARY KEY (conversationId, userId)
);
CREATE TABLE IF NOT EXISTS messages (
  id TEXT PRIMARY KEY,
  conversationId TEXT,
  senderId TEXT,
  text TEXT,
  timestamp TEXT
);
`);

const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get().count as number;
if (userCount === 0) {
  const insertUser = db.prepare('INSERT INTO users (id, name, phone, email, role, passwordHash) VALUES (@id, @name, @phone, @email, @role, @passwordHash)');
  initialUsers.forEach(u => insertUser.run(u));

  const insertPosition = db.prepare('INSERT INTO positions (id, name, description, iconName) VALUES (@id, @name, @description, @iconName)');
  initialPositions.forEach(p => insertPosition.run(p));

  const insertAssembly = db.prepare('INSERT INTO assemblies (id, title, startDate, endDate, type) VALUES (@id, @title, @startDate, @endDate, @type)');
  const insertAV = db.prepare('INSERT INTO assembly_volunteers (assemblyId, volunteerId) VALUES (@assemblyId, @volunteerId)');
  initialAssemblies.forEach(a => {
    insertAssembly.run({ ...a, startDate: a.startDate.toISOString(), endDate: a.endDate.toISOString() });
    a.volunteerIds.forEach(v => insertAV.run({ assemblyId: a.id, volunteerId: v }));
  });

  const insertShift = db.prepare('INSERT INTO shifts (id, positionId, volunteerId, startTime, endTime, assemblyId) VALUES (@id, @positionId, @volunteerId, @startTime, @endTime, @assemblyId)');
  initialShifts.forEach(s => insertShift.run({ ...s, startTime: s.startTime.toISOString(), endTime: s.endTime.toISOString() }));

  const insertConversation = db.prepare('INSERT INTO conversations (id, name) VALUES (@id, @name)');
  const insertParticipant = db.prepare('INSERT INTO conversation_participants (conversationId, userId) VALUES (@conversationId, @userId)');
  initialConversations.forEach(c => {
    insertConversation.run({ id: c.id, name: c.name });
    c.participantIds.forEach(pid => insertParticipant.run({ conversationId: c.id, userId: pid }));
  });

  const insertMessage = db.prepare('INSERT INTO messages (id, conversationId, senderId, text, timestamp) VALUES (@id, @conversationId, @senderId, @text, @timestamp)');
  initialMessages.forEach(m => insertMessage.run({ ...m, timestamp: m.timestamp.toISOString() }));
}

export default db;
