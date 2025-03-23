'use client';

import { useState, useEffect } from 'react';
import { fetchPSVs } from "@/api/psv";
import { PSV } from "@/components/psv/types";
import { Toaster } from 'sonner';
import { toast } from 'sonner';

export default function PSVTestPage() {
  const [loading, setLoading] = useState(true);
  const [psvs, setPSVs] = useState<PSV[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  // First useEffect just for data loading without toast notifications
  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        console.log("Fetching PSV data...");
        const psvData = await fetchPSVs();
        console.log("PSV data received:", psvData);
        setPSVs(psvData);
        
        if (!psvData || psvData.length === 0) {
          setError('API returned an empty PSV list');
        }
      } catch (err) {
        console.error("Error fetching PSVs:", err);
        setError(err instanceof Error ? err.message : 'Failed to load PSV data');
      } finally {
        setLoading(false);
        setIsInitialLoad(false);
      }
    }

    loadData();
  }, []);
  
  // Separate useEffect for toast notifications that only runs after initial render
  useEffect(() => {
    if (isInitialLoad) return;
    
    if (error) {
      toast.error(`Failed to load PSV data: ${error}`);
    } else if (psvs.length > 0) {
      toast.success(`Successfully loaded ${psvs.length} PSVs`);
    } else if (psvs.length === 0 && !loading) {
      toast.warning("API returned an empty PSV list");
    }
  }, [isInitialLoad, error, psvs, loading]);

  return (
    <div className="container mx-auto py-8">
      <Toaster position="top-right" />
      <h1 className="text-2xl font-bold mb-6">PSV Test Page</h1>
      
      {loading && (
        <div className="flex justify-center my-8">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
          <h2 className="text-red-700 font-medium">Error Loading PSVs</h2>
          <p className="text-red-600">{error}</p>
          <p className="text-sm mt-2">
            Check the browser console for more detailed error information.
          </p>
        </div>
      )}

      {!loading && !error && (
        <>
          <p className="mb-4">Total PSVs loaded: <strong>{psvs.length}</strong></p>
          
          <div className="overflow-x-auto">
            <table className="min-w-full border border-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 border">Tag Number</th>
                  <th className="px-4 py-2 border">Status</th>
                  <th className="px-4 py-2 border">Type</th>
                  <th className="px-4 py-2 border">Service</th>
                  <th className="px-4 py-2 border">Last Calibration</th>
                </tr>
              </thead>
              <tbody>
                {psvs.slice(0, 10).map((psv) => (
                  <tr key={psv.tag_number} className="hover:bg-gray-50">
                    <td className="px-4 py-2 border">{psv.tag_number}</td>
                    <td className="px-4 py-2 border">{psv.status}</td>
                    <td className="px-4 py-2 border">{psv.type}</td>
                    <td className="px-4 py-2 border">{psv.service}</td>
                    <td className="px-4 py-2 border">
                      {psv.last_calibration_date ? 
                        new Date(psv.last_calibration_date).toLocaleDateString() : 
                        "Never"
                      }
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {psvs.length > 10 && (
            <p className="mt-4 text-sm text-gray-500">
              Showing 10 of {psvs.length} PSVs
            </p>
          )}
        </>
      )}
      
      <div className="mt-8 p-4 bg-blue-50 rounded-md">
        <h2 className="font-medium text-blue-700">Debug Information</h2>
        <p className="text-sm">
          This test page directly fetches data from the API endpoint without any complex UI or filters.
          If data appears here but not on the main PSV page, the issue is likely with the UI components
          rather than the API connection.
        </p>
      </div>
    </div>
  );
}