import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Upload, FileText, Trash2, Award, Zap, Clock, BookOpen, 
  ArrowRight, Sparkles, CheckCircle2, FileType, Plus,
  FileSpreadsheet, Image as ImageIcon, AlertCircle, HelpCircle
} from 'lucide-react';
import { api } from '../lib/api.js';
import { StudyDocument, QuizAttempt, DashboardStats } from '../types.js';
import { GlassCard } from './GlassCard.js';

interface DashboardViewProps {
  documents: StudyDocument[];
  attempts: QuizAttempt[];
  onDocumentSelect: (doc: StudyDocument) => void;
  onQuizSelect: (quizId: string) => void;
  onRefreshDocs: () => void;
  onUploadStart: () => void;
  onUploadEnd: (doc: StudyDocument) => void;
  onViewChange: (view: 'dashboard' | 'progress') => void;
}

export function DashboardView({
  documents,
  attempts,
  onDocumentSelect,
  onQuizSelect,
  onRefreshDocs,
  onUploadStart,
  onUploadEnd,
  onViewChange
}: DashboardViewProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchStats();
  }, [documents, attempts]);

  const fetchStats = async () => {
    try {
      const data = await api.performance.getStats();
      setStats(data);
    } catch (err) {
      console.error('Failed to load dashboard stats:', err);
    }
  };

  // Drag and drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      await processUpload(files[0]);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      await processUpload(files[0]);
    }
  };

  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  const processUpload = async (file: File) => {
    setUploadError('');
    setUploadProgress(true);
    onUploadStart();
    try {
      const doc = await api.documents.upload(file);
      onUploadEnd(doc);
      onRefreshDocs();
    } catch (err: any) {
      setUploadError(err.message || 'File upload failed. Please ensure it is an approved format (PDF, DOCX, PPTX, TXT, JPG, PNG) under 10MB.');
    } finally {
      setUploadProgress(false);
    }
  };

  const handleDeleteDoc = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Are you sure you want to delete this document? All notes, quizzes, and chat histories will be removed.')) {
      try {
        await api.documents.delete(id);
        onRefreshDocs();
      } catch (err) {
        alert('Failed to delete document');
      }
    }
  };

  // Icon mapping for file types
  const getFileIcon = (type: StudyDocument['fileType']) => {
    switch (type) {
      case 'pdf':
        return <FileText className="h-5 w-5 text-rose-500" />;
      case 'docx':
        return <FileType className="h-5 w-5 text-blue-500" />;
      case 'pptx':
        return <FileSpreadsheet className="h-5 w-5 text-amber-500" />;
      case 'txt':
        return <FileText className="h-5 w-5 text-slate-500" />;
      case 'jpg':
      case 'png':
        return <ImageIcon className="h-5 w-5 text-emerald-500" />;
      default:
        return <FileText className="h-5 w-5 text-slate-500" />;
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const formatDate = (isoString: string) => {
    return new Date(isoString).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <div id="dashboard-view-wrapper" className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 select-none">
      
      {/* 1. Welcoming Dashboard Summary & Streaks Bar */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 mb-8">
        
        {/* Welcome Greeting Banner */}
        <div className="md:col-span-12">
          <GlassCard animate={true} className="bg-gradient-to-r from-indigo-500/10 via-purple-500/5 to-pink-500/10 border-indigo-500/20">
            <div className="p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6 text-left">
              <div className="space-y-2">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 text-xs font-bold rounded-full uppercase tracking-wider">
                  <Sparkles className="h-3 w-3 animate-pulse" /> AI Learning Engine Active
                </div>
                <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                  Your AI Study Companion
                </h2>
                <p className="text-slate-600 dark:text-slate-400 text-sm md:text-base max-w-2xl font-medium leading-relaxed">
                  Transform lectures and textbooks into high-yield smart notes, interactive flashcards, and instant quizzes. Your personalized study metrics are calculated in real time.
                </p>
              </div>

              {/* Learning Level Stat */}
              <div className="flex items-center gap-4 bg-white/50 dark:bg-slate-900/40 p-4 rounded-2xl border border-slate-200/50 dark:border-slate-800/40 shrink-0">
                <div className="p-3 bg-gradient-to-tr from-indigo-500 to-purple-600 text-white rounded-xl shadow-lg shadow-indigo-500/20">
                  <Award className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-xs text-slate-400 dark:text-slate-500 uppercase font-black tracking-wider">Mastery Score</p>
                  <p className="text-2xl font-black text-slate-800 dark:text-white mt-1">
                    {stats ? stats.learningScore : 0}%
                  </p>
                </div>
              </div>
            </div>
          </GlassCard>
        </div>

        {/* 2. Key Action Metric Indicators */}
        <div className="md:col-span-12 grid grid-cols-2 lg:grid-cols-4 gap-4">
          
          <GlassCard delay={0.05} hoverEffect={true} className="border-emerald-500/20">
            <div className="p-5 flex items-center gap-4 text-left">
              <div className="p-3.5 bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 rounded-2xl border border-emerald-500/15">
                <BookOpen className="h-6 w-6" />
              </div>
              <div>
                <p className="text-xs text-slate-400 dark:text-slate-500 uppercase font-black tracking-wider">Study Assets</p>
                <p className="text-2xl font-black text-slate-800 dark:text-white mt-1">
                  {stats ? stats.documentsCount : 0}
                </p>
              </div>
            </div>
          </GlassCard>

          <GlassCard delay={0.1} hoverEffect={true} className="border-indigo-500/20">
            <div className="p-5 flex items-center gap-4 text-left">
              <div className="p-3.5 bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 rounded-2xl border border-indigo-500/15">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <div>
                <p className="text-xs text-slate-400 dark:text-slate-500 uppercase font-black tracking-wider">Completed Quizzes</p>
                <p className="text-2xl font-black text-slate-800 dark:text-white mt-1">
                  {stats ? stats.quizzesCount : 0}
                </p>
              </div>
            </div>
          </GlassCard>

          <GlassCard delay={0.15} hoverEffect={true} className="border-purple-500/20">
            <div className="p-5 flex items-center gap-4 text-left">
              <div className="p-3.5 bg-purple-500/15 text-purple-600 dark:text-purple-400 rounded-2xl border border-purple-500/15">
                <Clock className="h-6 w-6" />
              </div>
              <div>
                <p className="text-xs text-slate-400 dark:text-slate-500 uppercase font-black tracking-wider">Learning Time</p>
                <p className="text-2xl font-black text-slate-800 dark:text-white mt-1">
                  {stats ? stats.studyTimeMinutes : 0} <span className="text-sm font-bold text-slate-400">min</span>
                </p>
              </div>
            </div>
          </GlassCard>

          <GlassCard delay={0.2} hoverEffect={true} className="border-amber-500/20">
            <div className="p-5 flex items-center gap-4 text-left">
              <div className="p-3.5 bg-amber-500/15 text-amber-600 dark:text-amber-400 rounded-2xl border border-amber-500/15">
                <Zap className="h-6 w-6 animate-bounce-slow" />
              </div>
              <div>
                <p className="text-xs text-slate-400 dark:text-slate-500 uppercase font-black tracking-wider">Active Streak</p>
                <p className="text-2xl font-black text-slate-800 dark:text-white mt-1">
                  {stats ? stats.streakDays : 1} <span className="text-sm font-bold text-slate-400">days</span>
                </p>
              </div>
            </div>
          </GlassCard>

        </div>
      </div>

      {/* 3. Main Split Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Column: File drop uploader + Document List (8 cols) */}
        <div className="lg:col-span-8 space-y-8">
          
          {/* File drag-and-drop box */}
          <GlassCard id="file-uploader-box" hoverEffect={false}>
            <div 
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={triggerFileSelect}
              className={`p-8 md:p-10 border-2 border-dashed rounded-2xl cursor-pointer text-center flex flex-col items-center justify-center transition-all duration-300 ${
                isDragging 
                  ? 'border-indigo-500 bg-indigo-500/5 scale-[1.01]' 
                  : 'border-slate-300 dark:border-white/5 bg-white/10 dark:bg-white/5 hover:border-indigo-400 hover:bg-slate-50/50 dark:hover:bg-white/10'
              }`}
            >
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileSelect}
                className="hidden"
                accept=".pdf,.docx,.pptx,.txt,.jpg,.jpeg,.png"
              />
              
              <div className="p-4 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-2xl border border-indigo-500/20 mb-4 shadow-inner">
                {uploadProgress ? (
                  <div className="h-8 w-8 border-2 border-indigo-500/30 border-t-indigo-600 rounded-full animate-spin" />
                ) : (
                  <Upload className="h-8 w-8 animate-pulse" />
                )}
              </div>
              
              <h3 className="text-lg font-bold text-slate-800 dark:text-white tracking-tight">
                {uploadProgress ? 'Processing Document...' : 'Drag & Drop Study Material'}
              </h3>
              
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 max-w-md font-medium leading-normal">
                {uploadProgress 
                  ? 'Extracting and parsing text contents via AI...' 
                  : 'or click to browse your files. Supports PDF, DOCX, PPTX, TXT, or Image files (PNG, JPG) up to 10MB.'
                }
              </p>

              {uploadError && (
                <div className="mt-4 flex items-center gap-2 bg-rose-500/10 text-rose-600 dark:text-rose-400 px-4 py-2 rounded-xl border border-rose-500/20 text-xs font-semibold">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{uploadError}</span>
                </div>
              )}
            </div>
          </GlassCard>

          {/* Documents Table List */}
          <div className="space-y-4">
            <div className="flex justify-between items-center px-1">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-indigo-500" />
                Your Study Material
              </h3>
              <span className="text-xs font-bold text-slate-400 bg-slate-100 dark:bg-slate-950 px-2.5 py-1 rounded-full border border-slate-200/50 dark:border-white/5">
                {documents.length} File{documents.length === 1 ? '' : 's'}
              </span>
            </div>

            <AnimatePresence mode="popLayout">
              {documents.length === 0 ? (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="p-10 border border-slate-200 dark:border-white/5 rounded-2xl bg-white/20 dark:bg-white/5 text-center"
                >
                  <FileText className="mx-auto h-12 w-12 text-slate-400/80 mb-3" />
                  <p className="text-slate-700 dark:text-slate-300 font-bold">No documents uploaded yet</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 max-w-xs mx-auto">
                    Drag and drop a PDF, lecture notes, textbook chapters, or reference images above to begin studying with AI!
                  </p>
                </motion.div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {documents.map((doc, idx) => (
                    <motion.div
                      key={doc.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ delay: idx * 0.03 }}
                      onClick={() => onDocumentSelect(doc)}
                      className="group cursor-pointer text-left"
                    >
                      <GlassCard hoverEffect={true} animate={false} className="h-full border-slate-200/50 dark:border-white/5">
                        <div className="p-5 flex flex-col justify-between h-full gap-4">
                          
                          {/* File header */}
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-center gap-3">
                              <div className="p-2.5 bg-slate-100 dark:bg-[#0f0f12] rounded-xl border border-slate-200/30 dark:border-white/10">
                                {getFileIcon(doc.fileType)}
                              </div>
                              <div className="max-w-[180px] sm:max-w-[200px]">
                                <h4 className="text-sm font-bold text-slate-900 dark:text-white truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                                  {doc.title}
                                </h4>
                                <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">
                                  {doc.fileType} • {formatBytes(doc.fileSize)}
                                </p>
                              </div>
                            </div>
                            
                            {/* Delete button */}
                            <button
                              id={`delete-doc-${doc.id}`}
                              onClick={(e) => handleDeleteDoc(doc.id, e)}
                              className="p-2 text-slate-400 hover:text-rose-500 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-500/10 cursor-pointer transition-colors"
                              title="Delete Document"
                            >
                              <Trash2 className="h-4.5 w-4.5" />
                            </button>
                          </div>

                          {/* Stats footer */}
                          <div className="flex justify-between items-center pt-3 border-t border-slate-100 dark:border-white/5">
                            <div className="text-left">
                              <p className="text-[10px] text-slate-400 font-black uppercase">Source words</p>
                              <p className="text-xs font-bold text-slate-700 dark:text-slate-300 mt-0.5">{doc.wordCount.toLocaleString()}</p>
                            </div>
                            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 dark:text-indigo-400 group-hover:gap-2.5 transition-all">
                              Study portal
                              <ArrowRight className="h-4 w-4" />
                            </div>
                          </div>

                        </div>
                      </GlassCard>
                    </motion.div>
                  ))}
                </div>
              )}
            </AnimatePresence>
          </div>

        </div>

        {/* Right Column: Overview Stats & Quick Guides & Quiz History (4 cols) */}
        <div className="lg:col-span-4 space-y-8 text-left">
          
          {/* Quick study start recommendation box */}
          <GlassCard hoverEffect={true} onClick={() => onViewChange('progress')} className="border-indigo-500/20 bg-indigo-500/5">
            <div className="p-5 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                  <Sparkles className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">AI Learning Coach</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">View your study recommendations</p>
                </div>
              </div>
              <ArrowRight className="h-5 w-5 text-indigo-500 shrink-0" />
            </div>
          </GlassCard>

          {/* Quiz Attempt History */}
          <div className="space-y-4">
            <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2 px-1">
              <Award className="h-5 w-5 text-purple-500" />
              Quiz Performance
            </h3>

            <GlassCard hoverEffect={false}>
              <div className="p-4 divide-y divide-slate-100 dark:divide-white/5">
                {attempts.length === 0 ? (
                  <div className="py-6 text-center">
                    <HelpCircle className="mx-auto h-8 w-8 text-slate-400 mb-2" />
                    <p className="text-sm font-bold text-slate-700 dark:text-slate-300">No quizzes completed yet</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      Choose any uploaded document and generate a quiz to test your memory!
                    </p>
                  </div>
                ) : (
                  attempts.slice(0, 5).map((attempt, idx) => (
                    <div key={attempt.id} className={`py-3 flex items-center justify-between gap-3 ${idx === 0 ? 'pt-0' : ''}`}>
                      <div className="max-w-[180px]">
                        <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">
                          {attempt.quizTitle}
                        </h4>
                        <p className="text-[10px] text-slate-400 mt-0.5">
                          {formatDate(attempt.date)} • Score: {attempt.score}/{attempt.maxScore}
                        </p>
                      </div>

                      <div className="flex items-center gap-2.5">
                        <div className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase border ${
                          attempt.percentage >= 80 
                            ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' 
                            : attempt.percentage >= 60 
                              ? 'bg-amber-500/10 text-amber-600 border-amber-500/20' 
                              : 'bg-rose-500/10 text-rose-600 border-rose-500/20'
                        }`}>
                          Grade {attempt.grade}
                        </div>
                        <span className="text-sm font-black text-slate-700 dark:text-slate-300">
                          {attempt.percentage}%
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </GlassCard>
          </div>

          {/* Quick instructions panel */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 px-1">
              AI Study Guide
            </h3>

            <GlassCard hoverEffect={false}>
              <div className="p-5 space-y-4">
                <div className="flex gap-3">
                  <div className="h-6 w-6 rounded-full bg-slate-100 dark:bg-[#0f0f12] border border-slate-200 dark:border-white/5 flex items-center justify-center text-xs font-black text-slate-500 shrink-0 mt-0.5">1</div>
                  <div>
                    <h5 className="text-xs font-bold text-slate-800 dark:text-slate-200">Upload Learning Material</h5>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-normal">Drag or select PDFs, texts, DOCX, or images of text. AI automatically transcribes all readable content.</p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="h-6 w-6 rounded-full bg-slate-100 dark:bg-[#0f0f12] border border-slate-200 dark:border-white/5 flex items-center justify-center text-xs font-black text-slate-500 shrink-0 mt-0.5">2</div>
                  <div>
                    <h5 className="text-xs font-bold text-slate-800 dark:text-slate-200">AI Deep Analysis</h5>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-normal">Open your document to view chapter-wise summaries, key definitions, revision lists, notes, and flashcards.</p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="h-6 w-6 rounded-full bg-slate-100 dark:bg-[#0f0f12] border border-slate-200 dark:border-white/5 flex items-center justify-center text-xs font-black text-slate-500 shrink-0 mt-0.5">3</div>
                  <div>
                    <h5 className="text-xs font-bold text-slate-800 dark:text-slate-200">Test Your Mastery</h5>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-normal">Generate custom-difficulty quizzes (Multiple Choice, True/False, Blanks, Short Answers). Submit for grade feedback.</p>
                  </div>
                </div>
              </div>
            </GlassCard>
          </div>

        </div>

      </div>

    </div>
  );
}
