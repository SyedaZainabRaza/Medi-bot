import React from 'react';
import { useRobot } from '../RobotStateContext';
import { 
  Battery, 
  Thermometer, 
  Droplets, 
  Volume2, 
  Lightbulb, 
  ShieldAlert, 
  Sparkles, 
  Wrench,
  Siren,
  Maximize2
} from 'lucide-react';

export const RobotTelemetry: React.FC = () => {
  const { diagnostics, setDiagnostics, addLog, triggerEmergencyAlert, setTriggerEmergencyAlert } = useRobot();

  const handleRefillSanitizer = () => {
    setDiagnostics(prev => ({ ...prev, sanitizerLevel: 100 }));
    addLog("Autonomous sanitization fluid reserves refilled to 100%. Sanitizer spray activated on lobby entrance.");
  };

  const toggleVoiceMode = () => {
    setDiagnostics(prev => {
      const modes: Array<'ONLINE' | 'MUTED' | 'STANDBY'> = ['ONLINE', 'MUTED', 'STANDBY'];
      const nextIndex = (modes.indexOf(prev.voiceStatus) + 1) % modes.length;
      const nextMode = modes[nextIndex];
      addLog(`Robot vocal synthesizer mode altered to: ${nextMode}.`);
      return { ...prev, voiceStatus: nextMode };
    });
  };

  const handleCalibrateSensors = () => {
    setDiagnostics(prev => ({ ...prev, sensorCalibration: 'CALIBRATING' }));
    addLog("Recalibrating haptic lidar and floor plan coordinates. Please standby...");
    setTimeout(() => {
      setDiagnostics(prev => ({ ...prev, sensorCalibration: 'NOMINAL' }));
      addLog("Lidar sensors fully calibrated at 99.98% path alignment accuracy. Standard grid NOMINAL.");
    }, 2000);
  };

  return (
    <div className="bg-slate-900/50 border border-slate-800 p-5 rounded-3xl flex flex-col h-full backdrop-blur-md relative" id="robot-telemetry-panel">
      {/* Visual Accent */}
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-sky-500/10" />

      <div className="mb-4">
        <h2 className="text-xs font-bold font-mono tracking-widest text-[#60a5fa] uppercase flex items-center gap-2">
          <Wrench size={14} />
          ROBOT SYSTEMS DIAGNOSTICS & CONTROLS
        </h2>
        <p className="text-[10px] text-slate-500 font-mono uppercase tracking-wider">
          Node M.E.D.I.S.-V3 telemetry array status logs
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 flex-1">
        
        {/* Core Metrics */}
        <div className="space-y-3 bg-slate-950/60 p-4 border border-slate-900 rounded-2xl flex flex-col justify-between">
          <h3 className="text-[9px] font-bold font-mono text-slate-400 tracking-wider uppercase">Active Telemetry</h3>
          
          <div className="space-y-2.5">
            {/* Battery Indicator */}
            <div className="flex justify-between items-center text-[10px] font-mono">
              <span className="text-slate-500 flex items-center gap-1.5 uppercase">
                <Battery size={13} className="text-emerald-500" /> Charge
              </span>
              <span className={`font-bold ${diagnostics.battery > 20 ? 'text-emerald-400' : 'text-red-400 animate-pulse'}`}>
                {diagnostics.battery.toFixed(1)}%
              </span>
            </div>

            {/* Processor Temp */}
            <div className="flex justify-between items-center text-[10px] font-mono">
              <span className="text-slate-500 flex items-center gap-1.5 uppercase">
                <Thermometer size={13} className="text-sky-400" /> CPU Core
              </span>
              <span className="font-bold text-sky-400">
                {diagnostics.temperature}°C
              </span>
            </div>

            {/* Sanitizer Fluid */}
            <div className="flex justify-between items-center text-[10px] font-mono">
              <span className="text-slate-500 flex items-center gap-1.5 uppercase">
                <Droplets size={13} className="text-blue-400" /> Sanitizer
              </span>
              <span className="font-bold text-blue-400">
                {diagnostics.sanitizerLevel}%
              </span>
            </div>

            {/* Voice Status */}
            <div className="flex justify-between items-center text-[10px] font-mono">
              <span className="text-slate-500 flex items-center gap-1.5 uppercase">
                <Volume2 size={13} className="text-amber-400" /> Synth Voice
              </span>
              <span className="font-bold text-amber-400 uppercase">
                {diagnostics.voiceStatus}
              </span>
            </div>

            {/* Sensors Status */}
            <div className="flex justify-between items-center text-[10px] font-mono">
              <span className="text-slate-500 flex items-center gap-1.5 uppercase">
                <Lightbulb size={13} className="text-indigo-400" /> Grid Sensors
              </span>
              <span className={`font-bold uppercase ${diagnostics.sensorCalibration === 'NOMINAL' ? 'text-emerald-400' : 'text-amber-500 animate-pulse'}`}>
                {diagnostics.sensorCalibration}
              </span>
            </div>
          </div>
        </div>

        {/* Live Override controls */}
        <div className="space-y-3 bg-slate-950/60 p-4 border border-slate-900 rounded-2xl flex flex-col justify-between">
          <h3 className="text-[9px] font-bold font-mono text-slate-400 tracking-wider uppercase">Override Commands</h3>
          
          <div className="flex flex-col gap-2">
            
            <button 
              type="button"
              onClick={handleRefillSanitizer}
              className="w-full text-left bg-blue-950/40 hover:bg-blue-900/20 border border-blue-900/30 hover:border-blue-700 p-2.5 rounded-xl transition-all flex items-center gap-2 text-[10px] font-mono font-bold text-blue-300"
            >
              <Sparkles size={14} className="text-blue-400" />
              <span>SPRAY / REFILL SANITIZER</span>
            </button>

            <button 
              type="button"
              onClick={toggleVoiceMode}
              className="w-full text-left bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-slate-700 p-2.5 rounded-xl transition-all flex items-center gap-2 text-[10px] font-mono font-bold text-slate-300"
            >
              <Volume2 size={14} className="text-amber-400 animate-pulse" />
              <span>TOGGLE VOICE SYNTH</span>
            </button>

            <button 
              type="button"
              onClick={handleCalibrateSensors}
              disabled={diagnostics.sensorCalibration === 'CALIBRATING'}
              className="w-full text-left bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-slate-700 p-2.5 rounded-xl transition-all flex items-center gap-2 text-[10px] font-mono font-bold text-slate-300 disabled:opacity-40"
            >
              <Lightbulb size={14} className="text-indigo-400" />
              <span>RECALIBRATE LIDAR</span>
            </button>

            <button 
              type="button"
              onClick={() => {
                const nextAlert = !triggerEmergencyAlert;
                setTriggerEmergencyAlert(nextAlert);
                addLog(`Manual emergency alarm state toggled to: ${nextAlert ? 'ACTIVE' : 'DEACTIVATED'}.`);
              }}
              className={`w-full text-left p-2.5 rounded-xl transition-all flex items-center gap-2 text-[10px] font-mono font-bold border ${
                triggerEmergencyAlert 
                  ? 'bg-red-950 text-red-300 border-red-500 animate-pulse' 
                  : 'bg-slate-900 hover:bg-[#342424] hover:text-red-300 hover:border-red-900/60 border-slate-800 text-slate-300'
              }`}
            >
              <Siren size={14} className={triggerEmergencyAlert ? 'text-red-500 animate-spin' : 'text-slate-500'} />
              <span>EMERGENCY SIREN ALERT</span>
            </button>

          </div>
        </div>

      </div>
    </div>
  );
};
