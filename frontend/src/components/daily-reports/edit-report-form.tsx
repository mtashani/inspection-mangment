"use client"

import { FC, useState } from "react"
import { useForm } from "react-hook-form"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon, ChevronsUpDown, Check } from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { Textarea } from "@/components/ui/textarea"
import { useInspectors } from "@/contexts/inspectors-context"
import { ReportFormValues } from "./types"

interface EditReportFormProps {
  onSubmit: (data: ReportFormValues) => void
  onCancel: () => void
  inspectionStartDate: string
  initialValues?: ReportFormValues
}

export const EditReportForm: FC<EditReportFormProps> = ({
  onSubmit,
  onCancel,
  inspectionStartDate,
  initialValues
}) => {
  const [date, setDate] = useState<Date | undefined>(
    initialValues?.date ? new Date(initialValues.date) : new Date()
  )
  const { inspectors } = useInspectors()

  const { register, handleSubmit, watch, setValue } = useForm<ReportFormValues>({
    defaultValues: initialValues || {
      date: format(new Date(), 'yyyy-MM-dd'),
      description: "",
      inspectors: []
    }
  })

  const selectedInspectors = watch("inspectors") || []

  const disabledDays = (day: Date) => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const startDate = new Date(inspectionStartDate)
    startDate.setHours(0, 0, 0, 0)
    return day > today || day < startDate
  }

  const onFormSubmit = (data: ReportFormValues) => {
    if (!date) return

    onSubmit({
      ...data,
      date: format(date, 'yyyy-MM-dd'),
      inspectors: selectedInspectors
    })
  }

  return (
    <form onSubmit={handleSubmit(onFormSubmit)} className="flex flex-col space-y-4">
     <div className="flex flex-nowrap gap-4 items-start">
       <div className="flex-1 space-y-2">
         <label className="text-sm font-medium">Date</label>
         <Popover>
           <PopoverTrigger asChild>
             <Button
               variant="outline"
               className={cn(
                 "w-full justify-start text-left font-normal",
                 !date && "text-muted-foreground"
               )}
             >
               <CalendarIcon className="mr-2 h-4 w-4" />
               {date ? format(date, "PPP") : <span>Pick a date</span>}
             </Button>
           </PopoverTrigger>
           <PopoverContent className="w-auto p-0" align="start">
             <Calendar
               mode="single"
               selected={date}
               onSelect={setDate}
               disabled={disabledDays}
               initialFocus
             />
           </PopoverContent>
         </Popover>
       </div>

       <div className="flex-1 space-y-2">
         <label className="text-sm font-medium">Inspectors</label>
         <Popover>
           <PopoverTrigger asChild>
             <Button
               variant="outline"
               role="combobox"
               className={cn(
                 "w-full justify-between",
                 !selectedInspectors?.length && "text-muted-foreground"
               )}
             >
               {selectedInspectors.length
                 ? `${selectedInspectors.length} inspector${selectedInspectors.length > 1 ? 's' : ''} selected`
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
                     const inspectorId = inspector.id.toString()
                     const updated = selectedInspectors.includes(inspectorId)
                       ? selectedInspectors.filter(id => id !== inspectorId)
                       : [...selectedInspectors, inspectorId]
                     setValue("inspectors", updated)
                   }}
                 >
                   <div className={cn(
                     "h-4 w-4 border rounded-sm flex items-center justify-center",
                     selectedInspectors.includes(inspector.id.toString())
                       ? "bg-primary border-primary"
                       : "border-input"
                   )}>
                     {selectedInspectors.includes(inspector.id.toString()) && (
                       <Check className="h-3 w-3 text-primary-foreground" />
                     )}
                   </div>
                   <span className="text-sm">{inspector.name}</span>
                 </div>
               ))}
             </div>
           </PopoverContent>
         </Popover>
         {selectedInspectors.length === 0 && (
           <p className="text-sm text-red-500">At least one inspector is required</p>
         )}
       </div>
     </div>

     <div className="space-y-2">
        <label className="text-sm font-medium">Description</label>
        <Textarea
          {...register("description")}
          placeholder="Enter report description..."
          className="min-h-[100px] resize-none"
        />
      </div>

      <div className="col-span-2 flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button 
          type="submit" 
          disabled={!date || selectedInspectors.length === 0}
        >
          Save
        </Button>
      </div>
    </form>
  )
}