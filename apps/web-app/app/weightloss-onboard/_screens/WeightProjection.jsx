"use client";

import { formatUsDate } from "@/lib/dates/usDate";

export default function WeightProjection({ currentLbs, goalLbs }) {
  const lossLbs = Math.max(1, Math.round(currentLbs - goalLbs));
  const months = 3;

  const endDate = new Date();
  endDate.setMonth(endDate.getMonth() + months);
  const endDateStr = formatUsDate(endDate, "");

  const W = 600;
  const H = 310;
  const PAD_X = 48;
  const PAD_TOP = 68;
  const PAD_BOTTOM = 108;

  const wMax = currentLbs;
  const wMin = goalLbs - lossLbs * 0.08;

  const wToY = (w) => {
    const inner = H - PAD_TOP - PAD_BOTTOM;
    return PAD_TOP + ((wMax - w) / (wMax - wMin)) * inner;
  };

  const x0 = PAD_X;
  const xMid = W * 0.5;
  const xEnd = W - PAD_X;

  const yStart = wToY(currentLbs);
  const yEnd = wToY(goalLbs);

  const glpEndLbs = currentLbs - lossLbs * 0.6;
  const yGlpEnd = wToY(glpEndLbs);

  const ourPath = `M ${x0},${yStart} C ${x0 + 140},${yStart} ${xEnd - 220},${yEnd + 18} ${xEnd},${yEnd}`;
  const glpPath = `M ${x0},${yStart} C ${x0 + 120},${yStart - 4} ${xEnd - 180},${yGlpEnd + 30} ${xEnd},${yGlpEnd}`;

  return (
    <div className="proj-card">
      <div className="proj-blob proj-blob-a" aria-hidden />
      <div className="proj-blob proj-blob-b" aria-hidden />

      <div className="proj-head">
        <h2 className="proj-title">
          Lose <strong>{lossLbs} lbs</strong>
          <br />
          in <span className="proj-pill">{months} months</span>
        </h2>
        <p className="proj-sub">
          Members with your profile have hit this goal. Your dose, plan &amp;
          timeline are calibrated to match.
        </p>
      </div>

      <div className="proj-chart">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          preserveAspectRatio="xMidYMid meet"
          xmlns="http://www.w3.org/2000/svg"
        >
          <line
            className="proj-guide"
            x1={x0} y1={yStart + 32} x2={x0} y2={H - PAD_BOTTOM + 16}
            stroke="rgba(255,255,255,0.18)" strokeWidth="1" strokeDasharray="3 4"
          />
          <line
            className="proj-guide proj-guide-2"
            x1={xMid} y1={PAD_TOP - 10} x2={xMid} y2={H - PAD_BOTTOM + 16}
            stroke="rgba(255,255,255,0.18)" strokeWidth="1" strokeDasharray="3 4"
          />
          <line
            className="proj-guide proj-guide-3"
            x1={xEnd} y1={yEnd - 10} x2={xEnd} y2={H - PAD_BOTTOM + 16}
            stroke="rgba(255,255,255,0.18)" strokeWidth="1" strokeDasharray="3 4"
          />

          <path
            className="proj-curve proj-curve-glp"
            d={glpPath}
            fill="none"
            stroke="rgba(255,255,255,0.55)"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeDasharray="6 5"
            pathLength={1}
          />
          <g className="proj-glp-marker">
            <circle cx={xEnd} cy={yGlpEnd} r="6" fill="rgba(255,255,255,0.85)" />
            <circle cx={xEnd} cy={yGlpEnd} r="11" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" />
            <text
              x={xEnd - 16}
              y={yGlpEnd - 12}
              fill="rgba(255,255,255,0.9)"
              fontSize="11"
              fontWeight="600"
              textAnchor="end"
            >
              GLP-1 Alone
            </text>
          </g>

          <path
            className="proj-curve proj-curve-ours"
            d={ourPath}
            fill="none"
            stroke="#FFFFFF"
            strokeWidth="3.5"
            strokeLinecap="round"
            pathLength={1}
          />

          <text className="proj-axis" x={x0} y={H - 22} fill="rgba(255,255,255,0.7)" fontSize="11.5" textAnchor="middle" fontWeight="500">
            Today
          </text>
          <text className="proj-axis proj-axis-2" x={xMid} y={H - 22} fill="rgba(255,255,255,0.7)" fontSize="11.5" textAnchor="middle" fontWeight="500">
            1.5 mo
          </text>
          <text className="proj-axis proj-axis-3" x={xEnd} y={H - 22} fill="rgba(255,255,255,0.7)" fontSize="11.5" textAnchor="middle" fontWeight="500">
            {endDateStr}
          </text>

          <g transform={`translate(${x0}, ${yStart})`}>
            <g className="proj-pill-start">
              <circle r="4" fill="#FFFFFF" />
              <g transform="translate(0, -42)">
                <rect x="-30" y="-18" width="60" height="36" rx="18" fill="#1b4332" stroke="rgba(255,255,255,0.25)" strokeWidth="1" />
                <text y="-2" textAnchor="middle" fill="#FFFFFF" fontSize="13" fontWeight="700">
                  {Math.round(currentLbs)}
                </text>
                <text y="11" textAnchor="middle" fill="rgba(255,255,255,0.75)" fontSize="9" fontWeight="500" letterSpacing="0.5">
                  Lbs
                </text>
              </g>
            </g>
          </g>

          <g transform={`translate(${xEnd}, ${yEnd})`}>
            <g className="proj-pill-end">
              <circle r="5" fill="#FFFFFF" />
              <g transform="translate(-72, 12)">
                <rect x="-72" y="0" width="144" height="58" rx="20" fill="#1b4332" stroke="rgba(255,255,255,0.3)" strokeWidth="1" />
                <text x="0" y="16" textAnchor="middle" fill="rgba(255,255,255,0.85)" fontSize="10.5" fontStyle="italic" fontWeight="600">
                  Ongo
                </text>
                <text x="0" y="36" textAnchor="middle" fill="#FFFFFF" fontSize="18" fontWeight="700">
                  {Math.round(goalLbs)}
                  <tspan fontSize="10" fontWeight="500" fill="rgba(255,255,255,0.75)" dx="3"> Lbs</tspan>
                </text>
                <text x="0" y="50" textAnchor="middle" fill="rgba(255,255,255,0.7)" fontSize="10" fontWeight="500">
                  Your goal
                </text>
              </g>
            </g>
          </g>
        </svg>
      </div>
    </div>
  );
}
