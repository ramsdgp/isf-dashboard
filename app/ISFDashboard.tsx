"use client";

import { useState, useEffect, useRef } from "react";
import {
  AreaChart, Area, LineChart, Line, BarChart, Bar,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, ReferenceLine, ComposedChart
} from "recharts";

const T = {
  bg:      "#07090d",
  surface: "#0c1018",
  card:    "#101620",
  border:  "#192030",
  borderHi:"#22304a",
  amber:   "#f59e0b",
  amberLo: "#78450a",
  teal:    "#0fb8a4",
  tealLo:  "#094f47",
  red:     "#f43f5e",
  green:   "#10b981",
  blue:    "#38bdf8",
  violet:  "#8b5cf6",
  orange:  "#f97316",
  text:    "#dde6f0",
  sub:     "#5a7a99",
  label:   "#8aaac8",
};

const STAGE_CLR: Record<string, string> = {
  SINTER: "#f59e0b",
  SMELT:  "#f43f5e",
  TUYERE: "#f97316",
  COND:   "#38bdf8",
  SLAG:   "#8b5cf6",
};

interface SOPParam {
  id: string; label: string; unit: string; stage: string;
  min: number; max: number; target: number; tol: number;
  lo: number; hi: number; sub?: string; lowerBetter?: boolean;
}

const SOP: SOPParam[] = [
  { id:"cokePreHeat",       label:"Coke Preheat Temp",       unit:"°C",         stage:"SINTER", min:700,  max:800,  target:750,  tol:25,   lo:650,   hi:850,  sub:"THERMAL"  },
  { id:"roastingTemp",      label:"Roasting Temp",           unit:"°C",         stage:"SINTER", min:650,  max:750,  target:700,  tol:20,   lo:600,   hi:800,  sub:"THERMAL"  },
  { id:"ignitionTemp",      label:"Ignition Temperature",    unit:"°C",         stage:"SINTER", min:1100, max:1250, target:1150, tol:30,   lo:1000,  hi:1350, sub:"THERMAL"  },
  { id:"ignitionHoodTemp",  label:"Ignition Hood Temp",      unit:"°C",         stage:"SINTER", min:900,  max:1000, target:950,  tol:25,   lo:800,   hi:1100, sub:"THERMAL"  },
  { id:"burnThroughTemp",   label:"Burn-Through Point",      unit:"°C",         stage:"SINTER", min:150,  max:250,  target:200,  tol:20,   lo:80,    hi:320,  sub:"THERMAL"  },
  { id:"wasteGasTemp",      label:"Waste Gas Temp",          unit:"°C",         stage:"SINTER", min:80,   max:160,  target:120,  tol:20,   lo:40,    hi:220,  sub:"THERMAL"  },
  { id:"strandSpeed",       label:"Strand Speed",            unit:" m/min",     stage:"SINTER", min:1.5,  max:2.5,  target:2.0,  tol:0.2,  lo:1.0,   hi:3.0,  sub:"PROCESS"  },
  { id:"bedDepth",          label:"Sinter Bed Depth",        unit:" mm",        stage:"SINTER", min:250,  max:350,  target:300,  tol:15,   lo:200,   hi:400,  sub:"PROCESS"  },
  { id:"windboxSuction",    label:"Windbox Suction",         unit:" mbar",      stage:"SINTER", min:1200, max:1800, target:1500, tol:100,  lo:1000,  hi:2000, sub:"PROCESS"  },
  { id:"sinterFeedRate",    label:"Feed Rate",               unit:" t/h",       stage:"SINTER", min:50,   max:80,   target:65,   tol:5,    lo:35,    hi:95,   sub:"PROCESS"  },
  { id:"returnFinesRatio",  label:"Return Fines Ratio",      unit:"%",          stage:"SINTER", min:20,   max:40,   target:30,   tol:4,    lo:10,    hi:55,   sub:"PROCESS"  },
  { id:"sinterBasicity",    label:"Sinter Basicity (B2)",    unit:" CaO/SiO₂",  stage:"SINTER", min:1.6,  max:2.0,  target:1.8,  tol:0.1,  lo:1.2,   hi:2.4,  sub:"QUALITY"  },
  { id:"tumbleIndex",       label:"Tumble Index (TI)",       unit:"%",          stage:"SINTER", min:65,   max:80,   target:70,   tol:3,    lo:55,    hi:90,   sub:"QUALITY"  },
  { id:"reducibilityIdx",   label:"Reducibility Index (RI)", unit:"%",          stage:"SINTER", min:65,   max:78,   target:72,   tol:3,    lo:55,    hi:88,   sub:"QUALITY"  },
  { id:"sinterFines",       label:"Sinter Fines (<6mm)",     unit:"%",          stage:"SINTER", min:0,    max:25,   target:18,   tol:3,    lo:0,     hi:40,   sub:"QUALITY", lowerBetter:true },
  { id:"sinterZnContent",   label:"Sinter Zn Content",       unit:"% Zn",       stage:"SINTER", min:40,   max:55,   target:48,   tol:3,    lo:32,    hi:62,   sub:"QUALITY"  },
  { id:"sinterPbContent",   label:"Sinter Pb Content",       unit:"% Pb",       stage:"SINTER", min:4,    max:8,    target:6,    tol:0.5,  lo:2,     hi:11,   sub:"QUALITY"  },
  { id:"sinterMoisture",    label:"Sinter Moisture",         unit:"% H₂O",      stage:"SINTER", min:0,    max:1.0,  target:0.5,  tol:0.15, lo:0,     hi:2.0,  sub:"QUALITY", lowerBetter:true },
  { id:"sinterFeO",         label:"Sinter FeO Content",      unit:"% FeO",      stage:"SINTER", min:6,    max:10,   target:8,    tol:0.8,  lo:3,     hi:14,   sub:"QUALITY"  },
  { id:"blastTemp",         label:"Blast Temp",              unit:"°C",         stage:"SMELT",  min:900,  max:1100, target:1000, tol:25,   lo:850,   hi:1150 },
  { id:"blastPressure",     label:"Blast Pressure",          unit:" bar",       stage:"SMELT",  min:1.8,  max:2.2,  target:2.0,  tol:0.1,  lo:1.5,   hi:2.5  },
  { id:"reductionTemp",     label:"Reduction Zone",          unit:"°C",         stage:"SMELT",  min:1200, max:1300, target:1250, tol:30,   lo:1150,  hi:1350 },
  { id:"raftTemp",          label:"RAFT Temperature",        unit:"°C",         stage:"SMELT",  min:1900, max:2100, target:2000, tol:50,   lo:1800,  hi:2200 },
  { id:"offGasTemp",        label:"Off Gas Temp",            unit:"°C",         stage:"SMELT",  min:150,  max:250,  target:200,  tol:20,   lo:100,   hi:300  },
  { id:"coCo2Ratio",        label:"CO:CO₂ Ratio",            unit:":1",         stage:"SMELT",  min:1.5,  max:2.5,  target:2.0,  tol:0.2,  lo:1.0,   hi:3.0  },
  { id:"cokeZincRatio",     label:"Coke:Zinc Ratio",         unit:":1",         stage:"SMELT",  min:1.2,  max:1.8,  target:1.5,  tol:0.15, lo:0.9,   hi:2.1  },
  { id:"cokeRate",          label:"Coke Rate",               unit:"kg/t HM",    stage:"SMELT",  min:280,  max:320,  target:300,  tol:10,   lo:250,   hi:350, lowerBetter:true },
  { id:"tuyereAngle",       label:"Tuyere Angle",            unit:"°",          stage:"TUYERE", min:10,   max:25,   target:17,   tol:2,    lo:5,     hi:30   },
  { id:"blastVelocity",     label:"Blast Velocity",          unit:" m/s",       stage:"TUYERE", min:80,   max:120,  target:100,  tol:8,    lo:60,    hi:140  },
  { id:"blastInputRate",    label:"Blast Input Rate",        unit:" Nm³/min",   stage:"TUYERE", min:10,   max:14,   target:12,   tol:1,    lo:8,     hi:16   },
  { id:"condInletTemp",     label:"Cond. Inlet Temp",        unit:"°C",         stage:"COND",   min:530,  max:570,  target:550,  tol:15,   lo:480,   hi:620  },
  { id:"condOutletTemp",    label:"Cond. Outlet Temp",       unit:"°C",         stage:"COND",   min:430,  max:470,  target:450,  tol:15,   lo:380,   hi:520  },
  { id:"rotorSpeed",        label:"Rotor Speed",             unit:" RPM",       stage:"COND",   min:85,   max:115,  target:100,  tol:8,    lo:60,    hi:140  },
  { id:"condEfficiency",    label:"Condenser Efficiency",    unit:"%",          stage:"COND",   min:95.6, max:99.8, target:98.0, tol:1.0,  lo:90,    hi:100  },
  { id:"leadSplashTemp",    label:"Lead Splash Temp",        unit:"°C",         stage:"COND",   min:450,  max:550,  target:500,  tol:15,   lo:400,   hi:600  },
  { id:"slagBasicity",      label:"Slag Basicity (B2)",      unit:" CaO/SiO₂",  stage:"SLAG",   min:1.0,  max:1.4,  target:1.2,  tol:0.1,  lo:0.7,   hi:1.8  },
  { id:"slagTemp",          label:"Slag Temperature",        unit:"°C",         stage:"SLAG",   min:1350, max:1450, target:1400, tol:25,   lo:1300,  hi:1500 },
  { id:"slagTapTemp",       label:"Slag Tapping Temp",       unit:"°C",         stage:"SLAG",   min:1100, max:1200, target:1150, tol:30,   lo:1050,  hi:1250 },
  { id:"zincInSlag",        label:"Zinc in Slag",            unit:"%Zn",        stage:"SLAG",   min:0,    max:2.0,  target:1.5,  tol:0.25, lo:0,     hi:4,   lowerBetter:true },
];

const FEED_PROFILES: Record<string, { znContent:number; gangue:number; sulfur:number; moisture:number }> = {
  "High-Grade Concentrate":  { znContent:52, gangue:6,  sulfur:0.8, moisture:4 },
  "Standard Mixed Feed":     { znContent:45, gangue:10, sulfur:1.2, moisture:6 },
  "Low-Grade / High Gangue": { znContent:38, gangue:18, sulfur:1.6, moisture:8 },
  "Recycled / Secondary":    { znContent:40, gangue:15, sulfur:2.0, moisture:7 },
};

function clamp(v: number, lo: number, hi: number): number { return Math.max(lo, Math.min(hi, v)); }
function rand(v: number, s: number): number { return v + (Math.random() - 0.5) * s * 2; }

function getStatus(p: SOPParam, v: number): "optimal" | "warning" | "critical" {
  if (p.lowerBetter) {
    if (v <= p.target) return "optimal";
    if (v <= p.max)    return "warning";
    return "critical";
  }
  if (v >= p.min && v <= p.max)                  return "optimal";
  if (v >= p.min - p.tol && v <= p.max + p.tol) return "warning";
  return "critical";
}

const STATUS: Record<string, { label: string; color: string }> = {
  optimal:  { label: "IN RANGE",    color: T.green },
  warning:  { label: "WARNING",     color: T.amber },
  critical: { label: "OUT OF SPEC", color: T.red   },
};

function genHistory(target: number, spread: number, n: number = 20): { t: string; v: number }[] {
  return Array.from({ length: n }, (_, i) => ({
    t: `${(i * 72).toString().padStart(4, "0")}`,
    v: parseFloat(rand(target, spread * 0.4).toFixed(2)),
  }));
}

const Card = ({ children, style = {} }: { children: React.ReactNode; style?: React.CSSProperties }) => (
  <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: "16px 18px", ...style }}>
    {children}
  </div>
);

const Badge = ({ label, color, small }: { label: string; color: string; small?: boolean }) => (
  <span style={{
    display: "inline-block", padding: small ? "1px 7px" : "2px 9px", borderRadius: 3,
    border: `1px solid ${color}44`, background: `${color}14`, color,
    fontFamily: "monospace", fontSize: small ? 9 : 10, letterSpacing: 1.2,
    textTransform: "uppercase", whiteSpace: "nowrap",
  }}>{label}</span>
);

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: any[]; label?: string }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 6, padding: "8px 12px" }}>
      <p style={{ fontFamily: "monospace", fontSize: 10, color: T.label, marginBottom: 4 }}>{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} style={{ fontFamily: "monospace", fontSize: 11, color: p.color || T.amber, margin: "2px 0" }}>
          {p.name}: <strong>{typeof p.value === "number" ? p.value.toFixed(2) : p.value}</strong>
        </p>
      ))}
    </div>
  );
};

function KPICard({ p, value, history, selected, onSelect }: {
  p: SOPParam; value: number; history: { t: string; v: number }[];
  selected: boolean; onSelect: (id: string) => void;
}) {
  const status = getStatus(p, value);
  const sc     = STATUS[status].color;
  const pct    = clamp(((value - p.lo) / (p.hi - p.lo)) * 100, 0, 100);
  const gid    = `g_${p.id}`;
  return (
    <div onClick={() => onSelect(p.id)} style={{
      background: T.card,
      border: `1px solid ${selected ? sc : status !== "optimal" ? `${sc}44` : T.border}`,
      borderTop: `2px solid ${STAGE_CLR[p.stage]}`,
      borderRadius: 10, padding: "14px 16px", cursor: "pointer", position: "relative", overflow: "hidden",
      transition: "all .18s",
      boxShadow: selected ? `0 0 0 1px ${sc}44, 0 4px 24px ${sc}18` : "none",
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
        <div>
          <div style={{ fontFamily: "monospace", fontSize: 9, color: T.label, letterSpacing: 1.2, textTransform: "uppercase", marginBottom: 4 }}>{p.label}</div>
          <Badge label={p.stage} color={STAGE_CLR[p.stage]} small />
        </div>
        <Badge label={STATUS[status].label} color={sc} small />
      </div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 5, marginBottom: 10 }}>
        <span style={{ fontSize: 28, fontWeight: 700, color: sc, fontFamily: "monospace", lineHeight: 1 }}>
          {value.toFixed(value < 10 ? 2 : 1)}
        </span>
        <span style={{ fontSize: 12, color: T.sub }}>{p.unit}</span>
      </div>
      <div style={{ marginBottom: 6 }}>
        <div style={{ height: 5, background: "rgba(255,255,255,.05)", borderRadius: 3, position: "relative" }}>
          <div style={{
            position: "absolute", top: 0, height: "100%", borderRadius: 3,
            left: `${((p.min - p.lo) / (p.hi - p.lo)) * 100}%`,
            width: `${((p.max - p.min) / (p.hi - p.lo)) * 100}%`,
            background: "rgba(16,185,129,.22)",
          }} />
          <div style={{
            position: "absolute", top: -4, width: 3, height: 13, borderRadius: 2,
            background: sc, left: `${pct}%`, transform: "translateX(-50%)",
            boxShadow: `0 0 7px ${sc}`,
          }} />
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 3 }}>
          <span style={{ fontFamily: "monospace", fontSize: 8, color: T.sub }}>{p.min}{p.unit}</span>
          <span style={{ fontFamily: "monospace", fontSize: 8, color: T.label }}>⊙ {p.target}{p.unit}</span>
          <span style={{ fontFamily: "monospace", fontSize: 8, color: T.sub }}>{p.max}{p.unit}</span>
        </div>
      </div>
      <div style={{ height: 36 }}>
        <ResponsiveContainer width="100%" height={36}>
          <AreaChart data={history} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor={sc} stopOpacity={0.35} />
                <stop offset="95%" stopColor={sc} stopOpacity={0}    />
              </linearGradient>
            </defs>
            <Area type="monotone" dataKey="v" stroke={sc} fill={`url(#${gid})`} strokeWidth={1.5} dot={false} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function OverviewTab({ live, hist }: { live: Record<string, number>; hist: Record<string, { t: string; v: number }[]> }) {
  const [sel, setSel] = useState("blastTemp");
  const [stageFilter, setStageFilter] = useState("ALL");
  const selP = SOP.find(p => p.id === sel);
  const selH = hist[sel] || [];
  const counts = SOP.reduce((a: Record<string, number>, p) => {
    const s = getStatus(p, live[p.id]);
    a[s] = (a[s] || 0) + 1;
    return a;
  }, { optimal: 0, warning: 0, critical: 0 });

  const stages = ["ALL", "SINTER", "SMELT", "TUYERE", "COND", "SLAG"];
  const filteredSOP = stageFilter === "ALL" ? SOP : SOP.filter(p => p.stage === stageFilter);
  const groupedSOP = stages.slice(1).reduce((acc: Record<string, SOPParam[]>, stage) => {
    const items = filteredSOP.filter(p => p.stage === stage);
    if (items.length) acc[stage] = items;
    return acc;
  }, {});
  const SUB_CLR: Record<string, string> = { THERMAL: T.red, PROCESS: T.blue, QUALITY: T.teal };

  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10, marginBottom: 16 }}>
        {[
          { label: "In Range",    count: counts.optimal,  color: T.green },
          { label: "Warning",     count: counts.warning,  color: T.amber },
          { label: "Out of Spec", count: counts.critical, color: T.red   },
          { label: "Total KPIs",  count: SOP.length,      color: T.teal  },
        ].map(s => (
          <Card key={s.label} style={{ textAlign: "center", padding: "12px 8px", borderTop: `2px solid ${s.color}` }}>
            <div style={{ fontSize: 26, fontWeight: 700, color: s.color, fontFamily: "monospace" }}>{s.count}</div>
            <div style={{ fontSize: 10, color: T.sub, textTransform: "uppercase", letterSpacing: 1, marginTop: 3 }}>{s.label}</div>
          </Card>
        ))}
      </div>

      <div style={{ display: "flex", gap: 6, marginBottom: 18, flexWrap: "wrap" }}>
        {stages.map(st => {
          const stCount = st === "ALL" ? SOP.length : SOP.filter(p => p.stage === st).length;
          const stColor = st === "ALL" ? T.teal : STAGE_CLR[st];
          const active  = stageFilter === st;
          return (
            <button key={st} onClick={() => setStageFilter(st)} style={{
              padding: "5px 13px", borderRadius: 20, cursor: "pointer",
              border: `1px solid ${active ? stColor : stColor + "44"}`,
              background: active ? stColor + "22" : "transparent",
              color: active ? stColor : stColor + "99",
              fontFamily: "monospace", fontSize: 10, letterSpacing: 1.2, transition: "all .15s",
            }}>
              {st} <span style={{ opacity: 0.7 }}>({stCount})</span>
            </button>
          );
        })}
      </div>

      {Object.entries(groupedSOP).map(([stage, params]) => {
        const stColor = STAGE_CLR[stage];
        const hasSubs = params.some((p: SOPParam) => p.sub);
        return (
          <div key={stage} style={{ marginBottom: 22 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
              <div style={{ width: 10, height: 10, borderRadius: 2, background: stColor, flexShrink: 0, boxShadow: `0 0 8px ${stColor}88` }} />
              <span style={{ fontFamily: "monospace", fontSize: 9, letterSpacing: 2, color: stColor, textTransform: "uppercase" }}>{stage} STAGE</span>
              <span style={{ fontFamily: "monospace", fontSize: 9, color: T.sub }}>· {params.length} parameters</span>
              <div style={{ flex: 1, height: 1, background: stColor + "22" }} />
            </div>
            {hasSubs ? (() => {
              const subGroups = params.reduce((acc: Record<string, SOPParam[]>, p: SOPParam) => {
                const key = p.sub || "OTHER";
                if (!acc[key]) acc[key] = [];
                acc[key].push(p);
                return acc;
              }, {});
              return Object.entries(subGroups).map(([sub, subParams]) => {
                const subColor = SUB_CLR[sub] || T.label;
                return (
                  <div key={sub} style={{ marginBottom: 16 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8, paddingLeft: 4 }}>
                      <div style={{ width: 3, height: 12, borderRadius: 2, background: subColor, flexShrink: 0 }} />
                      <span style={{ fontFamily: "monospace", fontSize: 8, letterSpacing: 1.8, color: subColor, textTransform: "uppercase", opacity: 0.85 }}>{sub}</span>
                      <div style={{ flex: 1, height: 1, background: subColor + "18" }} />
                      <span style={{ fontFamily: "monospace", fontSize: 8, color: T.sub }}>{subParams.length}</span>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(200px,1fr))", gap: 10 }}>
                      {subParams.map((p: SOPParam) => (
                        <KPICard key={p.id} p={p} value={live[p.id]} history={hist[p.id] || []} selected={sel === p.id} onSelect={setSel} />
                      ))}
                    </div>
                  </div>
                );
              });
            })() : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(200px,1fr))", gap: 10 }}>
                {params.map((p: SOPParam) => (
                  <KPICard key={p.id} p={p} value={live[p.id]} history={hist[p.id] || []} selected={sel === p.id} onSelect={setSel} />
                ))}
              </div>
            )}
          </div>
        );
      })}

      {selP && (
        <Card style={{ marginTop: 8 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <div>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: T.text, margin: 0 }}>{selP.label} — 24h Trend</h3>
              <p style={{ fontFamily: "monospace", fontSize: 10, color: T.label, marginTop: 4 }}>
                SOP: {selP.min}–{selP.max}{selP.unit} | Tol: ±{selP.tol}{selP.unit}
                {selP.sub && <span style={{ marginLeft: 10, color: SUB_CLR[selP.sub] || T.label }}>· {selP.sub}</span>}
              </p>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              {selP.sub && <Badge label={selP.sub} color={SUB_CLR[selP.sub] || T.label} />}
              <Badge label={selP.stage} color={STAGE_CLR[selP.stage]} />
            </div>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <ComposedChart data={selH} margin={{ top: 8, right: 20, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="dg" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor={STATUS[getStatus(selP, live[selP.id])].color} stopOpacity={0.28} />
                  <stop offset="95%" stopColor={STATUS[getStatus(selP, live[selP.id])].color} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="t" stroke={T.sub} tick={{ fill: T.sub, fontSize: 9 }} />
              <YAxis stroke={T.sub} tick={{ fill: T.sub, fontSize: 9 }} domain={[selP.lo, selP.hi]} />
              <Tooltip content={<CustomTooltip />} />
              <ReferenceLine y={selP.min}    stroke={T.amber} strokeDasharray="5 3" label={{ value: "Min",    fill: T.amber, fontSize: 9 }} />
              <ReferenceLine y={selP.max}    stroke={T.amber} strokeDasharray="5 3" label={{ value: "Max",    fill: T.amber, fontSize: 9 }} />
              <ReferenceLine y={selP.target} stroke={T.green} strokeDasharray="5 3" label={{ value: "Target", fill: T.green, fontSize: 9 }} />
              <Area type="monotone" dataKey="v" name={selP.label}
                stroke={STATUS[getStatus(selP, live[selP.id])].color}
                fill="url(#dg)" strokeWidth={2} dot={false} />
            </ComposedChart>
          </ResponsiveContainer>
        </Card>
      )}
    </div>
  );
}

interface CtrlParams {
  blastTemp: number; blastPressure: number; cokeSinterRatio: number;
  leadSplashTemp: number; cokeRate: number; preheatTemp: number;
  oxygenEnrichment: number; znContent: number; pbContent: number;
  caoContent: number; sio2Content: number; al2o3Content: number;
  sContent: number; zincInSlag: number; slagTemp: number;
  slagBasicity?: number; condEfficiency?: number;
  [key: string]: number | undefined;
}

function buildRecs(ctrl: CtrlParams) {
  const recs: { param?: string; sev: string; icon: string; title: string; body: string; suggested?: number }[] = [];
  if (ctrl.blastTemp < 900)         recs.push({ param:"blastTemp",      sev:"critical", icon:"🌡️", title:"Blast Temp Too Low",       body:`Current: ${ctrl.blastTemp}°C. Increase to 900-1100°C.`,             suggested:1000 });
  else if (ctrl.blastTemp > 1100)   recs.push({ param:"blastTemp",      sev:"critical", icon:"🔥", title:"Blast Temp Too High",       body:`Current: ${ctrl.blastTemp}°C. Reduce to 900-1100°C.`,              suggested:1000 });
  else if (ctrl.blastTemp > 1080)   recs.push({ param:"blastTemp",      sev:"warning",  icon:"🔥", title:"Blast Temp Elevated",       body:`Current: ${ctrl.blastTemp}°C. Consider reducing to 1000-1050°C.`, suggested:1050 });
  if (ctrl.blastPressure < 1.8)     recs.push({ param:"blastPressure",  sev:"warning",  icon:"💨", title:"Blast Pressure Low",        body:`Current: ${ctrl.blastPressure} bar. Increase to 1.8-2.2 bar.`,    suggested:2.0  });
  else if (ctrl.blastPressure > 2.2)recs.push({ param:"blastPressure",  sev:"warning",  icon:"⚠️", title:"Blast Pressure High",       body:`Current: ${ctrl.blastPressure} bar. Reduce to 1.8-2.2 bar.`,     suggested:2.0  });
  if (ctrl.cokeSinterRatio > 4.0)   recs.push({ param:"cokeSinterRatio",sev:"warning",  icon:"🪨", title:"High Coke:Sinter Ratio",    body:`Current: 1:${ctrl.cokeSinterRatio.toFixed(1)}. Reduce to 1:3-4.`, suggested:3.5  });
  else if (ctrl.cokeSinterRatio < 3)recs.push({ param:"cokeSinterRatio",sev:"warning",  icon:"🪨", title:"Low Coke:Sinter Ratio",     body:`Current: 1:${ctrl.cokeSinterRatio.toFixed(1)}. Increase.`,         suggested:3.5  });
  if (ctrl.leadSplashTemp < 450)    recs.push({ param:"leadSplashTemp", sev:"critical", icon:"💧", title:"Lead Splash Temp Critical", body:`Current: ${ctrl.leadSplashTemp}°C. Increase to 450-550°C.`,        suggested:500  });
  else if (ctrl.leadSplashTemp > 550)recs.push({ param:"leadSplashTemp",sev:"warning",  icon:"🔥", title:"Lead Splash Temp High",     body:`Current: ${ctrl.leadSplashTemp}°C. Reduce to 450-550°C.`,         suggested:500  });
  if (ctrl.cokeRate > 320)          recs.push({ param:"cokeRate",       sev:"warning",  icon:"⚡", title:"High Coke Consumption",     body:`Current: ${ctrl.cokeRate} kg/t. Reduce to 280-320 kg/t.`,         suggested:300  });
  else if (ctrl.cokeRate < 280)     recs.push({ param:"cokeRate",       sev:"warning",  icon:"⚡", title:"Coke Rate Too Low",         body:`Current: ${ctrl.cokeRate} kg/t. Increase to 280-320 kg/t.`,       suggested:300  });
  if (ctrl.sContent > 2.0)          recs.push({ param:"sContent",       sev:"critical", icon:"☣️", title:"High Sulfur Content",       body:`Current: ${ctrl.sContent}% S. Reduce to <2.0%.`,                  suggested:1.2  });
  if (recs.length === 0) recs.push({ sev:"optimal", icon:"✅", title:"All Parameters Optimal", body:"All control inputs within SOP. Maintain current conditions." });
  return recs;
}

function calcPredicted(ctrl: CtrlParams) {
  const bf = (ctrl.blastTemp - 900) / 200;
  const cf = (ctrl.cokeRate - 300) / 20;
  const pf = (ctrl.blastPressure - 1.8) / 0.4;
  return {
    cokeRate:          parseFloat((ctrl.cokeRate * 0.97).toFixed(1)),
    zincInSlag:        parseFloat((ctrl.zincInSlag * 0.95).toFixed(2)),
    slagTemp:          Math.round(ctrl.slagTemp * 1.005),
    znProduction:      Math.round(820 + bf * 25 - cf * 15 + pf * 10),
    znRecovery:        parseFloat(clamp(94 - ctrl.zincInSlag * 2 + bf * 1.5, 88, 99).toFixed(1)),
    energyEff:         parseFloat(clamp(82 - cf * 2 + bf * 1.2, 72, 96).toFixed(1)),
    slagBasicity:      parseFloat(clamp((ctrl.slagBasicity || 1.2) * 0.98 + 0.01, 1.0, 1.6).toFixed(2)),
    condEfficiency:    parseFloat(clamp((ctrl.condEfficiency || 98) * 0.995 + 0.2, 95, 99.8).toFixed(1)),
    blastUtilisation:  parseFloat(clamp(88 + pf * 3 - cf * 1, 78, 98).toFixed(1)),
    leadFlow:          parseFloat(clamp(420 + bf * 15 + pf * 8, 380, 480).toFixed(0)),
  };
}

function genActualVsPredicted(actual: number, predicted: number, n: number = 24): { t: string; actual: number; predicted: number }[] {
  const spread = Math.abs(actual) * 0.025;
  return Array.from({ length: n }, (_, i) => ({
    t:         `${(i + 1).toString().padStart(2, "0")}:00`,
    actual:    parseFloat((actual    + (Math.random() - 0.5) * spread * 2).toFixed(actual < 10 ? 2 : 1)),
    predicted: parseFloat((predicted + (Math.random() - 0.5) * spread * 1.4).toFixed(predicted < 10 ? 2 : 1)),
  }));
}

function RecommendationsTab({ currentParams }: { currentParams?: Partial<CtrlParams> }) {
  const defaultParams: CtrlParams = {
    blastTemp:1090, blastPressure:1.75, cokeSinterRatio:4.2,
    leadSplashTemp:500, cokeRate:300, preheatTemp:800,
    oxygenEnrichment:23, znContent:45, pbContent:5,
    caoContent:10, sio2Content:22, al2o3Content:6,
    sContent:1.2, zincInSlag:1.5, slagTemp:1150,
  };
  const [ctrl, setCtrl] = useState<CtrlParams>(currentParams as CtrlParams || defaultParams);
  useEffect(() => { if (currentParams) setCtrl(currentParams as CtrlParams); }, [currentParams]);

  const [rejectionReasons, setRejectionReasons] = useState<Record<number, string>>({});
  const [acceptedRecs, setAcceptedRecs]         = useState<Record<number, boolean>>({});
  const [dismissedRecs, setDismissedRecs]       = useState<Record<number, boolean>>({});
  const [selectedOutput, setSelectedOutput]     = useState<any>(null);
  const [chartData, setChartData]               = useState<any[]|null>(null);
  const chartRef = useRef<HTMLDivElement>(null);

  const recs   = buildRecs(ctrl);
  const pred   = calcPredicted(ctrl);
  const sevClr: Record<string, string> = { critical: T.red, warning: T.amber, optimal: T.green };

  const OUTPUTS = [
    { key:"znProduction",     label:"Zn Production",    unit:" t/d",     actual:820,                        color:T.green,   target:"≥820 t/d",   icon:"⚗️" },
    { key:"znRecovery",       label:"Zinc Recovery",     unit:"%",        actual:93.2,                       color:T.teal,    target:"≥94%",        icon:"♻️" },
    { key:"cokeRate",         label:"Coke Rate",         unit:" kg/t HM", actual:ctrl.cokeRate||300,         color:T.amber,   target:"280–320",     icon:"🪨" },
    { key:"zincInSlag",       label:"Zinc in Slag",      unit:"% Zn",     actual:ctrl.zincInSlag||1.5,       color:T.violet,  target:"<2.0% Zn",    icon:"🔩" },
    { key:"slagTemp",         label:"Slag Temperature",  unit:"°C",       actual:ctrl.slagTemp||1150,        color:T.red,     target:"1350–1450°C", icon:"🌡️" },
    { key:"energyEff",        label:"Energy Efficiency", unit:"",         actual:81.4,                       color:T.blue,    target:"≥80",         icon:"⚡" },
    { key:"slagBasicity",     label:"Slag Basicity",     unit:" B2",      actual:ctrl.slagBasicity||1.2,     color:T.orange,  target:"1.0–1.4",     icon:"⚖️" },
    { key:"condEfficiency",   label:"Cond. Efficiency",  unit:"%",        actual:ctrl.condEfficiency||98,    color:"#8aaac8", target:"95.6–99.8%",  icon:"❄️" },
    { key:"blastUtilisation", label:"Blast Utilisation", unit:"%",        actual:87.5,                       color:"#a78bfa", target:"≥85%",        icon:"💨" },
    { key:"leadFlow",         label:"Lead Flow Rate",    unit:" t/h",     actual:425,                        color:"#94a3b8", target:"380–480 t/h", icon:"🔘" },
  ];

  const handleOutputClick = (out: any) => {
    const predVal = (pred as any)[out.key];
    if (predVal === undefined) return;
    if (selectedOutput?.key === out.key) { setSelectedOutput(null); setChartData(null); return; }
    setChartData(genActualVsPredicted(out.actual, predVal, 24));
    setSelectedOutput(out);
    setTimeout(() => chartRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 80);
  };

  const handleAccept = (rec: any, i: number) => {
    if (rec.suggested !== undefined && rec.param) {
      setCtrl((p: CtrlParams) => ({ ...p, [rec.param]: rec.suggested }));
      setAcceptedRecs(p => ({ ...p, [i]: true }));
      setTimeout(() => {
        setDismissedRecs(p => ({ ...p, [i]: true }));
        setAcceptedRecs(p => ({ ...p, [i]: false }));
      }, 1500);
    }
  };

  const handleReject = (i: number) => {
    if (rejectionReasons[i]?.trim()) {
      setRejectionReasons(p => ({ ...p, [i]: "" }));
      setDismissedRecs(p => ({ ...p, [i]: true }));
    } else {
      alert("Please provide a reason for rejection.");
    }
  };

  const znVsCokeData = Array.from({ length: 15 }, (_, i) => {
    const cr = 260 + i * 8;
    return { cokeRate: cr, zincInSlag: parseFloat(clamp(2.8 - (cr - 260) / 50, 0.5, 3.5).toFixed(2)) };
  });

  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 400px", gap: 14, marginBottom: 14 }}>
        <div>
          <Card style={{ marginBottom: 14 }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: T.text, marginBottom: 14 }}>Zinc in Slag vs Coke Rate</h3>
            <ResponsiveContainer width="100%" height={210}>
              <LineChart data={znVsCokeData} margin={{ top: 5, right: 20, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="cokeRate" stroke={T.sub} tick={{ fill: T.sub, fontSize: 9 }} />
                <YAxis stroke={T.sub} tick={{ fill: T.sub, fontSize: 9 }} />
                <Tooltip content={<CustomTooltip />} />
                <Line type="monotone" dataKey="zincInSlag" name="Zn in Slag" stroke={T.amber} strokeWidth={2} dot={false} />
                <ReferenceLine y={2.0} stroke={T.red} strokeDasharray="4 3" label={{ value: "Max 2.0%", fill: T.red, fontSize: 9 }} />
              </LineChart>
            </ResponsiveContainer>
          </Card>

          <Card style={{ marginBottom: 14 }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: T.text, marginBottom: 4 }}>Predicted vs Current</h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={[
                { name:"Coke Rate",     current:ctrl.cokeRate,   predicted:Math.round(ctrl.cokeRate*0.93)                },
                { name:"Zn in Slag",    current:ctrl.zincInSlag, predicted:parseFloat((ctrl.zincInSlag*0.72).toFixed(2)) },
                { name:"Slag Temp",     current:ctrl.slagTemp,   predicted:Math.round(ctrl.slagTemp*1.02)                },
                { name:"Zn Prod (t/d)", current:820,             predicted:857                                           },
              ]} margin={{ top:10, right:20, left:0, bottom:0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="name" stroke={T.sub} tick={{ fill:T.sub, fontSize:10 }} />
                <YAxis stroke={T.sub} tick={{ fill:T.sub, fontSize:9 }} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize:11, color:T.label }} />
                <Bar dataKey="current"   name="Current"   fill={T.blue}  fillOpacity={0.75} radius={[4,4,0,0] as any} />
                <Bar dataKey="predicted" name="Predicted" fill={T.amber} fillOpacity={0.85} radius={[4,4,0,0] as any} />
              </BarChart>
            </ResponsiveContainer>
          </Card>

          <p style={{ fontFamily:"monospace", fontSize:9, color:T.label, letterSpacing:2, textTransform:"uppercase", marginBottom:10 }}>Recommendation Engine</p>
          {recs.map((r, i) => !dismissedRecs[i] && (
            <div key={i} style={{
              background:`${sevClr[r.sev]}0b`, border:`1px solid ${sevClr[r.sev]}33`,
              borderLeft:`3px solid ${sevClr[r.sev]}`, borderRadius:8, padding:"11px 14px", marginBottom:10,
            }}>
              <div style={{ display:"flex", alignItems:"center", gap:7, marginBottom:5 }}>
                <span style={{ fontSize:16 }}>{r.icon}</span>
                <span style={{ fontSize:13, fontWeight:700, color:sevClr[r.sev] }}>{r.title}</span>
                <div style={{ marginLeft:"auto" }}><Badge label={r.sev.toUpperCase()} color={sevClr[r.sev]} small /></div>
              </div>
              <p style={{ fontSize:12, color:T.label, lineHeight:1.6, margin:"0 0 10px 0" }}>{r.body}</p>
              {r.suggested !== undefined && (
                <div style={{ display:"flex", gap:8, alignItems:"center", flexWrap:"wrap" }}>
                  <button onClick={() => handleAccept(r, i)} style={{
                    padding:"6px 12px", borderRadius:5, border:`1px solid ${T.green}`,
                    background: acceptedRecs[i] ? T.green : `${T.green}14`,
                    color: acceptedRecs[i] ? "#000" : T.green,
                    fontSize:11, fontWeight:600, cursor:"pointer", fontFamily:"monospace",
                  }}>{acceptedRecs[i] ? "✓ ACCEPTED" : "✓ ACCEPT"}</button>
                  <button onClick={() => handleReject(i)} style={{
                    padding:"6px 12px", borderRadius:5, border:`1px solid ${T.red}`,
                    background:`${T.red}14`, color:T.red, fontSize:11, fontWeight:600, cursor:"pointer", fontFamily:"monospace",
                  }}>✗ REJECT</button>
                  <input type="text" placeholder="Rejection reason..."
                    value={rejectionReasons[i] || ""}
                    onChange={e => setRejectionReasons(p => ({ ...p, [i]: e.target.value }))}
                    style={{ flex:1, minWidth:"200px", padding:"6px 10px", borderRadius:5, border:`1px solid ${T.border}`, background:T.surface, color:T.text, fontSize:11, fontFamily:"monospace" }}
                  />
                </div>
              )}
            </div>
          ))}
        </div>

        <div>
          <p style={{ fontFamily:"monospace", fontSize:9, color:T.label, letterSpacing:2, textTransform:"uppercase", marginBottom:12 }}>Current Control Parameters</p>
          {[
            { label:"Blast Temperature", value:ctrl.blastTemp,        unit:"°C"       },
            { label:"Blast Pressure",    value:ctrl.blastPressure,    unit:" bar"     },
            { label:"Coke:Sinter Ratio", value:ctrl.cokeSinterRatio,  unit:":1", prefix:"1:" },
            { label:"Lead Splash Temp",  value:ctrl.leadSplashTemp,   unit:"°C"       },
            { label:"Coke Rate",         value:ctrl.cokeRate,         unit:" kg/t HM" },
            { label:"Oxygen Enrichment", value:ctrl.oxygenEnrichment, unit:"%"        },
            { label:"Zn Content",        value:ctrl.znContent,        unit:"%"        },
            { label:"S Content",         value:ctrl.sContent,         unit:"%"        },
          ].map(p => (
            <Card key={p.label} style={{ marginBottom:6, padding:"8px 12px" }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                <span style={{ fontSize:11, color:T.label }}>{p.label}</span>
                <span style={{ fontFamily:"monospace", fontSize:14, fontWeight:700, color:T.amber }}>
                  {p.prefix || ""}{typeof p.value === "number" ? p.value.toFixed(p.value < 10 ? 1 : 0) : p.value}{p.unit}
                </span>
              </div>
            </Card>
          ))}

          <p style={{ fontFamily:"monospace", fontSize:9, color:T.label, letterSpacing:2, textTransform:"uppercase", marginTop:20, marginBottom:8 }}>
            Predicted Outputs <span style={{ color:T.sub, fontWeight:400 }}>— click to view chart</span>
          </p>
          {OUTPUTS.map(out => {
            const predVal  = (pred as any)[out.key];
            const isActive = selectedOutput?.key === out.key;
            const diff     = predVal !== undefined ? parseFloat(((predVal - out.actual) / Math.abs(out.actual) * 100).toFixed(1)) : null;
            return (
              <div key={out.key} onClick={() => handleOutputClick(out)} style={{
                display:"flex", alignItems:"center", gap:10, marginBottom:6, padding:"9px 12px", borderRadius:8, cursor:"pointer",
                background: isActive ? `${out.color}14` : T.card,
                border:`1px solid ${isActive ? out.color : T.border}`,
                borderLeft:`3px solid ${out.color}`, transition:"all .15s",
              }}>
                <span style={{ fontSize:14 }}>{out.icon}</span>
                <span style={{ fontSize:11, color:T.label, flex:1 }}>{out.label}</span>
                <div style={{ textAlign:"right" }}>
                  <div style={{ fontFamily:"monospace", fontSize:13, fontWeight:700, color:out.color }}>
                    {predVal !== undefined ? (predVal < 10 ? predVal.toFixed(2) : predVal.toFixed(1)) : "—"}{out.unit}
                  </div>
                  {diff !== null && (
                    <div style={{ fontFamily:"monospace", fontSize:9, color: diff >= 0 ? T.green : T.red }}>
                      {diff >= 0 ? "▲+" : "▼"}{Math.abs(diff)}% vs actual
                    </div>
                  )}
                </div>
                <span style={{ fontSize:10, color: isActive ? out.color : T.sub }}>{isActive ? "▼" : "▷"}</span>
              </div>
            );
          })}
        </div>
      </div>

      {selectedOutput && chartData && (() => {
        const predVal = (pred as any)[selectedOutput.key];
        const actVal  = selectedOutput.actual;
        const pct     = predVal !== undefined && actVal ? parseFloat(((predVal - actVal) / Math.abs(actVal) * 100).toFixed(1)) : 0;
        const allVals = chartData.flatMap((d: any) => [d.actual, d.predicted]).filter((v: any) => !isNaN(v));
        const dMin    = Math.min(...allVals);
        const dMax    = Math.max(...allVals);
        const pad     = (dMax - dMin) * 0.12 || Math.abs(dMin) * 0.05 || 1;
        const yMin    = parseFloat((dMin - pad).toFixed(actVal < 10 ? 2 : 0));
        const yMax    = parseFloat((dMax + pad).toFixed(actVal < 10 ? 2 : 0));
        const devData = chartData.map((d: any) => ({ t: d.t, dev: parseFloat((d.predicted - d.actual).toFixed(2)) }));
        return (
          <div ref={chartRef}>
            <Card style={{ borderTop:`2px solid ${selectedOutput.color}` }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
                <div>
                  <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:5 }}>
                    <span style={{ fontSize:22 }}>{selectedOutput.icon}</span>
                    <h3 style={{ fontSize:16, fontWeight:700, color:T.text }}>{selectedOutput.label} — Actual vs Predicted (24h)</h3>
                    <Badge label={selectedOutput.target} color={selectedOutput.color} />
                  </div>
                  <div style={{ display:"flex", gap:20, fontFamily:"monospace", fontSize:10, paddingLeft:32 }}>
                    <span><span style={{ color:T.sub }}>Actual </span><strong style={{ color:T.blue }}>{actVal}{selectedOutput.unit}</strong></span>
                    <span><span style={{ color:T.sub }}>Predicted </span><strong style={{ color:selectedOutput.color }}>{predVal !== undefined ? (predVal < 10 ? predVal.toFixed(2) : predVal.toFixed(1)) : "—"}{selectedOutput.unit}</strong></span>
                    <span style={{ color: pct >= 0 ? T.green : T.red }}>Δ {pct >= 0 ? "+" : ""}{pct}%</span>
                  </div>
                </div>
                <button onClick={() => { setSelectedOutput(null); setChartData(null); }} style={{
                  background:"transparent", border:`1px solid ${T.border}`, color:T.sub,
                  borderRadius:5, padding:"5px 12px", cursor:"pointer", fontFamily:"monospace", fontSize:10,
                }}>✕ CLOSE</button>
              </div>
              <ResponsiveContainer width="100%" height={260}>
                <ComposedChart data={chartData} margin={{ top:8, right:24, left:8, bottom:0 }}>
                  <defs>
                    <linearGradient id="gradActual" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor={T.blue}               stopOpacity={0.22} />
                      <stop offset="95%" stopColor={T.blue}               stopOpacity={0}    />
                    </linearGradient>
                    <linearGradient id="gradPred" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor={selectedOutput.color} stopOpacity={0.22} />
                      <stop offset="95%" stopColor={selectedOutput.color} stopOpacity={0}    />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="t" stroke={T.sub} tick={{ fill:T.sub, fontSize:9 }} interval={3} />
                  <YAxis stroke={T.sub} tick={{ fill:T.sub, fontSize:9 }} domain={[yMin, yMax]} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ fontSize:10, color:T.label }} />
                  {predVal !== undefined && <ReferenceLine y={predVal} stroke={selectedOutput.color} strokeDasharray="6 3" strokeOpacity={0.5} />}
                  <ReferenceLine y={actVal} stroke={T.blue} strokeDasharray="6 3" strokeOpacity={0.5} />
                  <Area type="monotone" dataKey="actual"    name="Actual"    stroke={T.blue}               fill="url(#gradActual)" strokeWidth={2} dot={false} />
                  <Area type="monotone" dataKey="predicted" name="Predicted" stroke={selectedOutput.color} fill="url(#gradPred)"   strokeWidth={2} strokeDasharray="5 3" dot={false} />
                </ComposedChart>
              </ResponsiveContainer>
              <div style={{ marginTop:14, paddingTop:12, borderTop:`1px solid ${T.border}` }}>
                <p style={{ fontFamily:"monospace", fontSize:9, color:T.sub, letterSpacing:1.5, textTransform:"uppercase", marginBottom:8 }}>Hourly Deviation — Predicted − Actual</p>
                <ResponsiveContainer width="100%" height={80}>
                  <BarChart data={devData} margin={{ top:0, right:24, left:8, bottom:0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.border} vertical={false} />
                    <XAxis dataKey="t" stroke={T.sub} tick={{ fill:T.sub, fontSize:8 }} interval={3} />
                    <YAxis stroke={T.sub} tick={{ fill:T.sub, fontSize:8 }} />
                    <Tooltip content={<CustomTooltip />} />
                    <ReferenceLine y={0} stroke={T.label} strokeOpacity={0.4} />
                    <Bar dataKey="dev" name="Δ Deviation" fill={selectedOutput.color} fillOpacity={0.7} radius={[2,2,0,0] as any} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </div>
        );
      })()}
    </div>
  );
}

function runSimulation(inp: any) {
  const fd = FEED_PROFILES[inp.feedQuality as string];
  const cr = (inp.cokeRate - 300) / 20;
  const ff = (fd.znContent - 38) / 14;
  const zincRecovery   = clamp(94 - inp.zincInSlag * 4 + ff * 2 - cr * 1, 80, 99);
  const energyEff      = clamp(82 - cr * 3 + ff * 1.5, 60, 99);
  const productionRate = Math.round(inp.znProduction);
  const slagRate       = Math.round(fd.gangue * 8 + 120);
  const timeline = Array.from({ length: 12 }, (_, i) => {
    const hr = (i + 1) * (inp.duration / 12);
    const w  = Math.min(1, hr / (inp.duration * 0.2));
    return {
      time:      `${Math.round(hr)}h`,
      recovery:  parseFloat((zincRecovery * w + (Math.random() - 0.5) * 0.5).toFixed(1)),
      zincInSlag:parseFloat((inp.zincInSlag / Math.max(w, 0.1) + (Math.random() - 0.5) * 0.08).toFixed(2)),
      energyEff: parseFloat((energyEff * w + (Math.random() - 0.5) * 1.2).toFixed(1)),
    };
  });
  const radarData = [
    { axis:"Zn Recovery",  value:Math.round(zincRecovery) },
    { axis:"Energy Eff.",  value:Math.round(energyEff)    },
    { axis:"Slag Quality", value:Math.round(Math.max(0, 100 - inp.zincInSlag * 28)) },
    { axis:"Feed Util.",   value:Math.round(ff * 15 + 80) },
    { axis:"Throughput",   value:Math.round((productionRate / 900) * 100) },
  ];
  return { zincRecovery, zincInSlag:inp.zincInSlag, energyEff, productionRate, slagRate, cokeConsumption:inp.cokeRate, timeline, radarData };
}

function SimRangeInput({ label, value, min, max, step, unit, onChange }: {
  label: string; value: number; min: number; max: number;
  step: number; unit: string; onChange: (v: number) => void;
}) {
  return (
    <div style={{ marginBottom: 13 }}>
      <div style={{ display:"flex", justifyContent:"space-between", marginBottom:5 }}>
        <label style={{ fontSize:12, color:T.label }}>{label}</label>
        <span style={{ fontFamily:"monospace", fontSize:11, color:T.amber }}>{value.toFixed(step < 1 ? 1 : 0)}{unit}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value}
        onChange={e => onChange(parseFloat(e.target.value))}
        style={{ width:"100%", accentColor:T.amber, cursor:"pointer" }}
      />
      <div style={{ display:"flex", justifyContent:"space-between" }}>
        <span style={{ fontSize:8, color:T.sub }}>{min}{unit}</span>
        <span style={{ fontSize:8, color:T.sub }}>{max}{unit}</span>
      </div>
    </div>
  );
}

function SimulationTab({ onApply }: { onApply: (params: any) => void }) {
  const [inp, setInp] = useState({
    feedQuality:"Standard Mixed Feed", cokeRate:300, zincInSlag:1.5,
    slagTemp:1150, znProduction:820, duration:24,
  });
  const [res, setRes]         = useState<any>(null);
  const [running, setRunning] = useState(false);
  const set = (k: string) => (v: any) => setInp(p => ({ ...p, [k]: v }));
  const handleRun = () => {
    setRunning(true); setRes(null);
    setTimeout(() => { setRes(runSimulation(inp)); setRunning(false); }, 800);
  };
  const fd = FEED_PROFILES[inp.feedQuality];
  const kc = (v: number, tgt: number, better: boolean) => (better ? v >= tgt : v <= tgt) ? T.green : T.red;

  return (
    <div style={{ display:"grid", gridTemplateColumns:"275px 1fr", gap:14 }}>
      <div>
        <Card style={{ marginBottom:12 }}>
          <p style={{ fontFamily:"monospace", fontSize:9, color:T.label, letterSpacing:2, textTransform:"uppercase", marginBottom:14 }}>Scenario Inputs</p>
          <div style={{ marginBottom:16 }}>
            <div style={{ fontSize:11, color:T.label, marginBottom:8 }}>Feed Quality</div>
            {Object.keys(FEED_PROFILES).map(k => (
              <button key={k} onClick={() => set("feedQuality")(k)} style={{
                display:"block", width:"100%", textAlign:"left", padding:"7px 11px", marginBottom:4, borderRadius:6,
                border:`1px solid ${inp.feedQuality === k ? T.amber : T.border}`,
                background: inp.feedQuality === k ? `${T.amber}15` : "transparent",
                color: inp.feedQuality === k ? T.amber : T.label, fontSize:12, cursor:"pointer",
              }}>{k}</button>
            ))}
          </div>
          <div style={{ padding:"10px 12px", background:`${T.teal}0a`, border:`1px solid ${T.teal}30`, borderRadius:7, marginBottom:14 }}>
            <div style={{ fontFamily:"monospace", fontSize:9, color:T.teal, letterSpacing:1, textTransform:"uppercase", marginBottom:7 }}>Feed Composition</div>
            {Object.entries(fd).map(([k, v]) => (
              <div key={k} style={{ display:"flex", justifyContent:"space-between", fontSize:11, color:T.label, marginBottom:3 }}>
                <span>{k.replace(/([A-Z])/g, " $1").trim()}</span>
                <span style={{ fontFamily:"monospace", color:T.text }}>{v}%</span>
              </div>
            ))}
          </div>
          <SimRangeInput label="Coke Rate"     value={inp.cokeRate}     min={250} max={350} step={5}   unit=" kg/t"   onChange={set("cokeRate")}     />
          <SimRangeInput label="Zinc in Slag"  value={inp.zincInSlag}   min={0.5} max={4}   step={0.1} unit="% Zn"   onChange={set("zincInSlag")}   />
          <SimRangeInput label="Slag Temp"     value={inp.slagTemp}     min={1050}max={1250}step={10}  unit="°C"     onChange={set("slagTemp")}     />
          <SimRangeInput label="Zn Production" value={inp.znProduction} min={700} max={950} step={10}  unit=" t/day" onChange={set("znProduction")} />
          <SimRangeInput label="Duration"      value={inp.duration}     min={4}   max={48}  step={4}   unit="h"      onChange={set("duration")}     />
        </Card>
        <button onClick={handleRun} disabled={running} style={{
          width:"100%", padding:"13px", borderRadius:8, border:"none", marginBottom:8,
          background: running ? T.border : `linear-gradient(135deg, ${T.amber}, ${T.amberLo})`,
          color: running ? T.sub : "#000", fontSize:13, fontWeight:700,
          cursor: running ? "not-allowed" : "pointer", letterSpacing:1.5, fontFamily:"monospace",
        }}>{running ? "⏳  SIMULATING..." : "▶  RUN SIMULATION"}</button>
        {res && (
          <button onClick={() => { onApply(inp); alert("Applied to Recommendations!"); }} style={{
            width:"100%", padding:"13px", borderRadius:8, border:`1px solid ${T.teal}`,
            background:`${T.teal}14`, color:T.teal, fontSize:13, fontWeight:700,
            cursor:"pointer", letterSpacing:1.5, fontFamily:"monospace",
          }}>✓ APPLY TO RECOMMENDATIONS</button>
        )}
      </div>
      <div>
        {!res && !running && (
          <Card style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", minHeight:380, gap:12 }}>
            <span style={{ fontSize:52 }}>⚙️</span>
            <span style={{ fontSize:18, fontWeight:700, color:T.text }}>Ready to Simulate</span>
            <span style={{ fontSize:13, color:T.sub, textAlign:"center", maxWidth:260 }}>Configure inputs and click Run Simulation.</span>
          </Card>
        )}
        {running && (
          <Card style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", minHeight:380, gap:18 }}>
            <div style={{ fontFamily:"monospace", fontSize:14, color:T.amber, letterSpacing:2 }}>RUNNING SIMULATION...</div>
          </Card>
        )}
        {res && !running && (
          <div>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:10, marginBottom:12 }}>
              {[
                { label:"Zinc Recovery",    val:`${res.zincRecovery.toFixed(1)}%`,  color:kc(res.zincRecovery,94,true),      sub:"Target ≥94%"    },
                { label:"Zinc in Slag",     val:`${res.zincInSlag.toFixed(2)}% Zn`, color:kc(res.zincInSlag,2.0,false),      sub:"Target <2.0%"   },
                { label:"Energy Eff.",      val:`${res.energyEff.toFixed(0)}`,       color:kc(res.energyEff,80,true),         sub:"Target ≥80"     },
                { label:"Production Rate",  val:`${res.productionRate} t/day`,       color:T.blue,                            sub:"Predicted"      },
                { label:"Slag Rate",        val:`${res.slagRate} t/day`,             color:T.violet,                          sub:"Est. generation" },
                { label:"Coke Consumption", val:`${res.cokeConsumption} kg/t`,       color:kc(res.cokeConsumption,320,false), sub:"Target <320"    },
              ].map(k => (
                <Card key={k.label} style={{ textAlign:"center", padding:"12px 8px", borderTop:`2px solid ${k.color}` }}>
                  <div style={{ fontSize:20, fontWeight:700, color:k.color, fontFamily:"monospace", marginBottom:3 }}>{k.val}</div>
                  <div style={{ fontSize:11, fontWeight:600, color:T.text, marginBottom:2 }}>{k.label}</div>
                  <div style={{ fontSize:10, color:T.sub }}>{k.sub}</div>
                </Card>
              ))}
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 210px", gap:12 }}>
              <Card>
                <h3 style={{ fontSize:14, fontWeight:700, color:T.text, marginBottom:12 }}>Simulation Timeline</h3>
                <ResponsiveContainer width="100%" height={190}>
                  <LineChart data={res.timeline} margin={{ top:5, right:20, left:0, bottom:0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                    <XAxis dataKey="time" stroke={T.sub} tick={{ fill:T.sub, fontSize:9 }} />
                    <YAxis yAxisId="l" stroke={T.sub} tick={{ fill:T.sub, fontSize:9 }} domain={[80,100]} />
                    <YAxis yAxisId="r" orientation="right" stroke={T.sub} tick={{ fill:T.sub, fontSize:9 }} domain={[0,4.5]} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend wrapperStyle={{ fontSize:10, color:T.label }} />
                    <Line yAxisId="l" type="monotone" dataKey="recovery"   name="Zn Recovery %" stroke={T.green} strokeWidth={2} dot={false} />
                    <Line yAxisId="l" type="monotone" dataKey="energyEff"  name="Energy Eff."   stroke={T.teal}  strokeWidth={2} dot={false} />
                    <Line yAxisId="r" type="monotone" dataKey="zincInSlag" name="Zn in Slag %"  stroke={T.amber} strokeWidth={2} dot={false} />
                    <ReferenceLine yAxisId="r" y={2}  stroke={T.red}   strokeDasharray="4 2" />
                    <ReferenceLine yAxisId="l" y={94} stroke={T.green} strokeDasharray="4 2" />
                  </LineChart>
                </ResponsiveContainer>
              </Card>
              <Card>
                <h3 style={{ fontSize:13, fontWeight:700, color:T.text, marginBottom:8 }}>Performance</h3>
                <ResponsiveContainer width="100%" height={190}>
                  <RadarChart data={res.radarData} cx="50%" cy="50%" outerRadius={72}>
                    <PolarGrid stroke={T.border} />
                    <PolarAngleAxis dataKey="axis" tick={{ fill:T.label, fontSize:9 }} />
                    <PolarRadiusAxis angle={30} domain={[0,100]} tick={false} />
                    <Radar name="Score" dataKey="value" stroke={T.amber} fill={T.amber} fillOpacity={0.2} strokeWidth={2} />
                    <Tooltip content={<CustomTooltip />} />
                  </RadarChart>
                </ResponsiveContainer>
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const TABS = [
  { id:"overview",        label:"Overview",        sub:"Live Process Status",    icon:"◉" },
  { id:"recommendations", label:"Recommendations", sub:"Parameter Optimisation", icon:"⚡" },
  { id:"simulation",      label:"Simulation",      sub:"What-if Scenarios",      icon:"▶" },
];

export default function ISFDashboard() {
  const [activeTab, setActiveTab] = useState("overview");
  const [paused,    setPaused]    = useState(false);
  const [tick,      setTick]      = useState(0);
  const [now,       setNow]       = useState(new Date());
  const [live, setLive]           = useState<Record<string,number>>(() => Object.fromEntries(SOP.map(p => [p.id, p.target])));
  const [hist, setHist]           = useState<Record<string,{t:string;v:number}[]>>(() => Object.fromEntries(SOP.map(p => [p.id, genHistory(p.target, (p.max - p.min) * 0.14)])));
  const [simParams, setSimParams] = useState<any>(null);
  const liveRef = useRef(live);
  liveRef.current = live;

  useEffect(() => {
    if (paused) return;
    const id = setInterval(() => {
      setNow(new Date());
      setTick(t => t + 1);
      setLive(prev => {
        const next = { ...prev };
        SOP.forEach(p => {
          const drift = (Math.random() - 0.5) * (p.max - p.min) * 0.05;
          next[p.id] = parseFloat(clamp(prev[p.id] + drift, p.lo, p.hi).toFixed(2));
        });
        return next;
      });
      setHist(prev => {
        const ts = new Date().toLocaleTimeString([], { hour:"2-digit", minute:"2-digit", second:"2-digit" });
        const next = { ...prev };
        SOP.forEach(p => { next[p.id] = [...(prev[p.id] || []).slice(-35), { t: ts, v: liveRef.current[p.id] }]; });
        return next;
      });
    }, 3000);
    return () => clearInterval(id);
  }, [paused]);

  const statusCounts = {
    optimal:  SOP.filter(p => getStatus(p, live[p.id]) === "optimal").length,
    warning:  SOP.filter(p => getStatus(p, live[p.id]) === "warning").length,
    critical: SOP.filter(p => getStatus(p, live[p.id]) === "critical").length,
  };

  const currentParams: CtrlParams = {
    blastTemp:       live.blastTemp       || 1000,
    blastPressure:   live.blastPressure   || 2.0,
    cokeSinterRatio: 4.2,
    leadSplashTemp:  live.leadSplashTemp  || 500,
    cokeRate:        live.cokeRate        || 300,
    preheatTemp:     live.cokePreHeat     || 800,
    oxygenEnrichment:23, znContent:45, pbContent:5,
    caoContent:10, sio2Content:22, al2o3Content:6, sContent:1.2,
    zincInSlag:   live.zincInSlag         || 1.5,
    slagTemp:     live.slagTemp           || 1400,
    slagBasicity: live.slagBasicity       || 1.2,
    condEfficiency:live.condEfficiency    || 98,
  };

  return (
    <div style={{ display:"flex", minHeight:"100vh", background:T.bg, color:T.text, fontFamily:"'DM Sans','Segoe UI',sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Mono:wght@400;500&family=DM+Sans:wght@300;400;500;700&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        input[type=range]{-webkit-appearance:none;appearance:none;background:transparent;height:5px}
        input[type=range]::-webkit-slider-thumb{-webkit-appearance:none;width:16px;height:16px;border-radius:50%;background:${T.amber};cursor:pointer;margin-top:-5.5px;box-shadow:0 0 8px ${T.amber}80}
        input[type=range]::-webkit-slider-runnable-track{height:5px;border-radius:3px;background:rgba(255,255,255,.08)}
        ::-webkit-scrollbar{width:4px} ::-webkit-scrollbar-thumb{background:${T.border};border-radius:2px}
        @keyframes blink{0%,100%{opacity:1}50%{opacity:.25}}
        button{outline:none}
      `}</style>

      <aside style={{
        width:220, minHeight:"100vh", background:T.surface,
        borderRight:`1px solid ${T.border}`, display:"flex", flexDirection:"column",
        position:"fixed", top:0, left:0, bottom:0, zIndex:300, overflowY:"auto",
      }}>
        <div style={{ padding:"20px 18px 16px", borderBottom:`1px solid ${T.border}` }}>
          <div style={{
            display:"inline-flex", alignItems:"center", gap:6,
            background:`${T.amber}12`, border:`1px solid ${T.amber}40`,
            color:T.amber, fontFamily:"monospace", fontSize:9, letterSpacing:2,
            textTransform:"uppercase", padding:"3px 10px", borderRadius:3, marginBottom:11,
          }}>
            <span style={{ width:5, height:5, background:T.amber, borderRadius:"50%", animation:"blink 1.8s infinite", flexShrink:0 }} />
            ISF DIGITAL TWIN
          </div>
          <h1 style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:26, letterSpacing:4, color:"#fff", lineHeight:1.05 }}>
            ZINC <span style={{ color:T.amber }}>ISF</span><br />CONTROL
          </h1>
          <p style={{ fontFamily:"monospace", fontSize:9, color:T.sub, letterSpacing:1, textTransform:"uppercase", marginTop:6 }}>SOP-ISF-001 · Rev 2.0</p>
        </div>

        <div style={{ padding:"11px 18px", borderBottom:`1px solid ${T.border}`, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          <div>
            <div style={{ fontFamily:"monospace", fontSize:15, color:T.amber }}>{now.toLocaleTimeString()}</div>
            <div style={{ fontFamily:"monospace", fontSize:9, color:T.sub, marginTop:2 }}>{now.toLocaleDateString()}</div>
          </div>
          <button onClick={() => setPaused(p => !p)} style={{
            background: paused ? `${T.amber}18` : `${T.green}14`,
            border:`1px solid ${paused ? T.amberLo : T.tealLo}`,
            color: paused ? T.amber : T.green,
            borderRadius:5, padding:"4px 9px", cursor:"pointer", fontFamily:"monospace", fontSize:9,
          }}>{paused ? "▶ PLAY" : "⏸ LIVE"}</button>
        </div>

        <nav style={{ flex:1, padding:"12px 10px", overflowY:"auto" }}>
          <div style={{ fontFamily:"monospace", fontSize:9, letterSpacing:2, color:T.sub, textTransform:"uppercase", padding:"0 8px 10px" }}>Navigation</div>
          {TABS.map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id)} style={{
              display:"flex", alignItems:"center", gap:10, width:"100%", padding:"10px 12px", marginBottom:3,
              borderRadius:8, border:`1px solid ${activeTab === t.id ? `${T.amber}50` : "transparent"}`,
              background: activeTab === t.id ? `${T.amber}0e` : "transparent",
              color: activeTab === t.id ? T.amber : T.sub, fontSize:13, fontWeight:500, cursor:"pointer", textAlign:"left",
            }}>
              <span style={{ fontSize:16, width:22, textAlign:"center", opacity: activeTab === t.id ? 1 : 0.45 }}>{t.icon}</span>
              <div style={{ flex:1 }}>
                <div>{t.label}</div>
                <div style={{ fontSize:9, fontFamily:"monospace", color: activeTab === t.id ? `${T.amber}70` : T.sub, marginTop:1 }}>{t.sub}</div>
              </div>
              {activeTab === t.id && <span style={{ width:6, height:6, borderRadius:"50%", background:T.amber, boxShadow:`0 0 8px ${T.amber}`, flexShrink:0 }} />}
            </button>
          ))}

          <div style={{ margin:"16px 0 8px", fontFamily:"monospace", fontSize:9, letterSpacing:2, color:T.sub, textTransform:"uppercase", padding:"0 8px" }}>Live Status</div>
          {[
            { label:"In Range",    color:T.green, count:statusCounts.optimal  },
            { label:"Warnings",    color:T.amber, count:statusCounts.warning  },
            { label:"Out of Spec", color:T.red,   count:statusCounts.critical },
          ].map(s => (
            <div key={s.label} style={{
              display:"flex", justifyContent:"space-between", alignItems:"center",
              padding:"7px 12px", borderRadius:6, marginBottom:3,
              background:`${s.color}0a`, border:`1px solid ${s.color}1c`,
            }}>
              <span style={{ fontSize:11, color:T.label }}>{s.label}</span>
              <span style={{ fontFamily:"monospace", fontSize:16, fontWeight:700, color:s.color }}>{s.count}</span>
            </div>
          ))}

          <div style={{ margin:"14px 0 8px", fontFamily:"monospace", fontSize:9, letterSpacing:2, color:T.sub, textTransform:"uppercase", padding:"0 8px" }}>Stages</div>
          {["SINTER","SMELT","TUYERE","COND","SLAG"].map(st => {
            const stParams = SOP.filter(p => p.stage === st);
            return (
              <div key={st} style={{
                display:"flex", justifyContent:"space-between", alignItems:"center",
                padding:"5px 12px", borderRadius:6, marginBottom:3,
                background:`${STAGE_CLR[st]}08`, border:`1px solid ${STAGE_CLR[st]}20`,
              }}>
                <span style={{ fontSize:10, color:STAGE_CLR[st], fontFamily:"monospace" }}>{st}</span>
                <span style={{ fontFamily:"monospace", fontSize:11, color:T.sub }}>{stParams.length} KPIs</span>
              </div>
            );
          })}
        </nav>

        <div style={{ padding:"12px 16px", borderTop:`1px solid ${T.border}` }}>
          <div style={{ fontFamily:"monospace", fontSize:9, color:T.sub, lineHeight:2 }}>
            <div><span style={{ color:T.label }}>DOC</span> ISF-SOP-001 Rev 2.0</div>
            <div><span style={{ color:T.label }}>STD</span> ISO 9001:2015</div>
          </div>
        </div>
      </aside>

      <div style={{ marginLeft:220, flex:1, display:"flex", flexDirection:"column", minHeight:"100vh" }}>
        <header style={{
          background:T.surface, borderBottom:`1px solid ${T.border}`,
          padding:"14px 24px", display:"flex", justifyContent:"space-between", alignItems:"center",
          position:"sticky", top:0, zIndex:200,
        }}>
          <div>
            <h2 style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:20, letterSpacing:3, color:"#fff" }}>
              <span style={{ color:T.amber }}>{TABS.find(t => t.id === activeTab)?.label}</span>
              {activeTab === "overview"        && " — Live Process Status"}
              {activeTab === "recommendations" && " — Parameter Optimisation"}
              {activeTab === "simulation"      && " — What-if Scenarios"}
            </h2>
            <div style={{ fontFamily:"monospace", fontSize:9, color:T.sub, marginTop:2, letterSpacing:1 }}>Imperial Smelting Furnace · Digital Twin v2.0</div>
          </div>
          <div style={{ display:"flex", gap:14, alignItems:"center" }}>
            <div style={{ fontFamily:"monospace", fontSize:10, color:T.sub }}>Cycle: <span style={{ color:T.label }}>{tick}</span></div>
            <div style={{
              display:"flex", alignItems:"center", gap:6,
              background:`${T.green}0e`, border:`1px solid ${T.green}44`,
              color:T.green, fontFamily:"monospace", fontSize:10, letterSpacing:1.5, padding:"5px 13px", borderRadius:20,
            }}>
              <span style={{ width:6, height:6, background: paused ? T.amber : T.green, borderRadius:"50%", animation: paused ? "none" : "blink 1.8s infinite" }} />
              {paused ? "PAUSED" : "● OPERATIONAL"}
            </div>
          </div>
        </header>

        <main style={{ padding:"20px 24px 60px", flex:1 }}>
          {activeTab === "overview"        && <OverviewTab live={live} hist={hist} />}
          {activeTab === "recommendations" && <RecommendationsTab currentParams={simParams || currentParams} />}
          {activeTab === "simulation"      && <SimulationTab onApply={setSimParams} />}
        </main>
      </div>
    </div>
  );
}
