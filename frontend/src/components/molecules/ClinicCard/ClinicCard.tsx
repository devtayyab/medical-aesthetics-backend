import React from "react";
import { Star, MapPin, Clock, Heart, Zap, ArrowRight, Calendar } from "lucide-react";
import type { Clinic } from "@/types";
import { motion } from "framer-motion";
import { css } from "@emotion/css";

// Fallback high-fidelity asset
import BotoxImg from "@/assets/Botox.jpg";

export interface ClinicCardProps {
  clinic: Clinic;
  index?: number;
  onSelect?: (clinic: Clinic) => void;
  onShowMap?: (clinic: Clinic) => void;
  searchQuery?: string;
  searchDate?: string;
}

const cardStyle = css`
  background: white;
  border: 1px solid #F1F5F9;
  border-radius: 40px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  box-shadow: 0 40px 80px rgba(0, 0, 0, 0.03);

  &:hover {
    border-color: #CBFF38;
    transform: translateY(-8px);
    box-shadow: 0 50px 100px rgba(0, 0, 0, 0.07);
  }
`;

const serviceRow = css`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: #F8F9FA;
  border-radius: 20px;
  transition: all 0.2s ease;
  cursor: pointer;
  border: 1px solid transparent;

  &:hover {
    background: white;
    border-color: #CBFF38;
    transform: translateX(4px);
  }
`;

export const ClinicCard: React.FC<ClinicCardProps> = ({
  clinic,
  index = 0,
  onSelect,
  onShowMap,
  searchQuery,
  searchDate,
}) => {
  const handleClick = () => {
    onSelect?.(clinic);
  };

  const imageUrl = clinic.photoUrl || clinic.images?.[index] || clinic.images?.[0] || BotoxImg;

  const displayServices = clinic.services?.filter(s =>
    !searchQuery || s.treatment?.name?.toLowerCase().includes(searchQuery.toLowerCase())
  ).slice(0, 3) || [];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={cardStyle}
      onClick={handleClick}
    >
      {/* Immersive Image Section */}
      <div className="relative h-[240px] overflow-hidden">
        <img
          src={imageUrl}
          alt={clinic.name}
          className="w-full h-full object-cover transition-all duration-700"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent"></div>
        
        {/* Heart Feature */}
        <button className="absolute top-6 right-6 size-12 bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl flex items-center justify-center text-white hover:bg-[#CBFF38] hover:text-black transition-all shadow-2xl group/heart">
          <Heart size={20} className="group-hover/heart:fill-current" />
        </button>

        {/* Dynamic Badge */}
        <div className="absolute bottom-6 left-6 flex items-center gap-3">
           <div className="bg-[#CBFF38] text-black px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest italic shadow-xl flex items-center gap-2">
              <Zap size={12} fill="currentColor" /> ELITE_PARTNER
           </div>
        </div>
      </div>

      {/* Content Architecture */}
      <div className="p-8 flex flex-col flex-1">
        {/* Header Block */}
        <div className="flex justify-between items-start mb-6">
          <div>
            <h3 className="text-2xl font-black uppercase italic tracking-tighter text-gray-900 leading-none mb-2">
              {clinic.name}
            </h3>
            <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-[#CBFF38] italic">
               <div className="flex items-center gap-1">
                  <Star size={12} fill="currentColor" />
                  <span className="text-gray-900">{(clinic.rating !== null && clinic.rating !== undefined) ? Number(clinic.rating).toFixed(1) : "4.9"}</span>
               </div>
               <span className="text-gray-300">({clinic.reviewCount || 120} Protocols)</span>
            </div>
          </div>
          
          <button 
            onClick={(e) => { e.stopPropagation(); onShowMap?.(clinic); }}
            className="flex items-center gap-2 px-4 py-2 bg-gray-50 rounded-xl text-[9px] font-black uppercase tracking-widest text-gray-400 hover:bg-[#CBFF38] hover:text-black transition-all"
          >
            <MapPin size={12} /> Map View
          </button>
        </div>

        {/* Location Signature */}
        <div className="flex items-center gap-2 mb-8 text-[11px] font-bold text-gray-400 uppercase tracking-widest italic">
            <MapPin size={14} className="text-lime-500" />
            <span>{clinic.address?.city}, Area Protocol</span>
            {clinic.distance !== undefined && (
                <span className="text-lime-600 ml-auto">{Number(clinic.distance).toFixed(1)}km _Range</span>
            )}
        </div>

        {/* Procedure List */}
        <div className="space-y-3 flex-1">
          <h4 className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-300 mb-4 italic">Available Procedures</h4>
          {displayServices.length > 0 ? (
            displayServices.map((service, idx) => (
              <div
                key={idx}
                onClick={(e) => { e.stopPropagation(); window.location.href = `/appointment/booking?clinicId=${clinic.id}&serviceIds=${service.id}`; }}
                className={serviceRow}
              >
                <div className="flex flex-col">
                  <span className="text-[11px] font-black uppercase tracking-tight text-gray-900 leading-none mb-1">{service.treatment?.name}</span>
                  <div className="flex items-center gap-2 text-[9px] font-bold text-gray-400 uppercase italic">
                    <Clock size={10} /> {service.durationMinutes} mins Protocol
                  </div>
                </div>
                <div className="text-right">
                  <span className="block text-[8px] font-black text-gray-300 uppercase leading-none mb-1 text-right">starts</span>
                  <span className="text-[14px] font-black text-gray-900">€{service.price}</span>
                </div>
              </div>
            ))
          ) : (
            <div className="text-[11px] font-bold text-gray-400 italic py-4">
              Premium services starting from €49. Examine clinic catalog for full details.
            </div>
          )}
        </div>

        {/* Availability & Engagement */}
        <div className="mt-8 pt-6 border-t border-gray-50">
           <div className="bg-lime-50 p-6 rounded-[32px] border border-lime-100/50 mb-6">
              <div className="flex items-center justify-between mb-4">
                 <div className="flex items-center gap-3">
                    <div className="size-3 bg-lime-500 rounded-full animate-pulse shadow-[0_0_15px_rgba(132,204,22,0.5)]"></div>
                    <span className="text-[10px] font-black uppercase tracking-[0.1em] text-lime-900 italic">Next availability: <span className="text-black">Today 14:00</span></span>
                 </div>
                 <Calendar size={14} className="text-lime-600" />
              </div>
              <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest leading-relaxed italic">
                 Booking is highly recommended for this elite partner.
              </p>
           </div>
           
           <div className="flex gap-3">
              <button
                className="flex-1 h-14 border border-gray-900 text-gray-900 hover:bg-gray-900 hover:text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] italic transition-all active:scale-95"
                onClick={(e) => { e.stopPropagation(); handleClick(); }}
              >
                Examine <ArrowRight size={12} className="inline-block ml-1" />
              </button>
              <button
                className="flex-1 h-14 bg-black text-[#CBFF38] hover:bg-lime-500 hover:text-black rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] italic transition-all shadow-xl active:scale-95 flex items-center justify-center gap-2"
                onClick={(e) => { e.stopPropagation(); handleClick(); }}
              >
                Book_Now <ArrowRight size={14} />
              </button>
           </div>
        </div>
      </div>
    </motion.div>
  );
};
