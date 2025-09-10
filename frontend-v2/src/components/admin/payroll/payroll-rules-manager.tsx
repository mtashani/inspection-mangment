'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { 
  Plus,
  Edit,
  Trash2,
  Award,
  Minus,
  Settings,
  Save,
  X
} from 'lucide-react'
import { BonusRule, DeductionRule } from '@/types/admin'

interface PayrollRulesManagerProps {
  bonusRules: BonusRule[]
  deductionRules: DeductionRule[]
  onBonusRuleCreate: (rule: Omit<BonusRule, 'id'>) => void
  onBonusRuleUpdate: (id: string, rule: Partial<BonusRule>) => void
  onBonusRuleDelete: (id: string) => void
  onDeductionRuleCreate: (rule: Omit<DeductionRule, 'id'>) => void
  onDeductionRuleUpdate: (id: string, rule: Partial<DeductionRule>) => void
  onDeductionRuleDelete: (id: string) => void
}

export function PayrollRulesManager({
  bonusRules,
  deductionRules,
  onBonusRuleCreate,
  onBonusRuleUpdate,
  onBonusRuleDelete,
  onDeductionRuleCreate,
  onDeductionRuleUpdate,
  onDeductionRuleDelete
}: PayrollRulesManagerProps) {
  const [editingBonusRule, setEditingBonusRule] = useState<BonusRule | null>(null)
  const [editingDeductionRule, setEditingDeductionRule] = useState<DeductionRule | null>(null)
  const [showBonusDialog, setShowBonusDialog] = useState(false)
  const [showDeductionDialog, setShowDeductionDialog] = useState(false)

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Payroll Rules Management
          </CardTitle>
        </CardHeader>
      </Card>

      <Tabs defaultValue="bonus" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="bonus" className="flex items-center gap-2">
            <Award className="h-4 w-4" />
            Bonus Rules
          </TabsTrigger>
          <TabsTrigger value="deduction" className="flex items-center gap-2">
            <Minus className="h-4 w-4" />
            Deduction Rules
          </TabsTrigger>
        </TabsList>

        <TabsContent value="bonus" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium">Bonus Rules</h3>
            <Dialog open={showBonusDialog} onOpenChange={setShowBonusDialog}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Bonus Rule
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>
                    {editingBonusRule ? 'Edit Bonus Rule' : 'Create Bonus Rule'}
                  </DialogTitle>
                </DialogHeader>
                <BonusRuleForm
                  rule={editingBonusRule}
                  onSave={(rule) => {
                    if (editingBonusRule) {
                      onBonusRuleUpdate(editingBonusRule.id, rule)
                    } else {
                      onBonusRuleCreate(rule)
                    }
                    setEditingBonusRule(null)
                    setShowBonusDialog(false)
                  }}
                  onCancel={() => {
                    setEditingBonusRule(null)
                    setShowBonusDialog(false)
                  }}
                />
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {bonusRules.map((rule) => (
              <BonusRuleCard
                key={rule.id}
                rule={rule}
                onEdit={(rule) => {
                  setEditingBonusRule(rule)
                  setShowBonusDialog(true)
                }}
                onDelete={() => onBonusRuleDelete(rule.id)}
                onToggleActive={(isActive) => onBonusRuleUpdate(rule.id, { isActive })}
              />
            ))}
          </div>

          {bonusRules.length === 0 && (
            <Card>
              <CardContent className="text-center py-8">
                <Award className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No bonus rules configured</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="deduction" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium">Deduction Rules</h3>
            <Dialog open={showDeductionDialog} onOpenChange={setShowDeductionDialog}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Deduction Rule
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>
                    {editingDeductionRule ? 'Edit Deduction Rule' : 'Create Deduction Rule'}
                  </DialogTitle>
                </DialogHeader>
                <DeductionRuleForm
                  rule={editingDeductionRule}
                  onSave={(rule) => {
                    if (editingDeductionRule) {
                      onDeductionRuleUpdate(editingDeductionRule.id, rule)
                    } else {
                      onDeductionRuleCreate(rule)
                    }
                    setEditingDeductionRule(null)
                    setShowDeductionDialog(false)
                  }}
                  onCancel={() => {
                    setEditingDeductionRule(null)
                    setShowDeductionDialog(false)
                  }}
                />
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {deductionRules.map((rule) => (
              <DeductionRuleCard
                key={rule.id}
                rule={rule}
                onEdit={(rule) => {
                  setEditingDeductionRule(rule)
                  setShowDeductionDialog(true)
                }}
                onDelete={() => onDeductionRuleDelete(rule.id)}
                onToggleActive={(isActive) => onDeductionRuleUpdate(rule.id, { isActive })}
              />
            ))}
          </div>

          {deductionRules.length === 0 && (
            <Card>
              <CardContent className="text-center py-8">
                <Minus className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No deduction rules configured</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}

interface BonusRuleCardProps {
  rule: BonusRule
  onEdit: (rule: BonusRule) => void
  onDelete: () => void
  onToggleActive: (isActive: boolean) => void
}

function BonusRuleCard({ rule, onEdit, onDelete, onToggleActive }: BonusRuleCardProps) {
  return (
    <Card className={rule.isActive ? '' : 'opacity-60'}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">{rule.name}</CardTitle>
          <div className="flex items-center gap-2">
            <Switch
              checked={rule.isActive}
              onCheckedChange={onToggleActive}
              size="sm"
            />
            <Button variant="ghost" size="sm" onClick={() => onEdit(rule)}>
              <Edit className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={onDelete}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Type:</span>
            <Badge variant="outline">{rule.type}</Badge>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Value:</span>
            <span className="font-medium">
              {rule.type === 'FIXED' ? `$${rule.value}` : `${rule.value}%`}
            </span>
          </div>
          {rule.condition && (
            <div className="text-xs text-muted-foreground">
              Condition: {rule.condition}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

interface DeductionRuleCardProps {
  rule: DeductionRule
  onEdit: (rule: DeductionRule) => void
  onDelete: () => void
  onToggleActive: (isActive: boolean) => void
}

function DeductionRuleCard({ rule, onEdit, onDelete, onToggleActive }: DeductionRuleCardProps) {
  return (
    <Card className={rule.isActive ? '' : 'opacity-60'}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">{rule.name}</CardTitle>
          <div className="flex items-center gap-2">
            <Switch
              checked={rule.isActive}
              onCheckedChange={onToggleActive}
              size="sm"
            />
            <Button variant="ghost" size="sm" onClick={() => onEdit(rule)}>
              <Edit className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={onDelete}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Type:</span>
            <Badge variant="outline">{rule.type}</Badge>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Value:</span>
            <span className="font-medium">
              {rule.type === 'FIXED' ? `$${rule.value}` : `${rule.value}%`}
            </span>
          </div>
          {rule.condition && (
            <div className="text-xs text-muted-foreground">
              Condition: {rule.condition}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

interface BonusRuleFormProps {
  rule?: BonusRule | null
  onSave: (rule: Omit<BonusRule, 'id'>) => void
  onCancel: () => void
}

function BonusRuleForm({ rule, onSave, onCancel }: BonusRuleFormProps) {
  const [formData, setFormData] = useState({
    name: rule?.name || '',
    type: rule?.type || 'FIXED' as const,
    value: rule?.value || 0,
    condition: rule?.condition || '',
    isActive: rule?.isActive ?? true
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave(formData)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Rule Name</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="e.g., Performance Bonus"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="type">Type</Label>
        <Select value={formData.type} onValueChange={(value: 'FIXED' | 'PERCENTAGE' | 'HOURLY') => 
          setFormData({ ...formData, type: value })
        }>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="FIXED">Fixed Amount</SelectItem>
            <SelectItem value="PERCENTAGE">Percentage</SelectItem>
            <SelectItem value="HOURLY">Hourly Rate</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="value">
          Value {formData.type === 'FIXED' ? '($)' : formData.type === 'PERCENTAGE' ? '(%)' : '($/hour)'}
        </Label>
        <Input
          id="value"
          type="number"
          step={formData.type === 'PERCENTAGE' ? '0.1' : '0.01'}
          value={formData.value}
          onChange={(e) => setFormData({ ...formData, value: parseFloat(e.target.value) || 0 })}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="condition">Condition (Optional)</Label>
        <Input
          id="condition"
          value={formData.condition}
          onChange={(e) => setFormData({ ...formData, condition: e.target.value })}
          placeholder="e.g., overtime_hours > 20"
        />
      </div>

      <div className="flex items-center space-x-2">
        <Switch
          id="isActive"
          checked={formData.isActive}
          onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
        />
        <Label htmlFor="isActive">Active</Label>
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          <X className="h-4 w-4 mr-2" />
          Cancel
        </Button>
        <Button type="submit">
          <Save className="h-4 w-4 mr-2" />
          Save Rule
        </Button>
      </div>
    </form>
  )
}

interface DeductionRuleFormProps {
  rule?: DeductionRule | null
  onSave: (rule: Omit<DeductionRule, 'id'>) => void
  onCancel: () => void
}

function DeductionRuleForm({ rule, onSave, onCancel }: DeductionRuleFormProps) {
  const [formData, setFormData] = useState({
    name: rule?.name || '',
    type: rule?.type || 'FIXED' as const,
    value: rule?.value || 0,
    condition: rule?.condition || '',
    isActive: rule?.isActive ?? true
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave(formData)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Rule Name</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="e.g., Income Tax"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="type">Type</Label>
        <Select value={formData.type} onValueChange={(value: 'FIXED' | 'PERCENTAGE') => 
          setFormData({ ...formData, type: value })
        }>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="FIXED">Fixed Amount</SelectItem>
            <SelectItem value="PERCENTAGE">Percentage</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="value">
          Value {formData.type === 'FIXED' ? '($)' : '(%)'}
        </Label>
        <Input
          id="value"
          type="number"
          step={formData.type === 'PERCENTAGE' ? '0.1' : '0.01'}
          value={formData.value}
          onChange={(e) => setFormData({ ...formData, value: parseFloat(e.target.value) || 0 })}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="condition">Condition (Optional)</Label>
        <Input
          id="condition"
          value={formData.condition}
          onChange={(e) => setFormData({ ...formData, condition: e.target.value })}
          placeholder="e.g., salary > 5000"
        />
      </div>

      <div className="flex items-center space-x-2">
        <Switch
          id="isActive"
          checked={formData.isActive}
          onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
        />
        <Label htmlFor="isActive">Active</Label>
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          <X className="h-4 w-4 mr-2" />
          Cancel
        </Button>
        <Button type="submit">
          <Save className="h-4 w-4 mr-2" />
          Save Rule
        </Button>
      </div>
    </form>
  )
}