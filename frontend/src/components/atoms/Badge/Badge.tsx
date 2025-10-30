import React from 'react';
import { css } from '@emotion/css';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info' | 'secondary' | 'outline';
  size?: 'sm' | 'md';
}

const badgeStyles = css`
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-xs);
  font-weight: var(--font-weight-medium);
  border-radius: var(--radius-full);
  border: 1px solid transparent;
  transition: all var(--transition-fast);
  white-space: nowrap;
`;

const variantStyles = {
  default: css`
    background-color: var(--color-gray-100);
    color: var(--color-gray-700);
    border-color: var(--color-gray-200);
  `,
  success: css`
    background-color: #e8f5e8;
    color: var(--color-success);
    border-color: var(--color-success);
  `,
  warning: css`
    background-color: #fff3e0;
    color: var(--color-warning);
    border-color: var(--color-warning);
  `,
  error: css`
    background-color: #ffebee;
    color: var(--color-error);
    border-color: var(--color-error);
  `,
  info: css`
    background-color: #e3f2fd;
    color: var(--color-info);
    border-color: var(--color-info);
  `,
  secondary: css`
    background-color: var(--color-gray-200);
    color: var(--color-gray-600);
    border-color: var(--color-gray-300);
  `,
  outline: css`
    background-color: transparent;
    color: var(--color-primary);
    border-color: var(--color-primary);
  `,
};

const sizeStyles = {
  sm: css`
    padding: var(--spacing-xs) var(--spacing-sm);
    font-size: var(--font-size-xs);
    line-height: 1;
  `,
  md: css`
    padding: var(--spacing-sm) var(--spacing-md);
    font-size: var(--font-size-sm);
    line-height: 1;
  `,
};

export const Badge: React.FC<BadgeProps> = ({
  variant = 'default',
  size = 'md',
  className,
  children,
  ...props
}) => {
  return (
    <span
      className={`${badgeStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className || ''}`}
      {...props}
    >
      {children}
    </span>
  );
};
