import { Question, Submission, FileSubmission, SupportConfig } from '../types';

// Use 127.0.0.1 instead of localhost for more consistent cross-browser performance
const API_BASE = 'http://127.0.0.1:8000/api';

export const DatabaseService = {
  _cache: {
    questions: [] as Question[],
    submissions: [] as Submission[],
    files: [] as FileSubmission[],
    config: { meetLink: 'https://meet.google.com/new' } as SupportConfig
  },

  async sync(): Promise<boolean> {
    try {
      const controller = new AbortController();
      // Shorter timeout for faster UI feedback when server is down
      const timeoutId = setTimeout(() => controller.abort(), 3000);

      const response = await fetch(`${API_BASE}/state`, { 
        signal: controller.signal,
        headers: {
          'Accept': 'application/json',
          'Cache-Control': 'no-cache'
        }
      });
      clearTimeout(timeoutId);

      if (!response.ok) {
        console.warn(`Sync Warning: Backend returned ${response.status}`);
        return false;
      }
      
      const data = await response.json();
      this._cache.questions = data.questions || [];
      this._cache.submissions = data.submissions || [];
      this._cache.files = data.files || [];
      return true;
    } catch (e: any) {
      if (e.name === 'AbortError') {
        console.debug("Backend sync timed out - Check if 'npm run server' is active.");
      } else {
        console.debug(`Backend at ${API_BASE} unreachable. Start it with 'npm run server'.`);
      }
      return false;
    }
  },

  getQuestions(): Question[] {
    return this._cache.questions;
  },

  async addQuestion(q: Question) {
    try {
      await fetch(`${API_BASE}/questions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(q)
      });
      await this.sync();
    } catch (e) {
      console.error("Failed to post question. Is the server running?", e);
    }
  },

  async deleteQuestion(id: string) {
    try {
      await fetch(`${API_BASE}/questions/${id}`, {
        method: 'DELETE'
      });
      await this.sync();
    } catch (e) {
      console.error("Failed to delete question.", e);
    }
  },

  getSubmissions(): Submission[] {
    return this._cache.submissions;
  },

  async addSubmission(sub: Submission) {
    try {
      await fetch(`${API_BASE}/submissions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sub)
      });
      await this.sync();
    } catch (e) {
      console.error("Failed to add submission.", e);
    }
  },

  getFiles(): FileSubmission[] {
    return this._cache.files;
  },

  async addFile(file: FileSubmission) {
    try {
      await fetch(`${API_BASE}/files`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(file)
      });
      await this.sync();
    } catch (e) {
      console.error("File sync error", e);
    }
  },

  getConfig(): SupportConfig {
    const data = localStorage.getItem('aptimaster_config');
    return data ? JSON.parse(data) : this._cache.config;
  },

  saveConfig(config: SupportConfig) {
    localStorage.setItem('aptimaster_config', JSON.stringify(config));
  },

  resetDatabase: () => {
    localStorage.clear();
    window.location.reload();
  }
};