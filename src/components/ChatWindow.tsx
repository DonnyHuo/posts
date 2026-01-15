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
} from "lucide-react";

interface ChatWindowProps {
  conversation: Conversation;
  currentUserId: string;
  onBack?: () => void;
}

export default function ChatWindow({
  conversation,
  currentUserId,
  onBack,
}: ChatWindowProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [newMessage, setNewMessage] = useState("");
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

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
    setLoading(true);
    setMessages([]);
    setPage(1);
    setHasMore(true);
    fetchMessages(1);
    markAsRead();
  }, [conversation.id]);

  // Scroll to bottom on new message
  useEffect(() => {
    if (!loading) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, loading]);

  // Real-time message updates via Pusher
  useConversationChannel(conversation.id, (newMsg) => {
    if (newMsg.senderId !== currentUserId) {
      setMessages((prev) => [
        ...prev,
        {
          ...newMsg,
          sender: {
            id: newMsg.senderId,
            name: newMsg.senderName,
            avatar: newMsg.senderAvatar,
          },
        },
      ]);
      markAsRead();
    }
  });

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
                        className="max-w-full rounded-lg"
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
        <div className="flex items-center gap-2">
          <button className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500">
            <Smile className="w-5 h-5" />
          </button>
          <button className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500">
            <ImageIcon className="w-5 h-5" />
          </button>

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
