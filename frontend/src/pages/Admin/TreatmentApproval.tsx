import React, { useEffect, useState } from "react";
import clinicApi from "@/services/api/clinicApi";
import { Button } from "@/components/atoms/Button/Button";
import { Card } from "@/components/atoms/Card/Card";
import { Check, X, Tag, Info, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import { TreatmentStatus } from "@/types/clinic.types";

export const TreatmentApproval: React.FC = () => {
    const [treatments, setTreatments] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchPendingTreatments = async () => {
        try {
            setIsLoading(true);
            // We need to add this to clinicApi global export if we haven't
            const response = await clinicApi.services.getPendingTreatments();
            setTreatments(response || []);
        } catch (err: any) {
            setError(err.response?.data?.message || "Failed to fetch pending treatments");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchPendingTreatments();
    }, []);

    const handleSetStatus = async (treatmentId: string, status: TreatmentStatus) => {
        try {
            await clinicApi.services.setTreatmentStatus(treatmentId, status);
            setTreatments(treatments.filter(t => t.id !== treatmentId));
        } catch (err: any) {
            alert(err.response?.data?.message || `Failed to ${status.toLowerCase()} treatment`);
        }
    };

    if (isLoading) {
        return (
            <div className="p-8 flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="p-8 max-w-6xl mx-auto">
            <div className="mb-8 flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-black text-gray-900 uppercase tracking-tight italic">
                        Therapy Approvals
                    </h1>
                    <p className="text-gray-500 uppercase text-xs font-bold tracking-widest mt-1">
                        Review and approve new medical treatments proposed by doctors
                    </p>
                </div>
                <div className="bg-blue-50 px-4 py-2 rounded-lg border border-blue-100 flex items-center gap-2 text-blue-700">
                    <AlertCircle size={16} />
                    <span className="text-xs font-bold uppercase tracking-wider">{treatments.length} Pending Requests</span>
                </div>
            </div>

            {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-100 text-red-600 rounded-xl text-sm font-bold uppercase italic">
                    {error}
                </div>
            )}

            {treatments.length === 0 ? (
                <div className="bg-white rounded-3xl p-12 text-center border border-gray-100 shadow-sm italic">
                    <Check className="mx-auto h-12 w-12 text-lime-500 mb-4" />
                    <h3 className="text-xl font-black text-gray-900 uppercase">Clear Sky!</h3>
                    <p className="text-gray-500 mt-2 uppercase text-xs font-bold tracking-widest">All treatment proposals have been processed.</p>
                </div>
            ) : (
                <div className="grid gap-6">
                    {treatments.map((treatment) => (
                        <Card key={treatment.id} className="p-0 overflow-hidden border border-gray-100 shadow-xl hover:shadow-2xl transition-all duration-300">
                            <div className="flex flex-col md:flex-row">
                                {/* Side Info */}
                                <div className="md:w-72 bg-gray-50 p-6 border-b md:border-b-0 md:border-r border-gray-100 flex flex-col justify-between">
                                    <div className="space-y-6">
                                        <div className="flex items-center gap-3">
                                            <div className="size-10 bg-blue-600 text-white rounded-xl flex items-center justify-center shadow-lg shadow-blue-100">
                                                <Tag size={18} />
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-[10px] font-black uppercase text-gray-400">Category</p>
                                                <p className="text-sm font-black text-gray-900 truncate uppercase tracking-tight italic">
                                                    {treatment.categoryRef?.name || treatment.category || 'Uncategorized'}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-3">
                                            <div className="size-10 bg-lime-100 text-lime-700 rounded-xl flex items-center justify-center">
                                                <Info size={18} />
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-[10px] font-black uppercase text-gray-400">Proposed On</p>
                                                <p className="text-xs font-bold text-gray-600 uppercase tracking-widest">
                                                    {format(new Date(treatment.createdAt), "MMMM d, yyyy")}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mt-8 pt-6 border-t border-gray-200">
                                        <div className="flex items-center gap-2 text-amber-600 bg-amber-50 px-3 py-2 rounded-lg border border-amber-100">
                                            <AlertCircle size={14} />
                                            <span className="text-[10px] font-black uppercase">Status: Pending Approval</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Content */}
                                <div className="flex-1 p-8">
                                    <div className="mb-6">
                                        <h3 className="text-2xl font-black text-gray-900 uppercase tracking-tight italic mb-2">
                                            {treatment.name}
                                        </h3>
                                        <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                                            <p className="text-sm font-black text-gray-400 uppercase tracking-widest mb-1 italic">Short Description</p>
                                            <p className="text-gray-700 font-medium">{treatment.shortDescription || 'No short description provided.'}</p>
                                        </div>
                                    </div>

                                    <div className="mb-8">
                                        <p className="text-sm font-black text-gray-400 uppercase tracking-widest mb-1 italic">Full Details</p>
                                        <p className="text-gray-600 leading-relaxed bg-white border-l-4 border-blue-500 pl-4 py-2">
                                            {treatment.fullDescription || 'No full description provided.'}
                                        </p>
                                    </div>

                                    <div className="flex items-center gap-4">
                                        <Button
                                            onClick={() => handleSetStatus(treatment.id, TreatmentStatus.APPROVED)}
                                            className="flex-1 h-12 rounded-xl bg-[#CBFF38] text-black hover:bg-lime-400 font-black uppercase text-xs tracking-widest shadow-lg shadow-lime-100 border-none"
                                        >
                                            <Check className="mr-2" size={16} />
                                            Confirm & Publish
                                        </Button>
                                        <Button
                                            onClick={() => handleSetStatus(treatment.id, TreatmentStatus.REJECTED)}
                                            variant="outline"
                                            className="flex-1 h-12 rounded-xl border-2 border-gray-100 text-gray-400 hover:border-red-500 hover:text-red-500 hover:bg-red-50 transition-all font-black uppercase text-xs tracking-widest"
                                        >
                                            <X className="mr-2" size={16} />
                                            Reject Therapy
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
};
