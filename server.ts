import express from 'express';
import cors from 'cors';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 8000;
// Use any cast to satisfy compiler that doesn't recognize cwd() on Process type
const DB_FILE = path.join((process as any).cwd(), 'database.json');

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '50mb' }));

interface DBState {
  questions: any[];
  submissions: any[];
  files: any[];
}

const getInitialState = (): DBState => ({
  questions: [],
  submissions: [],
  files: []
});

async function loadDB(): Promise<DBState> {
  try {
    const data = await fs.readFile(DB_FILE, 'utf-8');
    if (!data.trim()) return getInitialState();
    return JSON.parse(data);
  } catch (error) {
    return getInitialState();
  }
}

async function saveDB(state: DBState) {
  try {
    await fs.writeFile(DB_FILE, JSON.stringify(state, null, 2));
  } catch (error) {
    console.error('Error saving database:', error);
  }
}

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/api/state', async (req, res) => {
  const db = await loadDB();
  res.json(db);
});

app.post('/api/questions', async (req, res) => {
  const q = req.body;
  const db = await loadDB();
  db.questions.push(q);
  await saveDB(db);
  res.json({ status: 'ok' });
});

app.delete('/api/questions/:id', async (req, res) => {
  const { id } = req.params;
  const db = await loadDB();
  db.questions = db.questions.filter((q: any) => q.id !== id);
  db.submissions = db.submissions.filter((s: any) => s.questionId !== id);
  await saveDB(db);
  res.json({ status: 'ok' });
});

app.post('/api/submissions', async (req, res) => {
  const s = req.body;
  const db = await loadDB();
  db.submissions.unshift(s);
  await saveDB(db);
  res.json({ status: 'ok' });
});

app.post('/api/files', async (req, res) => {
  const f = req.body;
  const db = await loadDB();
  db.files.unshift(f);
  await saveDB(db);
  res.json({ status: 'ok' });
});

const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`
  🚀 AptiMaster Backend Ready
  ---------------------------
  Local:            http://localhost:${PORT}
  Network (IPv4):   http://127.0.0.1:${PORT}
  Health Check:     http://127.0.0.1:${PORT}/api/health
  ---------------------------
  `);
});

server.on('error', (e: any) => {
  if (e.code === 'EADDRINUSE') {
    console.error(`
    ❌ PORT CONFLICT: Port ${PORT} is still in use.
    ---------------------------------------------
    The 'npm run server' command tried to clear this, 
    but it seems a process is still hanging.
    
    MANUAL FIX:
    Windows: taskkill /F /IM node.exe
    Mac/Linux: kill -9 $(lsof -t -i:${PORT})
    
    Then run: npm run server
    ---------------------------------------------
    `);
    // Use any cast to satisfy compiler that doesn't recognize exit() on Process type
    (process as any).exit(1);
  } else {
    console.error('Unexpected server error:', e);
  }
});