"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

type InputProps = Omit<React.ComponentPropsWithoutRef<"input">, "type"> & {
  readonly label?: string;
  readonly description?: string;
  readonly error?: string;
  readonly type?: "text" | "email" | "password" | "search";
};

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, id, label, description, error, type = "text", required, ...props }, ref) => {
    const generatedId = React.useId();
    const inputId = id ?? generatedId;
    const descriptionId = `${inputId}-description`;
    const errorId = `${inputId}-error`;
    const describedBy = [description ? descriptionId : null, error ? errorId : null]
      .filter((value): value is string => value !== null)
      .join(" ");

    return (
      <div className="grid gap-2">
        {label ? (
          <label className="text-sm font-medium text-text-primary" htmlFor={inputId}>
            {label}
            {required ? <span className="ml-1 text-red-500">*</span> : null}
          </label>
        ) : null}
        <input
          ref={ref}
          id={inputId}
          type={type}
          required={required}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy || undefined}
          className={cn(
            "min-h-11 w-full rounded-md border bg-charcoal-900 px-3 text-base text-text-primary outline-none transition-colors placeholder:text-charcoal-200 hover:border-border-strong focus-visible:border-border-strong focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus disabled:cursor-not-allowed disabled:opacity-50",
            error && "border-red-500 focus-visible:outline-red-500",
            className,
          )}
          {...props}
        />
        {description ? (
          <p id={descriptionId} className="text-sm text-text-secondary">
            {description}
          </p>
        ) : null}
        {error ? (
          <p id={errorId} className="text-sm text-red-500" role="alert">
            {error}
          </p>
        ) : null}
      </div>
    );
  },
);
Input.displayName = "Input";

export type { InputProps };
