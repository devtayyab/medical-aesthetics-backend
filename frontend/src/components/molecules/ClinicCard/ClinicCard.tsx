import React from "react";
import { Star, MapPin, Clock } from "lucide-react";
import type { Clinic } from "@/types";
import BotoxImg from "@/assets/Botox.jpg";

export interface ClinicCardProps {
  clinic: Clinic;
  index?: number;
  onSelect?: (clinic: Clinic) => void;
  searchQuery?: string;
  searchDate?: string;
}

export const ClinicCard: React.FC<ClinicCardProps> = ({
  clinic,
  index = 0,
  onSelect,
  searchQuery,
  searchDate,
}) => {
  const handleClick = () => {
    onSelect?.(clinic);
  };

  const imageUrl = clinic.photoUrl || clinic.images?.[index] || clinic.images?.[0] || BotoxImg;

  // Filter services if there is a specific search query
  const displayServices = clinic.services?.filter(s =>
    !searchQuery || s.treatment?.name?.toLowerCase().includes(searchQuery.toLowerCase())
  ).slice(0, 3) || [];

  return (
    <div
      className="w-full bg-white border border-gray-100 rounded-2xl shadow-sm hover:shadow-lg transition-all duration-300 flex flex-col md:flex-row overflow-hidden cursor-pointer group"
      onClick={handleClick}
    >
      {/* Clinic Image */}
      <div className="md:w-[280px] h-[200px] md:h-auto bg-gray-100 relative shrink-0 overflow-hidden">
        <img
          src={imageUrl}
          alt={clinic.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
        />
        <button className="absolute top-3 right-3 size-8 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center text-gray-400 hover:text-red-500 transition-colors shadow-sm">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-5 md:p-6 flex flex-col min-w-0">

        {/* Header Row */}
        <div className="flex justify-between items-start mb-2 gap-4">
          <div className="min-w-0">
            <h3 className="text-xl font-black text-gray-900 truncate group-hover:text-lime-700 transition-colors">
              {clinic.name}
            </h3>

            <div className="flex items-center gap-1 mt-1 font-bold text-sm">
              <span className="text-gray-900">
                {(clinic.rating !== null && clinic.rating !== undefined)
                  ? Number(clinic.rating).toFixed(1)
                  : "4.9"}
              </span>
              <div className="flex text-yellow-400">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} size={14} fill="currentColor" stroke="none" />
                ))}
              </div>
              <span className="text-gray-400 font-medium ml-1">
                ({clinic.reviewCount || 120})
              </span>
            </div>
          </div>
        </div>

        {/* Location Row */}
        <div className="flex items-center gap-1.5 text-sm text-gray-500 font-medium mb-5 truncate">
          <MapPin size={14} className="shrink-0" />
          <span className="truncate">{clinic.address?.city}</span>
          {clinic.distance !== undefined && (
            <>
              <span className="mx-1">•</span>
              <span className="shrink-0 text-lime-600">{Number(clinic.distance).toFixed(1)}km away</span>
            </>
          )}
        </div>

        {/* Services List (Treatwell style) */}
        <div className="mt-auto space-y-3 pt-4 border-t border-gray-100 flex-1">
          {displayServices.length > 0 ? (
            displayServices.map((service, idx) => (
              <div
                key={idx}
                onClick={(e) => { e.stopPropagation(); window.location.href = `/appointment/booking?clinicId=${clinic.id}&serviceIds=${service.id}`; }}
                className="flex items-center justify-between gap-4 group/service hover:bg-lime-50 -mx-3 px-3 py-2 rounded-xl transition-colors cursor-pointer border border-transparent hover:border-lime-100"
              >
                <div className="min-w-0 flex-1">
                  <h4 className="text-sm font-black text-gray-800 truncate group-hover/service:text-lime-700">{service.treatment?.name}</h4>
                  <div className="flex items-center gap-2 mt-0.5">
                    <Clock size={10} className="text-gray-400" />
                    <p className="text-[11px] font-bold text-gray-400 uppercase tracking-tighter">{service.durationMinutes} mins</p>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-[10px] font-black text-gray-300 uppercase leading-none mb-0.5">starting from</p>
                  <p className="text-[14px] font-black text-lime-700">{service.price}</p>
                </div>
              </div>
            ))
          ) : (
            <div className="text-sm text-gray-500 italic py-2">
              Treatments starting from 49. View clinic to see all services.
            </div>
          )}
        </div>

        {/* Availability Snippet & CTA Buttons */}
        <div className="mt-5 flex flex-col sm:flex-row items-center justify-between gap-4 bg-lime-50/50 p-3 rounded-2xl border border-lime-100/50">
          <div className="flex flex-col">
            <div className="flex items-center gap-2 text-sm">
              <div className="size-2 bg-lime-500 rounded-full animate-pulse"></div>
              <div className="font-black text-[11px] uppercase tracking-widest text-[#1a202c]">
                {searchDate ? (
                  <>Next Available: <span className="text-lime-700">Today 11:30</span></>
                ) : (
                  <span className="text-lime-700">Next available: Today 14:00</span>
                )}
              </div>
            </div>
            <p className="text-[10px] font-bold text-gray-400 mt-1 pl-4 italic">
              Booking highly recommended
            </p>
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            <button
              className="flex-1 sm:flex-none border-2 border-gray-900 text-gray-900 hover:bg-gray-900 hover:text-white px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
              onClick={(e) => { e.stopPropagation(); handleClick(); }}
            >
              Details
            </button>
            <button
              className="flex-1 sm:flex-none bg-gray-900 text-white hover:bg-lime-500 hover:border-lime-500 px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg active:scale-95"
              onClick={(e) => { e.stopPropagation(); handleClick(); }}
            >
              Book Now
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
