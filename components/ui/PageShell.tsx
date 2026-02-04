import * as React from "react";
import { cn } from "@/lib/cn";

export interface PageShellProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Optional max-width constraint; matches protected layout when not set */
  maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl" | "7xl" | "full";
}

const maxWidthClasses: Record<NonNullable<PageShellProps["maxWidth"]>, string> = {
  sm: "max-w-screen-sm",
  md: "max-w-screen-md",
  lg: "max-w-screen-lg",
  xl: "max-w-screen-xl",
  "2xl": "max-w-2xl",
  "7xl": "max-w-7xl",
  full: "max-w-full",
};

export const PageShell = React.forwardRef<HTMLDivElement, PageShellProps>(
  ({ className, maxWidth = "7xl", ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "mx-auto w-full px-4 py-8 sm:px-6 lg:px-8",
        maxWidthClasses[maxWidth],
        className
      )}
      {...props}
    />
  )
);
PageShell.displayName = "PageShell";
