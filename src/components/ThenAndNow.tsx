// Then & Now - Compare past and present
import { useState } from 'react';
import { ArrowLeftRight, MapPin } from 'lucide-react';

interface ThenAndNowProps {
  location: string;
  thenImage?: string;
  thenDate: string;
}

export default function ThenAndNow({ location, thenDate }: ThenAndNowProps) {
  const [sliderPosition, setSliderPosition] = useState(50);

  return (
    <div className="bg-gradient-to-br from-indigo-900/30 to-purple-900/30 backdrop-blur-sm rounded-2xl p-6 border border-indigo-700/50">
      <div className="flex items-center gap-3 mb-4">
        <ArrowLeftRight className="w-5 h-5 text-indigo-400" />
        <h3 className="text-xl font-bold text-white">Then & Now</h3>
      </div>

      <div className="flex items-center gap-2 mb-4">
        <MapPin className="w-4 h-4 text-indigo-400" />
        <span className="text-sm text-slate-300">{location}</span>
      </div>

      <div className="relative h-64 bg-slate-800 rounded-lg overflow-hidden">
        {/* Then side */}
        <div 
          className="absolute inset-0 bg-slate-700"
          style={{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }}
        >
          <div className="w-full h-full flex items-center justify-center">
            <div className="text-center">
              <div className="text-4xl mb-2">📸</div>
              <div className="text-white font-medium">Your Memory</div>
              <div className="text-sm text-slate-400">{thenDate}</div>
            </div>
          </div>
        </div>

        {/* Now side */}
        <div 
          className="absolute inset-0 bg-slate-600"
          style={{ clipPath: `inset(0 0 0 ${sliderPosition}%)` }}
        >
          <div className="w-full h-full flex items-center justify-center">
            <div className="text-center">
              <div className="text-4xl mb-2">🗺️</div>
              <div className="text-white font-medium">Today</div>
              <div className="text-sm text-slate-400">Current View</div>
            </div>
          </div>
        </div>

        {/* Slider */}
        <div 
          className="absolute top-0 bottom-0 w-1 bg-white cursor-ew-resize shadow-lg"
          style={{ left: `${sliderPosition}%` }}
          onMouseDown={(e) => {
            const handleMouseMove = (moveEvent: MouseEvent) => {
              const rect = e.currentTarget.parentElement?.getBoundingClientRect();
              if (rect) {
                const x = moveEvent.clientX - rect.left;
                const percentage = (x / rect.width) * 100;
                setSliderPosition(Math.max(0, Math.min(100, percentage)));
              }
            };

            const handleMouseUp = () => {
              document.removeEventListener('mousemove', handleMouseMove);
              document.removeEventListener('mouseup', handleMouseUp);
            };

            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
          }}
        >
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-full p-2 shadow-xl">
            <ArrowLeftRight className="w-4 h-4 text-slate-800" />
          </div>
        </div>

        {/* Labels */}
        <div className="absolute top-4 left-4 bg-black/50 backdrop-blur-sm px-3 py-1 rounded-full text-white text-sm">
          Then
        </div>
        <div className="absolute top-4 right-4 bg-black/50 backdrop-blur-sm px-3 py-1 rounded-full text-white text-sm">
          Now
        </div>
      </div>

      <div className="mt-4 text-center text-sm text-slate-400">
        Drag the slider to compare how {location} has changed over time
      </div>
    </div>
  );
}
