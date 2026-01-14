import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { api } from "../lib/api";
import type { Post } from "../types";
import { Search, ArrowRight } from "lucide-react";
import { LoadingSpinner } from "../components/LoadingSpinner";
import { motion } from "framer-motion";

export default function SearchResults() {
  const [searchParams] = useSearchParams();
  const keyword = searchParams.get("q") || "";
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchInput, setSearchInput] = useState(keyword);

  useEffect(() => {
    const fetchSearchResults = async () => {
      if (!keyword.trim()) {
        setPosts([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const res = await api.get(`/posts/search?q=${encodeURIComponent(keyword)}`);
        const fetchedPosts = res.data.data || res.data || [];
        setPosts(fetchedPosts);
      } catch (err) {
        console.error("Failed to fetch search results", err);
        setPosts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchSearchResults();
  }, [keyword]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchInput.trim()) {
      window.location.href = `/search?q=${encodeURIComponent(searchInput.trim())}`;
    }
  };

  return (
    <div className="space-y-8">
      {/* Search Header */}
      <div className="bg-white dark:bg-[#161616] rounded-2xl border border-slate-200 dark:border-slate-800 p-8">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-6">
          Search Results
        </h1>
        <form onSubmit={handleSearch} className="relative max-w-2xl">
          <Search
            className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
            size={24}
          />
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search posts by title, content, or author..."
            className="w-full bg-slate-50 dark:bg-black border border-slate-200 dark:border-slate-800 rounded-xl pl-14 pr-4 py-4 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-black dark:ring-slate-800 focus:border-transparent placeholder-slate-400 dark:placeholder-slate-500 text-lg"
          />
        </form>
        {keyword && (
          <p className="mt-4 text-slate-500 dark:text-slate-400">
            Found <span className="font-semibold text-slate-900 dark:text-white">{posts.length}</span>{" "}
            {posts.length === 1 ? "result" : "results"} for{" "}
            <span className="font-semibold text-black dark:text-slate-200 dark:text-slate-400 dark:text-slate-300">"{keyword}"</span>
          </p>
        )}
      </div>

      {/* Search Results */}
      {loading ? (
        <LoadingSpinner />
      ) : keyword.trim() ? (
        posts.length === 0 ? (
          <div className="text-center py-20 bg-white dark:bg-[#161616] rounded-2xl border border-slate-200 dark:border-slate-800">
            <div className="text-6xl mb-4 opacity-50">🔍</div>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
              No results found
            </h3>
            <p className="text-slate-500 dark:text-slate-400">
              Try different keywords or check your spelling
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {posts.map((post, index) => (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                key={post.id}
                className="group flex flex-col bg-white dark:bg-[#161616] rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 hover:border-slate-400 dark:hover:border-slate-600 transition-all hover:shadow-2xl hover:shadow-slate-200/50 dark:hover:shadow-black/50"
              >
                {/* Card Header / Cover Image */}
                <div className="h-48 relative overflow-hidden">
                  {post.coverUrls && post.coverUrls.length > 0 ? (
                    <>
                      <img
                        src={post.coverUrls[0]}
                        alt={post.title}
                        className="w-full h-full object-cover transition-transform group-hover:scale-105"
                        onError={(e) => {
                          // Fallback to gradient if image fails to load
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                          const parent = target.parentElement;
                          if (parent) {
                            parent.className += ' bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-800';
                          }
                        }}
                      />
                      {/* Overlay for better text readability */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
                      
                      {/* Multi-image indicator */}
                      {post.coverUrls.length > 1 && (
                        <div className="absolute bottom-2 right-2 flex items-center gap-1 bg-black/60 backdrop-blur-sm text-white text-[10px] px-1.5 py-0.5 rounded">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          {post.coverUrls.length}
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="h-full bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-800 relative p-6 flex flex-col justify-between">
                      <span className="bg-green-100 dark:bg-green-500/10 text-green-700 dark:text-green-400 text-xs font-bold px-2 py-1 rounded uppercase tracking-wide border border-green-200 dark:border-green-500/20 self-start">
                        Article
                      </span>
                      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-slate-300 dark:text-slate-600 font-serif font-bold text-6xl opacity-20 select-none">
                        {index + 1}
                      </div>
                    </div>
                  )}
                  
                  {/* Badges */}
                  <div className="absolute top-3 left-3 right-3 flex justify-between items-start z-10">
                    <span className="bg-green-100 dark:bg-green-500/10 text-green-700 dark:text-green-400 text-xs font-bold px-2 py-1 rounded uppercase tracking-wide border border-green-200 dark:border-green-500/20">
                      Article
                    </span>
                    {!post.published && (
                      <span className="bg-yellow-100 dark:bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 text-xs font-bold px-2 py-1 rounded uppercase tracking-wide border border-yellow-200 dark:border-yellow-500/20">
                        Draft
                      </span>
                    )}
                  </div>
                </div>

                <div className="p-6 flex-1 flex flex-col">
                  <Link to={`/posts/${post.id}`}>
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3 line-clamp-2 leading-tight group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors">
                      {post.title}
                    </h3>
                  </Link>

                  <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed line-clamp-3 mb-4 flex-1">
                    {post.content}
                  </p>

                  <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800/50 mt-auto">
                    <div className="flex flex-col">
                      <span className="text-xs font-medium text-slate-900 dark:text-white">
                        {post.author?.name || "Anonymous"}
                      </span>
                      <span className="text-xs text-slate-500 mt-0.5">
                        {new Date(post.createdAt).toLocaleDateString()}
                      </span>
                    </div>

                    <Link
                      to={`/posts/${post.id}`}
                      className="text-slate-400 hover:text-green-600 dark:hover:text-green-400 flex items-center gap-1 text-xs font-medium transition-colors"
                    >
                      Read More
                      <ArrowRight size={14} />
                    </Link>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )
      ) : (
        <div className="text-center py-20 bg-white dark:bg-[#161616] rounded-2xl border border-slate-200 dark:border-slate-800">
          <div className="text-6xl mb-4 opacity-50">🔍</div>
          <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
            Start searching
          </h3>
          <p className="text-slate-500 dark:text-slate-400">
            Enter keywords to search for posts
          </p>
        </div>
      )}
    </div>
  );
}

