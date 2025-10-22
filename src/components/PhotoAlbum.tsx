import { useEffect, useMemo, useState } from 'react';
import { Journey } from '../lib/supabase';
import { supabase } from '../lib/supabase';
import { User } from 'firebase/auth';

type Photo = {
  id: string;
  album_id: string;
  user_id: string;
  image_url: string;
  caption?: string;
  page_number: number;
  created_at?: string;
};

type Album = {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  journey_id?: string | null;
  visibility: 'public' | 'private';
  created_at?: string;
  updated_at?: string;
};

interface PhotoAlbumProps {
  user: User;
}

export default function PhotoAlbum({ user }: PhotoAlbumProps) {
  const [albums, setAlbums] = useState<Album[]>([]);
  const [selectedAlbum, setSelectedAlbum] = useState<Album | null>(null);
  const [myJourneys, setMyJourneys] = useState<Journey[]>([]);
  const [creating, setCreating] = useState(false);
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [journeyId, setJourneyId] = useState<string>('');
  const [visibility, setVisibility] = useState<'public' | 'private'>('public');
  const [uploading, setUploading] = useState(false);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [caption, setCaption] = useState('');
  const [pageNum, setPageNum] = useState<number>(1);
  const [activePage, setActivePage] = useState<number>(1);
  const [pageNotes, setPageNotes] = useState<Record<number, string>>({});
  const [savingNotes, setSavingNotes] = useState(false);

  useEffect(() => {
    void loadAlbums();
    void loadMyJourneys();
  }, []);

  const loadAlbums = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/albums?user_id=${encodeURIComponent(user.uid)}`);
      if (res.ok) {
        const data = await res.json();
        setAlbums(data);
      }
    } finally {
      setLoading(false);
    }
  };

  const loadMyJourneys = async () => {
    try {
      const res = await fetch(`/api/users/${encodeURIComponent(user.uid)}/journeys`);
      if (res.ok) setMyJourneys(await res.json());
    } catch {}
  };

  const loadPhotos = async (albumId: string) => {
    try {
      const res = await fetch(`/api/albums/${encodeURIComponent(albumId)}/photos`);
      if (res.ok) {
        const data: Photo[] = await res.json();
        setPhotos(data);
        setActivePage(1);
      }
    } catch {}
  };

  const loadPages = async (albumId: string) => {
    try {
      const res = await fetch(`/api/albums/${encodeURIComponent(albumId)}/pages`);
      if (res.ok) {
        const data: Array<{ page_number: number; content: string }> = await res.json();
        const map: Record<number, string> = {};
        data.forEach(p => { map[p.page_number] = p.content || ''; });
        setPageNotes(map);
      }
    } catch {}
  };

  const handleCreateAlbum = async () => {
    if (!title.trim()) return;
    setCreating(true);
    try {
      const payload = { user_id: user.uid, title, description, journey_id: journeyId || null, visibility };
      const res = await fetch('/api/albums', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      if (res.ok) {
        const album: Album = await res.json();
        setAlbums(prev => [album, ...prev]);
        setSelectedAlbum(album);
        setTitle('');
        setDescription('');
        setJourneyId('');
      }
    } finally {
      setCreating(false);
    }
  };

  const handleUploadPhotos = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || !selectedAlbum) return;
    setUploading(true);
    const errors: string[] = [];
    try {
      for (const file of Array.from(files)) {
        try {
          const path = `${user.uid}/${selectedAlbum.id}/${Date.now()}_${file.name}`;
          const up = await supabase.storage.from('albums').upload(path, file, { upsert: true, contentType: file.type });
          if (up.error) throw up.error;
          const pub = supabase.storage.from('albums').getPublicUrl(path);
          const image_url = pub.data?.publicUrl;
          if (!image_url) throw new Error('No public URL returned for uploaded file');
          const payload = { user_id: user.uid, image_url, caption, page_number: pageNum };
          const res = await fetch(`/api/albums/${encodeURIComponent(selectedAlbum.id)}/photos`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
          if (!res.ok) {
            const txt = await res.text().catch(()=> '');
            throw new Error(`Failed to save photo metadata (${res.status}): ${txt}`);
          }
        } catch (fileErr: any) {
          const msg = fileErr?.message || String(fileErr);
          errors.push(`${file.name}: ${msg}`);
        }
      }
      await loadPhotos(selectedAlbum.id);
      // Jump to page where user uploaded most recently
      setActivePage(prev => Math.max(prev, pageNum));
      setCaption('');
      if (errors.length) {
        alert(`Some photos failed:\n${errors.join('\n')}`);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      alert(`Failed to upload photos: ${msg}`);
    } finally {
      setUploading(false);
      if (e.target) e.target.value = '' as any;
    }
  };

  const pages = useMemo(() => {
    const grouped: Record<number, Photo[]> = {};
    for (const p of photos) {
      const k = p.page_number || 1;
      if (!grouped[k]) grouped[k] = [];
      grouped[k].push(p);
    }
    const pageNums = Object.keys(grouped).map(n => Number(n)).sort((a,b) => a-b);
    return pageNums.map(n => ({ page: n, items: grouped[n] }));
  }, [photos]);

  const maxPage = pages.length > 0 ? Math.max(...pages.map(p => p.page)) : 1;

  const handleDeletePhoto = async (photo: Photo) => {
    if (!selectedAlbum) return;
    if (!confirm('Delete this photo?')) return;
    try {
      const res = await fetch(`/api/albums/${encodeURIComponent(selectedAlbum.id)}/photos/${encodeURIComponent(photo.id)}`, { method: 'DELETE' });
      if (res.status === 204 || res.status === 200) {
        await loadPhotos(selectedAlbum.id);
        // Stay on the same page if possible
        setActivePage(p => Math.min(p, Math.max(1, maxPage)));
      }
    } catch (err) {
      alert('Failed to delete photo');
    }
  };

  return (
    <div className="relative max-w-7xl mx-auto px-6 py-10">
      {/* Global butterflies + brand tags (non-blocking) */}
      <div className="pointer-events-none absolute inset-0 -z-10 select-none">
        <div className="absolute top-4 left-0 right-0 flex justify-center gap-2 opacity-70">
          <span className="text-xl animate-bounce">🦋</span>
          <span className="text-[10px] uppercase tracking-widest text-pink-300/80">Memory of Journeys</span>
          <span className="text-xl animate-bounce [animation-duration:2.2s]">🦋</span>
        </div>
        <span className="absolute top-20 left-6 text-2xl animate-pulse">🦋</span>
        <span className="absolute top-24 right-10 text-xl animate-bounce [animation-duration:1.8s]">🦋</span>
        <span className="absolute bottom-16 left-8 text-2xl animate-bounce [animation-duration:2.4s]">🦋</span>
        <div className="absolute bottom-6 left-0 right-0 flex justify-center gap-2 opacity-70">
          <span className="text-xl animate-bounce [animation-duration:2s]">🦋</span>
          <span className="text-[10px] uppercase tracking-widest text-pink-300/80">Memory of Journeys</span>
          <span className="text-xl animate-bounce">🦋</span>
        </div>
      </div>
      <div className="mb-8 text-center">
        <h2 className="text-5xl font-extrabold bg-gradient-to-r from-pink-500 via-red-500 to-yellow-500 bg-clip-text text-transparent">Photo Albums</h2>
        <p className="mt-3 text-gray-300">Create beautiful, animated travel albums. Write, curate, and relive your memories.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 space-y-6">
          <div className="relative p-6 rounded-xl border border-pink-400/40 bg-gradient-to-br from-fuchsia-800/40 to-cyan-800/30 backdrop-blur overflow-hidden">
            <div className="pointer-events-none absolute -top-6 -left-8 text-7xl opacity-20 select-none">🌸</div>
            <div className="pointer-events-none absolute -bottom-8 -right-8 text-8xl opacity-20 select-none">🌼</div>
            <h3 className="text-xl font-semibold text-white mb-4">Create New Album</h3>
            <input value={title} onChange={e=>setTitle(e.target.value)} placeholder="Album title" className="w-full mb-3 px-3 py-2 rounded bg-slate-700 text-white" />
            <textarea value={description} onChange={e=>setDescription(e.target.value)} placeholder="Description" className="w-full mb-3 px-3 py-2 rounded bg-slate-700 text-white" />
            <select value={journeyId} onChange={e=>setJourneyId(e.target.value)} className="w-full mb-3 px-3 py-2 rounded bg-slate-700 text-white">
              <option value="">Link to a journey (optional)</option>
              {myJourneys.map(j => (<option key={j.id} value={j.id}>{j.title}</option>))}
            </select>
            <select value={visibility} onChange={e=>setVisibility(e.target.value as any)} className="w-full mb-4 px-3 py-2 rounded bg-slate-700 text-white">
              <option value="public">Public</option>
              <option value="private">Private</option>
            </select>
            <button type="button" onClick={handleCreateAlbum} disabled={creating} className="w-full py-2 rounded bg-gradient-to-r from-pink-500 via-fuchsia-500 to-cyan-500 text-white font-semibold hover:opacity-90 transition shadow-lg shadow-pink-500/20">{creating ? 'Creating...' : 'Create Album'}</button>
          </div>

          <div className="relative p-6 rounded-xl border border-cyan-400/40 bg-gradient-to-br from-cyan-900/30 to-indigo-900/30 backdrop-blur overflow-hidden">
            <div className="pointer-events-none absolute -top-8 -right-10 text-8xl opacity-20 select-none">🦋</div>
            <h3 className="text-xl font-semibold text-white mb-4">My Albums</h3>
            <div className="space-y-3 max-h-[360px] overflow-y-auto pr-1">
              {loading && <div className="text-gray-400">Loading...</div>}
              {albums.map(a => (
                <button key={a.id} onClick={async()=>{ setSelectedAlbum(a); await loadPhotos(a.id); await loadPages(a.id); }} className={`w-full text-left p-3 rounded-lg border ${selectedAlbum?.id===a.id?'border-cyan-500 bg-slate-700':'border-slate-700 hover:bg-slate-700/60'} text-white`}> 
                  <div className="font-medium">{a.title}</div>
                  <div className="text-sm text-gray-400">{a.description || 'No description'}</div>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="lg:col-span-2">
          {!selectedAlbum ? (
            <div className="h-full min-h-[560px] rounded-2xl border border-slate-700 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-900 via-slate-900 to-black flex items-center justify-center text-center">
              <div>
                <div className="text-6xl mb-3">📚</div>
                <h3 className="text-2xl font-bold text-white">Select or create an album</h3>
                <p className="text-gray-400">Your photo book will appear here with animated page turns.</p>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex flex-col md:flex-row md:items-end gap-3">
                <div className="flex-1">
                  <div className="text-white text-2xl font-extrabold drop-shadow">{selectedAlbum.title} ✨</div>
                  <div className="text-gray-300">{selectedAlbum.description}</div>
                </div>
                <div className="flex items-center gap-3">
                  <input type="file" multiple accept="image/*" onChange={handleUploadPhotos} className="text-sm text-gray-200 file:mr-3 file:py-2 file:px-3 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-gradient-to-r file:from-pink-500 file:to-cyan-500 file:text-white hover:file:opacity-90" />
                  <input type="number" min={1} value={pageNum} onChange={e=>setPageNum(Number(e.target.value)||1)} className="w-24 px-3 py-2 rounded bg-slate-700 text-white" />
                  <input value={caption} onChange={e=>setCaption(e.target.value)} placeholder="Caption (optional)" className="w-56 px-3 py-2 rounded bg-slate-700 text-white" />
                  {uploading && <span className="text-gray-300">Uploading...</span>}
                </div>
              </div>

              <div className="relative overflow-hidden rounded-2xl border border-slate-700 bg-gradient-to-br from-indigo-900/80 via-slate-900/80 to-slate-950/80 p-6 shadow-[0_0_80px_-30px_rgba(99,102,241,0.6)] transition-shadow">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <button type="button" disabled={activePage<=1} onClick={()=>setActivePage(p=>Math.max(1,p-1))} className="px-3 py-1 rounded bg-gradient-to-r from-pink-500 to-fuchsia-600 text-white disabled:opacity-40">Prev</button>
                    <button type="button" disabled={activePage>=maxPage} onClick={()=>setActivePage(p=>Math.min(maxPage,p+1))} className="px-3 py-1 rounded bg-gradient-to-r from-cyan-500 to-blue-600 text-white disabled:opacity-40">Next</button>
                  </div>
                  <div className="text-gray-200 font-medium">Page {activePage} of {maxPage || 1} • Photos on this page: {photos.filter(p=>p.page_number===activePage).length}</div>
                  <button type="button" onClick={()=>window.print()} className="px-3 py-1 rounded bg-gradient-to-r from-amber-500 to-yellow-600 text-white">Print / Save PDF</button>
              </div>

                <div className="relative perspective-[1200px] h-[520px]">
                  {pages.map(({ page, items }) => (
                    <div key={page} className={`absolute inset-0 transition-transform duration-700 [transform-style:preserve-3d] ${page===activePage ? 'rotate-y-0 opacity-100 z-10' : page<activePage ? 'rotate-y-[-180deg] opacity-0 -z-10' : 'rotate-y-[180deg] opacity-0 -z-10'}`}>
                      <div
                        className="absolute inset-0 grid grid-cols-2 gap-4 p-4 bg-gradient-to-br from-slate-800/90 to-slate-900/90 rounded-xl border border-slate-700 shadow-2xl"
                        style={{
                          backgroundImage: 'radial-gradient(rgba(255,255,255,0.06) 1px, transparent 1px)',
                          backgroundSize: '14px 14px',
                          backgroundBlendMode: 'overlay'
                        }}
                      >
                        {/* Brand butterflies overlay */}
                        <div className="pointer-events-none absolute inset-0 overflow-hidden">
                          <div className="absolute top-3 left-3 flex items-center gap-2 opacity-80">
                            <span className="text-xl animate-bounce">🦋</span>
                            <span className="text-[10px] uppercase tracking-widest text-pink-300/80">Memory of Journeys</span>
                          </div>
                          <span className="absolute top-8 right-6 text-2xl animate-pulse">🦋</span>
                          <span className="absolute bottom-8 left-10 text-xl animate-bounce [animation-duration:2.2s]">🦋</span>
                          <span className="absolute bottom-4 right-10 text-2xl animate-bounce [animation-duration:1.8s]">🦋</span>
                        </div>
                        {items.length === 0 ? (
                          <div className="col-span-2 flex items-center justify-center text-gray-400">Empty page</div>
                        ) : (
                          items.slice(0,4).map(ph => (
                            <figure key={ph.id} className="relative overflow-hidden rounded-lg group ring-1 ring-white/10 shadow-lg transition hover:shadow-[0_20px_80px_-30px_rgba(236,72,153,0.35)]">
                              <img src={ph.image_url} className="w-full h-52 object-cover transition-transform duration-500 group-hover:scale-[1.03]" />
                              <div className="absolute top-2 left-2 flex gap-2">
                                <button type="button" onClick={async()=>{ await fetch(`/api/albums/${encodeURIComponent(selectedAlbum.id)}/photos/${encodeURIComponent(ph.id)}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ page_number: Math.max(1, ph.page_number - 1), caption: ph.caption }) }); await loadPhotos(selectedAlbum.id); }} className="px-2 py-1 text-xs bg-slate-800/80 hover:bg-slate-800 text-white rounded">← Move</button>
                                <button type="button" onClick={async()=>{ await fetch(`/api/albums/${encodeURIComponent(selectedAlbum.id)}/photos/${encodeURIComponent(ph.id)}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ page_number: ph.page_number + 1, caption: ph.caption }) }); await loadPhotos(selectedAlbum.id); setActivePage(ph.page_number + 1); }} className="px-2 py-1 text-xs bg-slate-800/80 hover:bg-slate-800 text-white rounded">Move →</button>
                              </div>
                              <div className="absolute bottom-10 left-2 right-2 flex gap-2">
                                <input defaultValue={ph.caption || ''} onBlur={async(e)=>{ const newCap=(e.target as HTMLInputElement).value; await fetch(`/api/albums/${encodeURIComponent(selectedAlbum.id)}/photos/${encodeURIComponent(ph.id)}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ caption: newCap, page_number: ph.page_number }) }); }} placeholder="Caption" className="flex-1 px-2 py-1 text-xs rounded bg-black/40 text-white placeholder:text-gray-300" />
                              </div>
                              <button type="button" onClick={()=>handleDeletePhoto(ph)} className="absolute top-2 right-2 px-2 py-1 text-xs bg-red-600/80 hover:bg-red-600 text-white rounded">Delete</button>
                            </figure>
                          ))
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Page Notes / Journal */}
              <div className="mt-4 p-4 rounded-xl border border-slate-700 bg-slate-800/60">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-white font-semibold">Page {activePage} Notes</div>
                  <button
                    type="button"
                    onClick={async()=>{
                      try {
                        setSavingNotes(true);
                        const res = await fetch(`/api/albums/${encodeURIComponent(selectedAlbum.id)}/pages/${activePage}`,
                          { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ content: pageNotes[activePage] || '' }) }
                        );
                        if (!res.ok) {
                          const txt = await res.text().catch(()=> '');
                          throw new Error(`Save failed (${res.status}): ${txt}`);
                        }
                        await loadPages(selectedAlbum.id);
                      } catch (e:any) {
                        alert(e?.message || 'Failed to save notes');
                      } finally {
                        setSavingNotes(false);
                      }
                    }}
                    className="px-3 py-1 rounded bg-gradient-to-r from-emerald-500 to-teal-600 text-white disabled:opacity-40"
                    disabled={savingNotes}
                  >
                    {savingNotes ? 'Saving...' : 'Save Notes'}
                  </button>
                </div>
                <textarea value={pageNotes[activePage] || ''} onChange={e=>setPageNotes(prev=>({ ...prev, [activePage]: e.target.value }))} placeholder="Write about this page..." className="w-full min-h-[120px] px-3 py-2 rounded bg-slate-700 text-white" />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
