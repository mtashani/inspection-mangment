'use client';

import { useParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { fetchPSVById } from '@/api/psv';
import { PSV } from '@/components/psv/types';
import { Loader2 } from 'lucide-react';
import { RBICalculation } from '@/components/psv/rbi-calculation';

export default function PSVSettingsPage() {
  const params = useParams();
  const [psv, setPsv] = useState<PSV | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadPSV() {
      try {
        setLoading(true);
        setError(null);
        const data = await fetchPSVById(params.id as string);
        setPsv(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load PSV');
        console.error('Error loading PSV:', err);
      } finally {
        setLoading(false);
      }
    }

    loadPSV();
  }, [params.id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-center">
        <div className="text-red-500 mb-2">Error: {error}</div>
      </div>
    );
  }

  if (!psv) {
    return <div className="p-8">PSV not found</div>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>RBI Configuration</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="text-lg font-medium mb-2">Basic Settings</h3>
              <div className="text-sm text-muted-foreground">
                Configure basic settings for this PSV.
              </div>
            </div>
            <div className="space-y-2">
              <div>
                <span className="font-medium">Tag Number:</span> {psv.tag_number}
              </div>
              <div>
                <span className="font-medium">Status:</span> {psv.status}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* RBI Calculation Section */}
      <RBICalculation tagNumber={psv.tag_number} />
    </div>
  );
}