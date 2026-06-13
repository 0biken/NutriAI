import * as React from "react"
import { cn } from "@/lib/utils"

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /**
   * default     — Primary CTA: Vitality green pill on Forest text. Use once per section.
   * secondary   — Forest pill on Warm White text. Use on light surfaces when Vitality is unavailable.
   * outline     — Transparent with Forest border. Secondary action on light backgrounds.
   * ghost       — Hover-only background. Tertiary action / chrome.
   * destructive — Suya orange. Irreversible actions only.
   */
  variant?: "default" | "secondary" | "outline" | "ghost" | "destructive";
  size?: "default" | "sm" | "lg" | "icon";
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full font-semibold transition-brand",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-vitality focus-visible:ring-offset-2 focus-visible:ring-offset-warm-white",
          "disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]",
          {
            "bg-vitality text-forest hover:bg-vitality-d shadow-sm": variant === "default",
            "bg-forest text-warm-white hover:bg-forest-2": variant === "secondary",
            "border border-forest/25 bg-transparent text-forest hover:bg-forest/5": variant === "outline",
            "bg-transparent text-forest hover:bg-forest/8": variant === "ghost",
            "bg-suya text-white hover:bg-suya/90": variant === "destructive",

            "h-11 px-6 text-sm":  size === "default",
            "h-9 px-4 text-xs":   size === "sm",
            "h-12 px-8 text-base": size === "lg",
            "h-11 w-11 px-0":     size === "icon",
          },
          className
        )}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button }
