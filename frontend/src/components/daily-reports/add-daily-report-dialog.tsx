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

const dailyReportSchema = z.object({
  inspectionId: z.string(),
  date: z.string().min(1, "Date is required"),
  inspector: z.string().min(1, "Inspector name is required"),
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

  const form = useForm<DailyReportFormValues>({
    resolver: zodResolver(dailyReportSchema),
    defaultValues: {
      inspectionId,
      date: new Date().toISOString().split('T')[0],
      inspector: "",
      description: "",
    },
  })

  const handleSubmit = (data: DailyReportFormValues) => {
    onSubmit(data)
    setOpen(false)
    form.reset({
      inspectionId,
      date: new Date().toISOString().split('T')[0],
      inspector: "",
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
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add Daily Report</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Date</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="inspector"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Inspector Name</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                </FormItem>
              )}
            />
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