"use client"

import { FC, useState, useCallback, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { NewInspectionFormValues, newInspectionSchema } from "./types"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { format } from "date-fns"
import { CalendarIcon, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { getEquipmentTags } from "@/api/equipment"
import { Combobox } from "@/components/ui/combobox"

interface NewInspectionFormProps {
  onSubmit: (data: NewInspectionFormValues) => Promise<void>
}

export const NewInspectionForm: FC<NewInspectionFormProps> = ({ onSubmit }) => {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [equipmentTags, setEquipmentTags] = useState<string[]>([])
  const [isLoadingTags, setIsLoadingTags] = useState(false)

  const form = useForm<NewInspectionFormValues>({
    resolver: zodResolver(newInspectionSchema),
    defaultValues: {
      equipmentTag: "",
      startDate: new Date().toISOString().split('T')[0]
    }
  })

  const loadTags = useCallback(async (search?: string) => {
    try {
      setIsLoadingTags(true)
      const tags = await getEquipmentTags(search)
      setEquipmentTags(tags)
    } catch (error) {
      console.error('Failed to load equipment tags:', error)
    } finally {
      setIsLoadingTags(false)
    }
  }, [])

  useEffect(() => {
    loadTags()
  }, [loadTags])

  const handleSubmit = async (data: NewInspectionFormValues) => {
    try {
      setIsSubmitting(true)
      await onSubmit(data)
      form.reset()
    } catch (err) {
      const error = err instanceof Error ? err.message : "An unexpected error occurred";
      if (error.includes("inspection is already in progress")) {
        form.setError("equipmentTag", {
          type: "manual",
          message: "An inspection is already in progress for this equipment"
        });
      } else {
        form.setError("equipmentTag", {
          type: "manual",
          message: error
        });
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card className="mb-4">
      <CardContent className="pt-4">
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="flex flex-wrap gap-3 items-start"
          >
            <FormField
              control={form.control}
              name="equipmentTag"
              render={({ field }) => (
                <FormItem className="flex-[2] min-h-[85px]">
                  <FormLabel className="text-sm">Equipment Tag</FormLabel>
                  <FormControl className="mb-1">
                    <Combobox
                      value={field.value}
                      onValueChange={field.onChange}
                      options={equipmentTags}
                      placeholder="Select equipment tag"
                      searchPlaceholder="Search equipment tag..."
                      isLoading={isLoadingTags}
                      disabled={isSubmitting}
                      error={!!form.formState.errors.equipmentTag}
                    />
                  </FormControl>
                  <FormMessage className="text-xs" />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="startDate"
              render={({ field }) => (
                <FormItem className="flex-1 min-h-[85px]">
                  <FormLabel className="text-sm">Start Date</FormLabel>
                  <FormControl className="mb-1">
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "w-full pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                          disabled={isSubmitting}
                        >
                          {field.value ? (
                            format(new Date(field.value), "MMM d, yyyy")
                          ) : (
                            <span>Pick a date</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
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
                          disabled={(date) => {
                            const today = new Date()
                            today.setHours(23, 59, 59, 999)
                            return date > today
                          }}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </FormControl>
                  <FormMessage className="text-xs" />
                </FormItem>
              )}
            />
            <Button 
              type="submit" 
              disabled={isSubmitting}
              className="h-10"
            >
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Create"
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}