// Then & Now - Compare past and present
import { useEffect, useRef, useState } from 'react';
import { ArrowLeftRight, MapPin } from 'lucide-react';

interface ThenAndNowProps {
  location: string;
  thenImage?: string;
  thenDate: string;
}

export default function ThenAndNow({ location, thenDate }: ThenAndNowProps) {
  const [sliderPosition, setSliderPosition] = useState(50);
  const [thenImg, setThenImg] = useState<string | null>(null);
  const [nowImg, setNowImg] = useState<string | null>(null);
  const [thenCaption, setThenCaption] = useState<string>('Historic view');
  const [nowCaption, setNowCaption] = useState<string>('Today');
  const [thenSource, setThenSource] = useState<string | null>(null);
  const [nowSource, setNowSource] = useState<string | null>(null);
  // loading removed (not used)
  const [autoPlay, setAutoPlay] = useState(true);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let mounted = true;
    const fetchImages = async () => {
      // start fetch
      try {
        const city = location.split(',')[0].trim();
        const year = new Date(thenDate).getFullYear();

        // 1) Get NOW image and caption from Wikipedia (search -> pageimages)
        let nowUrl: string | null = null;
        let nowCap: string | null = null;
        let nowSrc: string | null = null;
        try {
          const searchRes = await fetch(`https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(city)}&format=json&origin=*`);
          const searchData = await searchRes.json();
          const bestTitle = searchData?.query?.search?.[0]?.title as string | undefined;
          if (bestTitle) {
            const pageRes = await fetch(`https://en.wikipedia.org/w/api.php?action=query&prop=pageimages|extracts&exintro=1&explaintext=1&piprop=original&titles=${encodeURIComponent(bestTitle)}&format=json&origin=*`);
            const pageData = await pageRes.json();
            const pages = pageData?.query?.pages;
            if (pages) {
              const p = pages[Object.keys(pages)[0]];
              nowUrl = p?.original?.source || null;
              nowCap = p?.title || city;
              nowSrc = bestTitle ? `https://en.wikipedia.org/wiki/${encodeURIComponent(bestTitle)}` : null;
            }
          }
        } catch {
          // ignore, fallback later
        }
        if (!nowUrl) {
          nowUrl = `https://source.unsplash.com/1600x900/?${encodeURIComponent(city)},cityscape`;
          nowCap = `${city} today`;
        }

        // 2) Get THEN image from Wikimedia Commons with year hint
        let thenUrl: string | null = null;
        let thenCapText: string | null = null;
        let thenSrcUrl: string | null = null;
        try {
          const q = encodeURIComponent(`${city} ${year} old photo OR historical`);
          const url = `https://commons.wikimedia.org/w/api.php?action=query&format=json&origin=*&prop=imageinfo|info&generator=search&gsrsearch=${q}&gsrlimit=1&iiprop=url|mime|extmetadata&inprop=url&iiurlwidth=1600`;
          const res = await fetch(url);
          const data = await res.json();
          if (data?.query?.pages) {
            const firstKey = Object.keys(data.query.pages)[0];
            const page = data.query.pages[firstKey];
            const info = page?.imageinfo?.[0];
            thenUrl = info?.thumburl || info?.url || null;
            thenCapText = page?.title || `${city} in ${year}`;
            thenSrcUrl = page?.canonicalurl || page?.fullurl || null;
          }
        } catch {
          // ignore, fallback below
        }
        if (!thenUrl) {
          thenUrl = `https://source.unsplash.com/1600x900/?${encodeURIComponent(city)},historic`; // fallback
          thenCapText = `${city} in ${year}`;
        }

        if (!mounted) return;
        setNowImg(nowUrl);
        setNowCaption(nowCap || 'Today');
        setNowSource(nowSrc);
        setThenImg(thenUrl);
        setThenCaption(thenCapText || `Historic view (${year})`);
        setThenSource(thenSrcUrl);
      } catch {
        if (!mounted) return;
        const fallback = `https://source.unsplash.com/1600x900/?${encodeURIComponent(location)},city`;
        setThenImg(fallback);
        setNowImg(fallback);
        setThenCaption('Historic view');
        setNowCaption('Today');
        setThenSource(null);
        setNowSource(null);
      } finally {
        // end fetch
      }
    };
    fetchImages();
    return () => { mounted = false; };
  }, [location]);

  useEffect(() => {
    if (!autoPlay) return;
    const id = setInterval(() => {
      setSliderPosition((v) => {
        const next = v + 1.5;
        if (next >= 100) return 0;
        return next;
      });
    }, 60);
    return () => clearInterval(id);
  }, [autoPlay]);

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

      <div ref={containerRef} className="relative h-64 md:h-80 bg-slate-800 rounded-lg overflow-hidden">
        {/* Then side */}
        <div 
          className="absolute inset-0"
          style={{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }}
        >
          {thenImg ? (
            <img src={thenImg} alt="Then" className="w-full h-full object-cover scale-105 transition-transform duration-500" />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-slate-700 animate-pulse" />
          )}
        </div>

        {/* Now side */}
        <div 
          className="absolute inset-0"
          style={{ clipPath: `inset(0 0 0 ${sliderPosition}%)` }}
        >
          {nowImg ? (
            <img src={nowImg} alt="Now" className="w-full h-full object-cover scale-105 transition-transform duration-500" />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-slate-600 animate-pulse" />
          )}
        </div>

        {/* Slider */}
        <div 
          className="absolute top-0 bottom-0 w-1 bg-white cursor-ew-resize shadow-lg"
          style={{ left: `${sliderPosition}%` }}
          onMouseDown={() => {
            setAutoPlay(false);
            const handleMouseMove = (moveEvent: MouseEvent) => {
              const rect = containerRef.current?.getBoundingClientRect();
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
          onTouchStart={() => setAutoPlay(false)}
          onTouchMove={(te) => {
            const rect = containerRef.current?.getBoundingClientRect();
            if (rect) {
              const touch = te.touches[0];
              const x = touch.clientX - rect.left;
              const percentage = (x / rect.width) * 100;
              setSliderPosition(Math.max(0, Math.min(100, percentage)));
            }
          }}
        >
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-full p-2 shadow-xl animate-pulse">
            <ArrowLeftRight className="w-4 h-4 text-slate-800" />
          </div>
        </div>

        {/* Labels */}
        <div className="absolute top-4 left-4 bg-black/50 backdrop-blur-sm px-3 py-1 rounded-full text-white text-sm">
          Then • {new Date(thenDate).toLocaleDateString()}
        </div>
        <div className="absolute top-4 right-4 bg-black/50 backdrop-blur-sm px-3 py-1 rounded-full text-white text-sm">
          Now • Today
        </div>

        {/* Captions and Credits */}
        <div className="pointer-events-none absolute bottom-3 left-3 max-w-[70%]">
          <div className="inline-flex items-center gap-2 bg-black/55 backdrop-blur-sm text-white text-xs px-3 py-2 rounded-md border border-white/10">
            <span className="opacity-80">Then:</span>
            <span className="font-medium line-clamp-1">{thenCaption}</span>
            {thenSource && (
              <a
                className="pointer-events-auto underline decoration-dotted opacity-90 hover:opacity-100"
                href={thenSource}
                target="_blank"
                rel="noreferrer"
                title="Source"
              >
                Source
              </a>
            )}
          </div>
        </div>
        <div className="pointer-events-none absolute bottom-3 right-3 max-w-[70%] text-right">
          <div className="inline-flex items-center gap-2 bg-black/55 backdrop-blur-sm text-white text-xs px-3 py-2 rounded-md border border-white/10">
            <span className="opacity-80">Now:</span>
            <span className="font-medium line-clamp-1">{nowCaption}</span>
            {nowSource && (
              <a
                className="pointer-events-auto underline decoration-dotted opacity-90 hover:opacity-100"
                href={nowSource}
                target="_blank"
                rel="noreferrer"
                title="Source"
              >
                Source
              </a>
            )}
          </div>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between text-xs text-slate-400">
        <span>Drag to compare how {location} has changed</span>
        <button onClick={() => setAutoPlay((v) => !v)} className="px-2 py-1 border border-slate-600 rounded hover:bg-slate-700 text-white">
          {autoPlay ? 'Pause' : 'Auto-play'}
        </button>
      </div>
    </div>
  );
}
