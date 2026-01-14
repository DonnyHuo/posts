import { useEffect, useState } from "react";
import { Outlet, Link, useLocation } from "react-router-dom";
import { useForm } from "react-hook-form";
import { api } from "../lib/api";
import {
  User as UserIcon,
  X,
  Twitter,
  Linkedin,
  LogIn,
  UserPlus,
  Mail,
  Lock,
  Plus,
  LayoutGrid,
  Annoyed,
} from "lucide-react";
import type { User } from "../types";
import { LoadingSpinner } from "./LoadingSpinner";
import { AnimatePresence, motion } from "framer-motion";
import { useTheme } from "../hooks/useTheme";

type AuthModal = "login" | "register" | null;

export default function Layout() {
  const location = useLocation();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [authModal, setAuthModal] = useState<AuthModal>(null);
  const [authError, setAuthError] = useState("");
  const [authLoading, setAuthLoading] = useState(false);
  const { theme } = useTheme();
  const [isHeaderVisible, setIsHeaderVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  const loginForm = useForm();
  const registerForm = useForm();

  const isLoggedIn = !!user;

  // Check if current route matches navigation items
  const isHomeActive =
    location.pathname === "/dashboard/all" ||
    location.pathname === "/dashboard" ||
    location.pathname === "/";
  const isProfileActive = location.pathname === "/profile";

  // Handle scroll to show/hide header on mobile
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      // Only apply on mobile (screen width < 640px)
      if (window.innerWidth >= 640) {
        setIsHeaderVisible(true);
        setLastScrollY(currentScrollY);
        return;
      }

      // Show header when scrolling up or at the top
      if (currentScrollY < lastScrollY || currentScrollY < 10) {
        setIsHeaderVisible(true);
      }
      // Hide header when scrolling down
      else if (currentScrollY > lastScrollY && currentScrollY > 10) {
        setIsHeaderVisible(false);
      }

      setLastScrollY(currentScrollY);
    };

    const handleResize = () => {
      // Reset header visibility when switching to desktop
      if (window.innerWidth >= 640) {
        setIsHeaderVisible(true);
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleResize);
    };
  }, [lastScrollY]);

  useEffect(() => {
    const fetchProfile = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const res = await api.get("/auth/me");
        setUser(res.data);
      } catch (err) {
        console.error("Failed to fetch profile", err);
        localStorage.removeItem("token");
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handleLogin = async (data: Record<string, unknown>) => {
    const { email, password } = data as { email: string; password: string };
    setAuthLoading(true);
    setAuthError("");
    try {
      const res = await api.post("/auth/login", { email, password });
      localStorage.setItem("token", res.data.accessToken);
      // 获取用户信息
      const userRes = await api.get("/auth/me");
      setUser(userRes.data);
      setAuthModal(null);
      loginForm.reset();
    } catch (err: unknown) {
      console.error("Login error:", err);
      let errorMessage = "Login failed";
      const error = err as {
        response?: { data?: { message?: string | string[] } };
        message?: string;
      };
      if (error.response?.data?.message) {
        errorMessage = Array.isArray(error.response.data.message)
          ? error.response.data.message.join(", ")
          : String(error.response.data.message);
      } else if (error.message) {
        errorMessage = error.message;
      }
      setAuthError(errorMessage);
    } finally {
      setAuthLoading(false);
    }
  };

  const handleRegister = async (data: Record<string, unknown>) => {
    const { name, email, password } = data as {
      name: string;
      email: string;
      password: string;
    };
    setAuthLoading(true);
    setAuthError("");
    try {
      const res = await api.post("/auth/register", { name, email, password });
      localStorage.setItem("token", res.data.accessToken);
      // 获取用户信息
      const userRes = await api.get("/auth/me");
      setUser(userRes.data);
      setAuthModal(null);
      registerForm.reset();
    } catch (err: unknown) {
      const error = err as {
        response?: { data?: { message?: string | string[] } };
      };
      const msg = error.response?.data?.message;
      setAuthError(
        Array.isArray(msg) ? msg.join(", ") : msg || "Registration failed"
      );
    } finally {
      setAuthLoading(false);
    }
  };

  const openAuthModal = (type: AuthModal) => {
    setAuthModal(type);
    setAuthError("");
  };

  const switchAuthModal = (type: AuthModal) => {
    setAuthModal(type);
    setAuthError("");
    loginForm.reset();
    registerForm.reset();
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-black text-slate-900 dark:text-slate-100 transition-colors duration-200 flex flex-col">
      {/* Auth Modal */}
      <AnimatePresence>
        {authModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white dark:bg-[#111111] rounded-2xl p-8 w-full max-w-md border border-slate-200 dark:border-slate-800 shadow-2xl relative"
            >
              <button
                onClick={() => setAuthModal(null)}
                className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
              >
                <X size={20} />
              </button>

              {authModal === "login" ? (
                <>
                  <div className="text-center mb-8">
                    <div className="mx-auto h-14 w-14 flex items-center justify-center rounded-full bg-slate-100 dark:bg-slate-900/30 mb-4">
                      <LogIn className="h-7 w-7 text-black dark:text-slate-200" />
                    </div>
                    <h3 className="text-2xl font-bold text-slate-900 dark:text-white">
                      Welcome back
                    </h3>
                    <p className="text-slate-500 dark:text-slate-400 mt-1">
                      Sign in to your account
                    </p>
                  </div>

                  <form
                    onSubmit={loginForm.handleSubmit(handleLogin)}
                    className="space-y-4"
                  >
                    <div className="relative">
                      <Mail
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                        size={18}
                      />
                      <input
                        {...loginForm.register("email", { required: true })}
                        type="email"
                        placeholder="Email address"
                        className="w-full bg-slate-50 dark:bg-black border border-slate-200 dark:border-slate-800 rounded-xl pl-10 pr-4 py-3 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:ring-2 focus:ring-black dark:ring-slate-800 focus:border-transparent outline-none transition-all"
                      />
                    </div>
                    <div className="relative">
                      <Lock
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                        size={18}
                      />
                      <input
                        {...loginForm.register("password", { required: true })}
                        type="password"
                        placeholder="Password"
                        className="w-full bg-slate-50 dark:bg-black border border-slate-200 dark:border-slate-800 rounded-xl pl-10 pr-4 py-3 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:ring-2 focus:ring-black dark:ring-slate-800 focus:border-transparent outline-none transition-all"
                      />
                    </div>

                    {authError && (
                      <div className="text-red-500 text-sm text-center bg-red-50 dark:bg-red-900/20 py-2 px-3 rounded-lg">
                        {authError}
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={authLoading}
                      className="w-full bg-black dark:bg-white dark:text-black hover:bg-slate-900 dark:hover:bg-slate-100 disabled:opacity-50 text-white font-medium py-3 rounded-xl transition-all"
                    >
                      {authLoading ? "Signing in..." : "Sign in"}
                    </button>
                  </form>

                  <div className="mt-6 text-center">
                    <span className="text-slate-500 dark:text-slate-400">
                      Don't have an account?{" "}
                    </span>
                    <button
                      onClick={() => switchAuthModal("register")}
                      className="text-black dark:text-slate-200 hover:underline font-medium"
                    >
                      Sign up
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div className="text-center mb-8">
                    <div className="mx-auto h-14 w-14 flex items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30 mb-4">
                      <UserPlus className="h-7 w-7 text-green-600 dark:text-green-400" />
                    </div>
                    <h3 className="text-2xl font-bold text-slate-900 dark:text-white">
                      Create account
                    </h3>
                    <p className="text-slate-500 dark:text-slate-400 mt-1">
                      Join our community today
                    </p>
                  </div>

                  <form
                    onSubmit={registerForm.handleSubmit(handleRegister)}
                    className="space-y-4"
                  >
                    <div className="relative">
                      <UserIcon
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                        size={18}
                      />
                      <input
                        {...registerForm.register("name", { required: true })}
                        type="text"
                        placeholder="Full Name"
                        className="w-full bg-slate-50 dark:bg-black border border-slate-200 dark:border-slate-800 rounded-xl pl-10 pr-4 py-3 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all"
                      />
                    </div>
                    <div className="relative">
                      <Mail
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                        size={18}
                      />
                      <input
                        {...registerForm.register("email", { required: true })}
                        type="email"
                        placeholder="Email address"
                        className="w-full bg-slate-50 dark:bg-black border border-slate-200 dark:border-slate-800 rounded-xl pl-10 pr-4 py-3 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all"
                      />
                    </div>
                    <div className="relative">
                      <Lock
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                        size={18}
                      />
                      <input
                        {...registerForm.register("password", {
                          required: true,
                          minLength: 6,
                        })}
                        type="password"
                        placeholder="Password (min 6 chars)"
                        className="w-full bg-slate-50 dark:bg-black border border-slate-200 dark:border-slate-800 rounded-xl pl-10 pr-4 py-3 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all"
                      />
                    </div>

                    {authError && (
                      <div className="text-red-500 text-sm text-center bg-red-50 dark:bg-red-900/20 py-2 px-3 rounded-lg">
                        {authError}
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={authLoading}
                      className="w-full bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white font-medium py-3 rounded-xl transition-all shadow-lg shadow-green-500/20"
                    >
                      {authLoading ? "Creating account..." : "Sign up"}
                    </button>
                  </form>

                  <div className="mt-6 text-center">
                    <span className="text-slate-500 dark:text-slate-400">
                      Already have an account?{" "}
                    </span>
                    <button
                      onClick={() => switchAuthModal("login")}
                      className="text-green-600 dark:text-green-400 hover:underline font-medium"
                    >
                      Sign in
                    </button>
                  </div>
                </>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Header - Desktop: Top, Mobile: Bottom Navigation */}
      {/* Desktop Header */}
      <header className="hidden sm:block sticky top-0 z-40 w-full bg-white/80 dark:bg-black/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-[1600px] mx-auto px-6 h-20 flex items-center justify-between gap-4">
          {/* Logo */}
          <Link
            to="/dashboard/all"
            className="flex items-center gap-2 shrink-0"
          >
            <img
              src={theme === "dark" ? "/logo-white.png" : "/logo.png"}
              alt="POSTS Logo"
              className="h-12 w-auto object-contain transition-opacity duration-300"
            />
          </Link>

          {/* Right Actions */}
          <div className="flex items-center gap-4 shrink-0">
            {/* Create Post Button - Only for logged in users */}
            {isLoggedIn && (
              <Link
                to="/dashboard/my"
                className="p-2 rounded-xl bg-black dark:bg-white dark:text-black hover:bg-slate-900 dark:hover:bg-slate-100 text-white transition-all"
                title="My Blog"
              >
                <Plus size={20} />
              </Link>
            )}

            {/* Profile Menu or Login Button */}
            {isLoggedIn ? (
              <div className="flex items-center gap-3">
                <Link to="/profile" className="flex items-center gap-2 group">
                  {user?.avatar ? (
                    <img
                      src={user.avatar}
                      alt="Avatar"
                      className="h-8 w-8 rounded-full object-cover ring-2 ring-transparent group-hover:ring-slate-300 dark:group-hover:ring-slate-600 transition-all"
                    />
                  ) : (
                    <div className="h-8 w-8 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-slate-500 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white group-hover:bg-slate-300 dark:group-hover:bg-slate-700 transition-all">
                      <UserIcon size={16} />
                    </div>
                  )}
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    {user?.name || "User"}
                  </span>
                </Link>
              </div>
            ) : (
              <button
                onClick={() => openAuthModal("login")}
                className="text-sm font-medium text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors flex items-center gap-1"
              >
                <LogIn size={16} />
                <span>Sign In</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Mobile Bottom Navigation */}
      <nav
        className={`sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-black/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 transition-transform duration-300 ease-in-out ${
          isHeaderVisible ? "translate-y-0" : "translate-y-full"
        }`}
      >
        <div className="max-w-[1600px] mx-auto h-14 flex items-center justify-around px-3">
          {/* Home Button - Left */}
          <Link
            to="/dashboard/all"
            className={`flex items-center justify-center flex-1 transition-colors ${
              isHomeActive
                ? "text-black dark:text-slate-200"
                : "text-slate-600 dark:text-slate-400 hover:text-black dark:hover:text-slate-200"
            }`}
          >
            <motion.div
              animate={
                isHomeActive
                  ? {
                      scale: [1, 1.1, 1],
                      rotate: [0, 5, -5, 0],
                    }
                  : {
                      rotate: 0,
                      scale: 1,
                    }
              }
              transition={{
                duration: 2,
                repeat: isHomeActive ? Infinity : 0,
                repeatDelay: 1,
                ease: "easeInOut",
              }}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
            >
              <LayoutGrid
                size={22}
                strokeWidth={isHomeActive ? 2 : 1.5}
                className={isHomeActive ? "fill-current" : ""}
              />
            </motion.div>
          </Link>

          {/* Create Post Button - Center */}
          {isLoggedIn ? (
            <Link
              to="/dashboard/my"
              className="flex items-center justify-center w-12 h-12 rounded-full bg-black dark:bg-white dark:text-black hover:bg-slate-900 dark:hover:bg-slate-100 text-white transition-all -mt-3"
              title="My Blog"
            >
              <Plus size={20} strokeWidth={2.5} />
            </Link>
          ) : (
            <button
              onClick={() => openAuthModal("login")}
              className="flex items-center justify-center w-12 h-12 rounded-full bg-black dark:bg-white dark:text-black hover:bg-slate-900 dark:hover:bg-slate-100 text-white transition-all -mt-3"
              title="Sign In to Create Post"
            >
              <Plus size={20} strokeWidth={2.5} />
            </button>
          )}

          {/* Profile Button - Right */}
          {isLoggedIn ? (
            <Link
              to="/profile"
              className={`flex items-center justify-center flex-1 transition-colors ${
                isProfileActive
                  ? "text-black dark:text-slate-200"
                  : "text-slate-600 dark:text-slate-400 hover:text-black dark:hover:text-slate-200"
              }`}
            >
              <motion.div
                animate={
                  isProfileActive
                    ? {
                        scale: [1, 1.1, 1],
                        y: [0, -2, 0],
                      }
                    : {
                        scale: 1,
                        y: 0,
                      }
                }
                transition={{
                  duration: 2,
                  repeat: isProfileActive ? Infinity : 0,
                  repeatDelay: 1,
                  ease: "easeInOut",
                }}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
              >
                <Annoyed size={22} strokeWidth={isProfileActive ? 2.5 : 1.5} />
              </motion.div>
            </Link>
          ) : (
            <button
              onClick={() => openAuthModal("login")}
              className="flex items-center justify-center flex-1 text-slate-600 dark:text-slate-400 hover:text-black dark:hover:text-slate-200 transition-colors"
            >
              <motion.div
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
              >
                <Annoyed size={22} strokeWidth={1.5} />
              </motion.div>
            </button>
          )}
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 w-full mx-auto max-w-7xl px-3 sm:px-6 py-6 sm:py-12 pb-14 sm:pb-12">
        <Outlet context={{ currentUser: user, openAuthModal }} />
      </main>

      {/* Footer */}
      <footer className="hidden sm:block bg-white dark:bg-black border-t border-slate-200 dark:border-slate-800 py-8 mt-auto">
        <div className="max-w-7xl mx-auto px-6">
          {/* Desktop: Full layout */}
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 md:gap-6">
            <div className="flex flex-col md:items-start gap-1.5 md:gap-2">
              <Link
                to="/dashboard/all"
                className="flex items-center gap-1.5 md:gap-2"
              >
                <img
                  src={theme === "dark" ? "/logo-white.png" : "/logo.png"}
                  alt="POSTS Logo"
                  className="h-10 w-auto object-contain transition-opacity duration-300"
                />
              </Link>
              <p className="text-sm text-slate-400 dark:text-slate-500 italic">
                Keep it simple. Keep it posts.
              </p>
            </div>

            <div className="flex gap-4 md:gap-6 text-sm text-slate-500 dark:text-slate-400">
              <Link
                to="/dashboard/all"
                className="hover:text-slate-900 dark:hover:text-white"
              >
                Home
              </Link>
              <a
                href="#"
                className="hover:text-slate-900 dark:hover:text-white"
              >
                About
              </a>
              <a
                href="#"
                className="hover:text-slate-900 dark:hover:text-white"
              >
                Contact
              </a>
            </div>

            <div className="flex gap-3 md:gap-4 text-slate-400 dark:text-slate-400">
              <Twitter
                size={20}
                className="hover:text-slate-900 dark:hover:text-white cursor-pointer"
              />
              <div className="hover:text-slate-900 dark:hover:text-white cursor-pointer font-bold text-base">
                M
              </div>
              <Linkedin
                size={20}
                className="hover:text-slate-900 dark:hover:text-white cursor-pointer"
              />
            </div>

            <div className="text-xs text-slate-400 dark:text-slate-600">
              Privacy Resgerted
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
