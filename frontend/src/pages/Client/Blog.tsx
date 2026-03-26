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
            {/* Dark Hero Header */}
            <div className="bg-[#1A1A1A] text-white pt-16 pb-28 px-6 relative overflow-hidden">
                <div className="max-w-6xl mx-auto relative z-10">
                    <div className="flex items-center gap-4 mb-4 text-[#CBFF38] text-[10px] font-black uppercase tracking-[0.2em] italic">
                        <Link to="/" className="hover:opacity-80 transition-opacity">Home</Link>
                        <FaChevronRight size={10} />
                        <span>Journal</span>
                    </div>
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                        <div>
                            <h1 className="text-4xl md:text-6xl font-black uppercase italic tracking-tighter leading-tight">
                                Aesthetics<br/>
                                <span className="text-[#CBFF38]">Journal</span>
                            </h1>
                            <p className="text-gray-400 mt-3 font-medium max-w-lg">
                                Expert insights, treatment guides, and beauty science from leading aesthetic professionals.
                            </p>
                        </div>
                        {/* Search */}
                        <div className="relative w-full md:w-80 group">
                            <FaMagnifyingGlass className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#CBFF38] transition-colors" size={14} />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search articles..."
                                className="w-full bg-white/5 border border-white/10 rounded-2xl pl-11 pr-5 py-3.5 outline-none focus:border-[#CBFF38]/50 transition-all font-bold text-white placeholder-gray-500 text-sm"
                            />
                        </div>
                    </div>
                </div>
                <div className="absolute top-0 right-0 w-1/3 h-full bg-gradient-to-l from-[#CBFF38]/10 to-transparent pointer-events-none" />
            </div>

            <div className="max-w-6xl mx-auto px-6 -mt-10 relative z-20">
                <div className="flex flex-col lg:flex-row gap-8">

                    {/* Categories Sidebar */}
                    <aside className="lg:w-60 shrink-0">
                        <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm sticky top-6">
                            <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-5 italic">Filter by Topic</h3>
                            <ul className="space-y-1">
                                <li
                                    onClick={() => setSelectedCategoryId("All")}
                                    className={`cursor-pointer px-4 py-3 rounded-xl transition-all text-sm font-black uppercase tracking-tight ${
                                        selectedCategoryId === "All"
                                            ? 'bg-black text-[#CBFF38]'
                                            : 'text-gray-400 hover:text-gray-900 hover:bg-gray-50'
                                    }`}
                                >
                                    All Articles
                                </li>
                                {categories.map(cat => (
                                    <li
                                        key={cat.id}
                                        onClick={() => setSelectedCategoryId(cat.id)}
                                        className={`cursor-pointer px-4 py-3 rounded-xl transition-all text-sm font-black uppercase tracking-tight ${
                                            selectedCategoryId === cat.id
                                                ? 'bg-black text-[#CBFF38]'
                                                : 'text-gray-400 hover:text-gray-900 hover:bg-gray-50'
                                        }`}
                                    >
                                        {cat.name}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </aside>

                    {/* Main Content */}
                    <div className="flex-1 min-w-0">
                        {isLoading ? (
                            <div className="flex flex-col items-center py-24 gap-4">
                                <div className="size-10 border-4 border-black border-t-transparent rounded-full animate-spin" />
                                <p className="text-gray-400 font-bold text-[10px] uppercase tracking-widest italic">Loading articles...</p>
                            </div>
                        ) : filteredPosts.length === 0 ? (
                            <div className="text-center py-24 bg-white border border-gray-100 rounded-3xl">
                                <p className="text-gray-400 font-bold uppercase italic tracking-widest">No articles found.</p>
                            </div>
                        ) : (
                            <>
                                {/* Featured Post */}
                                {featuredPost && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="mb-8 group"
                                    >
                                        <Link to={`/blog/${featuredPost.slug}`} className="block bg-white border border-gray-100 rounded-3xl overflow-hidden shadow-sm hover:shadow-lg transition-all">
                                            <div className="md:flex">
                                                <div className="md:w-1/2 h-64 md:h-auto relative overflow-hidden">
                                                    <img
                                                        src={featuredPost.imageUrl || `https://placehold.co/800x500/1A1A1A/CBFF38?text=Featured`}
                                                        alt={featuredPost.title}
                                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                                                    />
                                                    {featuredPost.category && (
                                                        <span className="absolute top-4 left-4 bg-[#CBFF38] text-black px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest">
                                                            {featuredPost.category.name}
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="md:w-1/2 p-8 flex flex-col justify-center">
                                                    <span className="text-[9px] font-black uppercase tracking-widest text-gray-400 mb-3 italic">Featured Article</span>
                                                    <h2 className="text-2xl font-black uppercase italic text-gray-900 leading-tight mb-4 group-hover:text-black">
                                                        {featuredPost.title}
                                                    </h2>
                                                    <p className="text-sm text-gray-500 leading-relaxed mb-6 line-clamp-3">
                                                        {featuredPost.content?.replace(/<[^>]*>?/gm, '').substring(0, 180)}...
                                                    </p>
                                                    <span className="flex items-center gap-2 text-black font-black text-[11px] uppercase tracking-widest">
                                                        Read Article <FaArrowRight size={10} />
                                                    </span>
                                                </div>
                                            </div>
                                        </Link>
                                    </motion.div>
                                )}

                                {/* Grid of remaining posts */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {restPosts.map((post, i) => (
                                        <motion.div
                                            key={post.id}
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: i * 0.06 }}
                                            className="group"
                                        >
                                            <Link to={`/blog/${post.slug}`} className="block bg-white border border-gray-100 rounded-3xl overflow-hidden shadow-sm hover:shadow-lg transition-all h-full flex flex-col">
                                                <div className="h-48 relative overflow-hidden">
                                                    <img
                                                        src={post.imageUrl || `https://placehold.co/600x400/1A1A1A/CBFF38?text=${encodeURIComponent(post.title.charAt(0))}`}
                                                        alt={post.title}
                                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                                                    />
                                                    {post.category && (
                                                        <span className="absolute top-3 left-3 bg-white/95 backdrop-blur-sm px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest text-gray-900 border border-gray-100">
                                                            {post.category.name}
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="p-6 flex flex-col flex-1">
                                                    <p className="text-[9px] uppercase font-black tracking-widest text-gray-400 mb-2 italic">
                                                        {new Date(post.publishedAt || post.createdAt).toLocaleDateString()}
                                                        {post.author ? ` · ${post.author.firstName} ${post.author.lastName}` : ''}
                                                    </p>
                                                    <h4 className="text-lg font-black uppercase italic text-gray-900 group-hover:text-black transition-colors mb-3 line-clamp-2 flex-1">{post.title}</h4>
                                                    <span className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-gray-400 group-hover:text-black transition-colors mt-auto">
                                                        Read Article <FaArrowRight size={8} />
                                                    </span>
                                                </div>
                                            </Link>
                                        </motion.div>
                                    ))}
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
