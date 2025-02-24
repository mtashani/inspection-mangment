"use client"

import { FC } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Textarea } from "@/components/ui/textarea"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { createReportSchema } from "./types"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { format } from "date-fns"
import { CalendarIcon, Check, ChevronsUpDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { useInspectors } from "@/contexts/inspectors-context"
import { z } from "zod"

type FormValues = z.infer<ReturnType<typeof createReportSchema>>

interface EditReportFormProps {
  initialData: {
    date: string
    inspectors: string[]
    description: string
  }
  inspectionStartDate: string
  onSave: (data: FormValues) => void
  onCancel: () => void
}

const EditReportForm: FC<EditReportFormProps> = ({
  initialData,
  inspectionStartDate,
  onSave,
  onCancel
}) => {
  const { inspectors, loading } = useInspectors()

  // Convert string dates to Date objects for comparison
  const today = new Date()
  today.setHours(23, 59, 59, 999)
  
  const startDate = new Date(inspectionStartDate)
  startDate.setHours(0, 0, 0, 0)

  const form = useForm<FormValues>({
    resolver: zodResolver(createReportSchema(inspectionStartDate)),
    defaultValues: {
      ...initialData,
      date: initialData.date || startDate.toISOString().split('T')[0]
    }
  })

  const formatSelectedDate = (dateString: string) => {
    const date = new Date(dateString)
    return format(date, "MMM dd, yyyy")
  }

  const selectedInspectors = form.watch("inspectors") || []

  // Custom modifiers for date picker
  const dateModifiers = {
    disabled: [
      {
        before: startDate,
        after: today
      }
    ],
    highlight: (date: Date) => {
      const testDate = new Date(date)
      testDate.setHours(0, 0, 0, 0)
      return testDate >= startDate && testDate <= today
    }
  }

  const modifiersStyles = {
    disabled: {
      backgroundColor: "var(--muted)",
      color: "var(--muted-foreground)",
      cursor: "not-allowed"
    },
    highlight: {
      backgroundColor: "var(--accent)",
      color: "var(--accent-foreground)"
    }
  }

  return (
    <Card className="w-full">
      <CardContent className="p-4 overflow-hidden">
        <Form {...form}>
          <form 
            onSubmit={form.handleSubmit(onSave)} 
            className="space-y-4"
          >
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Date</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "w-[240px] pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              formatSelectedDate(field.value)
                            ) : (
                              <span>Pick a date</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <div className="border-b border-border/50 p-3">
                          <div className="text-sm text-muted-foreground">
                            Select a date between<br />
                            <span className="font-medium text-foreground">
                              {formatSelectedDate(inspectionStartDate)}
                            </span>
                            {" "} and {" "}
                            <span className="font-medium text-foreground">
                              today
                            </span>
                          </div>
                        </div>
                        <Calendar
                          mode="single"
                          selected={field.value ? new Date(field.value) : undefined}
                          onSelect={(date) => {
                            if (date) {
                              const selectedDate = new Date(date)
                              selectedDate.setHours(12, 0, 0, 0)
                              field.onChange(selectedDate.toISOString().split('T')[0])
                            }
                          }}
                          modifiers={dateModifiers}
                          modifiersStyles={modifiersStyles}
                          defaultMonth={startDate}
                          fromDate={startDate}
                          toDate={today}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="inspectors"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Inspectors</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            role="combobox"
                            className={cn(
                              "w-[240px] justify-between",
                              !field.value?.length && "text-muted-foreground"
                            )}
                            disabled={loading}
                          >
                            {loading ? "Loading..." : 
                              selectedInspectors.length
                                ? `${selectedInspectors.length} inspector${selectedInspectors.length > 1 ? 's' : ''} selected`
                                : "Select inspectors"}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-[240px] p-2" align="start">
                        <div className="max-h-[200px] overflow-y-auto space-y-1">
                          {inspectors.map((inspector) => (
                            <div
                              key={inspector.id}
                              className="flex items-center space-x-2 p-2 hover:bg-muted rounded-sm cursor-pointer"
                              onClick={() => {
                                const current = field.value || []
                                const inspectorId = String(inspector.id)
                                const updated = current.includes(inspectorId)
                                  ? current.filter((v: string) => v !== inspectorId)
                                  : [...current, inspectorId]
                                field.onChange(updated)
                              }}
                            >
                              <div className={cn(
                                "h-4 w-4 border rounded-sm flex items-center justify-center",
                                selectedInspectors.includes(String(inspector.id))
                                  ? "bg-primary border-primary"
                                  : "border-input"
                              )}>
                                {selectedInspectors.includes(String(inspector.id)) && (
                                  <Check className="h-3 w-3 text-primary-foreground" />
                                )}
                              </div>
                              <span className="text-sm">{inspector.name}</span>
                            </div>
                          ))}
                        </div>
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Enter inspection details..."
                      className="min-h-[100px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex justify-end gap-2">
              <Button 
                type="button" 
                variant="outline" 
                onClick={onCancel}
              >
                Cancel
              </Button>
              <Button type="submit">
                Save Changes
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}

export { EditReportForm }