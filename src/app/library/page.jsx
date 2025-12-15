'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Toaster, toast } from 'react-hot-toast';
import {
  FolderOpen, Grid, List, Search, Download, Trash2,
  FileText, FileSpreadsheet, FileImage, FileCode, FileBox
} from 'lucide-react';
import AppShell from '../../components/app/AppShell';
import { supabase } from '../../lib/supabaseClient';

// --- File icons ---
function iconForMime(mime = '') {
  if (mime.includes('pdf')) return <FileText className="w-4 h-4" />;
  if (mime.includes('image')) return <FileImage className="w-4 h-4" />;
  if (mime.includes('spreadsheet') || mime.includes('excel')) return <FileSpreadsheet className="w-4 h-4" />;
  if (mime.includes('json') || mime.includes('text') || mime.includes('markdown') || mime.includes('code')) return <FileCode className="w-4 h-4" />;
  return <FileBox className="w-4 h-4" />;
}

export default function LibraryPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState(null);
  const [items, setItems] = useState([]);
  const [view, setView] = useState('list');
  const [q, setQ] = useState('');

  // --- Fetch session and load files ---
  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data: sess } = await supabase.auth.getSession();
      if (!sess?.session) {
        router.replace('/signin');
        return;
      }
      setSession(sess.session);
      await loadItems(sess.session.user.id);
      if (mounted) setLoading(false);
    })();
    return () => { mounted = false; };
  }, [router]);

  // --- Load files from storage ---
  async function loadItems(userId) {
    const bucket = 'resumes';
    try {
      const { data: files, error } = await supabase.storage.from(bucket).list(userId);
      if (error) throw error;

      const mappedItems = files.map(f => ({
        id: f.name,
        name: f.name,
        mime: f.mimetype || 'application/pdf',
        storage_path: `${userId}/${f.name}`,
      }));
      setItems(mappedItems);
    } catch (e) {
      toast.error(`Failed to load files: ${e.message}`);
    }
  }

  // --- Filter files ---
  const filtered = useMemo(() => {
    return items.filter(it => {
      if (!q) return true;
      return it.name.toLowerCase().includes(q.toLowerCase());
    });
  }, [items, q]);

  // --- Generate signed URL dynamically ---
  async function getFileUrl(item) {
    try {
      const { data, error } = await supabase.storage.from('resumes').createSignedUrl(item.storage_path, 300);
      if (error) throw error;
      return data.signedUrl;
    } catch (e) {
      toast.error(`Cannot get URL for ${item.name}: ${e.message}`);
      return null;
    }
  }

  // --- Download file ---
  async function handleDownload(item) {
    const url = await getFileUrl(item);
    if (!url) return;
    window.open(url, '_blank');
  }

// --- Delete file with confirmation toast ---
async function handleDelete(item) {
  toast((t) => (
    <div className="flex flex-col gap-2">
      <span>Are you sure you want to delete <strong>{item.name}</strong>?</span>
      <div className="flex justify-end gap-2">
        <button
          onClick={async () => {
            toast.dismiss(t.id);
            try {
              const { error } = await supabase.storage.from('resumes').remove([item.storage_path]);
              if (error) throw error;
              setItems(prev => prev.filter(x => x.id !== item.id));
              toast.success('Deleted successfully', { duration: 1000 }); // <-- 3 seconds
            } catch (e) {
              toast.error(`Delete failed: ${e.message}`);
            }
          }}
          className="px-3 py-1 bg-red-600 text-white rounded"
        >
          Yes
        </button>
        <button
          onClick={() => toast.dismiss(t.id)}
          className="px-3 py-1 bg-gray-300 rounded"
        >
          No
        </button>
      </div>
    </div>
  ), { duration: Infinity });
}


  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;

  return (
    <AppShell>
      <Toaster />

      {/* Header */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-2">
          <FolderOpen className="w-6 h-6 text-white-700" />
          <h1 className="text-2xl md:text-3xl font-bold text-white-900">Resume Library</h1>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setView('list')} className={`p-2 rounded-lg border ${view==='list' ? 'bg-gray-900 text-white' : 'bg-white text-gray-700'}`}>
            <List className="w-4 h-4" />
          </button>
          <button onClick={() => setView('grid')} className={`p-2 rounded-lg border ${view==='grid' ? 'bg-gray-900 text-white' : 'bg-white text-gray-700'}`}>
            <Grid className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="mb-6 flex gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
          <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search…" className="w-full rounded-lg border border-gray-200 pl-9 pr-3 py-2 text-sm"/>
        </div>
      </div>

      {/* List View */}
      {view === 'list' && (
        <div className="bg-black" style={{ borderBottomLeftRadius: '10px', borderBottomRightRadius: '10px' }}>
          <table className="min-w-full border rounded-2xl overflow-hidden text-sm">
            <thead>
              <tr className="bg-gray-50 text-gray-500">
                <th className="px-4 py-2 text-left">Name</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(it => (
                <tr key={it.id} className="border-t border-gray-200/60">
                  <td className="px-4 py-3 flex items-center gap-2">{iconForMime(it.mime)}<span className="truncate text-lg">{it.name}</span></td>
                  <td className="px-4 py-3 flex justify-end gap-4">
                    <button onClick={() => handleDownload(it)} className="text-gray-700 hover:text-red-900 cursor-pointer flex items-center gap-1"><Download className="w-5 h-5" /> Download</button>
                    <button onClick={() => handleDelete(it)} className="text-red-600 hover:text-red-700 flex items-center gap-1"><Trash2 className="w-5 h-5" /> Delete</button>
                  </td>
                </tr>
              ))}
              {!filtered.length && <tr><td colSpan={2} className="px-4 py-8 text-center text-gray-500">No resumes yet.</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      {/* Grid View */}
      {view === 'grid' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {filtered.map(it => (
            <div key={it.id} className="rounded-2xl border bg-black p-4 flex flex-col justify-between h-32">
              <div className="flex items-center gap-2">{iconForMime(it.mime)}<div className="font-semibold truncate">{it.name}</div></div>
              <div className="mt-3 flex justify-end gap-2">
                <button onClick={() => handleDownload(it)} className="px-3 py-1 text-xs border rounded flex items-center gap-1"><Download className="w-3 h-3" /> Download</button>
                <button onClick={() => handleDelete(it)} className="px-3 py-1 text-xs border rounded flex items-center gap-1 text-red-600"><Trash2 className="w-3 h-3" /> Delete</button>
              </div>
            </div>
          ))}
          {!filtered.length && <div className="col-span-full text-center text-gray-500 mt-10 text-lg">No resumes yet.</div>}
        </div>
      )}
    </AppShell>
  );
}
