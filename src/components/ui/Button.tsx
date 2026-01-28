import { ButtonHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "primary" | "ghost";
  size?: "default" | "sm" | "lg";
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "btn",
          variant === "primary" && "btn-primary",
          variant === "ghost" && "border-transparent hover:border-[var(--foreground)]",
          size === "sm" && "px-3 py-2 text-xs",
          size === "lg" && "px-8 py-4 text-base",
          className
        )}
        {...props}
      />
    );
  }
);

Button.displayName = "Button";

export default Button;
