import React, { useEffect, useState } from 'react';
import { PenTool, Plus, BookOpen, Search, Trash2, Tag as TagIcon, Eye, EyeOff } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import {
    fetchBlogCategories,
    fetchBlogPosts,
    createBlogCategory,
    createBlogPost,
    toggleBlogPostStatus,
    deleteBlogPost,
    fetchUsers
} from '@/store/slices/adminSlice';
import type { AppDispatch, RootState } from '@/store';

export const BlogManagement: React.FC = () => {
    const dispatch = useDispatch<AppDispatch>();
    const { blogCategories, blogPosts, users, isLoading } = useSelector((state: RootState) => state.admin);
    const [searchTerm, setSearchTerm] = useState('');
    const [showCategoryModal, setShowCategoryModal] = useState(false);
    const [showPostModal, setShowPostModal] = useState(false);

    // Forms state
    const [catName, setCatName] = useState('');
    const [postTitle, setPostTitle] = useState('');
    const [postSlug, setPostSlug] = useState('');
    const [postContent, setPostContent] = useState('');
    const [postCategory, setPostCategory] = useState('');
    const [postImageUrl, setPostImageUrl] = useState('');
    const [postAuthorId, setPostAuthorId] = useState('');
    const [postScheduledAt, setPostScheduledAt] = useState('');

    useEffect(() => {
        if (postTitle && !postSlug) {
            setPostSlug(postTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-'));
        }
    }, [postTitle]);

    useEffect(() => {
        dispatch(fetchBlogCategories());
        dispatch(fetchBlogPosts(''));
        if (!users || users.length === 0) {
            dispatch(fetchUsers());
        }
    }, [dispatch, users?.length]);

    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        setSearchTerm(val);
        dispatch(fetchBlogPosts(val));
    };

    const handleSaveCategory = () => {
        if (!catName.trim()) return;
        const slug = catName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
        dispatch(createBlogCategory({ name: catName, slug }));
        setCatName('');
        setShowCategoryModal(false);
    };

    const handleSavePost = () => {
        if (!postTitle.trim() || !postContent.trim() || !postCategory) return;
        const finalSlug = postSlug.trim() || postTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-');

        dispatch(createBlogPost({
            title: postTitle,
            slug: finalSlug,
            content: postContent,
            categoryId: postCategory,
            imageUrl: postImageUrl,
            authorId: postAuthorId,
            scheduledAt: postScheduledAt || null,
            isPublished: false
        }));

        setPostTitle('');
        setPostSlug('');
        setPostContent('');
        setPostCategory('');
        setPostImageUrl('');
        setPostAuthorId('');
        setPostScheduledAt('');
        setShowPostModal(false);
    };

    return (
        <div className="mx-auto max-w-[1400px] px-4 py-8 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Blog & Content</h1>
                    <p className="text-sm text-gray-500 mt-1">Manage blog articles and dynamic app content (categories, FAQs)</p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={() => setShowCategoryModal(true)}
                        className="flex items-center gap-2 border border-gray-300 bg-white text-gray-700 px-4 py-2 font-bold rounded-lg hover:bg-gray-50 transition-colors"
                    >
                        <TagIcon className="w-5 h-5" /> New Category
                    </button>
                    <button
                        onClick={() => setShowPostModal(true)}
                        className="flex items-center gap-2 bg-[#0B1120] text-white px-4 py-2 font-bold rounded-lg hover:bg-gray-800 transition-colors"
                    >
                        <Plus className="w-5 h-5" /> New Article
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow border border-gray-100 overflow-hidden">
                <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                    <div>
                        <h3 className="text-lg font-bold text-gray-800 mb-1">Publications List</h3>
                        <p className="text-sm text-gray-500">Manage all published or draft articles</p>
                    </div>

                    <div className="flex border border-gray-200 rounded-lg overflow-hidden max-w-sm w-full">
                        <div className="bg-gray-50 px-3 flex items-center border-r border-gray-200">
                            <Search className="w-5 h-5 text-gray-400" />
                        </div>
                        <input
                            type="text"
                            placeholder="Search titles or categories..."
                            className="w-full px-4 py-2 outline-none"
                            value={searchTerm}
                            onChange={handleSearch}
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {blogPosts?.map((post) => (
                                <tr key={post.id} className="hover:bg-gray-50 transition-colors group">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center">
                                            <div className="bg-blue-50 text-blue-600 p-2 rounded-lg mr-3">
                                                <BookOpen className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-gray-900">{post.title}</p>
                                                <p className="text-xs text-gray-500">/{post.slug}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className="px-3 py-1 bg-gray-100 text-gray-700 text-xs font-medium rounded-full">
                                            {post.category?.name || 'Uncategorized'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {new Date(post.createdAt).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        {post.isPublished ? (
                                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                                Published
                                            </span>
                                        ) : (
                                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                                                Draft
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <div className="flex items-center justify-end gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                                title="Toggle Visibility"
                                                onClick={() => dispatch(toggleBlogPostStatus(post))}
                                                className="text-gray-400 hover:text-blue-600 transition-colors"
                                            >
                                                {post.isPublished ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                            </button>
                                            <button
                                                title="Delete Post"
                                                onClick={() => dispatch(deleteBlogPost(post.id))}
                                                className="text-gray-400 hover:text-red-600 transition-colors"
                                            >
                                                <Trash2 className="w-5 h-5" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}

                            {(!blogPosts || blogPosts.length === 0) && !isLoading && (
                                <tr>
                                    <td colSpan={5} className="py-20 text-center">
                                        <div className="flex flex-col items-center justify-center text-gray-400">
                                            <PenTool className="w-12 h-12 mb-4 opacity-50 text-gray-300" />
                                            <h3 className="text-lg font-bold text-gray-800 mb-1">Content List Empty</h3>
                                            <p className="text-sm">No dynamic articles are currently created.</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Category Modal */}
            {showCategoryModal && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl shadow-xl max-w-sm w-full p-6">
                        <h3 className="text-lg font-bold text-gray-900 mb-4">New Category</h3>
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Category Name</label>
                            <input
                                type="text"
                                className="w-full border border-gray-300 rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="e.g. Fillers, Skincare..."
                                value={catName}
                                onChange={(e) => setCatName(e.target.value)}
                            />
                        </div>
                        <div className="flex justify-end gap-3 mt-6">
                            <button onClick={() => setShowCategoryModal(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">Cancel</button>
                            <button onClick={handleSaveCategory} className="px-4 py-2 bg-[#0B1120] text-white rounded-lg hover:bg-gray-800 transition-colors">Save</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Post Modal */}
            {showPostModal && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
                        <h3 className="text-lg font-bold text-gray-900 mb-4">New Article</h3>
                        <div className="grid grid-cols-2 gap-4 mb-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                                <input
                                    type="text"
                                    className="w-full border border-gray-300 rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="Article title..."
                                    value={postTitle}
                                    onChange={(e) => setPostTitle(e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Slug URL</label>
                                <input
                                    type="text"
                                    className="w-full border border-gray-300 rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                                    placeholder="your-custom-slug"
                                    value={postSlug}
                                    onChange={(e) => setPostSlug(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 mb-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                                <select
                                    className="w-full border border-gray-300 rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-blue-500"
                                    value={postCategory}
                                    onChange={(e) => setPostCategory(e.target.value)}
                                >
                                    {(!blogCategories || blogCategories.length === 0) ? (
                                        <option value="" disabled>No categories found - Create one first!</option>
                                    ) : (
                                        <>
                                            <option value="">Select a category</option>
                                            {blogCategories.map((c: any) => (
                                                <option key={c.id} value={c.id}>{c.name}</option>
                                            ))}
                                        </>
                                    )}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Author</label>
                                <select
                                    className="w-full border border-gray-300 rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-blue-500"
                                    value={postAuthorId}
                                    onChange={(e) => setPostAuthorId(e.target.value)}
                                >
                                    <option value="">Select an Author</option>
                                    {users?.map((u: any) => (
                                        <option key={u.id} value={u.id}>{u.firstName} {u.lastName}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 mb-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Cover Image URL</label>
                                <input
                                    type="url"
                                    className="w-full border border-gray-300 rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="https://example.com/image.jpg"
                                    value={postImageUrl}
                                    onChange={(e) => setPostImageUrl(e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Schedule Publication (Optional)</label>
                                <input
                                    type="datetime-local"
                                    className="w-full border border-gray-300 rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-blue-500"
                                    value={postScheduledAt}
                                    onChange={(e) => setPostScheduledAt(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Content (Markdown / HTML)</label>
                            <textarea
                                rows={8}
                                className="w-full border border-gray-300 rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm leading-relaxed"
                                placeholder="Write the content here..."
                                value={postContent}
                                onChange={(e) => setPostContent(e.target.value)}
                            />
                        </div>
                        <div className="flex justify-end gap-3 mt-6">
                            <button onClick={() => setShowPostModal(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">Cancel</button>
                            <button onClick={handleSavePost} disabled={!postTitle || !postCategory || !postContent} className="px-4 py-2 bg-[#CBFF38] text-[#0B1120] font-bold rounded-lg hover:bg-[#A3D900] transition-colors disabled:opacity-50">Save as Draft</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
