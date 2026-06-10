import React, { useState } from 'react';
import { useRobot } from '../RobotStateContext';
import { 
  Lock, Unlock, Shield, Terminal, Database, Users, Calendar, 
  Trash2, Plus, Server, Check, HelpCircle, HardDrive
} from 'lucide-react';
import { DbDoctor, DbDepartment, DbAppointment } from '../types';

export const AdminPortal: React.FC = () => {
  const { 
    dbDoctors, setDbDoctors,
    dbDepartments, setDbDepartments,
    dbAppointments, setDbAppointments,
    dbPatients,
    dbRooms,
    dbEmergencyEvents,
    dbNavigationRoutes,
    isAdminUnlocked, setAdminUnlocked,
    playSynthSound,
    addLog
  } = useRobot();

  const [activeSubTab, setActiveSubTab] = useState<'doctors' | 'departments' | 'appointments' | 'sql'>('doctors');
  const [passcode, setPasscode] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');

  // CRUD Form states: Add Doctor
  const [newDocName, setNewDocName] = useState<string>('');
  const [newDocSpecialty, setNewDocSpecialty] = useState<string>('');
  const [newDocDept, setNewDocDept] = useState<string>('cardiology');
  const [newDocRoom, setNewDocRoom] = useState<string>('R-101');
  const [newDocHours, setNewDocHours] = useState<string>('08:00 - 16:00');
  const [newDocEmerg, setNewDocEmerg] = useState<boolean>(true);

  // CRUD Form states: Create Department
  const [newDeptId, setNewDeptId] = useState<string>('');
  const [newDeptName, setNewDeptName] = useState<string>('');
  const [newDeptWing, setNewDeptWing] = useState<string>('East Wing Quadrant C');
  const [newDeptFloor, setNewDeptFloor] = useState<number>(1);

  // SQL console states
  const [sqlQuery, setSqlQuery] = useState<string>('SELECT * FROM Doctors WHERE status = \'Available\'');
  const [sqlResultHeaders, setSqlResultHeaders] = useState<string[]>([]);
  const [sqlResultRows, setSqlResultRows] = useState<any[]>([]);
  const [sqlError, setSqlError] = useState<string>('');

  // Handle Passcode Unlock
  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    if (passcode === '3000' || passcode.toLowerCase() === 'bypass') {
      playSynthSound('success');
      setAdminUnlocked(true);
      setErrorMessage('');
      addLog("🔓 ADMIN UNLOCKED: System credentials verified. Security firewall disengaged.");
    } else {
      playSynthSound('alarm');
      setErrorMessage('COGNITIVE PASSWORD INVALID. CHASSIS SYSTEM LOCKED.');
    }
  };

  const handleLock = () => {
    playSynthSound('click');
    setAdminUnlocked(false);
    setPasscode('');
    addLog("🔒 ADMIN LOCKED: Terminal session expired. Safe firewall restored.");
  };

  // CRUD Actions: Doctors
  const handleAddDoctor = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDocName.trim() || !newDocSpecialty.trim()) return;

    const docId = `doc-${Math.floor(10 + Math.random() * 89)}`;
    const newDoc: DbDoctor = {
      id: docId,
      name: newDocName,
      specialty: newDocSpecialty,
      deptId: newDocDept,
      roomId: newDocRoom,
      workingHours: newDocHours,
      status: 'Available',
      emergAvailability: newDocEmerg
    };

    setDbDoctors(prev => [...prev, newDoc]);
    addLog(`➕ DB REGISTER: Enrolled ${newDocName} as specialist [${docId}] to specialty department.`);
    playSynthSound('success');

    // Reset fields
    setNewDocName('');
    setNewDocSpecialty('');
  };

  const handleDeleteDoctor = (docId: string, name: string) => {
    playSynthSound('click');
    setDbDoctors(prev => prev.filter(d => d.id !== docId));
    addLog(`🗑️ DB REMOVE: Discharged specialist Dr. ${name} from hospital records.`);
  };

  const toggleDoctorStatus = (docId: string) => {
    playSynthSound('click');
    const statuses: Array<'Available' | 'Consulting' | 'In Surgery' | 'On Break'> = [
      'Available', 'Consulting', 'In Surgery', 'On Break'
    ];
    setDbDoctors(prev => prev.map(d => {
      if (d.id === docId) {
        const nextIdx = (statuses.indexOf(d.status) + 1) % statuses.length;
        const nextStatus = statuses[nextIdx];
        addLog(`🩹 DOCTOR UPDATE: Dr. ${d.name} status updated to [${nextStatus}].`);
        return { ...d, status: nextStatus };
      }
      return d;
    }));
  };

  // CRUD Actions: Departments
  const handleAddDepartment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDeptId.trim() || !newDeptName.trim()) return;

    const formattedId = newDeptId.trim().toLowerCase().replace(/\s+/g, '_');
    const newDept: DbDepartment = {
      id: formattedId,
      name: newDeptName,
      wing: newDeptWing,
      floor: newDeptFloor,
      roomIds: [`R-${Math.floor(100 + Math.random() * 99)}`]
    };

    setDbDepartments(prev => [...prev, newDept]);
    addLog(`➕ DB REGISTER: Created Clinical Department ${newDeptName} [${formattedId}] at floor ${newDeptFloor}.`);
    playSynthSound('success');

    setNewDeptId('');
    setNewDeptName('');
  };

  // CRUD Actions: Appointments
  const handleCancelAppointment = (aptId: string) => {
    playSynthSound('click');
    setDbAppointments(prev => prev.map(a => {
      if (a.id === aptId) {
        return { ...a, status: 'Cancelled' as const };
      }
      return a;
    }));
    addLog(`🚫 APPOINTMENT REJECTED: Slot ID ${aptId} cancelled by system administrator override.`);
  };

  // Crown Jewel: Simulated Relational database SQL Parser Engine!
  const executeSimulatedSQL = (customQuery?: string) => {
    const qRaw = customQuery || sqlQuery;
    playSynthSound('scan');
    setSqlError('');
    setSqlResultHeaders([]);
    setSqlResultRows([]);

    const trimmed = qRaw.trim().replace(/\s+/g, ' ');
    const lower = trimmed.toLowerCase();

    // Check basic rule: Only SELECT queries permitted inside preview terminal
    if (!lower.startsWith('select ')) {
      setSqlError('TERMINAL SECURE BYTES ERROR: ONLY "SELECT" QUERIES PERMITTED INSIDE PREVIEW PANEL.');
      return;
    }

    try {
      // Find Target Table
      let tableSource: any[] = [];
      let tableName = '';

      if (lower.includes('from doctors')) {
        tableSource = dbDoctors;
        tableName = 'doctors';
      } else if (lower.includes('from departments')) {
        tableSource = dbDepartments;
        tableName = 'departments';
      } else if (lower.includes('from appointments')) {
        tableSource = dbAppointments;
        tableName = 'appointments';
      } else if (lower.includes('from patients')) {
        tableSource = dbPatients;
        tableName = 'patients';
      } else if (lower.includes('from rooms')) {
        tableSource = dbRooms;
        tableName = 'rooms';
      } else if (lower.includes('from emergencyevents') || lower.includes('from emergency_events')) {
        tableSource = dbEmergencyEvents;
        tableName = 'emergency_events';
      } else if (lower.includes('from navigationroutes') || lower.includes('from routes')) {
        tableSource = dbNavigationRoutes;
        tableName = 'routes';
      } else {
        setSqlError('SQL COMPILER EXCEPTION: TABLE RELATION NOT RECOGNIZED. CHOOSE DOCTORS, APPOINTMENTS, PATIENTS, ROOMS.');
        return;
      }

      // Handle simple WHERE statements parsing
      let filteredRows = [...tableSource];
      const whereMatch = lower.match(/\bwhere\s+(.+)$/i);
      
      if (whereMatch) {
         const whereClause = whereMatch[1];
         // Simple parsing: status = 'Available'
         if (whereClause.includes("status = 'available'")) {
           filteredRows = filteredRows.filter(row => row.status?.toLowerCase() === 'available');
         } else if (whereClause.includes("emergavailability = true")) {
           filteredRows = filteredRows.filter(row => row.emergAvailability === true);
         } else if (whereClause.includes("age > 40")) {
           filteredRows = filteredRows.filter(row => row.age > 40);
         } else if (whereClause.includes("age <= 18")) {
           filteredRows = filteredRows.filter(row => row.age <= 18);
         } else if (whereClause.includes("urgency = 'emergency'")) {
           filteredRows = filteredRows.filter(row => row.urgency?.toLowerCase() === 'emergency');
         } else {
           // Fallback soft matches
           const parts = whereClause.split('=');
           if (parts.length === 2) {
             const col = parts[0].trim();
             const val = parts[1].trim().replace(/['"]/g, '');
             filteredRows = filteredRows.filter(row => String(row[col])?.toLowerCase() === val.toLowerCase());
           }
         }
      }

      if (filteredRows.length === 0) {
        setSqlError(`0 ROWS RETURNED FROM RELATION: "${tableName}" UNDER CLAUSE.`);
        return;
      }

      // Determine Headers (Keys of row)
      const headers = Object.keys(filteredRows[0]);
      setSqlResultHeaders(headers);
      setSqlResultRows(filteredRows);
      addLog(`🗃️ SQL COMPILE SUCCESS: Executed query against database relation [${tableName}] (${filteredRows.length} rows)`);

    } catch (err: any) {
      setSqlError(`COMPILER SYSTEM CRASH: Syntax error on query evaluation. ${err.message}`);
    }
  };

  const loadPreloadedSQL = (query: string) => {
    setSqlQuery(query);
    executeSimulatedSQL(query);
  };

  return (
    <div className="flex flex-col h-full bg-[#05060b] border border-cyan-500/15 rounded-2xl p-4 text-slate-100 font-mono select-none" id="admin-portal-component">
      
      {/* LOCKED VIEW GATEWAY */}
      {!isAdminUnlocked ? (
        <div className="flex-grow flex flex-col items-center justify-center py-10 text-center space-y-4 max-w-sm mx-auto" id="admin-gate-locked">
          <div className="p-4 bg-slate-950 border border-slate-900 rounded-full text-cyan-400 relative">
            <Lock size={32} className="animate-pulse" />
            <div className="absolute -inset-1 rounded-full border border-dashed border-cyan-450/40 animate-spin" style={{ animationDuration: '6s' }} />
          </div>
          <div>
            <h3 className="text-xs font-black uppercase text-cyan-400 tracking-widest flex items-center justify-center gap-1.5">
              <Shield size={14} /> ADMINISTRATOR CONTROL DECK
            </h3>
            <p className="text-[9px] text-slate-500 uppercase mt-1 leading-normal">
              Authentication required. Enter safety keycode `3000` to access medical records and relational databases.
            </p>
          </div>
          
          <form onSubmit={handleUnlock} className="w-full space-y-2">
            <input 
              type="password" 
              value={passcode}
              onChange={(e) => setPasscode(e.target.value)}
              placeholder="ENTER PASSCODE..."
              className="w-full text-center bg-black border border-slate-850 rounded px-2.5 py-1.5 text-xs text-white placeholder-slate-700 outline-none focus:border-cyan-500"
            />
            {errorMessage && (
              <p className="text-[8px] text-red-400 uppercase tracking-wider animate-shake leading-normal">{errorMessage}</p>
            )}
            <button 
              type="submit" 
              className="w-full bg-cyan-750 hover:bg-cyan-650 rounded py-1 text-[10px] font-bold uppercase text-white shadow-md active:scale-95 transition-all"
            >
              Unlock Database Gate
            </button>
          </form>
        </div>
      ) : (
        
        /* UNLOCKED SYSTEM */
        <div className="flex-grow flex flex-col h-full" id="admin-system-unlocked">
          
          {/* Unlocked Header */}
          <div className="flex justify-between items-center pb-2.5 border-b border-cyan-950/45 mb-3">
            <div className="flex items-center gap-2">
              <Unlock size={14} className="text-emerald-400" />
              <div>
                <span className="text-[10px] text-cyan-400 font-bold uppercase tracking-widest block">SECURED ADMIN ACTIVE CLIENT</span>
                <span className="text-[7.5px] text-slate-550 block mt-0.5">M.E.D.I.S.-V3 IN-MEMORY MEMORY RECORD SYSTEM v3.1</span>
              </div>
            </div>
            <button
              onClick={handleLock}
              className="px-2 py-1 bg-red-950/20 border border-red-900/40 hover:bg-red-900 hover:text-white rounded text-[8px] text-red-400 font-bold uppercase transition-colors"
            >
              Lock Terminal
            </button>
          </div>

          {/* Sub Navigation Selectors */}
          <div className="grid grid-cols-4 gap-1.5 mb-3 text-[9px] font-bold uppercase">
            {[
              { id: 'doctors', label: 'Doctors (CRUD)', icon: Users },
              { id: 'departments', label: 'Departments', icon: Server },
              { id: 'appointments', label: 'Appointments', icon: Calendar },
              { id: 'sql', label: 'Relational SQL Console', icon: Database }
            ].map((sub) => {
              const Icon = sub.icon;
              const isSel = activeSubTab === sub.id;
              return (
                <button
                  key={sub.id}
                  onClick={() => {
                    playSynthSound('click');
                    setActiveSubTab(sub.id as any);
                  }}
                  className={`py-1.5 px-1 rounded border flex items-center justify-center gap-1 bg-[#06070a] transition-all cursor-pointer ${
                    isSel 
                      ? 'border-cyan-550/60 text-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.1)]' 
                      : 'border-slate-900 text-slate-500 hover:text-white'
                  }`}
                >
                  <Icon size={11} />
                  <span>{sub.label}</span>
                </button>
              );
            })}
          </div>

          {/* Sub-tab view panel views */}
          <div className="flex-grow overflow-hidden relative">
            
            {/* 1. DOCTOR CRUD PANEL */}
            {activeSubTab === 'doctors' && (
              <div className="grid grid-cols-2 gap-3 h-full overflow-y-auto" id="subtab-doctors">
                
                {/* Add Doctor Form */}
                <div className="bg-[#030407] border border-cyan-950/25 p-3 rounded-xl flex flex-col">
                  <h4 className="text-[10px] text-cyan-400 font-black uppercase tracking-wider mb-2 flex items-center gap-1.5 border-b border-cyan-950/20 pb-1">
                    <Plus size={11} /> Register New Doctor
                  </h4>
                  <form onSubmit={handleAddDoctor} className="space-y-2 text-[8px] flex-grow flex flex-col justify-between">
                    <div className="space-y-1.5 flex-grow pr-1 overflow-y-auto max-h-[140px]">
                      <div>
                        <label className="text-slate-500 font-semibold uppercase block mb-0.5">Doctor Full Name</label>
                        <input 
                          type="text" 
                          value={newDocName}
                          onChange={(e) => setNewDocName(e.target.value)}
                          placeholder="e.g. Dr. Jennifer Wu"
                          className="w-full bg-slate-950 border border-slate-900 focus:border-cyan-500 rounded p-1 text-white outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-slate-500 font-semibold uppercase block mb-0.5">Medical Specialty</label>
                        <input 
                          type="text" 
                          value={newDocSpecialty}
                          onChange={(e) => setNewDocSpecialty(e.target.value)}
                          placeholder="e.g. Clinical Electrophysiology"
                          className="w-full bg-slate-950 border border-slate-900 focus:border-cyan-500 rounded p-1 text-white outline-none"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-slate-500 font-semibold uppercase block mb-0.5">Department</label>
                          <select 
                            value={newDocDept}
                            onChange={(e) => setNewDocDept(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-900 rounded p-1 text-white"
                          >
                            {dbDepartments.map(dep => (
                              <option key={dep.id} value={dep.id}>{dep.name}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="text-slate-500 font-semibold uppercase block mb-0.5">Assigned Office</label>
                          <input 
                            type="text" 
                            value={newDocRoom}
                            onChange={(e) => setNewDocRoom(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-900 rounded p-1 text-white"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2 items-center pt-1.5">
                        <div className="flex items-center gap-1">
                          <input 
                            type="checkbox"
                            checked={newDocEmerg}
                            onChange={(e) => setNewDocEmerg(e.target.checked)}
                            id="check-emerg-field"
                            className="bg-slate-950 border-slate-900 rounded accent-cyan-500"
                          />
                          <label htmlFor="check-emerg-field" className="text-slate-400 font-semibold cursor-pointer uppercase">Trauma Duty</label>
                        </div>
                        <div>
                          <label className="text-slate-500 font-semibold uppercase block mb-0.5">Shift Hours</label>
                          <input 
                            type="text" 
                            value={newDocHours}
                            onChange={(e) => setNewDocHours(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-900 rounded p-1 text-white"
                          />
                        </div>
                      </div>
                    </div>
                    <button 
                      type="submit"
                      disabled={!newDocName || !newDocSpecialty}
                      className="w-full py-1 text-[9px] font-black uppercase tracking-wider bg-cyan-700 disabled:opacity-30 hover:bg-cyan-600 rounded text-white shadow-md transition-colors mt-2"
                    >
                      Save Specialist Record
                    </button>
                  </form>
                </div>

                {/* Browse & Edit Doctors DB List */}
                <div className="bg-[#030407] border border-cyan-950/25 p-3 rounded-xl flex flex-col overflow-hidden">
                  <h4 className="text-[10px] text-cyan-400 font-black uppercase tracking-wider mb-2 flex items-center justify-between border-b border-cyan-950/20 pb-1">
                    <span>Doctors Registry Relational Database</span>
                    <span className="text-[8px] text-slate-500 uppercase">{dbDoctors.length} Rows</span>
                  </h4>
                  <div className="flex-grow overflow-y-auto space-y-1.5 pr-1 max-h-[180px]">
                    {dbDoctors.map((doc) => (
                      <div key={doc.id} className="p-2 bg-slate-955 border border-slate-900 rounded-lg flex items-center justify-between text-[8px] hover:border-slate-800 transition-colors">
                        <div>
                          <span className="font-bold text-slate-200 block text-[9px]">{doc.name}</span>
                          <span className="text-slate-500 text-[6.5px] uppercase mt-0.5 block">{doc.specialty} • {doc.roomId}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => toggleDoctorStatus(doc.id)}
                            className={`px-1 rounded font-black cursor-pointer text-[7px] ${
                              doc.status === 'Available' 
                                ? 'bg-emerald-950 border border-emerald-900 text-emerald-400' 
                                : doc.status === 'Consulting'
                                  ? 'bg-blue-950 border border-blue-900 text-blue-400'
                                  : doc.status === 'In Surgery'
                                    ? 'bg-red-950 border border-red-900 text-red-400'
                                    : 'bg-zinc-950 border border-zinc-900 text-zinc-400'
                            }`}
                          >
                            {doc.status}
                          </button>
                          <button
                            onClick={() => handleDeleteDoctor(doc.id, doc.name)}
                            className="p-1 hover:text-red-400 text-slate-600 transition-colors cursor-pointer"
                          >
                            <Trash2 size={10} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            )}

            {/* 2. DEPARTMENTS CRUD PANEL */}
            {activeSubTab === 'departments' && (
              <div className="grid grid-cols-2 gap-3 h-full overflow-y-auto" id="subtab-departments">
                
                {/* Create Department form */}
                <div className="bg-[#030407] border border-cyan-950/25 p-3 rounded-xl flex flex-col justify-between">
                  <div>
                    <h4 className="text-[10px] text-cyan-400 font-black uppercase tracking-wider mb-2 flex items-center gap-1.5 border-b border-cyan-950/20 pb-1">
                      <Plus size={11} /> Create New Department
                    </h4>
                    <form onSubmit={handleAddDepartment} className="space-y-2 text-[8px]">
                      <div>
                        <label className="text-slate-500 font-semibold uppercase block mb-0.5">Department ID (Unique code)</label>
                        <input 
                          type="text" 
                          value={newDeptId}
                          onChange={(e) => setNewDeptId(e.target.value)}
                          placeholder="e.g. respiratory"
                          className="w-full bg-slate-950 border border-slate-900 focus:border-cyan-500 rounded p-1 text-white outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-slate-500 font-semibold uppercase block mb-0.5">Department Name</label>
                        <input 
                          type="text" 
                          value={newDeptName}
                          onChange={(e) => setNewDeptName(e.target.value)}
                          placeholder="e.g. Pulmonology & Allergy"
                          className="w-full bg-slate-950 border border-slate-900 focus:border-cyan-500 rounded p-1 text-white outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-slate-500 font-semibold uppercase block mb-0.5">Hospital Wing</label>
                        <input 
                          type="text" 
                          value={newDeptWing}
                          onChange={(e) => setNewDeptWing(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-900 rounded p-1 text-white"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-slate-500 font-semibold uppercase block">Floor Assignment</label>
                        <input 
                          type="number"
                          min="1"
                          max="9"
                          value={newDeptFloor}
                          onChange={(e) => setNewDeptFloor(parseInt(e.target.value) || 1)}
                          className="w-full bg-slate-950 border border-slate-900 rounded p-1 text-white"
                        />
                      </div>
                      <button 
                        type="submit"
                        disabled={!newDeptId || !newDeptName}
                        className="w-full py-1 text-[9px] font-black uppercase tracking-wider bg-cyan-700 disabled:opacity-30 hover:bg-cyan-600 rounded text-white shadow-md transition-colors mt-2"
                      >
                        Create Department
                      </button>
                    </form>
                  </div>
                </div>

                {/* List Departments */}
                <div className="bg-[#030407] border border-cyan-950/25 p-3 rounded-xl flex flex-col overflow-hidden">
                  <h4 className="text-[10px] text-cyan-400 font-black uppercase tracking-wider mb-2 flex items-center justify-between border-b border-cyan-950/20 pb-1">
                    <span>Department registries</span>
                    <span className="text-[8px] text-slate-500 uppercase">{dbDepartments.length} Departments</span>
                  </h4>
                  <div className="flex-grow overflow-y-auto space-y-1.5 pr-1 max-h-[180px]">
                    {dbDepartments.map((dep) => (
                      <div key={dep.id} className="p-2 bg-slate-955 border border-slate-900 rounded-lg text-[8px] hover:border-slate-800 transition-colors">
                        <div className="flex justify-between items-center font-bold">
                          <span className="text-slate-200 block text-[9px]">{dep.name} ({dep.id.toUpperCase()})</span>
                          <span className="text-cyan-450 uppercase text-[7px]">Floor {dep.floor}</span>
                        </div>
                        <span className="text-slate-500 text-[6.5px] uppercase mt-0.5 block">{dep.wing} • Rooms: [{dep.roomIds.join(', ')}]</span>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            )}

            {/* 3. APPOINTMENTS MONITOR */}
            {activeSubTab === 'appointments' && (
              <div className="bg-[#030407] border border-cyan-950/25 p-3 rounded-xl flex flex-col h-full overflow-hidden" id="subtab-appointments">
                <h4 className="text-[10px] text-cyan-400 font-black uppercase tracking-wider mb-2 flex justify-between border-b border-cyan-950/20 pb-1">
                  <span>Patients Appointment Log Databases</span>
                  <span className="text-[8px] text-slate-500 uppercase">{dbAppointments.length} Active Records</span>
                </h4>
                <div className="flex-grow overflow-y-auto space-y-1.5 pr-1 max-h-[175px]">
                  {dbAppointments.map((apt) => {
                    const doc = dbDoctors.find(d => d.id === apt.doctorId);
                    const isCancelled = apt.status === 'Cancelled';
                    return (
                      <div key={apt.id} className="p-2.5 bg-slate-955 border border-slate-900 rounded-lg flex items-center justify-between text-[8px] hover:border-slate-800 transition-colors">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-200 block text-[9.5px]">{apt.id}</span>
                            <span className={`text-[7px] font-black uppercase px-1 rounded ${
                              isCancelled 
                                ? 'bg-red-950 text-red-400' 
                                : apt.status === 'Completed' 
                                  ? 'bg-emerald-950 text-emerald-400' 
                                  : 'bg-cyan-950 text-cyan-400'
                            }`}>
                              {apt.status}
                            </span>
                          </div>
                          <span className="text-slate-550 text-[7px] mt-0.5 block uppercase">
                            PATIENT_ID: {apt.patientId} • WITH DOCTOR: {doc?.name || apt.doctorId} • ROOM: {apt.roomId}
                          </span>
                        </div>
                        <div className="text-right flex items-center gap-2.5">
                          <div>
                            <span className="text-slate-300 block font-semibold">{apt.date}</span>
                            <span className="text-slate-500 block text-[7px] mt-0.5">{apt.timeSlot}</span>
                          </div>
                          {!isCancelled && apt.status !== 'Completed' && (
                            <button
                              onClick={() => handleCancelAppointment(apt.id)}
                              className="px-1.5 py-0.5 bg-red-950/10 hover:bg-red-900 hover:text-white border border-red-900/30 rounded text-[7.5px] font-bold text-red-450 uppercase transition-colors"
                            >
                              Cancel
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 4. REAL-TIME SQL QUERY WINDOW */}
            {activeSubTab === 'sql' && (
              <div className="flex flex-col h-full overflow-hidden" id="subtab-sql">
                
                {/* Command select shortcuts */}
                <div className="flex flex-wrap gap-1.5 mb-2 text-[7px] font-bold uppercase leading-none">
                  <span className="text-slate-500 flex items-center pr-1 select-none">Pre-loaded:</span>
                  {[
                    "SELECT * FROM Doctors WHERE status = 'Available'",
                    "SELECT * FROM Appointments",
                    "SELECT * FROM Patients WHERE age > 40",
                    "SELECT * FROM Rooms",
                    "SELECT * FROM EmergencyEvents"
                  ].map((query, index) => (
                    <button
                      key={index}
                      onClick={() => loadPreloadedSQL(query)}
                      className="px-1.5 py-1 bg-slate-950 border border-slate-900 hover:border-cyan-550 text-slate-400 hover:text-cyan-300 rounded transition-all cursor-pointer font-mono"
                    >
                      {query.length > 28 ? `${query.slice(0, 26)}..` : query}
                    </button>
                  ))}
                </div>

                {/* SQL entry terminal line */}
                <div className="flex gap-2 items-center bg-black border border-slate-850 p-2 rounded-lg mb-3">
                  <Terminal size={14} className="text-pink-500 animate-pulse" />
                  <input 
                    type="text"
                    value={sqlQuery}
                    onChange={(e) => setSqlQuery(e.target.value)}
                    placeholder="ENTER SELECT RAW SQL ENGINES..."
                    className="flex-grow bg-transparent border-none text-[10px] text-emerald-400 outline-none font-mono"
                  />
                  <button
                    onClick={() => executeSimulatedSQL()}
                    className="px-3 py-1 bg-gradient-to-r from-pink-650 to-purple-650 hover:from-pink-550 hover:to-purple-550 text-white text-[8px] font-black uppercase rounded shadow-md transition-all active:scale-95"
                  >
                    Execute Query
                  </button>
                </div>

                {/* SQL OUTPUT RESULTS TABLE */}
                <div className="flex-grow bg-slate-955 border border-slate-900 rounded-lg p-2 overflow-auto max-h-[110px]">
                  {sqlError ? (
                    <div className="text-[8px] text-red-400 uppercase tracking-wider leading-relaxed">
                      ❌ {sqlError}
                    </div>
                  ) : sqlResultRows.length > 0 ? (
                    <table className="w-full text-left font-mono text-[7px] leading-tight border-collapse">
                      <thead>
                        <tr className="border-b border-cyan-950/40 text-cyan-400 uppercase font-black tracking-wider bg-black/40">
                          {sqlResultHeaders.map(h => (
                            <th key={h} className="p-1">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {sqlResultRows.map((row, rIdx) => (
                          <tr key={rIdx} className="border-b border-slate-900/30 hover:bg-slate-900/50">
                            {sqlResultHeaders.map(h => (
                              <td key={h} className="p-1 max-w-[120px] truncate text-slate-300">
                                {typeof row[h] === 'object' ? JSON.stringify(row[h]) : String(row[h])}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <div className="text-center py-4 text-[8px] text-slate-550 uppercase tracking-widest flex flex-col items-center justify-center gap-1">
                      <HardDrive size={16} />
                      <span>Input raw relational query and compile.</span>
                    </div>
                  )}
                </div>

              </div>
            )}

          </div>

        </div>
      )}

    </div>
  );
};
