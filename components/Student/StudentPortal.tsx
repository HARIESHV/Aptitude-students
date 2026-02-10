
import React, { useState, useRef } from 'react';
import { Question, User, Submission, ActiveCall, SupportConfig, FileSubmission } from '../../types';
import QuestionCard from './QuestionCard';
import LiveSession from './LiveSession';

interface StudentPortalProps {
  questions: Question[];
  user: User;
  onInitiateCall: () => string;
  onEndCall: (id: string) => void;
  onJoinCall: (id: string) => void;
  activeCalls: ActiveCall[];
  studentSubmissions: Submission[];
  onAddSubmission: (sub: Submission) => void;
  onAddFileSubmission: (file: FileSubmission) => void;
  supportConfig: SupportConfig;
}

const StudentPortal: React.FC<StudentPortalProps> = ({ 
  questions, 
  user, 
  onInitiateCall, 
  onEndCall,
  onJoinCall,
  activeCalls,
  studentSubmissions,
  onAddSubmission,
  onAddFileSubmission,
  supportConfig
}) => {
  const [activeMeetingId, setActiveMeetingId] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [activeView, setActiveView] = useState<'challenges' | 'history'>('challenges');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAnswer = (qId: string, answerIdx: number, isCorrect: boolean) => {
    const noteId = `NOTE-${Math.floor(100000 + Math.random() * 900000)}`;
    const newSubmission: Submission = {
      id: Math.random().toString(36).substr(2, 9),
      studentId: user.id,
      studentName: user.name,
      questionId: qId,
      answer: answerIdx,
      isCorrect,
      timestamp: new Date(),
      noteId: noteId
    };
    onAddSubmission(newSubmission);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedTypes = [
      'application/pdf', 
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'image/jpeg',
      'image/png'
    ];

    if (!allowedTypes.includes(file.type)) {
      alert("Format Rejected: Please upload PDF, DOCX, or Images.");
      return;
    }

    setIsUploading(true);
    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      const newFile: FileSubmission = {
        id: Math.random().toString(36).substr(2, 9),
        studentId: user.id,
        studentName: user.name,
        fileName: file.name,
        fileType: file.type,
        fileData: base64,
        timestamp: new Date()
      };
      onAddFileSubmission(newFile);
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    };
    reader.readAsDataURL(file);
  };

  const triggerCall = () => {
    const id = onInitiateCall();
    setActiveMeetingId(id);
  };

  return (
    <div className="space-y-6 sm:space-y-10 pb-32 animate-in fade-in duration-700 px-1 sm:px-0">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 sm:gap-6">
        <div>
          <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">Workspace</h1>
          <p className="text-sm sm:text-base text-slate-500 font-medium">Channel: <span className="text-indigo-600 font-bold">{user.classroomId}</span></p>
        </div>
        
        <div className="flex bg-slate-100 p-1 rounded-xl sm:rounded-2xl w-full sm:w-auto">
          <button 
            onClick={() => setActiveView('challenges')}
            className={`flex-1 sm:flex-none px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg sm:rounded-xl text-[10px] sm:text-xs font-black transition-all ${activeView === 'challenges' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            Challenges
          </button>
          <button 
            onClick={() => setActiveView('history')}
            className={`flex-1 sm:flex-none px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg sm:rounded-xl text-[10px] sm:text-xs font-black transition-all ${activeView === 'history' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            History
          </button>
        </div>
      </div>

      {activeView === 'challenges' ? (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 sm:gap-8">
          {questions.map(q => (
            <QuestionCard 
              key={q.id} 
              question={q} 
              onAnswer={handleAnswer} 
              submission={studentSubmissions.find(s => s.questionId === q.id)}
            />
          ))}
          {questions.length === 0 && (
            <div className="col-span-full py-20 sm:py-32 text-center bg-white border-2 border-dashed border-slate-200 rounded-[2rem] sm:rounded-[3rem]">
              <p className="text-slate-400 font-black uppercase tracking-widest text-[10px] sm:text-xs">No active challenges</p>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white border-2 border-slate-50 rounded-[1.5rem] sm:rounded-[3rem] overflow-hidden shadow-2xl">
           <div className="overflow-x-auto">
             <table className="w-full text-left min-w-[500px]">
               <thead className="bg-slate-50 text-slate-400 uppercase text-[9px] sm:text-[10px] font-black tracking-widest border-b border-slate-100">
                 <tr>
                   <th className="px-6 sm:px-10 py-6 sm:py-8">Challenge ID</th>
                   <th className="px-6 sm:px-10 py-6 sm:py-8">Result</th>
                   <th className="px-6 sm:px-10 py-6 sm:py-8 text-right">Note ID</th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-slate-100">
                 {studentSubmissions.length === 0 ? (
                   <tr><td colSpan={3} className="p-16 sm:p-20 text-center text-slate-300 font-black uppercase tracking-widest text-xs">No records found</td></tr>
                 ) : (
                   studentSubmissions.map(s => (
                     <tr key={s.id} className="hover:bg-slate-50/50 transition-all">
                       <td className="px-6 sm:px-10 py-6 sm:py-8 font-black text-slate-800 uppercase tracking-tighter text-sm">TASK-{s.questionId.slice(0, 5)}</td>
                       <td className="px-6 sm:px-10 py-6 sm:py-8">
                          <span className={`px-3 py-1 rounded-full text-[9px] sm:text-[10px] font-black uppercase tracking-widest ${s.isCorrect ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                            {s.isCorrect ? 'Passed' : 'Failed'}
                          </span>
                       </td>
                       <td className="px-6 sm:px-10 py-6 sm:py-8 text-right font-mono text-[10px] sm:text-xs font-bold text-slate-400">{s.noteId}</td>
                     </tr>
                   ))
                 )}
               </tbody>
             </table>
           </div>
        </div>
      )}

      {/* Persistent Floating Controls - Optimized for Mobile */}
      <div className="fixed bottom-6 right-6 sm:bottom-10 sm:right-10 flex flex-col items-end gap-3 sm:gap-4 z-[100]">
        <input 
          type="file" 
          ref={fileInputRef} 
          className="hidden" 
          onChange={handleFileUpload}
          accept=".pdf,.docx,image/*"
        />
        <button 
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className="bg-white text-slate-900 border-2 border-slate-100 h-12 sm:h-16 px-6 sm:px-8 rounded-xl sm:rounded-2xl font-black text-[9px] sm:text-xs uppercase tracking-widest shadow-2xl hover:border-indigo-400 transition-all flex items-center gap-2 sm:gap-3 active:scale-95"
        >
          {isUploading ? <div className="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div> : <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0l-4 4m4-4v12" /></svg>}
          <span className="hidden sm:inline">Upload Evidence</span>
          <span className="sm:hidden">Upload</span>
        </button>
        <button 
          onClick={triggerCall}
          className="bg-indigo-600 text-white h-16 sm:h-20 px-8 sm:px-10 rounded-[1.5rem] sm:rounded-[2rem] font-black text-[9px] sm:text-xs uppercase tracking-[0.2em] shadow-[0_20px_50px_rgba(79,70,229,0.3)] hover:bg-indigo-700 transition-all flex items-center gap-3 sm:gap-4 active:scale-95 group"
        >
          <div className="w-6 h-6 sm:w-8 sm:h-8 bg-white/20 rounded-lg flex items-center justify-center group-hover:rotate-12 transition-transform">
            <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
          </div>
          <span className="hidden sm:inline">Initiate Support Bridge</span>
          <span className="sm:hidden">Live Help</span>
        </button>
      </div>

      {activeMeetingId && (
        <div className="fixed inset-0 z-[200] bg-slate-950 flex items-center justify-center">
          <LiveSession 
            onClose={() => { onEndCall(activeMeetingId); setActiveMeetingId(null); }} 
            meetLink={supportConfig.meetLink}
          />
        </div>
      )}
    </div>
  );
};

export default StudentPortal;
