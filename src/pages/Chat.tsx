import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { api } from "../lib/api";
import type { Conversation } from "../types";
import ConversationList from "../components/ConversationList";
import ChatWindow from "../components/ChatWindow";
import NewChatModal from "../components/NewChatModal";
import { MessageSquare } from "lucide-react";
import { useUserNotifications } from "../hooks/usePusher";

export default function Chat() {
  const [searchParams, setSearchParams] = useSearchParams();

  const [selectedConversation, setSelectedConversation] =
    useState<Conversation | null>(null);
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string>("");
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [listRefreshTrigger, setListRefreshTrigger] = useState(0);

  // Get conversation ID from URL
  const conversationId = searchParams.get("id");

  // Get current user ID
  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const response = await api.get("/auth/me");
        setCurrentUserId(response.data.id);
      } catch (error) {
        console.error("Failed to fetch current user:", error);
      }
    };
    fetchCurrentUser();
  }, []);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Listen for new message notifications via Pusher
  const handleNewMessage = useCallback(
    (data: unknown) => {
      console.log("[Chat] handleNewMessage triggered, data:", data);
      const payload = data as { conversationId: string };

      // Always refresh conversation list on new message
      setListRefreshTrigger((prev) => prev + 1);

      // If the message is for the currently selected conversation, trigger chat window refresh
      if (
        selectedConversation &&
        payload.conversationId === selectedConversation.id
      ) {
        console.log(
          "[Chat] Message is for current conversation, triggering refresh"
        );
        setRefreshTrigger((prev) => prev + 1);
      }
    },
    [selectedConversation]
  );

  const handleNewConversation = useCallback(() => {
    console.log("[Chat] handleNewConversation triggered");
    setListRefreshTrigger((prev) => prev + 1);
  }, []);

  useUserNotifications(currentUserId, {
    onNewMessage: handleNewMessage,
    onNewConversation: handleNewConversation,
  });

  // Fetch conversation from URL param
  useEffect(() => {
    if (conversationId) {
      const fetchConversation = async () => {
        try {
          const response = await api.get(
            `/messages/conversations/${conversationId}`
          );
          setSelectedConversation(response.data);
        } catch (error) {
          console.error("Failed to fetch conversation:", error);
          setSearchParams({});
        }
      };
      fetchConversation();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationId]);

  const handleSelectConversation = (conversation: Conversation) => {
    setSelectedConversation(conversation);
    setSearchParams({ id: conversation.id });
  };

  const handleBack = () => {
    setSelectedConversation(null);
    setSearchParams({});
  };

  const handleCreatePrivate = async (userId: string) => {
    try {
      const response = await api.post("/messages/conversations/private", {
        userId,
      });
      handleSelectConversation(response.data);
    } catch (error) {
      console.error("Failed to create private conversation:", error);
    }
  };

  const handleCreateGroup = async (name: string, memberIds: string[]) => {
    try {
      const response = await api.post("/messages/conversations/group", {
        name,
        memberIds,
      });
      handleSelectConversation(response.data);
    } catch (error) {
      console.error("Failed to create group conversation:", error);
    }
  };

  // Mobile view: show only one panel at a time
  if (isMobile) {
    console.log(
      "[Chat] Mobile view, selectedConversation:",
      selectedConversation?.id,
      "currentUserId:",
      currentUserId
    );
    return (
      <div className="-mx-3 -mt-6 -mb-14 h-[calc(100vh-56px)] bg-white dark:bg-gray-900 relative">
        {selectedConversation && (
          <div className="absolute inset-0 z-20 bg-white dark:bg-gray-900">
            <ChatWindow
              key={selectedConversation.id}
              conversation={selectedConversation}
              currentUserId={currentUserId}
              onBack={handleBack}
              refreshTrigger={refreshTrigger}
            />
          </div>
        )}

        <div className={selectedConversation ? "hidden" : "block h-full"}>
          <ConversationList
            selectedId={conversationId || undefined}
            onSelect={handleSelectConversation}
            onNewChat={() => setShowNewChatModal(true)}
            refreshTrigger={listRefreshTrigger}
          />
        </div>

        <NewChatModal
          isOpen={showNewChatModal}
          onClose={() => setShowNewChatModal(false)}
          onCreatePrivate={handleCreatePrivate}
          onCreateGroup={handleCreateGroup}
          currentUserId={currentUserId}
        />
      </div>
    );
  }

  // Desktop view: side-by-side panels
  return (
    <div className="h-[calc(100vh-4rem)] flex bg-white dark:bg-gray-900 rounded-xl">
      {/* Conversation list sidebar */}
      <div className="w-80 border-r border-gray-200 dark:border-gray-700 shrink-0">
        <ConversationList
          selectedId={selectedConversation?.id}
          onSelect={handleSelectConversation}
          onNewChat={() => setShowNewChatModal(true)}
          refreshTrigger={listRefreshTrigger}
        />
      </div>

      {/* Chat window */}
      <div className="flex-1">
        {selectedConversation ? (
          <ChatWindow
            key={selectedConversation.id}
            conversation={selectedConversation}
            currentUserId={currentUserId}
            refreshTrigger={refreshTrigger}
          />
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-gray-400">
            <MessageSquare className="w-16 h-16 mb-4 opacity-50" />
            <p className="text-lg">选择一个会话开始聊天</p>
            <p className="text-sm">或者创建一个新的会话</p>
            <button
              onClick={() => setShowNewChatModal(true)}
              className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              新建会话
            </button>
          </div>
        )}
      </div>

      <NewChatModal
        isOpen={showNewChatModal}
        onClose={() => setShowNewChatModal(false)}
        onCreatePrivate={handleCreatePrivate}
        onCreateGroup={handleCreateGroup}
        currentUserId={currentUserId}
      />
    </div>
  );
}
