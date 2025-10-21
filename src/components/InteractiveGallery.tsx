// Interactive Gallery Wall Feature
import { useEffect, useRef, useState } from 'react';
import { Image as ImageIcon, Shuffle, Grid, Upload, Replace, Pencil } from 'lucide-react';

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
  const addInputRef = useRef<HTMLInputElement | null>(null);
  const replaceInputRef = useRef<HTMLInputElement | null>(null);
  const [replacingId, setReplacingId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [tempCaption, setTempCaption] = useState<string>('');

  const generateGallery = () => {
    // Generate polaroid-style items from journeys
    const items: GalleryItem[] = journeys.slice(0, 12).map((journey, index) => {
      let url = `https://picsum.photos/seed/${journey.id}/400/300`;
      let caption = journey.title;
      try {
        const saved = localStorage.getItem(`postcard:${journey.id}`);
        if (saved) {
          const parsed = JSON.parse(saved) as { image?: string | null; message?: string; title?: string };
          if (parsed.image) url = parsed.image;
          if (parsed.message) caption = parsed.message.slice(0, 60);
          else if (parsed.title) caption = parsed.title;
        }
        const gsave = localStorage.getItem(`gallery:${journey.id}`);
        if (gsave) {
          const parsed = JSON.parse(gsave) as { url?: string; caption?: string };
          if (parsed.url) url = parsed.url;
          if (parsed.caption) caption = parsed.caption;
        }
      } catch {}
      return {
        id: journey.id,
        url,
        caption,
        rotation: Math.random() * 20 - 10, // -10 to 10 degrees
        position: {
          x: (index % 4) * 25 + Math.random() * 5,
          y: Math.floor(index / 4) * 30 + Math.random() * 5
        }
      } as GalleryItem;
    });
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

  const startEdit = (id: string, current: string) => {
    setEditingId(id);
    setTempCaption(current);
  };
  const cancelEdit = () => {
    setEditingId(null);
    setTempCaption('');
  };
  const saveEdit = () => {
    if (!editingId) return;
    setGalleryItems((prev) => prev.map((it) => (it.id === editingId ? { ...it, caption: tempCaption } : it)));
    setEditingId(null);
    setTempCaption('');
  };

  // Build items from user-uploaded files
  const onAddFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const newItems: GalleryItem[] = [];
    const promises: Promise<void>[] = [];
    Array.from(files).slice(0, 24).forEach((file, index) => {
      if (!file.type.startsWith('image/')) return;
      promises.push(new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = () => {
          const id = crypto.randomUUID();
          const caption = file.name.replace(/\.[^/.]+$/, '').slice(0, 40);
          newItems.push({
            id,
            url: String(reader.result || ''),
            caption: caption || 'My Photo',
            rotation: Math.random() * 16 - 8,
            position: {
              x: (index % 4) * 25 + Math.random() * 8,
              y: Math.floor(index / 4) * 30 + Math.random() * 8,
            },
          });
          try { localStorage.setItem(`gallery:${id}`, JSON.stringify({ url: String(reader.result || ''), caption })); } catch {}
          resolve();
        };
        reader.readAsDataURL(file);
      }));
    });
    await Promise.all(promises);
    setGalleryItems((prev) => [...prev, ...newItems].slice(0, 24));
  };

  // Replace a single item photo
  const onReplaceFile = async (file: File) => {
    if (!replacingId || !file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = String(reader.result || '');
      setGalleryItems((prev) => prev.map((it) => (it.id === replacingId ? { ...it, url: dataUrl } : it)));
      // Persist back to postcard storage if this id matches a journey-based card
      try {
        const saved = localStorage.getItem(`postcard:${replacingId}`);
        const parsed = saved ? JSON.parse(saved) : {};
        parsed.image = dataUrl;
        localStorage.setItem(`postcard:${replacingId}`, JSON.stringify(parsed));
      } catch {}
      // Persist to gallery storage as well
      try { localStorage.setItem(`gallery:${replacingId}`, JSON.stringify({ url: dataUrl })); } catch {}
      setReplacingId(null);
      // Reset the file input value so selecting the same file triggers change again
      if (replaceInputRef.current) replaceInputRef.current.value = '';
    };
    reader.readAsDataURL(file);
  };

  const syncFromPostcards = () => {
    setGalleryItems((prev) => prev.map((it) => {
      try {
        const saved = localStorage.getItem(`postcard:${it.id}`);
        if (!saved) {
          // Still try gallery overrides
          const gsave = localStorage.getItem(`gallery:${it.id}`);
          if (gsave) {
            const g = JSON.parse(gsave);
            return { ...it, url: g.url || it.url, caption: g.caption || it.caption };
          }
          return it;
        }
        const parsed = JSON.parse(saved) as { image?: string | null; message?: string; title?: string };
        const gsave = localStorage.getItem(`gallery:${it.id}`);
        const mergedUrl = gsave ? (JSON.parse(gsave).url || parsed.image || it.url) : (parsed.image || it.url);
        const mergedCaption = gsave ? (JSON.parse(gsave).caption || (parsed.message ? parsed.message.slice(0, 60) : parsed.title) || it.caption)
                                    : ((parsed.message ? parsed.message.slice(0, 60) : parsed.title) || it.caption);
        return {
          ...it,
          url: mergedUrl,
          caption: mergedCaption,
        };
      } catch {
        return it;
      }
    }));
  };

  // Auto-sync disabled per user request

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
          <button
            onClick={() => setGalleryItems([])}
            className="flex items-center gap-2 bg-slate-800 text-white px-4 py-2 rounded-lg font-medium hover:bg-slate-700 transition-colors"
            title="Clear all to replace with your photos"
          >
            Clear Wall
          </button>
          <button
            onClick={syncFromPostcards}
            className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-indigo-500 transition-colors"
            title="Load saved postcard images and text"
          >
            Sync Postcards
          </button>
          <button
            onClick={() => addInputRef.current?.click()}
            className="flex items-center gap-2 bg-gradient-to-r from-pink-500 to-fuchsia-600 text-white px-4 py-2 rounded-lg font-medium hover:opacity-90 transition-all shadow hover:shadow-pink-500/30"
          >
            <Upload className="w-5 h-5" />
            Add Photos
          </button>
          <input
            ref={addInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => onAddFiles(e.currentTarget.files)}
          />
          <input
            ref={replaceInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => onReplaceFile(e.currentTarget.files?.[0] as File)}
          />
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
              className="absolute cursor-move hover:z-10 transition-all hover:shadow-2xl hover:scale-[1.02]"
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
              <div className="bg-white p-3 shadow-xl rounded-sm ring-1 ring-black/5 group" style={{ width: '220px' }}>
                {/* Image */}
                <div className="relative bg-slate-200 rounded-sm overflow-hidden mb-3" style={{ height: '160px' }} onClick={(ev) => { ev.stopPropagation(); setReplacingId(item.id); replaceInputRef.current?.click(); }}>
                  <img 
                    src={item.url} 
                    alt={item.caption}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    draggable={false}
                  />
                  {/* Replace control */}
                  <button
                    className="absolute top-2 right-2 bg-black/50 text-white backdrop-blur px-2 py-1 rounded text-xs hover:bg-black/60"
                    onClick={(ev) => {
                      ev.stopPropagation();
                      setReplacingId(item.id);
                      replaceInputRef.current?.click();
                    }}
                    title="Replace photo"
                  >
                    <Replace className="w-4 h-4" />
                  </button>
                </div>
                
                {/* Caption */}
                {editingId === item.id ? (
                  <div className="space-y-2">
                    <input
                      value={tempCaption}
                      onChange={(e) => setTempCaption(e.target.value)}
                      placeholder="Add a title or emojis..."
                      className="w-full px-3 py-2 border border-slate-300 rounded text-slate-800 text-sm"
                    />
                    <div className="flex flex-wrap gap-2">
                      {['✨','🌍','✈️','📸','❤️','🎒','🏞️','🏙️','🌅','🌊','🍜','🎉'].map((emo) => (
                        <button
                          key={emo}
                          onClick={() => setTempCaption((c) => (c ? `${c} ${emo}` : emo))}
                          className="px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 text-base"
                          type="button"
                        >{emo}</button>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => {
                        const id = editingId; const caption = tempCaption;
                        saveEdit();
                        try {
                          if (id) {
                            const saved = localStorage.getItem(`postcard:${id}`);
                            const payload = saved ? JSON.parse(saved) : {};
                            payload.message = caption;
                            localStorage.setItem(`postcard:${id}`, JSON.stringify(payload));
                          }
                        } catch {}
                      }} className="flex-1 px-3 py-1 rounded bg-emerald-600 text-white text-sm hover:bg-emerald-700">Save</button>
                      <button onClick={cancelEdit} className="px-3 py-1 rounded bg-slate-200 text-slate-700 text-sm hover:bg-slate-300">Cancel</button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-2">
                    <p className="text-center text-slate-700 text-sm font-handwriting">
                      {item.caption}
                    </p>
                    <button
                      onClick={(e) => { e.stopPropagation(); startEdit(item.id, item.caption); }}
                      className="ml-1 p-1 rounded bg-slate-100 hover:bg-slate-200"
                      title="Edit caption"
                    >
                      <Pencil className="w-4 h-4 text-slate-600" />
                    </button>
                  </div>
                )}

                {/* Push pin */}
                <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-red-500 shadow-lg border-2 border-red-600 animate-pulse"></div>
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
