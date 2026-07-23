"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

function Tabs({
  value,
  onValueChange,
  children,
  className,
  ...props
}: {
  value?: string
  onValueChange?: (v: string) => void
  children?: React.ReactNode
} & React.ComponentProps<"div">) {
  return (
    <div className={cn("", className)} {...props}>
      {children}
    </div>
  )
}

function TabsList({
  children,
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      role="tablist"
      className={cn(
        "inline-flex h-10 items-center justify-center rounded-lg bg-muted p-1 text-muted-foreground",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  )
}

function TabsTrigger({
  value,
  children,
  className,
  ...props
}: { value: string; children?: React.ReactNode } & React.ComponentProps<"button">) {
  const ctx = React.useContext(TabsContext)
  const selected = ctx?.value === value
  return (
    <button
      role="tab"
      data-state={selected ? "active" : "inactive"}
      onClick={() => ctx?.onValueChange?.(value)}
      className={cn(
        "inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
        selected && "bg-background text-foreground shadow-sm",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  )
}

function TabsContent({
  value,
  children,
  className,
  ...props
}: { value: string; children?: React.ReactNode } & React.ComponentProps<"div">) {
  const ctx = React.useContext(TabsContext)
  if (ctx?.value !== value) return null
  return (
    <div
      role="tabpanel"
      className={cn("mt-2", className)}
      {...props}
    >
      {children}
    </div>
  )
}

const TabsContext = React.createContext<{
  value: string
  onValueChange: (v: string) => void
} | null>(null)

function TabsRoot({
  value,
  onValueChange,
  children,
  ...props
}: {
  value: string
  onValueChange: (v: string) => void
  children?: React.ReactNode
}) {
  return (
    <TabsContext.Provider value={{ value, onValueChange }}>
      <Tabs {...props}>{children}</Tabs>
    </TabsContext.Provider>
  )
}

export { TabsRoot as Tabs, TabsList, TabsTrigger, TabsContent }
