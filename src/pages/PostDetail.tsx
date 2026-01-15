import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useOutletContext } from "react-router-dom";
import { api } from "../lib/api";
import type { Post, User } from "../types";
import {
  ArrowLeft,
  Calendar,
  User as UserIcon,
  Clock,
  Share2,
  Edit,
  Heart,
  Bookmark,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { LoadingSpinner } from "../components/LoadingSpinner";
import CommentSection from "../components/CommentSection";
import { motion, AnimatePresence } from "framer-motion";
import { useLingui } from "@lingui/react";
import { useLocale } from "../hooks/useLocale";

interface LayoutContext {
  currentUser: User | null;
  openAuthModal: (type: "login" | "register" | null) => void;
}

export default function PostDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { currentUser, openAuthModal } = useOutletContext<LayoutContext>();
  const { _ } = useLingui();
  const { locale } = useLocale();
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [commentCount, setCommentCount] = useState(0);
  const [isLiked, setIsLiked] = useState(false);
  const [isFavorited, setIsFavorited] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [favoriteCount, setFavoriteCount] = useState(0);

  useEffect(() => {
    const fetchPost = async () => {
      if (!id) return;

      try {
        const res = await api.get(`/posts/${id}`);
        setPost(res.data);
        setCommentCount(res.data._count?.comments || 0);
        setIsLiked(res.data.isLiked || false);
        setIsFavorited(res.data.isFavorited || false);
        setLikeCount(res.data._count?.likes || 0);
        setFavoriteCount(res.data._count?.favorites || 0);
      } catch (err) {
        console.error("Failed to fetch post", err);
        setError(_("postDetail.notFoundOrRemoved"));
      } finally {
        setLoading(false);
      }
    };
    fetchPost();
  }, [id, _]);

  // Set meta tags for sharing (Open Graph and Twitter Card)
  useEffect(() => {
    if (!post) return;

    const currentUrl = window.location.href;
    const coverImageUrl =
      post.coverUrls && post.coverUrls.length > 0 ? post.coverUrls[0] : null;
    const description =
      post.content?.replace(/<[^>]*>/g, "").substring(0, 200) || post.title;

    // Convert relative image URL to absolute URL if needed
    // WeChat requires HTTPS URLs and specific image requirements
    const getAbsoluteImageUrl = (url: string | null): string | null => {
      if (!url) return null;

      let absoluteUrl: string;

      // If already absolute URL (starts with http:// or https://)
      if (url.startsWith("http://") || url.startsWith("https://")) {
        absoluteUrl = url;
      }
      // If relative URL, convert to absolute
      else if (url.startsWith("/")) {
        absoluteUrl = `${window.location.origin}${url}`;
      }
      // If it's a Cloudinary URL or other CDN URL, return as is
      else {
        absoluteUrl = url;
      }

      // Force HTTPS for WeChat compatibility (required by WeChat)
      // Replace http:// with https://
      const secureUrl = absoluteUrl.replace(/^http:/, "https:");

      return secureUrl;
    };

    const coverImage = getAbsoluteImageUrl(coverImageUrl);

    // Debug: log image URL for troubleshooting
    if (coverImage) {
      console.log("[PostDetail] Setting cover image for sharing:", coverImage);
    }

    // Helper function to set or update meta tag
    const setMetaTag = (property: string, content: string) => {
      let element = document.querySelector(
        `meta[property="${property}"]`
      ) as HTMLMetaElement;
      if (!element) {
        element = document.createElement("meta");
        element.setAttribute("property", property);
        document.head.appendChild(element);
      }
      element.setAttribute("content", content);
    };

    const setMetaName = (name: string, content: string) => {
      let element = document.querySelector(
        `meta[name="${name}"]`
      ) as HTMLMetaElement;
      if (!element) {
        element = document.createElement("meta");
        element.setAttribute("name", name);
        document.head.appendChild(element);
      }
      element.setAttribute("content", content);
    };

    // Open Graph tags (required for WeChat and other social platforms)
    setMetaTag("og:title", post.title);
    setMetaTag("og:description", description);
    setMetaTag("og:url", currentUrl);
    setMetaTag("og:type", "article");
    setMetaTag("og:site_name", "Posts");

    if (coverImage) {
      // coverImage is already HTTPS from getAbsoluteImageUrl
      setMetaTag("og:image", coverImage);
      setMetaTag("og:image:secure_url", coverImage); // Required by WeChat
      setMetaTag("og:image:width", "1200");
      setMetaTag("og:image:height", "630");
      setMetaTag("og:image:type", "image/jpeg");
      setMetaTag("og:image:alt", post.title);
    }

    // Twitter Card tags
    setMetaName("twitter:card", "summary_large_image");
    setMetaName("twitter:title", post.title);
    setMetaName("twitter:description", description);
    if (coverImage) {
      setMetaName("twitter:image", coverImage);
    }

    // WeChat specific meta tags
    // WeChat reads og:image, but also checks these for compatibility
    setMetaName("description", description);
    if (coverImage) {
      setMetaName("image", coverImage);
    }

    // Update page title
    document.title = `${post.title} | Posts`;

    // Cleanup function to remove meta tags when component unmounts
    return () => {
      // Reset title
      document.title = "Posts";
      // Remove meta tags (optional - you can keep them or remove them)
      const metaTagsToRemove = [
        "og:title",
        "og:description",
        "og:url",
        "og:type",
        "og:site_name",
        "og:image",
        "og:image:secure_url",
        "og:image:width",
        "og:image:height",
        "og:image:type",
        "og:image:alt",
        "twitter:card",
        "twitter:title",
        "twitter:description",
        "twitter:image",
        "description",
        "image",
      ];
      metaTagsToRemove.forEach((property) => {
        const element = document.querySelector(
          `meta[property="${property}"], meta[name="${property}"]`
        );
        if (element) {
          element.remove();
        }
      });
    };
  }, [post]);

  const handleCommentChange = (delta: number) => {
    setCommentCount((prev) => prev + delta);
  };

  const handleShare = async () => {
    if (!post) return;

    const shareUrl = window.location.href;
    const shareText =
      post.content?.replace(/<[^>]*>/g, "").substring(0, 200) || post.title;
    const coverImageUrl =
      post.coverUrls && post.coverUrls.length > 0 ? post.coverUrls[0] : null;

    console.log("coverImageUrl", coverImageUrl);
    // Convert relative image URL to absolute URL if needed
    const getAbsoluteImageUrl = (url: string | null): string | null => {
      if (!url) return null;
      if (url.startsWith("http://") || url.startsWith("https://")) {
        return url;
      }
      if (url.startsWith("/")) {
        return `${window.location.origin}${url}`;
      }
      return url;
    };

    if (navigator.share) {
      try {
        const shareData: ShareData = {
          title: post.title,
          text: shareText,
          url: shareUrl,
        };

        // Try to share with image file if browser supports it
        if (coverImageUrl && "canShare" in navigator && "files" in navigator) {
          try {
            const absoluteImageUrl = getAbsoluteImageUrl(coverImageUrl);
            if (absoluteImageUrl) {
              // Fetch the image and convert to File
              const response = await fetch(absoluteImageUrl);
              const blob = await response.blob();
              const file = new File([blob], "cover.jpg", {
                type: blob.type || "image/jpeg",
              });

              // Check if browser can share files
              const fileShareData: ShareData = {
                ...shareData,
                files: [file],
              };

              if (navigator.canShare && navigator.canShare(fileShareData)) {
                await navigator.share(fileShareData);
                return;
              }
            }
          } catch (imageErr) {
            console.log(
              "Failed to share with image file, falling back to URL only",
              imageErr
            );
            // Fall through to share URL only
          }
        }

        // Share URL only (meta tags will handle image preview)
        await navigator.share(shareData);
      } catch (err: unknown) {
        // User cancelled or share failed - fallback to copy
        if ((err as Error)?.name !== "AbortError") {
          try {
            await navigator.clipboard.writeText(shareUrl);
            alert(_("postDetail.linkCopied"));
          } catch (clipboardErr) {
            console.error("Failed to copy to clipboard", clipboardErr);
          }
        }
      }
    } else {
      // Fallback: copy to clipboard
      try {
        await navigator.clipboard.writeText(shareUrl);
        alert(_("postDetail.linkCopied"));
      } catch (clipboardErr) {
        console.error("Failed to copy to clipboard", clipboardErr);
      }
    }
  };

  const handleToggleLike = async () => {
    if (!currentUser) {
      openAuthModal("login");
      return;
    }

    try {
      if (isLiked) {
        await api.delete(`/posts/${post?.id}/like`);
        setIsLiked(false);
        setLikeCount((prev) => Math.max(0, prev - 1));
      } else {
        await api.post(`/posts/${post?.id}/like`);
        setIsLiked(true);
        setLikeCount((prev) => prev + 1);
      }
    } catch (err) {
      console.error("Failed to toggle like", err);
      alert(_("postDetail.loginToLike"));
    }
  };

  const handleToggleFavorite = async () => {
    if (!currentUser) {
      openAuthModal("login");
      return;
    }

    try {
      if (isFavorited) {
        await api.delete(`/posts/${post?.id}/favorite`);
        setIsFavorited(false);
        setFavoriteCount((prev) => Math.max(0, prev - 1));
      } else {
        await api.post(`/posts/${post?.id}/favorite`);
        setIsFavorited(true);
        setFavoriteCount((prev) => prev + 1);
      }
    } catch (err) {
      console.error("Failed to toggle favorite", err);
      alert(_("postDetail.loginToSave"));
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error || !post) {
    return (
      <div className="max-w-3xl mx-auto text-center py-20">
        <div className="text-6xl mb-4 opacity-50">😕</div>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
          {error || _("postDetail.notFound")}
        </h2>
        <button
          onClick={() => navigate("/dashboard/all")}
          className="inline-flex items-center gap-2 px-6 py-3 bg-black hover:bg-slate-900 text-white font-medium rounded-xl transition-all"
        >
          <ArrowLeft size={18} />
          {_("postDetail.backToHome")}
        </button>
      </div>
    );
  }

  const isAuthor = currentUser?.id === post.authorId;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-4xl mx-auto"
    >
      {/* Back Button */}
      <button
        onClick={() => navigate(-1)}
        className="mb-8 flex items-center gap-2 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors group"
      >
        <ArrowLeft
          size={20}
          className="group-hover:-translate-x-1 transition-transform"
        />
        <span className="font-medium">{_("common.back")}</span>
      </button>

      {/* Article Header */}
      <article className="bg-white dark:bg-[#161616] rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        {/* Hero Image / Gradient with Carousel */}
        <div className="w-full aspect-square relative overflow-hidden">
          {post.coverUrls && post.coverUrls.length > 0 ? (
            <>
              <AnimatePresence mode="wait">
                <motion.img
                  key={currentImageIndex}
                  src={post.coverUrls[currentImageIndex]}
                  alt={`${post.title} - Image ${currentImageIndex + 1}`}
                  className="w-full h-full object-cover"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = "none";
                  }}
                />
              </AnimatePresence>
              <div className="absolute inset-0 bg-black/20"></div>

              {/* Carousel Controls - only show if multiple images */}
              {post.coverUrls.length > 1 && (
                <>
                  {/* Previous Button */}
                  <button
                    onClick={() =>
                      setCurrentImageIndex((prev) =>
                        prev === 0 ? post.coverUrls!.length - 1 : prev - 1
                      )
                    }
                    className="absolute left-3 top-1/2 -translate-y-1/2 p-2 bg-black/50 hover:bg-black/70 text-white rounded-full backdrop-blur-sm transition-colors"
                  >
                    <ChevronLeft size={20} />
                  </button>

                  {/* Next Button */}
                  <button
                    onClick={() =>
                      setCurrentImageIndex((prev) =>
                        prev === post.coverUrls!.length - 1 ? 0 : prev + 1
                      )
                    }
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-2 bg-black/50 hover:bg-black/70 text-white rounded-full backdrop-blur-sm transition-colors"
                  >
                    <ChevronRight size={20} />
                  </button>

                  {/* Dots Indicator */}
                  <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5">
                    {post.coverUrls.map((_, index) => (
                      <button
                        key={index}
                        onClick={() => setCurrentImageIndex(index)}
                        className={`w-2 h-2 rounded-full transition-all ${
                          index === currentImageIndex
                            ? "bg-white w-4"
                            : "bg-white/50 hover:bg-white/70"
                        }`}
                      />
                    ))}
                  </div>

                  {/* Image Counter */}
                  <div className="absolute top-3 right-3 bg-black/50 backdrop-blur-sm text-white text-xs px-2 py-1 rounded">
                    {currentImageIndex + 1} / {post.coverUrls.length}
                  </div>
                </>
              )}
            </>
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-slate-900 via-black to-slate-800"></div>
          )}
        </div>

        {/* Meta Info */}
        <div className="px-4 sm:px-8 py-4 sm:py-6 border-b border-slate-100 dark:border-slate-700/50">
          <div className="flex flex-wrap items-center justify-between gap-4">
            {/* Author Info */}
            <div
              className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity"
              onClick={() =>
                post.author?.id && navigate(`/user/${post.author.id}`)
              }
            >
              {post.author?.avatar ? (
                <img
                  src={post.author.avatar}
                  alt={post.author.name}
                  className="w-8 h-8 rounded-full object-cover ring-2 ring-slate-200 dark:ring-slate-700"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center">
                  <UserIcon
                    size={16}
                    className="text-slate-400 dark:text-slate-500"
                  />
                </div>
              )}
              <div>
                <p className="text-sm font-semibold text-slate-900 dark:text-white hover:text-green-600 dark:hover:text-green-400 transition-colors">
                  {post.author?.name || _("postList.anonymous")}
                </p>
                <div className="flex items-center gap-2 sm:gap-3 text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                  <span className="flex items-center gap-1">
                    <Calendar size={12} className="sm:w-3.5 sm:h-3.5" />
                    {new Date(post.createdAt).toLocaleDateString(
                      locale === "zh" ? "zh-CN" : "en-US",
                      {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      }
                    )}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock size={12} className="sm:w-3.5 sm:h-3.5" />
                    {Math.ceil(post.content.length / 1000)}{" "}
                    {_("postDetail.minRead")}
                  </span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              <button
                onClick={handleShare}
                className="flex items-center gap-2 px-3 sm:px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
              >
                <Share2 size={18} className="sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">
                  {_("postDetail.share")}
                </span>
              </button>
              {isAuthor && (
                <Link
                  to={`/posts/edit/${post.id}`}
                  className="flex items-center gap-2 px-3 sm:px-4 py-2 text-sm font-medium text-white bg-black hover:bg-slate-900 rounded-xl transition-all"
                >
                  <Edit size={18} className="sm:w-4 sm:h-4" />
                  <span className="hidden sm:inline">
                    {_("postDetail.edit")}
                  </span>
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* Article Title */}
        <div className="px-4 sm:px-8 pt-6 sm:pt-8 pb-4 sm:pb-6">
          {!post.published && (
            <span className="inline-block mb-4 bg-yellow-100 dark:bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 text-xs font-bold px-3 py-1 rounded uppercase tracking-wide border border-yellow-200 dark:border-yellow-500/20">
              {_("posts.draft")}
            </span>
          )}
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-slate-900 dark:text-white leading-tight">
            {post.title}
          </h1>
        </div>

        {/* Article Content */}
        <div className="px-4 sm:px-8 py-8">
          <div
            className="prose prose-lg dark:prose-invert max-w-none prose-img:rounded-xl prose-a:text-black dark:prose-a:text-slate-200 prose-a:underline"
            dangerouslySetInnerHTML={{ __html: post.content }}
          />
        </div>

        {/* Action Bar */}
        <div className="px-4 sm:px-8 py-4 border-t border-slate-100 dark:border-slate-700/50">
          <div className="flex items-center justify-center gap-6 sm:gap-8">
            <button
              onClick={handleToggleLike}
              className={`flex flex-col sm:flex-row items-center gap-1.5 sm:gap-2 px-4 sm:px-6 py-2 rounded-xl transition-all ${
                isLiked
                  ? "text-red-500"
                  : "text-slate-600 dark:text-slate-400 hover:text-red-500"
              }`}
            >
              <Heart
                size={20}
                className={`${isLiked ? "fill-current" : ""} sm:w-5 sm:h-5`}
              />
              <span className="text-xs sm:text-sm font-medium">
                {likeCount}
              </span>
            </button>

            <button
              onClick={handleToggleFavorite}
              className={`flex flex-col sm:flex-row items-center gap-1.5 sm:gap-2 px-4 sm:px-6 py-2 rounded-xl transition-all ${
                isFavorited
                  ? "text-yellow-500"
                  : "text-slate-600 dark:text-slate-400 hover:text-yellow-500"
              }`}
            >
              <Bookmark
                size={20}
                className={`${isFavorited ? "fill-current" : ""} sm:w-5 sm:h-5`}
              />
              <span className="text-xs sm:text-sm font-medium">
                {favoriteCount}
              </span>
            </button>
          </div>
        </div>
      </article>

      {/* Comments Section */}
      <div className="mt-6 sm:mt-8 bg-white dark:bg-[#161616] rounded-xl sm:rounded-2xl border border-slate-200 dark:border-slate-800 p-4 sm:p-8">
        <h2 className="text-base sm:text-xl font-bold text-slate-900 dark:text-white mb-4 sm:mb-6">
          {_("postDetail.comments")} ({commentCount})
        </h2>
        <CommentSection
          postId={post.id}
          currentUser={currentUser}
          onCommentChange={handleCommentChange}
          onLoginClick={() => openAuthModal("login")}
        />
      </div>
    </motion.div>
  );
}
