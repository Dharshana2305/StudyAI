import express from 'express';
import { db } from '../db.js';
import { getAuthenticatedUser } from './auth.js';
import { ai, MODEL_NAME } from '../gemini.js';
import { ChatMessage } from '../../src/types.js';

export const chatRouter = express.Router();

function generateId() {
  return Math.random().toString(36).substring(2, 11);
}

// Get chat history for document
chatRouter.get('/:docId/messages', (req, res) => {
  const user = getAuthenticatedUser(req);
  if (!user) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  
  const docId = req.params.docId;
  const doc = db.getDocument(docId);
  if (!doc || doc.userId !== user.id) {
    res.status(404).json({ error: 'Document not found' });
    return;
  }
  
  const messages = db.getChatMessages(docId);
  res.json({ messages });
});

// Post message and get Gemini response
chatRouter.post('/:docId/message', async (req, res) => {
  try {
    const user = getAuthenticatedUser(req);
    if (!user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    
    const docId = req.params.docId;
    const { text } = req.body;
    
    if (!text || !text.trim()) {
      res.status(400).json({ error: 'Message cannot be empty' });
      return;
    }
    
    const doc = db.getDocument(docId);
    if (!doc || doc.userId !== user.id) {
      res.status(404).json({ error: 'Document not found' });
      return;
    }
    
    // 1. Persist User Message
    const userMsg: ChatMessage = {
      id: generateId(),
      documentId: docId,
      sender: 'user',
      text: text.trim(),
      timestamp: new Date().toISOString()
    };
    await db.createChatMessage(userMsg);
    
    // Get chat history to build chat context
    const history = db.getChatMessages(docId).slice(-10); // Keep last 10 messages for context
    
    // Build context
    const textSnippet = doc.extractedText.slice(0, 45000); // 45k chars is safe and covers a lot of pages
    
    // Format previous conversation history for prompt
    const chatHistoryContext = history.map(m => `${m.sender === 'user' ? 'User' : 'Assistant'}: ${m.text}`).join('\n');
    
    const prompt = `You are an AI Study Assistant for StudyAI. The user has uploaded a document titled "${doc.title}".
Your absolute main directive is to answer questions ONLY about this document. If the user asks something completely unrelated to this document, politely refuse to answer and guide them back to the content.
You should:
- Explain concepts clearly.
- Answer user doubts and queries.
- Summarize sections when requested.
- Provide examples or analogies to simplify complex elements.
- Maintain a helpful, educational, and engaging tone.

---
DOCUMENT CONTENT:
"""
${textSnippet}
"""
---

PREVIOUS CONVERSATION HISTORY (if any):
${chatHistoryContext}

User's New Question: ${text.trim()}`;

    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
      config: {
        systemInstruction: "You are StudyAI, an elite academic advisor. You answer questions strictly grounded in the uploaded document text. You translate complex academic ideas into easy, relatable, and instructive summaries with simple analogies.",
      }
    });

    const aiResponseText = response.text || "I was unable to analyze that query. Please try again.";
    
    // 2. Persist AI Message
    const aiMsg: ChatMessage = {
      id: generateId(),
      documentId: docId,
      sender: 'ai',
      text: aiResponseText,
      timestamp: new Date().toISOString()
    };
    await db.createChatMessage(aiMsg);
    
    res.json({ message: aiMsg });
  } catch (error: any) {
    console.error('Chat Assistant Error:', error);
    const errMsg = (error && (error.message || JSON.stringify(error))) || 'Failed to generate chat response';
    const isQuota = /RESOURCE_EXHAUSTED|QuotaExhausted|quota|rateLimit|QuotaFailure|exceeded/i.test(errMsg) || (error && error.code === 429);
    if (isQuota) {
      return res.status(429).json({ errorType: 'quota', message: 'AI quota exceeded. Please try again later.' });
    }
    res.status(500).json({ error: 'Failed to generate chat response' });
  }
});
