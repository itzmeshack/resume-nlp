'use client';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import AppShell from '../../components/app/AppShell';
import { supabase } from '../../lib/supabaseClient';
import { Toaster, toast } from 'react-hot-toast';
import { Save, Trash2 } from 'lucide-react';

export default function SettingsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState('');
  const [email, setEmail] = useState('');

  const [settings, setSettings] = useState({
    creativity_level: 'medium',
    strict_ats_mode: false,
    notify_analysis_complete: true,
    notify_low_score: false,
    weekly_summary: false,
    pii_scrub: true,
    retention_days: 90,
    plan: 'Free',
  });

  const [showDeleteModal, setShowDeleteModal] = useState(false);




  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getSession();
      const uid = data?.session?.user?.id;
      const userEmail = data?.session?.user?.email;
      if (!uid) return;

      setUserId(uid);
      setEmail(userEmail);

      const { data: row } = await supabase
        .from('settings')
        .select('*')
        .eq('user_id', uid)
        .single();

      if (row?.payload) {
        setSettings(s => ({ ...s, ...row.payload }));
      }

      setLoading(false);
    })();
  }, []);

  async function save() {
    const { error } = await supabase
      .from('settings')
      .upsert({ user_id: userId, payload: settings }, { onConflict: 'user_id' });

    if (error) toast.error(error.message);
    else toast.success('Settings updated');
  }

async function deleteAccount() {
  try {
    toast.loading('Deleting account...');

    const res = await fetch('/api/delete-account', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId }),
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error);
    }

    await supabase.auth.signOut();

    router.replace('/');

  } catch (err) {
    toast.error(err.message);
  }
}
  if (loading) return null;

  return (
    <AppShell>
      <Toaster />
      <main className="min-h-screen bg-gradient-to-b from-gray-50 to-white text-black rounded-[1.5em]" >
        <div className="max-w-4xl mx-auto px-6 py-12 space-y-12">

          {/* HEADER */}
          <div className="flex justify-between items-start border-b border-gray-200 pb-6">
            <div>
              <h1 className="text-4xl font-bold tracking-tight">Settings</h1>
              <p className="text-sm mt-2 max-w-lg">
                Configure AI behavior, scoring preferences, notifications,
                and privacy controls to customize your resume analysis experience.
              </p>
            </div>

            <button
              onClick={save}
              className="inline-flex items-center gap-2 bg-red-500 text-white px-6 py-3 rounded-xl text-sm font-medium hover:opacity-90 transition"
            >
              <Save className="w-4 h-4" />
              Save Changes
            </button>
          </div>

          {/* AI BEHAVIOR */}
          <section className="bg-white border border-gray-200 rounded-3xl p-8 shadow-sm ">
            <h2 className="text-lg font-semibold mb-6">AI Behavior</h2>

            <div className="grid md:grid-cols-2 gap-8">

              <div>
                <label className="block text-sm mb-2 font-medium ">
                  Creativity Level
                </label>
               <select
  value={settings.creativity_level}
  onChange={e =>
    setSettings(s => ({ ...s, creativity_level: e.target.value }))
  }
  className="w-full rounded-xl border px-4 py-3 text-sm focus:outline-none "
>

                  <option value="low">Low — Safe & Structured</option>
                  <option value="medium">Medium — Balanced</option>
                  <option value="high">High — More Expressive</option>
                </select>
              </div>

              <div className="flex items-center">
                <label className="flex items-center gap-3 text-sm">
                  <input
                    type="checkbox"
                    checked={settings.strict_ats_mode}
                    onChange={e =>
                      setSettings(s => ({ ...s, strict_ats_mode: e.target.checked }))
                    }
                    className="w-4 h-4"
                  />
                  Enable Strict ATS Mode
                </label>
              </div>

            </div>
          </section>

          {/* NOTIFICATIONS */}
          <section className="bg-white border border-gray-200 rounded-3xl p-8 shadow-sm">
            <h2 className="text-lg font-semibold mb-6">Notifications</h2>

            <div className="space-y-4 text-sm">
              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={settings.notify_analysis_complete}
                  onChange={e =>
                    setSettings(s => ({ ...s, notify_analysis_complete: e.target.checked }))
                  }
                />
                Notify when resume analysis completes
              </label>

              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={settings.notify_low_score}
                  onChange={e =>
                    setSettings(s => ({ ...s, notify_low_score: e.target.checked }))
                  }
                />
                Alert me for low match scores
              </label>

              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={settings.weekly_summary}
                  onChange={e =>
                    setSettings(s => ({ ...s, weekly_summary: e.target.checked }))
                  }
                />
                Receive weekly performance summary
              </label>
            </div>
          </section>

          {/* PRIVACY */}
          <section className="bg-white border border-gray-200 rounded-3xl p-8 shadow-sm">
            <h2 className="text-lg font-semibold mb-6">Privacy & Data</h2>

            <div className="space-y-6">

              <label className="flex items-start gap-3 text-sm">
                <input
                  type="checkbox"
                  checked={settings.pii_scrub}
                  onChange={e =>
                    setSettings(s => ({ ...s, pii_scrub: e.target.checked }))
                  }
                  className="mt-1"
                />
                <div>
                  <div className="font-medium">Enable PII Protection</div>
                  <div className="text-xs text-gray-600">
                    Masks personal details during AI processing and system logging.
                  </div>
                </div>
              </label>

              <div>
                <label className="block text-sm mb-2 font-medium">
                  Data Retention (days)
                </label>
                <input
                  type="number"
                  value={settings.retention_days}
                  onChange={e =>
                    setSettings(s => ({ ...s, retention_days: Number(e.target.value) }))
                  }
                  className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm"
                />
              </div>

            </div>
          </section>

          {/* SUBSCRIPTION */}
          <section className="bg-white border border-gray-200 rounded-3xl p-8 shadow-sm">
            <h2 className="text-lg font-semibold mb-4">Subscription</h2>
            <div className="text-sm">
              Current Plan:
              <span className="ml-2 font-semibold">{settings.plan}</span>
            </div>
          </section>

          {/* DANGER ZONE */}
          <section className="bg-white border border-red-300 rounded-3xl p-8 shadow-sm">
            <h2 className="text-lg font-semibold mb-4 text-red-600">
              Danger Zone
            </h2>

           <button
  onClick={() => setShowDeleteModal(true)}
  className="inline-flex items-center gap-2 bg-red-600 text-white px-6 py-3 rounded-xl text-sm font-medium hover:opacity-90 transition"
>
  <Trash2 className="w-4 h-4" />
  Delete Account
</button>

          </section>

        </div>

        {showDeleteModal && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
    <div className="bg-white rounded-3xl shadow-xl w-full max-w-md p-8 text-black">
      
      <h3 className="text-xl font-semibold mb-4 text-black">
        Delete Account
      </h3>

      <p className="text-sm mb-6 text-black">
        This action is permanent and cannot be undone.
        Are you sure you want to continue?
      </p>

      <div className="flex justify-end gap-3">
        <button
          onClick={() => setShowDeleteModal(false)}
          className="px-5 py-2 rounded-xl border border-gray-300 text-sm"
        >
          Cancel
        </button>

        <button
          onClick={() => {
            setShowDeleteModal(false);
            deleteAccount();
          }}
          className="px-5 py-2 rounded-xl bg-red-600 text-white text-sm"
        >
          Yes, Delete
        </button>
      </div>

    </div>
  </div>
)}

      </main>
    </AppShell>
  );
}
