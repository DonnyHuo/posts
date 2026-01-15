import { Link } from "react-router-dom";
import { Plus, Search, X } from "lucide-react";
import PostList from "../components/PostList";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { useLingui } from "@lingui/react";

interface PostFeedProps {
  mode: "my" | "all" | "liked" | "favorited" | "commented";
}

export default function PostFeed({ mode }: PostFeedProps) {
  const [searchKeyword, setSearchKeyword] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [publishFilter, setPublishFilter] = useState<
    "all" | "published" | "draft"
  >("all");
  const { _ } = useLingui();
  const isMyPosts = mode === "my";
  const isLikedPosts = mode === "liked";
  const isFavoritedPosts = mode === "favorited";
  const isCommentedPosts = mode === "commented";
  const showHero = mode === "all";

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // Search is handled by filtering in PostList component
  };

  const getTitle = () => {
    switch (mode) {
      case "my":
        return _("posts.myPosts");
      case "liked":
        return _("posts.likedPosts");
      case "favorited":
        return _("posts.savedPosts");
      case "commented":
        return _("posts.commentedPosts");
      default:
        return _("posts.latestArticles");
    }
  };

  const getSubtitle = () => {
    switch (mode) {
      case "my":
        return _("posts.manageContent");
      case "liked":
        return _("posts.likedSubtitle");
      case "favorited":
        return _("posts.savedSubtitle");
      case "commented":
        return _("posts.commentedSubtitle");
      default:
        return null;
    }
  };

  return (
    <div className={`space-y-16 ${mode === "all" ? "-mt-3 sm:mt-0" : ""}`}>
      {/* Hero Section (Only show on 'all' posts, hidden on mobile) */}
      {showHero && (
        <section className="hidden md:flex relative rounded-3xl p-4 sm:p-6 md:p-12 overflow-hidden border border-slate-200 dark:border-slate-700/50 shadow-sm dark:shadow-2xl min-h-[280px] md:min-h-[320px] items-center">
          {/* Premium Gradient Background - Light/Dark */}
          <div className="absolute inset-0 bg-linear-to-br from-slate-50 via-slate-50 to-slate-100 dark:from-slate-900 dark:via-slate-950 dark:to-slate-900"></div>

          {/* Animated Mesh Gradient Orbs - Gentle movement */}
          <motion.div
            animate={{
              scale: [1, 1.15, 1],
              opacity: [0.3, 0.4, 0.3],
            }}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-[-20%] right-[-10%] w-[500px] h-[500px] bg-linear-to-br from-slate-300/40 to-slate-400/30 dark:from-slate-900/30 dark:to-slate-800/20 rounded-full blur-3xl"
          />
          <motion.div
            animate={{
              scale: [1, 1.1, 1],
              opacity: [0.25, 0.35, 0.25],
            }}
            transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
            className="absolute bottom-[-30%] left-[-10%] w-[400px] h-[400px] bg-linear-to-tr from-cyan-300/30 to-blue-400/30 dark:from-cyan-500/20 dark:to-blue-600/20 rounded-full blur-3xl"
          />

          {/* Grid Pattern Overlay */}
          <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.03)_1px,transparent_1px)] dark:bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:60px_60px]"></div>

          {/* Radial Glow */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-radial from-slate-300/20 dark:from-slate-900/10 via-transparent to-transparent rounded-full"></div>

          {/* Animated Dots/Stars - Both modes */}
          <div className="absolute inset-0">
            {[
              { left: 10, top: 20 },
              { left: 25, top: 40 },
              { left: 45, top: 15 },
              { left: 65, top: 55 },
              { left: 80, top: 30 },
              { left: 90, top: 70 },
              { left: 15, top: 75 },
              { left: 55, top: 85 },
              { left: 35, top: 60 },
              { left: 70, top: 10 },
              { left: 5, top: 50 },
              { left: 95, top: 45 },
            ].map((star, i) => (
              <motion.div
                key={i}
                className="absolute w-1 h-1 bg-slate-400/50 dark:bg-white/40 rounded-full"
                style={{ left: `${star.left}%`, top: `${star.top}%` }}
                animate={{ opacity: [0.2, 0.6, 0.2] }}
                transition={{
                  duration: 2 + (i % 3),
                  repeat: Infinity,
                  delay: i * 0.3,
                }}
              />
            ))}
          </div>

          {/* Content */}
          <div className="relative z-10 max-w-2xl">
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-black dark:text-slate-300 font-medium mb-4 tracking-wide"
            >
              {_("hero.slogan")}
            </motion.p>
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-3xl md:text-5xl font-serif font-bold text-slate-900 dark:text-white mb-4 leading-tight"
            >
              {_("hero.title")}
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-slate-600 dark:text-slate-400 text-base md:text-lg max-w-lg"
            >
              {_("hero.description")}
            </motion.p>
          </div>

          {/* Decorative Corner Elements */}
          <div className="absolute top-8 right-8 w-20 h-20 border border-slate-300 dark:border-white/10 rounded-full"></div>
          <div className="absolute top-12 right-12 w-12 h-12 border border-slate-200 dark:border-white/5 rounded-full"></div>
          <div className="absolute bottom-8 left-8 w-16 h-16 border border-slate-300 dark:border-white/10 rounded-lg rotate-45"></div>
        </section>
      )}

      {/* Main Content Layout */}
      <div>
        {/* Header with Title, Tabs, and New Post Button */}
        <div className="flex flex-row justify-between items-start sm:items-center gap-4 mb-4 sm:mb-6">
          <div className="flex-1 min-w-0">
            {/* Hide "Latest Articles" title on mobile for "all" mode */}
            <h2
              className={`text-xl sm:text-2xl font-bold text-slate-900 dark:text-white ${
                mode === "all" ? "hidden sm:block" : ""
              }`}
            >
              {getTitle()}
            </h2>
            {getSubtitle() && (
              <p className="text-slate-500 mt-1 text-sm sm:text-base">
                {getSubtitle()}
              </p>
            )}
          </div>

          {/* New Post Button - Top Right */}
          {isMyPosts && (
            <Link
              to="/posts/new"
              className="inline-flex items-center px-3 py-2 sm:px-4 sm:py-2.5 rounded-xl bg-black dark:bg-white dark:text-black hover:bg-slate-900 dark:hover:bg-slate-100 text-white text-xs sm:text-sm font-medium transition-colors shrink-0"
            >
              <Plus
                size={16}
                className="sm:w-[18px] sm:h-[18px] mr-1 sm:mr-2"
              />
              <span className="hidden sm:inline">{_("posts.newPost")}</span>
              <span className="sm:hidden">{_("posts.new")}</span>
            </Link>
          )}

          {/* Search Widget - Desktop (Only show when not my posts) */}
          {!isMyPosts && (
            <div className="flex items-center gap-4 w-full sm:w-auto">
              <form
                onSubmit={handleSearch}
                className="hidden sm:block relative flex-1 sm:flex-initial sm:w-64"
              >
                <Search
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
                  size={20}
                />
                <input
                  type="text"
                  value={searchKeyword}
                  onChange={(e) => setSearchKeyword(e.target.value)}
                  placeholder={_("posts.searchPlaceholder")}
                  className="w-full bg-white dark:bg-[#161616] border border-slate-200 dark:border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-black dark:ring-slate-800 focus:border-transparent placeholder-slate-500 dark:placeholder-slate-600"
                />
              </form>

              {/* Mobile Search - Expandable from right (Floating) */}
              <div className="sm:hidden fixed top-16 right-4 z-30 flex items-center gap-3">
                <AnimatePresence>
                  {isSearchOpen && (
                    <motion.form
                      initial={{ width: 0, opacity: 0, x: 20 }}
                      animate={{ width: 280, opacity: 1, x: 0 }}
                      exit={{ width: 0, opacity: 0, x: 20 }}
                      transition={{
                        type: "spring",
                        damping: 25,
                        stiffness: 200,
                      }}
                      onSubmit={handleSearch}
                      className="relative overflow-hidden"
                    >
                      <div className="flex items-center bg-white dark:bg-[#161616] border border-slate-200 dark:border-slate-800 rounded-full pl-4 pr-4 py-3 h-[56px]">
                        <Search className="text-slate-500 shrink-0" size={20} />
                        <input
                          type="text"
                          value={searchKeyword}
                          onChange={(e) => setSearchKeyword(e.target.value)}
                          placeholder={_("posts.searchPlaceholder")}
                          autoFocus
                          className="ml-3 bg-transparent text-slate-900 dark:text-white focus:outline-none placeholder-slate-500 dark:placeholder-slate-600 w-full"
                        />
                      </div>
                    </motion.form>
                  )}
                </AnimatePresence>
                <button
                  onClick={() => {
                    if (isSearchOpen && !searchKeyword.trim()) {
                      setIsSearchOpen(false);
                    } else {
                      setIsSearchOpen(true);
                    }
                  }}
                  className={`p-3 rounded-full transition-all shrink-0 ${
                    isSearchOpen
                      ? "bg-slate-600 hover:bg-slate-500 text-white"
                      : "bg-black dark:bg-white dark:text-black hover:bg-slate-900 dark:hover:bg-slate-100 text-white"
                  }`}
                >
                  {isSearchOpen ? <X size={20} /> : <Search size={20} />}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Tab Switcher - Only show for my posts */}
        {isMyPosts && (
          <div className="flex items-center gap-2 mb-6 border-b border-slate-200 dark:border-slate-800">
            <button
              onClick={() => setPublishFilter("all")}
              className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 ${
                publishFilter === "all"
                  ? "border-black dark:border-white text-black dark:text-white"
                  : "border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"
              }`}
            >
              {_("posts.all")}
            </button>
            <button
              onClick={() => setPublishFilter("published")}
              className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 ${
                publishFilter === "published"
                  ? "border-black dark:border-white text-black dark:text-white"
                  : "border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"
              }`}
            >
              {_("posts.published")}
            </button>
            <button
              onClick={() => setPublishFilter("draft")}
              className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 ${
                publishFilter === "draft"
                  ? "border-black dark:border-white text-black dark:text-white"
                  : "border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"
              }`}
            >
              {_("posts.draft")}
            </button>
          </div>
        )}

        <PostList
          myPosts={isMyPosts}
          likedPosts={isLikedPosts}
          favoritedPosts={isFavoritedPosts}
          commentedPosts={isCommentedPosts}
          searchKeyword={isMyPosts ? "" : searchKeyword}
          publishFilter={isMyPosts ? publishFilter : undefined}
        />
      </div>
    </div>
  );
}
