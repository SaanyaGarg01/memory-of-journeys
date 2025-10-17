// 3D Memory Museum - Virtual gallery experience
import { useEffect, useRef } from 'react';
import { Building2 } from 'lucide-react';

interface MemoryMuseumProps {
  journeys: Array<{
    id: string;
    title: string;
    imageUrl?: string;
    location: string;
  }>;
}

export default function MemoryMuseum({ journeys }: MemoryMuseumProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Simple 3D museum visualization
    const drawMuseum = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Background
      const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
      gradient.addColorStop(0, '#1e293b');
      gradient.addColorStop(1, '#0f172a');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw gallery walls (perspective)
      ctx.strokeStyle = 'rgba(148, 163, 184, 0.3)';
      ctx.lineWidth = 2;

      // Left wall
      ctx.beginPath();
      ctx.moveTo(50, 150);
      ctx.lineTo(50, 450);
      ctx.lineTo(150, 400);
      ctx.lineTo(150, 200);
      ctx.closePath();
      ctx.stroke();

      // Right wall
      ctx.beginPath();
      ctx.moveTo(canvas.width - 50, 150);
      ctx.lineTo(canvas.width - 50, 450);
      ctx.lineTo(canvas.width - 150, 400);
      ctx.lineTo(canvas.width - 150, 200);
      ctx.closePath();
      ctx.stroke();

      // Floor
      ctx.beginPath();
      ctx.moveTo(50, 450);
      ctx.lineTo(canvas.width - 50, 450);
      ctx.lineTo(canvas.width - 150, 400);
      ctx.lineTo(150, 400);
      ctx.closePath();
      ctx.fillStyle = 'rgba(30, 41, 59, 0.5)';
      ctx.fill();
      ctx.stroke();

      // Draw photo frames
      journeys.slice(0, 6).forEach((_, index) => {
        const x = 200 + (index % 3) * 150;
        const y = 250 + Math.floor(index / 3) * 120;
        const width = 100;
        const height = 80;

        // Frame shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.fillRect(x + 5, y + 5, width, height);

        // Frame
        ctx.fillStyle = '#334155';
        ctx.fillRect(x, y, width, height);

        // Inner frame (photo area)
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(x + 5, y + 5, width - 10, height - 10);

        // Highlight
        ctx.strokeStyle = 'rgba(148, 163, 184, 0.5)';
        ctx.lineWidth = 1;
        ctx.strokeRect(x, y, width, height);
      });

      // Add museum text
      ctx.fillStyle = '#94a3b8';
      ctx.font = '14px Inter, system-ui';
      ctx.textAlign = 'center';
      ctx.fillText('Your Memory Museum', canvas.width / 2, 100);
      ctx.font = '12px Inter, system-ui';
      ctx.fillText(`${journeys.length} memories preserved`, canvas.width / 2, 120);
    };

    drawMuseum();
  }, [journeys]);

  return (
    <div className="bg-slate-900/50 backdrop-blur-sm rounded-2xl p-8 border border-slate-700">
      <div className="flex items-center gap-3 mb-6">
        <Building2 className="w-6 h-6 text-purple-400" />
        <h2 className="text-2xl font-bold text-white">3D Memory Museum</h2>
      </div>
      
      <canvas
        ref={canvasRef}
        width={800}
        height={500}
        className="w-full rounded-lg bg-slate-950"
      />

      <div className="mt-6 grid grid-cols-3 gap-4">
        {journeys.slice(0, 6).map((journey, index) => (
          <div key={journey.id} className="bg-slate-800/50 rounded-lg p-3 border border-slate-700">
            <div className="text-sm font-medium text-white mb-1">Room {index + 1}</div>
            <div className="text-xs text-slate-400">{journey.title}</div>
            <div className="text-xs text-purple-400 mt-1">{journey.location}</div>
          </div>
        ))}
      </div>

      <div className="mt-4 text-center text-sm text-slate-400">
        🕶️ VR/AR mode coming soon - Experience your memories in virtual reality
      </div>
    </div>
  );
}
