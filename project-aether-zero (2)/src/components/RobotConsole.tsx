import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useRobot, DEPARTMENTS_DB, Department, DoctorProfile } from '../RobotStateContext';
import { BloodLossLevel } from '../types';
import { 
  Activity, 
  ArrowRight, 
  PlusCircle, 
  AlertTriangle, 
  Stethoscope, 
  RefreshCw, 
  Sparkles,
  Smile,
  Shield,
  Clock,
  Compass,
  Cpu,
  User,
  Fingerprint,
  Layers,
  Sparkle
} from 'lucide-react';

export const RobotConsole: React.FC = () => {
  const { 
    currentPatient, 
    activePhase, 
    initializeNewPatient, 
    submitTriageAssessment, 
    submitEmergencyFollowup, 
    submitNonEmergencySymptoms,
    resetKiosk,
    addLog,
    triggerEmergencyAlert,
    playSynthSound,
    neuralLinkActive,
    setNeuralLinkActive
  } = useRobot();

  // Registration step state
  const [patientName, setPatientName] = useState('');
  const [patientAge, setPatientAge] = useState<number>(30);
  const [patientGender, setPatientGender] = useState('Male');

  // Intake selection
  const [selectedDeptId, setSelectedDeptId] = useState('cardiology');
  const [selectedDocName, setSelectedDocName] = useState('Dr. Evelyn Carter');

  // Triage step state
  const [bloodLoss, setBloodLoss] = useState<BloodLossLevel>('None');
  const [painLevel, setPainLevel] = useState<number>(5);

  // Neural Link Auto-populate list
  const runNeuralLinkScan = () => {
    if (neuralLinkActive) return;
    setNeuralLinkActive(true);
    playSynthSound('scan');
    addLog("🧬 NEURAL LINK: Activating biometric face scan sensors... Optic network mapping 100%...");
    
    setTimeout(() => {
      const records = [
        { name: "John Connor", age: 41, gender: "Male", log: "Biometric hit: John Connor (ID: ER-0941). History: Orthopedic skeletal trauma, metal graft in arm. High-adrenaline baseline." },
        { name: "Dr. Elizabeth Shaw", age: 36, gender: "Female", log: "Biometric hit: Dr. Elizabeth Shaw (ID: RS-1823). History: Severe atmosphere toxic exposure, respiratory sensitivity." },
        { name: "Officer Deckard", age: 48, gender: "Male", log: "Biometric hit: Rick Deckard (ID: BL-1982). History: High fatigue index, severe bone fracture history, Type-A circulatory." }
      ];
      
      const match = records[Math.floor(Math.random() * records.length)];
      setPatientName(match.name);
      setPatientAge(match.age);
      setPatientGender(match.gender);
      
      setNeuralLinkActive(false);
      playSynthSound('success');
      addLog(`🧬 NEURAL LINK: Records Pulled! -> ${match.log}`);
    }, 1800);
  };

  // Demo presets
  const applyPreset = (name: string, age: number, gender: string, loss: BloodLossLevel, pain: number) => {
    setPatientName(name);
    setPatientAge(age);
    setPatientGender(gender);
    setBloodLoss(loss);
    setPainLevel(pain);
    addLog(`Pre-loaded medical scenario for demo simulation: ${name}, Pain level ${pain}/10.`);
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    initializeNewPatient(patientName, patientAge, patientGender);
  };

  const activeDept = DEPARTMENTS_DB.find(d => d.id === selectedDeptId) || DEPARTMENTS_DB[0];

  return (
    <div className="bg-slate-900/50 border border-slate-800 p-6 rounded-3xl flex flex-col h-full backdrop-blur-md relative" id="hospital-robot-console">
      {/* Kiosk status indicator light */}
      <div className={`absolute top-4 right-6 flex items-center gap-2 text-[10px] font-mono uppercase tracking-widest`}>
        <span className={`w-2 h-2 rounded-full relative flex`}>
          <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${triggerEmergencyAlert ? 'bg-red-500' : 'bg-emerald-400'}`}></span>
          <span className={`relative inline-flex rounded-full h-2 w-2 ${triggerEmergencyAlert ? 'bg-red-500' : 'bg-emerald-500'}`}></span>
        </span>
        <span className={triggerEmergencyAlert ? 'text-red-400 font-bold' : 'text-slate-400'}>
          {triggerEmergencyAlert ? 'EMERGENCY PROTOCOL' : 'SECURE TRIAGE CORE'}
        </span>
      </div>

      <div className="border-b border-slate-800/80 pb-4 mb-4">
        <h1 className="text-sm font-bold font-mono tracking-[0.2em] text-[#f8fafc] flex items-center gap-2">
          <Activity className="text-[#60a5fa] animate-pulse" size={16} />
          M.E.D.I.S.-V3 ROBOT CORE
        </h1>
        <p className="text-[10px] text-slate-500 font-mono tracking-wide mt-1">
          HOSPITAL ENTRANCE AUTONOMOUS STAGE
        </p>
      </div>

      <div className="flex-1 overflow-y-auto flex flex-col justify-center min-h-[440px]">
        <AnimatePresence mode="wait">
          
          {/* STANDBY STAGE */}
          {activePhase === 'standby' && (
            <motion.div
              key="standby"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="flex flex-col items-center text-center py-4 gap-4"
            >
              {/* Biometric Scan Trigger and feedback */}
              <div className="relative group">
                <button
                  type="button"
                  onClick={runNeuralLinkScan}
                  className={`w-20 h-20 bg-sky-500/10 rounded-full flex items-center justify-center border border-sky-400/30 shadow-[0_0_20px_rgba(56,189,248,0.15)] relative scale-100 hover:scale-105 active:scale-95 transition-transform ${neuralLinkActive ? 'animate-bounce' : ''}`}
                >
                  {neuralLinkActive ? (
                    <Fingerprint className="text-pink-500 animate-pulse" size={32} />
                  ) : (
                    <Compass className="text-sky-400 animate-spin" size={32} style={{ animationDuration: '8s' }} />
                  )}
                  {neuralLinkActive && (
                    <span className="absolute inset-0 border-2 border-pink-500 border-dashed rounded-full animate-ping" />
                  )}
                </button>
              </div>

              <div className="space-y-1">
                <h2 className="text-xs font-bold text-slate-100 font-mono tracking-wider">AWAITING PATIENT DISPATCH</h2>
                <p className="text-[10px] text-slate-400 max-w-sm leading-relaxed">
                  "I am actively scanning the entry node. Tap the scan button to read a patient's **Neural Link** records instantly, select a preset, or write details below."
                </p>
              </div>

              {/* Neural Link status box */}
              {neuralLinkActive && (
                <div className="w-full max-w-sm px-3.5 py-2.5 bg-pink-950/20 border border-pink-900/60 rounded-xl text-left animate-pulse flex items-center gap-3">
                  <Cpu className="text-pink-400 shrink-0" size={16} />
                  <div>
                    <p className="text-[9px] font-mono font-bold text-pink-400">BIOMETRIC OPTIC RECON ACTIVE</p>
                    <p className="text-[8px] font-mono text-slate-400">Syncing with hospital neural synapses...</p>
                  </div>
                </div>
              )}

              {/* Patient registry inputs */}
              <div className="w-full max-w-sm flex flex-col gap-2 bg-slate-950/50 p-3 rounded-2xl border border-slate-850/50">
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    placeholder="Provide patient full name..." 
                    value={patientName}
                    onChange={(e) => setPatientName(e.target.value)}
                    className="flex-1 bg-slate-950 text-xs px-3.5 py-2.5 rounded-xl border border-slate-800 focus:outline-none focus:border-sky-500 font-mono"
                  />
                  <button 
                    onClick={() => initializeNewPatient(patientName, patientAge, patientGender)}
                    className="bg-sky-600 hover:bg-sky-500 transition-colors text-white text-xs px-4 rounded-xl font-bold font-mono tracking-widest uppercase flex items-center gap-1"
                  >
                    <PlusCircle size={13} /> Start
                  </button>
                </div>

                <div className="flex gap-4 px-1 text-[9px] text-slate-500 font-mono justify-between items-center">
                  <div className="flex gap-2">
                    <label>
                      Age: 
                      <input 
                        type="number" 
                        min="1" 
                        max="110" 
                        value={patientAge} 
                        onChange={(e) => setPatientAge(parseInt(e.target.value) || 30)}
                        className="bg-slate-950 text-slate-300 w-9 ml-1 py-0.5 border border-slate-800 rounded text-center" 
                      />
                    </label>
                    <label>
                      Gender: 
                      <select 
                        value={patientGender} 
                        onChange={(e) => setPatientGender(e.target.value)}
                        className="bg-slate-950 text-slate-300 ml-1 py-0.5 border border-slate-800 rounded"
                      >
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                      </select>
                    </label>
                  </div>
                  <button 
                    onClick={runNeuralLinkScan} 
                    className="text-[8px] font-bold text-pink-400 hover:text-pink-300 uppercase tracking-widest flex items-center gap-1 hover:animate-pulse"
                  >
                    <Fingerprint size={10} /> Scan Biometrics
                  </button>
                </div>
              </div>

              {/* Demo Presets Trigger */}
              <div className="w-full max-w-sm p-3 bg-slate-950/40 rounded-2xl border border-slate-800/60 text-left">
                <h4 className="text-[9px] font-bold text-sky-400 font-mono tracking-widest uppercase mb-2">Simulate Custom Emergencies</h4>
                <div className="grid grid-cols-1 gap-1.5">
                  <button 
                    onClick={() => applyPreset("Marcus Brody", 57, "Male", "Severe", 9)}
                    className="flex justify-between items-center text-[9px] font-mono text-slate-300 hover:text-white bg-slate-900 hover:bg-sky-950/30 p-2 rounded-xl border border-slate-850/40 transition-colors text-left"
                  >
                    <span>🚑 Scenario A: Heavy Chest Trauma</span>
                    <span className="text-red-400 font-bold">EMERGENCY</span>
                  </button>
                  <button 
                    onClick={() => applyPreset("Lily Vance", 12, "Female", "None", 4)}
                    className="flex justify-between items-center text-[9px] font-mono text-slate-300 hover:text-white bg-slate-900 hover:bg-sky-950/30 p-2 rounded-xl border border-slate-850/40 transition-colors text-left"
                  >
                    <span>🩺 Scenario B: Persistent Fever</span>
                    <span className="text-emerald-400 font-bold">STABLE</span>
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* STAGE: PATIENT REGISTRATION FORM */}
          {activePhase === 'registration' && (
            <motion.div
              key="registration"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.02 }}
            >
              <form onSubmit={handleRegister} className="space-y-4">
                <div className="bg-slate-950/45 p-4 border border-slate-800 rounded-2xl text-center flex flex-col gap-1.5">
                  <h3 className="text-xs font-mono font-bold text-sky-400 uppercase tracking-widest">M.E.D.I.S. REGISTRATION GATEWAY</h3>
                  <p className="text-[9px] text-slate-400">Establish a diagnostic instance. Biometric scans are automatically cross-referenced.</p>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <label className="block text-[9px] font-bold font-mono text-slate-400 tracking-wider">FULL NAME / PATIENT RECON ID</label>
                    <button
                      type="button"
                      onClick={runNeuralLinkScan}
                      className="text-[9px] font-mono text-pink-400 hover:text-pink-300 tracking-wider flex items-center gap-1 font-bold"
                    >
                      <Fingerprint size={10} /> Sync Neural Link
                    </button>
                  </div>
                  <input
                    required
                    type="text"
                    value={patientName}
                    onChange={(e) => setPatientName(e.target.value)}
                    placeholder="e.g. Johnathan Smith... or scan above"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-xs text-white placeholder:text-slate-700 font-mono focus:border-sky-500 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="block text-[9px] font-bold font-mono text-slate-400 tracking-wider">AGE (Years)</label>
                    <input
                      required
                      type="number"
                      min="1"
                      max="115"
                      value={patientAge}
                      onChange={(e) => setPatientAge(parseInt(e.target.value) || 30)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-xs text-white font-mono focus:border-sky-500 focus:outline-none"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-[9px] font-bold font-mono text-slate-400 tracking-wider">GENDER</label>
                    <select
                      value={patientGender}
                      onChange={(e) => setPatientGender(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-xs text-white font-mono focus:border-sky-500 focus:outline-none"
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full bg-sky-600 hover:bg-sky-500 transition-colors text-white py-3.5 rounded-xl font-bold font-mono text-xs uppercase tracking-widest flex items-center justify-center gap-2"
                >
                  INITIALIZE BIOMETRIC CHECK
                  <ArrowRight size={14} />
                </button>
              </form>
            </motion.div>
          )}

          {/* STAGE: TRIAGE ASSESSMENT QUESTIONS (PHASE 1) */}
          {activePhase === 'triage_assessment' && currentPatient && (
            <motion.div
              key="triage"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              <div className="p-3 bg-slate-950 rounded-2xl border border-slate-850 flex justify-between items-center font-mono">
                <div>
                  <p className="text-[8px] text-slate-500 uppercase">Encounter ID</p>
                  <p className="text-xs font-bold text-white uppercase">{currentPatient.id}: {currentPatient.name}</p>
                </div>
                <div className="text-right">
                  <p className="text-[8px] text-slate-500 uppercase">Biometrics</p>
                  <p className="text-[9px] text-sky-400 font-mono">AGE {currentPatient.age} // {currentPatient.gender.toUpperCase()}</p>
                </div>
              </div>

              <div>
                <h3 className="text-[10px] font-bold font-mono text-[#60a5fa] uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <span className="text-slate-500">01 //</span> CLINICAL HEMORRHAGE MATRIX
                </h3>
                <div className="grid grid-cols-2 gap-2">
                  {(['None', 'Low', 'Moderate', 'Severe'] as BloodLossLevel[]).map((level) => {
                    const colors = {
                      None: 'hover:border-slate-700 bg-slate-950/50 hover:bg-slate-900 border-slate-850',
                      Low: 'hover:border-yellow-900 bg-slate-950/50 hover:bg-yellow-950/10 border-slate-850',
                      Moderate: 'hover:border-orange-800 bg-slate-950/50 hover:bg-orange-950/10 border-slate-850',
                      Severe: 'hover:border-red-900 bg-slate-950/50 hover:bg-red-950/10 border-slate-850'
                    };
                    const selectedColors = {
                      None: 'border-slate-400 bg-slate-900/60 text-slate-100 ring-1 ring-slate-800',
                      Low: 'border-yellow-500 bg-yellow-950/30 text-yellow-300 ring-1 ring-yellow-800/40',
                      Moderate: 'border-orange-500 bg-orange-950/30 text-orange-400 ring-1 ring-orange-850/40',
                      Severe: 'border-red-500 bg-red-950/30 text-red-100 ring-1 ring-red-800/49 animate-pulse'
                    };
                    return (
                      <button
                        key={level}
                        type="button"
                        onClick={() => {
                          setBloodLoss(level);
                          addLog(`Blood loss value calibrated to: ${level}.`);
                        }}
                        className={`p-2.5 text-left rounded-xl border font-mono transition-all duration-200 flex flex-col gap-0.5 ${
                          bloodLoss === level ? selectedColors[level] : colors[level]
                        }`}
                      >
                        <span className="text-xs font-bold">{level.toUpperCase()}</span>
                        <span className="text-[7.5px] opacity-65 uppercase">
                          {level === 'None' && 'Dry surface'}
                          {level === 'Low' && 'Minor scratch'}
                          {level === 'Moderate' && 'Deep laceration'}
                          {level === 'Severe' && 'Arterial / Trauma'}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <h3 className="text-[10px] font-bold font-mono text-[#60a5fa] uppercase tracking-wider flex items-center gap-1.5">
                    <span className="text-slate-500">02 //</span> VISUAL PAIN SCALE INDEX
                  </h3>
                  <span className={`text-[11px] font-black font-mono px-2 py-0.5 rounded-lg bg-slate-950 border ${
                    painLevel >= 7 ? 'text-red-400 border-red-900/30' : 'text-sky-300 border-sky-950'
                  }`}>
                    {painLevel} / 10
                  </span>
                </div>
                
                {/* Numeric selector row */}
                <div className="grid grid-cols-10 gap-1">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => {
                        setPainLevel(num);
                        addLog(`Pain scale registered at: ${num}/10.`);
                      }}
                      className={`py-1.5 text-[9px] font-mono font-bold rounded transition-all text-center ${
                        painLevel === num
                          ? num >= 7 
                            ? 'bg-red-600 text-white shadow-md shadow-red-900/30' 
                            : 'bg-sky-600 text-white'
                          : 'bg-slate-950 hover:bg-slate-900 text-slate-400 border border-slate-850'
                      }`}
                    >
                      {num}
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="button"
                onClick={() => submitTriageAssessment(bloodLoss, painLevel)}
                className="w-full bg-[#10b981] hover:bg-[#059669] transition-all text-white py-3 rounded-xl font-bold font-mono text-xs uppercase tracking-widest flex items-center justify-center gap-2"
              >
                SUBMIT ASSSESSMENT & CLASSIFY
                <ArrowRight size={14} />
              </button>
            </motion.div>
          )}

          {/* STAGE: EMERGENCY PROCESSING (MODE A) */}
          {activePhase === 'followup_select' && currentPatient && (
            <motion.div
              key="emergency"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.04 }}
              className="space-y-4"
            >
              {/* Emergency Warning */}
              <div className="bg-red-950/45 p-3.5 border border-red-900/50 rounded-2xl flex flex-col gap-1 items-center text-center">
                <AlertTriangle className="text-red-500 animate-bounce" size={22} />
                <h2 className="text-xs font-mono font-black text-red-400 tracking-[0.25em] uppercase">
                  EMERGENCY ACTION PROTOCOL
                </h2>
                <p className="text-[9px] text-red-300 font-mono">
                  SENSORS REGISTER CRITICAL PAIN INDEX ({currentPatient.painLevel}/10) & BLOOD LEVEL ({currentPatient.bloodLoss.toUpperCase()})
                </p>
              </div>

              <div className="space-y-2">
                <h3 className="text-[10px] font-bold font-mono text-slate-400 uppercase tracking-wider text-center">
                  CORE DIAGNOSIS OVERRIDE SELECTION
                </h3>
                
                <div className="grid grid-cols-1 gap-1.5">
                  <EmergencySelectorButton 
                    label="🚨 Severe Arterial Bleeding / Penetrative Trauma" 
                    desc="Assign to Operating Theater (OT) - PRIORITY ALPHA"
                    onClick={() => submitEmergencyFollowup("Severe Bleeding / Trauma")}
                  />
                  <EmergencySelectorButton 
                    label="⚡ Coronary Distress / Unconscious / Flat Vitals" 
                    desc="Assign to Intensive Care Unit (ICU) - PRIORITY OSCAR"
                    onClick={() => submitEmergencyFollowup("Unconscious State / Cardiac")}
                  />
                  <EmergencySelectorButton 
                    label="🩹 Deep Laceration / Compound Fracture / Extreme Pain" 
                    desc="Assign to Emergency Room (ER) - PRIORITY DELTA"
                    onClick={() => submitEmergencyFollowup("Moderate Trauma / Severe Pain")}
                  />
                </div>
              </div>

              <button
                onClick={resetKiosk}
                className="w-full text-slate-500 hover:text-slate-300 font-mono text-[9px] uppercase tracking-widest text-center mt-1"
              >
                Cancel / Reset Registry
              </button>
            </motion.div>
          )}

          {/* STAGE: NON-EMERGENCY PROCESSING (MODE B): ADVANCED CLINICAL FORM */}
          {activePhase === 'symptom_select' && currentPatient && (
            <motion.div
              key="non-emergency"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.04 }}
              className="space-y-4"
            >
              <div className="bg-emerald-950/20 p-3 border border-emerald-900/40 rounded-2xl flex flex-col gap-1 items-center text-center">
                <Smile className="text-emerald-400" size={20} />
                <h2 className="text-xs font-mono font-black text-emerald-400 tracking-[0.15em] uppercase">
                  STABLE CLINIC CHECK-IN
                </h2>
                <p className="text-[8.5px] text-slate-400 font-mono">
                  Patient vitals nominal. Blood Loss {currentPatient.bloodLoss.toUpperCase()} | Pain index {currentPatient.painLevel}/10.
                </p>
              </div>

              {/* Cross-reference 10-department & 2-doctor database */}
              <div className="space-y-3 bg-slate-950/40 p-3.5 border border-slate-800 rounded-2xl">
                <h3 className="text-[10px] font-bold font-mono text-sky-400 tracking-wider uppercase flex items-center gap-1">
                  <Stethoscope size={12} />
                  CLINICAL DEPARTMENT CROSS-REFERENCE
                </h3>
                
                {/* Department Dropdown Selection */}
                <div className="space-y-1.5">
                  <label className="block text-[8.5px] font-mono text-slate-500 uppercase">Choose Specialty Department</label>
                  <select
                    value={selectedDeptId}
                    onChange={(e) => {
                      const deptId = e.target.value;
                      setSelectedDeptId(deptId);
                      const matchingDept = DEPARTMENTS_DB.find(d => d.id === deptId);
                      if (matchingDept && matchingDept.doctors.length > 0) {
                        setSelectedDocName(matchingDept.doctors[0].name);
                      }
                      addLog(`Department selected: ${deptId.toUpperCase()}`);
                    }}
                    className="w-full bg-slate-900 text-xs text-slate-200 border border-slate-800 rounded-xl px-3 py-2 font-mono focus:border-sky-500 focus:outline-none"
                  >
                    {DEPARTMENTS_DB.map((dept) => (
                      <option key={dept.id} value={dept.id}>
                        {dept.name} Specialist Wing
                      </option>
                    ))}
                  </select>
                </div>

                {/* Doctor Display Selection */}
                <div className="space-y-1.5">
                  <label className="block text-[8.5px] font-mono text-slate-500 uppercase">Assigned Clinical Specialist</label>
                  <div className="grid grid-cols-2 gap-2">
                    {activeDept.doctors.map((doc) => {
                      const isSelected = selectedDocName === doc.name;
                      return (
                        <button
                          key={doc.name}
                          type="button"
                          onClick={() => {
                            setSelectedDocName(doc.name);
                            playSynthSound('click');
                            addLog(`Doctor assigned: ${doc.name}`);
                          }}
                          className={`p-2.5 text-left rounded-xl border text-[10px] font-mono flex flex-col gap-0.5 transition-all ${
                            isSelected 
                              ? 'border-sky-500 bg-sky-950/20 text-sky-300 ring-1 ring-sky-900' 
                              : 'border-slate-800 bg-slate-950 hover:bg-slate-900 hover:border-slate-700 text-slate-400'
                          }`}
                        >
                          <span className="font-bold">{doc.name}</span>
                          <span className="text-[7.5px] text-slate-500 opacity-80">{doc.specialty}</span>
                          <span className={`text-[7px] font-bold px-1.5 py-0.2 ml-0 rounded w-fit capitalize ${
                            doc.status === 'Available' ? 'bg-emerald-950/50 text-emerald-400' : 'bg-slate-900 text-slate-500'
                          }`}>
                            {doc.status}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => submitNonEmergencySymptoms(`Elected Specialization Checkup - ${activeDept.name}`, activeDept.name, selectedDocName)}
                className="w-full bg-[#10b981] hover:bg-[#059669] transition-all text-white py-3 rounded-xl font-bold font-mono text-xs uppercase tracking-widest flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-950/15 animate-pulse"
              >
                CONFIRM APPOINTMENT & NAVIGATE
                <ArrowRight size={13} />
              </button>

              <button
                onClick={resetKiosk}
                className="w-full text-slate-500 hover:text-slate-300 font-mono text-[9px] uppercase tracking-widest text-center mt-1"
              >
                Cancel / Reset State
              </button>
            </motion.div>
          )}

          {/* STAGE: ROUTING ACTIVE ANIMATION IN CLINIC */}
          {activePhase === 'routing_active' && currentPatient && (
            <motion.div
              key="routing"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center p-4 text-center gap-4"
            >
              <div className="w-20 h-20 relative flex items-center justify-center">
                <div className={`absolute inset-0 rounded-full border border-dashed animate-spin ${
                  currentPatient.urgency === 'EMERGENCY' ? 'border-red-500/40' : 'border-sky-500/40'
                }`} style={{ animationDuration: '6s' }} />
                
                {/* Visual pulse ring */}
                <span className={`animate-ping absolute inline-flex h-10 w-10 rounded-full opacity-35 ${
                  currentPatient.urgency === 'EMERGENCY' ? 'bg-red-500' : 'bg-sky-500'
                }`} />

                <div className={`w-14 h-14 rounded-full flex items-center justify-center border ${
                  currentPatient.urgency === 'EMERGENCY' 
                    ? 'bg-red-950/20 border-red-500/40 text-red-400' 
                    : 'bg-sky-950/20 border-sky-500/40 text-sky-400'
                }`}>
                  <Compass className="animate-pulse" size={22} />
                </div>
              </div>

              <div className="space-y-3 w-full">
                <div className="space-y-1">
                  <span className={`text-[8.5px] font-bold font-mono px-3 py-0.5 rounded-full uppercase ${
                    currentPatient.urgency === 'EMERGENCY' ? 'bg-red-950 text-red-400 border border-red-900/30' : 'bg-sky-950 text-sky-400 border border-sky-900/30'
                  }`}>
                    {currentPatient.urgency === 'EMERGENCY' ? 'EMERGENCY DELIVER' : 'GUIDED CONVOY'}
                  </span>
                  <h3 className="text-xs font-bold text-slate-100 font-mono uppercase tracking-wide">
                    ROUTING PATIENT {currentPatient.id}
                  </h3>
                </div>

                <div className="bg-slate-950 p-3.5 border border-slate-800 rounded-2xl w-full max-w-sm text-left mx-auto space-y-1">
                  <div className="flex justify-between text-[9px] font-mono text-slate-400">
                    <span>SECTOR TARGET:</span>
                    <span className="font-bold text-slate-200 uppercase">{currentPatient.destinationName}</span>
                  </div>
                  {currentPatient.assignedDoctor && (
                    <div className="flex justify-between text-[9px] font-mono text-slate-400">
                      <span>ASSIGNED MD:</span>
                      <span className="font-bold text-slate-200">{currentPatient.assignedDoctor}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-[9px] font-mono text-slate-400">
                    <span>GUIDANCE COCKPIT:</span>
                    <span className="font-bold text-emerald-400 uppercase">ACTIVE CONVOY</span>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="space-y-1 w-full max-w-sm mx-auto">
                  <div className="flex justify-between text-[8px] font-mono text-slate-500 tracking-wider">
                    <span>PATHFINDING RADIAL PROGRESS</span>
                    <span>{currentPatient.routingProgress}%</span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-950 rounded-full overflow-hidden border border-slate-850">
                    <motion.div 
                      className={`h-full rounded-full ${
                        currentPatient.urgency === 'EMERGENCY' ? 'bg-red-500' : 'bg-sky-500'
                      }`}
                      style={{ width: `${currentPatient.routingProgress}%` }}
                    />
                  </div>
                </div>

                <p className="text-[8.5px] font-mono text-slate-500 uppercase leading-relaxed max-w-xs mx-auto animate-pulse">
                  Passageways clear. Physical lidar collision matrix updated on local corridor plane.
                </p>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  );
};

const EmergencySelectorButton = ({ label, desc, onClick }: { label: string, desc: string, onClick: () => void }) => (
  <button
    type="button"
    onClick={onClick}
    className="w-full text-left p-3 bg-slate-950/60 hover:bg-red-950/20 border border-slate-850 hover:border-red-900/60 transition-all rounded-xl flex flex-col gap-0.5"
  >
    <div className="text-[10px] font-bold font-mono text-slate-200">{label}</div>
    <div className="text-[8px] text-slate-500 font-mono">{desc}</div>
  </button>
);
