import { forwardRef, InputHTMLAttributes, useState } from "react";
import { Eye, EyeOff, Check } from "lucide-react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  isPassword?: boolean;
  isValid?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, isPassword, isValid, className = "", placeholder, ...props }, ref) => {
    const [showPassword, setShowPassword] = useState(false);
    const inputType = isPassword && !showPassword ? "password" : props.type || "text";
    const hasValue = typeof props.value === "string" ? props.value.length > 0 : false;

    return (
      <div className="flex flex-col gap-1.5">
        <div className="relative">
          <input
            ref={ref}
            {...props}
            type={inputType}
            placeholder={placeholder || label}
            className={`
              w-full rounded-lg border bg-white px-3.5 py-2.5 text-sm
              text-gray-900 placeholder:text-gray-400
              transition-colors duration-200
              focus:outline-none focus:ring-2 focus:ring-offset-0
              ${
                error
                  ? "border-red-300 focus:border-red-400 focus:ring-red-200"
                  : hasValue && !error
                    ? "border-green-400 focus:border-green-500 focus:ring-green-200"
                    : "border-gray-300 focus:border-primary-500 focus:ring-primary-200"
              }
              ${isPassword ? "pr-10" : ""}
              ${(hasValue && !error && !isPassword) ? "pr-9" : ""}
              ${className}
            `}
          />
          {isPassword && (
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
              tabIndex={-1}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          )}
          {hasValue && !error && !isPassword && (
            <Check className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-green-500 stroke-[3]" />
          )}
        </div>
        {error && <p className="text-xs text-red-500 mt-0.5">{error}</p>}
        {hasValue && !error && (
          <p className="text-xs text-green-600 mt-0.5">✓ Válido</p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";
