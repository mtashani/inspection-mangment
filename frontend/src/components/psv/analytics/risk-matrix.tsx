'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { PSV } from '@/components/psv/types';
import { cn } from '@/lib/utils';

// Define risk levels and their corresponding colors
const RISK_LEVELS = {
  HIGH: { label: 'High Risk', color: 'bg-red-500', textColor: 'text-red-500', months: 12 },
  MEDIUM: { label: 'Medium Risk', color: 'bg-amber-500', textColor: 'text-amber-500', months: 36 },
  LOW: { label: 'Low Risk', color: 'bg-green-500', textColor: 'text-green-500', months: 60 },
  MINIMAL: { label: 'Minimal Risk', color: 'bg-blue-500', textColor: 'text-blue-500', months: 72 }
};

interface RiskMatrixProps {
  psvs: PSV[];
  className?: string;
}

export function RiskMatrix({ psvs, className }: RiskMatrixProps) {
  const [matrixData, setMatrixData] = useState<Record<string, PSV[]>>({
    'high-high': [], // High probability, High consequence
    'high-medium': [], // High probability, Medium consequence
    'high-low': [], // High probability, Low consequence
    'medium-high': [], // Medium probability, High consequence
    'medium-medium': [], // Medium probability, Medium consequence
    'medium-low': [], // Medium probability, Low consequence
    'low-high': [], // Low probability, High consequence
    'low-medium': [], // Low probability, Medium consequence
    'low-low': [], // Low probability, Low consequence
  });
  
  const [selectedCell, setSelectedCell] = useState<string | null>(null);
  const [hoveredPSV, setHoveredPSV] = useState<PSV | null>(null);

  // Calculate risk matrix data from PSVs
  useEffect(() => {
    if (!psvs || psvs.length === 0) return;
    
    // Simple algorithm to distribute PSVs across the matrix for demonstration
    // In a real implementation, this would use actual risk assessment data
    const newMatrixData: Record<string, PSV[]> = {
      'high-high': [],
      'high-medium': [],
      'high-low': [],
      'medium-high': [],
      'medium-medium': [],
      'medium-low': [],
      'low-high': [],
      'low-medium': [],
      'low-low': [],
    };
    
    psvs.forEach(psv => {
      // Determine probability (high, medium, low) based on last calibration date
      let probability = 'medium';
      if (psv.last_calibration_date) {
        const lastCalDate = new Date(psv.last_calibration_date);
        const now = new Date();
        const monthsDiff = (now.getFullYear() - lastCalDate.getFullYear()) * 12 + 
                          (now.getMonth() - lastCalDate.getMonth());
        
        if (monthsDiff > 24) {
          probability = 'high';
        } else if (monthsDiff < 12) {
          probability = 'low';
        }
      } else {
        // If never calibrated, high probability of failure
        probability = 'high';
      }
      
      // Determine consequence (high, medium, low) based on service
      // This is a simplified approach - real implementation would use more factors
      let consequence = 'medium';
      if (psv.service) {
        const service = psv.service.toLowerCase();
        if (service.includes('gas') || service.includes('high pressure') || service.includes('toxic')) {
          consequence = 'high';
        } else if (service.includes('water') || service.includes('low pressure')) {
          consequence = 'low';
        }
      }
      
      // Add PSV to appropriate cell in matrix
      const cellKey = `${probability}-${consequence}`;
      if (newMatrixData[cellKey]) {
        newMatrixData[cellKey].push(psv);
      }
    });
    
    setMatrixData(newMatrixData);
  }, [psvs]);

  // Get risk level for a given cell
  const getRiskLevel = (probability: string, consequence: string) => {
    if (probability === 'high' && consequence === 'high') return RISK_LEVELS.HIGH;
    if (probability === 'high' && consequence === 'medium') return RISK_LEVELS.HIGH;
    if (probability === 'medium' && consequence === 'high') return RISK_LEVELS.HIGH;
    if (probability === 'high' && consequence === 'low') return RISK_LEVELS.MEDIUM;
    if (probability === 'medium' && consequence === 'medium') return RISK_LEVELS.MEDIUM;
    if (probability === 'low' && consequence === 'high') return RISK_LEVELS.MEDIUM;
    if (probability === 'medium' && consequence === 'low') return RISK_LEVELS.LOW;
    if (probability === 'low' && consequence === 'medium') return RISK_LEVELS.LOW;
    return RISK_LEVELS.MINIMAL; // low-low
  };

  // Handle cell click
  const handleCellClick = (cellId: string) => {
    setSelectedCell(cellId === selectedCell ? null : cellId);
  };
  
  return (
    <div className={cn("flex flex-col", className)}>
      <div className="flex justify-between mb-2">
        <h3 className="text-lg font-semibold">Risk Matrix</h3>
        <div className="flex space-x-4">
          {Object.entries(RISK_LEVELS).map(([key, { label, color, textColor }]) => (
            <div key={key} className="flex items-center space-x-1">
              <div className={cn("w-3 h-3 rounded-sm", color)}></div>
              <span className={cn("text-xs", textColor)}>{label}</span>
            </div>
          ))}
        </div>
      </div>
      
      <div className="grid grid-cols-4 gap-1">
        {/* Header row - Consequence levels */}
        <div className="flex justify-center items-center h-8">
          <span className="text-xs font-semibold text-gray-500">Probability ↓ <br/> Consequence →</span>
        </div>
        <div className="flex justify-center items-center h-8 text-xs font-semibold text-gray-500">Low</div>
        <div className="flex justify-center items-center h-8 text-xs font-semibold text-gray-500">Medium</div>
        <div className="flex justify-center items-center h-8 text-xs font-semibold text-gray-500">High</div>
        
        {/* High probability row */}
        <div className="flex justify-center items-center h-10 text-xs font-semibold text-gray-500">High</div>
        {['low', 'medium', 'high'].map(consequence => {
          const cellId = `high-${consequence}`;
          const psvCount = matrixData[cellId]?.length || 0;
          const riskLevel = getRiskLevel('high', consequence);
          
          return (
            <div
              key={cellId}
              className={cn(
                "flex flex-col justify-center items-center h-24 rounded-md cursor-pointer transition-all",
                riskLevel.color,
                selectedCell === cellId ? "ring-2 ring-blue-500" : "opacity-80 hover:opacity-100"
              )}
              onClick={() => handleCellClick(cellId)}
            >
              <span className="font-semibold text-white">{psvCount}</span>
              <span className="text-xs text-white">PSVs</span>
            </div>
          );
        })}
        
        {/* Medium probability row */}
        <div className="flex justify-center items-center h-10 text-xs font-semibold text-gray-500">Medium</div>
        {['low', 'medium', 'high'].map(consequence => {
          const cellId = `medium-${consequence}`;
          const psvCount = matrixData[cellId]?.length || 0;
          const riskLevel = getRiskLevel('medium', consequence);
          
          return (
            <div
              key={cellId}
              className={cn(
                "flex flex-col justify-center items-center h-24 rounded-md cursor-pointer transition-all",
                riskLevel.color,
                selectedCell === cellId ? "ring-2 ring-blue-500" : "opacity-80 hover:opacity-100"
              )}
              onClick={() => handleCellClick(cellId)}
            >
              <span className="font-semibold text-white">{psvCount}</span>
              <span className="text-xs text-white">PSVs</span>
            </div>
          );
        })}
        
        {/* Low probability row */}
        <div className="flex justify-center items-center h-10 text-xs font-semibold text-gray-500">Low</div>
        {['low', 'medium', 'high'].map(consequence => {
          const cellId = `low-${consequence}`;
          const psvCount = matrixData[cellId]?.length || 0;
          const riskLevel = getRiskLevel('low', consequence);
          
          return (
            <div
              key={cellId}
              className={cn(
                "flex flex-col justify-center items-center h-24 rounded-md cursor-pointer transition-all",
                riskLevel.color,
                selectedCell === cellId ? "ring-2 ring-blue-500" : "opacity-80 hover:opacity-100"
              )}
              onClick={() => handleCellClick(cellId)}
            >
              <span className="font-semibold text-white">{psvCount}</span>
              <span className="text-xs text-white">PSVs</span>
            </div>
          );
        })}
      </div>
      
      {selectedCell && matrixData[selectedCell]?.length > 0 && (
        <Card className="mt-4 p-4 max-h-60 overflow-auto">
          <h4 className="text-sm font-semibold mb-2">PSVs in Selected Risk Category ({matrixData[selectedCell].length})</h4>
          <ul className="space-y-1">
            {matrixData[selectedCell].map(psv => (
              <li 
                key={psv.tag_number} 
                className="text-sm p-2 hover:bg-gray-50 rounded-md flex justify-between"
                onMouseEnter={() => setHoveredPSV(psv)}
                onMouseLeave={() => setHoveredPSV(null)}
              >
                <span>{psv.tag_number}</span>
                <span className="text-gray-500">{psv.service || 'Unknown'}</span>
              </li>
            ))}
          </ul>
        </Card>
      )}
      
      {hoveredPSV && (
        <div className="mt-2 text-xs text-gray-500">
          Last calibration: {hoveredPSV.last_calibration_date ? new Date(hoveredPSV.last_calibration_date).toLocaleDateString() : 'Never'}
        </div>
      )}
    </div>
  );
}