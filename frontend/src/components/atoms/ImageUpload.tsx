import React, { useState, useRef } from 'react';
import { Upload, X, Image as ImageIcon, Loader2 } from 'lucide-react';
import { uploadAPI } from '@/services/api';

interface ImageUploadProps {
 value?: string;
 onChange: (url: string) => void;
 label?: string;
 className?: string;
}

const ImageUpload: React.FC<ImageUploadProps> = ({ value, onChange, label, className }) => {
 const [isUploading, setIsUploading] = useState(false);
 const [preview, setPreview] = useState<string | null>(value || null);
 const fileInputRef = useRef<HTMLInputElement>(null);

 const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
 const file = e.target.files?.[0];
 if (!file) return;

 // Local preview
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

 const getImageUrl = (path: string) => {
 if (!path) return '';
 if (path.startsWith('http') || path.startsWith('data:')) return path;
 
 const baseUrl = import.meta.env.VITE_API_BASE_URL || '';
 const origin = baseUrl.replace(/\/api$/, '');
 return `${origin}${path.startsWith('/') ? '' : '/'}${path}`;
 };

 const handleRemove = () => {
 setPreview(null);
 onChange('');
 if (fileInputRef.current) {
 fileInputRef.current.value = '';
 }
 };

 return (
 <div className={`space-y-2 ${className}`}>
 {label && <label className="block text-xs font-black uppercase tracking-widest text-gray-400">{label}</label>}
 
 <div className="relative group">
 {preview ? (
 <div className="relative rounded-2xl overflow-hidden border-2 border-gray-100 aspect-video bg-gray-50">
 <img 
 src={getImageUrl(preview)} 
 alt="Preview" 
 className="w-full h-full object-cover"
 />
 <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
 <button
 type="button"
 onClick={() => fileInputRef.current?.click()}
 className="p-2 bg-white rounded-full text-black hover:bg-[#CBFF38] transition-colors"
 >
 <Upload size={16} />
 </button>
 <button
 type="button"
 onClick={handleRemove}
 className="p-2 bg-white rounded-full text-red-500 hover:bg-red-500 hover:text-white transition-colors"
 >
 <X size={16} />
 </button>
 </div>
 {isUploading && (
 <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
 <Loader2 className="text-[#CBFF38] animate-spin" size={24} />
 </div>
 )}
 </div>
 ) : (
 <button
 type="button"
 onClick={() => fileInputRef.current?.click()}
 disabled={isUploading}
 className="w-full aspect-video rounded-2xl border-2 border-dashed border-gray-200 hover:border-[#CBFF38] hover:bg-lime-50/20 transition-all flex flex-col items-center justify-center gap-3 group"
 >
 <div className="size-12 rounded-2xl bg-gray-50 flex items-center justify-center text-gray-400 group-hover:bg-black group-hover:text-[#CBFF38] transition-all">
 {isUploading ? <Loader2 className="animate-spin" /> : <ImageIcon size={24} />}
 </div>
 <div className="text-center">
 <p className="text-[10px] font-black uppercase tracking-widest text-gray-900">Upload Image</p>
 <p className="text-[8px] font-bold text-gray-400 uppercase mt-1">PNG, JPG, WEBP (Max 5MB)</p>
 </div>
 </button>
 )}
 
 <input 
 type="file"
 ref={fileInputRef}
 onChange={handleFileChange}
 accept="image/*"
 className="hidden"
 />
 </div>
 </div>
 );
};

export default ImageUpload;
