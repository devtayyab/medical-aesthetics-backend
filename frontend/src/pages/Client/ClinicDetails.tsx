import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useParams, useNavigate } from "react-router-dom";
import {
  fetchClinicById,
  fetchClinicServices,
  clearSelectedClinic,
} from "@/store/slices/clientSlice";
import { ServiceCard } from "@/components/molecules/ServiceCard/ServiceCard";
import type { RootState, AppDispatch } from "@/store";
import { clinicsAPI } from "@/services/api";
import { format } from "date-fns";
import type { Service } from "@/types";
import { css } from "@emotion/css";
import { Star, MapPin, Clock, Shield, Award, Info, Search, ShoppingBag, ArrowRight, X } from "lucide-react";
import BotoxImg from "@/assets/Botox.jpg";
import { motion, AnimatePresence } from "framer-motion";

const getImageUrl = (path: string) => {
  if (!path) return '';
  if (path.startsWith('http') || path.startsWith('data:')) return path;
  
  const baseUrl = import.meta.env.VITE_API_BASE_URL || '';
  const origin = baseUrl.replace(/\/api$/, '');
  return `${origin}${path.startsWith('/') ? '' : '/'}${path}`;
};

const heroSection = css`
  height: 320px;
  position: relative;
  overflow: hidden;
  border-radius: 0 0 24px 24px;
  @media (min-width: 640px) {
    height: 380px;
    border-radius: 0 0 32px 32px;
  }
`;

const containerStyle = css`
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 1rem;
  position: relative;
  z-index: 10;
  @media (min-width: 640px) {
    padding: 0 1.5rem;
  }
`;

const mainGrid = css`
  display: grid;
  grid-template-columns: 1fr;
  gap: 24px;
  margin-top: -30px;
  @media (min-width: 1024px) {
    grid-template-columns: 1fr 380px;
    gap: 40px;
    margin-top: -60px;
  }
`;

const cardStyle = css`
  background: white;
  border-radius: 20px;
  padding: 16px;
  @media (min-width: 640px) {
    border-radius: 24px;
    padding: 28px;
  }
  box-shadow: 0 10px 40px rgba(0,0,0,0.05);
  border: 1px solid #f0f0f0;
`;

export const ClinicDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const { selectedClinic, services, isLoading, clinics } = useSelector(
    (state: RootState) => state.client
  );
  const { isAuthenticated } = useSelector((state: RootState) => state.auth);

  const [activeTab, setActiveTab] = useState<'privileges' | 'about' | 'reviews'>('privileges');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [clinicReviews, setClinicReviews] = useState<any[]>([]);
  const [isLoadingReviews, setIsLoadingReviews] = useState(false);
  const [selectedServices, setSelectedServices] = useState<Service[]>([]);

  useEffect(() => {
    if (id) {
      dispatch(fetchClinicById(id));
      dispatch(fetchClinicServices(id));
    }
    return () => {
      dispatch(clearSelectedClinic());
    };
  }, [dispatch, id]);

  const clinicData = selectedClinic || clinics.find((c) => c.id === id);
  const serviceData = services.length > 0 ? services : clinicData?.services || [];

  useEffect(() => {
    if (activeTab === 'reviews' && id && clinicReviews.length === 0) {
      setIsLoadingReviews(true);
      clinicsAPI.getPublicReviews(id)
        .then(res => setClinicReviews(res.data.reviews || []))
        .finally(() => setIsLoadingReviews(false));
    }
  }, [activeTab, id]);

  if (isLoading) return <div className="p-12 sm:p-20 text-center text-gray-400 font-bold uppercase animate-pulse text-xs tracking-widest">Establishing Connection...</div>;
  if (!clinicData) return <div className="p-12 sm:p-20 text-center text-red-500 font-bold text-sm">Vector not found.</div>;

  const handleBookService = (service: Service) => {
    if (!isAuthenticated) {
      navigate(`/login?redirect=/clinic/${id}`);
      return;
    }
    navigate(`/appointment/booking?clinicId=${clinicData.id}&serviceIds=${service.id}`);
  };

  const toggleServiceSelection = (service: Service) => {
    setSelectedServices(prev => {
      const exists = prev.find(s => s.id === service.id);
      if (exists) return prev.filter(s => s.id !== service.id);
      return [...prev, service];
    });
  };

  const handleBulkBooking = () => {
    if (!isAuthenticated) {
      navigate(`/login?redirect=/clinic/${id}`);
      return;
    }
    const serviceIds = selectedServices.map(s => s.id).join(',');
    navigate(`/appointment/booking?clinicId=${clinicData.id}&serviceIds=${serviceIds}`);
  };

  return (
    <div className="min-h-screen bg-[#F7FAFC] pb-24 w-full overflow-x-hidden">
      <div className={`${heroSection} bg-gray-900 relative`}>
        <img
          src={clinicData.images?.[0] ? getImageUrl(clinicData.images[0]) : (clinicData.photoUrl ? getImageUrl(clinicData.photoUrl) : BotoxImg)}
          className="w-full h-full object-cover"
          alt={clinicData.name}
          onError={(e) => { e.currentTarget.style.display = 'none'; }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
        <div className="absolute bottom-6 sm:bottom-10 left-0 w-full px-4 sm:px-8">
          <div className="max-w-[1200px] mx-auto">
            <div className="flex items-center gap-1.5 sm:gap-2 mb-2 sm:mb-3">
              {[...Array(5)].map((_, i) => (
                <Star key={i} size={14} className={i < Math.round(Number(clinicData.rating) || 0) ? "fill-yellow-400 text-yellow-400" : "text-white/40"} />
              ))}
              <span className="text-white text-[10px] sm:text-[11px] font-black uppercase tracking-widest ml-1 drop-shadow-md">
                {(clinicData.rating !== null && clinicData.rating !== undefined)
                  ? Number(clinicData.rating).toFixed(1)
                  : "4.9"} ({clinicData.reviewCount || 0} Reviews)
              </span>
            </div>
            <h1 className="text-white text-2xl sm:text-4xl lg:text-5xl font-black leading-tight tracking-tighter drop-shadow-2xl">
              {clinicData.name}
            </h1>
          </div>
        </div>
      </div>

      <div className={containerStyle}>
        <div className={mainGrid}>
          {/* Main Content */}
          <div className="space-y-6">
            <div className={cardStyle}>
              <div className="flex gap-4 sm:gap-8 border-b border-gray-100 mb-6 sm:mb-8 overflow-x-auto no-scrollbar pb-1">
                {['privileges', 'about', 'reviews'].map(tab => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab as any)}
                    className={`pb-3 sm:pb-4 text-xs sm:text-sm font-black uppercase tracking-widest transition-all border-b-2 whitespace-nowrap min-h-[44px] flex items-center ${activeTab === tab ? 'border-lime-500 text-gray-900' : 'border-transparent text-gray-400 hover:text-gray-600'
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              {activeTab === 'privileges' && (
                <div className="space-y-6 sm:space-y-8">
                  <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4 mb-6 sm:mb-8">
                    <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1 -mx-2 sm:mx-0 px-2 sm:px-0">
                      {['All', ...Array.from(new Set(serviceData.map(s => s.treatment?.category || s.category).filter(Boolean)))].map(category => (
                        <button
                          key={category}
                          onClick={() => setSelectedCategory(category)}
                          className={`px-4 sm:px-6 py-2 rounded-full text-[10px] sm:text-xs font-black uppercase tracking-widest transition-all border shrink-0 min-h-[38px] ${selectedCategory === category
                            ? 'bg-black text-white border-black shadow-md'
                            : 'bg-white text-gray-400 border-gray-100 hover:border-gray-300'
                          }`}
                        >
                          {category}
                        </button>
                      ))}
                    </div>

                    <div className="relative w-full sm:w-64 shrink-0">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <input
                        type="text"
                        placeholder="Search privileges..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full h-11 sm:h-12 pl-10 pr-4 bg-gray-50 border border-gray-200 rounded-xl text-xs sm:text-sm outline-none focus:border-lime-500 transition-all font-bold placeholder:font-black placeholder:uppercase placeholder:text-gray-400"
                      />
                    </div>
                  </div>

                  {['All', ...Array.from(new Set(serviceData.map(s => s.treatment?.category || s.category).filter(Boolean)))]
                    .filter(cat => selectedCategory === 'All' || cat === selectedCategory)
                    .map(category => {
                      const categoryServices = serviceData.filter(s => {
                        const matchesCategory = selectedCategory === 'All' ? true : (s.treatment?.category || s.category) === category;
                        const serviceName = s.treatment?.name || s.name || '';
                        const matchesSearch = serviceName.toLowerCase().includes(searchQuery.toLowerCase());

                        return (selectedCategory === 'All' ? (s.treatment?.category || s.category) === category : matchesCategory) && matchesSearch;
                      });

                      if (category === 'All' && selectedCategory !== 'All') return null;
                      if (categoryServices.length === 0) return null;

                      return (
                        <div key={category} className="space-y-4 sm:space-y-6">
                          <h3 className="text-lg sm:text-xl font-black text-gray-900 flex items-center gap-3">
                            <span className="w-1.5 h-5 sm:h-6 bg-lime-500 rounded-full" />
                            {category}
                          </h3>
                          <div className="divide-y divide-gray-100 bg-gray-50/30 rounded-2xl sm:rounded-[30px] px-3 sm:px-8 py-2">
                            {categoryServices.map((service: Service) => (
                              <ServiceCard
                                key={service.id}
                                service={service}
                                onBook={handleBookService}
                                isSelected={selectedServices.some(s => s.id === service.id)}
                                onSelect={toggleServiceSelection}
                              />
                            ))}
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}

              {activeTab === 'reviews' && (
                <div className="space-y-6">
                  {isLoadingReviews ? (
                    <div className="text-center py-10 text-gray-400 uppercase font-black text-xs tracking-widest animate-pulse">
                      Analyzing Patient Feedback...
                    </div>
                  ) : clinicReviews.length === 0 ? (
                    <div className="text-center py-16 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-100">
                      <p className="text-gray-400 text-xs sm:text-sm font-black uppercase tracking-widest">No verified transmissions yet.</p>
                    </div>
                  ) : (
                    <div className="space-y-4 sm:space-y-6">
                      {clinicReviews.map((review: any) => (
                        <div key={review.id} className="p-4 sm:p-8 bg-white rounded-2xl sm:rounded-[30px] shadow-sm border border-gray-50 hover:shadow-xl transition-all">
                          <div className="flex justify-between items-start mb-4">
                            <div className="flex items-center gap-3">
                              <div className="size-10 sm:size-12 rounded-2xl bg-black text-[#CBFF38] flex items-center justify-center font-black text-lg">
                                {review.client?.firstName?.[0] || 'V'}
                              </div>
                              <div>
                                <div className="flex items-center gap-1 mb-0.5">
                                  {[...Array(5)].map((_, i) => (
                                    <Star key={i} size={12} className={i < review.rating ? "fill-yellow-400 text-yellow-400" : "text-gray-200"} />
                                  ))}
                                </div>
                                <h4 className="font-black text-gray-900 uppercase tracking-tight text-sm sm:text-base">
                                  {review.client?.firstName || 'Verified Patient'}
                                </h4>
                              </div>
                            </div>
                            <span className="text-[9px] sm:text-[10px] font-black text-gray-300 uppercase tracking-widest">
                              {format(new Date(review.createdAt), "MMM d, yyyy")}
                            </span>
                          </div>
                          <p className="text-gray-600 leading-relaxed border-l-4 border-[#CBFF38] pl-4 py-1 text-sm sm:text-base font-medium">"{review.comment}"</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'about' && (
                <div className="space-y-6 sm:space-y-10">
                  <div className="p-4 sm:p-8 bg-gray-50 rounded-2xl sm:rounded-[30px] border border-gray-100 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-full bg-[#CBFF38]/10 blur-3xl rounded-full translate-x-1/2" />
                    <p className="text-gray-600 leading-relaxed text-sm sm:text-lg font-medium relative z-10">{clinicData.description}</p>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                    <div className="flex gap-4 p-5 sm:p-6 bg-black text-white rounded-2xl sm:rounded-[28px] shadow-xl">
                      <div className="size-12 bg-white/10 rounded-2xl flex items-center justify-center shrink-0">
                        <Shield size={22} className="text-[#CBFF38]" />
                      </div>
                      <div>
                        <h4 className="font-black uppercase text-sm mb-1 tracking-tighter">Clinical Precision</h4>
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Regulated Industry Standards</p>
                      </div>
                    </div>
                    <div className="flex gap-4 p-5 sm:p-6 bg-white border border-gray-100 rounded-2xl sm:rounded-[28px] shadow-xl">
                      <div className="size-12 bg-black/5 rounded-2xl flex items-center justify-center shrink-0">
                        <Award size={22} className="text-black" />
                      </div>
                      <div>
                        <h4 className="font-black uppercase text-sm mb-1 tracking-tighter text-gray-900">Elite Standing</h4>
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Primary Market Trajectory</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar Info */}
          <div className="space-y-6">
            <div className={cardStyle}>
              <h3 className="text-lg font-black text-gray-900 uppercase mb-6 pb-3 border-b border-gray-50">Logistics & Range</h3>
              <div className="space-y-6">
                <div className="flex gap-4">
                  <div className="size-12 bg-black rounded-2xl flex items-center justify-center shrink-0 shadow-lg">
                    <MapPin className="text-[#CBFF38]" size={20} />
                  </div>
                  <div>
                    <h4 className="font-black text-gray-900 uppercase text-[10px] mb-1 tracking-widest">Ground Coordinates</h4>
                    <p className="text-xs sm:text-sm text-gray-500 leading-relaxed font-bold">
                      {clinicData.address.street},<br />
                      {clinicData.address.city}, {clinicData.address.zipCode}
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="size-12 bg-black rounded-2xl flex items-center justify-center shrink-0 shadow-lg">
                    <Clock className="text-[#CBFF38]" size={20} />
                  </div>
                  <div>
                    <h4 className="font-black text-gray-900 uppercase text-[10px] mb-1 tracking-widest">Operational Window</h4>
                    <div className="space-y-1 mt-1">
                      {['Mon - Fri / 09:00 - 20:00', 'Sat / 10:00 - 18:00', 'Sun / Standby Only'].map(hour => (
                        <p key={hour} className="text-[9px] font-black uppercase text-gray-400 tracking-wider">{hour}</p>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-black text-white rounded-2xl sm:rounded-[28px] p-5 sm:p-6 shadow-xl relative overflow-hidden">
              <div className="flex items-center gap-3 text-[#CBFF38] mb-2">
                <Info size={18} />
                <span className="text-[10px] font-black uppercase tracking-[0.2em]">Intelligence Brief</span>
              </div>
              <p className="text-xs text-gray-400 font-medium leading-relaxed">
                Reschedule for free up to <span className="text-white font-black">24 hours</span> before your protocol. Secure end-to-end encrypted payments.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Floating Checkout Hub */}
      <AnimatePresence>
        {selectedServices.length > 0 && (
          <motion.div 
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-4 sm:bottom-8 left-0 w-full px-4 sm:px-8 z-[100]"
          >
            <div className="max-w-4xl mx-auto bg-black text-white p-4 sm:p-6 rounded-2xl sm:rounded-[32px] shadow-[0_20px_80px_rgba(0,0,0,0.6)] flex flex-col sm:flex-row items-center justify-between gap-4 sm:gap-6 border border-white/10 relative overflow-hidden">
              <div className="flex flex-row items-center justify-between sm:justify-start gap-4 relative z-10 w-full sm:w-auto">
                <div className="size-10 sm:size-14 bg-[#CBFF38] rounded-xl flex items-center justify-center text-black shadow-lg shrink-0">
                  <ShoppingBag size={20} />
                </div>
                <div className="space-y-0.5">
                  <h4 className="text-sm sm:text-lg font-black uppercase tracking-tighter leading-none">Transmission</h4>
                  <p className="text-gray-400 text-[8px] sm:text-[9px] font-black uppercase tracking-widest">{selectedServices.length} PRIVILEGES</p>
                </div>
                <div className="h-8 w-px bg-white/10 hidden sm:block mx-2" />
                <div className="text-right sm:text-left">
                  <p className="text-[8px] font-black uppercase tracking-widest text-[#CBFF38]">Payload</p>
                  <p className="text-lg sm:text-2xl font-black tracking-tighter">
                    <span className="font-sans">€</span>{selectedServices.reduce((acc, s) => acc + Number(s.price), 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 sm:gap-3 relative z-10 w-full sm:w-auto">
                <button 
                  onClick={() => setSelectedServices([])}
                  className="size-11 sm:size-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-red-500/20 hover:text-red-500 transition-all shrink-0 min-h-[44px] min-w-[44px]"
                >
                  <X size={18} />
                </button>
                <button 
                  onClick={handleBulkBooking}
                  className="flex-1 sm:flex-none h-11 sm:h-12 px-6 sm:px-8 bg-[#CBFF38] text-black font-black uppercase text-[10px] sm:text-[11px] tracking-[0.2em] rounded-xl shadow-xl hover:bg-white transition-all flex items-center justify-center gap-3 min-h-[44px]"
                >
                  Deploy <ArrowRight size={14} />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
