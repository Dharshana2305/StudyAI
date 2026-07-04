/**
 * Shared Type Definitions for StudyAI
 */

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string;
  isGuest: boolean;
  learningScore: number; // 0 to 100
  studyTimeMinutes: number;
  streakDays: number;
  createdAt: string;
}

export interface StudyDocument {
  id: string;
  userId: string;
  title: string;
  fileType: 'pdf' | 'docx' | 'pptx' | 'txt' | 'jpg' | 'png';
  fileSize: number; // in bytes
  uploadDate: string;
  extractedText: string;
  wordCount: number;
}

export interface ChapterSummary {
  chapterTitle: string;
  summaryText: string;
}

export interface KeyConcept {
  concept: string;
  explanation: string;
}

export interface ImportantDefinition {
  term: string;
  definition: string;
}

export interface DocumentAnalysis {
  documentId: string;
  summary: string;
  chapterSummaries: ChapterSummary[];
  keyConcepts: KeyConcept[];
  importantDefinitions: ImportantDefinition[];
  importantPoints: string[];
  examTips: string[];
  frequentlyAskedTopics: string[];
  createdAt: string;
}

export interface Flashcard {
  id: string;
  question: string;
  answer: string;
}

export interface SmartNotes {
  documentId: string;
  shortNotes: string;
  detailedNotes: string;
  bulletNotes: string[];
  revisionNotes: string;
  flashcards: Flashcard[];
  createdAt: string;
}

export type QuizQuestionType = 'multiple_choice' | 'true_false' | 'fill_blank' | 'short_answer';

export interface QuizQuestion {
  id: string;
  type: QuizQuestionType;
  question: string;
  options?: string[]; // for multiple_choice
  correctAnswer: string; // "true" / "false" for true_false, exact or key terms for short_answer
  explanation: string;
}

export interface Quiz {
  id: string;
  documentId: string;
  title: string;
  difficulty: 'easy' | 'medium' | 'hard';
  questions: QuizQuestion[];
  createdAt: string;
}

export interface UserAnswers {
  [questionId: string]: string; // questionId -> user selected or typed answer
}

export interface QuizAttempt {
  id: string;
  userId: string;
  quizId: string;
  quizTitle: string;
  score: number;
  maxScore: number;
  percentage: number;
  grade: string;
  timeTakenSeconds: number;
  answers: UserAnswers;
  confidenceLevel: 'low' | 'medium' | 'high';
  date: string;
}

export interface TopicPerformance {
  topic: string;
  totalQuestions: number;
  correctAnswers: number;
  accuracy: number; // 0 to 100
}

export interface PerformanceAnalysis {
  userId: string;
  strongTopics: string[];
  weakTopics: string[];
  mistakes: Array<{
    question: string;
    userAnswer: string;
    correctAnswer: string;
    explanation: string;
  }>;
  overallAccuracy: number;
  averageConfidence: 'low' | 'medium' | 'high';
  learningProgress: number; // 0 to 100 percentage increase
}

export interface PersonalizedRecommendations {
  userId: string;
  topicsToRevise: string[];
  topicsToPractice: string[];
  estimatedStudyTimeMinutes: number;
  dailyStudyPlan: string[];
  nextLearningSteps: string[];
}

export interface ChatMessage {
  id: string;
  documentId: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: string;
}

export interface DashboardStats {
  documentsCount: number;
  notesCount: number;
  quizzesCount: number;
  averageScore: number;
  streakDays: number;
  studyTimeMinutes: number;
  learningScore: number;
  weeklyProgress: Array<{ day: string; score: number; documents: number }>;
  monthlyProgress: Array<{ month: string; quizzes: number; score: number }>;
}
