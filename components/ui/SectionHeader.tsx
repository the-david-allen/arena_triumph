import * as React from "react";
import { cn } from "@/lib/cn";

export interface SectionHeaderProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "title"> {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  /** Heading level for the title */
  as?: "h1" | "h2" | "h3" | "h4";
}

export const SectionHeader = React.forwardRef<HTMLDivElement, SectionHeaderProps>(
  ({ className, title, subtitle, as: Heading = "h2", ...props }, ref) => (
    <div
      ref={ref}
      className={cn("space-y-1", className)}
      {...props}
    >
      <Heading className="font-display text-text text-2xl font-semibold tracking-tight sm:text-3xl">
        {title}
      </Heading>
      {subtitle != null && (
        <p className="text-muted-foreground text-base">
          {subtitle}
        </p>
      )}
    </div>
  )
);
SectionHeader.displayName = "SectionHeader";
