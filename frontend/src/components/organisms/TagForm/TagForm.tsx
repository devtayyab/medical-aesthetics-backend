import React, { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { Tag, CheckCircle, AlertCircle } from 'lucide-react';
import { Button } from '@/components/atoms/Button/Button';
import { Select } from '@/components/atoms/Select/Select';
import { Textarea } from '@/components/atoms/Textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/molecules/Card/Card';
import { addCustomerTag, getCustomerRecord } from '@/store/slices/crmSlice';
import type { AppDispatch } from '@/store';
import { api } from '@/services/api';

interface TagFormProps {
    customerId: string;
    onSuccess?: () => void;
}

export const TagForm: React.FC<TagFormProps> = ({
    customerId,
    onSuccess
}) => {
    const dispatch = useDispatch<AppDispatch>();
    const [tags, setTags] = useState<{ value: string; label: string }[]>([]);
    const [selectedTagId, setSelectedTagId] = useState('');
    const [notes, setNotes] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchTags = async () => {
            try {
                const { data } = await api.get('/admin/tags');
                const activeTags = (Array.isArray(data) ? data : []).map((t: any) => ({
                    value: t.id,
                    label: t.name
                }));
                setTags(activeTags);
            } catch (e) {
                console.error('Failed to fetch tags', e);
                // Fallback or handle error
            }
        };
        fetchTags();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedTagId) return;

        setIsLoading(true);
        setError(null);
        try {
            await dispatch(addCustomerTag({
                customerId,
                tagId: selectedTagId,
                notes
            })).unwrap();

            setSelectedTagId('');
            setNotes('');
            onSuccess?.();
            dispatch(getCustomerRecord(customerId));
        } catch (err: any) {
            setError(err.message || 'Failed to add tag');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Card className="border-l-4 border-l-blue-400">
            <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                    <Tag className="w-4 h-4 text-blue-500" />
                    Add Tag to Customer
                </CardTitle>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Select
                            label="Select Tag"
                            placeholder="Choose a category/tag"
                            options={tags}
                            value={selectedTagId}
                            onChange={(value) => setSelectedTagId(value)}
                            required
                        />
                        <div className="flex items-end pb-1">
                            <p className="text-xs text-gray-500 italic">Tags help categorize customers for follow-ups and marketing.</p>
                        </div>
                    </div>

                    <Textarea
                        label="Internal Notes"
                        placeholder="Why are you adding this tag?"
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        rows={2}
                    />

                    {error && (
                        <div className="flex items-center gap-2 text-xs text-red-600 bg-red-50 p-2 rounded">
                            <AlertCircle className="w-3 h-3" />
                            {error}
                        </div>
                    )}

                    <div className="flex justify-end">
                        <Button
                            type="submit"
                            variant="primary"
                            size="sm"
                            disabled={isLoading || !selectedTagId}
                        >
                            <CheckCircle className="w-4 h-4 mr-2" />
                            {isLoading ? 'Saving...' : 'Associate Tag'}
                        </Button>
                    </div>
                </form>
            </CardContent>
        </Card>
    );
};
