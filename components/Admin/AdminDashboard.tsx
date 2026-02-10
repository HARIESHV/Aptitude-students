import React, { useState, useMemo } from 'react';
import { Question, ActiveCall, Submission, SupportConfig, User, UserRole, FileSubmission } from '../../types.ts';
import { DatabaseService } from '../../services/db.ts';
import { AIService } from '../../services/ai.ts';

interface AdminDashboardProps {
  questions: Question[];
  onAddQuestion: (q: Question) => void;
  onDeleteQuestion: (id: string) => void;
  activeCalls: ActiveCall[];
  onJoinCall: (id: string) => void;
  onEndCall: (id: string) => void;
  onInitiateCall: (student: User) => string;
  allSubmissions: Submission[];
  allFileSubmissions: FileSubmission[];
  supportConfig: SupportConfig;
  onUpdateConfig: (config: SupportConfig) => void;
  classroomId: string;
}

export default function AdminDashboard({ 
  questions, 
  onAddQuestion, 
  onDeleteQuestion,
  activeCalls,
  onJoinCall,
  onInitiateCall,
  allSubmissions,
  allFileSubmissions,
  supportConfig,
  onUpdateConfig,
  classroomId
}: AdminDashboardProps) {
  const [tab, setTab] = useState<'questions' | 'reports' | 'vault' | 'settings'>('questions');
  const [isAdding, setIsAdding] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  
  const students = useMemo(() => 
    Array.from(new Set(allSubmissions.map(s => s.studentId))),
    [allSubmissions]
  );

  const initialNewQ: Partial<Question> = {
    text: '',
    category: 'Quantitative',
    options: ['', '', '', ''],
    correctAnswer: 0,
    difficulty: 'Easy',
    explanation: '',
    timeLimitMinutes: 1
  };

  const [newQ, setNewQ] = useState<Partial<Question>>(initialNewQ);

  const handlePostQuestion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newQ.text || newQ.options?.some(opt => !opt)) {
      alert("Error: Please provide question text and all options.");
      return;
    }

    const question: Question = {
      id: Math.random().toString(36).substr(2, 9),
      text: newQ.text!,
      category: newQ.category!,
      options: newQ.options as string[],
      correctAnswer: newQ.correctAnswer!,
      difficulty: newQ.difficulty as any,
      explanation: newQ.explanation || '',
      timeLimitMinutes: Number(newQ.timeLimitMinutes) || 1
    };

    onAddQuestion(question);
    setNewQ(initialNewQ);
    setIsAdding(false);
  };

  const handleAIGenerate = async () => {
    setIsGenerating(true);
    try {
      const generated = await AIService.generateQuestions(
        newQ.category || 'Quantitative', 
        newQ.difficulty || 'Easy', 
        1
      );
      if (generated && generated.length > 0) {
        setNewQ({
          ...generated[0],
          id: Math.random().toString(36).substr(2, 9)
        });
        setIsAdding(true);
      } else {
        alert("AI could not generate a question. Please ensure your API Key is valid and the backend is connected.");
      }
    } catch (err) {
      console.error("AI Generation failed", err);
      alert("AI Generation failed. Check console for details.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    onDeleteQuestion(id);
  };

  const handleDownloadFile = (file: FileSubmission) => {
    const link = document.createElement('a');
    link.href = file.fileData;
    link.download = file.fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleContactStudent = (studentId: string) => {
    const existingCall = activeCalls.find(c => c.studentId === studentId);
    if (existingCall) {
      onJoinCall(existingCall.id);
    } else {
      const sub = allSubmissions.find(s => s.studentId === studentId);
      if (sub) {
        const user: User = {
          id: sub.studentId,
          name: sub.studentName,
          email: `${sub.studentId.toLowerCase()}@student.aptimaster.com`,
          role: UserRole.STUDENT,
          classroomId: classroomId
        };
        onInitiateCall(user);
      }
    }
  };

  return (
    <div className="space-y-6 sm:space-y-10 animate-in fade-in duration-700 pb-24">
      <div className="flex border-b border-slate-200 overflow-x-auto no-scrollbar gap-4 sm:gap-10 px-1">
        {['questions', 'reports', 'vault', 'settings'].map((t) => (
          <button 
            key={t}
            onClick={() => setTab(t as any)}
            className={`pb-4 px-2 whitespace-nowrap text-[10px] sm:text-xs font-black transition-all relative uppercase tracking-[0.2em] ${
              tab === t ? 'text-indigo-600' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            {t === 'vault' ? 'Vault' : t === 'questions' ? 'Questions' : t}
            {tab === t && <div className="absolute bottom-0 left-0 w-full h-1 bg-indigo-600 rounded-t-full"></div>}
          </button>
        ))}
      </div>

      {tab === 'questions' ? (
        <div className="space-y-6 sm:space-y-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">Question Bank</h1>
              <p className="text-sm text-slate-500 font-medium">Manage and generate assessment content.</p>
            </div>
            <div className="flex gap-4">
              <button 
                onClick={handleAIGenerate}
                disabled={isGenerating}
                className="px-6 py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-lg bg-indigo-50 text-indigo-600 hover:bg-indigo-100 disabled:opacity-50 flex items-center gap-2"
              >
                {isGenerating ? <div className="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div> : 'AI Draft'}
              </button>
              <button 
                onClick={() => setIsAdding(!isAdding)}
                className={`px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-lg active:scale-95 ${
                  isAdding ? 'bg-slate-100 text-slate-600' : 'bg-slate-900 text-white hover:bg-black'
                }`}
              >
                {isAdding ? 'Close' : 'Post Question'}
              </button>
            </div>
          </div>

          {isAdding && (
            <div className="bg-white border-2 border-indigo-100 rounded-[2rem] p-8 shadow-2xl max-w-4xl mx-auto animate-in slide-in-from-top-4 duration-500">
              <form onSubmit={handlePostQuestion} className="space-y-8">
                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Question Content</label>
                    <textarea 
                      required
                      className="w-full bg-slate-50 border-2 border-transparent focus:border-indigo-500 focus:bg-white rounded-[1.5rem] px-6 py-5 outline-none transition-all font-bold text-slate-800 h-32 resize-none text-sm"
                      placeholder="e.g. Solve for X..."
                      value={newQ.text}
                      onChange={e => setNewQ({...newQ, text: e.target.value})}
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Category</label>
                      <select className="w-full bg-slate-50 border-2 border-transparent focus:border-indigo-500 rounded-xl px-4 py-4 font-black text-sm" value={newQ.category} onChange={e => setNewQ({...newQ, category: e.target.value})}>
                        <option>Quantitative</option><option>Logical Reasoning</option><option>Verbal Ability</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Difficulty</label>
                      <select className="w-full bg-slate-50 border-2 border-transparent focus:border-indigo-500 rounded-xl px-4 py-4 font-black text-sm" value={newQ.difficulty} onChange={e => setNewQ({...newQ, difficulty: e.target.value as any})}>
                        <option value="Easy">Easy</option><option value="Hard">Hard</option><option value="Difficult">Difficult</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Time (Min)</label>
                      <input type="number" min="1" className="w-full bg-slate-50 border-2 border-transparent focus:border-indigo-500 rounded-xl px-4 py-4 font-black text-sm" value={newQ.timeLimitMinutes} onChange={e => setNewQ({...newQ, timeLimitMinutes: parseFloat(e.target.value)})} />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Options</label>
                    <div className="space-y-3">
                      {newQ.options?.map((opt, i) => (
                        <div key={i} className="flex gap-4 items-center">
                          <button 
                            type="button" 
                            onClick={() => setNewQ({...newQ, correctAnswer: i})} 
                            className={`w-12 h-12 rounded-xl flex items-center justify-center font-black transition-all ${newQ.correctAnswer === i ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-400'}`}
                          >
                            {String.fromCharCode(65+i)}
                          </button>
                          <input 
                            required 
                            className="flex-grow bg-slate-50 border-2 border-transparent focus:border-indigo-500 rounded-xl px-6 py-4 font-bold text-sm" 
                            placeholder={`Option ${String.fromCharCode(65+i)}`}
                            value={opt} 
                            onChange={e => {
                              const opts = [...(newQ.options || [])];
                              opts[i] = e.target.value;
                              setNewQ({...newQ, options: opts});
                            }} 
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Explanation</label>
                    <input 
                      type="text"
                      className="w-full bg-slate-50 border-2 border-transparent focus:border-indigo-500 rounded-xl px-6 py-4 font-bold text-sm"
                      placeholder="Explain the logic..."
                      value={newQ.explanation}
                      onChange={e => setNewQ({...newQ, explanation: e.target.value})}
                    />
                  </div>
                </div>
                <button type="submit" className="w-full bg-indigo-600 text-white py-6 rounded-[2rem] font-black uppercase tracking-[0.2em] shadow-xl hover:bg-indigo-700 transition-all">Publish Question</button>
              </form>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {questions.map(q => (
              <div key={q.id} className="bg-white border-2 border-slate-100 rounded-[2.5rem] p-8 relative hover:shadow-2xl transition-all group">
                 <button 
                  onClick={(e) => handleDelete(e, q.id)} 
                  className="absolute top-4 right-4 w-12 h-12 flex items-center justify-center rounded-2xl bg-slate-50 text-slate-300 hover:bg-red-50 hover:text-red-500 transition-all"
                 >
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                 </button>
                 <div className="pr-10">
                   <span className="text-[9px] font-black bg-indigo-50 text-indigo-600 px-3 py-1 rounded-lg uppercase tracking-widest">{q.category}</span>
                   <h3 className="text-lg font-black text-slate-900 mt-4 leading-tight min-h-[2.5rem]">{q.text}</h3>
                 </div>
                 <div className="mt-6 space-y-2 border-t border-slate-50 pt-6">
                    {q.options.map((opt, i) => (
                      <div key={i} className={`text-[11px] font-bold p-3 rounded-xl border ${i === q.correctAnswer ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : 'bg-slate-50 border-transparent text-slate-400'}`}>
                        {String.fromCharCode(65+i)}. {opt}
                      </div>
                    ))}
                 </div>
              </div>
            ))}
          </div>
        </div>
      ) : tab === 'vault' ? (
        <div className="space-y-8 animate-in fade-in duration-500">
           <h1 className="text-3xl font-black text-slate-900 tracking-tight">Vault</h1>
           <div className="bg-white border-2 border-slate-50 rounded-[2.5rem] overflow-hidden shadow-2xl">
              {allFileSubmissions.length === 0 ? (
                <div className="p-24 text-center text-slate-300 font-black uppercase text-xs">The Vault is empty</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-slate-50 text-slate-400 text-[10px] font-black uppercase tracking-widest border-b border-slate-100">
                      <tr>
                        <th className="px-10 py-6">Candidate</th>
                        <th className="px-10 py-6">Document</th>
                        <th className="px-10 py-6 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {allFileSubmissions.map(f => (
                        <tr key={f.id} className="hover:bg-indigo-50/20">
                          <td className="px-10 py-8">
                            <p className="font-black text-slate-800">{f.studentName}</p>
                            <p className="text-[10px] text-slate-400 font-mono">{f.studentId}</p>
                          </td>
                          <td className="px-10 py-8 text-slate-500 font-bold text-sm">{f.fileName}</td>
                          <td className="px-10 py-8 text-right">
                            <button onClick={() => handleDownloadFile(f)} className="bg-indigo-600 text-white p-3 rounded-xl shadow-lg hover:bg-indigo-700">
                              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
           </div>
        </div>
      ) : tab === 'reports' ? (
        <div className="space-y-8 animate-in fade-in duration-500">
           <h1 className="text-3xl font-black text-slate-900 tracking-tight">Performance</h1>
           <div className="bg-white border-2 border-slate-50 rounded-[3rem] overflow-hidden shadow-2xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                   <thead className="bg-slate-50 text-slate-400 uppercase text-[10px] font-black tracking-widest border-b border-slate-100">
                     <tr>
                       <th className="px-10 py-8">Candidate</th>
                       <th className="px-10 py-8 text-center">Score</th>
                       <th className="px-10 py-8 text-right">Action</th>
                     </tr>
                   </thead>
                   <tbody className="divide-y divide-slate-100">
                      {students.map(sid => {
                         const subs = allSubmissions.filter(s => s.studentId === sid);
                         const correctCount = subs.filter(s => s.isCorrect).length;
                         const accuracy = Math.round((correctCount / subs.length) * 100) || 0;
                         return (
                           <tr key={sid} className="hover:bg-slate-50/50">
                             <td className="px-10 py-10">
                               <p className="font-black text-slate-900 text-lg">{subs[0]?.studentName}</p>
                               <p className="text-[10px] text-slate-400 font-mono font-bold uppercase tracking-widest">{sid}</p>
                             </td>
                             <td className="px-10 py-10 text-center">
                                <span className={`text-2xl font-black ${accuracy > 70 ? 'text-emerald-500' : accuracy > 40 ? 'text-amber-500' : 'text-red-500'}`}>{accuracy}%</span>
                             </td>
                             <td className="px-10 py-10 text-right">
                                <button onClick={() => handleContactStudent(sid)} className="bg-slate-900 text-white px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-black transition-all shadow-xl">Bridge</button>
                             </td>
                           </tr>
                         );
                      })}
                   </tbody>
                </table>
              </div>
           </div>
        </div>
      ) : (
        <div className="bg-white border-2 border-slate-100 rounded-[3rem] p-10 shadow-2xl">
           <h2 className="text-2xl font-black text-slate-900 mb-8">Platform Control</h2>
           <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Live Meeting Link</label>
                <input 
                  type="url" 
                  className="w-full bg-slate-50 border-2 border-transparent focus:border-indigo-500 focus:bg-white rounded-2xl px-6 py-4 font-black text-slate-800 text-sm"
                  value={supportConfig.meetLink}
                  onChange={e => onUpdateConfig({...supportConfig, meetLink: e.target.value})}
                />
              </div>
              <div className="pt-6 border-t border-slate-100">
                <button 
                  onClick={() => DatabaseService.resetDatabase()}
                  className="text-red-500 text-[10px] font-black uppercase tracking-widest hover:underline"
                >
                  Factory Reset Local State
                </button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
}