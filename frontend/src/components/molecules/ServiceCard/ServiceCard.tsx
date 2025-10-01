import React from "react";
import { css } from "@emotion/css";
import { Clock, Plus, Check } from "lucide-react";
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
  // margin-bottom: var(--spacing-sm);
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
  // color: var(--color-primary);
  color: #000000;
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
  justify-content: space-between;
  gap: var(--spacing-sm);
  // margin-bottom: var(--spacing-md);
`;

const durationStyle = css`
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  font-size: var(--font-size-sm);
  color: var(--color-gray-500);
`;

const categoryStyle = css`
  // background-color: var(--color-gray-100);
  color: #000000;
  padding: var(--spacing-xs) var(--spacing-sm);
  border-radius: var(--radius-full);
  font-size: var(--font-size-sm);
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
    return remainingMinutes > 0
      ? `${hours}h ${remainingMinutes}min`
      : `${hours}h`;
  };

  return (
    <Card
      variant="outlined"
      className={`${cardStyle} ${isSelected ? selectedCardStyle : "bg-transparent rounded-none border-b-[#D7DAE0] last-of-type:border-transparent"} p-[10px]`}
    >
      <div className="flex justify-between items-center gap-6">
        <div className="w-full">
          <div className={headerStyle}>
            <h3 className={titleStyle}>{service.name}</h3>
            <span className={priceStyle}>from ${service.price}</span>
          </div>

          {service.description && (
            <p className={descriptionStyle}>{service.description}</p>
          )}

          <div className={`${metaStyle}`}>
            <div className={durationStyle}>
              {/* <Clock size={14} /> */}
              <span>{formatDuration(service.durationMinutes)}</span>

              {service.category && (
                <span className={categoryStyle}>{service.category}</span>
              )}
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
    </Card>
  );
};
