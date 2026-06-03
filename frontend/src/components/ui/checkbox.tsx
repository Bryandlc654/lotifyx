import { forwardRef, InputHTMLAttributes } from "react";
import { Check } from "lucide-react";

interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  label: string | React.ReactNode;
  error?: string;
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ label, error, className = "", ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1">
        <label className="flex items-start gap-3 cursor-pointer group">
          <div className="relative mt-0.5">
            <input
              ref={ref}
              type="checkbox"
              {...props}
              className="sr-only peer"
            />
            <div
              className={`
                h-5 w-5 rounded border-2 flex items-center justify-center
                transition-colors duration-200
                peer-focus-visible:ring-2 peer-focus-visible:ring-primary-200 peer-focus-visible:ring-offset-2
                ${
                  props.checked
                    ? "bg-primary-600 border-primary-600"
                    : "border-gray-300 group-hover:border-primary-400"
                }
              `}
            >
              {props.checked && <Check className="h-3.5 w-3.5 text-white stroke-[3]" />}
            </div>
          </div>
          <span className="text-sm text-gray-600 select-none">{label}</span>
        </label>
        {error && (
          <p className="text-xs text-red-500 ml-8">{error}</p>
        )}
      </div>
    );
  }
);

Checkbox.displayName = "Checkbox";
