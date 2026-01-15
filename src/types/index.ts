export interface User {
  id: string;
  email: string;
  name: string;
  role: "USER" | "ADMIN";
  avatar?: string;
  bio?: string;
  createdAt: string;
}

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  bio?: string;
  createdAt: string;
  isFollowing?: boolean;
  postsCount: number;
  followersCount: number;
  followingCount: number;
  likesReceived?: number;
  favoritesReceived?: number;
}

export interface UserStats {
  likesReceived: number;
  favoritesReceived: number;
  postsCount: number;
  followersCount: number;
  followingCount: number;
  commentsReceived: number;
}

export interface FollowUser {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  bio?: string;
}

export interface Comment {
  id: string;
  content: string;
  authorId: string;
  author?: User;
  postId: string;
  createdAt: string;
}

export interface Post {
  id: string;
  title: string;
  content: string;
  coverUrls?: string[];
  published: boolean;
  authorId: string;
  author?: User;
  createdAt: string;
  updatedAt: string;
  _count?: {
    comments: number;
    likes: number;
    favorites: number;
  };
  isLiked?: boolean;
  isFavorited?: boolean;
}

export interface CreatePostDto {
  title: string;
  content?: string;
  published?: boolean;
  coverUrls?: string[];
}

export interface UpdatePostDto {
  title?: string;
  content?: string;
  published?: boolean;
  coverUrls?: string[];
}

// ==================== Chat Types ====================

export type ConversationType = 'PRIVATE' | 'GROUP';
export type MessageType = 'TEXT' | 'IMAGE' | 'SYSTEM';
export type MemberRole = 'OWNER' | 'ADMIN' | 'MEMBER';

export interface ConversationMember {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role?: MemberRole;
}

export interface Message {
  id: string;
  content: string;
  type: MessageType;
  senderId: string;
  sender: {
    id: string;
    name: string;
    avatar?: string;
  };
  conversationId: string;
  createdAt: string;
}

export interface Conversation {
  id: string;
  type: ConversationType;
  name: string;
  avatar?: string;
  members: ConversationMember[];
  otherUser?: ConversationMember; // For private chats
  lastMessage?: Message;
  myRole?: MemberRole;
  ownerId?: string;
  unreadCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePrivateConversationDto {
  userId: string;
}

export interface CreateGroupConversationDto {
  name: string;
  avatar?: string;
  memberIds: string[];
}

export interface SendMessageDto {
  content: string;
  type?: MessageType;
}
