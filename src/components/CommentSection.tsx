import { useEffect, useState } from "react";
import { api } from "../lib/api";
import type { Comment, User } from "../types";
import { Trash2, Send, LogIn, User as UserIcon } from "lucide-react";

interface CommentSectionProps {
  postId: string;
  currentUser?: User | null;
  onCommentChange?: (delta: number) => void;
  onLoginClick?: () => void;
}

export default function CommentSection({
  postId,
  currentUser,
  onCommentChange,
  onLoginClick,
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
    <div>
      {/* Comment Form */}
      {currentUser ? (
        <form
          onSubmit={handleSubmit}
          className="mb-4 sm:mb-8 flex gap-2 sm:gap-4"
        >
          {currentUser.avatar ? (
            <img
              src={currentUser.avatar}
              alt="Avatar"
              className="h-8 w-8 sm:h-10 sm:w-10 rounded-full object-cover ring-2 ring-slate-200 dark:ring-slate-700 shrink-0"
            />
          ) : (
            <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center shrink-0">
              <UserIcon
                size={16}
                className="sm:w-5 sm:h-5 text-slate-400 dark:text-slate-500"
              />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Write a comment..."
              className="w-full bg-slate-50 dark:bg-black border border-slate-200 dark:border-slate-800 rounded-lg sm:rounded-xl px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:ring-2 focus:ring-black dark:ring-slate-800 focus:border-transparent outline-none transition-all resize-none"
              rows={2}
            />
            <div className="mt-2 sm:mt-3 flex justify-end">
              <button
                type="submit"
                disabled={loading || !content.trim()}
                className="inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-5 py-1.5 sm:py-2.5 text-xs sm:text-sm font-medium text-white dark:text-black bg-black dark:bg-white hover:bg-slate-900 dark:hover:bg-slate-100 rounded-lg sm:rounded-xl disabled:opacity-50 transition-all"
              >
                <Send size={14} className="sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">
                  {loading ? "Posting..." : "Post Comment"}
                </span>
                <span className="sm:hidden">{loading ? "..." : "Post"}</span>
              </button>
            </div>
          </div>
        </form>
      ) : (
        <div className="mb-4 sm:mb-8 text-center bg-slate-50 dark:bg-black border border-slate-200 dark:border-slate-800 p-4 sm:p-6 rounded-lg sm:rounded-xl">
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mb-3 sm:mb-4">
            Sign in to join the conversation
          </p>
          <button
            onClick={onLoginClick}
            className="inline-flex items-center gap-1.5 sm:gap-2 px-4 sm:px-6 py-2 sm:py-3 text-xs sm:text-sm font-medium text-white dark:text-black bg-black dark:bg-white hover:bg-slate-900 dark:hover:bg-slate-100 rounded-lg sm:rounded-xl transition-all"
          >
            <LogIn size={16} className="sm:w-4.5 sm:h-4.5" />
            <span className="hidden sm:inline">Sign In to Comment</span>
            <span className="sm:hidden">Sign In</span>
          </button>
        </div>
      )}

      {/* Comment List */}
      {comments.length === 0 ? (
        <div className="text-center py-6 sm:py-8 text-xs sm:text-sm text-slate-500 dark:text-slate-400">
          No comments yet. Be the first to share your thoughts!
        </div>
      ) : (
        <div className="space-y-3 sm:space-y-6">
          {comments.map((comment) => (
            <div key={comment.id} className="flex gap-2 sm:gap-4">
              <div className="shrink-0">
                {comment.author?.avatar ? (
                  <img
                    className="h-8 w-8 sm:h-10 sm:w-10 rounded-full object-cover ring-2 ring-slate-200 dark:ring-slate-700"
                    src={comment.author.avatar}
                    alt={comment.author.name}
                  />
                ) : (
                  <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center">
                    <UserIcon
                      size={16}
                      className="sm:w-5 sm:h-5 text-slate-400 dark:text-slate-500"
                    />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0 bg-slate-50 dark:bg-black border border-slate-200 dark:border-slate-800 rounded-lg sm:rounded-xl p-3 sm:p-4">
                <div className="flex items-center justify-between mb-1.5 sm:mb-2 gap-2">
                  <h4 className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-white truncate">
                    {comment.author?.name || "Anonymous"}
                  </h4>
                  <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                    <span className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">
                      {new Date(comment.createdAt).toLocaleDateString()}
                    </span>
                    {(currentUser?.id === comment.authorId ||
                      currentUser?.role === "ADMIN") && (
                      <button
                        onClick={() => handleDelete(comment.id)}
                        className="text-slate-400 hover:text-red-500 dark:hover:text-red-400 transition-colors shrink-0"
                        title="Delete"
                      >
                        <Trash2 size={12} className="sm:w-3.5 sm:h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
                <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">
                  {comment.content}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
