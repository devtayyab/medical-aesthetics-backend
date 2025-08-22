import React from 'react';
import { css } from '@emotion/css';
import { Loader2 } from 'lucide-react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  fullWidth?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const buttonStyles = css`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-sm);
  font-weight: var(--font-weight-medium);
  border-radius: var(--radius-lg);
  border: 1px solid transparent;
  cursor: pointer;
  transition: all var(--transition-fast);
  text-decoration: none;
  white-space: nowrap;
  
  &:focus-visible {
    outline: 2px solid var(--color-primary);
    outline-offset: 2px;
  }
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const variantStyles = {
  primary: css`
    background-color: var(--color-primary);
    color: var(--color-white);
    box-shadow: var(--shadow-button);
    font-weight: var(--font-weight-semibold);
    
    &:hover:not(:disabled) {
      background-color: var(--color-primary-dark);
      transform: translateY(-1px);
      box-shadow: var(--shadow-lg);
    }
  `,
  secondary: css`
    background-color: var(--color-secondary);
    color: var(--color-white);
    box-shadow: var(--shadow-button);
    font-weight: var(--font-weight-semibold);
    
    &:hover:not(:disabled) {
      background-color: var(--color-secondary-dark);
      transform: translateY(-1px);
      box-shadow: var(--shadow-lg);
    }
  `,
  outline: css`
    background-color: transparent;
    color: var(--color-primary);
    border-color: var(--color-primary);
    font-weight: var(--font-weight-semibold);
    
    &:hover:not(:disabled) {
      background-color: var(--color-primary);
      color: var(--color-white);
      transform: translateY(-1px);
      box-shadow: var(--shadow-button);
    }
  `,
  ghost: css`
    background-color: transparent;
    color: var(--color-medical-text);
    font-weight: var(--font-weight-medium);
    
    &:hover:not(:disabled) {
      background-color: var(--color-medical-bg);
    }
  `,
  danger: css`
    background-color: var(--color-error);
    color: var(--color-white);
    font-weight: var(--font-weight-semibold);
    
    &:hover:not(:disabled) {
      background-color: #dc2626;
      transform: translateY(-1px);
    }
  `,
};

const sizeStyles = {
  sm: css`
    padding: var(--spacing-sm) var(--spacing-md);
    font-size: var(--font-size-sm);
    min-height: 2rem;
  `,
  md: css`
    padding: var(--spacing-sm) var(--spacing-lg);
    font-size: var(--font-size-base);
    min-height: 2.5rem;
  `,
  lg: css`
    padding: var(--spacing-md) var(--spacing-xl);
    font-size: var(--font-size-lg);
    min-height: 3rem;
  `,
};

const fullWidthStyle = css`
  width: 100%;
`;

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  fullWidth = false,
  leftIcon,
  rightIcon,
  children,
  disabled,
  className,
  ...props
}) => {
  return (
    <button
      className={`${buttonStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${
        fullWidth ? fullWidthStyle : ''
      } ${className || ''}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <Loader2 size={16} className={css`animation: spin 1s linear infinite;`} />
      ) : (
        leftIcon
      )}
      {children}
      {!isLoading && rightIcon}
    </button>
  );
};