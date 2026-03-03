import React from "react";
import { Star, MapPin, Clock, ChevronRight } from "lucide-react";
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
                        <p className="text-2xl font-black text-lime-700">£{treatment.fromPrice || '?'}</p>
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

                        <button
                            className="size-10 bg-gray-900 text-white rounded-xl flex items-center justify-center group-hover:bg-lime-500 transition-colors shadow-lg"
                            onClick={(e) => { e.stopPropagation(); handleClick(); }}
                        >
                            <ChevronRight size={20} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
