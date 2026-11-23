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

  const describedBy =
    [error ? errorId : null, helperText ? helperId : null]
      .filter(Boolean)
      .join(" ") || undefined;

  return (
    <div className={cn("flex min-w-0 flex-col gap-1.5", containerClassName)}>
      <label
        htmlFor={inputId}
        className="text-xs font-bold tracking-wide text-fg uppercase"
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
          "min-h-12 min-w-0 w-full rounded-control border-2 bg-surface px-3.5 text-base font-semibold text-fg placeholder:font-normal placeholder:text-fg-subtle",
          "transition-colors motion-reduce:transition-none",
          "disabled:cursor-not-allowed disabled:border-fg-subtle disabled:bg-surface-muted disabled:text-fg-subtle",
          error ? "border-danger" : "border-line",
          focusRing,
          className
        )}
        {...rest}
      />

      {error && (
        <p id={errorId} role="alert" className="text-xs font-bold text-danger">
          {error}
        </p>
      )}
      {helperText && (
        <p id={helperId} className="text-xs font-medium text-fg-muted">
          {helperText}
        </p>
      )}
    </div>
  );
}
