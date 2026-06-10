import React from 'react';
import { RobotStateProvider } from './RobotStateContext';
import { ChassisDashboard } from './components/ChassisDashboard';

const RootContent: React.FC = () => {
  return <ChassisDashboard />;
};

export default function App() {
  return (
    <RobotStateProvider>
      <RootContent />
    </RobotStateProvider>
  );
}

