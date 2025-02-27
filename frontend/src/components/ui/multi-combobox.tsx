"use client"

import * as React from "react"
import { Check, ChevronsUpDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

interface Option {
  value: string
  label: string
}

interface MultiComboboxProps {
  options: Option[]
  value: string[]
  onValueChange: (value: string[]) => void
  placeholder?: string
  searchPlaceholder?: string
  isLoading?: boolean
  disabled?: boolean
  className?: string
  error?: boolean
  selectedLabel?: (count: number) => string
  emptyMessage?: string
}

export function MultiCombobox({
  options,
  value = [],
  onValueChange,
  placeholder = "Select options",
  searchPlaceholder = "Search...",
  isLoading = false,
  disabled = false,
  className,
  error = false,
  selectedLabel = (count) => `${count} item${count === 1 ? '' : 's'} selected`,
  emptyMessage = "No results found."
}: MultiComboboxProps) {
  const [open, setOpen] = React.useState(false)
  const [searchQuery, setSearchQuery] = React.useState("")

  const filteredOptions = React.useMemo(() => {
    if (!searchQuery) return options
    return options.filter((option) =>
      option.label.toLowerCase().includes(searchQuery.toLowerCase())
    )
  }, [options, searchQuery])

  return (
    <Popover
      open={open}
      onOpenChange={setOpen}
    >
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            "w-full justify-between",
            !value && "text-muted-foreground",
            error && "border-red-500 text-red-500",
            className
          )}
          disabled={disabled}
        >
          {value.length === 0
            ? placeholder
            : selectedLabel(value.length)}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0 z-50" align="start">
        <Command shouldFilter={false} className="overflow-visible">
          <CommandInput
            placeholder={searchPlaceholder}
            value={searchQuery}
            onValueChange={setSearchQuery}
            disabled={disabled}
          />
          <div className="max-h-[200px] overflow-auto">
            {isLoading ? (
              <div className="flex items-center justify-center py-6">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              </div>
            ) : filteredOptions.length === 0 ? (
              <CommandEmpty>{emptyMessage}</CommandEmpty>
            ) : (
              <CommandGroup>
                {filteredOptions.map((option) => (
                <CommandItem
                  key={option.value}
                  value={option.value}
                  onSelect={() => {
                    const newValue = value.includes(option.value)
                      ? value.filter(v => v !== option.value)
                      : [...value, option.value]
                    onValueChange(newValue)
                  }}
                  className="cursor-pointer hover:bg-accent hover:text-accent-foreground relative"
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    const newValue = value.includes(option.value)
                      ? value.filter(v => v !== option.value)
                      : [...value, option.value]
                    onValueChange(newValue)
                  }}
                >
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-2 py-1 px-1 rounded w-full">
                      <div
                        className={cn(
                          "w-4 h-4 border rounded-sm flex items-center justify-center shrink-0",
                          value.includes(option.value)
                            ? "bg-primary border-primary"
                            : "border-input"
                        )}
                      >
                        {value.includes(option.value) && (
                          <Check className="h-3 w-3 text-primary-foreground" />
                        )}
                      </div>
                      <span className="truncate">{option.label}</span>
                    </div>
                  </div>
                </CommandItem>
                ))}
              </CommandGroup>
            )}
          </div>
        </Command>
      </PopoverContent>
    </Popover>
  )
}