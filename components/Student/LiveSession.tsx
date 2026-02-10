
import React, { useEffect, useRef, useState } from 'react';

interface LiveSessionProps {
  onClose: () => void;
  status?: 'waiting' | 'active';
  meetLink?: string;
}

const LiveSession: React.FC<LiveSessionProps> = ({ onClose, status = 'active', meetLink }) => {
  const [permissionError, setPermissionError] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const [copied, setCopied] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const finalMeetLink = meetLink || 'https://meet.google.com/new';

  const openGoogleMeet = () => {
    const meetWindow = window.open(finalMeetLink, '_blank', 'noopener,noreferrer');
    if (!meetWindow) {
      window.location.assign(finalMeetLink);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(finalMeetLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const startCamera = async () => {
    setPermissionError(null);
    setIsInitializing(true);
    
    if (!window.isSecureContext && window.location.hostname !== 'localhost' && !window.location.hostname.includes('127.0.0.1')) {
      setPermissionError("HTTPS Required.");
      setIsInitializing(false);
      return;
    }

    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error("API_UNAVAILABLE");
      }

      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: true, 
        video: { width: 640, height: 360, facingMode: "user" } 
      });
      
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play().catch(() => {});
        };
      }
      setIsInitializing(false);
    } catch (err: any) {
      setIsInitializing(false);
      setPermissionError("Direct call active. Preview skipped.");
    }
  };

  useEffect(() => {
    startCamera();
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  return (
    <div className="bg-slate-950 w-full h-full flex flex-col text-white font-sans overflow-hidden animate-in fade-in duration-500 shadow-2xl">
      {/* Header */}
      <div className="p-4 sm:p-6 flex justify-between items-center bg-slate-900/50 backdrop-blur-xl border-b border-white/5">
        <div className="flex items-center gap-3 sm:gap-4">
           <div className="w-8 h-8 sm:w-10 sm:h-10 bg-indigo-600 rounded-lg sm:rounded-xl flex items-center justify-center animate-pulse">
             <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
           </div>
           <div className="flex flex-col">
             <span className="text-[10px] sm:text-sm font-black tracking-tight uppercase">Support Tunnel</span>
             <span className="text-[8px] sm:text-[10px] font-bold text-emerald-400 uppercase tracking-widest flex items-center gap-1 sm:gap-1.5">
               <div className="w-1 h-1 sm:w-1.5 sm:h-1.5 bg-emerald-500 rounded-full animate-ping"></div>
               Ready
             </span>
           </div>
        </div>
        <button onClick={onClose} className="p-2 sm:p-3 bg-white/5 hover:bg-red-500/20 hover:text-red-500 rounded-lg sm:rounded-2xl transition-all border border-white/5">
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
      </div>

      <div className="flex-grow relative flex flex-col lg:flex-row items-center justify-center p-4 sm:p-6 gap-6 sm:gap-8 overflow-y-auto">
        {/* Camera Preview */}
        <div className="w-full lg:w-3/5 aspect-video bg-slate-900 rounded-[1.5rem] sm:rounded-[3rem] overflow-hidden shadow-2xl border border-white/10 relative group">
          {isInitializing ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 sm:gap-4">
              <div className="w-8 h-8 sm:w-12 sm:h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-[10px] sm:text-xs font-black uppercase tracking-[0.2em] text-slate-500 text-center px-4">Initializing Bridge...</p>
            </div>
          ) : permissionError ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center p-6 sm:p-8 text-center bg-slate-900/90">
               <div className="w-16 h-16 sm:w-20 sm:h-20 bg-indigo-500/10 rounded-2xl sm:rounded-3xl flex items-center justify-center mb-4 sm:mb-6 text-indigo-500">
                 <svg className="h-8 w-8 sm:h-10 sm:w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
               </div>
               <h3 className="text-lg sm:text-xl font-black mb-2">Direct Bridge Active</h3>
               <p className="text-slate-400 font-medium text-xs sm:text-sm max-w-xs">Connecting directly without preview.</p>
            </div>
          ) : (
            <>
              <video ref={videoRef} autoPlay muted playsInline className="w-full h-full object-cover scale-x-[-1]" />
              <div className="absolute bottom-4 left-4 sm:bottom-6 sm:left-6 px-3 py-1.5 sm:px-4 sm:py-2 bg-black/40 backdrop-blur-md rounded-lg sm:rounded-xl border border-white/10 text-[8px] sm:text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 sm:gap-2">
                <div className="w-1 h-1 sm:w-1.5 sm:h-1.5 bg-indigo-500 rounded-full"></div>
                Live Preview
              </div>
            </>
          )}
        </div>

        {/* Action Panel */}
        <div className="w-full lg:w-2/5 flex flex-col items-center lg:items-start text-center lg:text-left space-y-6 sm:space-y-8">
          <div className="space-y-2 sm:space-y-3">
             <h2 className="text-3xl sm:text-5xl font-black tracking-tighter leading-none">Join <span className="text-indigo-500">Meet</span></h2>
             <p className="text-slate-400 font-medium text-sm sm:text-lg leading-relaxed">Bridge to your expert tutor instantly.</p>
          </div>
          
          <div className="w-full space-y-3 sm:space-y-4">
             <button 
               onClick={openGoogleMeet} 
               className="w-full bg-[#1a73e8] hover:bg-[#1557b0] text-white py-6 sm:py-8 rounded-[1.5rem] sm:rounded-[2.5rem] font-black text-lg sm:text-xl shadow-[0_20px_50px_rgba(26,115,232,0.3)] hover:scale-[1.02] active:scale-95 transition-all flex flex-col items-center justify-center gap-1 group"
             >
                <div className="flex items-center gap-2 sm:gap-3">
                  <svg className="w-6 h-6 sm:w-8 sm:h-8" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14H9v-2h2v2zm0-4H9V7h2v5z"/>
                  </svg>
                  Launch Meet
                </div>
                <span className="text-[8px] sm:text-[10px] text-white/60 font-black uppercase tracking-[0.3em] mt-1 sm:mt-2">Google Platform</span>
             </button>

             <button 
               onClick={copyToClipboard}
               className="w-full bg-slate-900 hover:bg-slate-800 text-slate-300 py-4 sm:py-5 rounded-[1.2rem] sm:rounded-[1.8rem] font-black text-[10px] sm:text-xs uppercase tracking-widest border border-white/5 transition-all flex items-center justify-center gap-2 sm:gap-3"
             >
               {copied ? (
                 <span className="text-emerald-400 flex items-center gap-2">
                   <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                   Copied
                 </span>
               ) : (
                 <>
                   <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" /></svg>
                   Copy Meeting Link
                 </>
               )}
             </button>
          </div>

          <div className="p-4 sm:p-6 bg-white/5 rounded-[1.5rem] sm:rounded-[2rem] border border-white/5 w-full">
            <p className="text-[10px] sm:text-xs text-slate-500 font-medium leading-relaxed">
              If the platform fails to launch, click the button again or paste the copied link into your mobile browser.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LiveSession;
