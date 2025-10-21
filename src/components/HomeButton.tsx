import { Compass } from 'lucide-react';

type Props = {
  onClick: () => void;
  className?: string;
};

export default function HomeButton({ onClick, className = '' }: Props) {
  return (
    <button
      onClick={onClick}
      className={`fixed bottom-6 right-6 z-50 group ${className}`}
      aria-label="Go to Home"
    >
      <div className="relative">
        <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-blue-500 to-cyan-500 blur-md opacity-70 group-hover:opacity-100 transition-opacity"></div>
        <div className="relative w-14 h-14 rounded-full bg-slate-900 border border-slate-700 shadow-xl flex items-center justify-center
                        hover:scale-105 active:scale-95 transition-transform">
          <Compass className="w-7 h-7 text-white transition-transform group-hover:rotate-12" />
        </div>
      </div>
      <span className="sr-only">Home</span>
    </button>
  );
}
