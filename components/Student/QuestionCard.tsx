import React, { useState, useEffect } from 'react';
import { Question, Submission } from '../../types';

interface QuestionCardProps {
  question: Question;
  onAnswer: (qId: string, answerIdx: number, isCorrect: boolean) => void;
  submission?: Submission;
}

const QuestionCard: React.FC<QuestionCardProps> = ({ question, onAnswer, submission }) => {
  const [isStarted, setIsStarted] = useState(!!submission);
  const [selected, setSelected] = useState<number | null>(submission?.answer ?? null);
  const [timeLeft, setTimeLeft] = useState<number>(question.timeLimitMinutes * 60);
  const [isTimeUp, setIsTimeUp] = useState(false);

  useEffect(() => {
    if (!isStarted || submission || isTimeUp) return;

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setIsTimeUp(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isStarted, submission, isTimeUp, question.id]);

  const handleStart = () => {
    if (submission) return;
    setIsStarted(true);
  };

  const handleSelect = (idx: number) => {
    if (submission || isTimeUp || !isStarted) return; 
    setSelected(idx);
    const isCorrect = idx === question.correctAnswer;
    onAnswer(question.id, idx, isCorrect);
    setIsTimeUp(true);
  };

  const formatTime = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div 
      onClick={!isStarted ? handleStart : undefined}
      className={`bg-white border-2 rounded-[2rem] sm:rounded-[2.5rem] p-6 sm:p-10 transition-all shadow-xl shadow-slate-100/50 relative overflow-hidden 
        ${!isStarted ? 'cursor-pointer hover:border-indigo-400 border-dashed bg-slate-50/50 active:scale-[0.98]' : ''} 
        ${submission ? (submission.isCorrect ? 'border-green-100 bg-green-50/10' : 'border-red-100 bg-red-50/10') : isStarted ? 'border-indigo-100' : 'border-slate-200'}`}
    >
      
      {isStarted && !submission && (
        <div className="absolute top-0 left-0 h-1.5 bg-slate-100 w-full">
          <div 
            className={`h-full transition-all duration-1000 ${timeLeft < 20 ? 'bg-red-500' : 'bg-indigo-500'}`}
            style={{ width: `${(timeLeft / (question.timeLimitMinutes * 60)) * 100}%` }}
          />
        </div>
      )}

      <div className="flex items-center justify-between mb-6 sm:mb-8">
        <div className="flex items-center gap-2">
           <span className={`w-2 h-2 rounded-full ${isStarted ? 'bg-indigo-500' : 'bg-slate-300'}`}></span>
           <span className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{question.category}</span>
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          <span className={`text-[9px] sm:text-[10px] px-2 sm:px-3 py-1 rounded-lg font-black uppercase tracking-wider ${
            isTimeUp && !submission ? 'bg-slate-100 text-slate-400' : 'bg-indigo-100 text-indigo-700'
          }`}>
            {isStarted ? formatTime(timeLeft) : `${question.timeLimitMinutes}m`}
          </span>
          <span className="text-[9px] sm:text-[10px] px-2 sm:px-3 py-1 rounded-lg font-black uppercase tracking-wider border border-slate-100 text-slate-500">
            {question.difficulty}
          </span>
        </div>
      </div>
      
      {isStarted ? (
        <div className="animate-in fade-in duration-700">
          <p className="text-xl sm:text-2xl font-black text-slate-900 mb-8 sm:mb-10 leading-tight tracking-tight">{question.text}</p>
          
          <div className="flex flex-col gap-3 sm:gap-4">
            {question.options.map((opt, i) => {
              let styles = "border-slate-100 bg-slate-50 text-slate-700";
              if (selected === i) {
                if (i === question.correctAnswer) styles = "border-green-500 bg-green-50 text-green-700 font-black shadow-lg shadow-green-100";
                else styles = "border-red-500 bg-red-50 text-red-700 font-black shadow-lg shadow-red-100";
              } else if (submission && i === question.correctAnswer) {
                styles = "border-green-500 bg-green-50/50 text-green-700 font-black";
              } else if (!submission && !isTimeUp) {
                styles += " hover:border-indigo-300 active:bg-indigo-50";
              }

              return (
                <button
                  key={i}
                  disabled={!!submission || isTimeUp}
                  onClick={(e) => { e.stopPropagation(); handleSelect(i); }}
                  className={`w-full text-left p-4 sm:p-6 rounded-[1.5rem] sm:rounded-[1.8rem] border-2 transition-all active:scale-[0.98] group ${styles}`}
                >
                  <div className="flex items-center gap-4 sm:gap-5">
                    <span className={`flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl flex items-center justify-center font-black text-base sm:text-lg border-2 transition-all ${selected === i ? 'bg-white border-transparent' : 'bg-white border-slate-100 text-slate-400'}`}>
                      {String.fromCharCode(65 + i)}
                    </span>
                    <span className="text-base sm:text-lg font-bold leading-tight">{opt}</span>
                  </div>
                </button>
              );
            })}
          </div>

          {submission && (
            <div className={`mt-8 sm:mt-10 p-6 sm:p-8 rounded-[1.5rem] sm:rounded-[2rem] border-2 animate-in slide-in-from-top duration-700 ${submission.isCorrect ? 'bg-white border-green-100 text-green-800' : 'bg-white border-red-100 text-red-800'}`}>
              <div className="flex items-start gap-4 sm:gap-6">
                <div className="min-w-0">
                  <h4 className="font-black uppercase tracking-widest text-[9px] mb-1 opacity-60">Strategic Explanation</h4>
                  <p className="text-base sm:text-lg font-bold leading-relaxed">{question.explanation || "No explanation provided."}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="py-16 sm:py-24 flex flex-col items-center justify-center text-center space-y-6 sm:space-y-8 animate-in fade-in zoom-in duration-500">
           <div className="w-20 h-20 sm:w-24 sm:h-24 bg-indigo-50 rounded-[2rem] sm:rounded-[2.5rem] flex items-center justify-center text-indigo-500 shadow-xl shadow-indigo-100/50">
             <svg className="w-10 h-10 sm:w-12 sm:h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /></svg>
           </div>
           <div>
             <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight mb-2">Challenge Locked</h3>
             <p className="text-slate-400 text-xs sm:text-sm font-medium max-w-xs mx-auto">Tap to start your {question.timeLimitMinutes}m assessment window.</p>
           </div>
           <button 
             onClick={handleStart}
             className="bg-indigo-600 text-white px-10 sm:px-12 py-3 sm:py-4 rounded-xl sm:rounded-2xl font-black text-[10px] sm:text-xs uppercase tracking-widest shadow-2xl shadow-indigo-200 active:scale-95 transition-transform"
           >
             Unlock
           </button>
        </div>
      )}
    </div>
  );
};

export default QuestionCard;