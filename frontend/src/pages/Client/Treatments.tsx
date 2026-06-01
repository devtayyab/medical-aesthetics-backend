import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { css } from "@emotion/css";
import { ChevronRight, ArrowRight, Sparkles, Wand2, Syringe, Scissors, Pill, Microscope, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useCategoryTree, PublicCategory, PublicTreatment } from "@/hooks/useCategoryTree";
import { getImageUrl } from "@/utils/imageUrl";

// Clinical visual assets
import HeroBg from "@/assets/Blog_Hero.jpg";

// Fallback Treatment Assets
import RhinoplastyImg from "@/assets/Treatments/rhinoplasty_elite.png";
import BotoxImg from "@/assets/Treatments/botox_elite.png";
import HairImg from "@/assets/Treatments/hair_transplant_elite.png";
import FillersImg from "@/assets/Treatments/fillers_elite.png";
import EyesImg from "@/assets/Treatments/eyes_surgery_elite.png";
import RejuvenationImg from "@/assets/Treatments/rejuvenation_elite.png";
import PrpImg from "@/assets/Treatments/prp_therapy_elite.png";
import BeardTransplantImg from "@/assets/Treatments/beard_transplant_elite.png";

const getFallbackImg = (name: string): string => {
    const n = (name || '').toLowerCase();
    if (n.includes('botox') || n.includes('wrinkle')) return BotoxImg;
    if (n.includes('filler') || n.includes('lip')) return FillersImg;
    if (n.includes('rhinoplasty') || n.includes('nose')) return RhinoplastyImg;
    if (n.includes('hair') || n.includes('transplant') || n.includes('fue')) return HairImg;
    if (n.includes('eye') || n.includes('bleph')) return EyesImg;
    if (n.includes('skin') || n.includes('rejuvenation') || n.includes('peel') || n.includes('facial')) return RejuvenationImg;
    if (n.includes('prp')) return PrpImg;
    if (n.includes('beard')) return BeardTransplantImg;
    return BotoxImg;
};

const getCategoryIcon = (name: string) => {
    const n = (name || '').toLowerCase();
    if (n.includes('hair')) return <Scissors size={24} />;
    if (n.includes('derm') || n.includes('skin')) return <Microscope size={24} />;
    if (n.includes('plastic') || n.includes('cosmet') || n.includes('surgical')) return <Wand2 size={24} />;
    return <Syringe size={24} />;
};

const sectionStyles = css`
  min-height: 100vh;
  background: radial-gradient(circle at top right, rgba(203, 255, 56, 0.05), transparent), #FFFFFF;
`;

const glassCard = css`
  background: white;
  border-radius: 40px;
  box-shadow: 0 50px 100px rgba(0, 0, 0, 0.04);
  border: 1px solid #F1F5F9;
  position: relative;
  overflow: hidden;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  
  &:hover {
    border-color: #CBFF38;
    transform: translateY(-8px);
    box-shadow: 0 60px 120px rgba(0, 0, 0, 0.07);
  }
`;

const subTreatmentCard = css`
  background: #F8F9FA;
  border-radius: 20px;
  overflow: hidden;
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 12px;
  transition: all 0.2s ease;
  cursor: pointer;
  border: 1px solid transparent;

  &:hover {
    background: white;
    border-color: #CBFF38;
    transform: translateX(5px);
  }
`;

// A single top-level category card: shows its subcategories and every treatment
// beneath it (its own + its subcategories'), all read from the pre-fetched tree.
const CategoryCard: React.FC<{ category: PublicCategory; idx: number }> = ({ category, idx }) => {
    const navigate = useNavigate();
    const subs = category.children || [];
    // Aggregate the category's own treatments with those of its subcategories,
    // de-duplicated by id. No extra request — the tree was fetched withTreatments.
    const treatments: PublicTreatment[] = React.useMemo(() => {
        const seen = new Set<string>();
        const out: PublicTreatment[] = [];
        for (const t of [...(category.treatments || []), ...(category.children || []).flatMap((s) => s.treatments || [])]) {
            if (!seen.has(t.id)) { seen.add(t.id); out.push(t); }
        }
        return out;
    }, [category]);

    return (
        <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className={glassCard}
        >
            <div className="p-10 md:p-12">
                <div className="flex items-center justify-between mb-10">
                    <div className="flex items-center gap-6">
                        <div className="size-16 rounded-3xl bg-black flex items-center justify-center text-[#CBFF38] shadow-2xl text-2xl font-black">
                            {category.icon ? <span>{category.icon}</span> : getCategoryIcon(category.name)}
                        </div>
                        <div>
                            <h3 className="text-2xl font-black uppercase italic tracking-tight text-gray-900">{category.name}</h3>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1 italic">Elite Clinical Specialty</p>
                        </div>
                    </div>
                    <ArrowRight size={20} className="text-gray-200 group-hover:text-lime-500 transition-colors" />
                </div>

                {category.description && (
                    <p className="text-[13px] font-medium text-gray-500 mb-10 italic leading-relaxed">{category.description}</p>
                )}

                {/* Subcategories */}
                {subs.length > 0 && (
                    <div className="mb-8">
                        <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-4 italic">Subcategories</h4>
                        <div className="flex flex-wrap gap-2">
                            {subs.map((sub) => (
                                <button
                                    key={sub.id}
                                    onClick={() => navigate(`/search?category=${encodeURIComponent(sub.name)}`)}
                                    className="px-4 py-2 bg-gray-50 hover:bg-[#CBFF38] border border-gray-100 rounded-full text-[10px] font-black uppercase italic tracking-widest text-gray-800 transition-all"
                                >
                                    {sub.icon ? `${sub.icon} ` : ''}{sub.name}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Treatments inside this category */}
                {treatments.length > 0 && (
                    <div className="space-y-4">
                        <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-6 italic">Featured Procedures</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {treatments.map((t) => (
                                <div key={t.id} className={subTreatmentCard} onClick={() => navigate(`/search?query=${encodeURIComponent(t.name)}`)}>
                                    <div className="size-12 rounded-xl overflow-hidden shrink-0 bg-gray-100 flex items-center justify-center">
                                        <img
                                            src={t.imageUrl ? getImageUrl(t.imageUrl) : getFallbackImg(t.name)}
                                            onError={(e: any) => { e.target.src = getFallbackImg(t.name); }}
                                            className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-500"
                                            alt={t.name}
                                        />
                                    </div>
                                    <span className="text-[10px] font-black uppercase italic tracking-widest text-gray-900">{t.name}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                <div className="mt-12 pt-8 border-t border-gray-50">
                    <button
                        onClick={() => navigate(`/search?category=${encodeURIComponent(category.name)}`)}
                        className="w-full h-14 bg-black text-[#CBFF38] rounded-2xl flex items-center justify-center gap-4 font-black text-[10px] uppercase tracking-[0.2em] italic hover:bg-lime-500 hover:text-black transition-all active:scale-95 shadow-2xl"
                    >
                        Examine Category <ChevronRight size={14} />
                    </button>
                </div>
            </div>
        </motion.div>
    );
};

export const Treatments: React.FC = () => {
    const [showConsultModal, setShowConsultModal] = React.useState(false);
    const { categories, loading } = useCategoryTree({ withTreatments: true });

    return (
        <div className={sectionStyles}>
            <AnimatePresence>
                {showConsultModal && (
                    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setShowConsultModal(false)}
                            className="absolute inset-0 bg-black/60 backdrop-blur-md"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="bg-white w-full max-w-md rounded-[2.5rem] p-10 relative z-10 shadow-2xl overflow-hidden border border-gray-100"
                        >
                            <div className="absolute top-0 right-0 p-6">
                                <button onClick={() => setShowConsultModal(false)} className="text-gray-400 hover:text-black transition-colors">
                                    <Sparkles size={24} className="text-[#CBFF38]" />
                                </button>
                            </div>

                            <h2 className="text-3xl font-black uppercase italic tracking-tighter text-gray-900 mb-2">Connect with us</h2>
                            <p className="text-gray-500 font-bold text-xs uppercase tracking-widest mb-10 italic">Professional Consultation Protocols</p>

                            <div className="space-y-4">
                                <a
                                    href="mailto:info@beautydoctors.gr?subject=Professional Consultation Request"
                                    className="w-full group p-6 bg-gray-50 hover:bg-black rounded-3xl flex items-center gap-6 transition-all duration-300 border border-transparent"
                                >
                                    <div className="size-14 rounded-2xl bg-white border border-gray-100 flex items-center justify-center text-gray-900 group-hover:scale-110 transition-transform shadow-sm">
                                        <Syringe size={24} />
                                    </div>
                                    <div className="text-left">
                                        <h4 className="font-black uppercase italic text-gray-900 text-lg group-hover:text-[#CBFF38]">Email Inquiry</h4>
                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest group-hover:text-gray-300">Official Correspondence</p>
                                    </div>
                                </a>
                            </div>

                            <p className="text-center mt-10 text-[9px] font-black uppercase tracking-widest text-gray-300">Beauty & Doctors Official Network</p>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Immersive Hero Header */}
            <div className="relative pt-24 pb-48 overflow-hidden">
                <div className="absolute inset-0 z-0">
                    <img
                        src={HeroBg}
                        style={{ objectPosition: 'center 70%' }}
                        className="w-full h-full object-cover opacity-[0.35]"
                        alt="Hero background"
                    />
                </div>

                <div className="container mx-auto px-8 relative z-10">
                    <div className="max-w-4xl">
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="flex items-center gap-3 mb-8 text-gray-400 text-[11px] font-black uppercase tracking-[0.2em] italic"
                        >
                            <Link to="/" className="text-gray-900 border-b border-gray-900 pb-0.5">ELITE CLINIC</Link>
                            <span className="text-lime-500"> CLINICAL_TREATMENTS</span>
                        </motion.div>

                        <h1 className="text-4xl md:text-6xl font-black uppercase italic tracking-tighter leading-none text-gray-900">
                            PROTOCOL <span className="text-[#CBFF38]">EXPERIENCE</span>
                        </h1>

                        <p className="text-gray-500 mt-8 font-bold text-lg max-w-2xl leading-relaxed italic">
                            Discover our comprehensive spectrum of medical aesthetics, surgical refinements, and advanced clinical protocols.
                        </p>
                    </div>
                </div>
            </div>

            <main className="max-w-7xl mx-auto px-8 relative z-20 -mt-[180px] pb-32">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                    {loading && (
                        <div className="md:col-span-2 flex flex-col items-center justify-center py-32 gap-4">
                            <Loader2 size={48} className="animate-spin text-[#CBFF38]" />
                            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 italic">Loading Catalog...</p>
                        </div>
                    )}
                    {!loading && categories.length === 0 && (
                        <div className="md:col-span-2 text-center py-12 text-gray-400 italic font-bold uppercase tracking-widest text-xs">
                            No treatment categories available yet.
                        </div>
                    )}
                    {!loading && categories.map((cat, idx) => (
                        <CategoryCard key={cat.id} category={cat} idx={idx} />
                    ))}

                    {/* Inquiry Card */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-black rounded-[40px] p-12 text-center shadow-2xl relative overflow-hidden flex flex-col justify-center min-h-[400px]"
                    >
                        <div className="relative z-10">
                            <Sparkles className="text-[#CBFF38] mx-auto mb-8" size={40} />
                            <h2 className="text-3xl md:text-5xl font-black uppercase italic tracking-tighter text-white mb-8 leading-tight">
                                Not sure which <br /> <span className="text-[#CBFF38]">path fits you?</span>
                            </h2>
                            <p className="text-gray-400 font-bold max-w-sm mx-auto mb-10 text-sm italic">
                                Receive a professional clinical assessment with our lead medical practitioners.
                            </p>
                            <button
                                onClick={() => setShowConsultModal(true)}
                                className="px-12 h-16 bg-[#CBFF38] text-black rounded-2xl font-black text-[11px] uppercase tracking-[0.3em] italic hover:bg-white transition-all shadow-xl active:scale-95"
                            >
                                Get Professional Consultant
                            </button>
                        </div>
                        <div className="absolute inset-0 opacity-10">
                            <img src="https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?q=80&w=800&auto=format&fit=crop" className="w-full h-full object-cover grayscale" alt="Microscope" />
                        </div>
                    </motion.div>
                </div>
            </main>
        </div>
    );
};
