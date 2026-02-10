
export enum UserRole {
  ADMIN = 'ADMIN',
  STUDENT = 'STUDENT'
}

export interface Question {
  id: string;
  text: string;
  category: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
  difficulty: 'Easy' | 'Hard' | 'Difficult';
  timeLimitMinutes: number;
}

export interface Submission {
  id: string;
  studentId: string;
  studentName: string;
  questionId: string;
  answer: number;
  isCorrect: boolean;
  timestamp: Date | string;
  noteId: string;
}

export interface FileSubmission {
  id: string;
  studentId: string;
  studentName: string;
  fileName: string;
  fileType: string;
  fileData: string; // Base64
  timestamp: Date | string;
}

export interface User {
  id: string;
  name: string;
  role: UserRole;
  email: string;
  classroomId: string;
}

export interface ActiveCall {
  id: string;
  studentId: string;
  studentName: string;
  startTime: Date | string;
  status: 'waiting' | 'active';
  initiator: 'student' | 'admin';
}

export interface SupportConfig {
  meetLink: string;
}

export interface CloudState {
  questions: Question[];
  submissions: Submission[];
  files: FileSubmission[];
  config: SupportConfig;
  lastUpdated: string;
}
