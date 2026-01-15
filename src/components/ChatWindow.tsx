import { useEffect, useState, useRef, useCallback } from "react";
import { api } from "../lib/api";
import type { Message, Conversation } from "../types";
import { useConversationChannel } from "../hooks/usePusher";
import { format, isToday, isYesterday } from "date-fns";
import { zhCN } from "date-fns/locale";
import {
  Send,
  Image as ImageIcon,
  Phone,
  Video,
  Info,
  ArrowLeft,
  Smile,
  X,
  Loader2,
} from "lucide-react";

// Cloudinary configuration
const CLOUDINARY_CONFIG = {
  cloudName: import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || "difjqmokp",
  uploadPreset:
    import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || "unsigned_preset",
};

// Common emojis
const EMOJI_LIST = [
  // Smileys
  "😀",
  "😃",
  "😄",
  "😁",
  "😅",
  "😂",
  "🤣",
  "😊",
  "😇",
  "🙂",
  "😉",
  "😌",
  "😍",
  "🥰",
  "😘",
  "😗",
  "😋",
  "😛",
  "😜",
  "🤪",
  "😝",
  "🤑",
  "🤗",
  "🤭",
  "🤔",
  "🤐",
  "🤨",
  "😐",
  "😑",
  "😶",
  "😏",
  "😒",
  "🙄",
  "😬",
  "😮",
  "😯",
  "😲",
  "😳",
  "🥺",
  "😢",
  "😭",
  "😤",
  "😠",
  "😡",
  "🤬",
  "😈",
  "👿",
  "💀",
  // Gestures
  "👍",
  "👎",
  "👌",
  "✌️",
  "🤞",
  "🤟",
  "🤘",
  "🤙",
  "👋",
  "🤚",
  "🖐️",
  "✋",
  "🖖",
  "👏",
  "🙌",
  "🤝",
  "🙏",
  "💪",
  "🦾",
  "❤️",
  "🧡",
  "💛",
  "💚",
  "💙",
  "💜",
  "🖤",
  "🤍",
  "💯",
  "💢",
  "💥",
  "💫",
  "💦",
  // Objects
  "🎉",
  "🎊",
  "🎁",
  "🎈",
  "✨",
  "🌟",
  "⭐",
  "🔥",
  "💡",
  "💰",
  "🎵",
  "🎶",
  "📱",
  "💻",
  "🎮",
  "🏆",
];

interface ChatWindowProps {
  conversation: Conversation;
  currentUserId: string;
  onBack?: () => void;
  refreshTrigger?: number; // Increment to trigger refresh
}

export default function ChatWindow({
  conversation,
  currentUserId,
  onBack,
  refreshTrigger,
}: ChatWindowProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [newMessage, setNewMessage] = useState("");
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const emojiPickerRef = useRef<HTMLDivElement>(null);

  // Fetch messages
  const fetchMessages = useCallback(
    async (pageNum = 1, append = false) => {
      try {
        const response = await api.get(
          `/messages/conversations/${conversation.id}/messages`,
          { params: { page: pageNum, limit: 50 } }
        );

        const { data, meta } = response.data;

        if (append) {
          setMessages((prev) => [...data, ...prev]);
        } else {
          setMessages(data);
        }

        setHasMore(pageNum < meta.totalPages);
        setPage(pageNum);
      } catch (error) {
        console.error("Failed to fetch messages:", error);
      } finally {
        setLoading(false);
      }
    },
    [conversation.id]
  );

  // Initial load
  useEffect(() => {
    console.log(
      "[ChatWindow] Initial load effect triggered, conversation.id:",
      conversation.id
    );
    setLoading(true);
    setMessages([]);
    setPage(1);
    setHasMore(true);
    fetchMessages(1);
    markAsRead();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversation.id]);

  // Debug: Log when component mounts/unmounts
  useEffect(() => {
    console.log(
      "[ChatWindow] Component mounted, conversation:",
      conversation.id
    );
    return () => {
      console.log("[ChatWindow] Component unmounted");
    };
  }, [conversation.id]);

  // Scroll to bottom on new message
  useEffect(() => {
    if (!loading) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, loading]);

  // Real-time message updates via Pusher
  useConversationChannel(conversation.id, (data) => {
    const newMsg = data as {
      id: string;
      content: string;
      type?: "TEXT" | "IMAGE" | "SYSTEM";
      senderId: string;
      conversationId?: string;
      createdAt?: string;
      sender?: { id: string; name: string; avatar?: string };
      senderName?: string;
      senderAvatar?: string;
    };

    console.log(
      "[ChatWindow] Pusher message received on conversation:",
      conversation.id
    );
    console.log("[ChatWindow] Message data:", newMsg);
    console.log(
      "[ChatWindow] Current user:",
      currentUserId,
      "Sender:",
      newMsg.senderId
    );

    setMessages((prev) => {
      // Check if message already exists (by id or temp id)
      const exists = prev.some(
        (m) =>
          m.id === newMsg.id ||
          (m.id.startsWith("temp-") && m.content === newMsg.content)
      );

      if (exists) {
        console.log("Message already exists, skipping");
        return prev;
      }

      console.log("Adding new message to state");
      const messageToAdd: Message = {
        id: newMsg.id,
        content: newMsg.content,
        type: newMsg.type || "TEXT",
        senderId: newMsg.senderId,
        conversationId: newMsg.conversationId || conversation.id,
        createdAt: newMsg.createdAt || new Date().toISOString(),
        sender: newMsg.sender || {
          id: newMsg.senderId,
          name: newMsg.senderName || "Unknown",
          avatar: newMsg.senderAvatar,
        },
      };
      return [...prev, messageToAdd];
    });

    // Mark as read if not own message
    if (newMsg.senderId !== currentUserId) {
      markAsRead();
    }
  });

  // Refresh messages when refreshTrigger changes (from parent)
  useEffect(() => {
    if (refreshTrigger === undefined || refreshTrigger === 0) return;

    const refreshMessages = async () => {
      try {
        const response = await api.get(
          `/messages/conversations/${conversation.id}/messages`,
          { params: { page: 1, limit: 50 } }
        );
        const { data } = response.data;

        setMessages((prev) => {
          const existingIds = new Set(prev.map((m) => m.id));
          const newMessages = data.filter(
            (m: Message) => !existingIds.has(m.id) && !m.id.startsWith("temp-")
          );

          if (newMessages.length > 0) {
            markAsRead();
            return [...prev, ...newMessages];
          }
          return prev;
        });
      } catch {
        // Silent fail
      }
    };

    refreshMessages();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshTrigger]);

  // Mark as read
  const markAsRead = async () => {
    try {
      await api.patch(`/messages/conversations/${conversation.id}/read`);
    } catch (error) {
      console.error("Failed to mark as read:", error);
    }
  };

  // Send message
  const handleSend = async () => {
    if (!newMessage.trim() || sending) return;

    const content = newMessage.trim();
    setNewMessage("");
    setSending(true);

    // Optimistic update
    const tempId = `temp-${Date.now()}`;
    const optimisticMessage: Message = {
      id: tempId,
      content,
      type: "TEXT",
      senderId: currentUserId,
      sender: { id: currentUserId, name: "You" },
      conversationId: conversation.id,
      createdAt: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, optimisticMessage]);

    try {
      const response = await api.post(
        `/messages/conversations/${conversation.id}/messages`,
        { content, type: "TEXT" }
      );

      // Replace optimistic message with real one
      setMessages((prev) =>
        prev.map((msg) => (msg.id === tempId ? response.data : msg))
      );
    } catch (error) {
      console.error("Failed to send message:", error);
      // Remove optimistic message on error
      setMessages((prev) => prev.filter((msg) => msg.id !== tempId));
      setNewMessage(content); // Restore input
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  };

  // Handle Enter key
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Insert emoji
  const handleEmojiSelect = (emoji: string) => {
    setNewMessage((prev) => prev + emoji);
    setShowEmojiPicker(false);
    inputRef.current?.focus();
  };

  // Close emoji picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        emojiPickerRef.current &&
        !emojiPickerRef.current.contains(e.target as Node)
      ) {
        setShowEmojiPicker(false);
      }
    };

    if (showEmojiPicker) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showEmojiPicker]);

  // Upload image to Cloudinary
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      alert("请选择图片文件");
      return;
    }

    // Validate file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      alert("图片大小不能超过 10MB");
      return;
    }

    setUploadingImage(true);

    try {
      // Upload to Cloudinary
      const formData = new FormData();
      formData.append("file", file);
      formData.append("upload_preset", CLOUDINARY_CONFIG.uploadPreset);

      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUDINARY_CONFIG.cloudName}/image/upload`,
        { method: "POST", body: formData }
      );

      if (!response.ok) throw new Error("Upload failed");

      const data = await response.json();
      const imageUrl = data.secure_url;

      // Send image message
      await sendImageMessage(imageUrl);
    } catch (error) {
      console.error("Failed to upload image:", error);
      alert("图片上传失败，请重试");
    } finally {
      setUploadingImage(false);
      // Reset input
      if (imageInputRef.current) {
        imageInputRef.current.value = "";
      }
    }
  };

  // Send image message
  const sendImageMessage = async (imageUrl: string) => {
    const tempId = `temp-${Date.now()}`;
    const optimisticMessage: Message = {
      id: tempId,
      content: imageUrl,
      type: "IMAGE",
      senderId: currentUserId,
      sender: { id: currentUserId, name: "You" },
      conversationId: conversation.id,
      createdAt: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, optimisticMessage]);

    try {
      const response = await api.post(
        `/messages/conversations/${conversation.id}/messages`,
        { content: imageUrl, type: "IMAGE" }
      );

      setMessages((prev) =>
        prev.map((msg) => (msg.id === tempId ? response.data : msg))
      );
    } catch (error) {
      console.error("Failed to send image:", error);
      setMessages((prev) => prev.filter((msg) => msg.id !== tempId));
      alert("发送图片失败，请重试");
    }
  };

  // Load more messages
  const handleScroll = () => {
    const container = messagesContainerRef.current;
    if (!container || !hasMore || loading) return;

    if (container.scrollTop < 100) {
      fetchMessages(page + 1, true);
    }
  };

  // Format date for message groups
  const formatMessageDate = (dateStr: string) => {
    const date = new Date(dateStr);
    if (isToday(date)) return "今天";
    if (isYesterday(date)) return "昨天";
    return format(date, "yyyy年MM月dd日", { locale: zhCN });
  };

  // Group messages by date
  const groupedMessages = messages.reduce((groups, message) => {
    const date = formatMessageDate(message.createdAt);
    if (!groups[date]) groups[date] = [];
    groups[date].push(message);
    return groups;
  }, {} as Record<string, Message[]>);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-900">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b border-gray-200 dark:border-gray-700">
        {onBack && (
          <button
            onClick={onBack}
            className="p-2 -ml-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 md:hidden"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
        )}

        {/* Avatar */}
        {conversation.avatar || conversation.otherUser?.avatar ? (
          <img
            src={conversation.avatar || conversation.otherUser?.avatar}
            alt={conversation.name}
            className="w-10 h-10 rounded-full object-cover"
          />
        ) : (
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-semibold">
            {conversation.name?.charAt(0)?.toUpperCase() || "?"}
          </div>
        )}

        <div className="flex-1">
          <h3 className="font-medium text-gray-900 dark:text-white">
            {conversation.name}
          </h3>
          {conversation.type === "GROUP" && (
            <p className="text-xs text-gray-500">
              {conversation.members.length} 位成员
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <button className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500">
            <Phone className="w-5 h-5" />
          </button>
          <button className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500">
            <Video className="w-5 h-5" />
          </button>
          <button className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500">
            <Info className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div
        ref={messagesContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto p-4 space-y-4"
      >
        {hasMore && (
          <button
            onClick={() => fetchMessages(page + 1, true)}
            className="w-full text-center text-sm text-indigo-600 hover:underline"
          >
            加载更多消息
          </button>
        )}

        {Object.entries(groupedMessages).map(([date, msgs]) => (
          <div key={date}>
            <div className="flex items-center justify-center my-4">
              <span className="px-3 py-1 bg-gray-100 dark:bg-gray-800 rounded-full text-xs text-gray-500">
                {date}
              </span>
            </div>

            {msgs.map((message, index) => {
              const isOwn = message.senderId === currentUserId;
              const showAvatar =
                !isOwn &&
                (index === 0 || msgs[index - 1]?.senderId !== message.senderId);

              return (
                <div
                  key={message.id}
                  className={`flex items-end gap-2 ${
                    isOwn ? "flex-row-reverse" : ""
                  }`}
                >
                  {/* Avatar (for other users) */}
                  {!isOwn && (
                    <div className="w-8 flex-shrink-0">
                      {showAvatar &&
                        (message.sender.avatar ? (
                          <img
                            src={message.sender.avatar}
                            alt={message.sender.name}
                            className="w-8 h-8 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-sm font-semibold">
                            {message.sender.name?.charAt(0)?.toUpperCase() ||
                              "?"}
                          </div>
                        ))}
                    </div>
                  )}

                  {/* Message bubble */}
                  <div
                    className={`max-w-[70%] ${
                      isOwn
                        ? "bg-indigo-600 text-white rounded-2xl rounded-br-md"
                        : "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white rounded-2xl rounded-bl-md"
                    } px-4 py-2`}
                  >
                    {conversation.type === "GROUP" && !isOwn && showAvatar && (
                      <p className="text-xs font-medium text-indigo-600 dark:text-indigo-400 mb-1">
                        {message.sender.name}
                      </p>
                    )}
                    {message.type === "IMAGE" ? (
                      <img
                        src={message.content}
                        alt="Image"
                        className="max-w-full max-h-64 rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                        onClick={() => window.open(message.content, "_blank")}
                      />
                    ) : (
                      <p className="whitespace-pre-wrap break-words">
                        {message.content}
                      </p>
                    )}
                    <p
                      className={`text-xs mt-1 ${
                        isOwn ? "text-indigo-200" : "text-gray-400"
                      }`}
                    >
                      {format(new Date(message.createdAt), "HH:mm")}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        ))}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
        {/* Emoji Picker */}
        {showEmojiPicker && (
          <div
            ref={emojiPickerRef}
            className="absolute bottom-20 left-4 right-4 sm:left-auto sm:right-auto sm:w-80 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 p-3 z-50"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                表情
              </span>
              <button
                onClick={() => setShowEmojiPicker(false)}
                className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>
            <div className="grid grid-cols-8 gap-1 max-h-48 overflow-y-auto">
              {EMOJI_LIST.map((emoji, index) => (
                <button
                  key={index}
                  onClick={() => handleEmojiSelect(emoji)}
                  className="w-8 h-8 flex items-center justify-center text-xl hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="flex items-center gap-2">
          {/* Emoji Button */}
          <button
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            className={`p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors ${
              showEmojiPicker
                ? "text-indigo-600 bg-indigo-50 dark:bg-indigo-900/30"
                : "text-gray-500"
            }`}
          >
            <Smile className="w-5 h-5" />
          </button>

          {/* Image Upload Button */}
          <button
            onClick={() => imageInputRef.current?.click()}
            disabled={uploadingImage}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 disabled:opacity-50 transition-colors"
          >
            {uploadingImage ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <ImageIcon className="w-5 h-5" />
            )}
          </button>
          <input
            ref={imageInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            className="hidden"
          />

          <input
            ref={inputRef}
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="输入消息..."
            className="flex-1 px-4 py-2 rounded-full border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />

          <button
            onClick={handleSend}
            disabled={!newMessage.trim() || sending}
            className="p-2 rounded-full bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
