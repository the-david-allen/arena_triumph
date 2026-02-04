import * as React from "react";
import { recipe } from "@/lib/recipe";
import { cn } from "@/lib/cn";

const badgeRecipe = recipe({
  base: "inline-flex items-center rounded-md px-2.5 py-0.5 text-xs font-medium",
  variants: {
    variant: {
      default: "bg-secondary text-secondary-foreground",
      primary: "bg-primary text-primary-foreground",
      muted: "bg-surface-2 text-muted-foreground",
      danger: "bg-danger/15 text-danger",
    },
  },
  defaultVariants: {
    variant: "default",
  },
});

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    Partial<{ variant: "default" | "primary" | "muted" | "danger" }> {}

export const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant = "default", ...props }, ref) => (
    <span
      ref={ref}
      className={cn(badgeRecipe({ variant }), className)}
      {...props}
    />
  )
);
Badge.displayName = "Badge";
