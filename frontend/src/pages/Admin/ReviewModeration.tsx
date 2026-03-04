import React, { useEffect, useState } from "react";
import { clinicsAPI } from "@/services/api";
import { Button } from "@/components/atoms/Button/Button";
import { Card } from "@/components/atoms/Card/Card";
import { Star, Check, X, User, Home, Calendar } from "lucide-react";
import { format } from "date-fns";

export const ReviewModeration: React.FC = () => {
    const [reviews, setReviews] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchPendingReviews = async () => {
        try {
            setIsLoading(true);
            const response = await clinicsAPI.getPendingReviews();
            setReviews(response.data.reviews || []);
        } catch (err: any) {
            setError(err.response?.data?.message || "Failed to fetch pending reviews");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchPendingReviews();
    }, []);

    const handleModerate = async (reviewId: string, status: 'APPROVED' | 'REJECTED') => {
        try {
            await clinicsAPI.moderateReview(reviewId, { status });
            setReviews(reviews.filter(r => r.id !== reviewId));
        } catch (err: any) {
            alert(err.response?.data?.message || `Failed to ${status.toLowerCase()} review`);
        }
    };

    if (isLoading) {
        return (
            <div className="p-8 flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            </div>
        );
    }

    return (
        <div className="p-8 max-w-6xl mx-auto">
            <div className="mb-8">
                <h1 className="text-3xl font-black text-gray-900 uppercase tracking-tight italic">
                    Review Moderation
                </h1>
                <p className="text-gray-500 uppercase text-xs font-bold tracking-widest mt-1">
                    Manage and approve customer feedback
                </p>
            </div>

            {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-100 text-red-600 rounded-xl text-sm font-bold uppercase italic">
                    {error}
                </div>
            )}

            {reviews.length === 0 ? (
                <div className="bg-white rounded-3xl p-12 text-center border border-gray-100 shadow-sm italic">
                    <Check className="mx-auto h-12 w-12 text-lime-500 mb-4" />
                    <h3 className="text-xl font-black text-gray-900 uppercase">All caught up!</h3>
                    <p className="text-gray-500 mt-2 uppercase text-xs font-bold tracking-widest">No pending reviews to moderate.</p>
                </div>
            ) : (
                <div className="grid gap-6">
                    {reviews.map((review) => (
                        <Card key={review.id} className="p-0 overflow-hidden border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                            <div className="flex flex-col md:flex-row">
                                {/* Side Info */}
                                <div className="md:w-64 bg-gray-50 p-6 border-b md:border-b-0 md:border-r border-gray-100">
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-3">
                                            <div className="size-8 bg-black text-white rounded-lg flex items-center justify-center">
                                                <Home size={16} />
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-[10px] font-black uppercase text-gray-400">Clinic</p>
                                                <p className="text-sm font-black text-gray-900 truncate uppercase tracking-tight italic">{review.clinic?.name}</p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-3">
                                            <div className="size-8 bg-lime-100 text-lime-700 rounded-lg flex items-center justify-center">
                                                <User size={16} />
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-[10px] font-black uppercase text-gray-400">Consumer</p>
                                                <p className="text-sm font-black text-gray-900 truncate uppercase tracking-tight italic">{review.client?.firstName} {review.client?.lastName}</p>
                                            </div>
                                        </div>

                                        {review.appointment && (
                                            <div className="flex items-center gap-3">
                                                <div className="size-8 bg-blue-100 text-blue-700 rounded-lg flex items-center justify-center">
                                                    <Calendar size={16} />
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-[10px] font-black uppercase text-gray-400">Appointment</p>
                                                    <p className="text-xs font-bold text-gray-600 uppercase tracking-widest">
                                                        {format(new Date(review.appointment.startTime), "MMM d, yyyy")}
                                                    </p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Content */}
                                <div className="flex-1 p-8 flex flex-col justify-between">
                                    <div>
                                        <div className="flex items-center gap-1 mb-4">
                                            {[...Array(5)].map((_, i) => (
                                                <Star
                                                    key={i}
                                                    size={18}
                                                    className={`${i < review.rating ? "text-yellow-400 fill-yellow-400" : "text-gray-200"}`}
                                                />
                                            ))}
                                            <span className="ml-2 text-sm font-black text-gray-900 uppercase italic">
                                                {review.rating}/5 Rating
                                            </span>
                                        </div>

                                        <p className="text-gray-600 leading-relaxed italic border-l-4 border-lime-500 pl-4 py-1">
                                            "{review.comment || "No comment provided."}"
                                        </p>
                                    </div>

                                    <div className="mt-8 flex items-center gap-4">
                                        <Button
                                            onClick={() => handleModerate(review.id, 'APPROVED')}
                                            variant="primary"
                                            className="flex-1 max-w-[200px] h-12 rounded-xl bg-[#CBFF38] text-black hover:bg-lime-400 font-black uppercase text-xs tracking-widest shadow-lg shadow-lime-100"
                                        >
                                            <Check className="mr-2" size={16} />
                                            Approve
                                        </Button>
                                        <Button
                                            onClick={() => handleModerate(review.id, 'REJECTED')}
                                            variant="outline"
                                            className="flex-1 max-w-[200px] h-12 rounded-xl border-2 border-red-50 text-red-100 hover:bg-red-50 hover:text-red-600 transition-all font-black uppercase text-xs tracking-widest"
                                        >
                                            <X className="mr-2" size={16} />
                                            Reject
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
