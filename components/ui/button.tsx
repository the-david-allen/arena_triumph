import * as React from "react";
import { recipe } from "@/lib/recipe";
import { cn } from "@/lib/cn";

const buttonRecipe = recipe({
  base: [
    "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium",
    "transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
    "disabled:pointer-events-none disabled:opacity-50",
    "ring-offset-bg",
  ].join(" "),
  variants: {
    variant: {
      primary:
        "bg-primary text-primary-foreground hover:bg-primary/90 active:bg-primary/80",
      secondary:
        "bg-secondary text-secondary-foreground hover:bg-secondary/80 active:bg-secondary/70",
      ghost:
        "hover:bg-surface-2 hover:text-text active:bg-surface-2/80",
      danger:
        "bg-danger text-danger-foreground hover:bg-danger/90 active:bg-danger/80",
      link:
        "text-primary underline-offset-4 hover:underline",
      default:
        "bg-primary text-primary-foreground hover:bg-primary/90 active:bg-primary/80",
      destructive:
        "bg-danger text-danger-foreground hover:bg-danger/90 active:bg-danger/80",
      outline:
        "border border-border bg-bg hover:bg-surface hover:text-text",
    },
    size: {
      sm: "h-9 rounded-md px-3",
      md: "h-10 px-4 py-2",
      lg: "h-11 rounded-md px-8",
      icon: "h-10 w-10",
      default: "h-10 px-4 py-2",
    },
    fullWidth: {
      true: "w-full",
      false: "",
    },
    loading: {
      true: "pointer-events-none opacity-70",
      false: "",
    },
  },
  defaultVariants: {
    variant: "default",
    size: "default",
    fullWidth: "false",
    loading: "false",
  },
});

export type ButtonVariant = keyof typeof buttonRecipe extends (p: infer P) => string
  ? P extends { variant?: infer V } ? V : never
  : never;
export type ButtonSize = keyof typeof buttonRecipe extends (p: infer P) => string
  ? P extends { size?: infer S } ? S : never
  : never;

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger" | "link" | "default" | "destructive" | "outline";
  size?: "sm" | "md" | "lg" | "icon" | "default";
  fullWidth?: boolean;
  loading?: boolean;
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "default",
      size = "default",
      fullWidth = false,
      loading = false,
      disabled,
      asChild = false,
      children,
      ...props
    },
    ref
  ) => {
    const recipeClassName = buttonRecipe({
      variant,
      size,
      fullWidth: fullWidth ? "true" : "false",
      loading: loading ? "true" : "false",
      className,
    });

    if (asChild && React.isValidElement(children)) {
      return React.cloneElement(children as React.ReactElement<{ className?: string; ref?: React.Ref<unknown> }>, {
        className: cn(recipeClassName, (children as React.ReactElement).props?.className),
        ref,
      });
    }

    return (
      <button
        className={recipeClassName}
        ref={ref}
        disabled={disabled ?? loading}
        {...props}
      >
        {children}
      </button>
    );
  }
);
Button.displayName = "Button";

export function buttonVariants(
  props: Parameters<typeof buttonRecipe>[0]
): string {
  return buttonRecipe(props);
}

export { Button };
