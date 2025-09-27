'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';

export default function AuthDebugPage() {
  const { user, isLoading, isAuthenticated, token, isAdmin } = useAuth();
  const [tokenInfo, setTokenInfo] = useState<any>(null);

  useEffect(() => {
    if (token) {
      try {
        // Decode JWT token to see what's inside
        const parts = token.split('.');
        if (parts.length === 3) {
          const payload = JSON.parse(atob(parts[1]));
          setTokenInfo(payload);
        }
      } catch (error) {
        console.error('Failed to decode token:', error);
      }
    }
  }, [token]);

  const testAPICall = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/v1/admin/roles/13/permissions', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('API Response Status:', response.status);
      const data = await response.text();
      console.log('API Response Data:', data);
      
      if (response.ok) {
        alert('API call successful!');
      } else {
        alert(`API call failed: ${response.status} - ${data}`);
      }
    } catch (error) {
      console.error('API call error:', error);
      alert(`API call error: ${error}`);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold flex items-center gap-2">
        <RefreshCw className="h-6 w-6" />
        Auth Debug Information
      </h1>
      
      <Card>
        <CardHeader>
          <CardTitle>Authentication State</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <strong>Loading:</strong> 
              <Badge variant={isLoading ? 'destructive' : 'default'}>
                {String(isLoading)}
              </Badge>
            </div>
            <div>
              <strong>Authenticated:</strong> 
              <Badge variant={isAuthenticated ? 'default' : 'destructive'}>
                {String(isAuthenticated)}
              </Badge>
            </div>
            <div>
              <strong>Has Token:</strong> 
              <Badge variant={!!token ? 'default' : 'destructive'}>
                {String(!!token)}
              </Badge>
            </div>
            <div>
              <strong>Is Admin:</strong> 
              <Badge variant={isAdmin() ? 'default' : 'destructive'}>
                {String(isAdmin())}
              </Badge>
            </div>
          </div>
          
          {token && (
            <div>
              <strong>Token Preview:</strong>
              <code className="block p-2 bg-muted rounded text-xs">
                {token.substring(0, 50)}...
              </code>
            </div>
          )}
        </CardContent>
      </Card>

      {user && (
        <Card>
          <CardHeader>
            <CardTitle>User Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div><strong>ID:</strong> {user.id}</div>
              <div><strong>Username:</strong> {user.username}</div>
              <div><strong>Name:</strong> {user.name}</div>
              <div><strong>Email:</strong> {user.email}</div>
              <div><strong>Active:</strong> {String(user.is_active)}</div>
              <div><strong>Employee ID:</strong> {user.employee_id}</div>
              <div>
                <strong>Roles:</strong>
                <div className="flex flex-wrap gap-1 mt-1">
                  {user.roles?.map((role, index) => (
                    <Badge key={index} variant="secondary">{role}</Badge>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {tokenInfo && (
        <Card>
          <CardHeader>
            <CardTitle>Token Payload</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="text-xs bg-muted p-4 rounded overflow-auto">
              {JSON.stringify(tokenInfo, null, 2)}
            </pre>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>API Test</CardTitle>
        </CardHeader>
        <CardContent>
          <Button onClick={testAPICall} disabled={!token}>
            Test Role Permissions API Call
          </Button>
          <p className="text-sm text-muted-foreground mt-2">
            This will test the exact API call that's failing (role 13 permissions)
          </p>
        </CardContent>
      </Card>
    </div>
  );
}