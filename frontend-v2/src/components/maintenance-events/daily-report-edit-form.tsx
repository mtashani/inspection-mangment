'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { DailyReport } from '@/types/maintenance-events'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { DatePicker } from '@/components/ui/date-picker'
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from '@/components/ui/form'
import { Save, X, FileText } from 'lucide-react'

const dailyReportSchema = z.object({
  report_date: z.date({
    required_error: 'Report date is required',
  }),
  description: z.string().min(1, 'Description is required'),
  findings: z.string().optional(),
  recommendations: z.string().optional(),
  weather_conditions: z.string().optional(),
  safety_notes: z.string().optional(),
  location: z.string().optional(),
})

type DailyReportFormData = z.infer<typeof dailyReportSchema>

interface DailyReportEditFormProps {
  report: DailyReport
  onSave: (data: DailyReportFormData) => void
  onCancel: () => void
  isLoading?: boolean
}

export function DailyReportEditForm({ 
  report, 
  onSave, 
  onCancel, 
  isLoading = false 
}: DailyReportEditFormProps) {
  const form = useForm<DailyReportFormData>({
    resolver: zodResolver(dailyReportSchema),
    defaultValues: {
      report_date: new Date(report.report_date),
      description: report.description || '',
      findings: report.findings || '',
      recommendations: report.recommendations || '',
      weather_conditions: report.weather_conditions || '',
      safety_notes: report.safety_notes || '',
      location: report.location || '',
    },
  })

  const handleSubmit = (data: DailyReportFormData) => {
    onSave({
      ...data,
      report_date: data.report_date.toISOString().split('T')[0], // Convert to YYYY-MM-DD
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Edit Daily Report
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            {/* Mobile-optimized grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Report Date */}
              <FormField
                control={form.control}
                name="report_date"
                render={({ field }) => (
                  <FormItem className="sm:col-span-1">
                    <FormLabel>Report Date</FormLabel>
                    <FormControl>
                      <DatePicker
                        date={field.value}
                        onDateChange={field.onChange}
                        placeholder="Select report date"
                        disableFuture={true}
                        showToday={true}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Location */}
              <FormField
                control={form.control}
                name="location"
                render={({ field }) => (
                  <FormItem className="sm:col-span-1">
                    <FormLabel>Location</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Specify the location or area..."
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Description - Full width */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description *</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describe the daily activities and observations..."
                      className="min-h-[100px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Findings */}
            <FormField
              control={form.control}
              name="findings"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Findings</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Document any issues, anomalies, or observations..."
                      className="min-h-[100px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Recommendations */}
            <FormField
              control={form.control}
              name="recommendations"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Recommendations</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Provide recommendations for follow-up actions..."
                      className="min-h-[80px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Weather and Safety - Mobile responsive grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Weather Conditions */}
              <FormField
                control={form.control}
                name="weather_conditions"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Weather Conditions</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Describe weather conditions..."
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Safety Notes */}
              <FormField
                control={form.control}
                name="safety_notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Safety Notes</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Document safety concerns..."
                        className="min-h-[60px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Form Actions - Mobile responsive */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-end gap-3 pt-6 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={isLoading}
                className="w-full sm:w-auto"
              >
                <X className="mr-2 h-4 w-4" />
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={isLoading}
                className="w-full sm:w-auto"
              >
                <Save className="mr-2 h-4 w-4" />
                {isLoading ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}