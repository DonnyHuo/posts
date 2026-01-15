import { useEffect, useState } from "react";
import { api } from "../lib/api";
import type { Conversation } from "../types";
import { formatDistanceToNow } from "date-fns";
import { zhCN } from "date-fns/locale";
import { MessageSquare, Users, Search, Plus } from "lucide-react";

interface ConversationListProps {
  selectedId?: string;
  onSelect: (conversation: Conversation) => void;
  onNewChat: () => void;
}

export default function ConversationList({
  selectedId,
  onSelect,
  onNewChat,
}: ConversationListProps) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const fetchConversations = async () => {
    try {
      const response = await api.get("/messages/conversations");
      setConversations(response.data);
    } catch (error) {
      console.error("Failed to fetch conversations:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConversations();
    // Poll for updates every 30 seconds
    const interval = setInterval(fetchConversations, 30000);
    return () => clearInterval(interval);
  }, []);

  const filteredConversations = conversations.filter((conv) => {
    if (!searchQuery) return true;
    const name = conv.name?.toLowerCase() || "";
    return name.includes(searchQuery.toLowerCase());
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            消息
          </h2>
          <button
            onClick={onNewChat}
            className="p-2 rounded-full bg-indigo-600 text-white hover:bg-indigo-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="搜索会话..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Conversation List */}
      <div className="flex-1 overflow-y-auto">
        {filteredConversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-gray-500">
            <MessageSquare className="w-12 h-12 mb-4 opacity-50" />
            <p>暂无消息</p>
            <button
              onClick={onNewChat}
              className="mt-4 text-indigo-600 hover:underline"
            >
              开始新的对话
            </button>
          </div>
        ) : (
          filteredConversations.map((conversation) => (
            <div
              key={conversation.id}
              onClick={() => onSelect(conversation)}
              className={`flex items-center gap-3 p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors ${
                selectedId === conversation.id
                  ? "bg-indigo-50 dark:bg-indigo-900/20 border-l-4 border-indigo-600"
                  : ""
              }`}
            >
              {/* Avatar */}
              <div className="relative flex-shrink-0">
                {conversation.avatar || conversation.otherUser?.avatar ? (
                  <img
                    src={conversation.avatar || conversation.otherUser?.avatar}
                    alt={conversation.name}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-semibold">
                    {conversation.type === "GROUP" ? (
                      <Users className="w-6 h-6" />
                    ) : (
                      conversation.name?.charAt(0)?.toUpperCase() || "?"
                    )}
                  </div>
                )}
                {(conversation.unreadCount ?? 0) > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                    {conversation.unreadCount! > 99
                      ? "99+"
                      : conversation.unreadCount}
                  </span>
                )}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium text-gray-900 dark:text-white truncate">
                    {conversation.name || "未命名会话"}
                  </h3>
                  {conversation.lastMessage && (
                    <span className="text-xs text-gray-500 flex-shrink-0">
                      {formatDistanceToNow(
                        new Date(conversation.lastMessage.createdAt),
                        {
                          addSuffix: true,
                          locale: zhCN,
                        }
                      )}
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                  {conversation.lastMessage ? (
                    <>
                      {conversation.type === "GROUP" &&
                        conversation.lastMessage.sender && (
                          <span className="font-medium">
                            {conversation.lastMessage.sender.name}:{" "}
                          </span>
                        )}
                      {conversation.lastMessage.type === "IMAGE"
                        ? "[图片]"
                        : conversation.lastMessage.content}
                    </>
                  ) : (
                    "暂无消息"
                  )}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
