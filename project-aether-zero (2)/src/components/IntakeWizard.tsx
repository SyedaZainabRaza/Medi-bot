import React, { useState, useEffect } from 'react';
import { useRobot } from '../RobotStateContext';
import { 
  User, Calendar, Clock, Phone, Sparkles, Activity, CheckCircle, 
  ArrowRight, ArrowLeft, Heart, ShieldAlert, Cpu
} from 'lucide-react';
import { DbDoctor, Patient } from '../types';

export const IntakeWizard: React.FC = () => {
  const { 
    dbDoctors, 
    dbDepartments, 
    setDbAppointments, 
    setDbPatients, 
    setCurrentPatient,
    submitNonEmergencySymptoms, 
    submitTriageAssessment,
    playSynthSound,
    updateRobotState
  } = useRobot();

  const [step, setStep] = useState<number>(1);
  const [name, setName] = useState<string>('');
  const [age, setAge] = useState<number>(30);
  const [gender, setGender] = useState<string>('Male');
  const [symptom, setSymptom] = useState<string>('Chest Pain');
  const [painLevel, setPainLevel] = useState<number>(4);
  const [contact, setContact] = useState<string>('');
  const [bookingDate, setBookingDate] = useState<string>(
    new Date().toISOString().substring(0, 10)
  );
  const [timeSlot, setTimeSlot] = useState<string>('09:30 AM');
  
  // AI Triage calculation states
  const [recommendedDeptId, setRecommendedDeptId] = useState<string>('cardiology');
  const [aiConfidence, setAiConfidence] = useState<number>(95);
  const [assignedDoctor, setAssignedDoctor] = useState<DbDoctor | null>(null);

  // Success / Confirmation States
  const [finalizedPatient, setFinalizedPatient] = useState<Patient | null>(null);
  const [finalizedAptCode, setFinalizedAptCode] = useState<string>('');
  const [finalizedPatCode, setFinalizedPatCode] = useState<string>('');

  // Auto assign symptoms to department mapping
  useEffect(() => {
    let dept = 'cardiology';
    let confidence = 92;

    const sym = symptom.toLowerCase();
    if (sym.includes('chest') || sym.includes('heart') || sym.includes('arrhythmia')) {
      dept = 'cardiology';
      confidence = 97;
    } else if (sym.includes('bone') || sym.includes('fracture') || sym.includes('joint') || sym.includes('accident')) {
      dept = 'orthopedics';
      confidence = 94;
    } else if (sym.includes('rash') || sym.includes('skin') || sym.includes('acne') || sym.includes('eczema')) {
      dept = 'dermatology';
      confidence = 91;
    } else if (sym.includes('head') || sym.includes('brain') || sym.includes('neurolog') || sym.includes('headache') || sym.includes('stroke')) {
      dept = 'neurology';
      confidence = 95;
    } else if (sym.includes('cough') || sym.includes('throat') || sym.includes('respiratory') || sym.includes('breathe') || sym.includes('asthma')) {
      dept = 'pediatrics'; // Pediatric or general, map to pediatrics for triage demo
      confidence = 88;
    } else if (sym.includes('kidney') || sym.includes('urine') || sym.includes('urology')) {
      dept = 'urology';
      confidence = 93;
    } else if (sym.includes('oncolog') || sym.includes('tumor') || sym.includes('cancer')) {
      dept = 'oncology';
      confidence = 96;
    } else if (sym.includes('hormone') || sym.includes('thyroid') || sym.includes('endocrin')) {
      dept = 'endocrinology';
      confidence = 90;
    } else {
      dept = 'cardiology';
      confidence = 78;
    }

    setRecommendedDeptId(dept);
    setAiConfidence(confidence);

    // Grab first available specialist in that department
    const candidate = dbDoctors.find(d => d.deptId === dept && d.status === 'Available') || 
                      dbDoctors.find(d => d.deptId === dept) || 
                      null;
    setAssignedDoctor(candidate);
  }, [symptom, dbDoctors]);

  const handleNext = () => {
    playSynthSound('click');
    setStep(prev => prev + 1);
  };

  const handleBack = () => {
    playSynthSound('click');
    setStep(prev => Math.max(1, prev - 1));
  };

  // Compile final appointment and start guided escort
  const handleFinalize = () => {
    if (!name.trim()) return;
    playSynthSound('success');

    const patientId = `pat-${Math.floor(100 + Math.random() * 899)}`;
    const appointmentId = `APT-${Math.floor(2000 + Math.random() * 7000)}`;

    const newDbPatient = {
      id: patientId,
      name,
      age,
      gender,
      contact: contact || 'Not Provided',
      visitHistory: [`Initial Kiosk Booking: ${symptom}`],
      medicalNotes: `Assigned Dept: ${recommendedDeptId}. Symptoms: ${symptom}. Pain Level: ${painLevel}/10.`
    };

    const newDbAppointment = {
      id: appointmentId,
      patientId,
      doctorId: assignedDoctor?.id || 'doc-1',
      roomId: assignedDoctor?.roomId || 'R-101',
      timeSlot,
      date: bookingDate,
      status: 'Active' as const
    };

    // Commit to persistent database arrays
    setDbPatients(prev => [newDbPatient, ...prev]);
    setDbAppointments(prev => [newDbAppointment, ...prev]);

    // Determine targeted clinic speciality
    const deptName = dbDepartments.find(d => d.id === recommendedDeptId)?.name || 'General';

    const newPatient: Patient = {
      id: appointmentId,
      name,
      age,
      gender,
      bloodLoss: 'None' as const,
      painLevel,
      urgency: 'NON-EMERGENCY' as const,
      selectedSymptom: symptom,
      destinationName: `${deptName} Care Department`,
      assignedDoctor: assignedDoctor?.name || 'Duty Specialist',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      phase: 'processing' as const,
      routingProgress: 0
    };

    setFinalizedPatient(newPatient);
    setFinalizedAptCode(appointmentId);
    setFinalizedPatCode(patientId);
    setStep(12);
  };

  const handleLaunchEscort = () => {
    if (!finalizedPatient) return;
    playSynthSound('success');
    
    setCurrentPatient(finalizedPatient);
    const deptName = dbDepartments.find(d => d.id === recommendedDeptId)?.name || 'General';
    submitNonEmergencySymptoms(symptom, deptName, assignedDoctor?.name, finalizedPatient);
  };

  const cancelFlow = () => {
    playSynthSound('click');
    updateRobotState('IDLE');
  };

  const symptomsList = [
    'Chest Pain & Arrhythmia',
    'Severe Headache / Neurology Deficit',
    'Joint Pain / Fracture Suspected',
    'Skin Inflammation / Rash',
    'Kidney Disorder / Urology Concerns',
    'Chronic Cough / Sore Throat',
    'Cancer Therapy / Oncology consultations',
    'Hormonal / Thyroid Symptoms'
  ];

  const timeSlots = [
    '08:30 AM', '09:00 AM', '09:30 AM', '10:15 AM',
    '11:00 AM', '11:45 AM', '01:30 PM', '02:15 PM',
    '03:00 PM', '03:45 PM', '04:30 PM', '05:00 PM'
  ];

  return (
    <div className="flex-grow flex flex-col h-full bg-[#030307] border border-cyan-500/10 rounded-2xl p-4 md:p-6 text-slate-100 font-mono relative overflow-hidden select-none" id="intake-wizard-viewport">
      {/* Holographic matrix grids */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(6,182,212,0.02)_1px,transparent_1px)] bg-[size:100%_4px] pointer-events-none" />

      {/* Progress header row */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-3 pb-3 border-b border-cyan-950/40 mb-4">
        <div>
          <span className="text-cyan-400 font-bold tracking-widest uppercase flex items-center gap-1.5 text-[10px]">
            <Cpu size={12} className="animate-spin text-cyan-300" style={{ animationDuration: '4s' }} />
            BIONIC INTAKE DECK — WIZARD STEP {step} / 12
          </span>
          <div className="flex gap-1 mt-1">
            {Array.from({ length: 12 }).map((_, idx) => (
              <div 
                key={idx} 
                className={`h-1 w-2 rounded transition-colors ${
                  idx + 1 === step 
                    ? 'bg-cyan-400 animate-pulse' 
                    : idx + 1 < step 
                      ? 'bg-cyan-750/60' 
                      : 'bg-slate-900 border border-slate-800'
                }`}
              />
            ))}
          </div>
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
            onClick={() => playSynthSound('click')}
            className="px-2.5 py-1 rounded text-[8px] font-black uppercase bg-cyan-950/80 text-cyan-400 border border-cyan-550/30 font-mono text-center shadow-[0_0_8px_rgba(6,182,212,0.15)]"
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

      {/* Active step display */}
      <div className="flex-1 flex flex-col justify-center max-w-lg mx-auto w-full py-4 relative z-10 transition-all duration-300">
        
        {/* STEP 1: Name entry */}
        {step === 1 && (
          <div className="space-y-4" id="wizard-step-1">
            <div className="flex items-center gap-2 text-cyan-400">
              <User size={18} />
              <h3 className="text-sm font-black uppercase tracking-wider">Patient Identification</h3>
            </div>
            <p className="text-[10px] text-slate-400 leading-normal">
              State your legal identification credentials. This initializes a search in our historical database layers.
            </p>
            <div className="space-y-1">
              <label className="text-[8px] font-bold text-slate-500 uppercase tracking-widest block">Full Name</label>
              <input 
                type="text" 
                value={name} 
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter First & Last Name..."
                className="w-full bg-slate-950 border border-slate-850 focus:border-cyan-500 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-750 outline-none transition-colors"
                autoFocus
              />
            </div>
          </div>
        )}

        {/* STEP 2: Age */}
        {step === 2 && (
          <div className="space-y-4" id="wizard-step-2">
            <div className="flex items-center gap-2 text-cyan-400">
              <Activity size={18} />
              <h3 className="text-sm font-black uppercase tracking-wider">Demographics — Age</h3>
            </div>
            <p className="text-[10px] text-slate-400">
              Age metrics help optimize medication doses and route to age-specific clinical wards (e.g., Pediatrics).
            </p>
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-500 uppercase text-[9px] font-bold">Selected Age Value</span>
                <span className="text-cyan-450 font-black text-sm">{age} years</span>
              </div>
              <input 
                type="range" 
                min="1" 
                max="112" 
                value={age}
                onChange={(e) => setAge(parseInt(e.target.value) || 30)}
                className="w-full h-1.5 rounded-lg bg-slate-905 border border-slate-800 accent-cyan-400 cursor-pointer"
              />
              <div className="flex justify-between text-[7.5px] text-slate-550">
                <span>01 (INFANT)</span>
                <span>45 (ADULT)</span>
                <span>110+ (CENTENARIAN)</span>
              </div>
              <div className="py-2.5 px-3 bg-[#0a0c10] border border-cyan-950/20 rounded-lg text-center text-[9px]">
                <span className="text-slate-400">AI Category: </span>
                <span className="text-cyan-400 font-bold uppercase">
                  {age <= 14 ? 'Pediatric Wing Allocation' : age >= 65 ? 'Geriatric Cardiology Override' : 'Adult Clinical Sector'}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: Biological Gender */}
        {step === 3 && (
          <div className="space-y-4" id="wizard-step-3">
            <div className="flex items-center gap-2 text-cyan-400">
              <User size={18} />
              <h3 className="text-sm font-black uppercase tracking-wider">Demographics — Biological Gender</h3>
            </div>
            <p className="text-[10px] text-slate-400">
              Gender declarations calibrate physiological baseline values for respiratory and hormonal screening indicators.
            </p>
            <div className="grid grid-cols-3 gap-2">
              {['Male', 'Female', 'Other'].map((g) => {
                const isSel = gender === g;
                return (
                  <button
                    key={g}
                    onClick={() => {
                      playSynthSound('click');
                      setGender(g);
                    }}
                    className={`p-3 rounded-lg border text-xs font-bold uppercase transition-all tracking-wider ${
                      isSel 
                        ? 'bg-cyan-950/30 border-cyan-550 text-cyan-400 shadow-[0_0_12px_rgba(34,211,238,0.15)]' 
                        : 'bg-slate-950 border-slate-850 text-slate-400 hover:text-white'
                    }`}
                  >
                    {g}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* STEP 4: Symptoms Select */}
        {step === 4 && (
          <div className="space-y-3" id="wizard-step-4">
            <div className="flex items-center gap-2 text-cyan-400">
              <Sparkles size={18} className="text-cyan-400" />
              <h3 className="text-sm font-black uppercase tracking-wider">Primary Medical Symptoms</h3>
            </div>
            <p className="text-[10px] text-slate-400">
              Specify your chief clinical symptom. Our in-memory triage engine auto-allocates relevant department specialists.
            </p>
            <div className="grid grid-cols-2 gap-1.5 h-44 overflow-y-auto pr-1">
              {symptomsList.map((s) => {
                const isSel = symptom === s;
                return (
                  <button
                    key={s}
                    type="button"
                    onClick={() => {
                      playSynthSound('click');
                      setSymptom(s);
                    }}
                    className={`p-2 rounded text-[8.5px] text-left border font-semibold transition-all ${
                      isSel 
                        ? 'border-cyan-500 bg-cyan-950/20 text-cyan-300' 
                        : 'border-slate-900 bg-slate-950 text-slate-450 hover:text-slate-200'
                    }`}
                  >
                    {s}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* STEP 5: Pain level */}
        {step === 5 && (
          <div className="space-y-4" id="wizard-step-5">
            <div className="flex items-center gap-2 text-cyan-400">
              <Heart size={18} className="animate-pulse text-red-400" />
              <h3 className="text-sm font-black uppercase tracking-wider">Pain Threshold Assessment</h3>
            </div>
            <p className="text-[10px] text-slate-400">
              Assess pain severity. Pain levels exceeding 7/10 trigger warning overrides and activate trauma alert logs.
            </p>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-[9px] font-bold text-slate-500 uppercase">Interactive Pain Scale</span>
                <span className={`font-black text-sm px-2 py-0.5 rounded ${
                  painLevel >= 7 ? 'text-red-400 bg-red-950/20 animate-pulse' : 'text-cyan-400 bg-cyan-950/20'
                }`}>
                  {painLevel} / 10 — {painLevel >= 8 ? 'SEVERE TRAUMA' : painLevel >= 5 ? 'MODERATE DISTRESS' : 'MILD CLINICAL'}
                </span>
              </div>
              <input 
                type="range" 
                min="1" 
                max="10" 
                value={painLevel}
                onChange={(e) => setPainLevel(parseInt(e.target.value) || 4)}
                className={`w-full h-1.5 rounded-lg cursor-pointer ${
                  painLevel >= 7 ? 'accent-red-500' : 'accent-cyan-400'
                } bg-slate-950 border border-slate-800`}
              />
              <div className="flex justify-between text-[7px] text-slate-655 font-bold">
                <span>01 (NO COGNITION)</span>
                <span>05 (DISCOMFORT)</span>
                <span>10 (EXCRUCIATING)</span>
              </div>
            </div>
          </div>
        )}

        {/* STEP 6: AI Triage results */}
        {step === 6 && (
          <div className="space-y-4" id="wizard-step-6">
            <div className="flex items-center gap-2 text-cyan-400">
              <Sparkles size={18} className="text-cyan-300 animate-pulse" />
              <h3 className="text-sm font-black uppercase tracking-wider">AI Cognitive Triage Engine</h3>
            </div>
            <p className="text-[10px] text-slate-400">
              Systems successfully cross-referenced symptom tables. The algorithm recommended wing routing:
            </p>
            <div className="bg-[#05060a] border border-cyan-500/20 p-4 rounded-xl space-y-3">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-500 uppercase text-[8.5px] font-bold">Recommended Department</span>
                <span className="text-white font-bold uppercase">{recommendedDeptId} Wing</span>
              </div>
              <div className="space-y-1">
                <div className="flex justify-between items-center text-[8.5px]">
                  <span className="text-slate-550 uppercase">Analysis Confidence index</span>
                  <span className="text-cyan-400 font-bold">{aiConfidence}%</span>
                </div>
                <div className="w-full bg-slate-950 h-1 rounded overflow-hidden">
                  <div className="bg-cyan-400 h-full transition-all duration-500" style={{ width: `${aiConfidence}%` }} />
                </div>
              </div>
              <div className="pt-2 text-[8px] text-slate-500 leading-tight">
                AI Summary: Symptoms matches {recommendedDeptId} indicators. Safe navigation parameters loaded for Escort Unit.
              </div>
            </div>
          </div>
        )}

        {/* STEP 7: Doctor Select */}
        {step === 7 && (
          <div className="space-y-3" id="wizard-step-7">
            <div className="flex items-center gap-2 text-cyan-400">
              <User size={18} />
              <h3 className="text-sm font-black uppercase tracking-wider">Duty Specialist Assignment</h3>
            </div>
            <p className="text-[10px] text-slate-400">
              Select your scheduled medical provider card. These are currently available specialists in the recommended clinic sector.
            </p>
            <div className="space-y-1.5 h-44 overflow-y-auto pr-1">
              {dbDoctors
                .filter(doc => doc.deptId === recommendedDeptId)
                .map((doc) => {
                  const isAssigned = assignedDoctor?.id === doc.id;
                  return (
                    <button
                      key={doc.id}
                      type="button"
                      onClick={() => {
                        playSynthSound('click');
                        setAssignedDoctor(doc);
                      }}
                      className={`w-full p-2 text-left rounded-lg border-2 flex items-center justify-between text-xs transition-all ${
                        isAssigned 
                          ? 'border-cyan-500 bg-cyan-950/20 text-cyan-300 shadow-md' 
                          : 'border-slate-900 bg-[#07080d] text-slate-440 hover:text-white hover:border-slate-800'
                      }`}
                    >
                      <div>
                        <span className="font-bold block text-[11px] leading-tight text-slate-200">{doc.name}</span>
                        <span className="text-[7.5px] uppercase tracking-normal text-slate-500 mt-0.5 block">{doc.specialty}</span>
                      </div>
                      <div className="text-right">
                        <span className={`text-[8px] font-bold px-1 rounded ${
                          doc.status === 'Available' ? 'bg-emerald-950 text-emerald-400' : 'bg-amber-950 text-amber-450'
                        }`}>
                          {doc.status}
                        </span>
                        <span className="text-[7px] text-slate-550 block mt-0.5">{doc.roomId} Lobby</span>
                      </div>
                    </button>
                  );
                })}
            </div>
          </div>
        )}

        {/* STEP 8: Date */}
        {step === 8 && (
          <div className="space-y-3" id="wizard-step-8">
            <div className="flex items-center gap-2 text-cyan-400">
              <Calendar size={18} />
              <h3 className="text-sm font-black uppercase tracking-wider">Appointment Period Selector</h3>
            </div>
            <p className="text-[10px] text-slate-400">
              Choose your targeted calendar slot. The robot database checks for clinic availability and room occupancy flags.
            </p>
            <div className="space-y-1 bg-[#05060c] p-3 border border-slate-900 rounded-lg">
              <label className="text-[8px] text-slate-500 font-bold uppercase block tracking-wider">Appointment Date</label>
              <input 
                type="date"
                value={bookingDate}
                onChange={(e) => setBookingDate(e.target.value)}
                className="w-full bg-slate-950 border border-slate-900 rounded p-1.5 text-xs text-white outline-none focus:border-cyan-500"
              />
            </div>
          </div>
        )}

        {/* STEP 9: Time Slots */}
        {step === 9 && (
          <div className="space-y-3" id="wizard-step-9">
            <div className="flex items-center gap-2 text-cyan-400">
              <Clock size={18} />
              <h3 className="text-sm font-black uppercase tracking-wider">Hourly Slot Allocations</h3>
            </div>
            <p className="text-[10px] text-slate-400">
              Select time slot. Pre-loaded schedules are analyzed to prevent double-booking conflicts on doctor {assignedDoctor?.name}.
            </p>
            <div className="grid grid-cols-4 gap-1.5 h-36 overflow-y-auto pr-1">
              {timeSlots.map((ts) => {
                const isSel = timeSlot === ts;
                return (
                  <button
                    key={ts}
                    type="button"
                    onClick={() => {
                      playSynthSound('click');
                      setTimeSlot(ts);
                    }}
                    className={`py-1.5 rounded text-[8px] font-bold text-center border transition-all ${
                      isSel 
                        ? 'border-cyan-500 bg-cyan-950/20 text-cyan-300' 
                        : 'border-slate-900 bg-slate-950 text-slate-400 hover:text-white'
                    }`}
                  >
                    {ts}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* STEP 10: Phone Identification */}
        {step === 10 && (
          <div className="space-y-4" id="wizard-step-10">
            <div className="flex items-center gap-2 text-cyan-400">
              <Phone size={18} />
              <h3 className="text-sm font-black uppercase tracking-wider">Contact Communication</h3>
            </div>
            <p className="text-[10px] text-slate-400">
              Provide cell phone numbers to receive secure print copy alerts, receipts, and clinical queue number notifications.
            </p>
            <div className="space-y-1">
              <label className="text-[8px] font-bold text-slate-500 block uppercase tracking-widest">Mobile Number</label>
              <input 
                type="tel" 
                value={contact} 
                onChange={(e) => setContact(e.target.value)}
                placeholder="e.g. +1 (555) 0123"
                className="w-full bg-slate-950 border border-slate-850 rounded-lg px-2.5 py-1.5 text-xs text-white outline-none focus:border-cyan-500"
              />
            </div>
          </div>
        )}

        {/* STEP 11: Confirmation */}
        {step === 11 && (
          <div className="space-y-3" id="wizard-step-11">
            <div className="flex items-center gap-2 text-cyan-400">
              <CheckCircle size={18} className="text-emerald-400" />
              <h3 className="text-sm font-black uppercase tracking-wider">Gate Check & Routing Pass</h3>
            </div>
            <p className="text-[10px] text-slate-400">
              Booking parameters compiled successfully. Press confirmation to print your ticket tape and launch robot escort.
            </p>
            
            {/* Holographic Printed Ticket */}
            <div className="border border-dashed border-cyan-500/25 bg-[#03060a] p-3 rounded-lg text-[9px] text-zinc-350 space-y-1.5 leading-tight font-mono relative">
              <div className="absolute top-1 right-2 font-black text-rose-500 border border-rose-900 px-1 py-0.5 text-[7px] uppercase tracking-normal select-none">
                M.E.D.I.S APPROVED
              </div>
              <div className="border-b border-zinc-900 pb-1 flex justify-between font-bold text-white text-[11px]">
                <span>TICKET TAPE RECORD</span>
                <span className="text-cyan-400 font-bold">RECON OUT</span>
              </div>
              <div className="space-y-0.5">
                <div>NAME: <span className="text-white font-bold uppercase">{name}</span></div>
                <div>AGE: <span className="text-white font-semibold">{age} ({gender})</span></div>
                <div>SYMPTOM: <span className="text-white font-semibold">{symptom}</span></div>
                <div>ASSIGNED DOCTOR: <span className="text-cyan-300 font-bold">{assignedDoctor?.name}</span></div>
                <div>ROOM & FLOOR: <span className="text-white font-bold">{assignedDoctor?.roomId} (Floor 1)</span></div>
                <div>TIME: <span className="text-white font-bold">{bookingDate} • {timeSlot}</span></div>
              </div>
              <div className="border-t border-dashed border-zinc-900 pt-1.5 flex justify-between items-center bg-black/60 px-2 py-1 rounded">
                <div className="text-[6.5px] text-zinc-500">
                  QR GUIDANCE LOCK BYTES [3F88D9]
                </div>
                {/* Fake matrix QR barcode generator block */}
                <div className="grid grid-cols-4 gap-0.5 bg-white p-0.5 rounded w-7 h-7">
                  <div className="bg-black w-1 h-1" />
                  <div className="bg-black w-1 h-1" />
                  <div className="bg-transparent w-1 h-1" />
                  <div className="bg-black w-1 h-1" />
                  <div className="bg-transparent w-1 h-1" />
                  <div className="bg-black w-1 h-1" />
                  <div className="bg-black w-1 h-1" />
                  <div className="bg-transparent w-1 h-1" />
                  <div className="bg-black w-1 h-1" />
                  <div className="bg-transparent w-1 h-1" />
                  <div className="bg-black w-1 h-1" />
                  <div className="bg-black w-1 h-1" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STEP 12: Success Confirmation & Relational DB logs */}
        {step === 12 && (
          <div className="space-y-4 text-center animate-fade-in" id="wizard-step-12">
            <div className="flex flex-col items-center justify-center space-y-2">
              <div className="w-12 h-12 bg-emerald-950/40 border border-emerald-500/40 rounded-full flex items-center justify-center text-emerald-400 animate-bounce">
                <CheckCircle size={28} />
              </div>
              <h3 className="text-xs font-black uppercase text-emerald-400 tracking-wider">
                Medical Booking Consolidated!
              </h3>
              <p className="text-[9.5px] text-slate-400 leading-tight">
                Your walk-in appointment has been permanently safely mapped to our clinical relational store.
              </p>
            </div>

            {/* Relational Database Insert logs box */}
            <div className="bg-black/90 border border-slate-900 rounded-xl p-3 text-left font-mono text-[8px] space-y-1.5 leading-relaxed relative overflow-hidden">
              <div className="text-[7px] text-[#ff007a] uppercase font-bold border-b border-slate-900 pb-1 flex justify-between">
                <span>📟 SQLITE TRANSACTION INTEGRITY ENGINE</span>
                <span className="text-slate-550 animate-pulse">● TX APPROVED</span>
              </div>
              <div className="text-sky-300">
                <span className="text-purple-400 font-black">INSERT INTO</span> patients (id, name, age, gender, contact)
                <br />
                <span className="text-slate-300">VALUES</span> ('{finalizedPatCode}', '{name}', {age}, '{gender}', '{contact || 'NULL'}');
                <span className="text-emerald-400 font-bold block">{"──> STATUS: SUCCESS [1 row affected]"}</span>
              </div>
              <div className="text-sky-300">
                <span className="text-purple-400 font-black">INSERT INTO</span> appointments (id, patient_id, doctor_id, time_slot, date, status)
                <br />
                <span className="text-slate-300">VALUES</span> ('{finalizedAptCode}', '{finalizedPatCode}', '{assignedDoctor?.id || 'doc-1'}', '{timeSlot}', '{bookingDate}', 'Active');
                <span className="text-emerald-400 font-bold block">{"──> STATUS: SUCCESS [1 row affected]"}</span>
              </div>
              <div className="text-sky-300">
                <span className="text-purple-400 font-black">SELECT</span> name, room_id <span className="text-purple-400 font-bold">FROM</span> doctors <span className="text-purple-400 font-bold">WHERE</span> id = '{assignedDoctor?.id || 'doc-1'}';
                <span className="text-slate-400 block font-normal text-[7px] bg-[#0c0d12] px-1.5 py-0.5 rounded border border-[#1e293b]/20">
                  🧬 OUTPUT BUFFER: [ {assignedDoctor?.name || 'Staff Specialist'} | Room: {assignedDoctor?.roomId || 'R-101'} ]
                </span>
              </div>
              <div className="text-emerald-400 font-black text-center pt-1 border-t border-slate-900/40 text-[7px] uppercase tracking-widest leading-none">
                ✔ TRANSACTION COMMITTED SUCCESSFULLY WITH 100% FOREIGN KEY CONSTRAINTS
              </div>
            </div>

            <div className="bg-[#05060b] border border-cyan-950/50 p-2.5 rounded-lg text-left text-[8.5px] text-slate-350 leading-tight">
              <span className="text-cyan-400 font-extrabold uppercase block mb-0.5">Escort Robot Readiness:</span>
              <span>Our autonomous chassis has locked onto Room <strong className="text-cyan-300">{assignedDoctor?.roomId}</strong>. Press launch below to initialize pathfinding and follow the unit physically.</span>
            </div>
          </div>
        )}

      </div>

      {/* Navigation action buttons row */}
      <div className="border-t border-cyan-950/45 pt-3 flex justify-between items-center text-[10px] mt-auto">
        {step === 12 ? (
          <button 
            onClick={cancelFlow}
            className="px-2.5 py-1.5 bg-slate-950 border border-slate-900 hover:border-slate-800 hover:text-white text-slate-500 font-bold uppercase transition-colors rounded-lg"
          >
            Lobby Standby
          </button>
        ) : (
          <button 
            onClick={cancelFlow}
            className="px-2.5 py-1.5 bg-slate-950 border border-slate-900 hover:border-red-950 hover:text-red-400 text-slate-500 font-bold uppercase transition-colors rounded-lg"
          >
            Cancel Intake
          </button>
        )}

        <div className="flex gap-2">
          {step > 1 && step < 12 && (
            <button
              onClick={handleBack}
              className="px-3 py-1.5 bg-slate-950 hover:bg-slate-900 border border-[#111827] rounded-lg font-bold text-slate-300 flex items-center gap-1.5"
            >
              <ArrowLeft size={12} /> Back
            </button>
          )}

          {step < 11 ? (
            <button
              onClick={handleNext}
              disabled={step === 1 && !name.trim()}
              className="px-4 py-1.5 bg-cyan-700 disabled:opacity-40 hover:bg-cyan-600 border border-cyan-500/20 rounded-lg text-white font-bold flex items-center gap-1.5 active:scale-95 transition-all cursor-pointer"
            >
              Next <ArrowRight size={12} />
            </button>
          ) : step === 11 ? (
            <button
              onClick={handleFinalize}
              className="px-5 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-555 hover:to-teal-555 rounded-lg text-white font-black uppercase tracking-wider flex items-center gap-1.5 active:scale-95 transition-all shadow-md shadow-emerald-950/20"
            >
              Arrive & Run Escort <CheckCircle size={12} />
            </button>
          ) : (
            <button
              onClick={handleLaunchEscort}
              className="px-6 py-1.5 bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 rounded-lg text-white font-black uppercase tracking-wider flex items-center gap-1.5 active:scale-95 transition-all shadow-md shadow-cyan-950/20 animate-pulse font-mono text-[9px]"
            >
              🤖 ACTIVATE AUTONOMOUS ESCORT PATHFINDING <CheckCircle size={12} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
