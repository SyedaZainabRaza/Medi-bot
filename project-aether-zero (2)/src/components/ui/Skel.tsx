import React from 'react';

export const Skel: React.FC<{ className?: string }> = ({ className }) => {
  return (
    <div 
      className={`animate-pulse bg-blue-500/10 rounded ${className}`} 
      style={{ backgroundImage: 'linear-gradient(90deg, transparent, rgba(100,180,255,0.05), transparent)' }}
    />
  );
};
