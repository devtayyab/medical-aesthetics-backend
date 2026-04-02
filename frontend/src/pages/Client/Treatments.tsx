import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { css } from "@emotion/css";
import { FaChevronRight, FaArrowRight } from "react-icons/fa6";
import { FaStethoscope, FaMagic, FaSyringe, FaCut, FaTooth, FaLeaf } from "react-icons/fa";
import LayeredBG from "@/assets/LayeredBg.svg";
import { motion } from "framer-motion";

const containerStyle = css`
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 24px;
`;

const categories = [
    {
        id: "dermatology",
        name: "Dermatology",
        description: "Skin health and medical treatments provided by certified dermatologists.",
        icon: <FaStethoscope size={30} />,
        color: "#CBFF38"
    },
    {
        id: "plastic-surgery",
        name: "Plastic Surgery",
        description: "Cosmetic and reconstructive procedures for face and body enhancements.",
        icon: <FaMagic size={30} />,
        color: "#CBFF38"
    },
    {
        id: "aesthetics",
        name: "Aesthetics",
        description: "Non-surgical beauty treatments including fillers, botox, and skin rejuvenation.",
        icon: <FaSyringe size={30} />,
        color: "#CBFF38"
    },
    {
        id: "hair",
        name: "Hair Treatments",
        description: "Advanced hair restoration, transplant, and professional removal services.",
        icon: <FaCut size={30} />,
        color: "#CBFF38"
    },
    {
        id: "dentistry",
        name: "Dentistry",
        description: "Aesthetic dental procedures for a perfect smile and oral health.",
        icon: <FaTooth size={30} />,
        color: "#CBFF38"
    },
    {
        id: "wellness",
        name: "Wellness",
        description: "Holistic health treatments, spa services, and wellness consultations.",
        icon: <FaLeaf size={30} />,
        color: "#CBFF38"
    }
];

export const Treatments: React.FC = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-[#FDFDFD] pb-24">
            {/* Hero Header */}
            <div className="bg-[#1A1A1A] text-white pt-16 pb-28 px-6 relative overflow-hidden">
                <div className="max-w-6xl mx-auto relative z-10 text-center">
                    <div className="flex items-center justify-center gap-4 mb-4 text-[#CBFF38] text-[10px] font-black uppercase tracking-[0.2em] italic">
                        <Link to="/" className="hover:opacity-80 transition-opacity">Home</Link>
                        <FaChevronRight size={10} />
                        <span>Treatments</span>
                    </div>
                    <h1 className="text-5xl md:text-7xl font-black uppercase italic tracking-tighter leading-tight mb-4">
                        Discover<br/>
                        <span className="text-[#CBFF38]">Treatments</span>
                    </h1>
                    <p className="text-gray-400 font-medium max-w-2xl mx-auto text-lg italic">
                        Explore our comprehensive range of medical aesthetics and beauty procedures designed to help you look and feel your absolute best.
                    </p>
                </div>
                <div className="absolute top-0 right-0 w-1/3 h-full bg-gradient-to-l from-[#CBFF38]/10 to-transparent pointer-events-none" />
                <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none" style={{ backgroundImage: `url(${LayeredBG})`, backgroundSize: 'cover' }} />
            </div>

            <div className={containerStyle + " -mt-16 relative z-20"}>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {categories.map((cat, idx) => (
                        <motion.div
                            key={cat.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.1 }}
                            className="bg-white rounded-[32px] p-8 border border-gray-100 shadow-xl hover:shadow-2xl hover:border-[#CBFF38] transition-all group flex flex-col h-full"
                        >
                            <div className="size-20 bg-[#F7F9FC] group-hover:bg-[#CBFF38] rounded-2xl flex items-center justify-center text-gray-900 mb-8 transition-colors">
                                {cat.icon}
                            </div>
                            <h3 className="text-2xl font-black uppercase italic tracking-tight text-gray-900 mb-4 group-hover:text-black">
                                {cat.name}
                            </h3>
                            <p className="text-gray-500 font-medium text-base mb-8 flex-1 italic leading-relaxed">
                                {cat.description}
                            </p>
                            <button
                                onClick={() => navigate(`/search?category=${cat.id}`)}
                                className="w-full h-14 bg-black text-[#CBFF38] rounded-2xl flex items-center justify-center gap-3 font-black text-xs uppercase tracking-widest hover:bg-[#CBFF38] hover:text-black transition-all active:scale-95"
                            >
                                Browse {cat.name} <FaArrowRight size={12} />
                            </button>
                        </motion.div>
                    ))}
                </div>

                {/* Promotional Banner */}
                <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    className="mt-16 bg-[#CBFF38] rounded-[40px] p-10 md:p-16 text-center shadow-2xl relative overflow-hidden"
                >
                    <div className="relative z-10">
                        <h2 className="text-3xl md:text-5xl font-black uppercase italic tracking-tighter text-black mb-6">
                            Unsure which treatment is <span className="underline decoration-4">right for you?</span>
                        </h2>
                        <p className="text-black/80 font-bold max-w-2xl mx-auto mb-10 text-lg italic">
                            Book a free digital consultation with one of our specialists to discuss your goals and receive a personalized treatment plan.
                        </p>
                        <button 
                            onClick={() => navigate('/search')}
                            className="px-10 h-16 bg-black text-white rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-gray-900 transition-all shadow-xl"
                        >
                            Find a Clinic Near You
                        </button>
                    </div>
                    {/* Background decorative elements */}
                    <div className="absolute top-0 right-0 size-40 bg-black opacity-5 rounded-full -mr-20 -mt-20" />
                    <div className="absolute bottom-0 left-0 size-60 bg-white opacity-20 rounded-full -ml-30 -mb-30" />
                </motion.div>
            </div>
        </div>
    );
};
