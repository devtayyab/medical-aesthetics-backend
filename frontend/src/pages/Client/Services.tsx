import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { css } from "@emotion/css";
import { FaChevronRight, FaArrowRight } from "react-icons/fa6";
import { FaGift, FaWallet, FaHeadset, FaGlobe, FaShieldAlt, FaStar } from "react-icons/fa";
import LayeredBG from "@/assets/LayeredBg.svg";
import { motion } from "framer-motion";

const containerStyle = css`
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 24px;
`;

const extraServices = [
    {
        id: "loyalty",
        name: "Loyalty Program",
        description: "Earn points for every treatment and redeem them for exclusive discounts and free services.",
        icon: <FaStar size={30} />,
        link: "/loyalty"
    },
    {
        id: "gift-cards",
        name: "Gift Cards",
        description: "Surprise your loved ones with the gift of confidence. Available for all treatments and clinics.",
        icon: <FaGift size={30} />,
        link: "/gift-card"
    },
    {
        id: "wallet",
        name: "Digital Wallet",
        description: "Easily manage your payments, view history, and keep track of your treatment credits.",
        icon: <FaWallet size={30} />,
        link: "/payments"
    },
    {
        id: "support",
        name: "24/7 Support",
        description: "Our dedicated team of professionals are here to help you with booking and treatment advice.",
        icon: <FaHeadset size={30} />,
        link: "/support"
    },
    {
        id: "international",
        name: "International Clinics",
        description: "Access top-rated aesthetics clinics across various countries with seamless booking experience.",
        icon: <FaGlobe size={30} />,
        link: "/search"
    },
    {
        id: "gdpr",
        name: "Data Privacy",
        description: "Your information is secure and managed according to the highest data protection standards.",
        icon: <FaShieldAlt size={30} />,
        link: "/legal"
    }
];

export const Services: React.FC = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-[#FDFDFD] pb-24">
            {/* Hero Header */}
            <div className="bg-[#1A1A1A] text-white pt-16 pb-28 px-6 relative overflow-hidden">
                <div className="max-w-6xl mx-auto relative z-10 text-center">
                    <div className="flex items-center justify-center gap-4 mb-4 text-[#CBFF38] text-[10px] font-black uppercase tracking-[0.2em] italic">
                        <Link to="/" className="hover:opacity-80 transition-opacity">Home</Link>
                        <FaChevronRight size={10} />
                        <span>Other Services</span>
                    </div>
                    <h1 className="text-5xl md:text-7xl font-black uppercase italic tracking-tighter leading-tight mb-4">
                        Explore<br/>
                        <span className="text-[#CBFF38]">Services</span>
                    </h1>
                    <p className="text-gray-400 font-medium max-w-2xl mx-auto text-lg italic">
                        Beyond world-class treatments, we offer full-spectrum services to enhance your aesthetics journey and reward your loyalty.
                    </p>
                </div>
                <div className="absolute top-0 right-0 w-1/3 h-full bg-gradient-to-l from-[#CBFF38]/10 to-transparent pointer-events-none" />
                <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none" style={{ backgroundImage: `url(${LayeredBG})`, backgroundSize: 'cover' }} />
            </div>

            <div className={containerStyle + " -mt-16 relative z-20"}>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {extraServices.map((service, idx) => (
                        <motion.div
                            key={service.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.1 }}
                            className="bg-white rounded-[40px] p-10 border border-gray-100 shadow-xl hover:shadow-2xl hover:border-[#CBFF38] transition-all group flex flex-col h-full"
                        >
                            <div className="size-16 bg-black text-[#CBFF38] rounded-full flex items-center justify-center mb-8 group-hover:scale-105 transition-transform">
                                {service.icon}
                            </div>
                            <h3 className="text-2xl font-black uppercase italic tracking-tight text-gray-900 mb-4 group-hover:text-black">
                                {service.name}
                            </h3>
                            <p className="text-gray-500 font-medium text-base mb-8 flex-1 italic leading-relaxed">
                                {service.description}
                            </p>
                            <button
                                onClick={() => navigate(service.link)}
                                className="w-fit h-12 bg-gray-50 text-black px-8 rounded-full flex items-center justify-center gap-3 font-black text-[10px] uppercase tracking-widest hover:bg-[#CBFF38] hover:text-black transition-all active:scale-95"
                            >
                                Explore {service.name} <FaArrowRight size={10} />
                            </button>
                        </motion.div>
                    ))}
                </div>

                <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    className="mt-16 bg-[#1A1A1A] text-[#FDFDFD] rounded-[48px] p-12 md:p-20 text-center shadow-2xl relative overflow-hidden"
                >
                    <div className="relative z-10">
                        <div className="flex items-center justify-center gap-2 mb-4 text-[#CBFF38] text-2xl font-black uppercase tracking-tight italic">
                            <span className="text-5xl">5.0</span>
                            <div className="flex flex-col text-left">
                                <span className="text-sm">TRUST SCORE</span>
                                <div className="flex gap-1 text-[#CBFF38]">
                                    {[1,2,3,4,5].map(i => <FaStar key={i} size={14} />)}
                                </div>
                            </div>
                        </div>
                        <h2 className="text-4xl md:text-6xl font-black uppercase italic tracking-tighter mb-8 leading-tight">
                            Committed to <br className="hidden md:block"/> <span className="text-[#CBFF38]">Your Satisfaction.</span>
                        </h2>
                        <button 
                            onClick={() => navigate('/search')}
                            className="px-12 h-16 bg-[#CBFF38] text-black rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-white transition-all shadow-xl active:scale-95"
                        >
                            Get Started Now
                        </button>
                    </div>
                    {/* Background decorative elements */}
                    <div className="absolute top-0 right-0 size-60 bg-[#CBFF38]/5 rounded-full -mr-20 -mt-20 blur-3xl" />
                    <div className="absolute bottom-0 left-0 size-80 bg-white/5 rounded-full -ml-30 -mb-30 blur-2xl" />
                </motion.div>
            </div>
        </div>
    );
};
