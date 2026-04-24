import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

// Load .env from project root when running locally (not in Docker).
// In Docker, env vars are set by compose/entrypoint.
const envPath = path.resolve(__dirname, '../../.env');
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
}

import express from 'express';
import cors from 'cors';
import pinoHttp from 'pino-http';
import session from 'express-session';
import connectPgSimple from 'connect-pg-simple';
import { Pool } from 'pg';
import { healthRouter } from './routes/health';
import { counterRouter } from './routes/counter';
import { authRouter } from './routes/auth';
import { instructorRouter } from './routes/instructor';
import { reviewsRouter } from './routes/reviews';
import { templatesRouter } from './routes/templates';
import { checkinsRouter } from './routes/checkins';
import { adminRouter } from './routes/admin';
import { volunteerHoursRouter } from './routes/volunteer-hours';
import { feedbackRouter } from './routes/feedback';
import { errorHandler } from './middleware/errorHandler';
import { startScheduler } from './services/scheduler';
import { slackRouter } from './routes/slack';

const app = express();
const port = parseInt(process.env.PORT || '3000', 10);

app.use(cors());

// Slack slash-command route must be mounted before express.json() so it can
// capture the raw body for signature verification (Slack signs the raw bytes).
app.use('/api', slackRouter);

app.use(express.json());
app.use(pinoHttp({ level: process.env.LOG_LEVEL || 'info' }));

// Session middleware — use PG store when DATABASE_URL is set and not in test mode
const sessionStore =
  process.env.DATABASE_URL && process.env.NODE_ENV !== 'test'
    ? (() => {
        const PgSession = connectPgSimple(session);
        const pgPool = new Pool({ connectionString: process.env.DATABASE_URL });
        return new PgSession({ pool: pgPool, tableName: 'sessions', createTableIfMissing: false });
      })()
    : undefined; // express-session defaults to MemoryStore

app.use(
  session({
    store: sessionStore,
    secret: process.env.SESSION_SECRET || 'dev-secret-change-me',
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    },
  }),
);

app.use('/api', healthRouter);
app.use('/api', counterRouter);
app.use('/api/auth', authRouter);
app.use('/api', instructorRouter);
app.use('/api', reviewsRouter);
app.use('/api', templatesRouter);
app.use('/api', checkinsRouter);
app.use('/api', adminRouter);
app.use('/api', volunteerHoursRouter);
app.use('/api', feedbackRouter);

app.use(errorHandler);

// In production, serve the built React app from /app/public.
// All non-API routes fall through to index.html for SPA routing.
if (process.env.NODE_ENV === 'production') {
  const publicDir = path.resolve(__dirname, '../public');
  app.use(express.static(publicDir));
  app.get('*', (_req, res) => {
    res.sendFile(path.join(publicDir, 'index.html'));
  });
}

// Only start listening when run directly (not imported by tests)
if (require.main === module) {
  app.listen(port, '0.0.0.0', () => {
    console.log(`Server listening on http://localhost:${port}`);
  });
  startScheduler();
}

export default app;
