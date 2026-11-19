import { useId, type InputHTMLAttributes } from "react";
import { cn, focusRing } from "./cn";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  helperText?: string;
  error?: string;
  containerClassName?: string;
}

export function Input({
  id,
  label,
  helperText,
  error,
  required,
  disabled,
  className,
  containerClassName,
  ...rest
}: InputProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const helperId = `${inputId}-helper`;
  const errorId = `${inputId}-error`;

  const describedBy = [
    error ? errorId : null,
    helperText ? helperId : null,
  ]
    .filter(Boolean)
    .join(" ") || undefined;

  return (
    <div className={cn("flex flex-col gap-1.5", containerClassName)}>
      <label
        htmlFor={inputId}
        className="text-sm font-medium text-fg"
      >
        <span>{label}</span>
        {required && (
          <span aria-hidden="true" className="ml-0.5 text-danger">
            *
          </span>
        )}
      </label>

      <input
        id={inputId}
        required={required}
        disabled={disabled}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        className={cn(
          "min-h-11 w-full rounded-control border bg-surface px-3.5 text-base text-fg placeholder:text-fg-muted",
          "transition-colors motion-reduce:transition-none",
          "disabled:cursor-not-allowed disabled:bg-surface-muted disabled:opacity-70",
          error ? "border-danger" : "border-line-strong",
          focusRing,
          className
        )}
        {...rest}
      />

      {error && (
        <p id={errorId} role="alert" className="text-xs font-medium text-danger">
          {error}
        </p>
      )}
      {helperText && (
        <p id={helperId} className="text-xs text-fg-muted">
          {helperText}
        </p>
      )}
    </div>
  );
}
