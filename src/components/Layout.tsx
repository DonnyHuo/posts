import { useEffect, useState } from "react";
import { Outlet, useNavigate, NavLink } from "react-router-dom";
import { api } from "../lib/api";
import {
  LogOut,
  Edit2,
  User as UserIcon,
  Menu,
  X,
  Sun,
  Moon,
} from "lucide-react";
import type { User } from "../types";
import { LoadingSpinner } from "./LoadingSpinner";
import { AnimatePresence, motion } from "framer-motion";
import { useTheme } from "../hooks/useTheme";

export default function Layout() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [editForm, setEditForm] = useState({ name: "", avatar: "" });
  const { theme, toggleTheme } = useTheme();
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
      console.log("Update profile response:", res.data);
      setUser((prev) => (prev ? { ...prev, ...res.data } : null));
      setIsEditing(false);
    } catch (err) {
      console.error("Update profile failed:", err);
      alert("Failed to update profile");
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
      {/* Edit Profile Modal */}
      {isEditing && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-bold mb-4 dark:text-white">
              Edit Profile
            </h3>
            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Name
                </label>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={(e) =>
                    setEditForm({ ...editForm, name: e.target.value })
                  }
                  className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-gray-700 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Avatar URL
                </label>
                <input
                  type="text"
                  value={editForm.avatar}
                  onChange={(e) =>
                    setEditForm({ ...editForm, avatar: e.target.value })
                  }
                  className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-gray-700 dark:text-white"
                  placeholder="https://example.com/avatar.jpg"
                />
              </div>
              <div className="flex justify-end gap-2 mt-6">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600 rounded-md"
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

      <nav className="bg-white dark:bg-gray-800 shadow-sm sticky top-0 z-10 transition-colors duration-200">
        <div className="w-full mx-auto px-4 box-border max-w-7xl">
          <div className="flex justify-between h-16">
            <div className="flex items-center gap-4">
              {/* Mobile menu button */}
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="md:hidden p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none"
              >
                {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>

              <h1 className="text-xl font-bold text-gray-800 dark:text-white">
                Blog App
              </h1>
              <div className="hidden md:flex space-x-4 ml-8">
                <NavLink
                  to="/dashboard/my"
                  className={({ isActive }) =>
                    `px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      isActive
                        ? "bg-gray-100 text-gray-900 dark:bg-gray-700 dark:text-white"
                        : "text-gray-600 hover:text-gray-900 hover:bg-gray-50 dark:text-gray-300 dark:hover:text-white dark:hover:bg-gray-700"
                    }`
                  }
                >
                  My Posts
                </NavLink>
                <NavLink
                  to="/dashboard/all"
                  className={({ isActive }) =>
                    `px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      isActive
                        ? "bg-gray-100 text-gray-900 dark:bg-gray-700 dark:text-white"
                        : "text-gray-600 hover:text-gray-900 hover:bg-gray-50 dark:text-gray-300 dark:hover:text-white dark:hover:bg-gray-700"
                    }`
                  }
                >
                  All Posts
                </NavLink>
              </div>
            </div>
            <div className="flex items-center gap-2 sm:gap-4">
              <button
                onClick={toggleTheme}
                className="p-2 rounded-full text-gray-400 hover:text-yellow-500 dark:hover:text-yellow-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                title={
                  theme === "dark"
                    ? "Switch to light mode"
                    : "Switch to dark mode"
                }
              >
                {theme === "dark" ? <Sun size={20} /> : <Moon size={20} />}
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsEditing(true)}
                  className="flex items-center gap-2 hover:opacity-80 transition-opacity"
                >
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
                  <span className="text-sm text-gray-700 dark:text-gray-300 hidden sm:inline font-medium">
                    {user?.name || user?.email}
                  </span>
                </button>
                <button
                  onClick={() => setIsEditing(true)}
                  className="hidden sm:block p-1 text-gray-400 hover:text-indigo-600 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  title="Edit Profile"
                >
                  <Edit2 size={16} />
                </button>
              </div>
              <div className="hidden sm:block h-6 w-px bg-gray-200 dark:bg-gray-700 mx-2"></div>
              <button
                onClick={handleLogout}
                className="hidden sm:flex p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 items-center gap-2"
                title="Sign out"
              >
                <LogOut className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "calc(100vh - 4rem)", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="md:hidden fixed top-16 left-0 w-full bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 shadow-lg z-20 overflow-y-auto"
            >
              <div className="px-2 pt-2 pb-3 space-y-1">
                <NavLink
                  to="/dashboard/my"
                  onClick={() => setIsMenuOpen(false)}
                  className={({ isActive }) =>
                    `block px-3 py-2 rounded-md text-base font-medium ${
                      isActive
                        ? "bg-indigo-50 text-indigo-700 dark:bg-gray-700 dark:text-white"
                        : "text-gray-700 dark:text-gray-300 hover:text-gray-900 hover:bg-gray-50 dark:hover:text-white dark:hover:bg-gray-700"
                    }`
                  }
                >
                  My Posts
                </NavLink>
                <NavLink
                  to="/dashboard/all"
                  onClick={() => setIsMenuOpen(false)}
                  className={({ isActive }) =>
                    `block px-3 py-2 rounded-md text-base font-medium ${
                      isActive
                        ? "bg-indigo-50 text-indigo-700 dark:bg-gray-700 dark:text-white"
                        : "text-gray-700 dark:text-gray-300 hover:text-gray-900 hover:bg-gray-50 dark:hover:text-white dark:hover:bg-gray-700"
                    }`
                  }
                >
                  All Posts
                </NavLink>
                <div className="border-t border-gray-200 dark:border-gray-700 my-2"></div>
                <button
                  onClick={() => {
                    setIsMenuOpen(false);
                    handleLogout();
                  }}
                  className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 hover:bg-gray-50 dark:hover:text-white dark:hover:bg-gray-700 flex items-center gap-2"
                >
                  <LogOut size={18} />
                  Sign out
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* Main Content Area */}
      <main className="max-w-7xl w-full mx-auto py-8 p-4 box-border">
        <Outlet context={{ currentUser: user }} />
      </main>
    </div>
  );
}
