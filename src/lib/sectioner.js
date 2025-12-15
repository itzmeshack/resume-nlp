// src/lib/sectioner.js
// Zero-dependency resume section parser + basic skills extractor.
// to hold all heading aliases for gemini to properly read the code 

const HEADING_ALIASES = {
  summary: [/^(professional )?summary$|^profile$|^objective$/i],
  skills: [/^skills( & tools)?$|^technical skills$|^skills & technologies$|^tools|^technologies$/i],
  experience: [/^(work )?experience$|^employment$|^career history$|^professional experience$/i],
  projects: [/^projects?$|^selected projects$/i],
  education: [/^education$|^academics?$/i],
  certifications: [/^certifications?$|^certs$|^licenses?$/i],
  awards: [/^awards?$|^honors?$/i],
  publications: [/^publications?$/i],
  references: [/^references?$|^referees?$/i],
  contact: [/^contact$|^about$/i],
};

const CANON_ORDER = [
  'contact', 'summary', 'skills', 'experience', 'projects',
  'education', 'certifications', 'awards', 'publications', 'references'
];

const IS_HEADING_LINE = (line) => {
  const t = (line || '').trim();
  if (!t) return false;
  const looksLikeHeading =
    t.length <= 48 &&
    (/^[A-Z][A-Za-z ]+$/.test(t) || /^[A-Z\s&/-]+$/.test(t)) && // Title or FULL CAPS
    !/[.:,]$/.test(t);
  // Also accept lines with trailing colon (e.g., "SKILLS:")
  return looksLikeHeading || /^[A-Za-z &/-]{2,}:$/.test(t);
};

function canonKeyFromHeading(h) {
  const t = (h || '').replace(/:$/, '').trim();
  for (const [key, regs] of Object.entries(HEADING_ALIASES)) {
    if (regs.some(r => r.test(t))) return key;
  }
  return null;
}

export function parseResumeSections(text = '') {
  const lines = String(text || '').replace(/\r/g, '').split('\n');
  const blockIdx = [];
  for (let i = 0; i < lines.length; i++) {
    if (IS_HEADING_LINE(lines[i])) blockIdx.push(i);
  }
  // Ensure 0 as a start if first lines are content
  if (blockIdx[0] !== 0) blockIdx.unshift(0);

  const sections = {};
  const headings = [];

  for (let b = 0; b < blockIdx.length; b++) {
    const start = blockIdx[b];
    const end = b + 1 < blockIdx.length ? blockIdx[b + 1] : lines.length;
    const headLine = (lines[start] || '').replace(/:$/, '').trim();
    const guessKey = canonKeyFromHeading(headLine);
    const key = guessKey || 'unknown';

    const contentLines = guessKey ? lines.slice(start + 1, end) : lines.slice(start, end);
    const content = trimBlankEdges(contentLines).join('\n');

    if (!sections[key]) sections[key] = [];
    sections[key].push({ heading: headLine, text: content });
    if (guessKey) headings.push({ key, heading: headLine });
  }

  // Build stable order using CANON_ORDER then the rest
  const seen = new Set();
  const order = [];
  for (const key of CANON_ORDER) if (sections[key]) { order.push(key); seen.add(key); }
  for (const key of Object.keys(sections)) if (!seen.has(key)) order.push(key);

  return { sections, order, headings };
}

function trimBlankEdges(arr) {
  let a = 0, b = arr.length;
  while (a < b && !arr[a].trim()) a++;
  while (b > a && !arr[b - 1].trim()) b--;
  return arr.slice(a, b);
}

export function extractSkillsBlock(skillsText = '') {
  // Support comma lists, semicolon, bullets
  const raw = skillsText
    .split(/\n+/)
    .map(l => l.replace(/^[•\-*]\s*/, '').trim())
    .filter(Boolean)
    .join(', ');

  return raw
    .split(/[;,]/)
    .flatMap(s => s.split(/\s{2,}/)) // sometimes double-spaced skills
    .map(s => s.trim())
    .filter(Boolean);
}

export function stringifySections({ sections, order }) {
  // Reassemble a clean resume with canonical headings (keep original headings if present)
  const parts = [];
  for (const key of order) {
    for (const blk of sections[key]) {
      const heading = blk.heading || titleFor(key);
      parts.push(heading.toUpperCase());
      if (blk.text) parts.push(blk.text);
    }
  }
  return parts.join('\n\n').replace(/\n{3,}/g, '\n\n');
}

function titleFor(key) {
  switch (key) {
    case 'summary': return 'Professional Summary';
    case 'skills': return 'Skills';
    case 'experience': return 'Experience';
    case 'projects': return 'Projects';
    case 'education': return 'Education';
    case 'certifications': return 'Certifications';
    case 'awards': return 'Awards';
    case 'publications': return 'Publications';
    case 'references': return 'References';
    case 'contact': return 'Contact';
    default: return key[0].toUpperCase() + key.slice(1);
  }
}
