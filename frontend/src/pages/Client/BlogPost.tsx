import React, { useState, useEffect } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { publicBlogsAPI } from "@/services/api";
import { css } from "@emotion/css";
import { ChevronLeft, Calendar, User, Tag, Clock, Sparkles, ArrowRight, ArrowUp } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// Custom clinical hero visual
import HeroBg from "@/assets/Blog_Hero.jpg";

const sectionStyles = css`
  min-height: 100vh;
  background: radial-gradient(circle at top right, rgba(203, 255, 56, 0.05), transparent), #FFFFFF;
`;

const glassCard = css`
  background: white;
  border-radius: 40px;
  box-shadow: 0 50px 100px rgba(0, 0, 0, 0.04);
  border: 1px solid #F1F5F9;
  position: relative;
  overflow: hidden;
`;

const articleBody = css`
  font-family: 'Inter', sans-serif;
  font-size: 1.15rem;
  line-height: 2;
  color: #4B5563;

  h1, h2, h3, h4 {
    font-weight: 900;
    text-transform: uppercase;
    font-style: italic;
    color: #111827;
    margin-top: 3.5rem;
    margin-bottom: 1.5rem;
    letter-spacing: -0.04em;
    line-height: 1.1;
  }

  h2 { font-size: 2.25rem; }
  h3 { font-size: 1.75rem; }

  p { margin-bottom: 2rem; }

  a {
    color: #000;
    font-weight: 800;
    text-decoration: underline;
    text-decoration-color: #CBFF38;
    text-underline-offset: 6px;
    transition: all 0.2s;
    &:hover { color: #CBFF38; }
  }

  blockquote {
    border-left: 6px solid #CBFF38;
    background: #F9FAF9;
    margin: 3rem 0;
    padding: 2.5rem 3rem;
    border-radius: 0 32px 32px 0;
    font-style: italic;
    font-size: 1.4rem;
    font-weight: 700;
    color: #111827;
    line-height: 1.6;
  }

  img {
    border-radius: 32px;
    margin: 3.5rem 0;
    width: 100%;
    box-shadow: 0 30px 60px rgba(0,0,0,0.1);
  }

  ul, ol {
    padding-left: 2rem;
    margin-bottom: 2rem;
    li { margin-bottom: 0.75rem; list-style-type: decimal; }
  }
`;

export const BlogPost: React.FC = () => {
    const { slug } = useParams<{ slug: string }>();
    const navigate = useNavigate();
    const [post, setPost] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [scrollProgress, setScrollProgress] = useState(0);

    useEffect(() => {
        const fetchPost = async () => {
            try {
                if (!slug) return;
                const response = await publicBlogsAPI.getPostBySlug(slug);
                setPost(response.data);
            } catch (err) {
                console.error("Failed to load blog post", err);
            } finally {
                setIsLoading(false);
            }
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
            <div className="min-h-screen bg-white flex flex-col items-center justify-center gap-6">
                <div className="size-16 border-2 border-[#CBFF38] border-t-transparent rounded-full animate-spin" />
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] animate-pulse">Analyzing Insight</span>
            </div>
        );
    }

    if (!post) {
        return (
            <div className="min-h-screen bg-white flex flex-col items-center justify-center p-8">
                <h2 className="text-5xl font-black uppercase italic tracking-tighter text-gray-900 mb-6">404: LOST IN SIGHT</h2>
                <button
                    onClick={() => navigate('/blog')}
                    className="flex items-center gap-3 bg-black text-[#CBFF38] px-10 h-14 rounded-2xl font-black uppercase text-[10px] tracking-widest active:scale-95 transition-all shadow-2xl"
                >
                    <ChevronLeft size={16} /> RETURN TO FEED
                </button>
            </div>
        );
    }

    return (
        <div className={sectionStyles}>
            {/* Reading Progress */}
            <div className="fixed top-0 left-0 right-0 z-[100] h-1.5 bg-gray-50/50 backdrop-blur-md">
                <motion.div
                    className="h-full bg-[#CBFF38]"
                    initial={{ width: 0 }}
                    animate={{ width: `${scrollProgress}%` }}
                />
            </div>

            {/* Premium Header */}
            <div className="relative pt-24 pb-40 overflow-hidden">
                {/* Background Hero Image */}
                <div className="absolute inset-0 z-0">
                    <img 
                        src={HeroBg} 
                        style={{ objectPosition: 'center 70%' }}
                        className="w-full h-full object-cover opacity-[0.2]" 
                        alt="Background" 
                    />
                </div>

                <div className="container mx-auto px-8 relative z-10">
                    <div className="max-w-4xl">
                        <motion.div 
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="flex items-center gap-3 mb-10 text-gray-400 text-[11px] font-black uppercase tracking-[0.2em] italic"
                        >
                            <Link to="/blog" className="text-gray-900 border-b border-gray-900 pb-0.5 hover:text-lime-500 hover:border-lime-500 transition-colors">ARTICLES</Link>
                            <span className="text-lime-500"> INSIGHT_VOICE</span>
                        </motion.div>
                        
                        <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="space-y-6"
                        >
                            {post.category && (
                                <div className="inline-flex items-center gap-2 bg-black text-[#CBFF38] px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-widest italic">
                                   <Tag size={12} /> {post.category.name}
                                </div>
                            )}
                            
                            <h1 className="text-5xl md:text-8xl font-black uppercase italic tracking-tighter leading-[0.9] text-gray-900">
                                {post.title}
                            </h1>
                            
                            <div className="flex flex-wrap items-center gap-8 pt-6">
                                <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-gray-400 italic">
                                    <Calendar size={14} className="text-lime-500" />
                                    {new Date(post.publishedAt || post.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
                                </div>
                                <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-gray-400 italic">
                                    <Clock size={14} className="text-lime-500" />
                                    {readingTime} MIN READ
                                </div>
                                <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-lime-500 italic">
                                    <Sparkles size={14} />
                                    ELITE CLINICAL INSIGHT
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </div>

            {/* Article Content Section */}
            <main className="container mx-auto px-8 relative z-20 -mt-20 pb-32">
                <div className="flex flex-col xl:flex-row gap-12">
                    {/* Main Content Body */}
                    <div className="flex-1">
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.98 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className={`${glassCard} mb-12`}
                        >
                            <div className="aspect-[21/9] overflow-hidden">
                                <img
                                    src={post.imageUrl || `https://placehold.co/1200x600/1A1A1A/CBFF38?text=${encodeURIComponent(post.title)}`}
                                    alt={post.title}
                                    className="w-full h-full object-cover"
                                />
                            </div>
                            
                            <div className="p-8 md:p-20">
                                <div 
                                    className={articleBody}
                                    dangerouslySetInnerHTML={{ __html: post.content }}
                                />
                                
                                <div className="mt-20 pt-10 border-t border-gray-50 flex flex-col md:flex-row items-center justify-between gap-8">
                                    <Link
                                        to="/blog"
                                        className="flex items-center gap-3 text-[11px] font-black uppercase tracking-[0.3em] text-gray-400 hover:text-black transition-colors italic group"
                                    >
                                        <ChevronLeft size={16} className="group-hover:-translate-x-1 transition-transform" /> Back to Intelligence Feed
                                    </Link>
                                    
                                    <div 
                                        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                                        className="flex items-center gap-3 text-[11px] font-black uppercase tracking-[0.3em] text-gray-900 cursor-pointer group italic"
                                    >
                                        Return to Peak <ArrowUp size={16} className="group-hover:-translate-y-1 transition-transform text-lime-500" />
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </div>

                    {/* Sidebar / Sidebar Metadata */}
                    <aside className="xl:w-80 shrink-0 space-y-8">
                        {/* Author Glass Card */}
                        {post.author && (
                            <div className={glassCard}>
                                <div className="p-8">
                                    <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-8 italic text-center">Authored By</h4>
                                    <div className="flex flex-col items-center text-center">
                                        <div className="size-20 rounded-3xl bg-black flex items-center justify-center text-[#CBFF38] font-black text-3xl uppercase mb-6 shadow-2xl">
                                            {post.author.firstName?.charAt(0)}
                                        </div>
                                        <h3 className="text-xl font-black uppercase italic tracking-tighter text-gray-900">{post.author.firstName} {post.author.lastName}</h3>
                                        <p className="text-[9px] font-bold text-lime-600 uppercase tracking-widest mt-2 px-3 py-1 bg-lime-50 rounded-full">Senior Practitioner</p>
                                        <p className="text-gray-400 text-xs mt-6 font-medium leading-relaxed italic">
                                            Specializing in advanced aesthetic procedures and clinical excellence protocols.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Quick CTA */}
                        <div className="bg-black rounded-[40px] p-10 relative overflow-hidden group shadow-2xl min-h-[400px] flex flex-col justify-between">
                            <div className="relative z-10">
                                <Sparkles className="text-[#CBFF38] mb-6" size={32} />
                                <h4 className="text-3xl font-black uppercase italic text-white tracking-tighter leading-none mb-6">Experience <br /> The Difference</h4>
                                <p className="text-sm font-medium text-gray-400 leading-relaxed italic">Transform your aesthetic journey with our elite medical professionals.</p>
                            </div>
                            
                            <button 
                                onClick={() => navigate('/booking')}
                                className="relative z-10 w-full bg-[#CBFF38] text-black h-16 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] flex items-center justify-center gap-3 active:scale-95 transition-all shadow-2xl"
                            >
                                Book consultation <ArrowRight size={16} />
                            </button>
                            
                            <div className="absolute inset-0 opacity-20">
                                <img src="https://images.unsplash.com/photo-1579684385127-1ef15d508118?q=80&w=800&auto=format&fit=crop" className="w-full h-full object-cover grayscale" alt="Clinic" />
                            </div>
                        </div>
                    </aside>
                </div>
            </main>
        </div>
    );
};
