import { useState, useEffect, useCallback } from "react";
import { api } from "../lib/api";
import type { Conversation, User } from "../types";
import {
  X,
  Camera,
  UserPlus,
  Users,
  Check,
  Search,
  Loader2,
  Crown,
  Shield,
} from "lucide-react";

// Cloudinary configuration
const CLOUDINARY_CONFIG = {
  cloudName: import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || "difjqmokp",
  uploadPreset:
    import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || "unsigned_preset",
};

interface GroupSettingsModalProps {
  conversation: Conversation;
  currentUserId: string;
  onClose: () => void;
  onUpdate: (updated: Conversation) => void;
}

export default function GroupSettingsModal({
  conversation,
  currentUserId,
  onClose,
  onUpdate,
}: GroupSettingsModalProps) {
  const [activeTab, setActiveTab] = useState<"info" | "members" | "add">(
    "info"
  );
  const [name, setName] = useState(conversation.name || "");
  const [avatar, setAvatar] = useState(conversation.avatar || "");
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  // Add members state
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [searching, setSearching] = useState(false);
  const [addingMembers, setAddingMembers] = useState(false);

  // Check if current user can edit (owner or admin)
  const currentMember = conversation.members.find(
    (m) => m.id === currentUserId
  );
  const canEdit =
    currentMember?.role === "OWNER" || currentMember?.role === "ADMIN";

  // Search users
  const searchUsers = useCallback(async () => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    setSearching(true);
    try {
      // Search from followers/following
      const [followersRes, followingRes] = await Promise.all([
        api.get("/follows/my/followers", { params: { limit: 50 } }),
        api.get("/follows/my/following", { params: { limit: 50 } }),
      ]);

      const followers = followersRes.data.data.map(
        (f: { follower: User }) => f.follower
      );
      const following = followingRes.data.data.map(
        (f: { following: User }) => f.following
      );

      // Combine and dedupe
      const allUsers = [...followers, ...following];
      const uniqueUsers = allUsers.filter(
        (user, index, self) => self.findIndex((u) => u.id === user.id) === index
      );

      // Filter by search query and exclude existing members
      const existingMemberIds = conversation.members.map((m) => m.id);
      const filtered = uniqueUsers.filter(
        (user) =>
          !existingMemberIds.includes(user.id) &&
          (user.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            user.email?.toLowerCase().includes(searchQuery.toLowerCase()))
      );

      setSearchResults(filtered);
    } catch (error) {
      console.error("Failed to search users:", error);
    } finally {
      setSearching(false);
    }
  }, [searchQuery, conversation.members]);

  useEffect(() => {
    const timer = setTimeout(searchUsers, 300);
    return () => clearTimeout(timer);
  }, [searchUsers]);

  // Upload avatar
  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("请选择图片文件");
      return;
    }

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
      setAvatar(data.secure_url);
    } catch (error) {
      console.error("Failed to upload avatar:", error);
      alert("头像上传失败，请重试");
    } finally {
      setUploadingAvatar(false);
    }
  };

  // Save group settings
  const handleSave = async () => {
    if (!canEdit) return;

    setSaving(true);
    try {
      const response = await api.patch(
        `/messages/conversations/${conversation.id}`,
        {
          name: name.trim() || undefined,
          avatar: avatar || undefined,
        }
      );
      onUpdate(response.data);
      onClose();
    } catch (error) {
      console.error("Failed to update group:", error);
      alert("保存失败，请重试");
    } finally {
      setSaving(false);
    }
  };

  // Toggle user selection
  const toggleUserSelection = (userId: string) => {
    setSelectedUsers((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId]
    );
  };

  // Add selected members
  const handleAddMembers = async () => {
    if (selectedUsers.length === 0) return;

    setAddingMembers(true);
    try {
      const response = await api.post(
        `/messages/conversations/${conversation.id}/members`,
        { memberIds: selectedUsers }
      );
      onUpdate(response.data);
      setSelectedUsers([]);
      setSearchQuery("");
      setSearchResults([]);
      setActiveTab("members");
    } catch (error) {
      console.error("Failed to add members:", error);
      alert("添加成员失败，请重试");
    } finally {
      setAddingMembers(false);
    }
  };

  // Get role badge
  const getRoleBadge = (role?: string) => {
    if (role === "OWNER") {
      return (
        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 text-xs rounded">
          <Crown className="w-3 h-3" />
          群主
        </span>
      );
    }
    if (role === "ADMIN") {
      return (
        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-xs rounded">
          <Shield className="w-3 h-3" />
          管理员
        </span>
      );
    }
    return null;
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-md max-h-[90vh] overflow-hidden shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            群聊设置
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 dark:border-gray-700">
          <button
            onClick={() => setActiveTab("info")}
            className={`flex-1 py-3 text-sm font-medium transition-colors ${
              activeTab === "info"
                ? "text-indigo-600 border-b-2 border-indigo-600"
                : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
            }`}
          >
            群信息
          </button>
          <button
            onClick={() => setActiveTab("members")}
            className={`flex-1 py-3 text-sm font-medium transition-colors ${
              activeTab === "members"
                ? "text-indigo-600 border-b-2 border-indigo-600"
                : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
            }`}
          >
            成员 ({conversation.members.length})
          </button>
          {canEdit && (
            <button
              onClick={() => setActiveTab("add")}
              className={`flex-1 py-3 text-sm font-medium transition-colors ${
                activeTab === "add"
                  ? "text-indigo-600 border-b-2 border-indigo-600"
                  : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
              }`}
            >
              添加成员
            </button>
          )}
        </div>

        {/* Content */}
        <div className="overflow-y-auto" style={{ maxHeight: "60vh" }}>
          {/* Info Tab */}
          {activeTab === "info" && (
            <div className="p-4 space-y-6">
              {/* Avatar */}
              <div className="flex flex-col items-center">
                <div className="relative">
                  {avatar ? (
                    <img
                      src={avatar}
                      alt="Group Avatar"
                      className="w-24 h-24 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-24 h-24 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                      <Users className="w-10 h-10 text-white" />
                    </div>
                  )}

                  {canEdit && (
                    <label className="absolute bottom-0 right-0 p-2 bg-white dark:bg-gray-800 rounded-full shadow-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                      {uploadingAvatar ? (
                        <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
                      ) : (
                        <Camera className="w-4 h-4 text-indigo-600" />
                      )}
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleAvatarUpload}
                        className="hidden"
                        disabled={uploadingAvatar}
                      />
                    </label>
                  )}
                </div>
              </div>

              {/* Group Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  群名称
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={!canEdit}
                  placeholder="输入群名称"
                  className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>

              {/* Save Button */}
              {canEdit && (
                <button
                  onClick={handleSave}
                  disabled={saving || (!name.trim() && !avatar)}
                  className="w-full py-3 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      保存中...
                    </>
                  ) : (
                    "保存修改"
                  )}
                </button>
              )}

              {!canEdit && (
                <p className="text-center text-sm text-gray-500">
                  只有群主或管理员可以修改群设置
                </p>
              )}
            </div>
          )}

          {/* Members Tab */}
          {activeTab === "members" && (
            <div className="divide-y divide-gray-100 dark:divide-gray-800">
              {conversation.members.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center gap-3 p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50"
                >
                  {member.avatar ? (
                    <img
                      src={member.avatar}
                      alt={member.name}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-semibold">
                      {member.name?.charAt(0)?.toUpperCase() || "?"}
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-gray-900 dark:text-white truncate">
                        {member.name}
                        {member.id === currentUserId && (
                          <span className="text-gray-400 text-sm ml-1">
                            (我)
                          </span>
                        )}
                      </p>
                      {getRoleBadge(member.role)}
                    </div>
                    {member.email && (
                      <p className="text-sm text-gray-500 truncate">
                        {member.email}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Add Members Tab */}
          {activeTab === "add" && canEdit && (
            <div className="p-4 space-y-4">
              {/* Search Input */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="搜索好友..."
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                />
              </div>

              {/* Selected Users */}
              {selectedUsers.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {selectedUsers.map((userId) => {
                    const user = searchResults.find((u) => u.id === userId);
                    if (!user) return null;
                    return (
                      <span
                        key={userId}
                        className="inline-flex items-center gap-1 px-2 py-1 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded-full text-sm"
                      >
                        {user.name}
                        <button
                          onClick={() => toggleUserSelection(userId)}
                          className="hover:text-indigo-900"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    );
                  })}
                </div>
              )}

              {/* Search Results */}
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {searching ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
                  </div>
                ) : searchResults.length > 0 ? (
                  searchResults.map((user) => (
                    <button
                      key={user.id}
                      onClick={() => toggleUserSelection(user.id)}
                      className={`w-full flex items-center gap-3 p-3 rounded-xl transition-colors ${
                        selectedUsers.includes(user.id)
                          ? "bg-indigo-50 dark:bg-indigo-900/20 border-2 border-indigo-500"
                          : "bg-gray-50 dark:bg-gray-800 border-2 border-transparent hover:bg-gray-100 dark:hover:bg-gray-700"
                      }`}
                    >
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

                      <div className="flex-1 text-left">
                        <p className="font-medium text-gray-900 dark:text-white">
                          {user.name}
                        </p>
                        {user.email && (
                          <p className="text-sm text-gray-500">{user.email}</p>
                        )}
                      </div>

                      {selectedUsers.includes(user.id) && (
                        <Check className="w-5 h-5 text-indigo-600" />
                      )}
                    </button>
                  ))
                ) : searchQuery.trim() ? (
                  <p className="text-center py-8 text-gray-500">
                    未找到匹配的好友
                  </p>
                ) : (
                  <p className="text-center py-8 text-gray-500">
                    输入名称搜索好友
                  </p>
                )}
              </div>

              {/* Add Button */}
              {selectedUsers.length > 0 && (
                <button
                  onClick={handleAddMembers}
                  disabled={addingMembers}
                  className="w-full py-3 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                >
                  {addingMembers ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      添加中...
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-4 h-4" />
                      添加 {selectedUsers.length} 位成员
                    </>
                  )}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

