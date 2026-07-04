import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, Legend 
} from 'recharts';
import { 
  Award, TrendingUp, Sparkles, BookOpen, AlertTriangle, 
  Download, Clock, Calendar, CheckSquare, ChevronRight, BarChart2,
  CheckCircle2, XCircle
} from 'lucide-react';
import { api, downloadFile } from '../lib/api.js';
import { PerformanceAnalysis, PersonalizedRecommendations, DashboardStats } from '../types.js';
import { GlassCard } from './GlassCard.js';

interface ProgressViewProps {
  onBack: () => void;
  attemptsCount: number;
}

export function ProgressView({ onBack, attemptsCount }: ProgressViewProps) {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [analysis, setAnalysis] = useState<PerformanceAnalysis | null>(null);
  const [recommendations, setRecommendations] = useState<PersonalizedRecommendations | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchStatsAndReport();
  }, [attemptsCount]);

  const fetchStatsAndReport = async () => {
    setLoading(true);
    setError('');
    try {
      const statsData = await api.performance.getStats();
      const reportData = await api.performance.getReport();
      
      setStats(statsData);
      setAnalysis(reportData.analysis);
      setRecommendations(reportData.recommendations);
    } catch (err: any) {
      setError(err.message || 'Failed to sync performance reports from AI engine.');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadReport = () => {
    if (!analysis || !recommendations) return;
    
    const reportContent = `
      <h1>AI Mastery & Performance Report</h1>
      <p class="meta">Synthesized by StudyAI Learning Engine on ${new Date().toLocaleDateString()}</p>
      
      <div class="card">
        <h2>Executive Performance Metrics</h2>
        <strong>Overall Accuracy:</strong> ${analysis.overallAccuracy}%<br/>
        <strong>Average Student Confidence:</strong> ${analysis.averageConfidence.toUpperCase()}<br/>
        <strong>Learning Velocity / Progress:</strong> +${analysis.learningProgress}% mastery increase<br/>
        <strong>Estimated Daily Study Time:</strong> ${recommendations.estimatedStudyTimeMinutes} minutes
      </div>
      
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
        <div class="card">
          <h3>Your Strongest Subject Areas</h3>
          <ul>
            ${analysis.strongTopics.map(t => `<li>${t}</li>`).join('')}
          </ul>
        </div>
        <div class="card">
          <h3>Weaknesses & Subjects Needing Practice</h3>
          <ul>
            ${analysis.weakTopics.map(t => `<li>${t}</li>`).join('')}
          </ul>
        </div>
      </div>
      
      <h2>Custom Daily study & Revision Plan</h2>
      <div class="card">
        <h3>Revision Roadmaps</h3>
        <ul>
          ${recommendations.topicsToRevise.map(t => `<li>Revise: ${t}</li>`).join('')}
        </ul>
        
        <h3>Actionable Daily Steps</h3>
        <ol>
          ${recommendations.dailyStudyPlan.map(s => `<li>${s}</li>`).join('')}
        </ol>
      </div>
      
      <h2>Recent Corrective Mistakes Analysis</h2>
      <div>
        ${analysis.mistakes.map((m, i) => `
          <div class="card">
            <strong>Mistake #${i + 1}: ${m.question}</strong><br/>
            <strong>Your response:</strong> <span style="color: #be123c">${m.userAnswer}</span><br/>
            <strong>Expected answer:</strong> <span style="color: #047857">${m.correctAnswer}</span><br/>
            <p><em>Correction notes:</em> ${m.explanation}</p>
          </div>
        `).join('')}
      </div>
    `;
    
    downloadFile('StudyAI_AI_Performance_Report', reportContent, 'html');
  };

  return (
    <div id="progress-view-portal" className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 select-none">
      
      {/* Head section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 text-left">
        <div className="space-y-1">
          <h2 className="text-3xl font-black text-slate-950 dark:text-white flex items-center gap-2.5 tracking-tight">
            <BarChart2 className="h-7 w-7 text-indigo-500" />
            Performance & Analytics
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider">
            AI Mastery Diagnostics & Personal Study Planners
          </p>
        </div>

        <div className="flex items-center gap-2">
          {!loading && !error && (
            <button
              id="progress-download-pdf-btn"
              onClick={handleDownloadReport}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-600/15 cursor-pointer transition-colors"
            >
              <Download className="h-4 w-4" />
              Download Mastery Report
            </button>
          )}

          <button
            id="progress-back-btn"
            onClick={onBack}
            className="px-4 py-2 border border-slate-200 dark:border-white/5 text-slate-600 hover:bg-slate-50 dark:hover:bg-[#0f0f12] rounded-xl text-xs font-bold cursor-pointer transition-colors"
          >
            Dashboard
          </button>
        </div>
      </div>

      {loading ? (
        <div className="py-24 text-center space-y-4">
          <div className="h-12 w-12 border-4 border-indigo-500/20 border-t-indigo-600 rounded-full animate-spin mx-auto" />
          <h3 className="text-lg font-bold text-slate-800 dark:text-white">AI is aggregating logs & synthesizing study plans...</h3>
        </div>
      ) : error ? (
        <div className="p-8 border border-slate-200 dark:border-white/5 rounded-2xl bg-white/20 dark:bg-slate-950/20 text-center">
          <AlertTriangle className="mx-auto h-10 w-10 text-rose-500 mb-3" />
          <p className="text-sm font-bold text-slate-700 dark:text-slate-300">Analytics Load Failed</p>
          <p className="text-xs text-slate-500 mt-1">{error}</p>
        </div>
      ) : stats && analysis && recommendations && (
        <div className="space-y-8">
          
          {/* Charts section: Weekly + Monthly (side by side on wide screen) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 text-left">
            
            {/* Chart 1: Weekly Progress */}
            <GlassCard hoverEffect={false}>
              <div className="p-5 md:p-6 space-y-4">
                <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                  <Calendar className="h-4.5 w-4.5 text-indigo-500" />
                  Weekly Progress Overview
                </h3>
                
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={stats.weeklyProgress}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#cbd5e1" opacity={0.2} />
                      <XAxis dataKey="day" stroke="#94a3b8" fontSize={10} fontWeight="bold" />
                      <YAxis stroke="#94a3b8" fontSize={10} fontWeight="bold" />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: '#0f172a', 
                          border: 'none', 
                          borderRadius: '12px',
                          color: '#fff',
                          fontSize: '11px',
                          fontWeight: 'bold'
                        }} 
                      />
                      <Legend verticalAlign="top" height={36} iconType="circle" />
                      <Bar name="Quiz Accuracy %" dataKey="score" fill="#6366f1" radius={[4, 4, 0, 0]} />
                      <Bar name="Documents Uploaded" dataKey="documents" fill="#34d399" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </GlassCard>

            {/* Chart 2: Monthly Progress */}
            <GlassCard hoverEffect={false}>
              <div className="p-5 md:p-6 space-y-4">
                <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                  <TrendingUp className="h-4.5 w-4.5 text-emerald-500 animate-pulse" />
                  Monthly Mastery Velocity
                </h3>

                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={stats.monthlyProgress}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#cbd5e1" opacity={0.2} />
                      <XAxis dataKey="month" stroke="#94a3b8" fontSize={10} fontWeight="bold" />
                      <YAxis stroke="#94a3b8" fontSize={10} fontWeight="bold" />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: '#0f172a', 
                          border: 'none', 
                          borderRadius: '12px',
                          color: '#fff',
                          fontSize: '11px',
                          fontWeight: 'bold'
                        }} 
                      />
                      <Legend verticalAlign="top" height={36} iconType="circle" />
                      <Line name="Avg Quiz Score" type="monotone" dataKey="score" stroke="#8b5cf6" strokeWidth={3} dot={{ r: 4 }} />
                      <Line name="Quizzes Count" type="monotone" dataKey="quizzes" stroke="#f59e0b" strokeWidth={3} dot={{ r: 4 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </GlassCard>

          </div>

          {/* AI Diagnostic Metrics Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
            
            <GlassCard hoverEffect={false}>
              <div className="p-5 flex items-center gap-4">
                <div className="p-3 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-xl">
                  <Award className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 uppercase font-black tracking-wider">Overall Accuracy</p>
                  <p className="text-2xl font-black text-slate-900 dark:text-white mt-0.5">{analysis.overallAccuracy}%</p>
                </div>
              </div>
            </GlassCard>

            <GlassCard hoverEffect={false}>
              <div className="p-5 flex items-center gap-4">
                <div className="p-3 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-xl">
                  <TrendingUp className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 uppercase font-black tracking-wider">Learning Velocity</p>
                  <p className="text-2xl font-black text-slate-900 dark:text-white mt-0.5">+{analysis.learningProgress}% mastery</p>
                </div>
              </div>
            </GlassCard>

            <GlassCard hoverEffect={false}>
              <div className="p-5 flex items-center gap-4">
                <div className="p-3 bg-purple-500/10 text-purple-600 dark:text-purple-400 rounded-xl">
                  <Clock className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 uppercase font-black tracking-wider">Est Study Goal</p>
                  <p className="text-2xl font-black text-slate-900 dark:text-white mt-0.5">{recommendations.estimatedStudyTimeMinutes}m / daily</p>
                </div>
              </div>
            </GlassCard>

          </div>

          {/* Strong / Weak / Recommendations Split */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 text-left">
            
            {/* Left side: Strong, Weak & Action recommendations */}
            <div className="lg:col-span-8 space-y-6">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Strong topics */}
                <GlassCard hoverEffect={false}>
                  <div className="p-5 space-y-3.5">
                    <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                      <CheckCircle2 className="h-4.5 w-4.5 text-emerald-500" />
                      My Strongest Concepts
                    </h4>
                    
                    <div className="space-y-2">
                      {analysis.strongTopics.map((topic, i) => (
                        <div key={i} className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0" />
                          <span>{topic}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </GlassCard>

                {/* Weak topics */}
                <GlassCard hoverEffect={false}>
                  <div className="p-5 space-y-3.5">
                    <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                      <AlertTriangle className="h-4.5 w-4.5 text-amber-500" />
                      Needing Practice / Focus
                    </h4>

                    <div className="space-y-2">
                      {analysis.weakTopics.map((topic, i) => (
                        <div key={i} className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300">
                          <span className="h-1.5 w-1.5 rounded-full bg-amber-500 shrink-0" />
                          <span>{topic}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </GlassCard>

              </div>

              {/* Mistakes review logger */}
              {analysis.mistakes.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-sm font-black uppercase tracking-wider text-slate-400 px-1">
                    AI Mistake Analyzer & Corrections
                  </h3>

                  <div className="space-y-4">
                    {analysis.mistakes.slice(0, 3).map((m, idx) => (
                      <GlassCard key={idx} animate={false} className="border-l-4 border-l-rose-500">
                        <div className="p-5 space-y-3">
                          <h5 className="text-xs font-extrabold text-slate-900 dark:text-white">Q: {m.question}</h5>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-3 bg-slate-50 dark:bg-[#0f0f12] rounded-xl border border-slate-200/40 dark:border-white/5">
                            <div>
                              <p className="text-[9px] font-black uppercase text-slate-400">Your answer</p>
                              <p className="text-xs font-bold text-rose-600 dark:text-rose-400 mt-1">{m.userAnswer}</p>
                            </div>
                            <div>
                              <p className="text-[9px] font-black uppercase text-slate-400">Expected answer</p>
                              <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400 mt-1">{m.correctAnswer}</p>
                            </div>
                          </div>

                          <p className="text-xs font-medium text-slate-500 dark:text-slate-400 leading-relaxed whitespace-pre-line">
                            <strong className="text-slate-700 dark:text-slate-300 block mb-0.5">Correction Note:</strong>
                            {m.explanation}
                          </p>
                        </div>
                      </GlassCard>
                    ))}
                  </div>
                </div>
              )}

            </div>

            {/* Right side: Study Recommendations Checklist */}
            <div className="lg:col-span-4 space-y-6">
              
              {/* Daily study checklist */}
              <GlassCard hoverEffect={false}>
                <div className="p-5 space-y-4">
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5 border-b border-slate-100 dark:border-white/5 pb-2.5">
                    <CheckSquare className="h-4.5 w-4.5 text-indigo-500" />
                    Daily study checklist
                  </h4>

                  <div className="space-y-3">
                    {recommendations.dailyStudyPlan.map((step, i) => (
                      <div key={i} className="flex gap-3">
                        <div className="h-5 w-5 rounded border border-indigo-200 dark:border-indigo-500/10 bg-indigo-500/5 flex items-center justify-center text-[10px] font-black text-indigo-500 shrink-0 mt-0.5">
                          {i + 1}
                        </div>
                        <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 leading-relaxed">{step}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </GlassCard>

              {/* Revision list */}
              <GlassCard hoverEffect={false}>
                <div className="p-5 space-y-4">
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5 border-b border-slate-100 dark:border-white/5 pb-2.5">
                    <Sparkles className="h-4.5 w-4.5 text-purple-500 animate-pulse" />
                    Revision Roadmaps
                  </h4>

                  <div className="space-y-2">
                    {recommendations.topicsToRevise.map((topic, i) => (
                      <div key={i} className="flex items-start gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300 leading-relaxed">
                        <ChevronRight className="h-4.5 w-4.5 text-indigo-500 shrink-0 mt-0.5" />
                        <span>Revise: {topic}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </GlassCard>

              {/* Next Steps */}
              <GlassCard hoverEffect={false} className="border-emerald-500/20 bg-emerald-500/5">
                <div className="p-5 space-y-4">
                  <h4 className="text-xs font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 border-b border-emerald-500/10 pb-2.5">
                    <TrendingUp className="h-4.5 w-4.5" />
                    Next Learning Steps
                  </h4>

                  <div className="space-y-2">
                    {recommendations.nextLearningSteps.map((step, i) => (
                      <div key={i} className="flex items-start gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300 leading-relaxed">
                        <CheckCircle2 className="h-4.5 w-4.5 text-emerald-500 shrink-0 mt-0.5" />
                        <span>{step}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </GlassCard>

            </div>

          </div>

        </div>
      )}

    </div>
  );
}
