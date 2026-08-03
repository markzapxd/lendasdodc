"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

type TextareaProps = React.ComponentPropsWithoutRef<"textarea"> & {
  readonly label?: string;
  readonly description?: string;
  readonly error?: string;
  readonly autoResize?: boolean;
  readonly showCount?: boolean;
};

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      className,
      id,
      label,
      description,
      error,
      autoResize = false,
      showCount = false,
      required,
      onInput,
      ...props
    },
    ref,
  ) => {
    const generatedId = React.useId();
    const textareaId = id ?? generatedId;
    const [characterCount, setCharacterCount] = React.useState(
      () => String(props.defaultValue ?? "").length,
    );
    const descriptionId = `${textareaId}-description`;
    const errorId = `${textareaId}-error`;
    const describedBy = [description ? descriptionId : null, error ? errorId : null]
      .filter((value): value is string => value !== null)
      .join(" ");

    function handleInput(event: React.InputEvent<HTMLTextAreaElement>) {
      setCharacterCount(event.currentTarget.value.length);
      if (autoResize) {
        event.currentTarget.style.height = "auto";
        event.currentTarget.style.height = `${event.currentTarget.scrollHeight}px`;
      }
      onInput?.(event);
    }

    return (
      <div className="grid gap-2">
        {label ? (
          <label className="text-sm font-medium text-text-primary" htmlFor={textareaId}>
            {label}
            {required ? <span className="ml-1 text-red-500">*</span> : null}
          </label>
        ) : null}
        <textarea
          ref={ref}
          id={textareaId}
          required={required}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy || undefined}
          onInput={handleInput}
          className={cn(
            "min-h-32 w-full resize-y rounded-md border bg-charcoal-900 px-3 py-3 text-base leading-6 text-text-primary outline-none transition-colors placeholder:text-charcoal-200 hover:border-border-strong focus-visible:border-border-strong focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus disabled:cursor-not-allowed disabled:opacity-50",
            autoResize && "resize-none overflow-hidden",
            error && "border-red-500 focus-visible:outline-red-500",
            className,
          )}
          {...props}
        />
        <div className="flex items-start justify-between gap-4">
          {description ? (
            <p id={descriptionId} className="text-sm text-text-secondary">
              {description}
            </p>
          ) : (
            <span />
          )}
          {showCount ? (
            <span className="shrink-0 text-sm text-text-secondary">
              {characterCount}
              {props.maxLength ? `/${props.maxLength}` : ""}
            </span>
          ) : null}
        </div>
        {error ? (
          <p id={errorId} className="text-sm text-red-500" role="alert">
            {error}
          </p>
        ) : null}
      </div>
    );
  },
);
Textarea.displayName = "Textarea";

export type { TextareaProps };
