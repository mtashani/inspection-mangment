"use client"

import * as React from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { useInspectors } from "@/contexts/inspectors-context"
import { ChevronsUpDown, Check } from "lucide-react"
import { cn } from "@/lib/utils"

const dailyReportSchema = z.object({
  inspectionId: z.string(),
  date: z.string().min(1, "Date is required"),
  inspectors: z.array(z.string()).min(1, "At least one inspector is required"),
  description: z.string().min(1, "Description is required"),
})

type DailyReportFormValues = z.infer<typeof dailyReportSchema>

interface AddDailyReportDialogProps {
  inspectionId: string
  onSubmit: (data: DailyReportFormValues) => void
  trigger?: React.ReactNode
}

export function AddDailyReportDialog({ inspectionId, onSubmit, trigger }: AddDailyReportDialogProps) {
  const [open, setOpen] = React.useState(false)

  const { inspectors } = useInspectors()

  const form = useForm<DailyReportFormValues>({
    resolver: zodResolver(dailyReportSchema),
    defaultValues: {
      inspectionId,
      date: new Date().toISOString().split('T')[0],
      inspectors: [],
      description: "",
    },
  })

  const handleSubmit = (data: DailyReportFormValues) => {
    onSubmit({
      ...data,
      inspectors: data.inspectors || []
    })
    setOpen(false)
    form.reset({
      inspectionId,
      date: new Date().toISOString().split('T')[0],
      inspectors: [],
      description: "",
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" className="w-full">
            + Add Daily Report
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] overflow-visible">
        <DialogHeader>
          <DialogTitle>Add Daily Report</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4 flex flex-col">
            <div className="flex flex-nowrap gap-4 items-start">
            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem className="flex-1">
                  <FormLabel>Date</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="inspectors"
              render={({ field }) => (
                <FormItem className="flex-1">
                  <FormLabel>Inspectors</FormLabel>
                  <FormControl>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          className={cn(
                            "w-full justify-between",
                            !field.value?.length && "text-muted-foreground"
                          )}
                        >
                          {field.value?.length
                            ? `${field.value.length} inspector${field.value.length > 1 ? 's' : ''} selected`
                            : "Select inspectors"}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[240px] p-2" align="start">
                        <div className="max-h-[200px] overflow-y-auto space-y-1">
                          {inspectors.map((inspector) => (
                            <div
                              key={inspector.id}
                              className="flex items-center space-x-2 p-2 hover:bg-muted rounded-sm cursor-pointer"
                              onClick={() => {
                                const current = field.value || []
                                const inspectorId = inspector.id.toString()
                                const updated = current.includes(inspectorId)
                                  ? current.filter(id => id !== inspectorId)
                                  : [...current, inspectorId]
                                field.onChange(updated)
                              }}
                            >
                              <div className={cn(
                                "h-4 w-4 border rounded-sm flex items-center justify-center",
                                field.value?.includes(inspector.id.toString())
                                  ? "bg-primary border-primary"
                                  : "border-input"
                              )}>
                                {field.value?.includes(inspector.id.toString()) && (
                                  <Check className="h-3 w-3 text-primary-foreground" />
                                )}
                              </div>
                              <span className="text-sm">{inspector.name}</span>
                            </div>
                          ))}
                        </div>
                      </PopoverContent>
                    </Popover>
                  </FormControl>
                  {!field.value?.length && (
                    <p className="text-sm text-red-500">At least one inspector is required</p>
                  )}
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
                      {...field}
                      placeholder="Enter inspection details..."
                      className="min-h-[100px]"
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="submit">Save Report</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}