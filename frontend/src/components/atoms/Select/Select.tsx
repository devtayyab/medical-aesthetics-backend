import React from 'react';
import { css } from "@emotion/css";

interface Option {
  value: string;
  label: string;
}

export interface SelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'onChange'> {
  label?: string;
  options: Option[];
  placeholder?: string;
  error?: string | boolean;
  helperText?: string;
  leftIcon?: React.ReactNode;
  fullWidth?: boolean;
  onChange?: (value: string) => void;
}

const containerStyle = css`
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
`;

const fullWidthStyle = css`
  width: 100%;
`;

const labelStyle = css`
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  color: var(--color-medical-text);
`;

const inputWrapperStyle = css`
  position: relative;
  display: flex;
  align-items: center;
`;

const selectStyle = css`
  width: 100%;
  padding: var(--spacing-sm) var(--spacing-md);
  border: 1px solid var(--color-medical-border);
  border-radius: var(--radius-lg);
  font-size: var(--font-size-base);
  transition: all var(--transition-fast);
  background-color: var(--color-white);
  color: var(--color-medical-text);
  appearance: none;
  background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e");
  background-position: right 0.5rem center;
  background-repeat: no-repeat;
  background-size: 1.5em 1.5em;

  &:focus {
    outline: none;
    border-color: var(--color-primary);
    box-shadow: 0 0 0 4px rgba(130, 201, 30, 0.08);
  }

  &:disabled {
    background-color: #F9FAFB;
    color: var(--color-medical-text-light);
    cursor: not-allowed;
    border-color: var(--color-gray-200);
  }
`;

const selectWithLeftIconStyle = css`
  padding-left: 2.75rem;
`;

const selectErrorStyle = css`
  border-color: var(--color-error);
  &:focus {
    border-color: var(--color-error);
    box-shadow: 0 0 0 3px rgba(244, 67, 54, 0.1);
  }
`;

const iconStyle = css`
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  color: var(--color-medical-text-light);
  pointer-events: none;
`;

const leftIconStyle = css`
  ${iconStyle}
  left: 0.875rem;
  color: var(--color-gray-400);
`;

const helperTextStyle = css`
  font-size: var(--font-size-xs);
  color: var(--color-medical-text-light);
`;

const errorTextStyle = css`
  font-size: var(--font-size-xs);
  color: var(--color-error);
`;

export const Select: React.FC<SelectProps> = ({
  label,
  options,
  placeholder = 'Select an option',
  error,
  helperText,
  leftIcon,
  fullWidth = false,
  className,
  value,
  onChange,
  disabled,
  ...props
}) => {
  const hasError = !!error;
  const errorMessage = typeof error === 'string' ? error : undefined;

  return (
    <div className={`${containerStyle} ${fullWidth ? fullWidthStyle : ""} ${className || ""}`}>
      {label && <label className={labelStyle}>{label}</label>}

      <div className={inputWrapperStyle}>
        {leftIcon && <div className={leftIconStyle}>{leftIcon}</div>}

        <select
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
          disabled={disabled}
          className={`p-3 rounded-[12px] bg-white ${selectStyle} ${leftIcon ? selectWithLeftIconStyle : ""} ${hasError ? selectErrorStyle : ""
            }`}
          {...props}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {hasError && errorMessage && (
        <span className={errorTextStyle}>{errorMessage}</span>
      )}
      {!hasError && helperText && (
        <span className={helperTextStyle}>{helperText}</span>
      )}
    </div>
  );
};
