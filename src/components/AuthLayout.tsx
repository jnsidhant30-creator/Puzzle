import React from 'react';
import { Shapes, Calendar, Trophy } from 'lucide-react';
import { AuthModal } from './AuthModal'; 

export const AuthLayout: React.FC = () => { 
  return ( 
    <div className="min-h-[100dvh] w-full flex bg-gradient-to-br from-pv-bg-secondary to-pv-bg-primary text-pv-text-primary overflow-hidden relative selection:bg-pv-dragon-fruit/30 font-sans"> 
      
      {/* Absolute Ambient Background Layers */} 
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none"> 
        {/* Soft Glowing Orbs - Replaced with subtle Dragon Fruit atmospheric gradient */} 
        <div className="absolute top-[10%] left-[30%] w-[400px] h-[400px] rounded-full bg-pv-dragon-fruit/5 blur-[120px]" /> 
        <div className="absolute bottom-[20%] right-[10%] w-[500px] h-[500px] rounded-full bg-pv-surface-soft/40 blur-[150px]" /> 
        <div className="absolute top-[50%] left-[10%] w-[300px] h-[300px] rounded-full bg-pv-dragon-fruit-deep/5 blur-[100px]" /> 
        
        {/* Subtle glowing dots (flares) */} 
        <div className="absolute top-[15%] left-[15%] w-4 h-4 rounded-full bg-pv-dragon-fruit-light/20 blur-[4px]" /> 
        <div className="absolute top-[30%] left-[45%] w-3 h-3 rounded-full bg-pv-dragon-fruit/30 blur-[2px]" /> 
        <div className="absolute bottom-[20%] left-[25%] w-6 h-6 rounded-full bg-pv-surface-soft/40 blur-[6px]" /> 
        <div className="absolute bottom-[10%] right-[30%] w-4 h-4 rounded-full bg-pv-dragon-fruit-deep/20 blur-[4px]" /> 
        <div className="absolute top-[25%] right-[15%] w-8 h-8 rounded-full bg-white/5 blur-[8px]" /> 
        
        {/* Floating Puzzle Pieces */} 
        <div className="absolute top-[15%] left-[38%] opacity-50 animate-[pulse_6s_ease-in-out_infinite] pointer-events-none transform rotate-12 scale-125"> 
          <svg width="80" height="80" viewBox="0 0 100 100" fill="none" stroke="rgba(255, 70, 150, 0.3)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="drop-shadow-[0_0_15px_rgba(255,70,150,0.2)]"> 
            <path d="M 30,30 L 45,30 C 45,20 55,20 55,30 L 70,30 L 70,45 C 80,45 80,55 70,55 L 70,70 L 55,70 C 55,80 45,80 45,70 L 30,70 L 30,55 C 20,55 20,45 30,45 Z" /> 
          </svg> 
        </div> 
        <div className="absolute top-[40%] left-[43%] opacity-30 animate-[pulse_8s_ease-in-out_infinite] pointer-events-none transform -rotate-12"> 
          <svg width="40" height="40" viewBox="0 0 100 100" fill="none" stroke="rgba(255, 255, 255, 0.2)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"> 
            <path d="M 30,30 L 45,30 C 45,20 55,20 55,30 L 70,30 L 70,45 C 80,45 80,55 70,55 L 70,70 L 55,70 C 55,60 45,60 45,70 L 30,70 L 30,55 C 40,55 40,45 30,45 Z" /> 
          </svg> 
        </div> 
        <div className="absolute bottom-[35%] left-[30%] opacity-20 animate-[pulse_5s_ease-in-out_infinite] pointer-events-none transform rotate-45 scale-75"> 
          <svg width="60" height="60" viewBox="0 0 100 100" fill="none" stroke="rgba(255, 70, 150, 0.2)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"> 
            <path d="M 30,30 L 45,30 C 45,40 55,40 55,30 L 70,30 L 70,45 C 60,45 60,55 70,55 L 70,70 L 55,70 C 55,80 45,80 45,70 L 30,70 L 30,55 C 20,55 20,45 30,45 Z" /> 
          </svg> 
        </div> 
      </div> 

      {/* LEFT PANEL - Branding */} 
      <div className="hidden lg:flex flex-col w-1/2 p-12 xl:p-20 z-10 relative h-full justify-center"> 
        <div className="absolute top-12 left-12 xl:left-20"> 
          <span className="text-2xl font-bold tracking-tight text-white"> 
            PuzzleVerse 
          </span> 
        </div> 
        <div className="space-y-14 max-w-lg mt-10"> 
          <h1 className="text-5xl xl:text-[64px] font-bold leading-[1.1] text-white tracking-tight"> 
            Challenge your mind.<br /> Master every puzzle. 
          </h1> 
          <div className="grid grid-cols-2 gap-y-12 gap-x-8 pt-4"> 
            <div className="flex items-center gap-3 text-white"> 
              <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-pv-surface-soft border border-pv-border-strong"> 
                <Shapes className="w-5 h-5 text-pv-dragon-fruit-light" /> 
              </div> 
              <span className="font-semibold text-lg tracking-wide whitespace-nowrap">16 Puzzle Types</span> 
            </div> 
            <div className="flex items-center gap-3 text-white"> 
              <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-pv-surface-soft border border-pv-border-strong"> 
                <Calendar className="w-5 h-5 text-pv-dragon-fruit-light" /> 
              </div> 
              <span className="font-semibold text-lg tracking-wide whitespace-nowrap">Daily Challenges</span> 
            </div> 
            <div className="flex items-center gap-3 text-white col-span-2"> 
              <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-pv-surface-soft border border-pv-border-strong"> 
                <Trophy className="w-5 h-5 text-pv-dragon-fruit-light" /> 
              </div> 
              <span className="font-semibold text-lg tracking-wide whitespace-nowrap">Global Leaderboards</span> 
            </div> 
          </div> 
        </div> 
      </div> 

      {/* RIGHT PANEL - Authentication */} 
      <div className="w-full lg:w-1/2 flex flex-col justify-center items-center p-6 sm:p-12 z-10 relative"> 
        {/* Mobile Logo */} 
        <div className="lg:hidden flex justify-center w-full mb-10"> 
          <span className="text-3xl font-bold tracking-tight text-white"> 
            PuzzleVerse 
          </span> 
        </div> 
        <div className="w-full max-w-[500px]"> 
          <AuthModal onClose={() => {}} hideClose={true} isLayout={true} /> 
        </div> 
      </div> 
    </div> 
  );
};
