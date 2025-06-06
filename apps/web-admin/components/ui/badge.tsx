"use client"

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"
import { getCategoryName } from "@/schema/messages"

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground hover:bg-primary/80",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80",
        outline: "text-foreground",
        subtle: "bg-muted text-muted-foreground",
        success: "bg-green-500 text-white hover:bg-green-600",
        info: "bg-blue-500 text-white hover:bg-blue-600",
        warning: "bg-yellow-500 text-white hover:bg-yellow-600",
        error: "bg-red-500 text-white hover:bg-red-600",
        light: "bg-white text-black border border-gray-300 hover:bg-gray-50",
        dark: "bg-gray-800 text-white border border-gray-700 hover:bg-gray-700",
        gradient0: "bg-gradient-to-r from-teal-700 to-teal-500 text-white hover:from-blue-600 hover:to-green-600",
        gradient1: "bg-gradient-to-r from-purple-700 to-purple-500 text-white hover:from-purple-600 hover:to-pink-600",
        gradient2: "bg-gradient-to-r from-red-600 to-red-400 text-white hover:from-red-600 hover:to-yellow-600",
        gradient3: "bg-gradient-to-r from-teal-500 to-cyan-500 text-white hover:from-teal-600 hover:to-cyan-600",
        gradient4: "bg-gradient-to-r from-indigo-500 to-purple-500 text-white hover:from-indigo-600 hover:to-purple-600",
        gradient5: "bg-gradient-to-r from-pink-500 to-red-500 text-white hover:from-pink-600 hover:to-red-600",
        gradient6: "bg-gradient-to-r from-yellow-500 to-orange-500 text-white hover:from-yellow-600 hover:to-orange-600",
        gradient7: "bg-gradient-to-r from-violet-500 to-violet-700 text-white hover:from-gray-600 hover:to-gray-800",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

const getCategoryBadge = (category: string) => {
    const colors: Record<string, string> = {
      vegetables: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      fruits: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
      fish: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      meat: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
      dairy: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
      bread: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200',
      coffee: 'bg-orange-950 text-white dark:bg-orange-950 dark:text-white',
    };
    
    return (
      <Badge className={(colors[category] || 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200') + " text-xs text-nowrap w-fit mx-[2px] cursor-default flex items-center gap-1"}>
        {getCategoryName(category)}
      </Badge>
    );
  };

export { Badge, badgeVariants, getCategoryBadge }
