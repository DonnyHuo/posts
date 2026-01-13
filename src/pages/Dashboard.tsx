import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { api } from "../lib/api";
import { LogOut, Plus, Edit2, User as UserIcon } from "lucide-react";
import PostList from "../components/PostList";
import type { User } from "../types";

export default function Dashboard() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"my" | "all">("my");
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({ name: "", avatar: "" });
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await api.get("/auth/me");
        setUser(res.data);
        setEditForm({
          name: res.data.name || "",
          avatar: res.data.avatar || "",
        });
      } catch (err) {
        console.error("Failed to fetch profile", err);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    try {
      const res = await api.patch(`/users/${user.id}`, editForm);
      console.log("Update profile response:", res.data); // Debug: Check if avatar is returned
      setUser((prev) => (prev ? { ...prev, ...res.data } : null));
      setIsEditing(false);
    } catch (err) {
      console.error("Update profile failed:", err);
      alert("Failed to update profile");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Loading...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Edit Profile Modal */}
      {isEditing && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-bold mb-4">Edit Profile</h3>
            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Name
                </label>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={(e) =>
                    setEditForm({ ...editForm, name: e.target.value })
                  }
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Avatar URL
                </label>
                <input
                  type="text"
                  value={editForm.avatar}
                  onChange={(e) =>
                    setEditForm({ ...editForm, avatar: e.target.value })
                  }
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  placeholder="https://example.com/avatar.jpg"
                />
              </div>
              <div className="flex justify-end gap-2 mt-6">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-md"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <nav className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center gap-4">
              <h1 className="text-xl font-bold text-gray-800">Blog App</h1>
              <div className="hidden md:flex space-x-4 ml-8">
                <button
                  onClick={() => setActiveTab("my")}
                  className={`px-3 py-2 rounded-md text-sm font-medium ${
                    activeTab === "my"
                      ? "bg-gray-100 text-gray-900"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  My Posts
                </button>
                <button
                  onClick={() => setActiveTab("all")}
                  className={`px-3 py-2 rounded-md text-sm font-medium ${
                    activeTab === "all"
                      ? "bg-gray-100 text-gray-900"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  All Posts
                </button>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                {user?.avatar ? (
                  <img
                    src={user.avatar}
                    alt="Avatar"
                    className="h-8 w-8 rounded-full object-cover"
                  />
                ) : (
                  <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600">
                    <UserIcon size={16} />
                  </div>
                )}
                <span className="text-sm text-gray-700 hidden sm:inline font-medium">
                  {user?.name || user?.email}
                </span>
                <button
                  onClick={() => setIsEditing(true)}
                  className="p-1 text-gray-400 hover:text-indigo-600 rounded-full hover:bg-gray-100 transition-colors"
                  title="Edit Profile"
                >
                  <Edit2 size={16} />
                </button>
              </div>
              <div className="h-6 w-px bg-gray-200 mx-2"></div>
              <button
                onClick={handleLogout}
                className="p-2 text-gray-400 hover:text-gray-600 flex items-center gap-2"
                title="Sign out"
              >
                <LogOut className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              {activeTab === "my" ? "My Posts" : "Community Posts"}
            </h2>
            <p className="mt-1 text-gray-500">
              {activeTab === "my"
                ? "Manage and create your own content"
                : "See what others are writing about"}
            </p>
          </div>
          {activeTab === "my" && (
            <Link
              to="/posts/new"
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <Plus className="-ml-1 mr-2 h-5 w-5" />
              New Post
            </Link>
          )}
        </div>

        <PostList myPosts={activeTab === "my"} currentUser={user} />
      </main>
    </div>
  );
}
