import { useState, useRef } from 'react';
import { Upload, X, Image as ImageIcon, Loader2, RefreshCw } from 'lucide-react';
import { useLingui } from '@lingui/react';

interface ImageUploaderProps {
  images: string[];
  onChange: (images: string[]) => void;
  maxImages?: number;
  cloudinaryConfig: {
    cloudName: string;
    uploadPreset: string;
  };
}

export default function ImageUploader({
  images,
  onChange,
  maxImages = 5,
  cloudinaryConfig,
}: ImageUploaderProps) {
  const { _ } = useLingui();
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [replaceIndex, setReplaceIndex] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const replaceInputRef = useRef<HTMLInputElement>(null);

  const uploadToCloudinary = async (file: File): Promise<string | null> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', cloudinaryConfig.uploadPreset);

    try {
      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudinaryConfig.cloudName}/image/upload`,
        {
          method: 'POST',
          body: formData,
        }
      );

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const data = await response.json();
      return data.secure_url;
    } catch (error) {
      console.error('Failed to upload image:', error);
      return null;
    }
  };

  const handleFiles = async (files: FileList | File[]) => {
    const fileArray = Array.from(files);
    const remainingSlots = maxImages - images.length;
    const filesToUpload = fileArray.slice(0, remainingSlots);

    if (filesToUpload.length === 0) {
      alert(_("imageUploader.maxImages", { count: maxImages }));
      return;
    }

    setUploading(true);

    const uploadPromises = filesToUpload.map((file) => uploadToCloudinary(file));
    const results = await Promise.all(uploadPromises);
    const successfulUploads = results.filter((url): url is string => url !== null);

    if (successfulUploads.length > 0) {
      onChange([...images, ...successfulUploads]);
    }

    setUploading(false);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(e.target.files);
    }
  };

  const removeImage = (index: number) => {
    const newImages = images.filter((_, i) => i !== index);
    onChange(newImages);
  };

  const moveImage = (from: number, to: number) => {
    const newImages = [...images];
    const [removed] = newImages.splice(from, 1);
    newImages.splice(to, 0, removed);
    onChange(newImages);
  };

  const handleReplaceImage = async (file: File, index: number) => {
    setUploading(true);
    const url = await uploadToCloudinary(file);
    if (url) {
      const newImages = [...images];
      newImages[index] = url;
      onChange(newImages);
    }
    setUploading(false);
    setReplaceIndex(null);
  };

  const handleReplaceInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0 && replaceIndex !== null) {
      handleReplaceImage(e.target.files[0], replaceIndex);
    }
    // Reset input value to allow selecting the same file again
    e.target.value = '';
  };

  const triggerReplace = (index: number) => {
    setReplaceIndex(index);
    replaceInputRef.current?.click();
  };

  return (
    <div className="space-y-4">
      {/* Hidden input for replacing images */}
      <input
        ref={replaceInputRef}
        type="file"
        accept="image/*"
        onChange={handleReplaceInputChange}
        className="hidden"
      />

      {/* Upload Area */}
      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
          dragActive
            ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
            : 'border-slate-300 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-600 bg-slate-50 dark:bg-black'
        } ${uploading ? 'pointer-events-none opacity-60' : ''}`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleInputChange}
          className="hidden"
        />

        {uploading ? (
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="w-8 h-8 text-green-500 animate-spin" />
            <span className="text-sm text-slate-600 dark:text-slate-400">{_("imageUploader.uploading")}</span>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <Upload className="w-8 h-8 text-slate-400 dark:text-slate-500" />
            <div className="text-sm text-slate-600 dark:text-slate-400">
              <span className="font-medium text-green-600 dark:text-green-400">{_("imageUploader.clickToUpload")}</span>
              {' '}{_("imageUploader.orDragDrop")}
            </div>
            <span className="text-xs text-slate-500 dark:text-slate-500">
              {_("imageUploader.fileTypes")} ({images.length}/{maxImages})
            </span>
          </div>
        )}
      </div>

      {/* Image Preview Grid */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {images.map((url, index) => (
            <div
              key={url}
              className="relative group rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
            >
              {/* Image container */}
              <div className="aspect-video relative">
                <img
                  src={url}
                  alt={`Cover ${index + 1}`}
                  className="w-full h-full object-cover"
                />
                
                {/* First image badge */}
                {index === 0 && (
                  <span className="absolute top-2 left-2 bg-green-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
                    {_("imageUploader.cover")}
                  </span>
                )}

                {/* Desktop hover actions overlay */}
                <div className="hidden sm:flex absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity items-center justify-center gap-2">
                  {index > 0 && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        moveImage(index, index - 1);
                      }}
                      className="p-1.5 bg-white/90 rounded-full text-slate-700 hover:bg-white transition-colors"
                      title={_("imageUploader.moveLeft")}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      triggerReplace(index);
                    }}
                    className="p-1.5 bg-blue-500 rounded-full text-white hover:bg-blue-600 transition-colors"
                    title={_("imageUploader.replace")}
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>
                  {index < images.length - 1 && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        moveImage(index, index + 1);
                      }}
                      className="p-1.5 bg-white/90 rounded-full text-slate-700 hover:bg-white transition-colors"
                      title={_("imageUploader.moveRight")}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeImage(index);
                    }}
                    className="p-1.5 bg-red-500 rounded-full text-white hover:bg-red-600 transition-colors"
                    title={_("imageUploader.remove")}
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Mobile action buttons - always visible */}
              <div className="flex sm:hidden items-center justify-center gap-1 p-1.5 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-700">
                {index > 0 && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      moveImage(index, index - 1);
                    }}
                    className="p-1.5 rounded-md bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 active:bg-slate-300 dark:active:bg-slate-600"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                )}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    triggerReplace(index);
                  }}
                  className="p-1.5 rounded-md bg-blue-500 text-white active:bg-blue-600"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>
                {index < images.length - 1 && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      moveImage(index, index + 1);
                    }}
                    className="p-1.5 rounded-md bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 active:bg-slate-300 dark:active:bg-slate-600"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                )}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeImage(index);
                  }}
                  className="p-1.5 rounded-md bg-red-500 text-white active:bg-red-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}

          {/* Add more placeholder */}
          {images.length < maxImages && (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="aspect-video rounded-lg border-2 border-dashed border-slate-300 dark:border-slate-700 flex flex-col items-center justify-center cursor-pointer hover:border-slate-400 dark:hover:border-slate-600 transition-colors bg-slate-50 dark:bg-slate-900"
            >
              <ImageIcon className="w-6 h-6 text-slate-400 dark:text-slate-500 mb-1" />
              <span className="text-xs text-slate-500 dark:text-slate-400">{_("imageUploader.addMore")}</span>
            </div>
          )}
        </div>
      )}

      {/* Help text */}
      <p className="text-xs text-slate-500 dark:text-slate-400">
        {_("imageUploader.helpText")}
      </p>
    </div>
  );
}

