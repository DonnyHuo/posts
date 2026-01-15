import { useEffect, useRef } from "react";
import Pusher from "pusher-js";

const PUSHER_KEY = import.meta.env.VITE_PUSHER_KEY || "";
const PUSHER_CLUSTER = import.meta.env.VITE_PUSHER_CLUSTER || "ap3";

let pusherInstance: Pusher | null = null;

function getPusherInstance(): Pusher | null {
  if (!PUSHER_KEY) {
    console.warn("Pusher key not configured");
    return null;
  }

  if (!pusherInstance) {
    pusherInstance = new Pusher(PUSHER_KEY, {
      cluster: PUSHER_CLUSTER,
    });

    // Debug: Log connection state changes
    pusherInstance.connection.bind(
      "state_change",
      (states: { current: string; previous: string }) => {
        console.log(
          `[Pusher] Connection state changed: ${states.previous} -> ${states.current}`
        );
      }
    );

    pusherInstance.connection.bind("error", (err: Error) => {
      console.error("[Pusher] Connection error:", err);
    });

    console.log(
      "[Pusher] Instance created, key:",
      PUSHER_KEY.substring(0, 8) + "..."
    );
  }

  return pusherInstance;
}

interface UsePusherOptions {
  channel: string;
  event: string;
  onMessage: (data: unknown) => void;
  enabled?: boolean;
}

// Track active subscriptions to prevent duplicate unsubscribe
// Map<channelName, count>
const channelSubscriptions = new Map<string, number>();
// Map<channelName, TimeoutID> - for debounced unsubscribe
const pendingUnsubscribes = new Map<string, ReturnType<typeof setTimeout>>();

export function usePusher({
  channel,
  event,
  onMessage,
  enabled = true,
}: UsePusherOptions) {
  const callbackRef = useRef(onMessage);

  // Update ref in effect to avoid render-phase updates
  useEffect(() => {
    callbackRef.current = onMessage;
  });

  useEffect(() => {
    if (!enabled) return;

    const pusher = getPusherInstance();
    if (!pusher) return;

    // Cancel pending unsubscribe if any (Debounce logic)
    if (pendingUnsubscribes.has(channel)) {
      clearTimeout(pendingUnsubscribes.get(channel));
      pendingUnsubscribes.delete(channel);
      console.log(`[Pusher] Cancelled pending unsubscribe for ${channel}`);
    }

    // Increment channel subscription count
    const currentCount = channelSubscriptions.get(channel) || 0;
    channelSubscriptions.set(channel, currentCount + 1);

    const channelInstance = pusher.subscribe(channel);
    console.log(
      `[Pusher] Subscribed to ${channel} (count: ${
        currentCount + 1
      }), event: ${event}`
    );

    const handler = (data: unknown) => {
      console.log(`[Pusher] Received event ${event} on ${channel}:`, data);
      callbackRef.current(data);
    };

    channelInstance.bind(event, handler);

    return () => {
      channelInstance.unbind(event, handler);

      // Decrement channel subscription count
      const count = channelSubscriptions.get(channel) || 1;
      const newCount = count - 1;
      channelSubscriptions.set(channel, newCount);

      if (newCount <= 0) {
        // Schedule unsubscribe instead of immediate execution
        console.log(`[Pusher] Scheduling unsubscribe for ${channel} in 5s...`);
        const timeout = setTimeout(() => {
          // Check count again in case of race condition
          if ((channelSubscriptions.get(channel) || 0) <= 0) {
            pusher.unsubscribe(channel);
            channelSubscriptions.delete(channel);
            pendingUnsubscribes.delete(channel);
            console.log(`[Pusher] Unsubscribed from ${channel} (executed)`);
          }
        }, 5000); // 5 seconds grace period

        pendingUnsubscribes.set(channel, timeout);
      } else {
        console.log(
          `[Pusher] Decremented subscription for ${channel} (remaining: ${newCount})`
        );
      }
    };
  }, [channel, event, enabled]);
}

export function useConversationChannel(
  conversationId: string | null,
  onNewMessage: (message: unknown) => void
) {
  usePusher({
    channel: `conversation-${conversationId}`,
    event: "new-message",
    onMessage: onNewMessage,
    enabled: !!conversationId,
  });
}

export function useUserNotifications(
  userId: string | null,
  handlers: {
    onNewMessage?: (data: unknown) => void;
    onNewConversation?: (data: unknown) => void;
  }
) {
  console.log(
    "[useUserNotifications] userId:",
    userId,
    "handlers:",
    !!handlers.onNewMessage,
    !!handlers.onNewConversation
  );

  usePusher({
    channel: `user-${userId}`,
    event: "new-message-notification",
    onMessage: handlers.onNewMessage || (() => {}),
    enabled: !!userId && !!handlers.onNewMessage,
  });

  usePusher({
    channel: `user-${userId}`,
    event: "new-conversation",
    onMessage: handlers.onNewConversation || (() => {}),
    enabled: !!userId && !!handlers.onNewConversation,
  });
}

export function disconnectPusher() {
  if (pusherInstance) {
    pusherInstance.disconnect();
    pusherInstance = null;
  }
}
