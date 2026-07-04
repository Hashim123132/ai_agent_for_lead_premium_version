"use client"

import * as React from "react"

import { cn } from "@/lib/utils"
import { SearchIcon, CheckIcon } from "lucide-react"

interface CommandContextValue {
  value: string
  onValueChange: (value: string) => void
  selectedValue: string
  onSelectedChange: (value: string) => void
}

const CommandContext = React.createContext<CommandContextValue | null>(null)

function useCommandContext() {
  const ctx = React.useContext(CommandContext)
  if (!ctx) throw new Error("Command components must be used within <CommandRoot>")
  return ctx
}

function CommandRoot({
  className,
  children,
  value,
  onValueChange,
  selectedValue,
  onSelectedChange,
  ...props
}: React.ComponentProps<"div"> & {
  value: string
  onValueChange: (value: string) => void
  selectedValue: string
  onSelectedChange: (value: string) => void
}) {
  return (
    <CommandContext.Provider value={{ value, onValueChange, selectedValue, onSelectedChange }}>
      <div
        data-slot="command"
        className={cn(
          "flex size-full flex-col overflow-hidden rounded-lg bg-popover text-popover-foreground",
          className
        )}
        {...props}
      >
        {children}
      </div>
    </CommandContext.Provider>
  )
}

function CommandInput({
  className,
  placeholder = "Search...",
  ...props
}: Omit<React.ComponentProps<"input">, "value" | "onChange"> & {
  placeholder?: string
}) {
  const { value, onValueChange } = useCommandContext()
  return (
    <div
      data-slot="command-input-wrapper"
      className="flex items-center gap-2 border-b border-border px-3"
    >
      <SearchIcon className="size-4 shrink-0 text-muted-foreground" />
      <input
        data-slot="command-input"
        value={value}
        onChange={(e) => onValueChange(e.target.value)}
        placeholder={placeholder}
        className={cn(
          "flex h-10 w-full rounded-lg bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        {...props}
      />
    </div>
  )
}

function CommandList({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="command-list"
      className={cn(
        "max-h-72 overflow-y-auto overflow-x-hidden p-1",
        className
      )}
      {...props}
    />
  )
}

function CommandEmpty({
  className,
  children,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="command-empty"
      className={cn("py-6 text-center text-sm text-muted-foreground", className)}
      {...props}
    >
      {children}
    </div>
  )
}

function CommandGroup({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="command-group"
      className={cn(
        "overflow-hidden p-1 text-foreground",
        className
      )}
      {...props}
    />
  )
}

function CommandItem({
  className,
  value: itemValue,
  children,
  onClick,
  ...props
}: React.ComponentProps<"div"> & { value: string }) {
  const { selectedValue, onSelectedChange } = useCommandContext()
  const selected = selectedValue === itemValue

  return (
    <div
      data-slot="command-item"
      data-selected={selected || undefined}
      onClick={(e) => {
        onSelectedChange(itemValue)
        onClick?.(e)
      }}
      className={cn(
        "relative flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm outline-none select-none hover:bg-accent hover:text-accent-foreground data-[selected=true]:bg-accent data-[selected=true]:text-accent-foreground [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        className
      )}
      {...props}
    >
      {children}
      {selected && <CheckIcon className="ml-auto size-4" />}
    </div>
  )
}

export {
  CommandRoot as Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
}
