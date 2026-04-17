import React, { useState } from "react";
import { createPortal } from "react-dom";
import { MapPin, ChevronRight, Info, Shield, Award, X, Sparkles, ArrowRight, Clock, Zap } from "lucide-react";
import type { Treatment } from "@/types";
import { motion, AnimatePresence } from "framer-motion";
import { css } from "@emotion/css";

// Assets
import BotoxImg from "@/assets/Botox.jpg";

export interface TreatmentCardProps {
    treatment: Treatment;
    onSelect?: (treatment: Treatment) => void;
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

const explanationModalStyle = css`
  background: white;
  width: 100%;
  max-width: 600px;
  border-radius: 40px;
  overflow: hidden;
  box-shadow: 0 100px 200px rgba(0,0,0,0.2);
  border: 1px solid rgba(0,0,0,0.05);
`;

export const TreatmentCard: React.FC<TreatmentCardProps> = ({
    treatment,
    onSelect,
}) => {
    const [showExplanation, setShowExplanation] = useState(false);

    const handleClick = () => {
        onSelect?.(treatment);
    };

    const imageUrl = treatment.imageUrl || BotoxImg;

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className={cardStyle}
            onClick={handleClick}
        >
            {/* Treatment Header Section (Adjusted Height to avoid cutting) */}
            <div className="relative h-[210px] overflow-hidden">
                <img
                    src={imageUrl}
                    alt={treatment.name}
                    className="w-full h-full object-cover transition-all duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent"></div>
                
                <div className="absolute top-4 left-4">
                    <div className="bg-black/80 backdrop-blur-xl border border-white/20 text-white px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center gap-2">
                        <Sparkles size={10} className="text-[#CBFF38]" /> {treatment.category}
                    </div>
                </div>
                
                <div className="absolute top-4 right-4">
                   <div className="bg-[#CBFF38] text-black size-8 rounded-xl flex items-center justify-center shadow-xl">
                      <Zap size={14} fill="currentColor" />
                   </div>
                </div>
            </div>

            {/* Content Architecture - More Compact */}
            <div className="p-6 flex flex-col flex-1">
                <div className="flex justify-between items-start mb-4 gap-4">
                    <div className="min-w-0">
                        <h3 className="text-xl font-black uppercase italic tracking-tighter text-gray-900 leading-none mb-2">
                            {treatment.name}
                        </h3>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tight italic line-clamp-1">
                            {treatment.shortDescription}
                        </p>
                    </div>
                    <div className="text-right shrink-0">
                        <p className="text-[8px] font-black text-gray-300 uppercase tracking-widest leading-none mb-1 italic">Protocol</p>
                        <p className="text-xl font-black text-gray-900 leading-none">€{treatment.fromPrice || '?'}</p>
                    </div>
                </div>

                {/* Clinics & Availability Signature */}
                <div className="mt-auto space-y-4">
                    <div className="border-t border-gray-50 pt-4">
                        <div className="flex flex-wrap gap-2">
                            {treatment.availableAt && treatment.availableAt.length > 0 ? (
                                treatment.availableAt.slice(0, 1).map((clinicName, idx) => (
                                    <span key={idx} className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 rounded-lg text-[9px] font-black uppercase tracking-widest text-gray-500 italic border border-gray-100/50">
                                        <MapPin size={10} className="text-lime-500" />
                                        {clinicName}
                                    </span>
                                ))
                            ) : null}
                            {treatment.clinicsCount && treatment.clinicsCount > 1 && (
                                <span className="px-3 py-1.5 bg-lime-50 rounded-lg text-[9px] font-black uppercase tracking-widest text-lime-700 italic border border-lime-100">
                                    +{treatment.clinicsCount - 1} more
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Action Bar - Compact */}
                    <div className="flex gap-3">
                        <button
                            className="flex-1 h-11 bg-gray-50 text-gray-400 border border-gray-100 hover:bg-white hover:text-black hover:border-[#CBFF38] rounded-xl text-[9px] font-black uppercase tracking-widest italic transition-all flex items-center justify-center gap-2"
                            onClick={(e) => { e.stopPropagation(); setShowExplanation(true); }}
                        >
                            <Info size={14} /> Examine
                        </button>
                        <button
                            className="flex-1 h-11 bg-black text-[#CBFF38] hover:bg-lime-500 hover:text-black rounded-xl text-[9px] font-black uppercase tracking-widest italic transition-all shadow-xl flex items-center justify-center gap-2"
                            onClick={(e) => { e.stopPropagation(); handleClick(); }}
                        >
                            Book <ArrowRight size={14} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Elite Explanation Modal - Portaled to Body to escape stacking context */}
            {typeof document !== 'undefined' && createPortal(
                <AnimatePresence>
                    {showExplanation && (
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 z-[10000] flex items-center justify-center p-6 bg-black/60 backdrop-blur-xl"
                            onClick={(e) => { e.stopPropagation(); setShowExplanation(false); }}
                        >
                            <motion.div 
                                initial={{ scale: 0.9, y: 40 }}
                                animate={{ scale: 1, y: 0 }}
                                exit={{ scale: 0.9, y: 40 }}
                                className={explanationModalStyle}
                                onClick={(e) => e.stopPropagation()}
                            >
                                <div className="h-52 bg-gray-900 relative">
                                    <img src={imageUrl} alt={treatment.name} className="w-full h-full object-cover opacity-60" />
                                    <div className="absolute inset-0 bg-gradient-to-t from-white via-white/20 to-transparent" />
                                    
                                    <button 
                                        onClick={() => setShowExplanation(false)}
                                        className="absolute top-6 right-6 size-10 rounded-2xl bg-black text-white flex items-center justify-center hover:bg-[#CBFF38] hover:text-black transition-all shadow-2xl z-10"
                                    >
                                        <X size={20} />
                                    </button>
                                    
                                    <div className="absolute bottom-8 left-8 z-10">
                                        <div className="bg-[#CBFF38] text-black px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest inline-block mb-3 shadow-xl">
                                            {treatment.category}
                                        </div>
                                        <h3 className="text-black text-2xl font-black uppercase italic tracking-tighter leading-none">
                                            {treatment.name}
                                        </h3>
                                    </div>
                                </div>
                                
                                <div className="p-8 pb-10 bg-white">
                                    <div className="flex flex-col gap-8">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-6">
                                               <div className="size-8 bg-lime-50 rounded-lg flex items-center justify-center text-lime-600">
                                                  <Info size={16} />
                                               </div>
                                               <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-900 italic">Scientific Explanation</h4>
                                            </div>
                                            
                                            <p className="text-gray-600 text-[15px] font-bold italic leading-relaxed mb-8 pl-6 border-l-4 border-[#CBFF38]">
                                                {treatment.fullDescription || treatment.shortDescription}
                                            </p>
                                            
                                            <div className="grid grid-cols-3 gap-4">
                                               <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 flex flex-col items-center">
                                                  <Shield className="text-lime-500 mb-2" size={20} />
                                                  <p className="text-[8px] font-black uppercase tracking-widest text-gray-900 italic">Max_Safety</p>
                                               </div>
                                               <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 flex flex-col items-center">
                                                  <Award className="text-lime-500 mb-2" size={20} />
                                                  <p className="text-[8px] font-black uppercase tracking-widest text-gray-900 italic">Top_Experts</p>
                                               </div>
                                               <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 flex flex-col items-center">
                                                  <Clock className="text-lime-500 mb-2" size={20} />
                                                  <p className="text-[8px] font-black uppercase tracking-widest text-gray-900 italic">Fast_Protocol</p>
                                               </div>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div className="mt-10 pt-8 border-t border-gray-50 flex items-center justify-between">
                                        <div className="flex flex-col">
                                           <span className="text-[8px] font-black text-gray-300 uppercase tracking-widest italic mb-1">Starting Protocol</span>
                                           <span className="text-2xl font-black text-black">€{treatment.fromPrice || '?'}.00</span>
                                        </div>
                                        <button 
                                            className="h-14 px-10 bg-black text-[#CBFF38] hover:bg-[#CBFF38] hover:text-black rounded-xl font-black uppercase tracking-[0.2em] text-[10px] italic transition-all shadow-2xl flex items-center gap-4"
                                            onClick={() => { setShowExplanation(false); handleClick(); }}
                                        >
                                            Initiate Booking <ArrowRight size={16} />
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>,
                document.body
            )}
        </motion.div>
    );
};
