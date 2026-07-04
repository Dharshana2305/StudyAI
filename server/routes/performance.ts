import express from 'express';
import { db } from '../db.js';
import { getAuthenticatedUser } from './auth.js';
import { ai, MODEL_NAME, parseGeminiJson } from '../gemini.js';
import { PerformanceAnalysis, PersonalizedRecommendations, DashboardStats } from '../../src/types.js';

export const performanceRouter = express.Router();

// Get dashboard stats
performanceRouter.get('/stats', (req, res) => {
  try {
    const user = getAuthenticatedUser(req);
    if (!user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    
    const docs = db.getDocuments(user.id);
    const attempts = db.getAttempts(user.id);
    
    // Count generated notes
    let notesCount = 0;
    docs.forEach(d => {
      if (db.getNotes(d.id)) notesCount++;
    });
    
    // Quizzes count
    const quizzesCount = attempts.length;
    
    // Average score
    const avgScore = attempts.length > 0 
      ? Math.round(attempts.reduce((sum, a) => sum + a.percentage, 0) / attempts.length)
      : 0;
      
    // Generate weekly progress (last 7 days of quiz percentages and documents uploaded)
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const currentDayIdx = new Date().getDay();
    const weeklyProgress = days.map((day, idx) => {
      // Find attempts on this specific day of the week
      const dayAttempts = attempts.filter(a => {
        const attemptDate = new Date(a.date);
        return attemptDate.getDay() === idx;
      });
      const dayDocs = docs.filter(d => {
        const docDate = new Date(d.uploadDate);
        return docDate.getDay() === idx;
      });
      
      const score = dayAttempts.length > 0
        ? Math.round(dayAttempts.reduce((sum, a) => sum + a.percentage, 0) / dayAttempts.length)
        : 0;
        
      return {
        day,
        score,
        documents: dayDocs.length
      };
    });
    
    // Generate monthly progress
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthlyProgress = months.slice(0, new Date().getMonth() + 1).map((month, idx) => {
      const monthAttempts = attempts.filter(a => {
        const attemptDate = new Date(a.date);
        return attemptDate.getMonth() === idx;
      });
      
      const score = monthAttempts.length > 0
        ? Math.round(monthAttempts.reduce((sum, a) => sum + a.percentage, 0) / monthAttempts.length)
        : 0;
        
      return {
        month,
        quizzes: monthAttempts.length,
        score
      };
    });
    
    const stats: DashboardStats = {
      documentsCount: docs.length,
      notesCount,
      quizzesCount,
      averageScore: avgScore,
      streakDays: user.streakDays || 1,
      studyTimeMinutes: user.studyTimeMinutes || 0,
      learningScore: user.learningScore || 0,
      weeklyProgress,
      monthlyProgress
    };
    
    res.json({ stats });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to retrieve stats' });
  }
});

// Get AI performance report and recommendations
performanceRouter.get('/report', async (req, res) => {
  try {
    const user = getAuthenticatedUser(req);
    if (!user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    
    const docs = db.getDocuments(user.id);
    const attempts = db.getAttempts(user.id);
    
    // Fallback if no quizzes completed
    if (attempts.length === 0) {
      const defaultAnalysis: PerformanceAnalysis = {
        userId: user.id,
        strongTopics: ["Onboarding Concepts"],
        weakTopics: ["No data yet"],
        mistakes: [],
        overallAccuracy: 0,
        averageConfidence: 'medium',
        learningProgress: 0
      };
      
      const defaultRecommendations: PersonalizedRecommendations = {
        userId: user.id,
        topicsToRevise: docs.length > 0 ? [docs[0].title] : ["Upload your first document to start!"],
        topicsToPractice: ["Active Recall Flashcards", "Smart Quizzes"],
        estimatedStudyTimeMinutes: docs.length > 0 ? 30 : 15,
        dailyStudyPlan: [
          "Upload reading material or textbooks",
          "Review automatically generated Key Concepts",
          "Attempt an Easy custom Quiz (5 questions)",
          "Practice daily with Flashcards"
        ],
        nextLearningSteps: docs.length > 0 
          ? [`Generate a quiz from "${docs[0].title}"`] 
          : ["Upload study notes, pdfs, slides, or images of text!"]
      };
      
      res.json({ analysis: defaultAnalysis, recommendations: defaultRecommendations });
      return;
    }
    
    // Aggregate quizzes data for Gemini
    const quizzesSummary = attempts.map(a => ({
      quizTitle: a.quizTitle,
      percentage: a.percentage,
      grade: a.grade,
      confidence: a.confidenceLevel,
      score: `${a.score}/${a.maxScore}`
    }));
    
    const prompt = `Review the study history of student "${user.name}" below and generate an in-depth AI performance report and set of study recommendations in JSON format.
The report must contain:
1. "strongTopics": topics/quizzes where the student excels.
2. "weakTopics": topics/quizzes needing more focus.
3. "mistakes": common mistakes list.
4. "overallAccuracy": average accuracy percentage.
5. "averageConfidence": overall confidence level ('low', 'medium', 'high').
6. "learningProgress": percentage value showing estimated mastery increase.
7. "topicsToRevise": revision advice.
8. "topicsToPractice": targeted practice recommendations.
9. "estimatedStudyTimeMinutes": daily study time needed.
10. "dailyStudyPlan": a checklist of steps for their daily routine.
11. "nextLearningSteps": clear actionable items they should take.

Student Stats:
- Documents Uploaded: ${docs.length}
- Total Study Time: ${user.studyTimeMinutes} minutes
- Learning Score: ${user.learningScore}/100
- Recent Quiz Scores: ${JSON.stringify(quizzesSummary)}

Return your assessment matching the JSON schema.`;

    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
      config: {
        systemInstruction: "You are an AI study coach and learning psychologist. You evaluate test history, diagnose gaps in comprehension, and prescribe personalized, actionable learning roadmaps.",
        responseMimeType: "application/json",
        responseSchema: {
          type: 'OBJECT' as any,
          properties: {
            strongTopics: { type: 'ARRAY' as any, items: { type: 'STRING' as any } },
            weakTopics: { type: 'ARRAY' as any, items: { type: 'STRING' as any } },
            mistakes: {
              type: 'ARRAY' as any,
              items: {
                type: 'OBJECT' as any,
                properties: {
                  question: { type: 'STRING' as any },
                  userAnswer: { type: 'STRING' as any },
                  correctAnswer: { type: 'STRING' as any },
                  explanation: { type: 'STRING' as any }
                },
                required: ["question", "userAnswer", "correctAnswer", "explanation"]
              }
            },
            overallAccuracy: { type: 'NUMBER' as any },
            averageConfidence: { type: 'STRING' as any },
            learningProgress: { type: 'NUMBER' as any },
            topicsToRevise: { type: 'ARRAY' as any, items: { type: 'STRING' as any } },
            topicsToPractice: { type: 'ARRAY' as any, items: { type: 'STRING' as any } },
            estimatedStudyTimeMinutes: { type: 'NUMBER' as any },
            dailyStudyPlan: { type: 'ARRAY' as any, items: { type: 'STRING' as any } },
            nextLearningSteps: { type: 'ARRAY' as any, items: { type: 'STRING' as any } }
          },
          required: [
            "strongTopics", "weakTopics", "mistakes", "overallAccuracy", 
            "averageConfidence", "learningProgress", "topicsToRevise", 
            "topicsToPractice", "estimatedStudyTimeMinutes", "dailyStudyPlan", "nextLearningSteps"
          ]
        }
      }
    });

    const resultText = response.text || "{}";
    const report = parseGeminiJson<any>(resultText, null);
    
    if (!report) {
      throw new Error("Could not parse performance report");
    }
    
    const analysis: PerformanceAnalysis = {
      userId: user.id,
      strongTopics: report.strongTopics,
      weakTopics: report.weakTopics,
      mistakes: report.mistakes,
      overallAccuracy: report.overallAccuracy,
      averageConfidence: report.averageConfidence,
      learningProgress: report.learningProgress
    };
    
    const recommendations: PersonalizedRecommendations = {
      userId: user.id,
      topicsToRevise: report.topicsToRevise,
      topicsToPractice: report.topicsToPractice,
      estimatedStudyTimeMinutes: report.estimatedStudyTimeMinutes,
      dailyStudyPlan: report.dailyStudyPlan,
      nextLearningSteps: report.nextLearningSteps
    };
    
    res.json({ analysis, recommendations });
  } catch (error: any) {
    console.error('Performance Generation Error:', error);
    res.status(500).json({ error: error.message || 'Failed to analyze performance' });
  }
});
