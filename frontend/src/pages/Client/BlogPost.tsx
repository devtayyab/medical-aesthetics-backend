import React, { useState, useEffect } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { publicBlogsAPI } from "@/services/api";
import { css } from "@emotion/css";
import LayeredBG from "@/assets/LayeredBg.svg";
import { FaChevronRight, FaArrowLeft } from "react-icons/fa6";

const containerStyle = css`
  width: 100%;
  max-width: 800px;
  margin: 0 auto;
  padding: 0 16px;
`;

export const BlogPost: React.FC = () => {
    const { slug } = useParams<{ slug: string }>();
    const navigate = useNavigate();
    const [post, setPost] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);

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

    if (isLoading) {
        return (
            <div className="flex justify-center items-center py-40">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-lime-600"></div>
            </div>
        );
    }

    if (!post) {
        return (
            <div className="flex flex-col flex-1 justify-center items-center py-40">
                <h2 className="text-3xl font-black text-gray-900 mb-4">Post Not Found</h2>
                <p className="text-gray-500 mb-8 max-w-md text-center">
                    The article you are looking for does not exist or has been removed.
                </p>
                <button
                    onClick={() => navigate('/blog')}
                    className="flex items-center justify-center gap-2 bg-[#CBFF38] text-[#0B1120] px-8 h-12 rounded-xl hover:bg-lime-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-lime-500 font-black uppercase text-xs tracking-widest shadow-lg shadow-lime-100 transition-all text-center"
                >
                    <FaArrowLeft /> Back to Blog
                </button>
            </div>
        );
    }

    return (
        <section
            className="relative bg-cover bg-center flex flex-col items-center justify-start py-[60px]"
            style={{
                backgroundImage: `url(${LayeredBG})`,
                backgroundPosition: "center",
                backgroundSize: "cover",
                backgroundRepeat: "no-repeat",
                minHeight: '100vh'
            }}
        >
            <div className={containerStyle}>
                {/* Breadcrumb */}
                <div className="flex items-center text-[#33373F] text-[15px] font-medium mb-6">
                    <Link to="/" className="hover:text-[#405C0B] transition-colors">Home</Link>
                    <span className="px-3"><FaChevronRight size={11} className="pt-[1px] text-[#767676]" /></span>
                    <Link to="/blog" className="hover:text-[#405C0B] transition-colors">Blog</Link>
                    <span className="px-3"><FaChevronRight size={11} className="pt-[1px] text-[#767676]" /></span>
                    <span className="truncate max-w-[200px] sm:max-w-xs">{post.title}</span>
                </div>

                {/* Hero Image */}
                <div className="w-full h-[300px] sm:h-[400px] rounded-3xl overflow-hidden mb-8 shadow-sm">
                    <img
                        src={post.imageUrl || `https://placehold.co/1200x600?text=${post.title.replace(/\s/g, '+')}`}
                        alt={post.title}
                        className="w-full h-full object-cover"
                    />
                </div>

                {/* Content Header */}
                <div className="mb-10 text-center">
                    {post.category && (
                        <span className="inline-block bg-lime-100 text-lime-900 px-4 py-1 rounded-full text-xs font-black uppercase tracking-widest mb-4">
                            {post.category.name}
                        </span>
                    )}
                    <h1 className="text-4xl sm:text-5xl font-black text-gray-900 leading-tight mb-6">
                        {post.title}
                    </h1>
                    <div className="flex items-center justify-center gap-4 text-sm font-bold text-gray-500 uppercase tracking-wider">
                        <span>{new Date(post.publishedAt || post.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                        {post.author && (
                            <>
                                <span>•</span>
                                <span>{post.author.firstName} {post.author.lastName}</span>
                            </>
                        )}
                    </div>
                </div>

                {/* Markdown Content Block */}
                <div 
                    className="prose prose-lg prose-lime max-w-none prose-headings:font-black prose-headings:text-gray-900 prose-a:text-lime-700 prose-img:rounded-3xl bg-white p-8 sm:p-12 rounded-3xl shadow-sm border border-gray-100"
                    dangerouslySetInnerHTML={{ __html: post.content }}
                />
            </div>
        </section>
    );
};
