import { Question, Submission, FileSubmission, SupportConfig, CloudState } from '../types';

const LOCAL_API = 'http://127.0.0.1:8000/api';
const GLOBAL_STORE_URL = 'https://jsonblob.com/api/jsonBlob';

export const DatabaseService = {
  _cache: {
    questions: [] as Question[],
    submissions: [] as Submission[],
    files: [] as FileSubmission[],
    config: { meetLink: 'https://meet.google.com/new' } as SupportConfig
  },
  _mode: 'local' as 'local' | 'cloud',
  _blobId: null as string | null,

  async sync(classroomId: string = 'DEMO-ROOM'): Promise<boolean> {
    try {
      const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

      // 1. Try Local Server ONLY if on localhost
      if (isLocal) {
        const localResp = await fetch(`${LOCAL_API}/state`, { 
          signal: AbortSignal.timeout(800) 
        }).catch(() => null);

        if (localResp && localResp.ok) {
          const data = await localResp.json();
          this._cache.questions = data.questions || [];
          this._cache.submissions = data.submissions || [];
          this._cache.files = data.files || [];
          this._mode = 'local';
          return true;
        }
      }

      // 2. Global Cloud Mode for everyone else (and fallback for local)
      this._mode = 'cloud';
      const storageKey = `aptimaster_blob_${classroomId.toUpperCase()}`;
      let blobId = localStorage.getItem(storageKey);
      
      // Fallback: If no blobId in local storage, we try to see if there's a default for this room
      // In a production app, you'd use a real backend for this mapping.
      if (blobId) {
        const cloudResp = await fetch(`${GLOBAL_STORE_URL}/${blobId}`);
        if (cloudResp.ok) {
          const data: CloudState = await cloudResp.json();
          this._cache.questions = data.questions || [];
          this._cache.submissions = data.submissions || [];
          this._cache.files = data.files || [];
          this._blobId = blobId;
          return true;
        }
      }
      
      return false;
    } catch (e) {
      console.warn("Sync mode switching to cloud...");
      this._mode = 'cloud';
      return false;
    }
  },

  getMode() { return this._mode; },

  async _updateCloud(classroomId: string) {
    const payload = {
      questions: this._cache.questions,
      submissions: this._cache.submissions,
      files: this._cache.files,
      lastUpdated: new Date().toISOString()
    };

    const storageKey = `aptimaster_blob_${classroomId.toUpperCase()}`;

    if (this._blobId) {
      await fetch(`${GLOBAL_STORE_URL}/${this._blobId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
    } else {
      const resp = await fetch(GLOBAL_STORE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const location = resp.headers.get('Location');
      if (location) {
        const id = location.split('/').pop();
        if (id) {
          this._blobId = id;
          localStorage.setItem(storageKey, id);
        }
      }
    }
  },

  getQuestions(): Question[] { return this._cache.questions; },

  async addQuestion(q: Question, classroomId: string) {
    if (this._mode === 'local') {
      await fetch(`${LOCAL_API}/questions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(q)
      });
    } else {
      this._cache.questions.push(q);
      await this._updateCloud(classroomId);
    }
    await this.sync(classroomId);
  },

  async deleteQuestion(id: string, classroomId: string) {
    if (this._mode === 'local') {
      await fetch(`${LOCAL_API}/questions/${id}`, { method: 'DELETE' });
    } else {
      this._cache.questions = this._cache.questions.filter(q => q.id !== id);
      await this._updateCloud(classroomId);
    }
    await this.sync(classroomId);
  },

  getSubmissions(): Submission[] { return this._cache.submissions; },

  async addSubmission(sub: Submission, classroomId: string) {
    if (this._mode === 'local') {
      await fetch(`${LOCAL_API}/submissions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sub)
      });
    } else {
      this._cache.submissions.unshift(sub);
      await this._updateCloud(classroomId);
    }
    await this.sync(classroomId);
  },

  getFiles(): FileSubmission[] { return this._cache.files; },

  async addFile(file: FileSubmission, classroomId: string) {
    if (this._mode === 'local') {
      await fetch(`${LOCAL_API}/files`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(file)
      });
    } else {
      this._cache.files.unshift(file);
      await this._updateCloud(classroomId);
    }
    await this.sync(classroomId);
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