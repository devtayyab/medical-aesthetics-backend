import React, { useEffect, useState, useMemo } from "react";
import type { Treatment } from "@/types";
import { useParams, useNavigate } from "react-router-dom";
import { clinicsAPI } from "@/services/api";
import { Button } from "@/components/atoms/Button/Button";
import { css } from "@emotion/css";
import { MapPin, ChevronRight, Info, Shield, Award, Sparkles, Star, Check, Euro, Clock, Map as MapIcon, Layout, Maximize2, Settings2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { ClinicMap } from "@/components/organisms/ClinicMap/ClinicMap";
import { SearchBar } from "@/components/organisms/SearchBar";
import BotoxImg from "@/assets/Botox.jpg";

// Category Icons
import DermaIcon from "@/assets/Icons/TreatmentIcons/DermaIcon.svg";
import CosmeticIcon from "@/assets/Icons/TreatmentIcons/CosmeticIcon.svg";
import BodyIcon from "@/assets/Icons/TreatmentIcons/BodyIcon.svg";
import HairIcon from "@/assets/Icons/TreatmentIcons/HairIcon.svg";
import DentistIcon from "@/assets/Icons/TreatmentIcons/Dentisticon.svg";

const categories = [
  { id: "dermatology", name: "Dermatology", icon: DermaIcon },
  { id: "plastic-surgery", name: "Plastic Surgery", icon: CosmeticIcon },
  { id: "aesthetics", name: "Aesthetics", icon: BodyIcon },
  { id: "hair", name: "Hair Treatments", icon: HairIcon },
  { id: "dentistry", name: "Dentistry", icon: DentistIcon },
];

// Premium Assets
import RhinoplastyElite from "@/assets/Treatments/rhinoplasty_elite.png";
import BotoxElite from "@/assets/Treatments/botox_elite.png";
import HairElite from "@/assets/Treatments/hair_transplant_elite.png";
import FillersElite from "@/assets/Treatments/fillers_elite.png";
import EyesElite from "@/assets/Treatments/eyes_surgery_elite.png";
import RejuvenationElite from "@/assets/Treatments/rejuvenation_elite.png";
import PrpElite from "@/assets/Treatments/prp_therapy_elite.png";
import BeardElite from "@/assets/Treatments/beard_transplant_elite.png";

const getFallbackImage = (name: string): string => {
    const n = name.toLowerCase();
    if (n.includes('botox') || n.includes('wrinkle')) return BotoxElite;
    if (n.includes('filler') || n.includes('lip')) return FillersElite;
    if (n.includes('rhinoplasty') || n.includes('nose')) return RhinoplastyElite;
    if (n.includes('hair') || n.includes('transplant')) return HairElite;
    if (n.includes('eye') || n.includes('bleph')) return EyesElite;
    if (n.includes('skin') || n.includes('rejuvenation') || n.includes('peel') || n.includes('facial')) return RejuvenationElite;
    if (n.includes('prp')) return PrpElite;
    if (n.includes('beard')) return BeardElite;
    return BotoxImg;
};

const heroContainer = (showMap: boolean) => css`
  display: flex;
  flex-direction: column;
  @media (min-width: 1024px) {
    flex-direction: row;
  }
  background: #000;
  border-radius: 0;
  overflow: hidden;
  height: auto;
  @media (min-width: 1024px) {
    height: 450px;
  }
  position: relative;
  border-bottom: 1px solid rgba(255,255,255,0.05);
`;

const infoSide = (showMap: boolean) => css`
  flex: ${showMap ? '1.3' : '1'};
  background: linear-gradient(135deg, #121212 0%, #1a1a1a 100%);
  color: white;
  display: flex;
  flex-direction: column;
  @media (min-width: 768px) {
    flex-direction: row;
  }
  overflow: hidden;
  transition: all 0.6s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  z-index: 10;
`;

const mapSide = css`
  flex: 0.7;
  background: #e5e7eb;
  min-height: 350px;
  position: relative;
  border-left: 1px solid rgba(255,255,255,0.1);
`;

const treatmentCardImage = css`
  width: 100%;
  @media (min-width: 768px) {
    width: 40%;
  }
  height: 250px;
  @media (min-width: 768px) {
    height: 100%;
  }
  object-fit: cover;
  filter: saturate(0.8) contrast(1.1);
`;

const glassOverlay = css`
  position: absolute;
  inset: 0;
  background: radial-gradient(circle at 0% 0%, rgba(203, 255, 56, 0.05) 0%, transparent 50%);
  pointer-events: none;
`;

export const TreatmentDetails: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [treatment, setTreatment] = useState<Treatment & { offerings: any[] } | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [showMap, setShowMap] = useState(true);
    const [imgError, setImgError] = useState(false);

    useEffect(() => {
        if (id) {
            clinicsAPI.getTreatmentDetails(id).then(res => {
                setTreatment(res.data);
                setIsLoading(false);
            }).catch(() => {
                setIsLoading(false);
            });
        }
        window.scrollTo(0, 0);
    }, [id]);

    const mapCenter = useMemo(() => {
        if (treatment?.offerings && treatment.offerings.length > 0) {
            const lat = treatment.offerings.reduce((sum, o) => sum + Number(o.latitude || 0), 0) / treatment.offerings.length;
            const lng = treatment.offerings.reduce((sum, o) => sum + Number(o.longitude || 0), 0) / treatment.offerings.length;
            return [lat || 37.9838, lng || 23.7275] as [number, number];
        }
        return [37.9838, 23.7275] as [number, number];
    }, [treatment]);

    const handleSearch = (filters: any) => {
        const params = new URLSearchParams();
        if (filters.query) params.set('query', filters.query);
        if (filters.category) params.set('category', filters.category);
        navigate(`/search?${params.toString()}`);
    };

    if (isLoading) return (
      <div className="h-screen bg-black flex items-center justify-center">
        <motion.div 
          animate={{ scale: [1, 1.1, 1], opacity: [0.3, 1, 0.3] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          className="text-[#CBFF38] font-black italic tracking-[1em] text-[10px] uppercase"
        >
          Analyzing Protocol...
        </motion.div>
      </div>
    );

    if (!treatment) return <div className="p-20 text-center text-red-500 font-bold">Treatment not found.</div>;

    return (
        <div className="min-h-screen bg-white text-gray-900">
            {/* Split Hero Section - Compact Version */}
            <div className={heroContainer(showMap)}>
                {/* Left: Info Card */}
                <motion.div 
                    layout
                    className={infoSide(showMap)}
                >
                    <div className={glassOverlay} />
                    <motion.img 
                        layout
                        src={(imgError || !treatment.imageUrl || treatment.imageUrl.includes('placehold')) ? getFallbackImage(treatment.name) : treatment.imageUrl} 
                        className={treatmentCardImage}
                        alt={treatment.name}
                        onError={() => setImgError(true)}
                    />
                    <div className="p-8 md:p-12 flex flex-col justify-center flex-1 relative z-10">
                        <div className="flex items-center justify-between mb-4">
                            <motion.div layout>
                                <span className="text-[9px] font-black text-[#CBFF38] uppercase tracking-[0.4em] italic mb-2 block opacity-70">
                                   {treatment.category || 'Aesthetic Protocol'}
                                </span>
                                <h1 className="text-4xl md:text-5xl font-black uppercase italic tracking-tighter text-white leading-[0.85]">
                                    {treatment.name}
                                </h1>
                            </motion.div>
                            
                            {/* Toggle Map Button */}
                            <button 
                                onClick={() => setShowMap(!showMap)}
                                className="size-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-[#CBFF38] hover:bg-[#CBFF38] hover:text-black transition-all group hidden lg:flex"
                                title={showMap ? "Hide Map" : "Show Map"}
                            >
                                {showMap ? <Layout size={18} /> : <MapIcon size={18} />}
                            </button>
                        </div>

                        <div className="flex items-center gap-3 mb-6">
                            <div className="flex text-[#CBFF38] gap-0.5">
                                {[...Array(5)].map((_, i) => <Star key={i} size={12} fill="currentColor" />)}
                            </div>
                            <span className="text-[8px] font-black text-gray-500 uppercase tracking-[0.2em] italic">
                                Verified Excellence • 384 Reports
                            </span>
                        </div>

                        <p className="text-[11px] md:text-xs text-gray-400 leading-relaxed mb-6 italic max-w-lg">
                            {treatment.shortDescription || "Precision clinical implementation with results optimized for individual anatomical structures."}
                        </p>

                        <div className="grid grid-cols-2 gap-y-2 gap-x-4 mb-8">
                            <div className="flex items-center gap-2 text-[9px] font-black text-white uppercase italic tracking-widest">
                                <Check size={12} className="text-[#CBFF38]" /> Dynamic Rejuvenation
                            </div>
                            <div className="flex items-center gap-2 text-[9px] font-black text-white uppercase italic tracking-widest">
                                <Check size={12} className="text-[#CBFF38]" /> Clinical Precision
                            </div>
                        </div>

                        <div className="flex flex-wrap gap-3 mt-auto">
                            <button 
                                onClick={() => {
                                    const element = document.getElementById('clinics-list');
                                    element?.scrollIntoView({ behavior: 'smooth' });
                                }}
                                className="px-8 h-12 bg-[#CBFF38] text-black rounded-xl font-black text-[10px] uppercase tracking-[0.2em] italic hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2 shadow-lg"
                            >
                                Find Clinicians <ChevronRight size={14} />
                            </button>
                            
                            {!showMap && (
                                <button 
                                    onClick={() => setShowMap(true)}
                                    className="px-6 h-12 bg-white/5 border border-white/10 text-white rounded-xl font-black text-[9px] uppercase tracking-[0.2em] italic hover:bg-white/10 transition-all flex lg:hidden items-center justify-center gap-2"
                                >
                                    <MapIcon size={14} /> Show Radar
                                </button>
                            )}
                        </div>
                    </div>
                </motion.div>

                {/* Right: Map */}
                <AnimatePresence>
                    {showMap && (
                        <motion.div 
                            initial={{ width: 0, opacity: 0 }}
                            animate={{ width: 'auto', opacity: 1 }}
                            exit={{ width: 0, opacity: 0 }}
                            transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
                            className={mapSide}
                        >
                            <ClinicMap 
                                clinics={treatment.offerings?.map(o => ({
                                    ...o,
                                    id: o.clinicId,
                                    name: o.clinicName,
                                    latitude: o.latitude,
                                    longitude: o.longitude
                                })) || []} 
                                center={mapCenter} 
                                zoom={13} 
                            />
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Clinic List - Practitioners First */}
            <section id="clinics-list" className="py-16 bg-white">
                <div className="container mx-auto px-8">
                    <div className="mb-12">
                        <span className="text-[9px] font-black text-[#CBFF38] uppercase tracking-[0.3em] italic mb-2 block">Premium Selection</span>
                        <h2 className="text-3xl md:text-4xl font-black uppercase italic tracking-tighter text-gray-900 leading-none">
                            Verified <span className="text-[#CBFF38] bg-black px-3 py-1">Practitioners</span>
                        </h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {treatment.offerings?.map((offering: any, idx: number) => (
                            <motion.div 
                                key={offering.clinicId}
                                initial={{ opacity: 0, y: 15 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: idx * 0.1 }}
                                className="bg-white p-8 rounded-[2.5rem] border border-gray-100 hover:border-[#CBFF38] transition-all hover:-translate-y-1 group shadow-sm"
                            >
                                <div className="flex justify-between items-start mb-8">
                                    <div className="max-w-[70%]">
                                        <h4 className="text-xl font-black uppercase italic tracking-tight text-gray-900 group-hover:text-[#CBFF38] transition-colors leading-none mb-2">
                                            {offering.clinicName}
                                        </h4>
                                        <div className="flex items-center gap-2 text-[8px] font-bold text-gray-400 uppercase tracking-widest italic">
                                            <MapPin size={10} className="text-[#CBFF38]" /> {offering.location}
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="flex items-center justify-end text-2xl font-black text-gray-900 italic leading-none mb-1">
                                            <Euro size={16} className="text-[#CBFF38]" /> {offering.price}
                                        </div>
                                        <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest">{offering.durationMinutes}m</span>
                                    </div>
                                </div>

                                <button 
                                    onClick={() => navigate(`/appointment/booking?clinicId=${offering.clinicId}&serviceIds=${offering.id}`)}
                                    className="w-full h-14 bg-[#121212] text-[#CBFF38] rounded-xl font-black text-[10px] uppercase tracking-[0.3em] italic hover:bg-[#CBFF38] hover:text-black transition-all shadow-md active:scale-95 flex items-center justify-center gap-2"
                                >
                                    Initiate Booking <ChevronRight size={14} />
                                </button>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* In-depth Description - Moved Down */}
            <section className="py-12 bg-[#FAFAFA] border-b border-gray-100">
                <div className="container mx-auto px-8 max-w-4xl">
                    <div className="flex items-center gap-4 mb-6">
                        <div className="h-px bg-gray-200 flex-1"></div>
                        <h3 className="text-[9px] font-black uppercase tracking-[0.4em] text-[#CBFF38] bg-black px-3 py-1 rounded-md italic shrink-0">In-depth Protocol</h3>
                        <div className="h-px bg-gray-200 flex-1"></div>
                    </div>
                    <p className="text-lg md:text-xl font-medium text-gray-800 leading-relaxed italic text-center">
                        {treatment.fullDescription}
                    </p>
                </div>
            </section>
        </div>
    );
};
