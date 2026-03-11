import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { publicBlogsAPI } from "@/services/api";
import { css } from "@emotion/css";
import LayeredBG from "@/assets/LayeredBg.svg";
import { FaChevronRight } from "react-icons/fa6";
import { FaSearch } from "react-icons/fa";
import { Card } from "@/components/atoms/Card/Card";

const containerStyle = css`
  width: 100%;
  max-width: 1100px;
  margin: 0 auto;
  padding: 0 16px;
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
        <section
            className="relative bg-cover bg-center flex items-center justify-center px-4 py-[60px]"
            style={{
                backgroundImage: `url(${LayeredBG})`,
                backgroundPosition: "center",
                backgroundSize: "cover",
                backgroundRepeat: "no-repeat",
            }}
        >
            <div className={containerStyle}>
                {/* Breadcrumb */}
                <div className="flex items-center text-[#33373F] text-[15px] font-medium mb-1">
                    <Link to="/" className="hover:text-[#405C0B] transition-colors">Home</Link>
                    <span className="px-3">
                        <FaChevronRight size={11} className="pt-[1px] text-[#767676]" />
                    </span>
                    Blog
                </div>

                {/* Header Section */}
                <div className="flex flex-col md:flex-row justify-between items-end gap-6 mb-12">
                    <div className="flex-1">
                        <h2 className="text-[#33373F] text-[35px] font-black italic uppercase leading-tight mb-2">Our <span className="text-lime-700">Medical Blog</span></h2>
                        <p className="text-gray-500 max-w-md">Expert advice, the latest treatments, and beauty tips from leading aesthetics professionals.</p>
                    </div>

                    <div className="size-full md:w-1/3 relative group">
                        <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-lime-600 transition-colors" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search articles..."
                            className="w-full bg-white border border-gray-200 rounded-full pl-12 pr-6 py-3.5 shadow-sm outline-none focus:border-lime-500 transition-all font-medium text-gray-800"
                        />
                    </div>
                </div>

                <div className="flex flex-col lg:flex-row gap-10">
                    {/* Categories Sidebar */}
                    <aside className="lg:w-[250px] shrink-0">
                        <h3 className="text-lg font-bold text-gray-900 mb-4 border-b pb-2">Categories</h3>
                        <ul className="space-y-2 font-medium">
                            <li
                                className={`cursor-pointer px-4 py-2.5 rounded-xl transition-all ${selectedCategoryId === "All" ? 'bg-lime-100 text-lime-900 font-bold border-l-4 border-lime-700' : 'text-gray-500 hover:bg-gray-50'}`}
                                onClick={() => setSelectedCategoryId("All")}
                            >
                                All Articles
                            </li>
                            {categories.map(cat => (
                                <li
                                    key={cat.id}
                                    className={`cursor-pointer px-4 py-2.5 rounded-xl transition-all ${selectedCategoryId === cat.id ? 'bg-lime-100 text-lime-900 font-bold border-l-4 border-lime-700' : 'text-gray-500 hover:bg-gray-50'}`}
                                    onClick={() => setSelectedCategoryId(cat.id)}
                                >
                                    {cat.name}
                                </li>
                            ))}
                        </ul>
                    </aside>

                    {/* Main Content */}
                    <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-8">
                        {isLoading ? (
                            <div className="col-span-2 text-center py-[100px]">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-lime-600 mx-auto"></div>
                            </div>
                        ) : filteredPosts.length > 0 ? (
                            filteredPosts.map((post) => (
                                <Card key={post.id} className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all hover:-translate-y-1 border border-gray-100 flex flex-col group">
                                    <div className="h-52 bg-gray-200 relative overflow-hidden">
                                        <img
                                            src={post.imageUrl || `https://placehold.co/600x400?text=${post.title.replace(/\s/g, '+')}`}
                                            alt={post.title}
                                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                                        />
                                        {post.category && (
                                            <div className="absolute top-4 left-4">
                                                <span className="bg-white/95 backdrop-blur-sm px-3 py-1.5 rounded-lg text-xs font-black text-lime-900 shadow-sm border border-gray-100 uppercase tracking-wider">
                                                    {post.category.name}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                    <div className="p-6 flex flex-col flex-1">
                                        <p className="text-[10px] uppercase font-black tracking-widest text-[#717171] mb-2">
                                            {new Date(post.publishedAt || post.createdAt).toLocaleDateString()}
                                            {post.author ? ` • ${post.author.firstName} ${post.author.lastName}` : ''}
                                        </p>
                                        <h4 className="text-xl font-black text-gray-900 group-hover:text-lime-700 transition-colors mb-4 line-clamp-2">{post.title}</h4>
                                        <p className="text-sm text-gray-500 line-clamp-3 mb-6 flex-1 italic leading-relaxed">
                                            {post.content.replace(/<[^>]*>?/gm, '').substring(0, 150)}...
                                        </p>
                                        <Link to={`/blog/${post.slug}`} className="text-lime-700 font-black text-sm group-hover:translate-x-2 transition-transform inline-flex items-center gap-2 w-fit">
                                            READ MORE <span>→</span>
                                        </Link>
                                    </div>
                                </Card>
                            ))
                        ) : (
                            <div className="col-span-2 text-center py-[100px] border-2 border-dashed border-gray-200 rounded-3xl">
                                <p className="text-gray-500 font-medium italic">No articles found matching your criteria.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </section>
    );
};
