'use client';
export default function ScoreRing({ value=0, size=80, stroke=10, label=null }) {
  const pct = Math.max(0, Math.min(100, Number(value) || 0));
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const dash = (pct / 100) * c;
  const color = pct>=80 ? '#16a34a' : pct>=60 ? '#eab308' : '#ef4444';
  return (
    <div className="flex items-center justify-center" style={{ width:size, height:size }}>
      <svg width={size} height={size}>
        <circle cx={size/2} cy={size/2} r={r} stroke="#e5e7eb" strokeWidth={stroke} fill="none" />
        <circle cx={size/2} cy={size/2} r={r} stroke={color} strokeWidth={stroke} fill="none"
          strokeDasharray={`${dash} ${c - dash}`} strokeLinecap="round"
          transform={`rotate(-90 ${size/2} ${size/2})`} />
        <text x="50%" y="50%" dominantBaseline="middle" textAnchor="middle"
          style={{ fontWeight:700, fontSize: size*0.26, fill:'#111827' }}>
          {pct}%
        </text>
      </svg>
    </div>
  );
}
