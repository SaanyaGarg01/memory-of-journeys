import React, { useEffect, useRef, useState } from 'react';
import { MapPin, Plane, Navigation, Globe, Route } from 'lucide-react';
import { JourneyLeg } from '../lib/supabase';

interface JourneyMapProps {
  journeyLegs: JourneyLeg[];
  title: string;
  className?: string;
}

export default function JourneyMap({ journeyLegs, title, className = '' }: JourneyMapProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [mapImage, setMapImage] = useState<string | null>(null);
  const [animationFrame, setAnimationFrame] = useState(0);

  useEffect(() => {
    const generateMap = async () => {
      if (!canvasRef.current || journeyLegs.length === 0) return;

      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Set canvas size
      canvas.width = 900;
      canvas.height = 600;

      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Create beautiful gradient background
      const gradient = ctx.createRadialGradient(canvas.width/2, canvas.height/2, 0, canvas.width/2, canvas.height/2, canvas.width);
      gradient.addColorStop(0, '#1e40af');
      gradient.addColorStop(0.3, '#1e293b');
      gradient.addColorStop(0.7, '#0f172a');
      gradient.addColorStop(1, '#000000');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw subtle grid pattern
      ctx.strokeStyle = 'rgba(59, 130, 246, 0.1)';
      ctx.lineWidth = 1;
      for (let i = 0; i < canvas.width; i += 50) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i, canvas.height);
        ctx.stroke();
      }
      for (let i = 0; i < canvas.height; i += 50) {
        ctx.beginPath();
        ctx.moveTo(0, i);
        ctx.lineTo(canvas.width, i);
        ctx.stroke();
      }

      // Calculate positions for cities with better distribution
      const cityPositions = journeyLegs.map((leg, index) => {
        const totalLegs = journeyLegs.length;
        const angle = (index / (totalLegs - 1)) * Math.PI * 1.5 + Math.PI * 0.25;
        const radius = Math.min(canvas.width, canvas.height) * 0.3;
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        
        const x = centerX + Math.cos(angle) * radius + (Math.random() - 0.5) * 80;
        const y = centerY + Math.sin(angle) * radius + (Math.random() - 0.5) * 80;
        
        return {
          x: Math.max(80, Math.min(x, canvas.width - 80)),
          y: Math.max(80, Math.min(y, canvas.height - 80)),
          city: leg.toCity,
          country: leg.toCountry,
          fromCity: leg.fromCity,
          index: index
        };
      });

      // Draw animated route lines with gradient
      const routeGradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
      routeGradient.addColorStop(0, '#3b82f6');
      routeGradient.addColorStop(0.5, '#8b5cf6');
      routeGradient.addColorStop(1, '#06b6d4');
      
      ctx.strokeStyle = routeGradient;
      ctx.lineWidth = 4;
      ctx.setLineDash([15, 10]);
      ctx.lineDashOffset = -animationFrame * 2;
      ctx.beginPath();
      
      for (let i = 0; i < cityPositions.length; i++) {
        const pos = cityPositions[i];
        if (i === 0) {
          ctx.moveTo(pos.x, pos.y);
        } else {
          ctx.lineTo(pos.x, pos.y);
        }
      }
      ctx.stroke();

      // Draw animated plane icons along the route
      ctx.setLineDash([]);
      cityPositions.forEach((pos, index) => {
        if (index > 0) {
          const prevPos = cityPositions[index - 1];
          const progress = (animationFrame % 100) / 100;
          const midX = prevPos.x + (pos.x - prevPos.x) * progress;
          const midY = prevPos.y + (pos.y - prevPos.y) * progress;
          
          // Draw plane shadow
          ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
          ctx.beginPath();
          ctx.ellipse(midX + 2, midY + 2, 12, 6, 0, 0, 2 * Math.PI);
          ctx.fill();
          
          // Draw plane body
          ctx.fillStyle = '#f59e0b';
          ctx.beginPath();
          ctx.ellipse(midX, midY, 10, 5, 0, 0, 2 * Math.PI);
          ctx.fill();
          
          // Draw plane direction
          const angle = Math.atan2(pos.y - prevPos.y, pos.x - prevPos.x);
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.moveTo(midX, midY);
          ctx.lineTo(midX + Math.cos(angle) * 20, midY + Math.sin(angle) * 20);
          ctx.stroke();
          
          // Draw plane wings
          ctx.strokeStyle = '#f59e0b';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(midX - 8, midY);
          ctx.lineTo(midX - 15, midY - 3);
          ctx.moveTo(midX - 8, midY);
          ctx.lineTo(midX - 15, midY + 3);
          ctx.stroke();
        }
      });

      // Draw enhanced city markers with glow effect
      cityPositions.forEach((pos, index) => {
        // City marker glow
        const glowGradient = ctx.createRadialGradient(pos.x, pos.y, 0, pos.x, pos.y, 25);
        glowGradient.addColorStop(0, 'rgba(239, 68, 68, 0.3)');
        glowGradient.addColorStop(1, 'rgba(239, 68, 68, 0)');
        ctx.fillStyle = glowGradient;
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, 25, 0, 2 * Math.PI);
        ctx.fill();
        
        // City marker outer ring
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, 18, 0, 2 * Math.PI);
        ctx.stroke();
        
        // City marker inner
        const markerGradient = ctx.createRadialGradient(pos.x - 3, pos.y - 3, 0, pos.x, pos.y, 15);
        markerGradient.addColorStop(0, '#fca5a5');
        markerGradient.addColorStop(1, '#ef4444');
        ctx.fillStyle = markerGradient;
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, 15, 0, 2 * Math.PI);
        ctx.fill();
        
        // City number
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText((index + 1).toString(), pos.x, pos.y + 4);

        // Enhanced city label with better styling
        const labelWidth = Math.max(120, pos.city.length * 8);
        const labelHeight = 35;
        
        // Label background with shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.fillRect(pos.x - labelWidth/2 - 2, pos.y - labelHeight - 2, labelWidth + 4, labelHeight + 4);
        
        // Label background
        ctx.fillStyle = 'rgba(15, 23, 42, 0.95)';
        ctx.fillRect(pos.x - labelWidth/2, pos.y - labelHeight, labelWidth, labelHeight);
        
        // Label border
        ctx.strokeStyle = '#3b82f6';
        ctx.lineWidth = 2;
        ctx.strokeRect(pos.x - labelWidth/2, pos.y - labelHeight, labelWidth, labelHeight);
        
        // City label
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 14px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(pos.city, pos.x, pos.y - 15);
        
        // Country label
        ctx.font = '11px Arial';
        ctx.fillStyle = '#94a3b8';
        ctx.fillText(pos.country, pos.x, pos.y - 2);
      });

      // Add beautiful title with gradient
      const titleWidth = ctx.measureText(title).width + 40;
      const titleGradient = ctx.createLinearGradient(20, 20, titleWidth, 20);
      titleGradient.addColorStop(0, 'rgba(59, 130, 246, 0.9)');
      titleGradient.addColorStop(1, 'rgba(139, 92, 246, 0.9)');
      
      ctx.fillStyle = titleGradient;
      ctx.fillRect(20, 20, titleWidth, 50);
      
      // Title border
      ctx.strokeStyle = '#3b82f6';
      ctx.lineWidth = 2;
      ctx.strokeRect(20, 20, titleWidth, 50);
      
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 18px Arial';
      ctx.textAlign = 'left';
      ctx.fillText(title, 30, 50);

      // Convert canvas to image
      const imageData = canvas.toDataURL('image/png');
      setMapImage(imageData);
    };

    generateMap();
  }, [journeyLegs, title, animationFrame]);

  // Animation loop
  useEffect(() => {
    const interval = setInterval(() => {
      setAnimationFrame(prev => prev + 1);
    }, 100);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className={`bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-3xl p-8 border border-slate-600 shadow-2xl ${className}`}>
      {/* Header with enhanced styling */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl">
            <Globe className="w-8 h-8 text-white" />
          </div>
          <div>
            <h3 className="text-2xl font-bold text-white mb-1">Journey Route Map</h3>
            <p className="text-sm text-gray-400">Interactive travel visualization</p>
          </div>
        </div>
        
        {/* Animated route indicator */}
        <div className="flex items-center gap-2 bg-gradient-to-r from-blue-500/20 to-purple-500/20 px-4 py-2 rounded-full border border-blue-500/30">
          <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
          <span className="text-sm font-medium text-blue-300">Live Route</span>
        </div>
      </div>
      
      {/* Enhanced map container */}
      <div className="relative bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-4 border border-slate-600 shadow-inner">
        <canvas
          ref={canvasRef}
          className="w-full rounded-xl border border-slate-500 shadow-lg"
          style={{ maxHeight: '500px' }}
        />
        
        {/* Enhanced map overlay */}
        <div className="absolute top-6 right-6 bg-gradient-to-br from-black/80 to-slate-900/80 backdrop-blur-md rounded-xl p-4 text-white border border-slate-500">
          <div className="flex items-center gap-2 mb-3">
            <div className="p-2 bg-blue-500/20 rounded-lg">
              <Plane className="w-5 h-5 text-blue-400" />
            </div>
            <span className="text-sm font-bold">Route Info</span>
          </div>
          <div className="space-y-1 text-xs text-gray-300">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-red-400 rounded-full"></div>
              <span>{journeyLegs.length} destinations</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-400 rounded-full"></div>
              <span>{new Set(journeyLegs.map(leg => leg.toCountry)).size} countries</span>
            </div>
          </div>
        </div>

        {/* Compass indicator */}
        <div className="absolute bottom-6 left-6 bg-gradient-to-br from-slate-800/90 to-slate-900/90 backdrop-blur-md rounded-full p-3 border border-slate-500">
          <Navigation className="w-6 h-6 text-blue-400" />
        </div>
      </div>

      {/* Enhanced route summary */}
      <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Destinations card */}
        <div className="bg-gradient-to-br from-red-500/10 to-pink-500/10 rounded-xl p-4 border border-red-500/20">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-red-500/20 rounded-lg">
              <MapPin className="w-5 h-5 text-red-400" />
            </div>
            <span className="text-sm font-bold text-white">Destinations</span>
          </div>
          <div className="space-y-2">
            {journeyLegs.map((leg, index) => (
              <div key={index} className="flex items-center gap-2 text-xs text-gray-300">
                <div className="w-4 h-4 bg-red-400 rounded-full flex items-center justify-center">
                  <span className="text-xs font-bold text-white">{index + 1}</span>
                </div>
                <span>{leg.fromCity} → {leg.toCity}</span>
              </div>
            ))}
          </div>
        </div>
        
        {/* Journey stats card */}
        <div className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 rounded-xl p-4 border border-blue-500/20">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-blue-500/20 rounded-lg">
              <Route className="w-5 h-5 text-blue-400" />
            </div>
            <span className="text-sm font-bold text-white">Journey Stats</span>
          </div>
          <div className="space-y-2 text-xs text-gray-300">
            <div className="flex justify-between">
              <span>Total stops:</span>
              <span className="font-bold text-blue-400">{journeyLegs.length}</span>
            </div>
            <div className="flex justify-between">
              <span>Countries:</span>
              <span className="font-bold text-blue-400">{new Set(journeyLegs.map(leg => leg.toCountry)).size}</span>
            </div>
            <div className="flex justify-between">
              <span>Route type:</span>
              <span className="font-bold text-blue-400">Multi-city</span>
            </div>
          </div>
        </div>

        {/* Journey highlights card */}
        <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-xl p-4 border border-purple-500/20">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-purple-500/20 rounded-lg">
              <Globe className="w-5 h-5 text-purple-400" />
            </div>
            <span className="text-sm font-bold text-white">Highlights</span>
          </div>
          <div className="space-y-2 text-xs text-gray-300">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse"></div>
              <span>Animated route visualization</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-pink-400 rounded-full animate-pulse"></div>
              <span>Interactive city markers</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse"></div>
              <span>Real-time flight paths</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
