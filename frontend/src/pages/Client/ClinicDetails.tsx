import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useParams, useNavigate } from "react-router-dom";
import {
  fetchClinicById,
  fetchClinicServices,
  clearSelectedClinic,
} from "@/store/slices/clientSlice";
import { addService, removeService } from "@/store/slices/bookingSlice";
import { ServiceCard } from "@/components/molecules/ServiceCard/ServiceCard";
import type { RootState, AppDispatch } from "@/store";
import type { Service } from "@/types";
import { Button } from "@/components/atoms/Button/Button";
import { css } from "@emotion/css";
import { Star, MapPin, Clock, Shield, Award, Info } from "lucide-react";
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
  const { selectedServices } = useSelector((state: RootState) => state.booking);
  const { isAuthenticated } = useSelector((state: RootState) => state.auth);

  const [activeTab, setActiveTab] = useState<'treatments' | 'about' | 'reviews'>('treatments');

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

  if (isLoading) return <div className="p-20 text-center text-gray-400 font-bold uppercase italic animate-pulse">Loading Clinic...</div>;
  if (!clinicData) return <div className="p-20 text-center text-red-500 font-bold">Clinic not found.</div>;

  const handleAddService = (service: Service) => dispatch(addService(service));
  const handleRemoveService = (serviceId: string) => dispatch(removeService(serviceId));

  const handleBookNow = () => {
    if (selectedServices.length === 0) {
      alert("Please select at least one treatment.");
      return;
    }
    if (!isAuthenticated) {
      navigate(`/login?redirect=/clinic/${id}`);
      return;
    }
    const serviceIds = selectedServices.map((s) => s.id).join(",");
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
              <Star key={i} size={16} className={i < Math.round(clinicData.rating || 5) ? "fill-yellow-400 text-yellow-400" : "text-gray-400"} />
            ))}
            <span className="text-white text-sm font-bold ml-2">4.9 (120 reviews)</span>
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
                <div className="space-y-4">
                  <h3 className="text-2xl font-black text-gray-900 uppercase italic mb-6">Popular Treatments</h3>
                  <div className="divide-y divide-gray-100">
                    {serviceData.map((service: Service) => (
                      <ServiceCard
                        key={service.id}
                        service={service}
                        isSelected={selectedServices.some((s) => s.id === service.id)}
                        onAdd={handleAddService}
                        onRemove={handleRemoveService}
                      />
                    ))}
                  </div>
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

              <div className="mt-8 pt-8 border-t border-gray-100">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-sm font-black uppercase text-gray-400">Total Selected</span>
                  <span className="text-2xl font-black text-gray-900">£{selectedServices.reduce((acc, s) => acc + s.price, 0)}</span>
                </div>
                <Button
                  fullWidth
                  onClick={handleBookNow}
                  className="bg-[#CBFF38] text-black hover:bg-lime-400 h-14 rounded-2xl font-black uppercase tracking-widest text-sm shadow-lg shadow-lime-200"
                >
                  Book Selection
                </Button>
                {selectedServices.length === 0 && (
                  <p className="text-center text-[10px] text-gray-400 mt-4 uppercase font-bold tracking-tighter italic">Select a treatment to book</p>
                )}
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
