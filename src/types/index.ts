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
