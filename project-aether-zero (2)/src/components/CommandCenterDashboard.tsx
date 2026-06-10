import React, { useEffect, useState } from 'react';
import { useRobot, DEPARTMENTS_DB } from '../RobotStateContext';
import { RobotConsole } from './RobotConsole';
import { HospitalMap } from './HospitalMap';
import { RelationalDBVisualizer } from './RelationalDBVisualizer';
const medisConcept = "/src/assets/images/medis_concept_1781021399769.png";
import { 
  Activity, 
  RefreshCw, 
  HeartHandshake, 
  MapPin, 
  Cpu, 
  Clock,
  Mic,
  ChevronDown,
  Battery,
  Thermometer,
  Droplets,
  Terminal,
  Fingerprint
} from 'lucide-react';

export const CommandCenterDashboard: React.FC = () => {
  const { 
    currentPatient, 
    triggerEmergencyAlert, 
    resetKiosk,
    sirenDetected,
    setSirenDetected,
    shakeScreen,
    activePhase,
    playSynthSound,
    logs,
    diagnostics,
    initializeAndAutoAssignPatient,
    dbPatients,
    dbAppointments,
    dbDoctors
  } = useRobot();

  const [dateStr, setDateStr] = useState("2026-06-02 18:22:19 UTC");
  const [regPortalOpen, setRegPortalOpen] = useState(true);
  
  // Registration form local state
  const [regName, setRegName] = useState("");
  const [regAge, setRegAge] = useState("");
  const [regGender, setRegGender] = useState("Male");

  // Keep a ticking clock in the dashboard
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      setDateStr(now.toISOString().replace('T', ' ').substring(0, 19) + ' UTC');
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleRegSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    initializeAndAutoAssignPatient(regName, parseInt(regAge) || 30, regGender);
    // Reset form fields
    setRegName("");
    setRegAge("");
    setRegGender("Male");
  };

  // Determine dynamic background theme based on activePhase and emergency status
  const getBackgroundTheme = () => {
    if (activePhase === 'routing_active' && currentPatient?.urgency === 'EMERGENCY') {
      return 'bg-[#180509] border-red-950/40 text-red-100';
    }
    if (sirenDetected || triggerEmergencyAlert) {
      return 'bg-[#1d060a] border-red-950/60 text-red-100'; // Severe Trauma pulsing crimson
    }
    if (activePhase === 'triage_assessment' || activePhase === 'symptom_select' || activePhase === 'followup_select') {
      return 'bg-[#150e02] border-amber-950/40 text-amber-100'; // Flashing amber during intake
    }
    return 'bg-[#040712] border-slate-900/60 text-slate-100'; // Calm diagnostic teal-blue standby
  };

  return (
    <div 
      className={`min-h-screen w-full text-slate-100 flex flex-col font-sans relative selection:bg-pink-500/30 overflow-hidden transition-all duration-700 ${getBackgroundTheme()} ${shakeScreen ? 'animate-shake' : ''}`}
      id="medis-cockpit"
    >
      
      {/* SCAN LINE LAYER */}
      <div className="absolute inset-0 pointer-events-none z-50 overflow-hidden opacity-[0.015] select-none">
        <div className="w-full h-[3px] bg-cyan-400 animate-[scan_7s_linear_infinite]" />
      </div>

      {/* EMERGENCY COLOR BLENDING RADIAL GRADIENTS */}
      {triggerEmergencyAlert ? (
        <div className="absolute inset-0 pointer-events-none z-10 bg-[radial-gradient(circle_at_center,_rgba(255,0,122,0.08)_0%,_transparent_80%)] animate-pulse" />
      ) : activePhase === 'symptom_select' || activePhase === 'triage_assessment' ? (
        <div className="absolute inset-0 pointer-events-none z-10 bg-[radial-gradient(circle_at_center,_rgba(251,191,36,0.02)_0%,_transparent_80%)]" />
      ) : (
        <div className="absolute inset-0 pointer-events-none z-10 bg-[radial-gradient(circle_at_center,_rgba(0,242,254,0.02)_0%,_transparent_80%)]" />
      )}

      {/* MAIN HEADER */}
      <header className="h-16 border-b border-slate-900/80 bg-slate-950/85 backdrop-blur-md px-6 flex items-center justify-between z-30 select-none flex-shrink-0">
        
        {/* Left header area */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#00F2FE] to-[#ff007a] flex items-center justify-center shadow-[0_0_15px_rgba(0,242,254,0.2)]">
            <HeartHandshake className="text-white" size={18} />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-[8px] font-mono font-bold tracking-[0.15em] text-[#00F2FE] uppercase">
                Robotic Triage Core
              </span>
              <span className="h-1 w-1 rounded-full bg-slate-800" />
              <span className="text-[8px] font-mono text-slate-500 uppercase">
                Model M.E.D.I.S.-V3
              </span>
            </div>
            <h1 className="text-xs font-black font-mono text-white flex items-center gap-2 tracking-wide">
              M.E.D.I.S.-V3 HOSPITAL NAVIGATION COMMAND CENTER
              <span className="text-[8px] text-emerald-400 font-normal px-1.5 py-0.2 bg-emerald-950/40 border border-emerald-900/30 rounded-md animate-pulse">
                SYS_ACTIVE
              </span>
            </h1>
          </div>
        </div>

        {/* Center / Stats status */}
        <div className="hidden lg:flex items-center gap-6 text-[9px] font-mono text-slate-500">
          <div className="flex flex-col">
            <span className="text-slate-600 uppercase text-[7px] tracking-wider">Active Sector</span>
            <span className="text-slate-200 font-bold flex items-center gap-1">
              <MapPin size={11} className="text-[#00F2FE]" /> NORTH_ENTRANCE_LOBBY
            </span>
          </div>
          <div className="h-6 w-px bg-slate-900" />
          <div className="flex flex-col">
            <span className="text-slate-600 uppercase text-[7px] tracking-wider">Neural Uplink</span>
            <span className="text-slate-200 font-bold flex items-center gap-1">
              <Cpu size={11} className="text-[#ff007a]" /> NEURAL_CONNECT_ACTIVE
            </span>
          </div>
          <div className="h-6 w-px bg-slate-900" />
          <div className="flex flex-col">
            <span className="text-slate-600 uppercase text-[7px] tracking-wider">Cockpit Time</span>
            <span className="text-slate-300 font-bold flex items-center gap-1">
              <Clock size={11} className="text-slate-400" /> {dateStr}
            </span>
          </div>
        </div>

        {/* Right Action buttons */}
        <div className="flex items-center gap-2">
          <button 
            type="button"
            onClick={() => {
              playSynthSound('click');
              resetKiosk();
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-850 text-slate-300 hover:text-white border border-slate-800 rounded-lg font-mono text-[8.5px] uppercase font-bold tracking-widest transition-all"
            id="reset-state-btn"
          >
            <RefreshCw size={11} />
            <span>RESET CORE STATE</span>
          </button>
        </div>

      </header>

      {/* ARCHITECTURE: THREE-COLUMN DIVISION */}
      <div className="flex-1 flex flex-col md:flex-row w-full overflow-hidden relative z-20 h-[calc(100vh-64px)]">

        {/* COLUMN 1: LEFT SIDEBAR (20% WIDTH) */}
        <aside 
          className="w-full md:w-[20%] shrink-0 border-r border-slate-900/80 bg-slate-950/90 backdrop-blur-md flex flex-col p-4 gap-4 overflow-y-auto custom-scrollbar h-full relative z-30 select-none"
          id="left-controls-sidebar"
        >
          {/* Header icon block */}
          <div className="border-b border-slate-900 pb-3 flex items-center gap-2">
            <Cpu size={14} className="text-[#00F2FE]" />
            <span className="text-[10px] font-mono font-black text-white tracking-widest uppercase">COGNITIVE SYSTEMS</span>
          </div>

          {/* ACOUSTIC SIMULATION BUTTON */}
          <button 
            onClick={() => {
              playSynthSound('click');
              setSirenDetected(!sirenDetected);
            }}
            id="sim-siren-btn"
            className={`relative w-full p-3 rounded-2xl flex items-center gap-3 font-mono text-[10px] font-bold tracking-wider transition-all duration-300 border uppercase overflow-hidden group ${
              sirenDetected 
                ? 'bg-red-950/40 border-[#ff007a] text-red-100 shadow-[0_0_15px_rgba(255,0,122,0.3)]' 
                : 'bg-slate-900/60 border-slate-805 hover:border-sky-500/50 text-slate-300 hover:text-white'
            }`}
          >
            {/* Pulsating glowing ring overlay when active */}
            <span className={`absolute -inset-px rounded-2xl border-2 pointer-events-none transition-opacity ${
              sirenDetected ? 'border-[#ff007a] animate-pulse opacity-40' : 'opacity-0'
            }`} />
            
            <div className={`p-2 rounded-xl flex items-center justify-center ${sirenDetected ? 'bg-red-900 animate-pulse' : 'bg-slate-950 border border-slate-800'}`}>
              <Mic size={14} className={sirenDetected ? 'text-white' : 'text-sky-400'} />
            </div>
            <div className="flex flex-col text-left">
              <span className={`text-[9px] tracking-widest font-black leading-none ${sirenDetected ? 'text-red-300' : 'text-slate-200'}`}>SIREN TRIGGER</span>
              <span className="text-[8px] text-slate-500 lowercase tracking-normal mt-0.5">{sirenDetected ? 'active override' : 'simulate siren'}</span>
            </div>
          </button>

          {/* PATIENT REGISTRATION PORTAL */}
          <div className="border border-slate-900 bg-slate-950/40 rounded-2xl overflow-hidden" id="registration-accordion">
            <button 
              onClick={() => {
                playSynthSound('click');
                setRegPortalOpen(!regPortalOpen);
              }}
              className="w-full p-3 bg-slate-950/60 flex items-center justify-between text-left border-b border-slate-900 hover:bg-slate-900/40 transition-colors"
            >
              <div className="flex items-center gap-2">
                <Fingerprint size={14} className="text-[#00F2FE]" />
                <span className="text-[10px] font-mono font-bold text-white uppercase tracking-widest">
                  REGISTRATION PORTAL
                </span>
              </div>
              <ChevronDown size={14} className={`text-slate-500 transition-transform ${regPortalOpen ? 'rotate-180' : ''}`} />
            </button>
            
            {regPortalOpen && (
              <form onSubmit={handleRegSubmit} className="p-3.5 space-y-3 font-mono text-[9.5px]" id="walk-in-form">
                <div className="space-y-1">
                  <label className="text-slate-500 uppercase font-black text-[8px] tracking-wider">Patient Name</label>
                  <input 
                    type="text" 
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    placeholder="e.g. Liam Thompson"
                    required
                    className="w-full bg-slate-950 border border-slate-900 rounded-xl px-2.5 py-2 text-xs text-white focus:outline-none focus:border-sky-500 transition-colors"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="text-slate-500 uppercase font-black text-[8px] tracking-wider">Age</label>
                    <input 
                      type="number" 
                      value={regAge}
                      onChange={(e) => setRegAge(e.target.value)}
                      placeholder="e.g. 28"
                      min="1"
                      max="120"
                      required
                      className="w-full bg-slate-950 border border-slate-900 rounded-xl px-2.5 py-2 text-xs text-white focus:outline-none focus:border-sky-500 transition-colors"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-slate-500 uppercase font-black text-[8px] tracking-wider">Gender</label>
                    <select 
                      value={regGender}
                      onChange={(e) => setRegGender(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-900 rounded-xl px-2.5 py-2 text-xs text-slate-350 focus:outline-none focus:border-sky-500 transition-colors"
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>
                <button 
                  type="submit"
                  className="w-full py-2.5 bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-550 hover:to-indigo-550 text-white rounded-xl font-bold tracking-widest text-[9px] uppercase border border-sky-500/20 active:scale-95 transition-all text-center"
                >
                  Register & Assign Clinic
                </button>
              </form>
            )}
          </div>

          {/* THE 10-DEPARTMENT MATRIX */}
          <div className="flex-1 flex flex-col gap-2 mt-2" id="department-matrix-container">
            <p className="text-[9px] font-bold font-mono text-slate-500 uppercase tracking-widest pb-1 border-b border-slate-900/60">
              Department Hub Matrices
            </p>
            <div className="flex-1 space-y-1.5 overflow-y-auto pr-1.5 custom-scrollbar min-h-[160px]">
              {DEPARTMENTS_DB.map((dept, index) => (
                <div 
                  key={dept.id} 
                  className="relative group p-2.5 bg-slate-900/30 hover:bg-slate-900/75 border border-slate-950 hover:border-sky-500/30 rounded-xl transition-all cursor-crosshair select-none"
                >
                  <div className="flex justify-between items-center">
                    <span className="text-[9.5px] font-mono font-bold text-slate-350 group-hover:text-sky-400 capitalize">
                      {dept.name}
                    </span>
                    <span className="text-[7.5px] font-mono text-slate-600 bg-slate-950 px-1.5 py-0.5 rounded border border-slate-900 uppercase">
                      Wing {index + 1}
                    </span>
                  </div>
                  
                  {/* Hover tooltip structure displaying doctors */}
                  <div className="absolute left-[102%] top-0 hidden group-hover:flex w-72 bg-slate-950 border border-slate-900/90 p-3 rounded-2xl flex-col gap-2 z-50 shadow-[0_10px_30px_rgba(0,0,0,0.85)] backdrop-blur-lg">
                    <div className="flex justify-between items-center border-b border-slate-900 pb-1.5 mb-1">
                      <span className="text-[10px] font-mono font-black text-sky-400 uppercase tracking-widest">
                        {dept.name} Department Wing
                      </span>
                      <span className="text-[8px] font-mono text-slate-500">status matrix: nominal</span>
                    </div>
                    <div className="space-y-1.5">
                      {dept.doctors.map((doc, dIdx) => {
                        const roomNum = 101 + index * 4 + dIdx * 2;
                        const isAv = doc.status === 'Available';
                        const isBreak = doc.status === 'On Break';
                        return (
                          <div key={doc.name} className="flex flex-col text-[9.5px] font-mono p-1.5 bg-slate-900/50 rounded-lg border border-slate-850">
                            <div className="flex justify-between items-center">
                              <span className="text-slate-200 font-bold">{doc.name}</span>
                              <span className={`text-[8px] px-1.5 py-0.1 rounded font-black text-center ${
                                isAv 
                                  ? 'text-emerald-400 bg-emerald-950/20 border border-emerald-900/30' 
                                  : isBreak
                                    ? 'text-yellow-400 bg-yellow-950/20 border border-yellow-900/30'
                                    : 'text-rose-400 bg-rose-950/25 border border-rose-900/30'
                              }`}>
                                {doc.status}
                              </span>
                            </div>
                            <div className="flex justify-between items-center text-[8px] text-slate-500 mt-1 select-none">
                              <span>{doc.specialty}</span>
                              <span className="text-slate-400 font-bold uppercase">Room {roomNum}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Left footer diagnostic indices */}
          <div className="mt-auto pt-2 border-t border-slate-900 text-[8px] font-mono text-slate-650 uppercase flex flex-col gap-0.5">
            <span>Station: Lobby Kiosk-C3</span>
            <span>Firmware: V3.8.1-SYS</span>
          </div>
        </aside>

        {/* COLUMN 2: CENTER STAGE (60% WIDTH) */}
        <main 
          className="w-full md:w-[60%] flex-1 flex flex-col p-4 md:p-6 gap-6 overflow-y-auto custom-scrollbar h-full relative z-20"
          id="middle-center-stage"
        >
          {/* THE THREAT ALERT BAR */}
          {(sirenDetected || triggerEmergencyAlert) && (
            <div 
              className="w-full bg-[#ef4444]/10 border border-[#ef4444]/60 p-3.5 rounded-2xl flex items-center justify-between shadow-[0_0_20px_rgba(239,68,68,0.2)] animate-pulse select-none"
              id="threat-alert-bar"
            >
              <div className="flex items-center gap-3">
                <span className="relative flex h-3.5 w-3.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-red-500" />
                </span>
                <div className="flex flex-col font-mono">
                  <span className="text-[#ef4444] font-black text-[10.5px] uppercase tracking-wider">
                    WARNING: AUTONOMOUS ROUTING ACTIVE // KEEP CORRIDORS CLEAR
                  </span>
                  <span className="text-[8.5px] text-red-405/85 leading-none mt-0.5">
                    Critical Emergency routing mapped to ER/OT nodes. Bypass speed lock is active.
                  </span>
                </div>
              </div>
              <div className="text-[9px] font-mono text-red-400 font-bold bg-red-950/60 px-2 py-0.5 rounded border border-red-500/20">
                ACTIVE
              </div>
            </div>
          )}

          {/* INTERACTIVE VECTOR MAP */}
          <div className="h-[320px] shrink-0" id="interactive-map-frame">
            <HospitalMap 
              destination={currentPatient ? currentPatient.destinationName : null} 
              progress={currentPatient ? currentPatient.routingProgress : 0} 
            />
          </div>

          {/* DYNAMIC TRIAGE DIAGNOSTIC CONSOLE */}
          <div className="w-full shrink-0" id="diagnostic-input-console">
            <RobotConsole />
          </div>

          {/* CLINIC REGISTRIES DATABASE OVERVIEW (Structured alternative to AI face/chat) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 w-full items-stretch shrink-0" id="clinical-registries-database-hub">
            {/* Patients registry table */}
            <div className="bg-slate-950 border border-slate-900 rounded-3xl p-5 flex flex-col justify-between select-none">
              <div>
                <div className="border-b border-slate-900 pb-2 mb-3 flex justify-between items-center">
                  <div>
                    <span className="text-[10px] text-cyan-400 font-mono font-black tracking-widest block uppercase">RELATIONAL PATIENT SYSTEM</span>
                    <span className="text-[7.5px] text-slate-500 block uppercase mt-0.5">Static patients collection stored in database</span>
                  </div>
                  <span className="bg-cyan-950/40 border border-cyan-900/30 text-cyan-400 text-[7px] font-mono px-1.5 py-0.5 rounded tracking-widest">
                    {dbPatients.length} REGISTERS
                  </span>
                </div>

                <div className="overflow-x-auto max-h-52 custom-scrollbar text-[8px] font-mono">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-900 text-slate-500 uppercase">
                        <th className="pb-1 text-left font-semibold">ID</th>
                        <th className="pb-1 text-left font-semibold">Full Name</th>
                        <th className="pb-1 text-center font-semibold">Age</th>
                        <th className="pb-1 text-center font-semibold">Gender</th>
                        <th className="pb-1 text-right font-semibold">Incidents</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-950/20">
                      {dbPatients.map(pat => (
                        <tr key={pat.id} className="text-slate-350 hover:bg-slate-900/40">
                          <td className="py-1 text-slate-500 font-bold">{pat.id}</td>
                          <td className="py-1 text-white font-semibold uppercase">{pat.name}</td>
                          <td className="py-1 text-center">{pat.age}</td>
                          <td className="py-1 text-center text-slate-400">{pat.gender?.slice(0, 1)}</td>
                          <td className="py-1 text-right text-cyan-400 font-bold">{pat.emergencyFlags || "STANDARD"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              <div className="border-t border-slate-900 pt-3 text-[7.5px] text-slate-500 uppercase mt-4">
                📁 SQLite virtual file streams mapping automatically on local storage schemas.
              </div>
            </div>

            {/* Active scheduled appointments table */}
            <div className="bg-slate-950 border border-slate-900 rounded-3xl p-5 flex flex-col justify-between select-none">
              <div>
                <div className="border-b border-slate-900 pb-2 mb-3 flex justify-between items-center">
                  <div>
                    <span className="text-[10px] text-[#ff007a] font-mono font-black tracking-widest block uppercase">ACTIVE CLINIC SCHEDULE</span>
                    <span className="text-[7.5px] text-slate-500 block uppercase mt-0.5">Live clinical bookings & timeslot registries</span>
                  </div>
                  <span className="bg-rose-950/40 border border-rose-900/30 text-[#ff007a] text-[7px] font-mono px-1.5 py-0.5 rounded tracking-widest">
                    {dbAppointments.length} ACTIVE
                  </span>
                </div>

                <div className="overflow-x-auto max-h-52 custom-scrollbar text-[8px] font-mono">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-900 text-slate-500 uppercase">
                        <th className="pb-1 text-left font-semibold">Appt ID</th>
                        <th className="pb-1 text-left font-semibold">Patient ID</th>
                        <th className="pb-1 text-left font-semibold">Doctor</th>
                        <th className="pb-1 text-center font-semibold">Time</th>
                        <th className="pb-1 text-right font-semibold">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-950/20">
                      {dbAppointments.map(apt => {
                        const pat = dbPatients.find(p => p.id === apt.patientId);
                        const doc = dbDoctors.find(d => d.id === apt.doctorId);
                        return (
                          <tr key={apt.id} className="text-slate-350 hover:bg-slate-900/40">
                            <td className="py-1 text-slate-500 font-bold">{apt.id}</td>
                            <td className="py-1 text-white uppercase">{pat?.name || "Walk-In"}</td>
                            <td className="py-1 text-[#ff007a]">{doc?.name?.replace("Dr. ", "") || "Staff"}</td>
                            <td className="py-1 text-center text-slate-400">{apt.timeSlot}</td>
                            <td className="py-1 text-right">
                              <span className={`px-1 py-0.5 rounded text-[6.5px] font-black uppercase ${
                                apt.status === 'Completed' ? 'bg-emerald-950 text-emerald-400 border border-emerald-900/40' : 'bg-blue-950 text-blue-400 border border-blue-900/40'
                              }`}>
                                {apt.status}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
              <div className="border-t border-slate-900 pt-3 text-[7.5px] text-slate-500 uppercase mt-4">
                📋 Dynamic relational links matching patients with authorized specialized doctors.
              </div>
            </div>
          </div>

          <div className="w-full shrink-0" id="relational-join-mapper-section">
            <RelationalDBVisualizer 
              dbPatients={dbPatients} 
              dbAppointments={dbAppointments} 
              dbDoctors={dbDoctors} 
              activePatientId={currentPatient?.id} 
            />
          </div>

        </main>

        {/* COLUMN 3: RIGHT SIDEBAR (20% WIDTH) */}
        <aside 
          className="w-full md:w-[20%] shrink-0 border-l border-slate-900/80 bg-slate-950/90 backdrop-blur-md flex flex-col p-4 gap-4 overflow-y-auto custom-scrollbar h-full relative z-30 select-none"
          id="right-diagnostics-sidebar"
        >
          {/* Header block */}
          <div className="border-b border-slate-900 pb-3 flex items-center gap-2">
            <Activity size={14} className="text-[#ff007a]" />
            <span className="text-[10px] font-mono font-black text-white tracking-widest uppercase">REAL-TIME TELEMETRY</span>
          </div>

          {/* HARDWARE VITAL INDICATORS */}
          <div className="bg-slate-900/40 border border-slate-805 p-4 rounded-3xl space-y-4" id="hardware-vitals-box">
            <div className="border-b border-slate-850/60 pb-2 flex items-center justify-between text-slate-350 font-mono text-[9px] font-bold tracking-widest uppercase">
              <span>Hardware Status</span>
              <Cpu size={12} className="text-sky-400" />
            </div>
            
            <div className="space-y-3.5">
              {/* Battery charge */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-[9px] font-mono text-slate-400">
                  <span className="flex items-center gap-1.5">
                    <Battery size={11} className="text-emerald-400" /> Battery Charge
                  </span>
                  <span className="font-bold text-emerald-400">{diagnostics.battery.toFixed(1)}%</span>
                </div>
                <div className="w-full bg-slate-950 h-1.5 rounded-full overflow-hidden border border-slate-900">
                  <div 
                    className="bg-emerald-500 h-full rounded-full transition-all duration-300" 
                    style={{ width: `${diagnostics.battery}%` }}
                  />
                </div>
              </div>

              {/* Core Temp */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-[9px] font-mono text-slate-400">
                  <span className="flex items-center gap-1.5">
                    <Thermometer size={11} className="text-sky-450" /> CPU Core Heat
                  </span>
                  <span className="font-bold text-sky-450">{diagnostics.temperature.toFixed(1)}°C</span>
                </div>
                <div className="w-full bg-slate-950 h-1.5 rounded-full overflow-hidden border border-slate-900">
                  <div 
                    className="bg-sky-400 h-full rounded-full transition-all duration-300" 
                    style={{ width: `${Math.min(100, Math.max(0, ((diagnostics.temperature - 25) / 25) * 100))}%` }}
                  />
                </div>
              </div>

              {/* Sanitizer Fluid levels */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-[9px] font-mono text-slate-400">
                  <span className="flex items-center gap-1.5">
                    <Droplets size={11} className="text-blue-450" /> Sanitizer Spray
                  </span>
                  <span className="font-bold text-blue-450">{diagnostics.sanitizerLevel}%</span>
                </div>
                <div className="w-full bg-slate-950 h-1.5 rounded-full overflow-hidden border border-slate-900">
                  <div 
                    className="bg-blue-450 h-full rounded-full transition-all duration-300" 
                    style={{ width: `${diagnostics.sanitizerLevel}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* LIVE OPERATING SYSTEM LOGS FEED */}
          <div className="flex-1 bg-black/90 p-4 border border-slate-900 rounded-2xl flex flex-col gap-2 overflow-hidden min-h-[220px]" id="os-logs-feed-box border">
            <div className="border-b border-slate-900 pb-2 flex items-center justify-between text-emerald-400 font-mono text-[9px] font-bold tracking-widest uppercase select-none">
              <span>Live OS System Logs</span>
              <Terminal size={11} className="animate-pulse" />
            </div>
            
            <div className="flex-1 overflow-y-auto custom-scrollbar text-[8.5px] font-mono text-emerald-400/80 space-y-2 pr-1 select-text">
              {logs.length === 0 ? (
                <div className="text-slate-650 uppercase py-4 text-center animate-pulse">
                  Terminal online. Waiting for event logs...
                </div>
              ) : (
                logs.map((log, index) => {
                  const isCalculated = log.includes('[Calculating') || log.includes('Calculating') || log.includes('Transporting') || log.includes('Guiding') || log.includes('COGNITIVE SYSTEM') || log.includes('Auto-assigned');
                  const isUrgent = log.includes('EMERGENCY') || log.includes('CLASSIFICATION: EMERGENCY') || log.includes('🚨') || log.includes('CRITICAL');
                  return (
                    <div 
                      key={index}
                      className={`leading-relaxed tracking-wider border-b border-slate-950 pb-1.5 last:border-b-0 ${
                        isCalculated 
                          ? 'text-yellow-400/95 font-bold bg-yellow-950/20 p-1 rounded border border-yellow-900/10' 
                          : isUrgent 
                            ? 'text-rose-400 font-bold bg-rose-950/20 p-1 rounded border border-rose-900/20' 
                            : 'text-[#10b981]/90'
                      }`}
                    >
                      {log}
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Right Bottom indicator */}
          <div className="mt-auto pt-2 border-t border-slate-900 text-[8px] font-mono text-slate-650 uppercase text-right">
            <span>Uptime: 24h 02m</span>
          </div>
        </aside>

      </div>

      {/* STYLINGS FOR ANIMATIONS */}
      <style>{`
        @keyframes scan {
          0% { transform: translateY(-100%); }
          100% { transform: translateY(100vh); }
        }
        @keyframes shake {
          0%, 100% { transform: translate(0, 0) rotate(0deg); }
          10% { transform: translate(-2px, -2px) rotate(-0.5deg); }
          20% { transform: translate(2px, 0px) rotate(0.5deg); }
          30% { transform: translate(-1px, 2px) rotate(0deg); }
          40% { transform: translate(1px, -1px) rotate(0.5deg); }
          50% { transform: translate(-2px, 1px) rotate(-0.5deg); }
          60% { transform: translate(2px, 2px) rotate(0deg); }
          70% { transform: translate(-1px, -1px) rotate(-0.5deg); }
          80% { transform: translate(1px, 2px) rotate(0.5deg); }
          90% { transform: translate(-2px, -1px) rotate(0deg); }
        }
        .animate-shake {
          animation: shake 0.5s ease-in-out infinite;
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
          height: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(15, 23, 42, 0.4);
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(14, 165, 233, 0.25);
          border-radius: 999px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(14, 165, 233, 0.45);
        }
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(4px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .group-hover\\:flex {
          animation: fadeInUp 0.15s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}</style>
    </div>
  );
};
