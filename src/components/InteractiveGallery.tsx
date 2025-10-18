// Interactive Gallery Wall Feature
import { useState } from 'react';
import { Image as ImageIcon, Shuffle, Grid } from 'lucide-react';

interface GalleryItem {
  id: string;
  url: string;
  caption: string;
  rotation: number;
  position: { x: number; y: number };
}

interface Journey {
  id: string;
  title: string;
  description: string;
  legs: Array<{ from: string; to: string }>;
}

interface InteractiveGalleryProps {
  journeys: Journey[];
}

export default function InteractiveGallery({ journeys }: InteractiveGalleryProps) {
  const [galleryItems, setGalleryItems] = useState<GalleryItem[]>([]);
  const [isDragging, setIsDragging] = useState<string | null>(null);

  const generateGallery = () => {
    // Generate polaroid-style items from journeys
    const items: GalleryItem[] = journeys.slice(0, 12).map((journey, index) => ({
      id: journey.id,
      url: `https://picsum.photos/seed/${journey.id}/400/300`,
      caption: journey.title,
      rotation: Math.random() * 20 - 10, // -10 to 10 degrees
      position: {
        x: (index % 4) * 25 + Math.random() * 5,
        y: Math.floor(index / 4) * 30 + Math.random() * 5
      }
    }));
    setGalleryItems(items);
  };

  const shuffleGallery = () => {
    setGalleryItems(prev => prev.map(item => ({
      ...item,
      rotation: Math.random() * 20 - 10,
      position: {
        x: Math.random() * 75,
        y: Math.random() * 60
      }
    })));
  };

  const organizeGallery = () => {
    setGalleryItems(prev => prev.map((item, index) => ({
      ...item,
      rotation: 0,
      position: {
        x: (index % 4) * 25,
        y: Math.floor(index / 4) * 30
      }
    })));
  };

  const handleDragStart = (id: string) => {
    setIsDragging(id);
  };

  const handleDrag = (id: string, e: React.MouseEvent) => {
    if (isDragging !== id) return;
    
    const container = e.currentTarget.parentElement?.parentElement;
    if (!container) return;

    const rect = container.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    setGalleryItems(prev => prev.map(item => 
      item.id === id 
        ? { ...item, position: { x: Math.max(0, Math.min(85, x)), y: Math.max(0, Math.min(80, y)) } }
        : item
    ));
  };

  const handleDragEnd = () => {
    setIsDragging(null);
  };

  return (
    <div className="bg-slate-900/50 backdrop-blur-sm rounded-2xl p-8 border border-slate-700">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-lg bg-gradient-to-br from-yellow-500 to-amber-500">
            <ImageIcon className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">Interactive Gallery Wall</h2>
            <p className="text-slate-400 text-sm">Arrange your memories like polaroids</p>
          </div>
        </div>

        <div className="flex gap-2">
          {galleryItems.length === 0 ? (
            <button
              onClick={generateGallery}
              disabled={journeys.length === 0}
              className="flex items-center gap-2 bg-gradient-to-r from-yellow-500 to-amber-500 text-white px-4 py-2 rounded-lg font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              <ImageIcon className="w-5 h-5" />
              Generate Gallery
            </button>
          ) : (
            <>
              <button
                onClick={shuffleGallery}
                className="flex items-center gap-2 bg-slate-700 text-white px-4 py-2 rounded-lg font-medium hover:bg-slate-600 transition-colors"
              >
                <Shuffle className="w-5 h-5" />
                Shuffle
              </button>
              <button
                onClick={organizeGallery}
                className="flex items-center gap-2 bg-slate-700 text-white px-4 py-2 rounded-lg font-medium hover:bg-slate-600 transition-colors"
              >
                <Grid className="w-5 h-5" />
                Organize
              </button>
            </>
          )}
        </div>
      </div>

      {galleryItems.length > 0 ? (
        <div 
          className="relative bg-gradient-to-br from-amber-100 via-orange-50 to-yellow-100 rounded-xl p-8 min-h-[600px] overflow-hidden shadow-inner"
          style={{
            backgroundImage: 'radial-gradient(circle at 20% 50%, rgba(255, 237, 213, 0.5) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(255, 243, 224, 0.5) 0%, transparent 50%)',
          }}
        >
          {/* Cork board texture */}
          <div className="absolute inset-0 opacity-10" style={{
            backgroundImage: 'repeating-linear-gradient(90deg, transparent, transparent 2px, rgba(139, 69, 19, 0.3) 2px, rgba(139, 69, 19, 0.3) 4px)'
          }}></div>

          {/* Polaroid Items */}
          {galleryItems.map((item) => (
            <div
              key={item.id}
              className="absolute cursor-move hover:z-10 transition-shadow hover:shadow-2xl"
              style={{
                left: `${item.position.x}%`,
                top: `${item.position.y}%`,
                transform: `rotate(${item.rotation}deg)`,
                transition: isDragging === item.id ? 'none' : 'all 0.3s ease'
              }}
              onMouseDown={() => handleDragStart(item.id)}
              onMouseMove={(e) => handleDrag(item.id, e)}
              onMouseUp={handleDragEnd}
              onMouseLeave={handleDragEnd}
            >
              <div className="bg-white p-3 shadow-xl rounded-sm" style={{ width: '200px' }}>
                {/* Image */}
                <div className="bg-slate-200 rounded-sm overflow-hidden mb-3" style={{ height: '150px' }}>
                  <img 
                    src={item.url} 
                    alt={item.caption}
                    className="w-full h-full object-cover"
                    draggable={false}
                  />
                </div>
                
                {/* Caption */}
                <p className="text-center text-slate-700 text-sm font-handwriting">
                  {item.caption}
                </p>

                {/* Push pin */}
                <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-red-500 shadow-lg border-2 border-red-600"></div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-slate-800/50 rounded-xl p-12 text-center border border-slate-700">
          <ImageIcon className="w-16 h-16 text-slate-600 mx-auto mb-4" />
          <p className="text-slate-400 mb-4">
            {journeys.length === 0 
              ? 'Create some journeys first to generate your gallery wall'
              : 'Click "Generate Gallery" to create your interactive memory wall'}
          </p>
          {journeys.length > 0 && (
            <button
              onClick={generateGallery}
              className="inline-flex items-center gap-2 bg-gradient-to-r from-yellow-500 to-amber-500 text-white px-6 py-3 rounded-lg font-medium hover:opacity-90 transition-opacity"
            >
              <ImageIcon className="w-5 h-5" />
              Generate Gallery
            </button>
          )}
        </div>
      )}

      {/* Info */}
      <div className="mt-6 bg-yellow-900/20 border border-yellow-700/50 rounded-lg p-4">
        <p className="text-sm text-yellow-300">
          <strong>💡 Tip:</strong> Drag and drop the polaroids to arrange them however you like! 
          Use shuffle for a random layout or organize for a neat grid.
        </p>
      </div>
    </div>
  );
}
