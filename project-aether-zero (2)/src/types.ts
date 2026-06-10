export type UrgencyLevel = 'EMERGENCY' | 'NON-EMERGENCY';

export type BloodLossLevel = 'None' | 'Low' | 'Moderate' | 'Severe';

// 8 Autonomous Robot Behavior States
export type RobotState = 
  | 'IDLE' 
  | 'GREETING' 
  | 'EMERGENCY' 
  | 'SEARCHING_APPOINTMENT' 
  | 'BOOKING_APPOINTMENT' 
  | 'GUIDING_PATIENT' 
  | 'EXPLORING_HOSPITAL' 
  | 'CHARGING';

export interface Patient {
  id: string;
  name: string;
  age: number;
  gender: string;
  bloodLoss: BloodLossLevel;
  painLevel: number; // 1-10
  urgency: UrgencyLevel | null;
  injuryType?: string;
  selectedSymptom?: string;
  destinationName: string; 
  assignedDoctor?: string;
  timestamp: string;
  phase: 'initial' | 'processing' | 'routing' | 'ready';
  routingProgress: number; // 0 to 100
  hasAppointment?: boolean;
  stretcherLocation?: string;
  stretcherStage?: 'heading_to_pickup' | 'stretcher_loaded' | 'heading_to_destination' | 'delivered';
}

export interface RobotDiagnostics {
  battery: number;
  temperature: number; // °C
  sanitizerLevel: number; // %
  voiceStatus: 'ONLINE' | 'MUTED' | 'STANDBY';
  sensorCalibration: 'NOMINAL' | 'CALIBRATING' | 'DRIFT';
  activeQueueCount: number;
}

export interface HumanModuleState {
  enabled: boolean;
  empathyLevel: number; // 0 - 100
  humorLevel: number; // 0 - 100
  existentialDread: number; // 0 - 100
  socialBattery: number; // 0 - 100
  heartRate: number; // 80 - 130 bpm
  mood: string; 
}

export interface ChatMessage {
  id: string;
  sender: 'Patient' | 'MEDIS' | 'System';
  text: string;
  timestamp: string;
}

// Simulated SQL relational database table interfaces
export interface DbDoctor {
  id: string;
  name: string;
  specialty: string;
  deptId: string;
  roomId: string;
  workingHours: string;
  status: 'Available' | 'Consulting' | 'In Surgery' | 'On Break';
  emergAvailability: boolean;
}

export interface DbDepartment {
  id: string;
  name: string;
  wing: string;
  floor: number;
  roomIds: string[];
}

export interface DbAppointment {
  id: string;
  patientId: string;
  doctorId: string;
  roomId: string;
  timeSlot: string;
  date: string;
  status: 'Scheduled' | 'Active' | 'Completed' | 'Cancelled';
}

export interface DbPatient {
  id: string;
  name: string;
  age: number;
  gender: string;
  contact: string;
  visitHistory: string[];
  medicalNotes: string;
  emergencyFlags?: string;
}

export interface DbRoom {
  id: string;
  name: string;
  floor: number;
  status: 'Available' | 'Occupied' | 'Emergency_Hold' | 'Maintenance';
}

export interface DbHospitalMapNode {
  id: string;
  name: string;
  x: number;
  y: number;
  type: string;
}

export interface DbHospitalMapEdge {
  fromNode: string;
  toNode: string;
  distance: number;
  isRestricted: boolean;
}

export interface DbRobotState {
  state: RobotState;
  timestamp: string;
  batteryStatus: number;
  currentLocationId: string;
}

export interface DbNavigationRoute {
  id: string;
  patientId: string | null;
  startNodeId: string;
  endNodeId: string;
  pathNodes: string; // JSON array string
  status: 'Active' | 'Completed' | 'Rerouted' | 'Aborted';
}

export interface DbEmergencyEvent {
  id: string;
  triggerSource: 'acoustic_siren' | 'patient_triage' | 'remote_override';
  severity: 'Amber' | 'Crimson' | 'Severe Trauma';
  timestamp: string;
  status: 'Active' | 'Resolved';
}
