import React, { useMemo } from 'react';
import { motion } from 'motion/react';
import { Cpu, Navigation, Star } from 'lucide-react';

interface Point {
  x: number;
  y: number;
}

interface HospitalMapProps {
  destination: string | null;
  progress: number; // 0 to 100
}

export const HospitalMap: React.FC<HospitalMapProps> = ({ destination, progress }) => {
  // SVG coordinates: 0 to 400 width, 0 to 300 height
  const nodes = useMemo(() => ({
    ENTRANCE: { x: 200, y: 270, label: 'LOBBY ARRIVAL' },
    INTERSECTION: { x: 200, y: 170, label: 'MAIN HALLWAY CORRIDOR' },
    ER: { x: 60, y: 170, label: 'EMERGENCY AREA' },
    UP_HUB: { x: 200, y: 90, label: 'TRANSIT HUB' },
    ICU: { x: 60, y: 50, label: 'ICU WING' },
    OT: { x: 340, y: 50, label: 'SURGERY UNIT-1' },
    CLINICS: { x: 340, y: 170, label: 'CLINICS ARCHWAY' },
    PHARMACY: { x: 200, y: 130, label: 'CHEMISTRY DISPENSARY' }
  }), []);

  // Generate cubic Bezier points between start and end with two control points
  const getCubicPoints = (p0: Point, p1: Point, p2: Point, p3: Point, count = 100): Point[] => {
    const pts: Point[] = [];
    for (let i = 0; i <= count; i++) {
      const t = i / count;
      const mt = 1 - t;
      const x = mt*mt*mt*p0.x + 3*mt*mt*t*p1.x + 3*mt*t*t*p2.x + t*t*t*p3.x;
      const y = mt*mt*mt*p0.y + 3*mt*mt*t*p1.y + 3*mt*t*t*p2.y + t*t*t*p3.y;
      pts.push({ x, y });
    }
    return pts;
  };

  // Determine active curved spline path based on target destination
  const activeSplinePoints = useMemo<Point[]>(() => {
    if (!destination) return [];
    const dLower = destination.toLowerCase();

    // Cubic Bezier parameters designed for organic obstacle bypass wiggles
    if (dLower.includes('emergency') || dLower.includes('er')) {
      return getCubicPoints(
        nodes.ENTRANCE,
        { x: 200, y: 220 }, // control 1
        { x: 130, y: 178 }, // control 2
        nodes.ER
      );
    } else if (dLower.includes('operating') || dLower.includes('theater') || dLower.includes('ot')) {
      return getCubicPoints(
        nodes.ENTRANCE,
        { x: 200, y: 220 },
        { x: 340, y: 150 },
        nodes.OT
      );
    } else if (dLower.includes('intensive') || dLower.includes('icu')) {
      return getCubicPoints(
        nodes.ENTRANCE,
        { x: 200, y: 220 },
        { x: 60, y: 150 },
        nodes.ICU
      );
    } else if (dLower.includes('clinic') || dLower.includes('specialist')) {
      return getCubicPoints(
        nodes.ENTRANCE,
        { x: 200, y: 220 },
        { x: 270, y: 178 },
        nodes.CLINICS
      );
    }
    
    // S-curve sinusoidal bypass path to Pharmacy
    return getCubicPoints(
      nodes.ENTRANCE,
      { x: 240, y: 220 },
      { x: 160, y: 170 },
      nodes.PHARMACY
    );
  }, [destination, nodes]);

  // Compute exact {x, y, angle} of the robot emoji
  const robotState = useMemo(() => {
    if (activeSplinePoints.length === 0) {
      return { x: nodes.ENTRANCE.x, y: nodes.ENTRANCE.y, angle: 270 };
    }

    const maxIdx = activeSplinePoints.length - 1;
    const progressRatio = Math.max(0, Math.min(100, progress)) / 100;
    const rawIdx = progressRatio * maxIdx;
    const idx = Math.floor(rawIdx);
    const localRatio = rawIdx - idx;

    const curr = activeSplinePoints[idx];
    const next = activeSplinePoints[idx + 1] || curr;

    // Linearly interpolate between the two dense spline nodes
    const x = curr.x + (next.x - curr.x) * localRatio;
    const y = curr.y + (next.y - curr.y) * localRatio;

    // Tangent angle calculation to align the robot's heading
    const dx = next.x - curr.x;
    const dy = next.y - curr.y;
    let angle = Math.atan2(dy, dx) * (180 / Math.PI);
    if (dx === 0 && dy === 0) {
      angle = -90; // Default facing up
    }

    return { x, y, angle };
  }, [activeSplinePoints, progress, nodes]);

  return (
    <div className="bg-slate-900/50 border border-slate-800 p-5 rounded-3xl flex flex-col h-full backdrop-blur-md relative overflow-hidden" id="hospital-map-container">
      {/* Laser decoration line */}
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-cyan-500/10 shadow-[0_4px_30px_#06b6d4]" />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
        <div>
          <h2 className="text-xs font-bold font-mono tracking-widest text-cyan-400 uppercase flex items-center gap-2">
            <Cpu size={14} className="animate-spin text-cyan-400" />
            V3 Chassis Path Planner Spline
          </h2>
          <p className="text-[10px] text-slate-400 font-mono uppercase tracking-wider">
            {destination 
              ? `Calculating curved trajectory ──> ${destination} (${progress}%)` 
              : 'Standby: Active Lidar sweeps on entrance gate'}
          </p>
        </div>
        <div className="flex gap-2 text-[9px] font-mono shrink-0 select-none">
          <span className="flex items-center gap-1 text-cyan-400 bg-cyan-950/40 px-2.5 py-0.5 rounded border border-cyan-800/40">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" /> DWA MODE: ON
          </span>
          {destination && progress < 100 && (
            <span className="flex items-center gap-1 text-pink-400 bg-pink-950/40 px-2.5 py-0.5 rounded border border-pink-800/40 animate-pulse">
              <Navigation size={10} className="animate-bounce" /> TRAVELING
            </span>
          )}
        </div>
      </div>

      {/* Map Drawing Box */}
      <div className="flex-1 min-h-[290px] border border-slate-800/30 bg-black rounded-2xl relative overflow-hidden flex items-center justify-center">
        {/* Lidar concentric guidelines rings */}
        <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 flex justify-center items-center pointer-events-none opacity-20">
          <div className="w-80 h-80 border border-dashed border-cyan-900/20 rounded-full animate-pulse" />
          <div className="absolute w-52 h-52 border border-cyan-900/15 rounded-full" />
          <div className="absolute w-28 h-28 border border-cyan-900/10 rounded-full" />
        </div>

        <svg viewBox="0 0 400 300" className="w-full h-full p-1 select-none">
          
          {/* DEFINITIONS for gradients, filters, marker flags */}
          <defs>
            <linearGradient id="hallway-grad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#08101e" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#02060d" stopOpacity="0.9" />
            </linearGradient>
            <linearGradient id="obstacle-grad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#1e293b" />
              <stop offset="100%" stopColor="#0f172a" />
            </linearGradient>
            <radialGradient id="beacon-glow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.6" />
              <stop offset="100%" stopColor="#06b6d4" stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* OBSTACLE CLINIC BLOCKS (Bento shape layout from image) */}
          <g id="bento-room-obstacles" opacity="0.85">
            {/* Block A: Left Diagnostic Lab Area */}
            <rect x="95" y="80" width="70" height="60" rx="6" fill="url(#obstacle-grad)" stroke="#1e293b" strokeWidth="1" />
            <text x="130" y="115" textAnchor="middle" fill="#475569" fontSize="6" fontWeight="bold" className="font-mono">CLINICAL LABS</text>

            {/* Block B: Right Nursing Center */}
            <rect x="235" y="80" width="70" height="60" rx="6" fill="url(#obstacle-grad)" stroke="#1e293b" strokeWidth="1" />
            <text x="270" y="115" textAnchor="middle" fill="#475569" fontSize="6" fontWeight="bold" className="font-mono">NURSING CORP</text>

            {/* Block C: Inner Diagnostic Unit */}
            <rect x="95" y="195" width="70" height="45" rx="6" fill="url(#obstacle-grad)" stroke="#1e293b" strokeWidth="1" />
            <text x="130" y="222" textAnchor="middle" fill="#475569" fontSize="6" fontWeight="bold" className="font-mono">RADIOLOGY</text>

            {/* Block D: Pharmacy Store block */}
            <rect x="235" y="195" width="70" height="45" rx="6" fill="url(#obstacle-grad)" stroke="#1e293b" strokeWidth="1" />
            <text x="270" y="222" textAnchor="middle" fill="#475569" fontSize="6" fontWeight="bold" className="font-mono">PHARM STORE</text>
          </g>

          {/* FAINT CANDIDATE PATHS (Dynamic Window search paths) */}
          {destination && progress < 100 && (
            <g id="dwa-alternative-beams" opacity="0.25">
              {/* Curve left shadow trail */}
              <path 
                d="M 200,270 Q 160,240 100,170" 
                fill="none" 
                stroke="#eab308" 
                strokeWidth="1.2" 
                strokeDasharray="3, 3" 
              />
              {/* Curve right shadow trail */}
              <path 
                d="M 200,270 Q 240,240 300,170" 
                fill="none" 
                stroke="#eab308" 
                strokeWidth="1.2" 
                strokeDasharray="3, 3" 
              />
              {/* Center trace shadow trail */}
              <path 
                d="M 200,270 T 200,105" 
                fill="none" 
                stroke="#38bdf8" 
                strokeWidth="0.8" 
                strokeDasharray="4, 4" 
              />
            </g>
          )}

          {/* ACTIVE SMOOTH BÉZIER SOLVED SPLINE TRAJECTORY */}
          {activeSplinePoints.length > 0 && (
            <g id="resolved-smooth-track">
              {/* Glow backdrop track line */}
              <path
                d={`M ${activeSplinePoints.map(p => `${p.x},${p.y}`).join(' L ')}`}
                fill="none"
                stroke="#06b6d4"
                strokeWidth="4"
                strokeOpacity="0.15"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              {/* Highlight resolve path */}
              <path
                d={`M ${activeSplinePoints.map(p => `${p.x},${p.y}`).join(' L ')}`}
                fill="none"
                stroke="#0891b2"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              {/* Active laser dashed path overlays */}
              <path
                d={`M ${activeSplinePoints.map(p => `${p.x},${p.y}`).join(' L ')}`}
                fill="none"
                stroke={destination?.toLowerCase().includes('emergency') || destination?.toLowerCase().includes('er') ? '#ec4899' : '#14b8a6'}
                strokeWidth="1.5"
                strokeDasharray="4, 5"
                className="animate-pulse"
                strokeLinecap="round"
              />
            </g>
          )}

          {/* CLINICAL ROOM TERMINAL STATIONS / NODES */}
          {Object.entries(nodes).map(([key, value]) => {
            const isDestination = destination && destination.toLowerCase().includes(
              key === 'CLINICS' ? 'clinic' : key === 'OT' ? 'theater' : key.toLowerCase()
            );

            return (
              <g key={key} transform={`translate(${value.x}, ${value.y})`} className="cursor-pointer">
                {/* Target beacon background ring */}
                {isDestination && (
                  <circle r="16" fill="rgba(244, 63, 94, 0.1)" stroke="#f43f5e" strokeWidth="1" className="animate-ping" style={{ animationDuration: '3s' }} />
                )}

                <circle 
                  r="10" 
                  className={`transition-colors duration-300 ${
                    isDestination 
                      ? 'fill-pink-950 stroke-pink-500 stroke-[1.5]' 
                      : key === 'ENTRANCE' 
                        ? 'fill-cyan-950 stroke-cyan-500' 
                        : 'fill-slate-900 stroke-slate-750'
                  }`} 
                  strokeWidth="1"
                />
                
                {/* Visual node core dot */}
                <circle 
                  r="2.5" 
                  className={isDestination ? 'fill-pink-400' : key === 'ENTRANCE' ? 'fill-cyan-400' : 'fill-slate-500'} 
                />

                {/* Elegant floating node tags */}
                <text 
                  y="-14" 
                  textAnchor="middle" 
                  className={`font-mono font-black select-none text-[6.5px] uppercase tracking-wider ${
                    isDestination ? 'fill-pink-400' : 'fill-slate-450'
                  }`}
                >
                  {key === 'ENTRANCE' ? 'LOBBY START' : key}
                </text>
              </g>
            );
          })}

          {/* ANIMATED CHASSIS VEHICLE ROBOT EMOJI AT INTERPOLATED HEADING (The requested moving emoji!) */}
          <g transform={`translate(${robotState.x}, ${robotState.y})`}>
            {/* Lidar scanner radius ring */}
            <circle r="22" fill="url(#beacon-glow)" stroke="rgba(6, 182, 212, 0.15)" strokeWidth="0.5" className="animate-pulse" />
            
            {/* Exhaust trailing particles */}
            {progress > 0 && progress < 100 && (
              <g opacity="0.8">
                <circle cx="-12" cy="12" r="2" fill="#ec4899" className="animate-ping" style={{ animationDuration: '1.2s' }} />
                <circle cx="-16" cy="-8" r="1.5" fill="#0ea5e9" className="animate-ping" style={{ animationDuration: '1s' }} />
              </g>
            )}

            {/* Rotated vehicle body node */}
            <g transform={`rotate(${robotState.angle + 90})`}>
              {/* Moving emoji centered precisely! */}
              <text 
                fontSize="18" 
                textAnchor="middle" 
                dominantBaseline="central"
                className="filter drop-shadow-[0_2px_8px_rgba(6,182,212,0.6)]"
              >
                {destination && (destination.toLowerCase().includes('emergency') || destination.toLowerCase().includes('er')) ? '🚑' : '🤖'}
              </text>

              {/* Mini laser directional heading dot marker */}
              <circle cx="0" cy="-13" r="1.5" fill="#22d3ee" className="animate-pulse" />
            </g>

            {/* Mini tag label above emoji */}
            <g transform="translate(0, -22)">
              <rect x="-24" y="-7" width="48" height="10" rx="3.5" fill="#020617" stroke="#0ea5e9" strokeWidth="0.5" />
              <text x="0" y="0" textAnchor="middle" fill="#ffffff" fontSize="5.5" fontWeight="black" className="font-mono">
                {destination ? 'BIONIC V3' : 'V3 IDLE'}
              </text>
            </g>
          </g>

        </svg>

        {/* Dynamic status card in the corner */}
        <div className="absolute bottom-3 right-3 bg-slate-950/90 border border-slate-900/60 p-3 rounded-2xl flex flex-col gap-1.5 text-[7.5px] font-mono leading-none max-w-[140px] shadow-2xl select-none">
          <div className="text-[6.5px] text-slate-500 uppercase font-black border-b border-slate-900 pb-1">MAP COLOR KEY</div>
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-pink-500" />
            <span className="text-slate-400">Target Station</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#0891b2]" />
            <span className="text-slate-400">Resolved DWA Spline</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-yellow-500/80" />
            <span className="text-slate-400">Candidate Search paths</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-cyan-400 animate-pulse font-extrabold font-sans">🤖 / 🚑</span>
            <span className="text-slate-400">Dynamic Moving Unit</span>
          </div>
        </div>
      </div>
    </div>
  );
};
