import * as React from "react"
import { cn } from "@/lib/utils"
// Note: Radix Slot is optional, using standard button for now if not installed.
// We'll stick to standard button to avoid extra Install steps for Radix.

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'outline';
  size?: 'sm' | 'md' | 'lg';
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', ...props }, ref) => {
    
    const variants = {
      primary: "bg-gradient-to-br from-primary to-[#0284C7] text-white shadow-soft-md hover:shadow-soft-lg hover:-translate-y-0.5 border border-transparent",
      secondary: "bg-white text-slate-900 border border-slate-200 shadow-soft-sm hover:bg-slate-50 hover:border-slate-300 hover:-translate-y-0.5",
      ghost: "bg-transparent text-primary hover:bg-primary/5",
      outline: "bg-transparent border border-white/20 text-white hover:bg-white/10"
    }
    
    const sizes = {
      sm: "h-9 px-4 text-sm",
      md: "h-12 px-6 text-base",
      lg: "h-14 px-8 text-lg"
    }

    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center rounded-full font-semibold transition-all duration-300 active:scale-95 disabled:opacity-50",
          variants[variant],
          sizes[size],
          className
        )}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button }
