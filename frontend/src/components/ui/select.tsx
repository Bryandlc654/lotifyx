import { forwardRef, SelectHTMLAttributes } from "react";
import { ChevronDown } from "lucide-react";

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  error?: string;
  options: readonly string[];
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, options, className = "", ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1.5">
        <div className="relative">
          <select
            ref={ref}
            {...props}
            className={`
              w-full rounded-lg border bg-white px-3.5 py-2.5 text-sm
              text-gray-900 appearance-none cursor-pointer
              transition-colors duration-200
              focus:outline-none focus:ring-2 focus:ring-offset-0
              ${
                error
                  ? "border-red-300 focus:border-red-400 focus:ring-red-200"
                  : "border-gray-300 focus:border-primary-500 focus:ring-primary-200"
              }
              ${!props.value ? "text-gray-400" : ""}
              ${className}
            `}
          >
            <option value="" disabled className="text-gray-400">
              {label}
            </option>
            {options.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
        </div>
        {error && (
          <p className="text-xs text-red-500 mt-0.5">{error}</p>
        )}
      </div>
    );
  }
);

Select.displayName = "Select";
