// src/components/ScoreRing.jsx
'use client';

/**
 * Color-coded score ring
 * - 0–49   => red
 * - 50–74  => amber
 * - 75–100 => green
 *
 * Props:
 *  - value   : number 0..100
 *  - size    : px (default 72)
 *  - stroke  : ring thickness (default 8)
 *  - label   : right-side text label (default 'Match')
 *  - showLabel : boolean (default true)
 *  - className : extra class names
 */
export default function ScoreRing({
  value = 0,
  size = 72,
  stroke = 8,
  label = 'Match',
  showLabel = true,
  className = '',
}) {
  const v = clamp0to100(value);
  const { fg, text } = colorFor(v);

  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const dash = (v / 100) * c;

  return (
    <div
      className={`inline-flex items-center gap-3 select-none ${className}`}
      role="img"
      aria-label={`${label}: ${v} percent`}
      title={`${label}: ${v}%`}
    >
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {/* Track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke="#E5E7EB" /* gray-200 */
          strokeWidth={stroke}
          fill="none"
        />
        {/* Progress */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={fg}
          strokeWidth={stroke}
          fill="none"
          strokeDasharray={`${dash} ${c - dash}`}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          style={{
            transition: 'stroke-dasharray 600ms ease, stroke 200ms ease',
          }}
        />
        {/* Percentage */}
        <text
          x="50%"
          y="50%"
          dominantBaseline="middle"
          textAnchor="middle"
          fontSize={Math.round(size * 0.3)}
          fontWeight="700"
          fill={text}
        >
          {v}%
        </text>
      </svg>

      {showLabel && (
        <div className="leading-tight">
          <div className="text-xs text-gray-500">{label}</div>
          <div className="font-medium" style={{ color: text }}>{v}%</div>
        </div>
      )}
    </div>
  );
}

/* ---------------- helpers ---------------- */

function clamp0to100(n) {
  const num = Number.isFinite(+n) ? +n : 0;
  if (num < 0) return 0;
  if (num > 100) return 100;
  return Math.round(num);
}

function colorFor(v) {
  // Tailwind equivalents:
  // red-500  #EF4444
  // amber-500 #F59E0B
  // green-500 #22C55E
  if (v < 50) return { fg: '#EF4444', text: '#991B1B' };     // red ring, darker red text
  if (v < 75) return { fg: '#F59E0B', text: '#92400E' };     // amber ring, darker amber text
  return { fg: '#22C55E', text: '#065F46' };                 // green ring, darker green text
}
