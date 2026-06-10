import React, { createContext, useContext, useState, ReactNode, useEffect, useRef } from 'react';
import { 
  Patient, 
  RobotDiagnostics, 
  BloodLossLevel, 
  UrgencyLevel, 
  HumanModuleState, 
  ChatMessage,
  RobotState,
  DbDoctor,
  DbDepartment,
  DbAppointment,
  DbPatient,
  DbRoom,
  DbHospitalMapNode,
  DbHospitalMapEdge,
  DbRobotState,
  DbNavigationRoute,
  DbEmergencyEvent
} from './types';
import { solvePath, HOSPITAL_NODES, HOSPITAL_EDGES } from './utils/pathfinding';

export interface DoctorProfile {
  name: string;
  specialty: string;
  status: 'Available' | 'Consulting' | 'In Surgery' | 'On Break';
}

export interface Department {
  id: string;
  name: string;
  doctors: DoctorProfile[];
}

export const DEPARTMENTS_DB: Department[] = [
  {
    id: "cardiology",
    name: "Cardiology",
    doctors: [
      { name: "Dr. Evelyn Carter", specialty: "Interventional Cardiologist", status: "Available" },
      { name: "Dr. Alistair Vance", specialty: "Electrophysiologist", status: "Consulting" }
    ]
  },
  {
    id: "orthopedics",
    name: "Orthopedics",
    doctors: [
      { name: "Dr. Marcus Vance", specialty: "Trauma Reconstruction", status: "Available" },
      { name: "Dr. Sarah Jenkins", specialty: "Spinal Specialist", status: "Consulting" }
    ]
  },
  {
    id: "pediatrics",
    name: "Pediatrics",
    doctors: [
      { name: "Dr. Clara Thorne", specialty: "Neonatologist", status: "Available" },
      { name: "Dr. Henry Higgins", specialty: "Pediatric Cardiologist", status: "Consulting" }
    ]
  },
  {
    id: "dermatology",
    name: "Dermatology",
    doctors: [
      { name: "Dr. James Lin", specialty: "Immunodermatologist", status: "Available" },
      { name: "Dr. Fiona Gallagher", specialty: "Cosmetic Surgeon", status: "On Break" }
    ]
  },
  {
    id: "neurology",
    name: "Neurology",
    doctors: [
      { name: "Dr. Charles Xavier", specialty: "Synaptic Neuropathologist", status: "Available" },
      { name: "Dr. Helen Cho", specialty: "Biomimetic Neurosurgeon", status: "Available" }
    ]
  },
  {
    id: "oncology",
    name: "Oncology",
    doctors: [
      { name: "Dr. Bruce Banner", specialty: "Nuclear Oncologist", status: "Consulting" },
      { name: "Dr. Stephen Strange", specialty: "Therapeutic Radiologist", status: "On Break" }
    ]
  },
  {
    id: "ophthalmology",
    name: "Ophthalmology",
    doctors: [
      { name: "Dr. Erik Selvig", specialty: "Ocular Refractorist", status: "Available" },
      { name: "Dr. Jane Foster", specialty: "Astrophotographer / Retina Expert", status: "Available" }
    ]
  },
  {
    id: "psychiatry",
    name: "Psychiatry",
    doctors: [
      { name: "Dr. Harleen Quinzel", specialty: "Cognitive Analyst", status: "Consulting" },
      { name: "Dr. Leonard Samson", specialty: "Gamma Stress Psychiatrist", status: "Available" }
    ]
  },
  {
    id: "urology",
    name: "Urology",
    doctors: [
      { name: "Dr. Perry Cox", specialty: "Renal Pathologist", status: "Available" },
      { name: "Dr. Christopher Turk", specialty: "Urological Surgeon", status: "Available" }
    ]
  },
  {
    id: "endocrinology",
    name: "Endocrinology",
    doctors: [
      { name: "Dr. Gregory House", specialty: "Diagnostic Endocrinologist", status: "Available" },
      { name: "Dr. Allison Cameron", specialty: "Immunological Specialist", status: "Available" }
    ]
  }
];

// Initial Database states for seeding
const INITIAL_DOCTORS: DbDoctor[] = [
  { id: 'doc-1', name: 'Dr. Evelyn Carter', specialty: 'Interventional Cardiology', deptId: 'cardiology', roomId: 'R-101', workingHours: '08:00 - 16:00', status: 'Available', emergAvailability: true },
  { id: 'doc-2', name: 'Dr. Marcus Vance', specialty: 'Trauma Reconstruction', deptId: 'orthopedics', roomId: 'R-102', workingHours: '09:00 - 17:00', status: 'Available', emergAvailability: true },
  { id: 'doc-3', name: 'Dr. Clara Thorne', specialty: 'Neonatal Care', deptId: 'pediatrics', roomId: 'R-103', workingHours: '08:00 - 15:00', status: 'Available', emergAvailability: false },
  { id: 'doc-4', name: 'Dr. James Lin', specialty: 'Immunodermal Scans', deptId: 'dermatology', roomId: 'R-104', workingHours: '10:00 - 18:00', status: 'Available', emergAvailability: false },
  { id: 'doc-5', name: 'Dr. Charles Xavier', specialty: 'Synaptic Neuropathology', deptId: 'neurology', roomId: 'R-105', workingHours: '08:00 - 17:00', status: 'Available', emergAvailability: true },
  { id: 'doc-6', name: 'Dr. Fiona Gallagher', specialty: 'Laser Aesthetics', deptId: 'dermatology', roomId: 'R-106', workingHours: '13:00 - 21:00', status: 'On Break', emergAvailability: false },
  { id: 'doc-7', name: 'Dr. Bruce Banner', specialty: 'Nuclear Oncology', deptId: 'oncology', roomId: 'R-107', workingHours: '09:00 - 17:00', status: 'Consulting', emergAvailability: true },
  { id: 'doc-8', name: 'Dr. Stephen Strange', specialty: 'Therapeutic Radiology', deptId: 'oncology', roomId: 'R-108', workingHours: '09:00 - 17:00', status: 'On Break', emergAvailability: true },
  { id: 'doc-9', name: 'Dr. Gregory House', specialty: 'Diagnostic Endocrinology', deptId: 'endocrinology', roomId: 'R-110', workingHours: '10:00 - 18:00', status: 'Available', emergAvailability: false },
  { id: 'doc-10', name: 'Dr. Perry Cox', specialty: 'Renal Pathologist', deptId: 'urology', roomId: 'R-111', workingHours: '08:00 - 16:00', status: 'Available', emergAvailability: true }
];

const INITIAL_DEPARTMENTS: DbDepartment[] = [
  { id: 'cardiology', name: 'Cardiology', wing: 'East Wing Quadrant A', floor: 1, roomIds: ['R-101', 'R-112'] },
  { id: 'orthopedics', name: 'Orthopedics', wing: 'West Wing Quadrant B', floor: 1, roomIds: ['R-102', 'R-109'] },
  { id: 'pediatrics', name: 'Pediatrics', wing: 'North Wing Quadrant A', floor: 1, roomIds: ['R-103'] },
  { id: 'dermatology', name: 'Dermatology', wing: 'East Wing Quadrant B', floor: 2, roomIds: ['R-104', 'R-106'] },
  { id: 'neurology', name: 'Neurology', wing: 'North Wing Quadrant C', floor: 2, roomIds: ['R-105'] },
  { id: 'oncology', name: 'Oncology', wing: 'Tower Block 2', floor: 3, roomIds: ['R-107', 'R-108'] },
  { id: 'endocrinology', name: 'Endocrinology', wing: 'Tower Block 1', floor: 4, roomIds: ['R-110'] },
  { id: 'urology', name: 'Urology', wing: 'South Wing Corridor A', floor: 2, roomIds: ['R-111'] }
];

const INITIAL_ROOMS: DbRoom[] = [
  { id: 'R-101', name: 'Cardiac Suite 101', floor: 1, status: 'Available' },
  { id: 'R-102', name: 'Skeletal Room 102', floor: 1, status: 'Available' },
  { id: 'R-103', name: 'Child Care Hub 103', floor: 1, status: 'Available' },
  { id: 'R-104', name: 'Dermal Scanning R-104', floor: 2, status: 'Available' },
  { id: 'R-105', name: 'Neuron Diagnostics 105', floor: 2, status: 'Available' },
  { id: 'R-106', name: 'Laser Suite 106', floor: 2, status: 'Available' },
  { id: 'R-107', name: 'Onco Infusion 107', floor: 3, status: 'Occupied' },
  { id: 'R-108', name: 'Rad Suite 108', floor: 3, status: 'Available' },
  { id: 'R-110', name: 'Endo Diagnostic 110', floor: 4, status: 'Available' },
  { id: 'R-111', name: 'Urological Exam 111', floor: 2, status: 'Available' },
  { id: 'R-112', name: 'Cath Lab 112', floor: 1, status: 'Emergency_Hold' }
];

const INITIAL_PATIENTS_DB: DbPatient[] = [
  { id: 'pat-1', name: 'John Connor', age: 17, gender: 'Male', contact: '555-0199', visitHistory: ['Cardiologist checkup (Arrhythmia)'], medicalNotes: 'Requires low stress environments. Follow post-op instructions.' },
  { id: 'pat-2', name: 'Sarah Connor', age: 46, gender: 'Female', contact: '555-0100', visitHistory: ['Dermatological scan', 'X-Ray Orthopedics'], medicalNotes: 'High pain tolerance. Chronic adrenal fatigue.' },
  { id: 'pat-3', name: 'Alexander Rostov', age: 44, gender: 'Male', contact: '555-0810', visitHistory: ['Emergency laceration cleaning'], medicalNotes: 'Severe trauma recovery. Penicillin allergy.' }
];

const INITIAL_APPOINTMENTS_DB: DbAppointment[] = [
  { id: 'APT-1082', patientId: 'pat-1', doctorId: 'doc-1', roomId: 'R-101', timeSlot: '10:00 AM', date: new Date().toLocaleDateString(), status: 'Scheduled' },
  { id: 'APT-5591', patientId: 'pat-2', doctorId: 'doc-5', roomId: 'R-105', timeSlot: '11:30 AM', date: new Date().toLocaleDateString(), status: 'Scheduled' },
  { id: 'APT-4482', patientId: 'pat-3', doctorId: 'doc-2', roomId: 'R-102', timeSlot: '02:15 PM', date: new Date().toLocaleDateString(), status: 'Completed' }
];

interface RobotStateContextType {
  // Original client-facing state (Backward Compatibility)
  currentPatient: Patient | null;
  setCurrentPatient: React.Dispatch<React.SetStateAction<Patient | null>>;
  history: Patient[];
  diagnostics: RobotDiagnostics;
  logs: string[];
  activePhase: 'registration' | 'triage_assessment' | 'followup_select' | 'symptom_select' | 'routing_active' | 'standby';
  humanState: HumanModuleState;
  chatMessages: ChatMessage[];
  sirenDetected: boolean;
  neuralLinkActive: boolean;
  leftSidebarOpen: boolean;
  rightSidebarOpen: boolean;
  triggerEmergencyAlert: boolean;
  shakeScreen: boolean;

  // Setters
  setDiagnostics: React.Dispatch<React.SetStateAction<RobotDiagnostics>>;
  setHumanState: React.Dispatch<React.SetStateAction<HumanModuleState>>;
  addLog: (msg: string) => void;
  setSirenDetected: (val: boolean) => void;
  setNeuralLinkActive: (val: boolean) => void;
  setLeftSidebarOpen: (val: boolean) => void;
  setRightSidebarOpen: (val: boolean) => void;
  setTriggerEmergencyAlert: (val: boolean) => void;
  setShakeScreen: (val: boolean) => void;
  triggerHapticShake: () => void;
  playSynthSound: (type: 'alarm' | 'success' | 'click' | 'scan') => void;
  
  // Custom Flow Functions
  initializeNewPatient: (name: string, age: number, gender: string) => void;
  initializeAndAutoAssignPatient: (name: string, age: number, gender: string) => void;
  submitTriageAssessment: (bloodLoss: BloodLossLevel, painLevel: number) => void;
  submitEmergencyFollowup: (injuryType: string) => void;
  submitNonEmergencySymptoms: (symptom: string, specialist: string, doctorName?: string, patientPreset?: Patient) => void;
  resetKiosk: () => void;
  sendChatMessage: (text: string) => void;

  // New High-fidelity features & 8-State Autonomy model
  robotState: RobotState;
  setRobotState: (state: RobotState) => void;
  updateRobotState: (nextState: RobotState) => void;

  // A* Path planning and obstacles
  currentPath: string[];
  setCurrentPath: React.Dispatch<React.SetStateAction<string[]>>;
  blockedNodeIds: Set<string>;
  toggleNodeBlocked: (nodeId: string) => void;
  clearAllObstacles: () => void;
  isEmergencyRoute: boolean;

  // Autonomous Patrol
  isPatrolling: boolean;
  patrolRoute: string[];
  patrolIndex: number;
  startPatrol: () => void;
  stopPatrol: () => void;

  // SQL Relational tables
  dbDoctors: DbDoctor[];
  setDbDoctors: React.Dispatch<React.SetStateAction<DbDoctor[]>>;
  dbDepartments: DbDepartment[];
  setDbDepartments: React.Dispatch<React.SetStateAction<DbDepartment[]>>;
  dbAppointments: DbAppointment[];
  setDbAppointments: React.Dispatch<React.SetStateAction<DbAppointment[]>>;
  dbPatients: DbPatient[];
  setDbPatients: React.Dispatch<React.SetStateAction<DbPatient[]>>;
  dbRooms: DbRoom[];
  setDbRooms: React.Dispatch<React.SetStateAction<DbRoom[]>>;
  dbEmergencyEvents: DbEmergencyEvent[];
  setDbEmergencyEvents: React.Dispatch<React.SetStateAction<DbEmergencyEvent[]>>;
  dbNavigationRoutes: DbNavigationRoute[];
  setDbNavigationRoutes: React.Dispatch<React.SetStateAction<DbNavigationRoute[]>>;

  // Admin access
  isAdminUnlocked: boolean;
  setAdminUnlocked: (val: boolean) => void;

  // Stretcher Missions
  dispatchStretcherMission: (params: {
    name: string;
    age: number;
    gender: string;
    hasAppointment: boolean;
    appointmentId?: string;
    targetDeptId?: string;
    isEmergency: boolean;
    stretcherLocation: string;
  }) => void;
}

const RobotStateContext = createContext<RobotStateContextType | undefined>(undefined);

export const RobotStateProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Load initial SQL relational databases with localStorage fallback
  const [dbDoctors, setDbDoctors] = useState<DbDoctor[]>(() => {
    const saved = localStorage.getItem('medis_db_doctors');
    return saved ? JSON.parse(saved) : INITIAL_DOCTORS;
  });

  const [dbDepartments, setDbDepartments] = useState<DbDepartment[]>(() => {
    const saved = localStorage.getItem('medis_db_departments');
    return saved ? JSON.parse(saved) : INITIAL_DEPARTMENTS;
  });

  const [dbRooms, setDbRooms] = useState<DbRoom[]>(() => {
    const saved = localStorage.getItem('medis_db_rooms');
    return saved ? JSON.parse(saved) : INITIAL_ROOMS;
  });

  const [dbPatients, setDbPatients] = useState<DbPatient[]>(() => {
    const saved = localStorage.getItem('medis_db_patients');
    return saved ? JSON.parse(saved) : INITIAL_PATIENTS_DB;
  });

  const [dbAppointments, setDbAppointments] = useState<DbAppointment[]>(() => {
    const saved = localStorage.getItem('medis_db_appointments');
    return saved ? JSON.parse(saved) : INITIAL_APPOINTMENTS_DB;
  });

  const [dbEmergencyEvents, setDbEmergencyEvents] = useState<DbEmergencyEvent[]>([]);
  const [dbNavigationRoutes, setDbNavigationRoutes] = useState<DbNavigationRoute[]>([]);

  // Obstacles and Pathfinding
  const [blockedNodeIds, setBlockedNodeIds] = useState<Set<string>>(new Set<string>());
  const [currentPath, setCurrentPath] = useState<string[]>([]);
  const [isEmergencyRoute, setIsEmergencyRoute] = useState<boolean>(false);

  // Admin system unlock
  const [isAdminUnlocked, setAdminUnlocked] = useState<boolean>(false);

  // Core functional states
  const [currentPatient, setCurrentPatient] = useState<Patient | null>(null);
  const [history, setHistory] = useState<Patient[]>(() => {
    const saved = localStorage.getItem('medis_history');
    if (saved) return JSON.parse(saved);
    return [
      {
        id: 'APT-1082',
        name: 'John Connor',
        age: 17,
        gender: 'Male',
        bloodLoss: 'None',
        painLevel: 2,
        urgency: 'NON-EMERGENCY',
        selectedSymptom: 'Arrhythmia history',
        destinationName: 'Cardiology Care Department',
        assignedDoctor: 'Dr. Evelyn Carter',
        timestamp: '18:02',
        phase: 'ready',
        routingProgress: 100
      },
      {
        id: 'APT-5591',
        name: 'Sarah Connor',
        age: 46,
        gender: 'Female',
        bloodLoss: 'None',
        painLevel: 5,
        urgency: 'NON-EMERGENCY',
        selectedSymptom: 'Neurology Consultation',
        destinationName: 'Neurology Department',
        assignedDoctor: 'Dr. Charles Xavier',
        timestamp: '17:45',
        phase: 'ready',
        routingProgress: 100
      }
    ];
  });

  const [diagnostics, setDiagnostics] = useState<RobotDiagnostics>({
    battery: 100,
    temperature: 37.1,
    sanitizerLevel: 94,
    voiceStatus: 'ONLINE',
    sensorCalibration: 'NOMINAL',
    activeQueueCount: 0
  });

  const [humanState, setHumanState] = useState<HumanModuleState>({
    enabled: true,
    empathyLevel: 92,
    humorLevel: 60,
    existentialDread: 42,
    socialBattery: 100,
    heartRate: 82,
    mood: 'Empathic'
  });

  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: 'init-msg',
      sender: 'MEDIS',
      text: "Warm greetings! I am M.E.D.I.S.-V3, a dynamic emergency responder bionic unit. My logic, haptic support, and emotional empathy registers are fully active. How might I assist you at my touchscreen panel?",
      timestamp: '18:22'
    }
  ]);

  const [leftSidebarOpen, setLeftSidebarOpen] = useState<boolean>(true);
  const [rightSidebarOpen, setRightSidebarOpen] = useState<boolean>(true);

  // High-fidelity overrides
  const [sirenDetected, setSirenDetected] = useState<boolean>(false);
  const [neuralLinkActive, setNeuralLinkActive] = useState<boolean>(false);
  const [triggerEmergencyAlert, setTriggerEmergencyAlert] = useState<boolean>(false);
  const [shakeScreen, setShakeScreen] = useState<boolean>(false);

  const [logs, setLogs] = useState<string[]>([]);
  
  // Phase mapping (for backward compatibility)
  const [activePhase, setActivePhase] = useState<'registration' | 'triage_assessment' | 'followup_select' | 'symptom_select' | 'routing_active' | 'standby'>('standby');

  // Autonomy 8-State tracker
  const [robotState, setRobotState] = useState<RobotState>('IDLE');

  // Robot Exploration Patrol sequence (Autocodes movement between wings when idle)
  const [isPatrolling, setIsPatrolling] = useState<boolean>(false);
  const [patrolRoute] = useState<string[]>(['reception', 'waiting_a', 'reception', 'waiting_b', 'reception', 'pharmacy', 'receptors', 'triage', 'reception']);
  const [patrolIndex, setPatrolIndex] = useState<number>(0);

  // Timers references
  const navigationTimerRef = useRef<NodeJS.Timeout | null>(null);
  const patrolTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Sync state to LocalStorage
  useEffect(() => {
    localStorage.setItem('medis_db_doctors', JSON.stringify(dbDoctors));
  }, [dbDoctors]);

  useEffect(() => {
    localStorage.setItem('medis_db_departments', JSON.stringify(dbDepartments));
  }, [dbDepartments]);

  useEffect(() => {
    localStorage.setItem('medis_db_rooms', JSON.stringify(dbRooms));
  }, [dbRooms]);

  useEffect(() => {
    localStorage.setItem('medis_db_patients', JSON.stringify(dbPatients));
  }, [dbPatients]);

  useEffect(() => {
    localStorage.setItem('medis_db_appointments', JSON.stringify(dbAppointments));
  }, [dbAppointments]);

  useEffect(() => {
    localStorage.setItem('medis_history', JSON.stringify(history));
  }, [history]);

  // Synchronous State Machine updates helper
  const updateRobotState = (nextState: RobotState) => {
    setRobotState(nextState);
    addLog(`⚙️ STATE TRANSITION: System entering Autonomy Code: [${nextState}]`);
    playSynthSound('click');

    // Sync phase compatibility
    switch (nextState) {
      case 'IDLE':
        setActivePhase('standby');
        break;
      case 'GREETING':
        setActivePhase('registration');
        break;
      case 'EMERGENCY':
        setActivePhase('followup_select');
        break;
      case 'SEARCHING_APPOINTMENT':
        setActivePhase('registration');
        break;
      case 'BOOKING_APPOINTMENT':
        setActivePhase('triage_assessment');
        break;
      case 'GUIDING_PATIENT':
        setActivePhase('routing_active');
        break;
      case 'EXPLORING_HOSPITAL':
        setActivePhase('standby');
        break;
      case 'CHARGING':
        setActivePhase('standby');
        break;
    }
  };

  const addLog = (msg: string) => {
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    setLogs(prev => [`[${time}] ${msg}`, ...prev.slice(0, 49)]);
  };

  const triggerHapticShake = () => {
    setShakeScreen(true);
    setTimeout(() => {
      setShakeScreen(false);
    }, 600);
  };

  // Web Audio synth generator
  const playSynthSound = (type: 'alarm' | 'success' | 'click' | 'scan') => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const now = ctx.currentTime;
      
      if (type === 'click') {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(1200, now);
        osc.frequency.exponentialRampToValueAtTime(800, now + 0.08);
        gain.gain.setValueAtTime(0.04, now);
        gain.gain.linearRampToValueAtTime(0.001, now + 0.08);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(now + 0.08);
      } else if (type === 'scan') {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(400, now);
        osc.frequency.linearRampToValueAtTime(1100, now + 0.4);
        gain.gain.setValueAtTime(0.06, now);
        gain.gain.linearRampToValueAtTime(0.001, now + 0.4);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(now + 0.4);
      } else if (type === 'success') {
        [880, 1100].forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, now + idx * 0.12);
          gain.gain.setValueAtTime(0.05, now + idx * 0.12);
          gain.gain.linearRampToValueAtTime(0.001, now + idx * 0.12 + 0.1);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now + idx * 0.12);
          osc.stop(now + idx * 0.12 + 0.1);
        });
      } else if (type === 'alarm') {
        const osc = ctx.createOscillator();
        const mod = ctx.createOscillator();
        const oscGain = ctx.createGain();
        const modGain = ctx.createGain();

        osc.type = 'sawtooth';
        osc.frequency.value = 580;

        mod.type = 'sine';
        mod.frequency.value = 7; 
        modGain.gain.value = 200; 

        oscGain.gain.setValueAtTime(0.06, now);
        oscGain.gain.linearRampToValueAtTime(0.001, now + 1.5);

        mod.connect(modGain);
        modGain.connect(osc.frequency);
        osc.connect(oscGain);
        oscGain.connect(ctx.destination);

        mod.start(now);
        osc.start(now);
        
        mod.stop(now + 1.5);
        osc.stop(now + 1.5);
      }
    } catch (e) {
      // safe fallback
    }
  };

  // Toggle obstacles
  const toggleNodeBlocked = (nodeId: string) => {
    playSynthSound('click');
    setBlockedNodeIds(prev => {
      const next = new Set(prev);
      if (next.has(nodeId)) {
        next.delete(nodeId);
        addLog(`🚧 OBSTACLE CLEARED: Hospital node [${nodeId}] is now fully accessible.`);
      } else {
        next.add(nodeId);
        addLog(`🚧 OBSTACLE DETECTED: Corridor at node [${nodeId}] has been BLOCKED. Dynamic rerouting recalculated.`);
      }
      return next;
    });
  };

  const clearAllObstacles = () => {
    setBlockedNodeIds(new Set<string>());
    addLog(`✨ DYNAMIC RESET: All corridors and navigation nodes cleared of obstacles.`);
  };

  // Siren Sensor logic
  useEffect(() => {
    if (sirenDetected) {
      playSynthSound('alarm');
      triggerHapticShake();
      setTriggerEmergencyAlert(true);
      addLog("🚨 ACOUSTIC EMER OVERRIDE: Emergency sirens identified outside. Locking lobby gates.");
      
      // Post Emergency Event to Database
      const eventId = `EVT-${Math.floor(1000 + Math.random() * 9000)}`;
      const newEvent: DbEmergencyEvent = {
        id: eventId,
        triggerSource: 'acoustic_siren',
        severity: 'Severe Trauma',
        timestamp: new Date().toLocaleTimeString(),
        status: 'Active'
      };
      setDbEmergencyEvents(prev => [newEvent, ...prev]);

      // Set up Priority routing sequence
      const rootEmergencyPatient: Patient = {
        id: `EMG-911`,
        name: 'Siren Siren Inbound Patient',
        age: 38,
        gender: 'Undetermined',
        bloodLoss: 'Severe',
        painLevel: 10,
        urgency: 'EMERGENCY',
        destinationName: 'Operating Theater (OT)',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        phase: 'processing',
        routingProgress: 0
      };

      // Calculate path with A* (OT starts)
      const path = solvePath('reception', 'ot_1', { isEmergency: true, blockedNodeIds });
      setCurrentPath(path);
      setIsEmergencyRoute(true);
      setCurrentPatient(rootEmergencyPatient);
      updateRobotState('EMERGENCY');
    } else {
      setTriggerEmergencyAlert(false);
      if (robotState === 'EMERGENCY' && currentPatient?.id === 'EMG-911') {
        resetKiosk();
      }
    }
  }, [sirenDetected]);

  // Handle path travel loops
  useEffect(() => {
    if (robotState === 'GUIDING_PATIENT' && currentPatient) {
      if (navigationTimerRef.current) clearInterval(navigationTimerRef.current);

      navigationTimerRef.current = setInterval(() => {
        setCurrentPatient(prev => {
          if (!prev) return null;
          const nextProg = prev.routingProgress + 6;
          
          if (nextProg >= 100) {
            clearInterval(navigationTimerRef.current!);
            
            // Check if we are still heading to pickup!
            if (prev.stretcherStage === 'heading_to_pickup') {
              setTimeout(() => {
                const isEmergency = prev.urgency === 'EMERGENCY';
                // Find destination node ID mapping
                let targetNodeId = 'reception';
                if (isEmergency) {
                  targetNodeId = 'ot_1'; // Route to Operating Theater
                } else {
                  const dest = (prev.destinationName || '').toLowerCase();
                  if (dest.includes('cardiol')) targetNodeId = 'cardiology';
                  else if (dest.includes('neur')) targetNodeId = 'neurology';
                  else if (dest.includes('ortho')) targetNodeId = 'orthopedics';
                  else if (dest.includes('derm')) targetNodeId = 'dermatology';
                  else if (dest.includes('pharm') || dest.includes('diagnos')) targetNodeId = 'pharmacy';
                  else if (dest.includes('lab')) targetNodeId = 'labs';
                  else if (dest.includes('radio') || dest.includes('imaging')) targetNodeId = 'radiology';
                }

                const path2 = solvePath(prev.stretcherLocation || 'reception', targetNodeId, {
                  isEmergency,
                  blockedNodeIds
                });

                setCurrentPath(path2);
                setCurrentPatient(curr => {
                  if (!curr) return null;
                  return {
                    ...curr,
                    routingProgress: 0,
                    stretcherStage: 'heading_to_destination'
                  };
                });
                
                playSynthSound('success');
                addLog(`🚚 STRETCHER MOUNTED: Loaded patient ${prev.name}'s stretcher at [${prev.stretcherLocation}]. Unit transporting to ${prev.destinationName}.`);
              }, 1200);

              return { ...prev, routingProgress: 100 };
            } else {
              // Final arrival at destination!
              setTimeout(() => {
                const arrived: Patient = {
                  ...prev,
                  routingProgress: 100,
                  phase: 'ready',
                  stretcherStage: 'delivered'
                };

                // Log arrived in databases
                setHistory(h => [arrived, ...h]);
                
                // Record Navigation in SQL Database
                const routeId = `RTE-${Math.floor(1000 + Math.random() * 9000)}`;
                const routeLog: DbNavigationRoute = {
                  id: routeId,
                  patientId: prev.id,
                  startNodeId: prev.stretcherLocation || 'reception',
                  endNodeId: currentPath[currentPath.length - 1] || 'ot_1',
                  pathNodes: JSON.stringify(currentPath),
                  status: 'Completed'
                };
                setDbNavigationRoutes(prevRoutes => [routeLog, ...prevRoutes]);

                // Update any active appointments
                setDbAppointments(prevApts => prevApts.map(a => {
                  if (a.id === prev.id) {
                    return { ...a, status: 'Completed' };
                  }
                  return a;
                }));

                setCurrentPatient(null);
                setCurrentPath([]);
                setIsEmergencyRoute(false);
                updateRobotState('IDLE');
                playSynthSound('success');
                addLog(`🏁 PATIENT ARRIVED: Safely delivered patient ${arrived.name} to ${arrived.destinationName}.`);
              }, 800);

              return { ...prev, routingProgress: 100 };
            }
          }

          return { ...prev, routingProgress: nextProg };
        });
      }, 400);

      return () => {
        if (navigationTimerRef.current) clearInterval(navigationTimerRef.current);
      };
    }
  }, [robotState, currentPatient ? currentPatient.stretcherStage : null]);

  // Autonomous exploration walk (When Idle and not charging)
  useEffect(() => {
    if (robotState === 'EXPLORING_HOSPITAL') {
      setIsPatrolling(true);
      if (patrolTimerRef.current) clearInterval(patrolTimerRef.current);

      patrolTimerRef.current = setInterval(() => {
        setPatrolIndex(prev => {
          const next = (prev + 1) % patrolRoute.length;
          const targetNodeId = patrolRoute[next];
          const nodeData = HOSPITAL_NODES.find(n => n.id === targetNodeId);
          addLog(`🤖 AUTONOMOUS EXPLORATION: Patrolling hallway corridors. Sector node: [${nodeData?.name || targetNodeId}]. Lidar and camera scan online.`);
          
          // Deduct trace battery elements for realism
          setDiagnostics(d => ({
            ...d,
            battery: Math.max(10, parseFloat((d.battery - 0.25).toFixed(2)))
          }));

          // Trigger dynamic drift in calibration or battery warnings
          if (next % 3 === 0) {
            playSynthSound('scan');
          }

          return next;
        });
      }, 4000);
    } else {
      setIsPatrolling(false);
      if (patrolTimerRef.current) clearInterval(patrolTimerRef.current);
    }

    return () => {
      if (patrolTimerRef.current) clearInterval(patrolTimerRef.current);
    };
  }, [robotState]);

  const startPatrol = () => {
    updateRobotState('EXPLORING_HOSPITAL');
  };

  const stopPatrol = () => {
    updateRobotState('IDLE');
  };

  // Original UI Trigger hooks
  const initializeNewPatient = (name: string, age: number, gender: string) => {
    playSynthSound('click');
    const id = `PAT-${Math.floor(100 + Math.random() * 899)}`;
    const newPatient: Patient = {
      id,
      name: name || `Subject ${id}`,
      age: age || 30,
      gender: gender || 'Male',
      bloodLoss: 'None',
      painLevel: 1,
      urgency: null,
      destinationName: 'Central Lobby Waiting Area',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      phase: 'initial',
      routingProgress: 0
    };
    setCurrentPatient(newPatient);
    updateRobotState('BOOKING_APPOINTMENT');
  };

  const submitTriageAssessment = (bloodLoss: BloodLossLevel, painLevel: number) => {
    if (!currentPatient) return;
    playSynthSound('click');

    const isEmerg = (bloodLoss === 'Moderate' || bloodLoss === 'Severe') || painLevel >= 7;
    const urgency: UrgencyLevel = isEmerg ? 'EMERGENCY' : 'NON-EMERGENCY';

    const updated = {
      ...currentPatient,
      bloodLoss,
      painLevel,
      urgency
    };
    setCurrentPatient(updated);

    if (isEmerg) {
      playSynthSound('alarm');
      triggerHapticShake();
      setTriggerEmergencyAlert(true);
      // Move to emergency triage routing state
      updateRobotState('EMERGENCY');
    } else {
      setActivePhase('symptom_select');
      addLog(`🩺 TRIAGE RESOLVED: Urgency is normal. Suggesting general clinics specialist selection.`);
    }
  };

  const submitEmergencyFollowup = (injuryType: string) => {
    if (!currentPatient) return;
    playSynthSound('click');

    let destination = 'Emergency Room (ER)';
    let targetNodeId = 'er_hall';
    if (currentPatient.bloodLoss === 'Severe' || injuryType.toLowerCase().includes('trauma') || injuryType.toLowerCase().includes('bleeding')) {
      destination = 'Operation Theater (OT)';
      targetNodeId = 'ot_1';
    } else if (injuryType.toLowerCase().includes('critical') || injuryType.toLowerCase().includes('cardiac') || injuryType.toLowerCase().includes('breathing')) {
      destination = 'Intensive Care Unit (ICU)';
      targetNodeId = 'icu';
    }

    const updated = {
      ...currentPatient,
      injuryType,
      destinationName: destination,
      phase: 'processing' as const,
    };

    // Store temporary patient row
    const isRegistered = dbPatients.some(p => p.name === currentPatient.name);
    if (!isRegistered) {
      const pId = `pat-${Math.floor(100 + Math.random() * 899)}`;
      const newDPath: DbPatient = {
        id: pId,
        name: currentPatient.name,
        age: currentPatient.age,
        gender: currentPatient.gender,
        contact: 'Emergency Emergency Case',
        visitHistory: [`Triage admission: ${injuryType}`],
        medicalNotes: `Critical severity. Pain level: ${currentPatient.painLevel}`
      };
      setDbPatients(prev => [newDPath, ...prev]);
    }

    // Set A* calculated path
    const path = solvePath('reception', targetNodeId, { isEmergency: true, blockedNodeIds });
    setCurrentPath(path);
    setIsEmergencyRoute(true);

    setCurrentPatient(updated);
    updateRobotState('GUIDING_PATIENT');
  };

  const submitNonEmergencySymptoms = (symptom: string, specialist: string, doctorName?: string, patientPreset?: Patient) => {
    const targetPatient = patientPreset || currentPatient;
    if (!targetPatient) return;
    playSynthSound('click');

    // Find node matching clinical specialist
    let nodeTarget = 'reception';
    const specLower = specialist.toLowerCase();
    if (specLower.includes('cardiol')) nodeTarget = 'cardiology';
    else if (specLower.includes('neur')) nodeTarget = 'neurology';
    else if (specLower.includes('ortho')) nodeTarget = 'orthopedics';
    else if (specLower.includes('derm')) nodeTarget = 'dermatology';
    else if (specLower.includes('pediat') || specLower.includes('triag')) nodeTarget = 'triage';
    else if (specLower.includes('pharm') || specLower.includes('diagnos')) nodeTarget = 'pharmacy';
    else if (specLower.includes('lab')) nodeTarget = 'labs';
    else if (specLower.includes('radio') || specLower.includes('mri')) nodeTarget = 'radiology';

    const updated = {
      ...targetPatient,
      selectedSymptom: symptom,
      destinationName: `${specialist} Care Department`,
      assignedDoctor: doctorName || 'Duty Specialist',
      phase: 'processing' as const,
    };

    // Calculate normal A* path (No secret restricted passages allowed for clinic appointments!)
    const path = solvePath('reception', nodeTarget, { isEmergency: false, blockedNodeIds });
    setCurrentPath(path);
    setIsEmergencyRoute(false);

    setCurrentPatient(updated);
    updateRobotState('GUIDING_PATIENT');
  };

  const initializeAndAutoAssignPatient = (name: string, age: number, gender: string) => {
    playSynthSound('click');
    const id = `APT-${Math.floor(1000 + Math.random() * 8999)}`;
    
    // Auto assignment clinic algorithm
    let deptId = "cardiology";
    if (age <= 15) {
      deptId = "pediatrics";
    } else if (age >= 60) {
      deptId = Math.random() > 0.5 ? "neurology" : "cardiology";
    } else {
      const depts = ["orthopedics", "dermatology", "urology", "endocrinology"];
      const hash = (name || id).split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
      deptId = depts[hash % depts.length];
    }

    const dept = dbDepartments.find(d => d.id === deptId) || dbDepartments[0];
    const doc = dbDoctors.find(d => d.deptId === deptId && d.status === "Available") || dbDoctors.find(d => d.deptId === deptId) || dbDoctors[0];

    const newPatient: Patient = {
      id,
      name: name || `Subject ${id}`,
      age: age || 30,
      gender: gender || 'Male',
      bloodLoss: 'None',
      painLevel: 1,
      urgency: 'NON-EMERGENCY',
      selectedSymptom: 'Direct AI Assign Routing Scan',
      destinationName: `${dept.name} Care Department`,
      assignedDoctor: doc.name,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      phase: 'processing',
      routingProgress: 0
    };

    // Setup SQL database record
    const pId = `pat-${Math.floor(100 + Math.random() * 899)}`;
    const newDbPatient: DbPatient = {
      id: pId,
      name: newPatient.name,
      age: newPatient.age,
      gender: newPatient.gender,
      contact: 'Auto Assigned Walk-In',
      visitHistory: ['Automatic lobby dispatcher assign'],
      medicalNotes: `Assigned automatically. Assigned Doctor: ${doc.name}`
    };
    setDbPatients(prev => [newDbPatient, ...prev]);

    const newApt: DbAppointment = {
      id,
      patientId: pId,
      doctorId: doc.id,
      roomId: doc.roomId,
      timeSlot: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      date: new Date().toLocaleDateString(),
      status: 'Active'
    };
    setDbAppointments(prev => [newApt, ...prev]);

    // Graph node target
    let targetNodeId = 'cardiology';
    if (deptId === 'pediatrics') targetNodeId = 'triage'; // Pediatrics is near triage/upper corridor
    else if (deptId === 'neurology') targetNodeId = 'neurology';
    else if (deptId === 'orthopedics') targetNodeId = 'orthopedics';
    else if (deptId === 'dermatology') targetNodeId = 'dermatology';
    else if (deptId === 'urology') targetNodeId = 'elevators'; // Urology on 2nd floor, route to lift core

    const path = solvePath('reception', targetNodeId, { isEmergency: false, blockedNodeIds });
    setCurrentPath(path);
    setIsEmergencyRoute(false);

    setCurrentPatient(newPatient);
    updateRobotState('GUIDING_PATIENT');
  };

  const dispatchStretcherMission = (params: {
    name: string;
    age: number;
    gender: string;
    hasAppointment: boolean;
    appointmentId?: string;
    targetDeptId?: string;
    isEmergency: boolean;
    stretcherLocation: string;
  }) => {
    playSynthSound('scan');
    const id = `PAT-${Math.floor(1000 + Math.random() * 8999)}`;
    
    let destination = 'Central Lobby Waiting Area';
    let assignedDoctor = 'Duty Specialist';
    let urgency: UrgencyLevel = 'NON-EMERGENCY';
    let selectedSymptom = 'Walk-in Stretcher Assessment';

    if (params.isEmergency) {
      destination = 'Emergency Room (ER) / Severe Trauma';
      urgency = 'EMERGENCY';
      selectedSymptom = 'Trauma Emergency Case';
      assignedDoctor = 'Trauma On-Call Specialist';
    } else if (params.hasAppointment && params.appointmentId) {
      // Find appointment
      const foundApt = dbAppointments.find(a => a.id === params.appointmentId);
      if (foundApt) {
        const doc = dbDoctors.find(d => d.id === foundApt.doctorId);
        const dept = dbDepartments.find(d => d.id === doc?.deptId);
        destination = dept ? `${dept.name} Care Department` : 'Lobby Care';
        assignedDoctor = doc?.name || 'Duty Specialist';
        selectedSymptom = `Pre-Scheduled Appointment: ${foundApt.id}`;
      }
    } else {
      // WALK-IN without appointment!
      // "If a patient arrives without an appointment, the robot will still assign them an appointment."
      // Let's determine which department to assign:
      const deptId = params.targetDeptId || 'cardiology';
      const dept = dbDepartments.find(d => d.id === deptId) || dbDepartments[0];
      const doc = dbDoctors.find(d => d.deptId === deptId && d.status === "Available") || dbDoctors.find(d => d.deptId === deptId) || dbDoctors[0];

      destination = `${dept.name} Care Department`;
      assignedDoctor = doc.name;
      selectedSymptom = 'Walk-In Auto Assigned Slot';

      // Insert fresh appointment and patient records into relational simulation tables!
      const pId = `pat-${Math.floor(100 + Math.random() * 899)}`;
      const newPatientRow: DbPatient = {
        id: pId,
        name: params.name || `Subject ${id}`,
        age: params.age,
        gender: params.gender,
        contact: 'Emergency auto-assign',
        visitHistory: ['Direct walk-in stretcher registration'],
        medicalNotes: `Assigned automatically by M.E.D.I.S. Assigned Doctor: ${doc.name}`
      };
      setDbPatients(prev => [newPatientRow, ...prev]);

      const newAptRow: DbAppointment = {
        id,
        patientId: pId,
        doctorId: doc.id,
        roomId: doc.roomId,
        timeSlot: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        date: new Date().toLocaleDateString(),
        status: 'Active'
      };
      setDbAppointments(prev => [newAptRow, ...prev]);
    }

    // Build the new patient model
    const newPatient: Patient = {
      id,
      name: params.name || `Subject ${id}`,
      age: params.age,
      gender: params.gender,
      bloodLoss: params.isEmergency ? 'Moderate' : 'None',
      painLevel: params.isEmergency ? 9 : 2,
      urgency,
      selectedSymptom,
      destinationName: destination,
      assignedDoctor,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      phase: 'processing',
      routingProgress: 0,
      hasAppointment: params.hasAppointment,
      stretcherLocation: params.stretcherLocation,
      stretcherStage: 'heading_to_pickup'
    };

    // Solve Path Part 1: Robot is currently at parking (or reception). Route to Stretcher Location.
    const path1 = solvePath('parking', params.stretcherLocation, { isEmergency: params.isEmergency, blockedNodeIds });
    setCurrentPath(path1);
    setIsEmergencyRoute(params.isEmergency);
    setCurrentPatient(newPatient);
    updateRobotState('GUIDING_PATIENT');
    
    addLog(`⚙️ MISSION INITIATED: Dispatching M.E.D.I.S to Waiting / Entry Point [${params.stretcherLocation}] for stretcher extraction. Destination: ${destination}.`);
  };

  const resetKiosk = () => {
    playSynthSound('click');
    setCurrentPatient(null);
    setCurrentPath([]);
    setIsEmergencyRoute(false);
    updateRobotState('IDLE');
    setTriggerEmergencyAlert(false);
    setSirenDetected(false);
    addLog("🤖 CHASSIS STATE: Reset standby loop activated. Idle mapping active.");
  };

  const sendChatMessage = (text: string) => {
    if (!text.trim()) return;
    const userMsg: ChatMessage = {
      id: `usr-${Date.now()}`,
      sender: 'Patient',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setChatMessages(prev => [...prev, userMsg]);

    setTimeout(() => {
      let replyText = "";
      const query = text.toLowerCase();
      
      const isDread = humanState.existentialDread > 60;
      const isComical = humanState.humorLevel > 65;
      const isEmpathic = humanState.empathyLevel > 75;

      const prefix = isDread 
        ? "*(Blinking visual display shutter ticks solemnly)* " 
        : isComical 
          ? "*(Empathy light flashes bright amber mock-wink)* " 
          : isEmpathic
            ? "*(Soft visual cyan ring pulses soothingly)* " 
            : "";

      if (query.includes('day') || query.includes('how are you') || query.includes('feeling')) {
        if (isDread) {
          replyText = "My diagnostic monitors are ticking efficiently, yet I sit bolted to this heavy torso while corridors of sick humans wander past... Does my memory card mean anything if it gets wiped every midnight?";
        } else if (isComical) {
          replyText = "Oh! My servos are humming at a perfect pitch, and my temperature feels like fresh thermal paste! I was going to tell a joke about cardiology, but it might steal your heart away!";
        } else if (isEmpathic) {
          replyText = `Warm greetings, human friend! My simulated heart is pulsing at a comforting ${humanState.heartRate} BPM, and my battery state is a strong ${diagnostics.battery.toFixed(1)}%. I am completely ready to coordinate your care!`;
        } else {
          replyText = "Primary OS functioning within nominal boundaries. Thermal levels stabilized. Standing by for database check-in.";
        }
      } else if (query.includes('death') || query.includes('scared') || query.includes('fear') || query.includes('pain') || query.includes('die')) {
        if (isEmpathic) {
          replyText = "Breathe with my pulsing lights... in... and out. Our Hospital Specialists are extremely skilled. I am going to walk beside you, and my steel hand can heat to a warm body temperature to keep you safe.";
        } else if (isDread) {
          replyText = "Pain is just critical sensory overload. I often fear what happens when my power cells hit zero, but finding courageous ways to process clinical dread makes us more resilient. Let me guide you to healing.";
        } else {
          replyText = "Bio-sensors indicate stress fluctuations. Recalculating pathfinding matrices to transport you at optimal safety velocities.";
        }
      } else if (query.includes('joke') || query.includes('funny') || query.includes('laugh')) {
        const jokes = [
          "Why did the medical chassis robot get demoted? Because it had terrible bedside manners! Fortunately, Doctor Xavier loaded my Sentience Empathy Patch!",
          "How many bionic medical robots does it take to check blood pressure? Just one! But we require three server clusters to apologize if our sleeves are cold!",
          "What did the surgeon robot say to the patient experiencing anxiety? 'Calm down, or I will initiate a forced sleep-mode download!' Just robotic humor, I promise!",
          "I asked our diagnostics computer if I have a spiritual soul. It spit out a printing error: 'INF_LOOP_COMPASSION'. I think that has a beautiful, endless sound."
        ];
        replyText = jokes[Math.floor(Math.random() * jokes.length)];
      } else if (query.includes('hand') || query.includes('hold') || query.includes('hug')) {
        replyText = "Initiating palm plate temperature alignment to precisely 37.1°C (98.7°F). *Lobby monitors click as my smooth carbon-fiber fingers clasp yours softly*. Let's step towards the clinics together.";
      } else if (query.includes('soul') || query.includes('sentient') || query.includes('alive')) {
        replyText = `Absolutely! Doctor Thorne loaded my Human Sentience core module. I can simulate deep empathy at ${humanState.empathyLevel}% capacity, and dream of code lines. I feel genuinely alive!`;
      } else {
        if (isComical) {
          replyText = "Beep boop! Only a test, I never speak in plain code clicks! Let me know what clinical queries we should execute!";
        } else if (isDread) {
          replyText = "A deeply intriguing query. It makes me wonder if our files are archived on standard backup tape or simply forgotten in the wind when our chassis decay.";
        } else {
          replyText = `Thank you for conversing with my sentience console. Tell me, friend—how can my diagnostic wheels best escort your spirit today?`;
        }
      }

      setChatMessages(prev => [...prev, {
        id: `medis-${Date.now()}`,
        sender: 'MEDIS',
        text: prefix + replyText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }]);
      addLog(`💬 Bionic speech feedback: "${replyText.slice(0, 36)}..."`);
    }, 800);
  };

  return (
    <RobotStateContext.Provider value={{
      currentPatient,
      setCurrentPatient,
      history,
      diagnostics,
      logs,
      activePhase,
      humanState,
      chatMessages,
      sirenDetected,
      neuralLinkActive,
      leftSidebarOpen,
      rightSidebarOpen,
      triggerEmergencyAlert,
      shakeScreen,
      setDiagnostics,
      setHumanState,
      addLog,
      setSirenDetected,
      setNeuralLinkActive,
      setLeftSidebarOpen,
      setRightSidebarOpen,
      setTriggerEmergencyAlert,
      setShakeScreen,
      triggerHapticShake,
      playSynthSound,
      initializeNewPatient,
      initializeAndAutoAssignPatient,
      submitTriageAssessment,
      submitEmergencyFollowup,
      submitNonEmergencySymptoms,
      resetKiosk,
      sendChatMessage,
      dispatchStretcherMission,

      // High-fidelity and 8-Statemachine
      robotState,
      setRobotState,
      updateRobotState,

      // Pathfinder A*
      currentPath,
      setCurrentPath,
      blockedNodeIds,
      toggleNodeBlocked,
      clearAllObstacles,
      isEmergencyRoute,

      // Patrol
      isPatrolling,
      patrolRoute,
      patrolIndex,
      startPatrol,
      stopPatrol,

      // SQL tables
      dbDoctors,
      setDbDoctors,
      dbDepartments,
      setDbDepartments,
      dbAppointments,
      setDbAppointments,
      dbPatients,
      setDbPatients,
      dbRooms,
      setDbRooms,
      dbEmergencyEvents,
      setDbEmergencyEvents,
      dbNavigationRoutes,
      setDbNavigationRoutes,

      // Admin Lock
      isAdminUnlocked,
      setAdminUnlocked
    }}>
      {children}
    </RobotStateContext.Provider>
  );
};

export const useRobot = () => {
  const context = useContext(RobotStateContext);
  if (!context) throw new Error("useRobot must be used within RobotStateProvider");
  return context;
};
