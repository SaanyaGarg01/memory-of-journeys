import { useEffect, useRef, useState } from 'react';
import { JourneyLeg } from '../lib/supabase';

interface Globe3DProps {
  journeyLegs: JourneyLeg[];
  className?: string;
}

export default function Globe3D({ journeyLegs, className = '' }: Globe3DProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [rotation, setRotation] = useState(0);
  const animationRef = useRef<number>();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = Math.min(canvas.width, canvas.height) / 2 - 20;

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      ctx.fillStyle = 'rgba(15, 23, 42, 0.5)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const gradient = ctx.createRadialGradient(centerX, centerY, radius * 0.5, centerX, centerY, radius);
      gradient.addColorStop(0, 'rgba(59, 130, 246, 0.2)');
      gradient.addColorStop(0.5, 'rgba(37, 99, 235, 0.4)');
      gradient.addColorStop(1, 'rgba(29, 78, 216, 0.6)');

      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
      ctx.fillStyle = gradient;
      ctx.fill();

      ctx.strokeStyle = 'rgba(147, 197, 253, 0.3)';
      ctx.lineWidth = 1;
      for (let i = 0; i < 12; i++) {
        const angle = (i / 12) * Math.PI * 2 + rotation;
        ctx.beginPath();
        ctx.ellipse(centerX, centerY, radius * Math.cos(angle * 0.5), radius, angle, 0, Math.PI * 2);
        ctx.stroke();
      }

      for (let i = 0; i < 6; i++) {
        const y = centerY - radius + (i * radius * 2) / 5;
        const width = Math.sqrt(radius * radius - Math.pow(y - centerY, 2)) * 2;
        if (width > 0) {
          ctx.beginPath();
          ctx.ellipse(centerX, y, width / 2, width / 8, 0, 0, Math.PI * 2);
          ctx.stroke();
        }
      }

      journeyLegs.forEach((leg, index) => {
        const progress = ((Date.now() / 2000 + index) % journeyLegs.length) / journeyLegs.length;

        const lat1 = (Math.random() - 0.5) * Math.PI;
        const lon1 = (Math.random() - 0.5) * Math.PI * 2 + rotation;
        const lat2 = (Math.random() - 0.5) * Math.PI;
        const lon2 = (Math.random() - 0.5) * Math.PI * 2 + rotation;

        const x1 = centerX + radius * Math.cos(lat1) * Math.cos(lon1);
        const y1 = centerY + radius * Math.sin(lat1);
        const x2 = centerX + radius * Math.cos(lat2) * Math.cos(lon2);
        const y2 = centerY + radius * Math.sin(lat2);

        const z1 = Math.sin(lon1);
        const z2 = Math.sin(lon2);

        if (z1 > 0 || z2 > 0) {
          const gradient = ctx.createLinearGradient(x1, y1, x2, y2);
          gradient.addColorStop(0, `rgba(251, 191, 36, ${0.6 * (1 - progress)})`);
          gradient.addColorStop(1, `rgba(239, 68, 68, ${0.6 * progress})`);

          ctx.beginPath();
          ctx.moveTo(x1, y1);

          const cpX = (x1 + x2) / 2;
          const cpY = Math.min(y1, y2) - 50;
          ctx.quadraticCurveTo(cpX, cpY, x2, y2);

          ctx.strokeStyle = gradient;
          ctx.lineWidth = 2;
          ctx.stroke();

          const currentX = x1 + (x2 - x1) * progress;
          const currentY = y1 + (cpY - y1) * 2 * progress * (1 - progress) + (y2 - y1) * progress;

          ctx.beginPath();
          ctx.arc(currentX, currentY, 4, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(251, 191, 36, 0.9)';
          ctx.fill();
        }

        if (z1 > 0) {
          ctx.beginPath();
          ctx.arc(x1, y1, 3, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(34, 197, 94, 0.8)';
          ctx.fill();
        }

        if (z2 > 0) {
          ctx.beginPath();
          ctx.arc(x2, y2, 3, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(239, 68, 68, 0.8)';
          ctx.fill();
        }
      });

      setRotation(r => r + 0.002);
      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [journeyLegs, rotation]);

  return (
    <canvas
      ref={canvasRef}
      width={600}
      height={600}
      className={`${className}`}
      style={{ maxWidth: '100%', height: 'auto' }}
    />
  );
}
