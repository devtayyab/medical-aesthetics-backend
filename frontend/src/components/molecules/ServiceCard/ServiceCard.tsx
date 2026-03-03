import React, { useState } from "react";
import { css } from "@emotion/css";
import { Plus, Check, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/atoms/Button/Button";
import type { Service } from "@/types";

const serviceRow = (isSelected: boolean) => css`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24px 0;
  background: white;
  transition: all 0.2s ease;
  ${isSelected && 'background: #fdfdfd;'}
`;

const descriptionStyle = css`
  color: #718096;
  font-size: 14px;
  line-height: 1.6;
  margin-top: 12px;
  max-width: 500px;
`;

export const ServiceCard: React.FC<{
  service: Service;
  isSelected?: boolean;
  onAdd?: (service: Service) => void;
  onRemove?: (serviceId: string) => void;
}> = ({ service, isSelected = false, onAdd, onRemove }) => {
  const [showDetails, setShowDetails] = useState(false);

  const handleToggle = () => {
    if (isSelected) {
      onRemove?.(service.id);
    } else {
      onAdd?.(service);
    }
  };

  return (
    <div className="group">
      <div className={serviceRow(isSelected)}>
        <div className="flex-1 pr-6">
          <h4 className="text-lg font-black text-gray-900 uppercase tracking-tight mb-1 group-hover:text-lime-600 transition-colors">
            {service.name}
          </h4>
          <div className="flex items-center gap-4">
            <span className="text-sm font-bold text-gray-400 uppercase tracking-widest">{service.durationMinutes} mins</span>
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="text-[10px] font-black uppercase text-lime-600 hover:underline flex items-center gap-1"
            >
              {showDetails ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
              {showDetails ? "Hide Info" : "Show Info"}
            </button>
          </div>
          {showDetails && (
            <div className={`${descriptionStyle} animate-in fade-in slide-in-from-top-1`}>
              {service.description || "Take some time out for yourself with our premium treatment handled by experts."}
            </div>
          )}
        </div>

        <div className="flex items-center gap-8">
          <div className="text-right">
            <span className="block text-2xl font-black text-gray-900">£{Number(service.price).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            {service.price > 100 && <span className="text-[10px] text-lime-600 font-bold uppercase">Save 10% off-peak</span>}
          </div>

          <Button
            onClick={handleToggle}
            className={`size-12 rounded-2xl flex items-center justify-center p-0 transition-all ${isSelected ? 'bg-black text-white' : 'bg-gray-50 text-gray-400 hover:bg-gray-100'
              }`}
          >
            {isSelected ? <Check size={20} /> : <Plus size={20} />}
          </Button>
        </div>
      </div>
    </div>
  );
};
