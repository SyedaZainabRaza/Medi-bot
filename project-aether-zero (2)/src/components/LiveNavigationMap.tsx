import React from 'react';
import { useRobot } from '../RobotStateContext';
import { HOSPITAL_NODES, HOSPITAL_EDGES } from '../utils/pathfinding';
import { Drill, ShieldAlert, Cpu, Heart, CheckCircle2 } from 'lucide-react';

export const LiveNavigationMap: React.FC = () => {
  const { 
    currentPath, 
    blockedNodeIds, 
    toggleNodeBlocked, 
    clearAllObstacles,
    currentPatient,
    isEmergencyRoute,
    playSynthSound
  } = useRobot();

  // Helper to interpolate coordinate values for the active robot progress along currentPath
  const getRobotCoordinates = (): { x: number, y: number, label: string } | null => {
    if (!currentPath || currentPath.length === 0 || !currentPatient) {
      // Show default standby position if idle, so the robot emoji is ALWAYS visible!
      const standbyNode = HOSPITAL_NODES.find(n => n.id === 'parking') || HOSPITAL_NODES[0];
      return { x: standbyNode.x, y: standbyNode.y, label: standbyNode.name };
    }

    const progress = currentPatient.routingProgress; // 0 to 100
    const segmentCount = currentPath.length - 1;

    if (segmentCount <= 0) {
      const node = HOSPITAL_NODES.find(n => n.id === currentPath[0]);
      return node ? { x: node.x, y: node.y, label: node.name } : null;
    }

    // Determine current segment index
    const segmentProgress = 100 / segmentCount;
    let segIdx = Math.floor(progress / segmentProgress);
    if (segIdx >= segmentCount) segIdx = segmentCount - 1;

    const segmentStartNodeId = currentPath[segIdx];
    const segmentEndNodeId = currentPath[segIdx + 1];

    const nStart = HOSPITAL_NODES.find(n => n.id === segmentStartNodeId);
    const nEnd = HOSPITAL_NODES.find(n => n.id === segmentEndNodeId);

    if (!nStart || !nEnd) return null;

    // Segment localized progress percent (0.0 to 1.0)
    const segStartTime = segIdx * segmentProgress;
    const segLocalRatio = (progress - segStartTime) / segmentProgress;

    const x = nStart.x + (nEnd.x - nStart.x) * segLocalRatio;
    const y = nStart.y + (nEnd.y - nStart.y) * segLocalRatio;

    return { x, y, label: segmentEndNodeId };
  };

  const robotPos = getRobotCoordinates();

  return (
    <div className="flex-grow flex flex-col h-full bg-[#040409] border border-cyan-500/10 rounded-2xl p-4 text-slate-100 font-mono relative overflow-hidden select-none" id="navigation-map-component">
      {/* Dynamic alert indicator overlay */}
      {isEmergencyRoute && (
        <div className="absolute top-3 left-4 bg-red-950/20 border border-red-500/30 px-2 py-1 rounded text-[7.5px] font-bold text-red-450 uppercase animate-pulse flex items-center gap-1.5 z-10">
          <ShieldAlert size={12} className="text-red-400 animate-spin" style={{ animationDuration: '4s' }} />
          CRITICAL TRAUMA PRIORITY ACTIVE — BYPASS RES-ZONES
        </div>
      )}

      {/* Controller headers */}
      <div className="flex justify-between items-center pb-2.5 border-b border-cyan-950/45 mb-3">
        <div>
          <span className="text-[10px] text-cyan-400 font-bold uppercase tracking-widest block">LIDAR CORRIDOR bluePrint</span>
          <span className="text-[7px] text-slate-500 uppercase mt-0.5 block font-mono">
            Click nodes to inject corridor obstacles and trigger dynamic A* pathfinding recalculations
          </span>
        </div>
        <button
          onClick={clearAllObstacles}
          disabled={blockedNodeIds.size === 0}
          className="px-2 py-1 text-[8px] font-bold uppercase rounded border transition-colors cursor-pointer bg-slate-950 border-slate-900 disabled:opacity-30 disabled:pointer-events-none hover:text-cyan-400 hover:border-cyan-950"
        >
          Clear Obstacles
        </button>
      </div>

      {/* Render map blueprint using dynamic vector SVG */}
      <div className="flex-grow flex items-center justify-center relative bg-black/40 rounded-xl border border-slate-900/50 p-2 overflow-hidden select-none">
        
        {/* Radar concentric concentric scan lines */}
        <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 flex justify-center items-center pointer-events-none">
          <div className="w-96 h-96 border border-cyan-950/5 rounded-full animate-ping" style={{ animationDuration: '8s' }} />
          <div className="absolute w-64 h-64 border border-cyan-950/10 rounded-full" />
          <div className="absolute w-36 h-36 border border-cyan-950/15 rounded-full" />
        </div>

        <svg viewBox="0 0 580 250" className="w-full h-auto relative z-10 select-none">
          {/* Group 1: Render All Base Edge corridors */}
          <g>
            {HOSPITAL_EDGES.map((e, idx) => {
              const nFrom = HOSPITAL_NODES.find(node => node.id === e.from);
              const nTo = HOSPITAL_NODES.find(node => node.id === e.to);
              if (!nFrom || !nTo) return null;

              const isBlocked = blockedNodeIds.has(e.from) || blockedNodeIds.has(e.to);
              
              // Verify segment coordinates are active in A* calculated path
              let isActivePath = false;
              if (currentPath && currentPath.length > 0) {
                const fIdx = currentPath.indexOf(e.from);
                const tIdx = currentPath.indexOf(e.to);
                if (fIdx !== -1 && tIdx !== -1 && Math.abs(fIdx - tIdx) === 1) {
                  isActivePath = true;
                }
              }

              return (
                <line
                  key={`edge-${idx}`}
                  x1={nFrom.x}
                  y1={nFrom.y}
                  x2={nTo.x}
                  y2={nTo.y}
                  stroke={
                    isBlocked 
                      ? '#ef4444' 
                      : isActivePath 
                        ? (isEmergencyRoute ? '#f43f5e' : '#06b6d4') 
                        : 'rgba(56, 189, 248, 0.08)'
                  }
                  strokeWidth={isActivePath ? 2.5 : 1}
                  strokeDasharray={e.isRestricted ? '4,4' : undefined}
                  className={isActivePath ? 'animate-pulse' : undefined}
                />
              );
            })}
          </g>

          {/* Group 2: Animated vector dashes along calculated path */}
          {currentPath && currentPath.length > 1 && (
            <g>
              {currentPath.map((nodeId, idx) => {
                if (idx === currentPath.length - 1) return null;
                const nFrom = HOSPITAL_NODES.find(n => n.id === nodeId);
                const nTo = HOSPITAL_NODES.find(n => n.id === currentPath[idx + 1]);
                if (!nFrom || !nTo) return null;

                return (
                  <line
                    key={`dash-${idx}`}
                    x1={nFrom.x}
                    y1={nFrom.y}
                    x2={nTo.x}
                    y2={nTo.y}
                    stroke={isEmergencyRoute ? '#f43f5e' : '#22d3ee'}
                    strokeWidth={3}
                    strokeLinecap="round"
                    strokeDasharray="6, 12"
                    strokeDashoffset="12"
                    className="animate-[dash_12s_linear_infinite]"
                  />
                );
              })}
            </g>
          )}

          {/* Group 3: Node Circles interactors */}
          <g>
            {HOSPITAL_NODES.map((node) => {
              const isBlocked = blockedNodeIds.has(node.id);
              const isActiveNode = currentPath && currentPath.includes(node.id);
              
              let color = 'rgba(7, 89, 133, 0.4)'; // public standard default
              if (node.type === 'restricted') color = 'rgba(127, 29, 29, 0.5)';
              else if (node.type === 'emergency') color = 'rgba(153, 27, 27, 0.45)';
              else if (node.type === 'connector') color = 'rgba(30, 41, 59, 0.6)';

              // Glowing highlights
              let ringStroke = 'rgba(56, 189, 248, 0.15)';
              if (isBlocked) ringStroke = '#f87171';
              else if (isActiveNode) ringStroke = isEmergencyRoute ? '#f43f5e' : '#22d3ee';

              return (
                <g 
                  key={node.id} 
                  transform={`translate(${node.x}, ${node.y})`}
                  className="cursor-pointer group select-none"
                  onClick={() => {
                    playSynthSound('click');
                    toggleNodeBlocked(node.id);
                  }}
                >
                  <circle
                    r={9}
                    fill={isBlocked ? 'rgba(239, 68, 68, 0.25)' : color}
                    stroke={ringStroke}
                    strokeWidth={isActiveNode || isBlocked ? 1.5 : 0.75}
                    className="group-hover:stroke-cyan-400 group-hover:scale-110 transition-transform"
                  />
                  {/* Glowing core dot */}
                  <circle
                    r={isActiveNode ? 3.5 : 2}
                    fill={
                      isBlocked 
                        ? '#ef4444' 
                        : isActiveNode 
                          ? (isEmergencyRoute ? '#f43f5e' : '#22d3ee') 
                          : 'rgba(56, 189, 248, 0.6)'
                    }
                    className={isActiveNode && !isBlocked ? 'animate-bounce' : undefined}
                  />

                  {/* Accessible tooltip box labels */}
                  <g className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
                    <rect
                      x={-42}
                      y={12}
                      width={84}
                      height={12}
                      rx={2}
                      fill="#020617"
                      stroke="rgba(34, 211, 238, 0.25)"
                      strokeWidth={0.5}
                    />
                    <text
                      y={20}
                      textAnchor="middle"
                      fill="#f8fafc"
                      fontSize={6}
                      fontWeight="bold"
                    >
                      {node.name.length > 20 ? `${node.name.slice(0, 18)}..` : node.name}
                    </text>
                  </g>
                </g>
              );
            })}
          </g>

          {/* Group 4: Moving robot marker along calculated segments path */}
          {robotPos && (
            <g transform={`translate(${robotPos.x}, ${robotPos.y})`} className="pointer-events-none select-none">
              <circle
                r={16}
                className="animate-ping stroke-cyan-400 fill-cyan-500/10"
                strokeWidth={0.7}
                style={{ animationDuration: '2.5s' }}
              />
              {/* Actual Robot Emoji! */}
              <g transform="translate(0, 0)">
                <text
                  fontSize="16"
                  textAnchor="middle"
                  dominantBaseline="central"
                  className="filter drop-shadow-[0_2px_6px_rgba(6,182,212,0.7)]"
                >
                  {isEmergencyRoute ? '🚑' : '🤖'}
                </text>
              </g>

              {/* Active direction laser beam */}
              <line 
                x1={0} 
                y1={0} 
                x2={0} 
                y2={-12} 
                stroke={isEmergencyRoute ? '#f87171' : '#22d3ee'} 
                strokeWidth={1.5}
                className="animate-bounce"
              />
              <g>
                <rect
                  x={-24}
                  y={-24}
                  width={48}
                  height={9}
                  rx={2.5}
                  fill={isEmergencyRoute ? '#991b1b' : '#083344'}
                  stroke={isEmergencyRoute ? '#ef4444' : '#22d3ee'}
                  strokeWidth={0.5}
                />
                <text
                  y={-17}
                  textAnchor="middle"
                  fill="#ffffff"
                  fontSize={5.5}
                  fontWeight="bold"
                >
                  V3 BOT UNIT
                </text>
              </g>
            </g>
          )}
        </svg>
      </div>

      {/* Legend markers row */}
      <div className="grid grid-cols-5 gap-1.5 mt-2.5 pt-2.5 border-t border-cyan-950/30 text-[7px] text-slate-450 uppercase leading-none font-bold">
        <div className="flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-[rgba(7,89,133,0.8)]" />
          <span>Public Lobby</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-[rgba(153,27,27,0.8)] animate-pulse" />
          <span>Emergency / ER</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-[rgba(127,29,29,0.8)]" />
          <span>Restricted Vault</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-[8px] h-[1.5px] bg-[#ef4444]" />
          <span>Blocked corridor</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-[8px] h-[1.5px] bg-[#06b6d4] animate-pulse" />
          <span>Active A* Route</span>
        </div>
      </div>
    </div>
  );
};
