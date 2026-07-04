import express from 'express';
import { db } from '../db.js';
import { getAuthenticatedUser } from './auth.js';
import { ai, MODEL_NAME, parseGeminiJson } from '../gemini.js';
import { SmartNotes } from '../../src/types.js';

export const notesRouter = express.Router();

function generateId() {
  return Math.random().toString(36).substring(2, 11);
}

// Get or generate smart notes for document
notesRouter.get('/:docId', async (req, res) => {
  try {
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
    
    // Check if smart notes already exist
    const existing = db.getNotes(docId);
    if (existing) {
      res.json({ notes: existing });
      return;
    }
    
    // If not, generate notes using Gemini
    const textSnippet = doc.extractedText.slice(0, 50000); // Token limits guard
    
    const prompt = `Generate a comprehensive set of smart learning notes from the following text. 
The notes MUST include:
1. Short Notes (an elegant, brief high-yield summary).
2. Detailed Notes (in-depth explanation of core topics, formatted clearly in markdown).
3. Bullet Point Notes (key bullet-point takeaways).
4. Revision Notes / cheat-sheet (condensed summaries of essential facts and formulas for quick scanning before an exam).
5. At least 5 high-quality Flashcards (pairs of questions and answers).

Output MUST be structured as a JSON object matching this schema.

Text to process:
"""
${textSnippet}
"""`;

    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
      config: {
        systemInstruction: "You are an expert curriculum designer and educator. You condense educational texts into high-impact, easy-to-digest study notes and active recall flashcards.",
        responseMimeType: "application/json",
        responseSchema: {
          type: 'OBJECT' as any,
          properties: {
            shortNotes: { type: 'STRING' as any },
            detailedNotes: { type: 'STRING' as any, description: "Detailed summary formatted in clean markdown structure." },
            bulletNotes: {
              type: 'ARRAY' as any,
              items: { type: 'STRING' as any }
            },
            revisionNotes: { type: 'STRING' as any, description: "Ultra-condensed list or layout for last-minute cramming." },
            flashcards: {
              type: 'ARRAY' as any,
              items: {
                type: 'OBJECT' as any,
                properties: {
                  question: { type: 'STRING' as any },
                  answer: { type: 'STRING' as any }
                },
                required: ["question", "answer"]
              }
            }
          },
          required: ["shortNotes", "detailedNotes", "bulletNotes", "revisionNotes", "flashcards"]
        }
      }
    });

    const resultText = response.text || "{}";
    const parsedData = parseGeminiJson<Omit<SmartNotes, 'documentId' | 'createdAt'>>(resultText, {
      shortNotes: "Short study notes failed to generate.",
      detailedNotes: "Detailed study notes failed to generate.",
      bulletNotes: ["Check the main content for key points."],
      revisionNotes: "No cram sheets generated.",
      flashcards: []
    });

    // Add unique IDs to each flashcard
    const flashcardsWithIds = (parsedData.flashcards || []).map(fc => ({
      ...fc,
      id: generateId()
    }));

    const newNotes: SmartNotes = {
      documentId: docId,
      shortNotes: parsedData.shortNotes || "Short study notes failed to generate.",
      detailedNotes: parsedData.detailedNotes || "Detailed study notes failed to generate.",
      bulletNotes: parsedData.bulletNotes || [],
      revisionNotes: parsedData.revisionNotes || "",
      flashcards: flashcardsWithIds,
      createdAt: new Date().toISOString()
    };

    await db.createNotes(newNotes);
    res.json({ notes: newNotes });
  } catch (error: any) {
    console.error('Notes Generation Error:', error);
    res.status(500).json({ error: error.message || 'Failed to generate study notes' });
  }
});
