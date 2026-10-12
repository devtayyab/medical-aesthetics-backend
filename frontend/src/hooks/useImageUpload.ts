import { useState, useRef } from 'react';
import { uploadAPI } from '@/services/api';
import { getImageUrl } from '@/utils/imageUrl';

export interface UseImageUploadOptions {
  value?: string;
  onChange: (url: string) => void;
}

export const useImageUpload = ({ value, onChange }: UseImageUploadOptions) => {
  const [isUploading, setIsUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(value || null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Generate local preview immediately
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    // Upload to server
    setIsUploading(true);
    try {
      const response = await uploadAPI.uploadImage(file);
      const imageUrl = response.data.url;
      onChange(imageUrl);
    } catch (error) {
      console.error('Upload failed:', error);
      alert('Failed to upload image. Please try again.');
      setPreview(value || null);
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemove = () => {
    setPreview(null);
    onChange('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const triggerSelect = () => {
    fileInputRef.current?.click();
  };

  return {
    isUploading,
    preview,
    fileInputRef,
    handleFileChange,
    handleRemove,
    triggerSelect,
    getImageUrl,
  };
};

export default useImageUpload;
