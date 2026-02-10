
import React, { useState } from 'react';
import { UserRole, User } from '../../types.ts';

interface LoginProps {
  onLogin: (user: User) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [mode, setMode] = useState<'student' | 'admin'>('student');
  const [studentName, setStudentName] = useState('');
  const [studentId, setStudentId] = useState('');
  const [classroomId, setClassroomId] = useState('DEMO-ROOM');
  const [adminKey, setAdminKey] = useState('');
  const [error, setError] = useState('');

  const handleStudentLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentName.trim() || !studentId.trim() || !classroomId.trim()) {
      setError('Please provide name, ID, and Classroom Code.');
      return;
    }

    const user: User = {
      id: studentId.toUpperCase().trim(),
      name: studentName.trim(),
      email: `${studentId.toLowerCase()}@student.aptimaster.com`,
      role: UserRole.STUDENT,
      classroomId: classroomId.toUpperCase().trim()
    };
    onLogin(user);
  };

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (adminKey === 'admin123') {
      const user: User = {
        id: 'ADMIN-ROOT',
        name: 'System Administrator',
        email: 'admin@aptimaster.com',
        role: UserRole.ADMIN,
        // Admin defaults to DEMO-ROOM if the field was hidden
        classroomId: classroomId.toUpperCase().trim() || 'DEMO-ROOM'
      };
      onLogin(user);
    } else {
      setError('Invalid administrative credentials.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="max-w-md w-full">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-indigo-600 rounded-3xl shadow-xl shadow-indigo-200 mb-6 rotate-3">
            <span className="text-white font-black text-4xl">A</span>
          </div>
          <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">AptiMaster</h1>
          <p className="mt-3 text-slate-500 font-medium">Cloud-Synced Aptitude Platform</p>
        </div>

        <div className="bg-white rounded-[2.5rem] shadow-2xl shadow-slate-200/60 p-10 border border-slate-100">
          <div className="flex p-1 bg-slate-100 rounded-2xl mb-8">
            <button 
              onClick={() => { setMode('student'); setError(''); }}
              className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all ${mode === 'student' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Student Portal
            </button>
            <button 
              onClick={() => { setMode('admin'); setError(''); }}
              className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all ${mode === 'admin' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Admin Access
            </button>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-2xl text-red-600 text-xs font-bold flex items-center gap-2 animate-shake">
              {error}
            </div>
          )}

          <form onSubmit={mode === 'student' ? handleStudentLogin : handleAdminLogin} className="space-y-5">
            {mode === 'student' ? (
              <>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Classroom Sync Code</label>
                  <input 
                    type="text" 
                    required
                    placeholder="e.g. MATH-101"
                    className="w-full bg-slate-50 border-2 border-transparent focus:border-indigo-500 focus:bg-white rounded-2xl px-5 py-4 outline-none transition-all font-black text-slate-800 uppercase"
                    value={classroomId}
                    onChange={e => setClassroomId(e.target.value)}
                  />
                  <p className="text-[10px] text-slate-400 font-medium ml-1">Ask your instructor for the classroom code.</p>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Full Name</label>
                  <input 
                    type="text" 
                    required
                    placeholder="e.g. John Doe"
                    className="w-full bg-slate-50 border-2 border-transparent focus:border-indigo-500 focus:bg-white rounded-2xl px-5 py-4 outline-none transition-all font-medium text-slate-800"
                    value={studentName}
                    onChange={e => setStudentName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Student ID</label>
                  <input 
                    type="text" 
                    required
                    placeholder="e.g. STU-001"
                    className="w-full bg-slate-50 border-2 border-transparent focus:border-indigo-500 focus:bg-white rounded-2xl px-5 py-4 outline-none transition-all font-medium text-slate-800 uppercase"
                    value={studentId}
                    onChange={e => setStudentId(e.target.value)}
                  />
                </div>
              </>
            ) : (
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Admin Passcode</label>
                <input 
                  type="password" 
                  required
                  placeholder="Enter admin code"
                  className="w-full bg-slate-50 border-2 border-transparent focus:border-indigo-500 focus:bg-white rounded-2xl px-5 py-4 outline-none transition-all font-medium text-slate-800"
                  value={adminKey}
                  onChange={e => setAdminKey(e.target.value)}
                />
                <p className="text-[10px] text-slate-400 font-medium ml-1">Admin will default to the shared 'DEMO-ROOM' sync channel.</p>
              </div>
            )}

            <button 
              type="submit" 
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-5 rounded-2xl shadow-xl shadow-indigo-200 transition-all active:scale-[0.98] mt-4"
            >
              Access {mode === 'student' ? 'Dashboard' : 'Admin Controls'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;
