import React, { useEffect, useState } from "react";
import type { Treatment } from "@/types";
import { useParams, useNavigate } from "react-router-dom";
import { clinicsAPI } from "@/services/api";
import { Button } from "@/components/atoms/Button/Button";
import { css } from "@emotion/css";
import { MapPin, ChevronRight, Info, Shield, Award } from "lucide-react";
import BotoxImg from "@/assets/Botox.jpg";

const containerStyle = css`
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem 1rem;
`;

const cardStyle = css`
  background: white;
  border-radius: 24px;
  overflow: hidden;
  box-shadow: 0 10px 40px rgba(0,0,0,0.05);
  border: 1px solid #f0f0f0;
`;

export const TreatmentDetails: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [treatment, setTreatment] = useState<Treatment & { offerings: any[] } | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (id) {
            // Since we don't have a specific redux action for this yet, we use API directly
            // In a real app, we'd add this to clientSlice
            clinicsAPI.getTreatmentDetails(id).then(res => {
                setTreatment(res.data);
                setIsLoading(false);
            }).catch(() => {
                setIsLoading(false);
            });
        }
    }, [id]);

    if (isLoading) return <div className="p-20 text-center text-lime-600 animate-pulse font-black uppercase">Loading treatment details...</div>;
    if (!treatment) return <div className="p-20 text-center text-red-500 font-bold">Treatment not found.</div>;

    return (
        <div className="min-h-screen bg-[#F7FAFC] pb-20">
            <div className={containerStyle}>

                {/* Breadcrumbs */}
                <div className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-widest mb-8">
                    <span className="hover:text-black cursor-pointer" onClick={() => navigate('/search')}>Search</span>
                    <ChevronRight size={12} />
                    <span className="text-gray-900">{treatment.name}</span>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                    {/* Main Content */}
                    <div className="lg:col-span-2 space-y-8">
                        <div className={cardStyle}>
                            <div className="h-[400px] bg-gray-100 relative">
                                <img
                                    src={treatment.imageUrl || BotoxImg}
                                    alt={treatment.name}
                                    className="w-full h-full object-cover"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                                <div className="absolute bottom-8 left-8">
                                    <span className="px-3 py-1 bg-lime-400 text-black text-[10px] font-black uppercase tracking-widest rounded-full mb-3 inline-block">
                                        {treatment.category}
                                    </span>
                                    <h1 className="text-white text-4xl font-black uppercase italic drop-shadow-md">
                                        {treatment.name}
                                    </h1>
                                </div>
                            </div>

                            <div className="p-8">
                                <h3 className="text-lg font-black uppercase tracking-widest text-gray-900 mb-4 flex items-center gap-2">
                                    <Info size={18} className="text-lime-600" />
                                    About this treatment
                                </h3>
                                <p className="text-gray-600 leading-relaxed text-lg whitespace-pre-line">
                                    {treatment.fullDescription}
                                </p>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8">
                                    <div className="p-4 bg-gray-50 rounded-2xl flex gap-4 border border-gray-100 italic">
                                        <Shield className="text-lime-600 shrink-0" />
                                        <div>
                                            <h4 className="font-black text-xs uppercase text-gray-900 mb-1">Safety First</h4>
                                            <p className="text-xs text-gray-500">Only offered by verified and licensed professionals.</p>
                                        </div>
                                    </div>
                                    <div className="p-4 bg-gray-50 rounded-2xl flex gap-4 border border-gray-100 italic">
                                        <Award className="text-lime-600 shrink-0" />
                                        <div>
                                            <h4 className="font-black text-xs uppercase text-gray-900 mb-1">Expert Results</h4>
                                            <p className="text-xs text-gray-500">Selected based on high patient satisfaction ratings.</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Sidebar: Clinics List */}
                    <div className="space-y-6">
                        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
                            <h3 className="text-xl font-black text-gray-900 uppercase italic mb-6">Offered by {treatment.offerings?.length || 0} Clinics</h3>

                            <div className="space-y-4">
                                {treatment.offerings?.map((offering: any) => (
                                    <div key={offering.clinicId} className="group p-4 bg-gray-50 hover:bg-white rounded-2xl border border-transparent hover:border-lime-200 transition-all duration-300">
                                        <div className="flex justify-between items-start mb-3">
                                            <div className="min-w-0">
                                                <h4 className="font-black text-gray-900 uppercase text-sm truncate group-hover:text-lime-700">{offering.clinicName}</h4>
                                                <div className="flex items-center gap-1 text-[10px] text-gray-500 mt-1 uppercase font-bold tracking-tighter">
                                                    <MapPin size={10} className="text-lime-600" />
                                                    {offering.location}
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-lg font-black text-lime-700">£{offering.price}</p>
                                                <p className="text-[10px] text-gray-400 font-bold uppercase">{offering.durationMinutes}m</p>
                                            </div>
                                        </div>

                                        <Button
                                            fullWidth
                                            variant="outline"
                                            className="h-10 rounded-xl text-xs font-black uppercase tracking-widest hover:!bg-black hover:!text-white transition-colors"
                                            onClick={() => navigate(`/appointment/booking?clinicId=${offering.clinicId}&treatmentId=${treatment.id}`)}
                                        >
                                            Book at this clinic
                                        </Button>
                                    </div>
                                ))}

                                {(!treatment.offerings || treatment.offerings.length === 0) && (
                                    <div className="text-center py-10">
                                        <p className="text-gray-400 text-sm italic font-bold uppercase">No clinics currently offering this treatment.</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="bg-lime-50 rounded-3xl p-6 border border-lime-100 relative overflow-hidden group">
                            <div className="absolute -right-4 -top-4 size-24 bg-lime-200/50 rounded-full blur-2xl group-hover:bg-lime-300/50 transition-colors" />
                            <h4 className="text-sm font-black text-lime-900 uppercase italic mb-2 relative z-10">Need Help?</h4>
                            <p className="text-xs text-lime-700 leading-relaxed mb-4 relative z-10">
                                Not sure if this treatment is right for you? Consult with our experts for a personalized recommendation.
                            </p>
                            <button className="text-[10px] font-black uppercase tracking-[2px] text-lime-900 border-b-2 border-lime-900 pb-1 hover:text-black hover:border-black transition-all">
                                Talk to an expert
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
