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
      {/* Premium Header */}
      <div className="bg-black text-white pt-16 pb-24 px-6 md:px-10 rounded-b-[48px] shadow-2xl relative overflow-hidden">
        <div className="absolute top-[-20%] right-[-10%] size-[500px] bg-[#CBFF38]/10 blur-[120px] rounded-full" />
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/5 backdrop-blur-md rounded-full border border-white/10">
                <div className="size-1.5 rounded-full bg-[#CBFF38] animate-pulse" />
                <span className="text-[9px] font-black uppercase tracking-[0.2em] text-[#CBFF38] italic">Public Feedback Analysis</span>
              </div>
              <div className="space-y-1">
                <h1 className="text-4xl md:text-5xl font-black uppercase italic tracking-tighter leading-none">Trust Matrix</h1>
                <p className="text-gray-400 font-medium max-w-md">Monitor and curate patient testimonials to maintain high operational clinical standards.</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
               <div className="px-6 py-3 bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl flex items-center gap-3">
                  <div className="size-2 bg-green-500 rounded-full" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-[#CBFF38]">Live Curation Active</span>
               </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 md:px-10 -mt-10 relative z-20 pb-20">
        {/* Statistics Grid */}
        {reviewStats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-12">
            <StatCard title="Total Verdicts" value={reviewStats.totalReviews.toString()} icon={<MessageSquare size={18} />} highlight />
            <StatCard 
               title="Aggregate Score" 
               value={reviewStats.averageRating.toFixed(1)} 
               icon={<Star size={18} />} 
               subText="Global Average"
            />
            {([5, 4, 3]).map(rating => (
              <StatCard 
                 key={rating}
                 title={`${rating} Star Signal`} 
                 value={reviewStats.distribution[rating] || 0} 
                 icon={<ArrowUpRight size={18} />} 
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
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-[40px] p-8 md:p-10 shadow-xl border border-gray-100 relative group overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-32 h-full bg-gradient-to-l from-gray-50/50 to-transparent pointer-events-none" />
                
                <div className="flex flex-col md:flex-row gap-8 relative z-10">
                  <div className="shrink-0 flex flex-col items-center gap-4">
                    <div className="size-16 rounded-[24px] bg-black text-[#CBFF38] flex items-center justify-center font-black text-2xl italic shadow-lg">
                      {review.client.firstName[0]}
                    </div>
                    {!review.isVisible && (
                       <div className="px-2 py-1 bg-red-100 text-red-600 rounded-md text-[8px] font-black uppercase tracking-widest">Hidden</div>
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

const StatCard = ({ title, value, icon, subText, highlight }: any) => (
  <div className={`bg-white p-6 rounded-[32px] border transition-all duration-300 group relative overflow-hidden ${
    highlight ? 'border-[#CBFF38] shadow-lg shadow-lime-500/10' : 'border-gray-100 hover:border-black'
  }`}>
    <div className="flex items-start justify-between mb-6">
       <div className={`size-10 rounded-xl flex items-center justify-center transition-all bg-gray-50 group-hover:bg-black group-hover:text-[#CBFF38] ${highlight ? 'text-[#CBFF38] bg-black' : 'text-gray-400'}`}>
          {icon}
       </div>
       {highlight && <div className="text-[8px] font-black text-[#CBFF38] bg-black px-2 py-0.5 rounded-full italic animate-pulse">LIVE</div>}
    </div>
    <div>
       <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 group-hover:text-black transition-colors mb-1">{title}</p>
       <h3 className="text-2xl font-black uppercase italic tracking-tighter text-gray-900 leading-none">{value}</h3>
       {subText && <p className="text-[8px] font-black text-gray-300 uppercase mt-1 italic">{subText}</p>}
    </div>
  </div>
);

export default ReviewsPage;
