import { useEffect, useState } from "react";
import { clinicsAPI } from "@/services/api";

export interface PublicTreatment {
    id: string;
    name: string;
    shortDescription?: string;
    fullDescription?: string;
    imageUrl?: string;
    categoryId?: string;
    isFeatured?: boolean;
    fromPrice?: number;
    categoryRef?: { id: string; name: string };
}

export interface PublicCategory {
    id: string;
    name: string;
    description?: string;
    icon?: string;
    parentId?: string | null;
    sortOrder?: number;
    children?: PublicCategory[];
    treatments?: PublicTreatment[];
}

// Session-level cache of in-flight/resolved tree requests, keyed by options, so
// the Header + page components don't each fire their own GET /clinics/categories.
const treeCache = new Map<string, Promise<PublicCategory[]>>();

function fetchTree(withTreatments: boolean): Promise<PublicCategory[]> {
    const key = withTreatments ? "tree+treatments" : "tree";
    if (!treeCache.has(key)) {
        const p = clinicsAPI
            .getCategoryTree(withTreatments)
            .then((res) => (res.data || []) as PublicCategory[])
            .catch((err) => {
                treeCache.delete(key); // allow retry on next mount
                throw err;
            });
        treeCache.set(key, p);
    }
    return treeCache.get(key)!;
}

/**
 * Fetches the public, super-admin-managed two-level category tree
 * (top-level categories each with a nested `children` array of subcategories).
 * Pass `{ withTreatments: true }` to also receive each node's `treatments`.
 * Shared by the home page, header menu and treatments page (deduped via cache).
 */
export function useCategoryTree(options?: { withTreatments?: boolean }) {
    const withTreatments = !!options?.withTreatments;
    const [categories, setCategories] = useState<PublicCategory[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let active = true;
        setLoading(true);
        fetchTree(withTreatments)
            .then((data) => { if (active) setCategories(data); })
            .catch(() => { if (active) setError("Failed to load categories"); })
            .finally(() => { if (active) setLoading(false); });
        return () => { active = false; };
    }, [withTreatments]);

    return { categories, loading, error };
}

/** Fetches the super-admin-curated "Top Treatments". */
export function useTopTreatments(limit = 8) {
    const [treatments, setTreatments] = useState<PublicTreatment[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let active = true;
        clinicsAPI
            .getTopTreatments(limit)
            .then((res) => { if (active) setTreatments(res.data || []); })
            .catch(() => { /* non-fatal: section just renders empty */ })
            .finally(() => { if (active) setLoading(false); });
        return () => { active = false; };
    }, [limit]);

    return { treatments, loading };
}
