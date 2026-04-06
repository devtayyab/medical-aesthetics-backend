import React, { useState } from "react";
import { css } from "@emotion/css";
import { ChevronDown, ChevronUp, Plus, Check } from "lucide-react";
import { Button } from "@/components/atoms/Button/Button";
import type { Service } from "@/types";

const serviceRow = () => css`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24px 0;
  background: white;
  transition: all 0.2s ease;
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
  onBook?: (service: Service) => void;
  isSelected?: boolean;
  onSelect?: (service: Service) => void;
}> = ({ service, onBook, isSelected, onSelect }) => {
  const [showDetails, setShowDetails] = useState(false);

  return (
    <div className={`group transition-all ${isSelected ? 'bg-lime-50/30' : ''}`}>
      <div className={serviceRow()}>
        <div className="flex-1 pr-6">
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 bg-lime-50 text-[10px] font-black uppercase text-lime-600 rounded-md border border-lime-100">
              {service.treatment?.category || service.category || 'Treatment'}
            </span>
          </div>
          <div className="flex gap-4">
            {(service.treatment?.imageUrl || service.imageUrl) && (
              <img
                src={(service.treatment?.imageUrl || service.imageUrl) as string}
                alt={service.treatment?.name || service.name}
                className={`size-16 rounded-xl object-cover border border-gray-100 shadow-sm transition-transform ${isSelected ? 'scale-110 shadow-lime-200' : ''}`}
              />
            )}
            <div>
              <h4 className={`text-lg font-black uppercase tracking-tight mb-1 transition-colors ${isSelected ? 'text-lime-600' : 'text-gray-900 group-hover:text-lime-600'}`}>
                {service.treatment?.name || service.name || 'Treatment'}
              </h4>
              <p className="text-xs text-gray-500 mb-2 line-clamp-2 max-w-md">
                {service.description || service.treatment?.shortDescription}
              </p>
              <div className="flex items-center gap-4">
                <span className="text-sm font-bold text-gray-400 uppercase tracking-widest">{service.durationMinutes} mins</span>
                <button
                  onClick={(e) => { e.stopPropagation(); setShowDetails(!showDetails); }}
                  className="text-[10px] font-black uppercase text-lime-600 hover:underline flex items-center gap-1"
                >
                  {showDetails ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
                  {showDetails ? "Hide Info" : "Show Info"}
                </button>
              </div>
            </div>
          </div>
          {showDetails && (
            <div className={`${descriptionStyle} animate-in fade-in slide-in-from-top-1 ml-20`}>
              {service.treatment?.fullDescription || service.description || "Take some time out for yourself with our premium treatment handled by experts."}
            </div>
          )}
        </div>

        <div className="flex items-center gap-8">
          <div className="text-right">
            <span className="block text-2xl font-black text-gray-900"><span className="font-sans">€</span>{Number(service.price).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            {service.price > 100 && <span className="text-[10px] text-lime-600 font-bold uppercase">Save 10% off-peak</span>}
          </div>

          <div className="flex items-center gap-2">
             <Button
               onClick={() => onSelect?.(service)}
               className={`size-12 rounded-xl flex items-center justify-center transition-all ${isSelected 
                 ? 'bg-[#CBFF38] text-black border-2 border-black' 
                 : 'bg-gray-50 text-gray-300 hover:bg-gray-100'}`}
             >
               {isSelected ? <Check size={20} /> : <Plus size={20} />}
             </Button>
             
             {!isSelected && (
                <Button
                  onClick={() => onBook?.(service)}
                  className="px-6 h-12 rounded-xl bg-gray-900 text-white hover:bg-lime-500 transition-colors font-black uppercase tracking-widest text-xs shadow-md"
                >
                  Book
                </Button>
             )}
          </div>
        </div>
      </div>
    </div>
  );
};
