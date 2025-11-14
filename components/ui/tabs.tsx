"use client"

import * as React from "react"
import * as TabsPrimitive from "@radix-ui/react-tabs"

import { cn } from "@/lib/utils"

function Tabs({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Root>) {
  return (
    <TabsPrimitive.Root
      data-slot="tabs"
      className={cn("flex flex-col gap-2", className)}
      {...props}
    />
  )
}

interface TabsListProps extends React.ComponentProps<typeof TabsPrimitive.List> {
  variant?: "default" | "service"
  size?: "sm" | "md" | "lg"
}

function TabsList({
  className,
  variant = "default",
  size = "md",
  ...props
}: TabsListProps) {
  return (
    <TabsPrimitive.List
      data-slot="tabs-list"
      className={cn(
        cn(
          "inline-flex w-fit items-center justify-center rounded-lg",
          size === "sm" ? "h-8 p-0.5" : size === "lg" ? "h-12 p-1" : "h-9 p-[3px]"
        ),
        variant === "service"
          ? "bg-gradient-to-r from-[var(--theme-primary-50)] via-[var(--theme-secondary-100)] to-[var(--theme-accent-50)] backdrop-blur-sm border border-[var(--theme-primary-200)] text-[color:var(--theme-neutral-700)] shadow-lg"
          : "bg-muted text-muted-foreground",
        className
      )}
      {...props}
    />
  )
}

interface TabsTriggerProps extends React.ComponentProps<typeof TabsPrimitive.Trigger> {
  variant?: "default" | "service"
  size?: "sm" | "md" | "lg"
}

function TabsTrigger({
  className,
  variant = "default",
  size = "md",
  ...props
}: TabsTriggerProps) {
  return (
    <TabsPrimitive.Trigger
      data-slot="tabs-trigger"
      className={cn(
        "inline-flex h-[calc(100%-1px)] flex-1 items-center justify-center gap-1.5 rounded-md border border-transparent whitespace-nowrap focus-visible:ring-[3px] focus-visible:outline-1 focus-visible:border-ring focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        variant === "service"
          ? "data-[state=active]:bg-gradient-to-r data-[state=active]:from-[var(--theme-primary-500)] data-[state=active]:to-[var(--theme-secondary-600)] data-[state=active]:text-white data-[state=active]:shadow-md data-[state=inactive]:text-[var(--theme-neutral-700)] data-[state=inactive]:hover:text-[var(--theme-primary-600)] data-[state=inactive]:hover:bg-[var(--theme-primary-50)] transition-all duration-200"
          : "data-[state=active]:bg-background data-[state=active]:shadow-sm text-foreground dark:text-muted-foreground dark:data-[state=active]:text-foreground dark:data-[state=active]:border-input dark:data-[state=active]:bg-input/30 transition-[color,box-shadow]",
        size === "sm" ? "px-2 py-1 text-xs" : size === "lg" ? "px-4 py-2 text-sm" : "px-3 py-2 text-sm",
        className
      )}
      {...props}
    />
  )
}

function TabsContent({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Content>) {
  return (
    <TabsPrimitive.Content
      data-slot="tabs-content"
      className={cn("flex-1 outline-none", className)}
      {...props}
    />
  )
}

export { Tabs, TabsList, TabsTrigger, TabsContent }
