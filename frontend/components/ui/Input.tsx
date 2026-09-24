"use client";

import React, { forwardRef, useId } from "react";
import { cn } from "@/lib/utils";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      id,
      label,
      error,
      helperText,
      leftIcon,
      rightIcon,
      type = "text",
      disabled,
      ...props
    },
    ref
  ) => {
    const generatedId = useId();
    const inputId = id || generatedId;
    const errorId = `${inputId}-error`;
    const helperId = `${inputId}-helper`;

    const describedBy = error
      ? errorId
      : helperText
      ? helperId
      : undefined;

    return (
      <div className="w-full flex flex-col gap-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="text-sm font-medium text-slate-800 dark:text-slate-200 select-none"
          >
            {label}
            {props.required && (
              <span className="text-rose-600 ml-0.5" aria-hidden="true">
                *
              </span>
            )}
          </label>
        )}

        <div className="relative flex items-center">
          {leftIcon && (
            <span
              className="absolute left-3 flex items-center justify-center pointer-events-none text-slate-400 dark:text-slate-500"
              aria-hidden="true"
            >
              {leftIcon}
            </span>
          )}

          <input
            ref={ref}
            id={inputId}
            type={type}
            disabled={disabled}
            aria-invalid={Boolean(error)}
            aria-describedby={describedBy}
            className={cn(
              "w-full rounded-lg border bg-white px-3.5 py-2 text-sm text-slate-900 transition-colors duration-150",
              "placeholder:text-slate-400 shadow-2xs",
              "focus:outline-none focus:ring-2 focus:ring-offset-0",
              "disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400 disabled:border-slate-200",
              "dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500",
              "dark:disabled:bg-slate-800/50 dark:disabled:text-slate-600 dark:disabled:border-slate-800",
              leftIcon ? "pl-9" : "",
              rightIcon ? "pr-9" : "",
              error
                ? "border-rose-500 text-rose-900 focus:border-rose-600 focus:ring-rose-500/20 dark:border-rose-600 dark:text-rose-100"
                : "border-slate-300 focus:border-emerald-600 focus:ring-emerald-500/20 dark:border-slate-700 dark:focus:border-emerald-500",
              className
            )}
            {...props}
          />

          {rightIcon && (
            <span
              className="absolute right-3 flex items-center justify-center text-slate-400 dark:text-slate-500"
            >
              {rightIcon}
            </span>
          )}
        </div>

        {error && (
          <p
            id={errorId}
            role="alert"
            className="text-xs font-medium text-rose-600 dark:text-rose-400"
          >
            {error}
          </p>
        )}

        {!error && helperText && (
          <p
            id={helperId}
            className="text-xs text-slate-500 dark:text-slate-400"
          >
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";

export default Input;
