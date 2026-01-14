import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api } from "../lib/api";
import type { UserProfile as UserProfileType, Post, FollowUser } from "../types";
import {
  User as UserIcon,
  Calendar,
  ArrowLeft,
  Heart,
  Users,
  UserPlus,
  UserMinus,
  FileText,
} from "lucide-react";
import { LoadingSpinner } from "../components/LoadingSpinner";
import { motion } from "framer-motion";

type TabType = "posts" | "followers" | "following";

export default function UserProfile() {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<UserProfileType | null>(null);
  const [loading, setLoading] = useState(true);
  const [following, setFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);

  const [activeTab, setActiveTab] = useState<TabType>("posts");
  const [posts, setPosts] = useState<Post[]>([]);
  const [followers, setFollowers] = useState<FollowUser[]>([]);
  const [followingList, setFollowingList] = useState<FollowUser[]>([]);
  const [loadingTab, setLoadingTab] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!userId) return;

      try {
        const res = await api.get(`/users/${userId}/public`);
        setProfile(res.data);
        setFollowing(res.data.isFollowing || false);
      } catch (err) {
        console.error("Failed to fetch user profile", err);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [userId]);

  useEffect(() => {
    const fetchTabData = async () => {
      if (!userId) return;

      setLoadingTab(true);
      try {
        if (activeTab === "posts") {
          const res = await api.get(`/users/${userId}/posts`);
          setPosts(res.data.data || []);
        } else if (activeTab === "followers") {
          const res = await api.get(`/follows/followers/${userId}`);
          setFollowers(res.data.data || []);
        } else if (activeTab === "following") {
          const res = await api.get(`/follows/following/${userId}`);
          setFollowingList(res.data.data || []);
        }
      } catch (err) {
        console.error("Failed to fetch tab data", err);
      } finally {
        setLoadingTab(false);
      }
    };
    fetchTabData();
  }, [userId, activeTab]);

  const handleToggleFollow = async () => {
    if (!userId) return;

    const token = localStorage.getItem("token");
    if (!token) {
      alert("Please login to follow users");
      return;
    }

    setFollowLoading(true);
    try {
      const res = await api.post(`/follows/${userId}`);
      setFollowing(res.data.followed);
      if (profile) {
        setProfile({
          ...profile,
          followersCount: profile.followersCount + (res.data.followed ? 1 : -1),
        });
      }
    } catch (err) {
      console.error("Failed to toggle follow", err);
    } finally {
      setFollowLoading(false);
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!profile) {
    return (
      <div className="text-center py-20">
        <UserIcon size={48} className="mx-auto text-slate-300 dark:text-slate-600 mb-4" />
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">User not found</h2>
      </div>
    );
  }

  return (
    <div>
      {/* Back Button */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white mb-6 transition-colors"
      >
        <ArrowLeft size={20} />
        <span className="font-medium">Back</span>
      </button>

      {/* Profile Header */}
      <div className="bg-white dark:bg-[#161616] rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden mb-8">
        <div className="h-32 sm:h-36 relative overflow-hidden bg-gradient-to-b from-zinc-900 via-zinc-800 to-zinc-700 dark:from-black dark:via-zinc-900 dark:to-zinc-800">
          <div className="absolute inset-0 opacity-[0.15] bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIj48ZmlsdGVyIGlkPSJhIiB4PSIwIiB5PSIwIj48ZmVUdXJidWxlbmNlIGJhc2VGcmVxdWVuY3k9Ii43NSIgc3RpdGNoVGlsZXM9InN0aXRjaCIgdHlwZT0iZnJhY3RhbE5vaXNlIi8+PGZlQ29sb3JNYXRyaXggdHlwZT0ic2F0dXJhdGUiIHZhbHVlcz0iMCIvPjwvZmlsdGVyPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbHRlcj0idXJsKCNhKSIvPjwvc3ZnPg==')]"></div>
        </div>
        <div className="px-6 sm:px-8 pb-6 sm:pb-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4 sm:gap-6 -mt-16">
            <div className="relative">
              {profile.avatar ? (
                <img
                  src={profile.avatar}
                  alt="Avatar"
                  className="w-28 h-28 sm:w-32 sm:h-32 rounded-2xl object-cover border-4 border-white dark:border-[#111111] shadow-lg"
                />
              ) : (
                <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-2xl bg-slate-200 dark:bg-slate-700 border-4 border-white dark:border-[#111111] shadow-lg flex items-center justify-center">
                  <UserIcon size={40} className="text-slate-400 dark:text-slate-500" />
                </div>
              )}
            </div>
            <div className="flex-1 pt-2 sm:pt-0">
              <div className="flex items-start justify-between">
                <div>
                  <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
                    {profile.name || "User"}
                  </h1>
                  <div className="flex items-center gap-3 mt-2 text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                    <span className="flex items-center gap-1">
                      <Calendar size={14} />
                      Joined {new Date(profile.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                <button
                  onClick={handleToggleFollow}
                  disabled={followLoading}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all ${
                    following
                      ? "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20 dark:hover:text-red-400"
                      : "bg-black dark:bg-white text-white dark:text-black hover:bg-slate-800 dark:hover:bg-slate-100"
                  } ${followLoading ? "opacity-50" : ""}`}
                >
                  {following ? (
                    <>
                      <UserMinus size={18} />
                      Following
                    </>
                  ) : (
                    <>
                      <UserPlus size={18} />
                      Follow
                    </>
                  )}
                </button>
              </div>
              {profile.bio && (
                <p className="mt-3 text-sm text-slate-600 dark:text-slate-400 max-w-md">
                  {profile.bio}
                </p>
              )}
              {/* Stats Row */}
              <div className="flex items-center gap-6 mt-4 text-sm">
                <button
                  onClick={() => setActiveTab("followers")}
                  className="flex items-center gap-1.5 hover:text-black dark:hover:text-white transition-colors"
                >
                  <Users size={16} className="text-slate-400" />
                  <span className="font-semibold text-slate-900 dark:text-white">{profile.followersCount}</span>
                  <span className="text-slate-500">followers</span>
                </button>
                <button
                  onClick={() => setActiveTab("following")}
                  className="flex items-center gap-1.5 hover:text-black dark:hover:text-white transition-colors"
                >
                  <UserPlus size={16} className="text-slate-400" />
                  <span className="font-semibold text-slate-900 dark:text-white">{profile.followingCount}</span>
                  <span className="text-slate-500">following</span>
                </button>
                <div className="flex items-center gap-1.5">
                  <FileText size={16} className="text-slate-400" />
                  <span className="font-semibold text-slate-900 dark:text-white">{profile.postsCount}</span>
                  <span className="text-slate-500">posts</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 mb-6 border-b border-slate-200 dark:border-slate-800 overflow-x-auto">
        <button
          onClick={() => setActiveTab("posts")}
          className={`px-4 py-2.5 text-sm font-medium transition-colors border-b-2 whitespace-nowrap ${
            activeTab === "posts"
              ? "border-black dark:border-white text-black dark:text-white"
              : "border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"
          }`}
        >
          Posts ({profile.postsCount})
        </button>
        <button
          onClick={() => setActiveTab("followers")}
          className={`px-4 py-2.5 text-sm font-medium transition-colors border-b-2 whitespace-nowrap ${
            activeTab === "followers"
              ? "border-black dark:border-white text-black dark:text-white"
              : "border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"
          }`}
        >
          Followers ({profile.followersCount})
        </button>
        <button
          onClick={() => setActiveTab("following")}
          className={`px-4 py-2.5 text-sm font-medium transition-colors border-b-2 whitespace-nowrap ${
            activeTab === "following"
              ? "border-black dark:border-white text-black dark:text-white"
              : "border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"
          }`}
        >
          Following ({profile.followingCount})
        </button>
      </div>

      {/* Tab Content */}
      {loadingTab ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-2 border-slate-200 dark:border-slate-800 border-t-black dark:border-t-slate-400 rounded-full animate-spin"></div>
        </div>
      ) : (
        <>
          {/* Posts Tab */}
          {activeTab === "posts" && (
            <>
              {posts.length === 0 ? (
                <div className="text-center py-12">
                  <FileText size={48} className="mx-auto text-slate-300 dark:text-slate-600 mb-4" />
                  <p className="text-slate-500 dark:text-slate-400">No posts yet</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 md:gap-6">
                  {posts.map((post, index) => (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      key={post.id}
                      onClick={() => navigate(`/posts/${post.id}`)}
                      className="group flex flex-col bg-white dark:bg-[#161616] rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 hover:border-slate-400 dark:hover:border-slate-700 transition-all hover:shadow-2xl cursor-pointer"
                    >
                      <div className="h-48 relative overflow-hidden">
                        {post.coverUrls && post.coverUrls.length > 0 ? (
                          <>
                            <img src={post.coverUrls[0]} alt={post.title} className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
                          </>
                        ) : (
                          <div className="h-full bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-800" />
                        )}
                      </div>
                      <div className="p-4 flex-1 flex flex-col">
                        <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white mb-2 line-clamp-2 group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors">
                          {post.title}
                        </h3>
                        <div className="flex items-center gap-2 mt-auto text-xs text-slate-500">
                          <Heart size={14} className="text-red-400" />
                          {post._count?.likes || 0}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </>
          )}

          {/* Followers Tab */}
          {activeTab === "followers" && (
            <>
              {followers.length === 0 ? (
                <div className="text-center py-12">
                  <Users size={48} className="mx-auto text-slate-300 dark:text-slate-600 mb-4" />
                  <p className="text-slate-500 dark:text-slate-400">No followers yet</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                  {followers.map((user) => (
                    <div
                      key={user.id}
                      onClick={() => navigate(`/user/${user.id}`)}
                      className="flex flex-col items-center p-4 bg-white dark:bg-[#161616] rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-slate-400 dark:hover:border-slate-600 cursor-pointer transition-all"
                    >
                      {user.avatar ? (
                        <img src={user.avatar} alt={user.name} className="w-16 h-16 rounded-full object-cover mb-3" />
                      ) : (
                        <div className="w-16 h-16 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center mb-3">
                          <UserIcon size={24} className="text-slate-400" />
                        </div>
                      )}
                      <h4 className="font-medium text-slate-900 dark:text-white text-center truncate w-full">{user.name || "User"}</h4>
                      {user.bio && <p className="text-xs text-slate-500 mt-1 text-center line-clamp-2">{user.bio}</p>}
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {/* Following Tab */}
          {activeTab === "following" && (
            <>
              {followingList.length === 0 ? (
                <div className="text-center py-12">
                  <UserPlus size={48} className="mx-auto text-slate-300 dark:text-slate-600 mb-4" />
                  <p className="text-slate-500 dark:text-slate-400">Not following anyone yet</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                  {followingList.map((user) => (
                    <div
                      key={user.id}
                      onClick={() => navigate(`/user/${user.id}`)}
                      className="flex flex-col items-center p-4 bg-white dark:bg-[#161616] rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-slate-400 dark:hover:border-slate-600 cursor-pointer transition-all"
                    >
                      {user.avatar ? (
                        <img src={user.avatar} alt={user.name} className="w-16 h-16 rounded-full object-cover mb-3" />
                      ) : (
                        <div className="w-16 h-16 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center mb-3">
                          <UserIcon size={24} className="text-slate-400" />
                        </div>
                      )}
                      <h4 className="font-medium text-slate-900 dark:text-white text-center truncate w-full">{user.name || "User"}</h4>
                      {user.bio && <p className="text-xs text-slate-500 mt-1 text-center line-clamp-2">{user.bio}</p>}
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}

