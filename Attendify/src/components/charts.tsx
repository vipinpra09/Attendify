import { useEffect, useState } from "react";
import { fmtDay, toneForPctLabel, type SubjectSummary, type TrendPoint } from "./chartUtils";

/* ---------- Present vs Absent donut ---------- */
export function Donut({ present, absent, size = 176 }: { present: number; absent: number; size?: number }) {
  const total = present + absent;
  const pPct = total === 0 ? 0 : (present / total) * 100;
  const stroke = 20;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const [off, setOff] = useState(c);
  useEffect(() => {
    const t = setTimeout(() => setOff(c - (c * pPct) / 100), 90);
    return () => clearTimeout(t);
  }, [pPct, c]);
  return (
    <div className="relative inline-grid place-items-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--color-bad-100)" strokeWidth={stroke} />
        <circle
          cx={size / 2} cy={size / 2} r={r} fill="none"
          stroke="var(--color-ok-500)" strokeWidth={stroke} strokeLinecap={total ? "round" : "butt"}
          strokeDasharray={c} strokeDashoffset={off}
          style={{ transition: "stroke-dashoffset 1s cubic-bezier(0.16,1,0.3,1)" }}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center text-center">
        <div>
          <p className="font-display font-bold text-[1.7rem] leading-none text-night-900 tnum">
            {total === 0 ? "—" : `${Math.round(pPct)}%`}
          </p>
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mt-1">present</p>
        </div>
      </div>
    </div>
  );
}

/* ---------- Subject-wise horizontal bars with 75% marker ---------- */
export function SubjectBars({ items }: { items: SubjectSummary[] }) {
  const shown = items.filter((s) => s.total > 0);
  return (
    <div className="space-y-4">
      {shown.map((s, i) => {
        const p = s.percent ?? 0;
        return (
          <div key={s.subjectId}>
            <div className="flex items-baseline justify-between gap-3 mb-1.5">
              <p className="text-[13px] font-bold text-slate-700 truncate">
                <span className="font-mono text-[11px] text-brand-600 mr-1.5">{s.code}</span>
                {s.name}
              </p>
              <p className="text-[13px] font-bold tnum shrink-0" style={{ color: toneForPctLabel(p) }}>
                {s.percent}%
                <span className="text-slate-400 font-semibold text-[11px] ml-1.5">{s.attended}/{s.total}</span>
              </p>
            </div>
            <div className="relative h-2.5 rounded-full bg-slate-100 overflow-hidden">
              <div
                className="h-full rounded-full anim-bar"
                style={{ width: `${Math.min(100, p)}%`, background: toneForPctLabel(p), animationDelay: `${i * 90}ms` }}
              />
              <span className="absolute top-0 bottom-0 w-0.5 bg-night-900/25" style={{ left: "75%" }} title="75% minimum" />
            </div>
          </div>
        );
      })}
      {shown.length === 0 && <p className="text-[13px] text-slate-400 font-medium py-6 text-center">No attendance recorded yet.</p>}
    </div>
  );
}

/* ---------- Trend area chart ---------- */
export function TrendArea({ points, height = 190 }: { points: TrendPoint[]; height?: number }) {
  const W = 640;
  const H = height;
  const padX = 8;
  const padTop = 14;
  const padBottom = 26;

  if (points.length < 2) {
    return <p className="text-[13px] text-slate-400 font-medium py-10 text-center">Not enough sessions to draw a trend yet.</p>;
  }

  const innerH = H - padTop - padBottom;
  const x = (i: number) => padX + (i / (points.length - 1)) * (W - padX * 2);
  const y = (p: number) => padTop + innerH - (p / 100) * innerH;

  const line = points.map((pt, i) => `${i === 0 ? "M" : "L"}${x(i).toFixed(1)},${y(pt.percent).toFixed(1)}`).join(" ");
  const area = `${line} L${x(points.length - 1).toFixed(1)},${(H - padBottom).toFixed(1)} L${x(0).toFixed(1)},${(H - padBottom).toFixed(1)} Z`;

  const ticks = [0, 25, 50, 75, 100];

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" role="img" aria-label="Attendance trend">
      <defs>
        <linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--color-brand-500)" stopOpacity="0.28" />
          <stop offset="100%" stopColor="var(--color-brand-500)" stopOpacity="0.02" />
        </linearGradient>
      </defs>
      {ticks.map((t) => (
        <g key={t}>
          <line
            x1={padX} x2={W - padX} y1={y(t)} y2={y(t)}
            stroke={t === 75 ? "var(--color-bad-300, #f3b8bf)" : "#e7ebf4"}
            strokeWidth={t === 75 ? 1.4 : 1}
            strokeDasharray={t === 75 ? "6 5" : undefined}
          />
          <text x={W - padX} y={y(t) - 4} textAnchor="end" fontSize="10" fontWeight={700}
            fill={t === 75 ? "var(--color-bad-500)" : "#94a3b8"}>
            {t === 75 ? "75% min" : `${t}%`}
          </text>
        </g>
      ))}
      <path d={area} fill="url(#trendFill)" />
      <path d={line} fill="none" stroke="var(--color-brand-600)" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
      {points.map((pt, i) => (
        <circle key={pt.date} cx={x(i)} cy={y(pt.percent)} r="3.6" fill="white" stroke="var(--color-brand-600)" strokeWidth="2.2">
          <title>{`${fmtDay(pt.date)} — ${pt.percent}%`}</title>
        </circle>
      ))}
      <text x={x(0)} y={H - 8} fontSize="10.5" fontWeight={600} fill="#64748b">{fmtDay(points[0].date)}</text>
      <text x={x(points.length - 1)} y={H - 8} textAnchor="end" fontSize="10.5" fontWeight={600} fill="#64748b">
        {fmtDay(points[points.length - 1].date)}
      </text>
    </svg>
  );
}
