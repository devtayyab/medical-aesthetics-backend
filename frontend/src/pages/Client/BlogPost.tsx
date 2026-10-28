import React, { useState, useEffect } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { publicBlogsAPI } from "@/services/api";
import { css } from "@emotion/css";
import { ChevronLeft, ChevronRight, Calendar, User, Tag, Clock, Sparkles, ArrowRight, ArrowUp } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { getImageUrl } from "@/utils/imageUrl";

// Custom clinical hero visual
import HeroBg from "@/assets/image copy.png";
import { formatDate } from "@/utils/formatters";

const sectionStyles = css`
  min-height: 100vh;
  background: #F8FAFC;
`;

const glassCard = css`
  background: rgba(255, 255, 255, 0.75);
  backdrop-filter: blur(20px) saturate(180%);
  -webkit-backdrop-filter: blur(20px) saturate(180%);
  border-radius: 32px;
  box-shadow: 0 30px 60px -15px rgba(0, 0, 0, 0.05), 0 1px 3px rgba(0, 0, 0, 0.02), inset 0 1px 1px rgba(255, 255, 255, 0.95);
  border: 1px solid rgba(255, 255, 255, 0.85);
  position: relative;
  overflow: hidden;
`;

const articleBody = css`
  font-family: 'Manrope', sans-serif;
  font-size: 1rem;
  @media (min-width: 768px) {
    font-size: 1.15rem;
  }
  overflow-wrap: break-word;
  line-height: 2;
  color: #374151;

  h1, h2, h3, h4 {
    font-weight: 900;
    text-transform: uppercase;
    color: #111827;
    margin-top: 3.5rem;
    margin-bottom: 1.5rem;
    letter-spacing: -0.04em;
    line-height: 1.15;
  }

  h2 { font-size: 1.5rem; }
  h3 { font-size: 1.25rem; }
  @media (min-width: 768px) {
    h2 { font-size: 2.25rem; }
    h3 { font-size: 1.75rem; }
  }

  p { margin-bottom: 2rem; }

  a {
    color: #000;
    font-weight: 800;
    text-decoration: underline;
    text-decoration-color: #CBFF38;
    text-underline-offset: 6px;
    transition: all 0.2s;
    &:hover { color: #84cc16; }
  }

  blockquote {
    border-left: 6px solid #CBFF38;
    background: rgba(255, 255, 255, 0.6);
    backdrop-filter: blur(8px);
    margin: 2rem 0;
    padding: 1.5rem 2rem;
    @media (min-width: 640px) {
      margin: 3rem 0;
      padding: 2.5rem 3rem;
    }
    border-radius: 0 32px 32px 0;
    font-size: 1.2rem;
    @media (min-width: 640px) {
      font-size: 1.4rem;
    }
    font-weight: 700;
    color: #111827;
    line-height: 1.6;
    border-top: 1px solid rgba(255, 255, 255, 0.8);
    border-right: 1px solid rgba(255, 255, 255, 0.8);
    border-bottom: 1px solid rgba(255, 255, 255, 0.8);
  }

  img {
    border-radius: 32px;
    margin: 3.5rem 0;
    width: 100%;
    box-shadow: 0 30px 60px rgba(0,0,0,0.08);
    border: 1px solid rgba(255, 255, 255, 0.8);
  }

  ul, ol {
    padding-left: 2rem;
    margin-bottom: 2rem;
    li { margin-bottom: 0.75rem; list-style-type: decimal; }
  }
`;

const FALLBACK_POSTS: Record<string, any> = {
  "understanding-botox-and-dermal-fillers": {
    title: "Understanding Botulinum Toxin & Dermal Fillers: Clinical Guidance",
    content: "<p>Botulinum toxin type A and hyaluronic acid dermal fillers represent the foundation of modern non-surgical facial aesthetics. When administered by qualified medical practitioners, these protocols offer predictable, harmonious, and anatomically respectful rejuvenation.</p><h2>Mechanism of Action</h2><p>Botulinum toxin functions by temporarily preventing acetylcholine release at neuromuscular junctions, allowing dynamic rhytids—such as glabellar lines, forehead furrows, and lateral canthal lines—to relax naturally.</p><blockquote>Clinical excellence requires comprehensive understanding of facial vasculature and dynamic muscle vectors.</blockquote><h2>Hyaluronic Acid Volume Restoration</h2><p>Dermal fillers restore lost deep structural volume and redefine anatomical contours. Cross-linked hyaluronic acid integrates into targeted tissue layers, restoring hydration and support.</p>",
    imageUrl: "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=1200&q=80",
    category: { name: "Facial Medicine" },
    publishedAt: new Date().toISOString(),
  },
  "modern-hair-restoration-protocols": {
    title: "Modern Hair Restoration Protocols: FUE & DHI Techniques",
    content: "<p>Hair restoration surgery has evolved dramatically over the last decade. Modern Follicular Unit Extraction (FUE) and Direct Hair Implantation (DHI) offer natural hairline design with minimal recovery time.</p><h2>FUE vs. DHI Methodologies</h2><p>Both techniques harvest individual follicular units using micro-punches. In DHI, specialized implanters allow immediate graft placement with precise control over angle, depth, and direction of hair growth.</p><blockquote>Preserving donor area density is fundamental for long-term aesthetic balance.</blockquote>",
    imageUrl: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=1200&q=80",
    category: { name: "Hair Treatments" },
    publishedAt: new Date().toISOString(),
  },
  "laser-skin-resurfacing-and-collagen": {
    title: "Laser Skin Resurfacing: Stimulating Dermal Collagen Synthesis",
    content: "<p>Fractional laser technologies create microscopic thermal zones that trigger natural wound healing cascades, leading to neocollagenesis and elastin remodeling.</p><h2>Treatment Applications</h2><p>Ablative and non-ablative lasers target superficial dyschromia, fine lines, acne scarring, and overall skin texture with calibrated thermal delivery.</p>",
    imageUrl: "https://images.unsplash.com/photo-1512290900672-1f41b4e36608?auto=format&fit=crop&w=1200&q=80",
    category: { name: "Dermatology" },
    publishedAt: new Date().toISOString(),
  },
};

export const BlogPost: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [post, setPost] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    const fetchPost = async () => {
      try {
        if (!slug) return;
        const response = await publicBlogsAPI.getPostBySlug(slug);
        if (response?.data) {
          setPost(response.data);
          setIsLoading(false);
          return;
        }
      } catch (err) {
        console.error("Failed to load blog post from API, checking fallbacks...", err);
      }
      if (slug && FALLBACK_POSTS[slug]) {
        setPost(FALLBACK_POSTS[slug]);
      }
      setIsLoading(false);
    };
    fetchPost();
  }, [slug]);

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      setScrollProgress(docHeight > 0 ? (scrollTop / docHeight) * 100 : 0);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const readingTime = Math.max(1, Math.ceil(
    (post?.content?.replace(/<[^>]*>?/gm, '').split(/\s+/).length || 0) / 200
  ));

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center gap-6">
        <div className="size-14 border-4 border-[#CBFF38] border-t-transparent rounded-full animate-spin" />
        <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] animate-pulse">Analyzing Insight</span>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center p-8">
        <h2 className="text-4xl sm:text-5xl font-black uppercase tracking-tight text-gray-900 mb-6">Article Not Found</h2>
        <button
          onClick={() => navigate('/blog')}
          className="flex items-center gap-3 bg-black text-[#CBFF38] hover:bg-[#CBFF38] hover:text-black px-10 h-14 rounded-2xl font-black uppercase text-[10px] tracking-widest active:scale-95 transition-all shadow-2xl"
        >
          <ChevronLeft size={16} /> RETURN TO FEED
        </button>
      </div>
    );
  }

  return (
    <div className={`${sectionStyles} relative overflow-x-hidden`}>
      {/* Reading Progress Bar */}
      <div className="fixed top-0 left-0 right-0 z-[100] h-1.5 bg-white/40 backdrop-blur-md">
        <motion.div
          className="h-full bg-[#CBFF38] shadow-[0_0_10px_rgba(203,255,56,0.8)]"
          initial={{ width: 0 }}
          animate={{ width: `${scrollProgress}%` }}
        />
      </div>

      {/* Hero Header - 100% Crisp Visual with Model moved UPWARDS */}
      <div className="absolute top-0 inset-x-0 h-[440px] sm:h-[500px] lg:h-[540px] z-0 pointer-events-none overflow-hidden">
        <img 
          src={HeroBg} 
          style={{ objectPosition: 'center 50%', filter: 'none', imageRendering: 'auto' }}
          className="w-full h-full object-cover" 
          alt="Article Background" 
        />
        {/* Soft Ambient Left Gradient behind typography so title is 100% readable while the model and spa elements remain crisp */}
        <div className="absolute inset-y-0 left-0 w-full sm:w-2/3 max-w-2xl bg-gradient-to-r from-white/95 via-white/45 to-transparent pointer-events-none" />
        {/* Soft bottom blend into page base */}
        <div className="absolute inset-x-0 bottom-0 h-36 bg-gradient-to-t from-[#F8FAFC] via-[#F8FAFC]/70 to-transparent pointer-events-none" />
      </div>

      <div className="relative z-10 max-w-[1360px] w-full mx-auto px-4 sm:px-8 pt-8 sm:pt-14 pb-28">
        {/* Page Title & Floating Glass Breadcrumbs */}
        <div className="max-w-3xl mb-10 sm:mb-14">
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-white/75 backdrop-blur-md border border-white/85 text-[10px] sm:text-[11px] font-black uppercase tracking-[0.2em] shadow-sm mb-4 sm:mb-6"
          >
            <Link to="/blog" className="text-gray-900 border-b border-gray-900/30 hover:border-black pb-0.5">
              ARTICLES
            </Link>
            <ChevronRight size={12} className="text-[#84cc16]" />
            <span className="text-[#84cc16] font-extrabold">INSIGHT & ARTICLES</span>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            {post.category && (
              <div className="inline-flex items-center gap-2 bg-black text-[#CBFF38] px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest shadow-sm">
                <Tag size={12} /> {post.category.name}
              </div>
            )}
            
            <h1 className="text-3xl sm:text-5xl md:text-6xl font-black uppercase tracking-tight leading-tight text-gray-900 drop-shadow-sm">
              {post.title}
            </h1>
            
            <div className="flex flex-wrap items-center gap-3 sm:gap-6 pt-2">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/70 backdrop-blur-sm border border-white/85 text-[10px] font-black uppercase tracking-widest text-gray-500 shadow-xs">
                <Calendar size={13} className="text-[#84cc16]" />
                {formatDate(post.publishedAt || post.createdAt)}
              </div>
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/70 backdrop-blur-sm border border-white/85 text-[10px] font-black uppercase tracking-widest text-gray-500 shadow-xs">
                <Clock size={13} className="text-[#84cc16]" />
                {readingTime} MIN READ
              </div>
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/70 backdrop-blur-sm border border-white/85 text-[10px] font-black uppercase tracking-widest text-[#84cc16] shadow-xs">
                <Sparkles size={13} />
                CLINICAL INSIGHT
              </div>
            </div>
          </motion.div>
        </div>

        {/* Article Content Section */}
        <main className="relative z-20">
          <div className="flex flex-col xl:flex-row gap-10 items-start">
            {/* Main Content Body */}
            <div className="flex-1 w-full">
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className={`${glassCard} mb-12`}
              >
                {post.imageUrl && !imageError && (
                  <div className="aspect-[16/9] max-h-[460px] overflow-hidden bg-white/30 border-b border-white/80">
                    <img
                      src={getImageUrl(post.imageUrl)}
                      alt={post.title}
                      onError={() => setImageError(true)}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                
                <div className="p-6 sm:p-10 md:p-16">
                  <div 
                    className={articleBody}
                    dangerouslySetInnerHTML={{ __html: post.content }}
                  />
                  
                  <div className="mt-16 pt-8 border-t border-gray-200/60 flex flex-col md:flex-row items-center justify-between gap-6">
                    <Link
                      to="/blog"
                      className="flex items-center gap-3 text-[11px] font-black uppercase tracking-[0.25em] text-gray-500 hover:text-black transition-colors group"
                    >
                      <ChevronLeft size={16} className="group-hover:-translate-x-1 transition-transform text-[#84cc16]" /> Back to Articles
                    </Link>
                    
                    <button 
                      type="button"
                      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                      className="flex items-center gap-2.5 text-[11px] font-black uppercase tracking-[0.25em] text-gray-900 hover:text-[#84cc16] cursor-pointer group transition-colors"
                    >
                      <span>Return to Top</span>
                      <ArrowUp size={16} className="group-hover:-translate-y-1 transition-transform text-[#84cc16]" />
                    </button>
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Sidebar / Sidebar Metadata */}
            <aside className="w-full xl:w-80 shrink-0 space-y-6">
              {/* Author Glass Card */}
              {post.author && (
                <div className="bg-white/65 hover:bg-white/75 backdrop-blur-xl border border-white/85 rounded-3xl p-6 sm:p-8 shadow-[0_20px_50px_rgba(0,0,0,0.05)] transition-all">
                  <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-6 text-center">
                    Authored By
                  </h4>
                  <div className="flex flex-col items-center text-center">
                    <div className="size-18 rounded-3xl bg-black text-[#CBFF38] flex items-center justify-center font-black text-2xl uppercase mb-4 shadow-xl shadow-black/10">
                      {post.author.firstName?.charAt(0)}
                    </div>
                    <h3 className="text-lg font-black uppercase tracking-tight text-gray-900">
                      {post.author.firstName} {post.author.lastName}
                    </h3>
                    <p className="text-[9px] font-extrabold text-[#84cc16] uppercase tracking-widest mt-1.5 px-3 py-1 bg-lime-500/10 rounded-full border border-lime-500/20">
                      Senior Practitioner
                    </p>
                    <p className="text-gray-500 text-xs mt-4 font-medium leading-relaxed">
                      Specializing in advanced aesthetic procedures and clinical excellence protocols.
                    </p>
                  </div>
                </div>
              )}

              {/* Quick CTA */}
              <div className="bg-black/90 backdrop-blur-xl rounded-[32px] p-7 sm:p-9 relative overflow-hidden group shadow-2xl min-h-[360px] flex flex-col justify-between border border-white/10">
                <div className="relative z-10">
                  <div className="size-10 rounded-2xl bg-[#CBFF38]/20 text-[#CBFF38] flex items-center justify-center mb-5 border border-[#CBFF38]/30">
                    <Sparkles size={20} />
                  </div>
                  <h4 className="text-2xl font-black uppercase text-white tracking-tight leading-tight mb-3">
                    Experience <br /> The Difference
                  </h4>
                  <p className="text-xs font-medium text-gray-400 leading-relaxed">
                    Transform your aesthetic journey with our elite medical professionals.
                  </p>
                </div>
                
                <button 
                  onClick={() => navigate('/search')}
                  className="relative z-10 w-full bg-[#CBFF38] hover:bg-white text-black h-14 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] flex items-center justify-center gap-2.5 active:scale-95 transition-all shadow-xl cursor-pointer"
                >
                  <span>Book Consultation</span>
                  <ArrowRight size={15} />
                </button>
              </div>
            </aside>
          </div>
        </main>
      </div>
    </div>
  );
};

export default BlogPost;
