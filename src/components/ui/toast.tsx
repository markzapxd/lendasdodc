"use client";

import { CheckCircle, Warning, X, XCircle } from "@phosphor-icons/react";
import * as ToastPrimitive from "@radix-ui/react-toast";
import * as React from "react";
import { cn } from "@/lib/utils";

const ToastProvider = ToastPrimitive.Provider;
const ToastViewport = React.forwardRef<
  React.ElementRef<typeof ToastPrimitive.Viewport>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitive.Viewport>
>(({ className, ...props }, ref) => (
  <ToastPrimitive.Viewport
    ref={ref}
    className={cn(
      "fixed bottom-4 right-4 z-50 flex w-[calc(100%-2rem)] max-w-sm flex-col gap-3 outline-none sm:bottom-6 sm:right-6",
      className,
    )}
    {...props}
  />
));
ToastViewport.displayName = ToastPrimitive.Viewport.displayName;

const toastVariants = {
  default: "border-border bg-surface-elevated text-text-primary",
  success: "border-green-500 bg-surface-elevated text-text-primary",
  warning: "border-amber-500 bg-surface-elevated text-text-primary",
  error: "border-red-500 bg-red-900 text-text-primary",
} as const;
type ToastKind = keyof typeof toastVariants;

type ToastProps = React.ComponentPropsWithoutRef<typeof ToastPrimitive.Root> & {
  readonly kind?: ToastKind;
};

const Toast = React.forwardRef<React.ElementRef<typeof ToastPrimitive.Root>, ToastProps>(
  ({ className, kind = "default", ...props }, ref) => (
    <ToastPrimitive.Root
      ref={ref}
      className={cn(
        "relative grid grid-cols-[auto_1fr_auto] items-start gap-3 rounded-md border p-4 shadow-lg",
        toastVariants[kind],
        className,
      )}
      {...props}
    />
  ),
);
Toast.displayName = ToastPrimitive.Root.displayName;
const ToastTitle = React.forwardRef<
  React.ElementRef<typeof ToastPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitive.Title>
>(({ className, ...props }, ref) => (
  <ToastPrimitive.Title ref={ref} className={cn("text-sm font-semibold", className)} {...props} />
));
ToastTitle.displayName = ToastPrimitive.Title.displayName;
const ToastDescription = React.forwardRef<
  React.ElementRef<typeof ToastPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitive.Description>
>(({ className, ...props }, ref) => (
  <ToastPrimitive.Description
    ref={ref}
    className={cn("text-sm text-text-secondary", className)}
    {...props}
  />
));
ToastDescription.displayName = ToastPrimitive.Description.displayName;
const ToastClose = React.forwardRef<
  React.ElementRef<typeof ToastPrimitive.Close>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitive.Close>
>(({ className, ...props }, ref) => (
  <ToastPrimitive.Close
    ref={ref}
    className={cn(
      "inline-flex size-11 items-center justify-center rounded-md text-text-secondary hover:bg-charcoal-600 hover:text-text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus",
      className,
    )}
    toast-close="true"
    aria-label="Dispensar aviso"
    {...props}
  >
    <X className="size-4" aria-hidden="true" />
  </ToastPrimitive.Close>
));
ToastClose.displayName = ToastPrimitive.Close.displayName;

function ToastIcon({ kind }: { readonly kind: ToastKind }) {
  if (kind === "success")
    return <CheckCircle className="mt-0.5 size-5 text-green-500" aria-hidden="true" />;
  if (kind === "warning")
    return <Warning className="mt-0.5 size-5 text-amber-500" aria-hidden="true" />;
  if (kind === "error")
    return <XCircle className="mt-0.5 size-5 text-red-500" aria-hidden="true" />;
  return null;
}

export type { ToastKind, ToastProps };
export { Toast, ToastClose, ToastDescription, ToastIcon, ToastProvider, ToastTitle, ToastViewport };
