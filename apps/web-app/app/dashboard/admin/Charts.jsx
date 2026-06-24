// app/dashboard/admin/Charts.jsx
//
// Pure inline-SVG chart components — no third-party charting library.
// Two visuals are enough for the current admin overview:
//   - <AreaLineChart/> : two-series area-line chart over 30 days
//                        (signups + bookings)
//   - <Donut/>         : status breakdown ring (e.g. active/pending/rejected)
//
// Kept dependency-free on purpose. recharts/chart.js would balloon the
// admin bundle for two charts we can comfortably draw with <path>.

"use client";

import styles from "./admin.module.css";

/**
 * Area-line chart.
 * @param {{ day: string, signups: number, bookings: number }[]} data
 *   30 entries (one per day) is the assumed shape, but the chart works
 *   with any length.
 */
export function AreaLineChart({ data }) {
  const width = 720;
  const height = 220;
  const padding = { top: 16, right: 16, bottom: 28, left: 32 };
  const innerW = width - padding.left - padding.right;
  const innerH = height - padding.top - padding.bottom;

  const safe = Array.isArray(data) && data.length ? data : [];
  const maxRaw = Math.max(
    1,
    ...safe.map((d) => Math.max(d.signups || 0, d.bookings || 0)),
  );
  // Round the max up to a nicer y-axis tick (2 → 2, 3 → 4, 7 → 8, 12 → 15…).
  const maxY = niceCeil(maxRaw);

  const xFor = (i) =>
    padding.left +
    (safe.length <= 1 ? innerW / 2 : (i * innerW) / (safe.length - 1));
  const yFor = (v) => padding.top + innerH - (v / maxY) * innerH;

  const linePath = (key) =>
    safe
      .map((d, i) => `${i === 0 ? "M" : "L"}${xFor(i)},${yFor(d[key] || 0)}`)
      .join(" ");

  const areaPath = (key) => {
    if (!safe.length) return "";
    const top = linePath(key);
    const last = xFor(safe.length - 1);
    const first = xFor(0);
    const base = padding.top + innerH;
    return `${top} L${last},${base} L${first},${base} Z`;
  };

  // y-axis gridlines at 0, 1/3, 2/3, max.
  const yTicks = [0, maxY / 3, (2 * maxY) / 3, maxY].map((v) => ({
    v,
    y: yFor(v),
    label: formatTick(v),
  }));

  // Only label every ~5th day on the x-axis so it doesn't overlap.
  const xTicks = safe
    .map((d, i) => ({ d, i }))
    .filter(({ i }) => i === 0 || i === safe.length - 1 || i % 5 === 0);

  return (
    <svg
      className={styles.chartSvg}
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
      role="img"
      aria-label="Daily signups and bookings, last 30 days"
    >
      <defs>
        <linearGradient id="adm-green" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--color-primary)" stopOpacity="0.32" />
          <stop offset="100%" stopColor="var(--color-primary)" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="adm-amber" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#f4a261" stopOpacity="0.28" />
          <stop offset="100%" stopColor="#f4a261" stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* gridlines */}
      {yTicks.map((t, i) => (
        <line
          key={`g${i}`}
          x1={padding.left}
          x2={width - padding.right}
          y1={t.y}
          y2={t.y}
          className={styles.chartGridLine}
        />
      ))}

      {/* y-axis labels */}
      {yTicks.map((t, i) => (
        <text
          key={`yl${i}`}
          x={padding.left - 8}
          y={t.y + 4}
          textAnchor="end"
          className={styles.chartAxisLabel}
        >
          {t.label}
        </text>
      ))}

      {/* x-axis labels (month-day) */}
      {xTicks.map(({ d, i }) => (
        <text
          key={`xl${i}`}
          x={xFor(i)}
          y={height - 8}
          textAnchor="middle"
          className={styles.chartAxisLabel}
        >
          {shortDay(d.day)}
        </text>
      ))}

      {/* signups (green) */}
      <path d={areaPath("signups")} fill="url(#adm-green)" />
      <path
        d={linePath("signups")}
        fill="none"
        stroke="var(--color-primary)"
        strokeWidth="2"
        strokeLinejoin="round"
        strokeLinecap="round"
      />

      {/* bookings (amber) */}
      <path d={areaPath("bookings")} fill="url(#adm-amber)" />
      <path
        d={linePath("bookings")}
        fill="none"
        stroke="#f4a261"
        strokeWidth="2"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  );
}

/**
 * Donut chart for status breakdowns.
 * @param {{label: string, value: number, color: string}[]} segments
 */
export function Donut({ segments, centerValue, centerLabel }) {
  const size = 220;
  const radius = 90;
  const thickness = 26;
  const cx = size / 2;
  const cy = size / 2;
  const safe = Array.isArray(segments) ? segments.filter((s) => s.value > 0) : [];
  const total = safe.reduce((sum, s) => sum + s.value, 0) || 1;

  let acc = 0;
  const arcs = safe.map((s) => {
    const startAngle = (acc / total) * Math.PI * 2 - Math.PI / 2;
    acc += s.value;
    const endAngle = (acc / total) * Math.PI * 2 - Math.PI / 2;
    return { ...s, d: arcPath(cx, cy, radius, startAngle, endAngle) };
  });

  return (
    <svg
      className={styles.donutSvg}
      viewBox={`0 0 ${size} ${size}`}
      role="img"
      aria-label="Doctor status breakdown"
    >
      <circle
        cx={cx}
        cy={cy}
        r={radius}
        fill="none"
        stroke="var(--color-surface-alt)"
        strokeWidth={thickness}
      />
      {arcs.map((a, i) => (
        <path
          key={i}
          d={a.d}
          stroke={a.color}
          strokeWidth={thickness}
          fill="none"
          strokeLinecap="butt"
        />
      ))}
      <text
        x={cx}
        y={cy - 2}
        textAnchor="middle"
        className={styles.donutCenter}
      >
        {centerValue}
      </text>
      <text
        x={cx}
        y={cy + 22}
        textAnchor="middle"
        className={styles.donutCenterSub}
      >
        {centerLabel}
      </text>
    </svg>
  );
}

/* ── Helpers ──────────────────────────────────────────────────────────── */

function niceCeil(n) {
  if (n <= 1) return 1;
  const pow = Math.pow(10, Math.floor(Math.log10(n)));
  const norm = n / pow;
  let nice;
  if (norm <= 1) nice = 1;
  else if (norm <= 2) nice = 2;
  else if (norm <= 5) nice = 5;
  else nice = 10;
  return nice * pow;
}

function formatTick(v) {
  if (v >= 1000) return `${(v / 1000).toFixed(v % 1000 ? 1 : 0)}k`;
  return String(Math.round(v));
}

function shortDay(iso) {
  if (!iso) return "";
  const [, m, d] = iso.split("-");
  if (!m || !d) return iso;
  return `${Number(m)}/${Number(d)}`;
}

function arcPath(cx, cy, r, startAngle, endAngle) {
  const x1 = cx + r * Math.cos(startAngle);
  const y1 = cy + r * Math.sin(startAngle);
  const x2 = cx + r * Math.cos(endAngle);
  const y2 = cy + r * Math.sin(endAngle);
  const largeArc = endAngle - startAngle > Math.PI ? 1 : 0;
  return `M${x1},${y1} A${r},${r} 0 ${largeArc} 1 ${x2},${y2}`;
}
