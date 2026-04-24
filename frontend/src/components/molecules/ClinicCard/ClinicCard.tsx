import React from "react";
import { Star, MapPin, Clock, Heart, Zap, ArrowRight, Calendar } from "lucide-react";
import type { Clinic } from "@/types";
import { motion, AnimatePresence } from "framer-motion";
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
  @media (min-width: 1024px) {
    flex-direction: row;
    height: 480px;
  }
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  box-shadow: 0 40px 80px rgba(0, 0, 0, 0.03);

  &:hover {
    border-color: #CBFF38;
    box-shadow: 0 50px 100px rgba(0, 0, 0, 0.07);
  }
`;

const serviceRow = css`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 14px;
  background: #F8F9FA;
  border-radius: 16px;
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
  const [isExpanded, setIsExpanded] = React.useState(false);
  const [isMapExpanded, setIsMapExpanded] = React.useState(false);

  const handleClick = () => {
    setIsExpanded(!isExpanded);
  };

  const imageUrl = clinic.photoUrl || clinic.images?.[index] || clinic.images?.[0] || BotoxImg;

  const displayServices = clinic.services?.filter(s =>
    !searchQuery || s.treatment?.name?.toLowerCase().includes(searchQuery.toLowerCase())
  ).slice(0, 3) || [];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      layout
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className={`relative flex flex-col lg:flex-row overflow-hidden rounded-[40px] border border-gray-100 bg-white shadow-2xl transition-all duration-500 hover:border-[#CBFF38] mb-6 
        ${isExpanded || isMapExpanded ? 'lg:col-span-3 h-auto' : 'col-span-1 h-[480px]'}`}
    >
      {/* Left: Image Segment (Always Visible) */}
      <div 
        onClick={handleClick}
        className={`relative cursor-pointer transition-all duration-500 overflow-hidden ${isExpanded || isMapExpanded ? 'w-full lg:w-[35%] h-[300px] lg:h-[480px]' : 'w-full h-[400px] lg:h-[480px]'}`}
      >
        <img
          src={imageUrl}
          alt={clinic.name}
          className="w-full h-full object-cover transition-transform duration-700 hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
        
        {/* Floating Badges */}
        <div className="absolute top-6 left-6 flex flex-col gap-2">
           <div className="bg-[#CBFF38] text-black px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest italic shadow-xl">
              ELITE_PARTNER
           </div>
        </div>

        <button className="absolute top-6 right-6 size-12 bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl flex items-center justify-center text-white hover:bg-[#CBFF38] hover:text-black transition-all">
          <Heart size={20} />
        </button>

        {/* Clinic Name Overlay */}
        <div className="absolute bottom-6 sm:bottom-10 left-6 sm:left-10 right-6 sm:right-10">
           <h3 className="text-2xl sm:text-4xl font-black uppercase italic tracking-tighter text-white mb-2 leading-none">
              {clinic.name}
           </h3>
           <div className="flex items-center gap-3 text-[8px] sm:text-[10px] font-black uppercase tracking-widest text-[#CBFF38] italic">
              <div className="flex items-center gap-1">
                 <Star size={10} fill="currentColor" />
                 <span className="text-white">{(clinic.rating !== null && clinic.rating !== undefined) ? Number(clinic.rating).toFixed(1) : "4.9"}</span>
              </div>
              <span className="text-gray-400">({clinic.reviewCount || 120} Reviews)</span>
           </div>
        </div>
      </div>

      {/* Middle: Content Architecture (Collapsible) */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="flex-1 w-full lg:min-w-[350px] p-6 sm:p-10 flex flex-col bg-[#121212] text-white overflow-hidden"
          >
            <div className="flex justify-between items-start mb-8">
               <div className="flex flex-col gap-1">
                  <p className="text-[10px] font-black text-[#CBFF38] uppercase tracking-[0.3em] mb-2">Available Treatments</p>
                  <div className="flex items-center gap-2 text-[11px] font-bold text-gray-400 uppercase tracking-widest italic">
                     <MapPin size={14} className="text-[#CBFF38]" />
                     <span>{clinic.address?.street || 'Central Street'}, {clinic.address?.city || 'Athens'}</span>
                  </div>
               </div>
               
               <button 
                 onClick={(e) => { e.stopPropagation(); setIsMapExpanded(!isMapExpanded); }}
                 className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${isMapExpanded ? 'bg-[#CBFF38] text-black' : 'bg-white/5 text-gray-400 hover:text-[#CBFF38]'}`}
               >
                 <MapPin size={12} /> {isMapExpanded ? 'CLOSE MAP' : 'VIEW MAP'}
               </button>
            </div>

            <div className="space-y-4 flex-1 mb-8">
              {displayServices.map((service, idx) => (
                <div key={idx} className={serviceRow}>
                  <div className="flex flex-col">
                    <span className="text-[12px] font-black uppercase tracking-tight text-gray-900 leading-none">{service.treatment?.name}</span>
                    <span className="text-[9px] font-bold text-gray-400 uppercase italic mt-1">premium protocol</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[16px] font-black text-gray-900 block">€{service.price}</span>
                    <span className="text-[8px] font-bold text-gray-400 uppercase tracking-widest leading-none">starts from</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex gap-4">
               <button
                 className="flex-1 h-14 border border-white/10 text-white hover:bg-white hover:text-black rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] italic transition-all"
                 onClick={(e) => { e.stopPropagation(); onSelect?.(clinic); }}
               >
                 View Profile
               </button>
               <button
                 className="flex-1 h-14 bg-[#CBFF38] text-black hover:bg-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] italic transition-all shadow-xl flex items-center justify-center gap-2"
                 onClick={(e) => { e.stopPropagation(); onSelect?.(clinic); }}
               >
                 Book Now
               </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Right: Map Segment (Collapsible) */}
      <AnimatePresence>
        {isMapExpanded && (
          <motion.div 
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: "25%", opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            className="hidden lg:block h-auto bg-gray-900 relative border-l border-white/5 overflow-hidden"
          >
              <div className="absolute inset-0">
                 {clinic.latitude && clinic.longitude ? (
                   <iframe 
                     width="100%" 
                     height="100%" 
                     frameBorder="0" 
                     style={{ border: 0 }} 
                     src={`https://maps.google.com/maps?q=${clinic.latitude},${clinic.longitude}&z=16&output=embed`}
                   ></iframe>
                 ) : (
                   <div className="w-full h-full bg-[#121212] flex items-center justify-center">
                      <div className="w-64 h-64 rounded-full border-4 border-[#CBFF38]/10 animate-pulse"></div>
                   </div>
                 )}
              </div>

              {/* Floating Overlay on map */}
              <div className="absolute inset-x-4 bottom-6 z-10 pointer-events-none">
                 <div className="bg-[#121212]/95 backdrop-blur-xl border border-white/10 p-4 rounded-[2rem] shadow-2xl">
                    <div className="flex items-center gap-3">
                       <div className="size-8 bg-[#CBFF38] rounded-full flex items-center justify-center">
                          <MapPin size={14} className="text-black" />
                       </div>
                       <div>
                          <p className="text-[11px] font-black text-white uppercase tracking-tight">
                             {(clinic as any).distance ? `${(clinic as any).distance.toFixed(1)} km away` : 'Near You'}
                          </p>
                          <p className="text-[7px] font-bold text-[#CBFF38] uppercase tracking-[0.3em]">LIVE_RADAR</p>
                       </div>
                    </div>
                 </div>
              </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
