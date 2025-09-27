'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  FileText,
  Download,
  Eye,
  Printer,
  Mail,
  Users,
  Calendar
} from 'lucide-react'
import { PayrollRecord } from '@/types/admin'

interface PayrollSlipGeneratorProps {
  records: PayrollRecord[]
  onGenerate: (recordIds: number[], format: 'PDF' | 'EMAIL') => Promise<void>
}

export function PayrollSlipGenerator({ records, onGenerate }: PayrollSlipGeneratorProps) {
  const [selectedRecords, setSelectedRecords] = useState<number[]>([])
  const [format, setFormat] = useState<'PDF' | 'EMAIL'>('PDF')
  const [isGenerating, setIsGenerating] = useState(false)

  const handleGenerate = async () => {
    if (selectedRecords.length === 0) return
    
    setIsGenerating(true)
    try {
      await onGenerate(selectedRecords, format)
    } finally {
      setIsGenerating(false)
    }
  }

  const toggleRecordSelection = (recordId: number) => {
    setSelectedRecords(prev =>
      prev.includes(recordId)
        ? prev.filter(id => id !== recordId)
        : [...prev, recordId]
    )
  }

  const selectAll = () => {
    if (selectedRecords.length === records.length) {
      setSelectedRecords([])
    } else {
      setSelectedRecords(records.map(r => r.id))
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Pay Slip Generator
            </CardTitle>
            <div className="flex items-center gap-2">
              <Select value={format} onValueChange={(value: 'PDF' | 'EMAIL') => setFormat(value)}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PDF">PDF Download</SelectItem>
                  <SelectItem value="EMAIL">Email to Inspector</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={handleGenerate} disabled={selectedRecords.length === 0 || isGenerating}>
                {isGenerating ? 'Generating...' : format === 'PDF' ? 'Download' : 'Send Email'}
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Select Pay Records</CardTitle>
            <div className="flex items-center gap-2">
              <Badge variant="secondary">
                {selectedRecords.length} of {records.length} selected
              </Badge>
              <Button variant="outline" size="sm" onClick={selectAll}>
                {selectedRecords.length === records.length ? 'Deselect All' : 'Select All'}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {records.map((record) => (
              <PayrollRecordItem
                key={record.id}
                record={record}
                isSelected={selectedRecords.includes(record.id)}
                onToggle={() => toggleRecordSelection(record.id)}
              />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

interface PayrollRecordItemProps {
  record: PayrollRecord
  isSelected: boolean
  onToggle: () => void
}

function PayrollRecordItem({ record, isSelected, onToggle }: PayrollRecordItemProps) {
  return (
    <div 
      className={`p-4 border rounded-lg cursor-pointer transition-colors ${
        isSelected ? 'border-primary bg-primary/5' : 'border-border hover:bg-muted/50'
      }`}
      onClick={onToggle}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={onToggle}
            className="rounded"
          />
          <div>
            <p className="font-medium">{record.inspector.name}</p>
            <p className="text-sm text-muted-foreground">
              {record.inspector.employeeId} • {new Date(record.year, record.month - 1).toLocaleDateString('en-US', { 
                month: 'long', 
                year: 'numeric' 
              })}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="font-semibold">
              {new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: 'USD'
              }).format(record.netPay)}
            </p>
            <Badge variant={record.isPaid ? 'secondary' : 'destructive'}>
              {record.isPaid ? 'Paid' : 'Pending'}
            </Badge>
          </div>
          
          <div className="flex gap-1">
            <Button variant="ghost" size="sm">
              <Eye className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm">
              <Printer className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}