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
import { Star, MapPin, Clock, Shield, Award, Info, Search } from "lucide-react";
import LayeredBG from "@/assets/LayeredBg.svg";
import BotoxImg from "@/assets/Botox.jpg";

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

  if (isLoading) return <div className="p-20 text-center text-gray-400 font-bold uppercase italic animate-pulse">Loading Clinic...</div>;
  if (!clinicData) return <div className="p-20 text-center text-red-500 font-bold">Clinic not found.</div>;

  const handleBookService = (service: Service) => {
    if (!isAuthenticated) {
      navigate(`/login?redirect=/clinic/${id}`);
      return;
    }
    navigate(`/appointment/booking?clinicId=${clinicData.id}&serviceIds=${service.id}`);
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
                        placeholder="Search therapies here..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:border-lime-500 transition-colors placeholder:text-gray-400"
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

                      if (category === 'All') return null;
                      if (categoryServices.length === 0) return null;

                      return (
                        <div key={category} className="space-y-6">
                          <h3 className="text-xl font-black text-gray-900 uppercase italic flex items-center gap-3">
                            <span className="w-1.5 h-6 bg-lime-500 rounded-full" />
                            {category}
                          </h3>
                          <div className="divide-y divide-gray-100 bg-gray-50/30 rounded-3xl px-6">
                            {categoryServices.map((service: Service) => (
                              <ServiceCard
                                key={service.id}
                                service={service}
                                onBook={handleBookService}
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
                      Loading Reviews...
                    </div>
                  ) : clinicReviews.length === 0 ? (
                    <div className="text-center py-20 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-100 italic">
                      <p className="text-gray-400 text-sm font-bold uppercase tracking-widest">No approved reviews yet.</p>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {clinicReviews.map((review: any) => (
                        <div key={review.id} className="p-8 bg-white rounded-3xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                          <div className="flex justify-between items-start mb-4">
                            <div>
                              <div className="flex items-center gap-1 mb-2">
                                {[...Array(5)].map((_, i) => (
                                  <Star
                                    key={i}
                                    size={14}
                                    className={i < review.rating ? "fill-yellow-400 text-yellow-400" : "text-gray-200"}
                                  />
                                ))}
                              </div>
                              <h4 className="font-black text-gray-900 uppercase italic tracking-tight">
                                {review.client?.firstName || 'Verified Customer'}
                              </h4>
                            </div>
                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                              {format(new Date(review.createdAt), "MMM d, yyyy")}
                            </span>
                          </div>
                          <p className="text-gray-600 leading-relaxed italic border-l-4 border-lime-500 pl-4 py-1">
                            "{review.comment}"
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'about' && (
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <p className="text-gray-600 leading-relaxed text-lg">{clinicData.description}</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="flex gap-4 p-4 bg-gray-50 rounded-2xl">
                      <Shield className="text-lime-600 shrink-0" />
                      <div>
                        <h4 className="font-black text-gray-900 uppercase text-sm mb-1">Clinic Certified</h4>
                        <p className="text-xs text-gray-500">Regulated beauty professional</p>
                      </div>
                    </div>
                    <div className="flex gap-4 p-4 bg-gray-50 rounded-2xl">
                      <Award className="text-lime-600 shrink-0" />
                      <div>
                        <h4 className="font-black text-gray-900 uppercase text-sm mb-1">Top Rated 2024</h4>
                        <p className="text-xs text-gray-500">Most booked in your area</p>
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
              <h3 className="text-xl font-black text-gray-900 uppercase italic mb-6">Location & Hours</h3>
              <div className="space-y-6">
                <div className="flex gap-4">
                  <div className="size-10 bg-lime-50 rounded-xl flex items-center justify-center shrink-0">
                    <MapPin className="text-lime-600" size={20} />
                  </div>
                  <div>
                    <h4 className="font-black text-gray-900 uppercase text-xs mb-1">Address</h4>
                    <p className="text-sm text-gray-500 leading-relaxed">
                      {clinicData.address.street}, {clinicData.address.city}<br />
                      {clinicData.address.zipCode}, {clinicData.address.country}
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="size-10 bg-lime-50 rounded-xl flex items-center justify-center shrink-0">
                    <Clock className="text-lime-600" size={20} />
                  </div>
                  <div>
                    <h4 className="font-black text-gray-900 uppercase text-xs mb-1">Opening Hours</h4>
                    <div className="space-y-1 mt-2">
                      {['Monday - Friday: 09:00 - 20:00', 'Saturday: 10:00 - 18:00', 'Sunday: Closed'].map(hour => (
                        <p key={hour} className="text-xs text-gray-500">{hour}</p>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

            </div>

            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 italic">
              <div className="flex items-center gap-3 text-lime-600 mb-2">
                <Info size={16} />
                <span className="text-xs font-black uppercase">Good to know</span>
              </div>
              <p className="text-xs text-gray-500 leading-relaxed">
                Reschedule for free up to 24 hours before your appointment. Secure payments via card or Apple Pay.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
