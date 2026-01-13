import { useEffect, useState } from "react";
import { api } from "../lib/api";
import type { Comment, User } from "../types";
import { Trash2, Send } from "lucide-react";

interface CommentSectionProps {
  postId: string;
  currentUser?: User | null;
  onCommentChange?: (delta: number) => void;
}

export default function CommentSection({
  postId,
  currentUser,
  onCommentChange,
}: CommentSectionProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchComments = async () => {
      try {
        const res = await api.get(`/comments/post/${postId}`);
        setComments(res.data);
      } catch (err) {
        console.error("Failed to fetch comments", err);
      }
    };
    fetchComments();
  }, [postId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    setLoading(true);
    try {
      const res = await api.post("/comments", { content, postId });
      setComments([res.data, ...comments]);
      setContent("");
      onCommentChange?.(1);
    } catch {
      alert("Failed to post comment");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this comment?")) return;
    try {
      await api.delete(`/comments/${id}`);
      setComments(comments.filter((c) => c.id !== id));
      onCommentChange?.(-1);
    } catch {
      alert("Failed to delete comment");
    }
  };

  return (
    <div className="mt-8 border-t border-gray-200 dark:border-gray-700 pt-6">
      <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
        Comments ({comments.length})
      </h3>

      {/* Comment Form */}
      {currentUser ? (
        <form onSubmit={handleSubmit} className="mb-8 flex gap-4">
          <img
            src={currentUser.avatar || "https://via.placeholder.com/40"}
            alt="Avatar"
            className="h-10 w-10 rounded-full bg-gray-200 dark:bg-gray-700"
          />
          <div className="flex-1">
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Write a comment..."
              className="w-full border border-gray-300 dark:border-gray-600 rounded-lg p-3 focus:ring-indigo-500 focus:border-indigo-500 text-sm dark:bg-gray-700 dark:text-white"
              rows={2}
            />
            <div className="mt-2 flex justify-end">
              <button
                type="submit"
                disabled={loading || !content.trim()}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50"
              >
                <Send className="h-4 w-4 mr-2" />
                Post
              </button>
            </div>
          </div>
        </form>
      ) : (
        <div className="mb-8 text-center bg-gray-50 dark:bg-gray-700 p-4 rounded-lg dark:text-gray-300">
          Please{" "}
          <a href="/login" className="text-indigo-600 dark:text-indigo-400 hover:underline">
            sign in
          </a>{" "}
          to comment.
        </div>
      )}

      {/* Comment List */}
      <div className="space-y-6">
        {comments.map((comment) => (
          <div key={comment.id} className="flex space-x-4">
            <div className="shrink-0">
              <img
                className="h-10 w-10 rounded-full bg-gray-200 dark:bg-gray-700"
                src={comment.author?.avatar || "https://via.placeholder.com/40"}
                alt={comment.author?.name}
              />
            </div>
            <div className="flex-1 bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
              <div className="flex items-center justify-between mb-1">
                <h4 className="text-sm font-bold text-gray-900 dark:text-white">
                  {comment.author?.name}
                </h4>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {new Date(comment.createdAt).toLocaleString()}
                  </span>
                  {(currentUser?.id === comment.authorId ||
                    currentUser?.role === "ADMIN") && (
                    <button
                      onClick={() => handleDelete(comment.id)}
                      className="text-gray-400 hover:text-red-500 dark:hover:text-red-400"
                      title="Delete"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
              <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                {comment.content}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
