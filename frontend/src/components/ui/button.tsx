import { forwardRef, ButtonHTMLAttributes } from "react";
import { Loader2 } from "lucide-react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  loading?: boolean;
  variant?: "primary" | "secondary";
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ children, loading, variant = "primary", className = "", ...props }, ref) => {
    const base =
      "inline-flex items-center justify-center gap-2 rounded-lg font-semibold text-sm px-6 py-3 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed";

    const variants = {
      primary:
        "bg-gradient-to-r from-[#8234FE] to-[#26BEFE] text-white hover:from-[#7320e6] hover:to-[#1ea8e6] focus:ring-primary-300 shadow-sm hover:shadow-md",
      secondary:
        "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 focus:ring-gray-300",
    };

    return (
      <button
        ref={ref}
        {...props}
        disabled={loading || props.disabled}
        className={`${base} ${variants[variant]} ${className}`}
      >
        {loading && <Loader2 className="h-4 w-4 animate-spin" />}
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";
