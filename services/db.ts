import { Question, Submission, FileSubmission, SupportConfig, CloudState } from '../types';

const LOCAL_API = 'http://127.0.0.1:8000/api';
// Using a public JSON storage service for "Global Mode"
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

  /**
   * Syncs data from either the local server or the public cloud storage
   */
  async sync(classroomId: string = 'DEMO-ROOM'): Promise<boolean> {
    try {
      // 1. Try Local Server First (for development)
      const localResp = await fetch(`${LOCAL_API}/state`, { 
        signal: AbortSignal.timeout(1000) 
      }).catch(() => null);

      if (localResp && localResp.ok) {
        const data = await localResp.json();
        this._cache.questions = data.questions || [];
        this._cache.submissions = data.submissions || [];
        this._cache.files = data.files || [];
        this._mode = 'local';
        return true;
      }

      // 2. Fallback to Global Cloud Mode using Classroom ID as a key
      this._mode = 'cloud';
      const storedBlobId = localStorage.getItem(`aptimaster_blob_${classroomId}`);
      
      if (storedBlobId) {
        const cloudResp = await fetch(`${GLOBAL_STORE_URL}/${storedBlobId}`);
        if (cloudResp.ok) {
          const data: CloudState = await cloudResp.json();
          this._cache.questions = data.questions || [];
          this._cache.submissions = data.submissions || [];
          this._cache.files = data.files || [];
          this._blobId = storedBlobId;
          return true;
        }
      }
      
      // If no cloud data exists yet, initialize it
      return false;
    } catch (e) {
      console.error("Sync Critical Error:", e);
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
          localStorage.setItem(`aptimaster_blob_${classroomId}`, id);
          // In a real app, you'd store this ID in a registry service.
          // For this version, we use the classroomId to derive a consistent hash if possible,
          // but for now, we rely on the user having the Blob ID in localstorage or hardcoded.
        }
      }
    }
  },

  getQuestions(): Question[] {
    return this._cache.questions;
  },

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

  getSubmissions(): Submission[] {
    return this._cache.submissions;
  },

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

  getFiles(): FileSubmission[] {
    return this._cache.files;
  },

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