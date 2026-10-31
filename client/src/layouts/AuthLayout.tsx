import { Outlet, Link } from 'react-router-dom';
import { Shapes, Calendar, Trophy, Puzzle } from 'lucide-react';

export const AuthLayout = () => {
  return (
    <div className="min-h-[100dvh] w-full flex bg-gradient-to-br from-[#070B16] via-[#10172A] to-[#151B35] text-slate-200 overflow-hidden relative selection:bg-[#FFB347]/30">
      
      {/* Absolute Ambient Background Layers */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        {/* Soft Glowing Orbs */}
        <div className="absolute top-[10%] left-[30%] w-[400px] h-[400px] rounded-full bg-[#8B5CF6]/10 blur-[120px]" />
        <div className="absolute bottom-[20%] right-[10%] w-[500px] h-[500px] rounded-full bg-[#FF7A18]/10 blur-[150px]" />
        <div className="absolute top-[50%] left-[10%] w-[300px] h-[300px] rounded-full bg-[#38BDF8]/10 blur-[100px]" />
        
        {/* Subtle glowing dots (flares) */}
        <div className="absolute top-[15%] left-[15%] w-4 h-4 rounded-full bg-white/20 blur-[4px]" />
        <div className="absolute top-[30%] left-[45%] w-3 h-3 rounded-full bg-blue-400/30 blur-[2px]" />
        <div className="absolute bottom-[20%] left-[25%] w-6 h-6 rounded-full bg-purple-400/20 blur-[6px]" />
        <div className="absolute bottom-[10%] right-[30%] w-4 h-4 rounded-full bg-orange-400/20 blur-[4px]" />
        <div className="absolute top-[25%] right-[15%] w-8 h-8 rounded-full bg-white/10 blur-[8px]" />

        {/* Floating Puzzle Pieces (Custom SVGs approximating the image) */}
        
        {/* Top Right large glowing puzzle piece */}
        <div className="absolute top-[15%] left-[38%] opacity-80 animate-[pulse_6s_ease-in-out_infinite] pointer-events-none transform rotate-12 scale-125">
           <svg width="80" height="80" viewBox="0 0 100 100" fill="none" stroke="rgba(56, 189, 248, 0.5)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="drop-shadow-[0_0_15px_rgba(56,189,248,0.4)]">
             <path d="M 30,30 L 45,30 C 45,20 55,20 55,30 L 70,30 L 70,45 C 80,45 80,55 70,55 L 70,70 L 55,70 C 55,80 45,80 45,70 L 30,70 L 30,55 C 20,55 20,45 30,45 Z" />
           </svg>
        </div>

        {/* Middle smaller filled puzzle piece */}
        <div className="absolute top-[40%] left-[43%] opacity-40 animate-[pulse_8s_ease-in-out_infinite] pointer-events-none transform -rotate-12">
           <svg width="40" height="40" viewBox="0 0 100 100" fill="none" stroke="rgba(255, 255, 255, 0.4)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
             <path d="M 30,30 L 45,30 C 45,20 55,20 55,30 L 70,30 L 70,45 C 80,45 80,55 70,55 L 70,70 L 55,70 C 55,60 45,60 45,70 L 30,70 L 30,55 C 40,55 40,45 30,45 Z" />
           </svg>
        </div>

        {/* Bottom subtle puzzle piece */}
        <div className="absolute bottom-[35%] left-[30%] opacity-20 animate-[pulse_5s_ease-in-out_infinite] pointer-events-none transform rotate-45 scale-75">
           <svg width="60" height="60" viewBox="0 0 100 100" fill="none" stroke="rgba(255, 255, 255, 0.5)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
             <path d="M 30,30 L 45,30 C 45,40 55,40 55,30 L 70,30 L 70,45 C 60,45 60,55 70,55 L 70,70 L 55,70 C 55,80 45,80 45,70 L 30,70 L 30,55 C 20,55 20,45 30,45 Z" />
           </svg>
        </div>
      </div>

      {/* LEFT PANEL - Branding (Hidden on mobile) */}
      <div className="hidden lg:flex flex-col w-1/2 p-12 xl:p-20 z-10 relative">
        
        <div className="mb-24">
          <Link to="/" className="inline-flex items-center group w-fit">
            <span className="text-2xl font-bold tracking-tight text-white">
              PuzzleVerse
            </span>
          </Link>
        </div>

        <div className="space-y-12 max-w-lg">
          <h1 className="text-5xl xl:text-6xl font-bold leading-tight text-white tracking-tight">
            Challenge your mind.<br />
            Master every puzzle.
          </h1>

          <div className="grid grid-cols-2 gap-y-10 gap-x-8 pt-4">
            <div className="flex items-center gap-3 text-white">
              <div className="flex items-center justify-center w-6 h-6">
                <Shapes className="w-6 h-6 text-[#94A3B8]" />
              </div>
              <span className="font-semibold text-lg tracking-wide">16 Puzzle Types</span>
            </div>
            
            <div className="flex items-center gap-3 text-white">
              <div className="flex items-center justify-center w-6 h-6">
                <Calendar className="w-6 h-6 text-[#94A3B8]" />
              </div>
              <span className="font-semibold text-lg tracking-wide">Daily Challenges</span>
            </div>

            <div className="flex items-center gap-3 text-white col-span-2">
              <div className="flex items-center justify-center w-6 h-6">
                <Trophy className="w-6 h-6 text-[#FFB347]" />
              </div>
              <span className="font-semibold text-lg tracking-wide">Global Leaderboards</span>
            </div>
          </div>
        </div>

      </div>

      {/* RIGHT PANEL - Authentication */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center items-center p-6 sm:p-12 z-10 relative">
        {/* Mobile Logo (Visible only on mobile) */}
        <div className="lg:hidden flex justify-center w-full mb-10">
          <Link to="/" className="inline-flex items-center group">
            <span className="text-3xl font-bold tracking-tight text-white">
              PuzzleVerse
            </span>
          </Link>
        </div>

        <div className="w-full max-w-md">
          <Outlet />
        </div>
      </div>
    </div>
  );
};
