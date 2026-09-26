import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, Link } from "react-router-dom";
import { fetchUserAppointments } from "@/store/slices/clientSlice";
import type { RootState, AppDispatch } from "@/store";
import { css } from "@emotion/css";
import { motion } from "framer-motion";

// Icons (Lucide for consistency)
import {
  CalendarDays, UserCircle, Receipt, Gift, UserPlus,
  Star, BookOpen, Settings, ArrowRight, Sparkles, Heart
} from "lucide-react";

// Reception check-in image for dashboard
import AccountHero from "@/assets/my_account_bg.png";

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
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  
  &:hover {
    border-color: #CBFF38;
    transform: translateY(-5px);
    box-shadow: 0 60px 120px rgba(0, 0, 0, 0.06);
  }
`;

const iconContainer = (bg: string) => css`
  width: 52px;
  height: 52px;
  border-radius: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: ${bg};
  color: #1A1A1A;
  margin-bottom: 24px;
`;

export const MyAccount: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useSelector((state: RootState) => state.auth);
  const { appointments } = useSelector((state: RootState) => state.client);

  useEffect(() => {
    if (isAuthenticated && !appointments.length) {
      dispatch(fetchUserAppointments());
    }
  }, [dispatch, isAuthenticated, appointments.length]);

  if (!isAuthenticated) return null;

  const menuItems = [
    {
      title: "Appointments",
      desc: "Timeline & visits",
      icon: <CalendarDays size={20} />,
      link: "/appointments",
      bg: "#F0F9FF"
    },
    {
      title: "Personal Details",
      desc: "Account information",
      icon: <UserCircle size={20} />,
      link: "/personal-details",
      bg: "#F5F3FF"
    },
    {
      title: "Payments & Invoices",
      desc: "Payment history",
      icon: <Receipt size={20} />,
      link: "/payments",
      bg: "#ECFDF5"
    },
    {
      title: "Gift Cards",
      desc: "Share luxury",
      icon: <Gift size={20} />,
      link: "/gift-card",
      bg: "#FFFBEB"
    },
    /* Temporarily hidden for legal review:
    {
      title: "Ambassador",
      desc: "Invite & earn €5",
      icon: <UserPlus size={20} />,
      link: "/invite-friend",
      bg: "#FEF2F2"
    }, */
    {
      title: "Feedback",
      desc: "Your appointment experience",
      icon: <Star size={20} />,
      link: "/reviews",
      bg: "#F8FAFC"
    },
    {
      title: "Aesthetic Intelligence",
      desc: "Articles & insights",
      icon: <BookOpen size={20} />,
      link: "/blog",
      bg: "#F0FDF4"
    }
  ];

  const userInitial = user?.firstName?.[0] || user?.email?.[0] || 'U';

  return (
    <div className={sectionStyles}>
      {/* Immersive Dashboard Hero */}
      <div className="relative pt-16 sm:pt-24 pb-48 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img 
            src={AccountHero} 
            style={{ objectPosition: 'center 40%' }}
            className="w-full h-full object-cover opacity-50" 
            alt="Dashboard Hero" 
          />
        </div>

        <div className="container mx-auto px-4 sm:px-8 relative z-10">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-10">
            <div className="max-w-4xl">
              <motion.div 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex flex-wrap items-center gap-2 sm:gap-3 mb-6 sm:mb-8 text-gray-400 text-[9px] sm:text-[11px] font-black uppercase tracking-[0.2em]"
              >
                <Link to="/" className="text-gray-900 border-b border-gray-900 pb-0.5">BEAUTY DOCTORS</Link>
                <span className="text-lime-500"> MEMBER LOUNGE</span>
              </motion.div>
              
              <motion.div 
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-4 sm:gap-6 md:gap-8"
              >
                <div className="size-16 sm:size-20 md:size-28 rounded-[1.5rem] sm:rounded-[38px] bg-black text-[#CBFF38] flex items-center justify-center text-3xl sm:text-4xl md:text-5xl font-black shadow-2xl relative overflow-hidden group shrink-0">
                  <span className="relative z-10">{userInitial.toUpperCase()}</span>
                  <div className="absolute inset-0 bg-gradient-to-tr from-lime-500/20 to-transparent" />
                </div>

                <div className="min-w-0">
                  <h1 className="text-2xl sm:text-4xl md:text-6xl font-black uppercase tracking-tighter leading-none text-gray-900 break-words">
                    Hello, <span className="text-[#CBFF38]">{user?.firstName || 'Valued Member'}</span>
                  </h1>
                  <p className="text-gray-400 mt-3 sm:mt-4 font-bold text-[10px] sm:text-xs uppercase tracking-[0.2em] flex items-center gap-2 min-w-0">
                    <span className="size-1.5 rounded-full bg-lime-500 animate-pulse shrink-0" />
                    <span className="truncate">{user?.email}</span>
                  </p>
                </div>
              </motion.div>
            </div>
            
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-8 relative z-20 -mt-[180px] pb-16 md:pb-32">
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 xl:gap-10">
          
          {/* Main Dashboard Actions */}
          <div className="xl:col-span-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {menuItems.map((item, idx) => (
                <Link to={item.link} key={idx}>
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className={glassCard}
                  >
                    <div className="p-6 sm:p-8">
                      <div className={iconContainer(item.bg)}>
                        {item.icon}
                      </div>
                      <h3 className="text-xl font-black uppercase text-gray-900 mb-2 leading-tight tracking-tight">
                        {item.title}
                      </h3>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                        {item.desc}
                      </p>
                    </div>
                  </motion.div>
                </Link>
              ))}

              {/* Settings Tile */}
              <Link to="/settings">
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className={`${glassCard} bg-gray-50/50 border-dashed`}
                >
                  <div className="p-6 sm:p-8">
                    <div className={iconContainer("#fff")}>
                      <Settings size={20} />
                    </div>
                    <h3 className="text-xl font-black uppercase text-gray-900 mb-2 leading-tight tracking-tight">
                      Settings
                    </h3>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                      System & Security
                    </p>
                  </div>
                </motion.div>
              </Link>
            </div>
          </div>

          {/* Right Column: Featured Promotion */}
          <div className="xl:col-span-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-black rounded-[2rem] sm:rounded-[40px] p-6 sm:p-8 relative overflow-hidden group shadow-2xl min-h-[300px] sm:min-h-[400px] flex flex-col justify-between"
            >
              <div className="relative z-10">
                <Sparkles className="text-[#CBFF38] mb-6" size={24} />
                <h2 className="text-2xl md:text-3xl font-black uppercase text-white tracking-tighter leading-tight mb-4">
                  READY FOR YOUR <br /> NEXT APPOINTMENT?
                </h2>
                <p className="text-[11px] font-medium text-gray-400 leading-relaxed max-w-xs">
                  Explore treatments and book an appointment with a Beauty Doctors partner doctor or clinic.
                </p>
              </div>

              <div className="relative z-10 space-y-6">
                <div className="flex items-center gap-4 text-white">
                  <div className="size-10 rounded-xl bg-white/10 flex items-center justify-center">
                    <Heart size={16} className="text-lime-500" />
                  </div>
                  <p className="text-[9px] font-black uppercase tracking-widest leading-tight">Partner Clinics & Doctors <br /><span className="text-gray-500">Verified aesthetic providers</span></p>
                </div>

                <Link to="/search" className="block">
                  <button className="w-full bg-[#CBFF38] text-black h-14 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] flex items-center justify-center gap-3 active:scale-95 transition-all shadow-2xl hover:bg-white transition-colors">
                    BOOK APPOINTMENT <ArrowRight size={16} />
                  </button>
                </Link>
              </div>

              <div className="absolute inset-0 opacity-20 group-hover:opacity-30 transition-opacity">
                <img src="https://images.unsplash.com/photo-1519494140221-d28b868608e6?q=80&w=800&auto=format&fit=crop" className="w-full h-full object-cover grayscale" alt="Clinic Interior" />
              </div>
            </motion.div>
          </div>
        </div>

        {/* Footer Insignia */}
        <div className="mt-16 md:mt-32 pt-8 md:pt-12 border-t border-gray-50 flex flex-col md:flex-row justify-between items-center gap-6 md:gap-8">
          <div className="flex flex-wrap justify-center items-center gap-4 sm:gap-8">
            <Link to="/support" className="text-[9px] font-black uppercase tracking-[0.3em] text-gray-400 hover:text-black transition-colors">HELP & SUPPORT</Link>
            <Link to="/legal" className="text-[9px] font-black uppercase tracking-[0.3em] text-gray-400 hover:text-black transition-colors">PRIVACY POLICY</Link>
          </div>

          <div className="flex flex-col items-center md:items-end text-[9px] font-black uppercase tracking-[0.4em] text-gray-400">
            <p>© 2026 Beauty Doctors. All rights reserved.</p>
          </div>
        </div>
      </main>
    </div>
  );
};
