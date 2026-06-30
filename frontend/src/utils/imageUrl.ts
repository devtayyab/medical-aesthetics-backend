/**
 * Resolves a stored image path to a fully-qualified URL.
 * - Absolute URLs (http/https) and inline data URIs are returned as-is.
 * - Relative paths are prefixed with the API origin (VITE_API_BASE_URL minus a
 * trailing `/api`).
 *
 * Shared helper — replaces the per-file copies that previously drifted apart.
 */
export const getImageUrl = (path?: string): string => {
 if (!path) return '';
 if (path.startsWith('http') || path.startsWith('data:')) return path;
 const baseUrl = (import.meta as any).env?.VITE_API_BASE_URL || '';
 const origin = baseUrl.replace(/\/api$/, '');
 return `${origin}${path.startsWith('/') ? '' : '/'}${path}`;
};
