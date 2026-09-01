import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva("gd-button", {
  variants: {
    variant: {
      primary: "gd-button-primary",
      secondary: "gd-button-secondary",
      dark: "gd-button-dark",
      ghost: "gd-button-ghost"
    },
    size: {
      default: "gd-button-default",
      sm: "gd-button-sm",
      lg: "gd-button-lg",
      icon: "gd-button-icon"
    }
  },
  defaultVariants: { variant: "primary", size: "default" }
});

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export function Button({ className, variant, size, asChild = false, ...props }: ButtonProps) {
  const Comp = asChild ? Slot : "button";
  return <Comp className={cn(buttonVariants({ variant, size }), className)} {...props} />;
}

export { buttonVariants };
