'use client';

import { useEffect, useState } from 'react';
import AppShell from '../../components/app/AppShell';
import { supabase } from '../../lib/supabaseClient';
import { Toaster, toast } from 'react-hot-toast';
import { Save, TestTube2 } from 'lucide-react';

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState('');
  const [settings, setSettings] = useState({
    use_groq: true,
    groq_model: 'llama-3.3-70b-versatile',
    gemini_fallback: true,
    industry_config_url: '',
    scoring_weights: { coverage: 0.6, ats: 0.3, similarity: 0.1 },
    retention_days: 90,
    pii_scrub: true,
    brand_name: '',
    brand_primary: '#2563eb',
    webhook_url: '',
  });

  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      const uid = sessionData?.session?.user?.id;
      if (!uid) {
        toast.error('No session'); return;
      }
      setUserId(uid);

      const { data } = await supabase.from('settings').select('*').eq('user_id', uid).single();
      if (data?.payload) {
        setSettings({ ...settings, ...data.payload });
      }
      if (mounted) setLoading(false);
    })();
    return () => { mounted = false; };
  }, []);

  async function save() {
    const payload = { ...settings };
    const { error } = await supabase.from('settings')
      .upsert({ user_id: userId, payload }, { onConflict: 'user_id' });
    if (error) toast.error(error.message);
    else toast.success('Saved');
  }

  async function testIndustryConfig() {
    if (!settings.industry_config_url) {
      toast.error('Set Industry Config URL first');
      return;
    }
    try {
      const res = await fetch(settings.industry_config_url, { cache: 'no-store' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      const seedsCount = Object.values(json.seeds || {}).reduce((a, arr) => a + (Array.isArray(arr) ? arr.length : 0), 0);
      const signsCount = Array.isArray(json.signs) ? json.signs.length : 0;
      toast.success(`OK — seeds: ${seedsCount}, signs: ${signsCount}`);
    } catch (e) {
      toast.error(`Failed: ${e.message}`);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-white to-gray-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-24">
          <div className="animate-pulse h-10 w-56 rounded-xl bg-gray-200 mb-6" />
          <div className="animate-pulse h-64 rounded-2xl bg-gray-200" />
        </div>
      </main>
    );
  }

  return (
    <AppShell>
      <Toaster />
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-gray-900">Settings</h1>
          <p className="text-gray-500">Control models, scoring, privacy, and integrations.</p>
        </div>
        <button onClick={save} className="inline-flex items-center gap-2 rounded-xl bg-blue-600 text-white px-4 py-2 text-sm hover:bg-blue-700">
          <Save className="w-4 h-4" /> Save
        </button>
      </div>

      <div className="space-y-6">
        {/* Models & Providers */}
        <section className="rounded-2xl border border-white/20 bg-white/70 backdrop-blur-xl p-5">
          <h3 className="font-semibold text-gray-900">Models & Providers</h3>
          <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-4">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={settings.use_groq}
                onChange={e => setSettings(s => ({ ...s, use_groq: e.target.checked }))}
              />
              <span className="text-sm text-gray-700">Use Groq as primary</span>
            </label>

            <input
              value={settings.groq_model}
              onChange={e => setSettings(s => ({ ...s, groq_model: e.target.value }))}
              placeholder="Groq model"
              className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
            />

            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={settings.gemini_fallback}
                onChange={e => setSettings(s => ({ ...s, gemini_fallback: e.target.checked }))}
              />
              <span className="text-sm text-gray-700">Enable Gemini fallback</span>
            </label>
          </div>
        </section>

        {/* Taxonomy / Industry config */}
        <section className="rounded-2xl border border-white/20 bg-white/70 backdrop-blur-xl p-5">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-gray-900">Industry Taxonomy</h3>
            <button onClick={testIndustryConfig} className="inline-flex items-center gap-1 text-sm rounded-md border px-2 py-1">
              <TestTube2 className="w-4 h-4" /> Test URL
            </button>
          </div>
          <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              value={settings.industry_config_url}
              onChange={e => setSettings(s => ({ ...s, industry_config_url: e.target.value }))}
              placeholder="https://…/industry-config.json"
              className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
            />
            <div className="text-xs text-gray-500">
              Host a JSON with <code>seeds</code> and <code>signs</code>. The API will fetch & cache it.
            </div>
          </div>
        </section>

        {/* Scoring weights */}
        <section className="rounded-2xl border border-white/20 bg-white/70 backdrop-blur-xl p-5">
          <h3 className="font-semibold text-gray-900">Scoring Weights</h3>
          <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-4">
            {(['coverage','ats','similarity']).map((k)=>(
              <div key={k}>
                <label className="text-sm text-gray-700 capitalize">{k} ({settings.scoring_weights[k]})</label>
                <input
                  type="range" min="0" max="1" step="0.05"
                  value={settings.scoring_weights[k]}
                  onChange={e => {
                    const v = Number(e.target.value);
                    setSettings(s => ({ ...s, scoring_weights: { ...s.scoring_weights, [k]: v }}));
                  }}
                  className="w-full"
                />
              </div>
            ))}
          </div>
          <div className="mt-2 text-xs text-gray-500">Tip: coverage usually has the highest weight.</div>
        </section>

        {/* Privacy & retention */}
        <section className="rounded-2xl border border-white/20 bg-white/70 backdrop-blur-xl p-5">
          <h3 className="font-semibold text-gray-900">Privacy & Retention</h3>
          <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-4">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={settings.pii_scrub}
                onChange={e => setSettings(s => ({ ...s, pii_scrub: e.target.checked }))}
              />
              <span className="text-sm text-gray-700">PII scrubbing in logs</span>
            </label>
            <div>
              <label className="text-sm text-gray-700">Retention days</label>
              <input
                type="number"
                min={0}
                value={settings.retention_days}
                onChange={e => setSettings(s => ({ ...s, retention_days: Number(e.target.value) }))}
                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
              />
            </div>
          </div>
        </section>

        {/* Branding */}
        <section className="rounded-2xl border border-white/20 bg-white/70 backdrop-blur-xl p-5">
          <h3 className="font-semibold text-gray-900">Branding</h3>
          <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-4">
            <input
              value={settings.brand_name}
              onChange={e => setSettings(s => ({ ...s, brand_name: e.target.value }))}
              placeholder="Brand name"
              className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
            />
            <div>
              <label className="text-sm text-gray-700">Primary color</label>
              <input
                type="color"
                value={settings.brand_primary}
                onChange={e => setSettings(s => ({ ...s, brand_primary: e.target.value }))}
                className="w-12 h-9 p-0 border border-gray-200 rounded-lg"
              />
            </div>
          </div>
        </section>

        {/* Webhooks */}
        <section className="rounded-2xl border border-white/20 bg-white/70 backdrop-blur-xl p-5">
          <h3 className="font-semibold text-gray-900">Webhooks</h3>
          <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              value={settings.webhook_url}
              onChange={e => setSettings(s => ({ ...s, webhook_url: e.target.value }))}
              placeholder="https://your-webhook.com/hook"
              className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
            />
            <div className="text-xs text-gray-500">Receive notifications on project status changes, low scores, etc.</div>
          </div>
        </section>
      </div>
    </AppShell>
  );
}
