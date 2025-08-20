import React from 'react';
import { css } from '@emotion/css';
import { Star, MapPin, Clock, DollarSign } from 'lucide-react';
import { Card } from '@/components/atoms/Card/Card';
import type { Clinic } from '@/types';

export interface ClinicCardProps {
  clinic: Clinic;
  onSelect?: (clinic: Clinic) => void;
}

const cardStyle = css`
  width: 100%;
  max-width: 320px;
  overflow: hidden;
`;

const imageContainerStyle = css`
  position: relative;
  width: 100%;
  height: 200px;
  overflow: hidden;
  border-radius: var(--radius-xl) var(--radius-xl) 0 0;
`;

const imageStyle = css`
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform var(--transition-normal);
  
  &:hover {
    transform: scale(1.05);
  }
`;

const contentStyle = css`
  padding: var(--spacing-lg);
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

const ratingStyle = css`
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  color: var(--color-gray-700);
`;

const starStyle = css`
  color: #fbbf24;
`;

const infoRowStyle = css`
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  margin-bottom: var(--spacing-xs);
  font-size: var(--font-size-sm);
  color: var(--color-gray-600);
`;

const iconStyle = css`
  color: var(--color-gray-400);
  flex-shrink: 0;
`;

const priceRangeStyle = css`
  font-weight: var(--font-weight-medium);
  color: var(--color-primary);
`;

const badgeStyle = css`
  position: absolute;
  top: var(--spacing-sm);
  right: var(--spacing-sm);
  background-color: var(--color-white);
  color: var(--color-primary);
  padding: var(--spacing-xs) var(--spacing-sm);
  border-radius: var(--radius-full);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-medium);
  box-shadow: var(--shadow-sm);
`;

export const ClinicCard: React.FC<ClinicCardProps> = ({ clinic, onSelect }) => {
  const handleClick = () => {
    onSelect?.(clinic);
  };

  const formatAddress = (address: Clinic['address']) => {
    return `${address.city}, ${address.state}`;
  };

  const getBusinessHoursText = () => {
    const today = new Date().toLocaleLowerCase().slice(0, 3) + 'day';
    const todayHours = clinic.businessHours?.[today];
    
    if (!todayHours || !todayHours.isOpen) {
      return 'Closed today';
    }
    
    return `Open until ${todayHours.close}`;
  };

  // Use placeholder image if no images provided
  const imageUrl = clinic.images?.[0] || 'https://images.pexels.com/photos/3985360/pexels-photo-3985360.jpeg?auto=compress&cs=tinysrgb&w=400';

  return (
    <Card
      variant="default"
      padding="none"
      hoverable
      className={cardStyle}
      onClick={handleClick}
    >
      <div className={imageContainerStyle}>
        <img
          src={imageUrl}
          alt={clinic.name}
          className={imageStyle}
        />
        {clinic.distance && (
          <div className={badgeStyle}>
            {clinic.distance.toFixed(1)} km
          </div>
        )}
      </div>
      
      <div className={contentStyle}>
        <div className={headerStyle}>
          <h3 className={titleStyle}>{clinic.name}</h3>
          {clinic.rating && (
            <div className={ratingStyle}>
              <Star size={14} className={starStyle} fill="currentColor" />
              {clinic.rating.toFixed(1)}
            </div>
          )}
        </div>
        
        <div className={infoRowStyle}>
          <MapPin size={14} className={iconStyle} />
          <span>{formatAddress(clinic.address)}</span>
        </div>
        
        <div className={infoRowStyle}>
          <Clock size={14} className={iconStyle} />
          <span>{getBusinessHoursText()}</span>
        </div>
        
        {clinic.priceRange && (
          <div className={infoRowStyle}>
            <DollarSign size={14} className={iconStyle} />
            <span className={priceRangeStyle}>{clinic.priceRange}</span>
          </div>
        )}
      </div>
    </Card>
  );
};