import { api } from '../client';

export const blogService = {
  getCategories: () => api.get('/public/blogs/categories'),
  getPosts: (params?: { search?: string; categoryId?: string }) => api.get('/public/blogs/posts', { params }),
  getPostBySlug: (slug: string) => api.get(`/public/blogs/posts/${encodeURIComponent(slug)}`),
};

export default blogService;
