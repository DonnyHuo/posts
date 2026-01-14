import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../lib/api";
import type { User, Post, UserStats, FollowUser } from "../types";
import {
  User as UserIcon,
  Mail,
  Calendar,
  LogOut,
  Save,
  Heart,
  Bookmark,
  Edit3,
  X,
  Settings,
  Moon,
  Sun,
  Globe,
  MessageCircle,
  Loader2,
  Users,
  UserPlus,
  TrendingUp,
} from "lucide-react";
import { LoadingSpinner } from "../components/LoadingSpinner";
import { AnimatePresence, motion } from "framer-motion";
import { useTheme } from "../hooks/useTheme";

// Cloudinary configuration
const CLOUDINARY_CONFIG = {
  cloudName: import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || "difjqmokp",
  uploadPreset:
    import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || "unsigned_preset",
};

type TabType = "likes" | "favorites" | "comments" | "followers" | "following" | "stats";

export default function Profile() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editForm, setEditForm] = useState({ name: "", avatar: "", bio: "" });
  const [stats, setStats] = useState<UserStats | null>(null);
  const [followers, setFollowers] = useState<FollowUser[]>([]);
  const [following, setFollowing] = useState<FollowUser[]>([]);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  // Edit modal
  const [isEditing, setIsEditing] = useState(false);

  // Settings modal/drawer
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Theme
  const { theme, toggleTheme } = useTheme();

  // Disable body scroll when modal/drawer is open
  useEffect(() => {
    if (isSettingsOpen || isEditing) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isSettingsOpen, isEditing]);

  // Likes, Favorites, and Comments
  const [activeTab, setActiveTab] = useState<TabType>("likes");
  const [likedPosts, setLikedPosts] = useState<Post[]>([]);
  const [favoritedPosts, setFavoritedPosts] = useState<Post[]>([]);
  const [commentedPosts, setCommentedPosts] = useState<Post[]>([]);
  const [loadingLists, setLoadingLists] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/dashboard/all");
        return;
      }

      try {
        const res = await api.get("/auth/me");
        setUser(res.data);
        setEditForm({
          name: res.data.name || "",
          avatar: res.data.avatar || "",
          bio: res.data.bio || "",
        });

        // Fetch stats
        const statsRes = await api.get("/users/stats");
        setStats(statsRes.data);

        // Fetch followers and following
        const [followersRes, followingRes] = await Promise.all([
          api.get("/follows/my/followers"),
          api.get("/follows/my/following"),
        ]);
        setFollowers(followersRes.data.data || []);
        setFollowing(followingRes.data.data || []);
      } catch (err) {
        console.error("Failed to fetch profile", err);
        localStorage.removeItem("token");
        navigate("/dashboard/all");
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [navigate]);

  // 从响应中提取文章数组
  const extractPosts = (response: unknown, type: string): Post[] => {
    console.log(`Extracting ${type} posts from:`, response);

    if (Array.isArray(response)) {
      console.log(`${type}: Found array, length:`, response.length);
      return response;
    }

    if (response && typeof response === "object") {
      const obj = response as Record<string, unknown>;
      // 尝试常见的分页格式字段
      if (Array.isArray(obj.data)) {
        console.log(`${type}: Found data array, length:`, obj.data.length);
        return obj.data;
      }
      if (Array.isArray(obj.posts)) {
        console.log(`${type}: Found posts array, length:`, obj.posts.length);
        return obj.posts;
      }
      if (Array.isArray(obj.items)) {
        console.log(`${type}: Found items array, length:`, obj.items.length);
        return obj.items;
      }
      if (Array.isArray(obj.list)) {
        console.log(`${type}: Found list array, length:`, obj.list.length);
        return obj.list;
      }
      console.warn(
        `${type}: No array found in response object:`,
        Object.keys(obj)
      );
    }

    console.warn(`${type}: Returning empty array`);
    return [];
  };

  // Fetch liked, favorited, and commented posts
  useEffect(() => {
    const fetchLists = async () => {
      const token = localStorage.getItem("token");
      if (!token) return;

      setLoadingLists(true);
      try {
        // Fetch all three lists in parallel
        const [likesRes, favoritesRes, commentsRes] = await Promise.all([
          api.get("/posts/liked").catch((err) => {
            console.error("Failed to fetch liked posts:", err);
            console.error("Error details:", err.response?.data || err.message);
            return { data: { data: [] } };
          }),
          api.get("/posts/favorited").catch((err) => {
            console.error("Failed to fetch favorited posts:", err);
            console.error("Error details:", err.response?.data || err.message);
            return { data: { data: [] } };
          }),
          api.get("/posts/commented").catch((err) => {
            console.error("Failed to fetch commented posts:", err);
            console.error("Error details:", err.response?.data || err.message);
            return { data: { data: [] } };
          }),
        ]);

        console.log("=== API Responses ===");
        console.log("Liked API response:", likesRes.data);
        console.log("Favorited API response:", favoritesRes.data);
        console.log("Commented API response:", commentsRes.data);

        // Extract posts from responses
        const liked = extractPosts(likesRes.data, "Liked");
        const favorited = extractPosts(favoritesRes.data, "Favorited");
        const commented = extractPosts(commentsRes.data, "Commented");

        console.log("=== Extracted Posts ===");
        console.log("Liked posts:", liked.length);
        console.log("Favorited posts:", favorited.length);
        console.log("Commented posts:", commented.length);

        setLikedPosts(liked);
        setFavoritedPosts(favorited);
        setCommentedPosts(commented);
      } catch (err) {
        console.error("Failed to fetch lists", err);
        setLikedPosts([]);
        setFavoritedPosts([]);
        setCommentedPosts([]);
      } finally {
        setLoadingLists(false);
      }
    };
    fetchLists();
  }, []);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setSaving(true);
    setMessage(null);

    try {
      await api.patch(`/users/${user.id}`, editForm);
      setMessage({ type: "success", text: "Profile updated successfully!" });
      // 保存成功后刷新页面以更新 Layout 中的用户信息
      setTimeout(() => {
        window.location.reload();
      }, 500);
    } catch (err) {
      console.error("Update profile failed:", err);
      setMessage({ type: "error", text: "Failed to update profile" });
    } finally {
      setSaving(false);
    }
  };

  const uploadAvatar = async (file: File) => {
    setUploadingAvatar(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("upload_preset", CLOUDINARY_CONFIG.uploadPreset);

      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUDINARY_CONFIG.cloudName}/image/upload`,
        { method: "POST", body: formData }
      );

      if (!response.ok) throw new Error("Upload failed");

      const data = await response.json();
      setEditForm({ ...editForm, avatar: data.secure_url });
    } catch (error) {
      console.error("Failed to upload avatar:", error);
      setMessage({ type: "error", text: "Failed to upload image" });
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      uploadAvatar(file);
    }
  };

  const openEditModal = () => {
    // 重置表单为当前用户数据
    setEditForm({
      name: user?.name || "",
      avatar: user?.avatar || "",
      bio: user?.bio || "",
    });
    setMessage(null);
    setIsEditing(true);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/dashboard/all");
    // 强制刷新页面以更新 Layout 状态
    window.location.reload();
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div>
      {/* Profile Header */}
      <div className="-mx-3 -mt-6 sm:mt-0 sm:mx-0 bg-white dark:bg-[#161616] sm:rounded-2xl border-b sm:border border-slate-200 dark:border-slate-800 overflow-hidden mb-8">
        <div className="h-32 sm:h-36 relative overflow-hidden bg-gradient-to-b from-zinc-900 via-zinc-800 to-zinc-700 dark:from-black dark:via-zinc-900 dark:to-zinc-800">
          {/* Noise texture overlay */}
          <div className="absolute inset-0 opacity-[0.15] bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIj48ZmlsdGVyIGlkPSJhIiB4PSIwIiB5PSIwIj48ZmVUdXJidWxlbmNlIGJhc2VGcmVxdWVuY3k9Ii43NSIgc3RpdGNoVGlsZXM9InN0aXRjaCIgdHlwZT0iZnJhY3RhbE5vaXNlIi8+PGZlQ29sb3JNYXRyaXggdHlwZT0ic2F0dXJhdGUiIHZhbHVlcz0iMCIvPjwvZmlsdGVyPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbHRlcj0idXJsKCNhKSIvPjwvc3ZnPg==')]"></div>
          {/* Subtle glow */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[200%] h-32 bg-gradient-to-b from-white/[0.08] to-transparent"></div>
          {/* Bottom fade */}
          <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-white/[0.03] to-transparent"></div>
          {/* Action Buttons */}
          <div className="absolute top-4 right-4 flex items-center gap-2">
            <button
              onClick={openEditModal}
              className="p-2.5 rounded-xl bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white transition-all"
              title="Edit Profile"
            >
              <Edit3 size={18} />
            </button>
            <button
              onClick={() => setIsSettingsOpen(true)}
              className="p-2.5 rounded-xl bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white transition-all"
              title="Settings"
            >
              <Settings size={18} />
            </button>
            <button
              onClick={handleLogout}
              className="p-2.5 rounded-xl bg-white/20 hover:bg-red-500/80 backdrop-blur-sm text-white transition-all"
              title="Sign Out"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>
        <div className="px-6 sm:px-8 pb-6 sm:pb-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4 sm:gap-6 -mt-16">
            <div className="relative">
              {user?.avatar ? (
                <img
                  src={user.avatar}
                  alt="Avatar"
                  className="w-28 h-28 sm:w-32 sm:h-32 rounded-2xl object-cover border-4 border-white dark:border-[#111111] shadow-lg"
                />
              ) : (
                <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-2xl bg-slate-200 dark:bg-slate-700 border-4 border-white dark:border-[#111111] shadow-lg flex items-center justify-center">
                  <UserIcon
                    size={40}
                    className="text-slate-400 dark:text-slate-500"
                  />
                </div>
              )}
            </div>
            <div className="flex-1 pt-2 sm:pt-0">
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
                {user?.name || "User"}
              </h1>
              <div className="flex flex-wrap items-center gap-3 sm:gap-4 mt-2 text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                <span className="flex items-center gap-1">
                  <Mail size={14} />
                  <span className="truncate max-w-[180px] sm:max-w-none">
                    {user?.email}
                  </span>
                </span>
                <span className="flex items-center gap-1">
                  <Calendar size={14} />
                  Joined{" "}
                  {user?.createdAt
                    ? new Date(user.createdAt).toLocaleDateString()
                    : "Unknown"}
                </span>
              </div>
              {user?.bio && (
                <p className="mt-3 text-sm text-slate-600 dark:text-slate-400 max-w-md">
                  {user.bio}
                </p>
              )}
              {/* Stats Row */}
              {stats && (
                <div className="flex items-center gap-6 mt-4 text-sm">
                  <div className="flex items-center gap-1.5">
                    <Users size={16} className="text-slate-400" />
                    <span className="font-semibold text-slate-900 dark:text-white">{stats.followersCount}</span>
                    <span className="text-slate-500">followers</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <UserPlus size={16} className="text-slate-400" />
                    <span className="font-semibold text-slate-900 dark:text-white">{stats.followingCount}</span>
                    <span className="text-slate-500">following</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Heart size={16} className="text-red-400" />
                    <span className="font-semibold text-slate-900 dark:text-white">{stats.likesReceived}</span>
                    <span className="text-slate-500">likes</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Edit Profile Modal */}
      <AnimatePresence>
        {isEditing && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setIsEditing(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-[#161616] rounded-2xl border border-slate-200 dark:border-slate-800 w-full max-w-md shadow-2xl"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-800">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Edit3 size={20} className="text-black dark:text-slate-200" />
                  Edit Profile
                </h2>
                <button
                  onClick={() => setIsEditing(false)}
                  className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Modal Body */}
              <form onSubmit={handleUpdateProfile} className="p-6 space-y-5">
                {message && (
                  <div
                    className={`px-4 py-3 rounded-lg text-sm ${
                      message.type === "success"
                        ? "bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800"
                        : "bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800"
                    }`}
                  >
                    {message.text}
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Display Name
                  </label>
                  <input
                    type="text"
                    value={editForm.name}
                    onChange={(e) =>
                      setEditForm({ ...editForm, name: e.target.value })
                    }
                    className="w-full bg-slate-50 dark:bg-black border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:ring-2 focus:ring-black dark:ring-slate-800 focus:border-transparent outline-none transition-all"
                    placeholder="Your display name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Bio / Personal Signature
                  </label>
                  <textarea
                    value={editForm.bio}
                    onChange={(e) =>
                      setEditForm({ ...editForm, bio: e.target.value })
                    }
                    rows={3}
                    maxLength={200}
                    className="w-full bg-slate-50 dark:bg-black border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:ring-2 focus:ring-black dark:ring-slate-800 focus:border-transparent outline-none transition-all resize-none"
                    placeholder="Write something about yourself..."
                  />
                  <p className="text-xs text-slate-400 mt-1">{editForm.bio.length}/200</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Avatar
                  </label>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  <div
                    onClick={() =>
                      !uploadingAvatar && fileInputRef.current?.click()
                    }
                    className={`w-20 h-20 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-700 flex items-center justify-center cursor-pointer hover:border-slate-400 dark:hover:border-slate-600 transition-colors overflow-hidden ${
                      uploadingAvatar ? "pointer-events-none" : ""
                    }`}
                  >
                    {uploadingAvatar ? (
                      <Loader2
                        size={24}
                        className="text-slate-400 animate-spin"
                      />
                    ) : editForm.avatar ? (
                      <img
                        src={editForm.avatar}
                        alt="Avatar"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <UserIcon size={28} className="text-slate-400" />
                    )}
                  </div>
                  <p className="text-xs text-slate-400 mt-2">Click to upload</p>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="flex-1 px-4 py-3 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 font-medium rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-black hover:bg-slate-900 disabled:opacity-50 text-white font-medium rounded-xl transition-all"
                  >
                    <Save size={18} />
                    {saving ? "Saving..." : "Save"}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Likes, Favorites & Comments */}
      <div className="mb-8">
        {/* Tabs - Similar to dashboard/my */}
        <div className="flex items-center gap-1 mb-6 border-b border-slate-200 dark:border-slate-800 overflow-x-auto">
          <button
            onClick={() => setActiveTab("likes")}
            className={`px-4 py-2.5 text-sm font-medium transition-colors border-b-2 whitespace-nowrap ${
              activeTab === "likes"
                ? "border-black dark:border-white text-black dark:text-white"
                : "border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"
            }`}
          >
            Liked
            <span
              className={`ml-1 ${
                activeTab === "likes"
                  ? ""
                  : "text-slate-400 dark:text-slate-500"
              }`}
            >
              ({likedPosts.length})
            </span>
          </button>
          <button
            onClick={() => setActiveTab("favorites")}
            className={`px-4 py-2.5 text-sm font-medium transition-colors border-b-2 whitespace-nowrap ${
              activeTab === "favorites"
                ? "border-black dark:border-white text-black dark:text-white"
                : "border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"
            }`}
          >
            Saved
            <span
              className={`ml-1 ${
                activeTab === "favorites"
                  ? ""
                  : "text-slate-400 dark:text-slate-500"
              }`}
            >
              ({favoritedPosts.length})
            </span>
          </button>
          <button
            onClick={() => setActiveTab("comments")}
            className={`px-4 py-2.5 text-sm font-medium transition-colors border-b-2 whitespace-nowrap ${
              activeTab === "comments"
                ? "border-black dark:border-white text-black dark:text-white"
                : "border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"
            }`}
          >
            Commented
            <span
              className={`ml-1 ${
                activeTab === "comments"
                  ? ""
                  : "text-slate-400 dark:text-slate-500"
              }`}
            >
              ({commentedPosts.length})
            </span>
          </button>
        </div>

        {/* List Content */}
        <div>
          {loadingLists ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-2 border-slate-200 dark:border-slate-800 border-t-black dark:border-t-slate-400 rounded-full animate-spin"></div>
            </div>
          ) : (
            <>
              {/* Liked Posts */}
              {activeTab === "likes" && (
                <>
                  {likedPosts.length === 0 ? (
                    <div className="text-center py-12">
                      <Heart
                        size={48}
                        className="mx-auto text-slate-300 dark:text-slate-600 mb-4"
                      />
                      <p className="text-slate-500 dark:text-slate-400">
                        No liked posts yet
                      </p>
                      <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">
                        Posts you like will appear here
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 md:gap-6">
                      {likedPosts.map((post, index) => (
                        <motion.div
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.05 }}
                          key={post.id}
                          onClick={() => navigate(`/posts/${post.id}`)}
                          className="group flex flex-col bg-white dark:bg-[#161616] rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 hover:border-slate-400 dark:hover:border-slate-700 transition-all hover:shadow-2xl hover:shadow-slate-200/50 dark:hover:shadow-black/50 cursor-pointer"
                        >
                          <div className="h-48 sm:h-56 lg:h-64 relative overflow-hidden">
                            {post.coverUrls && post.coverUrls.length > 0 ? (
                              <>
                                <img
                                  src={post.coverUrls[0]}
                                  alt={post.title}
                                  className="w-full h-full object-cover transition-transform group-hover:scale-105"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
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
                          </div>
                          <div className="p-3 sm:p-4 lg:p-6 flex-1 flex flex-col">
                            <h3 className="text-sm sm:text-base lg:text-xl font-bold text-slate-900 dark:text-white mb-2 sm:mb-3 line-clamp-2 leading-tight group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors">
                              {post.title}
                            </h3>
                            <div
                              className="content-preview text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed mb-3 sm:mb-4 flex-1 prose prose-sm dark:prose-invert max-w-none"
                              dangerouslySetInnerHTML={{ __html: post.content }}
                            />
                            <div className="flex items-center justify-between pt-2 sm:pt-4 border-t border-slate-100 dark:border-slate-700/50 sm:mt-auto">
                              <div className="flex items-center gap-1.5 sm:gap-2 min-w-0 flex-1">
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
                              <div className="flex items-center gap-1 text-[10px] sm:text-xs text-slate-500 dark:text-slate-400">
                                <Heart
                                  size={12}
                                  className="fill-current text-red-500 sm:w-4 sm:h-4"
                                />
                                {post._count?.likes || 0}
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </>
              )}

              {/* Favorited Posts */}
              {activeTab === "favorites" && (
                <>
                  {favoritedPosts.length === 0 ? (
                    <div className="text-center py-12">
                      <Bookmark
                        size={48}
                        className="mx-auto text-slate-300 dark:text-slate-600 mb-4"
                      />
                      <p className="text-slate-500 dark:text-slate-400">
                        No saved posts yet
                      </p>
                      <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">
                        Posts you save will appear here
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 md:gap-6">
                      {favoritedPosts.map((post, index) => (
                        <motion.div
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.05 }}
                          key={post.id}
                          onClick={() => navigate(`/posts/${post.id}`)}
                          className="group flex flex-col bg-white dark:bg-[#161616] rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 hover:border-slate-400 dark:hover:border-slate-700 transition-all hover:shadow-2xl hover:shadow-slate-200/50 dark:hover:shadow-black/50 cursor-pointer"
                        >
                          <div className="h-48 sm:h-56 lg:h-64 relative overflow-hidden">
                            {post.coverUrls && post.coverUrls.length > 0 ? (
                              <>
                                <img
                                  src={post.coverUrls[0]}
                                  alt={post.title}
                                  className="w-full h-full object-cover transition-transform group-hover:scale-105"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
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
                          </div>
                          <div className="p-3 sm:p-4 lg:p-6 flex-1 flex flex-col">
                            <h3 className="text-sm sm:text-base lg:text-xl font-bold text-slate-900 dark:text-white mb-2 sm:mb-3 line-clamp-2 leading-tight group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors">
                              {post.title}
                            </h3>
                            <div
                              className="content-preview text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed mb-3 sm:mb-4 flex-1 prose prose-sm dark:prose-invert max-w-none"
                              dangerouslySetInnerHTML={{ __html: post.content }}
                            />
                            <div className="flex items-center justify-between pt-2 sm:pt-4 border-t border-slate-100 dark:border-slate-700/50 sm:mt-auto">
                              <div className="flex items-center gap-1.5 sm:gap-2 min-w-0 flex-1">
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
                              <div className="flex items-center gap-1 text-[10px] sm:text-xs text-amber-500">
                                <Bookmark
                                  size={12}
                                  className="fill-current sm:w-4 sm:h-4"
                                />
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </>
              )}

              {/* Commented Posts */}
              {activeTab === "comments" && (
                <>
                  {commentedPosts.length === 0 ? (
                    <div className="text-center py-12">
                      <MessageCircle
                        size={48}
                        className="mx-auto text-slate-300 dark:text-slate-600 mb-4"
                      />
                      <p className="text-slate-500 dark:text-slate-400">
                        No commented posts yet
                      </p>
                      <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">
                        Posts you comment on will appear here
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 md:gap-6">
                      {commentedPosts.map((post, index) => (
                        <motion.div
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.05 }}
                          key={post.id}
                          onClick={() => navigate(`/posts/${post.id}`)}
                          className="group flex flex-col bg-white dark:bg-[#161616] rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 hover:border-slate-400 dark:hover:border-slate-700 transition-all hover:shadow-2xl hover:shadow-slate-200/50 dark:hover:shadow-black/50 cursor-pointer"
                        >
                          <div className="h-48 sm:h-56 lg:h-64 relative overflow-hidden">
                            {post.coverUrls && post.coverUrls.length > 0 ? (
                              <>
                                <img
                                  src={post.coverUrls[0]}
                                  alt={post.title}
                                  className="w-full h-full object-cover transition-transform group-hover:scale-105"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
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
                          </div>
                          <div className="p-3 sm:p-4 lg:p-6 flex-1 flex flex-col">
                            <h3 className="text-sm sm:text-base lg:text-xl font-bold text-slate-900 dark:text-white mb-2 sm:mb-3 line-clamp-2 leading-tight group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors">
                              {post.title}
                            </h3>
                            <div
                              className="content-preview text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed mb-3 sm:mb-4 flex-1 prose prose-sm dark:prose-invert max-w-none"
                              dangerouslySetInnerHTML={{ __html: post.content }}
                            />
                            <div className="flex items-center justify-between pt-2 sm:pt-4 border-t border-slate-100 dark:border-slate-700/50 sm:mt-auto">
                              <div className="flex items-center gap-1.5 sm:gap-2 min-w-0 flex-1">
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
                              <div className="flex items-center gap-1 text-[10px] sm:text-xs text-blue-500">
                                <MessageCircle
                                  size={12}
                                  className="fill-current sm:w-4 sm:h-4"
                                />
                                {post._count?.comments || 0}
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </>
          )}
        </div>
      </div>

      {/* Settings Modal (Desktop) / Drawer (Mobile) */}
      <AnimatePresence>
        {isSettingsOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSettingsOpen(false)}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
            />

            {/* Settings Panel - Mobile: Drawer from right */}
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="md:hidden fixed top-0 right-0 h-full w-2/3 bg-white dark:bg-[#161616] shadow-2xl z-50"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-slate-800">
                <span className="font-semibold text-slate-900 dark:text-white">
                  Settings
                </span>
                <button
                  onClick={() => setIsSettingsOpen(false)}
                  className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Content */}
              <div className="py-2">
                {/* Theme Toggle */}
                <button
                  onClick={toggleTheme}
                  className="w-full flex items-center justify-between px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    {theme === "dark" ? <Moon size={18} /> : <Sun size={18} />}
                    <span className="text-sm text-slate-900 dark:text-white">
                      {theme === "dark" ? "Dark Mode" : "Light Mode"}
                    </span>
                  </div>
                  <div
                    className={`w-9 h-5 rounded-full relative ${
                      theme === "dark" ? "bg-black" : "bg-slate-300"
                    }`}
                  >
                    <div
                      className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                        theme === "dark" ? "translate-x-4" : ""
                      }`}
                    />
                  </div>
                </button>

                {/* Language */}
                <div className="flex items-center justify-between px-4 py-3 opacity-50">
                  <div className="flex items-center gap-3">
                    <Globe size={18} />
                    <span className="text-sm text-slate-900 dark:text-white">
                      Language
                    </span>
                  </div>
                  <span className="text-xs text-slate-400">English</span>
                </div>
              </div>
            </motion.div>

            {/* Settings Modal - Desktop: Centered */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="hidden md:block fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-xs bg-white dark:bg-[#161616] shadow-2xl z-50 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-slate-800">
                <span className="font-semibold text-slate-900 dark:text-white">
                  Settings
                </span>
                <button
                  onClick={() => setIsSettingsOpen(false)}
                  className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Content */}
              <div className="py-2">
                {/* Theme Toggle */}
                <button
                  onClick={toggleTheme}
                  className="w-full flex items-center justify-between px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    {theme === "dark" ? <Moon size={18} /> : <Sun size={18} />}
                    <span className="text-sm text-slate-900 dark:text-white">
                      {theme === "dark" ? "Dark Mode" : "Light Mode"}
                    </span>
                  </div>
                  <div
                    className={`w-9 h-5 rounded-full relative ${
                      theme === "dark" ? "bg-black" : "bg-slate-300"
                    }`}
                  >
                    <div
                      className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                        theme === "dark" ? "translate-x-4" : ""
                      }`}
                    />
                  </div>
                </button>

                {/* Language */}
                <div className="flex items-center justify-between px-4 py-3 opacity-50">
                  <div className="flex items-center gap-3">
                    <Globe size={18} />
                    <span className="text-sm text-slate-900 dark:text-white">
                      Language
                    </span>
                  </div>
                  <span className="text-xs text-slate-400">English</span>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
