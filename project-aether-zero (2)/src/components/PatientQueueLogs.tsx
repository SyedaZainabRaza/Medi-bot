import React, { useState } from 'react';
import { useRobot } from '../RobotStateContext';
import { 
  Heart, 
  Terminal, 
  Calendar, 
  Search, 
  User, 
  UserCheck, 
  UserX, 
  Route, 
  UserRoundCheck,
  Building
} from 'lucide-react';

export const PatientQueueLogs: React.FC = () => {
  const { history, logs, currentPatient } = useRobot();
  const [searchQuery, setSearchQuery] = useState('');

  // Filter history based on search query
  const filteredHistory = history.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.destinationName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="bg-slate-900/50 border border-slate-800 p-5 rounded-3xl flex flex-col h-full backdrop-blur-md relative overflow-hidden" id="patient-queue-logs">
      {/* Top light bar */}
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-slate-800" />

      {/* Grid Layout: Left is history table, Right is live terminal logs */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 h-full min-h-[350px]">
        
        {/* Left Side: Recent Dispatches (7 Cols) */}
        <div className="lg:col-span-7 flex flex-col h-full justify-between">
          <div className="flex justify-between items-center mb-3">
            <div>
              <h2 className="text-xs font-bold font-mono tracking-widest text-[#60a5fa] uppercase flex items-center gap-2">
                <UserRoundCheck size={14} />
                TRIAGE DISPATCH LOG & HISTORY
              </h2>
              <p className="text-[10px] text-slate-500 font-mono uppercase tracking-wider">
                Completed routing events & records database
              </p>
            </div>
            
            {/* Search Input bar */}
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500" size={12} />
              <input 
                type="text" 
                placeholder="Search cases..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-slate-950 border border-slate-800 text-[10px] pl-8 pr-3 py-1 bg-slate-950 rounded-lg text-slate-300 placeholder:text-slate-700 font-mono focus:outline-none focus:border-sky-500"
              />
            </div>
          </div>

          {/* Table Container */}
          <div className="flex-1 overflow-y-auto max-h-[220px] bg-slate-950/60 rounded-2xl border border-slate-900/80 custom-scrollbar p-1.5 p-2">
            {filteredHistory.length === 0 ? (
              <div className="text-center py-12 text-[10px] text-slate-600 font-mono uppercase">
                No archived dispatch records found matching filters.
              </div>
            ) : (
              <div className="space-y-2">
                {/* Active Triaging patient row shortcut if present */}
                {currentPatient && (
                  <div className="p-3 bg-blue-950/20 border border-dashed border-blue-500/30 rounded-xl flex items-center justify-between text-xs font-mono animate-pulse">
                    <div className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                      <span className="text-blue-300 font-bold">{currentPatient.id}: {currentPatient.name.toUpperCase()}</span>
                    </div>
                    <span className="text-[9px] text-blue-400 uppercase tracking-widest">Active Triaging...</span>
                  </div>
                )}

                {/* List of dispatches */}
                {filteredHistory.map((patient) => {
                  const isEmerg = patient.urgency === 'EMERGENCY';
                  return (
                    <div 
                      key={patient.id} 
                      className="p-3 bg-slate-900/30 hover:bg-slate-900/60 border border-slate-850 rounded-xl flex flex-col gap-2 transition-all"
                    >
                      {/* Name / ID & Urgency */}
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <User size={12} className="text-slate-500" />
                          <span className="text-[10px] font-mono font-bold text-slate-300">
                            {patient.id} // {patient.name.toUpperCase()} (Age {patient.age}, {patient.gender[0]})
                          </span>
                        </div>
                        <span className={`text-[8px] font-mono font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                          isEmerg ? 'bg-red-950/40 text-red-400 border border-red-900/30' : 'bg-emerald-950/40 text-emerald-400 border border-emerald-900/30'
                        }`}>
                          {patient.urgency}
                        </span>
                      </div>

                      {/* Medical variables */}
                      <div className="grid grid-cols-4 gap-2 text-[9px] font-mono text-slate-500">
                        <div>
                          <span>PAIN SCORE:</span> <span className="font-bold text-slate-300">{patient.painLevel}/10</span>
                        </div>
                        <div>
                          <span>HEMORRHAGE:</span> <span className="font-bold text-slate-300">{patient.bloodLoss.toUpperCase()}</span>
                        </div>
                        <div className="col-span-2 text-right">
                          <span>TIME:</span> <span className="font-bold text-slate-400">{patient.timestamp}</span>
                        </div>
                      </div>

                      {/* Final Routing Destination Details */}
                      <div className="bg-slate-950/50 px-2.5 py-1.5 rounded-lg flex justify-between items-center text-[9px] font-mono border border-slate-900">
                        <div className="flex items-center gap-1 text-slate-400 select-none">
                          <Building size={10} className="text-sky-500" />
                          <span>WARD:</span>
                          <span className="text-slate-200 font-bold uppercase">{patient.destinationName}</span>
                        </div>
                        {patient.assignedDoctor && (
                          <div className="text-slate-500">
                            <span>MD:</span> <span className="text-slate-300 font-bold">{patient.assignedDoctor}</span>
                          </div>
                        )}
                        <span className="text-[8px] text-emerald-500 font-bold flex items-center gap-1.5 lowercase">
                          <span className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" /> delivered
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Side: OS Terminal Speech Logs (5 Cols) */}
        <div className="lg:col-span-5 flex flex-col h-full justify-between">
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-xs font-bold font-mono tracking-widest text-[#60a5fa] uppercase flex items-center gap-2">
              <Terminal size={14} />
              SYSTEM CORE OPERATING SYSTEM LOGS
            </h2>
          </div>

          <div className="flex-1 bg-black/90 rounded-2xl p-4 border border-slate-900 text-[10px] font-mono text-emerald-400/80 custom-scrollbar h-[220px] overflow-y-auto space-y-2 flex flex-col justify-start">
            {logs.length === 0 ? (
              <div className="text-slate-700 animate-pulse uppercase py-3 text-center">
                Terminal active. Syncing diagnostic threads...
              </div>
            ) : (
              logs.map((log, index) => {
                const isCalculated = log.includes('[Calculating') || log.includes('Calculating') || log.includes('Transporting') || log.includes('Guiding');
                const isUrgent = log.includes('EMERGENCY') || log.includes('CLASSIFICATION: EMERGENCY');
                return (
                  <div 
                    key={index} 
                    className={`leading-relaxed tracking-wide ${
                      isCalculated 
                        ? 'text-yellow-400/90 font-bold bg-yellow-950/15 p-1 rounded' 
                        : isUrgent 
                          ? 'text-red-400 font-bold' 
                          : 'text-emerald-400/80'
                    }`}
                  >
                    {log}
                  </div>
                );
              })
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
