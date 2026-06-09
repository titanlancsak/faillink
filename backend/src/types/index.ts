export interface User {
  id: number
  username: string
  email: string
  password?: string
  bio?: string
  avatar_url?: string
  created_at: string
  updated_at: string
}

export interface Post {
  id: number
  user_id: number
  content: string
  created_at: string
  updated_at: string
  // Joined fields
  author?: Pick<User, 'id' | 'username' | 'avatar_url'>
  likes_count?: number
  comments_count?: number
  user_liked?: boolean
}

export interface Comment {
  id: number
  post_id: number
  user_id: number
  content: string
  created_at: string
  author?: Pick<User, 'id' | 'username' | 'avatar_url'>
}

export interface FriendRequest {
  id: number
  sender_id: number
  receiver_id: number
  status: 'pending' | 'accepted' | 'rejected'
  created_at: string
  updated_at: string
  sender?: Pick<User, 'id' | 'username' | 'avatar_url' | 'bio'>
  receiver?: Pick<User, 'id' | 'username' | 'avatar_url' | 'bio'>
}

export interface JwtPayload {
  userId: number
  username: string
  iat?: number
  exp?: number
}

// Express augmentation
declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload
    }
  }
}
