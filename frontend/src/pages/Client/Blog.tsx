import React, { useState } from "react";
import { Link } from "react-router-dom";
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

const categories = ["Dermatology", "Aesthetics", "Anti-Aging", "Beauty Tips", "Skincare", "Surgery"];

const blogPosts = [
    { id: "1", title: "Top 5 Benefits of Botox Treatments", date: "2024-03-01", category: "Dermatology", author: "Dr. Smith", summary: "Learn about the most common and surprising benefits of Botox treatments, from aesthetics to medical applications.", image: "https://placehold.co/600x400?text=Botox+Benefits" },
    { id: "2", title: "Skincare Routine for Sensitive Skin", date: "2024-02-15", category: "Skincare", author: "Aesthetics Nurse Jane", summary: "Discover a gentle yet effective skincare routine specifically designed for individuals with sensitive skin.", image: "https://placehold.co/600x400?text=Skincare+Tips" },
    { id: "3", title: "What to Expect During Your Lip Filler Appointment", date: "2024-01-20", category: "Surgery", author: "Dr. Lee", summary: "A comprehensive guide on what happens during a lip filler session, from consultation to post-treatment care.", image: "https://placehold.co/600x400?text=Lip+Fillers" },
    { id: "4", title: "Anti-Aging Strategies for Your 30s", date: "2024-01-05", category: "Anti-Aging", author: "Dr. Maria", summary: "Explore proactive steps you can take in your 30s to maintain a youthful appearance and prevent early signs of aging.", image: "https://placehold.co/600x400?text=Anti-Aging" },
];

export const Blog: React.FC = () => {
    const [selectedCategory, setSelectedCategory] = useState<string>("All");
    const [searchQuery, setSearchQuery] = useState("");

    const filteredPosts = blogPosts.filter(post =>
        (selectedCategory === "All" || post.category === selectedCategory) &&
        (post.title.toLowerCase().includes(searchQuery.toLowerCase()) || post.summary.toLowerCase().includes(searchQuery.toLowerCase()))
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
                                className={`cursor-pointer px-4 py-2.5 rounded-xl transition-all ${selectedCategory === "All" ? 'bg-lime-100 text-lime-900 font-bold border-l-4 border-lime-700' : 'text-gray-500 hover:bg-gray-50'}`}
                                onClick={() => setSelectedCategory("All")}
                            >
                                All Articles
                            </li>
                            {categories.map(cat => (
                                <li
                                    key={cat}
                                    className={`cursor-pointer px-4 py-2.5 rounded-xl transition-all ${selectedCategory === cat ? 'bg-lime-100 text-lime-900 font-bold border-l-4 border-lime-700' : 'text-gray-500 hover:bg-gray-50'}`}
                                    onClick={() => setSelectedCategory(cat)}
                                >
                                    {cat}
                                </li>
                            ))}
                        </ul>
                    </aside>

                    {/* Main Content */}
                    <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-8">
                        {filteredPosts.length > 0 ? (
                            filteredPosts.map((post) => (
                                <Card key={post.id} className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all hover:-translate-y-1 border border-gray-100 flex flex-col group">
                                    <div className="h-52 bg-gray-200 relative overflow-hidden">
                                        <img
                                            src={post.image}
                                            alt={post.title}
                                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                                        />
                                        <div className="absolute top-4 left-4">
                                            <span className="bg-white/95 backdrop-blur-sm px-3 py-1.5 rounded-lg text-xs font-black text-lime-900 shadow-sm border border-gray-100 uppercase tracking-wider">
                                                {post.category}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="p-6 flex flex-col flex-1">
                                        <p className="text-[10px] uppercase font-black tracking-widest text-[#717171] mb-2">{post.date} • {post.author}</p>
                                        <h4 className="text-xl font-black text-gray-900 group-hover:text-lime-700 transition-colors mb-4 line-clamp-2">{post.title}</h4>
                                        <p className="text-sm text-gray-500 line-clamp-3 mb-6 flex-1 italic leading-relaxed">{post.summary}</p>
                                        <button className="text-lime-700 font-black text-sm group-hover:translate-x-2 transition-transform inline-flex items-center gap-2">
                                            READ MORE <span>→</span>
                                        </button>
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
