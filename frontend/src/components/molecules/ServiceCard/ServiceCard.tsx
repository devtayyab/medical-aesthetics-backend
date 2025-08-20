import React from 'react';
import { css } from '@emotion/css';
import { Clock, Plus, Check } from 'lucide-react';
import { Card } from '@/components/atoms/Card/Card';
import { Button } from '@/components/atoms/Button/Button';
import type { Service } from '@/types';

export interface ServiceCardProps {
  service: Service;
  isSelected?: boolean;
  onAdd?: (service: Service) => void;
  onRemove?: (serviceId: string) => void;
}

const cardStyle = css`
  width: 100%;
  transition: all var(--transition-fast);
  border: 2px solid transparent;
`;

const selectedCardStyle = css`
  border-color: var(--color-primary);
  background-color: rgb(99 102 241 / 0.02);
`;

const headerStyle = css`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: var(--spacing-sm);
`;

const titleStyle = css`
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-semibold);
  color: var(--color-gray-900);
  margin: 0;
  line-height: var(--line-height-tight);
`;

const priceStyle = css`
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-bold);
  color: var(--color-primary);
`;

const descriptionStyle = css`
  color: var(--color-gray-600);
  font-size: var(--font-size-sm);
  line-height: var(--line-height-normal);
  margin-bottom: var(--spacing-md);
`;

const metaStyle = css`
  display: flex;
  align-items: center;
  gap: var(--spacing-lg);
  margin-bottom: var(--spacing-md);
`;

const durationStyle = css`
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  font-size: var(--font-size-sm);
  color: var(--color-gray-500);
`;

const categoryStyle = css`
  background-color: var(--color-gray-100);
  color: var(--color-gray-700);
  padding: var(--spacing-xs) var(--spacing-sm);
  border-radius: var(--radius-full);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-medium);
`;

const actionsStyle = css`
  display: flex;
  justify-content: flex-end;
`;

export const ServiceCard: React.FC<ServiceCardProps> = ({
  service,
  isSelected = false,
  onAdd,
  onRemove,
}) => {
  const handleToggle = () => {
    if (isSelected) {
      onRemove?.(service.id);
    } else {
      onAdd?.(service);
    }
  };

  const formatDuration = (minutes: number) => {
    if (minutes < 60) {
      return `${minutes} min`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}min` : `${hours}h`;
  };

  return (
    <Card
      variant="outlined"
      className={`${cardStyle} ${isSelected ? selectedCardStyle : ''}`}
    >
      <div className={headerStyle}>
        <h3 className={titleStyle}>{service.name}</h3>
        <span className={priceStyle}>${service.price}</span>
      </div>
      
      <p className={descriptionStyle}>{service.description}</p>
      
      <div className={metaStyle}>
        <div className={durationStyle}>
          <Clock size={14} />
          <span>{formatDuration(service.durationMinutes)}</span>
        </div>
        
        {service.category && (
          <span className={categoryStyle}>{service.category}</span>
        )}
      </div>
      
      <div className={actionsStyle}>
        <Button
          variant={isSelected ? 'outline' : 'primary'}
          size="sm"
          leftIcon={isSelected ? <Check size={16} /> : <Plus size={16} />}
          onClick={handleToggle}
        >
          {isSelected ? 'Added' : 'Add'}
        </Button>
      </div>
    </Card>
  );
};