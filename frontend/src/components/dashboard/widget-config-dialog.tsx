'use client'

import { useState, useEffect } from 'react'
import {
  Cog6ToothIcon,
  XMarkIcon,
  PlusIcon,
  TrashIcon,
  ArrowUpIcon,
  ArrowDownIcon
} from '@heroicons/react/24/outline'
import { cn } from '@/lib/utils'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { DashboardConfig, DashboardWidgetConfig } from './main-dashboard'

export interface WidgetConfigDialogProps {
  isOpen: boolean
  onClose: () => void
  config: DashboardConfig
  onConfigChange: (config: DashboardConfig) => void
}

export function WidgetConfigDialog({
  isOpen,
  onClose,
  config,
  onConfigChange
}: WidgetConfigDialogProps) {
  const [localConfig, setLocalConfig] = useState<DashboardConfig>(config)
  const [activeTab, setActiveTab] = useState('general')

  // Update local config when prop changes
  useEffect(() => {
    setLocalConfig(config)
  }, [config])

  // Save configuration
  const handleSave = () => {
    onConfigChange(localConfig)
    onClose()
  }

  // Update dashboard settings
  const updateDashboardSetting = (key: keyof DashboardConfig, value: any) => {
    setLocalConfig(prev => ({
      ...prev,
      [key]: value
    }))
  }

  // Update widget settings
  const updateWidget = (widgetId: string, updates: Partial<DashboardWidgetConfig>) => {
    setLocalConfig(prev => ({
      ...prev,
      widgets: prev.widgets.map(widget =>
        widget.id === widgetId ? { ...widget, ...updates } : widget
      )
    }))
  }

  // Remove widget
  const removeWidget = (widgetId: string) => {
    setLocalConfig(prev => ({
      ...prev,
      widgets: prev.widgets.filter(widget => widget.id !== widgetId)
    }))
  }

  // Move widget up/down in order
  const moveWidget = (widgetId: string, direction: 'up' | 'down') => {
    setLocalConfig(prev => {
      const widgets = [...prev.widgets]
      const index = widgets.findIndex(w => w.id === widgetId)
      
      if (index === -1) return prev
      
      const newIndex = direction === 'up' ? index - 1 : index + 1
      
      if (newIndex < 0 || newIndex >= widgets.length) return prev
      
      // Swap widgets
      [widgets[index], widgets[newIndex]] = [widgets[newIndex], widgets[index]]
      
      return { ...prev, widgets }
    })
  }

  // Reset to defaults
  const resetToDefaults = () => {
    const confirmed = window.confirm('Are you sure you want to reset to default configuration? This will remove all customizations.')
    if (confirmed) {
      // Reset logic would go here
      console.log('Reset to defaults')
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Cog6ToothIcon className="h-5 w-5" />
            <span>Dashboard Configuration</span>
          </DialogTitle>
          <DialogDescription>
            Customize your dashboard layout, widgets, and settings.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 overflow-hidden">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="widgets">Widgets</TabsTrigger>
            <TabsTrigger value="layout">Layout</TabsTrigger>
          </TabsList>

          {/* General Settings */}
          <TabsContent value="general" className="space-y-4 overflow-y-auto max-h-96">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Dashboard Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="dashboard-name">Dashboard Name</Label>
                    <Input
                      id="dashboard-name"
                      value={localConfig.name}
                      onChange={(e) => updateDashboardSetting('name', e.target.value)}
                      placeholder="Enter dashboard name"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="refresh-interval">Auto Refresh (minutes)</Label>
                    <Select
                      value={String(localConfig.refreshInterval / 60000)}
                      onValueChange={(value) => updateDashboardSetting('refreshInterval', parseInt(value) * 60000)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">1 minute</SelectItem>
                        <SelectItem value="5">5 minutes</SelectItem>
                        <SelectItem value="10">10 minutes</SelectItem>
                        <SelectItem value="30">30 minutes</SelectItem>
                        <SelectItem value="60">1 hour</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="layout-type">Layout Type</Label>
                  <Select
                    value={localConfig.layout}
                    onValueChange={(value: 'grid' | 'masonry' | 'flex') => updateDashboardSetting('layout', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="grid">Grid Layout</SelectItem>
                      <SelectItem value="masonry">Masonry Layout</SelectItem>
                      <SelectItem value="flex">Flexible Layout</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="is-default"
                    checked={localConfig.isDefault}
                    onCheckedChange={(checked) => updateDashboardSetting('isDefault', checked)}
                  />
                  <Label htmlFor="is-default">Set as default dashboard</Label>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Widget Settings */}
          <TabsContent value="widgets" className="space-y-4 overflow-y-auto max-h-96">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium">Widget Configuration</h3>
              <Badge variant="outline">
                {localConfig.widgets.length} widget{localConfig.widgets.length !== 1 ? 's' : ''}
              </Badge>
            </div>

            <div className="space-y-3">
              {localConfig.widgets.map((widget, index) => (
                <Card key={widget.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="flex flex-col space-y-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => moveWidget(widget.id, 'up')}
                            disabled={index === 0}
                            className="h-6 w-6 p-0"
                          >
                            <ArrowUpIcon className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => moveWidget(widget.id, 'down')}
                            disabled={index === localConfig.widgets.length - 1}
                            className="h-6 w-6 p-0"
                          >
                            <ArrowDownIcon className="h-3 w-3" />
                          </Button>
                        </div>

                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <Input
                              value={widget.title}
                              onChange={(e) => updateWidget(widget.id, { title: e.target.value })}
                              className="font-medium"
                            />
                            <Badge variant="outline" className="text-xs">
                              {widget.type}
                            </Badge>
                          </div>
                          
                          <div className="grid grid-cols-4 gap-2 text-xs">
                            <div>
                              <Label>Width</Label>
                              <Input
                                type="number"
                                min="1"
                                max="12"
                                value={widget.position.w}
                                onChange={(e) => updateWidget(widget.id, {
                                  position: { ...widget.position, w: parseInt(e.target.value) }
                                })}
                                className="h-7"
                              />
                            </div>
                            <div>
                              <Label>Height</Label>
                              <Input
                                type="number"
                                min="1"
                                max="10"
                                value={widget.position.h}
                                onChange={(e) => updateWidget(widget.id, {
                                  position: { ...widget.position, h: parseInt(e.target.value) }
                                })}
                                className="h-7"
                              />
                            </div>
                            <div>
                              <Label>X Position</Label>
                              <Input
                                type="number"
                                min="0"
                                max="11"
                                value={widget.position.x}
                                onChange={(e) => updateWidget(widget.id, {
                                  position: { ...widget.position, x: parseInt(e.target.value) }
                                })}
                                className="h-7"
                              />
                            </div>
                            <div>
                              <Label>Y Position</Label>
                              <Input
                                type="number"
                                min="0"
                                value={widget.position.y}
                                onChange={(e) => updateWidget(widget.id, {
                                  position: { ...widget.position, y: parseInt(e.target.value) }
                                })}
                                className="h-7"
                              />
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Switch
                          checked={widget.isVisible}
                          onCheckedChange={(checked) => updateWidget(widget.id, { isVisible: checked })}
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeWidget(widget.id)}
                          className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {localConfig.widgets.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <PlusIcon className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No widgets configured</p>
                <p className="text-sm">Add widgets from the main dashboard</p>
              </div>
            )}
          </TabsContent>

          {/* Layout Settings */}
          <TabsContent value="layout" className="space-y-4 overflow-y-auto max-h-96">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Layout Configuration</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div
                    className={cn(
                      'p-4 border-2 rounded-lg cursor-pointer transition-colors',
                      localConfig.layout === 'grid' ? 'border-primary bg-primary/5' : 'border-border'
                    )}
                    onClick={() => updateDashboardSetting('layout', 'grid')}
                  >
                    <div className="grid grid-cols-2 gap-1 mb-2">
                      <div className="h-4 bg-muted rounded"></div>
                      <div className="h-4 bg-muted rounded"></div>
                      <div className="h-4 bg-muted rounded"></div>
                      <div className="h-4 bg-muted rounded"></div>
                    </div>
                    <p className="text-sm font-medium">Grid Layout</p>
                    <p className="text-xs text-muted-foreground">Fixed grid system</p>
                  </div>

                  <div
                    className={cn(
                      'p-4 border-2 rounded-lg cursor-pointer transition-colors',
                      localConfig.layout === 'masonry' ? 'border-primary bg-primary/5' : 'border-border'
                    )}
                    onClick={() => updateDashboardSetting('layout', 'masonry')}
                  >
                    <div className="space-y-1 mb-2">
                      <div className="h-3 bg-muted rounded"></div>
                      <div className="h-5 bg-muted rounded"></div>
                      <div className="h-2 bg-muted rounded"></div>
                      <div className="h-4 bg-muted rounded"></div>
                    </div>
                    <p className="text-sm font-medium">Masonry Layout</p>
                    <p className="text-xs text-muted-foreground">Pinterest-style</p>
                  </div>

                  <div
                    className={cn(
                      'p-4 border-2 rounded-lg cursor-pointer transition-colors',
                      localConfig.layout === 'flex' ? 'border-primary bg-primary/5' : 'border-border'
                    )}
                    onClick={() => updateDashboardSetting('layout', 'flex')}
                  >
                    <div className="flex space-x-1 mb-2">
                      <div className="flex-1 h-4 bg-muted rounded"></div>
                      <div className="w-8 h-4 bg-muted rounded"></div>
                      <div className="flex-1 h-4 bg-muted rounded"></div>
                    </div>
                    <p className="text-sm font-medium">Flexible Layout</p>
                    <p className="text-xs text-muted-foreground">Responsive flex</p>
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <h4 className="font-medium mb-3">Layout Preview</h4>
                  <div className="p-4 border rounded-lg bg-muted/20">
                    <div className={cn(
                      'space-y-2',
                      localConfig.layout === 'grid' && 'grid grid-cols-4 gap-2 space-y-0',
                      localConfig.layout === 'flex' && 'flex flex-wrap gap-2 space-y-0'
                    )}>
                      {localConfig.widgets.filter(w => w.isVisible).map((widget, index) => (
                        <div
                          key={widget.id}
                          className={cn(
                            'bg-background border rounded p-2 text-xs',
                            localConfig.layout === 'grid' && `col-span-${Math.min(widget.position.w, 4)}`,
                            localConfig.layout === 'flex' && 'flex-1 min-w-24'
                          )}
                          style={{
                            height: localConfig.layout === 'masonry' ? `${20 + (index % 3) * 10}px` : '40px'
                          }}
                        >
                          {widget.title}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <DialogFooter className="flex items-center justify-between">
          <Button
            variant="outline"
            onClick={resetToDefaults}
            className="text-destructive hover:text-destructive"
          >
            Reset to Defaults
          </Button>
          
          <div className="flex items-center space-x-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleSave}>
              Save Changes
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export type { WidgetConfigDialogProps }