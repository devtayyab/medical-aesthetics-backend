import React from 'react';
import { css } from '@emotion/css';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
  fullWidth?: boolean;
  required?: boolean;
  rows?: number;
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

const textareaStyle = css`
  width: 100%;
  padding: var(--spacing-sm) var(--spacing-md);
  border: 1px solid var(--color-medical-border);
  border-radius: var(--radius-lg);
  font-size: var(--font-size-base);
  font-family: inherit;
  transition: all var(--transition-fast);
  background-color: var(--color-white);
  color: var(--color-medical-text);
  resize: vertical;
  min-height: 80px;

  &:focus {
    outline: none;
    border-color: cornflowerblue;
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

const textareaErrorStyle = css`
  border-color: var(--color-error);

  &:focus {
    border-color: var(--color-error);
    box-shadow: 0 0 0 3px rgba(244, 67, 54, 0.1);
  }
`;

const helperTextStyle = css`
  font-size: var(--font-size-xs);
  color: var(--color-medical-text-light);
`;

const errorTextStyle = css`
  font-size: var(--font-size-xs);
  color: var(--color-error);
`;

const requiredIndicatorStyle = css`
  color: var(--color-error);
  margin-left: var(--spacing-xs);
`;

export const Textarea: React.FC<TextareaProps> = ({
  label,
  error,
  helperText,
  fullWidth = false,
  required = false,
  rows = 4,
  className,
  ...props
}) => {
  return (
    <div
      className={`${containerStyle} ${fullWidth ? fullWidthStyle : ''} ${className || ''}`}
    >
      {label && (
        <label className={labelStyle}>
          {label}
          {required && <span className={requiredIndicatorStyle}>*</span>}
        </label>
      )}

      <textarea
        className={`${textareaStyle} ${error ? textareaErrorStyle : ''}`}
        rows={rows}
        {...props}
      />

      {error && <span className={errorTextStyle}>{error}</span>}
      {!error && helperText && (
        <span className={helperTextStyle}>{helperText}</span>
      )}
    </div>
  );
};
