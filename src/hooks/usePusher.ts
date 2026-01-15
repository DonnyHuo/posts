import { useEffect, useRef, useCallback } from 'react';
import Pusher from 'pusher-js';

const PUSHER_KEY = import.meta.env.VITE_PUSHER_KEY || '';
const PUSHER_CLUSTER = import.meta.env.VITE_PUSHER_CLUSTER || 'ap3';

let pusherInstance: Pusher | null = null;

function getPusherInstance(): Pusher | null {
  if (!PUSHER_KEY) {
    console.warn('Pusher key not configured');
    return null;
  }

  if (!pusherInstance) {
    pusherInstance = new Pusher(PUSHER_KEY, {
      cluster: PUSHER_CLUSTER,
    });
  }

  return pusherInstance;
}

interface UsePusherOptions {
  channel: string;
  event: string;
  onMessage: (data: any) => void;
  enabled?: boolean;
}

export function usePusher({ channel, event, onMessage, enabled = true }: UsePusherOptions) {
  const callbackRef = useRef(onMessage);
  callbackRef.current = onMessage;

  useEffect(() => {
    if (!enabled) return;

    const pusher = getPusherInstance();
    if (!pusher) return;

    const channelInstance = pusher.subscribe(channel);

    const handler = (data: any) => {
      callbackRef.current(data);
    };

    channelInstance.bind(event, handler);

    return () => {
      channelInstance.unbind(event, handler);
      pusher.unsubscribe(channel);
    };
  }, [channel, event, enabled]);
}

export function useConversationChannel(
  conversationId: string | null,
  onNewMessage: (message: any) => void
) {
  usePusher({
    channel: `conversation-${conversationId}`,
    event: 'new-message',
    onMessage: onNewMessage,
    enabled: !!conversationId,
  });
}

export function useUserNotifications(
  userId: string | null,
  handlers: {
    onNewMessage?: (data: any) => void;
    onNewConversation?: (data: any) => void;
  }
) {
  usePusher({
    channel: `user-${userId}`,
    event: 'new-message-notification',
    onMessage: handlers.onNewMessage || (() => {}),
    enabled: !!userId && !!handlers.onNewMessage,
  });

  usePusher({
    channel: `user-${userId}`,
    event: 'new-conversation',
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

