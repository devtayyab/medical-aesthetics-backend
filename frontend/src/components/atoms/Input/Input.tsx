import React from "react";
import { css } from "@emotion/css";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
  passwordToggle?: boolean;
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

const inputStyle = css`
  width: 100%;
  padding: var(--spacing-sm) var(--spacing-md);
  border: 1px solid var(--color-medical-border);
  border-radius: var(--radius-lg);
  font-size: var(--font-size-base);
  transition: all var(--transition-fast);
  background-color: var(--color-white);
  color: var(--color-medical-text);

  &:focus {
    outline: none;
    border-color: var(--color-primary);
    box-shadow: 0 0 0 4px rgba(130, 201, 30, 0.08); /* Using the new primary color */
    background-color: var(--color-white);
  }

  &:disabled {
    background-color: #F9FAFB;
    color: var(--color-medical-text-light);
    cursor: not-allowed;
    border-color: var(--color-gray-200);
  }

  &::placeholder {
    color: var(--color-medical-text-light);
  }
`;

const inputWithLeftIconStyle = css`
  padding-left: 2.75rem;
`;

const inputWithRightIconStyle = css`
  padding-right: 2.75rem;
`;

const inputErrorStyle = css`
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
  color: var(--color-gray-400); /* Subtler icon color */
`;

const rightIconStyle = css`
  ${iconStyle}
  right: 0.875rem;
  color: var(--color-gray-400); 
`;

const passwordToggleButtonStyle = css`
  position: absolute;
  top: 50%;
  right: var(--spacing-sm);
  transform: translateY(-50%);
  background: transparent;
  border: none;
  padding: 0;
  margin: 0;
  cursor: pointer;
  color: var(--color-medical-text-light);
`;



const helperTextStyle = css`
  font-size: var(--font-size-xs);
  color: var(--color-medical-text-light);
`;

const errorTextStyle = css`
  font-size: var(--font-size-xs);
  color: var(--color-error);
`;

export const Input: React.FC<InputProps> = ({
  label,
  error,
  helperText,
  leftIcon,
  rightIcon,
  fullWidth = false,
  className,
  type,
  passwordToggle = false,
  ...props
}) => {
  const isPassword = type === "password";
  const [showPassword, setShowPassword] = React.useState(false);
  const effectiveType = isPassword && passwordToggle ? (showPassword ? "text" : "password") : type;
  const describedById = props.id
    ? (error ? `${props.id}-error` : helperText ? `${props.id}-helper` : undefined)
    : undefined;
  return (
    <div
      className={`${containerStyle} ${fullWidth ? fullWidthStyle : ""} ${className || ""}`}
    >
      {label && <label className={labelStyle}>{label}</label>}

      <div className={inputWrapperStyle}>
        {leftIcon && <div className={leftIconStyle}>{leftIcon}</div>}

        <input
          className={`p-3 rounded-[12px] bg-white ${inputStyle} ${leftIcon ? inputWithLeftIconStyle : ""} ${rightIcon || (isPassword && passwordToggle) ? inputWithRightIconStyle : ""
            } ${error ? inputErrorStyle : ""}`}
          type={effectiveType}
          aria-invalid={!!error}
          aria-describedby={describedById}
          {...props}
        />

        {rightIcon && <div className={rightIconStyle}>{rightIcon}</div>}
        {isPassword && passwordToggle && (
          <button
            type="button"
            aria-label={showPassword ? "Hide password" : "Show password"}
            onClick={() => setShowPassword((s) => !s)}
            className={passwordToggleButtonStyle}
          >
            {showPassword ? "🙈" : "👁"}
          </button>
        )}
      </div>

      {error && (
        <span id={props.id ? `${props.id}-error` : undefined} className={errorTextStyle}>{error}</span>
      )}
      {!error && helperText && (
        <span id={props.id ? `${props.id}-helper` : undefined} className={helperTextStyle}>{helperText}</span>
      )}
    </div>
  );
};
