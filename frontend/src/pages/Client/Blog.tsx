import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { publicBlogsAPI } from "@/services/api";
import { css } from "@emotion/css";
import { ChevronRight, Search, ArrowRight, BookOpen, Clock, Tag, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// Use the custom hero image for blog
import HeroBg from "@/assets/Blog_Hero.jpg";

const sectionStyles = css`
  min-height: 100vh;
  background: radial-gradient(circle at top right, rgba(203, 255, 56, 0.05), transparent), #FFFFFF;
`;

const heroSection = css`
  position: relative;
  height: 520px;
  width: 100%;
  display: flex;
  align-items: flex-start;
  padding-top: 80px;
  overflow: hidden;
  
  &::after {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(to right, rgba(255,255,255,0.4) 0%, rgba(255,255,255,0.2) 50%, transparent 90%);
    z-index: 1;
  }
`;

const glassCard = css`
  background: white;
  border-radius: 40px;
  box-shadow: 0 50px 100px rgba(0, 0, 0, 0.04);
  border: 1px solid #F1F5F9;
  position: relative;
  overflow: hidden;
`;

export const Blog: React.FC = () => {
    const [selectedCategoryId, setSelectedCategoryId] = useState<string>("All");
    const [searchQuery, setSearchQuery] = useState("");
    const [categories, setCategories] = useState<any[]>([]);
    const [blogPosts, setBlogPosts] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                const [cats, posts] = await Promise.all([
                    publicBlogsAPI.getCategories(),
                    publicBlogsAPI.getPosts()
                ]);
                setCategories(cats.data || []);
                setBlogPosts(posts.data || []);
            } catch (err) {
                console.error("Failed to load blog data", err);
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
        <div className={sectionStyles}>
            {/* Immersive Hero */}
            <div className={heroSection}>
                <div className="absolute inset-0 z-0">
                    <img
                        src={HeroBg}
                        style={{ objectPosition: 'center 70%' }}
                        className="w-full h-full object-cover"
                        alt="Blog Hero"
                    />
                </div>

                <div className="container mx-auto px-8 relative z-10">
                    <div className="max-w-4xl">
                        <div className="flex items-center gap-3 mb-6 text-gray-400 text-[11px] font-black uppercase tracking-[0.2em] italic">
                            <Link to="/" className="text-gray-900 border-b border-gray-900 pb-0.5">HOME</Link>
                            <ChevronRight size={12} className="text-lime-500" />
                            <span className="text-lime-500">ARTICLES & INSIGHTS</span>
                        </div>

                        <h1 className="text-5xl md:text-7xl font-black uppercase italic tracking-tighter leading-none text-gray-900">
                            AESTHETIC <br /> <span className="text-[#CBFF38]">INTELLIGENCE</span>
                        </h1>

                        <p className="text-gray-500 mt-6 font-bold text-lg max-w-lg leading-relaxed italic">
                            Expert treatment guides, clinical science, and beauty philosophy from our leading aesthetic professionals.
                        </p>
                    </div>
                </div>
            </div>

            <main className="max-w-7xl mx-auto px-8 relative z-20 -mt-[170px]">
                <div className="flex flex-col xl:flex-row gap-8">
                    {/* Left Column: Filter by Protocol */}
                    <aside className="xl:w-64 shrink-0">
                        <div className={glassCard}>
                            <div className="p-6">
                                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-6 italic">Protocol</h3>

                                <div className="space-y-2">
                                    <button
                                        onClick={() => setSelectedCategoryId("All")}
                                        className={`w-full text-left px-5 py-3 rounded-xl transition-all text-[10px] font-black uppercase tracking-widest italic flex items-center justify-between group ${selectedCategoryId === "All"
                                            ? 'bg-black text-[#CBFF38] shadow-2xl'
                                            : 'text-gray-400 hover:text-black hover:bg-gray-50'
                                            }`}
                                    >
                                        All Articles
                                        <ChevronRight size={12} className={selectedCategoryId === "All" ? "text-[#CBFF38]" : "opacity-0 group-hover:opacity-100"} />
                                    </button>
                                    {categories.map(cat => (
                                        <button
                                            key={cat.id}
                                            onClick={() => setSelectedCategoryId(cat.id)}
                                            className={`w-full text-left px-5 py-3 rounded-xl transition-all text-[10px] font-black uppercase tracking-widest italic flex items-center justify-between group ${selectedCategoryId === cat.id
                                                ? 'bg-black text-[#CBFF38] shadow-2xl'
                                                : 'text-gray-400 hover:text-black hover:bg-gray-50'
                                                }`}
                                        >
                                            {cat.name}
                                            <ChevronRight size={12} className={selectedCategoryId === cat.id ? "text-[#CBFF38]" : "opacity-0 group-hover:opacity-100"} />
                                        </button>
                                    ))}
                                </div>

                                <div className="mt-8 pt-6 border-t border-gray-50">
                                    <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-4 italic">Search</h4>
                                    <div className="relative">
                                        <input
                                            type="text"
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            placeholder="Keyword..."
                                            className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 outline-none focus:border-[#CBFF38] transition-all font-black text-[10px] uppercase tracking-wider italic text-gray-900 placeholder-gray-300"
                                        />
                                        <Search size={12} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-300 pointer-events-none" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </aside>

                    {/* Middle Column: Content Section */}
                    <div className="flex-1">
                        {isLoading ? (
                            <div className="flex flex-col items-center justify-center py-40 gap-6">
                                <div className="size-16 border-2 border-[#CBFF38] border-t-transparent rounded-full animate-spin" />
                                <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] animate-pulse">Syncing Insights</span>
                            </div>
                        ) : filteredPosts.length === 0 ? (
                            <div className={`${glassCard} py-40 text-center`}>
                                <div className="size-16 rounded-full bg-gray-50 flex items-center justify-center mx-auto mb-6 text-gray-200">
                                    <BookOpen size={32} />
                                </div>
                                <h3 className="text-xl font-black uppercase italic text-gray-900 mb-2">No Matches Found</h3>
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Adjust filters.</p>
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
                                        <Link to={`/blog/${post.slug}`} className={`${glassCard} group block h-full hover:border-[#CBFF38] transition-all`}>
                                            <div className="h-56 overflow-hidden relative">
                                                <img
                                                    src={post.imageUrl || `https://placehold.co/600x400/1A1A1A/CBFF38?text=${encodeURIComponent(post.title.charAt(0))}`}
                                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000"
                                                    alt={post.title}
                                                />
                                                <div className="absolute top-4 left-4 bg-black text-[#CBFF38] px-3 py-1 rounded-full text-[8.5px] font-black uppercase tracking-widest italic">
                                                    {post.category?.name || 'Aesthetics'}
                                                </div>
                                            </div>

                                            <div className="p-8">
                                                <div className="flex items-center gap-4 mb-4">
                                                    <div className="flex items-center gap-1.5 text-[8.5px] font-black text-gray-400 uppercase tracking-widest italic">
                                                        <Clock size={10} className="text-lime-500" />
                                                        {new Date(post.publishedAt || post.createdAt).toLocaleDateString()}
                                                    </div>
                                                </div>

                                                <h3 className="text-xl font-black uppercase italic text-gray-900 mb-5 leading-tight group-hover:text-black line-clamp-2">
                                                    {post.title}
                                                </h3>

                                                <div className="flex items-center justify-between pt-5 border-t border-gray-50">
                                                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 group-hover:text-black transition-colors flex items-center gap-2">
                                                        Read More <ArrowRight size={12} className="group-hover:translate-x-1 transition-transform" />
                                                    </span>
                                                    <Tag size={14} className="text-gray-100 group-hover:text-lime-500 transition-colors" />
                                                </div>
                                            </div>
                                        </Link>
                                    </motion.div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Right Column: Promotion Card */}
                    <aside className="xl:w-64 shrink-0">
                        <div className="bg-black rounded-[32px] p-8 relative overflow-hidden group shadow-2xl h-72 flex flex-col justify-between border border-white/5">
                            <div className="relative z-10">
                                <h4 className="text-lg font-black uppercase italic text-white tracking-tight leading-none mb-3">Discover Top Clinics</h4>
                                <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest leading-relaxed">Find elite aesthetics centers near you.</p>
                            </div>

                            <button className="relative z-10 w-full bg-[#CBFF38] text-black h-12 rounded-xl text-[9px] font-black uppercase tracking-[0.2em] flex items-center justify-center gap-3 active:scale-95 transition-all">
                                Nearby Centers <Search size={14} />
                            </button>

                            <div className="absolute inset-0 opacity-20 group-hover:opacity-30 transition-opacity">
                                <img src="https://images.unsplash.com/photo-1524666041070-9d87656c25bb?q=80&w=640&auto=format&fit=crop" className="w-full h-full object-cover grayscale group-hover:scale-110 transition-transform duration-[2000ms]" alt="Map" />
                            </div>
                        </div>
                    </aside>
                </div>
            </main>
        </div>
    );
};
