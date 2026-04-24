import React, { useState } from "react";
import { createPortal } from "react-dom";
import { MapPin, ChevronRight, Info, Heart, Sparkles, ArrowRight, X } from "lucide-react";
import type { Treatment } from "@/types";
import { motion, AnimatePresence } from "framer-motion";
import { css } from "@emotion/css";

// Assets
import BotoxImg from "@/assets/Botox.jpg";

export interface TreatmentCardProps {
    treatment: Treatment;
    onSelect?: (treatment: Treatment) => void;
}

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
        <>
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                whileHover={{ y: -8 }}
                className="group relative cursor-pointer overflow-hidden rounded-3xl bg-[#FDFDFD] border border-gray-100 shadow-xl transition-all duration-500 mb-8"
                onClick={handleClick}
            >
                <div className="flex flex-col">
                    {/* Text Content Top */}
                    <div className="p-6 sm:p-8 pb-4">
                        <div className="flex items-center gap-2 text-[10px] font-black text-[#CBFF38] uppercase tracking-[0.2em] mb-2 sm:3 italic">
                            <Sparkles size={12} /> {treatment.category || 'Clinical Treatment'}
                        </div>
                        <h3 className="text-2xl sm:text-3xl font-black uppercase italic tracking-tighter text-gray-900 leading-[0.9] mb-3 sm:4 group-hover:text-[#CBFF38] transition-colors">
                            {treatment.name}
                        </h3>
                        <p className="text-[11px] sm:text-[12px] font-medium text-gray-500 leading-relaxed max-w-[90%] sm:max-w-[80%] line-clamp-2">
                            {treatment.shortDescription || 'Experience our premium clinical approach with state-of-the-art technology and expert care.'}
                        </p>
                    </div>

                    {/* Primary Image */}
                    <div className="relative h-[240px] overflow-hidden m-4 mt-0 rounded-2xl">
                        <img
                            src={imageUrl}
                            alt={treatment.name}
                            className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                        
                        {/* Action Button Over Image */}
                        <div className="absolute bottom-6 left-6 z-10">
                            <button 
                                onClick={(e) => { e.stopPropagation(); setShowExplanation(true); }}
                                className="flex items-center gap-2 bg-[#CBFF38]/20 backdrop-blur-xl border border-[#CBFF38]/40 text-[#CBFF38] px-5 py-2.5 rounded-full text-[10px] font-black uppercase italic tracking-[0.2em] hover:bg-[#CBFF38] hover:text-black transition-all shadow-2xl"
                            >
                               <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
                               Surgical Intervention
                            </button>
                        </div>

                        {/* Price Tag - Top Right Overlay */}
                        <div className="absolute top-6 right-6 text-right z-10">
                            <div className="bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10">
                                <p className="text-[8px] font-black text-[#CBFF38] uppercase tracking-[0.2em] italic mb-0.5">Starts From</p>
                                <p className="text-xl font-black text-white tracking-tighter italic leading-none">€{treatment.fromPrice || '120.00'}</p>
                            </div>
                        </div>
                    </div>

                    {/* Decorative Elements */}
                    <div className="absolute top-8 right-8">
                       <div className="size-10 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-300 group-hover:bg-[#CBFF38] group-hover:text-black transition-all">
                          <Heart size={18} />
                       </div>
                    </div>
                </div>
            </motion.div>

            {/* Elite Explanation Modal */}
            <AnimatePresence>
                {showExplanation && (
                    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-6 pb-20">
                        <motion.div 
                            initial={{ opacity: 0 }} 
                            animate={{ opacity: 1 }} 
                            exit={{ opacity: 0 }}
                            onClick={() => setShowExplanation(false)}
                            className="absolute inset-0 bg-black/80 backdrop-blur-md" 
                        />
                        <motion.div 
                            initial={{ opacity: 0, y: 40, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 40, scale: 0.95 }}
                            className={explanationModalStyle}
                        >
                            <div className="relative h-64">
                                <img src={imageUrl} className="w-full h-full object-cover" />
                                <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-transparent" />
                                <button onClick={() => setShowExplanation(false)} className="absolute top-6 right-6 size-12 bg-black text-[#CBFF38] rounded-2xl flex items-center justify-center"><X size={20} /></button>
                            </div>
                            <div className="p-6 sm:p-10 -mt-8 sm:-mt-10 relative">
                                <span className="bg-[#CBFF38] text-black px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest mb-4 inline-block italic">{treatment.category}</span>
                                <h3 className="text-3xl sm:text-4xl font-black uppercase italic tracking-tighter text-gray-900 mb-4">{treatment.name}</h3>
                                <p className="text-xs sm:text-sm text-gray-500 leading-relaxed mb-6 sm:8">{treatment.fullDescription || treatment.shortDescription || "Our clinics offer this premium treatment using state-of-the-art methodology."}</p>
                                <button 
                                    className="w-full h-14 sm:h-16 bg-[#CBFF38] text-black rounded-2xl text-[12px] font-black uppercase tracking-widest italic flex items-center justify-center gap-3 hover:bg-black hover:text-[#CBFF38] transition-all"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setShowExplanation(false);
                                        handleClick(); // This triggers onSelect which navigates
                                    }}
                                >
                                    Find a Clinic <ArrowRight size={18}/>
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </>
    );
};
