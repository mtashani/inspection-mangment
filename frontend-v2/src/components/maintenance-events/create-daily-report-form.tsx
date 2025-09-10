'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Inspection } from '@/types/maintenance-events'
import { Button } from '@/components/ui/button'
import { LoadingButton } from '@/components/ui/loading-button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { DatePicker } from '@/components/ui/date-picker'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from '@/components/ui/form'
import { Save, X } from 'lucide-react'

const createDailyReportSchema = z.object({
  inspection_id: z.number({
    required_error: 'Please select an inspection',
  }),
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

type CreateDailyReportFormData = z.infer<typeof createDailyReportSchema>

interface CreateDailyReportFormProps {
  onSave: (data: CreateDailyReportFormData) => void
  onCancel: () => void
  isLoading?: boolean
  inspections?: Inspection[]
  preselectedInspectionId?: number
}

export function CreateDailyReportForm({ 
  onSave, 
  onCancel, 
  isLoading = false,
  inspections = [],
  preselectedInspectionId
}: CreateDailyReportFormProps) {
  const form = useForm<CreateDailyReportFormData>({
    resolver: zodResolver(createDailyReportSchema),
    defaultValues: {
      inspection_id: preselectedInspectionId,
      report_date: new Date(),
      description: '',
      findings: '',
      recommendations: '',
      weather_conditions: '',
      safety_notes: '',
      location: '',
    },
  })

  const handleSubmit = (data: CreateDailyReportFormData) => {
    onSave({
      ...data,
      report_date: data.report_date.toISOString().split('T')[0], // Convert to YYYY-MM-DD
    })
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        {/* Inspection Selection */}
        <FormField
          control={form.control}
          name="inspection_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Inspection *</FormLabel>
              <Select 
                onValueChange={(value) => field.onChange(parseInt(value))}
                value={field.value?.toString()}
                disabled={!!preselectedInspectionId}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select an inspection" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {inspections.map((inspection) => (
                    <SelectItem key={inspection.id} value={inspection.id.toString()}>
                      <div className="flex flex-col">
                        <span className="font-medium">{inspection.title}</span>
                        <span className="text-xs text-muted-foreground">
                          {inspection.inspection_number} - {inspection.equipment_tag}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Report Date */}
        <FormField
          control={form.control}
          name="report_date"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Report Date *</FormLabel>
              <FormControl>
                <DatePicker
                  date={field.value}
                  onDateChange={field.onChange}
                  placeholder="Select report date"
                  disableFuture={true}
                  showToday={true}
                  inModal={true}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Description */}
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

        {/* Location */}
        <FormField
          control={form.control}
          name="location"
          render={({ field }) => (
            <FormItem>
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

        {/* Weather Conditions */}
        <FormField
          control={form.control}
          name="weather_conditions"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Weather Conditions</FormLabel>
              <FormControl>
                <Input
                  placeholder="Describe weather conditions during inspection..."
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
                  placeholder="Document any safety concerns or precautions..."
                  className="min-h-[80px]"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Form Actions */}
        <div className="flex items-center justify-end gap-4 pt-6 border-t">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isLoading}
          >
            <X className="mr-2 h-4 w-4" />
            Cancel
          </Button>
          <LoadingButton 
            type="submit" 
            loading={isLoading}
            loadingText="Creating..."
          >
            <Save className="mr-2 h-4 w-4" />
            Create Report
          </LoadingButton>
        </div>
      </form>
    </Form>
  )
}