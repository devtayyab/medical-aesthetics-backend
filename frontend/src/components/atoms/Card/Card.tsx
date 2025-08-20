import React from 'react';
import { css } from '@emotion/css';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'elevated' | 'outlined';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  hoverable?: boolean;
}

const baseCardStyle = css`
  background-color: var(--color-white);
  border-radius: var(--radius-xl);
  transition: all var(--transition-fast);
`;

const variantStyles = {
  default: css`
    box-shadow: var(--shadow-sm);
  `,
  elevated: css`
    box-shadow: var(--shadow-lg);
  `,
  outlined: css`
    border: 1px solid var(--color-gray-200);
    box-shadow: none;
  `,
};

const paddingStyles = {
  none: css`
    padding: 0;
  `,
  sm: css`
    padding: var(--spacing-md);
  `,
  md: css`
    padding: var(--spacing-lg);
  `,
  lg: css`
    padding: var(--spacing-xl);
  `,
};

const hoverableStyle = css`
  cursor: pointer;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: var(--shadow-xl);
  }
`;

export const Card: React.FC<CardProps> = ({
  variant = 'default',
  padding = 'md',
  hoverable = false,
  className,
  children,
  ...props
}) => {
  return (
    <div
      className={`${baseCardStyle} ${variantStyles[variant]} ${paddingStyles[padding]} ${
        hoverable ? hoverableStyle : ''
      } ${className || ''}`}
      {...props}
    >
      {children}
    </div>
  );
};