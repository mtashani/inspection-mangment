'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { 
  Calculator,
  DollarSign,
  Clock,
  TrendingUp,
  Plus,
  Minus,
  Save,
  RefreshCw
} from 'lucide-react'
import { PayrollCalculation, BonusRule, DeductionRule } from '@/types/admin'

interface SalaryCalculatorProps {
  inspectorId?: number
  month: number
  year: number
  onCalculationComplete?: (calculation: PayrollCalculation) => void
}

export function SalaryCalculator({ 
  inspectorId, 
  month, 
  year, 
  onCalculationComplete 
}: SalaryCalculatorProps) {
  const [calculation, setCalculation] = useState<PayrollCalculation>({
    workingDays: 0,
    restingDays: 0,
    overtimeDays: 0,
    totalHours: 0,
    overtimeHours: 0,
    baseSalary: 0,
    overtimePay: 0,
    bonuses: 0,
    deductions: 0,
    totalPay: 0,
    netPay: 0
  })

  const [settings, setSettings] = useState({
    baseHourlyRate: 25.00,
    overtimeMultiplier: 1.5,
    standardWorkHours: 8,
    workingDaysPerMonth: 22
  })

  const [bonusRules, setBonusRules] = useState<BonusRule[]>([
    {
      id: '1',
      name: 'Performance Bonus',
      type: 'FIXED',
      value: 500,
      isActive: true
    },
    {
      id: '2',
      name: 'Overtime Bonus',
      type: 'PERCENTAGE',
      value: 10,
      condition: 'overtime_hours > 20',
      isActive: true
    }
  ])

  const [deductionRules, setDeductionRules] = useState<DeductionRule[]>([
    {
      id: '1',
      name: 'Income Tax',
      type: 'PERCENTAGE',
      value: 15,
      isActive: true
    },
    {
      id: '2',
      name: 'Insurance',
      type: 'FIXED',
      value: 200,
      isActive: true
    }
  ])

  const [customBonuses, setCustomBonuses] = useState<Array<{ name: string; amount: number }>>([])
  const [customDeductions, setCustomDeductions] = useState<Array<{ name: string; amount: number }>>([])

  // Calculate salary based on inputs
  useEffect(() => {
    calculateSalary()
  }, [
    calculation.workingDays,
    calculation.overtimeHours,
    settings,
    bonusRules,
    deductionRules,
    customBonuses,
    customDeductions
  ])

  const calculateSalary = () => {
    const totalHours = calculation.workingDays * settings.standardWorkHours
    const baseSalary = totalHours * settings.baseHourlyRate
    const overtimePay = calculation.overtimeHours * settings.baseHourlyRate * settings.overtimeMultiplier

    // Calculate bonuses
    let totalBonuses = 0
    
    // Rule-based bonuses
    bonusRules.forEach(rule => {
      if (!rule.isActive) return
      
      if (rule.type === 'FIXED') {
        totalBonuses += rule.value
      } else if (rule.type === 'PERCENTAGE') {
        if (rule.condition === 'overtime_hours > 20' && calculation.overtimeHours > 20) {
          totalBonuses += (baseSalary + overtimePay) * (rule.value / 100)
        } else if (!rule.condition) {
          totalBonuses += (baseSalary + overtimePay) * (rule.value / 100)
        }
      }
    })
    
    // Custom bonuses
    customBonuses.forEach(bonus => {
      totalBonuses += bonus.amount
    })

    // Calculate deductions
    let totalDeductions = 0
    
    // Rule-based deductions
    deductionRules.forEach(rule => {
      if (!rule.isActive) return
      
      if (rule.type === 'FIXED') {
        totalDeductions += rule.value
      } else if (rule.type === 'PERCENTAGE') {
        totalDeductions += (baseSalary + overtimePay + totalBonuses) * (rule.value / 100)
      }
    })
    
    // Custom deductions
    customDeductions.forEach(deduction => {
      totalDeductions += deduction.amount
    })

    const totalPay = baseSalary + overtimePay + totalBonuses
    const netPay = totalPay - totalDeductions

    const newCalculation = {
      ...calculation,
      totalHours,
      baseSalary,
      overtimePay,
      bonuses: totalBonuses,
      deductions: totalDeductions,
      totalPay,
      netPay,
      restingDays: settings.workingDaysPerMonth - calculation.workingDays,
      overtimeDays: Math.ceil(calculation.overtimeHours / settings.standardWorkHours)
    }

    setCalculation(newCalculation)
    onCalculationComplete?.(newCalculation)
  }

  const addCustomBonus = () => {
    setCustomBonuses([...customBonuses, { name: '', amount: 0 }])
  }

  const updateCustomBonus = (index: number, field: 'name' | 'amount', value: string | number) => {
    const updated = [...customBonuses]
    updated[index] = { ...updated[index], [field]: value }
    setCustomBonuses(updated)
  }

  const removeCustomBonus = (index: number) => {
    setCustomBonuses(customBonuses.filter((_, i) => i !== index))
  }

  const addCustomDeduction = () => {
    setCustomDeductions([...customDeductions, { name: '', amount: 0 }])
  }

  const updateCustomDeduction = (index: number, field: 'name' | 'amount', value: string | number) => {
    const updated = [...customDeductions]
    updated[index] = { ...updated[index], [field]: value }
    setCustomDeductions(updated)
  }

  const removeCustomDeduction = (index: number) => {
    setCustomDeductions(customDeductions.filter((_, i) => i !== index))
  }

  const resetCalculation = () => {
    setCalculation({
      workingDays: 0,
      restingDays: 0,
      overtimeDays: 0,
      totalHours: 0,
      overtimeHours: 0,
      baseSalary: 0,
      overtimePay: 0,
      bonuses: 0,
      deductions: 0,
      totalPay: 0,
      netPay: 0
    })
    setCustomBonuses([])
    setCustomDeductions([])
  }

  return (
    <div className="space-y-6">
      {/* Calculator Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Calculator className="h-5 w-5" />
              Salary Calculator
            </CardTitle>
            <div className="flex items-center gap-2">
              <Badge variant="outline">
                {new Date(year, month - 1).toLocaleDateString('en-US', { 
                  month: 'long', 
                  year: 'numeric' 
                })}
              </Badge>
              <Button variant="outline" size="sm" onClick={resetCalculation}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Reset
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Input Section */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Payroll Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="baseRate">Base Hourly Rate ($)</Label>
                  <Input
                    id="baseRate"
                    type="number"
                    step="0.01"
                    value={settings.baseHourlyRate}
                    onChange={(e) => setSettings({
                      ...settings,
                      baseHourlyRate: parseFloat(e.target.value) || 0
                    })}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="overtimeMultiplier">Overtime Multiplier</Label>
                  <Input
                    id="overtimeMultiplier"
                    type="number"
                    step="0.1"
                    value={settings.overtimeMultiplier}
                    onChange={(e) => setSettings({
                      ...settings,
                      overtimeMultiplier: parseFloat(e.target.value) || 0
                    })}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="workHours">Standard Work Hours/Day</Label>
                  <Input
                    id="workHours"
                    type="number"
                    value={settings.standardWorkHours}
                    onChange={(e) => setSettings({
                      ...settings,
                      standardWorkHours: parseInt(e.target.value) || 0
                    })}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="workingDays">Working Days/Month</Label>
                  <Input
                    id="workingDays"
                    type="number"
                    value={settings.workingDaysPerMonth}
                    onChange={(e) => setSettings({
                      ...settings,
                      workingDaysPerMonth: parseInt(e.target.value) || 0
                    })}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Time Tracking */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Time Tracking</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="actualWorkingDays">Actual Working Days</Label>
                  <Input
                    id="actualWorkingDays"
                    type="number"
                    value={calculation.workingDays}
                    onChange={(e) => setCalculation({
                      ...calculation,
                      workingDays: parseInt(e.target.value) || 0
                    })}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="overtimeHours">Overtime Hours</Label>
                  <Input
                    id="overtimeHours"
                    type="number"
                    step="0.5"
                    value={calculation.overtimeHours}
                    onChange={(e) => setCalculation({
                      ...calculation,
                      overtimeHours: parseFloat(e.target.value) || 0
                    })}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Custom Bonuses */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Custom Bonuses</CardTitle>
                <Button variant="outline" size="sm" onClick={addCustomBonus}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Bonus
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {customBonuses.map((bonus, index) => (
                <div key={index} className="flex items-center gap-2">
                  <Input
                    placeholder="Bonus name"
                    value={bonus.name}
                    onChange={(e) => updateCustomBonus(index, 'name', e.target.value)}
                    className="flex-1"
                  />
                  <Input
                    type="number"
                    placeholder="Amount"
                    value={bonus.amount}
                    onChange={(e) => updateCustomBonus(index, 'amount', parseFloat(e.target.value) || 0)}
                    className="w-32"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => removeCustomBonus(index)}
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              
              {customBonuses.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No custom bonuses added
                </p>
              )}
            </CardContent>
          </Card>

          {/* Custom Deductions */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Custom Deductions</CardTitle>
                <Button variant="outline" size="sm" onClick={addCustomDeduction}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Deduction
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {customDeductions.map((deduction, index) => (
                <div key={index} className="flex items-center gap-2">
                  <Input
                    placeholder="Deduction name"
                    value={deduction.name}
                    onChange={(e) => updateCustomDeduction(index, 'name', e.target.value)}
                    className="flex-1"
                  />
                  <Input
                    type="number"
                    placeholder="Amount"
                    value={deduction.amount}
                    onChange={(e) => updateCustomDeduction(index, 'amount', parseFloat(e.target.value) || 0)}
                    className="w-32"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => removeCustomDeduction(index)}
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              
              {customDeductions.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No custom deductions added
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Results Section */}
        <div className="space-y-6">
          {/* Calculation Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Calculation Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Working Days:</span>
                  <span className="font-medium">{calculation.workingDays}</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm">Total Hours:</span>
                  <span className="font-medium">{calculation.totalHours}h</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm">Overtime Hours:</span>
                  <span className="font-medium text-orange-600">{calculation.overtimeHours}h</span>
                </div>
                
                <Separator />
                
                <div className="flex justify-between items-center">
                  <span className="text-sm">Base Salary:</span>
                  <span className="font-medium">
                    {new Intl.NumberFormat('en-US', {
                      style: 'currency',
                      currency: 'USD'
                    }).format(calculation.baseSalary)}
                  </span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm">Overtime Pay:</span>
                  <span className="font-medium text-orange-600">
                    {new Intl.NumberFormat('en-US', {
                      style: 'currency',
                      currency: 'USD'
                    }).format(calculation.overtimePay)}
                  </span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm">Bonuses:</span>
                  <span className="font-medium text-green-600">
                    {new Intl.NumberFormat('en-US', {
                      style: 'currency',
                      currency: 'USD'
                    }).format(calculation.bonuses)}
                  </span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm">Deductions:</span>
                  <span className="font-medium text-red-600">
                    -{new Intl.NumberFormat('en-US', {
                      style: 'currency',
                      currency: 'USD'
                    }).format(calculation.deductions)}
                  </span>
                </div>
                
                <Separator />
                
                <div className="flex justify-between items-center text-lg font-semibold">
                  <span>Net Pay:</span>
                  <span className="text-green-600">
                    {new Intl.NumberFormat('en-US', {
                      style: 'currency',
                      currency: 'USD'
                    }).format(calculation.netPay)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Active Rules */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Active Rules</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm font-medium mb-2">Bonus Rules:</p>
                <div className="space-y-1">
                  {bonusRules.filter(rule => rule.isActive).map(rule => (
                    <div key={rule.id} className="text-xs p-2 bg-green-50 border border-green-200 rounded">
                      {rule.name}: {rule.type === 'FIXED' ? `$${rule.value}` : `${rule.value}%`}
                    </div>
                  ))}
                </div>
              </div>
              
              <div>
                <p className="text-sm font-medium mb-2">Deduction Rules:</p>
                <div className="space-y-1">
                  {deductionRules.filter(rule => rule.isActive).map(rule => (
                    <div key={rule.id} className="text-xs p-2 bg-red-50 border border-red-200 rounded">
                      {rule.name}: {rule.type === 'FIXED' ? `$${rule.value}` : `${rule.value}%`}
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}