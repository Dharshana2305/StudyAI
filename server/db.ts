import fs from 'fs';
import path from 'path';
import { 
  UserProfile, 
  StudyDocument, 
  DocumentAnalysis, 
  SmartNotes, 
  Quiz, 
  QuizAttempt, 
  ChatMessage 
} from '../src/types.js';

interface DbSchema {
  users: Record<string, UserProfile & { passwordHash: string }>;
  documents: StudyDocument[];
  analyses: DocumentAnalysis[];
  notes: SmartNotes[];
  quizzes: Quiz[];
  attempts: QuizAttempt[];
  chatMessages: ChatMessage[];
}

const DB_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DB_DIR, 'db.json');

// Memory cache of DB
let dbCache: DbSchema = {
  users: {},
  documents: [],
  analyses: [],
  notes: [],
  quizzes: [],
  attempts: [],
  chatMessages: []
};

// Ensure database file and directory exist
function initDb() {
  try {
    if (!fs.existsSync(DB_DIR)) {
      fs.mkdirSync(DB_DIR, { recursive: true });
    }
    
    if (fs.existsSync(DB_FILE)) {
      const data = fs.readFileSync(DB_FILE, 'utf-8');
      dbCache = JSON.parse(data);
    } else {
      saveDbSync();
    }
  } catch (error) {
    console.error('Failed to initialize local JSON database:', error);
  }
}

function saveDbSync() {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(dbCache, null, 2), 'utf-8');
  } catch (error) {
    console.error('Error saving database synchronously:', error);
  }
}

async function saveDb() {
  try {
    await fs.promises.writeFile(DB_FILE, JSON.stringify(dbCache, null, 2), 'utf-8');
  } catch (error) {
    console.error('Error saving database asynchronously:', error);
  }
}

// Initialize immediately
initDb();

export const db = {
  // Users
  getUserByEmail: (email: string) => {
    const normEmail = email.toLowerCase().trim();
    return Object.values(dbCache.users).find(u => u.email.toLowerCase() === normEmail);
  },
  
  getUserById: (id: string) => {
    return dbCache.users[id] || null;
  },
  
  createUser: async (user: UserProfile & { passwordHash: string }) => {
    dbCache.users[user.id] = user;
    await saveDb();
    return user;
  },
  
  updateUserProfile: async (id: string, updates: Partial<UserProfile>) => {
    if (dbCache.users[id]) {
      dbCache.users[id] = { ...dbCache.users[id], ...updates };
      await saveDb();
      return dbCache.users[id];
    }
    return null;
  },

  // Documents
  getDocuments: (userId: string) => {
    return dbCache.documents.filter(d => d.userId === userId);
  },
  
  getDocument: (id: string) => {
    return dbCache.documents.find(d => d.id === id) || null;
  },
  
  createDocument: async (doc: StudyDocument) => {
    dbCache.documents.push(doc);
    await saveDb();
    return doc;
  },
  
  deleteDocument: async (id: string) => {
    dbCache.documents = dbCache.documents.filter(d => d.id !== id);
    dbCache.analyses = dbCache.analyses.filter(a => a.documentId !== id);
    dbCache.notes = dbCache.notes.filter(n => n.documentId !== id);
    dbCache.quizzes = dbCache.quizzes.filter(q => q.documentId !== id);
    dbCache.chatMessages = dbCache.chatMessages.filter(m => m.documentId !== id);
    await saveDb();
    return true;
  },

  // Analyses
  getAnalysis: (documentId: string) => {
    return dbCache.analyses.find(a => a.documentId === documentId) || null;
  },
  
  createAnalysis: async (analysis: DocumentAnalysis) => {
    // Remove if already exists
    dbCache.analyses = dbCache.analyses.filter(a => a.documentId !== analysis.documentId);
    dbCache.analyses.push(analysis);
    await saveDb();
    return analysis;
  },

  // Notes
  getNotes: (documentId: string) => {
    return dbCache.notes.find(n => n.documentId === documentId) || null;
  },
  
  createNotes: async (notes: SmartNotes) => {
    dbCache.notes = dbCache.notes.filter(n => n.documentId !== notes.documentId);
    dbCache.notes.push(notes);
    await saveDb();
    return notes;
  },

  // Quizzes
  getQuizzesByDocument: (documentId: string) => {
    return dbCache.quizzes.filter(q => q.documentId === documentId);
  },
  
  getQuiz: (id: string) => {
    return dbCache.quizzes.find(q => q.id === id) || null;
  },
  
  createQuiz: async (quiz: Quiz) => {
    dbCache.quizzes.push(quiz);
    await saveDb();
    return quiz;
  },

  // Attempts
  getAttempts: (userId: string) => {
    return dbCache.attempts.filter(a => a.userId === userId);
  },
  
  getQuizAttempts: (quizId: string) => {
    return dbCache.attempts.filter(a => a.quizId === quizId);
  },
  
  createAttempt: async (attempt: QuizAttempt) => {
    dbCache.attempts.push(attempt);
    
    // Update user stats as well
    const user = dbCache.users[attempt.userId];
    if (user) {
      const userAttempts = dbCache.attempts.filter(a => a.userId === attempt.userId);
      const avgScore = userAttempts.reduce((sum, a) => sum + a.percentage, 0) / userAttempts.length;
      
      // Increment streak if last quiz was taken today or yesterday
      // For now, let's just increment study time and learning score dynamically
      const minutesStudyGained = Math.ceil(attempt.timeTakenSeconds / 60);
      
      // Calculate a dynamic learning score based on average score and active documents
      const docsCount = dbCache.documents.filter(d => d.userId === attempt.userId).length;
      const baseScore = Math.round(avgScore * 0.7 + Math.min(docsCount * 5, 30));
      const learningScore = Math.max(10, Math.min(100, baseScore));
      
      dbCache.users[attempt.userId] = {
        ...user,
        learningScore,
        studyTimeMinutes: (user.studyTimeMinutes || 0) + minutesStudyGained,
        // Make sure streaks are correctly updated
        streakDays: user.streakDays === 0 ? 1 : user.streakDays
      };
    }
    
    await saveDb();
    return attempt;
  },

  // Chat messages
  getChatMessages: (documentId: string) => {
    return dbCache.chatMessages.filter(m => m.documentId === documentId);
  },
  
  createChatMessage: async (message: ChatMessage) => {
    dbCache.chatMessages.push(message);
    await saveDb();
    return message;
  }
};
