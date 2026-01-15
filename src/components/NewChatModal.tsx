import { useState, useEffect } from "react";
import { api } from "../lib/api";
import type { User } from "../types";
import { X, Search, Users, MessageSquare, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface NewChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreatePrivate: (userId: string) => void;
  onCreateGroup: (name: string, memberIds: string[]) => void;
  currentUserId: string;
}

export default function NewChatModal({
  isOpen,
  onClose,
  onCreatePrivate,
  onCreateGroup,
  currentUserId,
}: NewChatModalProps) {
  const [mode, setMode] = useState<"private" | "group">("private");
  const [searchQuery, setSearchQuery] = useState("");
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [groupName, setGroupName] = useState("");
  const [loading, setLoading] = useState(false);

  // Fetch followers/following for user search
  useEffect(() => {
    if (!isOpen) return;

    const fetchUsers = async () => {
      setLoading(true);
      try {
        // Fetch both followers and following
        const [followersRes, followingRes] = await Promise.all([
          api.get("/follows/my/followers"),
          api.get("/follows/my/following"),
        ]);

        // Combine and deduplicate (data is inside .data.data due to pagination format)
        const followersData = followersRes.data?.data || [];
        const followingData = followingRes.data?.data || [];
        const allUsers = [...followersData, ...followingData];
        const uniqueUsers = allUsers.filter(
          (user, index, self) =>
            index === self.findIndex((u) => u.id === user.id) &&
            user.id !== currentUserId
        );

        setUsers(uniqueUsers);
      } catch (error) {
        console.error("Failed to fetch users:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [isOpen, currentUserId]);

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setMode("private");
      setSearchQuery("");
      setSelectedUsers([]);
      setGroupName("");
    }
  }, [isOpen]);

  const filteredUsers = users.filter(
    (user) =>
      user.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleUserSelect = (userId: string) => {
    if (mode === "private") {
      onCreatePrivate(userId);
      onClose();
    } else {
      setSelectedUsers((prev) =>
        prev.includes(userId)
          ? prev.filter((id) => id !== userId)
          : [...prev, userId]
      );
    }
  };

  const handleCreateGroup = () => {
    if (!groupName.trim() || selectedUsers.length === 0) return;
    onCreateGroup(groupName.trim(), selectedUsers);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-md max-h-[80vh] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              新建会话
            </h2>
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Mode selector */}
          <div className="flex p-2 gap-2 border-b border-gray-200 dark:border-gray-700">
            <button
              onClick={() => setMode("private")}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg transition-colors ${
                mode === "private"
                  ? "bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600"
                  : "hover:bg-gray-100 dark:hover:bg-gray-800"
              }`}
            >
              <MessageSquare className="w-4 h-4" />
              私聊
            </button>
            <button
              onClick={() => setMode("group")}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg transition-colors ${
                mode === "group"
                  ? "bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600"
                  : "hover:bg-gray-100 dark:hover:bg-gray-800"
              }`}
            >
              <Users className="w-4 h-4" />
              群聊
            </button>
          </div>

          {/* Group name input */}
          {mode === "group" && (
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <input
                type="text"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                placeholder="群组名称"
                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
              {selectedUsers.length > 0 && (
                <p className="mt-2 text-sm text-gray-500">
                  已选择 {selectedUsers.length} 位成员
                </p>
              )}
            </div>
          )}

          {/* Search */}
          <div className="p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="搜索用户..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
              />
            </div>
          </div>

          {/* User list */}
          <div className="overflow-y-auto max-h-80">
            {loading ? (
              <div className="flex items-center justify-center h-32">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600"></div>
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                {searchQuery ? "未找到用户" : "暂无可选用户"}
              </div>
            ) : (
              filteredUsers.map((user) => (
                <div
                  key={user.id}
                  onClick={() => handleUserSelect(user.id)}
                  className={`flex items-center gap-3 p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors ${
                    selectedUsers.includes(user.id)
                      ? "bg-indigo-50 dark:bg-indigo-900/20"
                      : ""
                  }`}
                >
                  {/* Avatar */}
                  {user.avatar ? (
                    <img
                      src={user.avatar}
                      alt={user.name}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-semibold">
                      {user.name?.charAt(0)?.toUpperCase() || "?"}
                    </div>
                  )}

                  {/* Info */}
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900 dark:text-white">
                      {user.name || "匿名用户"}
                    </h4>
                    <p className="text-sm text-gray-500">{user.email}</p>
                  </div>

                  {/* Selection indicator */}
                  {mode === "group" && selectedUsers.includes(user.id) && (
                    <div className="w-6 h-6 rounded-full bg-indigo-600 flex items-center justify-center">
                      <Check className="w-4 h-4 text-white" />
                    </div>
                  )}
                </div>
              ))
            )}
          </div>

          {/* Footer for group mode */}
          {mode === "group" && (
            <div className="p-4 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={handleCreateGroup}
                disabled={!groupName.trim() || selectedUsers.length === 0}
                className="w-full py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                创建群组 ({selectedUsers.length})
              </button>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
