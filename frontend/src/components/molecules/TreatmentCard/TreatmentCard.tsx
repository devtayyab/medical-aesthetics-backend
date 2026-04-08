import React, { useState } from "react";
import { MapPin, ChevronRight, Info, Shield, Award, X } from "lucide-react";
import type { Treatment } from "@/types";
import BotoxImg from "@/assets/Botox.jpg";

export interface TreatmentCardProps {
    treatment: Treatment;
    onSelect?: (treatment: Treatment) => void;
}

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
        <div
            className="w-full bg-white border border-gray-100 rounded-2xl shadow-sm hover:shadow-lg transition-all duration-300 flex flex-col md:flex-row overflow-hidden cursor-pointer group"
            onClick={handleClick}
        >
            {/* Treatment Image */}
            <div className="md:w-[280px] h-[200px] md:h-auto bg-gray-100 relative shrink-0 overflow-hidden">
                <img
                    src={imageUrl}
                    alt={treatment.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute top-3 left-3 bg-black/70 backdrop-blur-md text-white px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest whitespace-nowrap">
                    {treatment.category}
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 p-5 md:p-6 flex flex-col min-w-0">
                <div className="flex justify-between items-start mb-2 gap-4">
                    <div className="min-w-0">
                        <h3 className="text-xl font-black text-gray-900 truncate group-hover:text-lime-700 transition-colors">
                            {treatment.name}
                        </h3>
                        <p className="text-sm text-gray-500 line-clamp-2 mt-1 italic">
                            {treatment.shortDescription}
                        </p>
                    </div>
                    <div className="text-right shrink-0">
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-tighter">Starting from</p>
                        <p className="text-2xl font-black text-lime-700"><span className="font-sans">€</span>{treatment.fromPrice || '?'}</p>
                    </div>
                </div>

                {/* Availability Section */}
                <div className="mt-auto pt-4 border-t border-gray-100">
                    <div className="flex items-center justify-between">
                        <div>
                            <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Available at</h4>
                            <div className="flex flex-wrap gap-2">
                                {treatment.availableAt && treatment.availableAt.length > 0 ? (
                                    treatment.availableAt.map((clinicName, idx) => (
                                        <span key={idx} className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 rounded-lg border border-gray-100 text-xs font-bold text-gray-700 animate-in fade-in slide-in-from-left-2 duration-300">
                                            <MapPin size={12} className="text-lime-600" />
                                            {clinicName}
                                        </span>
                                    ))
                                ) : (
                                    <span className="text-xs text-gray-400 italic">No clinics currently available</span>
                                )}
                                {treatment.clinicsCount && treatment.clinicsCount > 1 && (
                                    <span className="px-3 py-1.5 bg-lime-50 rounded-lg border border-lime-100 text-xs font-black text-lime-700">
                                        +{treatment.clinicsCount - 1} more
                                    </span>
                                )}
                            </div>
                        </div>

                        <div className="flex gap-2">
                            <button
                                className="px-4 h-10 bg-gray-100 text-gray-900 text-xs font-black uppercase tracking-widest rounded-xl flex items-center justify-center gap-2 hover:bg-gray-200 transition-colors"
                                onClick={(e) => { e.stopPropagation(); setShowExplanation(true); }}
                            >
                                <Info size={16} /> Info
                            </button>
                            <button
                                className="px-5 h-10 bg-gray-900 text-white text-xs font-black uppercase tracking-widest rounded-xl flex items-center justify-center gap-2 group-hover:bg-lime-500 transition-colors shadow-lg"
                                onClick={(e) => { e.stopPropagation(); handleClick(); }}
                            >
                                Book <ChevronRight size={16} />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Explanation Modal */}
            {showExplanation && (
                <div 
                    className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300"
                    onClick={(e) => { e.stopPropagation(); setShowExplanation(false); }}
                >
                    <div 
                        className="bg-white w-full max-w-2xl rounded-[32px] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="h-48 bg-gray-100 relative">
                            <img src={imageUrl} alt={treatment.name} className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                            <button 
                                onClick={() => setShowExplanation(false)}
                                className="absolute top-4 right-4 size-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white hover:bg-white hover:text-black transition-all"
                            >
                                <X size={20} />
                            </button>
                            <div className="absolute bottom-6 left-6">
                                <span className="px-2 py-0.5 bg-[#CBFF38] text-black text-[9px] font-black uppercase tracking-widest rounded-md mb-2 inline-block">
                                    {treatment.category}
                                </span>
                                <h3 className="text-white text-2xl font-black uppercase italic tracking-tighter">
                                    {treatment.name}
                                </h3>
                            </div>
                        </div>
                        <div className="p-8">
                            <div className="flex gap-10">
                                <div className="flex-1">
                                    <h4 className="text-xs font-black uppercase tracking-[0.2em] text-gray-400 mb-4 flex items-center gap-2">
                                        <Info size={14} className="text-lime-500" /> Explanation
                                    </h4>
                                    <p className="text-gray-600 leading-relaxed text-base italic whitespace-pre-line border-l-4 border-lime-400 pl-6 py-2">
                                        {treatment.fullDescription || treatment.shortDescription}
                                    </p>
                                </div>
                            </div>
                            <div className="mt-8 pt-8 border-t border-gray-100 flex justify-between items-center">
                                <div className="flex gap-4">
                                    <div className="flex flex-col items-center">
                                        <Shield className="text-gray-400 mb-1" size={16} />
                                        <span className="text-[8px] font-black uppercase text-gray-400">Safe</span>
                                    </div>
                                    <div className="flex flex-col items-center">
                                        <Award className="text-gray-400 mb-1" size={16} />
                                        <span className="text-[8px] font-black uppercase text-gray-400">Expert</span>
                                    </div>
                                </div>
                                <button 
                                    className="px-8 h-12 bg-[#CBFF38] text-black rounded-xl font-black uppercase tracking-widest text-[10px] shadow-lg shadow-lime-200 hover:scale-105 transition-transform"
                                    onClick={() => { setShowExplanation(false); handleClick(); }}
                                >
                                    Book This Treatment
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
