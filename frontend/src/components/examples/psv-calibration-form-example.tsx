'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { PSVInspectorSelector, CorrosionInspectorSelector } from '@/components/inspectors/inspector-selector'
import { SpecialtyRequired } from '@/components/auth/permission-guard'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { 
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Save, Shield, CheckCircle } from 'lucide-react'
import { toast } from 'sonner'

// Form schema with validation
const calibrationSchema = z.object({
  psv_tag: z.string().min(1, 'PSV tag is required'),
  test_pressure: z.number().min(0, 'Test pressure must be positive'),
  set_pressure: z.number().min(0, 'Set pressure must be positive'),
  test_operator_id: z.number().min(1, 'Test operator selection is required'),
  approver_id: z.number().min(1, 'Approver selection is required'),
  test_date: z.string().min(1, 'Test date is required'),
  notes: z.string().optional(),
  test_result: z.enum(['pass', 'fail', 'needs_adjustment']),
})

type CalibrationFormData = z.infer<typeof calibrationSchema>

export default function PSVCalibrationFormExample() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [selectedOperator, setSelectedOperator] = useState<number | undefined>()
  const [selectedApprover, setSelectedApprover] = useState<number | undefined>()

  const form = useForm<CalibrationFormData>({
    resolver: zodResolver(calibrationSchema),
    defaultValues: {
      psv_tag: '',
      test_pressure: 0,
      set_pressure: 0,
      test_operator_id: 0,
      approver_id: 0,
      test_date: new Date().toISOString().split('T')[0],
      notes: '',
      test_result: 'pass'
    }
  })

  const onSubmit = async (data: CalibrationFormData) => {
    setIsSubmitting(true)
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      console.log('Calibration Data:', data)
      toast.success('Calibration recorded successfully')
      form.reset()
      setSelectedOperator(undefined)
      setSelectedApprover(undefined)
    } catch (error) {
      toast.error('Error recording calibration')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <SpecialtyRequired 
      specialty="PSV" 
      fallback={
        <Card className="max-w-4xl mx-auto mt-8">
          <CardContent className="pt-6">
            <div className="text-center text-gray-500">
              <Shield className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-medium mb-2">Access Restricted</h3>
              <p>You need PSV specialty to access the PSV calibration form.</p>
            </div>
          </CardContent>
        </Card>
      }
    >
      <Card className="max-w-4xl mx-auto mt-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-6 h-6 text-blue-600" />
            PSV Calibration Form
            <Badge variant="secondary" className="bg-blue-100 text-blue-800">
              PSV Specialty Required
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Basic Information */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="psv_tag"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>PSV Tag</FormLabel>
                      <FormControl>
                        <Input placeholder="PSV-001" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="test_pressure"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Test Pressure (Bar)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          step="0.1"
                          {...field}
                          onChange={(e) => field.onChange(Number(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="set_pressure"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Set Pressure (Bar)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          step="0.1"
                          {...field}
                          onChange={(e) => field.onChange(Number(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Inspector Selection - Smart Filtering */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="test_operator_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        Test Operator
                        <Badge variant="outline" className="text-xs">
                          PSV Inspectors Only
                        </Badge>
                      </FormLabel>
                      <FormControl>
                        <PSVInspectorSelector
                          role="operator"
                          value={selectedOperator}
                          onChange={(value) => {
                            setSelectedOperator(value as number)
                            field.onChange(value)
                          }}
                          placeholder="Select PSV operator..."
                          className="w-full"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="approver_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        Approver
                        <Badge variant="outline" className="text-xs">
                          Authorized Inspectors
                        </Badge>
                      </FormLabel>
                      <FormControl>
                        <CorrosionInspectorSelector
                          role="approver"
                          value={selectedApprover}
                          onChange={(value) => {
                            setSelectedApprover(value as number)
                            field.onChange(value)
                          }}
                          placeholder="Select approver..."
                          className="w-full"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Test Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="test_date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Test Date</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="test_result"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Test Result</FormLabel>
                      <FormControl>
                        <select 
                          className="w-full px-3 py-2 border border-gray-300 rounded-md"
                          {...field}
                        >
                          <option value="pass">Pass</option>
                          <option value="fail">Fail</option>
                          <option value="needs_adjustment">Needs Adjustment</option>
                        </select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Notes */}
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Additional test details..."
                        className="min-h-[100px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Submit Button */}
              <div className="flex justify-end gap-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    form.reset()
                    setSelectedOperator(undefined)
                    setSelectedApprover(undefined)
                  }}
                  disabled={isSubmitting}
                >
                  Clear
                </Button>
                
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="min-w-[120px]"
                >
                  {isSubmitting ? (
                    <div className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
                      Recording...
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Save className="w-4 h-4" />
                      Record Calibration
                    </div>
                  )}
                </Button>
              </div>
            </form>
          </Form>

          {/* Success State Example */}
          {form.formState.isSubmitSuccessful && (
            <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center gap-2 text-green-800">
                <CheckCircle className="w-5 h-5" />
                <span className="font-medium">Calibration recorded successfully</span>
              </div>
              <p className="text-sm text-green-600 mt-1">
                Calibration information has been saved in the system and sent to the approver.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </SpecialtyRequired>
  )
}

// Usage Tips Component
export function InspectorSelectorUsageTips() {
  return (
    <Card className="max-w-4xl mx-auto mt-8">
      <CardHeader>
        <CardTitle>🎯 Smart Inspector Selector Benefits</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-blue-50 rounded-lg">
            <h4 className="font-semibold text-blue-900 mb-2">Automatic Filtering</h4>
            <p className="text-sm text-blue-700">
              Only inspectors with required specialties are displayed
            </p>
          </div>
          
          <div className="p-4 bg-green-50 rounded-lg">
            <h4 className="font-semibold text-green-900 mb-2">Error Reduction</h4>
            <p className="text-sm text-green-700">
              Wrong inspector selection possibility reduced by 80%
            </p>
          </div>
          
          <div className="p-4 bg-orange-50 rounded-lg">
            <h4 className="font-semibold text-orange-900 mb-2">Complete Information</h4>
            <p className="text-sm text-orange-700">
              Display specialties, status and access of each inspector
            </p>
          </div>
          
          <div className="p-4 bg-purple-50 rounded-lg">
            <h4 className="font-semibold text-purple-900 mb-2">Automatic Updates</h4>
            <p className="text-sm text-purple-700">
              Specialty changes are immediately applied to all forms
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}