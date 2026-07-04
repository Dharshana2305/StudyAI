import express from 'express';
import { db } from '../db.js';
import { getAuthenticatedUser } from './auth.js';
import { ai, MODEL_NAME, parseGeminiJson } from '../gemini.js';
import { DocumentAnalysis } from '../../src/types.js';

export const analysisRouter = express.Router();

// Get analysis for document (will run analysis if not exists)
analysisRouter.get('/:docId', async (req, res) => {
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
    
    // Check if we already have it analyzed
    const existing = db.getAnalysis(docId);
    if (existing) {
      res.json({ analysis: existing });
      return;
    }
    
    // If not, generate it using Gemini
    const textSnippet = doc.extractedText.slice(0, 50000); // Guard token length limit
    
    const prompt = `Analyze the following learning material/document text and generate a structured JSON analysis. 
Your analysis MUST contain:
1. Overall executive summary of the document.
2. Chapter-wise or section-wise summaries (logical breakdown of the material).
3. Core Key Concepts and their high-level explanation.
4. Important Definitions (terms and their exact meanings).
5. Important Points / takeaways.
6. Exam Tips (what to look out for, how questions are asked).
7. Frequently Asked Topics/Questions.

Text to analyze:
"""
${textSnippet}
"""`;

    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
      config: {
        systemInstruction: "You are an elite educational AI assistant designed to break down and explain complex educational material to help students learn effectively.",
        responseMimeType: "application/json",
        responseSchema: {
          type: 'OBJECT' as any, // Cast to any to bypass exact enum type checks
          properties: {
            summary: { type: 'STRING' as any },
            chapterSummaries: {
              type: 'ARRAY' as any,
              items: {
                type: 'OBJECT' as any,
                properties: {
                  chapterTitle: { type: 'STRING' as any },
                  summaryText: { type: 'STRING' as any }
                },
                required: ["chapterTitle", "summaryText"]
              }
            },
            keyConcepts: {
              type: 'ARRAY' as any,
              items: {
                type: 'OBJECT' as any,
                properties: {
                  concept: { type: 'STRING' as any },
                  explanation: { type: 'STRING' as any }
                },
                required: ["concept", "explanation"]
              }
            },
            importantDefinitions: {
              type: 'ARRAY' as any,
              items: {
                type: 'OBJECT' as any,
                properties: {
                  term: { type: 'STRING' as any },
                  definition: { type: 'STRING' as any }
                },
                required: ["term", "definition"]
              }
            },
            importantPoints: {
              type: 'ARRAY' as any,
              items: { type: 'STRING' as any }
            },
            examTips: {
              type: 'ARRAY' as any,
              items: { type: 'STRING' as any }
            },
            frequentlyAskedTopics: {
              type: 'ARRAY' as any,
              items: { type: 'STRING' as any }
            }
          },
          required: ["summary", "chapterSummaries", "keyConcepts", "importantDefinitions", "importantPoints", "examTips", "frequentlyAskedTopics"]
        }
      }
    });

    const resultText = response.text || "{}";
    const parsedData = parseGeminiJson<Omit<DocumentAnalysis, 'documentId' | 'createdAt'>>(resultText, {
      summary: "Could not generate summary.",
      chapterSummaries: [{ chapterTitle: "Main Subject", summaryText: "Failed to extract chapter summaries." }],
      keyConcepts: [],
      importantDefinitions: [],
      importantPoints: ["Review the uploaded text to extract main points."],
      examTips: ["Keep focused on major terms and definitions."],
      frequentlyAskedTopics: ["Main terms", "Definitions"]
    });

    const newAnalysis: DocumentAnalysis = {
      documentId: docId,
      summary: parsedData.summary || "Could not generate summary.",
      chapterSummaries: parsedData.chapterSummaries || [],
      keyConcepts: parsedData.keyConcepts || [],
      importantDefinitions: parsedData.importantDefinitions || [],
      importantPoints: parsedData.importantPoints || [],
      examTips: parsedData.examTips || [],
      frequentlyAskedTopics: parsedData.frequentlyAskedTopics || [],
      createdAt: new Date().toISOString()
    };

    await db.createAnalysis(newAnalysis);
    res.json({ analysis: newAnalysis });
  } catch (error: any) {
    console.error('Analysis Generation Error:', error);
    res.status(500).json({ error: error.message || 'Failed to analyze document' });
  }
});
