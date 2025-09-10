import React, { createContext, useContext, useState } from 'react';

interface WorkCycleContextType {
  workCycleChanged: boolean;
  setWorkCycleChanged: (changed: boolean) => void;
  lastChanged: { inspectorId: number | null, jy: number, jm: number } | null;
  setLastChanged: (info: { inspectorId: number | null, jy: number, jm: number } | null) => void;
}

const WorkCycleContext = createContext<WorkCycleContextType>({
  workCycleChanged: false,
  setWorkCycleChanged: () => {},
  lastChanged: null,
  setLastChanged: () => {},
});

export const WorkCycleProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [workCycleChanged, setWorkCycleChanged] = useState(false);
  const [lastChanged, setLastChanged] = useState<{ inspectorId: number | null, jy: number, jm: number } | null>(null);
  return (
    <WorkCycleContext.Provider value={{ workCycleChanged, setWorkCycleChanged, lastChanged, setLastChanged }}>
      {children}
    </WorkCycleContext.Provider>
  );
};

export const useWorkCycle = () => useContext(WorkCycleContext); 