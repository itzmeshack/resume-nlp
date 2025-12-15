// src/app/ai-tools/components/BulletRewriterTool.jsx
'use client';

import { useState, useMemo } from 'react';
import { RefreshCcw, Copy } from 'lucide-react';
import { toast } from 'react-hot-toast';

/* Reuse simple diff-highlighter for emphasis */
function escapeHtml(s=''){return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')}
function tokenizeForDiff(s=''){const re=/([A-Za-z0-9+#./-]+|[^\sA-Za-z0-9]+|\s+)/g;const out=[];let m;while((m=re.exec(s))!==null)out.push(m[0]);return out.length?out:[s]}
function diffTokens(a,b){const n=a.length,m=b.length,dp=Array.from({length:n+1},()=>new Array(m+1).fill(0));for(let i=n-1;i>=0;i--){for(let j=m-1;j>=0;j--){dp[i][j]=(a[i]===b[j])?dp[i+1][j+1]+1:Math.max(dp[i+1][j],dp[i][j+1]);}}const out=[];let i=0,j=0;while(i<n&&j<m){if(a[i]===b[j]){out.push({type:'equal',text:a[i]});i++;j++;}else if(dp[i+1][j]>=dp[i][j+1]){out.push({type:'del',text:a[i++]});}else{out.push({type:'add',text:b[j++]});}}while(i<n)out.push({type:'del',text:a[i++]});while(j<m)out.push({type:'add',text:b[j++]});return out}
function highlightRewrite(original='',suggestion=''){const a=tokenizeForDiff(original),b=tokenizeForDiff(suggestion),ops=diffTokens(a,b);let html='';for(const op of ops){const t=escapeHtml(op.text);if(op.type==='equal'){html+=t;}else if(op.type==='add'){html+=/^\s+$/.test(op.text)?t:`<mark class="bg-yellow-200 rounded px-0.5">${t}</mark>`;}}return html}

export default function BulletRewriterTool() {
  const [bullets, setBullets] = useState('');
  const [context, setContext] = useState('Target role / JD summary here…');
  const [busy, setBusy] = useState(false);
  const [rewrites, setRewrites] = useState([]);

  const run = async () => {
    try {
      const resumeText = (bullets || '').trim();
      const jdText = (context || '').trim();
      if (!resumeText || !jdText) {
        toast.error('Paste bullets and a role/JD context.');
        return;
      }
      setBusy(true);
      const variantId = `rewrite_${Date.now()}`;
      const res = await fetch('/api/ai-analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resumeText, jdText, variantId, mode: 'focused' }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Rewrite failed');

      const rows = (data?.rewrites || []).map(r => ({
        original: r.original || '',
        suggestion: r.suggestion || '',
        suggHtml: highlightRewrite(r.original || '', r.suggestion || '')
      }));
      setRewrites(rows);
      toast.success('Rewrites ready');
    } catch (e) {
      console.error(e);
      toast.error(e.message || 'Rewrite failed');
    } finally {
      setBusy(false);
    }
  };

  const hasRows = useMemo(() => rewrites && rewrites.length > 0, [rewrites]);

  return (
    <div className="space-y-6 text-black">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded-xl border border-gray-300 bg-white p-4">
          <h3 className="font-semibold mb-2 text-sm sm:text-base">Paste bullets</h3>
          <textarea
            value={bullets}
            onChange={(e) => setBullets(e.target.value)}
            className="w-full border border-gray-300 rounded p-2 text-sm min-h-[160px] focus:outline-none focus:ring-2 focus:ring-black"
            placeholder={`• Led migration to ...\n• Improved SLA by ...`}
          />
        </div>
        <div className="rounded-xl border border-gray-300 bg-white p-4">
          <h3 className="font-semibold mb-2 text-sm sm:text-base">Role / JD context</h3>
          <textarea
            value={context}
            onChange={(e) => setContext(e.target.value)}
            className="w-full border border-gray-300 rounded p-2 text-sm min-h-[160px] focus:outline-none focus:ring-2 focus:ring-black"
            placeholder="Paste a short JD or describe the role, so rewrites align precisely."
          />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={run}
          disabled={busy}
          className="inline-flex items-center gap-2 rounded-xl bg-black text-white px-4 py-2 text-sm font-medium hover:bg-black/90 disabled:opacity-50"
        >
          <RefreshCcw className={`w-4 h-4 ${busy ? 'animate-spin' : ''}`} />
          {busy ? 'Rewriting…' : 'Rewrite Bullets'}
        </button>
      </div>

      {hasRows ? (
        <div className="space-y-3">
          {rewrites.map((r, idx) => (
            <div key={idx} className="rounded-xl border border-gray-200 bg-white p-3">
              <div className="text-xs text-gray-500 mb-1">Original</div>
              <div className="text-sm text-gray-800">{r.original}</div>
              <div className="text-xs text-gray-500 mt-3 mb-1">Suggested (changes highlighted)</div>
              <div className="text-sm font-medium" dangerouslySetInnerHTML={{ __html: r.suggHtml }} />
              <div className="mt-2">
                <button
                  onClick={async () => { await navigator.clipboard.writeText(r.suggestion); toast.success('Copied'); }}
                  className="inline-flex items-center gap-1 rounded-lg border border-gray-300 px-2.5 py-1 text-xs hover:bg-gray-100"
                >
                  <Copy className="w-3.5 h-3.5" /> Copy
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-gray-300 bg-white p-4 text-sm text-gray-700">
          Paste bullets and context, then click <strong>Rewrite Bullets</strong>.
        </div>
      )}
    </div>
  );
}
