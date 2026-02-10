import React, { useState, useEffect, useCallback } from 'react';
import { UserRole, User, Question, ActiveCall, Submission, SupportConfig, FileSubmission } from './types.ts';
import Login from './components/Auth/Login.tsx';
import AdminDashboard from './components/Admin/AdminDashboard.tsx';
import StudentPortal from './components/Student/StudentPortal.tsx';
import Navbar from './components/Layout/Navbar.tsx';
import { DatabaseService } from './services/db.ts';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [activeCalls, setActiveCalls] = useState<ActiveCall[]>([]);
  const [allSubmissions, setAllSubmissions] = useState<Submission[]>([]);
  const [allFileSubmissions, setAllFileSubmissions] = useState<FileSubmission[]>([]);
  const [supportConfig, setSupportConfig] = useState<SupportConfig>(DatabaseService.getConfig());
  const [syncStatus, setSyncStatus] = useState<'synced' | 'syncing' | 'error'>('synced');

  const refreshGlobalData = useCallback(() => {
    setQuestions(DatabaseService.getQuestions());
    setAllSubmissions(DatabaseService.getSubmissions());
    setAllFileSubmissions(DatabaseService.getFiles());
    setSupportConfig(DatabaseService.getConfig());
  }, []);

  useEffect(() => {
    const pollBackend = async () => {
      setSyncStatus('syncing');
      const success = await DatabaseService.sync();
      if (success) {
        refreshGlobalData();
        setSyncStatus('synced');
      } else {
        setSyncStatus('error');
      }
    };

    pollBackend();
    const interval = setInterval(pollBackend, 5000);
    return () => clearInterval(interval);
  }, [refreshGlobalData]);

  const handleLogin = (user: User) => {
    setCurrentUser(user);
    refreshGlobalData();
  };

  const handleLogout = () => {
    setCurrentUser(null);
  };

  const addQuestion = async (q: Question) => {
    await DatabaseService.addQuestion(q);
    refreshGlobalData();
  };

  const deleteQuestion = async (id: string) => {
    await DatabaseService.deleteQuestion(id);
    refreshGlobalData();
  };

  const handleAddSubmission = async (sub: Submission) => {
    await DatabaseService.addSubmission(sub);
    refreshGlobalData();
  };

  const handleAddFileSubmission = async (file: FileSubmission) => {
    await DatabaseService.addFile(file);
    refreshGlobalData();
  };

  const updateSupportConfig = async (config: SupportConfig) => {
    DatabaseService.saveConfig(config);
    setSupportConfig(config);
  };

  const initiateCall = (user: User, initiator: 'student' | 'admin' = 'student') => {
    const existing = activeCalls.find(c => c.studentId === user.id);
    if (existing) return existing.id;
    
    const newCall: ActiveCall = {
      id: Math.random().toString(36).substr(2, 9),
      studentId: user.id,
      studentName: user.name,
      startTime: new Date(),
      status: 'waiting',
      initiator: initiator
    };
    setActiveCalls(prev => [...prev, newCall]);
    return newCall.id;
  };

  if (!currentUser) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar user={currentUser} onLogout={handleLogout} syncStatus={syncStatus} />
      <main className="flex-grow container mx-auto px-4 py-8">
        {currentUser.role === UserRole.ADMIN ? (
          <AdminDashboard 
            questions={questions} 
            onAddQuestion={addQuestion} 
            onDeleteQuestion={deleteQuestion}
            activeCalls={activeCalls}
            onJoinCall={(id) => setActiveCalls(prev => prev.map(c => c.id === id ? {...c, status: 'active'} : c))}
            onEndCall={(id) => setActiveCalls(prev => prev.filter(c => c.id !== id))}
            onInitiateCall={(target) => initiateCall(target, 'admin')}
            allSubmissions={allSubmissions}
            allFileSubmissions={allFileSubmissions}
            supportConfig={supportConfig}
            onUpdateConfig={updateSupportConfig}
            classroomId={currentUser.classroomId}
          />
        ) : (
          <StudentPortal 
            questions={questions} 
            user={currentUser} 
            onInitiateCall={() => initiateCall(currentUser, 'student')}
            onEndCall={(id) => setActiveCalls(prev => prev.filter(c => c.id !== id))}
            onJoinCall={(id) => setActiveCalls(prev => prev.map(c => c.id === id ? {...c, status: 'active'} : c))}
            activeCalls={activeCalls}
            studentSubmissions={allSubmissions.filter(s => s.studentId === currentUser.id)}
            onAddSubmission={handleAddSubmission}
            onAddFileSubmission={handleAddFileSubmission}
            supportConfig={supportConfig}
          />
        )}
      </main>
      <footer className="bg-white border-t py-6 text-center text-slate-500 text-sm">
        &copy; 2024 AptiMaster Platform. Cloud: {syncStatus === 'synced' ? 'Online' : 'Offline'}
      </footer>
    </div>
  );
};

export default App;