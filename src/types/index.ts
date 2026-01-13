export interface User {
  id: string;
  email: string;
  name: string;
  role: 'USER' | 'ADMIN';
  avatar?: string;
  createdAt: string;
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
  published: boolean;
  authorId: string;
  author?: User;
  createdAt: string;
  updatedAt: string;
  _count?: {
    comments: number;
  };
}

export interface CreatePostDto {
  title: string;
  content?: string;
  published?: boolean;
}

export interface UpdatePostDto {
  title?: string;
  content?: string;
  published?: boolean;
}
