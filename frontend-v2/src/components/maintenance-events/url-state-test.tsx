/**
 * URL State Management Test Component
 * 
 * This component provides a comprehensive test interface for URL state management
 * functionality including persistence, navigation, and synchronization.
 */

'use client'

import { useState } from 'react'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  ArrowLeft, 
  ArrowRight, 
  RefreshCw, 
  Save, 
  Trash2, 
  ExternalLink,
  CheckCircle,
  Clock
} from 'lucide-react'
import { useURLStateContext } from '@/components/providers/url-state-provider'
import { useBrowserNavigation } from '@/lib/utils/browser-navigation'
import { EventsFilters } from '@/types/maintenance-events'
import { eventsOverviewURLConfig, MaintenanceEventsURLUtils } from '@/lib/utils/maintenance-events-url-state'
import { useFilterStateManagement } from '@/hooks/use-url-state-management'

export function URLStateTest() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const { urlState, isRestored, saveState, loadState, clearState } = useURLStateContext()
  
  const [testKey, setTestKey] = useState('test-state')
  const [testValue, setTestValue] = useState('')
  
  // Browser navigation test
  const { 
    canGoBack, 
    canGoForward, 
    navigateBack, 
    navigateForward,
    navigationHistory 
  } = useBrowserNavigation({
    onBack: () => console.log('Back navigation detected'),
    onForward: () => console.log('Forward navigation detected'),
    onStateChange: (state) => console.log('Navigation state changed:', state)
  })

  // Filter state management test
  const {
    state: filterState,
    updateState: updateFilterState,
    clearFilters,
    hasActiveFilters,
    getActiveFilters,
    getCurrentURL
  } = useFilterStateManagement({
    ...eventsOverviewURLConfig,
    persistenceKey: 'url-state-test',
    restoreScroll: false,
    handleNavigation: true
  })

  // Test functions
  const testPersistence = () => {
    const testData = {
      timestamp: Date.now(),
      testValue,
      pathname
    }
    saveState(testKey, testData)
    console.log('Saved test data:', testData)
  }

  const testLoad = () => {
    const loaded = loadState(testKey)
    console.log('Loaded test data:', loaded)
    if (loaded?.testValue) {
      setTestValue(loaded.testValue)
    }
  }

  const testClear = () => {
    clearState(testKey)
    setTestValue('')
    console.log('Cleared test data')
  }

  const testURLUpdate = () => {
    const newFilters: Partial<EventsFilters> = {
      search: 'test-search',
      status: 'InProgress',
      eventType: 'Overhaul'
    }
    updateFilterState(newFilters)
  }

  const testNavigation = () => {
    const testURL = MaintenanceEventsURLUtils.getEventsOverviewURL({
      search: 'navigation-test',
      status: 'Completed'
    })
    router.push(testURL)
  }

  return (
    <div className="space-y-6 p-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-500" />
            URL State Management Test
          </CardTitle>
          <CardDescription>
            Test and verify URL state management functionality including persistence, 
            navigation, and synchronization.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="current-state" className="space-y-4">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="current-state">Current State</TabsTrigger>
              <TabsTrigger value="persistence">Persistence</TabsTrigger>
              <TabsTrigger value="navigation">Navigation</TabsTrigger>
              <TabsTrigger value="filters">Filters</TabsTrigger>
            </TabsList>

            {/* Current State Tab */}
            <TabsContent value="current-state" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">URL Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div>
                      <Label className="text-xs text-muted-foreground">Pathname</Label>
                      <div className="font-mono text-sm bg-muted p-2 rounded">
                        {pathname}
                      </div>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Search Params</Label>
                      <div className="font-mono text-sm bg-muted p-2 rounded">
                        {searchParams.toString() || '(empty)'}
                      </div>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Full URL</Label>
                      <div className="font-mono text-sm bg-muted p-2 rounded break-all">
                        {getCurrentURL()}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">State Status</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex items-center gap-2">
                      {isRestored ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : (
                        <Clock className="h-4 w-4 text-yellow-500" />
                      )}
                      <span className="text-sm">
                        State {isRestored ? 'Restored' : 'Loading'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {hasActiveFilters() ? (
                        <Badge variant="default">Filters Active</Badge>
                      ) : (
                        <Badge variant="outline">No Filters</Badge>
                      )}
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">URL State Object</Label>
                      <pre className="text-xs bg-muted p-2 rounded overflow-auto">
                        {JSON.stringify(urlState, null, 2)}
                      </pre>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Persistence Tab */}
            <TabsContent value="persistence" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Persistence Testing</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="test-key">Storage Key</Label>
                      <Input
                        id="test-key"
                        value={testKey}
                        onChange={(e) => setTestKey(e.target.value)}
                        placeholder="Enter storage key"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="test-value">Test Value</Label>
                      <Input
                        id="test-value"
                        value={testValue}
                        onChange={(e) => setTestValue(e.target.value)}
                        placeholder="Enter test value"
                      />
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button onClick={testPersistence} size="sm">
                      <Save className="h-4 w-4 mr-1" />
                      Save
                    </Button>
                    <Button onClick={testLoad} variant="outline" size="sm">
                      <RefreshCw className="h-4 w-4 mr-1" />
                      Load
                    </Button>
                    <Button onClick={testClear} variant="destructive" size="sm">
                      <Trash2 className="h-4 w-4 mr-1" />
                      Clear
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Navigation Tab */}
            <TabsContent value="navigation" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Browser Navigation</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex gap-2">
                    <Button 
                      onClick={navigateBack} 
                      disabled={!canGoBack}
                      variant="outline" 
                      size="sm"
                    >
                      <ArrowLeft className="h-4 w-4 mr-1" />
                      Back
                    </Button>
                    <Button 
                      onClick={navigateForward} 
                      disabled={!canGoForward}
                      variant="outline" 
                      size="sm"
                    >
                      <ArrowRight className="h-4 w-4 mr-1" />
                      Forward
                    </Button>
                    <Button onClick={testNavigation} size="sm">
                      <ExternalLink className="h-4 w-4 mr-1" />
                      Test Navigation
                    </Button>
                  </div>
                  
                  <div>
                    <Label className="text-xs text-muted-foreground">Navigation History</Label>
                    <div className="max-h-32 overflow-auto bg-muted p-2 rounded">
                      <pre className="text-xs">
                        {JSON.stringify(navigationHistory.slice(-5), null, 2)}
                      </pre>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Filters Tab */}
            <TabsContent value="filters" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Filter State Management</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>Search</Label>
                      <Input
                        value={filterState.search || ''}
                        onChange={(e) => updateFilterState({ search: e.target.value })}
                        placeholder="Search term"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Status</Label>
                      <Input
                        value={filterState.status || ''}
                        onChange={(e) => updateFilterState({ status: e.target.value })}
                        placeholder="Status"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Event Type</Label>
                      <Input
                        value={filterState.eventType || ''}
                        onChange={(e) => updateFilterState({ eventType: e.target.value })}
                        placeholder="Event type"
                      />
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button onClick={testURLUpdate} size="sm">
                      Apply Test Filters
                    </Button>
                    <Button onClick={clearFilters} variant="outline" size="sm">
                      Clear Filters
                    </Button>
                  </div>
                  
                  <div>
                    <Label className="text-xs text-muted-foreground">Active Filters</Label>
                    <pre className="text-xs bg-muted p-2 rounded">
                      {JSON.stringify(getActiveFilters(), null, 2)}
                    </pre>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}