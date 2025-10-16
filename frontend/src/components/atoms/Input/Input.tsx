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
    border-color:cornflowerblue;
    box-shadow: 0 0 0 3px rgba(124, 179, 66, 0.1);
  }

  &:disabled {
    background-color: var(--color-medical-bg);
    color: var(--color-medical-text-light);
    cursor: not-allowed;
  }

  &::placeholder {
    color: var(--color-medical-text-light);
  }
`;

const inputWithLeftIconStyle = css`
  padding-left: 2.5rem;
`;

const inputWithRightIconStyle = css`
  padding-right: 2.5rem;
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
  left: var(--spacing-sm);
`;

const rightIconStyle = css`
  ${iconStyle}
  right: var(--spacing-sm);
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
  ...props
}) => {
  return (
    <div
      className={`${containerStyle} ${fullWidth ? fullWidthStyle : ""} ${className || ""}`}
    >
      {label && <label className={labelStyle}>{label}</label>}

      <div className={inputWrapperStyle}>
        {leftIcon && <div className={leftIconStyle}>{leftIcon}</div>}

        <input
          className={`p-3 rounded-[12px] bg-white ${inputStyle} ${leftIcon ? inputWithLeftIconStyle : ""} ${
            rightIcon ? inputWithRightIconStyle : ""
          } ${error ? inputErrorStyle : ""}`}
          {...props}
        />

        {rightIcon && <div className={rightIconStyle}>{rightIcon}</div>}
      </div>

      {error && <span className={errorTextStyle}>{error}</span>}
      {!error && helperText && (
        <span className={helperTextStyle}>{helperText}</span>
      )}
    </div>
  );
};
