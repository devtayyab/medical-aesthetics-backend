import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { css } from "@emotion/css";
import { ChevronRight, Bell, ShieldOff, Trash2, CheckCircle2, Sliders, Smartphone, Mail, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// Use the same clinical hero visual for consistency
import HeroBg from "@/assets/Blog_Hero.jpg";

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
`;

const toggleSwitch = (active: boolean) => css`
  width: 52px;
  height: 28px;
  background: ${active ? '#CBFF38' : '#F1F5F9'};
  border-radius: 24px;
  position: relative;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  border: 1px solid ${active ? '#CBFF38' : '#E2E8F0'};

  &::after {
    content: '';
    position: absolute;
    top: 3px;
    left: ${active ? '27px' : '3px'};
    width: 20px;
    height: 20px;
    background: ${active ? 'black' : 'white'};
    border-radius: 50%;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  }
`;

export const Settings: React.FC = () => {
  const navigate = useNavigate();

  const [settings, setSettings] = useState({
    inspirationOffers: {
      sms: false,
      email: true,
      push: true,
    },
    privacy: {
      shareData: true,
      publicProfile: false
    }
  });

  const [saveSuccess, setSaveSuccess] = useState(false);

  const toggle = (section: keyof typeof settings, key: string) => {
    setSettings((prev: any) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [key]: !prev[section][key],
      },
    }));
    
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2000);
  };

  return (
    <div className={sectionStyles}>
      {/* Immersive Hero Header */}
      <div className="relative pt-24 pb-48 overflow-hidden">
        {/* Background Visual */}
        <div className="absolute inset-0 z-0">
            <img 
                src={HeroBg} 
                style={{ objectPosition: 'center 70%' }}
                className="w-full h-full object-cover opacity-[0.35]" 
                alt="Background" 
            />
        </div>

        <div className="container mx-auto px-8 relative z-10">
            <div className="max-w-4xl">
                <div className="flex items-center gap-3 mb-8 text-gray-400 text-[11px] font-black uppercase tracking-[0.2em] italic">
                    <Link to="/my-account" className="text-gray-900 border-b border-gray-900 pb-0.5">ACCOUNT</Link>
                    <ChevronRight size={12} className="text-lime-500" />
                    <span className="text-lime-500">PREFERENCES</span>
                </div>
                
                <h1 className="text-4xl md:text-6xl font-black uppercase italic tracking-tighter leading-none text-gray-900">
                    SYSTEM CONTROLS
                </h1>
                
                <p className="text-gray-500 mt-6 font-bold text-lg max-w-lg leading-relaxed italic">
                    Fine-tune your clinical journey. Manage communications, security protocols, and privacy data.
                </p>
            </div>
        </div>
      </div>

      <main className="max-w-4xl mx-auto px-8 relative z-20 -mt-[180px] pb-32">
        <div className="space-y-8">
          
          <AnimatePresence>
            {saveSuccess && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="fixed bottom-12 left-1/2 -translate-x-1/2 z-[100] bg-black text-[#CBFF38] px-8 py-4 rounded-2xl flex items-center gap-4 shadow-2xl border border-white/10"
              >
                <CheckCircle2 size={16} />
                <span className="text-[10px] font-black uppercase tracking-[0.3em] italic">Parameters Updated</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Notifications Card */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={glassCard}
          >
            <div className="p-8 md:p-12">
                <div className="flex items-center gap-6 mb-12">
                   <div className="size-16 rounded-3xl bg-[#CBFF38]/10 flex items-center justify-center text-black border border-[#CBFF38]/20 shadow-sm">
                     <Bell size={24} />
                   </div>
                   <div>
                     <h3 className="text-2xl font-black uppercase italic text-gray-900 tracking-tight">Notification Feed</h3>
                     <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] mt-1">Configure clinical alerts & offers</p>
                   </div>
                </div>

                <div className="space-y-10">
                   {[
                     { section: 'inspirationOffers', key: 'email', label: 'Clinical Newsletters', d: 'Periodic updates on new treatments and aesthetic science.', icon: <Mail size={16} /> },
                     { section: 'inspirationOffers', key: 'sms', label: 'Priority SMS', d: 'Get flash alerts for last-minute appointment availability.', icon: <Smartphone size={16} /> },
                     { section: 'inspirationOffers', key: 'push', label: 'Application Alerts', d: 'Receive instant notifications regarding your bookings.', icon: <Sliders size={16} /> },
                   ].map((item, i) => (
                      <div key={i} className="flex items-center justify-between group">
                         <div className="max-w-md">
                            <div className="flex items-center gap-3 mb-2">
                                <span className="text-lime-500">{item.icon}</span>
                                <p className="font-black uppercase italic text-gray-900 tracking-tight">{item.label}</p>
                            </div>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-relaxed ml-7">{item.d}</p>
                         </div>
                         <div 
                            className={toggleSwitch((settings as any)[item.section][item.key])} 
                            onClick={() => toggle(item.section as any, item.key)}
                          />
                      </div>
                   ))}
                </div>
            </div>
          </motion.div>

          {/* Privacy Card */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className={glassCard}
          >
            <div className="p-8 md:p-12 text-gray-900">
                <div className="flex items-center gap-6 mb-12">
                   <div className="size-16 rounded-3xl bg-black flex items-center justify-center text-[#CBFF38] shadow-2xl">
                     <ShieldOff size={24} />
                   </div>
                   <div>
                     <h3 className="text-2xl font-black uppercase italic text-gray-900 tracking-tight">Data Intelligence</h3>
                     <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] mt-1">Manage your digital footprint</p>
                   </div>
                </div>

                <div className="flex items-center justify-between">
                   <div className="max-w-md">
                      <p className="font-black uppercase italic text-gray-900 mb-2 tracking-tight">Anonymous Protocols</p>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest italic leading-relaxed">Allow us to analyze treatment results anonymously for clinical research.</p>
                   </div>
                   <div 
                      className={toggleSwitch(settings.privacy.shareData)} 
                      onClick={() => toggle('privacy', 'shareData')}
                   />
                </div>
            </div>
          </motion.div>

          {/* Danger Card */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-[40px] border-2 border-red-50 p-10 shadow-sm overflow-hidden relative group"
          >
             <div className="flex flex-col md:flex-row items-center justify-between gap-8 relative z-10">
                <div className="flex items-center gap-6">
                   <div className="size-16 rounded-3xl bg-red-50 flex items-center justify-center text-red-500 shadow-sm group-hover:bg-red-500 group-hover:text-white transition-all">
                     <Trash2 size={24} />
                   </div>
                   <div className="text-center md:text-left">
                     <h3 className="text-2xl font-black uppercase italic text-red-600 tracking-tighter">Deactivate Access</h3>
                     <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Permanently remove clinical profile</p>
                   </div>
                </div>
                <button 
                  onClick={() => navigate("/delete-account")}
                  className="h-14 px-10 rounded-2xl bg-black text-white hover:bg-red-600 font-black uppercase text-[10px] tracking-[0.3em] transition-all italic shadow-2xl border border-white/10"
                >
                  Request Termination
                </button>
             </div>
             
             {/* Subtle hazard pattern */}
             <div className="absolute top-0 right-0 w-32 h-full bg-red-50/20 -skew-x-12 translate-x-10 pointer-events-none" />
          </motion.div>

          {/* Footer Insignia */}
          <div className="flex flex-col items-center justify-center pt-10 text-gray-200">
             <Sparkles size={32} className="mb-4 opacity-30" />
             <p className="text-[9px] font-black uppercase tracking-[0.4em] italic opacity-50">Secure Clinical Environment</p>
          </div>

        </div>
      </main>
    </div>
  );
};
