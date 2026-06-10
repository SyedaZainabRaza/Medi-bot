import React, { useState, useMemo } from 'react';
import { Database, Link2, GitFork, Terminal, Play, CheckCircle } from 'lucide-react';
import { DbPatient, DbAppointment, DbDoctor } from '../types';

interface RelationalDBVisualizerProps {
  dbPatients: DbPatient[];
  dbAppointments: DbAppointment[];
  dbDoctors: DbDoctor[];
  activePatientId?: string | null;
}

export const RelationalDBVisualizer: React.FC<RelationalDBVisualizerProps> = ({
  dbPatients,
  dbAppointments,
  dbDoctors,
  activePatientId
}) => {
  const [selectedQuery, setSelectedQuery] = useState<'JOIN_ALL' | 'DOCTOR_AVAILABILITY' | 'ACTIVE_SCHEDULING'>('JOIN_ALL');
  const [isQueryRunning, setIsQueryRunning] = useState(false);
  const [queryOutput, setQueryOutput] = useState<any[]>([]);

  // Find currently active joins to highlight
  const activeJoinData = useMemo(() => {
    if (!activePatientId) return null;
    
    // Look for appointment linked to this active patient
    const appt = dbAppointments.find(a => a.patientId === activePatientId || a.id === activePatientId);
    if (!appt) return null;

    const pat = dbPatients.find(p => p.id === appt.patientId);
    const doc = dbDoctors.find(d => d.id === appt.doctorId);

    return {
      patientId: pat?.id,
      apptId: appt.id,
      doctorId: doc?.id
    };
  }, [activePatientId, dbPatients, dbAppointments, dbDoctors]);

  const runQuery = () => {
    setIsQueryRunning(true);
    setTimeout(() => {
      setIsQueryRunning(false);
      if (selectedQuery === 'JOIN_ALL') {
        const joinResult = dbAppointments.map(a => {
          const p = dbPatients.find(x => x.id === a.patientId);
          const d = dbDoctors.find(x => x.id === a.doctorId);
          return {
            appt_id: a.id,
            patient_name: p?.name || 'Walk-In Presumed',
            assigned_doctor: d?.name || 'Staff',
            timeslot: a.timeSlot,
            target_room: a.roomId || d?.roomId || 'R-101',
            status: a.status
          };
        });
        setQueryOutput(joinResult);
      } else if (selectedQuery === 'DOCTOR_AVAILABILITY') {
        const docResult = dbDoctors.map(d => ({
          doctor_id: d.id,
          name: d.name,
          specialty: d.specialty,
          wing_location: d.roomId,
          status: d.status,
          emergency_capable: d.emergAvailability ? 'YES' : 'NO'
        }));
        setQueryOutput(docResult);
      } else {
        const activeResult = dbAppointments
          .filter(a => a.status === 'Active' || a.status === 'Scheduled')
          .map(a => {
            const p = dbPatients.find(x => x.id === a.patientId);
            return {
              appt_id: a.id,
              patient: p?.name || 'Unassigned',
              time: a.timeSlot,
              date: a.date,
              status: a.status
            };
          });
        setQueryOutput(activeResult);
      }
    }, 600);
  };

  // Immediate query run on type select
  React.useEffect(() => {
    runQuery();
  }, [selectedQuery, dbPatients, dbAppointments, dbDoctors]);

  return (
    <div className="bg-slate-900/50 border border-slate-800 p-5 rounded-3xl flex flex-col h-full backdrop-blur-md relative overflow-hidden text-slate-100 font-mono" id="relational-db-visualizer-container">
      {/* Decorative scanner line */}
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-sky-500/10 shadow-[0_4px_30px_#0ea5e9]" />

      <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h2 className="text-xs font-bold font-mono tracking-widest text-[#06b6d4] uppercase flex items-center gap-2">
            <Database size={14} className="text-cyan-400" />
            Clinical Relational Schema Mapper
          </h2>
          <p className="text-[10px] text-slate-400 uppercase tracking-wider">
            Live relational constraints, foreign keys and cascading slot checks
          </p>
        </div>
        <div className="flex gap-1">
          <span className="bg-cyan-950/40 border border-cyan-800/40 text-cyan-400 text-[8px] font-mono px-2 py-0.5 rounded tracking-wide uppercase">
            ENG: SQLITE3 CORE
          </span>
        </div>
      </div>

      {/* Relational Schema Map Graph */}
      <div className="grid grid-cols-3 gap-2.5 p-3 bg-black/45 rounded-2xl border border-slate-900 mb-4 text-[9px] relative min-h-[140px] items-center">
        
        {/* TABLE 1: PATIENTS */}
        <div className={`p-2.5 rounded-xl border transition-all ${
          activeJoinData?.patientId ? 'border-cyan-550/40 bg-cyan-950/10 ring-1 ring-cyan-500/20' : 'border-slate-850 bg-slate-950/80'
        }`}>
          <div className="border-b border-slate-800 pb-1 mb-1.5 flex justify-between items-center text-cyan-400 font-bold uppercase tracking-wider">
            <span>👤 patients</span>
            <span className="text-[7px] text-slate-500">PK: id</span>
          </div>
          <div className="space-y-1 text-[7.5px] text-slate-400">
            <div><span className="text-slate-550">id:</span> VARCHAR(16) <span className="text-amber-500 font-bold">KEY</span></div>
            <div><span className="text-slate-550">name:</span> VARCHAR(64)</div>
            <div><span className="text-slate-550">age:</span> INTEGER</div>
            <div><span className="text-slate-550">gender:</span> VARCHAR(8)</div>
          </div>
          {activeJoinData?.patientId && (
            <div className="mt-1.5 pt-1.5 border-t border-cyan-900/30 text-[7px] text-cyan-300 uppercase animate-pulse">
              ⚡ ACTIVE ROW: {activeJoinData.patientId}
            </div>
          )}
        </div>

        {/* JOIN CONNECTOR / COUPLING HUB */}
        <div className="flex flex-col items-center justify-center relative py-1.5 px-0.5">
          {/* Visual Foreign key link arrows */}
          <div className="w-full border-t border-dashed border-cyan-500/20 my-2 relative">
            <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 bg-slate-950 text-[7px] px-1 py-0.5 rounded border border-cyan-500/30 text-cyan-400 uppercase tracking-widest flex items-center gap-0.5 animate-pulse">
              <Link2 size={8} /> fk constraint
            </div>
          </div>
          
          {/* TABLE 2: APPOINTMENTS (CENTER JOIN TABLE!) */}
          <div className={`w-full p-2.5 rounded-xl border transition-all ${
            activeJoinData?.apptId ? 'border-pink-500/40 bg-pink-950/10 ring-1 ring-pink-500/20' : 'border-slate-850 bg-slate-950/80'
          }`}>
            <div className="border-b border-slate-800 pb-1 mb-1.5 flex justify-between items-center text-pink-400 font-bold uppercase tracking-wider">
              <span>📅 appointments</span>
            </div>
            <div className="space-y-1 text-[7.5px] text-slate-400">
              <div><span className="text-slate-550">id:</span> VARCHAR(16) <span className="text-amber-500 font-bold">KEY</span></div>
              <div className="text-cyan-300 font-semibold"><span className="text-slate-550">patient_id:</span> {"FK ──> patients"}</div>
              <div className="text-emerald-400 font-semibold"><span className="text-slate-550">doctor_id:</span> {"FK ──> doctors"}</div>
              <div><span className="text-slate-550">time_slot:</span> VARCHAR(16)</div>
            </div>
            {activeJoinData?.apptId && (
              <div className="mt-1.5 pt-1.5 border-t border-pink-900/40 text-[7px] text-pink-300 uppercase animate-pulse">
                ⚡ ASSIGNED APPT: {activeJoinData.apptId}
              </div>
            )}
          </div>

          <div className="w-full border-t border-dashed border-emerald-500/20 my-2 relative">
            <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 bg-slate-950 text-[7px] px-1 py-0.5 rounded border border-emerald-500/30 text-emerald-400 uppercase tracking-widest flex items-center gap-0.5 animate-pulse">
              <GitFork size={8} /> join ref
            </div>
          </div>
        </div>

        {/* TABLE 3: DOCTORS */}
        <div className={`p-2.5 rounded-xl border transition-all ${
          activeJoinData?.doctorId ? 'border-emerald-550/40 bg-emerald-950/10 ring-1 ring-emerald-500/20' : 'border-slate-850 bg-slate-950/80'
        }`}>
          <div className="border-b border-slate-800 pb-1 mb-1.5 flex justify-between items-center text-emerald-400 font-bold uppercase tracking-wider">
            <span>🩺 doctors</span>
            <span className="text-[7px] text-slate-500">PK: id</span>
          </div>
          <div className="space-y-1 text-[7.5px] text-slate-400">
            <div><span className="text-slate-550">id:</span> VARCHAR(16) <span className="text-amber-500 font-bold">KEY</span></div>
            <div><span className="text-slate-550">name:</span> VARCHAR(64)</div>
            <div><span className="text-slate-550">specialty:</span> VARCHAR(64)</div>
            <div><span className="text-slate-550">room_id:</span> VARCHAR(8)</div>
          </div>
          {activeJoinData?.doctorId && (
            <div className="mt-1.5 pt-1.5 border-t border-emerald-900/30 text-[7px] text-emerald-300 uppercase animate-pulse">
              ⚡ ACTIVE MD: {activeJoinData.doctorId}
            </div>
          )}
        </div>
      </div>

      {/* Relational DB Console & Query Sandbox */}
      <div className="flex-grow flex flex-col justify-between bg-black/80 border border-slate-900 rounded-2xl p-4 gap-3 relative min-h-[170px]">
        {/* Terminal Header */}
        <div className="flex items-center justify-between border-b border-slate-900 pb-2">
          <div className="flex items-center gap-2 text-slate-400 text-[10px]">
            <Terminal size={12} className="text-cyan-400" />
            <span>Interactive SQL Execution Sandbox</span>
          </div>
          {/* Query Selection Menu */}
          <div className="flex gap-1.5 text-[8.5px]">
            <button
              onClick={() => setSelectedQuery('JOIN_ALL')}
              className={`px-2 py-0.5 rounded border transition-colors ${
                selectedQuery === 'JOIN_ALL'
                  ? 'bg-cyan-950 text-cyan-400 border-cyan-800/40'
                  : 'bg-transparent text-slate-500 border-transparent hover:text-slate-350'
              }`}
            >
              SELECT * FROM JOINS
            </button>
            <button
              onClick={() => setSelectedQuery('DOCTOR_AVAILABILITY')}
              className={`px-2 py-0.5 rounded border transition-colors ${
                selectedQuery === 'DOCTOR_AVAILABILITY'
                  ? 'bg-cyan-950 text-cyan-400 border-cyan-800/40'
                  : 'bg-transparent text-slate-500 border-transparent hover:text-slate-350'
              }`}
            >
              SELECT * FROM DOCTORS
            </button>
            <button
              onClick={() => setSelectedQuery('ACTIVE_SCHEDULING')}
              className={`px-2 py-0.5 rounded border transition-colors ${
                selectedQuery === 'ACTIVE_SCHEDULING'
                  ? 'bg-cyan-950 text-cyan-400 border-cyan-800/40'
                  : 'bg-transparent text-slate-500 border-transparent hover:text-slate-350'
              }`}
            >
              SELECT ACTIVE APPOINTMENTS
            </button>
          </div>
        </div>

        {/* SQL Command Preview */}
        <div className="text-[9.5px] text-sky-400/90 font-mono flex items-center justify-between bg-slate-950 px-3 py-2 rounded-lg border border-slate-900">
          <div className="truncate">
            {selectedQuery === 'JOIN_ALL' && (
              <span>
                <span className="text-purple-400 text-[9px] font-bold">SELECT</span> p.name, a.time_slot, d.name <span className="text-purple-400 font-bold">FROM</span> patients p <span className="text-purple-450 font-bold">JOIN</span> appointments a <span className="text-purple-400 font-bold">ON</span> p.id = a.patient_id <span className="text-purple-450 font-bold">JOIN</span> doctors d <span className="text-purple-400 font-bold">ON</span> a.doctor_id = d.id;
              </span>
            )}
            {selectedQuery === 'DOCTOR_AVAILABILITY' && (
              <span>
                <span className="text-purple-400 text-[9px] font-bold">SELECT</span> id, name, specialty, status <span className="text-purple-400 font-bold">FROM</span> doctors <span className="text-purple-400 font-bold">ORDER BY</span> specialty;
              </span>
            )}
            {selectedQuery === 'ACTIVE_SCHEDULING' && (
              <span>
                <span className="text-purple-400 text-[9px] font-bold">SELECT</span> * <span className="text-purple-400 font-bold">FROM</span> appointments <span className="text-purple-400 font-bold">WHERE</span> status = <span className="text-emerald-400">'Active'</span>;
              </span>
            )}
          </div>
          <button
            onClick={runQuery}
            disabled={isQueryRunning}
            className="ml-2 flex items-center gap-1 text-[8.5px] uppercase font-bold bg-[#ff007a] text-white px-2 py-1 rounded hover:bg-[#ff1e8a] disabled:opacity-40 transition-colors shrink-0"
          >
            <Play size={10} fill="currentColor" />
            Execute
          </button>
        </div>

        {/* Database Output Console */}
        <div className="flex-1 overflow-auto max-h-48 text-[8px] font-mono leading-relaxed bg-[#020204] p-3 rounded-lg border border-slate-950 text-slate-300">
          {isQueryRunning ? (
            <div className="flex flex-col items-center justify-center h-full gap-2 text-slate-500 py-6 uppercase tracking-widest text-[8px] select-none">
              <span className="w-4 h-4 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
              compiling join matrix & parsing constraints...
            </div>
          ) : queryOutput.length === 0 ? (
            <span className="text-slate-600 block">(0 rows returned)</span>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-slate-500 uppercase tracking-wider font-bold">
                  {Object.keys(queryOutput[0]).map(key => (
                    <th key={key} className="pb-1 px-2">{key}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-900/60 font-medium">
                {queryOutput.map((row, idx) => {
                  const isHighlighted = activeJoinData && (
                    row.patient_name === dbPatients.find(p => p.id === activeJoinData.patientId)?.name ||
                    row.patient === dbPatients.find(p => p.id === activeJoinData.patientId)?.name ||
                    row.doctor_id === activeJoinData.doctorId ||
                    row.assigned_doctor === dbDoctors.find(d => d.id === activeJoinData.doctorId)?.name
                  );

                  return (
                    <tr 
                      key={idx} 
                      className={`hover:bg-slate-900/40 transition-colors ${
                        isHighlighted 
                          ? 'bg-cyan-950/30 text-cyan-300 font-bold border-l-2 border-cyan-400 pl-1' 
                          : 'text-slate-350'
                      }`}
                    >
                      {Object.values(row).map((val: any, vIdx) => (
                        <td key={vIdx} className="py-1 px-2 uppercase truncate max-w-[120px]">
                          {typeof val === 'string' && val.includes('Dr. ') ? val.replace('Dr. ', '') : String(val)}
                        </td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};
