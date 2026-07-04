import express from 'express';
import { db } from '../db.js';
import { UserProfile } from '../../src/types.js';

export const authRouter = express.Router();

// Helper to generate IDs
function generateId() {
  return Math.random().toString(36).substring(2, 11);
}

// Get current user from Authorization header
export function getAuthenticatedUser(req: express.Request): UserProfile | null {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  const userId = authHeader.substring(7);
  return db.getUserById(userId);
}

// Signup
authRouter.post('/signup', async (req, res) => {
  try {
    const { email, password, name } = req.body;
    
    if (!email || !password || !name) {
      res.status(400).json({ error: 'Missing email, password, or name' });
      return;
    }
    
    const existing = db.getUserByEmail(email);
    if (existing) {
      res.status(400).json({ error: 'User with this email already exists' });
      return;
    }
    
    const userId = generateId();
    const newUser: UserProfile & { passwordHash: string } = {
      id: userId,
      email: email.toLowerCase().trim(),
      name,
      avatarUrl: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(name)}`,
      isGuest: false,
      learningScore: 0,
      studyTimeMinutes: 0,
      streakDays: 1,
      createdAt: new Date().toISOString(),
      passwordHash: password // Keep simple in-memory hash or string for sandbox
    };
    
    await db.createUser(newUser);
    
    // Return user profile and token (which is the userId)
    const { passwordHash, ...profile } = newUser;
    res.json({ user: profile, token: userId });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
});

// Login
authRouter.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      res.status(400).json({ error: 'Missing email or password' });
      return;
    }
    
    const user = db.getUserByEmail(email);
    if (!user || user.passwordHash !== password) {
      res.status(401).json({ error: 'Invalid email or password' });
      return;
    }
    
    const { passwordHash, ...profile } = user;
    res.json({ user: profile, token: user.id });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
});

// Guest Access
authRouter.post('/guest', async (req, res) => {
  try {
    const userId = 'guest_' + generateId();
    const guestUser: UserProfile & { passwordHash: string } = {
      id: userId,
      email: `${userId}@studyai.local`,
      name: `Guest Learner`,
      avatarUrl: `https://api.dicebear.com/7.x/bottts/svg?seed=${userId}`,
      isGuest: true,
      learningScore: 10,
      studyTimeMinutes: 0,
      streakDays: 1,
      createdAt: new Date().toISOString(),
      passwordHash: ''
    };
    
    await db.createUser(guestUser);
    
    const { passwordHash, ...profile } = guestUser;
    res.json({ user: profile, token: userId });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
});

// Get Me
authRouter.get('/me', (req, res) => {
  const user = getAuthenticatedUser(req);
  if (!user) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  res.json({ user });
});
