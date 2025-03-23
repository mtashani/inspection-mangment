'use client';

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { testApiConnection, showApiDebugToast } from '@/api-debug';
import { Toaster } from 'sonner';

export default function ApiDebugPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    error?: string;
    healthStatus?: number;
    psvStatus?: number;
    rbiStatus?: number;
  } | null>(null);
  
  const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

  async function runTests() {
    setLoading(true);
    try {
      const testResult = await testApiConnection();
      setResult(testResult);
      showApiDebugToast(testResult);
    } catch (error) {
      console.error('Error during API tests:', error);
      const errorResult = {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
      setResult(errorResult);
      showApiDebugToast(errorResult);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    // Auto-run tests when the page loads - but don't show toasts on initial load
    const runInitialTests = async () => {
      setLoading(true);
      try {
        const testResult = await testApiConnection();
        setResult(testResult);
        // We're not calling showApiDebugToast() here to avoid the React state update error
      } catch (error) {
        console.error('Error during API tests:', error);
        setResult({
          success: false,
          error: error instanceof Error ? error.message : String(error),
        });
      } finally {
        setLoading(false);
      }
    };
    
    runInitialTests();
  }, []);

  return (
    <div className="container mx-auto py-10 space-y-6">
      <Toaster position="top-right" />
      
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">API Connection Diagnostics</h1>
          <p className="text-muted-foreground">
            Troubleshoot connection issues between frontend and backend
          </p>
        </div>
        <Button onClick={runTests} disabled={loading}>
          {loading ? 'Testing...' : 'Run Tests'}
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Backend Configuration</CardTitle>
          <CardDescription>Current API server settings</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium">API URL</p>
              <p className="text-sm font-mono">{backendUrl}</p>
            </div>
            <div>
              <p className="text-sm font-medium">Environment</p>
              <p className="text-sm font-mono">{process.env.NODE_ENV}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {result && (
        <Card className={result.success ? "border-green-500" : "border-red-500"}>
          <CardHeader>
            <CardTitle className={result.success ? "text-green-500" : "text-red-500"}>
              {result.success ? "Connection Successful" : "Connection Failed"}
            </CardTitle>
            <CardDescription>Test results summary</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {result.success ? (
              <div className="space-y-2">
                <p className="text-sm">All API endpoints are reachable and returning data.</p>
                <div className="grid grid-cols-3 gap-4">
                  <div className="p-3 bg-green-50 border border-green-100 rounded">
                    <p className="text-xs text-muted-foreground">Health Check</p>
                    <p className="text-sm font-medium">Status {result.healthStatus}</p>
                  </div>
                  <div className="p-3 bg-green-50 border border-green-100 rounded">
                    <p className="text-xs text-muted-foreground">PSV Endpoint</p>
                    <p className="text-sm font-medium">Status {result.psvStatus}</p>
                  </div>
                  <div className="p-3 bg-green-50 border border-green-100 rounded">
                    <p className="text-xs text-muted-foreground">RBI Endpoint</p>
                    <p className="text-sm font-medium">Status {result.rbiStatus}</p>
                  </div>
                </div>
              </div>
            ) : 'error' in result ? (
              <div className="space-y-2">
                <p className="text-sm text-red-500">Cannot connect to the backend server. Please check that:</p>
                <ul className="list-disc pl-5 space-y-1">
                  <li className="text-sm">The backend server is running on {backendUrl}</li>
                  <li className="text-sm">There are no network issues or firewalls blocking the connection</li>
                  <li className="text-sm">CORS is correctly configured on the backend</li>
                </ul>
                <div className="p-3 bg-red-50 border border-red-100 rounded mt-4">
                  <p className="text-xs font-medium">Error Details:</p>
                  <p className="text-sm font-mono break-all">{result.error}</p>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-sm text-red-500">Some API endpoints are not responding correctly.</p>
                <div className="grid grid-cols-3 gap-4">
                  <div className={`p-3 ${result.healthStatus === 200 ? "bg-green-50 border-green-100" : "bg-red-50 border-red-100"} border rounded`}>
                    <p className="text-xs text-muted-foreground">Health Check</p>
                    <p className={`text-sm font-medium ${result.healthStatus === 200 ? "text-green-500" : "text-red-500"}`}>
                      Status {result.healthStatus}
                    </p>
                  </div>
                  <div className={`p-3 ${result.psvStatus === 200 ? "bg-green-50 border-green-100" : "bg-red-50 border-red-100"} border rounded`}>
                    <p className="text-xs text-muted-foreground">PSV Endpoint</p>
                    <p className={`text-sm font-medium ${result.psvStatus === 200 ? "text-green-500" : "text-red-500"}`}>
                      Status {result.psvStatus}
                    </p>
                  </div>
                  <div className={`p-3 ${result.rbiStatus === 200 ? "bg-green-50 border-green-100" : "bg-red-50 border-red-100"} border rounded`}>
                    <p className="text-xs text-muted-foreground">RBI Endpoint</p>
                    <p className={`text-sm font-medium ${result.rbiStatus === 200 ? "text-green-500" : "text-red-500"}`}>
                      Status {result.rbiStatus}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Troubleshooting Steps</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <h3 className="text-md font-medium">1. Check Backend Server</h3>
            <p className="text-sm">Ensure your backend server is running with:</p>
            <pre className="bg-muted p-2 rounded text-sm font-mono">
              cd backend<br />
              uvicorn app.main:app --reload --port 8000
            </pre>
          </div>

          <div className="space-y-2">
            <h3 className="text-md font-medium">2. Verify API URL</h3>
            <p className="text-sm">
              Make sure the frontend is using the correct backend URL. You can set the 
              <span className="font-mono bg-muted px-1 mx-1">NEXT_PUBLIC_API_URL</span> 
              environment variable or add it to <span className="font-mono">.env.local</span>:
            </p>
            <pre className="bg-muted p-2 rounded text-sm font-mono">
              NEXT_PUBLIC_API_URL=http://localhost:8000
            </pre>
          </div>

          <div className="space-y-2">
            <h3 className="text-md font-medium">3. Check CORS Configuration</h3>
            <p className="text-sm">
              Ensure the backend CORS configuration includes your frontend origin:
            </p>
            <pre className="bg-muted p-2 rounded text-sm font-mono">
              # In backend/.env<br />
              ADDITIONAL_CORS_ORIGINS=http://localhost:3000
            </pre>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}