import React, { useState, useEffect } from 'react';
import { useRobot } from '../RobotStateContext';
import { IntakeWizard } from './IntakeWizard';
import { LiveNavigationMap } from './LiveNavigationMap';
import { AdminPortal } from './AdminPortal';
import { solvePath } from '../utils/pathfinding';
import { 
  Volume2, VolumeX, ShieldAlert, Cpu, Activity, Info, Map, 
  Search, Plus, Shield, Sliders, Play, Square, RefreshCcw, 
  Terminal, HelpCircle, UserCheck, Trash2
} from 'lucide-react';

export const ChassisDashboard: React.FC = () => {
  const {
    currentPatient,
    history,
    diagnostics,
    logs,
    activePhase,
    humanState,
    chatMessages,
    sirenDetected, setSirenDetected,
    neuralLinkActive, setNeuralLinkActive,
    leftSidebarOpen, setLeftSidebarOpen,
    rightSidebarOpen, setRightSidebarOpen,
    triggerEmergencyAlert,
    shakeScreen,
    triggerHapticShake,
    playSynthSound,
    resetKiosk,
    sendChatMessage,
    robotState, updateRobotState,
    currentPath,
    isEmergencyRoute,
    startPatrol,
    stopPatrol,
    dbAppointments,
    dbDoctors,
    dbPatients,
    dbDepartments,
    isAdminUnlocked,
    setRobotState,
    dispatchStretcherMission,
    blockedNodeIds,
    setCurrentPath,
    setCurrentPatient
  } = useRobot();

  const [searchCode, setSearchCode] = useState<string>('');
  const [searchResult, setSearchResult] = useState<any>(null);
  const [searchError, setSearchError] = useState<string>('');
  const [chatInput, setChatInput] = useState<string>('');
  const [audioMuted, setAudioMuted] = useState<boolean>(false);

  // Stretcher Dispatch controller form states
  const [patName, setPatName] = useState<string>('');
  const [patAge, setPatAge] = useState<number>(30);
  const [patGender, setPatGender] = useState<string>('Male');
  const [hasApt, setHasApt] = useState<boolean>(false);
  const [selectedAptId, setSelectedAptId] = useState<string>('');
  const [selectedDeptId, setSelectedDeptId] = useState<string>('cardiology');
  const [pickupLoc, setPickupLoc] = useState<string>('waiting_a');
  const [isEmerg, setIsEmerg] = useState<boolean>(false);

  const handleDispatchStretcher = (e: React.FormEvent) => {
    e.preventDefault();
    dispatchStretcherMission({
      name: patName.trim() || 'Stretcher Walk-In',
      age: patAge,
      gender: patGender,
      hasAppointment: hasApt,
      appointmentId: hasApt && selectedAptId ? selectedAptId : undefined,
      targetDeptId: !hasApt ? selectedDeptId : undefined,
      isEmergency: isEmerg,
      stretcherLocation: pickupLoc
    });
    // Reset form fields
    setPatName('');
    setPatAge(30);
    setPatGender('Male');
    setHasApt(false);
    setIsEmerg(false);
  };

  // Search local database appointments
  const handleAppointmentSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchError('');
    setSearchResult(null);
    playSynthSound('click');

    if (!searchCode.trim()) return;

    const query = searchCode.trim().toUpperCase();
    
    // Check if code matches Appointment ID or Patient Name
    const foundApt = dbAppointments.find(a => a.id === query) || 
                     dbAppointments.find(a => {
                       const p = dbPatients.find(pat => pat.id === a.patientId);
                       return p?.name.toUpperCase().includes(query);
                     });

    if (foundApt) {
      const patient = dbPatients.find(p => p.id === foundApt.patientId);
      const doctor = dbDoctors.find(d => d.id === foundApt.doctorId);
      
      setSearchResult({
        aptId: foundApt.id,
        patientName: patient?.name || 'Unknown Patient',
        doctorName: doctor?.name || 'On Duty Specialist',
        specialty: doctor?.specialty || 'General Practice',
        roomId: foundApt.roomId,
        timeSlot: foundApt.timeSlot,
        date: foundApt.date,
        status: foundApt.status
      });
      playSynthSound('success');
    } else {
      setSearchError('NO SCHEDULING RECORD DETECTED. RETRY INPUT.');
      playSynthSound('alarm');
    }
  };

  const startEscortForFoundAppointment = () => {
    if (!searchResult) return;
    playSynthSound('success');
    
    // Find room coordinate target
    let targetId = 'cardiology';
    const room = searchResult.roomId;
    if (room === 'R-101') targetId = 'cardiology';
    else if (room === 'R-102') targetId = 'orthopedics';
    else if (room === 'R-103') targetId = 'triage';
    else if (room === 'R-104') targetId = 'dermatology';
    else if (room === 'R-105') targetId = 'neurology';
    else if (room === 'R-106') targetId = 'dermatology';
    else if (room === 'R-107' || room === 'R-108') targetId = 'labs';
    else if (room === 'R-110') targetId = 'labs';
    else if (room === 'R-111') targetId = 'radiology';

    // Set A* Path
    const path = solvePath('reception', targetId, { isEmergency: false, blockedNodeIds });
    
    setCurrentPath(path);
    
    const navPatient = {
      id: searchResult.aptId,
      name: searchResult.patientName,
      age: 40, 
      gender: 'Undefined',
      bloodLoss: 'None' as const,
      painLevel: 2,
      urgency: 'NON-EMERGENCY' as const,
      destinationName: `${searchResult.specialty} Room`,
      assignedDoctor: searchResult.doctorName,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      phase: 'processing' as const,
      routingProgress: 0
    };

    setCurrentPatient(navPatient);
    updateRobotState('GUIDING_PATIENT');
  };

  const handleSendChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    playSynthSound('click');
    sendChatMessage(chatInput);
    setChatInput('');
  };

  // Toggle SIREN OVERRIDE directly in hardware
  const handleHardwareSirenSimulation = () => {
    playSynthSound('click');
    setSirenDetected(!sirenDetected);
  };

  return (
    <div 
      className={`min-h-screen bg-[#020204] text-slate-100 p-4 md:p-6 flex flex-col justify-center items-center font-mono ${
        shakeScreen || sirenDetected ? 'animate-[shake_0.4s_ease-in-out_infinite]' : ''
      }`}
      id="main-robot-chassis"
    >
      {/* Heavy Steel Carbon Bezel container framing the stomach touchscreen display */}
      <div className="w-full max-w-7xl bg-[#0a0c10] border-[10px] border-[#252a3b] rounded-[2.5rem] shadow-[0_35px_80px_-15px_rgba(0,0,0,0.95)] relative overflow-hidden flex flex-col border-double p-5 md:p-7">
        
        {/* Bezel Screw pins in 4 corners */}
        <div className="absolute top-3 left-3 w-3.5 h-3.5 rounded-full bg-zinc-700 border border-zinc-900 shadow-inner flex items-center justify-center">
          <div className="w-2.5 h-0.5 bg-zinc-800 rotate-45" />
        </div>
        <div className="absolute top-3 right-3 w-3.5 h-3.5 rounded-full bg-zinc-700 border border-zinc-900 shadow-inner flex items-center justify-center">
          <div className="w-2.5 h-0.5 bg-zinc-800 -rotate-12" />
        </div>
        <div className="absolute bottom-3 left-3 w-3.5 h-3.5 rounded-full bg-zinc-700 border border-zinc-900 shadow-inner flex items-center justify-center">
          <div className="w-2.5 h-0.5 bg-zinc-800 rotate-12" />
        </div>
        <div className="absolute bottom-3 right-3 w-3.5 h-3.5 rounded-full bg-zinc-700 border border-zinc-900 shadow-inner flex items-center justify-center">
          <div className="w-2.5 h-0.5 bg-zinc-800 -rotate-45" />
        </div>

        {/* Physical hardware LEDs in Bezel */}
        <div className="flex justify-between items-center px-4 pb-3 mb-2 border-b-2 border-[#161a26]/40 select-none">
          <div className="flex gap-4">
            {/* LED 1: OS Status */}
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_6px_#10b981]" />
              <span className="text-[7.5px] text-slate-550 font-bold uppercase tracking-wider">CHASSIS_SYS: ACTIVE</span>
            </div>
            {/* LED 2: LIDAR lock */}
            <div className="flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full shadow ${
                robotState === 'EXPLORING_HOSPITAL' || robotState === 'GUIDING_PATIENT'
                  ? 'bg-cyan-500 animate-ping shadow-[0_0_6px_#06b6d4]' 
                  : 'bg-cyan-900'
              }`} />
              <span className="text-[7.5px] text-slate-550 font-bold uppercase tracking-wider">LIDAR: RUNNING</span>
            </div>
            {/* LED 3: Triage Warning sirens */}
            <div className="flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${
                sirenDetected || isEmergencyRoute 
                  ? 'bg-red-500 animate-ping shadow-[0_0_8px_#ef4444]' 
                  : 'bg-red-950'
              }`} />
              <span className="text-[7.5px] text-slate-550 font-bold uppercase tracking-wider">SIREN_DETECTOR: SENSED</span>
            </div>
          </div>

          {/* Logo brand and audio button */}
          <div className="flex items-center gap-4">
            <span className="text-[10px] bg-gradient-to-r from-cyan-400 to-sky-400 bg-clip-text text-transparent font-black tracking-widest uppercase">
              M.E.D.I.S.-V3 AUTONOMY PRO
            </span>
            <button
              onClick={() => {
                setAudioMuted(!audioMuted);
                playSynthSound('click');
              }}
              className="p-1 hover:text-cyan-400 text-slate-500 transition-colors"
              title="Mute synthetic vocal feedback tones"
            >
              {audioMuted ? <VolumeX size={14} /> : <Volume2 size={14} />}
            </button>
          </div>
        </div>

        {/* 16:9 VIEWPORT SCREEN BOX */}
        <div className="bg-[#020204] rounded-2xl flex flex-col md:flex-row gap-4 p-4 border border-[#1b2131]/25 relative min-h-[460px]">
          
          {/* LEFT SIDE PANEL (Hardware telemetry and room monitoring specs) */}
          <div className="w-full md:w-[28%] flex flex-col gap-4">
            <div className="flex-grow flex flex-col bg-slate-950 border border-[#1b2131]/25 rounded-2xl p-4 h-full justify-between select-none">
              <div className="space-y-4">
                <div className="border-b border-[#1b2131]/30 pb-2">
                  <span className="text-[10px] text-cyan-400 font-extrabold uppercase tracking-widest block">CHASSIS DIAGNOSTICS</span>
                  <span className="text-[7px] text-slate-500 block uppercase mt-0.5">Physical telemetry metrics</span>
                </div>
                
                <div className="space-y-3.5 text-[8.5px] font-mono leading-none">
                  <div className="flex justify-between">
                    <span className="text-slate-400">BATTERY POWER</span>
                    <span className={`font-bold ${diagnostics.battery > 30 ? 'text-green-400' : 'text-rose-500'}`}>{diagnostics.battery.toFixed(1)}%</span>
                  </div>
                  <div className="w-full bg-slate-900 h-1.5 rounded overflow-hidden">
                    <div className={`h-full ${diagnostics.battery > 30 ? 'bg-emerald-500' : 'bg-rose-500 animate-pulse'}`} style={{ width: `${diagnostics.battery}%` }} />
                  </div>

                  <div className="flex justify-between pt-1">
                    <span className="text-slate-400">CORE PROCESSOR</span>
                    <span className="text-white font-bold">{diagnostics.temperature} °C</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">STERILIZER LEVEL</span>
                    <span className="text-cyan-300 font-bold">{diagnostics.sanitizerLevel}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">ADMISSION QUEUE</span>
                    <span className="text-cyan-400 font-black text-[10px]">{diagnostics.activeQueueCount} CASES</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">SYSTEM SPEED</span>
                    <span className="text-slate-350 font-bold">1.2 M/SEC</span>
                  </div>
                </div>

                <div className="border-t border-[#1b2131]/30 pt-3">
                  <span className="text-[9px] text-cyan-400 font-extrabold uppercase tracking-widest block mb-2">HOSPITAL ROOM WATCH</span>
                  <div className="space-y-1.5 text-[7px] text-slate-500 uppercase font-mono">
                    <div>Cardiology: <span className="text-slate-300">Room R-101 (Floor 1)</span></div>
                    <div>Orthopedics: <span className="text-slate-300">Room R-102 (Floor 1)</span></div>
                    <div>Neurology: <span className="text-slate-300">Room R-105 (Floor 2)</span></div>
                    <div>Emergency Room: <span className="text-rose-400 font-bold">OT Suite 1 (ER)</span></div>
                  </div>
                </div>
              </div>

              {/* Simulated live telemetry wave */}
              <div className="pt-4 border-t border-[#1b2131]/20 mt-4">
                <span className="text-[7.5px] text-slate-500 block font-bold uppercase mb-1.5">vocal synthesizer levels</span>
                <div className="flex justify-center items-end gap-1 h-10 px-2 bg-black/40 rounded border border-[#1b2131]/10">
                  {Array.from({ length: 16 }).map((_, i) => (
                    <div 
                      key={i} 
                      className="bg-cyan-500/80 w-1 rounded-t transition-all duration-300"
                      style={{ 
                        height: `${Math.floor(10 + Math.random() * 80)}%`,
                        animation: `bounce 1s ease-in-out infinite alternate`,
                        animationDelay: `${i * 0.05}s`
                      }} 
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Simulated walk-in live status logs stream */}
            <div className="h-44 bg-slate-955 border border-slate-900 rounded-2xl p-3 flex flex-col justify-between overflow-hidden select-none">
              <div className="border-b border-cyan-950 pb-1 flex justify-between items-center text-[8.5px] font-bold text-slate-400">
                <span>SYSTEM LOG STREAM</span>
                <span className="text-green-550 text-[7px] animate-pulse">● SECURED</span>
              </div>
              <div className="flex-grow overflow-y-auto font-mono text-[7px] text-slate-500 space-y-1 py-1 selection:bg-cyan-950 pr-1 select-text">
                {logs.length > 0 ? (
                  logs.slice(0, 15).map((log, index) => (
                    <div key={index} className="leading-tight break-all border-l border-cyan-950 pl-1">
                      {log}
                    </div>
                  ))
                ) : (
                  <div className="text-center py-6">STANDBY STATUS MONITOR LOADED...</div>
                )}
              </div>
            </div>
          </div>

          {/* MAIN INTERACTIVE AREA: Changing based on active state */}
          <div className="flex-1 flex flex-col gap-4">
            
            {/* 1. EMERGENCY MODE ALERT OVERLAYS (Shown when emergency priority is active) */}
            {robotState === 'EMERGENCY' && (
              <div className="flex-grow flex flex-col bg-[#0b0304] border border-red-500/15 rounded-2xl p-5 text-slate-200 select-none" id="emergency-mode-screen">
                <div className="absolute inset-0 bg-red-950/[0.03] pointer-events-none animate-pulse" />
                <div className="flex items-center gap-2.5 text-rose-500 pb-2 border-b border-red-950 mb-3">
                  <ShieldAlert size={20} className="animate-bounce" />
                  <h3 className="text-sm font-black uppercase tracking-widest">CRITICAL DISPATCH STATUS</h3>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center text-[9px] mb-4 uppercase font-bold">
                  <div className="bg-red-950/20 border border-red-900/10 p-2 rounded">
                    <span className="text-slate-550 block text-[7px]">Severity Level</span>
                    <span className="text-rose-400 font-extrabold text-xs block mt-1">Severe Trauma</span>
                  </div>
                  <div className="bg-red-950/20 border border-red-900/10 p-2 rounded">
                    <span className="text-slate-550 block text-[7px]">Nearest Operating Ward</span>
                    <span className="text-rose-400 font-extrabold text-xs block mt-1">OT Suite Room 1</span>
                  </div>
                  <div className="bg-red-950/20 border border-red-900/10 p-2 rounded">
                    <span className="text-slate-550 block text-[7px]">Est. Escort Velocity</span>
                    <span className="text-rose-450 font-extrabold text-xs block mt-1">1.8 meters/s</span>
                  </div>
                </div>

                <div className="bg-black/40 border border-dashed border-red-950 p-3 rounded-lg text-[9.5px] text-zinc-400 leading-normal mb-4">
                  <span className="text-red-400 font-bold block mb-1">🚨 AUDIO ADIVSER BROADCAST:</span>
                  "Emergency detected. Alerting emergency response team. Hospital map paths and locks override activated. Place trauma case in front. Follow me."
                </div>

                {/* Submap routing */}
                <div className="flex-1 min-h-[140px]">
                  <LiveNavigationMap />
                </div>

                <div className="pt-3 border-t border-red-950/40 flex justify-between items-center text-[10px] font-bold mt-3">
                  <button
                    onClick={resetKiosk}
                    className="px-3 py-1 bg-slate-950 border border-slate-900 hover:border-red-900 text-slate-500 hover:text-rose-400 rounded-lg uppercase"
                  >
                    Reset Overrides
                  </button>
                    <button
                      onClick={() => updateRobotState('GUIDING_PATIENT')}
                      className="px-5 py-1 bg-rose-700 hover:bg-rose-600 rounded-lg text-white font-extrabold uppercase animate-pulse"
                    >
                      BEGIN PRIORITY ROUTING NOW
                    </button>
                </div>
              </div>
            )}

            {/* 2. CHASSIS STANDBY WELCOME HUB */}
            {robotState === 'IDLE' && (
              <div className="flex-grow flex flex-col justify-between h-full bg-[#030307] border border-cyan-500/10 rounded-2xl p-5 relative select-none" id="dashboard-standby-screen">
                <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-3 border-b border-cyan-950/30 pb-3">
                  <div>
                    <h3 className="text-sm font-black uppercase text-cyan-400 tracking-wider">
                      STRETCHER DISPATCH & CLINIC CONSOLE
                    </h3>
                    <p className="text-[9px] text-slate-400 uppercase tracking-widest mt-0.5 font-bold">
                      AUTOMATED DISPATCH HUB & RELATIONAL PORTAL DIRECTORY
                    </p>
                  </div>
                  
                  {/* DIRECT MODAL SWITCHERS */}
                  <div className="flex gap-1.5 bg-[#04060c] border border-slate-900 p-1 rounded-xl shrink-0 self-start xl:self-center">
                    <button
                      type="button"
                      onClick={() => playSynthSound('click')}
                      className="px-2.5 py-1 rounded text-[8px] font-black uppercase bg-cyan-950/80 text-cyan-400 border border-cyan-550/30 font-mono text-center shadow-[0_0_8px_rgba(6,182,212,0.15)]"
                    >
                      📟 dispatch form
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        playSynthSound('click');
                        updateRobotState('BOOKING_APPOINTMENT');
                      }}
                      className="px-2.5 py-1 rounded text-[8px] font-black uppercase bg-slate-950 text-slate-400 border border-slate-900 hover:text-white hover:border-[#1b2131] transition-all font-mono text-center"
                    >
                      🗓️ book appointment
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        playSynthSound('click');
                        updateRobotState('SEARCHING_APPOINTMENT');
                      }}
                      className="px-2.5 py-1 rounded text-[8px] font-black uppercase bg-slate-950 text-slate-400 border border-slate-900 hover:text-white hover:border-[#1b2131] transition-all font-mono text-center"
                    >
                      🔍 lookup check-in
                    </button>
                  </div>
                </div>

                <form onSubmit={handleDispatchStretcher} className="flex-grow flex flex-col justify-between mt-4 gap-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Col 1: Patient details */}
                    <div className="bg-slate-950 border border-[#1b2131]/20 p-3 rounded-xl space-y-2.5">
                      <span className="text-[8.5px] text-cyan-300 font-extrabold uppercase tracking-widest block border-b border-[#1b2131]/20 pb-1">
                        1. Patient Registration Metrics
                      </span>
                      <div className="space-y-1 text-[8px]">
                        <label className="text-slate-500 uppercase font-semibold block mb-0.5">Patient Full Name</label>
                        <input 
                          type="text"
                          required
                          value={patName}
                          onChange={(e) => setPatName(e.target.value)}
                          placeholder="e.g. Sarah Connor"
                          className="w-full bg-slate-900 border border-slate-800 focus:border-cyan-500 rounded p-1.5 text-white outline-none text-[8.5px]"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1 text-[8px]">
                          <label className="text-slate-500 uppercase font-semibold block mb-0.5">Age Index</label>
                          <input 
                            type="number"
                            min="1"
                            max="115"
                            required
                            value={patAge}
                            onChange={(e) => setPatAge(parseInt(e.target.value) || 30)}
                            className="w-full bg-slate-900 border border-slate-800 focus:border-cyan-500 rounded p-1.5 text-white outline-none text-[8.5px]"
                          />
                        </div>
                        <div className="space-y-1 text-[8px]">
                          <label className="text-slate-500 uppercase font-semibold block mb-0.5">Biological Gender</label>
                          <select
                            value={patGender}
                            onChange={(e) => setPatGender(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-800 focus:border-cyan-500 rounded p-1.5 text-white outline-none text-[8.5px]"
                          >
                            <option value="Male">Male</option>
                            <option value="Female">Female</option>
                            <option value="Other">Other</option>
                          </select>
                        </div>
                      </div>
                      <div className="space-y-1 text-[8px]">
                        <label className="text-slate-500 uppercase font-semibold block mb-0.5">Stretcher Location (Pickup Point)</label>
                        <select
                          value={pickupLoc}
                          onChange={(e) => setPickupLoc(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-800 focus:border-cyan-500 rounded p-1.5 text-white outline-none text-[8.5px] font-mono"
                        >
                          <option value="waiting_a">Waiting Lounge A (x: 60, y: 150)</option>
                          <option value="waiting_b">Waiting Lounge B (x: 120, y: 90)</option>
                          <option value="reception">Main Lobby Reception (x: 120, y: 150)</option>
                        </select>
                      </div>
                    </div>

                    {/* Col 2: Mission details and Auto-Appointment assignment */}
                    <div className="bg-slate-950 border border-[#1b2131]/20 p-3 rounded-xl space-y-2.5 flex flex-col justify-between">
                      <div>
                        <span className="text-[8.5px] text-cyan-300 font-extrabold uppercase tracking-widest block border-b border-[#1b2131]/20 pb-1 mb-2">
                          2. Scheduling & Relational DB Assign
                        </span>
                        <div className="flex items-center gap-2 mb-2">
                          <input 
                            type="checkbox"
                            id="has-apt-checkbox"
                            checked={hasApt}
                            onChange={(e) => setHasApt(e.target.checked)}
                            className="accent-cyan-400 bg-slate-900 border-slate-800 rounded cursor-pointer"
                          />
                          <label htmlFor="has-apt-checkbox" className="text-[8.5px] font-bold text-slate-350 cursor-pointer uppercase select-none">
                            Patient has pre-scheduled appointment
                          </label>
                        </div>

                        {hasApt ? (
                          <div className="space-y-1 text-[8px] animate-fade-in">
                            <label className="text-slate-500 uppercase font-semibold block mb-0.5">Select Scheduled Slot</label>
                            <select
                              value={selectedAptId}
                              onChange={(e) => setSelectedAptId(e.target.value)}
                              required
                              className="w-full bg-slate-900 border border-slate-800 focus:border-cyan-500 rounded p-1.5 text-white outline-none text-[8.5px]"
                            >
                              <option value="">-- SELECT APPOINTMENT SLOT --</option>
                              {dbAppointments.filter(a => a.status === 'Active' || a.status === 'Completed').map(apt => {
                                const patient = dbPatients.find(p => p.id === apt.patientId);
                                return (
                                  <option key={apt.id} value={apt.id}>
                                    {apt.id} • {patient?.name || 'Walk-In'} ({apt.timeSlot})
                                  </option>
                                );
                              })}
                            </select>
                            <p className="text-[6.5px] text-slate-500 uppercase mt-1 leading-normal">
                              Selecting an appointment directives the robot to take the patient specifically to their scheduled doctor's room.
                            </p>
                          </div>
                        ) : (
                          <div className="space-y-1 text-[8px] animate-fade-in">
                            <label className="text-slate-500 uppercase font-semibold block mb-0.5">Assign Specialty Department (Walk-In)</label>
                            <select
                              value={selectedDeptId}
                              onChange={(e) => setSelectedDeptId(e.target.value)}
                              className="w-full bg-slate-900 border border-slate-800 focus:border-cyan-500 rounded p-1.5 text-white outline-none text-[8.5px]"
                            >
                              {dbDepartments.map(dept => (
                                <option key={dept.id} value={dept.id}>{dept.name}</option>
                              ))}
                            </select>
                            <p className="text-[7.5px] text-emerald-400 uppercase mt-1 leading-normal font-semibold">
                              ● WALK-IN AUTO-ASSIGNMENT ENGAGED
                            </p>
                            <p className="text-[6.5px] text-slate-500 uppercase leading-normal">
                              Patients arriving without an appointment are automatically assigned a slot registration and allocated doctor clinic on dispatch.
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Emergency selection box */}
                      <div className="bg-red-950/10 border border-red-900/15 p-2 rounded-lg flex items-center justify-between">
                        <div className="text-[7.5px] uppercase font-mono max-w-[70%]">
                          <span className="text-red-400 font-extrabold block">TRAUMA ER ROUTING OVERRIDE</span>
                          <span className="text-slate-500 block leading-tight mt-0.5">Enables priority sirens and maps flashing emergency hallway trajectories.</span>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer select-none">
                          <input 
                            type="checkbox" 
                            checked={isEmerg} 
                            onChange={(e) => {
                              setIsEmerg(e.target.checked);
                              if (e.target.checked) playSynthSound('alarm');
                            }}
                            className="sr-only peer" 
                          />
                          <div className="w-8 h-4 bg-slate-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute peer-checked:bg-rose-600 outline-none after:rounded-full after:h-4 after:w-4 after:bg-white transition-all" />
                        </label>
                      </div>
                    </div>
                  </div>

                  {/* Dispatch actions row */}
                  <div className="flex gap-2.5 items-center">
                    <button
                      type="submit"
                      className={`flex-grow py-3 rounded-xl font-black text-[10px] uppercase text-white shadow-lg active:scale-95 transition-all text-center tracking-widest cursor-pointer ${
                        isEmerg 
                          ? 'bg-gradient-to-r from-red-650 to-rose-600 hover:from-red-550 animate-pulse' 
                          : 'bg-gradient-to-r from-cyan-600 to-sky-600 hover:from-cyan-555'
                      }`}
                    >
                      {isEmerg 
                        ? '🚨 ENGAGE PRIORITY SIRENS & DISPATCH FOR ER ROUTE' 
                        : '🚀 ROUTE STRETCHER & DISPATCH UNIT'}
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        playSynthSound('click');
                        startPatrol();
                      }}
                      className="px-4 py-3 bg-slate-950 border border-slate-900 hover:border-cyan-550 hover:text-cyan-400 text-slate-500 rounded-xl transition-all cursor-pointer"
                      title="Initiate Corridor巡邏 Mode"
                    >
                      <Map size={16} />
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* 3. APPOINTMENT SEARCH LOOKUP PANEL */}
            {robotState === 'SEARCHING_APPOINTMENT' && (
              <div className="flex-grow flex flex-col justify-between h-full bg-[#030307] border border-cyan-500/10 rounded-2xl p-5 relative select-none" id="search-view-screen">
                <div className="space-y-4">
                  <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-3 border-b border-cyan-950/30 pb-3">
                    <div>
                      <span className="text-xs text-cyan-400 font-bold uppercase tracking-widest block">FIND REGISTERED APPOINTMENTS</span>
                      <span className="text-[7.5px] text-slate-500 block mt-0.5">Lookup patient check-in codes</span>
                    </div>
                    
                    {/* DIRECT MODAL SWITCHERS */}
                    <div className="flex gap-1.5 bg-[#04060c] border border-slate-900 p-1 rounded-xl shrink-0 self-start xl:self-center">
                      <button
                        type="button"
                        onClick={() => {
                          playSynthSound('click');
                          updateRobotState('IDLE');
                        }}
                        className="px-2.5 py-1 rounded text-[8px] font-black uppercase bg-slate-950 text-slate-400 border border-slate-900 hover:text-white hover:border-[#1b2131] transition-all font-mono text-center"
                      >
                        📟 dispatch form
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          playSynthSound('click');
                          updateRobotState('BOOKING_APPOINTMENT');
                        }}
                        className="px-2.5 py-1 rounded text-[8px] font-black uppercase bg-slate-950 text-slate-400 border border-slate-900 hover:text-white hover:border-[#1b2131] transition-all font-mono text-center"
                      >
                        🗓️ book appointment
                      </button>
                      <button
                        type="button"
                        onClick={() => playSynthSound('click')}
                        className="px-2.5 py-1 rounded text-[8px] font-black uppercase bg-cyan-950/80 text-cyan-400 border border-cyan-550/30 font-mono text-center shadow-[0_0_8px_rgba(6,182,212,0.15)]"
                      >
                        🔍 lookup check-in
                      </button>
                    </div>
                  </div>

                  <form onSubmit={handleAppointmentSearch} className="flex gap-2 bg-black border border-slate-850 p-2.5 rounded-xl">
                    <Search size={16} className="text-cyan-500" />
                    <input 
                      type="text"
                      value={searchCode}
                      onChange={(e) => setSearchCode(e.target.value)}
                      placeholder="ENTER APPOINTMENT ID (e.g. APT-1082) OR PATIENT FULL NAME..."
                      className="flex-grow bg-transparent text-[10px] text-white outline-none font-mono placeholder-slate-750 uppercase"
                    />
                    <button 
                      type="submit"
                      className="px-4 py-1 bg-cyan-750 hover:bg-cyan-650 rounded text-[9px] font-black uppercase text-white shadow-md active:scale-95 transition-all"
                    >
                      Search ID
                    </button>
                  </form>

                  {/* Search Result Folder display */}
                  {searchResult ? (
                    <div className="bg-[#05060b] border border-cyan-500/25 p-4 rounded-xl space-y-3 shadow-md">
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-white font-black">{searchResult.aptId} RECORD ENVELOPE</span>
                        <span className="bg-cyan-950 text-cyan-400 text-[8px] font-bold px-1 rounded uppercase">VERIFIED</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-[8.5px] leading-relaxed">
                        <div>PATIENT: <span className="text-white font-bold uppercase">{searchResult.patientName}</span></div>
                        <div>SPECIALIST: <span className="text-cyan-300 font-semibold">{searchResult.doctorName}</span></div>
                        <div>WING ASSIGN: <span className="text-white font-bold">{searchResult.specialty}</span></div>
                        <div>OFFICE APPOINTED: <span className="text-white font-semibold">{searchResult.roomId}</span></div>
                        <div>SLOT DATUM: <span className="text-white font-semibold">{searchResult.timeSlot} • {searchResult.date}</span></div>
                      </div>
                      <button
                        onClick={startEscortForFoundAppointment}
                        className="w-full py-1.5 bg-gradient-to-r from-cyan-600 to-sky-600 text-white text-[9px] font-black uppercase rounded-lg shadow mt-2 hover:from-cyan-550 active:scale-95 transition-all"
                      >
                        Calculate Route & Begin escort guidance
                      </button>
                    </div>
                  ) : searchError ? (
                    <div className="bg-[#120406] border border-red-950 p-4 rounded-xl text-[9px] text-red-400 uppercase tracking-wide">
                      ⚡ {searchError}
                      <span className="block text-[7px] text-slate-500 mt-1 uppercase font-normal leading-normal">
                        Preloaded demo codes inside system context: `APT-1082` OR `John Connor` or `Sarah Connor`
                      </span>
                    </div>
                  ) : (
                    <div className="text-center py-10 text-[8px] text-slate-550 uppercase tracking-widest bg-[#040508] border border-slate-900 rounded-xl">
                      Input your scheduled credential barcode bytes
                    </div>
                  )}
                </div>

                <div className="text-[7.5px] text-slate-500 text-center uppercase leading-normal pt-2 border-t border-cyan-c10% mt-5 select-none">
                  Check-in records are automatically saved inside browser standard key localStorage memory arrays.
                </div>
              </div>
            )}

            {/* 4. BOOK NEW APPOINTMENT INTENT WIZARD */}
            {robotState === 'BOOKING_APPOINTMENT' && (
              <IntakeWizard />
            )}

            {/* 5. TRAVELING / GUIDING PATIENT SCENARIO */}
            {robotState === 'GUIDING_PATIENT' && (
              <div className="flex-grow flex flex-col bg-[#030409] border border-cyan-500/10 rounded-2xl p-4 text-slate-200 select-none" id="routing-progress-screen">
                <div className="border-b border-cyan-950 pb-2 mb-3 flex justify-between items-center text-[10px] font-bold text-slate-400">
                  <span className="text-cyan-400 uppercase font-black tracking-widest flex items-center gap-1.5">
                    <Cpu size={12} className="animate-spin text-cyan-300" />
                    AUTONOMOUS ROUTE DISPATCH ESCORT
                  </span>
                  <span>PROGRESS: {currentPatient?.routingProgress}%</span>
                </div>

                {/* Progress bar line */}
                <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden mb-4 relative border border-slate-900">
                  <div 
                    className="bg-gradient-to-r from-cyan-555 to-blue-555 h-full transition-all duration-300" 
                    style={{ width: `${currentPatient?.routingProgress}%` }} 
                  />
                </div>

                {/* Info files */}
                <div className="bg-[#04050a] border border-cyan-950 p-3 rounded-lg text-[9px] mb-4 space-y-1.5 select-text selection:bg-cyan-950 font-mono">
                  <div>DISPATCHING TARGET: <span className="text-white font-bold uppercase">{currentPatient?.name}</span></div>
                  <div>DESTINATION LOCATION: <span className="text-cyan-300 font-bold uppercase">{currentPatient?.destinationName}</span></div>
                  <div>ASSIGNED SPECIALIST: <span className="text-white font-semibold">{currentPatient?.assignedDoctor || 'Clinic Specialist'}</span></div>
                  <div>TELEMETRY MESSAGE: <span className="text-green-400 animate-pulse uppercase">"Corridors clearing. Follow me at my wheel base pacing."</span></div>
                </div>

                {/* Map renders */}
                <div className="flex-1 min-h-[140px]">
                  <LiveNavigationMap />
                </div>

                <div className="pt-3 border-t border-cyan-950/40 flex justify-between items-center text-[10px] font-bold mt-3">
                  <button
                    onClick={resetKiosk}
                    className="px-3 py-1 bg-slate-950 border border-slate-900 hover:border-red-950 text-slate-500 hover:text-red-400 rounded-lg uppercase"
                  >
                    Abort Route
                  </button>
                  <div className="text-[7.5px] text-slate-550 uppercase">
                    ETA count remaining: ~{Math.max(5, Math.ceil((100 - (currentPatient?.routingProgress || 0)) * 0.4))} SECS
                  </div>
                </div>
              </div>
            )}

            {/* 6. AUTONOMOUS CORRIDOR PATROL SCENARIO */}
            {robotState === 'EXPLORING_HOSPITAL' && (
              <div className="flex-grow flex flex-col bg-[#030409] border border-cyan-500/10 rounded-2xl p-4 text-slate-200 select-none" id="patrol-active-screen">
                <div className="border-b border-cyan-950 pb-2 mb-3 flex justify-between items-center text-[10px] font-bold text-slate-400">
                  <span className="text-cyan-400 uppercase font-black tracking-widest flex items-center gap-1.5">
                    <Activity size={12} className="animate-spin text-cyan-300" />
                    AUTONOMOUS HALL PATROL DISPATCH
                  </span>
                  <span className="text-emerald-400 animate-pulse font-bold flex items-center gap-1">
                    RADAR ACTIVE
                  </span>
                </div>

                <div className="bg-[#04060a] border border-cyan-950 p-3 rounded-lg text-[9px] mb-4 space-y-1 leading-normal selection:bg-cyan-950 select-text">
                  <div className="text-slate-400">Patrol parameters:</div>
                  <div>MISSION STATUS: <span className="text-white font-extrabold uppercase">SCANNING FLUID SPILLS / CORRIDOR BLOCKAGES</span></div>
                  <div>LIDAR ACCURACY: <span className="text-green-400 font-bold uppercase">NOMINAL (99.2%)</span></div>
                  <div>SECURITY BYTES: <span className="text-cyan-300">All public clinical wings monitored in database sequences.</span></div>
                </div>

                {/* Map Renders */}
                <div className="flex-1 min-h-[140px]">
                  <LiveNavigationMap />
                </div>

                <div className="pt-3 border-t border-cyan-950/45 flex justify-between items-center text-[10px] font-bold mt-3">
                  <button
                    onClick={stopPatrol}
                    className="px-4 py-1.5 bg-rose-950/20 border border-red-900 hover:bg-rose-900 hover:text-white rounded-lg text-rose-400 font-extrabold uppercase"
                  >
                    Stagger Patrol Explore
                  </button>
                  <div className="text-[7.5px] text-slate-500 uppercase">
                    OS: Idle patrolling utilizes trace energy vectors.
                  </div>
                </div>
              </div>
            )}

          </div>

        </div>

        {/* BOTTOM SECTION: SECURED DATABASE ADMIN CHASSIS COMPACT DRAWER (LOCKED/UNLOCKED PORTAL CODES) */}
        <div className="mt-4" id="admin-bezel-bottom">
          <AdminPortal />
        </div>

      </div>
    </div>
  );
};
