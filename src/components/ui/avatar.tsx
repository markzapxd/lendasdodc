"use client";

import * as AvatarPrimitive from "@radix-ui/react-avatar";
import * as React from "react";
import { cn } from "@/lib/utils";

const Avatar = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Root>
>(({ className, ...props }, ref) => (
  <AvatarPrimitive.Root
    ref={ref}
    className={cn(
      "relative flex shrink-0 overflow-hidden rounded-full border border-border bg-charcoal-600",
      className,
    )}
    {...props}
  />
));
Avatar.displayName = AvatarPrimitive.Root.displayName;
const AvatarImage = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Image>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Image>
>(({ className, ...props }, ref) => (
  <AvatarPrimitive.Image
    ref={ref}
    className={cn("aspect-square size-full object-cover", className)}
    {...props}
  />
));
AvatarImage.displayName = AvatarPrimitive.Image.displayName;
const AvatarFallback = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Fallback>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Fallback>
>(({ className, ...props }, ref) => (
  <AvatarPrimitive.Fallback
    ref={ref}
    className={cn(
      "flex size-full items-center justify-center bg-charcoal-600 text-sm font-semibold text-text-primary",
      className,
    )}
    {...props}
  />
));
AvatarFallback.displayName = AvatarPrimitive.Fallback.displayName;

const avatarSizes = { sm: "size-8", default: "size-11", lg: "size-16" } as const;
type AvatarSize = keyof typeof avatarSizes;

type UserAvatarProps = {
  readonly src?: string;
  readonly alt?: string;
  readonly name: string;
  readonly size?: AvatarSize;
  readonly decorative?: boolean;
};

function UserAvatar({ src, alt, name, size = "default", decorative = false }: UserAvatarProps) {
  const initial = name.trim().slice(0, 1).toUpperCase() || "?";
  return (
    <Avatar className={avatarSizes[size]}>
      <AvatarImage src={src} alt={decorative ? "" : (alt ?? name)} />
      <AvatarFallback aria-hidden={decorative}>{initial}</AvatarFallback>
    </Avatar>
  );
}

export type { AvatarSize, UserAvatarProps };
export { Avatar, AvatarFallback, AvatarImage, UserAvatar };
