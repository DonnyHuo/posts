import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../lib/api';
import { ArrowLeft } from 'lucide-react';

interface PostFormData {
  title: string;
  content: string;
  published: boolean;
}

export default function PostEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { register, handleSubmit, setValue } = useForm<PostFormData>();
  const [isLoading, setIsLoading] = useState(false);
  const isEditMode = !!id;

  useEffect(() => {
    if (isEditMode) {
      api.get(`/posts/${id}`).then((res) => {
        const { title, content, published } = res.data;
        setValue('title', title);
        setValue('content', content);
        setValue('published', published);
      }).catch(() => {
        alert('Failed to load post');
        navigate('/dashboard');
      });
    }
  }, [id]);

  const onSubmit = async (data: PostFormData) => {
    setIsLoading(true);
    try {
      if (isEditMode) {
        await api.patch(`/posts/${id}`, data);
      } else {
        await api.post('/posts', data);
      }
      navigate('/dashboard');
    } catch (err) {
      alert('Failed to save post');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8 flex items-center">
          <button
            onClick={() => navigate(-1)}
            className="mr-4 p-2 rounded-full hover:bg-gray-200"
          >
            <ArrowLeft size={24} />
          </button>
          <h1 className="text-3xl font-bold text-gray-900">
            {isEditMode ? 'Edit Post' : 'Create New Post'}
          </h1>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="bg-white shadow rounded-lg p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700">Title</label>
            <input
              {...register('title', { required: true })}
              type="text"
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              placeholder="Enter post title"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Content</label>
            <textarea
              {...register('content')}
              rows={10}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              placeholder="Write your content here..."
            />
          </div>

          <div className="flex items-center">
            <input
              {...register('published')}
              type="checkbox"
              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
            />
            <label className="ml-2 block text-sm text-gray-900">
              Publish immediately
            </label>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isLoading}
              className="ml-3 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              {isLoading ? 'Saving...' : 'Save Post'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

