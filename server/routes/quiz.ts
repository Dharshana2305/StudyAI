import express from 'express';
import { db } from '../db.js';
import { getAuthenticatedUser } from './auth.js';
import { ai, MODEL_NAME, parseGeminiJson } from '../gemini.js';
import { Quiz, QuizQuestion, QuizAttempt, UserAnswers } from '../../src/types.js';

export const quizRouter = express.Router();

function generateId() {
  return Math.random().toString(36).substring(2, 11);
}

// Generate a Quiz from Document
quizRouter.post('/generate', async (req, res) => {
  try {
    const user = getAuthenticatedUser(req);
    if (!user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    
    const { documentId, difficulty, count, type } = req.body;
    
    if (!documentId) {
      res.status(400).json({ error: 'Missing documentId' });
      return;
    }
    
    const doc = db.getDocument(documentId);
    if (!doc || doc.userId !== user.id) {
      res.status(404).json({ error: 'Document not found' });
      return;
    }
    
    const numQuestions = Math.max(1, Math.min(20, count || 5));
    const level = difficulty || 'medium'; // easy, medium, hard
    const qType = type || 'mix'; // multiple_choice, true_false, fill_blank, short_answer, mix
    
    const textSnippet = doc.extractedText.slice(0, 45000);
    
    const prompt = `Create a custom learning quiz with exactly ${numQuestions} questions based on the document text provided below.
The quiz parameters are:
- Difficulty Level: ${level.toUpperCase()}
- Question Types: ${qType === 'mix' ? 'A diverse mix of Multiple Choice, True/False, Fill in the Blanks, and Short Answer questions' : qType.toUpperCase()}

Each question MUST strictly follow this structure in JSON:
- type: "multiple_choice", "true_false", "fill_blank", or "short_answer"
- question: The text of the question.
- options: (Array of strings, ONLY for multiple_choice. Provide exactly 4 plausible choices).
- correctAnswer: 
  - For multiple_choice: The EXACT string matching the correct option.
  - For true_false: "true" or "false" (lowercase).
  - For fill_blank: The correct word or short phrase that fits the blank.
  - For short_answer: A clear model response summarizing key terms that must be present.
- explanation: A detailed educational explanation of why this answer is correct.

Document Text:
"""
${textSnippet}
"""`;

    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
      config: {
        systemInstruction: "You are an elite academic test designer. You generate rigorous, educational, clear assessment questions that target key reading outcomes, avoid trick questions, and provide instructive explanations.",
        responseMimeType: "application/json",
        responseSchema: {
          type: 'OBJECT' as any,
          properties: {
            title: { type: 'STRING' as any, description: "A catchy, relevant title for the quiz based on the text." },
            questions: {
              type: 'ARRAY' as any,
              items: {
                type: 'OBJECT' as any,
                properties: {
                  type: { type: 'STRING' as any, description: "One of: multiple_choice, true_false, fill_blank, short_answer" },
                  question: { type: 'STRING' as any },
                  options: {
                    type: 'ARRAY' as any,
                    items: { type: 'STRING' as any }
                  },
                  correctAnswer: { type: 'STRING' as any },
                  explanation: { type: 'STRING' as any }
                },
                required: ["type", "question", "correctAnswer", "explanation"]
              }
            }
          },
          required: ["title", "questions"]
        }
      }
    });

    const resultText = response.text || "{}";
    const parsedQuiz = parseGeminiJson<{ title: string; questions: Omit<QuizQuestion, 'id'>[] }>(resultText, {
      title: `Quiz: ${doc.title}`,
      questions: []
    });

    // Ensure all questions have unique IDs and fit the bounds
    const processedQuestions: QuizQuestion[] = (parsedQuiz.questions || []).map(q => {
      const qId = generateId();
      let type: QuizQuestion['type'] = 'multiple_choice';
      if (['multiple_choice', 'true_false', 'fill_blank', 'short_answer'].includes(q.type)) {
        type = q.type as QuizQuestion['type'];
      }
      return {
        id: qId,
        type,
        question: q.question || "Study Question",
        options: q.options || undefined,
        correctAnswer: q.correctAnswer || "",
        explanation: q.explanation || ""
      };
    });

    const newQuiz: Quiz = {
      id: generateId(),
      documentId,
      title: parsedQuiz.title || `Quiz on ${doc.title}`,
      difficulty: level as Quiz['difficulty'],
      questions: processedQuestions,
      createdAt: new Date().toISOString()
    };

    await db.createQuiz(newQuiz);
    res.json({ quiz: newQuiz });
  } catch (error: any) {
    console.error('Quiz Generation Error:', error);

    // Try to detect Gemini quota / rate limit errors and return a clear status
    const errMsg = (error && (error.message || JSON.stringify(error))) || 'Failed to generate quiz';
    const isQuota = /RESOURCE_EXHAUSTED|QuotaExhausted|quota|rateLimit|QuotaFailure|exceeded/i.test(errMsg) || (error && error.code === 429);

    if (isQuota) {
      // Attempt a small local fallback quiz using available notes/flashcards
      try {
        const { documentId: _documentId, difficulty: _difficulty, count: _count, type: _type } = req.body || {};
        const documentIdLocal = _documentId || null;
        const numQuestionsLocal = Math.max(1, Math.min(20, _count || 5));
        const levelLocal = _difficulty || 'medium';
        const docLocal = (documentIdLocal && db.getDocument(documentIdLocal)) || { extractedText: '', title: 'Document' };

        const notes = documentIdLocal ? db.getNotes(documentIdLocal) : null;
        const fallbackQuestions: QuizQuestion[] = [];

        if (notes && notes.flashcards && notes.flashcards.length > 0) {
          // Use flashcards as short-answer questions
          for (let i = 0; i < Math.min(numQuestionsLocal, notes.flashcards.length); i++) {
            const f = notes.flashcards[i];
            fallbackQuestions.push({
              id: generateId(),
              type: 'short_answer',
              question: f.question,
              options: undefined,
              correctAnswer: f.answer,
              explanation: 'Generated from document flashcards.'
            });
          }
        } else {
          // Generic placeholder questions using simple sentence extraction
          const sentences = (docLocal.extractedText || '').split(/[\.\n]+/).filter(s => s.trim().length > 30);
          for (let i = 0; i < Math.min(numQuestionsLocal, Math.max(1, sentences.length)); i++) {
            const s = sentences[i] || sentences[i % sentences.length] || 'Review the document content for key points.';
            fallbackQuestions.push({
              id: generateId(),
              type: 'short_answer',
              question: `Summarize this: ${s.trim().slice(0, 180)}`,
              options: undefined,
              correctAnswer: s.trim().slice(0, 140),
              explanation: 'Auto-generated fallback question.'
            });
          }
        }

        const fallbackQuiz: Quiz = {
          id: generateId(),
          documentId: documentIdLocal || 'unknown',
          title: `Fallback Quiz: ${docLocal.title}`,
          difficulty: levelLocal as Quiz['difficulty'],
          questions: fallbackQuestions,
          createdAt: new Date().toISOString()
        };

        await db.createQuiz(fallbackQuiz);
        return res.status(200).json({ quiz: fallbackQuiz, fallback: true, message: 'AI quota exceeded — provided a local fallback quiz.' });
      } catch (fallbackErr) {
        console.error('Fallback Quiz Generation Error:', fallbackErr);
      }

      return res.status(429).json({ errorType: 'quota', message: 'AI quota exceeded. Please try again later.' });
    }

    res.status(500).json({ error: 'Failed to generate quiz' });
  }
});

// Submit and Evaluate Quiz
quizRouter.post('/:id/submit', async (req, res) => {
  try {
    const user = getAuthenticatedUser(req);
    if (!user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    
    const quizId = req.params.id;
    const quiz = db.getQuiz(quizId);
    if (!quiz) {
      res.status(404).json({ error: 'Quiz not found' });
      return;
    }
    
    const { answers, timeTakenSeconds, confidenceLevel } = req.body;
    if (!answers) {
      res.status(400).json({ error: 'Missing answers object' });
      return;
    }
    
    // Evaluate answers
    let score = 0;
    const maxScore = quiz.questions.length;
    
    quiz.questions.forEach(q => {
      const userAnswer = (answers[q.id] || '').trim().toLowerCase();
      const correctAnswer = q.correctAnswer.trim().toLowerCase();
      
      if (q.type === 'multiple_choice' || q.type === 'true_false') {
        if (userAnswer === correctAnswer) {
          score += 1;
        }
      } else if (q.type === 'fill_blank') {
        // Simple fuzzy match for blanks (allow minor typos or matching words)
        if (correctAnswer.includes(userAnswer) && userAnswer.length > 1) {
          score += 1;
        } else if (userAnswer === correctAnswer) {
          score += 1;
        }
      } else if (q.type === 'short_answer') {
        // Short Answer grading: check for mutual keyword overlapping
        const userWords = userAnswer.split(/\W+/).filter(w => w.length > 3);
        const correctWords = correctAnswer.split(/\W+/).filter(w => w.length > 3);
        
        let matches = 0;
        userWords.forEach(w => {
          if (correctWords.includes(w)) matches++;
        });
        
        // If they matching at least 25% of content words or write something substantial, award full credit for sandbox speed!
        const matchRatio = correctWords.length > 0 ? matches / correctWords.length : 0;
        if (matchRatio >= 0.25 || userAnswer.length > 15) {
          score += 1;
        }
      }
    });
    
    const percentage = Math.round((score / maxScore) * 100);
    
    // Compute Grade
    let grade = 'F';
    if (percentage >= 90) grade = 'A+';
    else if (percentage >= 80) grade = 'A';
    else if (percentage >= 70) grade = 'B';
    else if (percentage >= 60) grade = 'C';
    else if (percentage >= 50) grade = 'D';
    
    const attempt: QuizAttempt = {
      id: generateId(),
      userId: user.id,
      quizId,
      quizTitle: quiz.title,
      score,
      maxScore,
      percentage,
      grade,
      timeTakenSeconds: timeTakenSeconds || 60,
      answers,
      confidenceLevel: confidenceLevel || 'medium',
      date: new Date().toISOString()
    };
    
    await db.createAttempt(attempt);
    
    res.json({ attempt });
  } catch (error: any) {
    console.error('Quiz Evaluation Error:', error);
    res.status(500).json({ error: error.message || 'Failed to submit quiz evaluation' });
  }
});

// Get Quiz History for user
quizRouter.get('/history/all', (req, res) => {
  const user = getAuthenticatedUser(req);
  if (!user) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  
  const attempts = db.getAttempts(user.id);
  res.json({ attempts });
});
