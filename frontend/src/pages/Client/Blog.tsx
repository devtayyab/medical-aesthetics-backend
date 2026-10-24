import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useLanguage } from "@/hooks/useLanguage";
import { publicBlogsAPI } from "@/services/api";
import { css } from "@emotion/css";
import { ChevronRight, Search, ArrowRight, BookOpen, Clock, Tag, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { getImageUrl } from "@/utils/imageUrl";

// Use the custom hero image for blog
import HeroBg from "@/assets/image copy.png";

const sectionStyles = css`
  min-height: 100vh;
  background: #F8FAFC;
`;

const glassCard = css`
  background: rgba(255, 255, 255, 0.65);
  backdrop-filter: blur(20px) saturate(180%);
  -webkit-backdrop-filter: blur(20px) saturate(180%);
  border-radius: 28px;
  box-shadow: 0 20px 50px -10px rgba(0, 0, 0, 0.05), inset 0 1px 1px rgba(255, 255, 255, 0.95);
  border: 1px solid rgba(255, 255, 255, 0.85);
  position: relative;
  overflow: hidden;
  transition: all 0.35s cubic-bezier(0.4, 0, 0.2, 1);

  &:hover {
    background: rgba(255, 255, 255, 0.8);
    border-color: rgba(203, 255, 56, 0.7);
    box-shadow: 0 30px 60px -10px rgba(203, 255, 56, 0.12), inset 0 1px 1px rgba(255, 255, 255, 0.95);
  }
`;

const FALLBACK_ARTICLES = [
  {
    id: "fallback-1",
    slug: "understanding-botox-and-dermal-fillers",
    title: "Understanding Botulinum Toxin & Dermal Fillers: Clinical Guidance",
    content: "A detailed breakdown of mechanisms, clinical safety, and anatomical considerations for facial rejuvenation.",
    imageUrl: "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=800&q=80",
    category: { name: "Facial Medicine" },
    publishedAt: new Date().toISOString(),
  },
  {
    id: "fallback-2",
    slug: "modern-hair-restoration-protocols",
    title: "Modern Hair Restoration Protocols: FUE & DHI Techniques",
    content: "Exploring surgical advancements in follicular unit extraction and long-term scalp density preservation.",
    imageUrl: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=800&q=80",
    category: { name: "Hair Treatments" },
    publishedAt: new Date().toISOString(),
  },
  {
    id: "fallback-3",
    slug: "laser-skin-resurfacing-and-collagen",
    title: "Laser Skin Resurfacing: Stimulating Dermal Collagen Synthesis",
    content: "An overview of fractional and ablative laser modalities for treating photoaging, texture, and pigmentation.",
    imageUrl: "https://images.unsplash.com/photo-1512290900672-1f41b4e36608?auto=format&fit=crop&w=800&q=80",
    category: { name: "Dermatology" },
    publishedAt: new Date().toISOString(),
  },
];

export const Blog: React.FC = () => {
  const navigate = useNavigate();
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [categories, setCategories] = useState<any[]>([]);
  const [blogPosts, setBlogPosts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { isGreek } = useLanguage();

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const [cats, posts] = await Promise.all([
          publicBlogsAPI.getCategories().catch(() => ({ data: [] })),
          publicBlogsAPI.getPosts().catch(() => ({ data: [] }))
        ]);
        setCategories(cats.data || []);
        const loadedPosts = posts.data && posts.data.length > 0 ? posts.data : FALLBACK_ARTICLES;
        setBlogPosts(loadedPosts);
      } catch (err) {
        console.error("Failed to load blog data", err);
        setBlogPosts(FALLBACK_ARTICLES);
      } finally {
        setIsLoading(false);
      }
    };
    fetchInitialData();
  }, []);

  const filteredPosts = blogPosts.filter(post =>
    (selectedCategoryId === "All" || post.categoryId === selectedCategoryId) &&
    (post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (post.content && post.content.toLowerCase().includes(searchQuery.toLowerCase())))
  );

  return (
    <div className={`${sectionStyles} relative overflow-x-hidden`}>
      {/* Background Hero Banner - 100% Crisp, unblurred skincare aesthetic visual */}
      <div className="absolute top-0 inset-x-0 h-[640px] sm:h-[720px] lg:h-[780px] z-0 pointer-events-none overflow-hidden">
        <img
          src={HeroBg}
          style={{ objectPosition: 'center 45%', filter: 'none', imageRendering: 'auto' }}
          className="w-full h-full object-cover"
          alt="Blog Hero"
        />
        {/* Soft Ambient Left Gradient behind typography so text is 100% readable while the bottles remain totally crisp & visible */}
        <div className="absolute inset-y-0 left-0 w-full sm:w-2/3 max-w-2xl bg-gradient-to-r from-white/95 via-white/45 to-transparent pointer-events-none" />
        {/* Soft bottom blend to transition smoothly into page base */}
        <div className="absolute inset-x-0 bottom-0 h-44 bg-gradient-to-t from-[#F8FAFC] via-[#F8FAFC]/70 to-transparent pointer-events-none" />
      </div>

      <div className="relative z-10 max-w-[1360px] w-full mx-auto px-4 sm:px-8 pt-8 sm:pt-14 pb-24">
        {/* Page Title & Floating Glass Breadcrumbs */}
        <div className="max-w-2xl mb-8 sm:mb-12">
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-white/75 backdrop-blur-md border border-white/85 text-[10px] sm:text-[11px] font-black uppercase tracking-[0.2em] shadow-sm mb-4 sm:mb-6"
          >
            <Link to="/" className="text-gray-900 border-b border-gray-900/30 hover:border-black pb-0.5">
              HOME
            </Link>
            <ChevronRight size={12} className="text-[#84cc16]" />
            <span className="text-[#84cc16] font-extrabold">ARTICLES & INSIGHTS</span>
          </motion.div>

          <motion.h1 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-2xl sm:text-4xl md:text-5xl font-black uppercase tracking-tight leading-tight text-gray-900 drop-shadow-sm"
          >
            {isGreek ? (
              <>Ενημέρωση για θεραπείες, <br /><span className="text-[#84cc16] sm:text-[#a3e635]">την υγεία του δέρματος και την αισθητική φροντίδα.</span></>
            ) : (
              <>Information about treatments, <br /><span className="text-[#84cc16] sm:text-[#a3e635]">skin health and aesthetic care.</span></>
            )}
          </motion.h1>

          <motion.p 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="text-gray-600 mt-3 sm:mt-5 font-bold text-xs sm:text-base max-w-xl leading-relaxed"
          >
            {isGreek
              ? 'Το περιεχόμενο δεν αντικαθιστά την εξατομικευμένη ιατρική αξιολόγηση ή συμβουλή.'
              : 'Content is provided for general information and does not replace individual medical assessment or advice.'}
          </motion.p>
        </div>

        <main className="relative z-20">
          <div className="flex flex-col xl:flex-row gap-8 items-start">
            {/* Left Column: Filter by Protocol */}
            <aside className="w-full xl:w-72 shrink-0">
              <div className={glassCard}>
                <div className="p-6">
                  <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-5">
                    {isGreek ? 'Κατηγορίες άρθρων' : 'Article Categories'}
                  </h3>

                  <div className="space-y-2">
                    <button
                      onClick={() => setSelectedCategoryId("All")}
                      className={`w-full text-left px-4 py-3 rounded-2xl transition-all text-[10px] font-black uppercase tracking-widest flex items-center justify-between group ${
                        selectedCategoryId === "All"
                          ? 'bg-black text-[#CBFF38] shadow-lg shadow-black/10'
                          : 'text-gray-600 hover:text-black hover:bg-white/60'
                      }`}
                    >
                      <span>All Articles</span>
                      <ChevronRight size={12} className={selectedCategoryId === "All" ? "text-[#CBFF38]" : "opacity-0 group-hover:opacity-100"} />
                    </button>
                    {categories.map(cat => (
                      <button
                        key={cat.id}
                        onClick={() => setSelectedCategoryId(cat.id)}
                        className={`w-full text-left px-4 py-3 rounded-2xl transition-all text-[10px] font-black uppercase tracking-widest flex items-center justify-between group ${
                          selectedCategoryId === cat.id
                            ? 'bg-black text-[#CBFF38] shadow-lg shadow-black/10'
                            : 'text-gray-600 hover:text-black hover:bg-white/60'
                        }`}
                      >
                        <span className="truncate">{cat.name}</span>
                        <ChevronRight size={12} className={selectedCategoryId === cat.id ? "text-[#CBFF38]" : "opacity-0 group-hover:opacity-100"} />
                      </button>
                    ))}
                  </div>

                  <div className="mt-8 pt-6 border-t border-gray-200/60">
                    <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-3">
                      {isGreek ? 'Αναζήτηση' : 'Search'}
                    </h4>
                    <div className="relative">
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder={isGreek ? "Αναζήτηση..." : "Keyword..."}
                        className="w-full bg-white/70 backdrop-blur-sm border border-white/80 rounded-2xl px-4 py-3 outline-none focus:border-[#CBFF38] transition-all font-bold text-xs text-gray-900 placeholder-gray-400"
                      />
                      <Search size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                    </div>
                  </div>
                </div>
              </div>
            </aside>

            {/* Middle Column: Content Section */}
            <div className="flex-1 w-full">
              {isLoading ? (
                <div className="flex flex-col items-center justify-center py-40 gap-6">
                  <div className="size-14 border-4 border-[#CBFF38] border-t-transparent rounded-full animate-spin" />
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] animate-pulse">Syncing Insights</span>
                </div>
              ) : filteredPosts.length === 0 ? (
                <div className={`${glassCard} py-32 text-center px-6`}>
                  <div className="size-16 rounded-2xl bg-white/80 border border-white/90 flex items-center justify-center mx-auto mb-6 text-gray-300 shadow-sm">
                    <BookOpen size={30} />
                  </div>
                  <h3 className="text-xl font-black uppercase text-gray-900 mb-2">No Matches Found</h3>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Adjust search or filters.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {filteredPosts.map((post, i) => (
                    <motion.div
                      key={post.id}
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                    >
                      <Link to={`/blog/${encodeURIComponent(post.slug)}`} className={`${glassCard} group block h-full`}>
                        <div className="h-52 overflow-hidden relative bg-gray-100">
                          <img
                            src={getImageUrl(post.imageUrl) || `https://placehold.co/600x400/1A1A1A/CBFF38?text=${encodeURIComponent(post.title.charAt(0))}`}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                            alt={post.title}
                            onError={(e) => { e.currentTarget.src = `https://placehold.co/600x400/1A1A1A/CBFF38?text=${encodeURIComponent(post.title.charAt(0))}` }}
                          />
                          <div className="absolute top-4 left-4 bg-black text-[#CBFF38] px-3 py-1 rounded-full text-[8.5px] font-black uppercase tracking-widest shadow-md">
                            {post.category?.name || 'Aesthetics'}
                          </div>
                        </div>

                        <div className="p-6 sm:p-7">
                          <div className="flex items-center gap-4 mb-3">
                            <div className="flex items-center gap-1.5 text-[9px] font-black text-gray-400 uppercase tracking-widest">
                              <Clock size={11} className="text-[#84cc16]" />
                              {new Date(post.publishedAt || post.createdAt).toLocaleDateString()}
                            </div>
                          </div>

                          <h3 className="text-lg sm:text-xl font-black uppercase text-gray-900 mb-5 leading-snug group-hover:text-black line-clamp-2">
                            {post.title}
                          </h3>

                          <div className="flex items-center justify-between pt-4 border-t border-gray-200/50">
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 group-hover:text-black transition-colors flex items-center gap-2">
                              Read More <ArrowRight size={12} className="group-hover:translate-x-1 transition-transform" />
                            </span>
                            <Tag size={13} className="text-gray-300 group-hover:text-[#84cc16] transition-colors" />
                          </div>
                        </div>
                      </Link>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>

            {/* Right Column: Promotion Card */}
            <aside className="w-full xl:w-72 shrink-0">
              <div className="bg-black/90 backdrop-blur-xl rounded-[32px] p-7 sm:p-8 relative overflow-hidden group shadow-2xl min-h-72 flex flex-col justify-between border border-white/10">
                <div className="relative z-10">
                  <div className="size-10 rounded-2xl bg-[#CBFF38]/20 text-[#CBFF38] flex items-center justify-center mb-5 border border-[#CBFF38]/30">
                    <Sparkles size={18} />
                  </div>
                  <h4 className="text-lg font-black uppercase text-white tracking-tight leading-snug mb-3">
                    {isGreek ? 'Δείτε θεραπείες' : 'Explore Treatments'}
                  </h4>
                  <p className="text-xs text-gray-400 font-medium leading-relaxed mb-6">
                    {isGreek
                      ? 'Μάθετε για τις θεραπείες και τις υπηρεσίες που διατίθενται μέσω συνεργαζόμενων κλινικών.'
                      : 'Learn about treatments and services available through participating clinics.'}
                  </p>
                </div>
                <div className="relative z-10">
                  <button
                    onClick={() => navigate('/treatments')}
                    className="w-full bg-[#CBFF38] hover:bg-white text-black font-black text-[10px] uppercase tracking-widest py-3.5 px-4 rounded-2xl transition-all shadow-lg active:scale-95"
                  >
                    {isGreek ? 'ΔΕΙΤΕ ΥΠΗΡΕΣΙΕΣ' : 'VIEW SERVICES'}
                  </button>
                </div>
              </div>
            </aside>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Blog;
