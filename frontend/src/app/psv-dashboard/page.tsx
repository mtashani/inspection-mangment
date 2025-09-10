'use client';

import { useEffect, useState } from 'react';
import { fetchPSVs, fetchPSVSummary } from '@/api/psv';
import { Card } from '@/components/ui/card';
import { PSV, PSVSummary } from '@/components/psv/types';
import { CircleDashed, AlertTriangle, Clock, CheckCircle2, FilterIcon, ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { RiskMatrix } from '@/components/psv/analytics/risk-matrix';
import { RiskDistributionChart } from '@/components/psv/analytics/risk-distribution';
import { CalibrationTimeline } from '@/components/psv/analytics/calibration-timeline';
import { FilterConfig, SavedFilters } from '@/components/psv/analytics/saved-filters';
import { BulkActions } from '@/components/psv/bulk-actions';
import { ReportGenerator } from '@/components/psv/report-generator';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { format } from 'date-fns';
import Link from 'next/link';

export default function PSVDashboard() {
  const [loading, setLoading] = useState(true);
  const [psvs, setPSVs] = useState<PSV[]>([]);
  const [filteredPSVs, setFilteredPSVs] = useState<PSV[]>([]);
  const [selectedPSVs, setSelectedPSVs] = useState<PSV[]>([]);
  const [summary, setSummary] = useState<PSVSummary | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Filter states
  const [filterText, setFilterText] = useState('');
  const [filterStatus, setFilterStatus] = useState<string[]>([]);
  const [filterServices, setFilterServices] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [availableServices, setAvailableServices] = useState<string[]>([]);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        
        // Fetch PSV data and summary
        const [psvData, summaryData] = await Promise.all([
          fetchPSVs(),
          fetchPSVSummary(),
        ]);
        
        setPSVs(psvData);
        setFilteredPSVs(psvData);
        setSummary(summaryData);
        
        // Extract available services for filtering
        const services = Array.from(new Set(psvData.map(psv => psv.service).filter(Boolean) as string[]));
        setAvailableServices(services);
      } catch (err) {
        console.error('Error loading dashboard data:', err);
        setError('Failed to load dashboard data. Please try again later.');
      } finally {
        setLoading(false);
      }
    }
    
    fetchData();
  }, []);
  
  // Apply filters when filter values change
  useEffect(() => {
    if (!psvs || psvs.length === 0) return;
    
    let filtered = [...psvs];
    
    // Apply text filter
    if (filterText) {
      const searchTerm = filterText.toLowerCase();
      filtered = filtered.filter(psv => 
        psv.tag_number.toLowerCase().includes(searchTerm) ||
        psv.service?.toLowerCase().includes(searchTerm) ||
        psv.unit?.toLowerCase().includes(searchTerm) ||
        psv.type_no?.toLowerCase().includes(searchTerm)
      );
    }
    
    // Apply status filter
    if (filterStatus.length > 0) {
      filtered = filtered.filter(psv => filterStatus.includes(psv.status));
    }
    
    // Apply service filter
    if (filterServices.length > 0) {
      filtered = filtered.filter(psv => 
        psv.service && filterServices.includes(psv.service)
      );
    }
    
    setFilteredPSVs(filtered);
    // Clear selection when filters change
    setSelectedPSVs([]);
  }, [filterText, filterStatus, filterServices, psvs]);

  // Handle checkbox change for status
  const handleStatusChange = (status: string) => {
    if (filterStatus.includes(status)) {
      setFilterStatus(filterStatus.filter(s => s !== status));
    } else {
      setFilterStatus([...filterStatus, status]);
    }
  };
  
  // Handle checkbox change for services
  const handleServiceChange = (service: string) => {
    if (filterServices.includes(service)) {
      setFilterServices(filterServices.filter(s => s !== service));
    } else {
      setFilterServices([...filterServices, service]);
    }
  };
  
  // Clear all filters
  const clearFilters = () => {
    setFilterText('');
    setFilterStatus([]);
    setFilterServices([]);
  };
  
  // Apply a saved filter configuration
  const handleApplySavedFilter = (filterConfig: FilterConfig) => {
    setFilterText(filterConfig.filterText);
    setFilterStatus(filterConfig.filterStatus);
    setFilterServices(filterConfig.filterServices);
  };
  
  // Handle PSV selection
  const togglePSVSelection = (psv: PSV) => {
    if (selectedPSVs.some(p => p.tag_number === psv.tag_number)) {
      setSelectedPSVs(selectedPSVs.filter(p => p.tag_number !== psv.tag_number));
    } else {
      setSelectedPSVs([...selectedPSVs, psv]);
    }
  };
  
  // Toggle all PSVs
  const toggleAllPSVs = () => {
    if (selectedPSVs.length === filteredPSVs.length) {
      setSelectedPSVs([]);
    } else {
      setSelectedPSVs([...filteredPSVs]);
    }
  };
  
  // Handle bulk update of PSVs
  const handleBulkUpdate = async (updatedPSVs: PSV[]) => {
    try {
      // In a real app, this would call an API to update the PSVs
      // For now, we'll just update the local state
      const updatedAllPSVs = psvs.map(
        psv => updatedPSVs.find(p => p.tag_number === psv.tag_number) || psv
      );
      
      setPSVs(updatedAllPSVs);
      return Promise.resolve();
    } catch (error) {
      console.error('Error updating PSVs:', error);
      return Promise.reject(error);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto py-10">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto py-10">
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <AlertTriangle className="h-5 w-5 text-red-400" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error</h3>
              <div className="mt-2 text-sm text-red-700">
                <p>{error}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-10">
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center gap-4">
          <Link href="/psv-layout/psv">
            <Button variant="ghost" size="sm" className="flex items-center gap-1 text-gray-500 hover:text-primary">
              <ArrowLeft className="h-4 w-4" />
              <span>Back to PSV List</span>
            </Button>
          </Link>
          
          <h1 className="text-3xl font-bold">PSV Analytics Dashboard</h1>
        </div>
        
        <div className="flex items-center space-x-4">
          {/* Search input */}
          <div className="relative">
            <Input
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
              placeholder="Search PSVs..."
              className="w-64"
            />
            {filterText && (
              <button 
                className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                onClick={() => setFilterText('')}
              >
                ×
              </button>
            )}
          </div>
          
          {/* Advanced filters */}
          <Popover open={showFilters} onOpenChange={setShowFilters}>
            <PopoverTrigger asChild>
              <Button variant="outline" className="flex items-center gap-2">
                <FilterIcon size={16} />
                <span>Filters</span>
                {(filterStatus.length > 0 || filterServices.length > 0) && (
                  <span className="bg-primary text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">
                    {filterStatus.length + filterServices.length}
                  </span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80">
              <div className="space-y-4">
                <h4 className="font-medium">Filter Options</h4>
                
                {/* Status filters */}
                <div>
                  <h5 className="text-sm font-medium mb-2">Status</h5>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="status-main" 
                        checked={filterStatus.includes('Main')}
                        onCheckedChange={() => handleStatusChange('Main')}
                      />
                      <Label htmlFor="status-main">Main</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="status-spare" 
                        checked={filterStatus.includes('Spare')}
                        onCheckedChange={() => handleStatusChange('Spare')}
                      />
                      <Label htmlFor="status-spare">Spare</Label>
                    </div>
                  </div>
                </div>
                
                {/* Service filters */}
                <div>
                  <h5 className="text-sm font-medium mb-2">Service</h5>
                  <div className="max-h-40 overflow-y-auto space-y-2">
                    {availableServices.slice(0, 10).map((service) => (
                      <div key={service} className="flex items-center space-x-2">
                        <Checkbox 
                          id={`service-${service}`} 
                          checked={filterServices.includes(service)}
                          onCheckedChange={() => handleServiceChange(service)}
                        />
                        <Label htmlFor={`service-${service}`}>{service}</Label>
                      </div>
                    ))}
                    {availableServices.length > 10 && (
                      <p className="text-xs text-gray-500">
                        +{availableServices.length - 10} more services available
                      </p>
                    )}
                  </div>
                </div>
                
                {/* Action buttons */}
                <div className="flex justify-between">
                  <Button variant="outline" size="sm" onClick={clearFilters}>
                    Clear All
                  </Button>
                  <Button size="sm" onClick={() => setShowFilters(false)}>
                    Apply Filters
                  </Button>
                </div>
              </div>
            </PopoverContent>
          </Popover>
          
          {/* Saved Filters Component */}
          <SavedFilters 
            currentFilters={{
              filterText,
              filterStatus,
              filterServices
            }}
            onApplyFilter={handleApplySavedFilter}
          />
        </div>
      </div>
      
      {/* Filter summary and selection controls */}
      <div className="mb-4 space-y-2">
        {/* Filter summary */}
        {(filterText || filterStatus.length > 0 || filterServices.length > 0) && (
          <div className="p-2 bg-gray-50 rounded-md">
            <div className="flex items-center justify-between">
              <div className="text-sm">
                <span className="font-medium">Filtered Results:</span> {filteredPSVs.length} of {psvs.length} PSVs
                {filterText && <span className="ml-2 text-gray-500">Search: &quot;{filterText}&quot;</span>}
                {filterStatus.length > 0 && <span className="ml-2 text-gray-500">Status: {filterStatus.join(', ')}</span>}
                {filterServices.length > 0 && <span className="ml-2 text-gray-500">Services: {filterServices.length} selected</span>}
              </div>
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                Clear All Filters
              </Button>
            </div>
          </div>
        )}
        
        {/* Selection and Bulk Actions */}
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="select-all" 
              checked={filteredPSVs.length > 0 && selectedPSVs.length === filteredPSVs.length}
              onCheckedChange={toggleAllPSVs}
            />
            <Label htmlFor="select-all">
              {selectedPSVs.length ? `Selected ${selectedPSVs.length} of ${filteredPSVs.length}` : 'Select All'}
            </Label>
          </div>
          
          <div className="flex space-x-4">
            {selectedPSVs.length > 0 && (
              <BulkActions 
                selectedPSVs={selectedPSVs}
                onClearSelection={() => setSelectedPSVs([])}
                onUpdatePSVs={handleBulkUpdate}
              />
            )}
            
            <ReportGenerator psvs={selectedPSVs.length > 0 ? selectedPSVs : filteredPSVs} />
          </div>
        </div>
      </div>
      
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <SummaryCard 
          title="Total PSVs" 
          value={filteredPSVs.length}
          icon={CircleDashed}
          className="bg-blue-50"
          iconClassName="bg-blue-500"
        />
        <SummaryCard 
          title="Out of Calibration" 
          value={summary?.outOfCalibration?.main || 0}
          subValue={summary?.outOfCalibration?.spare || 0}
          subLabel="Spare"
          icon={AlertTriangle}
          className="bg-red-50"
          iconClassName="bg-red-500"
        />
        <SummaryCard 
          title="Due Next Month" 
          value={summary?.dueNextMonth?.main || 0}
          subValue={summary?.dueNextMonth?.spare || 0}
          subLabel="Spare"
          icon={Clock}
          className="bg-amber-50"
          iconClassName="bg-amber-500"
        />
        <SummaryCard 
          title="Under Calibration" 
          value={summary?.underCalibration?.main || 0}
          subValue={summary?.underCalibration?.spare || 0}
          subLabel="Spare"
          icon={CheckCircle2}
          className="bg-green-50"
          iconClassName="bg-green-500"
        />
      </div>
      
      {/* Risk Distribution Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <Card className="p-6">
          <RiskDistributionChart psvs={filteredPSVs} />
        </Card>
        
        <Card className="p-6">
          <CalibrationTimeline psvs={filteredPSVs} />
        </Card>
      </div>
      
      {/* Risk Matrix */}
      <div className="mb-8">
        <Card className="p-6">
          <RiskMatrix psvs={filteredPSVs} />
        </Card>
      </div>
      
      {/* PSV Data Table */}
      <div className="mb-8">
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="w-8 px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <Checkbox 
                      checked={filteredPSVs.length > 0 && selectedPSVs.length === filteredPSVs.length}
                      onCheckedChange={toggleAllPSVs}
                    />
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tag Number</th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Unit</th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Service</th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Calibration</th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Next Calibration</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredPSVs.slice(0, 10).map((psv) => (
                  <tr 
                    key={psv.tag_number}
                    className={selectedPSVs.some(p => p.tag_number === psv.tag_number) ? "bg-blue-50" : "hover:bg-gray-50"}
                  >
                    <td className="px-3 py-4 whitespace-nowrap">
                      <Checkbox 
                        checked={selectedPSVs.some(p => p.tag_number === psv.tag_number)}
                        onCheckedChange={() => togglePSVSelection(psv)}
                      />
                    </td>
                    <td className="px-3 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {psv.tag_number}
                    </td>
                    <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500">
                      {psv.status}
                    </td>
                    <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500">
                      {psv.unit || "-"}
                    </td>
                    <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500">
                      {psv.service || "-"}
                    </td>
                    <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500">
                      {psv.last_calibration_date ? 
                        format(new Date(psv.last_calibration_date), 'yyyy-MM-dd') : 
                        'Never'}
                    </td>
                    <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500">
                      {psv.expire_date ? 
                        format(new Date(psv.expire_date), 'yyyy-MM-dd') : 
                        'Not scheduled'}
                    </td>
                  </tr>
                ))}
                {filteredPSVs.length > 10 && (
                  <tr>
                    <td colSpan={7} className="px-3 py-4 text-center text-sm text-gray-500">
                      Showing 10 of {filteredPSVs.length} PSVs. View full list for more.
                    </td>
                  </tr>
                )}
                {filteredPSVs.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-3 py-4 text-center text-sm text-gray-500">
                      No PSVs found matching the current filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
      
      {/* Last updated info */}
      <div className="text-xs text-gray-500 mt-10 text-right">
        <span>Last updated: {format(new Date(), 'yyyy-MM-dd HH:mm')}</span>
      </div>
    </div>
  );
}

interface SummaryCardProps {
  title: string;
  value: number;
  subValue?: number;
  subLabel?: string;
  icon: React.ElementType;
  className?: string;
  iconClassName?: string;
}

function SummaryCard({
  title,
  value,
  subValue,
  subLabel,
  icon: Icon,
  className = "",
  iconClassName = ""
}: SummaryCardProps) {
  return (
    <Card className={cn("p-6", className)}>
      <div className="flex items-center">
        <div className={cn("p-2 rounded-md", iconClassName)}>
          <Icon className="h-5 w-5 text-white" />
        </div>
        <h3 className="ml-3 text-sm font-medium text-gray-700">{title}</h3>
      </div>
      <div className="mt-6">
        <div className="text-3xl font-semibold">{value}</div>
        {subValue !== undefined && (
          <div className="mt-2 flex items-center text-sm text-gray-500">
            <span>{subLabel}: {subValue}</span>
          </div>
        )}
      </div>
    </Card>
  );
}