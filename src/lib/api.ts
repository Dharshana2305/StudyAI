/**
 * Central API Client for StudyAI
 */

import { 
  UserProfile, 
  StudyDocument, 
  DocumentAnalysis, 
  SmartNotes, 
  Quiz, 
  QuizAttempt, 
  ChatMessage, 
  DashboardStats,
  UserAnswers
} from '../types.js';

const API_BASE = '/api';

function getHeaders(): HeadersInit {
  const token = localStorage.getItem('studyai_token');
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

async function handleResponse<T>(response: Response): Promise<T> {
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    // Throw a structured error so callers can detect quota/timeouts
    const err: any = new Error(data.error || data.message || 'Network response was not ok');
    err.status = response.status;
    err.errorType = data.errorType || null;
    err.payload = data;
    throw err;
  }
  return data as T;
}

export const api = {
  // Auth
  auth: {
    signup: async (email: string, name: string, password: string) => {
      const res = await fetch(`${API_BASE}/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, name, password })
      });
      const data = await handleResponse<{ user: UserProfile; token: string }>(res);
      localStorage.setItem('studyai_token', data.token);
      return data.user;
    },
    
    login: async (email: string, password: string) => {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await handleResponse<{ user: UserProfile; token: string }>(res);
      localStorage.setItem('studyai_token', data.token);
      return data.user;
    },
    
    guestLogin: async () => {
      const res = await fetch(`${API_BASE}/auth/guest`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      const data = await handleResponse<{ user: UserProfile; token: string }>(res);
      localStorage.setItem('studyai_token', data.token);
      return data.user;
    },
    
    getMe: async (): Promise<UserProfile> => {
      const res = await fetch(`${API_BASE}/auth/me`, {
        headers: getHeaders()
      });
      const data = await handleResponse<{ user: UserProfile }>(res);
      return data.user;
    },
    
    logout: () => {
      localStorage.removeItem('studyai_token');
    }
  },

  // Documents
  documents: {
    list: async (): Promise<StudyDocument[]> => {
      const res = await fetch(`${API_BASE}/documents`, {
        headers: getHeaders()
      });
      const data = await handleResponse<{ documents: StudyDocument[] }>(res);
      return data.documents;
    },
    
    get: async (id: string): Promise<StudyDocument> => {
      const res = await fetch(`${API_BASE}/documents/${id}`, {
        headers: getHeaders()
      });
      const data = await handleResponse<{ document: StudyDocument }>(res);
      return data.document;
    },
    
    upload: async (file: File): Promise<StudyDocument> => {
      const formData = new FormData();
      formData.append('file', file);
      
      const token = localStorage.getItem('studyai_token');
      const headers: HeadersInit = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      const res = await fetch(`${API_BASE}/documents/upload`, {
        method: 'POST',
        headers,
        body: formData
      });
      const data = await handleResponse<{ document: StudyDocument }>(res);
      return data.document;
    },
    
    delete: async (id: string): Promise<boolean> => {
      const res = await fetch(`${API_BASE}/documents/${id}`, {
        method: 'DELETE',
        headers: getHeaders()
      });
      const data = await handleResponse<{ success: boolean }>(res);
      return data.success;
    }
  },

  // AI Analysis
  analysis: {
    get: async (docId: string): Promise<DocumentAnalysis> => {
      const res = await fetch(`${API_BASE}/analysis/${docId}`, {
        headers: getHeaders()
      });
      const data = await handleResponse<{ analysis: DocumentAnalysis }>(res);
      return data.analysis;
    }
  },

  // Smart Notes
  notes: {
    get: async (docId: string): Promise<SmartNotes> => {
      const res = await fetch(`${API_BASE}/notes/${docId}`, {
        headers: getHeaders()
      });
      const data = await handleResponse<{ notes: SmartNotes }>(res);
      return data.notes;
    }
  },

  // Quiz
  quizzes: {
    generate: async (documentId: string, difficulty: 'easy' | 'medium' | 'hard', count: number, type: string): Promise<{ quiz: Quiz; fallback?: boolean; message?: string }> => {
      const res = await fetch(`${API_BASE}/quizzes/generate`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ documentId, difficulty, count, type })
      });
      const data = await handleResponse<{ quiz: Quiz; fallback?: boolean; message?: string }>(res);
      return { quiz: data.quiz, fallback: data.fallback, message: data.message };
    },
    
    submit: async (quizId: string, answers: UserAnswers, timeTakenSeconds: number, confidenceLevel: 'low' | 'medium' | 'high'): Promise<QuizAttempt> => {
      const res = await fetch(`${API_BASE}/quizzes/${quizId}/submit`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ answers, timeTakenSeconds, confidenceLevel })
      });
      const data = await handleResponse<{ attempt: QuizAttempt }>(res);
      return data.attempt;
    },
    
    getHistory: async (): Promise<QuizAttempt[]> => {
      const res = await fetch(`${API_BASE}/quizzes/history/all`, {
        headers: getHeaders()
      });
      const data = await handleResponse<{ attempts: QuizAttempt[] }>(res);
      return data.attempts;
    }
  },

  // Performance Report & Stats
  performance: {
    getStats: async (): Promise<DashboardStats> => {
      const res = await fetch(`${API_BASE}/performance/stats`, {
        headers: getHeaders()
      });
      const data = await handleResponse<{ stats: DashboardStats }>(res);
      return data.stats;
    },
    
    getReport: async (): Promise<{ analysis: any; recommendations: any }> => {
      const res = await fetch(`${API_BASE}/performance/report`, {
        headers: getHeaders()
      });
      return handleResponse<{ analysis: any; recommendations: any }>(res);
    }
  },

  // Chat Assistant
  chat: {
    getMessages: async (docId: string): Promise<ChatMessage[]> => {
      const res = await fetch(`${API_BASE}/chat/${docId}/messages`, {
        headers: getHeaders()
      });
      const data = await handleResponse<{ messages: ChatMessage[] }>(res);
      return data.messages;
    },
    
    sendMessage: async (docId: string, text: string): Promise<ChatMessage> => {
      const res = await fetch(`${API_BASE}/chat/${docId}/message`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ text })
      });
      const data = await handleResponse<{ message: ChatMessage }>(res);
      return data.message;
    }
  }
};

/**
 * Trigger browser file download
 */
export function downloadFile(filename: string, text: string, type: 'markdown' | 'html' | 'text') {
  let mime = 'text/plain';
  let formattedText = text;
  let finalFilename = filename;
  
  if (type === 'markdown') {
    mime = 'text/markdown';
    if (!finalFilename.endsWith('.md')) finalFilename += '.md';
  } else if (type === 'html') {
    mime = 'text/html';
    if (!finalFilename.endsWith('.html')) finalFilename += '.html';
    // Wrap text in HTML skeleton for pristine printing
    formattedText = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>${filename}</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; padding: 40px; max-width: 800px; margin: 0 auto; line-height: 1.6; color: #1e293b; }
          h1 { color: #0f172a; border-bottom: 2px solid #e2e8f0; padding-bottom: 10px; font-size: 2.2em; }
          h2 { color: #1e3a8a; margin-top: 30px; font-size: 1.6em; }
          h3 { color: #0369a1; font-size: 1.2em; }
          p, li { font-size: 1.1em; }
          ul, ol { padding-left: 20px; }
          code { background: #f1f5f9; padding: 3px 6px; border-radius: 4px; font-family: monospace; font-size: 0.9em; }
          pre { background: #f8fafc; padding: 15px; border-radius: 8px; border: 1px solid #e2e8f0; overflow-x: auto; }
          .card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 15px; margin-bottom: 15px; }
          .meta { font-size: 0.9em; color: #64748b; margin-bottom: 20px; }
          @media print {
            body { padding: 0; }
            button { display: none; }
          }
        </style>
      </head>
      <body>
        <div style="text-align: right; margin-bottom: 20px;">
          <button onclick="window.print()" style="background: #2563eb; color: white; border: none; padding: 10px 18px; border-radius: 6px; font-weight: bold; cursor: pointer;">Print to PDF</button>
        </div>
        ${text}
      </body>
      </html>
    `;
  } else {
    if (!finalFilename.endsWith('.txt')) finalFilename += '.txt';
  }
  
  const blob = new Blob([formattedText], { type: `${mime};charset=utf-8;` });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", finalFilename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
