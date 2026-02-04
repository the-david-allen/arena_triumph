import * as React from "react";
import { cn } from "@/lib/cn";

/**
 * Panel — elevated surface for content blocks. Uses surface-2 and subtle shadow.
 */
const Panel = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "rounded-lg border border-border bg-surface-2 text-text shadow-sm",
      className
    )}
    {...props}
  />
));
Panel.displayName = "Panel";

export { Panel };
