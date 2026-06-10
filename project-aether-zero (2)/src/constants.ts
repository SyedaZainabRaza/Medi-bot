/**
 * Project Aether-Zero Design Tokens
 */
export const T = {
  void: '#020617',
  deep: '#070a13',
  panel: 'rgba(7, 10, 19, 0.85)',
  accent: '#3b82f6', // Command Blue
  warning: '#ef4444', // Warning Red
  success: '#10b981', // Recovery Green
  border: 'rgba(59, 130, 246, 0.2)',
  text: {
    primary: '#f8fafc',
    secondary: '#64748b',
    accent: '#60a5fa',
    warning: '#f87171'
  },
  glow: '0 0 30px rgba(59, 130, 246, 0.3)',
  threatGlow: '0 0 50px rgba(239, 68, 68, 0.2)',
  font: {
    sans: "Inter, ui-sans-serif, system-ui, sans-serif",
    mono: "JetBrains Mono, ui-monospace, SFMono-Regular, monospace"
  }
};

export type PillarId = 'VOXEL_RECOVERY' | 'WEATHER_SHIELD' | 'SIGNAL_TRACE' | 'BIO_TRIAGE' | 'SATELLITE_DETECTION';
export type AppStatus = 'onboarding' | 'active' | 'failure';
export type ViewMode = 'tactical' | 'global';

export interface LocationProfile {
  city: string;
  country: string;
  population: string;
}
