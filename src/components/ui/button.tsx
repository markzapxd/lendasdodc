"use client";

import { CircleNotch } from "@phosphor-icons/react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-md px-4 text-sm font-semibold transition-colors duration-150 ease-in-out focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus active:translate-y-px disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-red-500 text-text-inverse hover:bg-red-600 active:bg-red-700",
        secondary: "bg-charcoal-600 text-text-primary hover:bg-charcoal-500 active:bg-charcoal-400",
        destructive: "bg-red-500 text-text-inverse hover:bg-red-600 active:bg-red-700",
        ghost: "bg-transparent text-text-primary hover:bg-charcoal-600 active:bg-charcoal-500",
        link: "min-h-11 rounded-none bg-transparent px-1 text-red-500 underline-offset-4 hover:text-red-500 hover:underline",
        outline:
          "border border-border-strong bg-transparent text-text-primary hover:bg-charcoal-600 active:bg-charcoal-500",
      },
      size: {
        sm: "min-h-11 px-3 text-xs",
        default: "min-h-11 px-4 text-sm",
        lg: "min-h-12 px-6 text-base",
        icon: "w-11 px-0",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  },
);

type ButtonProps = React.ComponentPropsWithoutRef<"button"> &
  VariantProps<typeof buttonVariants> & {
    readonly asChild?: boolean;
    readonly loading?: boolean;
  };

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { className, variant, size, asChild = false, loading = false, disabled, children, ...props },
    ref,
  ) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={disabled || loading || undefined}
        aria-busy={loading || undefined}
        {...props}
      >
        {loading ? (
          <CircleNotch className="size-4 motion-safe:animate-spin" aria-hidden="true" />
        ) : null}
        {children}
      </Comp>
    );
  },
);
Button.displayName = "Button";

export type { ButtonProps };
export { buttonVariants };
