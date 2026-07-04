import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';

// Load environment variables before any route modules import the Gemini client.
dotenv.config();

async function startServer() {
  const [{ authRouter }, { documentsRouter }, { analysisRouter }, { notesRouter }, { quizRouter }, { performanceRouter }, { chatRouter }] = await Promise.all([
    import('./server/routes/auth.js'),
    import('./server/routes/documents.js'),
    import('./server/routes/analysis.js'),
    import('./server/routes/notes.js'),
    import('./server/routes/quiz.js'),
    import('./server/routes/performance.js'),
    import('./server/routes/chat.js'),
  ]);

  const app = express();
  const PORT = 3000;

  // Middlewares
  app.use(express.json({ limit: '15mb' }));
  app.use(express.urlencoded({ extended: true, limit: '15mb' }));

  // Debug logger for server APIs
  app.use((req, _res, next) => {
    if (req.path.startsWith('/api')) {
      console.log(`[API ${req.method}] ${req.path}`);
    }
    next();
  });

  // Health check
  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', time: new Date().toISOString() });
  });

  // Mount API Routers
  app.use('/api/auth', authRouter);
  app.use('/api/documents', documentsRouter);
  app.use('/api/analysis', analysisRouter);
  app.use('/api/notes', notesRouter);
  app.use('/api/quizzes', quizRouter);
  app.use('/api/performance', performanceRouter);
  app.use('/api/chat', chatRouter);

  // Serve static assets & frontend SPA
  if (process.env.NODE_ENV !== 'production') {
    console.log('Running server in DEVELOPMENT mode with Vite Middleware...');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    console.log('Running server in PRODUCTION mode with static files...');
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`StudyAI server listening on port ${PORT}`);
    console.log(`Server environment: ${process.env.NODE_ENV || 'development'}`);
  });
}

startServer().catch((error) => {
  console.error('Fatal error starting StudyAI server:', error);
  process.exit(1);
});
