'use client';

import { useState, useEffect } from 'react';
import { fetchPSVById } from '@/api/psv';
import { PSV } from '@/components/psv/types';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { CalibrationHistory } from '@/components/psv/calibration-history';
import { PSVInfoCard } from '@/components/psv/psv-info-card';
import { RBICalculation } from '@/components/psv/rbi-calculation';
import { AlertTriangle, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function PSVDetailPage({ params }: { params: { tag: string } }) {
  const [psv, setPSV] = useState<PSV | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>('info');

  useEffect(() => {
    async function loadPSVData() {
      try {
        setLoading(true);
        const data = await fetchPSVById(params.tag);
        setPSV(data);
      } catch (err) {
        console.error('Error loading PSV:', err);
        setError(err instanceof Error ? err.message : 'Failed to load PSV data');
      } finally {
        setLoading(false);
      }
    }

    if (params.tag) {
      loadPSVData();
    }
  }, [params.tag]);

  if (loading) {
    return (
      <div className="container mx-auto py-4">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  if (error || !psv) {
    return (
      <div className="container mx-auto py-4">
        <div className="flex items-center justify-center h-64 flex-col">
          <div className="text-red-500 flex flex-col items-center">
            <AlertTriangle className="h-12 w-12 mb-4" />
            <p className="text-center text-lg font-medium">{error || 'PSV not found'}</p>
          </div>
          <Link href="/psv-layout/psv">
            <Button variant="outline" className="mt-8 flex items-center gap-2">
              <ArrowLeft size={16} /> Back to PSV List
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">PSV: {psv.tag_number}</h1>
        <Link href="/psv-layout/psv">
          <Button variant="outline" size="sm" className="flex items-center gap-2">
            <ArrowLeft size={16} /> Back to List
          </Button>
        </Link>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="info">PSV Information</TabsTrigger>
          <TabsTrigger value="calibration">Calibration History</TabsTrigger>
          <TabsTrigger value="rbi">RBI Calculation</TabsTrigger>
        </TabsList>

        <TabsContent value="info" className="space-y-4">
          <PSVInfoCard psv={psv} />
        </TabsContent>

        <TabsContent value="calibration" className="space-y-4">
          <Card className="p-4">
            <CalibrationHistory tagNumber={params.tag} />
          </Card>
        </TabsContent>

        <TabsContent value="rbi" className="space-y-4">
          <RBICalculation tagNumber={params.tag} />
        </TabsContent>
      </Tabs>
    </div>
  );
}