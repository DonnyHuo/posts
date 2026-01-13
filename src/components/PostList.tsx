import { useEffect, useState } from "react";
import { api } from "../lib/api";
import type { Post, User } from "../types";
import { Edit, Trash2, Eye, EyeOff, MessageSquare } from "lucide-react";
import { Link } from "react-router-dom";
import CommentSection from "./CommentSection";
import { LoadingSpinner } from "./LoadingSpinner";

interface PostListProps {
  myPosts?: boolean;
  currentUser?: User | null;
}

export default function PostList({
  myPosts = false,
  currentUser,
}: PostListProps) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedPostId, setExpandedPostId] = useState<string | null>(null);

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const endpoint = myPosts ? "/posts/my" : "/posts";
        const res = await api.get(endpoint);
        let fetchedPosts = res.data.data || res.data;

        // If viewing public posts, filter out unpublished ones
        if (!myPosts) {
          fetchedPosts = fetchedPosts.filter((post: Post) => post.published);
        }

        setPosts(fetchedPosts);
      } catch (err) {
        console.error("Failed to fetch posts", err);
      } finally {
        setLoading(false);
      }
    };
    fetchPosts();
  }, [myPosts]);

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this post?")) return;
    try {
      await api.delete(`/posts/${id}`);
      setPosts(posts.filter((post) => post.id !== id));
    } catch {
      alert("Failed to delete post");
    }
  };

  const handleTogglePublish = async (post: Post) => {
    try {
      const res = await api.patch(`/posts/${post.id}/publish`);
      setPosts(posts.map((p) => (p.id === post.id ? res.data : p)));
    } catch {
      alert("Failed to update publish status");
    }
  };

  const toggleComments = (postId: string) => {
    setExpandedPostId(expandedPostId === postId ? null : postId);
  };

  const handleCommentChange = (postId: string, delta: number) => {
    setPosts(
      posts.map((post) => {
        if (post.id !== postId) return post;
        return {
          ...post,
          _count: {
            ...post._count,
            comments: (post._count?.comments || 0) + delta,
          },
        };
      })
    );
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-4">
      {posts.length === 0 ? (
        <div className="text-center py-10 text-gray-500">No posts found</div>
      ) : (
        posts.map((post) => (
          <div
            key={post.id}
            className="bg-white shadow rounded-lg p-4 sm:p-6 border border-gray-100 transition-all"
          >
            <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
              <div className="flex-1 w-full">
                <h3 className="text-xl font-semibold text-gray-900 flex items-center gap-2 flex-wrap">
                  {post.title}
                  {!post.published && (
                    <span className="px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded-full shrink-0">
                      Draft
                    </span>
                  )}
                </h3>
                <p className="mt-2 text-gray-600 line-clamp-3">
                  {post.content}
                </p>
                <div className="mt-4 flex flex-col sm:flex-row sm:items-center justify-between text-sm text-gray-500 gap-3">
                  <span>
                    By {post.author?.name || "Unknown"} •{" "}
                    {new Date(post.createdAt).toLocaleString()}
                  </span>
                  <button
                    onClick={() => toggleComments(post.id)}
                    className="flex items-center gap-1 hover:text-indigo-600 transition-colors self-start sm:self-auto"
                  >
                    <MessageSquare size={16} />
                    {post._count?.comments || 0}{" "}
                    {expandedPostId === post.id ? "Hide Comments" : "Comments"}
                  </button>
                </div>
              </div>

              {myPosts && (
                <div className="flex space-x-2 ml-0 sm:ml-4 self-end sm:self-start">
                  <button
                    onClick={() => handleTogglePublish(post)}
                    className={`p-2 rounded-full hover:bg-gray-100 ${
                      post.published ? "text-green-600" : "text-gray-400"
                    }`}
                    title={post.published ? "Unpublish" : "Publish"}
                  >
                    {post.published ? <Eye size={20} /> : <EyeOff size={20} />}
                  </button>
                  <Link
                    to={`/posts/edit/${post.id}`}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-full"
                    title="Edit"
                  >
                    <Edit size={20} />
                  </Link>
                  <button
                    onClick={() => handleDelete(post.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-full"
                    title="Delete"
                  >
                    <Trash2 size={20} />
                  </button>
                </div>
              )}
            </div>

            {/* Comment Section */}
            {expandedPostId === post.id && (
              <CommentSection
                postId={post.id}
                currentUser={currentUser}
                onCommentChange={(delta) => handleCommentChange(post.id, delta)}
              />
            )}
          </div>
        ))
      )}
    </div>
  );
}
