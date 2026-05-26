import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles } from 'lucide-react';

interface SplashAndCloverProps {
  onComplete: () => void;
  lang: 'es' | 'en';
}

export function WinkingClover({ className = 'w-48 h-48' }: { className?: string }) {
  return (
    <div className={`relative ${className} flex items-center justify-center`}>
      {/* CSS Keyframes for custom bouncy, wink, and sparkle animations */}
      <style>{`
        @keyframes floatMiniBlue {
          0%, 100% { transform: translateY(0px) rotate(-12deg); }
          50% { transform: translateY(-8px) rotate(-8deg); }
        }
        @keyframes floatMiniPink {
          0%, 100% { transform: translateY(0px) rotate(15deg); }
          50% { transform: translateY(8px) rotate(20deg); }
        }
        @keyframes sparkleHeartbeat {
          0%, 100% { transform: scale(1) rotate(0deg); opacity: 0.9; }
          50% { transform: scale(1.3) rotate(15deg); opacity: 1; }
        }
        @keyframes mainBounce {
          0%, 100% { transform: scale(1) translateY(0); }
          50% { transform: scale(1.03) translateY(-4px); }
        }
        .animate-float-blue {
          animation: floatMiniBlue 4s ease-in-out infinite;
        }
        .animate-float-pink {
          animation: floatMiniPink 4.5s ease-in-out infinite;
        }
        .animate-sparkle {
          animation: sparkleHeartbeat 2.5s ease-in-out infinite;
        }
        .animate-main-clover {
          animation: mainBounce 5s ease-in-out infinite;
        }
      `}</style>

      {/* Main Container */}
      <svg
        viewBox="0 0 500 500"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full drop-shadow-[0_10px_0_rgba(30,43,88,0.15)] animate-main-clover"
        id="winking-clover-svg"
      >
        {/* ================= BACKGROUND CLOVER (YELLOW MASCOT) ================= */}
        {/* We build the four puffy, rounded clover lobes centred at (250, 250) positioned in a Cross/Plus Shape */}
        <g id="main-clover-body">
          {/* Outlines of the lobes to give the perfect neo-brutalist border */}
          <circle cx="250" cy="165" r="92" fill="#1e2b58" />
          <circle cx="250" cy="335" r="92" fill="#1e2b58" />
          <circle cx="165" cy="250" r="92" fill="#1e2b58" />
          <circle cx="335" cy="250" r="92" fill="#1e2b58" />
          <circle cx="250" cy="250" r="85" fill="#1e2b58" />

          {/* Inner Yellow Fills (BloomMind Golden Yellow '#ffd02b') */}
          <circle cx="250" cy="165" r="84" fill="#ffd02b" />
          <circle cx="250" cy="335" r="84" fill="#ffd02b" />
          <circle cx="165" cy="250" r="84" fill="#ffd02b" />
          <circle cx="335" cy="250" r="84" fill="#ffd02b" />
          <circle cx="250" cy="250" r="82" fill="#ffd02b" />
        </g>

        {/* ================= CUTE FACIAL EXPRESSION ================= */}
        <g id="face">
          {/* Left Eye: Big cute round black dot */}
          <circle cx="195" cy="245" r="14" fill="#1e2b58" />

          {/* Right Eye: Smiling/Winking Curve (a friendly arch wink) */}
          <path
            d="M 285 242 C 290 232, 310 232, 315 242"
            stroke="#1e2b58"
            strokeWidth="11"
            strokeLinecap="round"
            fill="none"
          />

          {/* Sweet Happy Smile Mouth */}
          <path
            d="M 226 280 C 236 298, 264 298, 274 280"
            stroke="#1e2b58"
            strokeWidth="11"
            strokeLinecap="round"
            fill="none"
          />

          {/* Soft blushing cheeks */}
          <circle cx="165" cy="268" r="12" fill="#ff8db8" opacity="0.65" />
          <circle cx="330" cy="268" r="12" fill="#ff8db8" opacity="0.65" />
        </g>

        {/* ================= WHITE GLEAMING SPARKLE (Top-Right Leaf) ================= */}
        {/* Positioned on the top right lobe, with scale transition */}
        <g id="sparkle" className="animate-sparkle" style={{ transformOrigin: '325px 165px' }}>
          <path
            d="M 325 135 L 333 157 L 355 165 L 333 173 L 325 195 L 317 173 L 295 165 L 317 157 Z"
            fill="white"
            stroke="#1e2b58"
            strokeWidth="4"
          />
        </g>

        {/* ================= MINI BLUE FLOATING CLOVER (Top-Left) ================= */}
        <g id="mini-blue-clover" className="animate-float-blue" style={{ transformOrigin: '75px 105px' }}>
          {/* Navy Outlines (Plus/Cross shape) */}
          <circle cx="75" cy="81" r="24" fill="#1e2b58" />
          <circle cx="75" cy="129" r="24" fill="#1e2b58" />
          <circle cx="51" cy="105" r="24" fill="#1e2b58" />
          <circle cx="99" cy="105" r="24" fill="#1e2b58" />
          <circle cx="75" cy="105" r="22" fill="#1e2b58" />
          {/* Fills - Sky Blue Color to match reference image */}
          <circle cx="75" cy="81" r="20" fill="#5bc1f5" />
          <circle cx="75" cy="129" r="20" fill="#5bc1f5" />
          <circle cx="51" cy="105" r="20" fill="#5bc1f5" />
          <circle cx="99" cy="105" r="20" fill="#5bc1f5" />
          <circle cx="75" cy="105" r="18" fill="#5bc1f5" />
          {/* Wink & Smile */}
          <circle cx="68" cy="103" r="4" fill="#1e2b58" />
          <path d="M 78 102 Q 82 98 84 102" stroke="#1e2b58" strokeWidth="2.5" fill="none" strokeLinecap="round" />
          <path d="M 72 113 Q 75 117 78 113" stroke="#1e2b58" strokeWidth="2.5" fill="none" strokeLinecap="round" />
          {/* Sparkle on mini blue */}
          <circle cx="91" cy="91" r="3" fill="white" />
        </g>

        {/* ================= MINI PINK FLOATING CLOVER (Bottom-Right) ================= */}
        <g id="mini-pink-clover" className="animate-float-pink" style={{ transformOrigin: '420px 400px' }}>
          {/* Navy Outlines (Plus/Cross shape) */}
          <circle cx="420" cy="376" r="24" fill="#1e2b58" />
          <circle cx="420" cy="424" r="24" fill="#1e2b58" />
          <circle cx="396" cy="400" r="24" fill="#1e2b58" />
          <circle cx="444" cy="400" r="24" fill="#1e2b58" />
          <circle cx="420" cy="400" r="22" fill="#1e2b58" />
          {/* Fills - Pink Color to match reference image */}
          <circle cx="420" cy="376" r="20" fill="#ff5bb1" />
          <circle cx="420" cy="424" r="20" fill="#ff5bb1" />
          <circle cx="396" cy="400" r="20" fill="#ff5bb1" />
          <circle cx="444" cy="400" r="20" fill="#ff5bb1" />
          <circle cx="420" cy="400" r="18" fill="#ff5bb1" />
          {/* Wink & Smile */}
          <circle cx="413" cy="398" r="4" fill="#1e2b58" />
          <path d="M 423 397 Q 427 393 429 397" stroke="#1e2b58" strokeWidth="2.5" fill="none" strokeLinecap="round" />
          <path d="M 417 408 Q 420 412 423 408" stroke="#1e2b58" strokeWidth="2.5" fill="none" strokeLinecap="round" />
          {/* Sparkle on mini pink */}
          <circle cx="436" cy="386" r="3" fill="white" />
        </g>
      </svg>
    </div>
  );
}

export default function SplashAndClover({ onComplete, lang }: SplashAndCloverProps) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Fill the loading bar over 3 seconds
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 1.2;
      });
    }, 30);

    // Complete the splash screen after 3.2 seconds
    const timeout = setTimeout(() => {
      onComplete();
    }, 3200);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [onComplete]);

  return (
    <div className="fixed inset-0 z-[200] bg-[#f8f6f0] flex items-center justify-center p-4">
      {/* Phone container wrapper exactly matching the references */}
      <div className="w-full max-w-sm h-[90vh] bg-gradient-to-b from-[#fceadb] via-[#f5e6fc] to-[#e4fce9] rounded-[3.5rem] border-4 border-[#1e2b58] shadow-[0_12px_0_#1e2b58] overflow-hidden flex flex-col justify-between items-center p-8 relative">
        
        {/* Subtle decorative grid overlay and sunburst behind the app logo */}
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#1e2b58 1px, transparent 1px)', backgroundSize: '16px 16px' }} />
        <div className="absolute top-1/4 w-80 h-80 bg-white/40 rounded-full blur-[80px] -z-10 animate-pulse pointer-events-none" />

        {/* App Notification Badges on top corner */}
        <div className="w-full flex justify-between items-center text-[#1e2b58] font-black text-xs uppercase tracking-wider relative z-10">
          <div className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-[#ccfb3c] border border-[#1e2b58] inline-block animate-ping" />
            <span>BloomMind</span>
          </div>
          <div className="flex items-center gap-1 bg-white/70 border border-[#1e2b58] px-2 py-0.5 rounded-full shadow-[1px_1px_0_currentColor]">
            <Sparkles className="w-3 h-3 text-[#ff5bb1] fill-[#ff5bb1]" />
            <span>v1.2</span>
          </div>
        </div>

        {/* Center Section: Winking Clover and Branding */}
        <div className="flex flex-col items-center justify-center flex-1 w-full space-y-6 relative z-10">
          
          {/* High Fidelity Animated Clover Mascot */}
          <WinkingClover className="w-52 h-52 sm:w-56 sm:h-56" />

          {/* Typography Branding exactly matching requested style */}
          <div className="text-center space-y-2">
            <h1 className="text-4xl font-black text-[#1e2b58] uppercase tracking-tighter drop-shadow-[2px_2px_0_rgba(255,255,255,0.8)]">
              BloomMind
            </h1>
            <p className="text-xs font-black uppercase text-[#1e2b58]/70 tracking-widest leading-none">
              {lang === 'es' ? 'Tu Jardín Creativo' : 'Your Creative Garden'}
            </p>
          </div>
        </div>

        {/* Bottom Section: Progress bar and credits */}
        <div className="w-full space-y-4 relative z-10 text-center">
          
          {/* Interactive load progress label */}
          <p className="text-[10px] font-black uppercase text-[#1e2b58]/80 tracking-widest animate-pulse">
            {lang === 'es' ? 'Sembrando ideas...' : 'Planting thoughts...'}
          </p>

          {/* Premium progress track */}
          <div className="w-full h-4 bg-white rounded-full border-2 border-[#1e2b58] p-0.5 overflow-hidden shadow-[2px_2px_0_#1e2b58]">
            <motion.div
              className="h-full bg-[#ccfb3c] rounded-full border-r-2 border-[#1e2b58]"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ ease: 'linear' }}
            />
          </div>

          <p className="text-[9px] font-extrabold text-[#1e2b58]/40 uppercase tracking-tight">
            © 2026 Bloommind Studio. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}
