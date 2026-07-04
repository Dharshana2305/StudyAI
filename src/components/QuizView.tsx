import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ArrowLeft, Brain, HelpCircle, CheckCircle2, XCircle, Award, 
  Clock, Check, ChevronRight, AlertCircle, ArrowRight, Play, CheckCircle
} from 'lucide-react';
import { api, downloadFile } from '../lib/api.js';
import { StudyDocument, Quiz, QuizQuestion, QuizAttempt, UserAnswers } from '../types.js';
import { GlassCard } from './GlassCard.js';

interface QuizViewProps {
  document: StudyDocument;
  onBack: () => void;
  onQuizCompleted: () => void;
}

export function QuizView({ document, onBack, onQuizCompleted }: QuizViewProps) {
  const [stage, setStage] = useState<'config' | 'loading' | 'taking' | 'results'>('config');
  
  // Quiz config form states
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [questionCount, setQuestionCount] = useState<number>(5);
  const [questionType, setQuestionType] = useState<string>('mix');

  // Active quiz states
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [answers, setAnswers] = useState<UserAnswers>({});
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [confidence, setConfidence] = useState<'low' | 'medium' | 'high'>('medium');
  const [errorMsg, setErrorMsg] = useState('');
  const [infoMsg, setInfoMsg] = useState('');

  // Results / Evaluation states
  const [attempt, setAttempt] = useState<QuizAttempt | null>(null);

  // Interval for quiz taking timer
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (stage === 'taking') {
      interval = setInterval(() => {
        setTimerSeconds(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [stage]);

  const handleGenerateQuiz = async () => {
    setStage('loading');
    setErrorMsg('');
    setInfoMsg('');
    try {
      const resp = await api.quizzes.generate(
        document.id,
        difficulty,
        questionCount,
        questionType
      );
      const generated = resp.quiz;
      if (!generated?.questions?.length) {
        throw new Error('The quiz generator returned no questions. Please try again.');
      }
      if (resp.fallback) {
        setInfoMsg(resp.message || 'AI quota reached — using a local fallback quiz.');
      }
      setQuiz(generated);
      setAnswers({});
      setTimerSeconds(0);
      setCurrentQuestionIdx(0);
      setStage('taking');
    } catch (err: any) {
      if (err && err.status === 429) {
        setErrorMsg('AI quota exceeded. Please try again later.');
      } else {
        setErrorMsg(err.message || 'Failed to generate your study quiz. Please try again.');
      }
      setStage('config');
    }
  };

  const handleSelectAnswer = (questionId: string, answer: string) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: answer
    }));
  };

  const handleSubmitQuiz = async () => {
    if (!quiz) return;
    
    // Check if they answered all questions
    const answeredCount = Object.keys(answers).length;
    if (answeredCount < quiz.questions.length) {
      if (!confirm(`You have only answered ${answeredCount} of ${quiz.questions.length} questions. Are you sure you want to submit?`)) {
        return;
      }
    }

    setStage('loading');
    try {
      const result = await api.quizzes.submit(
        quiz.id,
        answers,
        timerSeconds,
        confidence
      );
      setAttempt(result);
      setStage('results');
      onQuizCompleted();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to submit quiz results.');
      setStage('taking');
    }
  };

  const handleDownloadReport = () => {
    if (!quiz || !attempt) return;
    
    const reportContent = `
      <h1>Quiz Study Report: ${quiz.title}</h1>
      <p class="meta">Attempted by Student on ${new Date(attempt.date).toLocaleDateString()}</p>
      
      <div class="card">
        <h2>Overall Score Summary</h2>
        <strong>Final Grade:</strong> ${attempt.grade}<br/>
        <strong>Score:</strong> ${attempt.score}/${attempt.maxScore} (${attempt.percentage}%)<br/>
        <strong>Time Taken:</strong> ${Math.floor(attempt.timeTakenSeconds / 60)}m ${attempt.timeTakenSeconds % 60}s<br/>
        <strong>Student Confidence:</strong> ${attempt.confidenceLevel.toUpperCase()}
      </div>
      
      <h2>Detailed Evaluation & Correct Answers</h2>
      <div>
        ${quiz.questions.map((q, i) => {
          const uAns = attempt.answers[q.id] || "No Answer";
          const isCorrect = q.type === 'short_answer' || uAns.toLowerCase().trim() === q.correctAnswer.toLowerCase().trim();
          return `
            <div class="card" style="border-left: 5px solid ${isCorrect ? '#10b981' : '#f43f5e'}">
              <strong>Question ${i + 1}: ${q.question}</strong><br/>
              <strong>Your Answer:</strong> <span style="color: ${isCorrect ? '#047857' : '#be123c'}">${uAns}</span><br/>
              <strong>Correct Answer:</strong> ${q.correctAnswer}<br/>
              <p><em>Explanation:</em> ${q.explanation}</p>
            </div>
          `;
        }).join('')}
      </div>
    `;
    
    downloadFile(`StudyAI_QuizReport_${quiz.title.replace(/\s+/g, '_')}`, reportContent, 'html');
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div id="quiz-view-root" className="mx-auto max-w-4xl px-4 py-8 select-none">
      
      {/* 1. Quiz Config Stage */}
      {stage === 'config' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 text-left">
          
          <button
            id="quiz-config-back-btn"
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-800 dark:hover:text-white font-semibold text-sm group cursor-pointer transition-colors"
          >
            <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
            Back to Study Portal
          </button>

          <GlassCard hoverEffect={false}>
            <div className="p-6 md:p-8 space-y-6">
              
              <div className="space-y-1">
                <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2 tracking-tight">
                  <Brain className="h-6 w-6 text-indigo-500 animate-pulse" />
                  AI Practice Quiz Generator
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                  Construct a dynamic test focused *strictly* on key sections of your document.
                </p>
              </div>

              {errorMsg && (
                <div className="flex items-center gap-2 bg-rose-500/10 text-rose-600 dark:text-rose-400 p-3.5 rounded-xl border border-rose-500/20 text-xs font-semibold">
                  <AlertCircle className="h-4.5 w-4.5 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {infoMsg && (
                <div className="flex items-center gap-2 bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300 p-3.5 rounded-xl border border-indigo-100 dark:border-indigo-800 text-xs font-semibold">
                  <HelpCircle className="h-4.5 w-4.5 shrink-0" />
                  <span>{infoMsg}</span>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Select difficulty */}
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-wider text-slate-400">Select Difficulty</label>
                  <div className="grid grid-cols-3 gap-2 bg-slate-100 dark:bg-[#0f0f12] rounded-xl p-1 border border-slate-200/50 dark:border-white/5">
                    {(['easy', 'medium', 'hard'] as const).map(level => (
                      <button
                        key={level}
                        type="button"
                        onClick={() => setDifficulty(level)}
                        className={`py-2 rounded-lg text-xs font-bold uppercase transition-all cursor-pointer ${
                          difficulty === level
                            ? 'bg-white dark:bg-[#0a0a0c] text-indigo-600 dark:text-indigo-400 shadow-sm border border-slate-200/50 dark:border-white/5'
                            : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                        }`}
                      >
                        {level}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Select question count */}
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-wider text-slate-400">Number of Questions</label>
                  <div className="grid grid-cols-4 gap-2 bg-slate-100 dark:bg-[#0f0f12] rounded-xl p-1 border border-slate-200/50 dark:border-white/5">
                    {[5, 10, 15, 20].map(cnt => (
                      <button
                        key={cnt}
                        type="button"
                        onClick={() => setQuestionCount(cnt)}
                        className={`py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                          questionCount === cnt
                            ? 'bg-white dark:bg-[#0a0a0c] text-indigo-600 dark:text-indigo-400 shadow-sm border border-slate-200/50 dark:border-white/5'
                            : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                        }`}
                      >
                        {cnt}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Question Types */}
                <div className="md:col-span-2 space-y-2">
                  <label className="text-xs font-black uppercase tracking-wider text-slate-400">Question Format</label>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-2 bg-slate-100 dark:bg-[#0f0f12] rounded-xl p-1 border border-slate-200/50 dark:border-white/5">
                    {[
                      { key: 'mix', name: 'Mix Format' },
                      { key: 'multiple_choice', name: 'MCQs' },
                      { key: 'true_false', name: 'True/False' },
                      { key: 'fill_blank', name: 'Blanks' },
                      { key: 'short_answer', name: 'Short Ans' }
                    ].map(typeObj => (
                      <button
                        key={typeObj.key}
                        type="button"
                        onClick={() => setQuestionType(typeObj.key)}
                        className={`py-2 px-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                          questionType === typeObj.key
                            ? 'bg-white dark:bg-[#0a0a0c] text-indigo-600 dark:text-indigo-400 shadow-sm border border-slate-200/50 dark:border-white/5'
                            : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                        }`}
                      >
                        {typeObj.name}
                      </button>
                    ))}
                  </div>
                </div>

              </div>

              {/* Launcher Button */}
              <motion.button
                id="generate-quiz-btn"
                type="button"
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                onClick={handleGenerateQuiz}
                className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl py-4 font-bold shadow-lg shadow-indigo-600/20 hover:shadow-indigo-600/30 flex items-center justify-center gap-2 cursor-pointer border border-indigo-500/10 mt-6"
              >
                <Play className="h-4.5 w-4.5" />
                Assemble Custom AI Quiz
              </motion.button>

            </div>
          </GlassCard>
          
        </motion.div>
      )}

      {/* 2. Loading Stage */}
      {stage === 'loading' && (
        <div className="py-24 text-center space-y-4">
          <div className="h-12 w-12 border-4 border-indigo-500/20 border-t-indigo-600 rounded-full animate-spin mx-auto" />
          <h3 className="text-lg font-bold text-slate-800 dark:text-white">AI is reading document & compiling questions...</h3>
          <p className="text-xs text-slate-400 max-w-xs mx-auto">This takes about 10-15 seconds. We formulate detailed options and educational explanations for correct outcomes.</p>
        </div>
      )}

      {/* 3. Taking Quiz Stage */}
      {stage === 'taking' && quiz && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 text-left">
          
          {/* Active stats bar */}
          <div className="flex justify-between items-center bg-slate-100 dark:bg-[#0f0f12] border border-slate-200/50 dark:border-white/5 rounded-2xl px-5 py-3.5 select-none">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-400">Quiz Stage:</span>
              <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 px-2.5 py-0.5 rounded border border-indigo-500/15 uppercase">
                {difficulty} Level
              </span>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-600 dark:text-slate-400">
                <Clock className="h-4 w-4" />
                {formatTime(timerSeconds)}
              </div>
              <span className="text-xs font-bold text-slate-400">
                Question {currentQuestionIdx + 1} of {quiz.questions.length}
              </span>
            </div>
          </div>

          {/* Core Question Card */}
          <GlassCard hoverEffect={false}>
            <div className="p-6 md:p-8 space-y-6">
              
              {/* Question progress dot line */}
              <div className="flex gap-1.5 shrink-0">
                {quiz.questions.map((_, idx) => (
                  <div
                    key={idx}
                    className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
                      idx === currentQuestionIdx
                        ? 'bg-indigo-600'
                        : answers[quiz.questions[idx].id]
                          ? 'bg-indigo-500/40'
                          : 'bg-slate-200 dark:bg-slate-800'
                    }`}
                  />
                ))}
              </div>

              {/* Question Text */}
              <div className="space-y-1">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Question Statement</span>
                <h3 className="text-lg font-extrabold text-slate-950 dark:text-white leading-normal pt-1">
                  {quiz.questions[currentQuestionIdx].question}
                </h3>
              </div>

              {/* Input Answers depending on question type */}
              <div className="pt-4">
                
                {/* A. Multiple Choice Input */}
                {quiz.questions[currentQuestionIdx].type === 'multiple_choice' && quiz.questions[currentQuestionIdx].options && (
                  <div className="grid grid-cols-1 gap-3">
                    {quiz.questions[currentQuestionIdx].options.map((opt, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => handleSelectAnswer(quiz.questions[currentQuestionIdx].id, opt)}
                        className={`w-full p-4 rounded-xl border text-left text-xs font-semibold cursor-pointer transition-all flex items-center justify-between ${
                          answers[quiz.questions[currentQuestionIdx].id] === opt
                            ? 'border-indigo-600 bg-indigo-500/5 text-indigo-600 dark:text-indigo-400'
                            : 'border-slate-200 dark:border-white/5 hover:border-indigo-400 hover:bg-slate-50 dark:hover:bg-white/5 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        <span>{opt}</span>
                        {answers[quiz.questions[currentQuestionIdx].id] === opt && (
                          <div className="h-5 w-5 bg-indigo-600 rounded-full flex items-center justify-center text-white shrink-0">
                            <Check className="h-3 w-3" />
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                )}

                {/* B. True or False Input */}
                {quiz.questions[currentQuestionIdx].type === 'true_false' && (
                  <div className="grid grid-cols-2 gap-4">
                    {['true', 'false'].map(val => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => handleSelectAnswer(quiz.questions[currentQuestionIdx].id, val)}
                        className={`p-5 rounded-xl border text-center text-xs font-extrabold uppercase cursor-pointer transition-all ${
                          answers[quiz.questions[currentQuestionIdx].id] === val
                            ? 'border-indigo-600 bg-indigo-500/5 text-indigo-600 dark:text-indigo-400 shadow-sm'
                            : 'border-slate-200 dark:border-white/5 hover:border-indigo-400 hover:bg-slate-50 dark:hover:bg-white/5 text-slate-600'
                        }`}
                      >
                        {val}
                      </button>
                    ))}
                  </div>
                )}

                {/* C. Fill in the Blank Input */}
                {quiz.questions[currentQuestionIdx].type === 'fill_blank' && (
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">Type correct answer keyword</label>
                    <input
                      id="blank-ans-input"
                      type="text"
                      placeholder="Type your response here..."
                      value={answers[quiz.questions[currentQuestionIdx].id] || ''}
                      onChange={(e) => handleSelectAnswer(quiz.questions[currentQuestionIdx].id, e.target.value)}
                      className="w-full bg-slate-100/50 dark:bg-[#0f0f12]/50 border border-slate-200 dark:border-white/5 text-slate-900 dark:text-white rounded-xl py-3.5 px-4 text-xs font-semibold focus:outline-none focus:border-indigo-500 dark:focus:border-indigo-400"
                    />
                  </div>
                )}

                {/* D. Short Answer Input */}
                {quiz.questions[currentQuestionIdx].type === 'short_answer' && (
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">Describe explanation / answer</label>
                    <textarea
                      id="short-ans-textarea"
                      rows={5}
                      placeholder="Type your explanation in detail..."
                      value={answers[quiz.questions[currentQuestionIdx].id] || ''}
                      onChange={(e) => handleSelectAnswer(quiz.questions[currentQuestionIdx].id, e.target.value)}
                      className="w-full bg-slate-100/50 dark:bg-[#0f0f12]/50 border border-slate-200 dark:border-white/5 text-slate-900 dark:text-white rounded-xl py-3.5 px-4 text-xs font-semibold focus:outline-none focus:border-indigo-500 dark:focus:border-indigo-400 resize-none"
                    />
                  </div>
                )}

              </div>

            </div>
          </GlassCard>

          {/* Confidence and Navigation controls */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
            
            {/* Confidence selector */}
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold text-slate-400">My Confidence:</span>
              <div className="flex gap-1 bg-slate-100 dark:bg-[#0f0f12] rounded-xl p-1 border border-slate-200/50 dark:border-white/5">
                {(['low', 'medium', 'high'] as const).map(conf => (
                  <button
                    key={conf}
                    type="button"
                    onClick={() => setConfidence(conf)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase cursor-pointer transition-all ${
                      confidence === conf
                        ? 'bg-white dark:bg-[#0a0a0c] text-indigo-600 dark:text-indigo-400 shadow-sm border border-slate-200/50 dark:border-white/5'
                        : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                    }`}
                  >
                    {conf}
                  </button>
                ))}
              </div>
            </div>

            {/* Pagination keys */}
            <div className="flex gap-2 w-full sm:w-auto">
              {currentQuestionIdx > 0 && (
                <button
                  id="quiz-prev-q-btn"
                  onClick={() => setCurrentQuestionIdx(prev => prev - 1)}
                  className="flex-1 sm:flex-initial px-4 py-3.5 border border-slate-200 dark:border-white/5 text-slate-600 hover:bg-slate-50 dark:hover:bg-[#0f0f12] rounded-xl text-xs font-bold cursor-pointer transition-all"
                >
                  Previous Question
                </button>
              )}

              {currentQuestionIdx < quiz.questions.length - 1 ? (
                <button
                  id="quiz-next-q-btn"
                  onClick={() => setCurrentQuestionIdx(prev => prev + 1)}
                  className="flex-1 sm:flex-initial px-6 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-600/15 cursor-pointer transition-all"
                >
                  Next Question
                </button>
              ) : (
                <button
                  id="quiz-submit-btn"
                  type="button"
                  onClick={handleSubmitQuiz}
                  className="flex-1 sm:flex-initial px-6 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-600/15 cursor-pointer transition-all"
                >
                  Submit Quiz Answers
                </button>
              )}
            </div>

          </div>

        </motion.div>
      )}

      {/* 4. Quiz Results / Evaluation Screen */}
      {stage === 'results' && attempt && quiz && (
        <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="space-y-8 text-left">
          
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <h2 className="text-2xl font-black text-slate-950 dark:text-white flex items-center gap-2">
              <Award className="h-6.5 w-6.5 text-purple-500 animate-pulse" />
              Quiz Evaluation Report
            </h2>
            
            <div className="flex items-center gap-2.5">
              <button
                id="results-download-btn"
                onClick={handleDownloadReport}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold cursor-pointer transition-colors"
              >
                Download Report
              </button>
              
              <button
                id="results-exit-btn"
                onClick={onBack}
                className="px-4 py-2 border border-slate-200 dark:border-white/5 text-slate-600 hover:bg-slate-50 dark:hover:bg-[#0f0f12] rounded-xl text-xs font-bold cursor-pointer transition-colors"
              >
                Close Report
              </button>
            </div>
          </div>

          {/* Results Summary Box */}
          <GlassCard hoverEffect={false} className="bg-gradient-to-tr from-indigo-500/10 via-purple-500/5 to-emerald-500/10 border-indigo-500/20">
            <div className="p-6 md:p-8 grid grid-cols-2 sm:grid-cols-4 gap-6 text-center">
              <div>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 uppercase font-black tracking-wider">Final Grade</p>
                <p className="text-4xl font-black text-slate-900 dark:text-white mt-1.5">{attempt.grade}</p>
              </div>
              
              <div>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 uppercase font-black tracking-wider">Mastery Accuracy</p>
                <p className="text-4xl font-black text-slate-900 dark:text-white mt-1.5">{attempt.percentage}%</p>
              </div>

              <div>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 uppercase font-black tracking-wider">Total Score</p>
                <p className="text-4xl font-black text-slate-900 dark:text-white mt-1.5">{attempt.score}/{attempt.maxScore}</p>
              </div>

              <div>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 uppercase font-black tracking-wider">Time Taken</p>
                <p className="text-4xl font-black text-slate-900 dark:text-white mt-1.5">{formatTime(attempt.timeTakenSeconds)}</p>
              </div>
            </div>
          </GlassCard>

          {/* Detailed Question Review List */}
          <div className="space-y-4">
            <h3 className="text-sm font-black uppercase tracking-wider text-slate-400 px-1">
              Detailed Question Review
            </h3>

            <div className="space-y-4">
              {quiz.questions.map((q, idx) => {
                const uAns = attempt.answers[q.id] || '(No Answer Provided)';
                const isCorrect = q.type === 'short_answer' || uAns.toLowerCase().trim() === q.correctAnswer.toLowerCase().trim();
                
                return (
                  <GlassCard key={q.id} animate={false} className={`border-l-4 ${isCorrect ? 'border-l-emerald-500' : 'border-l-rose-500'}`}>
                    <div className="p-5 md:p-6 space-y-4">
                      
                      <div className="flex justify-between items-start gap-4">
                        <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                          Question {idx + 1}: {q.question}
                        </h4>
                        {isCorrect ? (
                          <div className="flex items-center gap-1 text-emerald-500 shrink-0">
                            <CheckCircle2 className="h-5 w-5" />
                            <span className="text-[10px] font-black uppercase hidden sm:inline">Correct</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1 text-rose-500 shrink-0">
                            <XCircle className="h-5 w-5" />
                            <span className="text-[10px] font-black uppercase hidden sm:inline">Incorrect</span>
                          </div>
                        )}
                      </div>

                      {/* User answer vs correct answer block */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200/30 dark:border-slate-800/50">
                        <div>
                          <p className="text-[9px] font-black uppercase tracking-wider text-slate-400">Your Answer</p>
                          <p className={`text-xs font-bold mt-1 ${isCorrect ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>{uAns}</p>
                        </div>
                        <div>
                          <p className="text-[9px] font-black uppercase tracking-wider text-slate-400">Correct Answer Reference</p>
                          <p className="text-xs font-bold text-slate-700 dark:text-slate-300 mt-1">{q.correctAnswer}</p>
                        </div>
                      </div>

                      {/* Explanations */}
                      <div className="text-xs leading-relaxed text-slate-500 dark:text-slate-400 font-medium">
                        <strong className="text-slate-700 dark:text-slate-300 font-bold block mb-1">AI Explanation:</strong>
                        {q.explanation}
                      </div>

                    </div>
                  </GlassCard>
                );
              })}
            </div>
          </div>

        </motion.div>
      )}

    </div>
  );
}
