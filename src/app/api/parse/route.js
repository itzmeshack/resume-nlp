// src/app/api/parse/route.js
// Download from signed/public URL and extract text (PDF/DOCX/TXT)

export const dynamic = 'force-dynamic';

async function parsePdf(buffer) {
  const pdfParse = (await import('pdf-parse')).default;
  const data = await pdfParse(buffer);
  return data.text || '';
}
async function parseDocx(buffer) {
  const mammoth = await import('mammoth');
  const res = await mammoth.extractRawText({ buffer });
  return res?.value || '';
}
function isMostlyText(buffer) {
  const s = buffer.toString('utf8');
  const bad = (s.match(/[^\x09\x0A\x0D\x20-\x7E]/g)?.length || 0) / Math.max(s.length, 1);
  return bad < 0.02;
}

export async function POST(req) {
  try {
    const { url, filename } = await req.json();
    if (!url || !filename) {
      return new Response(JSON.stringify({ error: 'Missing url or filename' }), {
        status: 400, headers: { 'Content-Type': 'application/json' }
      });
    }

    const ext = filename.split('.').pop()?.toLowerCase() || '';
    const res = await fetch(url);
    if (!res.ok) {
      return new Response(JSON.stringify({ error: 'Could not fetch file' }), {
        status: 400, headers: { 'Content-Type': 'application/json' }
      });
    }
    const buf = Buffer.from(await res.arrayBuffer());

    let text = '';
    if (ext === 'pdf')      text = await parsePdf(buf);
    else if (ext === 'docx') text = await parseDocx(buf);
    else if (ext === 'txt')  text = isMostlyText(buf) ? buf.toString('utf8') : '';
    else                      text = isMostlyText(buf) ? buf.toString('utf8') : '';

    return new Response(JSON.stringify({ text }), {
      status: 200, headers: { 'Content-Type': 'application/json' }
    });
  } catch (e) {
    console.error('Parse error:', e);
    return new Response(JSON.stringify({ error: 'Parse failed' }), {
      status: 500, headers: { 'Content-Type': 'application/json' }
    });
  }
}
