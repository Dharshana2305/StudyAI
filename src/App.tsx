import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, GraduationCap } from 'lucide-react';
import { api } from './lib/api.js';
import { UserProfile, StudyDocument, QuizAttempt } from './types.js';
import { AuthView } from './components/AuthView.js';
import { Navbar } from './components/Navbar.js';
import { DashboardView } from './components/DashboardView.js';
import { DocumentView } from './components/DocumentView.js';
import { QuizView } from './components/QuizView.js';
import { ProgressView } from './components/ProgressView.js';

export default function App() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [appLoading, setAppLoading] = useState(true);
  
  // Navigation & Sub-views states
  const [currentView, setCurrentView] = useState<'dashboard' | 'progress'>('dashboard');
  const [selectedDocument, setSelectedDocument] = useState<StudyDocument | null>(null);
  const [quizDocument, setQuizDocument] = useState<StudyDocument | null>(null);

  // App data caches
  const [documents, setDocuments] = useState<StudyDocument[]>([]);
  const [attempts, setAttempts] = useState<QuizAttempt[]>([]);
  const [attemptsCount, setAttemptsCount] = useState(0);

  // Initial Auth validation on startup
  useEffect(() => {
    checkAuthSession();
  }, []);

  // Fetch documents and quizzes whenever user changes or when requested
  useEffect(() => {
    if (user) {
      loadUserData();
    }
  }, [user]);

  const checkAuthSession = async () => {
    setAppLoading(true);
    const savedToken = localStorage.getItem('studyai_token');
    if (savedToken) {
      try {
        const profile = await api.auth.getMe();
        setUser(profile);
      } catch (err) {
        console.error('Session validation failed. Clearing token.', err);
        localStorage.removeItem('studyai_token');
        setUser(null);
      }
    }
    setAppLoading(false);
  };

  const loadUserData = async () => {
    try {
      const docs = await api.documents.list();
      const attemptsData = await api.quizzes.getHistory();
      
      setDocuments(docs);
      setAttempts(attemptsData);
    } catch (err) {
      console.error('Failed to load study records:', err);
    }
  };

  const handleAuthSuccess = (authenticatedUser: UserProfile) => {
    setUser(authenticatedUser);
    setCurrentView('dashboard');
    setSelectedDocument(null);
    setQuizDocument(null);
  };

  const handleLogout = () => {
    api.auth.logout();
    setUser(null);
    setDocuments([]);
    setAttempts([]);
    setCurrentView('dashboard');
    setSelectedDocument(null);
    setQuizDocument(null);
  };

  const handleQuizCompleted = () => {
    setAttemptsCount(prev => prev + 1);
    void loadUserData();
  };

  const handleSelectDocument = (doc: StudyDocument) => {
    setSelectedDocument(doc);
    setQuizDocument(null);
  };

  const handleStartQuiz = (doc: StudyDocument) => {
    setQuizDocument(doc);
    setSelectedDocument(doc);
  };

  const handleBackFromDocument = () => {
    setSelectedDocument(null);
    setQuizDocument(null);
  };

  const handleBackFromQuiz = () => {
    setQuizDocument(null);
    setSelectedDocument(null);
  };

  if (appLoading) {
    return (
      <div id="app-startup-loader" className="min-h-screen w-full flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950 transition-colors duration-200">
        <div className="space-y-4 text-center">
          <div className="p-4 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-3xl border border-indigo-500/20 inline-block animate-pulse">
            <GraduationCap className="h-10 w-10" />
          </div>
          <h1 className="text-xl font-extrabold text-slate-800 dark:text-white tracking-tight">
            StudyAI Loading
          </h1>
          <div className="h-1 w-24 bg-indigo-100 dark:bg-slate-800 rounded-full mx-auto overflow-hidden">
            <div className="h-full w-12 bg-indigo-600 rounded-full animate-loader-slide" />
          </div>
        </div>
      </div>
    );
  }

  // Render Auth module if not authenticated
  if (!user) {
    return <AuthView onAuthSuccess={handleAuthSuccess} />;
  }

  return (
    <div id="app-main-view" className="min-h-screen w-full flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white transition-colors duration-200">
      
      {/* Dynamic Main App Navigation bar */}
      <Navbar
        user={user}
        currentView={currentView}
        onViewChange={(view) => {
          setCurrentView(view);
          if (view === 'dashboard') {
            setSelectedDocument(null);
            setQuizDocument(null);
          }
        }}
        onLogout={handleLogout}
      />

      {/* Main Container Stage with fade-in animation layout */}
      <main className="flex-1 w-full pb-16">
        <AnimatePresence mode="wait">
          
          {/* A. If a Document is selected for Quiz practice */}
          {quizDocument ? (
            <motion.div
              key="quiz-section-panel"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.2 }}
            >
              <QuizView
                document={quizDocument}
                onBack={handleBackFromQuiz}
                onQuizCompleted={handleQuizCompleted}
              />
            </motion.div>
          ) : 

          /* B. If a Document is selected for study portal analysis/notes/chat */
          selectedDocument ? (
            <motion.div
              key="document-section-panel"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.2 }}
            >
              <DocumentView
                document={selectedDocument}
                onBack={handleBackFromDocument}
                onStartQuiz={handleStartQuiz}
              />
            </motion.div>
          ) :

          /* C. Render View based on Navbar (Dashboard vs. Analytics) */
          currentView === 'dashboard' ? (
            <motion.div
              key="dashboard-section-panel"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <DashboardView
                documents={documents}
                attempts={attempts}
                onDocumentSelect={handleSelectDocument}
                onQuizSelect={(quizId) => console.log('view quiz', quizId)}
                onRefreshDocs={loadUserData}
                onUploadStart={() => {}}
                onUploadEnd={(doc) => handleSelectDocument(doc)}
                onViewChange={setCurrentView}
              />
            </motion.div>
          ) : (
            <motion.div
              key="progress-section-panel"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <ProgressView
                attemptsCount={attemptsCount}
                onBack={() => setCurrentView('dashboard')}
              />
            </motion.div>
          )}

        </AnimatePresence>
      </main>
    </div>
  );
}
