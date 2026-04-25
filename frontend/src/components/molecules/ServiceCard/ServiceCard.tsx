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
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center py-6 border-b border-gray-100/50">
        <div className="flex-1 w-full sm:pr-6 mb-6 sm:mb-0">
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2 py-0.5 bg-lime-50 text-[10px] font-black uppercase text-lime-600 rounded-md border border-lime-100">
              {service.treatment?.category || service.category || 'Treatment'}
            </span>
          </div>
          <div className="flex gap-4">
            {(service.treatment?.imageUrl || service.imageUrl) && (
              <img
                src={(service.treatment?.imageUrl || service.imageUrl) as string}
                alt={service.treatment?.name || service.name}
                className={`size-14 sm:size-16 rounded-xl object-cover border border-gray-100 shadow-sm transition-transform ${isSelected ? 'scale-110 shadow-lime-200' : ''}`}
              />
            )}
            <div className="flex-1 min-w-0">
              <h4 className={`text-base sm:text-lg font-black uppercase tracking-tight mb-1 truncate transition-colors ${isSelected ? 'text-lime-600' : 'text-gray-900 group-hover:text-lime-600'}`}>
                {service.treatment?.name || service.name || 'Treatment'}
              </h4>
              <p className="text-[11px] text-gray-500 mb-2 line-clamp-2">
                {service.description || service.treatment?.shortDescription}
              </p>
              <div className="flex items-center gap-4">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{service.durationMinutes} min</span>
                <button
                  onClick={(e) => { e.stopPropagation(); setShowDetails(!showDetails); }}
                  className="text-[10px] font-black uppercase text-lime-600 hover:underline flex items-center gap-1"
                >
                  {showDetails ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
                  {showDetails ? "Hide" : "Info"}
                </button>
              </div>
            </div>
          </div>
          {showDetails && (
            <div className={`${descriptionStyle} animate-in fade-in slide-in-from-top-1 px-4 py-3 bg-gray-50 rounded-xl mt-4 text-xs`}>
              {service.treatment?.fullDescription || service.description || "Take some time out for yourself with our premium treatment handled by experts."}
            </div>
          )}
        </div>

        <div className="flex w-full sm:w-auto items-center justify-between sm:justify-end gap-4 sm:gap-8 pt-4 sm:pt-0 border-t sm:border-t-0 border-gray-50">
          <div className="text-left sm:text-right">
            <span className="block text-xl sm:text-2xl font-black text-gray-900"><span className="font-sans">€</span>{Number(service.price).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            {service.price > 100 && <span className="text-[9px] text-lime-600 font-bold uppercase">ELITE_PRICING</span>}
          </div>

          <div className="flex items-center gap-2">
             <Button
               onClick={() => onSelect?.(service)}
               className={`size-10 sm:size-12 rounded-xl flex items-center justify-center transition-all ${isSelected 
                 ? 'bg-[#CBFF38] text-black border-2 border-black shadow-lg' 
                 : 'bg-gray-100 text-gray-300 hover:bg-gray-200'}`}
             >
               {isSelected ? <Check size={20} /> : <Plus size={20} />}
             </Button>
             
             {!isSelected && (
                <Button
                   onClick={() => onBook?.(service)}
                   className="px-6 h-10 sm:h-12 rounded-xl bg-gray-900 text-white hover:bg-lime-500 transition-colors font-black uppercase tracking-widest text-[10px] sm:text-xs shadow-md"
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
