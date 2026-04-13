import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { publicBlogsAPI } from "@/services/api";
import { css } from "@emotion/css";
import { FaChevronRight, FaMagnifyingGlass, FaArrowRight } from "react-icons/fa6";
import { motion } from "framer-motion";

const sectionStyles = css`
  min-height: 100vh;
  background: #FDFDFD;
  padding-bottom: 80px;
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

    const featuredPost = filteredPosts[0];
    const restPosts = filteredPosts.slice(1);

    return (
        <div className={sectionStyles}>
            {/* Premium Dark Hero */}
            <div className="bg-[#1A1A1A] text-white pt-12 pb-24 px-6 relative overflow-hidden">
                <div className="max-w-7xl mx-auto relative z-10">
                    {/* Breadcrumb */}
                    <div className="flex items-center gap-4 mb-8 text-[10px] font-black uppercase tracking-[0.2em]">
                        <Link to="/" className="text-[#CBFF38]">Home</Link>
                        <span className="text-gray-600"> &gt; </span>
                        <span className="text-gray-500">Articles</span>
                    </div>

                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
                        <div>
                            <h1 className="text-5xl md:text-6xl font-black uppercase italic tracking-tighter leading-tight mb-4">
                                Articles for <span className="text-[#CBFF38] lowercase">aesthetic</span>
                            </h1>
                            <p className="text-gray-400 font-medium max-w-xl text-sm md:text-base">
                                Articles with tips, treatment guides and beauty science from leading professionals.
                            </p>
                        </div>
                        
                        {/* Search on Right */}
                        <div className="relative w-full md:w-96">
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search articles..."
                                className="w-full bg-[#2A2A2A] border border-white/5 rounded-full pl-12 pr-6 py-4 outline-none focus:border-[#CBFF38]/30 transition-all font-medium text-white placeholder-gray-500 text-sm"
                            />
                            <FaMagnifyingGlass className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
                        </div>
                    </div>
                </div>
                {/* Visual texture */}
                <div className="absolute top-0 right-0 w-1/2 h-full opacity-30 pointer-events-none" style={{ background: 'radial-gradient(circle at 100% 0%, #CBFF38 0%, transparent 60%)', filter: 'blur(100px)' }} />
            </div>

            <main className="max-w-7xl mx-auto px-6 -mt-12 relative z-20">
                <div className="flex flex-col lg:flex-row gap-8">
                    
                    {/* Sidebar Filters */}
                    <aside className="lg:w-64 shrink-0">
                        <div className="bg-white rounded-[32px] p-8 shadow-[0_10px_40px_rgba(0,0,0,0.03)] border border-gray-100">
                            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-6">Filter by Topic</h3>
                            <div className="flex flex-col gap-2">
                                <button
                                    onClick={() => setSelectedCategoryId("All")}
                                    className={`text-left px-5 py-3.5 rounded-2xl transition-all text-sm font-black uppercase tracking-tight ${
                                        selectedCategoryId === "All"
                                            ? 'bg-black text-white shadow-xl translate-x-1'
                                            : 'text-gray-400 hover:text-gray-900 hover:bg-gray-50'
                                    }`}
                                >
                                    All Articles
                                </button>
                                {categories.map(cat => (
                                    <button
                                        key={cat.id}
                                        onClick={() => setSelectedCategoryId(cat.id)}
                                        className={`text-left px-5 py-3.5 rounded-2xl transition-all text-sm font-black uppercase tracking-tight ${
                                            selectedCategoryId === cat.id
                                                ? 'bg-black text-white shadow-xl translate-x-1'
                                                : 'text-gray-400 hover:text-gray-900 hover:bg-gray-50'
                                        }`}
                                    >
                                        {cat.name}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </aside>

                    {/* Content Section */}
                    <div className="flex-1">
                        {isLoading ? (
                            <div className="flex justify-center py-32">
                                <div className="size-12 border-4 border-[#CBFF38] border-t-transparent rounded-full animate-spin" />
                            </div>
                        ) : filteredPosts.length === 0 ? (
                            <div className="bg-white rounded-[32px] p-24 text-center border border-gray-100 italic font-bold text-gray-400 uppercase tracking-widest">
                                No articles in this category.
                            </div>
                        ) : (
                            <div className="space-y-12">
                                {/* Featured & Map Widget Row */}
                                <div className="flex flex-col xl:flex-row gap-6">
                                    {featuredPost && (
                                        <div className="flex-1 bg-white rounded-[40px] overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.05)] border border-gray-50">
                                            <div className="flex flex-col md:flex-row h-full">
                                                <div className="md:w-[45%] h-64 md:h-auto relative">
                                                    <img
                                                        src={featuredPost.imageUrl || `https://placehold.co/800x600/1A1A1A/CBFF38?text=Article`}
                                                        className="w-full h-full object-cover"
                                                        alt={featuredPost.title}
                                                    />
                                                    <span className="absolute top-6 left-6 bg-[#CBFF38] text-black px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest">
                                                        {featuredPost.category?.name || 'Treatment'}
                                                    </span>
                                                </div>
                                                <div className="md:w-[55%] p-10 flex flex-col justify-center">
                                                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-4">Recommended Article</span>
                                                    <h2 className="text-3xl font-black uppercase italic text-[#1A1A1A] leading-[1.1] mb-5">
                                                        {featuredPost.title}
                                                    </h2>
                                                    <p className="text-gray-500 text-sm leading-relaxed mb-8 line-clamp-3">
                                                        {featuredPost.content?.replace(/<[^>]*>?/gm, '').substring(0, 160)}...
                                                    </p>
                                                    <Link 
                                                        to={`/blog/${featuredPost.slug}`}
                                                        className="bg-[#CBFF38] text-black px-8 py-4 rounded-xl text-[11px] font-black uppercase tracking-widest w-fit hover:bg-black hover:text-[#CBFF38] transition-all flex items-center gap-3 active:scale-95"
                                                    >
                                                        Read Article <FaArrowRight size={12} />
                                                    </Link>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Map Widget (matches image) */}
                                    <div className="xl:w-80 shrink-0 bg-[#1A1A1A] rounded-[40px] overflow-hidden shadow-2xl flex flex-col">
                                        <div className="h-48 relative overflow-hidden group">
                                            <img 
                                                src="https://images.unsplash.com/photo-1524666041070-9d87656c25bb?q=80&w=640&auto=format&fit=crop" 
                                                className="w-full h-full object-cover opacity-60 group-hover:scale-110 transition-transform duration-1000" 
                                                alt="Map Preview"
                                            />
                                            <div className="absolute inset-0 bg-gradient-to-t from-[#1A1A1A] to-transparent" />
                                            {/* Floating Rating Badges */}
                                            <div className="absolute top-4 left-4 bg-white px-2 py-1 rounded-lg text-[9px] font-bold text-black flex items-center gap-1 shadow-lg animate-bounce" style={{ animationDelay: '0.2s' }}>★ 5.0</div>
                                            <div className="absolute top-16 right-6 bg-white px-2 py-1 rounded-lg text-[9px] font-bold text-black flex items-center gap-1 shadow-lg animate-bounce" style={{ animationDelay: '0.4s' }}>★ 4.9</div>
                                            <div className="absolute bottom-10 left-12 bg-white px-2 py-1 rounded-lg text-[9px] font-bold text-black flex items-center gap-1 shadow-lg animate-bounce">★ 5.0</div>
                                        </div>
                                        <div className="p-8 flex-1 flex flex-col">
                                            <h4 className="text-white text-lg font-black uppercase italic leading-tight mb-4 tracking-tighter">
                                                Discover the top aesthetics clinics
                                            </h4>
                                            <button className="mt-auto bg-[#CBFF38] text-black px-5 py-3.5 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-white transition-colors">
                                                <FaMagnifyingGlass size={12} />
                                                Find centers near you
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {/* Main Posts Grid */}
                                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 pt-8">
                                    {restPosts.map((post, i) => (
                                        <motion.div
                                            key={post.id}
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: i * 0.05 }}
                                        >
                                            <Link to={`/blog/${post.slug}`} className="group block h-full bg-white rounded-[32px] overflow-hidden border border-gray-50 shadow-[0_10px_30px_rgba(0,0,0,0.02)] hover:shadow-[0_20px_50px_rgba(0,0,0,0.08)] transition-all">
                                                <div className="h-56 overflow-hidden relative">
                                                    <img
                                                        src={post.imageUrl || `https://placehold.co/600x400/1A1A1A/CBFF38?text=${encodeURIComponent(post.title.charAt(0))}`}
                                                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                                                        alt={post.title}
                                                    />
                                                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                                                </div>
                                                <div className="p-7">
                                                    <div className="flex items-center gap-3 mb-4">
                                                        <span className="text-[9px] font-black uppercase tracking-widest bg-gray-50 text-gray-400 px-2.5 py-1 rounded-lg border border-gray-100">{post.category?.name || 'Aesthetics'}</span>
                                                        <span className="text-[9px] font-bold text-gray-300 uppercase tracking-widest">{new Date(post.publishedAt || post.createdAt).toLocaleDateString()}</span>
                                                    </div>
                                                    <h3 className="text-lg font-black uppercase italic text-[#1A1A1A] mb-4 leading-tight group-hover:text-black line-clamp-2">
                                                        {post.title}
                                                    </h3>
                                                    <span className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 group-hover:text-black transition-colors">
                                                        Learn More <FaArrowRight size={8} />
                                                    </span>
                                                </div>
                                            </Link>
                                        </motion.div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
};
