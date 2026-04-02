import React, { useState, useEffect } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { publicBlogsAPI } from "@/services/api";
import { css } from "@emotion/css";
import { FaChevronRight, FaArrowLeft, FaCalendar, FaUser, FaTag } from "react-icons/fa6";
import { motion } from "framer-motion";

const articleBody = css`
  font-family: 'Georgia', serif;
  font-size: 1.125rem;
  line-height: 1.9;
  color: #374151;

  h1, h2, h3, h4 {
    font-family: 'Inter', sans-serif;
    font-weight: 900;
    text-transform: uppercase;
    font-style: italic;
    color: #111827;
    margin-top: 2.5rem;
    margin-bottom: 1rem;
    letter-spacing: -0.03em;
  }

  h2 { font-size: 1.75rem; }
  h3 { font-size: 1.375rem; }

  p { margin-bottom: 1.5rem; }

  a {
    color: #1A1A1A;
    font-weight: 700;
    text-decoration: underline;
    text-decoration-color: #CBFF38;
    text-underline-offset: 4px;
  }

  strong { color: #111827; font-weight: 800; }

  blockquote {
    border-left: 4px solid #CBFF38;
    background: #F9FAF9;
    margin: 2rem 0;
    padding: 1.5rem 2rem;
    border-radius: 0 16px 16px 0;
    font-style: italic;
    font-size: 1.2rem;
    color: #374151;
  }

  img {
    border-radius: 24px;
    margin: 2rem 0;
    width: 100%;
    object-fit: cover;
  }

  ul, ol {
    padding-left: 1.5rem;
    margin-bottom: 1.5rem;
  }

  li { margin-bottom: 0.5rem; }

  code {
    background: #F1F5F9;
    padding: 2px 8px;
    border-radius: 6px;
    font-size: 0.9em;
    font-family: monospace;
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

    if (isLoading) {
        return (
            <div className="min-h-screen bg-[#1A1A1A] flex flex-col items-center justify-center gap-4">
                <div className="size-10 border-4 border-[#CBFF38] border-t-transparent rounded-full animate-spin" />
                <p className="text-gray-400 font-black text-[10px] uppercase tracking-widest italic">Loading article...</p>
            </div>
        );
    }

    if (!post) {
        return (
            <div className="min-h-screen bg-[#1A1A1A] flex flex-col items-center justify-center gap-6 text-white p-6">
                <h2 className="text-4xl font-black uppercase italic tracking-tighter">Article Not Found</h2>
                <p className="text-gray-400 max-w-md text-center font-medium">
                    The article you are looking for does not exist or has been removed.
                </p>
                <button
                    onClick={() => navigate('/blog')}
                    className="flex items-center gap-2 bg-[#CBFF38] text-black px-8 h-12 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-lime-400 transition-all"
                >
                    <FaArrowLeft /> Back to Articles
                </button>
            </div>
        );
    }

    const readingTime = Math.max(1, Math.ceil(
        (post.content?.replace(/<[^>]*>?/gm, '').split(/\s+/).length || 0) / 200
    ));

    return (
        <div className="min-h-screen bg-white">
            {/* Reading Progress Bar */}
            <div className="fixed top-0 left-0 right-0 z-50 h-1 bg-gray-100">
                <div
                    className="h-full bg-[#CBFF38] transition-all duration-100"
                    style={{ width: `${scrollProgress}%` }}
                />
            </div>

            {/* Hero Section */}
            <div className="relative bg-[#1A1A1A] text-white overflow-hidden">
                {/* Background Image */}
                <div className="absolute inset-0">
                    <img
                        src={post.imageUrl || `https://placehold.co/1400x700/1A1A1A/CBFF38?text=Article`}
                        alt={post.title}
                        className="w-full h-full object-cover opacity-20"
                    />
                    <div className="absolute inset-0 bg-gradient-to-b from-[#1A1A1A]/60 via-[#1A1A1A]/80 to-[#1A1A1A]" />
                </div>

                <div className="relative z-10 max-w-4xl mx-auto px-6 pt-20 pb-16">
                    {/* Breadcrumb */}
                    <div className="flex items-center gap-3 mb-8 text-[#CBFF38] text-[10px] font-black uppercase tracking-[0.2em] italic">
                        <Link to="/" className="hover:opacity-70 transition-opacity">Home</Link>
                        <FaChevronRight size={9} />
                        <Link to="/blog" className="hover:opacity-70 transition-opacity">Articles</Link>
                        <FaChevronRight size={9} />
                        <span className="text-gray-400 truncate max-w-[200px]">{post.title}</span>
                    </div>

                    {/* Category badge */}
                    {post.category && (
                        <motion.span
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="inline-flex items-center gap-2 bg-[#CBFF38] text-black px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest mb-6"
                        >
                            <FaTag size={9} /> {post.category.name}
                        </motion.span>
                    )}

                    {/* Title */}
                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="text-4xl md:text-6xl font-black uppercase italic tracking-tighter leading-[1.05] mb-8"
                    >
                        {post.title}
                    </motion.h1>

                    {/* Meta */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.2 }}
                        className="flex flex-wrap items-center gap-6 text-[11px] font-black uppercase tracking-widest text-gray-400"
                    >
                        <span className="flex items-center gap-2">
                            <FaCalendar size={11} className="text-[#CBFF38]" />
                            {new Date(post.publishedAt || post.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
                        </span>
                        {post.author && (
                            <span className="flex items-center gap-2">
                                <FaUser size={11} className="text-[#CBFF38]" />
                                {post.author.firstName} {post.author.lastName}
                            </span>
                        )}
                        <span className="text-[#CBFF38]">{readingTime} min read</span>
                    </motion.div>
                </div>
            </div>

            {/* Article Body */}
            <div className="max-w-3xl mx-auto px-6 py-16">
                {/* Hero Image (large) */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="rounded-3xl overflow-hidden mb-14 shadow-xl -mt-8 relative z-10"
                >
                    <img
                        src={post.imageUrl || `https://placehold.co/1200x600/1A1A1A/CBFF38?text=Article`}
                        alt={post.title}
                        className="w-full h-72 md:h-96 object-cover"
                    />
                </motion.div>

                {/* Content */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15 }}
                    className={articleBody}
                    dangerouslySetInnerHTML={{ __html: post.content }}
                />

                {/* Bottom Nav */}
                <div className="mt-16 pt-10 border-t border-gray-100 flex items-center justify-between">
                    <Link
                        to="/blog"
                        className="flex items-center gap-2 text-[11px] font-black uppercase tracking-widest text-gray-400 hover:text-black transition-colors"
                    >
                        <FaArrowLeft /> Back to Articles
                    </Link>
                    <div className="size-10 rounded-2xl bg-black flex items-center justify-center cursor-pointer hover:bg-gray-900 transition-all" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                            <path d="M6 10V2M6 2L2 6M6 2L10 6" stroke="#CBFF38" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                    </div>
                </div>

                {/* Author Card */}
                {post.author && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="mt-12 bg-[#1A1A1A] text-white rounded-3xl p-8 flex items-center gap-6"
                    >
                        <div className="size-16 rounded-2xl bg-[#CBFF38] flex items-center justify-center text-black font-black text-2xl uppercase flex-shrink-0">
                            {post.author.firstName?.charAt(0)}
                        </div>
                        <div>
                            <p className="text-[9px] font-black uppercase tracking-widest text-[#CBFF38] mb-1 italic">Written by</p>
                            <h4 className="text-xl font-black uppercase italic tracking-tighter">{post.author.firstName} {post.author.lastName}</h4>
                            <p className="text-gray-400 text-sm mt-1 font-medium">Aesthetics Professional</p>
                        </div>
                    </motion.div>
                )}
            </div>
        </div>
    );
};
