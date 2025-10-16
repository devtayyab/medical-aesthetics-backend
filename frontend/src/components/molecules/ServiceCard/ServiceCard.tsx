import React, { useState } from "react";
import { css } from "@emotion/css";
import { Plus, Check } from "lucide-react";
import { Card } from "@/components/atoms/Card/Card";
import { Button } from "@/components/atoms/Button/Button";
import type { Service } from "@/types";

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
  border-color: var(--color-primary) !important;
  background-color: rgb(99 102 241 / 0.02);
  border-radius: 12px !important;
`;

const headerStyle = css`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
`;

const titleStyle = css`
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-medium);
  color: var(--color-gray-900);
  margin: 0;
  line-height: var(--line-height-tight);
`;

const priceStyle = css`
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-medium);
  color: #000000;
`;

const descriptionWrapper = css`
  overflow: hidden;
  transition:
    max-height 0.4s cubic-bezier(0.4, 0, 0.2, 1),
    opacity 0.4s ease,
    transform 0.4s ease;
  max-height: 0;
  opacity: 0;
  transform: translateY(-5px);

  &.open {
    max-height: 500px;
    opacity: 1;
    transform: translateY(0);
  }
`;

const descriptionStyle = css`
  color: var(--color-gray-600);
  font-size: var(--font-size-sm);
  line-height: var(--line-height-normal);
  margin-top: var(--spacing-md);
`;

const metaStyle = css`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--spacing-sm);
`;

const durationStyle = css`
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  font-size: var(--font-size-sm);
  color: var(--color-gray-500);
`;

const categoryStyle = css`
  color: #357a7b;
  border-radius: var(--radius-full);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  display: inline-block;
  margin-top: 8px;
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
  const [showDetails, setShowDetails] = useState(false);

  const handleToggle = () => {
    if (isSelected) {
      onRemove?.(service.id);
    } else {
      onAdd?.(service);
    }
  };

  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0
      ? `${hours}h ${remainingMinutes}min`
      : `${hours}h`;
  };

  return (
    <Card
      variant="outlined"
      className={`${cardStyle} ${
        isSelected
          ? selectedCardStyle
          : "bg-transparent rounded-none border-b-[#D7DAE0] last-of-type:border-transparent"
      } p-[10px]`}
    >
      <div className="flex justify-between items-center gap-6">
        <div className="w-full">
          <div className={headerStyle}>
            <h3 className={titleStyle}>{service.name}</h3>
            <span className={priceStyle}>from ${service.price}</span>
          </div>

          <div className={metaStyle}>
            <div className={durationStyle}>
              <span>{formatDuration(service.durationMinutes)}</span>
              <button
                onClick={() => setShowDetails(!showDetails)}
                className="text-black font-medium focus:outline-none hover:underline"
              >
                {showDetails ? "Hide Details" : "Show Details"}
              </button>
            </div>
            <span className="text-[#357A7B] text-[14px]">save up to 90%</span>
          </div>
        </div>

        <div className={actionsStyle}>
          <Button
            variant={isSelected ? "outline" : "primary"}
            size="sm"
            leftIcon={isSelected ? <Check size={16} /> : <Plus size={16} />}
            onClick={handleToggle}
            className="rounded-[12px] px-[22px] py-2 text-[16px] gap-1.5"
          >
            {isSelected ? "Selected" : "Select"}
          </Button>
        </div>
      </div>

      {/* Smooth Animated Description */}
      <div className={`${descriptionWrapper} ${showDetails ? "open" : ""}`}>
        {service.description && (
          <p className={descriptionStyle}>{service.description}</p>
        )}
        {service.category && (
          <span className={categoryStyle}>{service.category}</span>
        )}
      </div>
    </Card>
  );
};
