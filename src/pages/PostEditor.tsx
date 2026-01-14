import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../lib/api';
import { ArrowLeft, Save } from 'lucide-react';
import RichTextEditor from '../components/RichTextEditor';
import ImageUploader from '../components/ImageUploader';

interface PostFormData {
  title: string;
  content: string;
  published: boolean;
}

// Cloudinary configuration - use unsigned upload preset
const CLOUDINARY_CONFIG = {
  cloudName: import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || 'difjqmokp',
  uploadPreset: import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || 'unsigned_preset',
};

export default function PostEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { register, handleSubmit, setValue, formState: { errors } } = useForm<PostFormData>({
    mode: 'onChange',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [content, setContent] = useState('');
  const [contentError, setContentError] = useState('');
  const [coverUrls, setCoverUrls] = useState<string[]>([]);
  const isEditMode = !!id;

  useEffect(() => {
    if (isEditMode) {
      api.get(`/posts/${id}`).then((res) => {
        const { title, content, published, coverUrls: existingCovers } = res.data;
        setValue('title', title);
        setContent(content || '');
        setValue('content', content || '');
        setValue('published', published);
        setCoverUrls(existingCovers || []);
      }).catch(() => {
        alert('Failed to load post');
        navigate('/dashboard/my');
      });
    }
  }, [id, isEditMode, navigate, setValue]);

  const onSubmit = async (data: PostFormData) => {
    // Validate content
    const htmlContent = content || data.content || '';
    // Remove HTML tags and check if there's actual text content
    const textContent = htmlContent.replace(/<[^>]*>/g, '').trim();
    
    if (!textContent) {
      setContentError('Content is required');
      return;
    }
    
    setContentError('');
    setIsLoading(true);
    try {
      const postData = {
        ...data,
        content: htmlContent,
        // Only include coverUrls if user has uploaded images
        ...(coverUrls.length > 0 ? { coverUrls } : {}),
      };
      if (isEditMode) {
        await api.patch(`/posts/${id}`, postData);
      } else {
        await api.post('/posts', postData);
      }
      navigate('/dashboard/my');
    } catch (err) {
      alert('Failed to save post');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-4 sm:mb-8 flex items-center gap-2 sm:gap-4">
        <button
          onClick={() => navigate(-1)}
          className="p-2 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 transition-colors"
        >
          <ArrowLeft size={20} className="sm:w-6 sm:h-6" />
        </button>
        <h1 className="text-lg sm:text-2xl font-bold text-slate-900 dark:text-white">
          {isEditMode ? 'Edit Post' : 'Create New Post'}
        </h1>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="bg-white dark:bg-[#161616] rounded-xl sm:rounded-2xl border border-slate-200 dark:border-slate-800 p-4 sm:p-8 space-y-4 sm:space-y-6">
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
            Title <span className="text-red-500">*</span>
          </label>
          <input
            {...register('title', { 
              required: 'Title is required',
              minLength: {
                value: 1,
                message: 'Title cannot be empty'
              }
            })}
            type="text"
            className={`w-full bg-slate-50 dark:bg-black border rounded-xl px-4 py-3 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:ring-2 focus:ring-black dark:ring-slate-800 focus:border-transparent outline-none transition-all ${
              errors.title 
                ? 'border-red-500 dark:border-red-500' 
                : 'border-slate-200 dark:border-slate-800'
            }`}
            placeholder="Enter post title"
          />
          {errors.title && (
            <p className="mt-1 text-sm text-red-500">{errors.title.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
            Content <span className="text-red-500">*</span>
          </label>
          <div className={contentError ? 'border border-red-500 dark:border-red-500 rounded-xl' : ''}>
            <RichTextEditor
              content={content}
              onChange={(html) => {
                setContent(html);
                setValue('content', html);
                // Clear error when user starts typing
                if (contentError) {
                  const textContent = html.replace(/<[^>]*>/g, '').trim();
                  if (textContent) {
                    setContentError('');
                  }
                }
              }}
              placeholder="Write your content here..."
            />
          </div>
          {contentError && (
            <p className="mt-1 text-sm text-red-500">{contentError}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
            Cover Images (Optional)
          </label>
          <ImageUploader
            images={coverUrls}
            onChange={setCoverUrls}
            maxImages={5}
            cloudinaryConfig={CLOUDINARY_CONFIG}
          />
        </div>

        <div className="flex items-center gap-3 p-4 bg-slate-50 dark:bg-black rounded-xl border border-slate-200 dark:border-slate-700">
          <input
            {...register('published')}
            type="checkbox"
            id="published"
            className="h-5 w-5 text-black dark:text-slate-200 focus:ring-black dark:ring-slate-800 border-slate-300 dark:border-slate-600 rounded dark:bg-slate-700"
          />
          <label htmlFor="published" className="text-sm font-medium text-slate-700 dark:text-slate-300 cursor-pointer">
            Publish immediately
          </label>
        </div>

        <div className="flex justify-end pt-4">
          <button
            type="submit"
            disabled={isLoading}
            className="flex items-center gap-2 px-6 py-3 bg-black dark:bg-white dark:text-black hover:bg-slate-900 dark:hover:bg-slate-100 disabled:opacity-50 text-white font-medium rounded-xl transition-all"
          >
            <Save size={18} />
            {isLoading ? 'Saving...' : 'Save Post'}
          </button>
        </div>
      </form>
    </div>
  );
}
