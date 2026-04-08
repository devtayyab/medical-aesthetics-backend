import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { css } from "@emotion/css";
import { FaChevronRight, FaBell, FaShieldHalved, FaTrash, FaCircleCheck } from "react-icons/fa6";
import { motion, AnimatePresence } from "framer-motion";

const sectionStyles = css`
  min-height: 100vh;
  background: #FDFDFD;
  background-image: 
    radial-gradient(at 0% 0%, rgba(203, 255, 56, 0.08) 0px, transparent 50%),
    radial-gradient(at 100% 0%, rgba(203, 255, 56, 0.05) 0px, transparent 50%);
  padding-bottom: 80px;
`;

const premiumCard = css`
  background: white;
  border: 1px solid rgba(241, 245, 249, 1);
  border-radius: 32px;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.02);
  padding: 40px;
  position: relative;
  overflow: hidden;
`;

const toggleSwitch = (active: boolean) => css`
  width: 48px;
  height: 24px;
  background: ${active ? '#CBFF38' : '#F1F5F9'};
  border-radius: 24px;
  position: relative;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  border: 1px solid ${active ? '#CBFF38' : '#E2E8F0'};

  &::after {
    content: '';
    position: absolute;
    top: 2px;
    left: ${active ? '26px' : '2px'};
    width: 18px;
    height: 18px;
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
    accountActivity: {
      sms: true,
      email: true,
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
    
    // Auto-save feedback
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2000);
  };

  return (
    <div className={sectionStyles}>
      {/* Visual Header */}
      <div className="bg-[#1A1A1A] text-white pt-16 pb-24 px-6 relative overflow-hidden">
        <div className="max-w-4xl mx-auto relative z-10">
          <div className="flex items-center gap-4 mb-4 text-[#CBFF38] text-[10px] font-black uppercase tracking-[0.2em] italic">
            <Link to="/my-account" className="hover:opacity-80 transition-opacity">Account</Link>
            <FaChevronRight size={10} />
            <span>Preferences</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-black uppercase italic tracking-tighter leading-tight">
            Account Settings
          </h1>
          <p className="text-gray-400 mt-2 font-medium max-w-lg">
            Manage your notification preferences, privacy settings, and communication channels.
          </p>
        </div>
        <div className="absolute top-0 right-0 w-1/3 h-full bg-gradient-to-l from-[#CBFF38]/10 to-transparent pointer-events-none" />
      </div>

      <div className="max-w-4xl mx-auto px-6 -mt-12 relative z-20">
        <div className="space-y-8">
          
          <AnimatePresence>
            {saveSuccess && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="fixed bottom-10 left-1/2 -translate-x-1/2 z-50 bg-black text-white px-6 py-3 rounded-2xl flex items-center gap-3 shadow-2xl border border-white/10"
              >
                <FaCircleCheck className="text-[#CBFF38]" />
                <span className="text-[10px] font-black uppercase tracking-widest italic">Preference Saved</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Notifications Section */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={premiumCard}
          >
            <div className="flex items-center gap-4 mb-10">
               <div className="size-14 rounded-2xl bg-[#CBFF38]/10 flex items-center justify-center text-black border border-[#CBFF38]/20">
                 <FaBell size={20} />
               </div>
               <div>
                 <h3 className="text-xl font-black uppercase italic text-gray-900">Notifications</h3>
                 <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Control how we contact you</p>
               </div>
            </div>

            <div className="space-y-6">
               {[
                 { section: 'inspirationOffers', key: 'email', label: 'Marketing Emails', d: 'Receive newsletters and special treatment offers.' },
                 { section: 'inspirationOffers', key: 'sms', label: 'SMS Promotions', d: 'Get flash sales and last-minute deals via text.' },
                 { section: 'inspirationOffers', key: 'push', label: 'Push Notifications', d: 'Stay updated on appointment changes instantly.' },
               ].map((item, i) => (
                  <div key={i} className="flex items-center justify-between py-2 group">
                     <div className="max-w-md">
                        <p className="font-black uppercase italic text-gray-900 mb-1 leading-none">{item.label}</p>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-tighter leading-relaxed">{item.d}</p>
                     </div>
                     <div 
                        className={toggleSwitch((settings as any)[item.section][item.key])} 
                        onClick={() => toggle(item.section as any, item.key)}
                      />
                  </div>
               ))}
            </div>
          </motion.div>

          {/* Privacy Section */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className={premiumCard}
          >
            <div className="flex items-center gap-4 mb-10">
               <div className="size-14 rounded-2xl bg-black flex items-center justify-center text-[#CBFF38] border border-black shadow-lg">
                 <FaShieldHalved size={20} />
               </div>
               <div>
                 <h3 className="text-xl font-black uppercase italic text-gray-900">Privacy & Security</h3>
                 <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Your data, your control</p>
               </div>
            </div>

            <div className="space-y-6">
                <div className="flex items-center justify-between py-2">
                   <div className="max-w-md">
                      <p className="font-black uppercase italic text-gray-900 mb-1 leading-none">Anonymized Data Sharing</p>
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-tighter italic">Allow us to use anonymous metrics for research.</p>
                   </div>
                   <div 
                      className={toggleSwitch(settings.privacy.shareData)} 
                      onClick={() => toggle('privacy', 'shareData')}
                   />
                </div>
            </div>
          </motion.div>

          {/* Danger Zone */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className={`${premiumCard} bg-red-50/30 border-red-100`}
          >
             <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                   <div className="size-14 rounded-2xl bg-white flex items-center justify-center text-red-500 border border-red-100 shadow-sm">
                     <FaTrash size={20} />
                   </div>
                   <div className="text-center md:text-left">
                     <h3 className="text-xl font-black uppercase italic text-red-600">Danger Zone</h3>
                     <p className="text-xs font-bold text-gray-400 uppercase tracking-widest leading-none mt-1">Delete account permanently</p>
                   </div>
                </div>
                <button 
                  onClick={() => navigate("/delete-account")}
                  className="h-12 px-8 rounded-xl border-2 border-red-200 text-red-500 hover:bg-red-500 hover:text-white font-black uppercase text-[10px] tracking-widest transition-all italic"
                >
                  Request Deletion
                </button>
             </div>
          </motion.div>

        </div>
      </div>
    </div>
  );
};
