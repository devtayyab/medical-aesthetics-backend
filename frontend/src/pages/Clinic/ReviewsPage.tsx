import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../../store';
import { fetchReviews, fetchReviewStatistics } from '../../store/slices/clinicSlice';
import clinicApi from '../../services/api/clinicApi';
import { Star, MessageSquare, Eye, EyeOff, X, ArrowUpRight, TrendingUp, ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const ReviewsPage: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { reviews, reviewStats, isLoading } = useSelector((state: RootState) => state.clinic);

  const [respondingTo, setRespondingTo] = useState<string | null>(null);
  const [responseText, setResponseText] = useState('');

  useEffect(() => {
    dispatch(fetchReviews(undefined));
    dispatch(fetchReviewStatistics());
  }, [dispatch]);

  const handleRespond = async (reviewId: string) => {
    if (!responseText.trim()) {
      alert('Please enter a response');
      return;
    }

    try {
      await clinicApi.reviews.respond(reviewId, responseText);
      setRespondingTo(null);
      setResponseText('');
      dispatch(fetchReviews(undefined));
    } catch (error) {
      console.error('Failed to respond to review:', error);
    }
  };

  const handleToggleVisibility = async (reviewId: string) => {
    try {
      await clinicApi.reviews.toggleVisibility(reviewId);
      dispatch(fetchReviews(undefined));
    } catch (error) {
      console.error('Failed to toggle visibility:', error);
    }
  };

  const renderStars = (rating: number, size = 14) => {
    return (
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            size={size}
            className={`${star <= rating ? 'fill-[#CBFF38] text-[#CBFF38]' : 'text-gray-200'}`}
          />
        ))}
      </div>
    );
  };

    return (
        <div className="min-h-screen bg-[#F8FAFC]">
            {/* Minimal Header */}
            <div className="relative pt-8 pb-16 px-6 md:px-10 border-b border-gray-100 bg-white">
                <div className="max-w-7xl mx-auto relative z-10">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
                        <div className="space-y-3">
                            <div className="inline-flex items-center gap-2 px-3 py-1 bg-gray-50 rounded-full border border-gray-100">
                                <div className="size-1.5 rounded-full bg-green-500" />
                                <span className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-400 italic">Public Feedback Analysis</span>
                            </div>
                            <div className="space-y-1">
                                <h1 className="text-3xl md:text-5xl font-black uppercase italic tracking-tighter leading-none text-gray-900">Trust Matrix</h1>
                                <p className="text-gray-500 font-medium max-w-md text-sm">Monitor and curate patient signal protocols and clinical standards.</p>
                            </div>
                        </div>
                        
                        <div className="flex items-center gap-4">
                            <div className="px-5 py-2.5 bg-gray-50 border border-gray-100 rounded-xl flex items-center gap-3">
                                <div className="size-2 bg-green-500 rounded-full" />
                                <span className="text-[9px] font-black uppercase tracking-widest text-gray-400 italic">Curation Active</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-6 md:px-10 mt-8 relative z-20 pb-20">
                {/* Statistics Grid */}
                {reviewStats && (
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-6 mb-8">
                        <StatCard title="Total Verdicts" value={reviewStats.totalReviews.toString()} icon={<MessageSquare size={16} />} highlight />
                        <StatCard 
                            title="Global Score" 
                            value={reviewStats.averageRating.toFixed(1)} 
                            icon={<Star size={16} />} 
                        />
                        {([5, 4, 3]).map(rating => (
                            <StatCard 
                                key={rating}
                                title={`${rating} Star Signal`} 
                                value={reviewStats.distribution[rating] || 0} 
                                icon={<ArrowUpRight size={14} />} 
                            />
                        ))}
                    </div>
                )}

        {/* Reviews Modules */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-40 gap-4 bg-white rounded-[48px] shadow-sm border border-gray-100">
             <div className="size-10 border-4 border-[#CBFF38] border-t-transparent rounded-full animate-spin" />
             <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 italic">Syncing feedback protocols...</p>
          </div>
        ) : reviews.length === 0 ? (
          <div className="bg-white rounded-[40px] p-20 text-center border border-gray-100 shadow-sm">
            <Star className="w-16 h-16 text-gray-100 mx-auto mb-6" />
            <h3 className="text-xl font-black uppercase italic tracking-tighter text-gray-900 mb-2">Matrix is Silent</h3>
            <p className="text-gray-400 font-medium max-w-sm mx-auto">No patients have submitted clinical feedback to the central database yet.</p>
          </div>
        ) : (
                        <div className="space-y-6">
                            {reviews.map((review) => (
                                <motion.div
                                    key={review.id}
                                    layout
                                    initial={{ opacity: 0, y: 15 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="bg-white rounded-2xl p-6 md:p-8 border border-gray-100 shadow-sm relative group overflow-hidden"
                                >
                                    <div className="flex flex-col md:flex-row gap-6 relative z-10">
                                        <div className="shrink-0 flex flex-col items-center gap-3">
                                            <div className="size-14 rounded-2xl bg-black text-[#CBFF38] flex items-center justify-center font-black text-xl italic shadow-md">
                                                {review.client.firstName[0]}
                                            </div>
                                            {!review.isVisible && (
                                                <div className="px-2 py-0.5 bg-red-50 text-red-500 rounded-md text-[7px] font-black uppercase tracking-widest">Hidden</div>
                                            )}
                                        </div>

                  <div className="flex-1">
                    <div className="flex flex-col md:flex-row items-start justify-between gap-6 mb-6">
                      <div>
                        <div className="flex items-center gap-3 mb-1">
                           <h3 className="text-lg font-black uppercase italic tracking-tighter text-gray-900 capitalize">
                             {review.client.firstName} {review.client.lastName}
                           </h3>
                           <div className="size-1.5 rounded-full bg-gray-200" />
                           <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest italic">{new Date(review.createdAt).toLocaleDateString()}</span>
                        </div>
                        {renderStars(review.rating, 16)}
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleToggleVisibility(review.id)}
                          className="size-11 rounded-2xl bg-gray-50 flex items-center justify-center text-gray-400 hover:bg-black hover:text-white transition-all shadow-sm"
                        >
                          {review.isVisible ? <Eye size={18} /> : <EyeOff size={18} />}
                        </button>
                      </div>
                    </div>

                    <div className="bg-gray-50/50 p-6 rounded-3xl border border-gray-50 mb-8 italic text-gray-700 font-medium leading-relaxed relative">
                       <span className="absolute -top-3 left-6 text-4xl text-[#CBFF38] opacity-50 font-serif">"</span>
                       {review.comment || <span className="opacity-30">No textual commentary provided by patient.</span>}
                       <span className="absolute -bottom-6 right-6 text-4xl text-[#CBFF38] opacity-50 font-serif">"</span>
                    </div>

                    <AnimatePresence mode="wait">
                      {review.response ? (
                        <motion.div 
                           initial={{ opacity: 0, scale: 0.95 }}
                           animate={{ opacity: 1, scale: 1 }}
                           className="bg-black text-white p-8 rounded-[32px] relative overflow-hidden"
                        >
                           <div className="absolute top-0 right-0 p-4 opacity-5">
                              <ShieldCheck size={80} className="text-[#CBFF38]" />
                           </div>
                           <div className="relative z-10 flex items-start gap-4">
                              <div className="size-10 rounded-xl bg-[#CBFF38] flex items-center justify-center text-black shrink-0 shadow-lg">
                                 <MessageSquare size={16} />
                              </div>
                              <div>
                                 <p className="text-[10px] font-black uppercase tracking-widest text-[#CBFF38] mb-2 italic">Official Clinic Response</p>
                                 <p className="text-sm font-medium leading-relaxed mb-4 text-gray-300 italic">{review.response}</p>
                                 <p className="text-[8px] font-black uppercase text-gray-500 tracking-widest italic">Signal logged on {new Date(review.respondedAt!).toLocaleDateString()}</p>
                              </div>
                           </div>
                        </motion.div>
                      ) : respondingTo === review.id ? (
                        <motion.div 
                           initial={{ opacity: 0, y: 10 }}
                           animate={{ opacity: 1, y: 0 }}
                           className="space-y-4"
                        >
                          <textarea
                            value={responseText}
                            onChange={(e) => setResponseText(e.target.value)}
                            placeholder="Draft your clinical response..."
                            rows={4}
                            className="w-full p-6 bg-white border-2 border-black rounded-3xl font-medium text-gray-900 focus:ring-0 outline-none transition-all resize-none shadow-xl"
                          />
                          <div className="flex gap-3 justify-end">
                            <button
                              onClick={() => {
                                setRespondingTo(null);
                                setResponseText('');
                              }}
                              className="px-6 py-3 bg-gray-100 text-gray-500 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-gray-200 transition-all"
                            >
                              Abort
                            </button>
                            <button
                              onClick={() => handleRespond(review.id)}
                              className="px-8 py-3 bg-[#CBFF38] text-black rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-lg shadow-lime-500/10 hover:bg-black hover:text-[#CBFF38] transition-all"
                            >
                              Transmit Signal
                            </button>
                          </div>
                        </motion.div>
                      ) : (
                        <button
                          onClick={() => setRespondingTo(review.id)}
                          className="group h-12 px-6 bg-white border-2 border-black text-black rounded-2xl flex items-center gap-3 font-black uppercase text-[10px] tracking-[0.2em] italic hover:bg-black hover:text-[#CBFF38] transition-all"
                        >
                          <MessageSquare size={14} className="group-hover:rotate-12 transition-transform" />
                          Initialize Response Protocol
                        </button>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const StatCard = ({ title, value, icon, highlight }: any) => (
    <div className={`bg-white p-5 rounded-3xl border transition-all duration-300 group ${
        highlight ? 'border-[#CBFF38] shadow-sm' : 'border-gray-50 hover:border-black'
    }`}>
        <div className="flex items-center justify-between mb-4">
            <div className={`size-8 rounded-xl flex items-center justify-center transition-all bg-gray-50 group-hover:bg-black group-hover:text-[#CBFF38] ${highlight ? 'text-black bg-[#CBFF38]' : 'text-gray-400'}`}>
                {icon}
            </div>
            {highlight && <div className="text-[7px] font-black text-gray-400 uppercase italic tracking-widest">Active Ops</div>}
        </div>
        <div>
            <p className="text-[9px] font-black uppercase tracking-widest text-gray-400 group-hover:text-black transition-colors mb-0.5 whitespace-nowrap">{title}</p>
            <h3 className="text-xl font-black uppercase italic tracking-tighter text-gray-900 leading-none">{value}</h3>
        </div>
    </div>
);

export default ReviewsPage;
