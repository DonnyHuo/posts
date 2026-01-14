import { useEffect, useState, useRef, useCallback } from "react";
import { api } from "../lib/api";
import type { Post } from "../types";
import {
  Edit,
  Trash2,
  Eye,
  EyeOff,
  Heart,
  User as UserIcon,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { LoadingSpinner } from "./LoadingSpinner";
import { motion } from "framer-motion";

interface PostListProps {
  myPosts?: boolean;
  likedPosts?: boolean;
  favoritedPosts?: boolean;
  commentedPosts?: boolean;
  searchKeyword?: string;
  publishFilter?: "all" | "published" | "draft";
}

const PAGE_SIZE = 8;

export default function PostList({
  myPosts = false,
  likedPosts = false,
  favoritedPosts = false,
  commentedPosts = false,
  searchKeyword = "",
  publishFilter,
}: PostListProps) {
  const navigate = useNavigate();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const observerTarget = useRef<HTMLDivElement>(null);

  // Reset pagination when filters change
  useEffect(() => {
    setPosts([]);
    setPage(1);
    setHasMore(true);
    setLoading(true);
  }, [
    myPosts,
    likedPosts,
    favoritedPosts,
    commentedPosts,
    searchKeyword,
    publishFilter,
  ]);

  const fetchPosts = useCallback(
    async (pageNum: number, reset: boolean = false) => {
      try {
        let endpoint = "/posts";
        if (myPosts) endpoint = "/posts/my";
        else if (likedPosts) endpoint = "/posts/liked";
        else if (favoritedPosts) endpoint = "/posts/favorited";
        else if (commentedPosts) endpoint = "/posts/commented";

        const res = await api.get(endpoint, {
          params: {
            page: pageNum,
            limit: PAGE_SIZE,
          },
        });

        let fetchedPosts = res.data.data || res.data;

        // Handle pagination response format
        if (res.data.data && Array.isArray(res.data.data)) {
          fetchedPosts = res.data.data;
          setHasMore(fetchedPosts.length === PAGE_SIZE);
        } else if (Array.isArray(res.data)) {
          fetchedPosts = res.data;
          setHasMore(fetchedPosts.length === PAGE_SIZE);
        } else {
          fetchedPosts = [];
          setHasMore(false);
        }

        // If viewing public posts, filter out unpublished ones
        if (!myPosts && !likedPosts && !favoritedPosts && !commentedPosts) {
          fetchedPosts = fetchedPosts.filter((post: Post) => post.published);
        }

        // Apply publish filter for my posts
        if (myPosts && publishFilter) {
          if (publishFilter === "published") {
            fetchedPosts = fetchedPosts.filter((post: Post) => post.published);
          } else if (publishFilter === "draft") {
            fetchedPosts = fetchedPosts.filter((post: Post) => !post.published);
          }
          // "all" means no filtering
        }

        if (reset) {
          setPosts(fetchedPosts);
        } else {
          setPosts((prev) => [...prev, ...fetchedPosts]);
        }
      } catch (err) {
        console.error("Failed to fetch posts", err);
        setHasMore(false);
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [myPosts, likedPosts, favoritedPosts, commentedPosts, publishFilter]
  );

  // Initial load
  useEffect(() => {
    if (page === 1) {
      if (searchKeyword.trim()) {
        // When searching, load all posts for client-side filtering
        fetchPosts(1, true);
      } else {
        fetchPosts(1, true);
      }
    }
  }, [page, fetchPosts, searchKeyword]);

  // Load more when page changes (only when not searching)
  useEffect(() => {
    if (page > 1 && !searchKeyword.trim()) {
      setLoadingMore(true);
      fetchPosts(page, false);
    }
  }, [page, fetchPosts, searchKeyword]);

  // Intersection Observer for infinite scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (
          entries[0].isIntersecting &&
          hasMore &&
          !loadingMore &&
          !loading &&
          !searchKeyword.trim()
        ) {
          setPage((prev) => prev + 1);
        }
      },
      { threshold: 0.1 }
    );

    const currentTarget = observerTarget.current;
    if (currentTarget) {
      observer.observe(currentTarget);
    }

    return () => {
      if (currentTarget) {
        observer.unobserve(currentTarget);
      }
    };
  }, [hasMore, loadingMore, loading, searchKeyword]);

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

  const handleToggleLike = async (post: Post) => {
    try {
      const res = await api.post(`/posts/${post.id}/like`);
      setPosts(
        posts.map((p) => {
          if (p.id !== post.id) return p;
          return {
            ...p,
            isLiked: res.data.liked,
            _count: {
              ...p._count,
              comments: p._count?.comments || 0,
              likes: (p._count?.likes || 0) + (res.data.liked ? 1 : -1),
              favorites: p._count?.favorites || 0,
            },
          };
        })
      );
    } catch {
      alert("Please login to like posts");
    }
  };

  // Filter posts by search keyword (client-side filtering for search)
  const filteredPosts = searchKeyword.trim()
    ? posts.filter((post) => {
        const keyword = searchKeyword.toLowerCase();
        return (
          post.title.toLowerCase().includes(keyword) ||
          post.content.toLowerCase().includes(keyword) ||
          post.author?.name?.toLowerCase().includes(keyword)
        );
      })
    : posts;

  if (loading && posts.length === 0) {
    return <LoadingSpinner />;
  }

  return (
    <>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 md:gap-6">
        {filteredPosts.length === 0 ? (
          <div className="col-span-full text-center py-20 bg-white dark:bg-[#161616] rounded-2xl border border-slate-200 dark:border-slate-800">
            <div className="text-6xl mb-4 opacity-50">
              {searchKeyword.trim() ? "🔍" : "📝"}
            </div>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
              {searchKeyword.trim() ? "No Results Found" : "Nothing Here Yet"}
            </h3>
            <p className="text-slate-500 dark:text-slate-400">
              {searchKeyword.trim()
                ? `No posts match "${searchKeyword}"`
                : likedPosts
                ? "You haven't liked any posts yet!"
                : favoritedPosts
                ? "You haven't favorited any posts yet!"
                : commentedPosts
                ? "You haven't commented on any posts yet!"
                : "Be the first to share your thoughts!"}
            </p>
          </div>
        ) : (
          filteredPosts.map((post, index) => (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              key={post.id}
              onClick={() => {
                navigate(`/posts/${post.id}`);
              }}
              className={`group flex flex-col bg-white dark:bg-[#161616] rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 hover:border-slate-400 dark:hover:border-slate-700 transition-all hover:shadow-2xl hover:shadow-slate-200/50 dark:hover:shadow-black/50 cursor-pointer ${
                !post.published
                  ? "opacity-75 border-dashed border-slate-300 dark:border-slate-600"
                  : ""
              }`}
            >
              {/* Card Header / Cover Image */}
              <div className="h-48 sm:h-56 lg:h-64 relative overflow-hidden">
                {post.coverUrls && post.coverUrls.length > 0 ? (
                  <>
                    <img
                      src={post.coverUrls[0]}
                      alt={post.title}
                      className="w-full h-full object-cover transition-transform group-hover:scale-105"
                      onError={(e) => {
                        // Fallback to gradient if image fails to load
                        const target = e.target as HTMLImageElement;
                        target.style.display = "none";
                        const parent = target.parentElement;
                        if (parent) {
                          parent.className +=
                            " bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-800";
                        }
                      }}
                    />
                    {/* Overlay for better text readability */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />

                    {/* Multi-image indicator */}
                    {post.coverUrls.length > 1 && (
                      <div className="absolute bottom-2 right-2 flex items-center gap-1 bg-black/60 backdrop-blur-sm text-white text-[10px] px-1.5 py-0.5 rounded">
                        <svg
                          className="w-3 h-3"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                          />
                        </svg>
                        {post.coverUrls.length}
                      </div>
                    )}
                  </>
                ) : (
                  <div className="h-full bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-800" />
                )}

                {/* Draft Badge - only show for unpublished posts */}
                {!post.published && (
                  <div className="absolute top-3 sm:top-4 right-3 sm:right-4 z-10">
                    <span className="bg-yellow-100 dark:bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 text-[10px] sm:text-xs font-bold px-1.5 sm:px-2 py-0.5 sm:py-1 rounded uppercase tracking-wide border border-yellow-200 dark:border-yellow-500/20 backdrop-blur-sm">
                      Draft
                    </span>
                  </div>
                )}
              </div>

              <div className="p-3 sm:p-4 lg:p-6 flex-1 flex flex-col">
                <h3 className="text-sm sm:text-base lg:text-xl font-bold text-slate-900 dark:text-white mb-2 sm:mb-3 line-clamp-2 leading-tight group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors">
                  {post.title}
                </h3>

                {/* Content preview - hidden on mobile, line-clamp on desktop */}
                <div
                  className="content-preview text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed mb-3 sm:mb-4 flex-1 prose prose-sm dark:prose-invert max-w-none"
                  dangerouslySetInnerHTML={{ __html: post.content }}
                />

                <div className="flex items-center justify-between pt-2 sm:pt-4 border-t border-slate-100 dark:border-slate-700/50 sm:mt-auto">
                  {/* Author - Left Side */}
                  {!myPosts && (
                    <div
                      className="flex items-center gap-1.5 sm:gap-2 min-w-0 flex-1 cursor-pointer hover:opacity-80 transition-opacity"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (post.author?.id) {
                          navigate(`/user/${post.author.id}`);
                        }
                      }}
                    >
                      {post.author?.avatar ? (
                        <img
                          src={post.author.avatar}
                          alt={post.author.name}
                          className="w-4 h-4 sm:w-7 sm:h-7 rounded-full object-cover ring-1 ring-slate-200 dark:ring-slate-700 shrink-0"
                        />
                      ) : (
                        <div className="w-4 h-4 sm:w-7 sm:h-7 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center shrink-0">
                          <UserIcon
                            size={10}
                            className="sm:w-3.5 sm:h-3.5 text-slate-400 dark:text-slate-500"
                          />
                        </div>
                      )}
                      <span className="text-[10px] sm:text-xs font-medium text-slate-900 dark:text-white truncate min-w-0 max-w-[120px] sm:max-w-[200px]">
                        {post.author?.name || "Anonymous"}
                      </span>
                    </div>
                  )}

                  {/* Action Buttons - Right Side */}
                  <div className="flex items-center justify-end gap-2 sm:gap-3 lg:gap-4 shrink-0 ml-auto">
                    {myPosts ? (
                      <div className="flex items-center gap-4 sm:gap-5 lg:gap-6">
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleTogglePublish(post);
                          }}
                          className="text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors"
                          title={post.published ? "Unpublish" : "Publish"}
                        >
                          {post.published ? (
                            <Eye size={14} className="sm:w-4 sm:h-4" />
                          ) : (
                            <EyeOff size={14} className="sm:w-4 sm:h-4" />
                          )}
                        </button>
                        <Link
                          to={`/posts/edit/${post.id}`}
                          onClick={(e) => {
                            e.stopPropagation();
                          }}
                          className="text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors"
                        >
                          <Edit size={14} className="sm:w-4 sm:h-4" />
                        </Link>
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleDelete(post.id);
                          }}
                          className="text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                        >
                          <Trash2 size={14} className="sm:w-4 sm:h-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1 text-[10px] sm:text-xs text-slate-500 dark:text-slate-400">
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleToggleLike(post);
                          }}
                          className={`flex items-center gap-1 transition-colors ${
                            post.isLiked ? "text-red-500" : "hover:text-red-500"
                          }`}
                        >
                          <Heart
                            size={12}
                            className={`${
                              post.isLiked ? "fill-current" : ""
                            } sm:w-4 sm:h-4 lg:w-5 lg:h-5`}
                          />
                          {post._count?.likes || 0}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* Loading indicator and observer target */}
      {!searchKeyword.trim() && (
        <div ref={observerTarget} className="mt-8 flex justify-center">
          {loadingMore && (
            <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
              <div className="w-5 h-5 border-2 border-slate-300 dark:border-slate-700 border-t-black dark:border-t-slate-400 rounded-full animate-spin"></div>
              <span className="text-sm">Loading more...</span>
            </div>
          )}
          {!hasMore && posts.length > 0 && (
            <p className="text-sm text-slate-500 dark:text-slate-400">
              No more posts to load
            </p>
          )}
        </div>
      )}
    </>
  );
}
