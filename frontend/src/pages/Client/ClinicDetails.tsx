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

const heroSection = css`
  height: 400px;
  position: relative;
  overflow: hidden;
  border-radius: 0 0 32px 32px;
  @media (max-width: 768px) {
    height: 300px;
    border-radius: 0;
  }
`;

const containerStyle = css`
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 1rem;
  position: relative;
  z-index: 10;
`;

const mainGrid = css`
  display: grid;
  grid-template-columns: 1fr 380px;
  gap: 40px;
  margin-top: -60px;
  @media (max-width: 1024px) {
    grid-template-columns: 1fr;
    margin-top: 20px;
  }
`;

const cardStyle = css`
  background: white;
  border-radius: 24px;
  padding: 32px;
  box-shadow: 0 10px 40px rgba(0,0,0,0.05);
  border: 1px solid #f0f0f0;
`;

export const ClinicDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const { selectedClinic, services, isLoading, error, clinics } = useSelector(
    (state: RootState) => state.client
  );
  const { isAuthenticated } = useSelector((state: RootState) => state.auth);

  const [activeTab, setActiveTab] = useState<'treatments' | 'about' | 'reviews'>('treatments');
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

  if (isLoading) return <div className="p-20 text-center text-gray-400 font-bold uppercase italic animate-pulse">Establishing Connection...</div>;
  if (!clinicData) return <div className="p-20 text-center text-red-500 font-bold">Vector not found.</div>;

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
    <div className="min-h-screen bg-[#F7FAFC] pb-20">
      <div className={heroSection}>
        <img
          src={clinicData.images?.[0] || BotoxImg}
          className="w-full h-full object-cover"
          alt={clinicData.name}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        <div className="absolute bottom-12 left-1/2 -translate-x-1/2 w-full max-w-[1200px] px-8">
          <div className="flex items-center gap-2 mb-2">
            {[...Array(5)].map((_, i) => (
              <Star key={i} size={16} className={i < Math.round(Number(clinicData.rating) || 0) ? "fill-yellow-400 text-yellow-400" : "text-gray-400"} />
            ))}
            <span className="text-white text-sm font-bold ml-2">
              {(clinicData.rating !== null && clinicData.rating !== undefined)
                ? Number(clinicData.rating).toFixed(1)
                : "4.9"} ({clinicData.reviewCount || 0} reviews)
            </span>
          </div>
          <h1 className="text-white text-4xl sm:text-5xl font-black uppercase italic leading-tight drop-shadow-lg">
            {clinicData.name}
          </h1>
        </div>
      </div>

      <div className={containerStyle}>
        <div className={mainGrid}>
          {/* Main Content */}
          <div className="space-y-6">
            <div className={cardStyle}>
              <div className="flex gap-8 border-b border-gray-100 mb-8 overflow-x-auto no-scrollbar">
                {['treatments', 'about', 'reviews'].map(tab => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab as any)}
                    className={`pb-4 text-sm font-black uppercase tracking-widest transition-all border-b-2 whitespace-nowrap ${activeTab === tab ? 'border-lime-500 text-gray-900' : 'border-transparent text-gray-400 hover:text-gray-600'
                      }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              {activeTab === 'treatments' && (
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-400">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                    <div className="flex flex-wrap gap-2">
                      {['All', ...Array.from(new Set(serviceData.map(s => s.treatment?.category || s.category).filter(Boolean)))].map(category => (
                        <button
                          key={category}
                          onClick={() => setSelectedCategory(category)}
                          className={`px-6 py-2 rounded-full text-xs font-black uppercase tracking-widest transition-all border ${selectedCategory === category
                            ? 'bg-black text-white border-black shadow-lg'
                            : 'bg-white text-gray-400 border-gray-100 hover:border-gray-300'
                            }`}
                        >
                          {category}
                        </button>
                      ))}
                    </div>

                    <div className="relative w-full md:w-64">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <input
                        type="text"
                        placeholder="Search protocols here..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full h-12 pl-10 pr-4 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:border-lime-500 transition-all font-bold placeholder:font-black placeholder:uppercase placeholder:text-gray-400"
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
                        <div key={category} className="space-y-6">
                          <h3 className="text-xl font-black text-gray-900 uppercase italic flex items-center gap-3">
                            <span className="w-1.5 h-6 bg-lime-500 rounded-full" />
                            {category}
                          </h3>
                          <div className="divide-y divide-gray-100 bg-gray-50/30 rounded-[40px] px-8 py-2">
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
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  {isLoadingReviews ? (
                    <div className="text-center py-10 text-gray-400 uppercase font-black text-xs tracking-widest animate-pulse">
                      Analyzing Patient Feedback...
                    </div>
                  ) : clinicReviews.length === 0 ? (
                    <div className="text-center py-20 bg-gray-50 rounded-[40px] border-2 border-dashed border-gray-100 italic">
                      <p className="text-gray-400 text-sm font-black uppercase tracking-widest">No verified transmissions yet.</p>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {clinicReviews.map((review: any) => (
                        <div key={review.id} className="p-10 bg-white rounded-[40px] shadow-sm border border-gray-50 hover:shadow-2xl hover:-translate-y-1 transition-all group">
                          <div className="flex justify-between items-start mb-6">
                            <div className="flex items-center gap-4">
                               <div className="size-14 rounded-2xl bg-black text-[#CBFF38] flex items-center justify-center font-black italic text-xl">
                                  {review.client?.firstName?.[0] || 'V'}
                               </div>
                               <div>
                                  <div className="flex items-center gap-1 mb-1">
                                    {[...Array(5)].map((_, i) => (
                                      <Star key={i} size={12} className={i < review.rating ? "fill-yellow-400 text-yellow-400" : "text-gray-200"} />
                                    ))}
                                  </div>
                                  <h4 className="font-black text-gray-900 uppercase italic tracking-tight text-lg">
                                    {review.client?.firstName || 'Verified Patient'}
                                  </h4>
                               </div>
                            </div>
                            <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest">
                              {format(new Date(review.createdAt), "MMM d, yyyy")}
                            </span>
                          </div>
                          <p className="text-gray-600 leading-relaxed italic border-l-[6px] border-[#CBFF38] pl-6 py-2 text-lg font-medium">
                            "{review.comment}"
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'about' && (
                <div className="space-y-10 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <div className="p-10 bg-gray-50 rounded-[40px] border border-gray-100 relative overflow-hidden">
                     <div className="absolute top-0 right-0 w-32 h-full bg-[#CBFF38]/10 blur-3xl rounded-full translate-x-1/2" />
                     <p className="text-gray-600 leading-relaxed text-xl font-medium relative z-10 italic">{clinicData.description}</p>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                    <div className="flex gap-6 p-8 bg-black text-white rounded-[32px] shadow-xl group hover:scale-[1.02] transition-transform">
                      <div className="size-14 bg-white/10 rounded-2xl flex items-center justify-center group-hover:bg-[#CBFF38] group-hover:text-black transition-colors">
                        <Shield size={24} />
                      </div>
                      <div>
                        <h4 className="font-black uppercase text-base mb-1 italic tracking-tighter">Clinical Precision</h4>
                        <p className="text-[11px] text-gray-400 font-bold uppercase tracking-wider">Regulated Industry Standards</p>
                      </div>
                    </div>
                    <div className="flex gap-6 p-8 bg-white border border-gray-100 rounded-[32px] shadow-xl group hover:scale-[1.02] transition-transform">
                      <div className="size-14 bg-black/5 rounded-2xl flex items-center justify-center group-hover:bg-black group-hover:text-[#CBFF38] transition-colors">
                        <Award size={24} />
                      </div>
                      <div>
                        <h4 className="font-black uppercase text-base mb-1 italic tracking-tighter text-gray-900">Elite Standing</h4>
                        <p className="text-[11px] text-gray-400 font-bold uppercase tracking-wider">Primary Market Trajectory</p>
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
              <h3 className="text-xl font-black text-gray-900 uppercase italic mb-8 pb-4 border-b border-gray-50">Logistics & Range</h3>
              <div className="space-y-8">
                <div className="flex gap-6">
                  <div className="size-14 bg-black rounded-2xl flex items-center justify-center shrink-0 shadow-lg">
                    <MapPin className="text-[#CBFF38]" size={24} />
                  </div>
                  <div>
                    <h4 className="font-black text-gray-900 uppercase text-xs mb-2 tracking-widest italic">Ground Coordinates</h4>
                    <p className="text-sm text-gray-500 leading-relaxed font-bold italic">
                      {clinicData.address.street},<br />
                      {clinicData.address.city}, {clinicData.address.zipCode}
                    </p>
                  </div>
                </div>

                <div className="flex gap-6">
                  <div className="size-14 bg-black rounded-2xl flex items-center justify-center shrink-0 shadow-lg">
                    <Clock className="text-[#CBFF38]" size={24} />
                  </div>
                  <div>
                    <h4 className="font-black text-gray-900 uppercase text-xs mb-2 tracking-widest italic">Operational Window</h4>
                    <div className="space-y-2 mt-2">
                      {['Mon - Fri / 09:00 - 20:00', 'Sat / 10:00 - 18:00', 'Sun / Standby Only'].map(hour => (
                        <p key={hour} className="text-[10px] font-black uppercase text-gray-400 tracking-wider italic">{hour}</p>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-black text-white rounded-[32px] p-8 shadow-2xl relative overflow-hidden group">
              <div className="absolute -right-8 -bottom-8 size-32 bg-[#CBFF38]/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700" />
              <div className="flex items-center gap-4 text-[#CBFF38] mb-4">
                <Info size={20} />
                <span className="text-[10px] font-black uppercase tracking-[0.2em] italic">Intelligence Brief</span>
              </div>
              <p className="text-sm text-gray-400 font-medium leading-relaxed italic relative z-10">
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
             className="fixed bottom-10 left-1/2 -translate-x-1/2 w-full max-w-4xl px-8 z-[100]"
          >
             <div className="bg-black text-white p-8 rounded-[40px] shadow-[0_20px_60px_rgba(0,0,0,0.4)] flex flex-col md:flex-row items-center justify-between gap-8 border border-white/10 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-full bg-[#CBFF38]/5 blur-3xl rounded-full translate-x-1/2" />
                
                <div className="flex flex-wrap items-center gap-6 relative z-10">
                   <div className="size-16 bg-[#CBFF38] rounded-2xl flex items-center justify-center text-black shadow-lg shadow-lime-500/10">
                      <ShoppingBag size={24} />
                   </div>
                   <div className="space-y-1">
                      <h4 className="text-xl font-black uppercase italic tracking-tighter leading-none">Transmission Bundle</h4>
                      <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest italic">{selectedServices.length} PROTOCOLS STACKED</p>
                   </div>
                   <div className="h-10 w-px bg-white/10 hidden md:block" />
                   <div>
                      <p className="text-[9px] font-black uppercase tracking-widest text-[#CBFF38] italic mb-1">Total Payload</p>
                      <p className="text-3xl font-black italic tracking-tighter">
                         £{selectedServices.reduce((acc, s) => acc + Number(s.price), 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </p>
                   </div>
                </div>

                <div className="flex items-center gap-4 relative z-10">
                   <button 
                      onClick={() => setSelectedServices([])}
                      className="size-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-red-500/20 hover:text-red-500 transition-all group"
                   >
                      <X size={20} className="group-hover:rotate-90 transition-transform" />
                   </button>
                   <button 
                      onClick={handleBulkBooking}
                      className="h-14 px-10 bg-[#CBFF38] text-black font-black uppercase italic text-xs tracking-[0.2em] rounded-2xl shadow-xl shadow-lime-500/20 hover:bg-white transition-all flex items-center gap-4 group"
                   >
                      Deploy Sequence <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                   </button>
                </div>
             </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
